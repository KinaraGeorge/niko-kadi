"use client";

import { useState, type KeyboardEvent } from "react";
import { previewCode } from "@/lib/tableCode";
import { site } from "@/lib/site";

const host = site.url.replace(/^https?:\/\//, "");

/**
 * Live preview of the invite flow. Front end only for now:
 * the game server will create real tables and codes later.
 */
export function InviteBuilder() {
  const [tableName, setTableName] = useState("Jumamosi Boys");
  const [friendName, setFriendName] = useState("");
  const [friends, setFriends] = useState<string[]>(["Wanjiru", "Otieno"]);
  const [status, setStatus] = useState("Friends join with one tap. No account needed.");

  const code = previewCode(tableName);
  const link = `${host}/t/${code}`;
  const seats = ["You", ...friends];

  function addFriend() {
    const name = friendName.trim();
    if (!name) return setStatus("Type a name first.");
    if (seats.length >= site.maxSeats) return setStatus(`The table is full. ${site.maxSeats} seats max.`);
    setFriends([...friends, name]);
    setFriendName("");
    setStatus(`${name} has a seat.`);
  }

  async function copyInvite() {
    const text = `Niko kadi? Join ${tableName.trim() || "my table"} on ${site.name}: ${link} (code KADI-${code})`;
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied. Paste it in the group chat.");
    } catch {
      setStatus("Copy blocked. Select the code and share it by hand.");
    }
  }

  function onFriendKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addFriend();
  }

  return (
    <div className="invite">
      <div className="panel">
        <div className="field">
          <label htmlFor="tname">Table name</label>
          <input
            type="text"
            id="tname"
            value={tableName}
            maxLength={22}
            autoComplete="off"
            onChange={(e) => setTableName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="fname">Add a friend</label>
          <div className="input-row">
            <input
              type="text"
              id="fname"
              placeholder="Wanjiru"
              maxLength={12}
              autoComplete="off"
              enterKeyHint="done"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              onKeyDown={onFriendKey}
            />
            <button type="button" className="add" aria-label="Add friend" onClick={addFriend}>
              +
            </button>
          </div>
        </div>
        <div className="code">
          <div>
            <small>Table code</small>
            <strong>KADI-{code}</strong>
            <span>{link}</span>
          </div>
          <button type="button" className="copy" onClick={copyInvite}>
            Copy
          </button>
        </div>
        <p className="note" aria-live="polite">{status}</p>
      </div>

      <ul className="table" aria-label="Seats at the table">
        {Array.from({ length: site.maxSeats }, (_, i) => {
          const name = seats[i];
          return name ? (
            <li className="seat" key={`seat-${i}`}>
              <i aria-hidden="true">{name.charAt(0).toUpperCase()}</i>
              <span>{name}</span>
            </li>
          ) : (
            <li className="seat empty" key={`seat-${i}`}>
              <i aria-hidden="true">+</i>
              <span>Open seat</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
