import { createFileRoute } from "@tanstack/react-router";
import { getDiscordAuthUrl } from "@/lib/discord.server";

export const Route = createFileRoute("/api/auth/discord")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        const wallet = reqUrl.searchParams.get("wallet") ?? "anon";
        const returnTo = reqUrl.searchParams.get("returnTo") ?? "/";
        const redirectUri = `${reqUrl.origin}/api/auth/discord/callback`;

        // Encode state: random nonce + wallet + returnTo (URL-safe base64)
        const nonce = crypto.randomUUID();
        const stateObj = { n: nonce, w: wallet, r: returnTo };
        const state = btoa(JSON.stringify(stateObj))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const url = getDiscordAuthUrl(redirectUri, state);
        return Response.redirect(url, 302);
      },
    },
  },
});
