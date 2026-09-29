import type { DelveBlessingDef } from "../types";

export const DELVE_BLESSINGS: DelveBlessingDef[] = [
  { id: "iron-ward", name: "Iron Ward", blurb: "Each fight opens with extra block on every name." },
  { id: "ember-edge", name: "Ember Edge", blurb: "Strikes land harder. Fire remembers the hand." },
  { id: "still-pool", name: "Still Pool", blurb: "Mending closes more than it used to." },
  { id: "second-wind", name: "Second Wind", blurb: "The company finds another length of road in their lungs." },
  { id: "keen-eye", name: "Keen Eye", blurb: "Piercing shots ignore whatever they raise." },
  { id: "fellowship", name: "Fellowship", blurb: "Set-kin hit harder when they share the road." },
  { id: "light-mercy", name: "Light's Mercy", blurb: "A little healing at the start of each round." },
  { id: "trail-ration", name: "Trail Ration", blurb: "Camps and shrines restore more than they should." },
];

export const BLESSING_BY_ID = Object.fromEntries(DELVE_BLESSINGS.map((b) => [b.id, b])) as Record<
  string,
  DelveBlessingDef
>;
