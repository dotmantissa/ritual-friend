import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ParticlesBg } from "@/components/ParticlesBg";
import { NetworkGuard } from "@/components/NetworkGuard";
import { WalletConnect } from "@/components/WalletConnect";
import { VeiledCard } from "@/components/VeiledCard";
import { RevealedCard } from "@/components/RevealedCard";
import { ShareCard1200 } from "@/components/ShareCard1200";
import { useFriendZone } from "@/hooks/useFriendZone";

export const Route = createFileRoute("/")({
  component: FriendZonePage,
});

export function FriendZonePage() {
  const {
    page,
    revealState,
    usernameInput,
    setUsernameInput,
    status,
    stats,
    assignedFriend,
    justRevealed,
    isConnected,
    submitUsername,
    checkingUsername,
    summonFriend,
  } = useFriendZone();

  const [imageReady, setImageReady] = useState(false);
  const [dotPhase, setDotPhase] = useState(0);

  useEffect(() => {
    if (revealState !== "mining") return;
    const id = setInterval(() => setDotPhase((n) => (n + 1) % 4), 400);
    return () => clearInterval(id);
  }, [revealState]);

  useEffect(() => {
    setImageReady(!assignedFriend?.avatar_url);
  }, [assignedFriend?.avatar_url]);

  const proxiedAvatar = useMemo(() => {
    if (!assignedFriend?.avatar_url) return undefined;
    return `${window.location.origin}/api/proxy/avatar?url=${encodeURIComponent(assignedFriend.avatar_url)}`;
  }, [assignedFriend?.avatar_url]);

  const downloadShareCard = async () => {
    if (!assignedFriend) return;
    const target = document.getElementById("share-card-1200");
    if (!target || !imageReady) return;
    await new Promise((r) => setTimeout(r, 200));
    const mod = await import("html-to-image");
    const dataUrl = await mod.toPng(target, {
      width: 640,
      height: 840,
      pixelRatio: 2,
      skipFonts: false,
      cacheBust: true,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ritual-friend-${assignedFriend.username}-${Date.now()}.png`;
    a.click();
  };

  const shareToX = async () => {
    if (!assignedFriend) return;
    await downloadShareCard();
    const quote = assignedFriend.quote.length > 100 ? `${assignedFriend.quote.slice(0, 100)}...` : assignedFriend.quote;
    const text = `Just found my Ritual friend 🤝\n\n@${assignedFriend.username} and I are now connected on @ritualnet\n\n"${quote}"\n\nFind yours → ${window.location.origin}\n#RitualFriendZone`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    alert("Card downloaded! Attach it to your tweet 🔥");
  };

  return (
    <NetworkGuard>
      <ParticlesBg />
      {assignedFriend && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "640px",
            height: "840px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            overflow: "hidden",
          }}
        >
          <ShareCard1200
            username={assignedFriend.username}
            avatarUrl={proxiedAvatar}
            quote={assignedFriend.quote}
            onAvatarLoad={() => setImageReady(true)}
          />
        </div>
      )}

      <main className="app-main relative z-10">
        {page === "username" && (
          <section className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center text-center">
            <div className="title-wrap">
              <h1 className="title-ritual">RITUAL</h1>
              <p className="title-friendzone">
                <span className="bracket">[ </span>
                Friend Zone
                <span className="bracket"> ]</span>
              </p>
            </div>

            <p className="mt-6 text-sm text-[color:var(--muted-foreground)]">find your person on the network</p>

            {status && <p className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm">{status}</p>}

            <form
              className="mt-8 w-full max-w-[420px]"
              onSubmit={(e) => {
                e.preventDefault();
                void submitUsername();
              }}
            >
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="enter your discord username..."
                className="w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-4 text-center outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_22px_rgba(124,58,237,0.45)]"
              />
              <button type="submit" disabled={checkingUsername} className="find-friend-btn">
                {checkingUsername ? "CHECKING..." : "FIND MY FRIEND →"}
              </button>
              <div className="stats-row">
                <span>🤝 {stats.totalPairings} friendships forged on-chain</span>
                <span>·</span>
                <span>👥 {stats.availableCount} friends still in the pool</span>
              </div>
            </form>
          </section>
        )}

        {page === "reveal" && (
          <section className="flex w-full flex-col" style={{ paddingTop: "80px" }}>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                zIndex: 100,
                background: "transparent",
              }}
            >
              <span style={{ fontSize: "12px", letterSpacing: "3px", color: "#A78BFA" }}>RITUAL</span>
              <WalletConnect />
            </div>

            <div className="page2-content">
              <div className="title-wrap mb-8">
                <h1 className="title-ritual">RITUAL</h1>
                <p className="title-friendzone">
                  <span className="bracket">[ </span>
                  Friend Zone
                  <span className="bracket"> ]</span>
                </p>
              </div>
              {assignedFriend && revealState === "revealed" ? (
                <div className={justRevealed ? "relative animate-card-flip" : "relative"}>
                  {justRevealed && <div className="pointer-events-none absolute inset-0 w-full bg-gradient-to-r from-transparent via-[#F59E0B]/50 to-transparent animate-shimmer-sweep" />}
                  <RevealedCard username={assignedFriend.username} avatarUrl={assignedFriend.avatar_url} quote={assignedFriend.quote} />
                </div>
              ) : (
                <VeiledCard state={revealState} />
              )}

              {!assignedFriend && !isConnected && (
                <div className="w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-center">
                  <p className="text-sm">Step 1: Connect your wallet</p>
                  <div className="mt-4 flex justify-center">
                    <WalletConnect />
                  </div>
                </div>
              )}

              {!assignedFriend && isConnected && (
                <button
                  onClick={summonFriend}
                  disabled={revealState === "pending_tx" || revealState === "mining"}
                  className="summon-btn"
                >
                  {revealState === "pending_tx"
                    ? "CONFIRM IN WALLET..."
                    : revealState === "mining"
                      ? `REVEALING${".".repeat(dotPhase + 1)}`
                      : "SUMMON MY FRIEND →"}
                </button>
              )}

              {status && <p className="max-w-2xl rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm">{status}</p>}

              {assignedFriend && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex flex-wrap justify-center gap-3">
                    <button onClick={downloadShareCard} disabled={!imageReady} className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs animate-fade-in-up [animation-delay:0.1s] disabled:opacity-60">
                      {!imageReady ? "PREPARING CARD..." : "⬇ Download Card"}
                    </button>
                    <button onClick={shareToX} className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs animate-fade-in-up [animation-delay:0.2s]">Share on 𝕏</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </NetworkGuard>
  );
}
