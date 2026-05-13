import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, keccak256, toBytes } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { BACKEND_URL, FRIEND_ZONE_ABI, FRIEND_ZONE_ADDRESS, FRIEND_ZONE_DEPLOYED } from "@/lib/constants";
import { QUOTES } from "@/lib/quotes";

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
  const { writeContractAsync: doWrite } = useWriteContract();

  const [page, setPage] = useState<AppPage>("username");
  const [revealState, setRevealState] = useState<RevealState>("idle");
  const [usernameInput, setUsernameInput] = useState("");
  const [seekerUsername, setSeekerUsername] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [assignedFriend, setAssignedFriend] = useState<AssignedFriend | null>(null);
  const [stats, setStats] = useState({ totalPairings: 0, availableCount: 0 });
  const [justRevealed, setJustRevealed] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [, setBackendReady] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [walletAlreadyPaired, setWalletAlreadyPaired] = useState(false);

  const isConfigured = useMemo(
    () =>
      FRIEND_ZONE_DEPLOYED &&
      FRIEND_ZONE_ADDRESS.startsWith("0x") &&
      FRIEND_ZONE_ADDRESS.length === 42 &&
      FRIEND_ZONE_ADDRESS !== "0x0000000000000000000000000000000000000000" &&
      FRIEND_ZONE_ABI.length > 0,
    []
  );

  const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? BACKEND_URL;
  const apiUrl = (path: string) => `${backendBaseUrl}${path}`;

  const refreshStats = async (opts?: { signal?: AbortSignal }) => {
    const res = await fetch(apiUrl("/api/stats"), { signal: opts?.signal });
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();
    const availableCount = Number(data.availableCount ?? 0);
    setStats({
      totalPairings: data.totalPairings ?? 0,
      availableCount,
    });
    return data;
  };

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        await refreshStats({ signal: AbortSignal.timeout(5000) });
      } catch {
        if (mounted) {
          setStats({ totalPairings: 0, availableCount: 0 });
        }
      } finally {
        if (mounted) setBackendReady(true);
      }
    };
    fetchStats();
    const interval = setInterval(async () => {
      try {
        await refreshStats({ signal: AbortSignal.timeout(5000) });
      } catch {}
    }, 30000);
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

  useEffect(() => {
    if (page !== "reveal") return;
    fetch(apiUrl("/api/members/available"))
      .then((res) => res.json())
      .then((data: { count?: number }) => setMemberCount(Number(data.count ?? 0)))
      .catch(() => setMemberCount(0));
  }, [page]);

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
        if (data.friend) {
          setAssignedFriend(data.friend as AssignedFriend);
        } else {
          setAssignedFriend({
            username: "unknown",
            avatar_url: undefined,
            quote: "Some friendships are written in the chain.",
          });
        }
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

      if (data.status === "fresh") {
        setAssignedFriend(null);
        setPage("reveal");
        setRevealState("wallet_needed");
        setStatus(null);
        return;
      }

      setStatus("Could not check username. Try again.");
    } catch {
      setStatus("Could not check username. Try again.");
    } finally {
      setCheckingUsername(false);
    }
  };

  const findFriend = async () => {
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

    if (!publicClient || !seekerUsername) {
      setRevealState("error");
      setStatus("Wallet client is still initializing. Please try again.");
      return;
    }

    try {
      if (memberCount === 0) {
        setStatus("Pool not loaded yet, try again.");
        return;
      }
      setRevealState("pending_tx");
      const seekerHash = keccak256(toBytes(seekerUsername.toLowerCase().trim()));

      const hash = await doWrite({
        address: FRIEND_ZONE_ADDRESS,
        abi: FRIEND_ZONE_ABI,
        functionName: "revealFriend",
        args: [BigInt(memberCount), seekerHash],
        value: 0n,
        account: address,
      });

      setTxHash(hash);
      setRevealState("mining");
    } catch (error: any) {
      const message = String(error?.message ?? "");
      if (message.includes("rejected") || message.includes("denied")) {
        setRevealState("ready");
        return;
      }
      setStatus(message || "Transaction failed");
      setRevealState("error");
    }
  };

  useEffect(() => {
    if (!txHash || revealState !== "mining" || !publicClient) return;
    let cancelled = false;

    const resolveFriend = async () => {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (cancelled) return;

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

        if (friendIndex === null) {
          setStatus("No event found in receipt.");
          setRevealState("error");
          return;
        }

        const membersRes = await fetch(apiUrl("/api/members"));
        const membersData = (await membersRes.json()) as { members?: Array<{ username: string; avatar_url: string }> };
        const members = [...(membersData.members ?? [])].sort((a, b) => a.username.localeCompare(b.username));
        if (members.length === 0) {
          setStatus("Could not resolve friend. Contact support.");
          setRevealState("error");
          return;
        }
        const assigned = members[friendIndex % members.length];
        if (!assigned) {
          setStatus("Could not resolve friend. Contact support.");
          setRevealState("error");
          return;
        }

        setAssignedFriend({
          username: assigned.username,
          avatar_url: assigned.avatar_url,
          quote: QUOTES[friendIndex % QUOTES.length],
        });
        setRevealState("revealed");
        setJustRevealed(true);
        setTimeout(() => setJustRevealed(false), 900);
        await refreshStats();
      } catch {
        if (cancelled) return;
        setStatus("Could not load friend data.");
        setRevealState("error");
      }
    };

    void resolveFriend();
    return () => {
      cancelled = true;
    };
  }, [txHash, revealState, publicClient]);

  useEffect(() => {
    if (!publicClient || !address || page !== "reveal" || !isConnected) return;
    let cancelled = false;

    const resolveExisting = async () => {
      try {
        const paired = (await publicClient.readContract({
          address: FRIEND_ZONE_ADDRESS,
          abi: FRIEND_ZONE_ABI,
          functionName: "walletHasPaired",
          args: [address],
        })) as boolean;
        if (cancelled) return;
        setWalletAlreadyPaired(paired === true);
        if (!paired) return;

        const existingIndex = (await publicClient.readContract({
          address: FRIEND_ZONE_ADDRESS,
          abi: FRIEND_ZONE_ABI,
          functionName: "walletFriendIndex",
          args: [address],
        })) as bigint;
        if (cancelled) return;

        const membersRes = await fetch(apiUrl("/api/members"));
        const membersData = (await membersRes.json()) as { members?: Array<{ username: string; avatar_url: string }> };
        const members = [...(membersData.members ?? [])].sort((a, b) => a.username.localeCompare(b.username));
        if (members.length === 0) return;
        const index = Number(existingIndex);
        const assigned = members[index % members.length];
        if (!assigned) return;

        setAssignedFriend({
          username: assigned.username,
          avatar_url: assigned.avatar_url,
          quote: QUOTES[index % QUOTES.length],
        });
        setRevealState("revealed");
      } catch {
        setWalletAlreadyPaired(false);
      }
    };

    void resolveExisting();
    return () => {
      cancelled = true;
    };
  }, [publicClient, address, page, isConnected]);

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
    findFriend,
    walletAlreadyPaired,
  };
}
