# Wayfarer's Hearth — Game Design Reference

> Read this before changing cards, traits, quests, or balance. It is the session handoff for both humans and the agent.
>
> **Code truth:** `src/data/cards.ts`, `src/data/traits.ts`, `src/data/sets.ts`, `src/data/quests.ts`, `src/data/lore.ts`, `src/game/formulas.ts`, `src/game/quests.ts`
>
> **Writer truth:** `c:\Users\daeva\Desktop\lores.xlsx` (outside the repo). Columns: `name | title | element | role | power | combat | lore`. Sets of **3** are separated by a repeated header row.
>
> **Repo:** https://github.com/Daevanion/wayfarers-hearth — save key `wayfarers-hearth-board-v1`, **SAVE_VERSION 12**. Adding cards does **not** require a version bump. Bump only if `GameState` shape changes.
>
> After any roster or quest change, **update this document** (counts, tables, unused-trait list) so the next session starts accurate.

---

## 0. Session Handoff (read first)

### What the live game is

A **daily bounty board**. Dispatch owned cards to timed quests, roll 1–100 against a success %, earn gold / tokens / XP, recruit from the Tavern. The 10-night town season is gone. Legacy Crossroads / Blacksmith / Church / `engine.ts` are **not wired** — do not revive them unless asked.

### What the player sees

- Full-bleed swaying `town3.jpg` plaza
- Bottom bounty dock (HUD can toggle `questBoardOpen`)
- HUD: Gold, Tokens, Tavern, Collection, Full catalogue, Quest Board icon (`questboard_icon.png`)
- Collection = owned company (element / role / status filters)
- Catalogue = all cards, owned or not (All / Set views)
- Click a card in Collection or Catalogue → full dossier (Excel lore + highlighted elements/traits + titled stats)
- Hover 1.5s on dossier art → full-size visual zoom (dim only; zoom 1× / 1.25× / 1.5×)
- Opening draw: **Hearthbound trio** (Hera, Caelan, Cedric)
- BGM: `src/Assets/sfx/thepire.mp3` then `src/Assets/sfx/troves.mp3`, looping

### File map (content work)

| Concern | File |
|---------|------|
| Card stats / flavor / set membership | `src/data/cards.ts` |
| Full Excel lore text | `src/data/lore.ts` |
| Portrait imports | `src/data/portraits.ts` + `src/Assets/cards/*.jpg` |
| Sets of 3 | `src/data/sets.ts` |
| Trait definitions | `src/data/traits.ts` |
| Lore keyword highlights | `src/components/LoreText.tsx` (`ELEMENT_ALIASES`, `TRAIT_ALIASES`) |
| Quest pool | `src/data/quests.ts` |
| Success math, board, packs | `src/game/quests.ts` |
| XP / power per level | `src/game/formulas.ts` |
| Icons (element / combat) | `src/data/icons.ts` + `src/Assets/bg/{fire,water,earth,air,light,dark,melee,ranged,magic}.png` |
| This snapshot | `docs/game-design-reference.md` |

### Hard rules

- Roster is **Excel-driven**. Do not invent playable cards for leftover art unless the sheet has a row.
- Sets are **always 3**. A new trio = new `SetDef` + three `CardTemplate`s.
- Traits: **2–4 per card**, at least one **negative** if the lore has a flaw. Reuse existing trait IDs before creating new ones.
- `wild` matches **every** quest element (Odin). `null` matches none.
- Combat can be multiple (`morrigan-crow` is melee + ranged).
- Special IDs: `freya` (file `freya.jpg`, not `freya_icewalker`); `kaelen-duskwalker` even if the sheet says “kaelen duskwalk”; `serilla` (file `serilla.jpg`).
- Voice: gold/blue/parchment, medieval, no modern slang.
- Do not commit or push unless the user asks.

---

## Table of Contents

