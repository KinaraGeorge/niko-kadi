# Kadi Night: handoff for Claude Code

## Original request (user, verbatim)
"Design (pro design) a mobile first website that is refreshing with feel good green a pallete style is Ruben Cespedes ux/ux kind of with typography he would use. Find ways to make it authentic the site is about inviting your friends for an online game of poker (Kenyan poker). You not developing the game just a landing page just want to see your design UI/UX skill"

Later the user said they want to build the whole project with Claude Code on their desktop, starting from this design.

## What exists
- `design/index.html`: single-file landing page, the visual reference. Open it in a browser. It was also published as a Claude artifact: https://claude.ai/artifact/T5YwWshJfgzW3Vvob7dci5
- This is the Kadi Night repo (`niko-kadi` on GitHub). The design was first drafted in the unrelated `monty` repo and moved here.

## Design decisions to keep
- **Name:** Kadi Night. Headline: "Niko kadi!" (the call Kenyan players make on their last card). Tone: warm, Kenyan English with light Swahili ("Karibu", "Jumamosi Boys", "drop it in the group chat").
- **Mobile first:** one chunky column on phones, 56px touch targets, grid from 720px up.
- **Style:** Rubén Céspedes-inspired (interpreted from memory): oversized chunky display type, big rounded shapes, pill buttons, a tilted highlight on the headline.
- **Fonts (Google Fonts):** Bricolage Grotesque (display, 500-800) and Figtree (body).
- **Tokens (light):** bg #F1FBEA, surface #FFFFFF, ink #0C2A1B, ink-soft #42604F, green #1FB76A, green-deep #0B5D3A, lime #C9F25A, line #D3EBC6, hero #B9F0A0, suit-red #E0352B.
- **Tokens (dark):** bg #08170F, surface #112A1D, ink #EAF9E1, ink-soft #9CC2AA, green #37D585, green-deep #8DF0B6, line #1D4230, hero #0F3A25. Follows prefers-color-scheme and data-theme.
- **Authentic details:** a thin Kenyan flag stripe (black, red, white, green) top and bottom; power cards; "Niko kadi!" call-out banner.
- **One bold move:** a tappable fan of five power cards in the hero.
- **Sections:** hero, invite builder (table name, add friends, generated code and link, copy button, six seats around a felt table), power cards grid, "how a night goes" (3 steps), call-out banner, footer.
- **Power cards shown (confirm house rules with the user):** 2 pick two, 3 pick three, J skip, K kickback (reverse), 8 and Q questions (answer same suit or draw), A change suit. Rules vary by family, so tables should be able to adjust them.
- **Safety:** free to play, no real money. Keep that stated.

## Placeholders to replace
- `kadinight.app` domain and the generated codes (KADI-XXX) are fake.
- The invite builder is a front-end preview only. There is no backend.

## Suggested next steps
1. New repo, chosen stack (ask the user: plain HTML, Next.js, or other), port `design/index.html` into components, keep tokens as CSS variables.
2. Real create-table and join-by-code flow.
3. Realtime backend (WebSockets) for the actual game, deck and power-card rules engine, "niko kadi" call mechanic.
4. Rules explainer page and an in-game table screen mock.

## Prompt to paste into Claude Code
> Read design/HANDOFF.md and design/index.html. Build Kadi Night as a real project in this repo, keeping the visual design exactly (palette, fonts, flag stripe, card fan, invite builder). First ask me which stack I want, then port the landing page into components, then we plan the multiplayer game.
