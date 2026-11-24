<div align="center">

# 🃏 Kadi Night

### *Niko kadi!* Play Kenyan poker online with your friends.

**Kadi**, the card game every Kenyan learned at a family gathering, rebuilt for the group chat era.<br/>
Start a table, drop the link in WhatsApp, and everyone plays from their phone.

![Status](https://img.shields.io/badge/status-playable%20on%20localhost-1FB76A?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-0C2A1B?style=for-the-badge&logo=nextdotjs)
![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-0B5D3A?style=for-the-badge&logo=socketdotio)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-0B5D3A?style=for-the-badge&logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/rules%20tests-29%20passing-C9F25A?style=for-the-badge&labelColor=0C2A1B)
![Docker](https://img.shields.io/badge/Docker-ready-C9F25A?style=for-the-badge&logo=docker&labelColor=0C2A1B)
![License](https://img.shields.io/badge/license-not%20chosen%20yet-42604F?style=for-the-badge)
![Free to play](https://img.shields.io/badge/real%20money-never-E0352B?style=for-the-badge)

[**Run it locally**](#-run-it-on-your-computer) · [**How to play**](#-how-to-play) · [**Architecture**](docs/ARCHITECTURE.md) · [**Roadmap**](#-roadmap)

</div>

---

## 📖 Table of contents

- [About](#-about)
- [Features](#-features)
- [What is Kadi?](#-what-is-kadi)
- [Run it on your computer](#-run-it-on-your-computer)
- [Play with friends on your Wi-Fi](#-play-with-friends-on-your-wi-fi)
- [How to play](#-how-to-play)
- [Deploying to a VPS](#-deploying-to-a-vps)
- [How it works](#-how-it-works)
- [Project structure](#-project-structure)
- [Tech choices](#-tech-choices)
- [Design system](#-design-system)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 About

**Who it's for:** friends and families who grew up playing Kadi and now live in different towns, or just want game night from the sofa.

**Why it exists:** organising a game should be as easy as sending a message. One link in the group chat, and everyone is at the table.

**What works today:**

1. Start a table from the landing page and get a short code like **KADI-7HJ2**.
2. Share the link. Friends tap it, type their name and take a seat. No accounts.
3. The host picks house rules and deals.
4. Everyone plays in real time from their own phone, with the full power-card rules.
5. Refresh or lose signal and you land back in your seat with the same hand.

> [!NOTE]
> Voice chat is the next milestone. Until then, keep your WhatsApp call going while you play.

---

## ✨ Features

- 🃏 **Real Kadi rules:** pick two, pick three, skip, kickback, questions, change suit, and the *"Niko kadi!"* call.
- 🏠 **House rules per table:** switch stacking, ace blocking, finishing rules and cards dealt.
- 📱 **Built for one hand on a phone:** big tap targets, your hand at the thumb, a buzz when it's your turn.
- 🔗 **Share anywhere:** the phone's share sheet, WhatsApp, or copy the link.
- 🔄 **Reconnects on its own:** your seat is saved in the browser.
- 🔒 **No cheating by peeking:** the server deals and only ever sends you your own cards.
- 🌗 **Light and dark mode** that follow your phone's setting.
- 🇰🇪 **Kenyan through and through:** flag stripe, Swahili touches, the rules you know.
- 🐳 **Self-hostable:** Docker Compose with automatic HTTPS. No Vercel-only features.

---

## 🇰🇪 What is Kadi?

Kadi is a fast shedding game, close cousin to Crazy Eights and Uno, played with a standard 52-card deck. Everyone starts with four cards. You match the top card by suit or rank, and you must announce **"Niko kadi!"** ("I'm on my last card!") before you go out. Forget to say it, and you can't go out.

The fun lives in the **power cards**:

| Card | Name | What it does |
| :--: | :--- | :--- |
| **2** ♥ | Pick two | Next player draws two, or stacks another 2 on top. |
| **3** ♣ | Pick three | Draw three, or pass the pain along with another 3. |
| **J** ♠ | Skip | The next player sits this turn out. |
| **K** ♦ | Kickback | The order of play reverses. |
| **8 / Q** | Question | Answer with a card of the same suit, or draw. |
| **A** ♠ | Change suit | Call any suit you like. |

> [!TIP]
> House rules vary from family to family. The real game should let each table switch rules on or off.

---

## 🚀 Run it on your computer

**You need**

- [Node.js](https://nodejs.org) 20.9 or newer (22 recommended, see `.nvmrc`). Check with `node -v`.
- [Git](https://git-scm.com), to download the code.

**Steps**

```sh
git clone https://github.com/KinaraGeorge/niko-kadi.git
cd niko-kadi
npm install        # first time only
npm run dev        # starts the website and the game server together
```

You'll see two coloured streams of logs: `[web]` for the website and `[game]` for the game server. Then:

1. Open **http://localhost:3000**.
2. Scroll to **Set the table**, type your name, and tap **Start a table**.
3. Copy the table link, then open it in **another browser window** (a private/incognito window counts as a different player). Add a third window if you like.
4. Back in the first window, tap **Deal** and play against yourself to test.

> [!TIP]
> Each player needs their own browser profile, because your seat is remembered in the browser. Use a normal window plus incognito windows, or different browsers (Chrome, Firefox, Edge).

**Handy scripts**

| Command | What it does |
| :-- | :-- |
| `npm run dev` | Website on port 3000 and game server on port 4000, both reload when you edit |
| `npm test` | Runs the 29 rules-engine tests |
| `npm run smoke` | Three robot players play full games against a running game server |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build of the website and the game server |

---

## 📶 Play with friends on your Wi-Fi

Friends on the same Wi-Fi as your computer can join from their phones while you test.

1. Find your computer's local IP address:
   - **Windows:** `ipconfig` → "IPv4 Address", e.g. `192.168.1.20`
   - **macOS:** `ipconfig getifaddr en0`
   - **Linux:** `hostname -I`
2. Start the servers so other devices can reach them:

   ```sh
   npm run dev:lan
   ```

3. On your phone, open **http://192.168.1.20:3000** (your IP), start a table, and share the link with friends on the same Wi-Fi.

> [!IMPORTANT]
> If phones can't connect, your computer's firewall is probably blocking ports **3000** and **4000**. Allow Node.js through the firewall when your computer asks.

To play with friends who are **not** on your Wi-Fi, deploy it to the VPS (below).

---

## 🎮 How to play

| On screen | What it does |
| :-- | :-- |
| **Your hand** (bottom) | Cards with a green ring can be played now. Tap to select. Tap more cards of the same rank to drop them together. |
| **Play** | Plays the selected cards. Playing an ace opens a sheet to ask for a suit. |
| **Draw** / **Pick N** | Draw one card, or pick up the cards a 2 or 3 is making you take. Tapping the deck does the same. |
| **Niko kadi!** | Call it when everything left in your hand can go out on your next turn. With the default rules, you can't finish without calling it first. |
| **Players** (top) | Each friend's card count. A green ring shows whose turn it is. |

**Default house rules** (the host can change them in the lobby):

- You must call *"Niko kadi!"* before you go out.
- You can't finish on a power card (A, 2, 3, 8, J, Q, K).
- An ace blocks a pick-up.
- 2s and 3s stack on each other.
- Four cards each.

---

## 🐳 Deploying to a VPS

Everything runs with Docker Compose: the website, the game server, and [Caddy](https://caddyserver.com) in front, which gets free HTTPS certificates automatically. HTTPS will also be required for voice chat, because browsers only allow the microphone on secure sites.

**You need** a Linux VPS with Docker installed, and ports 80 and 443 open.

```sh
git clone https://github.com/KinaraGeorge/niko-kadi.git
cd niko-kadi
cp .env.example .env
# Edit .env and set SITE_ADDRESS. With no domain yet, use your IP with dashes plus sslip.io:
#   SITE_ADDRESS=2-25-6-88.sslip.io
docker compose up -d --build
```

Then open `https://<your SITE_ADDRESS>` and share that link. [sslip.io](https://sslip.io) is a free service that turns any IP address into a hostname, so Caddy can get a real certificate without you buying a domain.

<details>
<summary>What each service does</summary>

| Service | Port (inside Docker) | Job |
| :-- | :-- | :-- |
| `caddy` | 80, 443 (public) | HTTPS, sends `/socket.io/*` to the game server and everything else to the website |
| `web` | 3000 | The Next.js website |
| `game` | 4000 | The real-time game server |

Useful commands: `docker compose logs -f game`, `docker compose restart`, `git pull && docker compose up -d --build` to update.

</details>

> [!WARNING]
> Tables live in the game server's memory. Restarting or updating the game server ends any games in progress, so update when nobody is playing.

---

## 🧠 How it works

```text
 phone ──HTTPS──► Caddy ──► web  (Next.js: pages, lobby and table screens)
   │                 └────► game (Socket.IO: tables, dealing, checking every move)
   └──── WebSocket ──┘            │
                                  └─ uses src/game/rules.ts, the same rules code the browser uses
```

- **The server is the dealer.** It shuffles, keeps every hand, checks each move with the rules engine, and sends each player a private view: your own cards, and only a count for everyone else.
- **One rules engine, two places.** `src/game/rules.ts` is plain TypeScript. The server uses it to enforce the rules; the browser uses it to highlight playable cards.
- **Seats survive drops.** Joining gives you a secret seat token, saved in your browser. Reconnecting with it puts you back in the same seat.
- **Tables are temporary.** They live in memory and are cleared after six quiet hours.

More detail, including the voice chat plan, is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🗂 Project structure

```text
niko-kadi/
├── src/
│   ├── app/
│   │   ├── page.tsx               ← landing page
│   │   ├── t/[code]/page.tsx      ← a table: join, lobby, game (the link you share)
│   │   ├── layout.tsx             ← fonts, metadata, phone theme colours
│   │   ├── globals.css            ← design tokens and all styles
│   │   ├── manifest.ts            ← "Add to Home Screen" support
│   │   └── api/health/            ← health check
│   ├── components/
│   │   ├── game/                  ← TableClient, Lobby, GameBoard, PlayingCard, ShareInvite…
│   │   └── *.tsx                  ← landing page sections
│   ├── game/
│   │   ├── rules.ts               ← the Kadi rules engine (no network code)
│   │   ├── rules.test.ts          ← 29 tests, one per rule
│   │   └── protocol.ts            ← messages between browser and server
│   └── lib/socket.ts              ← connects the browser to the game server
├── server/
│   ├── index.ts                   ← Socket.IO game server
│   └── tables.ts                  ← tables, seats, rejoining, house rules
├── scripts/smoke.ts               ← robot players for an end-to-end test
├── design/                        ← original design file and brief
├── docs/ARCHITECTURE.md           ← how it fits together, voice plan, hosting
├── Dockerfile                     ← builds the web and game images
├── compose.yaml                   ← web + game + Caddy
├── Caddyfile                      ← HTTPS and routing
└── .env.example                   ← settings to copy into .env
```

---

## 🧱 Tech choices

| Choice | Why |
| :-- | :-- |
| **Next.js (App Router)** | Fast pre-rendered pages on mobile data, and one project for the site and the game screens. |
| **Socket.IO** | Real-time moves with automatic reconnects, which matters on flaky mobile networks. |
| **Shared TypeScript rules engine** | One source of truth for the rules, fully unit tested. |
| **Plain CSS with tokens** | Keeps the design exact and the download tiny. |
| **`next/font`** | Fonts are bundled at build time, so phones never wait on Google Fonts. |
| **Docker Compose + Caddy** | One command to run everything on a VPS, with automatic HTTPS. |
| **LiveKit, self-hosted** *(next)* | Open-source voice server: push-to-talk, mute, deafen, noise suppression, per-person volume. |

---

## 🎨 Design system

The style is inspired by Rubén Céspedes: oversized chunky type, big rounded shapes, pill buttons and a tilted highlight on the headline, set in a fresh, feel-good green palette.

### Typography

| Role | Font | Weights |
| :--- | :--- | :--- |
| Display and headings | [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) | 500 to 800 |
| Body and UI | [Figtree](https://fonts.google.com/specimen/Figtree) | 400 to 700 |

### Colour tokens

Every colour is a CSS variable, so light and dark mode switch automatically with your system setting.

| Token | ☀️ Light | 🌙 Dark | Used for |
| :--- | :--- | :--- | :--- |
| `--bg` | ![](https://img.shields.io/badge/-%23F1FBEA-F1FBEA?style=flat-square) | ![](https://img.shields.io/badge/-%2308170F-08170F?style=flat-square) | Page background |
| `--surface` | ![](https://img.shields.io/badge/-%23FFFFFF-FFFFFF?style=flat-square) | ![](https://img.shields.io/badge/-%23112A1D-112A1D?style=flat-square) | Cards and panels |
| `--ink` | ![](https://img.shields.io/badge/-%230C2A1B-0C2A1B?style=flat-square) | ![](https://img.shields.io/badge/-%23EAF9E1-EAF9E1?style=flat-square) | Main text |
| `--ink-soft` | ![](https://img.shields.io/badge/-%2342604F-42604F?style=flat-square) | ![](https://img.shields.io/badge/-%239CC2AA-9CC2AA?style=flat-square) | Secondary text |
| `--green` | ![](https://img.shields.io/badge/-%231FB76A-1FB76A?style=flat-square) | ![](https://img.shields.io/badge/-%2337D585-37D585?style=flat-square) | Buttons and accents |
| `--green-deep` | ![](https://img.shields.io/badge/-%230B5D3A-0B5D3A?style=flat-square) | ![](https://img.shields.io/badge/-%238DF0B6-8DF0B6?style=flat-square) | Emphasis, felt table |
| `--lime` | ![](https://img.shields.io/badge/-%23C9F25A-C9F25A?style=flat-square) | ![](https://img.shields.io/badge/-%23C9F25A-C9F25A?style=flat-square) | Headline highlight |
| `--hero` | ![](https://img.shields.io/badge/-%23B9F0A0-B9F0A0?style=flat-square) | ![](https://img.shields.io/badge/-%230F3A25-0F3A25?style=flat-square) | Hero background |
| `--suit-red` | ![](https://img.shields.io/badge/-%23E0352B-E0352B?style=flat-square) | ![](https://img.shields.io/badge/-%23E0352B-E0352B?style=flat-square) | Hearts and diamonds |

### Layout principles

- **Mobile first.** One chunky column on phones, a grid from 720px up.
- **Thumb friendly.** Every tap target is at least 56px tall.
- **Authentically Kenyan.** A thin flag stripe (black, red, white, green) frames the page, and the copy speaks warm Kenyan English with a little Swahili: *Karibu*, *Jumamosi Boys*, *drop it in the group chat*.

---

## 🛠 Troubleshooting

<details>
<summary>"Connecting…" never goes away</summary>

The game server isn't reachable. Make sure `npm run dev` shows a `[game]` line saying it is listening on port 4000. On another device, check the firewall (see [Play with friends on your Wi-Fi](#-play-with-friends-on-your-wi-fi)).

</details>

<details>
<summary>"No table with that code"</summary>

Tables live in memory, so restarting the game server clears them. Start a new table. Also check the code: codes never use the look-alike characters O, 0, I, 1 or L.

</details>

<details>
<summary>Two windows show up as the same player</summary>

Your seat is saved in the browser. Use an incognito window or a different browser for each extra player.

</details>

<details>
<summary>Port 3000 or 4000 is already in use</summary>

Another program is using it. Close it, or start the website on another port with `npx next dev -p 3001` (the game server stays on 4000).

</details>

---

## 🛣 Roadmap

- [x] Landing page design (mobile first, light and dark mode)
- [x] Next.js app with the landing page ported into components
- [x] Rules engine with adjustable house rules, fully tested
- [x] Real-time game server: create table, join by link or code, play
- [x] Phone-first table screen with the *"Niko kadi!"* call
- [x] Reconnect to your seat after a refresh or a dropped connection
- [x] Docker Compose with automatic HTTPS
- [ ] **Deploy to the VPS and play with friends over the internet**
- [ ] Table voice chat: open mic or push-to-talk, noise suppression, mute, deafen, per-person volume
- [ ] Rematch stats, rules explainer page, sounds and animations

---

## 🤝 Contributing

Ideas, house rules from your family's table and bug reports are welcome as [issues](https://github.com/KinaraGeorge/niko-kadi/issues). Before opening a pull request, run `npm test` and `npm run typecheck`.

---

## 📄 License

No license has been chosen yet, so all rights are reserved by default: anyone can view the code, but nobody may reuse it without permission. A license will be picked once the plans for the project (including any paid features) are settled.

---

<div align="center">

Made with ♥️ ♠️ ♦️ ♣️ in Kenya · Free to play, no real money

**Karibu kwa meza.** Pull up a chair.

</div>
