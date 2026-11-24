"use client";

import { useEffect, useRef, useState } from "react";
import type { TableSnapshot } from "@/game/protocol";
import {
  SUITS,
  SUIT_NAME,
  SUIT_SYMBOL,
  canFinishInOneTurn,
  isRedSuit,
  rankOf,
  type Card,
  type Suit,
} from "@/game/rules";
import { emit } from "@/lib/socket";
import { CardBack, PlayingCard } from "./PlayingCard";

type Props = { snap: TableSnapshot; onLeave: () => void };

/** The in-game screen, laid out for one hand on a phone: opponents up top, piles in the middle, your hand at the bottom. */
export function GameBoard({ snap, onLeave }: Props) {
  const g = snap.game!;
  const me = g.you;
  const myTurn = g.turnId === me.id && !g.winnerId && me.inGame;
  const [selected, setSelected] = useState<Card[]>([]);
  const [armedCall, setArmedCall] = useState(false);
  const [pickSuit, setPickSuit] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  // Changes when a move lands (top card, turn or your hand), but not when someone calls "Niko kadi!".
  const moveKey = `${g.top}|${g.turnId}|${g.discardCount}|${me.hand.join(",")}|${g.mustAnswer}`;
  const lastMove = useRef(moveKey);
  const wasMyTurn = useRef(myTurn);

  // A move landed: clear selections. Buzz the phone when it becomes your turn.
  useEffect(() => {
    if (moveKey !== lastMove.current) {
      lastMove.current = moveKey;
      setSelected([]);
      setArmedCall(false);
      setPickSuit(false);
    }
    if (myTurn && !wasMyTurn.current && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(40);
    wasMyTurn.current = myTurn;
  }, [moveKey, myTurn]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const seatName = (id: string) => (id === me.id ? "You" : g.players.find((p) => p.id === id)?.name ?? "Someone");
  const turnName = seatName(g.turnId);
  const remaining = me.hand.filter((c) => !selected.includes(c));
  const finishing = selected.length > 0 && remaining.length === 0;
  const canCallNow = !me.declared && me.inGame && canFinishInOneTurn(me.hand);
  const canCallWithPlay = !me.declared && myTurn && selected.length > 0 && canFinishInOneTurn(remaining);

  function tap(card: Card) {
    if (!myTurn) return setToast(`Wait for ${turnName === "You" ? "your" : `${turnName}'s`} turn.`);
    if (selected.includes(card)) {
      setSelected(selected[0] === card ? [] : selected.filter((c) => c !== card));
      return;
    }
    if (selected.length && rankOf(card) === rankOf(selected[0])) return setSelected([...selected, card]);
    if (g.playable.includes(card)) return setSelected([card]);
    setToast(hintText());
  }

  function hintText(): string {
    if (g.pendingPick) return `Stack a 2 or 3${g.rules.aceBlocksPenalty ? ", block with an ace," : ""} or pick up ${g.pendingPick}.`;
    if (g.mustAnswer) return "Answer your question with the same suit, or draw.";
    if (g.requestedSuit) return `The ace asked for ${SUIT_NAME[g.requestedSuit]}.`;
    return "That card doesn't match. Same suit or number, or an ace.";
  }

  async function send(run: Parameters<typeof emit>[0]) {
    setBusy(true);
    const r = await emit(run);
    setBusy(false);
    if (!r.ok) setToast(r.error);
    return r.ok;
  }

  function play() {
    if (!selected.length) return;
    const needsSuit = rankOf(selected[0]) === "A" && g.pendingPick === 0 && !finishing;
    if (needsSuit) return setPickSuit(true);
    void send((s, ack) => s.emit("game:play", { cards: selected, declare: armedCall }, ack));
  }

  function playWithSuit(suit: Suit) {
    setPickSuit(false);
    void send((s, ack) => s.emit("game:play", { cards: selected, suit, declare: armedCall }, ack));
  }

  function draw() {
    if (!myTurn) return setToast(`It's ${turnName}'s turn.`);
    void send((s, ack) => s.emit("game:draw", ack));
  }

  function call() {
    if (canCallNow) void send((s, ack) => s.emit("game:declare", ack));
    else if (canCallWithPlay) setArmedCall(!armedCall);
    else setToast("Call it when your cards can all go out on your next turn.");
  }

  async function dealAgain() {
    await send((s, ack) => s.emit("table:start", ack));
  }

  const others = rotateFrom(g.players, me.id).filter((p) => p.id !== me.id);
  const winner = g.winnerId ? g.players.find((p) => p.id === g.winnerId) : null;
  const isHost = snap.seats.find((s) => s.id === me.id)?.host;
  const away = new Set(snap.seats.filter((s) => !s.connected).map((s) => s.id));

  let status: React.ReactNode;
  if (!me.inGame) status = "You're watching. You'll be dealt in next round.";
  else if (myTurn) {
    if (g.pendingPick) status = <>Your turn: stack, block or <b>pick up {g.pendingPick}</b></>;
    else if (g.mustAnswer) status = <>Answer your question</>;
    else status = <>Your turn</>;
  } else status = <>{turnName}&apos;s turn</>;

  return (
    <div className="board">
      <div className="board-top wrap">
        <div>
          <strong>{snap.name}</strong>
          <span> · KADI-{snap.code}</span>
        </div>
        <button type="button" className="link-btn" onClick={onLeave}>
          Leave
        </button>
      </div>

      <ul className="opps wrap" aria-label="Other players">
        {others.map((p) => (
          <li key={p.id} className={`opp${p.id === g.turnId ? " turn" : ""}${away.has(p.id) ? " away" : ""}`}>
            <i aria-hidden="true">{p.name.charAt(0).toUpperCase()}</i>
            <span className="opp-name">{p.name}</span>
            <span className="opp-count">
              {p.count} card{p.count === 1 ? "" : "s"}
            </span>
            {p.declared ? <span className="opp-call">Niko kadi!</span> : null}
            {away.has(p.id) ? <span className="opp-away">away</span> : null}
          </li>
        ))}
      </ul>

      <div className="felt">
        <div className="piles">
          <CardBack
            count={g.deckCount}
            onClick={draw}
            disabled={!myTurn || busy}
            label={g.pendingPick ? `Pick up ${g.pendingPick} cards` : "Draw a card"}
          />
          <div className="discard">
            <PlayingCard card={g.top} size="lg" />
            {g.requestedSuit ? (
              <span className={`asked${isRedSuit(g.requestedSuit) ? " red" : ""}`}>
                Asked for {SUIT_SYMBOL[g.requestedSuit]}
              </span>
            ) : null}
          </div>
        </div>
        <div className="felt-info">
          {g.pendingPick ? <span className="badge hot">Pick {g.pendingPick}</span> : null}
          <span className="badge">{g.direction === 1 ? "↻ Clockwise" : "↺ Kickback"}</span>
        </div>
        <p className="feed" aria-live="polite">
          {g.log[g.log.length - 1]}
        </p>
      </div>

      <div className={`me${myTurn ? " my-turn" : ""}`}>
        <p className="me-status" role="status">
          {status}
          {me.declared ? <span className="badge hot">Niko kadi!</span> : null}
        </p>
        <div className="hand-row" aria-label="Your hand">
          {me.hand.map((c) => (
            <PlayingCard
              key={c}
              card={c}
              selected={selected.includes(c)}
              playable={myTurn && g.playable.includes(c)}
              dim={myTurn && !g.playable.includes(c) && !(selected.length > 0 && rankOf(c) === rankOf(selected[0]))}
              onClick={() => tap(c)}
            />
          ))}
          {!me.hand.length && me.inGame ? <p className="note">No cards!</p> : null}
        </div>
        {me.inGame ? (
          <div className="actions">
            <button
              type="button"
              className={`btn act-call${armedCall ? " armed" : ""}`}
              onClick={call}
              disabled={busy || me.declared || !(canCallNow || canCallWithPlay)}
            >
              {me.declared ? "Called ✓" : armedCall ? "Calling ✓" : "Niko kadi!"}
            </button>
            <button type="button" className="btn btn-ghost act-draw" onClick={draw} disabled={!myTurn || busy}>
              {g.pendingPick && myTurn ? `Pick ${g.pendingPick}` : "Draw"}
            </button>
            <button type="button" className="btn btn-main act-play" onClick={play} disabled={!myTurn || busy || !selected.length}>
              {selected.length > 1 ? `Play ${selected.length}` : "Play"}
            </button>
          </div>
        ) : null}
      </div>

      {toast ? (
        <p className="toast" role="alert">
          {toast}
        </p>
      ) : null}

      {pickSuit ? (
        <div className="sheet-backdrop" onClick={() => setPickSuit(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="suit-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="suit-title">Ask for a suit</h2>
            <div className="suits">
              {SUITS.map((s) => (
                <button key={s} type="button" className={`suit-btn${isRedSuit(s) ? " red" : ""}`} onClick={() => playWithSuit(s)}>
                  <span aria-hidden="true">{SUIT_SYMBOL[s]}</span>
                  {SUIT_NAME[s]}
                </button>
              ))}
            </div>
            <button type="button" className="link-btn" onClick={() => setPickSuit(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {winner ? (
        <div className="sheet-backdrop">
          <div className="sheet win" role="dialog" aria-modal="true" aria-labelledby="win-title">
            <p className="eyebrow">Game over</p>
            <h2 id="win-title">{winner.id === me.id ? "Niko kadi! You won!" : `${winner.name} won!`}</h2>
            <ul className="scores">
              {[...snap.seats]
                .sort((a, b) => b.wins - a.wins)
                .map((s) => (
                  <li key={s.id}>
                    <span>{s.id === me.id ? "You" : s.name}</span>
                    <b>{s.wins}</b>
                  </li>
                ))}
            </ul>
            {isHost ? (
              <button type="button" className="btn btn-main btn-block" onClick={dealAgain} disabled={busy}>
                Deal again
              </button>
            ) : (
              <p className="note">Waiting for the host to deal again…</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Order players starting after `id`, so opponents appear in turn order. */
function rotateFrom<T extends { id: string }>(list: T[], id: string): T[] {
  const i = list.findIndex((p) => p.id === id);
  return i < 0 ? list : [...list.slice(i + 1), ...list.slice(0, i + 1)];
}
