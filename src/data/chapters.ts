import type { QuestTemplate } from "../types";
import { BACKGROUNDS } from "./backgrounds";
import { CHAPTER_BODIES } from "./chapterBodies";

export const CHAPTER_SLOT_COUNT = 4;
export const SECRET_MIN_SHOWN_LEVEL = 2;

export interface ChapterDef {
  id: string;
  title: string;
  location: string;
  map: { left: string; top: string };
  cardIds: string[];
  body: string[];
  questFlavor: string;
  questLore: string;
  art: string;
}

const MIN = 60 * 1000;

export const CHAPTERS: ChapterDef[] = [
  {
    id: "sixty-percent-of-a-hero",
    title: "Sixty Percent of a Hero",
    location: "East border of Silver Gale",
    map: { left: "48%", top: "42%" },
    cardIds: ["alden-hollowgarth", "yvaine-ashcroft", "eamon-stoneseeker"],
    body: CHAPTER_BODIES["sixty-percent-of-a-hero"],
    questFlavor: "A snippet into the past of Alden Hollowgarth, Yvaine Ashcroft, and Eamon Stoneseeker. Complete to unlock the chapter.",
    questLore:
      "The outer woods of the Citadel still remember a troll, a niece who would not yield, and a scout who named his price. Walk that road again and the page will open.",
    art: BACKGROUNDS.merchantRoad,
  },
  {
    id: "a-lesson-in-the-dark",
    title: "A Lesson in the Dark",
    location: "Dark forest between Silver Gale and the Woodlands",
    map: { left: "58%", top: "46%" },
    cardIds: ["lysandra-silverleaf", "kaelen-duskwalker"],
    body: CHAPTER_BODIES["a-lesson-in-the-dark"],
    questFlavor: "A snippet into the past of Lysandra Silverleaf and Kaelan Duskwalker. Complete to unlock the chapter.",
    questLore:
      "A shack at the forest's edge, a child's temper, and a guardian who answers without raising her voice. Return there, and the lesson waits.",
    art: BACKGROUNDS.corruptionEdge,
  },
  {
    id: "the-silence-of-the-hollow-blade",
    title: "The Silence of the Hollow Blade",
    location: "Dark Glade",
    map: { left: "50%", top: "70%" },
    cardIds: ["corvus-grim", "aurora-starling", "serilla"],
    body: CHAPTER_BODIES["the-silence-of-the-hollow-blade"],
    questFlavor: "A snippet into the past of Corvus Grim, Aurora Starling, and Serilla. Complete to unlock the chapter.",
    questLore:
      "The Glade keeps a third twilight when a child stood watch and the vanguard learned a quieter fear. Complete the order to unseal that night.",
    art: BACKGROUNDS.abyss,
  },
  {
    id: "the-faithless-shield",
    title: "The Faithless Shield",
    location: "Lightspear",
    map: { left: "20%", top: "48%" },
    cardIds: ["seraphina-aurora", "fenric-valerand"],
    body: CHAPTER_BODIES["the-faithless-shield"],
    questFlavor: "A snippet into the past of Fenric Valerand and Seraphina Aurora. Complete to unlock the chapter.",
    questLore:
      "The Cathedral of Enlightenment still holds the morning Fenric swore his ruined life to the woman who dragged him back from death. Walk the garden again.",
    art: BACKGROUNDS.faithlessShield,
  },
  {
    id: "the-beastmasters-detour",
    title: "The Beastmaster's Detour",
    location: "Dark forest between Silver Gale and the Woodlands",
    map: { left: "61%", top: "44%" },
    cardIds: ["eva-hearthgale", "elowen-wolfcrag", "evander-wolfcrag"],
    body: CHAPTER_BODIES["the-beastmasters-detour"],
    questFlavor: "A snippet into the past of Eva Hearthgale, Elowen Wolfcrag, and Evander Wolfcrag. Complete to unlock the chapter.",
    questLore:
      "A week-long walk to a rotting shack, a direwolf at heel, and a father already saying goodbye. Take the detour, and the page will open.",
    art: BACKGROUNDS.corruptionEdge,
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((chapter) => [chapter.id, chapter])) as Record<
  string,
  ChapterDef
>;

export function chapterQuestId(chapterId: string): string {
  return `secret-${chapterId}`;
}

export function chaptersForCard(cardId: string): ChapterDef[] {
  return CHAPTERS.filter((chapter) => chapter.cardIds.includes(cardId));
}

export const SECRET_QUEST_TEMPLATES: QuestTemplate[] = CHAPTERS.map((chapter) => ({
  id: chapterQuestId(chapter.id),
  name: chapter.title,
  flavor: chapter.questFlavor,
  lore: chapter.questLore,
  durationMs: 3 * MIN,
  tier: "special",
  element: null,
  power: 0,
  teamMin: chapter.cardIds.length,
  teamMax: chapter.cardIds.length,
  art: chapter.art,
  advantages: [],
  hazards: [],
  gold: 40,
  xp: 50,
  secret: {
    chapterId: chapter.id,
    requiredCardIds: chapter.cardIds,
    minShownLevel: SECRET_MIN_SHOWN_LEVEL,
  },
}));
