import type { EquipSlot, EquipmentTemplate, Rarity } from "../types";

export const SLOT_ORDER: EquipSlot[] = ["head", "body", "legs", "hands", "neck", "rings", "emblem"];

export const SLOT_LABEL: Record<EquipSlot, string> = {
  head: "Head",
  body: "Body",
  legs: "Legs",
  hands: "Hands",
  neck: "Neck",
  rings: "Rings",
  emblem: "Emblem",
};

export const EQUIPMENT: EquipmentTemplate[] = [
  {
    id: "wool-hood",
    name: "Wool Hood",
    slot: "head",
    rarity: "common",
    mods: { time: -0.03, success: 0.02, loot: 0, recruit: 0, equipment: 0 },
    craft: { gold: 18, iron: 0, herbs: 2, relics: 0 },
  },
  {
    id: "iron-helm",
    name: "Iron Helm",
    slot: "head",
    rarity: "uncommon",
    mods: { time: 0.03, success: 0.05, loot: 0, recruit: 0, equipment: 0 },
    craft: { gold: 52, iron: 8, herbs: 0, relics: 0 },
  },
  {
    id: "ward-circlet",
    name: "Ward Circlet",
    slot: "head",
    rarity: "rare",
    mods: { time: 0, success: 0.06, loot: 0, recruit: 0.04, equipment: 0 },
    craft: { gold: 110, iron: 4, herbs: 8, relics: 1 },
  },
  {
    id: "travel-cloak",
    name: "Travel Cloak",
    slot: "body",
    rarity: "common",
    mods: { time: -0.04, success: 0.02, loot: 0, recruit: 0, equipment: 0 },
    craft: { gold: 20, iron: 0, herbs: 3, relics: 0 },
  },
  {
    id: "leather-jack",
    name: "Leather Jack",
    slot: "body",
    rarity: "common",
    mods: { time: 0, success: 0.04, loot: 0, recruit: 0, equipment: 0 },
    craft: { gold: 30, iron: 2, herbs: 2, relics: 0 },
  },
  {
    id: "chain-hauberk",
    name: "Chain Hauberk",
    slot: "body",
    rarity: "uncommon",
    mods: { time: 0.05, success: 0.07, loot: -0.03, recruit: 0, equipment: 0 },
    craft: { gold: 70, iron: 10, herbs: 0, relics: 0 },
  },
  {
    id: "knights-plate",
    name: "Knight's Plate",
    slot: "body",
    rarity: "epic",
    mods: { time: 0.08, success: 0.12, loot: -0.06, recruit: 0.04, equipment: 0 },
    craft: { gold: 240, iron: 20, herbs: 2, relics: 2 },
  },
  {
    id: "trail-breeches",
    name: "Trail Breeches",
    slot: "legs",
    rarity: "common",
    mods: { time: -0.04, success: 0, loot: 0, recruit: 0, equipment: 0 },
    craft: { gold: 16, iron: 0, herbs: 2, relics: 0 },
  },
  {
    id: "iron-greaves",
    name: "Iron Greaves",
    slot: "legs",
    rarity: "uncommon",
    mods: { time: 0.02, success: 0.04, loot: 0, recruit: 0, equipment: 0 },
    craft: { gold: 48, iron: 7, herbs: 0, relics: 0 },
  },
  {
    id: "pilgrim-wraps",
    name: "Pilgrim Wraps",
    slot: "legs",
    rarity: "rare",
    mods: { time: -0.06, success: 0.02, loot: 0, recruit: 0.04, equipment: 0 },
    craft: { gold: 100, iron: 2, herbs: 8, relics: 1 },
  },
  {
    id: "work-gloves",
    name: "Work Gloves",
    slot: "hands",
    rarity: "common",
    mods: { time: 0, success: 0, loot: 0, recruit: 0, equipment: 0.05 },
    craft: { gold: 14, iron: 1, herbs: 1, relics: 0 },
  },
  {
    id: "mercenary-gauntlets",
    name: "Mercenary Gauntlets",
    slot: "hands",
    rarity: "uncommon",
    mods: { time: 0.03, success: 0.04, loot: 0, recruit: 0, equipment: 0.08 },
    craft: { gold: 55, iron: 8, herbs: 0, relics: 0 },
  },
  {
    id: "silvered-grips",
    name: "Silvered Grips",
    slot: "hands",
    rarity: "rare",
    mods: { time: -0.02, success: 0.06, loot: 0, recruit: 0.03, equipment: 0 },
    craft: { gold: 115, iron: 8, herbs: 4, relics: 1 },
  },
  {
    id: "lucky-penny",
    name: "Lucky Penny",
    slot: "neck",
    rarity: "common",
    mods: { time: 0, success: 0, loot: 0.08, recruit: 0.03, equipment: 0 },
    craft: { gold: 18, iron: 1, herbs: 1, relics: 0 },
  },
  {
    id: "wolf-tooth",
    name: "Wolf Tooth",
    slot: "neck",
    rarity: "uncommon",
    mods: { time: -0.03, success: 0.03, loot: 0, recruit: 0, equipment: 0.06 },
    craft: { gold: 48, iron: 3, herbs: 4, relics: 0 },
  },
  {
    id: "saints-relic",
    name: "Saint's Relic",
    slot: "neck",
    rarity: "epic",
    mods: { time: 0, success: 0.09, loot: 0, recruit: 0.08, equipment: 0 },
    craft: { gold: 180, iron: 4, herbs: 12, relics: 2 },
  },
  {
    id: "copper-band",
    name: "Copper Band",
    slot: "rings",
    rarity: "common",
    mods: { time: 0, success: 0, loot: 0.05, recruit: 0, equipment: 0 },
    craft: { gold: 16, iron: 2, herbs: 0, relics: 0 },
  },
  {
    id: "jesters-bell",
    name: "Jester's Bell",
    slot: "rings",
    rarity: "rare",
    mods: { time: 0.08, success: -0.04, loot: 0.16, recruit: -0.05, equipment: 0 },
    craft: { gold: 90, iron: 2, herbs: 6, relics: 1 },
  },
  {
    id: "waystone-shard",
    name: "Waystone Shard",
    slot: "rings",
    rarity: "legendary",
    mods: { time: -0.1, success: 0.06, loot: 0.06, recruit: 0.1, equipment: 0.08 },
    craft: { gold: 360, iron: 12, herbs: 12, relics: 5 },
  },
  {
    id: "hearth-badge",
    name: "Hearth Badge",
    slot: "emblem",
    rarity: "common",
    mods: { time: 0, success: 0.02, loot: 0, recruit: 0.05, equipment: 0 },
    craft: { gold: 22, iron: 1, herbs: 1, relics: 0 },
  },
  {
    id: "oak-sigil",
    name: "Oak Sigil",
    slot: "emblem",
    rarity: "uncommon",
    mods: { time: 0, success: 0.04, loot: 0, recruit: 0.04, equipment: 0 },
    craft: { gold: 50, iron: 3, herbs: 3, relics: 0 },
  },
  {
    id: "kingsbane-seal",
    name: "Kingsbane Seal",
    slot: "emblem",
    rarity: "epic",
    mods: { time: 0.04, success: 0.08, loot: -0.04, recruit: 0.08, equipment: 0.04 },
    craft: { gold: 220, iron: 10, herbs: 4, relics: 3 },
  },
];

