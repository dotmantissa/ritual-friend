import { createFileRoute } from "@tanstack/react-router";
import { totalPairings } from "@/lib/pairings";
import { getAvailableCount } from "@/lib/pool";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async () =>
        new Response(
          JSON.stringify({
            totalPairings: totalPairings(),
            availableCount: getAvailableCount(),
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        ),
    },
  },
});
