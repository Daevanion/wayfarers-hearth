import { useMemo, useState } from "react";
import { CARD_BY_ID, CARDS, catalogueRoles } from "../data/cards";
import { ELEMENT_LABEL, ELEMENT_ORDER, ROLE_LABEL } from "../data/icons";
import { SETS } from "../data/sets";
import { cardPower } from "../game/formulas";
import { useGame } from "../store/GameContext";
import type { CardTemplate, ElementId, RoleId } from "../types";
import { CardDossier } from "./CardDossier";
import { CardZoom } from "./CardZoom";
import { LedgerToolbar } from "./LedgerFilters";
import { Modal } from "./Modal";
import { PortraitCard } from "./PortraitCard";

type CatalogueView = "all" | "set";
type ObtainFilter = "all" | "company" | "unrecruited" | "quest";

function obtainBucket(template: CardTemplate, owned: boolean): Exclude<ObtainFilter, "all"> {
  if (owned) return "company";
  return template.obtain === "quest" ? "quest" : "unrecruited";
}

export function Catalogue() {
  const { state, ui, inspect, openCatalogue } = useGame();
  const [view, setView] = useState<CatalogueView>("all");
  const [element, setElement] = useState<ElementId | "all">("all");
  const [role, setRole] = useState<RoleId | "all">("all");
  const [obtain, setObtain] = useState<ObtainFilter>("all");

  const ownedIds = useMemo(() => new Set(state.cards.map((card) => card.id)), [state.cards]);
  const roleOptions = useMemo(() => catalogueRoles(), []);

  const faces = useMemo(
    () =>
      CARDS.filter((template) => {
        if (element !== "all" && template.element !== element) return false;
        if (role !== "all" && template.role !== role) return false;
        if (obtain !== "all" && obtainBucket(template, ownedIds.has(template.id)) !== obtain) return false;
        return true;
      }),
    [element, role, obtain, ownedIds],
  );

  const setGroups = useMemo(
    () =>
      SETS.map((set) => {
        const members = set.members.map((id) => CARD_BY_ID[id]).filter((template): template is CardTemplate => Boolean(template));
        return {
          set,
          members,
          have: members.filter((template) => ownedIds.has(template.id)).length,
          total: members.length,
          matched: members.some((template) => faces.some((face) => face.id === template.id)),
        };
      }),
    [faces, ownedIds],
  );

  const listedSets =
    element === "all" && role === "all" && obtain === "all" ? setGroups : setGroups.filter((group) => group.matched);

  const inspectedOwned = ui.inspecting ? state.cards.find((card) => card.id === ui.inspecting) : null;
  const inspectedTemplate = ui.inspecting ? CARD_BY_ID[ui.inspecting] : null;

  return (
    <>
      <Modal
        kicker="The ledger"
        title="Full catalogue"
        onClose={() => {
          inspect(null);
          openCatalogue(false);
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
              extraLabel="Obtain"
              extra={obtain}
              extraOptions={[
                { id: "all", label: "Any" },
                { id: "company", label: "In company" },
                { id: "unrecruited", label: "Unrecruited" },
                { id: "quest", label: "Quest-bound" },
              ]}
              onExtra={setObtain}
            />

            <div className="collection-body">
              {view === "all" ? (
                <section key={`catalogue-all-${element}-${role}-${obtain}`} className="view-fade ledger-page">
                  <h3 className="section-title">
                    All cards <em>{faces.length}</em>
                  </h3>
                  {faces.length === 0 ? (
                    <p className="muted">No names match these filters.</p>
                  ) : (
                    <div className="guild-grid">
                      {faces.map((template) => (
                        <CatalogueCard
                          key={template.id}
                          id={template.id}
                          selected={ui.inspecting === template.id}
                          owned={ownedIds.has(template.id)}
                          onInspect={() => inspect(template.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <section key={`catalogue-set-${element}-${role}-${obtain}`} className="view-fade ledger-page">
                  <h3 className="section-title">By fellowship</h3>
                  <div className="fellowship-stack">
                    {listedSets.length === 0 ? (
                      <p className="muted">No names match these filters.</p>
                    ) : (
                      listedSets.map(({ set, members, have, total }) => (
                        <article key={set.id} className="fellowship">
                          <header>
                            <strong>{set.name}</strong>
                            <span>
                              {set.obtain === "quest" ? "Quest-bound · " : ""}
                              {have}/{total}
                            </span>
                          </header>
                          <p className="muted tight">{set.description}</p>
                          <div className="fellowship-row">
                            {members.map((template) => (
                              <CatalogueCard
                                key={template.id}
                                id={template.id}
                                selected={ui.inspecting === template.id}
                                owned={ownedIds.has(template.id)}
                                onInspect={() => inspect(template.id)}
                              />
                            ))}
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
      <PortraitCard template={t} owned={owned} reveal selected={selected} size="guild" onClick={onInspect} />
      <p className="assign-meta">
        {owned ? "In company" : t.obtain === "quest" ? "Quest-bound" : "Unrecruited"}
      </p>
    </div>
  );
}
