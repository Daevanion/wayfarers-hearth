import { useMemo, type ReactNode } from "react";
import { ELEMENT_LABEL } from "../data/icons";
import { TRAITS } from "../data/traits";
import type { CardTemplate, ElementId } from "../types";

interface Mark {
  term: string;
  className: string;
}

const ELEMENT_ALIASES: Record<ElementId, string[]> = {
  fire: ["Master of Fire", "Fire Mage", "Fire Berserker", "Fire magic", "fire magic", "fiery", "Fire"],
  water: ["Water Ranger", "Water Cleric", "water"],
  earth: ["Earth healer", "Earth Warrior", "Earth and Fire", "earthen", "Earth"],
  air: ["Air Ranger", "Air Warrior", "Air Scout", "air"],
  light: ["Light Cleric", "Light Paladin", "Light"],
  dark: ["Dark Paladin", "Dark attuned", "Dark Berserker", "Dark Mage", "dark aura", "dark glade", "darkness", "dark forests", "dark origins", "Dark"],
  null: ["lacking elemental", "without relying on elemental", "without the need for elemental", "non elemental", "without elemental magic", "elemental magic"],
  wild: ["goddess of the wild", "Wild element", "wild magic", "Wild"],
};

const TRAIT_ALIASES: Record<string, string[]> = {
  kindhearted: ["fondness for humanity", "cheerful", "warmth", "kindhearted"],
  steadfast: ["unbreakable vow", "steadfast"],
  oblivious: ["oblivious", "denseness"],
  perceptive: ["perceptive"],
  artisan: ["sewing and pottery", "sewing", "pottery", "blacksmith", "smithing", "craftsmanship", "craftswoman"],
  secretive: ["closely guarded secrets", "secrets"],
  brave: ["bravery", "brave"],
  resourceful: ["resourcefulness", "resourceful", "quick thinking"],
  forgetful: ["terrible memory", "forgetful"],
  wise: ["wisdom", "wise"],
  nurturing: ["adopted daughter", "took in", "nurturing"],
  reclusive: ["vanished entirely", "five centuries of silence", "solitary", "isolation", "reclusive"],
  focused: ["focused", "singular focus"],
  honorbound: ["blood oath", "debt of life", "honorbound"],
  vindictive: ["vindictive"],
  charismatic: ["charisma", "charismatic"],
  stalwart: ["stood his ground", "stalwart"],
  greedy: ["untold riches", "greedy"],
  prodigy: ["prodigious", "prodigy"],
  hotheaded: ["thorny exterior", "hot-headed", "hotheaded"],
  devout: ["holy order", "Bishop", "devout"],
  protective: ["protector", "parental", "protective"],
  guiltridden: ["well of guilt", "guilt"],
  mighty: ["troll grade greatsword", "massive blade", "raw strength", "mighty"],
  cowardly: ["unapologetic coward", "coward", "skittish"],
  eccentric: ["eccentric", "bizarre"],
  lethal: ["highly lethal", "lethal"],
  mercenary: ["merit and financial gain", "mercenary", "coin purse", "lowest grade quests"],
  distrustful: ["untrusting", "distrusts", "distrustful"],
  legendary: ["first half demon", "original demonfolk", "living legend", "legendary"],
  scholarly: ["intellectual", "scholarly"],
  scheming: ["timid facade", "skittish guise", "ulterior motives", "shrouded in complete mystery", "shrouded in secrecy", "scheming"],
  fearless: ["fearless"],
  battlehungry: ["insatiable bloodlust", "bloodlust", "thrill of meeting powerful warriors", "battle-hungry"],
  graceful: ["graceful"],
  spearmaiden: ["art of the spear", "spears and staves", "spear"],
  sheltered: ["pious facade", "sheltered"],
  loyal: ["former partner", "absolute loyalty", "loyalty", "loyal"],
  softspoken: ["softspoken", "soft-spoken"],
  faithless: ["zero faith", "non believer", "faithless"],
  beloved: ["cherished companions", "beloved"],
  resolute: ["resolute"],
  martyr: ["sacrifice", "sacrificing", "lifespan", "martyr"],
  overprotective: ["overprotectiveness", "overprotective"],
  intolerant: ["hatred for all non human", "non human races", "intolerant"],
  arrogant: ["arrogance", "arrogant"],
  hollow: ["living weapon", "unfeeling", "detached", "hollow"],
  agile: ["natural agility", "agility", "agile"],
  cursed: ["cursed child", "terrible curse", "cursed"],
  beastmaster: ["Beast Master of the Gale", "converse directly with the creatures", "beast tamer", "beastmaster"],
  reckless: ["reckless abandon", "raw desperation", "reckless"],
};

