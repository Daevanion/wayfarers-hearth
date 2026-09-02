import { useEffect, useState } from "react";
import { BACKGROUNDS } from "../data/backgrounds";
import { ELEMENT_ICON, ELEMENT_LABEL, TIME_ICON } from "../data/icons";
import { QUEST_BY_ID } from "../data/quests";
import { playSfx } from "../game/audio";
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
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<"left" | "right">("right");

  const board = state.board;
  const current = board[index] ?? board[0] ?? null;

  useEffect(() => {
    if (index >= board.length) setIndex(0);
  }, [board.length, index]);

  useEffect(() => {
    if (!ui.questBoardOpen || openKey) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui.questBoardOpen, openKey, board.length]);

  function go(delta: number) {
    if (board.length === 0) return;
    playSfx("quest");
    setDir(delta > 0 ? "right" : "left");
    setIndex((i) => (i + delta + board.length) % board.length);
  }

  function closePicker() {
    if (pickerOut) return;
    setPickerOut(true);
    window.setTimeout(() => {
      setOpenKey(null);
      setPickerOut(false);
    }, 220);
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
        </div>
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
        <div className="quest-board-frame">
          <img className="quest-board-art" src={BACKGROUNDS.questboard} alt="" />
          <div className="quest-dock">
            {board.length > 1 ? (
              <button
                type="button"
                className="quest-slide-btn prev"
                aria-label="Previous bounty"
                disabled={!ui.questBoardOpen}
                tabIndex={ui.questBoardOpen ? 0 : -1}
                onClick={() => go(-1)}
              >
                ‹
              </button>
            ) : null}
            <div className="quest-slide-stage">
              {current ? (
                <QuestCard
                  key={`${current.key}-${dir}`}
                  quest={current}
                  now={now}
                  dir={dir}
                  index={index}
                  total={board.length}
                  boardOpen={ui.questBoardOpen}
                  onOpen={() => {
                    setPickerOut(false);
                    setOpenKey(current.key);
                  }}
                  onResolve={() => resolve(current.key)}
                />
              ) : (
                <p className="quest-empty">The board is bare until midnight.</p>
              )}
            </div>
            {board.length > 1 ? (
              <button
                type="button"
                className="quest-slide-btn next"
                aria-label="Next bounty"
                disabled={!ui.questBoardOpen}
                tabIndex={ui.questBoardOpen ? 0 : -1}
                onClick={() => go(1)}
              >
                ›
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {openKey ? <DispatchModal questKey={openKey} leaving={pickerOut} onClose={closePicker} /> : null}
    </main>
  );
}

function QuestCard({
  quest,
  now,
  dir,
  index,
  total,
  boardOpen,
  onOpen,
  onResolve,
}: {
  quest: BoardQuest;
  now: number;
  dir: "left" | "right";
  index: number;
  total: number;
  boardOpen: boolean;
  onOpen: () => void;
  onResolve: () => void;
}) {
  const template = QUEST_BY_ID[quest.templateId];
  if (!template) return null;
  const ready = quest.status === "underway" && now >= quest.endsAt;
  const stateClass =
    quest.status === "done" ? "done" : ready ? "ready" : quest.status === "underway" ? "underway" : "open";
  const elementIcon = template.element ? ELEMENT_ICON[template.element] : null;
  const clickable = quest.status === "open" || ready;

  return (
    <article className={`quest-card ${stateClass} tier-${template.tier} slide-${dir}`}>
      <button
        type="button"
        className="quest-card-face"
        disabled={!boardOpen || !clickable}
        tabIndex={boardOpen && clickable ? 0 : -1}
        onClick={quest.status === "open" ? onOpen : ready ? onResolve : undefined}
      >
        <img className="quest-card-art" src={template.art} alt="" />
        <span className="quest-card-veil" aria-hidden />
        <span className={`quest-tier tier-${template.tier}`}>{TIER_LABEL[template.tier]}</span>
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
        <span className="quest-card-count">
          {index + 1} / {total}
        </span>
      </button>
    </article>
  );
}
