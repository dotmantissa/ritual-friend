import { createFileRoute } from "@tanstack/react-router";
import { exportAll } from "@/lib/pairings";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/pairings/export")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async () => {
        return new Response(JSON.stringify(exportAll(), null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": "attachment; filename=pairings.export.json",
            ...corsHeaders,
          },
        });
      },
    },
  },
});
