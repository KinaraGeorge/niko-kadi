/**
 * Kadi Night game server.
 *
 * A small Socket.IO server that owns every table and game. Browsers send moves;
 * the server checks them with the shared rules engine and sends each player
 * only what they are allowed to see (their own hand, everyone else's card count).
 */
import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import type { ClientToServer, ServerToClient } from "../src/game/protocol";
import { normaliseCode } from "../src/game/protocol";
import { chooseMove, shouldCallOutOfTurn } from "../src/game/bot";
import { currentPlayer, type Move, type Suit } from "../src/game/rules";
import { TableStore, type Result, type Table } from "./tables";

const PORT = Number(process.env.GAME_PORT ?? process.env.PORT ?? 4000);
const HOST = process.env.GAME_HOST ?? "0.0.0.0";
// Comma-separated list of allowed browser origins. Same-origin requests through the
// reverse proxy need nothing here; local dev on another port needs "*" or the URL.
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? (process.env.NODE_ENV === "production" ? "" : "*"))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const IDLE_MS = 6 * 60 * 60 * 1000; // forget empty tables after 6 hours

type Data = { code?: string; seatId?: string; bucket: number; last: number };
type KadiSocket = Socket<ClientToServer, ServerToClient, Record<string, never>, Data>;

const store = new TableStore();

const http = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, tables: store.size }));
    return;
  }
  res.writeHead(404).end();
});

const io = new Server<ClientToServer, ServerToClient, Record<string, never>, Data>(http, {
  cors: ORIGINS.length ? { origin: ORIGINS.includes("*") ? true : ORIGINS } : undefined,
  pingInterval: 10_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 10_000,
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
});

/** Send every seat at the table its own private view, then let computer players react. */
function broadcast(table: Table) {
  for (const seat of table.seats) {
    if (seat.bot) continue;
    const snap = store.snapshot(table, seat.id);
    for (const sid of seat.sockets) io.to(sid).emit("table:state", snap);
  }
  scheduleBots(table);
}

const botTimers = new Map<string, NodeJS.Timeout>();
const BOT_THINK_MS = Number(process.env.BOT_THINK_MS ?? 1100);

/**
 * Computer players: call "Niko kadi!" when they can, and take their turn after a short,
 * human-feeling pause so people can follow what happened.
 */
function scheduleBots(table: Table) {
  const game = table.game;
  if (!game || table.status !== "playing" || game.winnerId || botTimers.has(table.code)) return;
  for (const seat of table.seats) {
    if (seat.bot && store.get(table.code) === table && shouldCallOutOfTurn(game, seat.id, seat.bot)) {
      if (store.move(table, seat.id, { type: "declare" }).ok) return broadcast(table);
    }
  }
  const turnSeat = table.seats.find((s) => s.id === currentPlayer(game).id);
  if (!turnSeat?.bot) return;
  const level = turnSeat.bot;
  const delay = BOT_THINK_MS * (0.7 + Math.random() * 0.6);
  botTimers.set(
    table.code,
    setTimeout(() => {
      botTimers.delete(table.code);
      const g = table.game;
      if (!g || table.status !== "playing" || store.get(table.code) !== table) return;
      if (currentPlayer(g).id !== turnSeat.id) return scheduleBots(table);
      const r = store.move(table, turnSeat.id, chooseMove(g, turnSeat.id, level));
      if (!r.ok) store.move(table, turnSeat.id, { type: "draw" });
      broadcast(table);
    }, delay),
  );
}

/** Simple flood protection: about 10 messages a second per connection. */
function allowed(socket: KadiSocket): boolean {
  const now = Date.now();
  const d = socket.data;
  d.bucket = Math.min(20, d.bucket + ((now - d.last) / 1000) * 10);
  d.last = now;
  if (d.bucket < 1) return false;
  d.bucket -= 1;
  return true;
}

function safeAck<T extends object>(ack: unknown): (r: Result<T>) => void {
  return typeof ack === "function" ? (ack as (r: Result<T>) => void) : () => {};
}

function seated(socket: KadiSocket): { table: Table; seatId: string } | null {
  const { code, seatId } = socket.data;
  if (!code || !seatId) return null;
  const table = store.get(code);
  if (!table || !table.seats.some((s) => s.id === seatId)) return null;
  return { table, seatId };
}

function leaveCurrent(socket: KadiSocket) {
  const cur = seated(socket);
  if (!cur) return;
  const seat = cur.table.seats.find((s) => s.id === cur.seatId);
  seat?.sockets.delete(socket.id);
  socket.data.code = undefined;
  socket.data.seatId = undefined;
  broadcast(cur.table);
}

function sit(socket: KadiSocket, table: Table, seatId: string) {
  if (socket.data.code !== table.code || socket.data.seatId !== seatId) leaveCurrent(socket);
  table.seats.find((s) => s.id === seatId)?.sockets.add(socket.id);
  socket.data.code = table.code;
  socket.data.seatId = seatId;
  broadcast(table);
}

