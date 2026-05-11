# Ritual Friend Zone

Ritual Friend Zone is a TanStack Start app + Foundry contract that matches a seeker to one Ritual community member.

## Current Status

- Contract deployed on Ritual testnet (`chainId 1979`):
  - `0x883619a7D8cd96f341149fDa3652b8C96172D946`
- Production app:
  - `https://ritual-friend.vercel.app`
- Frontend uses env-backed contract config (`VITE_FRIEND_ZONE_ADDRESS`, `VITE_FRIEND_ZONE_DEPLOYED`) with deployed defaults in code.

## User Flow (Current Implementation)

1. **Page 1 (username screen)**
- User enters Discord username and submits.
- Frontend calls `GET /api/members/check/:username`.
- If username is already in an existing pairing path, app moves to reveal page and shows existing friend immediately (no wallet tx).
- If fresh, app moves to reveal page.

2. **Page 2 (reveal screen)**
- Fixed header with `RITUAL` (left) and wallet control (right).
- If wallet not connected: show connect step.
- If wallet connected and user is fresh: show summon button.
- On summon:
  - fetch `GET /api/members/available` (count)
  - call contract `revealFriend(memberCount)`
  - parse `FriendRevealed` event for `friendIndex`
  - call `POST /api/claim` to persist assignment
- Result renders revealed card with download/share actions.

3. **Share-card capture path**
- 1200x630 share card is rendered in a hidden in-viewport fixed layer.
- Avatar URLs are proxied through backend (`/api/proxy/avatar`) before capture.
- Download is gated until avatar image is loaded.

## Tech Stack

- **App framework:** TanStack Start (React + server routes)
- **Wallet/chain:** wagmi + viem
- **Image export:** `html-to-image`
- **Contract tooling:** Foundry
- **Chain:** Ritual testnet (`https://rpc.ritualfoundation.org`)

## Data Model (Server Runtime)

### Member source
- `src/ritual_members.json` is loaded at server startup through `src/lib/pool.ts`.
- Members are normalized and sorted by username (case-insensitive).

### Pairing persistence
- Runtime state is managed by `src/lib/pairings.ts`.
- Local path:
  - non-Vercel: `./pairings.json`
  - Vercel: `/tmp/pairings.json`
- Persisted shape:
  - `byWallet`
  - `claimedUsernames`
  - `claimedAsSeeker`

## API Endpoints (Current)

### `GET /api/stats`
Returns live counters:
```json
{ "totalPairings": 0, "availableCount": 0 }
```

### `GET /api/members/available`
Returns current unclaimed member count:
```json
{ "count": 0 }
```

### `GET /api/members/check/:username`
Returns one of:
- `{ "status": "fresh" }`
- `{ "status": "already_paired", "friend": { ... } }`
- `{ "status": "assigned_to_seeker", "seekerUsername": "...", "friend": { ... } }`

### `POST /api/claim`
Body:
```json
{ "wallet": "0x...", "seekerUsername": "name", "friendIndex": 12 }
```
Behavior:
- rejects if wallet already paired
- rejects if seeker already used
- resolves index against current available pool
- saves pairing + random quote

Success response:
```json
{ "username": "...", "avatar_url": "...", "quote": "..." }
```

### `GET /api/proxy/avatar?url=<encoded>`
Fetches remote avatar and returns bytes with permissive CORS header for share-card capture.

### `GET /api/pairings/export`
Returns full in-memory/exportable pairing object.

### Other routes
- `GET /api/members`
- `GET /api/members/assignment/:wallet`

## Contract

Source: `contracts/src/FriendZone.sol`

Key behavior:
- `revealFriend(uint256 memberCount)`:
  - reverts on zero `memberCount`
  - reverts if `msg.value < revealFee`
  - if caller already revealed, emits previous assignment and returns it
  - otherwise computes `friendIndex` via on-chain entropy and stores one-time assignment
- `setRevealFee(uint256)` (owner)
- `withdraw()` (owner)

Event:
- `FriendRevealed(address seeker, uint256 friendIndex, uint256 memberCount, uint256 nonce)`

## Local Development

### App
```bash
npm install
npm run dev
```

### Contract tests
```bash
cd contracts
forge install foundry-rs/forge-std
forge test
```

### Contract deploy (Ritual)
```bash
cd contracts
export PRIVATE_KEY=0x...
forge script script/Deploy.s.sol --rpc-url https://rpc.ritualfoundation.org --broadcast
```

## Environment Variables

### Frontend/build
- `VITE_FRIEND_ZONE_ADDRESS`
- `VITE_FRIEND_ZONE_DEPLOYED` (`true`/`false`)

### Existing project vars
- Supabase vars remain in `.env` as currently configured.

## Deployment

Production is deployed on Vercel.

```bash
npx vercel --prod
```

Vercel env vars for contract address/deployed flag should be set in project settings (Production at minimum).
