import { BACKGROUNDS } from "./backgrounds";
import type { DelveEventDef } from "../types";

export const DELVE_EVENTS: DelveEventDef[] = [
  {
    id: "wayside-shrine",
    title: "Wayside Shrine",
    body: "A cracked saint watches the verge. Coins and wilted flowers share the niche. The road is quiet enough to kneel — or to pocket what was left.",
    art: BACKGROUNDS.brokenChapel,
    choices: [
      { id: "pray", label: "Kneel and pray", needTrait: "devout", text: "Faith answers. The company breathes easier." },
      { id: "take", label: "Take the offerings", needTrait: "greedy", text: "Shard-glass among the coppers. The saint does not blink." },
      { id: "pass", label: "Leave it be", text: "A nod to the stone, and the road again." },
    ],
  },
  {
    id: "merchant-cart",
    title: "Stalled Cart",
    body: "A wagon lists in the ruts, canvas snapping. The driver wants hands, or coin, or both. Someone in the company already has an opinion.",
    art: BACKGROUNDS.caravan,
    choices: [
      { id: "trade", label: "Strike a bargain", needTrait: "mercenary", text: "Coin for a handful of road-glass. Clean work." },
      { id: "mend", label: "Mend the axle", needTrait: "artisan", text: "Clever hands earn a blessing from a grateful stranger." },
      { id: "wave", label: "Wish them luck", text: "The cart stays stuck. You do not." },
    ],
  },
  {
    id: "lost-child",
    title: "A Child on the Verge",
    body: "She will not say which hamlet, only that the trees moved. The light is going. Kindness costs time. Fear costs something else.",
    art: BACKGROUNDS.whisperingWoods,
    choices: [
      { id: "help", label: "See her home", needTrait: "kindhearted", text: "She presses a charm into a palm. The woods feel thinner." },
      { id: "hurry", label: "Keep the pace", needTrait: "cowardly", text: "You do not look back. The shards in the ditch were never hers." },
      { id: "point", label: "Point the way", text: "A direction, a waterskin, and you are gone." },
    ],
  },
  {
    id: "road-fog",
    title: "Fog on the Road",
    body: "White to the knees, then to the chest. Voices in it that might be yours. Someone should be watching the ditches.",
    art: BACKGROUNDS.oldKingsRoad,
    choices: [
      { id: "read", label: "Read the ground", needTrait: "perceptive", text: "A dry spine of path. The fog does not get a taste." },
      { id: "stumble", label: "Press on anyway", needTrait: "oblivious", text: "A root, a fall, a bruise the fog pretends not to cause." },
      { id: "slow", label: "Slow the line", text: "You come through thinner, and a little marked." },
    ],
  },
  {
    id: "hollow-chapel",
    title: "Hollow Chapel",
    body: "The roof is a suggestion. Saints have been pried from their niches. Holy ground, if you still believe the word.",
    art: BACKGROUNDS.brokenChapel,
    choices: [
      { id: "search", label: "Search the altar", needTrait: "faithless", text: "Nothing sacred left — only shard-glass in the dust." },
      { id: "rite", label: "Speak a rite", needTrait: "devout", text: "The air warms. Wounds close as if they were never argued." },
      { id: "rest", label: "Sit in the nave", text: "Quiet is a kind of medicine." },
    ],
  },
  {
    id: "beast-brush",
    title: "Something in the Brush",
    body: "A low sound, too heavy for fox. The trail could go around. It could also go through.",
    art: BACKGROUNDS.whisperingWoods,
    choices: [
      { id: "face", label: "Face it down", needTrait: "brave", text: "It yields. What it dropped still hums." },
      { id: "hunt", label: "Run it down", needTrait: "battlehungry", text: "Blood and shards. The company pays in bruises." },
      { id: "around", label: "Give it the trail", text: "A longer walk. Nothing worth the telling." },
    ],
  },
  {
    id: "night-camp",
    title: "A Dry Camp",
    body: "Enough thorn to break the wind. Someone should mind the fire. Someone usually forgets.",
    art: BACKGROUNDS.merchantRoad,
    choices: [
      { id: "ration", label: "Stretch the rations", needTrait: "resourceful", text: "A proper meal from almost nothing. Colour returns." },
      { id: "sleep", label: "Sleep in shifts", needTrait: "forgetful", text: "The watch was not watched. Dawn finds you worse." },
      { id: "embers", label: "Keep a small fire", text: "Warm enough. Not a feast." },
    ],
  },
  {
    id: "toll-bridge",
    title: "The Toll",
    body: "A chain across wet boards. Faces under hoods. They will take a story, a threat, or a piece of you.",
    art: BACKGROUNDS.bridgeGang,
    choices: [
      { id: "talk", label: "Talk them aside", needTrait: "charismatic", text: "A laugh, a lie, a handful of their own glass." },
      { id: "glare", label: "Refuse the chain", needTrait: "distrustful", text: "They cut a little. You keep your names." },
      { id: "pay", label: "Pay the ugly price", text: "A bruise and a crossing. The chain drops." },
    ],
  },
];

export const EVENT_BY_ID = Object.fromEntries(DELVE_EVENTS.map((e) => [e.id, e])) as Record<string, DelveEventDef>;
