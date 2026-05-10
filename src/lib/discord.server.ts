// Server-only Discord helpers: OAuth2 + Widget seeder.
import { getSupabaseAdmin } from "@/integrations/supabase/admin.server";

export const GUILD_ID = "1210468736205852672";
const WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;

export interface PoolMember {
  discord_id: string;
  username: string;
  avatar_url: string;
  source: "oauth" | "widget" | "seed";
}

async function upsertMember(m: PoolMember) {
  const admin = getSupabaseAdmin();
  await admin
    .from("members")
    .upsert(
      {
        discord_id: m.discord_id,
        username: m.username,
        avatar_url: m.avatar_url,
        source: m.source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "discord_id" }
    );
}

// ── Widget seeder ─────────────────────────────────────────────────────────
export async function seedFromWidget(): Promise<{ added: number; enabled: boolean; error?: string }> {
  try {
    const res = await fetch(WIDGET_URL, {
      headers: { "User-Agent": "RitualFriendZone/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    const data: any = await res.json();
    if (data?.code === 50004) {
      return { added: 0, enabled: false, error: "widget_disabled" };
    }
    if (!data?.members || !Array.isArray(data.members) || data.members.length === 0) {
      return { added: 0, enabled: true };
    }
    let added = 0;
    for (const m of data.members) {
      if (!m.username || !m.avatar_url) continue;
      const cleanAvatar = String(m.avatar_url).split("?")[0] + "?size=256";
      await upsertMember({
        discord_id: String(m.id),
        username: String(m.username),
        avatar_url: cleanAvatar,
        source: "widget",
      });
      added++;
    }
    return { added, enabled: true };
  } catch (err: any) {
    return { added: 0, enabled: false, error: err?.message ?? "unknown" };
  }
}

// ── OAuth2 flow ───────────────────────────────────────────────────────────
export function getDiscordAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds.members.read",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

export async function handleOAuthCallback(
  code: string,
  redirectUri: string
): Promise<PoolMember | null> {
  // Step 1: exchange code for token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) {
    console.error("[discord] token exchange failed", await tokenRes.text());
    return null;
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // Step 2: identify
  const userRes = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return null;
  const user: any = await userRes.json();

  let displayName = user.global_name ?? user.username;
  let avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || "0") % 5}.png`;

  // Step 3: verify guild membership + pull server-specific nick/avatar
  const memberRes = await fetch(
    `https://discord.com/api/v10/users/@me/guilds/${GUILD_ID}/member`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  if (!memberRes.ok) {
    // 404 = not in guild
    return null;
  }
  const guildMember: any = await memberRes.json();
  if (guildMember.nick) displayName = guildMember.nick;
  if (guildMember.avatar) {
    avatarUrl = `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${user.id}/avatars/${guildMember.avatar}.png?size=256`;
  }

  const member: PoolMember = {
    discord_id: String(user.id),
    username: String(displayName),
    avatar_url: avatarUrl,
    source: "oauth",
  };
  await upsertMember(member);
  return member;
}

// ── Pool reads ─────────────────────────────────────────────────────────────
export async function getAllMembersStable() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("members")
    .select("discord_id, username, avatar_url")
    .order("discord_id", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

export async function getMemberByIndex(index: number) {
  const all = await getAllMembersStable();
  return { member: all[index] ?? null, total: all.length };
}
