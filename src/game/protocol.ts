/**
 * Messages between the browser and the game server.
 * Shared by both sides so a typo becomes a type error, not a silent bug.
 */
import type { Card, HouseRules, PlayerView, Suit } from "./rules";

export const MAX_SEATS = 6;
export const NAME_MAX = 14;
export const TABLE_NAME_MAX = 22;
/** No 0/O or 1/I/L, so codes are easy to read out loud. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 4;

export type TableStatus = "lobby" | "playing" | "finished";

export interface SeatInfo {
  id: string;
  name: string;
  connected: boolean;
  host: boolean;
  /** Joined while a game was running; plays from the next round. */
  waiting: boolean;
  wins: number;
}

export interface TableSnapshot {
  code: string;
  name: string;
  status: TableStatus;
  seats: SeatInfo[];
  rules: HouseRules;
  youId: string;
  game: PlayerView | null;
}

export type Ack<T = object> = (res: ({ ok: true } & T) | { ok: false; error: string }) => void;

export interface ClientToServer {
  "table:create": (p: { tableName: string; name: string }, ack: Ack<{ code: string; token: string }>) => void;
  "table:join": (p: { code: string; name?: string; token?: string }, ack: Ack<{ token: string }>) => void;
  "table:rules": (p: Partial<HouseRules>, ack: Ack) => void;
  "table:start": (ack: Ack) => void;
  "table:kick": (p: { seatId: string }, ack: Ack) => void;
  "table:leave": (ack: Ack) => void;
  "game:play": (p: { cards: Card[]; suit?: Suit; declare?: boolean }, ack: Ack) => void;
  "game:draw": (ack: Ack) => void;
  "game:declare": (ack: Ack) => void;
  "table:check": (p: { code: string }, ack: Ack<{ name: string; seats: number; status: TableStatus }>) => void;
}

export interface ServerToClient {
  "table:state": (s: TableSnapshot) => void;
  "table:kicked": () => void;
}

export function normaliseCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/^KADI-?/, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH);
}

export function cleanName(input: unknown, max: number): string {
  return String(input ?? "")
    .replace(/[\u0000-\u001f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
