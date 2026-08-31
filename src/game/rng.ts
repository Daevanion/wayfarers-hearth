import { ADVENTURERS } from "../data/adventurers";
import { DROP_TABLE, EQUIPMENT_BY_ID, RARITY_RANK } from "../data/equipment";
import type { EquipmentTemplate, Rarity } from "../types";

export function roll(chance: number): boolean {
  return Math.random() < chance;
}

export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function weightedPick<T>(entries: { item: T; weight: number }[]): T {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let cursor = Math.random() * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.item;
  }
  return entries[entries.length - 1].item;
}

const RARITY_WEIGHTS: { item: Rarity; weight: number }[] = [
  { item: "common", weight: 52 },
  { item: "uncommon", weight: 28 },
  { item: "rare", weight: 13 },
  { item: "epic", weight: 5.5 },
  { item: "legendary", weight: 1.5 },
];

export function rollRecruitRarity(pity: number): Rarity {
  if (pity >= 18) return "rare";
  if (pity >= 12) {
    return weightedPick([
      { item: "uncommon", weight: 40 },
      { item: "rare", weight: 40 },
      { item: "epic", weight: 16 },
      { item: "legendary", weight: 4 },
    ]);
  }
  return weightedPick(RARITY_WEIGHTS);
}

export function rollAdventurerId(ownedIds: string[], rarity: Rarity): string {
  const ofRarity = ADVENTURERS.filter((a) => a.rarity === rarity);
  const unowned = ofRarity.filter((a) => !ownedIds.includes(a.id));
  const pool = unowned.length > 0 ? unowned : ofRarity.length > 0 ? ofRarity : ADVENTURERS;
  return pick(pool).id;
}

export function rollEquipmentDrop(lootLevel: number): EquipmentTemplate | null {
  const tier = Math.min(8, Math.max(1, lootLevel));
  const table = DROP_TABLE[tier] ?? DROP_TABLE[1];
  const bucket = weightedPick(table.map((row) => ({ item: row.ids, weight: row.weight })));
  const id = pick(bucket);
  return EQUIPMENT_BY_ID[id] ?? null;
}

export function rarityAtLeast(rarity: Rarity, min: Rarity): boolean {
  return RARITY_RANK[rarity] >= RARITY_RANK[min];
}
