import { FlagStripe } from "./FlagStripe";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="wrap">
      <FlagStripe />
      <p>
        <strong style={{ color: "var(--ink)" }}>{site.name}</strong> is made for fun with friends. Free to
        play, no real money, ever.
      </p>
      <p>Made with love for every table that goes quiet when someone says &quot;niko kadi&quot;.</p>
    </footer>
  );
}
