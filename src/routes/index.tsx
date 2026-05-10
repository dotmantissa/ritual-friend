import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { decodeEventLog } from "viem";
import { ParticlesBg } from "@/components/ParticlesBg";
import { WalletConnect } from "@/components/WalletConnect";
import { NetworkGuard } from "@/components/NetworkGuard";
import { VeiledCard } from "@/components/VeiledCard";
import { RevealedCard } from "@/components/RevealedCard";
import { ShareCard1200 } from "@/components/ShareCard1200";
import { FRIEND_ZONE_ABI, FRIEND_ZONE_ADDRESS, FRIEND_ZONE_DEPLOYED } from "@/lib/constants";

export const Route = createFileRoute("/")({
  component: FriendZonePage,
});

type Step = "username" | "wallet" | "ready" | "revealed";

interface AssignedFriend {
  username: string;
  avatar_url?: string;
  quote: string;
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function FriendZonePage() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [step, setStep] = useState<Step>("username");
  const [usernameInput, setUsernameInput] = useState("");
  const [seekerUsername, setSeekerUsername] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [availableCount, setAvailableCount] = useState<number>(0);
  const [totalPairings, setTotalPairings] = useState<number>(0);
  const [finding, setFinding] = useState(false);
  const [assignedFriend, setAssignedFriend] = useState<AssignedFriend | null>(null);
  const [justRevealed, setJustRevealed] = useState(false);

  const isConfigured = useMemo(
    () => FRIEND_ZONE_DEPLOYED && FRIEND_ZONE_ADDRESS !== "0x0000000000000000000000000000000000000000",
    []
  );

  const refreshPool = async () => {
    const res = await fetch("/api/members/available");
    const data = await res.json();
    setAvailableCount(data.count ?? 0);
    setTotalPairings(data.totalPairings ?? 0);
    return data.count ?? 0;
  };

  useEffect(() => {
    refreshPool().catch(() => {
      setAvailableCount(0);
      setTotalPairings(0);
    });
  }, []);

  const hasSubmittedUsername = seekerUsername.length > 0;
  const canShowWalletConnect = hasSubmittedUsername && step !== "revealed" && !isConnected;
  const canShowReveal = hasSubmittedUsername && step !== "revealed" && isConnected;

  const handleUsernameSubmit = async () => {
    const username = normalizeUsername(usernameInput);
    if (!username) {
      setStatus("Enter your Discord username.");
      return;
    }

    setStatus(null);
    setSeekerUsername(username);

    try {
      const res = await fetch(`/api/members/check/${encodeURIComponent(username)}`);
      const data = await res.json();

      if (data.status === "assigned_to_seeker") {
        setAssignedFriend(data.assignedFriend as AssignedFriend);
        setStatus(`Looks like someone already found you! Here's who @${data.seekerUsername} was matched with.`);
        setStep("revealed");
        return;
      }

      if (data.status === "already_paired") {
        setAssignedFriend(data.assignedFriend as AssignedFriend);
        setStatus("Welcome back! Here's your Ritual friend.");
        setStep("revealed");
        return;
      }

      if ((await refreshPool()) <= 0) {
        setStatus("All friendships have been forged. The Ritual network is fully connected. 🤝");
        return;
      }

      setStep(isConnected ? "ready" : "wallet");
      setStatus(`Great, @${username}! Connect your wallet to reveal your Ritual friend.`);
    } catch {
      setStatus("Could not check username. Try again.");
    }
  };

  useEffect(() => {
    if (step === "wallet" && isConnected) {
      setStep("ready");
      setStatus(`Wallet connected. Ready to reveal for @${seekerUsername}.`);
    }
  }, [isConnected, seekerUsername, step]);

