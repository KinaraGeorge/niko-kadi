/**
 * Kadi rules engine.
 *
 * Pure TypeScript with no network or browser code, so the game server runs it
 * for real and the browser can use the same helpers to highlight legal cards.
 *
 * Cards are short strings: rank then suit, e.g. "AS" (ace of spades), "10H", "QD".
 */

export const SUITS = ["S", "H", "D", "C"] as const;
export type Suit = (typeof SUITS)[number];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type Rank = (typeof RANKS)[number];
export type Card = string;

export const SUIT_SYMBOL: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_NAME: Record<Suit, string> = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" };

export const rankOf = (c: Card) => c.slice(0, -1) as Rank;
export const suitOf = (c: Card) => c.slice(-1) as Suit;
export const isRedSuit = (s: Suit) => s === "H" || s === "D";

const PENALTY: Partial<Record<Rank, number>> = { "2": 2, "3": 3 };
const QUESTION_RANKS: Rank[] = ["8", "Q"];
/** Cards that do something. You cannot finish on these when noFinishOnPower is on. */
export const POWER_RANKS: Rank[] = ["A", "2", "3", "8", "J", "Q", "K"];

export const isPower = (c: Card) => POWER_RANKS.includes(rankOf(c));
export const isQuestion = (c: Card) => QUESTION_RANKS.includes(rankOf(c));
export const isPenalty = (c: Card) => rankOf(c) in PENALTY;

/** House rules. Every table can switch these before the deal. */
export interface HouseRules {
  /** Cards dealt to each player. */
  startHand: number;
  /** A 2 can answer a 3 and a 3 can answer a 2 (same rank always stacks). */
  crossStackPenalties: boolean;
  /** An ace cancels a pending "pick two" or "pick three". */
  aceBlocksPenalty: boolean;
  /** You cannot play your last card if it is a power card. */
  noFinishOnPower: boolean;
  /** You must have called "Niko kadi!" on an earlier turn before you can go out. */
  requireNikoKadi: boolean;
}

export const DEFAULT_RULES: HouseRules = {
  startHand: 4,
  crossStackPenalties: true,
  aceBlocksPenalty: true,
  noFinishOnPower: true,
  requireNikoKadi: true,
};

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  /** Called "Niko kadi!" and has not drawn since. */
  declared: boolean;
  /** The turnCount when they called it. You can only go out on a later turn. */
  declaredAt: number;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  discard: Card[];
  /** Index into players of whose turn it is. */
  turn: number;
  direction: 1 | -1;
  /** Cards the current player must pick up unless they stack or block. */
  pendingPick: number;
  /** Suit called by the last ace. */
  requestedSuit: Suit | null;
  /** The current player played a question (8 or Q) and must answer it. */
  mustAnswer: boolean;
  winnerId: string | null;
  rules: HouseRules;
  /** Short history for the table feed, newest last. */
  log: string[];
  /** Increases with every move, handy for clients to spot changes. */
  version: number;
  /** Increases every time the turn passes to someone. */
  turnCount: number;
}

export type Move =
  | { type: "play"; cards: Card[]; suit?: Suit; declare?: boolean }
  | { type: "draw" }
  | { type: "declare" };

export type MoveResult = { ok: true; state: GameState } | { ok: false; error: string };

export type Rng = (maxExclusive: number) => number;
const mathRng: Rng = (n) => Math.floor(Math.random() * n);

export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) deck.push(`${r}${s}`);
  return deck;
}

