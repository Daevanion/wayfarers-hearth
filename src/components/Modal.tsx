import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

export function Modal({
  title,
  kicker,
  onClose,
  children,
  wide,
  scene,
  page,
  tone,
  className,
}: {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  scene?: string;
  page?: string;
  tone?: "hearth" | "road" | "stage";
  className?: string;
}) {
  const [leaving, setLeaving] = useState(false);

  function requestClose() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onClose, 240);
  }

  const style = scene
    ? ({ ["--scene-bg" as string]: `url(${scene})` } as CSSProperties)
    : undefined;

  function sway(event: MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * -20;
    const y = ((event.clientY - box.top) / box.height - 0.5) * -14;
    event.currentTarget.style.setProperty("--sway-x", `${x.toFixed(1)}px`);
    event.currentTarget.style.setProperty("--sway-y", `${y.toFixed(1)}px`);
  }

  return (
    <div className={`modal-back ${leaving ? "out" : ""}`} onClick={requestClose} onMouseMove={sway} role="presentation">
      <section
        className={`modal ${wide ? "wide" : ""} ${scene ? "has-scene" : ""} ${page ? "has-page" : ""} ${tone ? `scene-${tone}` : ""} ${className ?? ""} ${leaving ? "out" : ""}`}
        style={style}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        {page ? <img className="modal-page-bg" src={page} alt="" /> : null}
        {scene ? (
          <>
            <div className="modal-scene" aria-hidden />
            <div className={`modal-veil ${tone ? `veil-${tone}` : ""}`} aria-hidden />
          </>
        ) : null}
        <header className="modal-head">
          <div>
            {kicker ? <p className="kicker">{kicker}</p> : null}
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={requestClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function Tabs({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string; sfx?: "flip" | "card" }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.id}
          className={value === opt.id ? "tab on" : "tab"}
          onClick={() => onChange(opt.id)}
          role="tab"
          aria-selected={value === opt.id}
          data-sfx={opt.sfx}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}
