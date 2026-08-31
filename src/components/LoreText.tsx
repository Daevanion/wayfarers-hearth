import { useMemo, type ReactNode } from "react";
import { ELEMENT_LABEL } from "../data/icons";
import { TRAITS } from "../data/traits";
import type { CardTemplate, ElementId } from "../types";

interface Mark {
  term: string;
  className: string;
}

const ELEMENT_ALIASES: Record<ElementId, string[]> = {
  fire: ["Master of Fire", "Fire Mage", "Fire Berserker", "fire magic", "fiery", "Fire"],
  water: ["Water Ranger", "water"],
  earth: ["Earth healer", "Earth Warrior", "earthen", "Earth"],
  air: ["Air Ranger", "Air Warrior", "air"],
  light: ["Light Cleric", "Light Paladin", "Light"],
  dark: ["Dark Berserker", "dark aura", "dark glade", "darkness", "dark forests", "dark origins", "Dark"],
  null: ["lacking elemental", "without relying on elemental", "elemental magic"],
  wild: ["wild magic", "Wild"],
};

const TRAIT_ALIASES: Record<string, string[]> = {
  kindhearted: ["cheerful", "warmth", "kindhearted"],
  steadfast: ["unbreakable vow", "steadfast"],
  oblivious: ["oblivious", "denseness"],
  perceptive: ["perceptive"],
  artisan: ["sewing and pottery", "sewing", "pottery"],
  secretive: ["closely guarded secrets", "secrets"],
  brave: ["bravery", "brave"],
  resourceful: ["resourcefulness", "resourceful", "quick thinking"],
  forgetful: ["terrible memory", "forgetful"],
  wise: ["wisdom", "wise"],
  nurturing: ["adopted daughter", "took in", "nurturing"],
  reclusive: ["solitary", "isolation", "reclusive"],
  focused: ["focused", "singular focus"],
  honorbound: ["debt of life", "honorbound"],
  vindictive: ["vindictive"],
  charismatic: ["charisma", "charismatic"],
  stalwart: ["stood his ground", "stalwart"],
  greedy: ["untold riches", "greedy"],
  prodigy: ["prodigious", "prodigy"],
  hotheaded: ["thorny exterior", "hot-headed", "hotheaded"],
  devout: ["holy order", "Bishop", "devout"],
  protective: ["protector", "protective"],
  guiltridden: ["well of guilt", "guilt"],
  mighty: ["massive blade", "raw strength", "mighty"],
  cowardly: ["unapologetic coward", "coward", "skittish"],
  eccentric: ["eccentric", "bizarre"],
  lethal: ["highly lethal", "lethal"],
  mercenary: ["merit and financial gain", "mercenary"],
  distrustful: ["untrusting", "distrusts", "distrustful"],
  legendary: ["living legend", "legendary"],
  scholarly: ["intellectual", "scholarly"],
  scheming: ["ulterior motives", "shrouded in secrecy", "scheming"],
  fearless: ["fearless"],
  battlehungry: ["thrill of meeting powerful warriors", "battle-hungry"],
  graceful: ["graceful"],
  spearmaiden: ["art of the spear", "spears and staves", "spear"],
  sheltered: ["pious facade", "sheltered"],
  loyal: ["absolute loyalty", "loyalty", "loyal"],
  softspoken: ["softspoken", "soft-spoken"],
  faithless: ["zero faith", "non believer", "faithless"],
  beloved: ["cherished companions", "beloved"],
  resolute: ["resolute"],
  martyr: ["sacrificing", "lifespan", "martyr"],
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
      if (!blocked) {
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