export const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e])) as Record<
  string,
  EquipmentTemplate
>;

export const DROP_TABLE: Record<number, { ids: string[]; weight: number }[]> = {
  1: [{ ids: ["wool-hood", "travel-cloak", "lucky-penny", "work-gloves"], weight: 1 }],
  2: [
    { ids: ["wool-hood", "leather-jack", "trail-breeches", "copper-band", "hearth-badge"], weight: 3 },
    { ids: ["iron-helm", "wolf-tooth"], weight: 1 },
  ],
  3: [
    { ids: ["leather-jack", "lucky-penny", "work-gloves"], weight: 2 },
    { ids: ["iron-helm", "chain-hauberk", "iron-greaves", "wolf-tooth"], weight: 3 },
  ],
  4: [
    { ids: ["chain-hauberk", "mercenary-gauntlets", "oak-sigil"], weight: 3 },
    { ids: ["ward-circlet", "pilgrim-wraps", "jesters-bell"], weight: 2 },
  ],
  5: [
    { ids: ["iron-greaves", "wolf-tooth"], weight: 2 },
    { ids: ["ward-circlet", "silvered-grips", "jesters-bell"], weight: 4 },
    { ids: ["saints-relic", "kingsbane-seal"], weight: 1 },
  ],
  6: [
    { ids: ["ward-circlet", "pilgrim-wraps", "jesters-bell"], weight: 3 },
    { ids: ["knights-plate", "saints-relic", "kingsbane-seal"], weight: 3 },
  ],
  7: [
    { ids: ["knights-plate", "saints-relic", "kingsbane-seal"], weight: 4 },
    { ids: ["waystone-shard"], weight: 1 },
  ],
  8: [
    { ids: ["knights-plate", "saints-relic"], weight: 2 },
    { ids: ["waystone-shard"], weight: 2 },
  ],
};

export const RARITY_RANK: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};
