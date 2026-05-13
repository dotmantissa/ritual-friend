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

          const claimed = await friendZonePublicClient.readContract({
            address: FRIEND_ZONE_ADDRESS,
            abi: FRIEND_ZONE_ABI,
            functionName: "isUsernameClaimed",
            args: [usernameHash],
          });
          console.log("checking username:", username);
          console.log("computed hash:", usernameHash);
          console.log("contract returned:", claimed);
          if (!claimed) {
            return new Response(JSON.stringify({ status: "fresh" }), {
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const events = await friendZonePublicClient.getLogs({
            address: FRIEND_ZONE_ADDRESS,
            event: friendRevealedEvent,
            fromBlock: 0n,
          });
          const lower = username.toLowerCase();
          const members = getMemberPool().sort((a, b) => a.username.localeCompare(b.username));

          const asSeeker = events.find((event) => event.args.seekerUsernameHash?.toLowerCase() === usernameHash.toLowerCase());
          if (asSeeker) {
            const friendIndex = Number(asSeeker.args.friendIndex ?? 0n);
            const assigned = members[friendIndex % members.length];
            if (!assigned) {
              return new Response(JSON.stringify({ status: "fresh" }), {
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

          const asAssigned = events.find((event) => {
            const friendIndex = Number(event.args.friendIndex ?? 0n);
            const assigned = members[friendIndex % members.length];
            return assigned?.username.toLowerCase() === lower;
          });
          if (asAssigned) {
            const friendIndex = Number(asAssigned.args.friendIndex ?? 0n);
            const assigned = members[friendIndex % members.length];
            if (!assigned) {
              return new Response(JSON.stringify({ status: "fresh" }), {
                headers: { "Content-Type": "application/json", ...corsHeaders },
              });
            }
            return new Response(
              JSON.stringify({
                status: "assigned_to_seeker",
                seekerUsername: asAssigned.args.seekerUsername ?? "",
                friend: {
                  username: assigned.username,
                  avatar_url: assigned.avatar_url ?? "",
                  quote: QUOTES[friendIndex % QUOTES.length],
                },
              }),
              { headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
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
