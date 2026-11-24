/**
 * In-memory tables. A table is a lobby of seats plus, while playing, a game state.
 * Seats are identified by a secret token kept in the player's browser, so a refresh
 * or a dropped connection puts them straight back in their seat.
 */
import { randomBytes, randomInt } from "node:crypto";
import { BOT_NAMES, type BotLevel } from "../src/game/bot";
import {
  DEFAULT_RULES,
  applyMove,
  deal,
  removePlayer,
  viewFor,
  type GameState,
  type HouseRules,
  type Move,
} from "../src/game/rules";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  MAX_SEATS,
  NAME_MAX,
  TABLE_NAME_MAX,
  cleanName,
  type TableSnapshot,
  type TableStatus,
} from "../src/game/protocol";

export interface Seat {
  id: string;
  token: string;
  name: string;
  sockets: Set<string>;
  wins: number;
  bot?: BotLevel;
}

export interface Table {
  code: string;
  name: string;
  hostId: string;
  seats: Seat[];
  status: TableStatus;
  rules: HouseRules;
  game: GameState | null;
  lastActive: number;
}

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const rng = (n: number) => randomInt(n);
const newId = () => randomBytes(6).toString("base64url");
const newToken = () => randomBytes(18).toString("base64url");

export class TableStore {
  private tables = new Map<string, Table>();

  get(code: string) {
    return this.tables.get(code);
  }

  get size() {
    return this.tables.size;
  }

  private newCode(): string {
    for (;;) {
      let c = "";
      for (let i = 0; i < CODE_LENGTH; i++) c += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
      if (!this.tables.has(c)) return c;
    }
  }

  create(tableName: string, name: string): Result<{ table: Table; seat: Seat }> {
    const n = cleanName(name, NAME_MAX);
    if (!n) return { ok: false, error: "Add your name first." };
    const seat: Seat = { id: newId(), token: newToken(), name: n, sockets: new Set(), wins: 0 };
    const table: Table = {
      code: this.newCode(),
      name: cleanName(tableName, TABLE_NAME_MAX) || `${n}'s table`,
      hostId: seat.id,
      seats: [seat],
      status: "lobby",
      rules: { ...DEFAULT_RULES },
      game: null,
      lastActive: Date.now(),
    };
    this.tables.set(table.code, table);
    return { ok: true, table, seat };
  }

  /** Rejoin with a token, or take a new seat with a name. */
  join(code: string, name?: string, token?: string): Result<{ table: Table; seat: Seat }> {
    const table = this.tables.get(code);
    if (!table) return { ok: false, error: "No table with that code. Check it and try again." };
    if (token) {
      const seat = table.seats.find((s) => s.token === token);
      if (seat) return { ok: true, table, seat };
    }
    const n = cleanName(name, NAME_MAX);
    if (!n) return { ok: false, error: "NEED_NAME" };
    if (table.seats.length >= MAX_SEATS) return { ok: false, error: `This table is full (${MAX_SEATS} seats).` };
    let unique = n;
    for (let i = 2; table.seats.some((s) => s.name.toLowerCase() === unique.toLowerCase()); i++) unique = `${n} ${i}`;
    const seat: Seat = { id: newId(), token: newToken(), name: unique, sockets: new Set(), wins: 0 };
    table.seats.push(seat);
    table.lastActive = Date.now();
    return { ok: true, table, seat };
  }

  addBot(table: Table, seatId: string, level: BotLevel): Result<{ seat: Seat }> {
    if (seatId !== table.hostId) return { ok: false, error: "Only the host can add computer players." };
    if (table.status === "playing") return { ok: false, error: "Add computer players between games." };
    if (table.seats.length >= MAX_SEATS) return { ok: false, error: `The table is full (${MAX_SEATS} seats).` };
    if (level !== "easy" && level !== "normal") return { ok: false, error: "Pick easy or normal." };
    const taken = new Set(table.seats.map((s) => s.name.toLowerCase()));
    const free = BOT_NAMES.filter((n) => !taken.has(n.toLowerCase()));
    const name = free.length ? free[randomInt(free.length)] : `Bot ${table.seats.length + 1}`;
    const seat: Seat = { id: newId(), token: newToken(), name, sockets: new Set(), wins: 0, bot: level };
    table.seats.push(seat);
    table.lastActive = Date.now();
    return { ok: true, seat };
  }

