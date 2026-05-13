---
publish: true
title: Ship Combat
created: 2026-05-12
modified: 2026-05-12
tags:
  - mechanics
  - reference
  - rule
  - ships
---

# Ship Combat

> Expands the **2024 DMG vehicle rules**. Ship movement, chases, and ramming use the DMG as written. This page covers guns specifically: how to operate them, what they do, and how broadsides work.

---

## Operating a Single Gun

Each gun requires a **crew of three** to operate efficiently: one to aim and fire, two to load, ram, and swab. A gun can be operated by fewer, but:

- **2 crew:** reload takes twice as long (add 1 round to the reload time)
- **1 crew:** reload takes three times as long; attack rolls made at disadvantage

**To fire a gun:**

1. Aim and fire: costs 1 action
2. Reload: costs 1 action (light guns) or 2 actions (heavy guns) — see the Gun Classes table

A **PC acting as Gunner** (filling the Gunner crew role) may direct up to their proficiency bonus in gun crews simultaneously. Each directed crew fires using the PC's Dexterity modifier + proficiency bonus on the attack roll.

**Attack:** Ranged attack roll against the target vessel's Hull AC.
**Hit:** Roll damage as listed. **Miss:** No damage.
**Critical Hit:** Roll damage twice and take the higher result, unless a special facility specifies maximum damage.

---

## Gun Classes

| Gun | Damage | Range | Reload | Notes |
|---|---|---|---|---|
| **Swivel Gun** | 2d6 piercing | 100/400 ft | 1 action | Anti-crew only; fires grapeshot. Cannot damage hull. |
| **12-lb Long Cannon** | 4d10 bludgeoning | 600/2,400 ft | 1 action | Versatile; standard upper-deck and chaser gun |
| **24-lb Long Cannon** | 6d10 bludgeoning | 500/2,000 ft | 2 actions | Primary fleet gun; balance of range and damage |
| **32-lb Long Cannon** | 8d10 bludgeoning | 400/1,600 ft | 2 actions | Maximum hull damage; slow to reload |
| **Heavy Carronade** | 10d10 bludgeoning | 150/600 ft | 1 action | Short range only; devastating at close quarters |
| **12-lb Chaser** | 4d10 bludgeoning | 600/2,400 ft | 1 action | Fixed forward or aft arc; same profile as 12-lb cannon |

**Light guns** (swivel, 12-lb cannon, carronade, chaser): reload 1 action.
**Heavy guns** (24-lb, 32-lb cannon): reload 2 actions.

---

## Shot Types

All guns fire **round shot** by default. Specialist shot must be loaded in advance (replaces the reload action) or prepared by the Gunner's Magazine / Grand Magazine facility.

| Shot Type | Effect | Restrictions |
|---|---|---|
| **Round Shot** | Standard damage to Hull Points | Default; all guns |
| **Chain Shot** | Half damage to hull; target's speed reduced by 10 miles/day (cumulative) until repaired | 12-lb and larger; not carronades |
| **Grapeshot** | No hull damage; all exposed crew on deck make DC 14 Dexterity save or take 3d6 piercing | Range 150 ft maximum; replaces round shot |
| **Bar Shot** | No hull damage; on hit (AC +3), target mast is damaged — speed halved; on a second hit, speed 0 until repaired | 12-lb and larger; attack at disadvantage |
| **Heated Shot** | Standard hull damage; target ship must succeed on a DC 12 Constitution save (Carpenter's check) or catch fire (1d10 fire damage per round until extinguished) | Requires Grand Magazine or 1 hour preparation; not carronades |

**Speed damage** from chain and bar shot stacks. A vessel reduced to 0 speed is dead in the water — it can't maneuver but can still fire. A Carpenter can attempt repairs at sea: DC 14 Intelligence (Carpenter's Tools), restoring 10 miles/day per success, requiring 4 hours of work.

---

## Broadside Volley (Ship Action)

Rather than individual crew firing guns one at a time, a disciplined gun deck can fire simultaneously as a **broadside volley**. This is the ship's action for the round — not a PC action.

**Requirements:**

- Gunner crew role filled (PC or hireling)
- Crew at or above minimum

**Procedure:**

1. The Gunner nominates one gun deck and one side (port or starboard)
2. Roll one attack: the Gunner's Dexterity modifier + proficiency bonus vs target Hull AC
3. On a hit: deal the combined damage of all guns on that deck and side
4. On a miss: deal half damage (the volley is ragged but not empty)
5. All guns on that deck and side must now reload before they can fire again

