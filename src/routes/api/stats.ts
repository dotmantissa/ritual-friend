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
        const stats = await readFriendZoneStats(getMemberPool().length);
        return new Response(JSON.stringify(stats), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
