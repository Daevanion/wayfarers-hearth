import { ADVENTURER_BY_ID, STARTER_IDS } from "../data/adventurers";
import { EQUIPMENT_BY_ID } from "../data/equipment";
import { CLEARS_TO_UNLOCK, LOCATION_BY_ID, LOCATIONS } from "../data/locations";
import { ROLES } from "../data/roles";
import type { EquipSlot, GameState, JournalEntry, OwnedEquipment } from "../types";
import {
  healCost,
  isInjured,
  MAX_EQUIP_LEVEL,
  nextLevelCost,
  previewQuest,
  scrapValue,
  uid,
} from "./formulas";
import { randInt, roll, rollAdventurerId, rollEquipmentDrop, rollRecruitRarity } from "./rng";
import { createNewGame } from "./save";

function log(state: GameState, kind: JournalEntry["kind"], text: string): GameState {
  const entry: JournalEntry = { id: uid("log"), at: Date.now(), kind, text };
  return { ...state, journal: [entry, ...state.journal].slice(0, 40) };
}

function addItem(
  state: GameState,
  templateId: string,
): { state: GameState; instance: OwnedEquipment } {
  const instance: OwnedEquipment = {
    instanceId: uid("eq"),
    templateId,
    level: 1,
  };
  return { state: { ...state, equipment: [...state.equipment, instance] }, instance };
}

export function tickState(state: GameState, now = Date.now()): GameState {
  if (!state.activeAdventure) return state;
  if (now < state.activeAdventure.endsAt) return state;
  return resolveAdventure(state, now);
}

export function startAdventure(
  state: GameState,
  locationId: string,
  team: string[],
  now = Date.now(),
): { state: GameState; error?: string } {
  if (state.activeAdventure) {
    return { state, error: "A company is already on the road." };
  }
  if (!state.unlockedLocationIds.includes(locationId)) {
    return { state, error: "That road is still rumor." };
  }
  if (team.length < 1 || team.length > 3) {
    return { state, error: "Send between one and three adventurers." };
  }
  const unique = new Set(team);
  if (unique.size !== team.length) {
    return { state, error: "A name cannot walk twice." };
  }
  for (const id of team) {
    const owned = state.adventurers.find((a) => a.templateId === id);
    if (!owned) return { state, error: "An unknown soul cannot be sent." };
    if (isInjured(owned, now)) {
      return { state, error: `${ADVENTURER_BY_ID[id].name} still lies in the ward.` };
    }
  }
  const preview = previewQuest(state, locationId, team);
  const location = LOCATION_BY_ID[locationId];
  const next = log(
    {
      ...state,
      activeAdventure: {
        locationId,
        team,
        startedAt: now,
        endsAt: now + preview.timeMs,
        preview,
      },
    },
    "system",
    `${team.map((id) => ADVENTURER_BY_ID[id].name).join(", ")} set out for ${location.name}.`,
  );
  return { state: next };
}

function grantAdventurer(state: GameState, templateId: string): { state: GameState; text: string } {
  const template = ADVENTURER_BY_ID[templateId];
  const existing = state.adventurers.find((a) => a.templateId === templateId);
  if (existing) {
    return {
      state: {
        ...state,
        adventurers: state.adventurers.map((a) =>
          a.templateId === templateId ? { ...a, dupes: a.dupes + 1 } : a,
        ),
      },
      text: `A duplicate of ${template.name} was found (${template.rarity}).`,
    };
  }
  return {
    state: {
      ...state,
      adventurers: [
        ...state.adventurers,
        {
          templateId,
          level: 1,
          dupes: 0,
          injuredUntil: null,
        },
      ],
    },
    text: `${template.name}, ${template.title}, joined the company.`,
  };
}