  setRules(table: Table, seatId: string, patch: Partial<HouseRules>): Result {
    if (seatId !== table.hostId) return { ok: false, error: "Only the host can change house rules." };
    if (table.status === "playing") return { ok: false, error: "Change rules between games." };
    const r = { ...table.rules };
    for (const key of ["crossStackPenalties", "aceBlocksPenalty", "noFinishOnPower", "requireNikoKadi"] as const) {
      if (typeof patch[key] === "boolean") r[key] = patch[key];
    }
    if (typeof patch.startHand === "number" && [3, 4, 5, 6, 7].includes(patch.startHand)) r.startHand = patch.startHand;
    table.rules = r;
    return { ok: true };
  }

  start(table: Table, seatId: string): Result {
    if (seatId !== table.hostId) return { ok: false, error: "Only the host can deal." };
    if (table.status === "playing") return { ok: false, error: "A game is already running." };
    if (table.seats.length < 2) return { ok: false, error: "You need at least one friend to play. Share the link!" };
    table.game = deal(
      table.seats.map((s) => ({ id: s.id, name: s.name })),
      table.rules,
      rng,
    );
    table.status = "playing";
    table.lastActive = Date.now();
    return { ok: true };
  }

  move(table: Table, seatId: string, move: Move): Result {
    if (!table.game || table.status !== "playing") return { ok: false, error: "No game is running." };
    const r = applyMove(table.game, seatId, move, rng);
    if (!r.ok) return r;
    table.game = r.state;
    table.lastActive = Date.now();
    if (r.state.winnerId) {
      table.status = "finished";
      const w = table.seats.find((s) => s.id === r.state.winnerId);
      if (w) w.wins++;
    }
    return { ok: true };
  }

  /** Remove a seat. The host can remove anyone; anyone can remove themselves. */
  remove(table: Table, bySeatId: string, seatId: string): Result<{ removed?: Seat }> {
    if (bySeatId !== seatId && bySeatId !== table.hostId) return { ok: false, error: "Only the host can remove players." };
    const idx = table.seats.findIndex((s) => s.id === seatId);
    if (idx < 0) return { ok: false, error: "That player already left." };
    const [removed] = table.seats.splice(idx, 1);
    if (table.game && table.game.players.some((p) => p.id === seatId)) {
      table.game = removePlayer(table.game, seatId);
      if (table.game.winnerId && table.status === "playing") table.status = "finished";
    }
    if (!table.seats.some((s) => !s.bot)) {
      // Only computer players left: close the table.
      table.seats = [];
      this.tables.delete(table.code);
    } else if (table.hostId === seatId) {
      const humans = table.seats.filter((s) => !s.bot);
      table.hostId = (humans.find((s) => s.sockets.size > 0) ?? humans[0]).id;
    }
    table.lastActive = Date.now();
    return { ok: true, removed };
  }

  snapshot(table: Table, seatId: string): TableSnapshot {
    const inGame = new Set(table.game?.players.map((p) => p.id) ?? []);
    return {
      code: table.code,
      name: table.name,
      status: table.status,
      seats: table.seats.map((s) => ({
        id: s.id,
        name: s.name,
        connected: !!s.bot || s.sockets.size > 0,
        host: s.id === table.hostId,
        waiting: table.status === "playing" && !inGame.has(s.id),
        wins: s.wins,
        ...(s.bot ? { bot: s.bot } : {}),
      })),
      rules: table.rules,
      youId: seatId,
      game: table.game ? viewFor(table.game, seatId) : null,
    };
  }

  /** Forget tables nobody has touched for a while. */
  sweep(maxIdleMs: number) {
    const now = Date.now();
    for (const [code, t] of this.tables) {
      const anyoneHere = t.seats.some((s) => !s.bot && s.sockets.size > 0);
      if (!anyoneHere && now - t.lastActive > maxIdleMs) this.tables.delete(code);
    }
  }
}
