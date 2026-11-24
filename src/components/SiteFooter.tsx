import { FlagStripe } from "./FlagStripe";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="wrap">
      <FlagStripe />
      <p>
        <strong style={{ color: "var(--ink)" }}>{site.name}</strong> is in early development. The game is not
        built yet. It is made for fun with friends and has no real money.
      </p>
      <p>Made with love for every table that goes quiet when someone says &quot;niko kadi&quot;.</p>
    </footer>
  );
}
