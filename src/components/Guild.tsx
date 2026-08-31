import { useMemo, useState } from "react";
import { CARD_BY_ID } from "../data/cards";
import { COMBAT_LABEL, ELEMENT_LABEL, ELEMENT_ORDER, ROLE_LABEL, ROLE_ORDER } from "../data/icons";
import { cardPower, formatDuration, MAX_LEVEL, RARITY_LABEL, xpToNext } from "../game/formulas";
import { isBusy, isExhausted } from "../game/quests";
import { useGame } from "../store/GameContext";
import type { ElementId, RoleId } from "../types";
import { Modal } from "./Modal";
import { PortraitCard } from "./PortraitCard";
import { CombatBadges, ElementBadge, TraitChips } from "./StatIcons";

type Status = "all" | "ready" | "out" | "resting";

export function Guild() {
  const { state, now, ui, inspect, openGuild } = useGame();
  const [element, setElement] = useState<ElementId | "all">("all");
  const [role, setRole] = useState<RoleId | "all">("all");
  const [status, setStatus] = useState<Status>("all");
  const inspecting = ui.inspecting ? state.cards.find((c) => c.id === ui.inspecting) : null;
  const template = ui.inspecting ? CARD_BY_ID[ui.inspecting] : null;

  const company = useMemo(() => {
    return state.cards.filter((owned) => {
      const t = CARD_BY_ID[owned.id];
      if (!t) return false;
      if (element !== "all" && t.element !== element) return false;
      if (role !== "all" && t.role !== role) return false;
      const busy = isBusy(state, owned.id);
      const resting = isExhausted(state, owned.id, now);
      if (status === "out" && !busy) return false;
      if (status === "resting" && !resting) return false;
      if (status === "ready" && (busy || resting)) return false;
      return true;
    });
  }, [state, element, role, status, now]);

  return (
    <Modal
      kicker="The ledger"
      title="Collection"
      onClose={() => openGuild(false)}
      wide
      className="collection-modal"
    >
      <div className="collection">
        <div className="collection-toolbar">
          <div className="filter-row">
            <span>Element</span>
            <div className="filter-chips">
              <button type="button" className={element === "all" ? "chip on" : "chip"} onClick={() => setElement("all")}>
                All
              </button>
              {ELEMENT_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={element === id ? "chip on" : "chip"}
                  onClick={() => setElement(id)}
                >
                  {ELEMENT_LABEL[id]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span>Role</span>
            <div className="filter-chips">
              <button type="button" className={role === "all" ? "chip on" : "chip"} onClick={() => setRole("all")}>
                All
              </button>
              {ROLE_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={role === id ? "chip on" : "chip"}
                  onClick={() => setRole(id)}
                >
                  {ROLE_LABEL[id]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span>Status</span>
            <div className="filter-chips">
              {(
                [
                  ["all", "All"],
                  ["ready", "Ready"],
                  ["out", "On a bounty"],
                  ["resting", "Resting"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={status === id ? "chip on" : "chip"}
                  onClick={() => setStatus(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="collection-body">
          <section key={`company-${element}-${role}-${status}`} className="view-fade">
            <h3 className="section-title">
              Company <em>{company.length}</em>
            </h3>
            {company.length === 0 ? (
              <p className="muted">No names match these filters.</p>
            ) : (
              <div className="guild-grid">
                {company.map((owned) => {
                  const t = CARD_BY_ID[owned.id];
                  const busy = isBusy(state, owned.id);
                  const resting = isExhausted(state, owned.id, now);
                  return (
                    <div key={owned.id} className="collection-card">
                      <PortraitCard
                        template={t}
                        owned
                        power={cardPower(owned)}
                        exhausted={resting}
                        selected={ui.inspecting === owned.id}
                        size="guild"
                        dossier
                        onClick={() => inspect(owned.id)}
                      />
                      <p className="assign-meta">
                        Rank {owned.level}
                        {busy ? " · On a bounty" : resting ? ` · Rests ${formatDuration(owned.exhaustedUntil - now)}` : " · Ready"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {inspecting && template ? (
            <aside className="inspect-pane collection-inspect">
              <p className="kicker">{ROLE_LABEL[template.role]}</p>
              <h3>{template.name}</h3>
              <p className="adv-title">{template.title}</p>
              <p>{template.flavor}</p>
              <p className="muted">
                {RARITY_LABEL[template.rarity]} · <ElementBadge element={template.element} labeled /> ·{" "}
                {template.combat.map((c) => COMBAT_LABEL[c]).join(" / ")}
              </p>
              <p className="muted">
                Rank {inspecting.level} · Power {cardPower(inspecting)}
                {(() => {
                  const need = xpToNext(inspecting.level);
                  if (need == null) return ` · Peak rank (${MAX_LEVEL})`;
                  return ` · ${inspecting.xp}/${need} XP`;
                })()}
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
