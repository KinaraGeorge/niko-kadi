<div align="center">

# 🃏 Kadi Night

### *Niko kadi!* Invite your friends to a game of Kenyan poker.

A mobile-first landing page for **Kadi**, the card game every Kenyan learned at a family gathering,<br/>
rebuilt for the group chat era.

![Status](https://img.shields.io/badge/status-landing%20page%20live-1FB76A?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-0C2A1B?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-0B5D3A?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-C9F25A?style=for-the-badge&logo=docker&labelColor=0C2A1B)
![Mobile first](https://img.shields.io/badge/mobile-first-0B5D3A?style=for-the-badge)
![License](https://img.shields.io/badge/license-not%20chosen%20yet-42604F?style=for-the-badge)
![Free to play](https://img.shields.io/badge/real%20money-never-E0352B?style=for-the-badge)

[**Design brief**](design/HANDOFF.md) · [**Architecture plan**](docs/ARCHITECTURE.md) · [**Roadmap**](#-roadmap)

</div>

---

## 📖 Table of contents

- [About](#-about)
- [Features](#-features)
- [What is Kadi?](#-what-is-kadi)
- [Quick start](#-quick-start)
- [Deploying to a VPS](#-deploying-to-a-vps)
- [Project structure](#-project-structure)
- [Tech choices](#-tech-choices)
- [Design system](#-design-system)
- [Page walkthrough](#-page-walkthrough)
- [Placeholders and limits](#%EF%B8%8F-placeholders-and-limits)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 About

**Who it's for:** friends and families who grew up playing Kadi and now live in different towns, or just want game night from the sofa.

**Why it exists:** organising a game should be as easy as sending a message. One code in the group chat, and everyone is at the table.

Kadi Night is the front door to an online Kadi game. Right now it is a **Next.js landing page**, ported exactly from the original design. The first big milestone is a link you can share in the group chat so friends can play a real game together, with Discord-style voice chat after that.

The page lets someone:

1. **Name a table** (say, *"Jumamosi Boys"*),
2. **Add friends** and watch them fill seats around a felt table,
3. **Get a short invite code and link** to drop in the group chat,
4. **Learn the power cards** they grew up with.

> [!NOTE]
> The game itself is not built yet. The invite builder works in the browser only, so nothing is saved or sent anywhere. The plan for online play and voice is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## ✨ Features

- 📱 **Mobile first:** built for phones, scales up to a grid on bigger screens.
- 🃏 **Tappable card fan:** five power cards fan out in the hero.
- 🪑 **Live invite builder:** name a table, add friends, watch the seats fill.
- 🔗 **Shareable code and link** with a one-tap copy button.
- 🌗 **Light and dark mode** that follow your system setting.
- 🇰🇪 **Kenyan through and through:** flag stripe, Swahili touches, the rules you know.
- 📲 **Add to Home Screen:** a web app manifest makes it open like an app.
- 🐳 **Self-hostable:** one Docker image, no Vercel-only features, health check built in.
- 🗣 **Coming next:** real-time play, then table voice chat with push-to-talk, noise suppression, mute, deafen and per-person volume.

---

## 🇰🇪 What is Kadi?

Kadi is a fast shedding game, close cousin to Crazy Eights and Uno, played with a standard 52-card deck. Everyone starts with four cards. You match the top card by suit or rank, and you must announce **"Niko kadi!"** ("I'm on my last card!") before you go out. Forget to say it, and you're picking up.

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

## 🚀 Quick start

**Prerequisites**

- [Node.js](https://nodejs.org) 20.9 or newer (22 recommended; there is an `.nvmrc`)
- npm, which comes with Node

**Run it locally**

```sh
git clone https://github.com/KinaraGeorge/niko-kadi.git
cd niko-kadi
npm install
npm run dev
```

Open **http://localhost:3000**. Edits to files in `src/` show up instantly. Use your browser's device toolbar to check the phone layout first, since that is what it is designed for.

**Handy scripts**

| Command | What it does |
| :-- | :-- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript check only |

> [!TIP]
> To test on your phone, run `npm run dev -- -H 0.0.0.0`, then open `http://<your-computer's-IP>:3000` on a phone connected to the same Wi-Fi.

---

## 🐳 Deploying to a VPS

The app ships as a small Docker image that runs anywhere, including the KVM2 VPS it is headed for.

```sh
# on the VPS, inside the cloned repo
cp .env.example .env          # set NEXT_PUBLIC_SITE_URL to your address
docker compose up -d --build  # builds and starts the web app on port 3000
curl http://127.0.0.1:3000/api/health   # → {"ok":true}
```

The container only listens on `127.0.0.1`, so put a reverse proxy such as [Caddy](https://caddyserver.com) in front for HTTPS. HTTPS is required anyway once voice chat lands, because browsers only allow the microphone on secure sites. Until there is a real domain, a free hostname like `<your-ip>.sslip.io` works.

<details>
<summary>Minimal Caddyfile</summary>

```caddy
your-ip.sslip.io {
  reverse_proxy 127.0.0.1:3000
}
```

Caddy fetches and renews the HTTPS certificate on its own.

</details>

---

## 🗂 Project structure

```text
niko-kadi/
├── src/
│   ├── app/
│   │   ├── layout.tsx         ← fonts, page metadata, phone theme colours
│   │   ├── page.tsx           ← the landing page, assembled from sections
│   │   ├── globals.css        ← design tokens and all styles
│   │   ├── manifest.ts        ← "Add to Home Screen" support
│   │   ├── icon.svg           ← the K logo used as favicon and app icon
│   │   └── api/health/        ← health check for Docker and the proxy
│   ├── components/            ← one file per section (Hero, InviteBuilder, PowerCards…)
│   └── lib/                   ← site settings, power-card data, table-code helper
├── design/
│   ├── index.html             ← original single-file design, the visual reference
│   └── HANDOFF.md             ← design brief and decisions to keep
├── docs/ARCHITECTURE.md       ← plan for online play, voice chat and hosting
├── Dockerfile                 ← production image (Next.js standalone)
├── compose.yaml               ← runs it on the VPS, with slots for game and voice servers
└── .env.example               ← settings to copy into .env
```

---

## 🧱 Tech choices

| Choice | Why |
| :-- | :-- |
| **Next.js (App Router)** | Pre-rendered pages load fast on mobile data, and the same project grows into the full app. |
| **TypeScript, strict** | Catches mistakes early, which matters once the rules engine arrives. |
| **Plain CSS with tokens** | Keeps the design pixel-exact and the download tiny. No CSS framework needed. |
| **`next/font`** | Fonts are bundled at build time, so phones never wait on Google Fonts. |
| **Standalone output + Docker** | Runs on any VPS with plain Node. No dependency on Vercel. |
| **Socket.IO game server** *(next)* | Real-time moves with automatic reconnects on flaky networks. |
| **LiveKit, self-hosted** *(later)* | Open-source voice server: push-to-talk, mute, deafen, noise suppression, per-person volume. |

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

## 🧭 Page walkthrough

From top to bottom:

1. **Hero:** the *"Niko kadi!"* headline with a **tappable fan of five power cards**, the page's one bold move.
2. **Invite builder:** name your table, add friends, get a code and link with a copy button, and see six seats fill around a felt table.
3. **Power cards:** the rules grid from the table above.
4. **How a night goes:** three steps. Make a table, send the code, deal and talk.
5. **Call-out banner:** one last *"Niko kadi!"* push to start a game.
6. **Footer:** free to play, no real money, ever.

---

## ⚠️ Placeholders and limits

| What | Status |
| :--- | :--- |
| `kadinight.app` domain | Placeholder. Not a real site yet. |
| `KADI-XXX` invite codes | Generated in the browser for show only. |
| Invite builder | Front end only. No backend, accounts or storage. |
| `NEXT_PUBLIC_SITE_URL` | Defaults to the placeholder. Set it in `.env` on the server. |
| The game itself | Not started. See the roadmap. |

---

## 🛣 Roadmap

- [x] Landing page design (mobile first, light and dark mode)
- [x] Design brief and handoff notes
- [x] Next.js app with the landing page ported into components
- [x] Docker image and compose file for the VPS
- [ ] **Milestone: share a link and play with friends**
  - [ ] Rules engine with adjustable house rules
  - [ ] Real-time game server: create table, join by code, play
  - [ ] In-game table screen for phones, with the *"Niko kadi!"* call
  - [ ] Deploy to the VPS with HTTPS
- [ ] Table voice chat: open mic or push-to-talk, noise suppression, mute, deafen, per-person volume
- [ ] Rules explainer page, rematches and stats

---

## 🤝 Contributing

This project is in its early design stage. Ideas, house rules from your family's table and bug reports are welcome as [issues](https://github.com/KinaraGeorge/niko-kadi/issues).

---

## 📄 License

No license has been chosen yet, so all rights are reserved by default: anyone can view the code, but nobody may reuse it without permission. A license will be picked once the plans for the project (including any paid features) are settled.

---

<div align="center">

Made with ♥️ ♠️ ♦️ ♣️ in Kenya · Free to play, no real money

**Karibu kwa meza.** Pull up a chair.

</div>
