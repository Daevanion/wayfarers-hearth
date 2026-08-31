import { STARTER_IDS } from "../data/cards";
import { dateKey, makeBoard } from "./quests";
import type { GameState } from "../types";

export const SAVE_KEY = "wayfarers-hearth-board-v1";
export const SAVE_VERSION = 12;

export function createNewGame(): GameState {
  const now = Date.now();
  const day = dateKey(now);
  return {
    version: SAVE_VERSION,
    gold: 30,
    tokens: 0,
    cards: STARTER_IDS.map((id) => ({ id, level: 1, xp: 0, exhaustedUntil: 0 })),
    boardDate: day,
    board: makeBoard(day),
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
    if (!parsed || parsed.version !== SAVE_VERSION) return null;
    return parsed;
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
