<div align="center">

# 🃏 Kadi Night

### *Niko kadi!* Invite your friends to a game of Kenyan poker.

A mobile-first landing page for **Kadi**, the card game every Kenyan learned at a family gathering,<br/>
rebuilt for the group chat era.

![Status](https://img.shields.io/badge/status-design%20prototype-1FB76A?style=for-the-badge)
![Mobile first](https://img.shields.io/badge/mobile-first-0B5D3A?style=for-the-badge)
![No build step](https://img.shields.io/badge/build-none%20needed-C9F25A?style=for-the-badge&labelColor=0C2A1B)
![License](https://img.shields.io/badge/license-not%20chosen%20yet-42604F?style=for-the-badge)
![Free to play](https://img.shields.io/badge/real%20money-never-E0352B?style=for-the-badge)

[**Live design preview**](https://claude.ai/artifact/T5YwWshJfgzW3Vvob7dci5) · [**Design brief**](design/HANDOFF.md) · [**Roadmap**](#-roadmap)

</div>

---

## 📖 Table of contents

- [About](#-about)
- [Features](#-features)
- [What is Kadi?](#-what-is-kadi)
- [Quick start](#-quick-start)
- [Project structure](#-project-structure)
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

Kadi Night is the front door to an online Kadi game. Right now it is a **design prototype**: one polished landing page that shows how the product should look, feel and speak before any game code is written.

The page lets someone:

1. **Name a table** (say, *"Jumamosi Boys"*),
2. **Add friends** and watch them fill seats around a felt table,
3. **Get a short invite code and link** to drop in the group chat,
4. **Learn the power cards** they grew up with.

> [!NOTE]
> The game itself is not built yet. The invite builder works in the browser only, so nothing is saved or sent anywhere.

---

## ✨ Features

- 📱 **Mobile first:** built for phones, scales up to a grid on bigger screens.
- 🃏 **Tappable card fan:** five power cards fan out in the hero.
- 🪑 **Live invite builder:** name a table, add friends, watch the seats fill.
- 🔗 **Shareable code and link** with a one-tap copy button.
- 🌗 **Light and dark mode** that follow your system setting.
- 🇰🇪 **Kenyan through and through:** flag stripe, Swahili touches, the rules you know.
- ⚡ **Zero setup:** one HTML file, no build tools, no dependencies.

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

There is nothing to install. The whole page is a single HTML file.

**Prerequisites:** a web browser. Git is optional, and Python 3 only if you want option 2.

**Option 1: just open it**

```sh
git clone https://github.com/KinaraGeorge/niko-kadi.git
cd niko-kadi
open design/index.html        # macOS
xdg-open design/index.html    # Linux
start design/index.html       # Windows
```

**Option 2: serve it locally** (closer to how it will run online)

```sh
python3 -m http.server -d design 8000
```

Then visit **http://localhost:8000**. Use your browser's device toolbar to see it on a phone-sized screen first, since that is what it was designed for.

---

## 🗂 Project structure

```text
niko-kadi/
├── README.md            ← you are here
└── design/
    ├── index.html       ← the landing page: HTML, CSS and JS in one file
    └── HANDOFF.md       ← full design brief and decisions to keep
```

| File | Purpose |
| :--- | :--- |
| [`design/index.html`](design/index.html) | The visual source of truth. Every colour, font and section the final app should match. |
| [`design/HANDOFF.md`](design/HANDOFF.md) | Why things look the way they do, the placeholders to swap out, and a ready-made prompt to continue the build with Claude Code. |

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
| The game itself | Not started. See the roadmap. |

---

## 🛣 Roadmap

- [x] Landing page design (mobile first, light and dark mode)
- [x] Design brief and handoff notes
- [ ] Choose a stack (plain HTML, Next.js or other) and port the page into components
- [ ] Real "create table" and "join by code" flow
- [ ] Realtime multiplayer backend (WebSockets)
- [ ] Deck and power-card rules engine with adjustable house rules
- [ ] The *"Niko kadi!"* call mechanic
- [ ] Rules explainer page and in-game table screen

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
