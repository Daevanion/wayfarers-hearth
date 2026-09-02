import fire from "../Assets/bg/fire.png";
import water from "../Assets/bg/water.png";
import earth from "../Assets/bg/earth.png";
import air from "../Assets/bg/air.png";
import light from "../Assets/bg/light.png";
import dark from "../Assets/bg/dark.png";
import magic from "../Assets/bg/magic.png";
import melee from "../Assets/bg/melee.png";
import ranged from "../Assets/bg/ranged.png";
import healer from "../Assets/bg/healer.png";
import time from "../Assets/bg/time.png";
import type { CombatId, ElementId, RoleId } from "../types";

export const ELEMENT_ICON: Record<ElementId, string | null> = {
  fire,
  water,
  earth,
  air,
  light,
  dark,
  null: null,
  wild: magic,
};

export const ELEMENT_LABEL: Record<ElementId, string> = {
  fire: "Fire",
  water: "Water",
  earth: "Earth",
  air: "Air",
  light: "Light",
  dark: "Dark",
  null: "Null",
  wild: "Wild",
};

export const ELEMENT_ORDER: ElementId[] = ["fire", "water", "earth", "air", "light", "dark", "wild", "null"];

export const COMBAT_ICON: Record<CombatId, string> = {
  melee,
  ranged,
  magic,
};

export const COMBAT_LABEL: Record<CombatId, string> = {
  melee: "Melee",
  ranged: "Ranged",
  magic: "Magic",
};

export const COMBAT_ORDER: CombatId[] = ["melee", "ranged", "magic"];

export const ROLE_LABEL: Record<RoleId, string> = {
  healer: "Healer",
  scout: "Scout",
  ranger: "Ranger",
  mage: "Mage",
  tank: "Tank",
  cleric: "Cleric",
  berserker: "Berserker",
  archmage: "Archmage",
  warrior: "Warrior",
  paladin: "Paladin",
};

export const ROLE_ORDER: RoleId[] = [
  "healer",
  "scout",
  "ranger",
  "mage",
  "tank",
  "cleric",
  "berserker",
  "archmage",
  "warrior",
  "paladin",
];

export const ROLE_ICON: Partial<Record<RoleId, string>> = {
  healer,
};

export const TIME_ICON = time;
