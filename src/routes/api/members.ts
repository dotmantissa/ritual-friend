import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/members")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async () =>
        new Response(
          JSON.stringify({
            message: "Use /api/members/available or /api/members/assignment/:wallet",
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        ),
    },
  },
});
