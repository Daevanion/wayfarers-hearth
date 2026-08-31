import { CARD_BY_ID, CARDS } from "../data/cards";
import { QUEST_BY_ID, QUEST_TEMPLATES } from "../data/quests";
import { SET_BY_ID } from "../data/sets";
import { ELEMENT_LABEL, ROLE_LABEL } from "../data/icons";
import { traitLabel } from "../data/traits";
import { cardPower, clamp, grantXp, uid } from "./formulas";
import type {
  BoardQuest,
  GameState,
  JournalEntry,
  OwnedCard,
  PackResult,
  QuestOutcome,
  QuestTemplate,
} from "../types";

export const SHORT_QUESTS_PER_DAY = 4;
export const LONG_QUESTS_PER_DAY = 2;
export const ELEMENT_POWER_BONUS = 1.25;
export const SET_SYNERGY_PCT = 10;
export const CRIT_LOOT_MULT = 1.5;
export const GOLD_PACK_COST = 60;
export const TOKEN_PACK_COST = 1;
export const DUPE_XP_GOLD = 40;
export const DUPE_XP_TOKEN = 80;

// ————— board generation —————

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dateKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

function pickSome<T>(pool: T[], count: number, rng: () => number): T[] {
  const rest = [...pool];
  const out: T[] = [];
  while (out.length < count && rest.length > 0) {
    const i = Math.floor(rng() * rest.length);
    out.push(rest.splice(i, 1)[0]);
  }
  return out;
}

export function makeBoard(day: string): BoardQuest[] {
  const rng = mulberry32(hashSeed(day));
  const shorts = pickSome(QUEST_TEMPLATES.filter((q) => !q.long), SHORT_QUESTS_PER_DAY, rng);
  const longs = pickSome(QUEST_TEMPLATES.filter((q) => q.long), LONG_QUESTS_PER_DAY, rng);
  return [...shorts, ...longs].map((q) => ({
    key: `${day}-${q.id}`,
    templateId: q.id,
    status: "open",
    team: [],
    startedAt: 0,
    endsAt: 0,
    success: 0,
    crit: 0,
    critMatched: false,
  }));
}

/** Refresh open/done quests when the local date rolls over; quests underway keep running. */
export function rolloverBoard(state: GameState, now: number): GameState {
  const day = dateKey(now);
  if (state.boardDate === day) return state;
  const underway = state.board.filter((q) => q.status === "underway");
  const fresh = makeBoard(day).filter((q) => !underway.some((u) => u.templateId === q.templateId));
  return { ...state, boardDate: day, board: [...underway, ...fresh] };
}

// ————— team assessment —————

export interface AssessmentMod {
  label: string;
  pct: number;
}

export interface Assessment {
  power: number;
  effPower: number;
  need: number;
  base: number;
  mods: AssessmentMod[];
  success: number;
  crit: number;
  critMatched: boolean;
}

function ownedById(state: GameState, id: string): OwnedCard | undefined {
  return state.cards.find((c) => c.id === id);
}

