import { ADVENTURER_BY_ID } from "../data/adventurers";
import { formatDuration, healCost, isInjured } from "../game/formulas";
import { useGame } from "../store/GameContext";
import { AdventurerCard } from "./AdventurerCard";
import { Modal } from "./Modal";

export function Church() {
  const { state, now, openBuilding, heal, healWard } = useGame();
  const wounded = state.adventurers.filter((a) => isInjured(a, now));
  const allCost = wounded.reduce((sum, a) => sum + healCost(a, now), 0);

  return (
    <Modal kicker="Candle smoke and linen" title="Saint's Rest" onClose={() => openBuilding(null)}>
      <p className="lede">
        Failed roads leave the company in the ward. Time will mend them, or gold will hurry the saints.
      </p>
      {wounded.length === 0 ? (
        <p className="empty">The benches are empty. The hearth has been kind.</p>
      ) : (
        <>
          <div className="cost-row">
            <span>Restore all</span>
            <button className="cta small" disabled={state.gold < allCost} onClick={() => healWard()}>
              {allCost} gold
            </button>
          </div>
          <div className="stack">
            {wounded.map((a) => {
              const t = ADVENTURER_BY_ID[a.templateId];
              const cost = healCost(a, now);
              return (
                <article key={a.templateId} className="raise-row">
                  <AdventurerCard owned={a} now={now} compact />
                  <div className="raise-copy">
                    <p>{t.name} cannot walk the road until the wound closes.</p>
                    <p className="muted">
                      {a.injuredUntil ? formatDuration(a.injuredUntil - now) : ""} remaining
                    </p>
                  </div>
                  <button className="cta small" disabled={state.gold < cost} onClick={() => heal(a.templateId)}>
                    Heal · {cost}g
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
