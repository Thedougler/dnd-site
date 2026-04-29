---
type: entity
subtype: monster
status: unmet
created: '2026-04-23'
updated: '2026-04-24'
tags:
- creature
- undead
- druid
- lich
- homebrew
- pointy-hat
- evolving-statblock
- legendary
- optional-threat
sources:
- raw/ingested/clippings/Pointy Hat_ The Blight.md
- '[[Source-Pointy-Hat-Blight]]'
- User request 2026-04-24
source_count: 3
confidence_level: medium
cr: 19
habitat: Memorial
creature_type: undead
cssclasses:
- wiki-monster
statblock: inline
banner: raw/assets/banners/The-Blight.webp
campaign: shattered-sea
---

# The Blight
```statblock
layout: Basic 5e Layout
name: "The Blight"
size: Medium
type: undead
alignment: Any Alignment
ac: 18
hp: 187
hit_dice: "25d8 + 75; 232 (31d8 + 93) within 10 miles of the Death Bloom; 285 (38d8 + 114) within 1 mile of the Death Bloom"
speed: "30 ft."
stats: [18, 15, 17, 13, 21, 11]
saves:
  - constitution: 9
  - wisdom: 11
skillsaves:
  - animal-handling: 11
  - insight: 11
  - medicine: 11
  - nature: 7
  - perception: 11
  - survival: 11
damage_resistances: "cold, necrotic, poison; bludgeoning, piercing, and slashing from nonmagical attacks"
condition_immunities: "charmed, exhaustion, frightened, paralyzed, poisoned"
senses: "darkvision 120 ft., passive Perception 21"
languages: "the languages it knew in life"
cr: "19+"
source: "Pointy Hat playtest"
traits:
  - name: "Evolving Stat Block"
    desc: "The Blight changes as it approaches the Death Bloom. Base values apply outside 10 miles. Text marked 'within 10 miles' applies when the Blight is within 10 miles of the Death Bloom. Text marked 'within 1 mile' applies when the Blight is within 1 mile of the Death Bloom."
  - name: "Death Bloom Phylactery"
    desc: "A destroyed Blight is one and the same as its Death Bloom phylactery. As long as the place that acts as the Death Bloom is intact, the Blight can reform a new body. If the Death Bloom is destroyed, the Blight is also destroyed. If the body of a Blight is killed, a new body forms in the Death Bloom in 1d5 days."
  - name: "Magic Resistance"
    desc: "The Blight has advantage on saving throws against spells and other magical effects."
  - name: "Turn Resistance"
    desc: "The Blight has advantage on saving throws against any effect that turns undead."
  - name: "One with the Land"
    desc: "The Blight is aware of the presence of any living creature that enters the Memorial, but cannot pinpoint its location unless it enters the 10-mile radius from the Death Bloom."
  - name: "Voice of the Land"
    desc: "All beasts within the Memorial are under the effect of the animal friendship spell and help the Blight in and out of combat."
  - name: "Back to the Soil"
    desc: "If a creature dies within 30 feet of the Blight while in the Memorial, the Blight regains 2d8 hit points as it absorbs the body and converts it into nutrients."
  - name: "Death Grove (Within 10 Miles)"
    desc: "The Blight adds +1 to all its melee and ranged spell attacks and damage rolls."
  - name: "Fury of the Death Bloom (Within 10 Miles)"
    desc: "The Blight can take 4 legendary actions, 2 reactions per turn, and 2 lair actions on initiative count 20. It can make a melee spell attack as an opportunity attack, and it has advantage on concentration checks."
spells:
  - "The Blight casts spells, requiring no material components and using Wisdom as its spellcasting ability (spell save DC 19, +11 to hit with spell attacks)."
  - "At will: druidcraft, entangle, speak with animals, hold person, poison spray (3d12), thunderwave, moonbeam"
  - "3/day each: counterspell, cure wounds (cast at 4th level and can heal the Blight), heat metal, lesser restoration, spike growth, wind wall"
  - "2/day each: call lightning (cast as if outdoors in stormy conditions), blight, sleet storm, tree stride, wall of thorns, polymorph"
  - "1/day each: contagion, hallucinatory terrain, ice storm, antilife shell, earthquake, storm of vengeance"
actions:
  - name: "Might of Memorial"
    desc: "Melee Spell Attack: +11 to hit, reach 5 ft., one creature. Hit: 19 (4d6 + 5) necrotic damage. The target must succeed on a DC 19 Constitution saving throw or be poisoned for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
  - name: "Ray of Waste"
    desc: "Ranged Spell Attack: +11 to hit, range 60 ft., one creature. Hit: 12 (2d6 + 5) necrotic damage. The target must succeed on a DC 19 Constitution saving throw or be poisoned for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
  - name: "Wild Shape"
    desc: "The Blight changes its shape into a beast of any CR that lives within the Memorial. The rules that apply to this transformation for a druid apply to the Blight unless otherwise stated. Base: the Blight can use Wild Shape once per day and is unable to cast spells while in this form. Within 10 miles: the Blight can choose to use Wild Shape to cast any of its spells without consuming a use of that spell, can use Wild Shape as an action or bonus action, and can use Wild Shape twice per day. Within 1 mile: the Blight can use Wild Shape as a bonus action, can use it three times per day, and can cast spells in Wild Shape while ignoring verbal, somatic, and material components."
legendary_actions:
  - name: "Legendary Actions"
    desc: "The Blight can take 3 legendary actions, or 4 legendary actions within 10 miles of the Death Bloom, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The Blight regains spent legendary actions at the start of its turn."
  - name: "Cantrip"
    desc: "The Blight casts a cantrip."
  - name: "Ray of Memorial"
    desc: "The Blight makes one Might of Memorial attack or one Ray of Waste attack."
  - name: "Root Stride"
    desc: "The Blight dissolves its current plant form into its roots and regrows it in an unoccupied space 30 feet from where it originally was without incurring opportunity attacks."
  - name: "Wild Shape (Costs 2 Actions)"
    desc: "The Blight uses its Wild Shape ability and moves up to its new speed without triggering opportunity attacks."
  - name: "Death Rites (Costs 2 Actions)"
    desc: "The Blight asks the Memorial to heal its wounds, regaining 2d8 + 5 hit points."
```

