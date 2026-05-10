import { createFileRoute } from "@tanstack/react-router";
import { getWalletAssignment } from "@/lib/pool";

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
        const assignment = getWalletAssignment(params.wallet);
        if (!assignment) {
          return new Response(JSON.stringify({ assigned: false }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        return new Response(JSON.stringify(assignment), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
