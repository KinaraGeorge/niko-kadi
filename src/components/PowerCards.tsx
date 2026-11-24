import { isRed, powerCards } from "@/lib/cards";
import { SectionHead } from "./SectionHead";

export function PowerCards() {
  return (
    <section id="rules" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <SectionHead eyebrow="Same cards, same rules" title="The power cards you grew up with.">
          Play the way your family does. Switch house rules on or off before the first deal.
        </SectionHead>
        <ul className="powers">
          {powerCards.map((card) => (
            <li key={card.name} className={`power${card.rank === "A" ? " hot" : ""}`}>
              <div className={`face${isRed(card.suit) ? " red" : ""}`} aria-hidden="true">
                {card.rank}
                {card.suit}
              </div>
              <h3>{card.name}</h3>
              <p>{card.effect}</p>
            </li>
          ))}
        </ul>
        <p className="fine">Rules differ between towns and families, so each table can adjust them.</p>
      </div>
    </section>
  );
}
