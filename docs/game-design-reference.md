# Wayfarer's Hearth — Game Design Reference

> Read this before changing cards, traits, quests, or balance. It is the session handoff for both humans and the agent.
>
> **Code truth:** `src/data/cards.ts`, `src/data/traits.ts`, `src/data/sets.ts`, `src/data/quests.ts`, `src/data/lore.ts`, `src/game/formulas.ts`, `src/game/quests.ts`
>
> **Writer truth:** `c:\Users\daeva\Desktop\lores.xlsx` (outside the repo). Columns: `name | title | element | role | power | combat | lore`. Sets of **3** are separated by a repeated header row.
>
> **Repo:** https://github.com/Daevanion/wayfarers-hearth — save key `wayfarers-hearth-board-v1`, **SAVE_VERSION 13**. Adding cards does **not** require a version bump. Bump if `GameState` shape or daily board template IDs change (old boards would fade).
>
> After any roster or quest change, **update this document** (counts, tables, unused-trait list) so the next session starts accurate.

---

## 0. Session Handoff (read first)

### What the live game is

A **daily bounty board**. Dispatch owned cards to timed quests, roll 1–100 against a success %, earn gold / tokens / XP, recruit from the Tavern. The 10-night town season is gone. Legacy Crossroads / Blacksmith / Church / `engine.ts` are **not wired** — do not revive them unless asked.

### What the player sees

