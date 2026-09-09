import { CARD_BY_ID, TAVERN_CARDS } from "../data/cards";
import { CHAPTERS, chapterQuestId } from "../data/chapters";
import { QUEST_BY_ID, QUEST_TEMPLATES } from "../data/quests";
import { SET_BY_ID } from "../data/sets";
import { ELEMENT_LABEL, ROLE_LABEL } from "../data/icons";
import { traitLabel } from "../data/traits";
import { cardPower, clamp, grantXp, makeOwned, secretDurationMs, shownLevel, uid } from "./formulas";
import type {
  BoardQuest,
  CardTemplate,
  GameState,
  JournalEntry,
  OwnedCard,
  PackResult,
  QuestOutcome,
  QuestTemplate,
  QuestTier,
} from "../types";

export const DAILY_BY_TIER: Record<QuestTier, number> = {
  low: 3,
  mid: 2,
  high: 1,
  extreme: 1,
  world: 0,
  special: 0,
};

export const TIER_LABEL: Record<QuestTier, string> = {
  low: "Low",
  mid: "Mid",
  high: "High",
  extreme: "Extreme",
  world: "World",
  special: "Special",
};

export function critTokens(tier: QuestTier): number {
  if (tier === "special") return 0;
  if (tier === "extreme" || tier === "world") return 3;
  if (tier === "high") return 2;
  return 1;
}

export function allQuests(state: GameState): BoardQuest[] {
  return [...state.board, ...(state.specialBoard ?? [])];
}

export function boardQuestByKey(state: GameState, key: string): BoardQuest | undefined {
  return allQuests(state).find((quest) => quest.key === key);
}

export function namedCompanyPower(state: GameState, cardIds: string[]): number {
  return cardIds.reduce((sum, id) => {
    const owned = state.cards.find((card) => card.id === id);
    return sum + (owned ? cardPower(owned) : 0);
  }, 0);
}

export function questDurationMs(template: QuestTemplate, power: number): number {
  if (template.secret) return secretDurationMs(power);
  return template.durationMs;
}

function patchBoard(state: GameState, quest: BoardQuest, next: BoardQuest): GameState {
  if (state.board.some((entry) => entry.key === quest.key)) {
    return { ...state, board: state.board.map((entry) => (entry.key === quest.key ? next : entry)) };
  }
  return {
    ...state,
    specialBoard: (state.specialBoard ?? []).map((entry) => (entry.key === quest.key ? next : entry)),
  };
}

export function seatsLabel(quest: QuestTemplate): string {
  return quest.teamMin === quest.teamMax ? `${quest.teamMin}` : `${quest.teamMin}–${quest.teamMax}`;
}

export function questClock(quest: BoardQuest, now: number): { ready: boolean; remaining: number; ratio: number } {
  const span = Math.max(1, quest.endsAt - quest.startedAt);
  const ready = now >= quest.endsAt;
  return {
    ready,
    remaining: Math.max(0, quest.endsAt - now),
    ratio: ready ? 1 : clamp((now - quest.startedAt) / span, 0, 1),
  };
}

/** Higher = better match for this bounty (advantages/crit/affinity first, hazards last). */
export function cardQuestFit(card: CardTemplate, quest: QuestTemplate): number {
  let score = 0;
  for (const adv of quest.advantages) {
    if (adv.type === "trait" && card.traits.includes(adv.id)) score += 120 + adv.pct;
    if (adv.type === "role" && card.role === adv.id) score += 120 + adv.pct;
  }
  for (const haz of quest.hazards) {
    if (haz.type === "trait" && card.traits.includes(haz.id)) score -= 90 + Math.abs(haz.pct);
    if (haz.type === "role" && card.role === haz.id) score -= 90 + Math.abs(haz.pct);
  }
  if (quest.element && (card.element === quest.element || card.element === "wild")) score += 45;
  if (quest.crit) {
    if (quest.crit.type === "role" && card.role === quest.crit.id) score += 70;
    if (quest.crit.type === "element" && (card.element === quest.crit.id || card.element === "wild")) score += 70;
    if (quest.crit.type === "set" && card.setId === quest.crit.id) score += 55;
  }
  return score;
}

