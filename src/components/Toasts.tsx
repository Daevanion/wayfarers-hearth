import { useGame } from "../store/GameContext";

export function Toasts() {
  const { ui, dismissToast } = useGame();
  return (
    <div className="toasts">
      {ui.toasts.map((t) => (
        <button key={t.id} className={`toast ${t.kind}`} onClick={() => dismissToast(t.id)}>
          {t.text}
        </button>
      ))}
    </div>
  );
}
