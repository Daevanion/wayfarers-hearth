import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BACKGROUNDS } from "../data/backgrounds";
import { CARD_BY_ID } from "../data/cards";
import {
  COMBAT_LABEL,
  COMBAT_ORDER,
  ELEMENT_LABEL,
  ELEMENT_ORDER,
  ROLE_LABEL,
  ROLE_ORDER,
  TIME_ICON,
} from "../data/icons";
import { QUEST_BY_ID } from "../data/quests";
import { SETS } from "../data/sets";
import { traitLabel } from "../data/traits";
import { cardPower, formatDuration, signedPct } from "../game/formulas";
import {
  assessTeam,
  cardQuestFit,
  critLabel,
  isBusy,
  isExhausted,
  seatsLabel,
  TIER_LABEL,
} from "../game/quests";
import { useGame } from "../store/GameContext";
import type { CardTemplate, CombatId, ElementId, OwnedCard, QuestTemplate, RoleId } from "../types";
import { PortraitCard } from "./PortraitCard";
import { TraitChips } from "./StatIcons";

type ViewMode = "all" | "set";
type SortMode = "power" | "element" | "relevant";
type DropId = "element" | "role" | "combat" | "sort" | null;

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
  const [view, setView] = useState<ViewMode>("all");
  const [element, setElement] = useState<ElementId | "all">("all");
  const [role, setRole] = useState<RoleId | "all">("all");
  const [combat, setCombat] = useState<CombatId | "all">("all");
  const [sort, setSort] = useState<SortMode>("relevant");
  const [openDrop, setOpenDrop] = useState<DropId>(null);
  const [pickId, setPickId] = useState<string | null>(null);
  const [pickOut, setPickOut] = useState(false);

  const quest = state.board.find((q) => q.key === questKey);
  const template = quest ? QUEST_BY_ID[quest.templateId] : null;

  const assessment = useMemo(
    () => (template ? assessTeam(state, template, team) : null),
    [state, template, team],
  );

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".loadout-drops")) setOpenDrop(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const roster = useMemo(() => {
    if (!template) return [];
    const list = state.cards.filter((owned) => {
      const t = CARD_BY_ID[owned.id];
      if (!t) return false;
      if (element !== "all" && t.element !== element) return false;
      if (role !== "all" && t.role !== role) return false;
      if (combat !== "all" && !t.combat.includes(combat)) return false;
      return true;
    });
    list.sort((a, b) => {
      const ta = CARD_BY_ID[a.id];
      const tb = CARD_BY_ID[b.id];
      if (!ta || !tb) return 0;
      if (sort === "power") return cardPower(b) - cardPower(a);
      if (sort === "element") {
        const ea = ELEMENT_ORDER.indexOf(ta.element);
        const eb = ELEMENT_ORDER.indexOf(tb.element);
        if (ea !== eb) return ea - eb;
        return cardPower(b) - cardPower(a);
      }
      const fa = cardQuestFit(ta, template);
      const fb = cardQuestFit(tb, template);
      if (fb !== fa) return fb - fa;
      return cardPower(b) - cardPower(a);
    });
    return list;
  }, [state.cards, template, element, role, combat, sort]);

  if (!quest || !template || !assessment) return null;

  const enough = team.length >= template.teamMin && team.length <= template.teamMax;
  const teamFull = team.length >= template.teamMax;

  function toggle(id: string) {
    setTeam((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (!template || prev.length >= template.teamMax) return prev;
      return [...prev, id];
    });
  }

  function send() {
    const error = dispatchTeam(questKey, team);
    if (!error) onClose();
  }

  function closePick() {
    if (pickOut) return;
    setPickOut(true);
    window.setTimeout(() => {
      setPickId(null);
      setPickOut(false);
    }, 220);
  }

  function openPick(id: string) {
    setPickOut(false);
    setPickId(id);
  }

  const pickOwned = pickId ? state.cards.find((c) => c.id === pickId) : null;

  return (
    <div className={`assign-back ${leaving ? "out" : ""}`} onClick={onClose} role="presentation">
      <section
        className={`assign-menu dispatch-menu loadout-menu ${leaving ? "out" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={template.name}
      >
        <img className="loadout-page-bg" src={BACKGROUNDS.questPage} alt="" />
        <header className="loadout-head">
          <img className="loadout-head-art" src={template.art} alt="" />
          <span className={`loadout-head-glow tier-${template.tier}`} aria-hidden />
          <span className="loadout-head-veil" aria-hidden />
          <div className="loadout-head-copy">
            <p className="kicker">{TIER_LABEL[template.tier]} bounty</p>
            <h3>{template.name}</h3>
            <p className="quest-flavor">{template.flavor}</p>
            <ul className="quest-facts loadout-head-facts">
              <li>
                <img src={TIME_ICON} alt="" />
                {formatDuration(template.durationMs)}
              </li>
              <li>
                <strong>{template.power}</strong> power needed
              </li>
              <li>
                {template.teamMin === template.teamMax
                  ? `Team of ${template.teamMin}`
                  : `Team of ${seatsLabel(template)}`}
              </li>
              {template.element ? (
                <li className="quest-element">{ELEMENT_LABEL[template.element]} favored</li>
              ) : (
                <li>No affinity</li>
              )}
            </ul>
          </div>
          <button className="icon-btn loadout-close" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="loadout-body">
          <p className="quest-lore">{template.lore}</p>

          <div className="loadout-stats">
            <StatBlock title="Advantages" tone="good">
              {template.advantages.length === 0 ? (
                <p>None listed.</p>
              ) : (
                template.advantages.map((adv) => (
                  <p key={`a-${adv.id}`}>
                    <strong>{signedPct(adv.pct)}</strong>
                    <span>{adv.type === "trait" ? traitLabel(adv.id) : ROLE_LABEL[adv.id as never]}</span>
                  </p>
                ))
              )}
            </StatBlock>
            <StatBlock title="Hazards" tone="bad">
              {template.hazards.length === 0 ? (
                <p>None listed.</p>
              ) : (
                template.hazards.map((haz) => (
                  <p key={`h-${haz.id}`}>
                    <strong>{signedPct(haz.pct)}</strong>
                    <span>{haz.type === "trait" ? traitLabel(haz.id) : ROLE_LABEL[haz.id as never]}</span>
                  </p>
                ))
              )}
            </StatBlock>
            <StatBlock title="Critical" tone="crit">
              {template.crit ? (
                <p>
                  <strong>{critLabel(template)}</strong>
                  <span>{template.crit.note}</span>
                </p>
              ) : (
                <p>No special match.</p>
              )}
            </StatBlock>
          </div>

          {team.length > 0 ? (
            <div className="loadout-picked">
              {team.map((id) => {
                const t = CARD_BY_ID[id];
                if (!t) return null;
                return (
                  <button key={id} type="button" className="loadout-picked-chip" onClick={() => openPick(id)}>
                    {t.portrait ? <img src={t.portrait} alt="" /> : null}
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="loadout-toolbar">
            <div className="filter-chips">
              <button type="button" className={view === "all" ? "chip on" : "chip"} onClick={() => setView("all")}>
                All
              </button>
              <button type="button" className={view === "set" ? "chip on" : "chip"} onClick={() => setView("set")}>
                Set
              </button>
            </div>
            <div className="loadout-drops">
              <FilterDrop
                label="Element"
                value={element}
                options={[{ id: "all", label: "Any" }, ...ELEMENT_ORDER.map((id) => ({ id, label: ELEMENT_LABEL[id] }))]}
                open={openDrop === "element"}
                onToggle={() => setOpenDrop(openDrop === "element" ? null : "element")}
                onChange={(id) => {
                  setElement(id as ElementId | "all");
                  setOpenDrop(null);
                }}
              />
              <FilterDrop
                label="Role"
                value={role}
                options={[{ id: "all", label: "Any" }, ...ROLE_ORDER.map((id) => ({ id, label: ROLE_LABEL[id] }))]}
                open={openDrop === "role"}
                onToggle={() => setOpenDrop(openDrop === "role" ? null : "role")}
                onChange={(id) => {
                  setRole(id as RoleId | "all");
                  setOpenDrop(null);
                }}
              />
              <FilterDrop
                label="Combat"
                value={combat}
                options={[{ id: "all", label: "Any" }, ...COMBAT_ORDER.map((id) => ({ id, label: COMBAT_LABEL[id] }))]}
                open={openDrop === "combat"}
                onToggle={() => setOpenDrop(openDrop === "combat" ? null : "combat")}
                onChange={(id) => {
                  setCombat(id as CombatId | "all");
                  setOpenDrop(null);
                }}
              />
              <FilterDrop
                label="Sort"
                value={sort}
                options={[
                  { id: "relevant", label: "Advantage / hazard" },
                  { id: "power", label: "Power" },
                  { id: "element", label: "Element" },
                ]}
                open={openDrop === "sort"}
                onToggle={() => setOpenDrop(openDrop === "sort" ? null : "sort")}
                onChange={(id) => {
                  setSort(id as SortMode);
                  setOpenDrop(null);
                }}
              />
            </div>
          </div>

          <div key={`${view}-${element}-${role}-${combat}-${sort}`} className="view-fade">
            {view === "set" ? (
              <SetRoster roster={roster} template={template} team={team} teamFull={teamFull} now={now} onOpen={openPick} />
            ) : (
              <CardRoster roster={roster} template={template} team={team} teamFull={teamFull} now={now} onOpen={openPick} />
            )}
          </div>
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
          <button className="cta" type="button" disabled={!enough} onClick={send}>
            {enough ? "Send them out" : `Pick ${Math.max(0, template.teamMin - team.length)} more`}
          </button>
        </footer>
      </section>

      {pickOwned && template ? (
        <LoadoutPick
          owned={pickOwned}
          quest={template}
          picked={team.includes(pickOwned.id)}
          teamFull={teamFull}
          now={now}
          leaving={pickOut}
          onClose={closePick}
          onChoose={() => {
            toggle(pickOwned.id);
            closePick();
          }}
        />
      ) : null}
    </div>
  );
}

function StatBlock({ title, tone, children }: { title: string; tone: "good" | "bad" | "crit"; children: ReactNode }) {
  return (
    <section className={`loadout-stat-block ${tone}`}>
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function FilterDrop({
  label,
  value,
  options,
  open,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  open: boolean;
  onToggle: () => void;
  onChange: (id: string) => void;
}) {
  const current = options.find((o) => o.id === value)?.label ?? "Any";
  return (
    <div className="drop">
      <button type="button" className="drop-btn" onClick={onToggle} aria-expanded={open}>
        <span>{label}</span>
        <strong>{current}</strong>
      </button>
      {open ? (
        <ul className="drop-list view-fade">
          {options.map((opt) => (
            <li key={opt.id}>
              <button type="button" className={opt.id === value ? "on" : ""} onClick={() => onChange(opt.id)}>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CardRoster({
  roster,
  template,
  team,
  teamFull,
  now,
  onOpen,
}: {
  roster: OwnedCard[];
  template: QuestTemplate;
  team: string[];
  teamFull: boolean;
  now: number;
  onOpen: (id: string) => void;
}) {
  const { state } = useGame();
  if (roster.length === 0) return <p className="muted">No names match these filters.</p>;
  return (
    <div className="loadout-grid">
      {roster.map((owned) => (
        <LoadoutChoice
          key={owned.id}
          owned={owned}
          quest={template}
          picked={team.includes(owned.id)}
          busy={isBusy(state, owned.id)}
          exhausted={isExhausted(state, owned.id, now)}
          restLeft={Math.max(0, owned.exhaustedUntil - now)}
          teamFull={teamFull}
          onOpen={() => onOpen(owned.id)}
        />
      ))}
    </div>
  );
}

function SetRoster({
  roster,
  template,
  team,
  teamFull,
  now,
  onOpen,
}: {
  roster: OwnedCard[];
  template: QuestTemplate;
  team: string[];
  teamFull: boolean;
  now: number;
  onOpen: (id: string) => void;
}) {
  const blocks = SETS.map((set) => ({
    set,
    members: roster.filter((owned) => CARD_BY_ID[owned.id]?.setId === set.id),
  })).filter((block) => block.members.length > 0);

  if (blocks.length === 0) return <p className="muted">No names match these filters.</p>;

  return (
    <div className="set-stack">
      {blocks.map(({ set, members }) => (
        <article key={set.id} className="set-block">
          <header>
            <strong>{set.name}</strong>
            <span>
              {members.length}/{set.members.length}
            </span>
          </header>
          <CardRoster roster={members} template={template} team={team} teamFull={teamFull} now={now} onOpen={onOpen} />
        </article>
      ))}
    </div>
  );
}

function LoadoutChoice({
  owned,
  quest,
  picked,
  busy,
  exhausted,
  restLeft,
  teamFull,
  onOpen,
}: {
  owned: OwnedCard;
  quest: QuestTemplate;
  picked: boolean;
  busy: boolean;
  exhausted: boolean;
  restLeft: number;
  teamFull: boolean;
  onOpen: () => void;
}) {
  const t = CARD_BY_ID[owned.id];
  if (!t) return null;
  const locked = busy || exhausted || (teamFull && !picked);
  const mark = relevanceMark(t, quest);
  return (
    <button type="button" className={`loadout-choice ${picked ? "on" : ""} ${locked ? "hurt" : ""}`} onClick={onOpen}>
      <PortraitCard
        template={t}
        owned
        power={cardPower(owned)}
        selected={picked}
        exhausted={exhausted}
        dimmed={locked && !picked}
        size="guild"
      />
      {mark ? <span className={`loadout-mark ${mark.tone}`}>{mark.label}</span> : null}
      <p className="assign-meta">
        {busy ? "Out on a bounty" : exhausted ? `Rests ${formatDuration(restLeft)}` : picked ? "Chosen" : `Power ${cardPower(owned)}`}
      </p>
    </button>
  );
}

function LoadoutPick({
  owned,
  quest,
  picked,
  teamFull,
  now,
  leaving,
  onClose,
  onChoose,
}: {
  owned: OwnedCard;
  quest: QuestTemplate;
  picked: boolean;
  teamFull: boolean;
  now: number;
  leaving: boolean;
  onClose: () => void;
  onChoose: () => void;
}) {
  const { state } = useGame();
  const t = CARD_BY_ID[owned.id];
  if (!t) return null;
  const busy = isBusy(state, owned.id);
  const exhausted = isExhausted(state, owned.id, now);
  const canAct = picked || (!busy && !exhausted && !teamFull);
  const action = picked ? "Remove" : "Choose";
  const reason = busy
    ? "Already on a bounty"
    : exhausted
      ? "Needs rest"
      : teamFull && !picked
        ? "The company is full"
        : `Power ${cardPower(owned)}`;

  return (
    <div
      className={`loadout-pick-back ${leaving ? "out" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      role="presentation"
    >
      <article
        className={`loadout-pick ${leaving ? "out" : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={t.name}
      >
        <button type="button" className="icon-btn loadout-pick-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <PortraitCard template={t} owned power={cardPower(owned)} size="inspect" exhausted={exhausted} />
        <div className="loadout-pick-copy">
          <p className="kicker">{ROLE_LABEL[t.role]}</p>
          <h3>{t.name}</h3>
          <p className="adv-title">{t.title}</p>
          <PickTraits card={t} quest={quest} />
          <TraitChips traits={t.traits} />
          <p className="muted tight">{reason}</p>
          <button type="button" className="cta" disabled={!canAct} onClick={onChoose}>
            {action}
          </button>
        </div>
      </article>
    </div>
  );
}

function PickTraits({ card, quest }: { card: CardTemplate; quest: QuestTemplate }) {
  const notes: { id: string; text: string; tone: string }[] = [];
  for (const adv of quest.advantages) {
    const hit = adv.type === "trait" ? card.traits.includes(adv.id) : card.role === adv.id;
    if (hit) notes.push({ id: `a-${adv.id}`, text: `Advantage ${signedPct(adv.pct)}`, tone: "good" });
  }
  for (const haz of quest.hazards) {
    const hit = haz.type === "trait" ? card.traits.includes(haz.id) : card.role === haz.id;
    if (hit) notes.push({ id: `h-${haz.id}`, text: `Hazard ${signedPct(haz.pct)}`, tone: "bad" });
  }
  if (notes.length === 0) return null;
  return (
    <ul className="loadout-pick-flags">
      {notes.map((n) => (
        <li key={n.id} className={n.tone}>
          {n.text}
        </li>
      ))}
    </ul>
  );
}

function relevanceMark(card: CardTemplate, quest: QuestTemplate): { label: string; tone: string } | null {
  const fit = cardQuestFit(card, quest);
  if (fit >= 70) return { label: "Favored", tone: "good" };
  if (fit <= -70) return { label: "Hazard", tone: "bad" };
  return null;
}
