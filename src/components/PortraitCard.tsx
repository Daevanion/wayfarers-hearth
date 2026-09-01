import { useState, type CSSProperties, type MouseEvent } from "react";
import { ELEMENT_ICON, ELEMENT_LABEL, ROLE_LABEL } from "../data/icons";
import { CARD_BACK } from "../data/portraits";
import type { CardTemplate } from "../types";
import { CardDossier } from "./CardDossier";
import { CardZoom } from "./CardZoom";
import { TraitChips } from "./StatIcons";

export function PortraitCard({
  template,
  owned,
  reveal,
  power,
  selected,
  dimmed,
  exhausted,
  size = "guild",
  dossier,
  onClick,
  onHover,
}: {
  template: CardTemplate;
  owned?: boolean;
  reveal?: boolean;
  power?: number;
  selected?: boolean;
  dimmed?: boolean;
  exhausted?: boolean;
  size?: "guild" | "compact" | "inspect";
  dossier?: boolean;
  onClick?: () => void;
  onHover?: (active: boolean) => void;
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, x: 50, y: 50, on: false });
  const [dossierOpen, setDossierOpen] = useState(false);
  const shown = Boolean(owned) || Boolean(reveal);
  const art = shown && template.portrait ? template.portrait : CARD_BACK;
  const shownPower = power ?? template.power;
  const elementIcon = ELEMENT_ICON[template.element];
  const clickable = Boolean(onClick || dossier);

  function move(e: MouseEvent<HTMLElement>) {
    if (dossierOpen) return;
    const frame = e.currentTarget.querySelector(".portrait-frame");
    const r = (frame ?? e.currentTarget).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({
      on: true,
      ry: (x - 0.5) * 18,
      rx: (0.5 - y) * 14,
      x: x * 100,
      y: y * 100,
    });
  }

  function leave() {
    setTilt({ rx: 0, ry: 0, x: 50, y: 50, on: false });
    onHover?.(false);
  }

  function openDossier(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (dossier) setDossierOpen(true);
    onClick?.();
  }

  const style = {
    ["--rx" as string]: `${tilt.rx}deg`,
    ["--ry" as string]: `${tilt.ry}deg`,
    ["--mx" as string]: `${tilt.x}%`,
    ["--my" as string]: `${tilt.y}%`,
    ["--accent" as string]: template.accent,
  } as CSSProperties;

  const className = [
    "portrait-card",
    `size-${size}`,
    `rarity-${template.rarity}`,
    tilt.on ? "lit" : "",
    selected ? "selected" : "",
    dimmed ? "dimmed" : "",
    exhausted ? "injured" : "",
    shown ? "known" : "unknown",
    reveal && !owned ? "ledger" : "",
    clickable ? "clickable" : "",
    dossierOpen ? "is-zoomed" : "",
  ].join(" ");

  const frame = (
    <div className="portrait-frame">
      <img src={art} alt={shown ? template.name : "Undiscovered adventurer"} draggable={false} />
      {shown ? (
        <>
          {elementIcon ? (
            <span className="frame-element" title={`${ELEMENT_LABEL[template.element]} element`}>
              <img src={elementIcon} alt={ELEMENT_LABEL[template.element]} />
            </span>
          ) : null}
          <span className="frame-power" title="Power">
            {shownPower}
          </span>
        </>
      ) : null}
      <span className="portrait-shine" aria-hidden />
    </div>
  );

  const caption = (
    <span className="portrait-caption">
      <strong>{shown ? template.name : "Unknown"}</strong>
      <em>{shown ? ROLE_LABEL[template.role] : "Unrecorded"}</em>
      {shown && size !== "compact" ? <TraitChips traits={template.traits} compact /> : null}
    </span>
  );

  return (
    <article
      className={className}
      style={style}
      onMouseMove={move}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={leave}
    >
      {clickable ? (
        <button type="button" className="portrait-hit" onClick={openDossier}>
          {frame}
          {caption}
        </button>
      ) : (
        <>
          {frame}
          {caption}
        </>
      )}
      {dossierOpen ? (
        <CardZoom onClose={() => setDossierOpen(false)} wide={shown}>
          <CardDossier template={template} power={shownPower} shown={shown} />
        </CardZoom>
      ) : null}
    </article>
  );
}
