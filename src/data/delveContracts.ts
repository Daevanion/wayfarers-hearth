import { BACKGROUNDS } from "./backgrounds";
import type { DelveContractDef } from "../types";

export const DELVE_CONTRACTS: DelveContractDef[] = [
  {
    id: "patrol",
    name: "Road Patrol",
    length: "patrol",
    seats: 2,
    layers: [1, 2, 2, 2, 1],
    flavor: "A short circuit of the old king's road. Two names, a few forks, and whatever still hunts the ditches.",
    art: BACKGROUNDS.oldKingsRoad,
    shardBonus: 0,
  },
  {
    id: "standard",
    name: "The Hearthroads",
    length: "standard",
    seats: 3,
    layers: [1, 2, 3, 2, 3, 2, 1],
    flavor: "A proper contract into the woods and the mire. Three seats, branching paths, and a named terror at the end.",
    art: BACKGROUNDS.whisperingWoods,
    shardBonus: 1,
  },
  {
    id: "deep",
    name: "Deep Contract",
    length: "deep",
    seats: 4,
    layers: [1, 2, 3, 3, 2, 3, 2, 1],
    flavor: "Four names into the ruins and the black. Long forks, hard elites, and a boss that does not share the road.",
    art: BACKGROUNDS.abyss,
    shardBonus: 2,
  },
];

export const CONTRACT_BY_ID = Object.fromEntries(DELVE_CONTRACTS.map((c) => [c.id, c])) as Record<
  string,
  DelveContractDef
>;
