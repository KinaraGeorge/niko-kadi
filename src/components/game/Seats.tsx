import { MAX_SEATS, type SeatInfo } from "@/game/protocol";

/** The felt table with up to six seats, as on the landing page. */
type Props = { seats: SeatInfo[]; youId: string; onRemove?: (seatId: string) => void };

export function Seats({ seats, youId, onRemove }: Props) {
  return (
    <ul className="table" aria-label="Seats at the table">
      {Array.from({ length: MAX_SEATS }, (_, i) => {
        const s = seats[i];
        if (!s) {
          return (
            <li className="seat empty" key={`open-${i}`}>
              <i aria-hidden="true">+</i>
              <span>Open seat</span>
            </li>
          );
        }
        return (
          <li className={`seat${s.connected ? "" : " away"}${s.bot ? " bot" : ""}`} key={s.id}>
            <i aria-hidden="true">{s.bot ? "🤖" : s.name.charAt(0).toUpperCase()}</i>
            <span>
              {s.id === youId ? "You" : s.name}
              {s.host ? " ★" : ""}
            </span>
            {s.bot ? (
              <em className="seat-note">computer · {s.bot}</em>
            ) : !s.connected ? (
              <em className="seat-note">away</em>
            ) : s.wins ? (
              <em className="seat-note">
                {s.wins} win{s.wins > 1 ? "s" : ""}
              </em>
            ) : null}
            {onRemove && s.id !== youId && (s.bot || !s.connected) ? (
              <button type="button" className="seat-x" aria-label={`Remove ${s.name}`} onClick={() => onRemove(s.id)}>
                ×
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
