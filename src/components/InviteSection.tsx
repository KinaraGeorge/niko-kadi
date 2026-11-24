import { InviteBuilder } from "./InviteBuilder";
import { SectionHead } from "./SectionHead";

export function InviteSection() {
  return (
    <section id="invite">
      <div className="wrap">
        <SectionHead eyebrow="Set the table" title="Call your friends. Keep it simple.">
          Name your table, start it, and send the link on WhatsApp. Friends tap it and take a seat.
        </SectionHead>
        <InviteBuilder />
      </div>
    </section>
  );
}