A **Blight** is a druid lich: an Archdruid whose body and soul have been ritually fused with the land they failed to protect. The ritual kills the druid's mortal form, creates a location-based phylactery called a **Death Bloom**, and makes the druid's will and the land's will one defensive force.

> [!info] Source
> Pointy Hat playtest content from `raw/ingested/clippings/Pointy Hat_ The Blight.md`.

---

## Lore

Nature cannot defend itself from every attack, but a druidic guardian can attempt to give the land a will and an undead defender. Through a lengthy ritual, the druid melds soul and body to the protected land, dies, creates the Death Bloom, and becomes a Blight. Only Archdruids are known to have successfully performed the ritual.

Unlike a conventional lich, the Blight's phylactery is not an object or creature. The Death Bloom is a place at the heart of the land the druid sought to protect, usually the ritual site itself. If the Blight's body is destroyed while the Death Bloom remains intact, a new body forms there in 1d5 days; if the Death Bloom is destroyed, the Blight is destroyed.

The land bound to a Blight is called a **Memorial**. A Memorial grows unnaturally: fungi can reach tens of feet high, vines can extend for miles, and flowers can cover every surface. The Memorial can defend itself with spores, thorns, poisonous pollen, beasts, animated plants, and lair effects.

The Blight can manifest a body anywhere in the Memorial as a concentrated defense against intruders. The body can be composed of lichen, moss, flowers, or other local plant matter. To continue its unlife, the Blight and Memorial must expand, absorbing nearby lands and flattening diverse ecosystems into the homogeneous Memorial.

---

## Evolving Stat Block

The Blight's statistics change based on proximity to the Death Bloom.

| Tier | Range from Death Bloom | Changes |
|------|------------------------|---------|
| Base | More than 10 miles | 187 hit points; 3 legendary actions; 1 reaction; standard lair action cadence. |
| Death Grove | Within 10 miles | 232 hit points; +1 to melee and ranged spell attacks and damage; 4 legendary actions; 2 reactions per turn; 2 lair actions on initiative count 20; melee spell attacks as opportunity attacks; advantage on concentration checks; upgraded Wild Shape. |
| Death Bloom | Within 1 mile | 285 hit points; Wild Shape becomes a bonus action, usable three times per day, and allows spellcasting in beast form while ignoring verbal, somatic, and material components. |

