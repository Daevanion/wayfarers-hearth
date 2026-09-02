import { useRef, useState, type MouseEvent } from "react";
import { CARD_BACK } from "../data/portraits";
import { ELEMENT_ICON, ELEMENT_LABEL, ROLE_LABEL } from "../data/icons";
import { cardLore } from "../data/lore";
import { TRAITS } from "../data/traits";
import type { CardTemplate } from "../types";
import { affinityTitle, LoreText } from "./LoreText";
import { CombatBadges } from "./StatIcons";
import { ArtLightbox, ZoomButton } from "./CardZoom";

export function CardDossier({
  template,
  power,
  shown = true,
}: {
  template: CardTemplate;
  power?: number;
  shown?: boolean;
}) {
  const [artOpen, setArtOpen] = useState(false);
  const hoverTimer = useRef(0);
  const art = shown && template.portrait ? template.portrait : CARD_BACK;
  const lore = shown ? cardLore(template.id, template.flavor) : "";
  const shownPower = power ?? template.power;
  const elementIcon = ELEMENT_ICON[template.element];

  function openArt(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    window.clearTimeout(hoverTimer.current);
    setArtOpen(true);
  }

  function onArtEnter() {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setArtOpen(true), 1500);
  }

  function onArtLeave() {
    window.clearTimeout(hoverTimer.current);
  }

  if (!shown) {
    return (
      <figure className="card-zoom-art">
        <img src={CARD_BACK} alt="Undiscovered adventurer" />
        <figcaption>
          <strong>Unknown</strong>
          <em>Unrecorded</em>
        </figcaption>
      </figure>
    );
  }

  return (
    <>
      <article className="card-dossier">
        <figure className="dossier-art" onMouseEnter={onArtEnter} onMouseLeave={onArtLeave}>
          <button type="button" className="dossier-art-hit" onClick={openArt} aria-label={`View ${template.name} full size`}>
            <img src={art} alt={template.name} />
          </button>
          <ZoomButton className="dossier-zoom-btn" onClick={openArt} />
        </figure>
        <div className="dossier-copy">
          <p className="kicker">{ROLE_LABEL[template.role]}</p>
          <h3>{template.name}</h3>
          <p className="adv-title">{template.title}</p>
          <LoreText template={template} text={lore} />
          <dl className="dossier-stats">
            <div className="dossier-stat">
              <dt>{affinityTitle(template.element)}</dt>
              <dd>
                {elementIcon ? <img src={elementIcon} alt="" /> : <span className="el-null-mark">◇</span>}
                <span>{ELEMENT_LABEL[template.element]}</span>
              </dd>
            </div>
            <div className="dossier-stat">
              <dt>Power Level</dt>
              <dd>
                <strong>{shownPower}</strong>
              </dd>
            </div>
            <div className="dossier-stat combat">
              <dt>Combat</dt>
              <dd>
                <CombatBadges combat={template.combat} labeled />
              </dd>
            </div>
            <div className="dossier-stat traits">
              <dt>Traits</dt>
              <dd>
                <ul className="trait-chips dossier-traits">
                  {template.traits.map((id) => {
                    const def = TRAITS[id];
                    if (!def) return null;
                    return (
                      <li key={id} className={def.good ? "good" : "bad"} title={def.blurb}>
                        <strong>{def.name}</strong>
                        <em>{def.blurb}</em>
                      </li>
                    );
                  })}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </article>
      {artOpen ? <ArtLightbox src={art} alt={template.name} onClose={() => setArtOpen(false)} /> : null}
    </>
  );
}
