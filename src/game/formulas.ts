import { CARD_BY_ID } from "../data/cards";
import type { OwnedCard, Rarity } from "../types";

export const MAX_LEVEL = 5;
export const POWER_PER_LEVEL = 5;

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** XP needed to go from `level` to `level + 1`. */
export function xpToNext(level: number): number | null {
  if (level >= MAX_LEVEL) return null;
  return 50 + level * 50;
}

export function cardPower(owned: OwnedCard): number {
  const base = CARD_BY_ID[owned.id]?.power ?? 0;
  return base + (owned.level - 1) * POWER_PER_LEVEL;
}

/** Add XP and consume level-ups. Returns the new card and whether it leveled. */
export function grantXp(owned: OwnedCard, amount: number): { card: OwnedCard; leveled: boolean } {
  let level = owned.level;
  let xp = owned.xp + Math.max(0, Math.round(amount));
  let leveled = false;
  for (;;) {
    const need = xpToNext(level);
    if (need == null || xp < need) break;
    xp -= need;
    level += 1;
    leveled = true;
  }
  return { card: { ...owned, level, xp }, leveled };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function signedPct(n: number): string {
  if (n > 0) return `+${Math.round(n)}%`;
  return `${Math.round(n)}%`;
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
