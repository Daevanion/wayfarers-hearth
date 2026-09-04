export type ElementId =
  | "fire"
  | "water"
  | "earth"
  | "air"
  | "light"
  | "dark"
  | "null"
  | "wild";

export type RoleId =
  | "healer"
  | "scout"
  | "ranger"
  | "mage"
  | "tank"
  | "cleric"
  | "berserker"
  | "archmage"
  | "warrior"
  | "paladin";

export type CombatId = "melee" | "ranged" | "magic";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type ScreenId = "title" | "plaza";

export type IntroPhase = "sealed" | "fan" | null;

export interface TraitDef {
  id: string;
  name: string;
  good: boolean;
  blurb: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  title: string;
  element: ElementId;
  role: RoleId;
  combat: CombatId[];
  power: number;
  rarity: Rarity;
  traits: string[];
  setId: string;
  flavor: string;
  accent: string;
  portrait?: string;
}

export interface SetDef {
  id: string;
  name: string;
  members: string[];
  description: string;
}

export interface OwnedCard {
  id: string;
  level: number;
  xp: number;
  exhaustedUntil: number;
}

export interface QuestModRef {
  type: "trait" | "role";
  id: string;
  pct: number;
}

export interface CritRef {
  type: "element" | "role" | "set";
  id: string;
  note: string;
}

export type QuestTier = "low" | "mid" | "high" | "extreme" | "world";

export interface QuestTemplate {
  id: string;
  name: string;
  flavor: string;
  lore: string;
  durationMs: number;
  tier: QuestTier;
  element: ElementId | null;
  power: number;
  teamMin: number;
  teamMax: number;
  art: string;
  advantages: QuestModRef[];
  hazards: QuestModRef[];
  crit?: CritRef;
  gold: number;
  xp: number;
}

export type QuestStatus = "open" | "underway" | "done";

export interface BoardQuest {
  key: string;
  templateId: string;
  status: QuestStatus;
  team: string[];
  startedAt: number;
  endsAt: number;
  success: number;
  crit: number;
  critMatched: boolean;
}

export interface QuestOutcome {
  key: string;
  templateId: string;
  roll: number;
  success: number;
  crit: number;
  result: "crit" | "success" | "fail";
  gold: number;
  tokens: number;
  xpEach: number;
  team: string[];
  leveled: string[];
  critMatched: boolean;
}

export interface PackResult {
  cardId: string;
  isNew: boolean;
  xp: number;
}

export interface JournalEntry {
  id: string;
  at: number;
  kind: "success" | "fail" | "recruit" | "system";
  text: string;
}

export interface Toast {
  id: string;
  text: string;
  kind: JournalEntry["kind"];
}

export interface GameState {
  version: number;
  gold: number;
  tokens: number;
  cards: OwnedCard[];
  boardDate: string;
  board: BoardQuest[];
  journal: JournalEntry[];
  createdAt: number;
}

export interface UiState {
  screen: ScreenId;
  inspecting: string | null;
  guildOpen: boolean;
  catalogueOpen: boolean;
  tavernOpen: boolean;
  questBoardOpen: boolean;
  intro: IntroPhase;
  vnScene: string | null;
  outcome: QuestOutcome | null;
  toasts: Toast[];
}
