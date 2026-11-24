"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_SEATS, NAME_MAX, TABLE_NAME_MAX, normaliseCode } from "@/game/protocol";
import { emit, savedName, saveName, saveToken } from "@/lib/socket";

/** Start a real table (or join one by code) right from the landing page. */
export function InviteBuilder() {
  const router = useRouter();
  const [tableName, setTableName] = useState("Jumamosi Boys");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [status, setStatus] = useState("Friends join from the link. No account needed.");
  const [busy, setBusy] = useState(false);

  useEffect(() => setName(savedName()), []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setStatus("Add your name so friends know who's inviting them.");
    setBusy(true);
    setStatus("Setting the table…");
    const r = await emit<{ code: string; token: string }>((s, ack) =>
      s.emit("table:create", { tableName, name: name.trim() }, ack),
    );
    if (!r.ok) {
      setBusy(false);
      return setStatus(r.error);
    }
    saveName(name.trim());
    saveToken(r.code, r.token);
    router.push(`/t/${r.code}`);
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const code = normaliseCode(joinCode);
    if (code.length < 4) return setStatus("Table codes look like KADI-7HJ2.");
    router.push(`/t/${code}`);
  }

  const preview = [name.trim() || "You"];

  return (
    <div className="invite">
      <div className="panel">
        <form onSubmit={create}>
          <div className="field">
            <label htmlFor="tname">Table name</label>
            <input
              type="text"
              id="tname"
              value={tableName}
              maxLength={TABLE_NAME_MAX}
              autoComplete="off"
              onChange={(e) => setTableName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="yname">Your name</label>
            <input
              type="text"
              id="yname"
              placeholder="Wanjiru"
              maxLength={NAME_MAX}
              autoComplete="nickname"
              enterKeyHint="go"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button className="btn btn-main btn-block create-btn" type="submit" disabled={busy}>
            {busy ? "Setting the table…" : "Start a table"}
          </button>
        </form>

        <form className="code join-code" onSubmit={join}>
          <div>
            <small>Got a code?</small>
            <label htmlFor="jcode" className="sr-only">
              Table code
            </label>
            <input
              id="jcode"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="KADI-7HJ2"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
          </div>
          <button type="submit" className="copy">
            Join
          </button>
        </form>
        <p className="note" aria-live="polite">
          {status}
        </p>
      </div>

      <ul className="table" aria-label="Seats at the table">
        {Array.from({ length: MAX_SEATS }, (_, i) =>
          preview[i] ? (
            <li className="seat" key={`seat-${i}`}>
              <i aria-hidden="true">{preview[i].charAt(0).toUpperCase()}</i>
              <span>{preview[i]}</span>
            </li>
          ) : (
            <li className="seat empty" key={`seat-${i}`}>
              <i aria-hidden="true">+</i>
              <span>Open seat</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
