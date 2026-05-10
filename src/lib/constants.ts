// Paste the deployed FriendZone contract address here after Phase 2 deploy.
// Until then, Find Friend will run in MOCK mode (random index, no on-chain tx).
export const FRIEND_ZONE_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
export const FRIEND_ZONE_DEPLOYED = false; // flip to true after pasting a real address

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
