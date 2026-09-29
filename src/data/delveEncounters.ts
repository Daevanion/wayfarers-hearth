import { BACKGROUNDS } from "./backgrounds";
import type { DelveEncounterDef } from "../types";

export const DELVE_ENCOUNTERS: DelveEncounterDef[] = [
  {
    id: "road-brigands",
    name: "Road Brigands",
    element: "earth",
    hp: 18,
    damage: 5,
    art: BACKGROUNDS.oldKingsRoad,
    flavor: "Knives from the ditch. They want the purse, not a sermon.",
  },
  {
    id: "mire-lurkers",
    name: "Mire Lurkers",
    element: "water",
    hp: 20,
    damage: 5,
    art: BACKGROUNDS.mirefenCrossing,
    flavor: "Wet hands and a patience the fen taught them.",
  },
  {
    id: "wood-wights",
    name: "Wood Wights",
    element: "air",
    hp: 16,
    damage: 6,
    art: BACKGROUNDS.whisperingWoods,
    flavor: "The trees remember older names than yours.",
  },
  {
    id: "goblin-knives",
    name: "Goblin Knives",
    element: "fire",
    hp: 14,
    damage: 6,
    art: BACKGROUNDS.goblinQuest,
    flavor: "Small, loud, and already counting your boots.",
  },
  {
    id: "bridge-gang",
    name: "Bridge Gang",
    element: "earth",
    hp: 22,
    damage: 6,
    art: BACKGROUNDS.bridgeGang,
    flavor: "The toll is whatever they can take off a body.",
  },
  {
    id: "caravan-raiders",
    name: "Caravan Raiders",
    element: "fire",
    hp: 18,
    damage: 5,
    art: BACKGROUNDS.caravan,
    flavor: "Smoke on the wagons, steel in the grass.",
  },
  {
    id: "ruin-sentries",
    name: "Ruin Sentries",
    elite: true,
    element: "earth",
    hp: 28,
    damage: 8,
    art: BACKGROUNDS.ruinsCaldara,
    flavor: "Stone that still thinks it is a garrison.",
  },
  {
    id: "chapel-wardens",
    name: "Chapel Wardens",
    elite: true,
    element: "light",
    hp: 26,
    damage: 7,
    art: BACKGROUNDS.brokenChapel,
    flavor: "Faith without a congregation, and a mace to prove it.",
  },
  {
    id: "corruption-spawn",
    name: "Corruption Spawn",
    elite: true,
    element: "dark",
    hp: 30,
    damage: 8,
    art: BACKGROUNDS.corruptionEdge,
    flavor: "The edge of the stain has learned to walk.",
  },
  {
    id: "mire-hag",
    name: "The Mire Hag",
    boss: true,
    element: "water",
    hp: 42,
    damage: 10,
    art: BACKGROUNDS.mirefenCrossing,
    flavor: "She keeps the crossing by drowning the names that forget her.",
  },
  {
    id: "hollow-captain",
    name: "Hollow Captain",
    boss: true,
    element: "dark",
    hp: 46,
    damage: 11,
    art: BACKGROUNDS.abyss,
    flavor: "A rank without a country, still issuing orders in the black.",
  },
  {
    id: "ash-prelate",
    name: "Ash Prelate",
    boss: true,
    element: "fire",
    hp: 44,
    damage: 10,
    art: BACKGROUNDS.brokenChapel,
    flavor: "Sermons of cinder. The choir does not answer.",
  },
];

export const ENCOUNTER_BY_ID = Object.fromEntries(DELVE_ENCOUNTERS.map((e) => [e.id, e])) as Record<
  string,
  DelveEncounterDef
>;

export const REGULAR_ENCOUNTERS = DELVE_ENCOUNTERS.filter((e) => !e.elite && !e.boss);
export const ELITE_ENCOUNTERS = DELVE_ENCOUNTERS.filter((e) => e.elite);
export const BOSS_ENCOUNTERS = DELVE_ENCOUNTERS.filter((e) => e.boss);
