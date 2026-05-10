import { createFileRoute } from "@tanstack/react-router";
import { getMemberByUsername } from "@/lib/pool";
import { getPairingByAssignedUsername, getPairingBySeekerUsername } from "@/lib/pairings";

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

        const assigned = getPairingByAssignedUsername(username);
        if (assigned) {
          return new Response(
            JSON.stringify({
              status: "assigned_to_seeker",
              seekerUsername: assigned.pairing.seekerUsername,
              assignedFriend: {
                username: assigned.pairing.assignedUsername,
                avatar_url: assigned.pairing.assignedAvatarUrl || getMemberByUsername(assigned.pairing.assignedUsername)?.avatar_url || "",
                quote: assigned.pairing.quote,
              },
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const seeker = getPairingBySeekerUsername(username);
        if (seeker) {
          return new Response(
            JSON.stringify({
              status: "already_paired",
              assignedFriend: {
                username: seeker.assignedUsername,
                avatar_url: seeker.assignedAvatarUrl || getMemberByUsername(seeker.assignedUsername)?.avatar_url || "",
                quote: seeker.quote,
              },
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(JSON.stringify({ status: "fresh" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
