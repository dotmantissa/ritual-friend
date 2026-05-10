import { createFileRoute } from "@tanstack/react-router";
import { getPairingByWallet } from "@/lib/pairings";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/members/assignment/$wallet")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ params }) => {
        const pairing = getPairingByWallet(params.wallet);
        if (!pairing) {
          return new Response(JSON.stringify({ assigned: false }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        return new Response(
          JSON.stringify({
            username: pairing.assignedUsername,
            avatar_url: pairing.assignedAvatarUrl,
            quote: pairing.quote,
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      },
    },
  },
});