function collectMarks(template: CardTemplate): Mark[] {
  const marks: Mark[] = [];
  for (const [id, aliases] of Object.entries(ELEMENT_ALIASES) as Array<[ElementId, string[]]>) {
    for (const term of aliases) {
      marks.push({ term, className: `lore-mark lore-el el-${id}` });
    }
  }
  marks.push(
    { term: "melee", className: "lore-mark lore-combat" },
    { term: "ranged", className: "lore-mark lore-combat" },
    { term: "Magic", className: "lore-mark lore-combat" },
    { term: "Mage", className: "lore-mark lore-role" },
    { term: "Ranger", className: "lore-mark lore-role" },
    { term: "Scout", className: "lore-mark lore-role" },
    { term: "healer", className: "lore-mark lore-role" },
    { term: "Cleric", className: "lore-mark lore-role" },
    { term: "Berserker", className: "lore-mark lore-role" },
    { term: "Warrior", className: "lore-mark lore-role" },
    { term: "Paladin", className: "lore-mark lore-role" },
    { term: "Arch Mage", className: "lore-mark lore-role" },
    { term: "Beast Tamer", className: "lore-mark lore-role" },
    { term: "Tank", className: "lore-mark lore-role" },
    { term: "Dark Paladin", className: "lore-mark lore-role" },
    { term: "Sword Saint", className: "lore-mark lore-role" },
    { term: "Soul Harvester", className: "lore-mark lore-role" },
  );
  for (const id of template.traits) {
    const def = TRAITS[id];
    if (!def) continue;
    marks.push({ term: def.name, className: `lore-mark lore-trait ${def.good ? "good" : "bad"}` });
    for (const alias of TRAIT_ALIASES[id] ?? []) {
      marks.push({ term: alias, className: `lore-mark lore-trait ${def.good ? "good" : "bad"}` });
    }
  }
  marks.sort((a, b) => b.term.length - a.term.length);
  return marks;
}

const WORD_CHAR = /[a-zA-Z0-9']/;

function isWordBounded(text: string, start: number, end: number): boolean {
  const before = start > 0 ? text[start - 1] : "";
  const after = end < text.length ? text[end] : "";
  return !WORD_CHAR.test(before) && !WORD_CHAR.test(after);
}

function highlight(text: string, marks: Mark[]): ReactNode[] {
  const hits: { start: number; end: number; className: string }[] = [];
  const used = new Array(text.length).fill(false);
  for (const mark of marks) {
    const needle = mark.term;
    if (!needle) continue;
    const lower = text.toLowerCase();
    const find = needle.toLowerCase();
    let from = 0;
    while (from < text.length) {
      const at = lower.indexOf(find, from);
      if (at < 0) break;
      const end = at + needle.length;
      const blocked = used.slice(at, end).some(Boolean);
      if (!blocked && isWordBounded(text, at, end)) {
        hits.push({ start: at, end, className: mark.className });
        used.fill(true, at, end);
      }
      from = at + 1;
    }
  }
  hits.sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  hits.forEach((hit, i) => {
    if (hit.start > cursor) nodes.push(text.slice(cursor, hit.start));
    nodes.push(
      <mark key={`${hit.start}-${i}`} className={hit.className}>
        {text.slice(hit.start, hit.end)}
      </mark>,
    );
    cursor = hit.end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function LoreText({ template, text }: { template: CardTemplate; text: string }) {
  const marks = useMemo(() => collectMarks(template), [template]);
  const nodes = useMemo(() => highlight(text, marks), [text, marks]);
  return <p className="lore-text">{nodes}</p>;
}

export function affinityTitle(element: ElementId): string {
  return `${ELEMENT_LABEL[element]} Affinity`;
}
