# Ritual · Friend Zone

A Ritual Chain social game. Connect wallet → connect Discord → reveal a random Ritual community member as your new friend.

## Architecture

- **Frontend + Backend**: TanStack Start app (this repo). Server routes under `src/routes/api/*` handle Discord OAuth and the member pool.
- **Database**: Lovable Cloud (`members` table — public read, server-only writes).
- **Smart contract**: `contracts/FriendZone.sol` — deploy with Foundry to Ritual Chain (id 1979).

## Member pool strategies

| Strategy | Status |
|---|---|
| **A. Discord OAuth2** (primary) | ✅ Active. Each user who connects Discord and is verified in the Ritual server is added to the pool. |
| **B. Discord Widget API** | ✅ Active when widget enabled. Auto-seeds `/api/members?seed=1` calls. |
| **C. Static JSON seed** | Optional — upsert directly into the `members` table via the Cloud dashboard. |

## Discord OAuth2 setup (one time)

1. https://discord.com/developers/applications → New Application
2. OAuth2 → General → copy Client ID + Secret (already added as Cloud secrets `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`)
3. Add redirect URIs:
   - Preview: `https://id-preview--<project-id>.lovable.app/api/auth/discord/callback`
   - Production (after publish): `https://<your-domain>/api/auth/discord/callback`
4. No bot, no scopes beyond `identify` + `guilds.members.read`. Server ownership not required.

## Deploying the contract

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge build
forge test -vv
PRIVATE_KEY=0x... forge script script/Deploy.s.sol \
  --rpc-url https://rpc.ritualfoundation.org \
  --broadcast \
  --legacy
```

After deploy, paste the deployed address into `src/lib/constants.ts`:

```ts
export const FRIEND_ZONE_ADDRESS = "0x..." as `0x${string}`;
export const FRIEND_ZONE_DEPLOYED = true;
```

The frontend currently runs in **mock mode** — `Find My Friend` picks a random index client-side. Wiring `wagmi.useWriteContract` + parsing the `FriendRevealed` event is a follow-up step once the address is in.

## API

- `GET /api/members` — full pool, stable ordered by `discord_id`. `?seed=1` triggers a widget refresh first.
- `GET /api/members/:index` — single member at a given pool index.
- `GET /api/auth/discord?wallet=0x…&returnTo=/` — initiates OAuth flow.
- `GET /api/auth/discord/callback` — OAuth callback; redirects to `returnTo` with `?auth=success&username=…&avatar=…`.
