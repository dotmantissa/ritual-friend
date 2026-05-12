const ENV_ADDRESS =
  (import.meta.env.VITE_FRIEND_ZONE_ADDRESS as `0x${string}` | undefined) ??
  "0x883619a7d8cd96f341149fda3652b8c96172d946";
const ENV_DEPLOYED = (import.meta.env.VITE_FRIEND_ZONE_DEPLOYED ?? "true").toLowerCase() === "true";
const ENV_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "";

export const FRIEND_ZONE_ADDRESS = ENV_ADDRESS as `0x${string}`;
export const FRIEND_ZONE_DEPLOYED = ENV_DEPLOYED;
export const BACKEND_URL = ENV_BACKEND_URL;

export const FRIEND_ZONE_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "hasRevealed",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "lastFriendIndex",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "revealCount",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "revealFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "revealFriend",
    inputs: [{ name: "memberCount", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "friendIndex", type: "uint256", internalType: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "setRevealFee",
    inputs: [{ name: "fee", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalReveals",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "FriendRevealed",
    inputs: [
      { name: "seeker", type: "address", indexed: true, internalType: "address" },
      { name: "friendIndex", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "memberCount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "nonce", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "InsufficientFee",
    inputs: [],
  },
  {
    type: "error",
    name: "MemberCountZero",
    inputs: [],
  },
  {
    type: "error",
    name: "NotOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "WithdrawFailed",
    inputs: [],
  },
] as const;
