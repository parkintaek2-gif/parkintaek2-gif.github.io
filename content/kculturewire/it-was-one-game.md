---
title: "What we called an esports pattern turns out to be one game"
category: stars
genre: esports
purpose: both
dek: "We said Korean esports players in the Southeast Asian Wikipedias all peak in one month. Split by game, 85.7% of them play League of Legends. Korea has more StarCraft II players, and four of them have an article in those editions."
pubDate: 2026-08-13
dataAsOf: 2026-08-13T00:00:00+09:00
author: Newsroom
tags: ["korea", "esports", "southeast-asia", "measurement", "limits", "correction"]
pages:
  - "/esports-games"
  - "/one-month"
sources:
  - org: "Wikidata"
    api: "Korean esports players and the game each competes in, from P2416, with their article links in the Indonesian, Vietnamese, Thai and Malay Wikipedias"
  - org: "Wikimedia"
    api: "Pageviews API, monthly reads in those four editions, human traffic only, calendar year 2025"
draft: false
---

Earlier today we published a finding: Korean esports players read in the Indonesian, Vietnamese, Thai and Malay Wikipedias all peak in the same month. That was measured correctly and described too widely.

Twelve of the fourteen players behind it — 85.7% — play League of Legends.

| Game | Korean players on Wikidata | With an article in these four editions | Share | Read enough to measure |
|---|---|---|---|---|
| League of Legends | 418 | 16 | 3.8% | 12 |
| StarCraft II | 481 | 4 | 0.8% | 2 |
| Valorant | 9 | 1 | 11.1% | 0 |

Korea has **more** StarCraft II players on Wikidata than League of Legends players: 481 against 418. In these four editions, four of the 481 have an article at all, and two of those four draw enough reads to place a peak month. That is below the threshold at which we will report one, so we do not.

## The distinction that matters

There are two sentences here and only one of them is supported.

*Korean esports players peak in a single month* implies the pattern was tested across the field and held. It was not. The field, as it reaches Southeast Asian readers, is almost entirely one game.

*Korean League of Legends players peak in a single month* is what the data says. Whether the same is true of StarCraft II, Valorant or anything else is not something this measurement answers, and it is not something it could have answered.

The other games were not checked and found different. There were not enough readers to check.

## A wrong turn worth recording

Wikidata stores the game an esports player competes in under P2416, "sports discipline competed in". We first looked at P641, "sport", which returns `esports` for 1,263 of the 1,266 Korean players. That is true and useless: every player lands in one bucket, and a split by game produces a single group.

We spent a full collection run before noticing, because a table with one row in it does not look wrong — it looks like a finding that everyone agrees. Recording it here so the next person checks the property before the pattern.

## What this does not say

It does not say StarCraft II is unpopular in Southeast Asia. It says four Korean StarCraft II players have an article in these four Wikipedias, and an encyclopaedia's coverage is not a measure of a game's audience.

It also does not retract the earlier piece. The eleven players in it peak in November 2025, and they still do. What changes is the name of the group they belong to.

The full table is at [What we called an esports pattern was one game](/esports-games).
