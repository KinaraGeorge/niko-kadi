import { describe, expect, it } from "vitest";
import { chooseMove, shouldCallOutOfTurn, type BotLevel } from "./bot";
import { DEFAULT_RULES, applyMove, currentPlayer, deal, type GameState } from "./rules";

function seeded(seed: number) {
  let x = seed;
  return (n: number) => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x % n;
  };
}

/** Bots play a whole game. Every move they choose must be legal. */
function botGame(levels: BotLevel[], seed: number) {
  const rng = seeded(seed);
  let s: GameState = deal(levels.map((_, i) => ({ id: `b${i}`, name: `Bot ${i}` })), DEFAULT_RULES, rng);
  let moves = 0;
  let illegal = 0;
  while (!s.winnerId && moves < 1500) {
    for (let i = 0; i < levels.length; i++) {
      if (s.players[i] && shouldCallOutOfTurn(s, `b${i}`, levels[i], rng)) {
        const r = applyMove(s, `b${i}`, { type: "declare" }, rng);
        if (r.ok) s = r.state;
      }
    }
    const id = currentPlayer(s).id;
    const level = levels[Number(id.slice(1))];
    const r = applyMove(s, id, chooseMove(s, id, level, rng), rng);
    if (!r.ok) {
      illegal++;
      s = (applyMove(s, id, { type: "draw" }, rng) as { ok: true; state: GameState }).state;
    } else s = r.state;
    moves++;
  }
  return { s, moves, illegal };
}

describe("computer players", () => {
  it("normal bots finish games and only make legal moves", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { s, illegal } = botGame(["normal", "normal", "normal"], seed);
      expect(illegal).toBe(0);
      expect(s.winnerId).not.toBeNull();
    }
  });

  it("easy bots finish games and only make legal moves", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { s, illegal } = botGame(["easy", "easy"], seed);
      expect(illegal).toBe(0);
      expect(s.winnerId).not.toBeNull();
    }
  });

  it("normal beats easy more often than not", () => {
    let normalWins = 0;
    const games = 300;
    for (let seed = 1; seed <= games; seed++) {
      const { s } = botGame(seed % 2 ? ["normal", "easy"] : ["easy", "normal"], seed);
      const winnerLevel = (seed % 2 ? ["normal", "easy"] : ["easy", "normal"])[Number(s.winnerId!.slice(1))];
      if (winnerLevel === "normal") normalWins++;
    }
    expect(normalWins / games).toBeGreaterThan(0.58);
  });
});
