import friendZoneArtifact from "../../contracts/out/FriendZone.sol/FriendZone.json";

const ENV_ADDRESS =
  (import.meta.env.VITE_FRIEND_ZONE_ADDRESS as `0x${string}` | undefined) ??
  "0x8fc8df8eb8b29285a5b562e089756a31032057fb";
const ENV_DEPLOYED = (import.meta.env.VITE_FRIEND_ZONE_DEPLOYED ?? "true").toLowerCase() === "true";
const ENV_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "https://ritual-friend.vercel.app";

export const FRIEND_ZONE_ADDRESS = ENV_ADDRESS as `0x${string}`;
export const FRIEND_ZONE_DEPLOYED = ENV_DEPLOYED;
export const BACKEND_URL = ENV_BACKEND_URL;

export const FRIEND_ZONE_ABI = friendZoneArtifact.abi;
