import { createFileRoute } from "@tanstack/react-router";
import { claimByAvailableIndex, getWalletAssignment } from "@/lib/pool";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/claim")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let wallet = "";

        try {
          const body = (await request.json()) as { wallet?: string; friendIndex?: number };
          wallet = body.wallet?.trim() ?? "";
          const friendIndex = body.friendIndex;

          if (!wallet || typeof friendIndex !== "number" || !Number.isInteger(friendIndex) || friendIndex < 0) {
            return new Response(JSON.stringify({ error: "invalid_payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const member = await claimByAvailableIndex(wallet, friendIndex);
          return new Response(JSON.stringify(member), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (err: any) {
          const code = err?.message;

          if (code === "wallet_already_paired") {
            return new Response(
              JSON.stringify({ error: code, existing: wallet ? getWalletAssignment(wallet) : null }),
              { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          if (code === "member_already_claimed" || code === "pool_shifted") {
            return new Response(JSON.stringify({ error: code }), {
              status: 409,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          return new Response(JSON.stringify({ error: "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      },
    },
  },
});