export function cardQuestRibbons(card: CardTemplate, quest: QuestTemplate): { favored: boolean; hazard: boolean } {
  const favored = quest.advantages.some((adv) =>
    adv.type === "trait" ? card.traits.includes(adv.id) : card.role === adv.id,
  );
  const hazard = quest.hazards.some((haz) =>
    haz.type === "trait" ? card.traits.includes(haz.id) : card.role === haz.id,
  );
  return { favored, hazard };
}

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
  const picked: QuestTemplate[] = [];
  for (const tier of ["low", "mid", "high", "extreme", "world"] as QuestTier[]) {
    const count = DAILY_BY_TIER[tier];
    if (count <= 0) continue;
    picked.push(...pickSome(QUEST_TEMPLATES.filter((q) => q.tier === tier), count, rng));
  }
  return picked.map((q) => ({
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

export function debugRedrawBoard(state: GameState, now: number): GameState {
  const salt = `debug-${now}`;
  const underway = state.board.filter((q) => q.status === "underway");
  const fresh = makeBoard(salt).filter((q) => !underway.some((u) => u.templateId === q.templateId));
  return { ...state, board: [...underway, ...fresh] };
}

export function debugCompleteQuests(state: GameState, now: number): GameState {
  function finish(quest: BoardQuest): BoardQuest {
    if (quest.status !== "underway" || now >= quest.endsAt) return quest;
    return { ...quest, endsAt: now - 1 };
  }
  return {
    ...state,
    board: state.board.map(finish),
    specialBoard: (state.specialBoard ?? []).map(finish),
  };
}

export function debugUnlockLore(state: GameState): GameState {
  const ids = CHAPTERS.map((chapter) => chapter.id);
  return syncSecretQuests({
    ...state,
    unlockedChapters: ids,
    secretNoticesDismissed: [...new Set([...(state.secretNoticesDismissed ?? []), ...ids])],
  });
}

/** Refresh open/done quests when the local date rolls over; quests underway keep running. */
export function rolloverBoard(state: GameState, now: number): GameState {
  const day = dateKey(now);
  const rolled =
    state.boardDate === day
      ? state
      : (() => {
          const underway = state.board.filter((q) => q.status === "underway");
          const fresh = makeBoard(day).filter((q) => !underway.some((u) => u.templateId === q.templateId));
          return { ...state, boardDate: day, board: [...underway, ...fresh] };
        })();
  return syncSecretQuests(rolled);
}

export function pendingSecretNotices(state: GameState): { chapterId: string; title: string }[] {
  const owned = new Set(state.cards.map((card) => card.id));
  const unlocked = new Set(state.unlockedChapters ?? []);
  const dismissed = new Set(state.secretNoticesDismissed ?? []);
  const special = state.specialBoard ?? [];
  return CHAPTERS.filter((chapter) => {
    if (unlocked.has(chapter.id) || dismissed.has(chapter.id)) return false;
    if (!chapter.cardIds.every((id) => owned.has(id))) return false;
    const quest = special.find((entry) => entry.templateId === chapterQuestId(chapter.id));
    return quest?.status === "open";
  }).map((chapter) => ({ chapterId: chapter.id, title: chapter.title }));
}

export function dismissSecretNotice(state: GameState, chapterId: string): GameState {
  const dismissed = new Set(state.secretNoticesDismissed ?? []);
  if (dismissed.has(chapterId)) return state;
  return { ...state, secretNoticesDismissed: [...dismissed, chapterId] };
}

/** Open a special order once every named character is owned. */
export function syncSecretQuests(state: GameState, opts: { logNew?: boolean } = {}): GameState {
  const owned = new Set(state.cards.map((card) => card.id));
  const unlocked = new Set(state.unlockedChapters ?? []);
  let specialBoard = [...(state.specialBoard ?? [])];
  const addedTitles: string[] = [];
  let changed = false;

  for (const chapter of CHAPTERS) {
    const questId = chapterQuestId(chapter.id);
    const existing = specialBoard.find((quest) => quest.templateId === questId);
    const haveAll = chapter.cardIds.every((id) => owned.has(id));

    if (unlocked.has(chapter.id)) {
      if (existing && existing.status !== "underway") {
        specialBoard = specialBoard.filter((quest) => quest.templateId !== questId);
        changed = true;
      }
      continue;
    }

    if (!haveAll || existing) continue;

    specialBoard.push({
      key: `secret-${chapter.id}`,
      templateId: questId,
      status: "open",
      team: [],
      startedAt: 0,
      endsAt: 0,
      success: 100,
      crit: 0,
      critMatched: false,
    });
    addedTitles.push(chapter.title);
    changed = true;
  }

  if (!changed) {
    if (!state.specialBoard || !state.unlockedChapters || !state.secretNoticesDismissed) {
      return {
        ...state,
        specialBoard: state.specialBoard ?? [],
        unlockedChapters: state.unlockedChapters ?? [],
        secretNoticesDismissed: state.secretNoticesDismissed ?? [],
      };
    }
    return state;
  }

  let next: GameState = {
    ...state,
    specialBoard,
    unlockedChapters: state.unlockedChapters ?? [],
    secretNoticesDismissed: state.secretNoticesDismissed ?? [],
  };
  if (opts.logNew) {
    for (const title of addedTitles) {
      next = log(next, "system", `A special order is waiting: ${title}.`);
    }
  }
  return next;
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
  return allQuests(state).some((q) => q.status === "underway" && q.team.includes(cardId));
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
  const quest = boardQuestByKey(state, key);
  if (!quest || quest.status !== "open") return { state, error: "That bounty is no longer open." };
  const template = QUEST_BY_ID[quest.templateId];
  if (!template) return { state, error: "The bounty has faded." };
  if (team.length < template.teamMin || team.length > template.teamMax)
    return { state, error: `This bounty needs ${seatsLabel(template)} in the company.` };
  if (template.secret) {
    const required = template.secret.requiredCardIds;
    if (required.length !== team.length || required.some((id) => !team.includes(id))) {
      return { state, error: "This special order names its own company." };
    }
  }
  for (const id of team) {
    if (!ownedById(state, id)) return { state, error: "That name is not in your company." };
    if (isBusy(state, id)) return { state, error: `${CARD_BY_ID[id]?.name ?? id} is already out.` };
    if (isExhausted(state, id, now)) return { state, error: `${CARD_BY_ID[id]?.name ?? id} needs rest.` };
    if (template.secret && shownLevel(ownedById(state, id)!.level) < template.secret.minShownLevel) {
      return { state, error: `${CARD_BY_ID[id]?.name ?? id} must stand at level ${template.secret.minShownLevel}.` };
    }
  }

  const a = assessTeam(state, template, team);
  const duration = questDurationMs(template, a.power);
  const nextQuest: BoardQuest = {
    ...quest,
    status: "underway",
    team: [...team],
    startedAt: now,
    endsAt: now + duration,
    success: template.secret ? 100 : a.success,
    crit: template.secret ? 0 : a.crit,
    critMatched: template.secret ? false : a.critMatched,
  };
  const nextState = patchBoard(state, quest, nextQuest);
  return {
    state: log(nextState, "system", `${template.name}: a team of ${team.length} sets out. ${nextQuest.success}% odds.`),
  };
}

export function resolveQuest(
  state: GameState,
  key: string,
  now: number,
): { state: GameState; outcome?: QuestOutcome; error?: string } {
  const quest = boardQuestByKey(state, key);
  if (!quest || quest.status !== "underway") return { state, error: "No team is out on that bounty." };
  if (now < quest.endsAt) return { state, error: "The team has not returned yet." };
  const template = QUEST_BY_ID[quest.templateId];
  if (!template) return { state, error: "The bounty has faded." };

  const roll = template.secret ? 1 : 1 + Math.floor(Math.random() * 100);
  const result: QuestOutcome["result"] = template.secret
    ? "success"
    : roll <= quest.crit
      ? "crit"
      : roll <= quest.success
        ? "success"
        : "fail";
  const won = result !== "fail";

  let gold = won ? template.gold : 0;
  if (won && quest.critMatched) gold = Math.round(gold * CRIT_LOOT_MULT);
  const tokens = result === "crit" ? critTokens(template.tier) : 0;
  const xpEach = won ? template.xp : Math.max(1, Math.round(template.xp * 0.25));
  const restMs = (quest.endsAt - quest.startedAt) * (won ? 0.5 : 2);

  const leveled: string[] = [];
  const xpGains: QuestOutcome["xpGains"] = [];
  const cards = state.cards.map((c) => {
    if (!quest.team.includes(c.id)) return c;
    const { card, leveled: up } = grantXp(c, xpEach);
    if (up) leveled.push(c.id);
    xpGains.push({
      id: c.id,
      gained: xpEach,
      fromLevel: c.level,
      fromXp: c.xp,
      toLevel: card.level,
      toXp: card.xp,
    });
    return { ...card, exhaustedUntil: now + restMs };
  });

  let next: GameState = patchBoard(
    { ...state, cards, gold: state.gold + gold, tokens: state.tokens + tokens },
    quest,
    { ...quest, status: "done" },
  );
  if (won && template.secret) {
    const chapterId = template.secret.chapterId;
    if (!(next.unlockedChapters ?? []).includes(chapterId)) {
      next = { ...next, unlockedChapters: [...(next.unlockedChapters ?? []), chapterId] };
    }
    next = dismissSecretNotice(next, chapterId);
  }
  next = log(
    next,
    won ? "success" : "fail",
    won
      ? template.secret
        ? `${template.name}: the chapter is unsealed.`
        : `${template.name}: ${result === "crit" ? "a triumph" : "done"}. ${gold} gold${tokens ? `, ${tokens} token${tokens > 1 ? "s" : ""}` : ""}.`
      : `${template.name}: the team returns empty-handed and spent.`,
  );
  next = syncSecretQuests(next);

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
    xpGains,
    critMatched: quest.critMatched,
  };
  return { state: next, outcome };
}

// ————— tavern packs —————

export function buyPack(
  state: GameState,
  kind: "gold" | "token",
  opts: { silent?: boolean } = {},
): { state: GameState; result?: PackResult; error?: string } {
  if (kind === "gold" && state.gold < GOLD_PACK_COST) return { state, error: "Not enough gold." };
  if (kind === "token" && state.tokens < TOKEN_PACK_COST) return { state, error: "No recruitment tokens." };

  const ownedIds = new Set(state.cards.map((c) => c.id));
  let pool = TAVERN_CARDS;
  if (kind === "token") {
    const unowned = TAVERN_CARDS.filter((c) => !ownedIds.has(c.id));
    if (unowned.length > 0) pool = unowned;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const isNew = !ownedIds.has(pick.id);
  const dupeXp = kind === "gold" ? DUPE_XP_GOLD : DUPE_XP_TOKEN;

  let cards = state.cards;
  if (isNew) {
    cards = [...cards, makeOwned(pick.id)];
  } else {
    cards = cards.map((c) =>
      c.id === pick.id
        ? { ...c, duplicates: (c.duplicates ?? 0) + 1, duplicateXp: (c.duplicateXp ?? 0) + dupeXp }
        : c,
    );
  }

  let next: GameState = {
    ...state,
    cards,
    gold: kind === "gold" ? state.gold - GOLD_PACK_COST : state.gold,
    tokens: kind === "token" ? state.tokens - TOKEN_PACK_COST : state.tokens,
  };
  if (!opts.silent) {
    next = log(
      next,
      "recruit",
      isNew
        ? `${pick.name} joins the company.`
        : `Another likeness of ${pick.name} is held in reserve (${dupeXp} XP).`,
    );
  }
  return { state: syncSecretQuests(next, { logNew: !opts.silent }), result: { cardId: pick.id, isNew, xp: isNew ? 0 : dupeXp } };
}

export function buyPacks(
  state: GameState,
  kind: "gold" | "token",
  count: number,
): { state: GameState; results?: PackResult[]; error?: string } {
  const n = Math.max(1, Math.floor(count));
  const goldNeed = kind === "gold" ? GOLD_PACK_COST * n : 0;
  const tokenNeed = kind === "token" ? TOKEN_PACK_COST * n : 0;
  if (kind === "gold" && state.gold < goldNeed) return { state, error: "Not enough gold." };
  if (kind === "token" && state.tokens < tokenNeed) return { state, error: "No recruitment tokens." };

  let next = state;
  const results: PackResult[] = [];
  for (let i = 0; i < n; i += 1) {
    const step = buyPack(next, kind, { silent: n > 1 });
    if (!step.result) return { state, error: step.error };
    next = step.state;
    results.push(step.result);
  }
  if (n > 1) {
    next = log(next, "recruit", `${n} names from the road.`);
  }
  return { state: next, results };
}

// ————— display helpers —————

export function critLabel(template: QuestTemplate): string | null {
  if (!template.crit) return null;
  if (template.crit.type === "element") return ELEMENT_LABEL[template.crit.id as never];
  if (template.crit.type === "role") return ROLE_LABEL[template.crit.id as never];
  return SET_BY_ID[template.crit.id]?.name ?? template.crit.id;
}
