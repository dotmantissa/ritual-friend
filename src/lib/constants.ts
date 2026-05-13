import friendZoneArtifact from "../../contracts/out/FriendZone.sol/FriendZone.json";

const ENV_ADDRESS =
  (import.meta.env.VITE_FRIEND_ZONE_ADDRESS as `0x${string}` | undefined) ??
  "0x5c7a990f3dd10cc476a2a092d43944e3f6fca3d2";
const ENV_DEPLOYED = (import.meta.env.VITE_FRIEND_ZONE_DEPLOYED ?? "true").toLowerCase() === "true";
const ENV_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "https://ritual-friend.vercel.app";

export const FRIEND_ZONE_ADDRESS = ENV_ADDRESS as `0x${string}`;
export const FRIEND_ZONE_DEPLOYED = ENV_DEPLOYED;
export const BACKEND_URL = ENV_BACKEND_URL;

export const FRIEND_ZONE_ABI = friendZoneArtifact.abi;
