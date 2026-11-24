/** The power cards shown on the landing page. These will seed the rules engine later. */
export type Suit = "♥" | "♦" | "♠" | "♣";

export type PowerCard = {
  rank: string;
  suit: Suit;
  name: string;
  tag: string;
  effect: string;
};

export const isRed = (suit: Suit) => suit === "♥" || suit === "♦";

export const powerCards: PowerCard[] = [
  { rank: "2", suit: "♥", name: "Pick two", tag: "Pick 2", effect: "Next player draws two, or stacks another 2 on top." },
  { rank: "3", suit: "♣", name: "Pick three", tag: "Pick 3", effect: "Draw three, or pass the pain along with another 3." },
  { rank: "J", suit: "♠", name: "Skip", tag: "Skip next", effect: "The next player sits this turn out." },
  { rank: "K", suit: "♦", name: "Kickback", tag: "Kickback", effect: "The order of play reverses." },
  { rank: "8", suit: "♣", name: "Question", tag: "Question", effect: "Answer with a card of the same suit, or draw." },
  { rank: "A", suit: "♠", name: "Change suit", tag: "Change suit", effect: "Call any suit you like. Make them regret that heart." },
];

/** The five cards fanned out in the hero, left to right. */
export const heroHand: { card: PowerCard; x: number; r: number }[] = [
  { card: powerCards[0], x: -118, r: -16 },
  { card: powerCards[2], x: -58, r: -8 },
  { card: powerCards[5], x: 0, r: 0 },
  { card: powerCards[3], x: 58, r: 8 },
  { card: powerCards[4], x: 118, r: 16 },
];
