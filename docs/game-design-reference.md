# Wayfarer's Hearth — Game Design Reference

> Generated from live codebase (`src/data/*`, `src/game/*`). Use this document to evaluate balance, draft new quests, plan character arcs, and design progression systems.
>
> **Source of truth:** `src/data/cards.ts`, `src/data/quests.ts`, `src/game/formulas.ts`, `src/game/quests.ts`

---

## Table of Contents

1. [Active Game Loop](#1-active-game-loop)
2. [Core Formulas](#2-core-formulas)
3. [Progression & Economy](#3-progression--economy)
4. [Full Roster (15 Cards)](#4-full-roster-15-cards)
5. [Power Output Tables](#5-power-output-tables)
6. [Sets & Synergies](#6-sets--synergies)
7. [Traits Reference (43)](#7-traits-reference-43)
8. [Quest Board (16 Templates)](#8-quest-board-16-templates)
9. [Quest Design Guide](#9-quest-design-guide)
10. [Character Lore Hooks for New Quests](#10-character-lore-hooks-for-new-quests)
11. [Unimplemented Assets & Future Characters](#11-unimplemented-assets--future-characters)
12. [Legacy System (Not Wired)](#12-legacy-system-not-wired)

---

## 1. Active Game Loop

The live game is a **daily bounty board** system. Players dispatch teams of owned character cards to timed quests, roll for success/crit, earn gold/tokens/XP, and recruit via tavern packs.

| Phase | Description |
|-------|-------------|
| **Title** | New game or load save |
| **Opening Draw** | Fixed reveal of 3 starter cards (Hearthbound set) |
| **Plaza** | Daily bounty board — dispatch, resolve, shop |
| **Modals** | Collection (Guild), Catalogue, Tavern packs, Quest results |

### Starting State

| Resource | Value |
|----------|-------|
| Gold | 30 |
| Tokens | 0 |
| Cards | Hera Starfall, Caelan Featherfoot, Cedric Oakmont (all L1) |
| Daily quests | 4 short + 2 long (random from 16 templates) |

### Limits

| Rule | Value |
|------|-------|
| Max card level | 5 |
| Team size | 2 or 3 (per quest) |
| Parallel quests | Unlimited (different cards) |
| Roster cap | None |
| Card rest (win) | `duration × 0.5` |
| Card rest (fail) | `duration × 2` |
| Busy cards | Cannot dispatch while on an active quest |
| Exhausted cards | Cannot dispatch until `exhaustedUntil` passes |

### Daily Board

- Refreshes at local midnight (underway quests persist)
- Deterministic RNG seeded by date (`YYYY-MM-DD`)
- 4 short quests (90s–5min) + 2 long quests (1–3 hours)

---

## 2. Core Formulas

### Card Power

```
cardPower = basePower + (level - 1) × 5
MAX_LEVEL = 5
POWER_PER_LEVEL = 5
```

### XP & Leveling

```
xpToNext(level) = 50 + level × 50   (null at level 5)

Level 1→2: 100 XP
Level 2→3: 150 XP
Level 3→4: 200 XP
Level 4→5: 250 XP
Total to max: 700 XP
```

### Quest Assessment (`assessTeam`)

**Step 1 — Effective power**

```
For each team member:
  p = cardPower(owned)
  if quest.element != null AND (card.element == quest.element OR card.element == "wild"):
    effPower += p × 1.25
  else:
    effPower += p
effPower = round(effPower)
```

**Constants:** `ELEMENT_POWER_BONUS = 1.25`, `SET_SYNERGY_PCT = 10`

**Step 2 — Base success %**

```
base = round((effPower / quest.power) × 100)
```

**Step 3 — Modifiers**

- Each matching **advantage** trait/role on team → add `pct`
- Each matching **hazard** trait/role on team → add `pct` (negative values)
- All 3 members of a set on team → **+10%** ("Full set")

**Step 4 — Final odds**

```
raw = base + modSum
success = clamp(round(raw), 5, 100)
crit = clamp(round(raw) - 100, 0, 40)
```

**Step 5 — Crit match (bonus loot flag, not roll)**

| Crit type | Condition |
|-----------|-----------|
| `element` | Any team member has matching element or `wild` |
| `role` | Any team member has matching role |
| `set` | All 3 set members on team |

### Quest Resolution

```
roll = d100 (1–100)
if roll ≤ crit:        result = "crit"
else if roll ≤ success: result = "success"
else:                    result = "fail"
```

Crit is checked **first** (low rolls = triumph).

### Rewards

| Outcome | Gold | Tokens | XP each | Rest |
|---------|------|--------|---------|------|
| Success | `quest.gold` | 0 | `quest.xp` | `duration × 0.5` |
| Crit | `quest.gold` | 1 (short) or 2 (long) | `quest.xp` | `duration × 0.5` |
| Fail | 0 | 0 | `max(1, round(xp × 0.25))` | `duration × 2` |

**Crit-match bonus:** `gold × 1.5` when team satisfies crit condition AND quest is won.

---

## 3. Progression & Economy

### Gold Sources

- Quest success/crit: 10–170 gold per template
- Crit-match multiplier: ×1.5

### Gold Sinks

- Road pack (random card): **60 gold**

### Tokens

- Earned on **crit rolls only**: 1 (short) or 2 (long)
- Spent on Sealed Letter pack (prefers unowned cards): **1 token**

### Duplicate XP (pack pulls)

| Pack type | Duplicate XP |
|-----------|--------------|
| Gold pack | +40 XP |
| Token pack | +80 XP |

### Rough Progression Pace

- Average daily XP per card (if on all 6 quests): ~120–364 XP depending on assignments
- Solo card to max level (~700 XP): ~2–6 days of active play
- Starting gold (30) covers **0** road packs; first pack needs ~2–3 short quest wins

### Starter Team Reality (L1, no mods)

| Quest | Power req | Hera + Caelan (50) | Hearthbound trio (75) |
|-------|-----------|--------------------|-----------------------|
| Fever Herbs | 30 | 167% ✓ | 250% ✓ |
| Lost Sparrow | 50 | 100% ✓ | 150% ✓ |
| Goblin Toll | 60 | 83% (risky) | 125% ✓ |
| Chapel Vigil | 70 | 71% (risky) | 107% ✓ |
| Windworn Ledge | 100 | — (needs 3) | 75% (needs levels/recruits) |

**Design implication:** Early game is trait-modifier dependent. Matching advantages (+15–20%) and avoiding hazards (−15–30%) is often the difference between safe and risky dispatches.

---

## 4. Full Roster (15 Cards)

### Hearthbound — `hearthbound`

| ID | Name | Title | Pwr | L5 Pwr | Element | Role | Combat | Rarity | Traits |
|----|------|-------|-----|--------|---------|------|--------|--------|--------|
| `hera-starfall` | Hera Starfall | The Earthen Heart | 25 | 45 | earth | healer | melee | common | kindhearted, steadfast, oblivious |
| `caelan-featherfoot` | Caelan Featherfoot | The Quiet Edge | 25 | 45 | null | scout | melee | common | perceptive, artisan, secretive |
| `cedric-oakmont` | Cedric Oakmont | The Wayward Gale | 25 | 45 | air | ranger | ranged | common | brave, resourceful, forgetful |

**Set total:** L1 = 75 | L5 = 135

---

### Woodland Debt — `woodland-debt`

| ID | Name | Title | Pwr | L5 Pwr | Element | Role | Combat | Rarity | Traits |
|----|------|-------|-----|--------|---------|------|--------|--------|--------|
| `lysandra-silverleaf` | Lysandra Silverleaf | The White Witch | 50 | 70 | air | mage | magic | rare | wise, nurturing, reclusive |
| `kaelen-duskwalker` | Kaelen Duskwalker | The Royal Stride | 40 | 60 | water | ranger | ranged | uncommon | focused, honorbound, vindictive |
| `gall-ironbend` | Gall Ironbend | Shieldwall Gall | 40 | 60 | earth | tank | melee | uncommon | charismatic, stalwart, greedy |

**Set total:** L1 = 130 | L5 = 190

---

### Penitent Order — `penitent-order`

| ID | Name | Title | Pwr | L5 Pwr | Element | Role | Combat | Rarity | Traits |
|----|------|-------|-----|--------|---------|------|--------|--------|--------|
| `leona-stormrage` | Leona Stormrage | The Crimson Spark | 35 | 55 | fire | mage | magic | uncommon | prodigy, hotheaded |
| `sylas-duskwalker` | Sylas Duskwalker | The Penitent Shield | 50 | 70 | light | cleric | melee | rare | devout, protective, guiltridden |
| `freya` | Freya | The Reluctant Blade | 45 | 65 | dark | berserker | melee | rare | mighty, cowardly, eccentric |

**Set total:** L1 = 130 | L5 = 190

**Note:** Leona has only 2 traits (others have 3). Sylas and Kaelen share the Duskwalker surname — family lore hook.

---

### Glade Expedition — `glade-expedition`

| ID | Name | Title | Pwr | L5 Pwr | Element | Role | Combat | Rarity | Traits |
|----|------|-------|-----|--------|---------|------|--------|--------|--------|
| `morrigan-crow` | Morrigan Crow | The Blood Crow | 75 | 95 | null | scout | melee, ranged | epic | lethal, mercenary, distrustful |
| `odin-stormrage` | Odin Stormrage | The Azure Sage | 100 | 120 | wild | archmage | ranged | legendary | legendary, scholarly, scheming |
| `reinhart-den` | Reinhart Den | The Beast God | 90 | 110 | fire | berserker | melee | legendary | fearless, charismatic, battlehungry |

**Set total:** L1 = 265 | L5 = 325

**Note:** Odin's `wild` element counts as affinity on **every** elemental quest (+25% power on that card).

---

### Sun Scripture — `sun-scripture`

| ID | Name | Title | Pwr | L5 Pwr | Element | Role | Combat | Rarity | Traits |
|----|------|-------|-----|--------|---------|------|--------|--------|
| `elanor-lightbearer` | Elanor Lightbearer | The Hidden Lance | 30 | 50 | light | cleric | magic | uncommon | graceful, spearmaiden, sheltered |
| `fenric-valerand` | Fenric Valerand | The Faithless Shield | 45 | 65 | air | warrior | melee | rare | loyal, softspoken, faithless |
| `seraphina-aurora` | Seraphina Aurora | The Sun's Martyr | 30 | 50 | light | paladin | melee | rare | beloved, resolute, martyr |

**Set total:** L1 = 105 | L5 = 165

---

### Rarity Power Bands (L1 base)

| Rarity | Power range | Cards |
|--------|-------------|-------|
| Common | 25 | Hera, Caelan, Cedric |
| Uncommon | 30–40 | Leona (35), Kaelen (40), Gall (40), Elanor (30) |
| Rare | 30–50 | Lysandra (50), Sylas (50), Freya (45), Fenric (45), Seraphina (30) |
| Epic | 75 | Morrigan |
| Legendary | 90–100 | Reinhart (90), Odin (100) |

---

## 5. Power Output Tables

### Per-Card Power by Level

| Card | L1 | L2 | L3 | L4 | L5 |
|------|----|----|----|----|-----|
| Hera / Caelan / Cedric | 25 | 30 | 35 | 40 | 45 |
| Elanor / Seraphina | 30 | 35 | 40 | 45 | 50 |
| Leona | 35 | 40 | 45 | 50 | 55 |
| Kaelen / Gall | 40 | 45 | 50 | 55 | 60 |
| Freya | 45 | 50 | 55 | 60 | 65 |
| Fenric | 45 | 50 | 55 | 60 | 65 |
| Sylas / Lysandra | 50 | 55 | 60 | 65 | 70 |
| Morrigan | 75 | 80 | 85 | 90 | 95 |
| Reinhart | 90 | 95 | 100 | 105 | 110 |
| Odin | 100 | 105 | 110 | 115 | 120 |

### Top 2-Person Teams (L1 raw power)

| Team | Raw | Notes |
|------|-----|-------|
| Odin + Reinhart | 190 | Covers all long quests at 79%+ base (no mods) |
| Morrigan + Odin | 175 | |
| Morrigan + Reinhart | 165 | |
| Lysandra + Odin | 150 | |
| Sylas + Odin | 150 | |

### Top 3-Person Teams (L1 raw power)

| Team | Raw | Notes |
|------|-----|-------|
| Glade Expedition (full set) | 265 | +10% set synergy; crit on Glade Survey |
| Lysandra + Odin + Reinhart | 240 | |
| Sylas + Odin + Reinhart | 240 | |
| Freya + Odin + Reinhart | 235 | |

### Quest Power Requirements vs. Coverage

| Tier | Power req | Example quests | Achievable at L1? |
|------|-----------|------------------|-------------------|
| Trivial | 30 | Fever Herbs | Starter duo (167%) |
| Easy | 40–50 | Millstream Rats, Lost Sparrow | Starter duo (100–167%) |
| Moderate | 60–80 | Goblin Toll, Night Courier, Chapel Vigil, Ember Cellar | Needs 3rd starter or recruit |
| Hard (3-man) | 90–110 | Mire Lights, Windworn Ledge, Forge Haul | Needs recruited mid-tier team |
| Long (2-man) | 140 | Moonlit Parley | Needs top pair (Odin+Reinhart = 154%) |
| Long (3-man) | 160–240 | Envoy Road → Vault Wyrm | Needs legendaries or high-level mid-tier |

### Element Affinity Impact (example: 2× L1 cards, 50 raw each)

| Scenario | effPower | vs req 80 |
|----------|----------|-----------|
| No affinity | 100 | 125% |
| One card matches (+25%) | 113 | 141% |
| Both match (+25% each) | 125 | 156% |
| Odin (wild) on any element quest | 113 (62+50) | 141% |

### Modifier Swing Examples

| Mod combo | Net effect |
|-----------|------------|
| 1 advantage (+20%) | Often turns 80% → 100% |
| 1 hazard (−25%) | Often turns 100% → 75% |
| Advantage + hazard | Net −5% to +5% typical |
| Full set (+10%) + advantage (+20%) | +30% on top of base |
| Worst case: hazard −30% on 80% base | 50% success (still above 5% floor) |

---

## 6. Sets & Synergies

| Set ID | Name | Members | L1 total | L5 total | +10% synergy |
|--------|------|---------|----------|----------|--------------|
| `hearthbound` | Hearthbound | Hera, Caelan, Cedric | 75 | 135 | When all 3 dispatched |
| `woodland-debt` | Woodland Debt | Lysandra, Kaelen, Gall | 130 | 190 | When all 3 dispatched |
| `penitent-order` | Penitent Order | Leona, Sylas, Freya | 130 | 190 | When all 3 dispatched |
| `glade-expedition` | Glade Expedition | Morrigan, Odin, Reinhart | 265 | 325 | When all 3 dispatched |
| `sun-scripture` | Sun Scripture | Elanor, Fenric, Seraphina | 105 | 165 | When all 3 dispatched |

### Set-Specific Crit Quests (existing)

| Quest | Set crit | Bonus loot note |
|-------|----------|-----------------|
| The Envoy's Road | `sun-scripture` | Citadel opens every door |
| Survey of the Dark Glade | `glade-expedition` | Maps reach the war table |

---

## 7. Traits Reference (43)

Traits modify quest odds when any team member possesses them. **Good traits** appear as advantages on quests; **bad traits** appear as hazards.

### By Character (quick lookup)

| Character | Good traits | Bad traits |
|-----------|-------------|------------|
| Hera | kindhearted, steadfast | oblivious |
| Caelan | perceptive, artisan | secretive |
| Cedric | brave, resourceful | forgetful |
| Lysandra | wise, nurturing | reclusive |
| Kaelen | focused, honorbound | vindictive |
| Gall | charismatic, stalwart | greedy |
| Leona | prodigy | hotheaded |
| Sylas | devout, protective | guiltridden |
| Freya | mighty | cowardly, eccentric |
| Morrigan | lethal, mercenary | distrustful |
| Odin | legendary, scholarly | scheming |
| Reinhart | fearless, charismatic | battlehungry |
| Elanor | graceful, spearmaiden | sheltered |
| Fenric | loyal, softspoken | faithless |
| Seraphina | beloved, resolute | martyr |

### Traits Used in Current Quests

| Trait | Quests (advantage) | Quests (hazard) |
|-------|-------------------|-----------------|
| charismatic | Goblin Toll, Moonlit Parley | — |
| hotheaded | — | Goblin Toll, Sunken Reliquary |
| perceptive | Millstream Rats | — |
| cowardly | — | Millstream Rats, Mire Lights, Windworn Ledge, Glade Survey |
| devout | Chapel Vigil | — |
| faithless | — | Chapel Vigil |
| focused | Mire Lights | — |
| oblivious | — | Mire Lights |
| prodigy | Ember Cellar | — |
| greedy | — | Ember Cellar, Forge Haul |
| secretive | Night Courier | — |
| forgetful | — | Night Courier |
| brave | Windworn Ledge | — |
| nurturing | Fever Herbs | — |
| vindictive | — | Fever Herbs |
| stalwart | Forge Haul | — |
| kindhearted | Lost Sparrow | — |
| lethal | — | Lost Sparrow |
| graceful | Moonlit Parley | — |
| battlehungry | — | Moonlit Parley |
| loyal | Envoy Road | — |
| distrustful | — | Envoy Road |
| wise | Sunken Reliquary | — |
| fearless | Demon Watchfires | — |
| martyr | — | Demon Watchfires |
| legendary | Glade Survey | — |
| mighty | Vault Wyrm | — |
| eccentric | — | Vault Wyrm |

### Unused Traits (available for new quests)

`artisan`, `steadfast`, `reclusive`, `honorbound`, `protective`, `guiltridden`, `mercenary`, `scholarly`, `scheming`, `spearmaiden`, `sheltered`, `softspoken`, `beloved`, `resolute`

### Roles Used in Crit Conditions

| Role | Quest |
|------|-------|
| scout | Goblin Toll, Night Courier |
| cleric | Chapel Vigil |
| mage | Ember Cellar |
| healer | Fever Herbs |
| ranger | Lost Sparrow |
| tank | Forge Haul |
| paladin | Moonlit Parley |
| berserker | Demon Watchfires, Vault Wyrm |

**Unused roles in crits:** `warrior`, `archmage` — good hooks for character-specific quests (Fenric, Odin).

---

## 8. Quest Board (16 Templates)

### Short Quests (10)

| ID | Name | Dur | Elem | Pwr | Team | Gold | XP | Advantage | Hazard | Crit |
|----|------|-----|------|-----|------|------|-----|-----------|--------|------|
| `herb-run` | Fever Herbs Before Dark | 90s | — | 30 | 2 | 10 | 18 | nurturing +20% | vindictive −15% | role: healer |
| `millstream-rats` | Rats Under the Millstream | 1m | earth | 40 | 2 | 12 | 20 | perceptive +20% | cowardly −25% | elem: earth |
| `lost-sparrow` | The Lost Sparrow | 2m | — | 50 | 2 | 16 | 24 | kindhearted +20% | lethal −20% | role: ranger |
| `goblin-toll` | The Goblin King's Toll | 2m | — | 60 | 2 | 22 | 30 | charismatic +20% | hotheaded −25% | role: scout |
| `night-courier` | The Night Courier | 2m | dark | 60 | 2 | 24 | 30 | secretive +20% | forgetful −25% | role: scout |
| `chapel-vigil` | Vigil at the Broken Chapel | 3m | light | 70 | 2 | 26 | 34 | devout +20% | faithless −30% | role: cleric |
| `ember-cellar` | The Ember Cellar | 3m | fire | 80 | 2 | 30 | 36 | prodigy +20% | greedy −20% | role: mage |
| `mire-lights` | Lights Over the Mire | 4m | water | 90 | 3 | 34 | 40 | focused +15% | oblivious −20% | elem: water |
| `windworn-ledge` | The Windworn Ledge | 5m | air | 100 | 3 | 38 | 44 | brave +20% | cowardly −30% | elem: air |
| `forge-haul` | The Old Forge Haul | 4m | earth | 110 | 3 | 42 | 46 | stalwart +15% | greedy −20% | role: tank |

### Long Quests (6)

| ID | Name | Dur | Elem | Pwr | Team | Gold | XP | Advantages | Hazard | Crit |
|----|------|-----|------|-----|------|-----|-----|------------|--------|------|
| `parley-moon` | Moonlit Parley | 1h | air | 140 | 2 | 80 | 80 | charismatic +20%, graceful +15% | battlehungry −30% | role: paladin |
| `envoy-road` | The Envoy's Road | 1.5h | light | 160 | 3 | 95 | 90 | loyal +15%, devout +15% | distrustful −25% | set: sun-scripture |
| `sunken-reliquary` | The Sunken Reliquary | 2h | water | 180 | 3 | 110 | 100 | wise +20% | hotheaded −25% | elem: water |
| `demon-watchfires` | The Demon Watchfires | 2.5h | fire | 200 | 3 | 130 | 110 | fearless +20% | martyr −20% | role: berserker |
| `glade-survey` | Survey of the Dark Glade | 3h | dark | 220 | 3 | 150 | 130 | legendary +20%, lethal +15% | cowardly −30% | set: glade-expedition |
| `vault-wyrm` | Wyrm of the Deep Vault | 3h | earth | 240 | 3 | 170 | 140 | mighty +20% | eccentric −15% | role: berserker |

### Reward Bands

| Category | Gold | XP | Duration |
|----------|------|-----|----------|
| Short low | 10–16 | 18–24 | 90s–2m |
| Short mid | 22–30 | 30–36 | 2–3m |
| Short high | 34–42 | 40–46 | 4–5m |
| Long | 80–170 | 80–140 | 1–3h |

---

## 9. Quest Design Guide

### Quest Template Schema (`src/data/quests.ts`)

```typescript
{
  id: string,
  name: string,
  flavor: string,
  durationMs: number,
  long?: boolean,           // long quest = 2 tokens on crit
  element: ElementId | null,
  power: number,            // team power requirement
  teamSize: 2 | 3,
  advantages: [{ type: "trait"|"role", id: string, pct: number }],
  hazards: [{ type: "trait"|"role", id: string, pct: number }],
  crit?: { type: "element"|"role"|"set", id: string, note: string },
  gold: number,
  xp: number,
}
```

### Recommended Power Targets

Design quests so intended teams land at **85–110% base** before modifiers:

| Player stage | Typical 2-man eff | Typical 3-man eff | Suggested power range |
|--------------|-------------------|-------------------|-----------------------|
| Early (starters L1–3) | 50–70 | 75–105 | 30–70 (short only) |
| Mid (1–2 recruits L1) | 80–120 | 120–160 | 60–100 (short), 140 (long 2-man) |
| Late (legends L1) | 150–190 | 240–290 | 160–220 (long) |
| Endgame (legends L5) | 170–230 | 300–350 | 220–280 (long cap) |

### Modifier Budget

| Modifier | Typical range in existing quests |
|----------|----------------------------------|
| Single advantage | +15% to +20% |
| Single hazard | −15% to −30% |
| Dual advantage (long) | +15% + +15% or +20% + +15% |
| Full set synergy | +10% (automatic, not in template) |

**Design rule:** Trait matchup should swing outcomes by ~15–30%. Power requirement handles raw scaling; traits handle flavor and team composition rewards.

### Character-Specific Quest Ideas (schema extensions)

The current system has **no per-card quest requirements**, but you can simulate character quests via:

1. **Trait/role crit** tied to one character's unique combo (e.g. `spearmaiden` advantage — only Elanor)
2. **Set crit** for narrative arcs (already used for Sun Scripture, Glade Expedition)
3. **Element + role pairing** that only one character satisfies (e.g. light + cleric = Sylas or Elanor)
4. **Future:** add `requires?: string[]` (card IDs) or `requiresAny?: string[]` to quest template

### Level System Extension Ideas

Current: levels 1–5, +5 power/level, XP from quests and dupes.

| Extension | Implementation hook |
|-----------|---------------------|
| Level cap raise | Change `MAX_LEVEL` in `formulas.ts` |
| Per-level unlock | Add `unlocksAtLevel` to card template |
| Branch upgrades | Blacksmith-style per card (see legacy system) |
| Lore milestones | Journal entries at levels 3, 5 |
| Character quest chains | Unlock at level 3; reward unique trait swap |

---

## 10. Character Lore Hooks for New Quests

Extended lore lives in `src/data/lore.ts`. Below: narrative hooks mapped to mechanics.

### Hearthbound

| Character | Lore thread | Quest hook ideas |
|-----------|-------------|------------------|
| **Hera** | Goblin raid orphan; Rubus the sparrow; oblivious to Cedric | Sparrow rescue (exists); goblin remnant hunt; Rubus leads to hidden cache (crit: kindhearted) |
| **Caelan** | Shadow scout; sewing/pottery; knows Cedric's secret | Infiltration courier; mend supplies under siege (artisan +20%); expose a secret that hurts the party (secretive hazard) |
| **Cedric** | Air ranger; forgetful; loves Hera | Wind rescue (exists); lost love letter delivery (forgetful hazard); prove himself to Hera (brave + resourceful) |

**Chain idea:** 3-part Hearthbound arc unlocking at full-set dispatch → reveals goblin raid truth.

### Woodland Debt

| Character | Lore thread | Quest hook ideas |
|-----------|-------------|------------------|
| **Lysandra** | White Witch; raised Kaelen; reclusive | Defend sacred grove; research anomaly (wise); forced social parley (reclusive hazard) |
| **Kaelen** | Missing father; vindictive; honorbound debt to Gall | Investigation quest; confront stepmother's agent; debt repayment escort (honorbound crit) |
| **Gall** | Dwarf vaults; saved Kaelen; greedy mercenary | Vault wyrm (exists); demon distraction tank (stalwart); loot temptation (greedy hazard) |

**Chain idea:** Kaelen father-search long quest → requires Woodland Debt set → unlocks lore journal entry.

### Penitent Order

| Character | Lore thread | Quest hook ideas |
|-----------|-------------|------------------|
| **Leona** | Fire prodigy age 14; Odin's great-granddaughter; stutters around Sylas | Orphan discipline gone wrong; fire containment (prodigy); anger at injustice (hotheaded hazard) |
| **Sylas** | Bishop; guilt over sister; protective of orphans | Orphan rescue; chapel vigil (exists); guilt paralysis (guiltridden hazard) |
| **Freya** | Dark berserker; cowardly; Sylas watches her | Demon defense proving worth; flee-or-fight dilemma (cowardly hazard); eccentric behavior sabotage |

**Chain idea:** Sylas sister revelation — multi-day quest, guiltridden hazard unless Leona present (protective advantage).

### Glade Expedition

| Character | Lore thread | Quest hook ideas |
|-----------|-------------|------------------|
| **Morrigan** | Blood Crow assassin; forced by royal decree; partner Rin imprisoned | Assassination contract vs. rescue; distrustful hazard; lethal advantage |
| **Odin** | 166yo archmage; demon army consolidation; scheming | Scholarly recon (scholarly +20%); wild magic survey; scheming hazard (hides intel) |
| **Reinhart** | Beast God; seeks Azoth Sharpedge rematch | Arena challenge; demon horde charge (fearless); battlehungry ruins parley |

**Chain idea:** Find Azoth Sharpedge → character-specific long quest for Reinhart → crit: role warrior (Azoth).

### Sun Scripture

| Character | Lore thread | Quest hook ideas |
|-----------|-------------|------------------|
| **Elanor** | Hidden spearmaiden; sheltered; Seraphina's aide | Secret sparring exposed; envoy combat (spearmaiden + graceful); sheltered hazard on rough road |
| **Fenric** | Faithless mercenary; loyal to Seraphina; Chimera survivor | Bodyguard duty; faithless hazard on holy ground; loyal advantage on escort |
| **Seraphina** | Martyr; burned lifespan; demon king intel | Final journey escort (exists); martyr hazard (self-sacrifice risk); beloved rallies towns |

**Chain idea:** Deliver demon king weakness — sequential long quests requiring Sun Scripture set at each stage.

### Cross-Family Hooks

| Relationship | Quest potential |
|--------------|-----------------|
| Odin ↔ Leona | Stormrage legacy training (wild + fire) |
| Sylas ↔ Kaelen | Duskwalker siblings (separated) reunion quest |
| Morrigan ↔ Rin Blackheart | Rescue/imprisonment arc (Rin art exists, no card yet) |
| Reinhart ↔ Azoth | Rivalry duel (Azoth art exists, no card yet) |
| Fenric ↔ Elanor | Spear training mission; softspoken + spearmaiden |

---

## 11. Unimplemented Assets & Future Characters

Portrait art exists in `src/Assets/cards/` but **no card data** yet:

| Asset file | Likely character | Lore connection |
|------------|------------------|-----------------|
| `azoth_sharpedge.jpg` | Azoth Sharpedge | Reinhart's rival (half-beastfolk warrior) |
| `rin_blackheart.jpg` | Rin Blackheart | Morrigan's imprisoned partner |
| `alastor_blackheart.jpg` | Alastor Blackheart | Blackheart family |
| `samara_blackheart.jpg` | Samara Blackheart | Blackheart family |
| `bran_bloodseeker.jpg` | Bran Bloodseeker | Unknown |
| `corvus_grim.jpg` | Corvus Grim | Unknown (Corvus ≈ crow — Morrigan link?) |
| `eamon_stoneseeker.jpg` | Eamon Stoneseeker | Unknown |
| `marpha.jpg` | Marpha | Unknown |
| `yvaine_ashcroft.jpg` | Yvaine Ashcroft | Unknown |
| `aurora_starling.jpg` | Aurora Starling | Starling surname (Odin family?) |
| `zephyr_starling.jpg` | Zephyr Starling | Starling surname |

**Suggested power placement for new legends:**

| Tier | Base power | Rarity |
|------|------------|--------|
| Story NPC / mid recruit | 35–55 | uncommon–rare |
| Rival / boss ally | 70–85 | epic |
| Mythic figure | 90–110 | legendary |

---

## 12. Legacy System (Not Wired)

The repo contains an **older adventurer/location/equipment** loop in `src/game/engine.ts` and UI components (`Blacksmith`, `Church`, `Crossroads`, `Tavern`) that is **not connected** to the active card bounty game. It references missing files (`adventurers.ts`, `roles.ts`) and missing formula functions.

If revived, it adds:

- **9 expedition locations** (Whispering Woods → Throne of Cinders) with unlock-after-10-clears
- **22 equipment pieces** across 7 slots with craft/temper/scrap
- **Company-wide loadout** affecting time, success, loot, recruit, equipment drop rates
- **Injury/healing** loop via Church
- **Adventurer dupe-based leveling** via Tavern

See `src/data/locations.ts` and `src/data/equipment.ts` for full data if integrating equipment upgrades into the card system.

---

## Quick Reference: Type Definitions

```typescript
ElementId = "fire" | "water" | "earth" | "air" | "light" | "dark" | "null" | "wild"
RoleId = "healer" | "scout" | "ranger" | "mage" | "tank" | "cleric" | "berserker" | "archmage" | "warrior" | "paladin"
CombatId = "melee" | "ranged" | "magic"
Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary"
```

---

*Document version: matches save version 12, 15 cards, 16 quest templates, 43 traits.*
