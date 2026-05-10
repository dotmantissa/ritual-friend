import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface PairingEntry {
  seekerUsername: string;
  assignedUsername: string;
  assignedAvatarUrl: string;
  quote: string;
  timestamp: number;
}

export interface PairingsData {
  byWallet: Record<string, PairingEntry>;
  claimedUsernames: string[];
  claimedAsSeeker: string[];
}

const PAIRINGS_PATH = process.env.VERCEL
  ? "/tmp/pairings.json"
  : path.resolve(process.cwd(), "pairings.json");

const state: PairingsData = {
  byWallet: {},
  claimedUsernames: [],
  claimedAsSeeker: [],
};

load();

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@+/, "").toLowerCase();
}

function normalizeWallet(wallet: string): string {
  return wallet.trim().toLowerCase();
}

function persist() {
  const tmp = `${PAIRINGS_PATH}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(state, null, 2));
    renameSync(tmp, PAIRINGS_PATH);
  } catch (error) {
    console.warn("[pairings] persist failed", error);
  }
}

function load() {
  if (!existsSync(PAIRINGS_PATH)) return;
  try {
    const raw = JSON.parse(readFileSync(PAIRINGS_PATH, "utf8")) as Partial<PairingsData>;
    if (raw.byWallet && typeof raw.byWallet === "object") state.byWallet = raw.byWallet as Record<string, PairingEntry>;
    if (Array.isArray(raw.claimedUsernames)) state.claimedUsernames = raw.claimedUsernames.map(normalizeUsername);
    if (Array.isArray(raw.claimedAsSeeker)) state.claimedAsSeeker = raw.claimedAsSeeker.map(normalizeUsername);
  } catch (error) {
    console.warn("[pairings] load failed", error);
  }
}

export function getPairingByWallet(wallet: string): PairingEntry | null {
  return state.byWallet[normalizeWallet(wallet)] ?? null;
}

export function getPairingBySeekerUsername(username: string): PairingEntry | null {
  const seeker = normalizeUsername(username);
  return Object.values(state.byWallet).find((entry) => normalizeUsername(entry.seekerUsername) === seeker) ?? null;
}

export function getPairingByAssignedUsername(username: string): { wallet: string; pairing: PairingEntry } | null {
  const target = normalizeUsername(username);
  for (const [wallet, pairing] of Object.entries(state.byWallet)) {
    if (normalizeUsername(pairing.assignedUsername) === target) {
      return { wallet, pairing };
    }
  }
  return null;
}

export function savePairing(wallet: string, seekerUsername: string, assigned: { username: string; avatar_url: string }, quote: string): PairingEntry {
  const normalizedWallet = normalizeWallet(wallet);
  const normalizedSeeker = normalizeUsername(seekerUsername);
  const normalizedAssigned = normalizeUsername(assigned.username);

  const entry: PairingEntry = {
    seekerUsername: normalizedSeeker,
    assignedUsername: normalizedAssigned,
    assignedAvatarUrl: assigned.avatar_url,
    quote,
    timestamp: Date.now(),
  };

  state.byWallet[normalizedWallet] = entry;

  if (!state.claimedAsSeeker.includes(normalizedSeeker)) {
    state.claimedAsSeeker.push(normalizedSeeker);
  }

  if (!state.claimedUsernames.includes(normalizedSeeker)) {
    state.claimedUsernames.push(normalizedSeeker);
  }

  if (!state.claimedUsernames.includes(normalizedAssigned)) {
    state.claimedUsernames.push(normalizedAssigned);
  }

  persist();
  return entry;
}

export function isUsernameClaimed(username: string): boolean {
  return state.claimedUsernames.includes(normalizeUsername(username));
}

export function isUsernameSeeker(username: string): boolean {
  return state.claimedAsSeeker.includes(normalizeUsername(username));
}

export function claimedUsernamesSet(): Set<string> {
  return new Set(state.claimedUsernames);
}

export function totalPairings(): number {
  return Object.keys(state.byWallet).length;
}

export function exportAll(): PairingsData {
  return {
    byWallet: state.byWallet,
    claimedUsernames: [...state.claimedUsernames],
    claimedAsSeeker: [...state.claimedAsSeeker],
  };
}

