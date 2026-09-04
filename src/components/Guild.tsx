import { useMemo, useState } from "react";
import { CARD_BY_ID } from "../data/cards";
import { ELEMENT_LABEL, ELEMENT_ORDER, ROLE_LABEL, ROLE_ORDER } from "../data/icons";
import { SETS } from "../data/sets";
import { cardPower, formatDuration } from "../game/formulas";
import { isBusy, isExhausted } from "../game/quests";
import { useGame } from "../store/GameContext";
import type { ElementId, OwnedCard, RoleId } from "../types";
import { CardDossier } from "./CardDossier";
import { CardZoom } from "./CardZoom";
import { Modal } from "./Modal";
import { PortraitCard } from "./PortraitCard";

type Status = "all" | "ready" | "out" | "resting";
type ViewMode = "all" | "set";

export function Guild() {
  const { state, now, ui, inspect, openGuild } = useGame();
  const [view, setView] = useState<ViewMode>("all");
  const [element, setElement] = useState<ElementId | "all">("all");
  const [role, setRole] = useState<RoleId | "all">("all");
  const [status, setStatus] = useState<Status>("all");

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

  const setGroups = useMemo(
    () =>
      SETS.map((set) => ({
        set,
        members: set.members.map((id) => company.find((owned) => owned.id === id)).filter((owned): owned is OwnedCard => Boolean(owned)),
        have: set.members.filter((id) => state.cards.some((owned) => owned.id === id)).length,
        total: set.members.length,
      })),
    [company, state.cards],
  );

  const inspectedOwned = ui.inspecting ? state.cards.find((card) => card.id === ui.inspecting) : null;
  const inspectedTemplate = ui.inspecting ? CARD_BY_ID[ui.inspecting] : null;

  return (
    <>
    <Modal
      kicker="The ledger"
      title="Collection"
      onClose={() => {
        inspect(null);
        openGuild(false);
      }}
      wide
      className="collection-modal collection-scene"
    >
      <div className="collection">
        <div className="collection-panel">
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
            {view === "all" ? (
              <section key={`company-${element}-${role}-${status}`} className="view-fade collection-section">
                <h3 className="section-title">
                  Company <em>{company.length}</em>
                </h3>
                {company.length === 0 ? (
                  <p className="muted">No names match these filters.</p>
                ) : (
                  <div className="guild-grid">
                    {company.map((owned) => (
                      <CompanyCard
                        key={owned.id}
                        owned={owned}
                        selected={ui.inspecting === owned.id}
                        busy={isBusy(state, owned.id)}
                        resting={isExhausted(state, owned.id, now)}
                        now={now}
                        onInspect={() => inspect(owned.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <section key={`company-set-${element}-${role}-${status}`} className="view-fade">
                <h3 className="section-title">By set</h3>
                <p className="muted tight">The same company, gathered by fellowship.</p>
                <div className="set-stack">
                  {setGroups.map(({ set, members, have, total }) => (
                    <article key={set.id} className="set-block">
                      <header>
                        <strong>{set.name}</strong>
                        <span>
                          {have}/{total}
                        </span>
                      </header>
                      <p className="muted tight">{set.description}</p>
                      {members.length === 0 ? (
                        <p className="muted">None in company match these filters.</p>
                      ) : (
                        <div className="set-row">
                          {members.map((owned) => (
                            <CompanyCard
                              key={owned.id}
                              owned={owned}
                              selected={ui.inspecting === owned.id}
                              busy={isBusy(state, owned.id)}
                              resting={isExhausted(state, owned.id, now)}
                              now={now}
                              onInspect={() => inspect(owned.id)}
                            />
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </Modal>
    {inspectedTemplate ? (
      <CardZoom onClose={() => inspect(null)} wide>
        <CardDossier
          template={inspectedTemplate}
          power={inspectedOwned ? cardPower(inspectedOwned) : inspectedTemplate.power}
          shown
        />
      </CardZoom>
    ) : null}
    </>
  );
}

function CompanyCard({
  owned,
  selected,
  busy,
  resting,
  now,
  onInspect,
}: {
  owned: OwnedCard;
  selected: boolean;
  busy: boolean;
  resting: boolean;
  now: number;
  onInspect: () => void;
}) {
  const t = CARD_BY_ID[owned.id];
  if (!t) return null;
  return (
    <div className="collection-card">
      <PortraitCard
        template={t}
        owned
        power={cardPower(owned)}
        exhausted={resting}
        selected={selected}
        size="guild"
        onClick={onInspect}
      />
      <p className="assign-meta">
        Rank {owned.level}
        {busy ? " · On a bounty" : resting ? ` · Rests ${formatDuration(owned.exhaustedUntil - now)}` : " · Ready"}
      </p>
    </div>
  );
}
