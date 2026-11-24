import { MAX_SEATS, type SeatInfo } from "@/game/protocol";

/** The felt table with up to six seats, as on the landing page. */
export function Seats({ seats, youId }: { seats: SeatInfo[]; youId: string }) {
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
          <li className={`seat${s.connected ? "" : " away"}`} key={s.id}>
            <i aria-hidden="true">{s.name.charAt(0).toUpperCase()}</i>
            <span>
              {s.id === youId ? "You" : s.name}
              {s.host ? " ★" : ""}
            </span>
            {!s.connected ? <em className="seat-note">away</em> : s.wins ? <em className="seat-note">{s.wins} win{s.wins > 1 ? "s" : ""}</em> : null}
          </li>
        );
      })}
    </ul>
  );
}
