import { useState } from "react";
import { useGame } from "../store/GameContext";

export function Journal() {
  const { state, reset } = useGame();
  const [open, setOpen] = useState(false);
  return (
    <div className={`journal ${open ? "open" : ""}`}>
      <button className="journal-toggle" onClick={() => setOpen((v) => !v)}>
        Chronicle
      </button>
      {open ? (
        <>
          <ol>
            {state.journal.map((e) => (
              <li key={e.id} className={e.kind}>
                <time>{new Date(e.at).toLocaleTimeString()}</time>
                {e.text}
              </li>
            ))}
          </ol>
          <button className="ghost tiny" onClick={reset}>
            Extinguish hearth
          </button>
        </>
      ) : null}
    </div>
  );
}