- Full-bleed swaying `town3.jpg` plaza; Tavern swaps to swaying `tavern3.jpg`, Collection to swaying `collection_bg.jpg`, both under a light dim
- HUD menu buttons (Tavern / Collection / Full catalogue) are thin-lined, slightly transparent plaques, set below the resource strip
- Quest Board icon (`questboard_icon.png`) swaps the plaza to swaying `questboard_bg2.jpg` and lists available / in-progress / completed bounties. “Today’s bounties” is hidden while the board is open
- Quest entries sit on `quest_page_1.png` parchment with the quest painting and bounty copy on top. The board painting does not sway. Click an open bounty to open assignment (`quest_click.mp3`). Cards glow by tier (Low white, Mid green, High orange, Extreme red, World purple miasma). Completed cards grey-green with “Quest Complete”; in-progress cards show the time mark. Returned bounties tap to resolve.
- Companies on the road appear as a **left-hand progress rail** (art, name, timer bar). Click for a full-view of the quest art with the assigned party.
- Dispatch loadout uses the quest painting as the header with time, power needed, team size, and favor on it, large advantage/hazard/crit panels, All/Set plus element/role/combat filters, and a zoomed Choose/Remove card.
- HUD: Gold, Tokens, Tavern, Collection, Full catalogue
- Collection = owned company (All / Set views plus element / role / status filters), framed like the catalogue
- Catalogue = all cards, owned or not (All / Set views)
- Click a card in Collection or Catalogue → full dossier (Excel lore + highlighted elements/traits + titled stats)
- Hover 1.5s on dossier art → full-size visual zoom (dim only; zoom 1× / 1.25× / 1.5×)
- Opening draw: **Hearthbound trio** (Hera, Caelan, Cedric)
- Visual novel: arrival scene (Hera / Cedric idle sprites, parchment box). Sprites stand on the bottom edge of the game display. Triggered from Settings for now; 2s lock before a line can be skipped
- Tavern pack: fade in `pack_open3.mp4` and wait until the clip finishes, then a white fade to a sealed card on blurred `tavern3.jpg`. Name, title, and traits fade in after the click. 1s later, Back to Tavern / Go to Collection (opens that card’s dossier)
- BGM: `src/Assets/sfx/thepire.mp3` then `src/Assets/sfx/whispering_elven_woods.mp3`, looping

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
8. [Quest Board (48 Templates)](#8-quest-board-48-templates)
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
| Daily quests | 7: 3 Low + 2 Mid + 1 High + 1 Extreme (from 48 templates) |

### Limits

| Rule | Value |
|------|-------|
| Max card level | 5 |
| Team size | Range per quest: Low 1–3, Mid 2–3, High 3–4, Extreme 4 |
| Parallel quests | Unlimited (different cards) |
| Roster cap | None |
| Card rest (win) | `duration × 0.5` |
| Card rest (fail) | `duration × 2` |
| Busy cards | Cannot dispatch while on an active quest |
| Exhausted cards | Cannot dispatch until `exhaustedUntil` passes |

### Daily Board

- Refreshes at local midnight (underway quests persist)
- Deterministic RNG seeded by date (`YYYY-MM-DD`)
- Draws **3 Low, 2 Mid, 1 High, 1 Extreme** (`DAILY_BY_TIER`). World pool is empty.
- UI: single illustrated card with prev/next; Open and Returned are clickable

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
| Crit | `quest.gold` | 1 Low/Mid, 2 High, 3 Extreme | `quest.xp` | `duration × 0.5` |
| Fail | 0 | 0 | `max(1, round(xp × 0.25))` | `duration × 2` |

**Crit-match bonus:** `gold × 1.5` when team satisfies crit condition AND quest is won.

---

## 3. Progression & Economy

### Gold Sources

- Quest success/crit: 14–280 gold per template
- Crit-match multiplier: ×1.5

### Gold Sinks

- Road pack (random card): **60 gold**

### Tokens

- Earned on **crit rolls only**: 1 (Low/Mid), 2 (High), 3 (Extreme)
- Spent on Sealed Letter pack (prefers unowned cards): **1 token**

### Duplicate XP (pack pulls)

| Pack type | Duplicate XP |
|-----------|--------------|
| Gold pack | +40 XP |
| Token pack | +80 XP |

### Rough Progression Pace

- Average daily XP per card (if on all 7 quests): ~120–364 XP depending on assignments
- Solo card to max level (~700 XP): ~2–6 days of active play
- Starting gold (30) covers **0** road packs; first pack needs ~2–3 Low quest wins

### Starter Team Reality (L1, no mods)

Low quests are 1–3 seats. Mid/High/Extreme need more power (and High/Extreme more seats) than the opening trio can supply.

| Quest | Power req | Hera + Caelan (50) | Hearthbound trio (75) |
|-------|-----------|--------------------|-----------------------|
| Marsh Sage Before Dark | 40 | 125% ✓ | 187% ✓ |
| The Named Raider | 55 | 91% (risky) | 136% ✓ |
| Hold the Merchant Road | 60 | 83% (risky) | 125% ✓ |
| The Rogue Greatwolf | 70 | 71% (risky) | 107% ✓ |
| The Windworn Boy | 75 | 67% (risky) | 100% ✓ |

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
| Odin + Reinhart | 190 | Covers Mid at L1; High needs a third (or levels); Extreme is 4-seat |
| Morrigan + Odin | 175 | |
| Morrigan + Reinhart | 165 | |
| Lysandra + Odin | 150 | |
| Sylas + Odin | 150 | |

### Top 3-Person Teams (L1 raw power)

| Team | Raw | Notes |
|------|-----|-------|
| Glade Expedition (full set) | 265 | +10% set synergy; still shy of Extreme 350+ without a fourth |
| Moonlight Scripture (full set) | 210 | +10% set synergy; crit on Moonlight Retrieval |
| Lysandra + Odin + Reinhart | 240 | |
| Sylas + Odin + Reinhart | 240 | |
| Freya + Odin + Reinhart | 235 | |

### Quest Power Requirements vs. Coverage

| Tier | Power req | Example quests | Achievable at L1? |
|------|-----------|------------------|-------------------|
| Low | 40–75 | Marsh Sage, Named Raider, Windworn Boy | Starter duo/trio; top Low is a coin-flip for the trio |
| Mid | 110–160 | Quenched Commission, Moonlit Parley, Lesser Demon | Recruits or a legend pair |
| High | 210–260 | Envoy's Road, Demon Watchfires, Necromancer | 3–4 including a Glade-tier name |
| Extreme | 350–420 | Glade Survey, Calamity Samara | Four seats; Glade set + a fourth, or leveled legends |

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
| arrogant | — | Moonlit Parley, The Pale Labyrinth |
| artisan | Iron from the Hill Forge, The Quenched Commission | — |
| battlehungry | — | The East Palisade, Moonlit Parley, The Infiltration Path |
| beloved | The False Saint | Find the Unholy Impostor |
| brave | The Named Raider, The Windworn Boy | — |
| charismatic | The Bridge Gang, Moonlit Parley | — |
| cowardly | — | The Rogue Greatwolf, Wolves at the Fold, The Windworn Boy, Vermin Under the Mill, The Mountain Troll, Corruption at the Glade's Edge, The Blood-Debt Duel, Subjugate Calamity: Samara, Survey of the Dark Glade |
| devout | Watch at the Broken Chapel, Drive the Barrow Wights, The Envoy's Road | — |
| distrustful | — | Infiltrate the Brotherhood, The Envoy's Road, Whereabouts of General Alastor |
| eccentric | — | Wyrm of the Deep Vault |
| faithless | — | Watch at the Broken Chapel, A Lesser Demon, The Desecrated Nave |
| fearless | A Lesser Demon, The Demon Watchfires | — |
| focused | The Fen Herders, The East Palisade, Lights Over the Mire, Corruption at the Glade's Edge, The Moonlight Retrieval, Whereabouts of General Alastor | — |
| forgetful | — | Eyes on the Brotherhood, The Night Letter, Frosthollow Pass |
| graceful | Moonlit Parley | — |
| greedy | — | Hold the Merchant Road, Cutpurses of the Old Road, Iron from the Hill Forge, Scour the Goblin Den, The Ember Nest, Tide in the Drowned Keep, Retake the Adamant Mines |
| guiltridden | — | The Necromancer of Caldara |
| hollow | — | Drive the Barrow Wights, The Moonlight Retrieval |
| honorbound | Blood on the Caravan, The Blood-Debt Duel | — |
| hotheaded | — | The Named Raider, The Bridge Gang, The Sunken Reliquary |
| intolerant | — | The Moonlight Retrieval |
| legendary | Subjugate Calamity: Samara, Survey of the Dark Glade | — |
| lethal | The Thing in the Cellar-Keep, The Moonlight Retrieval, The Infiltration Path, Survey of the Dark Glade | — |
| loyal | The Envoy's Road | — |
| martyr | — | The Demon Watchfires |
| mighty | Scour the Goblin Den, The Mountain Troll, Retake the Adamant Mines, Wyrm of the Deep Vault | — |
| nurturing | Marsh Sage Before Dark, Purify the Miasma Wood | — |
| oblivious | — | The Fen Herders, Mark the Barrow Stones, Lights Over the Mire |
| overprotective | — | The Quenched Commission |
| perceptive | The Rogue Greatwolf, Cutpurses of the Old Road, Vermin Under the Mill, Find the Unholy Impostor | — |
| prodigy | The Ember Nest | — |
| protective | The Quenched Commission | — |
| reclusive | — | Purify the Miasma Wood |
| resolute | The Desecrated Nave, Frosthollow Pass | — |
| scheming | Infiltrate the Brotherhood | The False Saint |
| scholarly | The Necromancer of Caldara | — |
| secretive | Eyes on the Brotherhood, The Night Letter, Infiltrate the Brotherhood, The Infiltration Path | — |
| sheltered | — | The Windworn Boy, The Thing in the Cellar-Keep |
| softspoken | — | Break the Holdfast |
| stalwart | Hold the Merchant Road, Break the Holdfast, Tide in the Drowned Keep | — |
| steadfast | Wolves at the Fold | — |
| vindictive | — | Marsh Sage Before Dark, Blood on the Caravan |
| wise | Mark the Barrow Stones, The Sunken Reliquary, The Pale Labyrinth | — |

### Unused Traits (available for new quests)

`kindhearted`, `mercenary`, `resourceful`, `spearmaiden`

### Roles Used in Crit Conditions

| Role | Quest |
|------|-------|
| archmage | The Necromancer of Caldara, Subjugate Calamity: Samara, The Pale Labyrinth |
| berserker | Scour the Goblin Den, The Mountain Troll, The Demon Watchfires, Wyrm of the Deep Vault |
| cleric | Watch at the Broken Chapel, A Lesser Demon, Drive the Barrow Wights, The False Saint, Find the Unholy Impostor |
| healer | Marsh Sage Before Dark |
| mage | The Ember Nest |
| paladin | Moonlit Parley, The Desecrated Nave, The Thing in the Cellar-Keep |
| ranger | Wolves at the Fold, The East Palisade, Mark the Barrow Stones, Blood on the Caravan, Corruption at the Glade's Edge, Whereabouts of General Alastor |
| scout | The Named Raider, Eyes on the Brotherhood, The Bridge Gang, The Night Letter, Infiltrate the Brotherhood, The Infiltration Path |
| tank | Hold the Merchant Road, Iron from the Hill Forge, Retake the Adamant Mines |
| warrior | Break the Holdfast, The Blood-Debt Duel |

**Unused roles in crits:** none — every combat role has at least one crit hook.

---

## 8. Quest Board (48 Templates)

Pool in `src/data/quests.ts`. Each template has `flavor` (card hook), `lore` (2–4 sentences in dispatch), `tier`, `teamMin`/`teamMax`, `art`. **Named Raider** uses `goblinquest_bg.jpg`. All others cycle Whispering Woods / Old King's Road / Mirefen / Ruins of Caldara.

World tier is typed; **zero templates** until prerequisites are specified. Character-specific locks are **not wired**.

Samara / Alastor appear in Extreme quest fiction only — no playable cards.

### Low — 16 (seats 1–3, power 40–75, 90s–8m)

| ID | Name | Elem | Pwr | Gold | XP | Crit |
|----|------|------|-----|------|-----|------|
| `named-raider` | The Named Raider | — | 55 | 24 | 32 | scout |
| `brotherhood-whispers` | Eyes on the Brotherhood | dark | 50 | 22 | 30 | scout · `brotherhood_quest1.jpg` |
| `rogue-greatwolf` | The Rogue Greatwolf | earth | 70 | 32 | 42 | earth |
| `merchant-road` | Hold the Merchant Road | — | 60 | 28 | 36 | tank |
| `marsh-sage` | Marsh Sage Before Dark | water | 40 | 14 | 20 | healer |
| `bridge-gang` | The Bridge Gang | — | 65 | 30 | 38 | scout |
| `wolves-at-fold` | Wolves at the Fold | earth | 45 | 18 | 24 | ranger |
| `chapel-watch` | Watch at the Broken Chapel | light | 50 | 22 | 30 | cleric |
| `night-letter` | The Night Letter | dark | 55 | 24 | 30 | scout |
| `kings-cutpurses` | Cutpurses of the Old Road | air | 50 | 20 | 28 | air |
| `fen-herders` | The Fen Herders | water | 60 | 26 | 34 | water |
| `hill-forge` | Iron from the Hill Forge | earth | 70 | 34 | 42 | tank |
| `windworn-boy` | The Windworn Boy | air | 75 | 36 | 44 | air |
| `mill-vermin` | Vermin Under the Mill | earth | 40 | 16 | 22 | earth |
| `east-palisade` | The East Palisade | fire | 65 | 28 | 36 | ranger |
| `barrow-marks` | Mark the Barrow Stones | — | 45 | 18 | 26 | ranger |

### Mid — 12 (seats 2–3, power 110–160, 12–40m)

| ID | Name | Elem | Pwr | Gold | XP | Crit |
|----|------|------|-----|------|-----|------|
| `goblin-den` | Scour the Goblin Den | earth | 130 | 70 | 72 | berserker |
| `brotherhood-infiltrate` | Infiltrate the Brotherhood | dark | 140 | 78 | 80 | scout |
| `mountain-troll` | The Mountain Troll | earth | 150 | 85 | 88 | berserker |
| `lesser-demon` | A Lesser Demon | fire | 160 | 92 | 94 | cleric |
| `mire-lights` | Lights Over the Mire | water | 120 | 62 | 64 | water |
| `ember-nest` | The Ember Nest | fire | 125 | 66 | 68 | mage |
| `bandit-holdfast` | Break the Holdfast | — | 115 | 58 | 60 | warrior |
| `barrow-wights` | Drive the Barrow Wights | dark | 145 | 80 | 82 | cleric |
| `quenched-commission` | The Quenched Commission | earth | 110 | 55 | 58 | **set: forge-kin** |
| `beastfolk-parley` | Moonlit Parley | air | 140 | 75 | 78 | paladin |
| `chapel-desecration` | The Desecrated Nave | light | 135 | 72 | 74 | paladin |
| `caravan-blood` | Blood on the Caravan | — | 120 | 64 | 66 | ranger · `caravan.jpg` |

### High — 12 (seats 3–4, power 210–260, 50m–2h)

| ID | Name | Elem | Pwr | Gold | XP | Crit |
|----|------|------|-----|------|-----|------|
| `vampire-hunt` | The Thing in the Cellar-Keep | dark | 240 | 150 | 128 | paladin |
| `necromancer` | The Necromancer of Caldara | dark | 260 | 165 | 140 | archmage |
| `miasma-wood` | Purify the Miasma Wood | earth | 220 | 130 | 112 | earth |
| `glade-corruption` | Corruption at the Glade's Edge | dark | 250 | 155 | 132 | ranger |
| `demon-watchfires` | The Demon Watchfires | fire | 230 | 145 | 122 | berserker |
| `envoy-road` | The Envoy's Road | light | 210 | 125 | 108 | **set: sun-scripture** |
| `sunken-reliquary` | The Sunken Reliquary | water | 220 | 140 | 118 | water |
| `moonlight-retrieval` | The Moonlight Retrieval | dark | 240 | 150 | 128 | **set: moonlight-scripture** |
| `frost-pass` | Frosthollow Pass | air | 230 | 142 | 120 | air |
| `false-saint` | The False Saint | light | 250 | 158 | 134 | cleric |
| `blood-debt` | The Blood-Debt Duel | fire | 235 | 148 | 124 | warrior |
| `drowned-keep` | Tide in the Drowned Keep | water | 255 | 170 | 145 | water |

### Extreme — 8 (seats 4, power 350–420, 2.5–4h)

| ID | Name | Elem | Pwr | Gold | XP | Crit |
|----|------|------|-----|------|-----|------|
| `calamity-samara` | Subjugate Calamity: Samara | dark | 420 | 270 | 220 | archmage |
| `adamant-mines` | Retake the Adamant Mines | earth | 380 | 240 | 200 | tank |
| `unholy-impostor` | Find the Unholy Impostor | light | 360 | 225 | 185 | cleric |
| `glade-path` | The Infiltration Path | dark | 400 | 255 | 210 | scout |
| `general-alastor` | Whereabouts of General Alastor | fire | 390 | 250 | 205 | ranger |
| `vault-wyrm` | Wyrm of the Deep Vault | earth | 370 | 235 | 195 | berserker |
| `glade-survey` | Survey of the Dark Glade | dark | 350 | 220 | 180 | **set: glade-expedition** |
| `pale-labyrinth` | The Pale Labyrinth | — | 410 | 265 | 225 | archmage |

### Reward Bands

| Tier | Gold | XP | Duration | Crit tokens |
|------|------|-----|----------|-------------|
| Low | 14–36 | 20–44 | 90s–8m | 1 |
| Mid | 55–92 | 58–94 | 12–40m | 1 |
| High | 125–170 | 108–145 | 50m–2h | 2 |
| Extreme | 220–270 | 180–225 | 2.5–4h | 3 |

---

## 9. Quest Design Guide

### Quest Template Schema (`src/data/quests.ts`)

```typescript
{
  id: string,
  name: string,
  flavor: string,            // card hook
  lore: string,              // 2–4 sentence mini-lore
  durationMs: number,
  tier: "low" | "mid" | "high" | "extreme" | "world",
  element: ElementId | null,
  power: number,
  teamMin: number,
  teamMax: number,
  art: string,               // imported image URL
  advantages: [{ type: "trait"|"role", id: string, pct: number }],
  hazards: [{ type: "trait"|"role", id: string, pct: number }],
  crit?: { type: "element"|"role"|"set", id: string, note: string },
  gold: number,
  xp: number,
}
```

Crit tokens: Low/Mid **1**, High **2**, Extreme **3**. Dispatch accepts any team size in `[teamMin, teamMax]`.

### Recommended Power Targets

Design quests so intended teams land at **85–110% base** before modifiers:

| Tier | Seats | Suggested power | Typical party |
|------|-------|-----------------|---------------|
| Low | 1–3 | 40–90 | Starters / one recruit |
| Mid | 2–3 | 110–180 | Mid-roster L1 |
| High | 3–4 | 200–300 | Recruits + a legend |
| Extreme | 4 | 340–450 | Glade-tier or leveled mid |
| World | TBD | TBD | Prerequisite chain |

### Modifier Budget

| Modifier | Typical range |
|----------|----------------|
| Single advantage | +15% to +20% |
| Single hazard | −15% to −30% |
| Dual advantage | +15% + +15% or +20% + +15% |
| Full set synergy | +10% (automatic, not in template) |

**Design rule:** Trait matchup should swing outcomes by ~15–30%. Power requirement handles raw scaling; traits handle flavor and team composition rewards.

### Character-Specific Quest Ideas (not wired)

Seat ranges (`teamMin`/`teamMax`) are the current "character slots." Later: `requires?: string[]` / `requiresAny?: string[]` on the template. Until then, use trait/role/set crits.

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
| **Hera** | Goblin raid orphan; Rubus the sparrow; oblivious to Cedric | Named Raider (exists); sparrow rescue still unused (`kindhearted`); Rubus leads to hidden cache |
| **Caelan** | Shadow scout; sewing/pottery; knows Cedric's secret | Infiltration courier; mend supplies under siege (artisan +20%); expose a secret that hurts the party (secretive hazard) |
| **Cedric** | Air ranger; forgetful; loves Hera | Windworn Boy (exists); lost love letter delivery (forgetful hazard); prove himself to Hera (brave + resourceful) |

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

1. **Starter safety.** Hearthbound L1 (75 raw / 50 for a duo) must still clear Low 40–55, and still fail Mid/High/Extreme on power and seats. Do not lower Extreme power just because a new legendary exists.
2. **New-set coverage.** Compute L1 set total vs Mid (110–160) and High (210–260). A 130-power set should need levels or a borrowed legend for High; Extreme is 4-seat and 350+. Do not clone Glade's 265 band.
3. **Trait spotlight.** Add **0–2 quests** (or retune existing advantages/hazards) so each new unique trait appears at least once. Prefer the Unused Traits list in §7.
4. **Crit hook.** One new crit of type `role`, `element`, or `set` that only this trio naturally hits (see Envoy's Road / Glade Survey).
5. **Reward bands.** Stay inside §8 gold/XP tables. Low 14–36; Mid 55–92; High 125–170; Extreme 220–270.
6. **Power targets.** Intended team at **85–110% base** before modifiers ([§9](#9-quest-design-guide)).
7. **Refresh this file:** roster tables, set totals, unused traits, quest tables, footer counts.

### Step 6 — Verify

```
npx tsc --noEmit
```

Then in the running app: Catalogue All + Set views, click-dossier lore highlights, dispatch a Low quest with a new trait showing in the live % footer.

---

## Quick Reference: Type Definitions

```typescript
ElementId = "fire" | "water" | "earth" | "air" | "light" | "dark" | "null" | "wild"
RoleId = "healer" | "scout" | "ranger" | "mage" | "tank" | "cleric" | "berserker" | "archmage" | "warrior" | "paladin"
CombatId = "melee" | "ranged" | "magic"
Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary"
```

---

*Document version: save v13, 21 cards, 7 sets of 3, 48 quest templates, 47 traits. Update the counts in this line whenever they change.*
