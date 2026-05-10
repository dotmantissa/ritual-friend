import { createFileRoute } from "@tanstack/react-router";
import { getAvailableCount } from "@/lib/pool";
import { totalPairings } from "@/lib/pairings";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/members/available")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async () => {
        return new Response(JSON.stringify({ count: getAvailableCount(), totalPairings: totalPairings() }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
