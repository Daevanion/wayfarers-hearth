import { useState } from "react";
import { CARD_BY_ID } from "../../data/cards";
import { ENCOUNTER_BY_ID } from "../../data/delveEncounters";
import { ELEMENT_ICON } from "../../data/icons";
import { actionsFor, combatCleared, intentLabel } from "../../game/delve";
import { cardPower } from "../../game/formulas";
import { useGame } from "../../store/GameContext";
import type { DelveActionId } from "../../types";
import { PortraitCard } from "../PortraitCard";
import { DelveShell } from "./DelveShell";

export function DelveCombat() {
  const { state, actOnRoad, continueRoad } = useGame();
  const run = state.activeDelve;
  const combat = run?.combat;
  const [actorId, setActorId] = useState<string | null>(null);
  const [action, setAction] = useState<DelveActionId | null>(null);
  const node = run?.nodes.find((entry) => entry.id === run.currentNodeId);
  const scene = node?.art;
  const cleared = combatCleared(run ?? null);

  if (!run || !combat) return null;

  const selected = actorId ? combat.party.find((unit) => unit.id === actorId) : null;
  const verbs = actorId ? actionsFor(actorId) : [];
  const chosen = verbs.find((entry) => entry.id === action);

  function pickActor(id: string) {
    const unit = combat!.party.find((entry) => entry.id === id);
    if (!unit || unit.hp <= 0 || unit.acted || cleared) return;
    setActorId(id);
    setAction(null);
  }

  function pickAction(id: DelveActionId) {
    const verb = verbs.find((entry) => entry.id === id);
    if (!verb || !actorId) return;
    if (verb.needs === "none") {
      actOnRoad(actorId, id);
      setAction(null);
      setActorId(null);
      return;
    }
    setAction(id);
  }

  function pickEnemy(instanceId: string) {
    if (!actorId || !chosen || chosen.needs !== "enemy") return;
    actOnRoad(actorId, chosen.id, instanceId);
    setAction(null);
    setActorId(null);
  }

  function pickAlly(id: string) {
    if (!actorId || !chosen || chosen.needs !== "ally") return;
    actOnRoad(actorId, chosen.id, id);
    setAction(null);
    setActorId(null);
  }

  const title = ENCOUNTER_BY_ID[combat.enemies[0]?.encounterId]?.name ?? "Ambush";

  return (
    <DelveShell art={scene} kicker={`Round ${combat.round}`} title={title}>
      <div className="delve-combat">
        <ul className="delve-foes">
          {combat.enemies.map((enemy) => {
            const def = ENCOUNTER_BY_ID[enemy.encounterId];
            const dead = enemy.hp <= 0;
            const el = def?.element ? ELEMENT_ICON[def.element] : null;
            return (
              <li key={enemy.instanceId}>
                <button
                  type="button"
                  className={`delve-foe ${dead ? "dead" : ""} ${chosen?.needs === "enemy" ? "targetable" : ""}`}
                  disabled={dead || chosen?.needs !== "enemy"}
                  onClick={() => pickEnemy(enemy.instanceId)}
                >
                  <img src={def?.art} alt="" />
                  <strong>{def?.name ?? "Foe"}</strong>
                  {el ? <img className="delve-foe-el" src={el} alt="" /> : null}
                  <span className="delve-hp">
                    {Math.max(0, enemy.hp)}/{enemy.maxHp}
                    {enemy.block > 0 ? ` · ${enemy.block} blk` : ""}
                  </span>
                  <em>{dead ? "Fallen" : intentLabel(enemy.intent)}</em>
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="delve-log">
          {combat.log.slice(-8).map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>

        <div className="delve-party-combat">
          {combat.party.map((unit) => {
            const template = CARD_BY_ID[unit.id];
            const owned = state.cards.find((card) => card.id === unit.id);
            if (!template) return null;
            return (
              <div key={unit.id} className={`delve-fighter ${unit.acted ? "acted" : ""} ${unit.hp <= 0 ? "down" : ""}`}>
                <PortraitCard
                  template={template}
                  owned
                  power={owned ? cardPower(owned) : template.power}
                  size="compact"
                  selected={actorId === unit.id}
                  dimmed={unit.hp <= 0 || unit.acted || cleared}
                  onClick={() => (chosen?.needs === "ally" ? pickAlly(unit.id) : pickActor(unit.id))}
                />
                <span className="delve-hp">
                  {Math.max(0, unit.hp)}/{unit.maxHp}
                  {unit.block > 0 ? ` · ${unit.block} blk` : ""}
                </span>
              </div>
            );
          })}
        </div>

        {cleared ? (
          <button type="button" className="menu-btn on" onClick={() => continueRoad()}>
            Continue
          </button>
        ) : (
          <div className="delve-verbs">
            {verbs.map((verb) => (
              <button
                key={verb.id}
                type="button"
                className={`menu-btn ${action === verb.id ? "on" : ""}`}
                disabled={!selected || selected.acted || selected.hp <= 0}
                onClick={() => pickAction(verb.id)}
              >
                {verb.label}
              </button>
            ))}
            {chosen?.needs === "enemy" ? <p className="muted tight">Choose a foe.</p> : null}
            {chosen?.needs === "ally" ? <p className="muted tight">Choose an ally to mend.</p> : null}
          </div>
        )}
      </div>
    </DelveShell>
  );
}
