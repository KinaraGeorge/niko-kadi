"use client";

import { useEffect, useRef, useState } from "react";
import { SUIT_SYMBOL, isRedSuit, rankOf, suitOf, type Card } from "@/game/rules";

type Shout = { id: number; cards: Card[]; text: string };

const SHOW_MS = 3000;

/**
 * A big announcement over the table every time something happens:
 * the cards that were just played, plus a line saying who did what.
 * It starts large, shrinks and fades away within three seconds.
 */
export function PlayCallout({
  version,
  discardCount,
  recent,
  lastLog,
}: {
  version: number;
  discardCount: number;
  recent: Card[];
  lastLog: string | undefined;
}) {
  const [shout, setShout] = useState<Shout | null>(null);
  const seen = useRef({ version, discardCount });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const prev = seen.current;
    seen.current = { version, discardCount };
    if (version === prev.version || !lastLog) return;
    // Cards added to the pile since the last update (a fresh deal or reshuffle resets the count).
    const added = discardCount > prev.discardCount ? Math.min(discardCount - prev.discardCount, recent.length) : 0;
    const cards = added ? recent.slice(-added) : [];
    setShout({ id: version, cards, text: lastLog });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShout(null), SHOW_MS);
  }, [version, discardCount, recent, lastLog]);

  if (!shout) return null;
  return (
    <div className="callout" key={shout.id} aria-hidden="true">
      {shout.cards.length ? (
        <p className="callout-cards">
          {shout.cards.map((c, i) => (
            <span key={`${c}-${i}`} className={isRedSuit(suitOf(c)) ? "red" : undefined}>
              {rankOf(c)}
              {SUIT_SYMBOL[suitOf(c)]}
            </span>
          ))}
        </p>
      ) : null}
      <p className={shout.cards.length ? "callout-text" : "callout-text solo"}>{shout.text}</p>
    </div>
  );
}
