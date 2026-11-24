"use client";

import { useState } from "react";
import { NAME_MAX } from "@/game/protocol";

type Props = {
  code: string;
  tableName?: string;
  error?: string;
  defaultName: string;
  onJoin: (name: string) => Promise<void>;
};

/** Shown when someone opens an invite link and has no seat yet. */
export function JoinForm({ code, tableName, error, defaultName, onJoin }: Props) {
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await onJoin(name.trim());
    setBusy(false);
  }

  return (
    <div className="wrap center-screen">
      <p className="eyebrow">You&apos;re invited · KADI-{code}</p>
      <h1 className="screen-title">
        Karibu to <em className="hl">{tableName ?? "the table"}</em>
      </h1>
      <p className="screen-sub">Pick the name your friends know you by. No sign-up.</p>
      <form className="panel join-panel" onSubmit={submit}>
        <div className="field">
          <label htmlFor="jname">Your name</label>
          <input
            id="jname"
            type="text"
            value={name}
            maxLength={NAME_MAX}
            autoComplete="nickname"
            enterKeyHint="go"
            placeholder="Type your name"
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="btn btn-main btn-block" type="submit" disabled={busy || !name.trim()}>
          {busy ? "Taking your seat…" : "Take my seat"}
        </button>
      </form>
    </div>
  );
}
