import { CARD_BY_ID, TAVERN_CARDS } from "../data/cards";
import { BLESSING_BY_ID, DELVE_BLESSINGS } from "../data/delveBlessings";
import { CONTRACT_BY_ID, DELVE_CONTRACTS } from "../data/delveContracts";
import {
  BOSS_ENCOUNTERS,
  ELITE_ENCOUNTERS,
  ENCOUNTER_BY_ID,
  REGULAR_ENCOUNTERS,
} from "../data/delveEncounters";
import { EVENT_BY_ID, DELVE_EVENTS } from "../data/delveEvents";
import { SET_BY_ID } from "../data/sets";
import { cardPower, clamp, grantXp, makeOwned, uid } from "./formulas";
import { ELEMENT_POWER_BONUS, hashSeed, isBusy, isExhausted, mulberry32 } from "./quests";
import type {
  DelveActionId,
  DelveCombat,
  DelveEnd,
  DelveEnemy,
  DelveFighter,
  DelveNode,
  DelveNodeKind,
  DelveOffer,
  DelveRun,
  ElementId,
  EnemyIntent,
  GameState,
  JournalEntry,
  RoleId,
} from "../types";

export const ROAD_UNLOCK_OWNED = 5;
export const SHARDS_PER_TOKEN = 8;
export const DELVE_PARTY_MIN = 2;
export const DELVE_PARTY_MAX = 4;

const INTENTS: EnemyIntent[] = ["strike", "guard", "sap"];
const THREATS: ElementId[] = ["fire", "water", "earth", "air", "light", "dark"];

function log(state: GameState, kind: JournalEntry["kind"], text: string): GameState {
  const entry: JournalEntry = { id: uid("log"), at: Date.now(), kind, text };
  return { ...state, journal: [entry, ...state.journal].slice(0, 40) };
}

