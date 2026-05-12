import { createFileRoute } from "@tanstack/react-router";
import { QUOTES } from "@/lib/quotes";
import { FRIEND_ZONE_ABI, FRIEND_ZONE_ADDRESS } from "@/lib/constants";
import { friendRevealedEvent, friendZonePublicClient } from "@/lib/friendzone-chain";
import { getMemberByUsername } from "@/lib/pool";

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
        const username = normalizeUsername(params.username);
        if (!username) {
          return new Response(JSON.stringify({ error: "invalid_username" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const claimed = await friendZonePublicClient.readContract({
          address: FRIEND_ZONE_ADDRESS,
          abi: FRIEND_ZONE_ABI,
          functionName: "isUsernameClaimed",
          args: [username],
        });
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

        const asSeeker = events.find((event) => event.args.seekerUsername?.toLowerCase() === lower);
        if (asSeeker) {
          const assignedUsername = asSeeker.args.assignedUsername ?? "";
          const member = getMemberByUsername(assignedUsername);
          const friendIndex = Number(asSeeker.args.friendIndex ?? 0n);
          return new Response(
            JSON.stringify({
              status: "already_paired",
              friend: {
                username: assignedUsername,
                avatar_url: member?.avatar_url ?? "",
                quote: QUOTES[friendIndex % QUOTES.length],
              },
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const asAssigned = events.find((event) => event.args.assignedUsername?.toLowerCase() === lower);
        if (asAssigned) {
          const assignedUsername = asAssigned.args.assignedUsername ?? "";
          const member = getMemberByUsername(assignedUsername);
          const friendIndex = Number(asAssigned.args.friendIndex ?? 0n);
          return new Response(
            JSON.stringify({
              status: "assigned_to_seeker",
              seekerUsername: asAssigned.args.seekerUsername ?? "",
              friend: {
                username: assignedUsername,
                avatar_url: member?.avatar_url ?? "",
                quote: QUOTES[friendIndex % QUOTES.length],
              },
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(JSON.stringify({ status: "fresh" }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
      },
    },
  },
});
