"use client";

import { useState, type CSSProperties } from "react";
import { heroHand, isRed } from "@/lib/cards";

const IDLE_HINT = "Tap a card. Each one changes the game.";

/** The hero's one bold move: a fan of five power cards. Tap one to lift it. */
export function CardHand() {
  const [lifted, setLifted] = useState<number | null>(null);
  const hint = lifted === null ? IDLE_HINT : `You played: ${heroHand[lifted].card.name}.`;

  return (
    <div>
      <div className="hand" role="group" aria-label="A hand of Kenyan poker cards. Tap a card to lift it.">
        {heroHand.map(({ card, x, r }, i) => (
          <button
            key={card.name}
            type="button"
            className={`card${isRed(card.suit) ? " red" : ""}${lifted === i ? " up" : ""}`}
            style={{ "--x": `${x}px`, "--r": `${r}deg` } as CSSProperties}
            aria-pressed={lifted === i}
            aria-label={`${card.rank} of ${card.suit}: ${card.name}`}
            onClick={() => setLifted(lifted === i ? null : i)}
          >
            <span className="tl" aria-hidden="true">
              {card.rank}
              <small>{card.suit}</small>
            </span>
            <span className="mid" aria-hidden="true">{card.suit}</span>
            <span className="tag" aria-hidden="true">{card.tag}</span>
          </button>
        ))}
      </div>
      <p className="hint" aria-live="polite">{hint}</p>
    </div>
  );
}
