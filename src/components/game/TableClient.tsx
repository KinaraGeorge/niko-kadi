"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { TableSnapshot } from "@/game/protocol";
import { emit, forgetToken, getSocket, savedName, savedToken, saveName, saveToken } from "@/lib/socket";
import { FlagStripe } from "../FlagStripe";
import { GameBoard } from "./GameBoard";
import { JoinForm } from "./JoinForm";
import { Lobby } from "./Lobby";

type Phase =
  | { kind: "connecting" }
  | { kind: "needName"; tableName?: string; error?: string }
  | { kind: "missing"; message: string }
  | { kind: "kicked" }
  | { kind: "seated" };

/** Owns the connection for one table: joins, rejoins after a drop, and renders the right screen. */
export function TableClient({ code }: { code: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: "connecting" });
  const [snap, setSnap] = useState<TableSnapshot | null>(null);
  const [online, setOnline] = useState(true);

  const join = useCallback(
    async (name?: string) => {
      const token = savedToken(code) ?? undefined;
      const r = await emit<{ token: string }>((s, ack) => s.emit("table:join", { code, name, token }, ack));
      if (r.ok) {
        saveToken(code, r.token);
        if (name) saveName(name);
        setPhase({ kind: "seated" });
        return;
      }
      if (r.error === "NEED_NAME") {
        const check = await emit<{ name: string }>((s, ack) => s.emit("table:check", { code }, ack));
        setPhase({ kind: "needName", tableName: check.ok ? check.name : undefined });
      } else if (name) {
        setPhase({ kind: "needName", error: r.error });
      } else {
        setPhase({ kind: "missing", message: r.error });
      }
    },
    [code],
  );

  useEffect(() => {
    const socket = getSocket();
    const onState = (s: TableSnapshot) => {
      if (s.code === code) setSnap(s);
    };
    const onKicked = () => {
      forgetToken(code);
      setSnap(null);
      setPhase({ kind: "kicked" });
    };
    // Rejoin on every (re)connect so a dropped phone connection lands back in its seat.
    const onConnect = () => {
      setOnline(true);
      void join();
    };
    const onDisconnect = () => setOnline(false);
    socket.on("table:state", onState);
    socket.on("table:kicked", onKicked);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off("table:state", onState);
      socket.off("table:kicked", onKicked);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
    };
  }, [code, join]);

  async function leave() {
    await emit((s, ack) => s.emit("table:leave", ack));
    forgetToken(code);
    location.href = "/";
  }

  let body: React.ReactNode;
  if (phase.kind === "missing" || phase.kind === "kicked") {
    body = (
      <div className="wrap center-screen">
        <p className="eyebrow">KADI-{code}</p>
        <h1 className="screen-title">{phase.kind === "kicked" ? "You left the table." : "Hmm, no table here."}</h1>
        <p className="screen-sub">
          {phase.kind === "kicked"
            ? "The host removed you, or you left. You can start your own table any time."
            : `${phase.message} Tables close after a few quiet hours.`}
        </p>
        <Link className="btn btn-main" href="/#invite">
          Start a new table
        </Link>
      </div>
    );
  } else if (phase.kind === "needName") {
    body = <JoinForm code={code} tableName={phase.tableName} error={phase.error} defaultName={savedName()} onJoin={join} />;
  } else if (!snap) {
    body = (
      <div className="wrap center-screen">
        <p className="eyebrow">KADI-{code}</p>
        <h1 className="screen-title">{online ? "Finding your table…" : "Connecting…"}</h1>
        {!online ? (
          <p className="screen-sub">
            Can&apos;t reach the game server yet. If you&apos;re running it yourself, start it with <code>npm run dev</code>.
          </p>
        ) : null}
      </div>
    );
  } else if (snap.game && snap.status !== "lobby") {
    body = <GameBoard snap={snap} onLeave={leave} />;
  } else {
    body = <Lobby snap={snap} onLeave={leave} />;
  }

  return (
    <div className="table-app">
      <FlagStripe />
      {!online && snap ? (
        <p className="offline" role="status">
          Reconnecting… your seat is saved.
        </p>
      ) : null}
      {body}
    </div>
  );
}
