# syntax=docker/dockerfile:1
# One Dockerfile, two images:
#   docker build --target web  .   → the Next.js site
#   docker build --target game .   → the real-time game server
# compose.yaml builds both for you.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── web: Next.js standalone server ──
FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S kadi && adduser -S kadi -G kadi
COPY --from=build --chown=kadi:kadi /app/.next/standalone ./
COPY --from=build --chown=kadi:kadi /app/.next/static ./.next/static
COPY --from=build --chown=kadi:kadi /app/public ./public
USER kadi
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]

# ── game: Socket.IO game server (one bundled file) ──
FROM node:22-alpine AS game
WORKDIR /app
ENV NODE_ENV=production GAME_PORT=4000
RUN addgroup -S kadi && adduser -S kadi -G kadi
COPY --from=build --chown=kadi:kadi /app/dist/game-server.mjs ./
USER kadi
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "game-server.mjs"]
