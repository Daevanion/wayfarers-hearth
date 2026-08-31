import { useEffect, useRef, useState } from "react";
import { ADVENTURER_BY_ID } from "../data/adventurers";
import { locationScene } from "../data/backgrounds";
import { CLEARS_TO_UNLOCK, LOCATIONS } from "../data/locations";
import { SETS } from "../data/sets";
import {
  adventurerMods,
  formatDuration,
  formatPct,
  isInjured,
  lootTierName,
  previewQuest,
} from "../game/formulas";
import { useGame } from "../store/GameContext";
import { Modal } from "./Modal";
import { PortraitCard } from "./PortraitCard";
import { ModPips, StatLine } from "./StatIcons";

export function Crossroads() {
  const { state, ui, now, openBuilding, setLocation, setSet, depart } = useGame();
  const preview = previewQuest(state, ui.selectedLocationId, ui.selectedTeam);
  const loc = LOCATIONS.find((l) => l.id === ui.selectedLocationId)!;
  const quest = state.activeAdventure;
  const remaining = quest ? Math.max(0, quest.endsAt - now) : 0;
  const sceneId = quest?.locationId ?? ui.selectedLocationId;
  const chosen = SETS.find((s) => s.id === ui.selectedSetId) ?? SETS[0];
  const owned = new Set(state.adventurers.map((a) => a.templateId));
  const ready = ui.selectedTeam.filter((id) => {
    const a = state.adventurers.find((x) => x.templateId === id);
    return a && !isInjured(a, now);
  });
  const company = quest ? quest.team : chosen.members;

  return (
    <Modal
      kicker="Mud, signposts, weather"
      title="The Crossroads"
      onClose={() => openBuilding(null)}
      wide
      scene={locationScene(sceneId)}
      tone="stage"
    >
      <div className="cross-stage">
        <section className="cross-frame roads">
          <h3 className="section-title">Roads</h3>
          <div className="loc-list art">
            {LOCATIONS.map((l, i) => {
              const unlocked = state.unlockedLocationIds.includes(l.id);
              const clears = state.locationClears[l.id] ?? 0;
              const prev = i === 0 ? true : (state.locationClears[LOCATIONS[i - 1].id] ?? 0) >= CLEARS_TO_UNLOCK;
              return (
                <button
                  key={l.id}
                  className={`loc-art ${ui.selectedLocationId === l.id ? "on" : ""} ${unlocked ? "" : "locked"}`}
                  disabled={!unlocked || Boolean(quest)}
                  style={{ ["--loc-art" as string]: `url(${locationScene(l.id)})` }}
                  onClick={() => setLocation(l.id)}
                >
                  <span className="loc-art-copy">
                    <strong>{l.name}</strong>
                    <em>
                      {unlocked
                        ? `${clears}/${CLEARS_TO_UNLOCK}`
                        : prev
                          ? "Locked"
                          : "Far"}
                    </em>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="cross-stage-main">
          <div className={`set-portraits stage ${company.length === 2 ? "pair" : ""}`}>
            {company.map((id) => {
              const ownedCard = state.adventurers.find((a) => a.templateId === id);
              return (
                <PortraitCard
                  key={id}
                  template={ADVENTURER_BY_ID[id]}
                  owned={owned.has(id) || Boolean(quest)}
                  size="compact"
                  selected={!quest && ui.selectedTeam.includes(id)}
                  dimmed={ownedCard ? isInjured(ownedCard, now) : !owned.has(id)}
                  injured={ownedCard ? isInjured(ownedCard, now) : false}
                  mods={ownedCard ? adventurerMods(ownedCard) : undefined}
                />
              );
            })}
          </div>
          {quest ? (
            <p className="stage-caption">
              {quest.team.map((id) => ADVENTURER_BY_ID[id].name).join(" · ")} · {formatDuration(remaining)}
            </p>
          ) : (
            <p className="stage-caption">{ready.length} ready · gear already counted</p>
          )}
        </section>

        <aside className="cross-frame side">
          {quest ? (
            <>
              <h3 className="section-title">Run</h3>
              <p className="muted tight">{LOCATIONS.find((l) => l.id === quest.locationId)?.name}</p>
              <ul className="stat-board stacked">
                <StatLine stat="success" label="Success" value={formatPct(quest.preview.success)} />
                <StatLine stat="loot" label="Loot" value={`${lootTierName(quest.preview.lootLevel)} tier`} />
                <StatLine stat="recruit" label="Recruit" value={formatPct(quest.preview.recruit)} />
                <StatLine stat="equipment" label="Arms" value={formatPct(quest.preview.equipment)} />
              </ul>
            </>
          ) : (
            <>
              <h3 className="section-title">Company</h3>
              <SetDropdown value={chosen.id} onChange={setSet} />
              <p className="muted tight">{chosen.description}</p>
              <ModPips mods={chosen.bonus} compact />
              <h3 className="section-title">Run</h3>
              <p className="muted tight">{loc.name}</p>
              <ul className="stat-board stacked">
                <StatLine stat="time" label="Time" value={formatDuration(preview.timeMs)} />
                <StatLine stat="success" label="Success" value={formatPct(preview.success)} />
                <StatLine stat="loot" label="Loot" value={`${lootTierName(preview.lootLevel)} tier`} />
                <StatLine stat="recruit" label="Recruit" value={formatPct(preview.recruit)} />
                <StatLine stat="equipment" label="Arms" value={formatPct(preview.equipment)} />
              </ul>
              <button className="cta" disabled={ready.length < 1} onClick={() => depart()}>
                Set out
              </button>
            </>
          )}
        </aside>
      </div>
    </Modal>
  );
}

function SetDropdown({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = SETS.find((s) => s.id === value) ?? SETS[0];

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={`drop ${open ? "open" : ""}`} ref={box}>
      <button
        type="button"
        className="drop-btn"
        data-sfx="flip"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>Set</span>
        <strong>{current.name}</strong>
      </button>
      {open ? (
        <ul className="drop-list">
          {SETS.map((set) => (
            <li key={set.id}>
              <button
                type="button"
                className={set.id === value ? "on" : ""}
                data-sfx="flip"
                onClick={() => {
                  onChange(set.id);
                  setOpen(false);
                }}
              >
                {set.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
