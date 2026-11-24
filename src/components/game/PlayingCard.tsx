import { SUIT_SYMBOL, isRedSuit, rankOf, suitOf, type Card } from "@/game/rules";

type Props = {
  card: Card;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  playable?: boolean;
  dim?: boolean;
  onClick?: () => void;
};

const POWER_TAG: Record<string, string> = {
  A: "Change suit",
  "2": "Pick 2",
  "3": "Pick 3",
  "8": "Question",
  Q: "Question",
  J: "Skip",
  K: "Kickback",
};

/** One playing card. A button when it can be tapped, a plain element otherwise. */
export function PlayingCard({ card, size = "md", selected, playable, dim, onClick }: Props) {
  const r = rankOf(card);
  const s = suitOf(card);
  const cls = ["pc", `pc-${size}`, isRedSuit(s) ? "red" : "", selected ? "sel" : "", playable ? "ok" : "", dim ? "dim" : ""]
    .filter(Boolean)
    .join(" ");
  const inner = (
    <>
      <span className="pc-corner" aria-hidden="true">
        {r}
        <small>{SUIT_SYMBOL[s]}</small>
      </span>
      <span className="pc-mid" aria-hidden="true">{SUIT_SYMBOL[s]}</span>
      {POWER_TAG[r] && size !== "sm" ? <span className="pc-tag" aria-hidden="true">{POWER_TAG[r]}</span> : null}
    </>
  );
  const label = `${r} of ${{ S: "spades", H: "hearts", D: "diamonds", C: "clubs" }[s]}`;
  if (!onClick) {
    return (
      <span className={cls} role="img" aria-label={label}>
        {inner}
      </span>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={!!selected} aria-label={label}>
      {inner}
    </button>
  );
}

export function CardBack({ count, onClick, disabled, label }: { count: number; onClick?: () => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" className="pc pc-lg back" onClick={onClick} disabled={disabled} aria-label={label}>
      <span className="back-k" aria-hidden="true">K</span>
      <span className="back-count">{count}</span>
    </button>
  );
}