export function resolveAdventure(state: GameState, now = Date.now()): GameState {
  const quest = state.activeAdventure;
  if (!quest) return state;
  const location = LOCATION_BY_ID[quest.locationId];
  const success = roll(quest.preview.success);
  let next: GameState = { ...state, activeAdventure: null };
  const names = quest.team.map((id) => ADVENTURER_BY_ID[id].name).join(", ");

  if (success) {
    const lootMult = 0.7 + quest.preview.lootLevel * 0.12;
    const gold = Math.round(randInt(location.goldMin, location.goldMax) * lootMult);
    const iron = roll(0.35 + quest.preview.lootLevel * 0.04) ? randInt(1, 1 + Math.ceil(quest.preview.lootLevel / 2)) : 0;
    const herbs = roll(0.28 + quest.preview.lootLevel * 0.03) ? randInt(1, 2) : 0;
    const relics = quest.preview.lootLevel >= 5 && roll(0.08 + quest.preview.lootLevel * 0.02) ? 1 : 0;
    next = {
      ...next,
      gold: next.gold + gold,
      iron: next.iron + iron,
      herbs: next.herbs + herbs,
      relics: next.relics + relics,
      locationClears: {
        ...next.locationClears,
        [quest.locationId]: (next.locationClears[quest.locationId] ?? 0) + 1,
      },
    };

    const clears = next.locationClears[quest.locationId] ?? 0;
    const locIndex = LOCATIONS.findIndex((l) => l.id === quest.locationId);
    if (clears >= CLEARS_TO_UNLOCK && locIndex >= 0 && locIndex < LOCATIONS.length - 1) {
      const upcoming = LOCATIONS[locIndex + 1].id;
      if (!next.unlockedLocationIds.includes(upcoming)) {
        next = {
          ...next,
          unlockedLocationIds: [...next.unlockedLocationIds, upcoming],
        };
        next = log(
          next,
          "system",
          `${LOCATIONS[locIndex + 1].name} now lies open beyond the crossroads.`,
        );
      }
    }

    const parts = [`${names} returned from ${location.name}.`, `+${gold} gold`];
    if (iron) parts.push(`+${iron} iron`);
    if (herbs) parts.push(`+${herbs} herbs`);
    if (relics) parts.push(`+${relics} relic`);

    if (roll(quest.preview.equipment)) {
      const drop = rollEquipmentDrop(quest.preview.lootLevel);
      if (drop) {
        const granted = addItem(next, drop.id);
        next = granted.state;
        parts.push(`found ${drop.name}`);
      }
    }

    if (roll(quest.preview.recruit)) {
      const ownedIds = next.adventurers.map((a) => a.templateId);
      const rarity = rollRecruitRarity(0);
      const id = rollAdventurerId(ownedIds, rarity);
      const granted = grantAdventurer(next, id);
      next = granted.state;
      parts.push(granted.text);
    }

    next = log(next, "success", parts.join(" "));
    return next;
  }

  const gold = roll(0.55) ? Math.round(randInt(location.goldMin, location.goldMax) * 0.22) : 0;
  const injuryMs = Math.round(location.baseTimeMs * 1.8 + 25_000);
  const healerPresent = quest.team.some((id) => ADVENTURER_BY_ID[id].role === "healer");
  const duration = Math.round(injuryMs * (healerPresent ? 0.7 : 1));
  next = {
    ...next,
    gold: next.gold + gold,
    adventurers: next.adventurers.map((a) =>
      quest.team.includes(a.templateId) ? { ...a, injuredUntil: now + duration } : a,
    ),
  };
  const failText = gold
    ? `${names} fled ${location.name}. Scant loot: +${gold} gold. The wounded need the church.`
    : `${names} fled ${location.name} empty-handed. The wounded need the church.`;
  return log(next, "fail", failText);
}

export function recruitAdventurer(state: GameState): { state: GameState; error?: string; text?: string } {
  if (state.gold < state.recruitCost) {
    return { state, error: "The tavern wants more coin." };
  }
  const rarity = rollRecruitRarity(0);
  const ownedIds = state.adventurers.map((a) => a.templateId);
  const id = rollAdventurerId(ownedIds, rarity);
  const spent: GameState = {
    ...state,
    gold: state.gold - state.recruitCost,
    recruitCost: Math.min(160, state.recruitCost + 4),
  };
  const granted = grantAdventurer(spent, id);
  const template = ADVENTURER_BY_ID[id];
  const text = `${granted.text} (${template.rarity})`;
  return { state: log(granted.state, "recruit", text), text };
}

