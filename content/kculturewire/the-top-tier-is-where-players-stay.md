---
title: "Every League region's top tier holds more long-stayers"
dek: "Riot flags 54% of Korea's challengers as veterans of the tier and 29.4% of its grandmasters. In North America it is 36.8% and 13%. The top tier is where players stay everywhere — how much more it stays differs by region."
category: titles
genre: esports
purpose: both
pubDate: 2026-08-08
dataAsOf: 2026-08-06T22:00:01+09:00
author: Newsroom
tags: ["league of legends", "esports", "korea", "ranked ladder", "retention"]
pages:
  - "/ladder-churn"
  - "/esports"
sources:
  - org: "Riot Games"
    api: "Developer API, /lol/league/v4/challengerleagues and /grandmasterleagues, queue RANKED_SOLO_5x5, six regions, four collection days from 2 to 6 August 2026"
    url: "https://developer.riotgames.com"
crossChecks:
  - "Veteran and hot streak are Riot's own per-player flags, taken as returned. We do not compute them and we do not know Riot's thresholds"
  - "Both tiers are read from the same call on the same day for each region, so the challenger and grandmaster figures are never hours apart"
  - "Korea is the highest and the bottom two are North America and Southeast Asia on all four collection days. The middle of the table swaps: Europe West and Vietnam change places on 6 August, and North America and Southeast Asia change places on 4 August"
excluded:
  - "Player identifiers. We store distributions only; puuid and summonerId are never written to disk"
  - "Any claim about skill. A veteran flag says how long someone has been in a tier, not how good they are"
  - "Any trend. Four days is not a trend. Where we give a range across days it is a stability check, not a direction"
---

Riot's ranked API marks each player in a league with two flags: **veteran**, meaning they have been in
that league a long time, and **hot streak**, meaning they are winning right now. We read both tiers of
six regions on four days.

The first thing in the data is the same everywhere: **the top tier holds far more long-stayers than
the tier below it.**

| | Challenger veterans | Grandmaster veterans | Gap |
| --- | ---: | ---: | ---: |
| Korea | **54.0%** | 29.4% | 24.6 pts |
| Vietnam | 49.7% | 31.9% | 17.8 |
| Europe West | 49.3% | 25.0% | 24.3 |
| Japan | 42.0% | 30.0% | 12.0 |
| Southeast Asia | 37.3% | 22.9% | 14.4 |
| North America | 36.8% | **13.0%** | 23.8 |

Every row is positive, and that is the structural fact: **Challenger is a place people stay;
Grandmaster is a place people pass through.** It is the tier you climb out of, in both directions.

## The regions differ in two independent ways

The first is how sticky the top is. Korea's challenger tier is more than half long-stayers; Southeast
Asia's and North America's are close to a third. Korea is highest on all four days and the bottom two
are always North America and Southeast Asia, so the ends are not one afternoon's reading. **The middle
is not stable**: Europe West and Vietnam swap places between 4 and 6 August, and the two lowest swap
with each other on 4 August. Treat the ends as findings and the middle as a tie.

The second is **how far apart the two tiers are**, and it does not follow the first. Japan has a
middling challenger tier (42.0%) and the smallest gap to its grandmasters (12.0 points). Korea and
Europe have very different absolute levels in Grandmaster — 29.4% against 25.0% — and almost the same
gap. A region can have a settled top tier and a settled tier below it, or a settled top and a
revolving door underneath, and those are different situations.

## North America is the one that looks different in both

**13.0% of North American grandmasters carry the veteran flag.** The next lowest is Southeast Asia at
22.9%, and Korea is more than twice North America's figure. Its challenger tier, at 36.8%, is roughly
where Southeast Asia's is, so the unusual number is the tier below, not the top.

The second flag says the same thing from another angle:

| | Challengers on a hot streak | Grandmasters on a hot streak |
| --- | ---: | ---: |
| North America | **30.8%** | 21.3% |
| Europe West | 20.0% | 18.6% |
| Japan | 20.0% | 19.0% |
| Vietnam | 19.7% | 16.3% |
| Southeast Asia | 19.0% | 16.1% |
| Korea | 18.7% | 15.7% |

Five regions sit between 18.7% and 20.0%. **North America sits at 30.8%** — half again as many of its
challengers are on a win streak at any moment. Fewer long-stayers and more people currently climbing
are two descriptions of the same tier, and they agree.

## What we are not saying

**This is not a statement about skill.** The veteran flag is about duration in a league, not about how
well anyone plays. A ladder that turns over quickly is not a worse ladder; it is a ladder where the
boundary between the top two tiers is being crossed more often.

**We do not know Riot's thresholds.** "Veteran" and "hot streak" are Riot's flags and Riot does not
publish what counts. Every figure here inherits that definition, which is why we compare regions to
each other rather than to any absolute standard — the same unknown threshold applies to all six.

**Four days is the whole window.** We began daily collection on 2 August 2026 and the readings run to
6 August. That is enough to show the ends of the table hold and nothing like enough to show a direction.
The window will grow; a ladder cannot be measured backwards, so what we did not collect is gone.

**And the tiers are not the same size.** Challenger holds 300 players in most of these regions and
Grandmaster 700, so a percentage point means a different number of people on each side of the table.
We give shares rather than counts for that reason, and the counts are on
[the ladder page](/ladder-churn) if you would rather read them that way.
