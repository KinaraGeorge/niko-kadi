/**
 * End-to-end smoke test: three bots create and join a table on a running game
 * server, then play full games until someone wins.
 *
 *   npm run dev:game              (in one terminal)
 *   npm run smoke                 (in another; GAME_URL defaults to http://localhost:4000)
 */
import { io, type Socket } from "socket.io-client";
import type { ClientToServer, ServerToClient, TableSnapshot } from "../src/game/protocol";
import { canFinishInOneTurn, rankOf, SUITS, suitOf, type Card } from "../src/game/rules";

const URL = process.env.GAME_URL ?? "http://localhost:4000";
const GAMES = Number(process.env.GAMES ?? 3);
type S = Socket<ServerToClient, ClientToServer>;

function bot(name: string) {
  const socket: S = io(URL, { transports: ["websocket"] });
  let latest: TableSnapshot | null = null;
  socket.on("table:state", (s) => (latest = s));
  const call = <T>(fn: (ack: (r: T) => void) => void) => new Promise<T>((res) => fn(res));
  return { name, socket, call, state: () => latest };
}

async function main() {
  const [a, b, c] = [bot("Wanjiru"), bot("Otieno"), bot("Akinyi")];
  const created = await a.call<any>((ack) => a.socket.emit("table:create", { tableName: "Smoke test", name: a.name }, ack));
  if (!created.ok) throw new Error(created.error);
  console.log(`Table KADI-${created.code} created`);
  for (const p of [b, c]) {
    const r = await p.call<any>((ack) => p.socket.emit("table:join", { code: created.code, name: p.name }, ack));
    if (!r.ok) throw new Error(r.error);
  }
  // Rejoin with the token, like a page refresh.
  const again = await a.call<any>((ack) => a.socket.emit("table:join", { code: created.code, token: created.token }, ack));
  if (!again.ok) throw new Error("rejoin failed");

  const bots = [a, b, c];
  for (let g = 1; g <= GAMES; g++) {
    const started = await a.call<any>((ack) => a.socket.emit("table:start", ack));
    if (!started.ok) throw new Error(started.error);
    await new Promise((r) => setTimeout(r, 50));
    let moves = 0;
    for (;;) {
      const view = a.state()?.game;
      if (!view) throw new Error("no game view");
      if (view.winnerId) {
        const winner = view.players.find((p) => p.id === view.winnerId)!;
        console.log(`Game ${g}: ${winner.name} won after ${moves} moves`);
        break;
      }
      if (moves++ > 2000) throw new Error("game did not finish");
      const p = bots.find((x) => x.state()?.youId === view.turnId)!;
      const me = p.state()!.game!;
      const hand = me.you.hand;
      let res: any;
      if (!me.you.declared && canFinishInOneTurn(hand)) {
        await p.call<any>((ack) => p.socket.emit("game:declare", ack));
      }
      const lead = me.playable[0] as Card | undefined;
      if (lead) {
        const cards = [lead, ...hand.filter((c) => c !== lead && rankOf(c) === rankOf(lead))];
        const suit = SUITS.find((s) => hand.some((c) => suitOf(c) === s && c !== lead)) ?? "S";
        res = await p.call<any>((ack) => p.socket.emit("game:play", { cards, suit }, ack));
        if (!res.ok) res = await p.call<any>((ack) => p.socket.emit("game:play", { cards: [lead], suit }, ack));
      }
      if (!res?.ok) res = await p.call<any>((ack) => p.socket.emit("game:draw", ack));
      if (!res.ok) throw new Error(`${p.name}: ${res.error}`);
      await new Promise((r) => setTimeout(r, 120)); // stay under the server's flood limit
    }
  }
  const seats = a.state()!.seats.map((s) => `${s.name} ${s.wins}`).join(", ");
  console.log(`Wins: ${seats}`);
  bots.forEach((x) => x.socket.close());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
