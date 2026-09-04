import { useState, type ReactNode } from "react";
import { BACKGROUNDS } from "../data/backgrounds";
import { ELEMENT_ICON, ELEMENT_LABEL, TIME_ICON } from "../data/icons";
import { QUEST_BY_ID } from "../data/quests";
import { formatDuration } from "../game/formulas";
import { seatsLabel, TIER_LABEL } from "../game/quests";
import { usePointerSway } from "../hooks/usePointerSway";
import { useGame } from "../store/GameContext";
import type { BoardQuest } from "../types";
import { DispatchModal } from "./DispatchModal";
import { QuestTrack } from "./QuestTrack";

export function Plaza() {
  const { state, now, resolve, ui, openQuestBoard } = useGame();
  const sway = usePointerSway(14);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pickerOut, setPickerOut] = useState(false);

  const board = state.board;
  const available = board.filter((q) => q.status === "open" || (q.status === "underway" && now >= q.endsAt));
  const progressing = board.filter((q) => q.status === "underway" && now < q.endsAt);
  const completed = board.filter((q) => q.status === "done");

  function closePicker() {
    if (pickerOut) return;
    setPickerOut(true);
    window.setTimeout(() => {
      setOpenKey(null);
      setPickerOut(false);
    }, 220);
  }

  function openQuest(quest: BoardQuest) {
    setPickerOut(false);
    setOpenKey(quest.key);
  }

  return (
    <main className="plaza map-plaza">
      <div className="map-frame">
        <div className="map-stage" ref={sway}>
          <img className="map-art" src={BACKGROUNDS.town3} alt="The valley and the town" />
          <img
            className={`map-art tavern-scene ${ui.tavernOpen ? "on" : ""}`}
            src={BACKGROUNDS.tavern3}
            alt=""
          />
          <img
            className={`map-art collection-scene ${ui.guildOpen ? "on" : ""}`}
            src={BACKGROUNDS.collection}
            alt=""
          />
        </div>
        <img
          className={`map-art questboard-scene ${ui.questBoardOpen ? "on" : ""}`}
          src={BACKGROUNDS.questboard2}
          alt=""
        />
      </div>

      {ui.intro ? null : <QuestTrack hidden={Boolean(openKey)} />}

      <div
        className={`quest-board-layer ${ui.questBoardOpen ? "open" : ""}`}
        aria-hidden={!ui.questBoardOpen}
        inert={!ui.questBoardOpen ? true : undefined}
      >
        <button
          type="button"
          className="quest-board-dim"
          aria-label="Close quest board"
          tabIndex={ui.questBoardOpen ? 0 : -1}
          disabled={!ui.questBoardOpen}
          onClick={() => openQuestBoard(false)}
        />
        <div className="quest-board-frame overview">
          <div className="quest-overview">
            <OverviewSection title="Currently available" empty="No open bounties." count={available.length}>
              {available.map((quest) => (
                <QuestCard
                  key={quest.key}
                  quest={quest}
                  now={now}
                  boardOpen={ui.questBoardOpen}
                  onOpen={() => openQuest(quest)}
                  onResolve={() => resolve(quest.key)}
                />
              ))}
            </OverviewSection>
            <OverviewSection title="In progress" empty="No companies on the road." count={progressing.length}>
              {progressing.map((quest) => (
                <QuestCard
                  key={quest.key}
                  quest={quest}
                  now={now}
                  boardOpen={ui.questBoardOpen}
                  onOpen={() => openQuest(quest)}
                  onResolve={() => resolve(quest.key)}
                />
              ))}
            </OverviewSection>
            <OverviewSection title="Completed" empty="None finished today." count={completed.length}>
              {completed.map((quest) => (
                <QuestCard
                  key={quest.key}
                  quest={quest}
                  now={now}
                  boardOpen={ui.questBoardOpen}
                  onOpen={() => openQuest(quest)}
                  onResolve={() => resolve(quest.key)}
                />
              ))}
            </OverviewSection>
          </div>
        </div>
      </div>

      {openKey ? <DispatchModal questKey={openKey} leaving={pickerOut} onClose={closePicker} /> : null}
    </main>
  );
}

function OverviewSection({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="quest-overview-section">
      <h3>{title}</h3>
      {count > 0 ? <div className="quest-overview-grid">{children}</div> : <p className="quest-empty">{empty}</p>}
    </section>
  );
}

function QuestCard({
  quest,
  now,
  boardOpen,
  onOpen,
  onResolve,
}: {
  quest: BoardQuest;
  now: number;
  boardOpen: boolean;
  onOpen: () => void;
  onResolve: () => void;
}) {
  const template = QUEST_BY_ID[quest.templateId];
  if (!template) return null;
  const ready = quest.status === "underway" && now >= quest.endsAt;
  const inProgress = quest.status === "underway" && !ready;
  const stateClass =
    quest.status === "done" ? "done" : ready ? "ready" : quest.status === "underway" ? "underway" : "open";
  const elementIcon = template.element ? ELEMENT_ICON[template.element] : null;
  const clickable = quest.status === "open" || ready;

  return (
    <article className={`quest-card ${stateClass} tier-${template.tier} page-1`}>
      <button
        type="button"
        className="quest-card-face"
        data-sfx={quest.status === "open" ? "quest" : undefined}
        disabled={!boardOpen || !clickable}
        tabIndex={boardOpen && clickable ? 0 : -1}
        onClick={quest.status === "open" ? onOpen : ready ? onResolve : undefined}
      >
        <img className="quest-card-page" src={BACKGROUNDS.questPage1} alt="" />
        <span className="quest-card-inner">
          <span className="quest-card-art-frame">
            <img className="quest-card-art" src={template.art} alt="" />
            <span className="quest-card-veil" aria-hidden />
            <span className={`quest-tier tier-${template.tier}`}>{TIER_LABEL[template.tier]}</span>
            {inProgress ? (
              <span className="quest-progress-mark">
                <img src={TIME_ICON} alt="" />
                <em>In progress</em>
              </span>
            ) : null}
            {quest.status === "done" ? <span className="quest-complete-mark">Quest Complete</span> : null}
          </span>
          <span className="quest-card-copy">
            <strong>{template.name}</strong>
            <span className="quest-card-hook">{template.flavor}</span>
            <span className="quest-card-facts">
              <span className="quest-card-time">
                <img src={TIME_ICON} alt="" />
                {quest.status === "underway"
                  ? ready
                    ? "Returned"
                    : formatDuration(quest.endsAt - now)
                  : formatDuration(template.durationMs)}
              </span>
              {elementIcon ? (
                <span className="quest-card-el">
                  <img src={elementIcon} alt="" />
                  {ELEMENT_LABEL[template.element!]}
                </span>
              ) : (
                <span className="quest-card-el">No affinity</span>
              )}
              <span>
                {template.power} power · {seatsLabel(template)} seats
              </span>
            </span>
            <span className="quest-card-state">
              {quest.status === "open"
                ? "Open bounty"
                : quest.status === "done"
                  ? "Done for today"
                  : ready
                    ? "Tap to hear the report"
                    : `${quest.success}% odds`}
            </span>
          </span>
        </span>
      </button>
    </article>
  );
}
