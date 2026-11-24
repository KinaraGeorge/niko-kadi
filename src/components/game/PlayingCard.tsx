import { SUIT_SYMBOL, isRedSuit, rankOf, suitOf, type Card, type Rank } from "@/game/rules";

type Props = {
  card: Card;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  playable?: boolean;
  dim?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
};

/** Tiny marks under the corner index so power cards are recognisable even in a tight fan. */
const POWER_MARK: Partial<Record<Rank, { mark: string; name: string }>> = {
  A: { mark: "★", name: "change suit" },
  "2": { mark: "+2", name: "pick two" },
  "3": { mark: "+3", name: "pick three" },
  "8": { mark: "?", name: "question" },
  Q: { mark: "?", name: "question" },
  J: { mark: "⤼", name: "skip" },
  K: { mark: "⇄", name: "kickback" },
};

/**
 * Pip positions as [x%, y%] inside the card's middle area, following the layout of a
 * real deck. Pips in the bottom half are drawn upside down, like printed cards.
 */
const PIPS: Partial<Record<Rank, [number, number][]>> = {
  "2": [[50, 0], [50, 100]],
  "3": [[50, 0], [50, 50], [50, 100]],
  "4": [[0, 0], [100, 0], [0, 100], [100, 100]],
  "5": [[0, 0], [100, 0], [50, 50], [0, 100], [100, 100]],
  "6": [[0, 0], [100, 0], [0, 50], [100, 50], [0, 100], [100, 100]],
  "7": [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [0, 100], [100, 100]],
  "8": [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [50, 75], [0, 100], [100, 100]],
  "9": [[0, 0], [100, 0], [0, 33.3], [100, 33.3], [50, 50], [0, 66.6], [100, 66.6], [0, 100], [100, 100]],
  "10": [[0, 0], [100, 0], [50, 16.6], [0, 33.3], [100, 33.3], [0, 66.6], [100, 66.6], [50, 83.3], [0, 100], [100, 100]],
};

const SUIT_WORD = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" } as const;

function Face({ rank, suit }: { rank: Rank; suit: string }) {
  if (rank === "A") {
    return (
      <span className="pc-face pc-ace" aria-hidden="true">
        <span>{suit}</span>
      </span>
    );
  }
  if (rank === "J" || rank === "Q" || rank === "K") {
    return (
      <span className="pc-face pc-court" aria-hidden="true">
        <span className="court-frame">
          <span className="court-crown">{rank === "K" ? "♛" : rank === "Q" ? "♕" : "⚜"}</span>
          <span className="court-letter">{rank}</span>
          <span className="court-suit">{suit}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="pc-face pc-pips" aria-hidden="true">
      {PIPS[rank]!.map(([x, y], i) => (
        <span key={i} className={y > 50 ? "pip flip" : "pip"} style={{ left: `${x}%`, top: `${y}%` }}>
          {suit}
        </span>
      ))}
    </span>
  );
}

/** One playing card, drawn with CSS only: paper, corner indices, pips or a court frame. */
export function PlayingCard({ card, size = "md", selected, playable, dim, onClick, style }: Props) {
  const r = rankOf(card);
  const s = suitOf(card);
  const sym = SUIT_SYMBOL[s];
  const power = POWER_MARK[r];
  const cls = ["pc", `pc-${size}`, isRedSuit(s) ? "red" : "", selected ? "sel" : "", playable ? "ok" : "", dim ? "dim" : ""]
    .filter(Boolean)
    .join(" ");
  const inner = (
    <>
      <span className="pc-corner" aria-hidden="true">
        <b>{r}</b>
        <small>{sym}</small>
        {power && size !== "sm" ? <i className="pc-mark">{power.mark}</i> : null}
      </span>
      {size !== "sm" ? <Face rank={r} suit={sym} /> : null}
      {size !== "sm" ? (
        <span className="pc-corner flip" aria-hidden="true">
          <b>{r}</b>
          <small>{sym}</small>
        </span>
      ) : null}
    </>
  );
  const label = `${r} of ${SUIT_WORD[s]}${power ? `, ${power.name}` : ""}`;
  if (!onClick) {
    return (
      <span className={cls} role="img" aria-label={label} style={style}>
        {inner}
      </span>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={!!selected} aria-label={label} style={style}>
      {inner}
    </button>
  );
}

/** The draw pile: a stack of real-looking card backs. */
export function CardBack({ count, onClick, disabled, label }: { count: number; onClick?: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      className={`pc pc-lg back${count > 10 ? " thick" : count > 0 ? " thin" : " empty"}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <span className="back-pattern" aria-hidden="true">
        <span className="back-k">K</span>
      </span>
      <span className="back-count">{count}</span>
    </button>
  );
}
