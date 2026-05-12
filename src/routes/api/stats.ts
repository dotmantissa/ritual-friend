import { createFileRoute } from "@tanstack/react-router";
import { readFriendZoneStats } from "@/lib/friendzone-chain";
import { getMemberPool } from "@/lib/pool";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async () => {
        let stats = { totalPairings: 0, availableCount: 0 };
        try {
          stats = await readFriendZoneStats(getMemberPool().length);
        } catch {
          stats = { totalPairings: 0, availableCount: 0 };
        }
        return new Response(JSON.stringify(stats), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