export function dismissAdventurer(
  state: GameState,
  templateId: string,
): { state: GameState; error?: string } {
  if (STARTER_LOCKED(templateId) && state.adventurers.length <= 3) {
    return { state, error: "The first company cannot be turned out into the rain." };
  }
  const owned = state.adventurers.find((a) => a.templateId === templateId);
  if (!owned) return { state, error: "They are not yours to dismiss." };
  if (state.activeAdventure?.team.includes(templateId)) {
    return { state, error: "They are on the road." };
  }
  const template = ADVENTURER_BY_ID[templateId];
  const refund = 12 + owned.level * 8 + owned.dupes * 6;
  const next: GameState = {
    ...state,
    gold: state.gold + refund,
    adventurers: state.adventurers.filter((a) => a.templateId !== templateId),
    decks: state.decks.map((d) => ({
      ...d,
      members: d.members.filter((id) => id !== templateId),
    })),
  };
  return {
    state: log(next, "system", `${template.name} was dismissed. +${refund} gold. Their gear remains in the smithy.`),
  };
}

function STARTER_LOCKED(id: string): boolean {
  return (STARTER_IDS as readonly string[]).includes(id);
}

export function upgradeAdventurer(
  state: GameState,
  templateId: string,
): { state: GameState; error?: string } {
  const owned = state.adventurers.find((a) => a.templateId === templateId);
  if (!owned) return { state, error: "No such companion." };
  const cost = nextLevelCost(owned.level);
  if (cost == null) return { state, error: "They have already reached their legend." };
  if (owned.dupes < cost) return { state, error: "More likenesses are needed." };
  const template = ADVENTURER_BY_ID[templateId];
  const next: GameState = {
    ...state,
    adventurers: state.adventurers.map((a) =>
      a.templateId === templateId ? { ...a, level: a.level + 1, dupes: a.dupes - cost } : a,
    ),
  };
  return {
    state: log(next, "system", `${template.name} was raised to rank ${owned.level + 1}.`),
  };
}

export function healAdventurer(
  state: GameState,
  templateId: string,
  now = Date.now(),
): { state: GameState; error?: string } {
  const owned = state.adventurers.find((a) => a.templateId === templateId);
  if (!owned) return { state, error: "The church does not know that name." };
  if (!isInjured(owned, now)) return { state, error: "They are already whole." };
  const cost = healCost(owned, now);
  if (state.gold < cost) return { state, error: "The tithe is unpaid." };
  const template = ADVENTURER_BY_ID[templateId];
  const next: GameState = {
    ...state,
    gold: state.gold - cost,
    herbs: state.herbs,
    adventurers: state.adventurers.map((a) =>
      a.templateId === templateId ? { ...a, injuredUntil: null } : a,
    ),
  };
  return { state: log(next, "heal", `${template.name} was restored for ${cost} gold.`) };
}

export function healAll(
  state: GameState,
  now = Date.now(),
): { state: GameState; error?: string } {
  const injured = state.adventurers.filter((a) => isInjured(a, now));
  if (injured.length === 0) return { state, error: "The ward is empty." };
  const cost = injured.reduce((sum, a) => sum + healCost(a, now), 0);
  if (state.gold < cost) return { state, error: "The church requires a greater tithe." };
  let next = state;
  for (const a of injured) {
    const result = healAdventurer(next, a.templateId, now);
    next = result.state;
  }
  return { state: next };
}

