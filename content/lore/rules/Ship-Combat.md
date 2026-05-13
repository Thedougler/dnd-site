---
publish: true
title: Ship Combat
created: 2026-05-12
modified: 2026-05-13
tags:
  - mechanics
  - reference
  - rule
  - ships
---

# Ship Combat

> Expands the **2024 DMG vehicle rules**. Ship movement, chases, and ramming use the DMG as written. This page covers guns specifically: how to operate them, what they do, and how broadsides work.

---

## Gun Crew Requirements

Each gun requires a **crew of three** to operate at full efficiency: one to aim and fire, two to load, ram, and swab.

| Crew | Effect |
|---|---|
| 3 (full) | Fires and reloads normally. Counts as a **fully crewed gun** for damage. |
| 2 | Reload takes twice as long (+1 round). Counts as **half a gun** for damage (round down total). |
| 1 | Reload takes three times as long. Counts as **half a gun**; attack made at disadvantage if firing independently. |
| 0 | Gun cannot fire. |

**Attack:** Ranged attack roll against the target vessel's Hull AC.
**Hit:** Roll damage as listed per gun. **Miss:** Half damage.
**Critical Hit:** Roll damage twice and take the higher result.

---

## Gunner Actions

A PC filling the **Gunner** role takes one **ship action** per round. Choose one:

### Salvo

Direct all manned guns on one side of the ship to fire simultaneously.

1. Choose **port** or **starboard**
2. Roll **one attack:** Dexterity modifier + proficiency bonus vs target Hull AC
   - Roll with **advantage** if there is one Gunner (PC or Master Gunner hireling) assigned per gun deck
3. On a **hit:** total damage = sum of all fully crewed guns on that side at full dice; half-crewed guns contribute half their dice (round down)
4. On a **miss:** deal half of whatever the hit total would have been
5. All guns that fired must **reload** before contributing to another Salvo

### Aimed Shot

Direct a single gun crew to fire at a specific target location instead of the hull. Uses the Targeting table (called shot modifiers apply). The Gunner makes the attack roll using their normal modifier. This consumes both the Gunner's ship action and that gun crew's action for the round.

### Reload — All Guns

Order all gun crews to reload simultaneously. Light guns reload in 1 round; heavy guns in 2 rounds. Guns reload in parallel — the Gunner issues this as a single ship action.

---

## Gun Classes

Each gun type has a single die. A Salvo rolls one die per fully crewed gun of that type on the chosen side.

| Gun | Die | Range | Reload | Notes |
|---|---|---|---|---|
| **Swivel Gun** | d6 | 100/400 ft | 1 action | Anti-crew only; cannot damage hull. |
| **12-lb Long Cannon** | d8 | 600/2,400 ft | 1 action | Standard upper-deck and chaser gun. |
| **24-lb Long Cannon** | d10 | 500/2,000 ft | 2 actions | Primary fleet gun; balance of range and damage. |
| **32-lb Long Cannon** | d12 | 400/1,600 ft | 2 actions | Maximum hull damage; slow to reload. |
| **Heavy Carronade** | d12 | 150/600 ft | 1 action | Short range only; devastating at close quarters. |
| **12-lb Chaser** | d8 | 600/2,400 ft | 1 action | Fixed forward or aft arc; same profile as 12-lb cannon. |

**Light guns** (swivel, 12-lb cannon, carronade, chaser): reload 1 action.
**Heavy guns** (24-lb, 32-lb cannon): reload 2 actions.

---

## Shot Types

All guns fire **round shot** by default. To load alternate shot, a gun crew uses its **reload action** to load the alternate type instead of standard ball — it fires on the next Salvo or Aimed Shot. Heated shot requires a Grand Magazine facility or 1 hour of preparation.

