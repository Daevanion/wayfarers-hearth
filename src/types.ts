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
  | "paladin"
  | "beasttamer"
  | "darkpaladin"
  | "swordsaint"
  | "soulharvester";

export type ObtainId = "tavern" | "quest";

export type CombatId = "melee" | "ranged" | "magic";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type ScreenId = "title" | "plaza" | "hearthroads";

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
  /** Default tavern. Quest cards never roll from packs. */
  obtain?: ObtainId;
}

export interface SetDef {
  id: string;
  name: string;
  members: string[];
  description: string;
  obtain?: ObtainId;
}

export type RestKind = "rest" | "recover";

export interface OwnedCard {
  id: string;
  level: number;
  xp: number;
  exhaustedUntil: number;
  /** Win rest vs fail recovery. Ignored once exhaustedUntil has passed. */
  restKind?: RestKind;
  duplicates: number;
  duplicateXp: number;
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

export type QuestTier = "low" | "mid" | "high" | "extreme" | "world" | "special";

export interface SecretQuestRef {
  chapterId: string;
  requiredCardIds: string[];
  minShownLevel: number;
}

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
  secret?: SecretQuestRef;
  /** Explicit token purse. Ordinary bounty crits no longer grant tokens. */
  rewardTokens?: number;
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

export interface QuestXpGain {
  id: string;
  gained: number;
  fromLevel: number;
  fromXp: number;
  toLevel: number;
  toXp: number;
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
  xpGains: QuestXpGain[];
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

export type DelveLength = "patrol" | "standard" | "deep";
export type DelveNodeKind = "fight" | "elite" | "event" | "rest" | "boss";
export type DelvePhase = "select" | "map" | "combat" | "event" | "blessing" | "result";
export type DelveEnd = "won" | "lost" | "abandoned";
export type EnemyIntent = "strike" | "guard" | "sap";
export type DelveActionId = "strike" | "guard" | "mend" | "bolt" | "pierce" | "cleave" | "drain";

export interface DelveContractDef {
  id: string;
  name: string;
  length: DelveLength;
  seats: 2 | 3 | 4;
  layers: number[];
  flavor: string;
  art: string;
  shardBonus: number;
}

export interface DelveEncounterDef {
  id: string;
  name: string;
  elite?: boolean;
  boss?: boolean;
  element: ElementId | null;
  hp: number;
  damage: number;
  art: string;
  flavor: string;
}

export interface DelveEventChoice {
  id: string;
  label: string;
  needTrait?: string;
  text: string;
}

export interface DelveEventDef {
  id: string;
  title: string;
  body: string;
  art: string;
  choices: DelveEventChoice[];
}

export interface DelveBlessingDef {
  id: string;
  name: string;
  blurb: string;
}

export interface DelveOffer {
  key: string;
  contractId: string;
  seed: string;
  threatElement: ElementId | null;
}

export interface DelveNode {
  id: string;
  layer: number;
  slot: number;
  kind: DelveNodeKind;
  edges: string[];
  encounterId?: string;
  eventId?: string;
  art: string;
}

export interface DelveFighter {
  id: string;
  hp: number;
  maxHp: number;
  block: number;
  acted: boolean;
}

export interface DelveEnemy {
  instanceId: string;
  encounterId: string;
  hp: number;
  maxHp: number;
  block: number;
  intent: EnemyIntent;
  weakened: number;
}

export interface DelveCombat {
  party: DelveFighter[];
  enemies: DelveEnemy[];
  round: number;
  log: string[];
}

export interface DelveRun {
  runId: string;
  offerKey: string;
  contractId: string;
  seed: string;
  team: string[];
  threatElement: ElementId | null;
  nodes: DelveNode[];
  currentNodeId: string | null;
  reachable: string[];
  visited: string[];
  phase: DelvePhase;
  combat: DelveCombat | null;
  eventId: string | null;
  blessingChoices: string[];
  blessingIds: string[];
  party: DelveFighter[];
  shardsEarned: number;
  startedAt: number;
  end?: DelveEnd;
}

export interface GameState {
  version: number;
  gold: number;
  tokens: number;
  tokenShards: number;
  cards: OwnedCard[];
  boardDate: string;
  board: BoardQuest[];
  specialBoard: BoardQuest[];
  unlockedChapters: string[];
  secretNoticesDismissed: string[];
  journal: JournalEntry[];
  createdAt: number;
  delveOffers: DelveOffer[];
  activeDelve: DelveRun | null;
}

export interface UiState {
  screen: ScreenId;
  inspecting: string | null;
  guildOpen: boolean;
  catalogueOpen: boolean;
  tavernOpen: boolean;
  lorebookOpen: boolean;
  questBoardOpen: boolean;
  questBoardView: "bounties" | "special";
  intro: IntroPhase;
  vnScene: string | null;
  outcome: QuestOutcome | null;
  toasts: Toast[];
}
