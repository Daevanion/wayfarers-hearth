import { CARD_BY_ID } from "../data/cards";
import { HUD_ICONS } from "../data/hud";
import { QUEST_BY_ID } from "../data/quests";
import { useGame } from "../store/GameContext";
import { PortraitCard } from "./PortraitCard";
import { Modal } from "./Modal";

export function QuestResult() {
  const { ui, dismissOutcome } = useGame();
  const outcome = ui.outcome;
  if (!outcome) return null;
  const template = QUEST_BY_ID[outcome.templateId];
  if (!template) return null;

  const headline =
    outcome.result === "crit" ? "A triumph" : outcome.result === "success" ? "The work is done" : "They come back empty-handed";

  return (
    <Modal kicker={template.name} title={headline} onClose={dismissOutcome} className={`result-modal ${outcome.result}`}>
      <div className="quest-result">
        <p className="result-roll">
          The dice: <strong>{outcome.roll}</strong> against <strong>{outcome.success}%</strong>
          {outcome.crit > 0 ? <em> (triumph under {outcome.crit})</em> : null}
        </p>

        {outcome.result === "fail" ? (
          <p className="muted">
            The team returns spent and takes double rest. A little was learned all the same (+{outcome.xpEach} XP each).
          </p>
        ) : (
          <ul className="result-rewards">
            <li>
              <img className="stat-icon" src={HUD_ICONS.gold} alt="" />
              {outcome.gold} gold
              {outcome.critMatched ? <em> (bonus loot)</em> : null}
            </li>
            {outcome.tokens > 0 ? (
              <li>
                <img className="stat-icon" src={HUD_ICONS.tokens} alt="" />
                {outcome.tokens} recruitment token{outcome.tokens > 1 ? "s" : ""}
              </li>
            ) : null}
            <li>+{outcome.xpEach} XP each</li>
          </ul>
        )}

        {outcome.critMatched && template.crit && outcome.result !== "fail" ? (
          <p className="result-crit">{template.crit.note}</p>
        ) : null}

        <div className="result-team">
          {outcome.team.map((id) => {
            const t = CARD_BY_ID[id];
            if (!t) return null;
            return (
              <div key={id} className="result-member">
                <PortraitCard template={t} owned size="compact" exhausted={outcome.result === "fail"} />
                {outcome.leveled.includes(id) ? <p className="result-up">Rank up</p> : null}
              </div>
            );
          })}
        </div>

        <button className="cta" type="button" onClick={dismissOutcome}>
          Back to the board
        </button>
      </div>
    </Modal>
  );
}
