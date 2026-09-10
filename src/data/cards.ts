import type { CardTemplate, RoleId } from "../types";
import { ROLE_ORDER } from "./icons";
import { PORTRAITS } from "./portraits";

export const STARTER_IDS = ["hera-starfall", "caelan-featherfoot", "cedric-oakmont"] as const;

export const CARDS: CardTemplate[] = [
  // — Hearthbound —
  {
    id: "hera-starfall",
    name: "Hera Starfall",
    title: "The Earthen Heart",
    element: "earth",
    role: "healer",
    combat: ["melee"],
    power: 25,
    rarity: "common",
    traits: ["kindhearted", "steadfast", "oblivious"],
    setId: "hearthbound",
    flavor:
      "An orphan of a goblin raid who turned tragedy into a crusade. She mends wounds with the grounding power of the earth — and is never afraid to swing heavy steel. Her sparrow Rubus goes where she goes.",
    accent: "#7a9a3f",
    portrait: PORTRAITS["hera-starfall"],
  },
  {
    id: "caelan-featherfoot",
    name: "Caelan Featherfoot",
    title: "The Quiet Edge",
    element: "null",
    role: "scout",
    combat: ["melee"],
    power: 25,
    rarity: "common",
    traits: ["perceptive", "artisan", "secretive"],
    setId: "hearthbound",
    flavor:
      "No elemental magic — only raw skill and quiet precision. He steps from the shadows to clear the path, then goes home to his sewing and pottery. The silent keeper of his friends' hearts.",
    accent: "#5a6a7a",
    portrait: PORTRAITS["caelan-featherfoot"],
  },
  {
    id: "cedric-oakmont",
    name: "Cedric Oakmont",
    title: "The Wayward Gale",
    element: "air",
    role: "ranger",
    combat: ["ranged"],
    power: 25,
    rarity: "common",
    traits: ["brave", "resourceful", "forgetful"],
    setId: "hearthbound",
    flavor:
      "Sixteen, and the wind already guides his arrows. In battle his focus is total; outside it he forgets everything, including how obviously he is in love with Hera.",
    accent: "#6fa0c7",
    portrait: PORTRAITS["cedric-oakmont"],
  },

  // — Woodland Debt —
  {
    id: "lysandra-silverleaf",
    name: "Lysandra Silverleaf",
    title: "The White Witch",
    element: "air",
    role: "mage",
    combat: ["magic"],
    power: 50,
    rarity: "rare",
    traits: ["wise", "nurturing", "reclusive"],
    setId: "woodland-debt",
    flavor:
      "Eighty-four — a youth among elves, a well of wisdom to men. She defends the ancient woods alone, leaving blossoms where she walks, and watches over the runaway girl she raised from afar.",
    accent: "#9fd0b7",
    portrait: PORTRAITS["lysandra-silverleaf"],
  },
  {
    id: "kaelen-duskwalker",
    name: "Kaelen Duskwalker",
    title: "The Royal Stride",
    element: "water",
    role: "ranger",
    combat: ["ranged"],
    power: 40,
    rarity: "uncommon",
    traits: ["focused", "honorbound", "vindictive"],
    setId: "woodland-debt",
    flavor:
      "Cast out of her estate at six, raised by the White Witch in the deep woods. Her graceful elven archery serves one burning goal: the truth about her missing father. She repays every debt in full.",
    accent: "#4f7fae",
    portrait: PORTRAITS["kaelen-duskwalker"],
  },
  {
    id: "gall-ironbend",
    name: "Gall Ironbend",
    title: "Shieldwall Gall",
    element: "earth",
    role: "tank",
    combat: ["melee"],
    power: 40,
    rarity: "uncommon",
    traits: ["charismatic", "stalwart", "greedy"],
    setId: "woodland-debt",
    flavor:
      "A hearty dwarf who left the deep vaults for the open road. His booming laugh lights up taverns; his shield anchors any line. He once held off a wandering demon so a young ranger could land the kill.",
    accent: "#b0803c",
    portrait: PORTRAITS["gall-ironbend"],
  },

  // — Penitent Order —
  {
    id: "leona-stormrage",
    name: "Leona Stormrage",
    title: "The Crimson Spark",
    element: "fire",
    role: "mage",
    combat: ["magic"],
    power: 35,
    rarity: "uncommon",
    traits: ["prodigy", "hotheaded"],
    setId: "penitent-order",
    flavor:
      "Master of Fire at fourteen, top of the church school, terror of its orphans. She burns to prove herself worthy of the Stormrage name — and turns into a stuttering mess under her mentor's gaze.",
    accent: "#d1543a",
    portrait: PORTRAITS["leona-stormrage"],
  },
  {
    id: "sylas-duskwalker",
    name: "Sylas Duskwalker",
    title: "The Penitent Shield",
    element: "light",
    role: "cleric",
    combat: ["melee"],
    power: 50,
    rarity: "rare",
    traits: ["devout", "protective", "guiltridden"],
    setId: "penitent-order",
    flavor:
      "A noble who forsook his house to shield the church's orphans. He swore to save every abandoned child he meets, atoning for the sister he believes he left to die in the dark forests.",
    accent: "#e0c26a",
    portrait: PORTRAITS["sylas-duskwalker"],
  },
  {
    id: "freya",
    name: "Freya",
    title: "The Reluctant Blade",
    element: "dark",
    role: "berserker",
    combat: ["melee"],
    power: 45,
    rarity: "rare",
    traits: ["mighty", "cowardly", "eccentric"],
    setId: "penitent-order",
    flavor:
      "Origin unknown, age unknown, blade enormous — a troll's weapon swung with a strange dark aura. The fiercest berserker in the templar order is also its most unapologetic coward.",
    accent: "#7a5f9e",
    portrait: PORTRAITS.freya,
  },

  // — Glade Expedition —
  {
    id: "morrigan-crow",
    name: "Morrigan Crow",
    title: "The Blood Crow",
    element: "null",
    role: "scout",
    combat: ["melee", "ranged"],
    power: 75,
    rarity: "epic",
    traits: ["lethal", "mercenary", "distrustful"],
    setId: "glade-expedition",
    flavor:
      "The most feared assassin in the citadel, drafted into heroism by royal decree. No element, no faith, no misses. He insists he is no hero — and is secretly growing fond of his legendary companions.",
    accent: "#3a3f4a",
    portrait: PORTRAITS["morrigan-crow"],
  },
  {
    id: "odin-stormrage",
    name: "Odin Stormrage",
    title: "The Azure Sage",
    element: "wild",
    role: "archmage",
    combat: ["ranged"],
    power: 100,
    rarity: "legendary",
    traits: ["legendary", "scholarly", "scheming"],
    setId: "glade-expedition",
    flavor:
      "One hundred and sixty-six years old, founding father of human magic, recognizable only by the azure robes. He joined the glade expedition with surprising eagerness — and reasons he shares with no one.",
    accent: "#3d8fe0",
    portrait: PORTRAITS["odin-stormrage"],
  },
  {
    id: "reinhart-den",
    name: "Reinhart Den",
    title: "The Beast God",
    element: "fire",
    role: "berserker",
    combat: ["melee"],
    power: 90,
    rarity: "legendary",
    traits: ["fearless", "charismatic", "battlehungry"],
    setId: "glade-expedition",
    flavor:
      "Third ruler of the beastfolk, who united the tribes with charisma instead of fear and annihilated demon armies at twenty. He left his throne mostly to find Azoth Sharpedge and demand a rematch.",
    accent: "#c7402a",
    portrait: PORTRAITS["reinhart-den"],
  },

  // — Sun Scripture —
  {
    id: "elanor-lightbearer",
    name: "Elanor Lightbearer",
    title: "The Hidden Lance",
    element: "light",
    role: "cleric",
    combat: ["magic"],
    power: 30,
    rarity: "uncommon",
    traits: ["graceful", "spearmaiden", "sheltered"],
    setId: "sun-scripture",
    flavor:
      "Outwardly the picture of a delicate healer; secretly drilled in the spear every day by the guard commander. Her hidden reach would rival a seasoned royal guard.",
    accent: "#f0d9a0",
    portrait: PORTRAITS["elanor-lightbearer"],
  },
  {
    id: "fenric-valerand",
    name: "Fenric Valerand",
    title: "The Faithless Shield",
    element: "air",
    role: "warrior",
    combat: ["melee"],
    power: 45,
    rarity: "rare",
    traits: ["loyal", "softspoken", "faithless"],
    setId: "sun-scripture",
    flavor:
      "A mercenary pulled back from death by Seraphina's forbidden incantation. He guards the church's inner circle while believing in none of it — his faith belongs to the woman who saved him.",
    accent: "#8aa8b8",
    portrait: PORTRAITS["fenric-valerand"],
  },
  {
    id: "seraphina-aurora",
    name: "Seraphina Aurora",
    title: "The Sun's Martyr",
    element: "light",
    role: "paladin",
    combat: ["melee"],
    power: 30,
    rarity: "rare",
    traits: ["beloved", "resolute", "martyr"],
    setId: "sun-scripture",
    flavor:
      "Youngest ever to lead the Sun Scripture. Her miracle burns lifespan for power; she has already spent half of what remained to look into the demon king's mind. This journey is likely her last.",
    accent: "#f3b23c",
    portrait: PORTRAITS["seraphina-aurora"],
  },

  // — Forge Kin —
  {
    id: "alden-hollowgarth",
    name: "Alden Hollowgarth",
    title: "The Anvil's Tide",
    element: "water",
    role: "cleric",
    combat: ["magic"],
    power: 30,
    rarity: "uncommon",
    traits: ["artisan", "protective", "overprotective"],
    setId: "forge-kin",
    flavor:
      "A master smith whose craft was outpaced by magic, returned to questing to feed a newborn. He brings his niece for the experience — and second-guesses it every time the road turns.",
    accent: "#4a8fb8",
    portrait: PORTRAITS["alden-hollowgarth"],
  },
  {
    id: "eamon-stoneseeker",
    name: "Eamon Stoneseeker",
    title: "Lightfoot Thunder",
    element: "air",
    role: "scout",
    combat: ["melee"],
    power: 35,
    rarity: "uncommon",
    traits: ["charismatic", "mercenary", "cowardly"],
    setId: "forge-kin",
    flavor:
      "He takes only the safest village jobs, until an old friend guilts him onto a harder road. He complains the whole way, and his charm is wasted on the niece he came to impress.",
    accent: "#7aa8c4",
    portrait: PORTRAITS["eamon-stoneseeker"],
  },
  {
    id: "yvaine-ashcroft",
    name: "Yvaine Ashcroft",
    title: "The Iron Sight",
    element: "null",
    role: "ranger",
    combat: ["ranged"],
    power: 25,
    rarity: "common",
    traits: ["perceptive", "artisan", "sheltered"],
    setId: "forge-kin",
    flavor:
      "A cool-eyed ranger with a smith's heart. She fights without magic to restore her uncle's name, and endures his tavern friend only because the road demands three.",
    accent: "#6a6a72",
    portrait: PORTRAITS["yvaine-ashcroft"],
  },

  // — Moonlight Scripture —
  {
    id: "aurora-starling",
    name: "Aurora Starling",
    title: "The Umbral Smile",
    element: "dark",
    role: "mage",
    combat: ["magic"],
    power: 70,
    rarity: "epic",
    traits: ["lethal", "graceful", "intolerant"],
    setId: "moonlight-scripture",
    flavor:
      "The royal spearhead's dark mage, whose smile never breaks in slaughter and never survives an elf. Humans only, by her order and her hate.",
    accent: "#6b2d78",
    portrait: PORTRAITS["aurora-starling"],
  },
  {
    id: "corvus-grim",
    name: "Corvus Grim",
    title: "The Azure Prince",
    element: "light",
    role: "paladin",
    combat: ["melee"],
    power: 65,
    rarity: "epic",
    traits: ["devout", "focused", "arrogant"],
    setId: "moonlight-scripture",
    flavor:
      "Second of the Moonlight Scripture, a scythe so precise they name him for Samara. Charged to take Aurora and the church's buried trump into the glade — and already unsure of the girl.",
    accent: "#c9b06a",
    portrait: PORTRAITS["corvus-grim"],
  },
  {
    id: "serilla",
    name: "Serilla",
    title: "The Living Artifact",
    element: "null",
    role: "berserker",
    combat: ["melee"],
    power: 75,
    rarity: "epic",
    traits: ["mighty", "fearless", "sheltered", "hollow"],
    setId: "moonlight-scripture",
    flavor:
      "Thirteen, raised in the citadel crypts, remade into a berserker who needs no element. She feels nothing the others can name — the church's miracle, and its confession.",
    accent: "#9aa0a8",
    portrait: PORTRAITS.serilla,
  },

  // — Wolfcrag Exile —
  {
    id: "elowen-wolfcrag",
    name: "Elowen Wolfcrag",
    title: "The Cursed Child",
    element: "dark",
    role: "scout",
    combat: ["melee"],
    power: 25,
    rarity: "common",
    traits: ["kindhearted", "agile", "cursed"],
    setId: "wolfcrag-exile",
    flavor:
      "A lycanthrope girl saved from her own tribe's sentence. She smiles through exile, trusts the people beside her, and has not yet learned to master the wolf.",
    accent: "#6b4a62",
    portrait: PORTRAITS["elowen-wolfcrag"],
  },
  {
    id: "evander-wolfcrag",
    name: "Evander Wolfcrag",
    title: "The Exiled Shield",
    element: "null",
    role: "tank",
    combat: ["melee"],
    power: 50,
    rarity: "rare",
    traits: ["wise", "protective", "overprotective"],
    setId: "wolfcrag-exile",
    flavor:
      "Once the chief's bodyguard, now an outcast who threw rank away to keep his daughter alive. He bargained sanctuary from the eastern woods and stands between her and everything else.",
    accent: "#6a6a58",
    portrait: PORTRAITS["evander-wolfcrag"],
  },
  {
    id: "eva-hearthgale",
    name: "Eva Hearthgale",
    title: "The Gale Whisperer",
    element: "air",
    role: "beasttamer",
    combat: ["magic"],
    power: 45,
    rarity: "rare",
    traits: ["beastmaster", "charismatic", "scheming"],
    setId: "wolfcrag-exile",
    flavor:
      "An air beast tamer who talks to the woods and walks with a black direwolf. She allied with the exiles to move human secrets east — and because Elowen's curse fascinates her.",
    accent: "#5a9a8a",
    portrait: PORTRAITS["eva-hearthgale"],
  },

  // — Calamity Seal (quest-only) —
  {
    id: "bran-bloodseeker",
    name: "Bran Bloodseeker",
    title: "The Dark Knight",
    element: "null",
    role: "darkpaladin",
    combat: ["melee"],
    power: 90,
    rarity: "legendary",
    traits: ["honorbound", "vindictive", "reckless"],
    setId: "calamity-seal",
    obtain: "quest",
    flavor:
      "A half-elf, half-dwarf paladin who lost the Light when Samara slew the woman he loved. He hunts her bloodline with nothing left but a sworn oath.",
    accent: "#4a4550",
    portrait: PORTRAITS["bran-bloodseeker"],
  },
  {
    id: "marpha",
    name: "Marpha",
    title: "Goddess of the Wild",
    element: "wild",
    role: "swordsaint",
    combat: ["melee"],
    power: 100,
    rarity: "legendary",
    traits: ["legendary", "graceful", "martyr"],
    setId: "calamity-seal",
    obtain: "quest",
    flavor:
      "The ancient elven queen who struck down the first demon king and sealed the miasma with her own body. Three centuries dormant. Newly awake.",
    accent: "#7a9a4a",
    portrait: PORTRAITS.marpha,
  },
  {
    id: "samara-blackheart",
    name: "Samara Blackheart",
    title: "The Calamity Demon",
    element: "dark",
    role: "soulharvester",
    combat: ["melee", "magic"],
    power: 95,
    rarity: "legendary",
    traits: ["lethal", "mighty", "scheming"],
    setId: "calamity-seal",
    obtain: "quest",
    flavor:
      "The Blackheart executor who shattered Sunwatch Bay and slew Melisande Sunward. She survived Reinhart and Odin, then went silent — until now.",
    accent: "#5a1a2a",
    portrait: PORTRAITS["samara-blackheart"],
  },

  // — Blackheart Kin (quest-only) —
  {
    id: "rin-blackheart",
    name: "Rin Blackheart",
    title: "The Obsidian Ember",
    element: "fire",
    role: "warrior",
    combat: ["melee"],
    power: 65,
    rarity: "epic",
    traits: ["kindhearted", "loyal", "distrustful"],
    setId: "blackheart-kin",
    obtain: "quest",
    flavor:
      "A half-demon who chose humanity and paid for it in the citadel dungeons. Morrigan cut her free. They are walking the glade toward the Frozen Berg.",
    accent: "#c45a28",
    portrait: PORTRAITS["rin-blackheart"],
  },
  {
    id: "alastor-blackheart",
    name: "Alastor Blackheart",
    title: "Master of Darkness",
    element: "earth",
    role: "warrior",
    combat: ["melee", "magic"],
    power: 85,
    rarity: "epic",
    traits: ["legendary", "wise", "reclusive"],
    setId: "blackheart-kin",
    obtain: "quest",
    flavor:
      "The first half-demon, blamed for the elven king's fall. He fought beside Marpha, then vanished into the Frozen Berg for five centuries. He has stepped out again.",
    accent: "#6a4a28",
    portrait: PORTRAITS["alastor-blackheart"],
  },
  {
    id: "freya-blackheart",
    name: "Freya Blackheart",
    title: "The Great Cold",
    element: "dark",
    role: "berserker",
    combat: ["melee"],
    power: 65,
    rarity: "epic",
    traits: ["mighty", "battlehungry", "scheming"],
    setId: "blackheart-kin",
    obtain: "quest",
    flavor:
      "The church's timid aide was a mask. Beneath it is a Frozen Berg shapeshifter who came for Serilla and a captive kin — loud, mad, and hungry for the fight.",
    accent: "#3a5a7a",
    portrait: PORTRAITS["freya-blackheart"],
  },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<string, CardTemplate>;

export function isTavernCard(card: CardTemplate): boolean {
  return card.obtain !== "quest";
}

export const TAVERN_CARDS = CARDS.filter(isTavernCard);

/** Roles shown in Collection / dispatch. Quest-only classes stay catalogue-only until owned. */
export function visibleRoles(ownedIds: Iterable<string>): RoleId[] {
  const owned = new Set(ownedIds);
  return ROLE_ORDER.filter((role) =>
    CARDS.some((card) => card.role === role && (isTavernCard(card) || owned.has(card.id))),
  );
}

/** Roles shown in the Full catalogue, including unowned quest-only classes. */
export function catalogueRoles(): RoleId[] {
  return ROLE_ORDER.filter((role) => CARDS.some((card) => card.role === role));
}
