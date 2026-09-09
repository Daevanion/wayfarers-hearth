import { useCallback, useEffect, useState } from "react";
import { CARD_BY_ID } from "../data/cards";
import { QUEST_BY_ID } from "../data/quests";
import { TRAITS } from "../data/traits";
import { cardPower, formatDuration } from "../game/formulas";
import { allQuests, cardQuestRibbons, questClock, TIER_LABEL } from "../game/quests";
import { useGame } from "../store/GameContext";
import type { BoardQuest, CardTemplate, OwnedCard, QuestTemplate } from "../types";
import { PortraitCard } from "./PortraitCard";

export function QuestTrack({ hidden }: { hidden?: boolean }) {
  const { state, now } = useGame();
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const underway = allQuests(state).filter((q) => q.status === "underway");

  const closeView = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      setViewKey(null);
      setLeaving(false);
    }, 240);
  }, [leaving]);

  if (underway.length === 0) return null;

  const viewing = underway.find((q) => q.key === viewKey) ?? null;

  return (
    <>
      <aside className={`quest-track ${hidden ? "is-hidden" : ""}`} aria-label="Companies on the road">
        <p className="quest-track-kicker">On the road</p>
        <ul className="quest-track-list">
          {underway.map((quest) => (
            <li key={quest.key}>
              <TrackCard quest={quest} now={now} onOpen={() => setViewKey(quest.key)} />
            </li>
          ))}
        </ul>
      </aside>
      {viewing ? <MissionView quest={viewing} now={now} leaving={leaving} onClose={closeView} /> : null}
    </>
  );
}

function TrackCard({
  quest,
  now,
  onOpen,
}: {
  quest: BoardQuest;
  now: number;
  onOpen: () => void;
}) {
  const template = QUEST_BY_ID[quest.templateId];
  if (!template) return null;
  const clock = questClock(quest, now);
  return (
    <button
      type="button"
      className={`quest-track-card tier-${template.tier} ${clock.ready ? "ready" : ""}`}
      onClick={onOpen}
    >
      <img src={template.art} alt="" />
      <span className="quest-track-copy">
        <em>{TIER_LABEL[template.tier]}</em>
        <strong>{template.name}</strong>
        <span className="quest-track-bar" aria-hidden>
          <span style={{ width: `${Math.round(clock.ratio * 100)}%` }} />
        </span>
        <span className="quest-track-time">{clock.ready ? "Returned" : formatDuration(clock.remaining)}</span>
      </span>
    </button>
  );
}

function MissionView({
  quest,
  now,
  leaving,
  onClose,
}: {
  quest: BoardQuest;
  now: number;
  leaving: boolean;
  onClose: () => void;
}) {
  const { state, resolve } = useGame();
  const template = QUEST_BY_ID[quest.templateId];
  const clock = questClock(quest, now);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!template) return null;

  return (
    <div className={`mission-view ${leaving ? "out" : ""}`} onClick={onClose} role="presentation">
      <section
        className={`mission-stage ${leaving ? "out" : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={template.name}
      >
        <img className="mission-art" src={template.art} alt="" />
        <span className={`mission-miasma tier-${template.tier}`} aria-hidden />
        <span className="mission-veil" aria-hidden />
        <button type="button" className="icon-btn mission-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="mission-copy">
          <header className="mission-head">
            <p className="kicker">
              {TIER_LABEL[template.tier]} · {clock.ready ? "Returned" : formatDuration(clock.remaining)}
            </p>
            <h2>{template.name}</h2>
            <p className="mission-flavor">{template.flavor}</p>
            <p className="mission-lore">{template.lore}</p>
          </header>
          <section className="mission-party-block">
            <h3>Party Members</h3>
            <ul className="mission-party">
              {quest.team.map((id) => {
                const t = CARD_BY_ID[id];
                const owned = state.cards.find((c) => c.id === id);
                if (!t || !owned) return null;
                return (
                  <li key={id}>
                    <MissionMember card={t} owned={owned} quest={template} />
                  </li>
                );
              })}
            </ul>
          </section>
          {clock.ready ? (
            <button
              type="button"
              className="cta mission-report"
              onClick={() => {
                resolve(quest.key);
                onClose();
              }}
            >
              Hear the report
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MissionMember({
  card,
  owned,
  quest,
}: {
  card: CardTemplate;
  owned: OwnedCard;
  quest: QuestTemplate;
}) {
  const ribbons = cardQuestRibbons(card, quest);
  const favoredTraits = new Set(quest.advantages.filter((adv) => adv.type === "trait").map((adv) => adv.id));
  const hazardTraits = new Set(quest.hazards.filter((haz) => haz.type === "trait").map((haz) => haz.id));
  const roleFavored = quest.advantages.some((adv) => adv.type === "role" && card.role === adv.id);
  const roleHazard = quest.hazards.some((haz) => haz.type === "role" && card.role === haz.id);

  return (
    <article className="mission-member">
      <div className="mission-member-frame">
        <PortraitCard template={card} owned power={cardPower(owned)} size="guild" hideTraits />
        {(ribbons.favored || ribbons.hazard) && (
          <div className="mission-ribbons">
            {ribbons.favored ? <span className="mission-ribbon favored">Favored</span> : null}
            {ribbons.hazard ? <span className="mission-ribbon hazard">Hazard</span> : null}
          </div>
        )}
      </div>
      <ul className="mission-traits">
        {card.traits.map((id) => {
          const def = TRAITS[id];
          if (!def) return null;
          const match = favoredTraits.has(id) ? "favored" : hazardTraits.has(id) ? "hazard" : def.good ? "good" : "bad";
          return (
            <li key={id} className={match} title={def.blurb}>
              {def.name}
            </li>
          );
        })}
      </ul>
      {roleFavored ? <p className="mission-role-note favored">Role favored</p> : null}
      {roleHazard ? <p className="mission-role-note hazard">Role hazard</p> : null}
    </article>
  );
}