0. [Session Handoff](#0-session-handoff-read-first)
1. [Active Game Loop](#1-active-game-loop)
2. [Core Formulas](#2-core-formulas)
3. [Progression & Economy](#3-progression--economy)
4. [Full Roster (21 Cards)](#4-full-roster-21-cards)
5. [Power Output Tables](#5-power-output-tables)
6. [Sets & Synergies](#6-sets--synergies)
7. [Traits Reference (47)](#7-traits-reference-47)
8. [Quest Board (18 Templates)](#8-quest-board-18-templates)
9. [Quest Design Guide](#9-quest-design-guide)
10. [Character Lore Hooks for New Quests](#10-character-lore-hooks-for-new-quests)
11. [Unimplemented Assets & Future Characters](#11-unimplemented-assets--future-characters)
12. [Legacy System (Not Wired)](#12-legacy-system-not-wired)
13. [Character Intake Pipeline](#13-character-intake-pipeline)

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
| Daily quests | 4 short + 2 long (random from 18 templates) |

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

## 4. Full Roster (21 Cards)

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

### Forge Kin — `forge-kin`

| ID | Name | Title | Pwr | L5 Pwr | Element | Role | Combat | Rarity | Traits |
|----|------|-------|-----|--------|---------|------|--------|--------|--------|
| `alden-hollowgarth` | Alden Hollowgarth | The Anvil's Tide | 30 | 50 | water | cleric | magic | uncommon | artisan, protective, overprotective |
| `eamon-stoneseeker` | Eamon Stoneseeker | Lightfoot Thunder | 35 | 55 | air | scout | melee | uncommon | charismatic, mercenary, cowardly |
| `yvaine-ashcroft` | Yvaine Ashcroft | The Iron Sight | 25 | 45 | null | ranger | ranged | common | perceptive, artisan, sheltered |

**Set total:** L1 = 90 | L5 = 150

---

### Moonlight Scripture — `moonlight-scripture`

| ID | Name | Title | Pwr | L5 Pwr | Element | Role | Combat | Rarity | Traits |
|----|------|-------|-----|--------|---------|------|--------|--------|--------|
| `aurora-starling` | Aurora Starling | The Umbral Smile | 70 | 90 | dark | mage | magic | epic | lethal, graceful, intolerant |
| `corvus-grim` | Corvus Grim | The Azure Prince | 65 | 85 | light | paladin | melee | epic | devout, focused, arrogant |
| `serilla` | Serilla | The Living Artifact | 75 | 95 | null | berserker | melee | epic | mighty, fearless, sheltered, hollow |

**Set total:** L1 = 210 | L5 = 270

**Note:** Serilla has 4 traits. `serilla` is a single-name id (same pattern as `freya`).

---

### Rarity Power Bands (L1 base)

| Rarity | Power range | Cards |
|--------|-------------|-------|
| Common | 25 | Hera, Caelan, Cedric, Yvaine |
| Uncommon | 30–40 | Leona (35), Kaelen (40), Gall (40), Elanor (30), Alden (30), Eamon (35) |
| Rare | 30–50 | Lysandra (50), Sylas (50), Freya (45), Fenric (45), Seraphina (30) |
| Epic | 65–75 | Corvus (65), Aurora (70), Morrigan (75), Serilla (75) |
| Legendary | 90–100 | Reinhart (90), Odin (100) |

---

## 5. Power Output Tables

### Per-Card Power by Level

| Card | L1 | L2 | L3 | L4 | L5 |
|------|----|----|----|----|-----|
| Hera / Caelan / Cedric / Yvaine | 25 | 30 | 35 | 40 | 45 |
| Elanor / Seraphina / Alden | 30 | 35 | 40 | 45 | 50 |
| Leona / Eamon | 35 | 40 | 45 | 50 | 55 |
| Kaelen / Gall | 40 | 45 | 50 | 55 | 60 |
| Freya | 45 | 50 | 55 | 60 | 65 |
| Fenric | 45 | 50 | 55 | 60 | 65 |
| Sylas / Lysandra | 50 | 55 | 60 | 65 | 70 |
| Morrigan / Serilla | 75 | 80 | 85 | 90 | 95 |
| Reinhart | 90 | 95 | 100 | 105 | 110 |
| Odin | 100 | 105 | 110 | 115 | 120 |
| Corvus | 65 | 70 | 75 | 80 | 85 |
| Aurora | 70 | 75 | 80 | 85 | 90 |

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
| Moonlight Scripture (full set) | 210 | +10% set synergy; crit on Moonlight Retrieval |
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
| `forge-kin` | Forge Kin | Alden, Eamon, Yvaine | 90 | 150 | When all 3 dispatched |
| `moonlight-scripture` | Moonlight Scripture | Aurora, Corvus, Serilla | 210 | 270 | When all 3 dispatched |

### Set-Specific Crit Quests (existing)

| Quest | Set crit | Bonus loot note |
|-------|----------|-----------------|
| The Envoy's Road | `sun-scripture` | Citadel opens every door |
| Survey of the Dark Glade | `glade-expedition` | Maps reach the war table |
| The Quenched Commission | `forge-kin` | Kin of the anvil restore the maker's mark |
| The Moonlight Retrieval | `moonlight-scripture` | The artifact leaves with them |

---

## 7. Traits Reference (47)

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
| Alden | artisan, protective | overprotective |
| Eamon | charismatic, mercenary | cowardly |
| Yvaine | perceptive, artisan | sheltered |
| Aurora | lethal, graceful | intolerant |
| Corvus | devout, focused | arrogant |
| Serilla | mighty, fearless | sheltered, hollow |

### Traits Used in Current Quests

| Trait | Quests (advantage) | Quests (hazard) |
|-------|-------------------|-----------------|
| charismatic | Goblin Toll, Moonlit Parley | — |
| mercenary | Goblin Toll | — |
| hotheaded | — | Goblin Toll, Sunken Reliquary |
| perceptive | Millstream Rats | — |
| cowardly | — | Millstream Rats, Mire Lights, Windworn Ledge, Glade Survey |
| sheltered | — | Windworn Ledge |
| devout | Chapel Vigil | — |
| faithless | — | Chapel Vigil |
| focused | Mire Lights, Moonlight Retrieval | — |
| oblivious | — | Mire Lights |
| prodigy | Ember Cellar | — |
| greedy | — | Ember Cellar, Forge Haul |
| secretive | Night Courier | — |
| forgetful | — | Night Courier |
| brave | Windworn Ledge | — |
| nurturing | Fever Herbs | — |
| vindictive | — | Fever Herbs |
| stalwart | Forge Haul | — |
| artisan | Quenched Commission | — |
| protective | Quenched Commission | — |
| overprotective | — | Quenched Commission |
| kindhearted | Lost Sparrow | — |
| lethal | Glade Survey, Moonlight Retrieval | Lost Sparrow |
| graceful | Moonlit Parley | — |
| battlehungry | — | Moonlit Parley |
| arrogant | — | Moonlit Parley |
| loyal | Envoy Road | — |
| distrustful | — | Envoy Road |
| wise | Sunken Reliquary | — |
| fearless | Demon Watchfires | — |
| martyr | — | Demon Watchfires |
| legendary | Glade Survey | — |
| mighty | Vault Wyrm | — |
| eccentric | — | Vault Wyrm |
| intolerant | — | Moonlight Retrieval |
| hollow | — | Moonlight Retrieval |

### Unused Traits (available for new quests)

`steadfast`, `reclusive`, `honorbound`, `guiltridden`, `scholarly`, `scheming`, `spearmaiden`, `softspoken`, `beloved`, `resolute`

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

## 8. Quest Board (18 Templates)

### Short Quests (11)

| ID | Name | Dur | Elem | Pwr | Team | Gold | XP | Advantage | Hazard | Crit |
|----|------|-----|------|-----|------|------|-----|-----------|--------|------|
| `herb-run` | Fever Herbs Before Dark | 90s | — | 30 | 2 | 10 | 18 | nurturing +20% | vindictive −15% | role: healer |
| `millstream-rats` | Rats Under the Millstream | 1m | earth | 40 | 2 | 12 | 20 | perceptive +20% | cowardly −25% | elem: earth |
| `lost-sparrow` | The Lost Sparrow | 2m | — | 50 | 2 | 16 | 24 | kindhearted +20% | lethal −20% | role: ranger |
| `goblin-toll` | The Goblin King's Toll | 2m | — | 60 | 2 | 22 | 30 | charismatic +20%, mercenary +15% | hotheaded −25% | role: scout |
| `night-courier` | The Night Courier | 2m | dark | 60 | 2 | 24 | 30 | secretive +20% | forgetful −25% | role: scout |
| `chapel-vigil` | Vigil at the Broken Chapel | 3m | light | 70 | 2 | 26 | 34 | devout +20% | faithless −30% | role: cleric |
| `quenched-commission` | The Quenched Commission | 3m | earth | 70 | 2 | 26 | 34 | artisan +20%, protective +15% | overprotective −20% | set: forge-kin |
| `ember-cellar` | The Ember Cellar | 3m | fire | 80 | 2 | 30 | 36 | prodigy +20% | greedy −20% | role: mage |
| `mire-lights` | Lights Over the Mire | 4m | water | 90 | 3 | 34 | 40 | focused +15% | oblivious −20% | elem: water |
| `windworn-ledge` | The Windworn Ledge | 5m | air | 100 | 3 | 38 | 44 | brave +20% | cowardly −30%, sheltered −15% | elem: air |
| `forge-haul` | The Old Forge Haul | 4m | earth | 110 | 3 | 42 | 46 | stalwart +15% | greedy −20% | role: tank |

### Long Quests (7)

| ID | Name | Dur | Elem | Pwr | Team | Gold | XP | Advantages | Hazard | Crit |
|----|------|-----|------|-----|------|-----|-----|------------|--------|------|
| `parley-moon` | Moonlit Parley | 1h | air | 140 | 2 | 80 | 80 | charismatic +20%, graceful +15% | battlehungry −30%, arrogant −15% | role: paladin |
| `envoy-road` | The Envoy's Road | 1.5h | light | 160 | 3 | 95 | 90 | loyal +15%, devout +15% | distrustful −25% | set: sun-scripture |
| `sunken-reliquary` | The Sunken Reliquary | 2h | water | 180 | 3 | 110 | 100 | wise +20% | hotheaded −25% | elem: water |
| `demon-watchfires` | The Demon Watchfires | 2.5h | fire | 200 | 3 | 130 | 110 | fearless +20% | martyr −20% | role: berserker |
| `glade-survey` | Survey of the Dark Glade | 3h | dark | 220 | 3 | 150 | 130 | legendary +20%, lethal +15% | cowardly −30% | set: glade-expedition |
| `moonlight-retrieval` | The Moonlight Retrieval | 2.5h | dark | 200 | 3 | 130 | 110 | focused +15%, lethal +15% | intolerant −25%, hollow −15% | set: moonlight-scripture |
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

### Forge Kin

| Character | Lore thread | Quest hook ideas |
|-----------|-------------|------------------|
| **Alden** | Obsolete master smith; newborn; overprotective of Yvaine | Quenched commission (exists); water blessing of a cracked anvil; freeze when Yvaine is at risk (overprotective hazard) |
| **Eamon** | Safest village jobs; coin first; chasing Yvaine | Toll negotiation (mercenary); tavern debt collection; flee a real fight (cowardly hazard) |
| **Yvaine** | Null ranger; smith's apprentice; timid seriousness | Sight the road for her uncle (perceptive); first real cliff (sheltered hazard); enchant a heirloom (artisan crit) |

**Chain idea:** Restore Hollowgarth's maker's mark — three commissions, last one requires the full Forge Kin set.

### Moonlight Scripture

| Character | Lore thread | Quest hook ideas |
|-----------|-------------|------------------|
| **Aurora** | Dark Glade commander; smile in slaughter; hates non-humans | Glade retrieval (exists); refuse an elven guide (intolerant hazard); aristocratic parley (graceful) |
| **Corvus** | Azure Prince; scythe named for Samara; doubts Serilla | Classified infiltration; royal arrogance at a treaty (arrogant hazard); keep the girl on task (focused) |
| **Serilla** | Crypt-raised living weapon; no emotion | Vault smash (mighty); miss a human cue (hollow hazard); first sky she has ever seen (sheltered) |

**Chain idea:** Retrieve the lost artifact — set crit already on Moonlight Retrieval; a follow-up could reveal what the church buried.

### Cross-Family Hooks

| Relationship | Quest potential |
|--------------|-----------------|
| Odin ↔ Leona | Stormrage legacy training (wild + fire) |
| Sylas ↔ Kaelen | Duskwalker siblings (separated) reunion quest |
| Morrigan ↔ Rin Blackheart | Rescue/imprisonment arc (Rin art exists, no card yet) |
| Reinhart ↔ Azoth | Rivalry duel (Azoth art exists, no card yet) |
| Fenric ↔ Elanor | Spear training mission; softspoken + spearmaiden |
| Alden ↔ Yvaine | Uncle's last honest commission (artisan) |
| Corvus ↔ Serilla | What the crypts made, and whether it can be unmade |
| Aurora ↔ Lysandra | An elven emissary at a human encampment (intolerant hazard) |

---

## 11. Unimplemented Assets & Future Characters

Portrait art exists in `src/Assets/cards/` but **no card data** yet (no Excel row — do not invent):

| Asset file | Likely character | Lore connection |
|------------|------------------|-----------------|
| `azoth_sharpedge.jpg` | Azoth Sharpedge | Reinhart's rival (half-beastfolk warrior) |
| `rin_blackheart.jpg` | Rin Blackheart | Morrigan's imprisoned partner |
| `alastor_blackheart.jpg` | Alastor Blackheart | Blackheart family |
| `samara_blackheart.jpg` | Samara Blackheart | Named in Corvus's lore (demon calamity) |
| `bran_bloodseeker.jpg` | Bran Bloodseeker | Unknown |
| `elowen_wolfcrag.jpg` | Elowen Wolfcrag | Unknown |
| `evander_wolfcrag.jpg` | Evander Wolfcrag | Unknown |
| `eva_hearthgale.jpg` | Eva Hearthgale | Unknown |
| `leander_hearthkeep.jpg` | Leander Hearthkeep | Unknown |
| `rowena_windmere.jpg` | Rowena Windmere | Unknown |
| `marpha.jpg` | Marpha | Unknown |
| `zephyr_starling.jpg` | Zephyr Starling | Starling surname (Aurora family?) |

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

## 13. Character Intake Pipeline

Use this every time `lores.xlsx` gains a trio (or a lone row that belongs to an existing set). Do the steps in order. Do not skip the balance pass.

### Step 1 — Read the sheet

Path: `c:\Users\daeva\Desktop\lores.xlsx` (not in git). Dump with Python/`openpyxl`. Skip rows where `name` is `name` or empty. Treat each contiguous 3-character block as one set.

| Column | Maps to |
|--------|---------|
| `name` | `CardTemplate.name`; id = kebab-case (`Hera Starfall` → `hera-starfall`). Exceptions: `freya`, `kaelen-duskwalker` |
| `title` | `CardTemplate.title` |
| `element` | lowercase `ElementId`. Sheet values: Fire, Water, Earth, Air, Light, Dark, Null / No, Wild |
| `role` | lowercase `RoleId`. Sheet “ArachMage” / “Arch Mage” → `archmage`. “Tank” / “Warrior” stay distinct (`gall` is tank, `fenric` is warrior) |
| `power` | integer base power (L1) |
| `combat` | split on `/` or `and`; lowercase → `CombatId[]` (`Melee/Ranged` → `["melee","ranged"]`). Magic icon is `magic.png` |
| `lore` | full text → `src/data/lore.ts`. Short 1–2 sentence `flavor` on the card is a distillation of that lore, not a replacement |

Portrait file: `src/Assets/cards/{id with underscores}.jpg`. If the art is missing, stop and ask — do not ship a card with no portrait.

### Step 2 — Extract 2–4 traits from lore

Think in the three design buckets, then store them as the existing `good`/`bad` flags:

| Bucket | What to look for | Mechanical job |
|--------|------------------|----------------|
| Origin / faction | elf, church, beastfolk, dwarf, orphan, assassin | Where they thrive (element already covers biome; traits cover social/place) |
| Profession | how they solve problems | Often already the `role`; extra profession quirks become traits (`artisan`, `spearmaiden`, `scholarly`) |
| Quirk | the puzzle piece | Usually the **negative** + a distinctive positive |

**Rules**

1. Prefer **reusing** an id from [§7](#7-traits-reference-43). Same concept, same id (`cowardly`, not `skittish`).
2. Every card should have **at least one negative** if the lore names a flaw. Leona is the only 2-trait card (`prodigy` / `hotheaded`) — that is allowed when the lore is that tight.
3. New trait: kebab-case `id`, Title Case `name`, `good: boolean`, one-line `blurb` in the game's voice.
4. Add highlight aliases in `LoreText.tsx` `TRAIT_ALIASES` so the dossier marks the lore words (not only the trait label).
5. After a new trait exists, either wire it as an advantage/hazard on a quest **in this same change**, or list it under Unused Traits in §7 so the next quest pass can use it.

### Step 3 — Place power and rarity

Keep L1 power on the sheet unless it breaks bands. If the sheet is blank, use:

| Rarity | L1 power | Use for |
|--------|----------|---------|
| common | 25 | Starters / first-town |
| uncommon | 30–40 | Mid recruits |
| rare | 30–50 | Named specialists |
| epic | 70–85 | Rival / assassin tier |
| legendary | 90–110 | Mythic figures |

Rarity is **not** on the sheet — infer from power + lore weight (Odin 100 = legendary, Hera 25 = common). Set L1 total for a new trio should sit near an existing band (Hearthbound 75, Forge Kin 90, Sun Scripture 105, Woodland/Penitent 130, Moonlight 210, Glade 265).

### Step 4 — Register the card (checklist)

- [ ] `src/data/portraits.ts` — import + `PORTRAITS` key
- [ ] `src/data/cards.ts` — full `CardTemplate` (accent hex, flavor, traits, setId)
- [ ] `src/data/sets.ts` — new trio **or** add id to `members` if joining an existing set (still max 3 unless the user changes the rule)
- [ ] `src/data/traits.ts` — only new ids
- [ ] `src/data/lore.ts` — paste Excel lore; fix curly apostrophes to ASCII
- [ ] `src/components/LoreText.tsx` — aliases for new trait/element phrases
- [ ] Catalogue/Collection pick up `CARDS` / `SETS` automatically — no extra UI wiring
- [ ] If this is a **new starter**, change `STARTER_IDS` and OpeningDraw fan poses (currently 3 cards)

### Step 5 — Adjust quests and power balance

After the roster changes, run this pass (do not ship cards without it):

1. **Starter safety.** Hearthbound L1 (75 raw / 50 for a duo) must still clear Fever Herbs and Lost Sparrow, and still struggle on longs. Do not lower long-quest power just because a new legendary exists.
2. **New-set coverage.** Compute L1 set total vs long quests (140–240). A 130-power set should need levels or a borrowed legend for Vault Wyrm; a 265 set should trivialise most longs — that is Glade's job, do not clone it.
3. **Trait spotlight.** Add **0–2 quests** (or retune existing advantages/hazards) so each new unique trait appears at least once. Prefer the Unused Traits list in §7.
4. **Crit hook.** One new crit of type `role`, `element`, or `set` that only this trio naturally hits (see Envoy's Road / Glade Survey).
5. **Reward bands.** Stay inside §8 gold/XP tables. Short 10–42 gold; long 80–170.
6. **Power targets.** Intended team at **85–110% base** before modifiers ([§9](#9-quest-design-guide)).
7. **Refresh this file:** roster tables, set totals, unused traits, quest tables, footer counts.

### Step 6 — Verify

```
npx tsc --noEmit
```

Then in the running app: Catalogue All + Set views, click-dossier lore highlights, dispatch a short quest with a new trait showing in the live % footer.

---

## Quick Reference: Type Definitions

```typescript
ElementId = "fire" | "water" | "earth" | "air" | "light" | "dark" | "null" | "wild"
RoleId = "healer" | "scout" | "ranger" | "mage" | "tank" | "cleric" | "berserker" | "archmage" | "warrior" | "paladin"
CombatId = "melee" | "ranged" | "magic"
Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary"
```

---

*Document version: save v12, 21 cards, 7 sets of 3, 18 quest templates, 47 traits. Update the counts in this line whenever they change.*