---

## Lair Actions

On initiative count 20, losing initiative ties, the Blight can take a lair action. The Blight cannot use the same effect two rounds in a row. Within 10 miles of the Death Bloom, the Blight can take two lair actions at the same time on initiative count 20.

| Lair Action | Effect |
|-------------|--------|
| Unmitigated growth | The floor becomes difficult terrain until initiative count 20 on the next round. |
| Hardened soil | The nutrients of the soil harden the Blight's skin, increasing its AC by 3 until initiative count 20 on the next round. |
| Healing absorption | Magical healing performed by anyone other than the Blight is halved, rounding up, until initiative count 20 on the next round. |
| Thick mist | Dew turns into thick mist. All creatures inside the lair except the Blight are blinded until initiative count 20 on the next round. |
| Spores | Each creature not friendly to the Blight makes a DC 19 Constitution saving throw. On a failure, it suffers one random condition until initiative count 20 on the next round: 1 blinded, 2 charmed, 3 paralyzed, 4 poisoned. |
| Thorny vines | Creatures not friendly to the Blight take 1d8 piercing damage for every 5 feet they travel until initiative count 20 on the next round. |
| Purifying pollen | The lair and the Blight are freed of ongoing magical effects, such as wall spells or a *hold monster* spell. |
| Redirected healing | Magical healing performed by anyone other than the Blight is halved, rounding up, and the Blight receives the same amount of healing until initiative count 20 on the next round. |
| Defensive beasts | Four beasts of challenge rating 1 or lower are summoned to four unoccupied spaces at the edges of the lair. The beasts have one initiative as a group, but each has its own turn. |
| Awakened trees | Two [[Awakened-Tree|Awakened Trees]] form in unoccupied spaces at the edges of the lair. Each awakened tree has its own initiative. |
| Entangling roots | Each creature not friendly to the Blight makes a DC 19 Dexterity saving throw, becoming restrained on a failure. |
| Healing lilies | Two enormous lilies grow in unoccupied spaces in the lair. Each lily is Medium, AC 5, and has 15 hit points. For every turn the lilies remain in the lair, they heal the Blight for 3d4 hit points until initiative count 20 on the next round. |
| Empowering mushrooms | Four enormous mushrooms grow in unoccupied spaces in the lair. Each mushroom is Medium, AC 15, and has 10 hit points. For every mushroom in the lair, the Blight adds +1 to all of its damage rolls. |
| Gray pollen | Flowers release gray pollen that dulls the colors of the lair. All creatures not friendly to the Blight are under an antimagic field until initiative count 20 on the next round. |

---

## Shattered Sea Placement

In the Shattered Sea campaign, the Blight can optionally fester on [[Aruhe]], a deserted Midchain island immediately east of Karath and bordering the [[Verdant-Teeth]]. The island was abandoned after nearby [[The-Grung|Grung]] activity made settlement unsafe, leaving the interior isolated enough for a Memorial to take hold.

This placement is an optional regional threat and accidental-discovery boss. It is not required for Jean-Claude's Sorn arc, the Grung escalation, or any main campaign plot.

---

## Running The Blight

The Blight is both monster and dungeon. The entire Memorial is the Blight's lair, so its lair actions can appear during Memorial travel even when the Blight's body is absent.

The encounter is built around lair actions more than ordinary actions. The battlefield should change constantly as the Memorial fights alongside the Blight. Its sustainability comes from a high hit point pool, self-targeted *cure wounds*, Back to the Soil, Death Rites, and healing lair actions.

The escalating proximity tiers are meant to be revisited over an adventure. The closer the party gets to the Death Bloom, the more of the stat block is active. Some lair actions summon or create additional creatures, so prepare beasts of challenge rating 1 or lower and [[wiki/dnd/monsters/Awakened-Tree|Awakened Trees]] before the party reaches the relevant tier.

---

## Connections

- [[Source-Pointy-Hat-Blight]] — source record for the Pointy Hat playtest article.
- [[Aruhe]] — optional Shattered Sea placement; deserted Midchain island bordering the Verdant Teeth.
- [[raw/ingested/Blight]] — spell included in the Blight's 2/day spell list.
- [[wiki/dnd/monsters/Awakened-Tree]] — summoned by one of the Blight's lair actions.