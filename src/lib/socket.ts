"use client";

import { io, type Socket } from "socket.io-client";
import type { ClientToServer, ServerToClient } from "@/game/protocol";

export type GameSocket = Socket<ServerToClient, ClientToServer>;

/**
 * Where the game server lives:
 * - NEXT_PUBLIC_GAME_URL if set,
 * - in development, port 4000 on whatever host served the page (works for phones on your Wi-Fi too),
 * - in production, the same address as the site (the reverse proxy forwards /socket.io).
 */
function gameUrl(): string | undefined {
  if (process.env.NEXT_PUBLIC_GAME_URL) return process.env.NEXT_PUBLIC_GAME_URL;
  if (process.env.NODE_ENV === "development") return `${location.protocol}//${location.hostname}:4000`;
  return undefined;
}

let shared: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!shared) shared = io(gameUrl() ?? "", { transports: ["websocket", "polling"], autoConnect: true });
  return shared;
}

export function emit<T extends object = object>(
  run: (s: GameSocket, ack: (r: ({ ok: true } & T) | { ok: false; error: string }) => void) => void,
  timeoutMs = 8000,
): Promise<({ ok: true } & T) | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve({ ok: false, error: "The game server didn't answer. Check your connection." }), timeoutMs);
    run(getSocket(), (r) => {
      clearTimeout(t);
      resolve(r);
    });
  });
}

const tokenKey = (code: string) => `kadi:seat:${code}`;
export const savedToken = (code: string) => (typeof localStorage === "undefined" ? null : localStorage.getItem(tokenKey(code)));
export const saveToken = (code: string, token: string) => localStorage.setItem(tokenKey(code), token);
export const forgetToken = (code: string) => localStorage.removeItem(tokenKey(code));
export const savedName = () => (typeof localStorage === "undefined" ? "" : localStorage.getItem("kadi:name") ?? "");
export const saveName = (name: string) => localStorage.setItem("kadi:name", name);
