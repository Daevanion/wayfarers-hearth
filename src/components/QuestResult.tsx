import { useEffect, useRef, useState } from "react";
import { CARD_BY_ID } from "../data/cards";
import { HUD_ICONS } from "../data/hud";
import { QUEST_BY_ID } from "../data/quests";
import { cardPower, shownLevel, xpToNext } from "../game/formulas";
import { useGame } from "../store/GameContext";
import type { QuestXpGain } from "../types";
import { CardDossier } from "./CardDossier";
import { CardZoom } from "./CardZoom";
import { Modal } from "./Modal";
import { PortraitCard } from "./PortraitCard";

export function QuestResult() {
  const { state, ui, inspect, dismissOutcome } = useGame();
  const outcome = ui.outcome;
  const hoverTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), [outcome]);

  if (!outcome) return null;
  const template = QUEST_BY_ID[outcome.templateId];
  if (!template) return null;

  const headline =
    template.secret && outcome.result !== "fail"
      ? "The chapter is unsealed"
      : outcome.result === "crit"
        ? "A triumph"
        : outcome.result === "success"
          ? "The work is done"
          : "They come back empty-handed";
  const won = outcome.result !== "fail";
  const inspectedOwned = ui.inspecting ? state.cards.find((card) => card.id === ui.inspecting) : null;
  const inspectedTemplate = ui.inspecting ? CARD_BY_ID[ui.inspecting] : null;

  function openCard(id: string) {
    window.clearTimeout(hoverTimer.current);
    inspect(id);
  }

  function hoverCard(id: string, active: boolean) {
    window.clearTimeout(hoverTimer.current);
    if (active) hoverTimer.current = window.setTimeout(() => inspect(id), 1500);
  }

  return (
    <>
      <Modal
        kicker={template.name}
        title={headline}
        onClose={() => {
          inspect(null);
          dismissOutcome();
        }}
        wide
        className={`collection-modal ledger-volume result-modal ${outcome.result}`}
      >
        <div className="quest-result">
          <p className="result-roll">
            The dice: <strong>{outcome.roll}</strong> against <strong>{outcome.success}%</strong>
            {outcome.crit > 0 ? <em> (triumph under {outcome.crit})</em> : null}
          </p>

          <section className="result-loot">
            <h3>Loot received</h3>
            {won ? (
              <ul className="result-loot-piles">
                <li className="loot-pile">
                  <img className="stat-icon" src={HUD_ICONS.gold} alt="" />
                  <strong>{outcome.gold}</strong>
                  <span>Gold{outcome.critMatched ? " · bonus" : ""}</span>
                </li>
                {outcome.tokens > 0 ? (
                  <li className="loot-pile tokens">
                    <img className="stat-icon" src={HUD_ICONS.tokens} alt="" />
                    <strong>{outcome.tokens}</strong>
                    <span>Token{outcome.tokens > 1 ? "s" : ""}</span>
                  </li>
                ) : null}
                <li className="loot-pile xp">
                  <strong>+{outcome.xpEach}</strong>
                  <span>XP each</span>
                </li>
              </ul>
            ) : (
              <p className="result-loot-empty">
                No gold or tokens. A little was learned all the same (+{outcome.xpEach} XP each). They take double rest.
              </p>
            )}
          </section>

          {outcome.critMatched && template.crit && won ? <p className="result-crit">{template.crit.note}</p> : null}

          <section className="result-company">
            <h3 className="section-title">Party Members</h3>
            <div className="result-team">
              {outcome.team.map((id) => {
                const t = CARD_BY_ID[id];
                const gain = outcome.xpGains.find((entry) => entry.id === id);
                const owned = state.cards.find((card) => card.id === id);
                if (!t) return null;
                return (
                  <div key={id} className="result-member collection-card">
                    <PortraitCard
                      template={t}
                      owned
                      power={owned ? cardPower(owned) : t.power}
                      size="guild"
                      selected={ui.inspecting === id}
                      exhausted={outcome.result === "fail"}
                      onClick={() => openCard(id)}
                      onHover={(active) => hoverCard(id, active)}
                    />
                    {gain ? <RankXpBar gain={gain} rankedUp={outcome.leveled.includes(id)} /> : null}
                  </div>
                );
              })}
            </div>
          </section>

          <button
            className="cta"
            type="button"
            onClick={() => {
              inspect(null);
              dismissOutcome();
            }}
          >
            Back to the board
          </button>
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

function RankXpBar({ gain, rankedUp }: { gain: QuestXpGain; rankedUp: boolean }) {
  const fromNeed = xpToNext(gain.fromLevel);
  const toNeed = xpToNext(gain.toLevel);
  const fromPct = fromNeed ? Math.min(100, (gain.fromXp / fromNeed) * 100) : 100;
  const fillPct = gain.toLevel > gain.fromLevel ? 100 : toNeed ? Math.min(100, (gain.toXp / toNeed) * 100) : 100;
  const endPct = toNeed ? Math.min(100, (gain.toXp / toNeed) * 100) : 100;
  const [phase, setPhase] = useState<"from" | "fill" | "reset" | "end">("from");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("end");
      return;
    }
    const start = window.requestAnimationFrame(() => setPhase("fill"));
    if (gain.toLevel <= gain.fromLevel) {
      return () => window.cancelAnimationFrame(start);
    }
    const mid = window.setTimeout(() => setPhase("reset"), 720);
    const end = window.setTimeout(() => setPhase("end"), 760);
    return () => {
      window.cancelAnimationFrame(start);
      window.clearTimeout(mid);
      window.clearTimeout(end);
    };
  }, [gain.fromLevel, gain.toLevel]);

  const width =
    phase === "from" ? fromPct : phase === "fill" ? fillPct : phase === "reset" ? 0 : endPct;
  const remaining = toNeed == null ? null : Math.max(0, toNeed - gain.toXp);
  const nextRank = shownLevel(gain.toLevel) + 1;

  return (
    <div className="result-xp">
      <div className="result-xp-track" aria-hidden>
        <span
          className={`result-xp-fill ${phase === "reset" ? "snap" : "go"}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="result-xp-copy">
        <strong>+{gain.gained} XP</strong>
        {rankedUp ? <em>Rank up</em> : null}
        {remaining == null ? <span>Rank max</span> : <span>{remaining} until rank {nextRank}</span>}
      </p>
    </div>
  );
}