**Broadside damage by deck (full complement):**

| Deck | Guns per Side | Gun Type | Hit Damage | Miss Damage |
|---|---|---|---|---|
| Lower Gun Deck | 15 | 32-lb Long Cannon | 15 × 8d10 | half |
| Main Gun Deck | 14 | 24-lb Long Cannon | 14 × 6d10 | half |
| Upper Gun Deck | 15 | 12-lb Long Cannon | 15 × 4d10 | half |
| Spar Deck | 8 | 12-lb Long Cannon | 8 × 4d10 | half |

_These numbers represent full gun deck complements. Reduce proportionally for partially crewed decks or guns out of action._

---

## Multi-Deck Broadside (Tier 4 — First-Rate Only)

A first-rate ship of the line can fire all three gun decks simultaneously — the **full broadside**. This is the signature capability of the [[HCS-Sovereign|HCS *Sovereign*]] and what makes it unlike anything else in the Scatter.

**Requirements:**

- Tier 4 vessel
- All three gun decks crewed at full gun crew complement
- Gunner crew role filled by a PC or Master Gunner hireling
- All three decks loaded (not in reload)

**Procedure:**

1. Declare a full broadside targeting one vessel on one side
2. Roll one attack per deck (three total) using the Gunner's modifier
3. Each deck resolves its damage independently (hit = full, miss = half)
4. All three decks must reload — the ship cannot fire a full broadside again for 3 rounds

**Effect:** A full broadside from the _Sovereign_ delivers up to 44 dice of damage in a single round. Against a Tier 3 vessel (390 HP), the average full broadside (approximately 242 damage) reduces it to 0 in a single action. The _Sovereign_ does not fight Tier 3 ships. It ends them.

---

## Targeting

By default, cannon fire targets the **hull** (Hull Points). Gunners may instead call their shot:

| Target | Attack Modifier | Effect on Hit |
|---|---|---|
| **Hull** | +0 | Standard Hull Point damage |
| **Rigging** | −2 | Speed reduced 10 miles/day per hit; chain shot is more effective |
| **Crew (deck)** | −4 | 1d4 crew killed per hit; use grapeshot instead for area effect |
| **Mast** | −4 | Mast damaged on hit; requires Carpenter's repair (DC 14, 4 hours) |
| **Powder Magazine** | −6 | On hit: target ship makes DC 16 save or magazine detonates (catastrophic hull damage) |

Magazine shots are the most dangerous gambit in ship-to-ship combat. Most captains order their magazines flooded rather than risk it. The _Sovereign_ positions its Grand Magazine below the waterline precisely to make this shot impossible from the broadside arc.

---

## Crew Casualties in Combat

When a vessel takes a broadside hit, the GM may rule that deck crew are affected:

- Every 50 Hull Point damage in a single round: 1d4 crew casualties (dead or incapacitated)
- A grapeshot hit on an exposed deck: DC 14 Dex save for all crew present or take 3d6 piercing
- Below minimum crew: all ship checks at disadvantage; speed reduced 20%
- Below half minimum crew: ship cannot fire broadsides; individual gun operation only

PCs on deck during a broadside are targeted individually if the GM calls a called shot at crew, or may be caught in a grapeshot area. PCs below decks during a broadside are not directly targeted but take 1d10 bludgeoning damage from hull shock on a failed DC 12 Constitution save when the ship takes 100+ damage in a round.

---

## Tier 4 Considerations

A Tier 4 ship cannot be matched in direct exchange by any lower tier. The only practical counters are:

- **Fire ships** — unmanned burning vessels sailed into the Tier 4 ship's path; requires crew to board and redirect, or risk fire spreading to the magazine
- **Shallow water** — a first-rate draws 25+ feet; much of the Scatter is inaccessible to it
- **Fast pursuit** — the _Sovereign_ cannot catch a Tier 1 or 2 vessel running before the wind; it can only intercept
- **Multiple fast targets** — a broadside hits one target; a squadron of six sloops presents a different problem than one frigate

When the _Sovereign_ is an enemy, it is not a combat encounter. It is a situation.

---

## Related

- [[Ship-Stats]] — Tier table, crew roles, minimum crew by tier
- [[Ship-Operations]] — Upkeep, travel, navigation
- [[Ship-Upgrades]] — Magical enhancements including Arcane Artillery
- [[HCS-Sovereign]] — The _Sovereign_ stat block and special facilities