export function shuffle<T>(items: T[], rng: Rng = mathRng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardLabel(c: Card): string {
  return `${rankOf(c)}${SUIT_SYMBOL[suitOf(c)]}`;
}

/** Deal a new game. The starting card is never a power card. */
export function deal(
  seats: { id: string; name: string }[],
  rules: HouseRules = DEFAULT_RULES,
  rng: Rng = mathRng,
): GameState {
  if (seats.length < 2) throw new Error("Kadi needs at least 2 players.");
  if (seats.length * rules.startHand > 40) throw new Error("Too many cards for one deck.");
  const deck = shuffle(newDeck(), rng);
  const players: Player[] = seats.map((s) => ({ id: s.id, name: s.name, hand: [], declared: false, declaredAt: -1 }));
  for (let i = 0; i < rules.startHand; i++) for (const p of players) p.hand.push(deck.pop()!);
  const startIdx = deck.findIndex((c) => !isPower(c));
  const [start] = deck.splice(startIdx, 1);
  return {
    players,
    deck,
    discard: [start],
    turn: rng(players.length),
    direction: 1,
    pendingPick: 0,
    requestedSuit: null,
    mustAnswer: false,
    winnerId: null,
    rules,
    log: [`New game. Starting card ${cardLabel(start)}.`],
    version: 1,
    turnCount: 0,
  };
}

export const topCard = (s: GameState) => s.discard[s.discard.length - 1];
export const currentPlayer = (s: GameState) => s.players[s.turn];

/** Can this card be the first card of a play right now? */
export function canLead(s: GameState, card: Card): boolean {
  const top = topCard(s);
  const r = rankOf(card);
  if (s.pendingPick > 0) {
    if (r === "A") return s.rules.aceBlocksPenalty;
    if (!isPenalty(card)) return false;
    return r === rankOf(top) || s.rules.crossStackPenalties;
  }
  if (r === "A") return true;
  if (s.mustAnswer) {
    return suitOf(card) === suitOf(top) || r === rankOf(top) || isQuestion(card);
  }
  if (s.requestedSuit) return suitOf(card) === s.requestedSuit;
  return suitOf(card) === suitOf(top) || r === rankOf(top);
}

/** Cards in the current player's hand that could start a play. */
export function playableCards(s: GameState, playerId: string): Card[] {
  const p = s.players.find((x) => x.id === playerId);
  if (!p || s.winnerId || currentPlayer(s).id !== playerId) return [];
  return p.hand.filter((c) => canLead(s, c));
}

/** All remaining cards could go out together on one turn (same rank). */
export function canFinishInOneTurn(hand: Card[]): boolean {
  if (hand.length === 0) return false;
  // Question cards keep the turn, so they can be followed by the final drop.
  const rest = hand.filter((c) => !isQuestion(c));
  if (rest.length === 0) return true;
  return rest.every((c) => rankOf(c) === rankOf(rest[0]));
}

function clone(s: GameState): GameState {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hand: p.hand.slice() })),
    deck: s.deck.slice(),
    discard: s.discard.slice(),
    log: s.log.slice(),
  };
}

function step(s: GameState, by: number) {
  s.turnCount++;
  const n = s.players.length;
  s.turn = (((s.turn + s.direction * by) % n) + n) % n;
}

function drawCards(s: GameState, p: Player, count: number, rng: Rng): number {
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (s.deck.length === 0) {
      const top = s.discard.pop()!;
      s.deck = shuffle(s.discard, rng);
      s.discard = [top];
      if (s.deck.length === 0) break;
    }
    p.hand.push(s.deck.pop()!);
    drawn++;
  }
  return drawn;
}

function addLog(s: GameState, line: string) {
  s.log.push(line);
  if (s.log.length > 30) s.log.splice(0, s.log.length - 30);
}

