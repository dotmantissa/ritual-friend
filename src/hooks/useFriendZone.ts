import { useEffect, useMemo, useState } from "react";
import { decodeEventLog } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { BACKEND_URL, FRIEND_ZONE_ABI, FRIEND_ZONE_ADDRESS, FRIEND_ZONE_DEPLOYED } from "@/lib/constants";
import { QUOTES } from "@/lib/quotes";
import { getMemberByUsername } from "@/lib/pool";

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
      const membersRes = await fetch(apiUrl("/api/members"));
      const membersData = (await membersRes.json()) as { members?: Array<{ username: string; avatar_url: string }> };
      const members = membersData.members ?? [];
      const memberCount = members.length;
      if (memberCount === 0) {
        throw new Error("no_members_available");
      }
      const entropy = `${Date.now()}-${address}-${seekerUsername}-${memberCount}`;
      let seed = 0;
      for (let i = 0; i < entropy.length; i++) seed = (seed * 31 + entropy.charCodeAt(i)) >>> 0;
      const resolvedIndex = seed % memberCount;
      const selectedAssignedUsername = members[resolvedIndex]?.username ?? seekerUsername;

      const hash = await walletClient.writeContract({
        address: FRIEND_ZONE_ADDRESS,
        abi: FRIEND_ZONE_ABI,
        functionName: "revealFriend",
        args: [BigInt(memberCount), seekerUsername, selectedAssignedUsername, BigInt(resolvedIndex)],
        value: 0n,
        account: address,
      });

      setRevealState("mining");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      let friendIndex: number | null = null;
      let assignedUsername: string | null = null;
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
            assignedUsername = String(decoded.args.assignedUsername ?? "");
            break;
          }
        } catch {}
      }

      if (friendIndex === null || !assignedUsername) throw new Error("FriendRevealed event missing");
      const member = getMemberByUsername(assignedUsername);
      const quote = QUOTES[friendIndex % QUOTES.length] ?? QUOTES[0];
      setAssignedFriend({
        username: assignedUsername,
        avatar_url: member?.avatar_url,
        quote,
      });
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
