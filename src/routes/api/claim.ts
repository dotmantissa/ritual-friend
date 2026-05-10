import { createFileRoute } from "@tanstack/react-router";
import { FRIENDSHIP_QUOTES } from "@/lib/quotes";
import { getMemberByIndex } from "@/lib/pool";
import {
  getPairingByWallet,
  getPairingBySeekerUsername,
  isUsernameSeeker,
  savePairing,
} from "@/lib/pairings";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let lock = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => (release = resolve));
  const prev = lock;
  lock = prev.then(() => pending);
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@+/, "").toLowerCase();
}

function randomQuote(): string {
  return FRIENDSHIP_QUOTES[Math.floor(Math.random() * FRIENDSHIP_QUOTES.length)] ?? "A Ritual friend is a rare block reward.";
}

export const Route = createFileRoute("/api/claim")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            wallet?: string;
            seekerUsername?: string;
            friendIndex?: number;
          };

          const wallet = body.wallet?.trim() ?? "";
          const seekerUsername = normalizeUsername(body.seekerUsername ?? "");
          const friendIndex = body.friendIndex;

          if (!wallet || !seekerUsername || !Number.isInteger(friendIndex) || (friendIndex ?? -1) < 0) {
            return new Response(JSON.stringify({ error: "invalid_payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const result = await withLock(async () => {
            const byWallet = getPairingByWallet(wallet);
            if (byWallet) {
              throw new Error("wallet_already_paired");
            }

            if (isUsernameSeeker(seekerUsername) || getPairingBySeekerUsername(seekerUsername)) {
              throw new Error("username_already_seeker");
            }

            const member = getMemberByIndex(friendIndex!);
            if (!member) {
              throw new Error("pool_shifted");
            }

            const entry = savePairing(wallet, seekerUsername, member, randomQuote());

            return {
              username: entry.assignedUsername,
              avatar_url: entry.assignedAvatarUrl,
              quote: entry.quote,
            };
          });

          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (err: any) {
          const code = err?.message;
          if (code === "wallet_already_paired" || code === "username_already_seeker" || code === "pool_shifted") {
            return new Response(JSON.stringify({ error: code }), {
              status: 409,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          return new Response(JSON.stringify({ error: "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      },
    },
  },
});
