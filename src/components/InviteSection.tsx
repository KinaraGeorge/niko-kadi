import { InviteBuilder } from "./InviteBuilder";
import { SectionHead } from "./SectionHead";

export function InviteSection() {
  return (
    <section id="invite">
      <div className="wrap">
        <SectionHead eyebrow="Set the table" title="Call your friends. Keep it simple.">
          Name your table, add who&apos;s coming, send the code on WhatsApp. This is a live preview of the invite.
        </SectionHead>
        <InviteBuilder />
      </div>
    </section>
  );
}
