import { createFileRoute } from "@tanstack/react-router";
import { keccak256, toBytes } from "viem";
import { QUOTES } from "@/lib/quotes";
import { FRIEND_ZONE_ABI, FRIEND_ZONE_ADDRESS } from "@/lib/constants";
import { friendRevealedEvent, friendZonePublicClient } from "@/lib/friendzone-chain";
import { getMemberPool } from "@/lib/pool";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@+/, "").toLowerCase();
}

export const Route = createFileRoute("/api/members/check/$username")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ params }) => {
        try {
          const username = normalizeUsername(params.username);
          if (!username) {
            return new Response(JSON.stringify({ error: "invalid_username" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          const usernameHash = keccak256(toBytes(username.toLowerCase().trim()));
          const allMembers = getMemberPool().sort((a, b) => a.username.localeCompare(b.username));

          const wasSeeker = await friendZonePublicClient.readContract({
            address: FRIEND_ZONE_ADDRESS,
            abi: FRIEND_ZONE_ABI,
            functionName: "isUsernameClaimed",
            args: [usernameHash],
          });
          console.log("checking username:", username);
          console.log("computed hash:", usernameHash);
          console.log("contract returned:", wasSeeker);

          if (wasSeeker) {
            const events = await friendZonePublicClient.getLogs({
              address: FRIEND_ZONE_ADDRESS,
              event: friendRevealedEvent,
              fromBlock: 0n,
            });
            const asSeeker = events.find((event) => event.args.seekerUsernameHash?.toLowerCase() === usernameHash.toLowerCase());
            if (asSeeker) {
              const friendIndex = Number(asSeeker.args.friendIndex ?? 0n);
              const assigned = allMembers[friendIndex % allMembers.length];
              if (!assigned) {
                return new Response(JSON.stringify({ status: "already_paired", friend: null }), {
                  headers: { "Content-Type": "application/json", ...corsHeaders },
                });
              }
              return new Response(
                JSON.stringify({
                  status: "already_paired",
                  friend: {
                    username: assigned.username,
                    avatar_url: assigned.avatar_url ?? "",
                    quote: QUOTES[friendIndex % QUOTES.length],
                  },
                }),
                { headers: { "Content-Type": "application/json", ...corsHeaders } }
              );
            }
            return new Response(JSON.stringify({ status: "already_paired", friend: null }), {
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const poolIndex = allMembers.findIndex((m) => m.username.toLowerCase() === username.toLowerCase().trim());
          if (poolIndex !== -1) {
            const wasAssigned = await friendZonePublicClient.readContract({
              address: FRIEND_ZONE_ADDRESS,
              abi: FRIEND_ZONE_ABI,
              functionName: "isIndexClaimed",
              args: [BigInt(poolIndex)],
            });
            if (wasAssigned) {
              const events = await friendZonePublicClient.getLogs({
                address: FRIEND_ZONE_ADDRESS,
                event: friendRevealedEvent,
                fromBlock: 0n,
              });
              const matchingEvent = events.find((event) => Number(event.args.friendIndex ?? 0n) === poolIndex);
              if (matchingEvent) {
                const seekerWallet = matchingEvent.args.wallet as `0x${string}` | undefined;
                let seekerUsername: string | null = null;
                let seekerAvatar: string | null = null;
                if (seekerWallet) {
                  const seekerHash = (await friendZonePublicClient.readContract({
                    address: FRIEND_ZONE_ADDRESS,
                    abi: FRIEND_ZONE_ABI,
                    functionName: "walletToUsernameHash",
                    args: [seekerWallet],
                  })) as `0x${string}`;
                  const seekerMember = allMembers.find((member) => keccak256(toBytes(member.username.toLowerCase().trim())) === seekerHash);
                  seekerUsername = seekerMember?.username ?? null;
                  seekerAvatar = seekerMember?.avatar_url ?? null;
                }
                return new Response(
                  JSON.stringify({
                    status: "already_paired",
                    friend: seekerUsername
                      ? {
                          username: seekerUsername,
                          avatar_url: seekerAvatar,
                          quote: QUOTES[poolIndex % QUOTES.length],
                        }
                      : null,
                    message: "Someone already found you! You're paired.",
                  }),
                  { headers: { "Content-Type": "application/json", ...corsHeaders } }
                );
              }
              return new Response(JSON.stringify({ status: "already_paired", friend: null }), {
                headers: { "Content-Type": "application/json", ...corsHeaders },
              });
            }
          }

          return new Response(JSON.stringify({ status: "fresh" }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch {
          return new Response(JSON.stringify({ status: "fresh" }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      },
    },
  },
});