/** Apply a move. Returns a new state, or an error that can be shown to the player as-is. */
export function applyMove(prev: GameState, playerId: string, move: Move, rng: Rng = mathRng): MoveResult {
  if (prev.winnerId) return { ok: false, error: "This game is over." };
  const s = clone(prev);
  const me = currentPlayer(s);

  if (move.type === "declare") {
    const p = s.players.find((x) => x.id === playerId);
    if (!p) return { ok: false, error: "You are not in this game." };
    if (p.declared) return { ok: false, error: "You already called it." };
    p.declared = true;
    p.declaredAt = s.turnCount;
    addLog(s, `${p.name}: "Niko kadi!"`);
    s.version++;
    return { ok: true, state: s };
  }

  if (me.id !== playerId) return { ok: false, error: "Wait for your turn." };

  if (move.type === "draw") {
    if (s.pendingPick > 0) {
      const n = drawCards(s, me, s.pendingPick, rng);
      addLog(s, `${me.name} picked up ${n}.`);
      s.pendingPick = 0;
    } else {
      drawCards(s, me, 1, rng);
      addLog(s, s.mustAnswer ? `${me.name} couldn't answer and drew a card.` : `${me.name} drew a card.`);
    }
    me.declared = false;
    s.mustAnswer = false;
    step(s, 1);
    s.version++;
    return { ok: true, state: s };
  }

  // Play one or more cards of the same rank.
  const cards = move.cards;
  if (!Array.isArray(cards) || cards.length === 0) return { ok: false, error: "Pick a card to play." };
  if (new Set(cards).size !== cards.length) return { ok: false, error: "Each card can only be played once." };
  if (!cards.every((c) => me.hand.includes(c))) return { ok: false, error: "That card isn't in your hand." };
  const rank = rankOf(cards[0]);
  if (!cards.every((c) => rankOf(c) === rank)) return { ok: false, error: "You can only drop cards of the same rank together." };
  if (!canLead(s, cards[0])) return { ok: false, error: whyNot(s) };

  const handAfter = me.hand.filter((c) => !cards.includes(c));
  const finishing = handAfter.length === 0;
  if (finishing) {
    if (s.rules.requireNikoKadi && !me.declared) {
      return { ok: false, error: "Call \"Niko kadi!\" first. You can go out on your next turn." };
    }
    if (s.rules.requireNikoKadi && me.declaredAt >= s.turnCount) {
      return { ok: false, error: "You called it this turn. You can go out on your next turn." };
    }
    if (s.rules.noFinishOnPower && isPower(cards[cards.length - 1])) {
      return { ok: false, error: "You can't finish on a power card. Keep it for later or draw." };
    }
  }
  const blockingWithAce = rank === "A" && s.pendingPick > 0;
  if (rank === "A" && !blockingWithAce && !finishing && !(move.suit && SUITS.includes(move.suit))) {
    return { ok: false, error: "Choose a suit for your ace." };
  }

  me.hand = handAfter;
  s.discard.push(...cards);
  if (move.declare && !me.declared) {
    me.declared = true;
    me.declaredAt = s.turnCount;
  }
  const label = cards.map(cardLabel).join(" ");
  const n = cards.length;
  const wasAnswering = s.mustAnswer;
  s.mustAnswer = false;
  s.requestedSuit = null;

  if (finishing) {
    s.winnerId = me.id;
    addLog(s, `${me.name} played ${label} and won! Niko kadi!`);
    s.version++;
    return { ok: true, state: s };
  }

  if (blockingWithAce) {
    addLog(s, `${me.name} blocked the pick-up with ${label}.`);
    s.pendingPick = 0;
    step(s, 1);
  } else if (rank === "A") {
    s.requestedSuit = move.suit!;
    addLog(s, `${me.name} played ${label} and asked for ${SUIT_NAME[move.suit!]}.`);
    step(s, 1);
  } else if (isPenalty(cards[0])) {
    s.pendingPick += PENALTY[rank]! * n;
    addLog(s, `${me.name} played ${label}. Next player picks ${s.pendingPick}!`);
    step(s, 1);
  } else if (rank === "J") {
    addLog(s, `${me.name} played ${label}. ${n === 1 ? "Skip!" : `Skipping ${n}!`}`);
    step(s, 1 + n);
  } else if (rank === "K") {
    if (n % 2 === 1) s.direction = s.direction === 1 ? -1 : 1;
    if (s.players.length === 2 && n % 2 === 1) {
      addLog(s, `${me.name} played ${label}. Kickback, ${me.name} goes again.`);
    } else {
      addLog(s, `${me.name} played ${label}. Kickback!`);
      step(s, 1);
    }
  } else if (isQuestion(cards[0])) {
    s.mustAnswer = true;
    addLog(s, `${me.name} played ${label}. Now answer it.`);
  } else {
    addLog(s, `${me.name} ${wasAnswering ? "answered with" : "played"} ${label}.`);
    step(s, 1);
  }

  if (me.hand.length > 0 && !canFinishInOneTurn(me.hand)) me.declared = false;
  s.version++;
  return { ok: true, state: s };
}

