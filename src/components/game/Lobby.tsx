"use client";

import { useState } from "react";
import type { TableSnapshot } from "@/game/protocol";
import type { HouseRules } from "@/game/rules";
import { emit } from "@/lib/socket";
import { Seats } from "./Seats";
import { ShareInvite } from "./ShareInvite";

const TOGGLES: { key: keyof HouseRules; label: string; hint: string }[] = [
  { key: "requireNikoKadi", label: "Call “Niko kadi!” to go out", hint: "Forget to call it and you can't finish." },
  { key: "noFinishOnPower", label: "No finishing on a power card", hint: "Your last card must be a plain 4 to 10 (except 8)." },
  { key: "aceBlocksPenalty", label: "Ace blocks a pick-up", hint: "Drop an ace on a 2 or 3 to cancel it." },
  { key: "crossStackPenalties", label: "2s and 3s stack on each other", hint: "Answer a 2 with a 3 and the next player picks five." },
];

/** Waiting room: share the link, see who's here, set house rules, deal. */
export function Lobby({ snap, onLeave }: { snap: TableSnapshot; onLeave: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const me = snap.seats.find((s) => s.id === snap.youId);
  const isHost = !!me?.host;
  const host = snap.seats.find((s) => s.host);

  async function setRule(patch: Partial<HouseRules>) {
    const r = await emit((s, ack) => s.emit("table:rules", patch, ack));
    if (!r.ok) setError(r.error);
  }

  async function addBot(level: "easy" | "normal") {
    const r = await emit((s, ack) => s.emit("table:addBot", { level }, ack));
    setError(r.ok ? "" : r.error);
  }

  async function remove(seatId: string) {
    const r = await emit((s, ack) => s.emit("table:kick", { seatId }, ack));
    setError(r.ok ? "" : r.error);
  }

  async function deal() {
    setBusy(true);
    const r = await emit((s, ack) => s.emit("table:start", ack));
    setBusy(false);
    setError(r.ok ? "" : r.error);
  }

  return (
    <div className="wrap lobby">
      <header className="lobby-head">
        <p className="eyebrow">Set the table</p>
        <h1 className="screen-title">{snap.name}</h1>
        <p className="screen-sub">
          {snap.seats.length < 2
            ? "Send the link to your friends. The game starts when the host deals."
            : `${snap.seats.length} at the table. ${isHost ? "Deal when everyone's in." : `Waiting for ${host?.name ?? "the host"} to deal.`}`}
        </p>
      </header>

      <div className="invite">
        <div className="panel">
          <ShareInvite code={snap.code} tableName={snap.name} />
          {isHost ? (
            <button className="btn btn-main btn-block deal-btn" type="button" onClick={deal} disabled={busy || snap.seats.length < 2}>
              {snap.seats.length < 2 ? "Waiting for players…" : busy ? "Dealing…" : `Deal ${snap.rules.startHand} cards each`}
            </button>
          ) : null}
          {isHost && snap.seats.length < 6 ? (
            <div className="add-bot">
              <p className="add-bot-label">No one around? Add a computer player:</p>
              <div className="add-bot-btns">
                <button type="button" className="btn btn-ghost" onClick={() => addBot("easy")}>
                  🤖 Easy
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => addBot("normal")}>
                  🤖 Normal
                </button>
              </div>
            </div>
          ) : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
        <Seats seats={snap.seats} youId={snap.youId} onRemove={isHost ? remove : undefined} />
      </div>

      <section className="rules-panel panel" aria-labelledby="hr-title">
        <h2 id="hr-title" className="panel-title">House rules</h2>
        <p className="note" style={{ marginTop: 0 }}>
          {isHost ? "Play it the way your family does." : "The host sets these before the deal."}
        </p>
        <ul className="toggles">
          {TOGGLES.map((t) => (
            <li key={t.key}>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={snap.rules[t.key] as boolean}
                  disabled={!isHost}
                  onChange={(e) => setRule({ [t.key]: e.target.checked })}
                />
                <span className="toggle-ui" aria-hidden="true" />
                <span>
                  <strong>{t.label}</strong>
                  <small>{t.hint}</small>
                </span>
              </label>
            </li>
          ))}
          <li>
            <div className="toggle stepper-row">
              <span>
                <strong>Cards each</strong>
                <small>Most tables deal four.</small>
              </span>
              <div className="stepper">
                {[3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={!isHost}
                    aria-pressed={snap.rules.startHand === n}
                    onClick={() => setRule({ startHand: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </li>
        </ul>
      </section>

      <p className="leave-row">
        <button type="button" className="link-btn" onClick={onLeave}>
          Leave this table
        </button>
      </p>
    </div>
  );
}
