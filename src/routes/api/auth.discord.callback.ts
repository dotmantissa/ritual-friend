import { createFileRoute } from "@tanstack/react-router";
import { handleOAuthCallback } from "@/lib/discord.server";

function decodeState(state: string): { w?: string; r?: string } {
  try {
    const padded = state.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

export const Route = createFileRoute("/api/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        const code = reqUrl.searchParams.get("code");
        const state = reqUrl.searchParams.get("state") ?? "";
        const { w: wallet = "", r: returnTo = "/" } = decodeState(state);
        const redirectUri = `${reqUrl.origin}/api/auth/discord/callback`;
        const frontend = `${reqUrl.origin}${returnTo.startsWith("/") ? returnTo : "/"}`;

        if (!code) {
          return Response.redirect(`${frontend}?auth=error&reason=missing_code`, 302);
        }

        try {
          const member = await handleOAuthCallback(code, redirectUri);
          if (!member) {
            return Response.redirect(`${frontend}?auth=error&reason=not_in_server`, 302);
          }
          const params = new URLSearchParams({
            auth: "success",
            username: member.username,
            avatar: member.avatar_url,
            discord_id: member.discord_id,
            wallet,
          });
          return Response.redirect(`${frontend}?${params}`, 302);
        } catch (err: any) {
          console.error("[oauth callback]", err?.message);
          return Response.redirect(`${frontend}?auth=error&reason=server_error`, 302);
        }
      },
    },
  },
});
