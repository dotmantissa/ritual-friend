import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import membersJson from "@/ritual_members.json";

export interface PoolMember {
  username: string;
  avatar_url: string;
}

interface PairingsFile {
  paired: Record<string, string>;
  claimed_by_username: string[];
}

const PAIRINGS_PATH = process.env.VERCEL
  ? "/tmp/pairings.json"
  : path.resolve(process.cwd(), "pairings.json");

const members = loadMembers();
const membersByUsername = new Map<string, PoolMember>(members.map((m) => [m.username, m]));
const paired = new Map<string, string>();
const claimed = new Set<string>();

loadPairings();

function normalizeWallet(wallet: string): string {
  return wallet.trim().toLowerCase();
}

function loadMembers(): PoolMember[] {
  const raw = membersJson;
  if (!Array.isArray(raw)) {
    throw new Error("ritual_members.json must be an array");
  }

  const seen = new Set<string>();
  const parsed: PoolMember[] = [];

  for (const row of raw) {
    if (!row || typeof row.username !== "string" || typeof row.avatar_url !== "string") continue;
    const username = row.username.trim();
    const avatar_url = row.avatar_url.trim();
    if (!username || !avatar_url || seen.has(username)) continue;
    seen.add(username);
    parsed.push({ username, avatar_url });
  }

  parsed.sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: "base" }));
  return parsed;
}

function persistPairings() {
  const payload: PairingsFile = {
    paired: Object.fromEntries(paired.entries()),
    claimed_by_username: Array.from(claimed.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    ),
  };

  const tmp = `${PAIRINGS_PATH}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(payload, null, 2));
    renameSync(tmp, PAIRINGS_PATH);
  } catch (error) {
    // On some serverless environments persistence may not be writable.
    console.warn("[pool] could not persist pairings to disk", error);
  }
}

function loadPairings() {
  if (!existsSync(PAIRINGS_PATH)) {
    return;
  }
  let raw: PairingsFile;
  try {
    raw = JSON.parse(readFileSync(PAIRINGS_PATH, "utf8")) as PairingsFile;
  } catch (error) {
    console.warn("[pool] could not read pairings file; starting with empty state", error);
    return;
  }

  if (raw?.paired && typeof raw.paired === "object") {
    for (const [wallet, username] of Object.entries(raw.paired)) {
      if (!membersByUsername.has(username)) continue;
      paired.set(normalizeWallet(wallet), username);
      claimed.add(username);
    }
  }

  if (Array.isArray(raw?.claimed_by_username)) {
    for (const username of raw.claimed_by_username) {
      if (membersByUsername.has(username)) claimed.add(username);
    }
  }
}

let claimLock = Promise.resolve();

async function withClaimLock<T>(fn: () => T | Promise<T>): Promise<T> {
  let release: () => void = () => {};
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });

  const prev = claimLock;
  claimLock = prev.then(() => next);

  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

export function getAvailableMembers(): PoolMember[] {
  return members.filter((m) => !claimed.has(m.username));
}

export function isWalletPaired(wallet: string): boolean {
  return paired.has(normalizeWallet(wallet));
}

export function getWalletAssignment(wallet: string): PoolMember | null {
  const username = paired.get(normalizeWallet(wallet));
  if (!username) return null;
  return membersByUsername.get(username) ?? null;
}

export function claimMember(wallet: string, username: string): PoolMember {
  const normalizedWallet = normalizeWallet(wallet);
  if (paired.has(normalizedWallet)) throw new Error("wallet_already_paired");
  if (claimed.has(username)) throw new Error("member_already_claimed");

  const member = membersByUsername.get(username);
  if (!member) throw new Error("member_not_found");

  claimed.add(username);
  paired.set(normalizedWallet, username);
  persistPairings();
  return member;
}

export async function claimByAvailableIndex(wallet: string, friendIndex: number): Promise<PoolMember> {
  return withClaimLock(async () => {
    if (isWalletPaired(wallet)) throw new Error("wallet_already_paired");

    const available = getAvailableMembers();
    if (friendIndex < 0 || friendIndex >= available.length) throw new Error("pool_shifted");

    const member = available[friendIndex];
    if (!member || claimed.has(member.username)) throw new Error("member_already_claimed");

    return claimMember(wallet, member.username);
  });
}

export function exportPairings(): PairingsFile {
  return {
    paired: Object.fromEntries(paired.entries()),
    claimed_by_username: Array.from(claimed.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    ),
  };
}
