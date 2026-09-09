import { useMemo, useState } from "react";
import { CARD_BY_ID, visibleRoles } from "../data/cards";
import { ELEMENT_LABEL, ELEMENT_ORDER, ROLE_LABEL } from "../data/icons";
import { SETS } from "../data/sets";
import { canSpendDuplicates, cardPower, formatDuration, shownLevel } from "../game/formulas";
import { isBusy, isExhausted } from "../game/quests";
import { useGame } from "../store/GameContext";
import type { ElementId, OwnedCard, RoleId } from "../types";
import { CardDossier } from "./CardDossier";
import { CardZoom } from "./CardZoom";
import { LedgerToolbar, VacantSeat } from "./LedgerFilters";
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
      SETS.filter((set) => set.obtain !== "quest" || set.members.some((id) => state.cards.some((owned) => owned.id === id))).map(
        (set) => ({
          set,
          seats: set.members.map((id) => state.cards.find((owned) => owned.id === id) ?? null),
          have: set.members.filter((id) => state.cards.some((owned) => owned.id === id)).length,
          total: set.members.length,
          matched: set.members.some((id) => company.some((owned) => owned.id === id)),
        }),
      ),
    [company, state.cards],
  );

  const listedSets =
    element === "all" && role === "all" && status === "all" ? setGroups : setGroups.filter((group) => group.matched);

  const roleOptions = useMemo(() => visibleRoles(state.cards.map((card) => card.id)), [state.cards]);

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
        className="collection-modal ledger-volume"
      >
        <div className="collection">
          <div className="collection-panel">
            <LedgerToolbar
              view={view}
              onView={setView}
              element={element}
              elementOptions={[
                { id: "all", label: "Any" },
                ...ELEMENT_ORDER.map((id) => ({ id, label: ELEMENT_LABEL[id] })),
              ]}
              onElement={(id) => setElement(id as ElementId | "all")}
              role={role}
              roleOptions={[
                { id: "all", label: "Any" },
                ...roleOptions.map((id) => ({ id, label: ROLE_LABEL[id] })),
              ]}
              onRole={(id) => setRole(id as RoleId | "all")}
              extraLabel="Status"
              extra={status}
              extraOptions={[
                { id: "all", label: "Any" },
                { id: "ready", label: "Ready" },
                { id: "out", label: "On a bounty" },
                { id: "resting", label: "Resting" },
              ]}
              onExtra={setStatus}
            />

            <div className="collection-body">
              {view === "all" ? (
                <section key={`company-${element}-${role}-${status}`} className="view-fade ledger-page">
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
                <section key={`company-set-${element}-${role}-${status}`} className="view-fade ledger-page">
                  <h3 className="section-title">By fellowship</h3>
                  <div className="fellowship-stack">
                    {listedSets.length === 0 ? (
                      <p className="muted">No names match these filters.</p>
                    ) : (
                      listedSets.map(({ set, seats, have, total }) => (
                        <article key={set.id} className="fellowship">
                          <header>
                            <strong>{set.name}</strong>
                            <span>
                              {have}/{total}
                            </span>
                          </header>
                          <p className="muted tight">{set.description}</p>
                          <div className="fellowship-row">
                            {seats.map((owned, index) =>
                              owned ? (
                                <CompanyCard
                                  key={owned.id}
                                  owned={owned}
                                  selected={ui.inspecting === owned.id}
                                  busy={isBusy(state, owned.id)}
                                  resting={isExhausted(state, owned.id, now)}
                                  now={now}
                                  onInspect={() => inspect(owned.id)}
                                />
                              ) : (
                                <VacantSeat key={`${set.id}-empty-${index}`} />
                              ),
                            )}
                          </div>
                        </article>
                      ))
                    )}
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
      {canSpendDuplicates(owned) ? (
        <span className="collection-level-dot" title="Likenesses ready to spend" />
      ) : null}
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
        {shownLevel(owned.level) > 0 ? `Level ${shownLevel(owned.level)} · ` : ""}
        {busy ? "On a bounty" : resting ? `Rests ${formatDuration(owned.exhaustedUntil - now)}` : "Ready"}
      </p>
    </div>
  );
}
