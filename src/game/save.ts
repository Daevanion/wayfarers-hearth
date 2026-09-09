import { STARTER_IDS } from "../data/cards";
import { makeOwned, normalizeOwned } from "./formulas";
import { dateKey, makeBoard, syncSecretQuests } from "./quests";
import type { GameState } from "../types";

export const SAVE_KEY = "wayfarers-hearth-board-v1";
export const SAVE_VERSION = 14;

function withSecretFields(state: GameState): GameState {
  return syncSecretQuests({
    ...state,
    version: SAVE_VERSION,
    specialBoard: state.specialBoard ?? [],
    unlockedChapters: state.unlockedChapters ?? [],
    secretNoticesDismissed: state.secretNoticesDismissed ?? [],
    cards: (state.cards ?? []).map(normalizeOwned),
  });
}

export function createNewGame(): GameState {
  const now = Date.now();
  const day = dateKey(now);
  return {
    version: SAVE_VERSION,
    gold: 30,
    tokens: 0,
    cards: STARTER_IDS.map((id) => makeOwned(id)),
    boardDate: day,
    board: makeBoard(day),
    specialBoard: [],
    unlockedChapters: [],
    secretNoticesDismissed: [],
    journal: [
      {
        id: "welcome",
        at: now,
        kind: "system",
        text: "The bounty board is up. Match traits to the work, mind the hazards, and bring them home.",
      },
    ],
    createdAt: now,
  };
}

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed) return null;
    if (parsed.version === SAVE_VERSION) return withSecretFields(parsed);
    if (parsed.version === 13) return withSecretFields(parsed);
    return null;
  } catch {
    return null;
  }
}

export function persist(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
