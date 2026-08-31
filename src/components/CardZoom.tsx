import { useEffect, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function ZoomButton({
  active,
  onClick,
}: {
  active?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={`card-zoom-btn ${active ? "on" : ""}`}
      aria-label={active ? "Close full size" : "View full size"}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14.8 14.8 L20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10.5 8 v5 M8 10.5 h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function CardZoom({
  onClose,
  children,
  wide,
}: {
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="card-zoom-back" onClick={onClose} role="presentation">
        <div className={`card-zoom-panel ${wide ? "wide" : ""}`} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="card-zoom-close icon-btn" onClick={onClose} aria-label="Close full size">
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