io.on("connection", (raw) => {
  const socket = raw as KadiSocket;
  socket.data.bucket = 20;
  socket.data.last = Date.now();

  /** Wrap a handler: rate limit, catch errors, always answer. */
  function on<A extends unknown[]>(
    event: keyof ClientToServer,
    fn: (ack: (r: Result) => void, ...args: A) => void,
  ) {
    socket.on(event, ((...all: unknown[]) => {
      const ack = safeAck(all[all.length - 1]);
      const args = all.slice(0, -1) as A;
      if (!allowed(socket)) return ack({ ok: false, error: "Slow down a little." });
      try {
        fn(ack, ...args);
      } catch (err) {
        console.error(`[${event}]`, err);
        ack({ ok: false, error: "Something went wrong. Try again." });
      }
    }) as never);
  }

  on("table:check", (ack, p: { code?: string }) => {
    const t = store.get(normaliseCode(String(p?.code ?? "")));
    if (!t) return ack({ ok: false, error: "No table with that code." });
    (ack as (r: Result<object>) => void)({ ok: true, name: t.name, seats: t.seats.length, status: t.status } as never);
  });

  on("table:create", (ack, p: { tableName?: string; name?: string }) => {
    const r = store.create(String(p?.tableName ?? ""), String(p?.name ?? ""));
    if (!r.ok) return ack(r);
    sit(socket, r.table, r.seat.id);
    ack({ ok: true, code: r.table.code, token: r.seat.token } as never);
  });

  on("table:join", (ack, p: { code?: string; name?: string; token?: string }) => {
    const code = normaliseCode(String(p?.code ?? ""));
    const r = store.join(code, p?.name, typeof p?.token === "string" ? p.token : undefined);
    if (!r.ok) return ack(r);
    sit(socket, r.table, r.seat.id);
    ack({ ok: true, token: r.seat.token } as never);
  });

  on("table:rules", (ack, patch: object) => {
    const cur = seated(socket);
    if (!cur) return ack({ ok: false, error: "Join a table first." });
    const r = store.setRules(cur.table, cur.seatId, (patch ?? {}) as never);
    if (r.ok) broadcast(cur.table);
    ack(r);
  });

  on("table:start", (ack) => {
    const cur = seated(socket);
    if (!cur) return ack({ ok: false, error: "Join a table first." });
    const r = store.start(cur.table, cur.seatId);
    if (r.ok) broadcast(cur.table);
    ack(r);
  });

  on("table:addBot", (ack, p: { level?: unknown }) => {
    const cur = seated(socket);
    if (!cur) return ack({ ok: false, error: "Join a table first." });
    const r = store.addBot(cur.table, cur.seatId, p?.level === "easy" ? "easy" : "normal");
    if (r.ok) broadcast(cur.table);
    ack(r.ok ? { ok: true } : r);
  });

  on("table:kick", (ack, p: { seatId?: string }) => {
    const cur = seated(socket);
    if (!cur) return ack({ ok: false, error: "Join a table first." });
    const r = store.remove(cur.table, cur.seatId, String(p?.seatId ?? ""));
    if (r.ok && r.removed) {
      for (const sid of r.removed.sockets) {
        io.to(sid).emit("table:kicked");
        const s = io.sockets.sockets.get(sid) as KadiSocket | undefined;
        if (s) s.data.code = s.data.seatId = undefined;
      }
      broadcast(cur.table);
    }
    ack({ ok: r.ok, ...(r.ok ? {} : { error: r.error }) } as Result);
  });

  on("table:leave", (ack) => {
    const cur = seated(socket);
    if (!cur) return ack({ ok: true });
    const r = store.remove(cur.table, cur.seatId, cur.seatId);
    socket.data.code = socket.data.seatId = undefined;
    if (r.ok) broadcast(cur.table);
    ack({ ok: true });
  });

  const gameMove = (move: Move) => (ack: (r: Result) => void) => {
    const cur = seated(socket);
    if (!cur) return ack({ ok: false, error: "Join a table first." });
    const r = store.move(cur.table, cur.seatId, move);
    if (r.ok) broadcast(cur.table);
    ack(r);
  };

  on("game:play", (ack, p: { cards?: unknown; suit?: unknown; declare?: unknown }) => {
    const cards = Array.isArray(p?.cards) ? p.cards.filter((c): c is string => typeof c === "string").slice(0, 8) : [];
    const suit = typeof p?.suit === "string" ? (p.suit as Suit) : undefined;
    gameMove({ type: "play", cards, suit, declare: p?.declare === true })(ack);
  });
  on("game:draw", (ack) => gameMove({ type: "draw" })(ack));
  on("game:declare", (ack) => gameMove({ type: "declare" })(ack));

  socket.on("disconnect", () => leaveCurrent(socket));
});

setInterval(() => store.sweep(IDLE_MS), 10 * 60 * 1000).unref();

http.listen(PORT, HOST, () => {
  console.log(`Kadi Night game server listening on http://${HOST}:${PORT}`);
});

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    io.close();
    process.exit(0);
  });
}
