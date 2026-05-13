import { createPublicClient, http } from "viem";
import { ritualChain } from "@/lib/wagmi";
import { FRIEND_ZONE_ABI, FRIEND_ZONE_ADDRESS } from "@/lib/constants";

export const friendZonePublicClient = createPublicClient({
  chain: ritualChain,
  transport: http("https://rpc.ritualfoundation.org"),
});

export const friendRevealedEvent = {
  type: "event",
  name: "FriendRevealed",
  inputs: [
    { name: "wallet", type: "address", indexed: true },
    { name: "friendIndex", type: "uint256", indexed: true },
    { name: "seekerUsernameHash", type: "bytes32", indexed: true },
    { name: "memberCount", type: "uint256", indexed: false },
  ],
} as const;

export async function readFriendZoneStats(totalMembers: number) {
  const [totalPairings, claimedCount] = await Promise.all([
    friendZonePublicClient.readContract({
      address: FRIEND_ZONE_ADDRESS,
      abi: FRIEND_ZONE_ABI,
      functionName: "totalPairings",
    }),
    friendZonePublicClient.readContract({
      address: FRIEND_ZONE_ADDRESS,
      abi: FRIEND_ZONE_ABI,
      functionName: "claimedCount",
    }),
  ]);

  return {
    totalPairings: Number(totalPairings),
    availableCount: Math.max(0, totalMembers - Number(claimedCount)),
  };
}