function pick<T>(pool: T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

function pickSome<T>(pool: T[], count: number, rng: () => number): T[] {
  const rest = [...pool];
  const out: T[] = [];
  while (out.length < count && rest.length > 0) {
    const i = Math.floor(rng() * rest.length);
    out.push(rest.splice(i, 1)[0]);
  }
  return out;
}

export function delveUnlocked(state: GameState): boolean {
  return state.cards.length >= ROAD_UNLOCK_OWNED;
}

export function idleOwnedIds(state: GameState, now: number): string[] {
  return state.cards
    .filter((card) => !isBusy(state, card.id) && !isExhausted(state, card.id, now))
    .map((card) => card.id);
}

export function ensureDelveOffers(state: GameState): GameState {
  const day = state.boardDate;
  const current = state.delveOffers ?? [];
  if (current.length === DELVE_CONTRACTS.length && current.every((offer) => offer.key.startsWith(`${day}-`))) {
    return state.delveOffers ? state : { ...state, delveOffers: current };
  }
  const rng = mulberry32(hashSeed(`roads-${day}`));
  const offers: DelveOffer[] = DELVE_CONTRACTS.map((contract) => ({
    key: `${day}-${contract.id}`,
    contractId: contract.id,
    seed: `${day}-${contract.id}-${Math.floor(rng() * 1e9).toString(36)}`,
    threatElement: rng() < 0.72 ? pick(THREATS, rng) : null,
  }));
  return { ...state, delveOffers: offers };
}

function fighterFromCard(state: GameState, cardId: string): DelveFighter {
  const owned = state.cards.find((card) => card.id === cardId);
  const power = owned ? cardPower(owned) : CARD_BY_ID[cardId]?.power ?? 8;
  const maxHp = Math.max(12, power * 4);
  return { id: cardId, hp: maxHp, maxHp, block: 0, acted: false };
}

function scaledEnemyHp(base: number, seats: number): number {
  return Math.round(base * (0.7 + seats * 0.18));
}

function nodeArt(kind: DelveNodeKind, encounterId?: string, eventId?: string): string {
  if (encounterId && ENCOUNTER_BY_ID[encounterId]) return ENCOUNTER_BY_ID[encounterId].art;
  if (eventId && EVENT_BY_ID[eventId]) return EVENT_BY_ID[eventId].art;
  if (kind === "rest") return EVENT_BY_ID["night-camp"]?.art ?? EVENT_BY_ID[DELVE_EVENTS[0].id].art;
  return DELVE_CONTRACTS[0].art;
}

function generateMap(seed: string, contractId: string): DelveNode[] {
  const contract = CONTRACT_BY_ID[contractId];
  const rng = mulberry32(hashSeed(`map-${seed}`));
  const layers = contract.layers;
  const last = layers.length - 1;
  const nodes: DelveNode[] = [];

  for (let layer = 0; layer < layers.length; layer += 1) {
    const count = layers[layer];
    for (let slot = 0; slot < count; slot += 1) {
      let kind: DelveNodeKind = "fight";
      if (layer === 0) kind = "fight";
      else if (layer === last) kind = "boss";
      else {
        const roll = rng();
        if (roll < 0.18) kind = "rest";
        else if (roll < 0.4) kind = "event";
        else if (roll < 0.58 && layer >= Math.floor(last / 2)) kind = "elite";
        else kind = "fight";
      }
      let encounterId: string | undefined;
      let eventId: string | undefined;
      if (kind === "fight") encounterId = pick(REGULAR_ENCOUNTERS, rng).id;
      else if (kind === "elite") encounterId = pick(ELITE_ENCOUNTERS, rng).id;
      else if (kind === "boss") encounterId = pick(BOSS_ENCOUNTERS, rng).id;
      else if (kind === "event") eventId = pick(DELVE_EVENTS, rng).id;
      const id = `n-${layer}-${slot}`;
      nodes.push({
        id,
        layer,
        slot,
        kind,
        edges: [],
        encounterId,
        eventId,
        art: nodeArt(kind, encounterId, eventId),
      });
    }
  }

  const byLayer = (layer: number) => nodes.filter((node) => node.layer === layer);
  for (let layer = 0; layer < last; layer += 1) {
    const here = byLayer(layer);
    const next = byLayer(layer + 1);
    for (const node of here) {
      const ratio = here.length === 1 ? 0.5 : node.slot / Math.max(1, here.length - 1);
      const aim = ratio * Math.max(0, next.length - 1);
      const primary = next[clamp(Math.round(aim), 0, next.length - 1)];
      node.edges.push(primary.id);
      if (next.length > 1 && rng() < 0.55) {
        const side = next.find((entry) => entry.id !== primary.id && Math.abs(entry.slot - primary.slot) <= 1);
        if (side && !node.edges.includes(side.id)) node.edges.push(side.id);
      }
    }
    for (const dest of next) {
      if (nodes.some((node) => node.edges.includes(dest.id))) continue;
      const nearest = here.reduce((best, node) =>
        Math.abs(node.slot - dest.slot) < Math.abs(best.slot - dest.slot) ? node : best,
      );
      nearest.edges.push(dest.id);
    }
  }

  const hasRest = nodes.some((node) => node.kind === "rest");
  const hasEvent = nodes.some((node) => node.kind === "event");
  const middles = nodes.filter((node) => node.layer > 0 && node.layer < last);
  if (!hasRest && middles.length > 0) {
    const node = middles[Math.floor(middles.length / 2)];
    node.kind = "rest";
    node.encounterId = undefined;
    node.eventId = undefined;
    node.art = nodeArt("rest");
  }
  if (!hasEvent && middles.length > 1) {
    const node = middles[0];
    if (node.kind !== "rest") {
      node.kind = "event";
      node.encounterId = undefined;
      node.eventId = pick(DELVE_EVENTS, rng).id;
      node.art = nodeArt("event", undefined, node.eventId);
    }
  }
  return nodes;
}

function patchRun(state: GameState, run: DelveRun): GameState {
  return { ...state, activeDelve: run };
}

function living(party: DelveFighter[]): DelveFighter[] {
  return party.filter((unit) => unit.hp > 0);
}

function livingEnemies(enemies: DelveEnemy[]): DelveEnemy[] {
  return enemies.filter((unit) => unit.hp > 0);
}

function hasBlessing(run: DelveRun, id: string): boolean {
  return run.blessingIds.includes(id);
}

function roleActions(role: RoleId): DelveActionId[] {
  const base: DelveActionId[] = ["strike", "guard"];
  if (role === "healer" || role === "cleric") return [...base, "mend"];
  if (role === "mage" || role === "archmage") return [...base, "bolt"];
  if (role === "ranger" || role === "scout") return [...base, "pierce"];
  if (role === "berserker") return [...base, "cleave"];
  if (role === "soulharvester") return [...base, "drain"];
  return base;
}

export function actionsFor(cardId: string): { id: DelveActionId; label: string; needs: "enemy" | "ally" | "none" }[] {
  const role = CARD_BY_ID[cardId]?.role ?? "warrior";
  return roleActions(role).map((id) => {
    if (id === "guard") return { id, label: "Guard", needs: "none" };
    if (id === "mend") return { id, label: "Mend", needs: "ally" };
    if (id === "cleave") return { id, label: "Cleave", needs: "none" };
    if (id === "bolt") return { id, label: "Bolt", needs: "enemy" };
    if (id === "pierce") return { id, label: "Pierce", needs: "enemy" };
    if (id === "drain") return { id, label: "Drain", needs: "enemy" };
    return { id, label: "Strike", needs: "enemy" };
  });
}

function strikePower(state: GameState, run: DelveRun, actorId: string): number {
  const owned = state.cards.find((card) => card.id === actorId);
  const template = CARD_BY_ID[actorId];
  const power = owned ? cardPower(owned) : template?.power ?? 8;
  let dmg = Math.max(3, Math.round(power / 3));
  if (run.threatElement && template && (template.element === run.threatElement || template.element === "wild")) {
    dmg = Math.round(dmg * ELEMENT_POWER_BONUS);
  }
  if (hasBlessing(run, "ember-edge")) dmg += 2;
  if (template?.traits.includes("lethal") || template?.traits.includes("mighty")) dmg += 1;
  if (hasBlessing(run, "fellowship") && template) {
    const set = SET_BY_ID[template.setId];
    if (set && set.members.filter((id) => run.team.includes(id)).length >= 2) dmg += 1;
  }
  return dmg;
}

function applyDamageToEnemy(enemy: DelveEnemy, amount: number, ignoreBlock = false): { enemy: DelveEnemy; dealt: number } {
  let incoming = amount;
  let block = enemy.block;
  if (!ignoreBlock && block > 0) {
    const used = Math.min(block, incoming);
    block -= used;
    incoming -= used;
  }
  const hp = Math.max(0, enemy.hp - incoming);
  return { enemy: { ...enemy, hp, block }, dealt: incoming };
}

function applyDamageToFighter(unit: DelveFighter, amount: number): { unit: DelveFighter; dealt: number } {
  let incoming = amount;
  let block = unit.block;
  if (block > 0) {
    const used = Math.min(block, incoming);
    block -= used;
    incoming -= used;
  }
  return { unit: { ...unit, hp: Math.max(0, unit.hp - incoming), block }, dealt: incoming };
}

function healFighter(unit: DelveFighter, amount: number): DelveFighter {
  return { ...unit, hp: Math.min(unit.maxHp, unit.hp + Math.max(0, amount)) };
}

function nextIntent(rng: () => number): EnemyIntent {
  return pick(INTENTS, rng);
}

function makeEnemies(run: DelveRun, encounterId: string, nodeKind: DelveNodeKind): DelveEnemy[] {
  const def = ENCOUNTER_BY_ID[encounterId];
  const contract = CONTRACT_BY_ID[run.contractId];
  const rng = mulberry32(hashSeed(`foe-${run.seed}-${run.visited.length}`));
  const extra = nodeKind === "elite" || nodeKind === "boss" ? (rng() < 0.45 ? 1 : 0) : rng() < 0.28 ? 1 : 0;
  const pack = [def];
  if (extra && !def.boss) pack.push(pick(REGULAR_ENCOUNTERS, rng));
  return pack.map((entry, index) => ({
    instanceId: `${entry.id}-${index}`,
    encounterId: entry.id,
    hp: scaledEnemyHp(entry.hp, contract.seats),
    maxHp: scaledEnemyHp(entry.hp, contract.seats),
    block: 0,
    intent: nextIntent(rng),
    weakened: 0,
  }));
}

function shardsFor(kind: DelveNodeKind, bonus: number): number {
  if (kind === "fight") return 2 + bonus;
  if (kind === "elite") return 4 + bonus;
  if (kind === "boss") return 8 + bonus;
  return 0;
}

function blessingChoicesFor(run: DelveRun): string[] {
  const rng = mulberry32(hashSeed(`bless-${run.seed}-${run.visited.join(",")}`));
  const pool = DELVE_BLESSINGS.filter((entry) => !run.blessingIds.includes(entry.id));
  return pickSome(pool, Math.min(3, pool.length), rng).map((entry) => entry.id);
}

function syncPartyFromCombat(run: DelveRun): DelveFighter[] {
  if (!run.combat) return run.party;
  return run.party.map((unit) => {
    const live = run.combat!.party.find((entry) => entry.id === unit.id);
    return live ? { ...live, acted: false, block: 0 } : unit;
  });
}

function beginCombat(run: DelveRun, node: DelveNode): DelveRun {
  const encounterId = node.encounterId ?? REGULAR_ENCOUNTERS[0].id;
  let party = run.party.map((unit) => ({
    ...unit,
    acted: false,
    block: hasBlessing(run, "iron-ward") ? unit.block + 4 : 0,
  }));
  if (hasBlessing(run, "light-mercy")) {
    party = party.map((unit) => (unit.hp > 0 ? healFighter(unit, 2) : unit));
  }
  const combat: DelveCombat = {
    party,
    enemies: makeEnemies(run, encounterId, node.kind),
    round: 1,
    log: [`${ENCOUNTER_BY_ID[encounterId]?.name ?? "Foes"} bar the way.`],
  };
  return { ...run, phase: "combat", combat, eventId: null, blessingChoices: [] };
}

function openBlessing(run: DelveRun): DelveRun {
  const choices = blessingChoicesFor(run);
  if (choices.length === 0) {
    const node = currentNode(run);
    if (node?.kind === "boss") {
      return { ...run, phase: "result", end: "won", combat: null, eventId: null, blessingChoices: [] };
    }
    return { ...run, phase: "map", combat: null, blessingChoices: [] };
  }
  return { ...run, phase: "blessing", combat: null, blessingChoices: choices };
}

function restHealAmount(run: DelveRun, unit: DelveFighter): number {
  const missing = unit.maxHp - unit.hp;
  const base = Math.round(missing * 0.4);
  return base + (hasBlessing(run, "trail-ration") ? 4 : 0);
}

export function startDelve(
  state: GameState,
  offerKey: string,
  team: string[],
  now: number,
): { state: GameState; error?: string } {
  if (!delveUnlocked(state)) return { state, error: "Five names must stand on the ledger before the Hearthroads open." };
  if (state.activeDelve && !state.activeDelve.end) return { state, error: "A company is already on the Hearthroads." };
  const fresh = ensureDelveOffers(state);
  const offer = (fresh.delveOffers ?? []).find((entry) => entry.key === offerKey);
  if (!offer) return { state: fresh, error: "That contract has rolled off the board." };
  const contract = CONTRACT_BY_ID[offer.contractId];
  if (!contract) return { state: fresh, error: "The contract has faded." };
  if (team.length !== contract.seats) {
    return { state: fresh, error: `This road needs ${contract.seats} in the company.` };
  }
  const unique = new Set(team);
  if (unique.size !== team.length) return { state: fresh, error: "Each name can stand only once." };
  for (const id of team) {
    if (!fresh.cards.some((card) => card.id === id)) return { state: fresh, error: "That name is not in your company." };
    if (isBusy(fresh, id)) return { state: fresh, error: `${CARD_BY_ID[id]?.name ?? id} is already out.` };
    if (isExhausted(fresh, id, now)) return { state: fresh, error: `${CARD_BY_ID[id]?.name ?? id} needs rest.` };
  }

  const nodes = generateMap(offer.seed, contract.id);
  const startIds = nodes.filter((node) => node.layer === 0).map((node) => node.id);
  const run: DelveRun = {
    runId: uid("road"),
    offerKey: offer.key,
    contractId: contract.id,
    seed: offer.seed,
    team: [...team],
    threatElement: offer.threatElement,
    nodes,
    currentNodeId: null,
    reachable: startIds,
    visited: [],
    phase: "map",
    combat: null,
    eventId: null,
    blessingChoices: [],
    blessingIds: [],
    party: team.map((id) => fighterFromCard(fresh, id)),
    shardsEarned: 0,
    startedAt: now,
  };
  return {
    state: log(patchRun(fresh, run), "system", `${contract.name}: ${team.length} names take the Hearthroads.`),
  };
}

export function chooseDelveNode(state: GameState, nodeId: string): { state: GameState; error?: string } {
  const run = state.activeDelve;
  if (!run || run.end) return { state, error: "No company is on the road." };
  if (run.phase !== "map") return { state, error: "The road is not yours to choose yet." };
  if (!run.reachable.includes(nodeId)) return { state, error: "That fork is not open." };
  const node = run.nodes.find((entry) => entry.id === nodeId);
  if (!node) return { state, error: "The path is gone." };

  let next: DelveRun = {
    ...run,
    currentNodeId: nodeId,
    visited: [...run.visited, nodeId],
    reachable: [...node.edges],
  };

  if (node.kind === "fight" || node.kind === "elite" || node.kind === "boss") {
    next = beginCombat(next, node);
  } else if (node.kind === "event") {
    next = { ...next, phase: "event", eventId: node.eventId ?? DELVE_EVENTS[0].id, combat: null };
  } else {
    const party = next.party.map((unit) => (unit.hp > 0 ? healFighter(unit, restHealAmount(next, unit)) : unit));
    next = openBlessing({ ...next, party, combat: null, eventId: null });
    if (next.phase === "map") next = { ...next, phase: "map" };
  }
  return { state: patchRun(state, next) };
}

function awardNodeShards(run: DelveRun, kind: DelveNodeKind): DelveRun {
  const bonus = CONTRACT_BY_ID[run.contractId]?.shardBonus ?? 0;
  return { ...run, shardsEarned: run.shardsEarned + shardsFor(kind, bonus) };
}

function currentNode(run: DelveRun): DelveNode | undefined {
  return run.nodes.find((node) => node.id === run.currentNodeId);
}

function afterCombatWin(run: DelveRun): DelveRun {
  const node = currentNode(run);
  const kind = node?.kind ?? "fight";
  let next = awardNodeShards({ ...run, party: syncPartyFromCombat(run) }, kind);
  if (kind === "elite" || kind === "boss") return openBlessing(next);
  return { ...next, phase: "map", combat: null, eventId: null, blessingChoices: [] };
}

function settleRun(state: GameState, end: DelveEnd): GameState {
  const run = state.activeDelve;
  if (!run) return state;
  const shards = end === "won" ? run.shardsEarned : Math.floor(run.shardsEarned / 2);
  const next: DelveRun = {
    ...run,
    phase: "result",
    end,
    shardsEarned: shards,
    combat: null,
    eventId: null,
    blessingChoices: [],
    party: run.combat ? syncPartyFromCombat(run) : run.party,
  };
  return patchRun(state, next);
}

function enemyTurn(state: GameState, run: DelveRun): DelveRun {
  if (!run.combat) return run;
  const rng = mulberry32(hashSeed(`turn-${run.seed}-${run.combat.round}-${run.combat.log.length}`));
  let party = run.combat.party.map((unit) => ({ ...unit }));
  let enemies = run.combat.enemies.map((unit) => ({ ...unit, block: 0 }));
  const lines = [...run.combat.log];

  for (let i = 0; i < enemies.length; i += 1) {
    const enemy = enemies[i];
    if (enemy.hp <= 0) continue;
    const def = ENCOUNTER_BY_ID[enemy.encounterId];
    const dmg = Math.max(2, (def?.damage ?? 5) - (enemy.weakened > 0 ? 2 : 0));
    if (enemy.intent === "guard") {
      enemies[i] = { ...enemy, block: 4, weakened: Math.max(0, enemy.weakened - 1), intent: nextIntent(rng) };
      lines.push(`${def?.name ?? "Foe"} raises a guard.`);
    } else {
      const targets = living(party);
      if (targets.length === 0) break;
      const target = pick(targets, rng);
      const hit = applyDamageToFighter(target, enemy.intent === "sap" ? Math.max(2, dmg - 1) : dmg);
      party = party.map((unit) => (unit.id === target.id ? hit.unit : unit));
      const name = CARD_BY_ID[target.id]?.name ?? target.id;
      lines.push(
        enemy.intent === "sap"
          ? `${def?.name ?? "Foe"} saps ${name} for ${hit.dealt}.`
          : `${def?.name ?? "Foe"} strikes ${name} for ${hit.dealt}.`,
      );
      enemies[i] = { ...enemy, weakened: Math.max(0, enemy.weakened - 1), intent: nextIntent(rng) };
    }
  }

  if (living(party).length === 0) {
    return {
      ...run,
      combat: { ...run.combat, party, enemies, log: [...lines, "The company falls."] },
    };
  }

  let nextParty = party.map((unit) => ({ ...unit, acted: false }));
  if (hasBlessing(run, "light-mercy")) {
    nextParty = nextParty.map((unit) => (unit.hp > 0 ? healFighter(unit, 2) : unit));
  }
  return {
    ...run,
    combat: {
      ...run.combat,
      party: nextParty,
      enemies,
      round: run.combat.round + 1,
      log: [...lines, `Round ${run.combat.round + 1}.`],
    },
  };
}

export function delveAct(
  state: GameState,
  actorId: string,
  action: DelveActionId,
  targetId?: string,
): { state: GameState; error?: string } {
  const run = state.activeDelve;
  if (!run || run.end || run.phase !== "combat" || !run.combat) return { state, error: "No fight is joined." };
  const actor = run.combat.party.find((unit) => unit.id === actorId);
  if (!actor || actor.hp <= 0) return { state, error: "That name cannot act." };
  if (actor.acted) return { state, error: "That name has already spent this round." };
  const allowed = actionsFor(actorId);
  const verb = allowed.find((entry) => entry.id === action);
  if (!verb) return { state, error: "That is not their work." };

  let party = run.combat.party.map((unit) => ({ ...unit }));
  let enemies = run.combat.enemies.map((unit) => ({ ...unit }));
  const lines = [...run.combat.log];
  const actorName = CARD_BY_ID[actorId]?.name ?? actorId;
  const markActed = () => {
    party = party.map((unit) => (unit.id === actorId ? { ...unit, acted: true } : unit));
  };

  if (action === "guard") {
    const amount = 3 + Math.floor((state.cards.find((card) => card.id === actorId) ? cardPower(state.cards.find((c) => c.id === actorId)!) : 8) / 5);
    const tankBonus = ["tank", "paladin", "darkpaladin"].includes(CARD_BY_ID[actorId]?.role ?? "") ? 2 : 0;
    party = party.map((unit) => (unit.id === actorId ? { ...unit, block: unit.block + amount + tankBonus, acted: true } : unit));
    lines.push(`${actorName} guards (+${amount + tankBonus} block).`);
  } else if (action === "mend") {
    const target = party.find((unit) => unit.id === (targetId ?? actorId) && unit.hp > 0);
    if (!target) return { state, error: "Mend needs a living ally." };
    const owned = state.cards.find((card) => card.id === actorId);
    const power = owned ? cardPower(owned) : 8;
    let amount = 4 + Math.floor(power / 4);
    if (hasBlessing(run, "still-pool")) amount += 3;
    if (CARD_BY_ID[actorId]?.traits.includes("nurturing")) amount += 1;
    party = party.map((unit) => (unit.id === target.id ? healFighter({ ...unit, acted: unit.id === actorId ? true : unit.acted }, amount) : unit));
    party = party.map((unit) => (unit.id === actorId ? { ...unit, acted: true } : unit));
    lines.push(`${actorName} mends ${CARD_BY_ID[target.id]?.name ?? target.id} for ${amount}.`);
  } else if (action === "cleave") {
    const dmg = Math.max(2, strikePower(state, run, actorId) - 1);
    enemies = enemies.map((enemy) => {
      if (enemy.hp <= 0) return enemy;
      const hit = applyDamageToEnemy(enemy, dmg);
      return hit.enemy;
    });
    markActed();
    lines.push(`${actorName} cleaves for ${dmg}.`);
  } else {
    const enemy = livingEnemies(enemies).find((unit) => unit.instanceId === targetId) ?? livingEnemies(enemies)[0];
    if (!enemy) return { state, error: "No foe remains." };
    const ignore = action === "pierce" && hasBlessing(run, "keen-eye");
    let dmg = strikePower(state, run, actorId);
    if (action === "bolt") dmg = Math.round(dmg * 1.1);
    if (action === "pierce") dmg += 1;
    if (enemy.weakened > 0) dmg += 2;
    const hit = applyDamageToEnemy(enemy, dmg, ignore);
    enemies = enemies.map((unit) => (unit.instanceId === enemy.instanceId ? hit.enemy : unit));
    if (action === "drain") {
      party = party.map((unit) => (unit.id === actorId ? healFighter(unit, Math.max(2, Math.round(hit.dealt * 0.4))) : unit));
    }
    markActed();
    const foeName = ENCOUNTER_BY_ID[enemy.encounterId]?.name ?? "Foe";
    lines.push(`${actorName} ${action === "bolt" ? "bolts" : action === "pierce" ? "pierces" : action === "drain" ? "drains" : "strikes"} ${foeName} for ${hit.dealt}.`);
  }

  let nextRun: DelveRun = {
    ...run,
    combat: { ...run.combat, party, enemies, log: lines.slice(-16) },
  };

  if (livingEnemies(enemies).length === 0) {
    nextRun = {
      ...nextRun,
      combat: { ...nextRun.combat!, log: [...(nextRun.combat?.log ?? []), "The way is clear."] },
    };
    return { state: patchRun(state, nextRun) };
  }
  if (living(party).length === 0) {
    return { state: settleRun(patchRun(state, nextRun), "lost") };
  }
  const ready = living(nextRun.combat!.party);
  if (ready.length > 0 && ready.every((unit) => unit.acted)) {
    nextRun = enemyTurn(state, nextRun);
    if (living(nextRun.combat?.party ?? []).length === 0) {
      return { state: settleRun(patchRun(state, nextRun), "lost") };
    }
  }
  return { state: patchRun(state, nextRun) };
}

export function continueDelve(state: GameState): { state: GameState; error?: string } {
  const run = state.activeDelve;
  if (!run || run.end) return { state, error: "No company is on the road." };
  if (run.phase !== "combat" || !run.combat) return { state, error: "There is nothing to continue." };
  if (livingEnemies(run.combat.enemies).length > 0) return { state, error: "The fight is not finished." };
  return { state: patchRun(state, afterCombatWin(run)) };
}

export function resolveDelveEvent(
  state: GameState,
  choiceId: string,
): { state: GameState; error?: string } {
  const run = state.activeDelve;
  if (!run || run.end || run.phase !== "event" || !run.eventId) return { state, error: "No fork in the tale." };
  const event = EVENT_BY_ID[run.eventId];
  if (!event) return { state, error: "The tale has faded." };
  const choice = event.choices.find((entry) => entry.id === choiceId);
  if (!choice) return { state, error: "That choice is not offered." };
  if (choice.needTrait) {
    const ok = run.team.some((id) => CARD_BY_ID[id]?.traits.includes(choice.needTrait!));
    if (!ok) return { state, error: "No one here can make that choice." };
  }

  let party = run.party.map((unit) => ({ ...unit }));
  let shards = run.shardsEarned;
  let openBless = false;
  const ration = hasBlessing(run, "trail-ration") ? 3 : 0;

  const healAll = (amount: number) => {
    party = party.map((unit) => (unit.hp > 0 ? healFighter(unit, amount + ration) : unit));
  };
  const hurtAll = (amount: number) => {
    party = party.map((unit) => (unit.hp > 0 ? applyDamageToFighter(unit, amount).unit : unit));
  };

  const key = `${event.id}:${choiceId}`;
  if (key === "wayside-shrine:pray") healAll(6);
  else if (key === "wayside-shrine:take") shards += 3;
  else if (key === "wayside-shrine:pass") healAll(2);
  else if (key === "merchant-cart:trade") shards += 4;
  else if (key === "merchant-cart:mend") openBless = true;
  else if (key === "lost-child:help") openBless = true;
  else if (key === "lost-child:hurry") shards += 2;
  else if (key === "lost-child:point") healAll(2);
  else if (key === "road-fog:read") shards += 1;
  else if (key === "road-fog:stumble") hurtAll(4);
  else if (key === "road-fog:slow") hurtAll(2);
  else if (key === "hollow-chapel:search") shards += 3;
  else if (key === "hollow-chapel:rite") {
    healAll(8);
    openBless = true;
  } else if (key === "hollow-chapel:rest") healAll(4);
  else if (key === "beast-brush:face") shards += 3;
  else if (key === "beast-brush:hunt") {
    shards += 5;
    hurtAll(5);
  } else if (key === "night-camp:ration") healAll(7);
  else if (key === "night-camp:sleep") hurtAll(3);
  else if (key === "night-camp:embers") healAll(3);
  else if (key === "toll-bridge:talk") shards += 3;
  else if (key === "toll-bridge:glare") hurtAll(4);
  else if (key === "toll-bridge:pay") hurtAll(2);
  else healAll(1);

  if (living(party).length === 0) {
    return { state: settleRun(patchRun(state, { ...run, party, shardsEarned: shards }), "lost") };
  }

  let next: DelveRun = { ...run, party, shardsEarned: shards, eventId: null };
  next = openBless ? openBlessing(next) : { ...next, phase: "map", blessingChoices: [] };
  return { state: patchRun(state, next) };
}

export function selectDelveBlessing(state: GameState, blessingId: string): { state: GameState; error?: string } {
  const run = state.activeDelve;
  if (!run || run.end || run.phase !== "blessing") return { state, error: "No blessing is offered." };
  if (!run.blessingChoices.includes(blessingId) || !BLESSING_BY_ID[blessingId]) {
    return { state, error: "That blessing is not among the three." };
  }
  let party = run.party;
  if (blessingId === "second-wind") {
    party = party.map((unit) => ({
      ...unit,
      maxHp: unit.maxHp + 6,
      hp: Math.min(unit.maxHp + 6, unit.hp + 6),
    }));
  }
  const next: DelveRun = {
    ...run,
    party,
    blessingIds: [...run.blessingIds, blessingId],
    blessingChoices: [],
  };
  const node = currentNode(next);
  if (node?.kind === "boss") return { state: settleRun(patchRun(state, next), "won") };
  return { state: patchRun(state, { ...next, phase: "map", combat: null }) };
}

export function abandonDelve(state: GameState): { state: GameState; error?: string } {
  const run = state.activeDelve;
  if (!run || run.end) return { state, error: "No company is on the road." };
  const settledCombat =
    run.phase === "combat" && combatCleared(run) ? afterCombatWin(run) : run;
  return { state: settleRun(patchRun(state, settledCombat), "abandoned") };
}

function restMsFor(end: DelveEnd): number {
  if (end === "won") return 90_000;
  if (end === "abandoned") return 180_000;
  return 240_000;
}

function xpFor(contractId: string, end: DelveEnd): number {
  const seats = CONTRACT_BY_ID[contractId]?.seats ?? 2;
  if (end === "won") return 6 + seats * 4;
  if (end === "abandoned") return 2;
  return 3;
}

export function finishDelve(state: GameState, now: number): { state: GameState; error?: string } {
  const run = state.activeDelve;
  if (!run || run.phase !== "result" || !run.end) return { state, error: "The road has not ended." };
  const xpEach = xpFor(run.contractId, run.end);
  const restMs = restMsFor(run.end);
  const won = run.end === "won";
  const cards = state.cards.map((card) => {
    if (!run.team.includes(card.id)) return card;
    const { card: next } = grantXp(card, xpEach);
    return {
      ...next,
      exhaustedUntil: now + restMs,
      restKind: won ? ("rest" as const) : ("recover" as const),
    };
  });
  const contract = CONTRACT_BY_ID[run.contractId];
  let next: GameState = {
    ...state,
    cards,
    tokenShards: (state.tokenShards ?? 0) + run.shardsEarned,
    activeDelve: null,
  };
  const shardNote = run.shardsEarned ? `${run.shardsEarned} shard${run.shardsEarned === 1 ? "" : "s"}` : "no shards";
  next = log(
    next,
    won ? "success" : "fail",
    run.end === "won"
      ? `${contract?.name ?? "Hearthroads"}: the road is walked. ${shardNote}.`
      : run.end === "abandoned"
        ? `${contract?.name ?? "Hearthroads"}: the company turns back. ${shardNote}.`
        : `${contract?.name ?? "Hearthroads"}: the company is broken. ${shardNote}.`,
  );
  return { state: next };
}

export function craftTokenFromShards(state: GameState): { state: GameState; error?: string } {
  const shards = state.tokenShards ?? 0;
  if (shards < SHARDS_PER_TOKEN) return { state, error: `Need ${SHARDS_PER_TOKEN} shards to strike a token.` };
  return {
    state: {
      ...state,
      tokenShards: shards - SHARDS_PER_TOKEN,
      tokens: state.tokens + 1,
    },
  };
}

export function debugGrantRoadReady(state: GameState): GameState {
  const owned = new Set(state.cards.map((card) => card.id));
  const added = TAVERN_CARDS.filter((card) => !owned.has(card.id)).slice(0, Math.max(0, 6 - state.cards.length));
  return {
    ...state,
    tokenShards: (state.tokenShards ?? 0) + 16,
    tokens: state.tokens + 2,
    cards: [...state.cards, ...added.map((card) => makeOwned(card.id))],
  };
}

export function eventChoiceAvailable(run: DelveRun, needTrait?: string): boolean {
  if (!needTrait) return true;
  return run.team.some((id) => CARD_BY_ID[id]?.traits.includes(needTrait));
}

export function combatCleared(run: DelveRun | null): boolean {
  if (!run?.combat) return false;
  return run.combat.enemies.every((enemy) => enemy.hp <= 0);
}

export function intentLabel(intent: EnemyIntent): string {
  if (intent === "guard") return "Guarding";
  if (intent === "sap") return "Sapping";
  return "Striking";
}
