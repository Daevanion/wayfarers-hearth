import type { SetDef } from "../types";

export const SETS: SetDef[] = [
  {
    id: "hearthbound",
    name: "Hearthbound",
    members: ["hera-starfall", "caelan-featherfoot", "cedric-oakmont"],
    description:
      "Three orphans of the same raid, sworn to survive together. The heart, the edge, and the gale of one small party.",
  },
  {
    id: "woodland-debt",
    name: "Woodland Debt",
    members: ["lysandra-silverleaf", "kaelen-duskwalker", "gall-ironbend"],
    description:
      "A witch who raised a runaway, the runaway who owes a dwarf her life, and the dwarf collecting the debt one guild request at a time.",
  },
  {
    id: "penitent-order",
    name: "Penitent Order",
    members: ["leona-stormrage", "sylas-duskwalker", "freya"],
    description:
      "The church's strangest ward: a fire prodigy, the bishop who dotes on her, and the dark berserker he refuses to let out of his sight.",
  },
  {
    id: "glade-expedition",
    name: "Glade Expedition",
    members: ["morrigan-crow", "odin-stormrage", "reinhart-den"],
    description:
      "An assassin, a living legend, and a beast god sent into the dark glade. None of them trusts the others' reasons for coming.",
  },
  {
    id: "sun-scripture",
    name: "Sun Scripture",
    members: ["elanor-lightbearer", "fenric-valerand", "seraphina-aurora"],
    description:
      "A secret envoy carrying the demon king's weakness to the Citadel. Its leader knows this journey will be her last.",
  },
];

export const SET_BY_ID = Object.fromEntries(SETS.map((s) => [s.id, s])) as Record<string, SetDef>;