function whyNot(s: GameState): string {
  const top = topCard(s);
  if (s.pendingPick > 0) {
    return s.rules.aceBlocksPenalty
      ? `Stack a 2 or 3, block with an ace, or pick up ${s.pendingPick}.`
      : `Stack a 2 or 3, or pick up ${s.pendingPick}.`;
  }
  if (s.mustAnswer) return `Answer with a ${SUIT_NAME[suitOf(top)]} card, a question card or an ace, or draw.`;
  if (s.requestedSuit) return `The ace asked for ${SUIT_NAME[s.requestedSuit]}. Play one, play an ace, or draw.`;
  return `Match ${cardLabel(top)} by suit or number, play an ace, or draw.`;
}

/** What one player is allowed to see. Other hands are only counts. */
export interface PlayerView {
  you: { id: string; hand: Card[]; inGame: boolean; declared: boolean };
  players: { id: string; name: string; count: number; declared: boolean }[];
  top: Card;
  /** The last few cards played, oldest first, ending with the top card. */
  recent: Card[];
  discardCount: number;
  deckCount: number;
  turnId: string;
  direction: 1 | -1;
  pendingPick: number;
  requestedSuit: Suit | null;
  mustAnswer: boolean;
  winnerId: string | null;
  playable: Card[];
  rules: HouseRules;
  log: string[];
  version: number;
}

export function viewFor(s: GameState, playerId: string): PlayerView {
  const me = s.players.find((p) => p.id === playerId);
  return {
    you: { id: playerId, hand: me ? me.hand.slice() : [], inGame: !!me, declared: me?.declared ?? false },
    players: s.players.map((p) => ({ id: p.id, name: p.name, count: p.hand.length, declared: p.declared })),
    top: topCard(s),
    recent: s.discard.slice(-5),
    discardCount: s.discard.length,
    deckCount: s.deck.length,
    turnId: currentPlayer(s).id,
    direction: s.direction,
    pendingPick: s.pendingPick,
    requestedSuit: s.requestedSuit,
    mustAnswer: s.mustAnswer,
    winnerId: s.winnerId,
    playable: me ? playableCards(s, playerId) : [],
    rules: s.rules,
    log: s.log.slice(-8),
    version: s.version,
  };
}

/** Take a player out mid-game (they left). Their cards go back under the deck. */
export function removePlayer(prev: GameState, playerId: string): GameState {
  const s = clone(prev);
  const idx = s.players.findIndex((p) => p.id === playerId);
  if (idx < 0) return s;
  const [gone] = s.players.splice(idx, 1);
  s.deck.unshift(...gone.hand);
  addLog(s, `${gone.name} left the game.`);
  if (s.players.length === 1 && !s.winnerId) {
    s.winnerId = s.players[0].id;
    addLog(s, `${s.players[0].name} wins. Everyone else left.`);
  }
  const n = s.players.length;
  if (idx === prev.turn) {
    // The turn passes to whoever was next after the player who left.
    s.turn = s.direction === 1 ? idx % n : (idx - 1 + n) % n;
    s.pendingPick = 0;
    s.mustAnswer = false;
  } else if (idx < s.turn) {
    s.turn--;
  }
  s.version++;
  return s;
}