  const handleReveal = async () => {
    if (!address || !walletClient || !publicClient || !seekerUsername) return;
    setFinding(true);
    setStatus(null);

    try {
      const count = await refreshPool();
      if (count <= 0) {
        setStatus("All friendships have been forged. The Ritual network is fully connected. 🤝");
        return;
      }

      if (!isConfigured) {
        setStatus("Contract not configured yet.");
        return;
      }

      const hash = await walletClient.writeContract({
        address: FRIEND_ZONE_ADDRESS,
        abi: FRIEND_ZONE_ABI,
        functionName: "revealFriend",
        args: [BigInt(count)],
        value: 0n,
        account: address,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      let friendIndex: number | null = null;

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: FRIEND_ZONE_ABI,
            eventName: "FriendRevealed",
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "FriendRevealed") {
            friendIndex = Number(decoded.args.friendIndex);
            break;
          }
        } catch {}
      }

      if (friendIndex === null) throw new Error("FriendRevealed event missing");

      const claimRes = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, seekerUsername, friendIndex }),
      });

      const claimData = await claimRes.json();
      if (!claimRes.ok) {
        if (claimRes.status === 409) {
          setStatus("Pool shifted or this username/wallet already paired. Try again.");
          return;
        }
        throw new Error(claimData.error ?? "claim_failed");
      }

      setAssignedFriend(claimData as AssignedFriend);
      setJustRevealed(true);
      setTimeout(() => setJustRevealed(false), 900);
      setStep("revealed");
      await refreshPool();
    } catch (error: any) {
      setStatus(`Failed to reveal friend: ${error?.message ?? "unknown error"}`);
    } finally {
      setFinding(false);
    }
  };

  const copyQuote = async () => {
    if (!assignedFriend) return;
    await navigator.clipboard.writeText(assignedFriend.quote);
    setStatus("Quote copied.");
  };

  const downloadShareCard = async () => {
    if (!assignedFriend) return;
    const target = document.getElementById("share-card-1200");
    if (!target) return;
    const mod = await import("html-to-image");
    const dataUrl = await mod.toPng(target, { pixelRatio: 2, cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ritual-friend-${assignedFriend.username}.png`;
    a.click();
  };

  const shareToX = async () => {
    if (!assignedFriend) return;
    await downloadShareCard();
    setStatus("Card downloaded! Attach it to your tweet 🔥");
    const text = `Just got matched with @${assignedFriend.username} on @ritualnet 🤝\n\n"${assignedFriend.quote}"\n\nFind your Ritual friend → ${window.location.origin}\n#RitualFriendZone #Ritual`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <NetworkGuard>
      <ParticlesBg />
      {assignedFriend && <ShareCard1200 username={assignedFriend.username} avatarUrl={assignedFriend.avatar_url} quote={assignedFriend.quote} />}

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-display text-5xl sm:text-7xl">RITUAL [ Friend Zone ]</h1>
          <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">find your person on the network</p>

          {status && <p className="mt-6 max-w-2xl rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm">{status}</p>}

          {step !== "revealed" && (
            <form
              className="mt-8 w-full max-w-lg"
              onSubmit={(e) => {
                e.preventDefault();
                void handleUsernameSubmit();
              }}
            >
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="your Discord username"
                className="w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-4 text-center outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_22px_rgba(124,58,237,0.45)]"
              />
              <button type="submit" disabled={availableCount <= 0} className="mt-5 rounded-full bg-[var(--gradient-amber)] px-8 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--background)] disabled:opacity-50">
                Find My Friend →
              </button>
              <p className="mt-5 text-xs text-[color:var(--muted-foreground)]">{totalPairings} friendships made</p>
            </form>
          )}

          {canShowWalletConnect && (
            <div className="mt-8">
              <p className="mb-4">Great, @{seekerUsername}! Connect your wallet to reveal your Ritual friend.</p>
              <WalletConnect />
            </div>
          )}

          {canShowReveal && (
            <div className="mt-8 flex flex-col items-center gap-6">
              <VeiledCard loading={finding} />
              <button onClick={handleReveal} disabled={finding} className="rounded-full bg-[var(--gradient-amber)] px-8 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--background)]">
                {finding ? "Revealing..." : "Summon Friend →"}
              </button>
              <p className="text-xs text-[color:var(--muted-foreground)]">Sign a transaction on Ritual Chain to reveal your match.</p>
            </div>
          )}

          {step === "revealed" && assignedFriend && (
            <div className="relative mt-8 flex flex-col items-center gap-5">
              {justRevealed && (
                <>
                  <span className="absolute left-[45%] top-[50%] size-2 rounded-full bg-[#7C3AED] [--dx:-80px] [--dy:-50px] animate-confetti-pop" />
                  <span className="absolute left-[48%] top-[48%] size-2 rounded-full bg-[#F59E0B] [--dx:95px] [--dy:-70px] animate-confetti-pop" />
                  <span className="absolute left-[52%] top-[52%] size-2 rounded-full bg-white [--dx:70px] [--dy:60px] animate-confetti-pop" />
                  <span className="absolute left-[50%] top-[50%] size-2 rounded-full bg-[#A78BFA] [--dx:-90px] [--dy:40px] animate-confetti-pop" />
                  <span className="absolute left-[49%] top-[49%] size-2 rounded-full bg-[#F59E0B] [--dx:20px] [--dy:-95px] animate-confetti-pop" />
                  <span className="absolute left-[51%] top-[51%] size-2 rounded-full bg-white [--dx:-15px] [--dy:95px] animate-confetti-pop" />
                  <span className="absolute left-[47%] top-[51%] size-2 rounded-full bg-[#7C3AED] [--dx:110px] [--dy:10px] animate-confetti-pop" />
                  <span className="absolute left-[53%] top-[47%] size-2 rounded-full bg-[#F59E0B] [--dx:-110px] [--dy:-8px] animate-confetti-pop" />
                </>
              )}

              <div className={justRevealed ? "relative animate-card-flip" : "relative"}>
                {justRevealed && <div className="pointer-events-none absolute inset-0 w-full bg-gradient-to-r from-transparent via-[#F59E0B]/50 to-transparent animate-shimmer-sweep" />}
                <RevealedCard username={assignedFriend.username} avatarUrl={assignedFriend.avatar_url} quote={assignedFriend.quote} />
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={downloadShareCard} className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs animate-fade-in-up [animation-delay:0.1s]">Download Card</button>
                <button onClick={shareToX} className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs animate-fade-in-up [animation-delay:0.2s]">Share on X</button>
                <button onClick={copyQuote} className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs animate-fade-in-up [animation-delay:0.3s]">Copy Quote</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </NetworkGuard>
  );
}