export function assessTeam(state: GameState, quest: QuestTemplate, team: string[]): Assessment {
  let power = 0;
  let effPower = 0;
  for (const id of team) {
    const owned = ownedById(state, id);
    const template = CARD_BY_ID[id];
    if (!owned || !template) continue;
    const p = cardPower(owned);
    power += p;
    const affinity =
      quest.element != null && (template.element === quest.element || template.element === "wild");
    effPower += affinity ? p * ELEMENT_POWER_BONUS : p;
  }
  effPower = Math.round(effPower);

  const base = quest.power > 0 ? Math.round((effPower / quest.power) * 100) : 100;

  const teamTraits = new Set(team.flatMap((id) => CARD_BY_ID[id]?.traits ?? []));
  const teamRoles = new Set(team.map((id) => CARD_BY_ID[id]?.role).filter(Boolean));

  const mods: AssessmentMod[] = [];
  for (const adv of quest.advantages) {
    const hit = adv.type === "trait" ? teamTraits.has(adv.id) : teamRoles.has(adv.id as never);
    if (hit) mods.push({ label: adv.type === "trait" ? traitLabel(adv.id) : ROLE_LABEL[adv.id as never], pct: adv.pct });
  }
  for (const haz of quest.hazards) {
    const hit = haz.type === "trait" ? teamTraits.has(haz.id) : teamRoles.has(haz.id as never);
    if (hit) mods.push({ label: haz.type === "trait" ? traitLabel(haz.id) : ROLE_LABEL[haz.id as never], pct: haz.pct });
  }

  // Full set dispatched together = lore synergy.
  const setIds = new Set(team.map((id) => CARD_BY_ID[id]?.setId).filter(Boolean));
  let synergy = false;
  for (const setId of setIds) {
    const set = SET_BY_ID[setId as string];
    if (set && set.members.every((m) => team.includes(m))) synergy = true;
  }
  if (synergy) mods.push({ label: "Full set", pct: SET_SYNERGY_PCT });

  const modSum = mods.reduce((sum, m) => sum + m.pct, 0);
  const raw = base + modSum;
  const success = team.length > 0 ? clamp(Math.round(raw), 5, 100) : 0;
  const crit = clamp(Math.round(raw) - 100, 0, 40);

  let critMatched = false;
  if (quest.crit) {
    if (quest.crit.type === "element")
      critMatched = team.some((id) => {
        const t = CARD_BY_ID[id];
        return t && (t.element === quest.crit!.id || t.element === "wild");
      });
    else if (quest.crit.type === "role") critMatched = teamRoles.has(quest.crit.id as never);
    else critMatched = SET_BY_ID[quest.crit.id]?.members.every((m) => team.includes(m)) ?? false;
  }

  return { power, effPower, need: quest.power, base: clamp(base, 0, 999), mods, success, crit, critMatched };
}

// ————— journal —————

function log(state: GameState, kind: JournalEntry["kind"], text: string): GameState {
  const entry: JournalEntry = { id: uid("log"), at: Date.now(), kind, text };
  return { ...state, journal: [entry, ...state.journal].slice(0, 40) };
}

// ————— dispatch / resolve —————

export function isBusy(state: GameState, cardId: string): boolean {
  return state.board.some((q) => q.status === "underway" && q.team.includes(cardId));
}

export function isExhausted(state: GameState, cardId: string, now: number): boolean {
  const owned = ownedById(state, cardId);
  return Boolean(owned && owned.exhaustedUntil > now);
}

export function dispatchQuest(
  state: GameState,
  key: string,
  team: string[],
  now: number,
): { state: GameState; error?: string } {
  const quest = state.board.find((q) => q.key === key);
  if (!quest || quest.status !== "open") return { state, error: "That bounty is no longer open." };
  const template = QUEST_BY_ID[quest.templateId];
  if (!template) return { state, error: "The bounty has faded." };
  if (team.length !== template.teamSize)
    return { state, error: `This bounty needs a team of ${template.teamSize}.` };
  for (const id of team) {
    if (!ownedById(state, id)) return { state, error: "That name is not in your company." };
    if (isBusy(state, id)) return { state, error: `${CARD_BY_ID[id]?.name ?? id} is already out.` };
    if (isExhausted(state, id, now)) return { state, error: `${CARD_BY_ID[id]?.name ?? id} needs rest.` };
  }

  const a = assessTeam(state, template, team);
  const next: BoardQuest = {
    ...quest,
    status: "underway",
    team: [...team],
    startedAt: now,
    endsAt: now + template.durationMs,
    success: a.success,
    crit: a.crit,
    critMatched: a.critMatched,
  };
  const board = state.board.map((q) => (q.key === key ? next : q));
  return {
    state: log({ ...state, board }, "system", `${template.name}: a team of ${team.length} sets out. ${a.success}% odds.`),
  };
}

