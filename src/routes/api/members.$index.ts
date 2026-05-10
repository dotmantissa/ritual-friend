import { createFileRoute } from "@tanstack/react-router";
import { getMemberByIndex } from "@/lib/discord.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/members/$index")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ params }) => {
        const idx = parseInt(params.index, 10);
        if (isNaN(idx) || idx < 0) {
          return new Response(JSON.stringify({ error: "invalid_index" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        const { member, total } = await getMemberByIndex(idx);
        if (!member) {
          return new Response(JSON.stringify({ error: "out_of_range", total }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        return new Response(JSON.stringify({ ...member, total }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
