const ENV_ADDRESS =
  (import.meta.env.VITE_FRIEND_ZONE_ADDRESS as `0x${string}` | undefined) ??
  "0x883619a7D8cd96f341149fDa3652b8C96172D946";
const ENV_DEPLOYED = (import.meta.env.VITE_FRIEND_ZONE_DEPLOYED ?? "true").toLowerCase() === "true";

export const FRIEND_ZONE_ADDRESS = ENV_ADDRESS as `0x${string}`;
export const FRIEND_ZONE_DEPLOYED = ENV_DEPLOYED;

export const FRIEND_ZONE_ABI = [
  {
    name: "revealFriend",
    type: "function",
    inputs: [{ name: "memberCount", type: "uint256" }],
    outputs: [{ name: "friendIndex", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    name: "FriendRevealed",
    type: "event",
    inputs: [
      { name: "seeker", type: "address", indexed: true },
      { name: "friendIndex", type: "uint256", indexed: true },
      { name: "memberCount", type: "uint256", indexed: false },
      { name: "nonce", type: "uint256", indexed: false },
    ],
  },
  {
    name: "revealCount",
    type: "function",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "revealFee",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
