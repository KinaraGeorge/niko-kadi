import { describe, expect, it } from "vitest";
import {
  DEFAULT_RULES,
  applyMove,
  canFinishInOneTurn,
  deal,
  isPower,
  newDeck,
  playableCards,
  removePlayer,
  viewFor,
  type GameState,
  type Move,
} from "./rules";

/** Build a hand-crafted state so each rule can be tested on its own. */
function state(over: Partial<GameState> & { hands: string[][] }): GameState {
  const { hands, ...rest } = over;
  return {
    players: hands.map((hand, i) => ({ id: `p${i}`, name: `P${i}`, hand, declared: false, declaredAt: -1 })),
    deck: ["4C", "5C", "6C", "7C", "9C", "10C", "4D", "5D", "6D", "7D"],
    discard: ["5H"],
    turn: 0,
    direction: 1,
    pendingPick: 0,
    requestedSuit: null,
    mustAnswer: false,
    winnerId: null,
    rules: DEFAULT_RULES,
    log: [],
    version: 1,
    turnCount: 0,
    ...rest,
  };
}

function play(s: GameState, id: string, move: Move): GameState {
  const r = applyMove(s, id, move, () => 0);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

function reject(s: GameState, id: string, move: Move): string {
  const r = applyMove(s, id, move, () => 0);
  if (r.ok) throw new Error("expected the move to be rejected");
  return r.error;
}

describe("deal", () => {
  it("deals 4 cards each and never starts on a power card", () => {
    for (let seed = 0; seed < 50; seed++) {
      let x = seed;
      const rng = (n: number) => (x = (x * 9301 + 49297) % 233280) % n;
      const s = deal([{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }], DEFAULT_RULES, rng);
      expect(s.players.every((p) => p.hand.length === 4)).toBe(true);
      expect(isPower(s.discard[0])).toBe(false);
      expect(s.deck.length + s.discard.length + 12).toBe(52);
    }
  });

  it("uses a full 52 card deck", () => {
    expect(new Set(newDeck()).size).toBe(52);
  });
});

describe("basic play", () => {
  it("matches by suit or rank and passes the turn", () => {
    let s = state({ hands: [["9H", "4S"], ["5S", "KC"]] });
    s = play(s, "p0", { type: "play", cards: ["9H"] });
    expect(s.turn).toBe(1);
    expect(s.discard.at(-1)).toBe("9H");
  });

  it("rejects a card that doesn't match", () => {
    const s = state({ hands: [["4S", "6C"], ["5S"]] });
    expect(reject(s, "p0", { type: "play", cards: ["4S"] })).toMatch(/Match/);
  });

  it("rejects moves out of turn", () => {
    const s = state({ hands: [["9H"], ["5S"]] });
    expect(reject(s, "p1", { type: "play", cards: ["5S"] })).toMatch(/turn/);
  });

  it("lets you drop several cards of the same rank", () => {
    let s = state({ hands: [["5S", "5D", "9C"], ["4H"]] });
    s = play(s, "p0", { type: "play", cards: ["5S", "5D"] });
    expect(s.players[0].hand).toEqual(["9C"]);
  });

  it("drawing takes one card and passes the turn", () => {
    let s = state({ hands: [["4S"], ["5S"]] });
    s = play(s, "p0", { type: "draw" });
    expect(s.players[0].hand).toHaveLength(2);
    expect(s.turn).toBe(1);
  });

  it("only lists playable cards for the player whose turn it is", () => {
    const s = state({ hands: [["9H", "4S", "AS"], ["5S"]] });
    expect(playableCards(s, "p0").sort()).toEqual(["9H", "AS"].sort());
    expect(playableCards(s, "p1")).toEqual([]);
  });
});

describe("power cards", () => {
  it("2 makes the next player pick two, and it stacks", () => {
    let s = state({ hands: [["2H", "9C"], ["2S", "9D"], ["4C", "7D"]] });
    s = play(s, "p0", { type: "play", cards: ["2H"] });
    expect(s.pendingPick).toBe(2);
    expect(reject(s, "p1", { type: "play", cards: ["9D"] })).toMatch(/pick up 2/);
    s = play(s, "p1", { type: "play", cards: ["2S"] });
    expect(s.pendingPick).toBe(4);
    s = play(s, "p2", { type: "draw" });
    expect(s.players[2].hand).toHaveLength(6);
    expect(s.pendingPick).toBe(0);
    expect(s.turn).toBe(0);
  });

  it("3 can answer a 2 when cross stacking is on, not when off", () => {
    let s = state({ hands: [["2H", "9C"], ["3H", "9D"]] });
    s = play(s, "p0", { type: "play", cards: ["2H"] });
    expect(play(s, "p1", { type: "play", cards: ["3H"] }).pendingPick).toBe(5);
    s = { ...s, rules: { ...s.rules, crossStackPenalties: false } };
    expect(reject(s, "p1", { type: "play", cards: ["3H"] })).toMatch(/pick up/);
  });

  it("an ace blocks a pick-up when that rule is on", () => {
    let s = state({ hands: [["3H", "9C"], ["AS", "9D"], ["4C"]] });
    s = play(s, "p0", { type: "play", cards: ["3H"] });
    s = play(s, "p1", { type: "play", cards: ["AS"] });
    expect(s.pendingPick).toBe(0);
    expect(s.turn).toBe(2);
    expect(s.requestedSuit).toBeNull();
  });

  it("J skips the next player", () => {
    let s = state({ hands: [["JH", "4C"], ["4S"], ["4D"]] });
    s = play(s, "p0", { type: "play", cards: ["JH"] });
    expect(s.turn).toBe(2);
  });

  it("K reverses the order", () => {
    let s = state({ hands: [["KH", "4C"], ["4S"], ["4D"]] });
    s = play(s, "p0", { type: "play", cards: ["KH"] });
    expect(s.direction).toBe(-1);
    expect(s.turn).toBe(2);
  });

  it("K with two players means you go again", () => {
    let s = state({ hands: [["KH", "4C"], ["4S"]] });
    s = play(s, "p0", { type: "play", cards: ["KH"] });
    expect(s.turn).toBe(0);
  });

  it("a question must be answered by the same player", () => {
    let s = state({ hands: [["8H", "4H", "4C"], ["4S"]] });
    s = play(s, "p0", { type: "play", cards: ["8H"] });
    expect(s.turn).toBe(0);
    expect(s.mustAnswer).toBe(true);
    expect(reject(s, "p0", { type: "play", cards: ["4C"] })).toMatch(/Answer/);
    s = play(s, "p0", { type: "play", cards: ["4H"] });
    expect(s.mustAnswer).toBe(false);
    expect(s.turn).toBe(1);
  });

  it("an unanswered question means drawing a card", () => {
    let s = state({ hands: [["QH", "4C"], ["4S"]] });
    s = play(s, "p0", { type: "play", cards: ["QH"] });
    s = play(s, "p0", { type: "draw" });
    expect(s.players[0].hand).toHaveLength(2);
    expect(s.turn).toBe(1);
  });

  it("an ace changes the suit and needs a suit choice", () => {
    let s = state({ hands: [["AC", "4C"], ["9S", "9D"]] });
    expect(reject(s, "p0", { type: "play", cards: ["AC"] })).toMatch(/suit/);
    s = play(s, "p0", { type: "play", cards: ["AC"], suit: "D" });
    expect(s.requestedSuit).toBe("D");
    expect(reject(s, "p1", { type: "play", cards: ["9S"] })).toMatch(/diamonds/);
    s = play(s, "p1", { type: "play", cards: ["9D"] });
    expect(s.requestedSuit).toBeNull();
  });
});

describe("going out", () => {
  it("you must call niko kadi before you can go out", () => {
    let s = state({ hands: [["9H"], ["4S", "4C"]] });
    expect(reject(s, "p0", { type: "play", cards: ["9H"] })).toMatch(/Niko kadi/);
    s.players[0].declared = true;
    s = play(s, "p0", { type: "play", cards: ["9H"] });
    expect(s.winnerId).toBe("p0");
  });

  it("calling niko kadi with a play sets you up for next turn", () => {
    let s = state({ hands: [["9H", "4S"], ["9S", "6C"]] });
    s = play(s, "p0", { type: "play", cards: ["9H"], declare: true });
    expect(s.players[0].declared).toBe(true);
    s = play(s, "p1", { type: "play", cards: ["9S"] });
    s = play(s, "p0", { type: "play", cards: ["4S"] });
    expect(s.winnerId).toBe("p0");
  });

  it("you can't call and go out on the same turn", () => {
    let s = state({ hands: [["9H"], ["4S", "4C"]] });
    s = play(s, "p0", { type: "declare" });
    expect(reject(s, "p0", { type: "play", cards: ["9H"] })).toMatch(/next turn/);
  });

  it("calling out of turn counts for your next turn", () => {
    let s = state({ hands: [["9H", "9D"], ["9S", "4C"]], turn: 1, discard: ["9C"] });
    s = play(s, "p0", { type: "declare" });
    s = play(s, "p1", { type: "play", cards: ["9S"] });
    s = play(s, "p0", { type: "play", cards: ["9H", "9D"] });
    expect(s.winnerId).toBe("p0");
  });

  it("a false call is dropped when your hand can't go out in one turn", () => {
    let s = state({ hands: [["9H", "4H", "6S"], ["4S"]] });
    s = play(s, "p0", { type: "play", cards: ["9H"], declare: true });
    expect(s.players[0].declared).toBe(false);
  });

  it("drawing cancels your call", () => {
    let s = state({ hands: [["4S"], ["4C"]] });
    s.players[0].declared = true;
    s = play(s, "p0", { type: "draw" });
    expect(s.players[0].declared).toBe(false);
  });

  it("you cannot finish on a power card", () => {
    const s = state({ hands: [["JH"], ["4S"]] });
    s.players[0].declared = true;
    expect(reject(s, "p0", { type: "play", cards: ["JH"] })).toMatch(/power card/);
  });

  it("a question then its answer can finish the game", () => {
    let s = state({ hands: [["QH", "6H"], ["4S"]] });
    s.players[0].declared = true;
    s = play(s, "p0", { type: "play", cards: ["QH"] });
    s = play(s, "p0", { type: "play", cards: ["6H"] });
    expect(s.winnerId).toBe("p0");
  });

  it("recognises hands that can go out in one turn", () => {
    expect(canFinishInOneTurn(["5H"])).toBe(true);
    expect(canFinishInOneTurn(["5H", "5S"])).toBe(true);
    expect(canFinishInOneTurn(["QH", "5H"])).toBe(true);
    expect(canFinishInOneTurn(["5H", "6H"])).toBe(false);
  });
});

describe("deck and players", () => {
  it("reshuffles the discard pile when the deck runs out", () => {
    let s = state({ hands: [["4S"], ["4C"]], deck: [], discard: ["7H", "8C", "9D", "5H"] });
    s = play(s, "p0", { type: "draw" });
    expect(s.players[0].hand).toHaveLength(2);
    expect(s.discard).toEqual(["5H"]);
  });

  it("hides other players' hands", () => {
    const s = state({ hands: [["9H", "4S"], ["5S", "KC", "2D"]] });
    const v = viewFor(s, "p0");
    expect(v.you.hand).toEqual(["9H", "4S"]);
    expect(v.players[1]).toEqual({ id: "p1", name: "P1", count: 3, declared: false });
    expect(JSON.stringify(v)).not.toContain("KC");
  });

  it("removing the current player passes the turn on", () => {
    let s = state({ hands: [["4S"], ["4C"], ["4D"]], turn: 1 });
    s = removePlayer(s, "p1");
    expect(s.players.map((p) => p.id)).toEqual(["p0", "p2"]);
    expect(s.players[s.turn].id).toBe("p2");
  });

  it("the last player left wins", () => {
    const s = removePlayer(state({ hands: [["4S"], ["4C"]] }), "p1");
    expect(s.winnerId).toBe("p0");
  });

  it("finished games refuse further moves", () => {
    const s = state({ hands: [["4S"], ["4C"]], winnerId: "p0" });
    expect(reject(s, "p1", { type: "draw" })).toMatch(/over/);
  });
});