export function resolveQuest(
  state: GameState,
  key: string,
  now: number,
): { state: GameState; outcome?: QuestOutcome; error?: string } {
  const quest = state.board.find((q) => q.key === key);
  if (!quest || quest.status !== "underway") return { state, error: "No team is out on that bounty." };
  if (now < quest.endsAt) return { state, error: "The team has not returned yet." };
  const template = QUEST_BY_ID[quest.templateId];
  if (!template) return { state, error: "The bounty has faded." };

  const roll = 1 + Math.floor(Math.random() * 100);
  const result: QuestOutcome["result"] = roll <= quest.crit ? "crit" : roll <= quest.success ? "success" : "fail";
  const won = result !== "fail";

  let gold = won ? template.gold : 0;
  if (won && quest.critMatched) gold = Math.round(gold * CRIT_LOOT_MULT);
  const tokens = result === "crit" ? (template.long ? 2 : 1) : 0;
  const xpEach = won ? template.xp : Math.max(1, Math.round(template.xp * 0.25));
  const restMs = template.durationMs * (won ? 0.5 : 2);

  const leveled: string[] = [];
  const cards = state.cards.map((c) => {
    if (!quest.team.includes(c.id)) return c;
    const { card, leveled: up } = grantXp(c, xpEach);
    if (up) leveled.push(c.id);
    return { ...card, exhaustedUntil: now + restMs };
  });

  const board = state.board.map((q) => (q.key === key ? { ...q, status: "done" as const } : q));
  let next: GameState = { ...state, cards, board, gold: state.gold + gold, tokens: state.tokens + tokens };
  next = log(
    next,
    won ? "success" : "fail",
    won
      ? `${template.name}: ${result === "crit" ? "a triumph" : "done"}. ${gold} gold${tokens ? `, ${tokens} token${tokens > 1 ? "s" : ""}` : ""}.`
      : `${template.name}: the team returns empty-handed and spent.`,
  );

  const outcome: QuestOutcome = {
    key,
    templateId: template.id,
    roll,
    success: quest.success,
    crit: quest.crit,
    result,
    gold,
    tokens,
    xpEach,
    team: quest.team,
    leveled,
    critMatched: quest.critMatched,
  };
  return { state: next, outcome };
}

// ————— tavern packs —————

export function buyPack(
  state: GameState,
  kind: "gold" | "token",
): { state: GameState; result?: PackResult; error?: string } {
  if (kind === "gold" && state.gold < GOLD_PACK_COST) return { state, error: "Not enough gold." };
  if (kind === "token" && state.tokens < TOKEN_PACK_COST) return { state, error: "No recruitment tokens." };

  const ownedIds = new Set(state.cards.map((c) => c.id));
  let pool = CARDS;
  if (kind === "token") {
    const unowned = CARDS.filter((c) => !ownedIds.has(c.id));
    if (unowned.length > 0) pool = unowned;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const isNew = !ownedIds.has(pick.id);
  const dupeXp = kind === "gold" ? DUPE_XP_GOLD : DUPE_XP_TOKEN;

  let cards = state.cards;
  if (isNew) {
    cards = [...cards, { id: pick.id, level: 1, xp: 0, exhaustedUntil: 0 }];
  } else {
    cards = cards.map((c) => (c.id === pick.id ? grantXp(c, dupeXp).card : c));
  }

  let next: GameState = {
    ...state,
    cards,
    gold: kind === "gold" ? state.gold - GOLD_PACK_COST : state.gold,
    tokens: kind === "token" ? state.tokens - TOKEN_PACK_COST : state.tokens,
  };
  next = log(
    next,
    "recruit",
    isNew ? `${pick.name} joins the company.` : `Another likeness of ${pick.name} — ${dupeXp} XP.`,
  );
  return { state: next, result: { cardId: pick.id, isNew, xp: isNew ? 0 : dupeXp } };
}

// ————— display helpers —————

export function critLabel(template: QuestTemplate): string | null {
  if (!template.crit) return null;
  if (template.crit.type === "element") return ELEMENT_LABEL[template.crit.id as never];
  if (template.crit.type === "role") return ROLE_LABEL[template.crit.id as never];
  return SET_BY_ID[template.crit.id]?.name ?? template.crit.id;
}
