import { ADVENTURER_BY_ID } from "../data/adventurers";
import { BACKGROUNDS } from "../data/backgrounds";
import { ROLES } from "../data/roles";
import { adventurerMods, isInjured, nextLevelCost } from "../game/formulas";
import { useGame } from "../store/GameContext";
import { AdventurerCard } from "./AdventurerCard";
import { Modal } from "./Modal";
import { ModPips } from "./StatIcons";

export function Tavern() {
  const { state, now, openBuilding, raise } = useGame();
  const roster = [...state.adventurers].sort((a, b) =>
    ADVENTURER_BY_ID[a.templateId].name.localeCompare(ADVENTURER_BY_ID[b.templateId].name),
  );

  return (
    <Modal
      kicker="Warm light, wet cloaks"
      title="The Hearth Tavern"
      onClose={() => openBuilding(null)}
      wide
      scene={BACKGROUNDS.tavern}
      tone="hearth"
    >
      <div className="hearth-panel">
        <p className="lede">
          Spend likenesses to deepen a role. A raised Tracker shortens the road further; a raised Jester
          tempts fate more loudly.
        </p>
      </div>
      <div className="raise-list">
        {roster.map((a) => {
          const t = ADVENTURER_BY_ID[a.templateId];
          const cost = nextLevelCost(a.level);
          const role = ROLES[t.role];
          return (
            <article key={a.templateId} className="raise-row hearth-panel">
              <AdventurerCard owned={a} now={now} compact />
              <div className="raise-copy">
                <p>{role.summary}</p>
                <ModPips mods={adventurerMods(a)} showValue />
                <p className="muted">
                  {cost == null
                    ? "Peak rank."
                    : `${a.dupes} / ${cost} likenesses to reach rank ${a.level + 1}`}
                </p>
              </div>
              <button
                className="cta small"
                disabled={cost == null || a.dupes < cost || isInjured(a, now)}
                onClick={() => raise(a.templateId)}
              >
                Raise
              </button>
            </article>
          );
        })}
      </div>
    </Modal>
  );
}
