import membersJson from "@/ritual_members.json";
import { claimedUsernamesSet } from "@/lib/pairings";

export interface PoolMember {
  username: string;
  avatar_url: string;
}

const members = loadMembers();
const byUsername = new Map<string, PoolMember>();
for (const member of members) {
  byUsername.set(member.username, member);
}

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@+/, "").toLowerCase();
}

function loadMembers(): PoolMember[] {
  if (!Array.isArray(membersJson)) throw new Error("ritual_members.json must be an array");

  const parsed: PoolMember[] = [];
  const seen = new Set<string>();

  for (const row of membersJson) {
    if (!row || typeof row.username !== "string" || typeof row.avatar_url !== "string") continue;
    const username = normalizeUsername(row.username);
    const avatar_url = row.avatar_url.trim();
    if (!username || !avatar_url || seen.has(username)) continue;
    seen.add(username);
    parsed.push({ username, avatar_url });
  }

  parsed.sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: "base" }));
  return parsed;
}

export function getMemberByUsername(username: string): PoolMember | null {
  return byUsername.get(normalizeUsername(username)) ?? null;
}

export function getAvailablePool(): PoolMember[] {
  const claimed = claimedUsernamesSet();
  return members.filter((member) => !claimed.has(member.username));
}

export function getAvailableCount(): number {
  return getAvailablePool().length;
}

export function getMemberByIndex(index: number): PoolMember | null {
  const pool = getAvailablePool();
  return pool[index] ?? null;
}

export function isKnownMember(username: string): boolean {
  return byUsername.has(normalizeUsername(username));
}

