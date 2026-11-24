import { CardHand } from "./CardHand";
import { FlagStripe } from "./FlagStripe";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <header className="hero">
      <FlagStripe />
      <div className="wrap">
        <nav className="top" aria-label="Main">
          <a className="logo" href="#top">
            <b aria-hidden="true">K</b>
            {site.name}
          </a>
          <a className="btn btn-main" href="#invite">Start a table</a>
        </nav>
        <div>
          <p className="eyebrow">Karibu · Free to play · 2 to {site.maxSeats} friends</p>
          <h1 id="top">
            <em>Niko</em> kadi!
          </h1>
          <p className="lede">
            Kenyan poker with your people, wherever they are tonight. Share one code. Everyone&apos;s at the
            table in seconds.
          </p>
          <div className="cta">
            <a className="btn btn-main" href="#invite">Invite my friends</a>
            <a className="btn btn-ghost" href="#rules">See the power cards</a>
          </div>
          <ul className="chips">
            <li>Plays in your browser</li>
            <li>Light on data</li>
            <li>No sign-up</li>
          </ul>
        </div>
        <CardHand />
      </div>
    </header>
  );
}
