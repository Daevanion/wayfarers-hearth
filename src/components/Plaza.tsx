import { useState } from "react";
import { BACKGROUNDS } from "../data/backgrounds";
import { ELEMENT_ICON, ELEMENT_LABEL, TIME_ICON } from "../data/icons";
import { QUEST_BY_ID } from "../data/quests";
import { formatDuration } from "../game/formulas";
import { usePointerSway } from "../hooks/usePointerSway";
import { useGame } from "../store/GameContext";
import type { BoardQuest } from "../types";
import { DispatchModal } from "./DispatchModal";

export function Plaza() {
  const { state, now, resolve } = useGame();
  const sway = usePointerSway(14);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pickerOut, setPickerOut] = useState(false);

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
        </div>
      </div>

      <div className="quest-dock">
        {state.board.map((q) => (
          <BountyChit
            key={q.key}
            quest={q}
            now={now}
            onOpen={() => {
              setPickerOut(false);
              setOpenKey(q.key);
            }}
            onResolve={() => resolve(q.key)}
          />
        ))}
      </div>

      {openKey ? <DispatchModal questKey={openKey} leaving={pickerOut} onClose={closePicker} /> : null}
    </main>
  );
}

function BountyChit({
  quest,
  now,
  onOpen,
  onResolve,
}: {
  quest: BoardQuest;
  now: number;
  onOpen: () => void;
  onResolve: () => void;
}) {
  const template = QUEST_BY_ID[quest.templateId];
  if (!template) return null;
  const ready = quest.status === "underway" && now >= quest.endsAt;
  const stateClass =
    quest.status === "done" ? "done" : ready ? "ready" : quest.status === "underway" ? "underway" : "open";
  const elementIcon = template.element ? ELEMENT_ICON[template.element] : null;

  return (
    <article className={`bounty-chit ${stateClass} ${template.long ? "long" : ""}`}>
      <button
        type="button"
        className="chit-body"
        disabled={quest.status === "done" || (quest.status === "underway" && !ready)}
        onClick={quest.status === "open" ? onOpen : ready ? onResolve : undefined}
      >
        <span className="chit-top">
          {elementIcon ? (
            <img className="chit-element" src={elementIcon} alt={ELEMENT_LABEL[template.element!]} />
          ) : null}
          <strong>{template.name}</strong>
        </span>
        <span className="chit-meta">
          <span className="chit-time">
            <img src={TIME_ICON} alt="" />
            {quest.status === "underway"
              ? ready
                ? "Returned"
                : formatDuration(quest.endsAt - now)
              : formatDuration(template.durationMs)}
          </span>
          <em>
            {template.power} power · {template.teamSize} seats
          </em>
        </span>
        <span className="chit-state">
          {quest.status === "open"
            ? "Open bounty"
            : quest.status === "done"
              ? "Done for today"
              : ready
                ? "Tap to hear the report"
                : `${quest.success}% odds`}
        </span>
      </button>
    </article>
  );
}
