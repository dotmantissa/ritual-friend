import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/proxy/avatar")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) => {
        try {
          const reqUrl = new URL(request.url);
          const target = reqUrl.searchParams.get("url") ?? "";
          if (!target) {
            return new Response("missing url", { status: 400, headers: corsHeaders });
          }

          const upstream = await fetch(target);
          if (!upstream.ok) {
            return new Response("upstream error", { status: 502, headers: corsHeaders });
          }

          const buf = await upstream.arrayBuffer();
          const contentType = upstream.headers.get("content-type") ?? "image/webp";
          return new Response(buf, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch {
          return new Response("proxy error", { status: 500, headers: corsHeaders });
        }
      },
    },
  },
});
