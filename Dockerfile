# syntax=docker/dockerfile:1
# Multi-stage build for the Kadi Night web app.
# Produces a small image that runs Next.js "standalone" output with plain Node.

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

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S kadi && adduser -S kadi -G kadi
COPY --from=build --chown=kadi:kadi /app/.next/standalone ./
COPY --from=build --chown=kadi:kadi /app/.next/static ./.next/static
COPY --from=build --chown=kadi:kadi /app/public ./public
USER kadi
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
