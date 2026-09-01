import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

function useArmOverlay(delay = 120) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);
  return armed;
}

export function ZoomButton({
  active,
  onClick,
  className,
}: {
  active?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`card-zoom-btn ${active ? "on" : ""} ${className ?? ""}`}
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

const ART_ZOOM_LEVELS = [1, 1.25, 1.5] as const;

export function ArtLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [scale, setScale] = useState<(typeof ART_ZOOM_LEVELS)[number]>(1);
  const [leaving, setLeaving] = useState(false);
  const armed = useArmOverlay();

  const requestClose = useCallback(() => {
    setLeaving((current) => {
      if (current) return current;
      window.setTimeout(onClose, 220);
      return true;
    });
  }, [onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  return createPortal(
    <div
      className={`art-lightbox-back ${leaving ? "out" : ""} ${armed ? "armed" : ""}`}
      onClick={armed ? requestClose : undefined}
      role="presentation"
    >
      <div
        className={`art-lightbox ${leaving ? "out" : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${alt} — full size`}
      >
        <button type="button" className="icon-btn art-lightbox-close" onClick={requestClose} aria-label="Close">
          ✕
        </button>
        <figure className="art-lightbox-figure">
          <img src={src} alt={alt} style={{ transform: `scale(${scale})` }} draggable={false} />
        </figure>
        <div className="art-lightbox-controls" role="group" aria-label="Zoom level">
          {ART_ZOOM_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={scale === level ? "chip on" : "chip"}
              onClick={() => setScale(level)}
              aria-pressed={scale === level}
            >
              {level === 1 ? "1×" : `${level}×`}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
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
  const [leaving, setLeaving] = useState(false);
  const armed = useArmOverlay();

  const requestClose = useCallback(() => {
    setLeaving((current) => {
      if (current) return current;
      window.setTimeout(onClose, 240);
      return true;
    });
  }, [onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  return createPortal(
    <div
      className={`card-zoom-back ${leaving ? "out" : ""} ${armed ? "armed" : ""}`}
      onClick={armed ? requestClose : undefined}
      role="presentation"
    >
      <div
        className={`card-zoom-panel ${wide ? "wide" : ""} ${leaving ? "out" : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="card-zoom-head">
          <button type="button" className="icon-btn card-zoom-close" onClick={requestClose} aria-label="Close">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
