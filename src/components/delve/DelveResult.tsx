import { CARD_BY_ID } from "../../data/cards";
import { CONTRACT_BY_ID } from "../../data/delveContracts";
import { BLESSING_BY_ID } from "../../data/delveBlessings";
import { BACKGROUNDS } from "../../data/backgrounds";
import { HUD_ICONS } from "../../data/hud";
import { cardPower } from "../../game/formulas";
import { useGame } from "../../store/GameContext";
import { PortraitCard } from "../PortraitCard";
import { DelveShell } from "./DelveShell";

export function DelveResult() {
  const { state, finishRoad } = useGame();
  const run = state.activeDelve;
  if (!run?.end) return null;
  const contract = CONTRACT_BY_ID[run.contractId];
  const headline = run.end === "won" ? "The road is walked" : run.end === "abandoned" ? "The company turns back" : "The company is broken";

  return (
    <DelveShell art={BACKGROUNDS.worldmap} kicker={contract?.name ?? "Hearthroads"} title={headline}>
      <section className="delve-result">
        <ul className="result-loot-piles">
          <li className="loot-pile tokens">
            <img className="stat-icon" src={HUD_ICONS.tokens} alt="" />
            <strong>{run.shardsEarned}</strong>
            <span>Token shards</span>
          </li>
        </ul>
        {run.blessingIds.length ? (
          <p className="muted">
            Blessings carried: {run.blessingIds.map((id) => BLESSING_BY_ID[id]?.name ?? id).join(", ")}
          </p>
        ) : null}
        <div className="result-team">
          {run.team.map((id) => {
            const template = CARD_BY_ID[id];
            const owned = state.cards.find((card) => card.id === id);
            const fighter = run.party.find((unit) => unit.id === id);
            if (!template) return null;
            return (
              <div key={id} className="delve-result-card">
                <PortraitCard
                  template={template}
                  owned
                  power={owned ? cardPower(owned) : template.power}
                  size="compact"
                />
                <span>
                  {fighter ? `${Math.max(0, fighter.hp)}/${fighter.maxHp}` : ""}{" "}
                  {run.end === "won" ? "rests" : "recovers"}
                </span>
              </div>
            );
          })}
        </div>
        <button type="button" className="menu-btn on" onClick={() => finishRoad()}>
          Collect and return
        </button>
      </section>
    </DelveShell>
  );
}
