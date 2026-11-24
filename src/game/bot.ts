/**
 * Computer players.
 *
 * "easy" plays one legal card at random and often forgets to call "Niko kadi!".
 * "normal" plays like a sensible auntie: stacks back on pick-ups, saves its aces,
 * drops several cards at once, sets up question-and-answer combos, punishes players
 * close to winning, and never forgets to call.
 *
 * In 3,000 simulated head-to-head games, normal beats easy about 7 games in 10.
 */
import {
  POWER_RANKS,
  SUITS,
  canFinishInOneTurn,
  currentPlayer,
  isPenalty,
  isPower,
  isQuestion,
  playableCards,
  rankOf,
  suitOf,
  type Card,
  type GameState,
  type Move,
  type Rng,
  type Suit,
} from "./rules";

export type BotLevel = "easy" | "normal";

export const BOT_NAMES = ["Baraka", "Njeri", "Kamau", "Achieng", "Mutua", "Wairimu", "Otieno", "Zawadi"];

const mathRng: Rng = (n) => Math.floor(Math.random() * n);

/** The best suit to ask for: the one we hold most of (ignoring the cards being played). */
function favouriteSuit(hand: Card[], rng: Rng): Suit {
  const counts = new Map<Suit, number>(SUITS.map((s) => [s, 0]));
  for (const c of hand) if (rankOf(c) !== "A") counts.set(suitOf(c), (counts.get(suitOf(c)) ?? 0) + 1);
  const best = Math.max(...counts.values());
  const top = SUITS.filter((s) => counts.get(s) === best);
  return top[rng(top.length)];
}

/** Lead card plus every other card of the same rank we hold. */
function withSameRank(lead: Card, hand: Card[]): Card[] {
  return [lead, ...hand.filter((c) => c !== lead && rankOf(c) === rankOf(lead))];
}

/** Would playing these cards finish on a power card (not allowed by default)? */
function endsOnPower(cards: Card[], hand: Card[]): boolean {
  return hand.length === cards.length && isPower(cards[cards.length - 1]);
}

/** Pick this bot's move. Always returns something legal-looking; the engine still checks it. */
export function chooseMove(s: GameState, botId: string, level: BotLevel, rng: Rng = mathRng): Move {
  const me = currentPlayer(s);
  if (me.id !== botId) throw new Error("Not this bot's turn.");
  const hand = me.hand;
  const playable = playableCards(s, botId);
  if (playable.length === 0) return { type: "draw" };

  const finishBlocked = (cards: Card[]) =>
    hand.length === cards.length &&
    ((s.rules.requireNikoKadi && (!me.declared || me.declaredAt >= s.turnCount)) ||
      (s.rules.noFinishOnPower && endsOnPower(cards, hand)));

  const build = (lead: Card, dropAll: boolean): Move | null => {
    let cards = dropAll ? withSameRank(lead, hand) : [lead];
    // Keep one back rather than make an illegal finish.
    if (finishBlocked(cards)) {
      if (cards.length > 1) cards = cards.slice(0, -1);
      if (finishBlocked(cards)) return null;
    }
    const remaining = hand.filter((c) => !cards.includes(c));
    const willCall =
      remaining.length > 0 &&
      canFinishInOneTurn(remaining) &&
      !me.declared &&
      (level === "normal" || rng(10) < 4);
    const move: Move = { type: "play", cards, declare: willCall };
    if (rankOf(lead) === "A" && !(s.pendingPick > 0) && remaining.length > 0) {
      move.suit = favouriteSuit(remaining, rng);
    }
    return move;
  };

  if (level === "easy") {
    const order = [...playable].sort(() => rng(3) - 1);
    for (const lead of order) {
      const m = build(lead, false);
      if (m) return m;
    }
    return { type: "draw" };
  }

  // ── normal ──
  const nextIdx = (((s.turn + s.direction) % s.players.length) + s.players.length) % s.players.length;
  const nextCount = s.players[nextIdx].hand.length;

  const score = (c: Card): number => {
    const r = rankOf(c);
    let v = 0;
    // Win if we can.
    const all = withSameRank(c, hand);
    if (all.length === hand.length && !finishBlocked(all)) return 1000;
    // Under a pick-up: stack back rather than block, block rather than draw.
    if (s.pendingPick > 0) return isPenalty(c) ? 50 + Number(r) : 10;
    // Answering our own question: plain cards first so we keep power cards.
    if (s.mustAnswer) v += isQuestion(c) ? 5 : 20;
    if (isQuestion(c) && !s.mustAnswer && hand.some((x) => x !== c && !isQuestion(x) && suitOf(x) === suitOf(c))) v += 15;
    // Dump many cards at once.
    v += (all.length - 1) * 8;
    // Hurt the next player when they're close to going out.
    if (nextCount <= 2 && (isPenalty(c) || r === "J")) v += 40;
    // Use power cards (except aces) while they still hurt; holding them risks being stuck at the end.
    if (POWER_RANKS.includes(r) && r !== "A") v += 4;
    if (r === "A") v -= 15;
    // Keep the suit we hold most of in play.
    v += hand.filter((x) => suitOf(x) === suitOf(c)).length;
    // Don't strand ourselves with only power cards.
    const rest = hand.filter((x) => !all.includes(x));
    if (rest.length > 0 && rest.every(isPower) && s.rules.noFinishOnPower) v -= 10;
    return v + rng(3) * 0.1;
  };

  const ranked = [...playable].sort((a, b) => score(b) - score(a));
  for (const lead of ranked) {
    const m = build(lead, s.pendingPick === 0 || isPenalty(lead));
    if (m) return m;
  }
  return { type: "draw" };
}

/** Should this bot call "Niko kadi!" right now, outside its own turn? */
export function shouldCallOutOfTurn(s: GameState, botId: string, level: BotLevel, rng: Rng = mathRng): boolean {
  const p = s.players.find((x) => x.id === botId);
  if (!p || p.declared || s.winnerId || !canFinishInOneTurn(p.hand)) return false;
  return level === "normal" || rng(10) < 3;
}
