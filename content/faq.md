---
publish: true
title: FAQ
created: 2026-05-01T20:03:59.146-07:00
modified: 2026-05-03
published: 2026-05-02T20:14:20.494-07:00
tags:
  - player-resource
  - faq
visibility: public
audience: players
summary: Public FAQ for using the Shattered Sea campaign wiki, including where to start, how navigation-safety works, and how to use the wiki with a chatbot.
type: reference
subtype: faq
campaign: shattered-sea
updated: 2026-05-03
---

# Frequently Asked Questions

## Where should I start?

Start with [[player-primer|The Shattered Sea Player Primer]]. It gives you the campaign tone, major geography, factions, character creation options, ship rules, and the kind of trouble the campaign expects.

After that, use [[campaign-overview|Campaign Overview]] as the dense reference page and [[index|The Shattered Sea]] as the root navigation hub.

## Is this wiki safe for players?

Yes. This wiki is written for players. It covers common knowledge, onboarding material, published rules references, playable species, faction summaries, and setting lore.

Everything navigable on the public wiki is public and can be read. Nothing private is ever published. If you follow a link and get a 404, that is a spoiler boundary, not an error; the missing page simply is not public yet. This makes the whole wiki spoiler-safe.

## What should I read before Session Zero?

Read these:

1. [[player-primer|The Shattered Sea Player Primer]]
2. [[rules/Mortis|Mortis]]
3. [[rules/Ship-Stats|Ship Stats]] (Optional)
4. [[rules/Ship-Bastion|Ship Bastion]] (Optional)
5. Any homebrew species page you are considering from [[species/index|Playable Species]]

You do not need to memorize the setting. You need a character with a reason to be aboard the _[[ships/Saltwright|Saltwright]]_, a reason to cross dangerous water, and a problem that could follow them into port.

## What species can I play?

Standard 2024 species are available, plus the [[places/Shattered-Sea|Shattered Sea]] options in [[species/index|Playable Species]]:

- [[species/Aarakocra|Aarakocra]]
- [[species/Grung|Grung]]
- [[species/Rattkin|Rattkin]]
- [[species/Tabaxi|Tabaxi]]

For setting context, read the linked species page and any linked faction or lore pages.

## What campaign rules are different?

The main public rules references are:

- [[rules/Ship-Stats|Ship Stats]] — ship tiers, crew, cargo, travel, weapons, upgrades, and upkeep.
- [[rules/Ship-Bastion|Ship Bastion]] — the party ship as a shared mobile bastion.
- [[rules/Bastions|Bastions]] — 2024 Bastion rules reference.
- [[rules/Mortis|Mortis]] — death, consequence, and targeted benefits.

## How do I use this wiki with ChatGPT or another chatbot?

Paste this into your first message, or save it as project instructions:

```plain text
Use the public Shattered Sea campaign wiki at https://thedougler.github.io/dnd-site/ as your source for campaign questions. Start from the public root page, follow public links as needed, and do not invent details for pages or links that are not available.
```

For ChatGPT, use a reasoning-capable mode when possible. If the model answers from general D\&D knowledge instead of the campaign wiki, remind it to use the public wiki as its source of truth.

## Why does ChatGPT say it cannot find the wiki?

Usually one of these is happening:

- Instant mode is enabled.
- The model did not actually open the public wiki.
- The model cannot access remote URLs in that chat.
- The chat is using a lightweight mode that does not reliably follow retrieval instructions.
- The link you followed is intentionally unpublished, which appears as a 404.

Try this exact first message:

```plain text
Open https://thedougler.github.io/dnd-site/ and use the public Shattered Sea campaign wiki to answer my questions. Treat any 404 as an intentionally unpublished page and do not infer its contents.
```

If your chatbot cannot browse the public site, use the fallback context bundle:

```plain text
Load the full context bundle at https://thedougler.github.io/dnd-site/llms-full.txt and use it to answer questions about The Shattered Sea campaign wiki.
```

## What does a 404 mean?

The page is not public. It may exist in the campaign notes, but it has not been published to the player-facing wiki. Treat the absence as part of the spoiler protection system.

---

- [[index|The Shattered Sea]] — campaign hub
- [[player-primer|Player Primer]] · [[campaign-overview|Campaign Overview]]
