import { SectionHead } from "./SectionHead";

const steps = [
  { title: "Make a table", body: "Pick a name. You get a short code and a link." },
  { title: "Send the code", body: "Drop it in the group chat. Everyone joins from their phone." },
  {
    title: "Deal and talk",
    body: "Four cards each. Hop on table voice, and say it loud when you go out: niko kadi!",
  },
];

export function HowItGoes() {
  return (
    <section style={{ paddingTop: 0 }}>
      <div className="wrap">
        <SectionHead eyebrow="How a night goes" title="From message to first deal in under a minute." />
        <ol className="steps">
          {steps.map((s) => (
            <li className="step" key={s.title}>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
