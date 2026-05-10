import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { decodeEventLog } from "viem";
import { ParticlesBg } from "@/components/ParticlesBg";
import { WalletConnect } from "@/components/WalletConnect";
import { NetworkGuard } from "@/components/NetworkGuard";
import { VeiledCard } from "@/components/VeiledCard";
import { RevealedCard } from "@/components/RevealedCard";
import { FRIEND_ZONE_ABI, FRIEND_ZONE_ADDRESS, FRIEND_ZONE_DEPLOYED } from "@/lib/constants";

export const Route = createFileRoute("/")({
  component: FriendZonePage,
});

type Phase = "idle" | "finding";

interface PoolMember {
  username: string;
  avatar_url: string;
}

function FriendZonePage() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealed, setRevealed] = useState<{ member: PoolMember; index: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const isConfigured = useMemo(
    () => FRIEND_ZONE_DEPLOYED && FRIEND_ZONE_ADDRESS !== "0x0000000000000000000000000000000000000000",
    []
  );

  const loadAvailable = async () => {
    const res = await fetch("/api/members/available");
    const data = await res.json();
    setAvailableCount(data.count ?? 0);
    return data.count ?? 0;
  };

  const checkExisting = async (wallet: string) => {
    const res = await fetch(`/api/members/assignment/${wallet}`);
    const data = await res.json();
    if (data?.assigned === false) return null;
    return data as PoolMember;
  };

  useEffect(() => {
    loadAvailable().catch(() => setAvailableCount(0));
  }, []);

  useEffect(() => {
    if (!address) {
      setRevealed(null);
      return;
    }

    checkExisting(address)
      .then((existing) => {
        if (existing) {
          setRevealed({ member: existing, index: 0 });
          setStatus("You are already paired. Showing your existing friend.");
        } else {
          setStatus(null);
          setRevealed(null);
        }
      })
      .catch(() => {
        setStatus("Could not check existing assignment.");
      });
  }, [address]);

  const findFriend = async () => {
    if (!address || !walletClient || !publicClient) return;
    setPhase("finding");
    setStatus(null);

    try {
      const existing = await checkExisting(address);
      if (existing) {
        setRevealed({ member: existing, index: 0 });
        setStatus("You are already paired. No new reveal needed.");
        setPhase("idle");
        return;
      }

      const count = await loadAvailable();
      if (count <= 0) {
        setStatus("All friends have been matched! Check back later.");
        setPhase("idle");
        return;
      }

      if (!isConfigured) {
        setStatus("Contract not configured. Set FRIEND_ZONE_ADDRESS and FRIEND_ZONE_DEPLOYED.");
        setPhase("idle");
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
        } catch {
          // Ignore unrelated logs
        }
      }

      if (friendIndex === null) {
        throw new Error("friend_revealed_event_not_found");
      }

      const claimRes = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, friendIndex }),
      });

      const claimData = await claimRes.json();

      if (!claimRes.ok) {
        if (claimRes.status === 409 && claimData.existing) {
          setRevealed({ member: claimData.existing, index: friendIndex });
          setStatus("Wallet already paired. Showing your existing friend.");
          setPhase("idle");
          return;
        }
        if (claimRes.status === 409) {
          setStatus("Pool shifted during reveal. Please try again.");
          setPhase("idle");
          await loadAvailable();
          return;
        }
        throw new Error(claimData.error ?? "claim_failed");
      }

      setRevealed({ member: claimData as PoolMember, index: friendIndex });
      setStatus("Friend revealed and claimed successfully.");
      await loadAvailable();
    } catch (err: any) {
      setStatus(`Failed to find friend: ${err?.message ?? "unknown_error"}`);
    } finally {
      setPhase("idle");
    }
  };

  return (
    <NetworkGuard>
      <ParticlesBg />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
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
            {availableCount !== null && (
              <span className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/60 px-3 py-1.5 text-xs text-[color:var(--muted-foreground)] sm:inline-flex">
                <span className="mr-1.5 size-1.5 self-center rounded-full bg-[color:var(--amber)]" />
                {availableCount} available
              </span>
            )}
            <WalletConnect />
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-display mb-4 text-5xl leading-[1.05] sm:text-7xl">
            <span className="shimmer-text">Reveal</span> a Ritual friend.
          </h2>
          <p className="mb-10 max-w-xl text-base text-[color:var(--muted-foreground)] sm:text-lg">
            One wallet, one friend. The contract reveals an index from the live available pool.
          </p>

          {status && (
            <div className="mb-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--foreground)]">
              {status}
            </div>
          )}

          {!isConnected && <WalletConnect />}

          {isConnected && !revealed && (
            <div className="flex flex-col items-center gap-8 animate-fade-in-up">
              <VeiledCard loading={phase === "finding"} />
              <button
                onClick={findFriend}
                disabled={phase === "finding" || (availableCount ?? 0) < 1}
                className="rounded-full bg-[var(--gradient-amber)] px-10 py-4 text-sm font-bold uppercase tracking-[0.25em] text-[color:var(--background)] shadow-[var(--shadow-amber)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: "var(--gradient-amber)" }}
              >
                {phase === "finding"
                  ? "Summoning…"
                  : (availableCount ?? 0) < 1
                    ? "All friends matched"
                    : "Find My Friend"}
              </button>
            </div>
          )}

          {revealed && (
            <div className="flex flex-col items-center gap-8">
              <RevealedCard
                username={revealed.member.username}
                avatarUrl={revealed.member.avatar_url}
                index={revealed.index}
                total={availableCount ?? 0}
              />
            </div>
          )}
        </section>
      </main>
    </NetworkGuard>
  );
}