Each shot type uses the same dice pool (X = fully crewed guns, d\[Y] = that gun's die) but changes what the dice mean.

| Shot | Attack | Hit Effect | Miss Effect | Restrictions |
|---|---|---|---|---|
| **Round Shot** | — | Xd\[Y] hull damage | Half hull damage | Default; all guns |
| **Chain Shot** | −2 | Xd\[Y] speed loss (miles/day); no hull damage | Half speed loss | 12-lb+; not carronades |
| **Grapeshot** | — | All exposed crew: DC 14 Dex or incapacitated; PCs take Xd6 (save for half) | PCs: save with advantage | Range 150 ft max; all guns |
| **Bar Shot** | −4 | Mast struck: speed halved. Second hit same mast: speed 0 | No effect | 12-lb+; Aimed Shot only |
| **Heated Shot** | — | Xd\[Y] hull damage; ship saves DC 12 or catches fire | Half hull damage; no fire | Not carronades; requires prep |
| **Incendiary Shot** | — | Half Xd\[Y] hull damage; fire starts automatically — d\[Y] fire/round, +d\[Y] per additional incendiary hit | Half hull damage; fire starts at d\[Y]/2 per round | Not carronades; specialist ammo |

### Shot Type Notes

**Chain Shot — Speed Loss:** Speed loss stacks. A vessel at 0 speed is dead in the water — cannot maneuver, can still fight. Repair: DC 14 Intelligence (Carpenter's Tools), 4 hours, restores speed equal to half the dice rolled.

**Grapeshot — Crew:** Exposed crew = anyone on open deck above or at rail height. PCs aware of incoming grapeshot can move below deck as a Reaction. Grapeshot die is always **d6** regardless of gun caliber. Regular crew with 10 HP or fewer are incapacitated on a failed save.

**Bar Shot — Mast:** Bar shot is too precise for a Salvo — always fires as an **Aimed Shot** (single gun, Gunner's ship action). If a second bar shot hits the same mast, that mast comes down. Repair: DC 14 Carpenter's Tools, 4 hours.

**Heated Shot — Fire:** Fire starts on a failed DC 12 save. Spreads each round until a crew member uses an action to fight it (DC 10 Strength) or the Carpenter takes a full action (DC 12). Uncontrolled fire reaching the powder magazine: DC 16 Dex save for all aboard or take 20d6 fire damage; ship takes catastrophic hull damage.

**Incendiary Shot — Fire:** Unlike heated shot, fire is guaranteed — no save. Track a **fire die** starting at d\[Y] (the gun's die type). Each round the fire burns, it deals that many dice in fire damage to Hull Points. Each additional incendiary hit adds another d\[Y] to the fire track (e.g., two hits of 24-lb incendiary = 2d10 fire/round). To extinguish: the Carpenter makes a DC 14 Intelligence (Carpenter's Tools) check as a full action — on a success, remove one d\[Y] from the fire track. At 0 dice, the fire is out. Does not require Grand Magazine or preparation — but is scarce specialist ammo, not available at every port.

---

## Salvo Damage Reference

The Salvo action fires all manned guns on one side. Damage scales directly from the number of fully crewed guns. Use these reference totals for a full complement — reduce proportionally for partial crews or guns out of action.

| Deck | Guns per Side | Gun Type | Die | Full Salvo (Hit) | Miss |
|---|---|---|---|---|---|
| Lower Gun Deck | 15 | 32-lb Long Cannon | d12 | 15d12 | half |
| Main Gun Deck | 14 | 24-lb Long Cannon | d10 | 14d10 | half |
| Upper Gun Deck | 15 | 12-lb Long Cannon | d8 | 15d8 | half |
| Spar Deck | 8 | 12-lb Long Cannon | d8 | 8d8 | half |

_Example: a Tier 2 brigantine with 8 × 24-lb guns per side, fully crewed: 8d10 on a hit._
_Mixed decks: each gun type rolls its own dice. 5 × 32-lb + 4 × 24-lb = 5d12 + 4d10._

---

## Multi-Deck Salvo (Tier 4 — First-Rate Only)

On a standard ship, a Salvo covers all manned guns on one side across whatever decks are crewed. On a **Tier 4 first-rate**, the sheer number of decks creates a coordination problem that a single Gunner cannot fully solve — each deck fires on a slightly different angle and timing.

**Requirements:**

- Tier 4 vessel
- Gunner crew role filled (PC or Master Gunner hireling)
- All decks loaded

**Procedure:**

1. Declare a full broadside on one side
2. Roll **one attack per deck** using the Gunner's modifier (three rolls total)
   - Advantage on all rolls if one Gunner per deck
3. Each deck resolves independently (hit = full damage for that deck, miss = half)
4. All three decks reload — cannot fire another full broadside for 3 rounds

**Effect:** A full broadside from the _Sovereign_ across all three gun decks rolls 15d12 + 14d10 + 15d8 — 44 dice averaging 242 damage. Against a Tier 3 vessel, that is a single-action kill. The _Sovereign_ does not fight Tier 3 ships. It ends them.

---

## Targeting (Aimed Shots)

Salvos target the hull by default. **Aimed Shots** (single gun, Gunner's ship action) can call a specific target. Specialist shot types (chain, grape, bar) are always better than round shot for their intended target — use them when available.

| Target | Attack Modifier | Effect on Hit |
|---|---|---|
| **Hull** | — | d\[Y] hull damage (standard) |
| **Rigging** | −2 | Speed reduced by d\[Y] miles/day; chain shot does this as a full Salvo |
| **Mast** | −4 | Speed halved; bar shot is built for this |
| **Crew (deck)** | −4 | 1 crew incapacitated; grapeshot does this as a full Salvo |
| **Powder Magazine** | −6 | Target ship saves DC 16 or magazine detonates (catastrophic hull damage) |

Magazine shots are the most dangerous gambit in ship combat. Most captains flood their magazines before risking it. The _Sovereign_ positions its Grand Magazine below the waterline — this shot is impossible from the broadside arc.

---

## Crew Casualties in Combat

When a vessel takes a broadside hit, the GM may rule that deck crew are affected:

- Every 50 Hull Point damage in a single round: 1d4 crew casualties (dead or incapacitated)
- A grapeshot hit on an exposed deck: DC 14 Dex save or incapacitated (see Shot Types)
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
