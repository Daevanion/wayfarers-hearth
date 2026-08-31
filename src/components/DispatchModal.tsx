import { useMemo, useState } from "react";
import { CARD_BY_ID } from "../data/cards";
import { ELEMENT_ICON, ELEMENT_LABEL, ROLE_LABEL, TIME_ICON } from "../data/icons";
import { QUEST_BY_ID } from "../data/quests";
import { traitLabel } from "../data/traits";
import { cardPower, formatDuration, signedPct } from "../game/formulas";
import { assessTeam, critLabel, isBusy, isExhausted } from "../game/quests";
import { useGame } from "../store/GameContext";
import type { OwnedCard } from "../types";
import { PortraitCard } from "./PortraitCard";

export function DispatchModal({
  questKey,
  leaving,
  onClose,
}: {
  questKey: string;
  leaving: boolean;
  onClose: () => void;
}) {
  const { state, now, dispatchTeam } = useGame();
  const [team, setTeam] = useState<string[]>([]);
  const quest = state.board.find((q) => q.key === questKey);
  const template = quest ? QUEST_BY_ID[quest.templateId] : null;

  const assessment = useMemo(
    () => (template ? assessTeam(state, template, team) : null),
    [state, template, team],
  );

  if (!quest || !template || !assessment) return null;

  const elementIcon = template.element ? ELEMENT_ICON[template.element] : null;
  const full = team.length === template.teamSize;

  function toggle(id: string) {
    setTeam((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (!template || prev.length >= template.teamSize) return prev;
      return [...prev, id];
    });
  }

  function send() {
    const error = dispatchTeam(questKey, team);
    if (!error) onClose();
  }

  return (
    <div className={`assign-back ${leaving ? "out" : ""}`} onClick={onClose} role="presentation">
      <section
        className={`assign-menu dispatch-menu ${leaving ? "out" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={template.name}
      >
        <header>
          <div>
            <p className="kicker">The bounty board</p>
            <h3>{template.name}</h3>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <p className="quest-flavor">{template.flavor}</p>

        <ul className="quest-facts">
          <li>
            <img src={TIME_ICON} alt="" />
            {formatDuration(template.durationMs)}
          </li>
          <li>
            <strong>{template.power}</strong> power needed
          </li>
          <li>Team of {template.teamSize}</li>
          {template.element ? (
            <li className="quest-element">
              {elementIcon ? <img src={elementIcon} alt="" /> : null}
              {ELEMENT_LABEL[template.element]} favored
            </li>
          ) : null}
        </ul>

        <ul className="quest-lines">
          {template.advantages.map((adv) => (
            <li key={`a-${adv.id}`} className="good">
              Advantage ({signedPct(adv.pct)}): {adv.type === "trait" ? traitLabel(adv.id) : ROLE_LABEL[adv.id as never]}
            </li>
          ))}
          {template.hazards.map((haz) => (
            <li key={`h-${haz.id}`} className="bad">
              Hazard ({signedPct(haz.pct)}): {haz.type === "trait" ? traitLabel(haz.id) : ROLE_LABEL[haz.id as never]}
            </li>
          ))}
          {template.crit ? (
            <li className="crit">
              Critical match (bonus loot): {critLabel(template)} — {template.crit.note}
            </li>
          ) : null}
        </ul>

        <div className="assign-grid dispatch-grid">
          {state.cards.map((owned) => (
            <DispatchChoice
              key={owned.id}
              owned={owned}
              picked={team.includes(owned.id)}
              busy={isBusy(state, owned.id)}
              exhausted={isExhausted(state, owned.id, now)}
              restLeft={Math.max(0, owned.exhaustedUntil - now)}
              teamFull={full}
              onToggle={() => toggle(owned.id)}
            />
          ))}
        </div>

        <footer className="dispatch-footer">
          <div className="dispatch-odds">
            <p className="odds-power">
              Power <strong>{assessment.effPower}</strong> / {assessment.need}
              {assessment.effPower !== assessment.power ? <em> (affinity counted)</em> : null}
            </p>
            {assessment.mods.length > 0 ? (
              <ul className="odds-mods">
                {assessment.mods.map((m) => (
                  <li key={m.label} className={m.pct >= 0 ? "good" : "bad"}>
                    {m.label} {signedPct(m.pct)}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className={`odds-line ${assessment.success >= 75 ? "high" : assessment.success >= 45 ? "mid" : "low"}`}>
              {team.length === 0 ? "Pick a team" : `${assessment.success}% success`}
              {assessment.crit > 0 ? ` · ${assessment.crit}% triumph` : ""}
              {assessment.critMatched ? " · bonus loot" : ""}
            </p>
          </div>
          <button className="cta" type="button" disabled={!full} onClick={send}>
            {full ? "Send them out" : `Pick ${template.teamSize - team.length} more`}
          </button>
        </footer>
      </section>
    </div>
  );
}

function DispatchChoice({
  owned,
  picked,
  busy,
  exhausted,
  restLeft,
  teamFull,
  onToggle,
}: {
  owned: OwnedCard;
  picked: boolean;
  busy: boolean;
  exhausted: boolean;
  restLeft: number;
  teamFull: boolean;
  onToggle: () => void;
}) {
  const t = CARD_BY_ID[owned.id];
  if (!t) return null;
  const disabled = busy || exhausted || (teamFull && !picked);
  return (
    <button
      type="button"
      className={`assign-choice ${picked ? "on" : ""} ${busy || exhausted ? "hurt" : ""}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <PortraitCard
        template={t}
        owned
        power={cardPower(owned)}
        selected={picked}
        exhausted={exhausted}
        dimmed={disabled && !picked}
        size="compact"
      />
      <p className="assign-meta">
        {busy ? "Out on a bounty" : exhausted ? `Rests ${formatDuration(restLeft)}` : picked ? "Picked" : `Power ${cardPower(owned)}`}
      </p>
    </button>
  );
}
