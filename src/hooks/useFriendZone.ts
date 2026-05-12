import { useEffect, useMemo, useState } from "react";
import { decodeEventLog } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { BACKEND_URL, FRIEND_ZONE_ABI, FRIEND_ZONE_ADDRESS, FRIEND_ZONE_DEPLOYED } from "@/lib/constants";

export type AppPage = "username" | "reveal";
export type RevealState = "idle" | "wallet_needed" | "ready" | "pending_tx" | "mining" | "revealed" | "error";

export interface AssignedFriend {
  username: string;
  avatar_url?: string;
  quote: string;
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function useFriendZone() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [page, setPage] = useState<AppPage>("username");
  const [revealState, setRevealState] = useState<RevealState>("idle");
  const [usernameInput, setUsernameInput] = useState("");
  const [seekerUsername, setSeekerUsername] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [assignedFriend, setAssignedFriend] = useState<AssignedFriend | null>(null);
  const [stats, setStats] = useState({ totalPairings: 0, availableCount: 0 });
  const [justRevealed, setJustRevealed] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [backendConnecting, setBackendConnecting] = useState(false);
  const [lastKnownMemberCount, setLastKnownMemberCount] = useState(0);

  const isConfigured = useMemo(
    () =>
      FRIEND_ZONE_DEPLOYED &&
      FRIEND_ZONE_ADDRESS.startsWith("0x") &&
      FRIEND_ZONE_ADDRESS.length === 42 &&
      FRIEND_ZONE_ADDRESS !== "0x0000000000000000000000000000000000000000" &&
      FRIEND_ZONE_ABI.length > 0,
    []
  );

  const apiUrl = (path: string) => `${BACKEND_URL}${path}`;

  const refreshStats = async () => {
    const res = await fetch(apiUrl("/api/stats"));
    const data = await res.json();
    const availableCount = Number(data.availableCount ?? 0);
    setStats({
      totalPairings: data.totalPairings ?? 0,
      availableCount,
    });
    if (availableCount > 0) {
      setLastKnownMemberCount(availableCount);
    }
    return data;
  };

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        if (mounted) setBackendConnecting(true);
        await refreshStats();
        if (mounted) setBackendConnecting(false);
      } catch {
        if (mounted) {
          setBackendConnecting(true);
          setStats({ totalPairings: 0, availableCount: 0 });
        }
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (page === "reveal" && revealState === "wallet_needed" && isConnected) {
      setRevealState("ready");
    }
  }, [isConnected, page, revealState]);

  const submitUsername = async () => {
    const username = normalizeUsername(usernameInput);
    if (!username) {
      setStatus("Enter your Discord username.");
      return;
    }

    setSeekerUsername(username);
    setStatus(null);

    setCheckingUsername(true);
    try {
      const res = await fetch(apiUrl(`/api/members/check/${encodeURIComponent(username)}`));
      const data = await res.json();

      if (data.status === "already_paired") {
        setAssignedFriend(data.friend as AssignedFriend);
        setPage("reveal");
        setRevealState("revealed");
        setStatus("Welcome back! Here's your Ritual friend.");
        return;
      }

      if (data.status === "assigned_to_seeker") {
        setAssignedFriend(data.friend as AssignedFriend);
        setPage("reveal");
        setRevealState("revealed");
        setStatus(`Looks like someone already found you! Here's who @${data.seekerUsername} was matched with.`);
        return;
      }

      setAssignedFriend(null);
      setPage("reveal");
      setRevealState(isConnected ? "ready" : "wallet_needed");
      setStatus(null);
    } catch {
      setStatus("Could not check username. Try again.");
    } finally {
      setCheckingUsername(false);
    }
  };

  const summonFriend = async () => {
    if (!isConnected || !address) {
      setRevealState("wallet_needed");
      setStatus("Connect your wallet to continue.");
      return;
    }

    if (!isConfigured || FRIEND_ZONE_ADDRESS === "0x" || FRIEND_ZONE_ABI.length === 0) {
      setRevealState("error");
      setStatus("Contract not configured — contact support.");
      return;
    }

    if (!walletClient || !publicClient || !seekerUsername) {
      setRevealState("error");
      setStatus("Wallet client is still initializing. Please try again.");
      return;
    }

    try {
      setRevealState("pending_tx");
      let fetchedCount = 0;
      try {
        const countRes = await fetch(apiUrl("/api/members/available"));
        const countData = await countRes.json();
        fetchedCount = Number(countData.count ?? 0);
      } catch {
        fetchedCount = 0;
      }
      if (fetchedCount > 0) {
        setLastKnownMemberCount(fetchedCount);
      }
      let memberCount = fetchedCount ?? 0;
      if (memberCount === 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          const retryRes = await fetch(apiUrl("/api/members/available"));
          const retryData = await retryRes.json();
          memberCount = Number(retryData.count ?? 0);
        } catch {
          memberCount = 0;
        }
        if (memberCount === 0) {
          console.warn("Backend count unavailable; using fallback member count.");
          memberCount = Math.max(lastKnownMemberCount, stats.availableCount, 1);
        } else {
          setLastKnownMemberCount(memberCount);
        }
      }

      const hash = await walletClient.writeContract({
        address: FRIEND_ZONE_ADDRESS,
        abi: FRIEND_ZONE_ABI,
        functionName: "revealFriend",
        args: [BigInt(memberCount)],
        value: 0n,
        account: address,
      });

      setRevealState("mining");
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

      const tryClaim = async () => {
        const claimRes = await fetch(apiUrl("/api/claim"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: address, seekerUsername, friendIndex }),
        });
        const claimData = await claimRes.json();
        return { claimRes, claimData };
      };

      let { claimRes, claimData } = await tryClaim();
      if (claimRes.status === 409) {
        setStatus("Someone just took that spot, trying again...");
        ({ claimRes, claimData } = await tryClaim());
      }

      if (!claimRes.ok) {
        throw new Error(claimData.error ?? "claim_failed");
      }

      setAssignedFriend(claimData as AssignedFriend);
      setRevealState("revealed");
      setJustRevealed(true);
      setTimeout(() => setJustRevealed(false), 900);
      await refreshStats();
    } catch (error: any) {
      setRevealState("error");
      setStatus(`Failed to summon friend: ${error?.message ?? "unknown error"}`);
    }
  };

  return {
    page,
    setPage,
    revealState,
    usernameInput,
    setUsernameInput,
    seekerUsername,
    status,
    stats,
    assignedFriend,
    justRevealed,
    isConnected,
    submitUsername,
    checkingUsername,
    backendConnecting,
    summonFriend,
  };
}
