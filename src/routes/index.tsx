import { createFileRoute } from "@tanstack/react-router";
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
    totalPairings,
    assignedFriend,
    justRevealed,
    isConnected,
    submitUsername,
    summonFriend,
  } = useFriendZone();

  const downloadShareCard = async () => {
    if (!assignedFriend) return;
    const target = document.getElementById("share-card-1200");
    if (!target) return;
    const mod = await import("html-to-image");
    const dataUrl = await mod.toPng(target, { pixelRatio: 2, cacheBust: true });
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
      {assignedFriend && <ShareCard1200 username={assignedFriend.username} avatarUrl={assignedFriend.avatar_url} quote={assignedFriend.quote} />}

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        {page === "username" && (
          <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center text-center">
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
              className="mt-8 w-full max-w-xl"
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
              <button type="submit" className="mt-5 rounded-full bg-[var(--gradient-amber)] px-8 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--background)]">
                Find My Friend →
              </button>
              <p className="mt-5 text-xs text-[color:var(--muted-foreground)]">{totalPairings} friendships made on-chain</p>
            </form>
          </section>
        )}

        {page === "reveal" && (
          <section className="flex min-h-screen w-full flex-col">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.25em] text-[#A78BFA]">RITUAL</div>
              <WalletConnect />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-6">
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
                <div className="w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-center">
                  <p className="text-sm">Step 2: Sign a transaction to reveal your Ritual friend</p>
                  <button
                    onClick={summonFriend}
                    className="mt-4 rounded-full bg-[var(--gradient-amber)] px-8 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--background)]"
                  >
                    {revealState === "pending_tx" ? "Awaiting Signature..." : revealState === "mining" ? "Mining..." : "Summon My Friend →"}
                  </button>
                </div>
              )}

              {status && <p className="max-w-2xl rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm">{status}</p>}

              {assignedFriend && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex flex-wrap justify-center gap-3">
                    <button onClick={downloadShareCard} className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs animate-fade-in-up [animation-delay:0.1s]">⬇ Download Card</button>
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
