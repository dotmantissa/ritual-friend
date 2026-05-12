import { createFileRoute } from "@tanstack/react-router";
import { getMemberPool } from "@/lib/pool";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/members/available")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async () =>
        new Response(JSON.stringify({ count: getMemberPool().length }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }),
    },
  },
});
