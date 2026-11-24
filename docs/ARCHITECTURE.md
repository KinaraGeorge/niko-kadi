# Kadi Night architecture plan

This is the plan for growing the landing page into a full online game with Discord-style voice, all running on one self-hosted VPS. Only phase 1 is built so far.

## At a glance

```text
            phone / laptop browser
     ┌──────────────┼───────────────────┐
     │ HTTPS        │ WebSocket (WSS)   │ WebRTC audio (UDP, TURN fallback)
     ▼              ▼                   ▼
┌─────────────────────── VPS (Docker Compose) ───────────────────────┐
│  Caddy reverse proxy  (automatic HTTPS for every service)          │
│     │                  │                    │                      │
│  web: Next.js       game: Node.js        livekit: voice SFU        │
│  pages, invites,    tables, turns,       rooms per table,          │
│  voice tokens       rules engine         mute, PTT, volume         │
│     └──────── shared TypeScript rules + types ───────┘             │
│  (later) Postgres for accounts and stats, Redis for scale-out      │
└────────────────────────────────────────────────────────────────────┘
```

## First milestone: share a link, play with friends

The goal that matters first is simple: send a link in the group chat, friends open it on their phones, and everyone plays a real game of Kadi together. Everything below is ordered to reach that as soon as possible:

1. Phase 2 (real-time game) is the next PR.
2. It deploys straight to the VPS with Docker Compose behind Caddy, using a free HTTPS hostname (for example `<your-ip>.sslip.io` or a DuckDNS name) until a real domain is chosen. HTTPS matters because browsers only allow the microphone on secure sites.
3. Voice (phase 3) follows once the game is playable.

## Phases

| Phase | What ships | Status |
| :-- | :-- | :-- |
| 1 | Next.js landing page, mobile first, Docker image, health check | ✅ This PR |
| 2 | Create a table, join by code, play a full game in real time, deployed to a shareable link | Next |
| 3 | Voice chat per table: open mic or push-to-talk, noise suppression, mute, deafen, per-person volume | Planned |
| 4 | Accounts (optional), house-rule presets, stats, rematches | Later |

## Phase 1: web app (built)

- **Next.js App Router with TypeScript.** Pages are rendered ahead of time, so the landing page is fast on slow mobile data.
- **Plain CSS with design tokens** ported from `design/index.html`. No CSS framework, so the look stays exact and the download stays small.
- **Fonts are self-hosted** by `next/font` at build time. Phones never call Google, and text does not jump when fonts load.
- **`output: "standalone"`** builds a small Node server. Nothing depends on Vercel, so the same image runs on the VPS.
- **`/api/health`** lets Docker and the proxy check the app is alive.

## Phase 2: online play

**Recommendation: one authoritative Node.js game server speaking WebSockets** (Socket.IO, for its automatic reconnects and fallbacks on flaky mobile networks).

- **Authoritative** means the server holds the deck and every hand, checks every move, and sends each player only their own cards. Nobody can cheat by reading the browser's memory.
- **Shared rules engine.** A pure TypeScript package (`packages/rules`) with no network code: deal, play, draw, power-card effects, "niko kadi" call checks. The server runs it for real; the browser runs it to grey out illegal cards instantly. It is easy to unit test.
- **House rules as data.** Each table stores a rules config (which cards are powers, whether 2s and 3s stack, whether 8 or Q is the question card). The landing page's "switch house rules" promise maps straight onto this.
- **Table codes** like `KADI-7HJ` come from the server, are short-lived, and use an alphabet without look-alike characters (no 0/O, 1/I).
- **Reconnects.** Phones drop connections all the time. A player gets a seat token on join, so a refresh or a network switch puts them back in the same seat with the same hand.
- **Storage.** Live games sit in memory first. Add Redis only when we run more than one game server, and Postgres when accounts and stats arrive.

When the game server arrives, the repo becomes an npm workspace:

```text
niko-kadi/
├── apps/web     ← today's Next.js app moves here
├── apps/game    ← WebSocket game server
└── packages/rules  ← shared rules engine and types
```

## Phase 3: voice chat

**Recommendation: self-hosted [LiveKit](https://github.com/livekit/livekit)**, an open-source (Apache 2.0) WebRTC media server with React components, run as one more container on the VPS.

Why not plain peer-to-peer WebRTC? With six players each phone would upload its voice five times, which drains mobile data and battery. LiveKit is a **selective forwarding unit (SFU)**: each phone uploads once and the server forwards the audio to everyone else.

### How the Discord-style features map

| Feature | How |
| :-- | :-- |
| Join voice for a table | Each table is a LiveKit room. The web app issues a short-lived access token after the game server confirms you have a seat. |
| Open mic / push-to-talk | Open mic keeps the mic track on. Push-to-talk mutes the track and unmutes it only while a big on-screen button (or the space bar) is held. |
| Noise suppression, echo cancellation, auto gain | Browser built-ins via `getUserMedia` constraints, on by default. For stronger filtering, add an RNNoise (open-source, WebAssembly) processor to the mic track as a "Noise filter: strong" toggle. LiveKit's Krisp filter is tied to LiveKit Cloud, so it does not fit a self-hosted setup. |
| Mute | Stop sending your mic track. Everyone sees a muted icon on your seat. |
| Deafen | Mute yourself and stop playing everyone else's audio. |
| Per-person volume | Each remote participant gets its own volume slider (0 to 200%), saved per friend in the browser. |
| Speaking indicator | LiveKit's active-speaker events light up the speaker's seat on the felt table. |
| Voice activity threshold | Optional sensitivity slider for open mic, so keyboard taps and fans don't trigger. |

### Mobile details that matter

- iPhones only start audio after a tap, so joining voice is always an explicit "Join voice" button.
- Audio uses the Opus codec, roughly 30 to 50 kbps per active speaker, which is light on data bundles.
- Some mobile networks block the UDP ports WebRTC prefers. LiveKit's built-in **TURN** relay over TLS on port 443 covers that.

## Hosting on the VPS

The target is the KVM 2 VPS. If that is Hostinger's KVM 2 plan (2 vCPU, 8 GB RAM, NVMe storage), it comfortably runs the web app, game server and audio-only voice for a friends-and-family scale. LiveKit's load-test tool can confirm real limits before launch.

- **Docker Compose** runs every service. `compose.yaml` already has the web app and commented slots for the rest.
- **Caddy** in front gives automatic HTTPS certificates and routes `/` to web, `/ws` to the game server and a `voice.` subdomain to LiveKit.
- **Firewall ports:** 80 and 443 (web), plus LiveKit's 7881/TCP and a UDP range (for example 50000 to 60000), and 3478/UDP if its TURN server is on.
- **Deploys:** GitHub Actions builds the image, pushes it to GitHub Container Registry, and the VPS pulls it. A later PR can add this.

## Open decisions

1. The real domain name (replaces the `kadinight.app` placeholder). Until then a free sslip.io or DuckDNS hostname works.
2. Whether players need accounts at all, or nicknames plus a seat token are enough.
3. Default house rules to show first.
