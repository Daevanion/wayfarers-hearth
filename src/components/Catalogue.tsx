import { useState } from "react";
import { CARDS, CARD_BY_ID } from "../data/cards";
import { COMBAT_LABEL, ROLE_LABEL } from "../data/icons";
import { SETS } from "../data/sets";
import { RARITY_LABEL } from "../game/formulas";
import { useGame } from "../store/GameContext";
import { Modal } from "./Modal";
import { PortraitCard } from "./PortraitCard";
import { CombatBadges, ElementBadge, TraitChips } from "./StatIcons";

type CatalogueView = "all" | "set";

export function Catalogue() {
  const { state, ui, inspect, openCatalogue } = useGame();
  const [view, setView] = useState<CatalogueView>("all");
  const ownedIds = new Set(state.cards.map((c) => c.id));
  const template = ui.inspecting ? CARD_BY_ID[ui.inspecting] : null;

  return (
    <Modal
      kicker="Every name"
      title="Full catalogue"
      onClose={() => openCatalogue(false)}
      wide
      className="collection-modal"
    >
      <div className="collection">
        <div className="collection-toolbar">
          <div className="filter-row">
            <span>View</span>
            <div className="filter-chips">
              <button type="button" className={view === "all" ? "chip on" : "chip"} onClick={() => setView("all")}>
                All
              </button>
              <button type="button" className={view === "set" ? "chip on" : "chip"} onClick={() => setView("set")}>
                Set
              </button>
            </div>
          </div>
        </div>

        <div className="collection-body">
          {view === "all" ? (
            <section key="catalogue-all" className="view-fade">
              <h3 className="section-title">
                All cards <em>{CARDS.length}</em>
              </h3>
              <p className="muted tight">Every face in the game, whether they walk with you or not.</p>
              <div className="guild-grid">
                {CARDS.map((t) => (
                  <CatalogueCard
                    key={t.id}
                    id={t.id}
                    selected={ui.inspecting === t.id}
                    owned={ownedIds.has(t.id)}
                    onInspect={() => inspect(t.id)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section key="catalogue-set" className="view-fade">
              <h3 className="section-title">By set</h3>
              <p className="muted tight">The same ledger, gathered by fellowship. A full set sent together fights better.</p>
              <div className="set-stack">
                {SETS.map((set) => {
                  const members = set.members.map((id) => CARD_BY_ID[id]).filter(Boolean);
                  const have = members.filter((t) => ownedIds.has(t.id)).length;
                  return (
                    <article key={set.id} className="set-block">
                      <header>
                        <strong>{set.name}</strong>
                        <span>
                          {have}/{members.length}
                        </span>
                      </header>
                      <p className="muted tight">{set.description}</p>
                      <div className="set-row">
                        {members.map((t) => (
                          <CatalogueCard
                            key={t.id}
                            id={t.id}
                            selected={ui.inspecting === t.id}
                            owned={ownedIds.has(t.id)}
                            onInspect={() => inspect(t.id)}
                          />
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {template ? (
            <aside className="inspect-pane collection-inspect menu-fade-in">
              <p className="kicker">{ROLE_LABEL[template.role]}</p>
              <h3>{template.name}</h3>
              <p className="adv-title">{template.title}</p>
              <p>{template.flavor}</p>
              <p className="muted">
                {RARITY_LABEL[template.rarity]} · <ElementBadge element={template.element} labeled /> ·{" "}
                {template.combat.map((c) => COMBAT_LABEL[c]).join(" / ")} · Power {template.power}
                {ownedIds.has(template.id) ? "" : " · Not yet in the company"}
              </p>
              <CombatBadges combat={template.combat} labeled />
              <TraitChips traits={template.traits} />
            </aside>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function CatalogueCard({
  id,
  owned,
  selected,
  onInspect,
}: {
  id: string;
  owned: boolean;
  selected: boolean;
  onInspect: () => void;
}) {
  const t = CARD_BY_ID[id];
  if (!t) return null;
  return (
    <div className="collection-card">
      <PortraitCard template={t} owned={owned} reveal selected={selected} size="guild" dossier onClick={onInspect} />
      <p className="assign-meta">{owned ? "In company" : "Unrecruited"}</p>
    </div>
  );
}
