"use client";

import { useState } from "react";

/** Share the table link: the phone's share sheet, WhatsApp, or copy. */
export function ShareInvite({ code, tableName }: { code: string; tableName: string }) {
  const [msg, setMsg] = useState("");
  const url = typeof location === "undefined" ? `/t/${code}` : `${location.origin}/t/${code}`;
  const text = `Niko kadi? Join ${tableName} on Kadi Night (code KADI-${code})`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Kadi Night", text, url });
        return;
      } catch {
        /* cancelled: fall through to copy */
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text}: ${url}`);
      setMsg("Link copied. Paste it in the group chat.");
    } catch {
      setMsg("Copy blocked. Long-press the link to copy it.");
    }
  }

  return (
    <div className="code share">
      <div>
        <small>Table code</small>
        <strong>KADI-{code}</strong>
        <span>{url.replace(/^https?:\/\//, "")}</span>
      </div>
      <div className="share-btns">
        <button type="button" className="copy" onClick={share}>
          Share
        </button>
        <a
          className="copy wa"
          href={`https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </div>
      {msg ? (
        <p className="share-msg" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
