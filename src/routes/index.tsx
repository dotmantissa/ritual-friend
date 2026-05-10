import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ParticlesBg } from "@/components/ParticlesBg";
import { WalletConnect } from "@/components/WalletConnect";
import { NetworkGuard } from "@/components/NetworkGuard";
import { DiscordConnect } from "@/components/DiscordConnect";
import { VeiledCard } from "@/components/VeiledCard";
import { RevealedCard } from "@/components/RevealedCard";
import { FRIEND_ZONE_DEPLOYED } from "@/lib/constants";

export const Route = createFileRoute("/")({
  component: FriendZonePage,
});

interface DiscordUser {
  username: string;
  avatar_url: string;
  discord_id: string;
}

interface PoolMember {
  discord_id: string;
  username: string;
  avatar_url: string;
}

type Phase = "idle" | "finding" | "revealed";

function FriendZonePage() {
  const { isConnected, address } = useAccount();
  const [discord, setDiscord] = useState<DiscordUser | null>(null);
  const [skippedDiscord, setSkippedDiscord] = useState(false);
  const [poolCount, setPoolCount] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealed, setRevealed] = useState<{ member: PoolMember; index: number } | null>(null);

  // Parse Discord callback params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("auth");
    if (status === "success") {
      setDiscord({
        username: params.get("username") ?? "",
        avatar_url: params.get("avatar") ?? "",
        discord_id: params.get("discord_id") ?? "",
      });
      window.history.replaceState({}, "", "/");
    } else if (status === "error") {
      const reason = params.get("reason");
      setAuthError(
        reason === "not_in_server"
          ? "You're not in the Ritual Discord server yet. Join, then try again."
          : "Discord connection failed. Please retry."
      );
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Fetch pool count whenever something interesting happens
  useEffect(() => {
    let cancelled = false;
    fetch("/api/members?seed=1")
      .then((r) => r.json())
      .then((d) => !cancelled && setPoolCount(d.count ?? 0))
      .catch(() => !cancelled && setPoolCount(0));
    return () => { cancelled = true; };
  }, [discord]);

  const findFriend = async () => {
    if (!address) return;
    setPhase("finding");
    setRevealed(null);

    try {
      // Pull current pool
      const res = await fetch("/api/members");
      const data = await res.json();
      const members: PoolMember[] = data.members ?? [];
      if (members.length === 0) throw new Error("Pool is empty");

      // MOCK reveal — until contract is deployed.
      // When FRIEND_ZONE_DEPLOYED flips true, swap this for wagmi writeContract → wait for FriendRevealed event.
      let index: number;
      if (FRIEND_ZONE_DEPLOYED) {
        index = Math.floor(Math.random() * members.length); // placeholder until on-chain wire-up
      } else {
        // Pseudo-random based on address + timestamp so every call differs
        const seed = (address + Date.now()).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        index = seed % members.length;
      }

      // Theatrical delay
      await new Promise((r) => setTimeout(r, 1800));

      setRevealed({ member: members[index], index });
      setPhase("revealed");
    } catch (err) {
      console.error(err);
      setPhase("idle");
    }
  };

  const reset = () => {
    setRevealed(null);
    setPhase("idle");
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <NetworkGuard>
      <ParticlesBg />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🫂</span>
            <div>
              <h1 className="text-display text-lg leading-none">Friend Zone</h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted-foreground)]">
                Ritual Chain
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {poolCount !== null && (
              <span className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/60 px-3 py-1.5 text-xs text-[color:var(--muted-foreground)] sm:inline-flex">
                <span className="mr-1.5 size-1.5 self-center rounded-full bg-[color:var(--amber)]" />
                {poolCount} in pool
              </span>
            )}
            <WalletConnect />
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-display mb-4 text-5xl leading-[1.05] sm:text-7xl">
            <span className="shimmer-text">Reveal</span> a Ritual friend.
          </h2>
          <p className="mb-10 max-w-xl text-base text-[color:var(--muted-foreground)] sm:text-lg">
            Pay 0 RITUAL. Sign one transaction. The chain picks a random server member —
            that's your new friend. Add them on Discord. That's it.
          </p>

          {authError && (
            <div className="mb-6 rounded-xl border border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
              {authError}
            </div>
          )}

          {/* Step routing */}
          {!isConnected && (
            <div className="animate-fade-in-up">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
                Step 1 — Connect your wallet
              </p>
              <WalletConnect />
            </div>
          )}

          {isConnected && !discord && !skippedDiscord && (
            <div className="w-full">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
                Step 2 — Join the pool
              </p>
              <DiscordConnect onSkip={() => setSkippedDiscord(true)} />
            </div>
          )}

          {isConnected && (discord || skippedDiscord) && phase !== "revealed" && (
            <div className="flex flex-col items-center gap-8 animate-fade-in-up">
              <VeiledCard loading={phase === "finding"} />

              <button
                onClick={findFriend}
                disabled={phase === "finding" || (poolCount ?? 0) < 1}
                className="rounded-full bg-[var(--gradient-amber)] px-10 py-4 text-sm font-bold uppercase tracking-[0.25em] text-[color:var(--background)] shadow-[var(--shadow-amber)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: "var(--gradient-amber)" }}
              >
                {phase === "finding"
                  ? "Summoning…"
                  : (poolCount ?? 0) < 1
                  ? "Pool warming up…"
                  : "Find My Friend"}
              </button>

              {!FRIEND_ZONE_DEPLOYED && (
                <p className="max-w-sm text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">
                  Mock mode · contract not yet deployed. Paste address into{" "}
                  <code className="font-mono">src/lib/constants.ts</code> after deploy.
                </p>
              )}
            </div>
          )}

          {phase === "revealed" && revealed && (
            <div className="flex flex-col items-center gap-8">
              <RevealedCard
                username={revealed.member.username}
                avatarUrl={revealed.member.avatar_url}
                index={revealed.index}
                total={poolCount ?? 0}
              />
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="rounded-full border-2 border-[color:var(--primary)] px-6 py-3 text-sm font-semibold uppercase tracking-wider transition hover:bg-[color:var(--primary)]"
                >
                  Find another
                </button>
                <button
                  onClick={() => {
                    const text = `I just made a ritual friend: ${revealed.member.username} 🫂\nFind yours →`;
                    if (navigator.share) {
                      navigator.share({ title: "Ritual Friend Zone", text, url: window.location.origin });
                    } else {
                      navigator.clipboard.writeText(`${text} ${window.location.origin}`);
                    }
                  }}
                  className="rounded-full bg-[color:var(--amber)] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--background)]"
                >
                  Share
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--border)] pt-6 text-xs text-[color:var(--muted-foreground)]">
          <span>Built on Ritual Chain · 1979</span>
          <span>
            Pool grows as members connect Discord. No bot, no server access required.
          </span>
        </footer>
      </main>
    </NetworkGuard>
  );
}