export function craftEquipment(
  state: GameState,
  templateId: string,
): { state: GameState; error?: string } {
  const def = EQUIPMENT_BY_ID[templateId];
  if (!def?.craft) return { state, error: "The forge does not know that pattern." };
  const { gold, iron, herbs, relics } = def.craft;
  if (state.gold < gold || state.iron < iron || state.herbs < herbs || state.relics < relics) {
    return { state, error: "The materials are wanting." };
  }
  const spent: GameState = {
    ...state,
    gold: state.gold - gold,
    iron: state.iron - iron,
    herbs: state.herbs - herbs,
    relics: state.relics - relics,
  };
  const granted = addItem(spent, templateId);
  return {
    state: log(granted.state, "craft", `The smith finished a ${def.name}.`),
  };
}

export function upgradeEquipment(
  state: GameState,
  instanceId: string,
): { state: GameState; error?: string } {
  const piece = state.equipment.find((e) => e.instanceId === instanceId);
  if (!piece) return { state, error: "No such piece." };
  if (piece.level >= MAX_EQUIP_LEVEL) return { state, error: "The metal will take no more." };
  const def = EQUIPMENT_BY_ID[piece.templateId];
  const gold = 16 + piece.level * 14;
  const iron = 2 + piece.level;
  if (state.gold < gold || state.iron < iron) return { state, error: "The forge is hungry." };
  const next: GameState = {
    ...state,
    gold: state.gold - gold,
    iron: state.iron - iron,
    equipment: state.equipment.map((e) =>
      e.instanceId === instanceId ? { ...e, level: e.level + 1 } : e,
    ),
  };
  return { state: log(next, "craft", `${def.name} was tempered to rank ${piece.level + 1}.`) };
}

export function wearItem(
  state: GameState,
  instanceId: string,
): { state: GameState; error?: string } {
  const piece = state.equipment.find((e) => e.instanceId === instanceId);
  if (!piece) return { state, error: "Nothing to bind." };
  const def = EQUIPMENT_BY_ID[piece.templateId];
  if (!def) return { state, error: "The forge does not know that piece." };
  const loadout: GameState["loadout"] = { ...state.loadout };
  for (const key of Object.keys(loadout) as EquipSlot[]) {
    if (loadout[key] === instanceId) delete loadout[key];
  }
  loadout[def.slot] = instanceId;
  return { state: { ...state, loadout } };
}

export function unwearSlot(state: GameState, slot: EquipSlot): GameState {
  const loadout = { ...state.loadout };
  delete loadout[slot];
  return { ...state, loadout };
}

export function scrapEquipment(
  state: GameState,
  instanceId: string,
): { state: GameState; error?: string } {
  const piece = state.equipment.find((e) => e.instanceId === instanceId);
  if (!piece) return { state, error: "No such piece." };
  const def = EQUIPMENT_BY_ID[piece.templateId];
  if (!def) return { state, error: "The scrap heap will not take that." };
  const yield_ = scrapValue(def.rarity, piece.level);
  const loadout: GameState["loadout"] = { ...state.loadout };
  for (const key of Object.keys(loadout) as EquipSlot[]) {
    if (loadout[key] === instanceId) delete loadout[key];
  }
  const next: GameState = {
    ...state,
    gold: state.gold + yield_.gold,
    iron: state.iron + yield_.iron,
    herbs: state.herbs + yield_.herbs,
    relics: state.relics + yield_.relics,
    equipment: state.equipment.filter((e) => e.instanceId !== instanceId),
    loadout,
  };
  return {
    state: log(
      next,
      "craft",
      `${def.name} was broken down for ${yield_.gold}g, ${yield_.iron} iron, ${yield_.herbs} herbs, ${yield_.relics} relics.`,
    ),
  };
}

export function saveDeck(
  state: GameState,
  deckId: string,
  name: string,
  members: string[],
): GameState {
  const trimmed = members.slice(0, 3);
  const existing = state.decks.find((d) => d.id === deckId);
  if (existing) {
    return {
      ...state,
      decks: state.decks.map((d) => (d.id === deckId ? { ...d, name, members: trimmed } : d)),
    };
  }
  return {
    ...state,
    decks: [...state.decks, { id: deckId, name, members: trimmed }].slice(0, 4),
  };
}

export { createNewGame, ROLES };
