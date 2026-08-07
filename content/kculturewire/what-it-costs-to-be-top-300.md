---
title: "The same rank costs 2.5 times as much in Europe as in Southeast Asia"
dek: "Being in League of Legends' top 300 means 2,623 LP in Europe West and 1,061 in Southeast Asia. The distance between the top two tiers barely moves — 484 to 618 LP everywhere. The ladder's height varies; its step does not."
category: esports
pubDate: 2026-08-08
dataAsOf: 2026-08-06T22:00:01+09:00
author: Newsroom
tags: ["league of legends", "esports", "korea", "ranked ladder", "league points"]
pages:
  - "/ladder-gap"
  - "/esports"
sources:
  - org: "Riot Games"
    api: "Developer API, /lol/league/v4/challengerleagues and /grandmasterleagues, queue RANKED_SOLO_5x5, six regions, four collection days from 2 to 6 August 2026"
    url: "https://developer.riotgames.com"
crossChecks:
  - "Both tiers of a region are read from the same call on the same day, so an LP gap is never two readings hours apart"
  - "LP is the median across every player Riot returns for the tier, not a mean and not a threshold we chose. We use the median because a handful of very high scores at the top of Challenger would drag a mean"
  - "Japan's tiers hold 50 and 100 players against 300 and 700 elsewhere, so its medians rest on a sixth as many people and are noisier"
excluded:
  - "Player identifiers. We store distributions only; puuid and summonerId are never written to disk"
  - "Any claim that LP is comparable to skill across regions. It is a within-region currency and this piece is about that fact"
  - "Any trend. Four days of readings cannot show one"
---

League of Legends gives every ranked player a score in League Points, and the top two tiers —
Challenger and Grandmaster — are defined by holding a place among a fixed number of players rather
than by reaching a score. So the score attached to that place is free to vary. It does.

| | Challenger median LP | Grandmaster median LP | Gap |
| --- | ---: | ---: | ---: |
| Europe West | **2,623** | 2,005 | 618 |
| Korea | 2,008 | 1,499 | 509 |
| Vietnam | 1,867 | 1,260 | 607 |
| Japan | 1,695 | 1,211 | 484 |
| North America | 1,649 | 1,164 | 485 |
| Southeast Asia | **1,061** | 577 | 484 |

**A European challenger carries 2.5 times the LP of a Southeast Asian one.** Both are in their
region's top 300. The rank is the same object; the number attached to it is not.

## The height varies. The step does not.

Read the right-hand column instead and the picture inverts. The distance between the two tiers runs
from **484 to 618 LP** — a spread of 1.28 times, against 2.47 times for the tiers themselves.

Southeast Asia and Japan and North America all sit at 484–485. Europe West is highest at 618 and
Korea, whose challenger tier is the second highest in absolute LP, has the smaller gap of 509.

So the ladders are built at different heights and with almost the same last step. Whatever sets how
much LP accumulates at the top of a region — how many games get played, how the queue distributes
wins, how long the season has run — it moves both tiers together and leaves the distance between them
largely alone.

## Why LP does not travel

LP is not a measure of skill that can be compared across borders, and this table is the clearest way
to see why. It accumulates from wins inside a region's own player pool. A region where the top
players queue more, or where the pool is deeper below them, produces bigger numbers at the top
without anyone being better than anyone in another region.

**Which is exactly why the rank exists.** "Top 300" is portable in a way that "2,000 LP" is not. Riot
defines the tiers by headcount for the same reason we are printing this table: the score is a
within-region currency.

Anyone building a cross-region comparison on LP is comparing exchange rates and calling it wealth.

## What we cannot say from this

**We cannot say why Europe's numbers are the highest.** Games played is one candidate — European
challengers average 921 ranked games to Korea's 770 and Southeast Asia's 410 — and it points the right
way, but three regions with similar game counts have quite different LP, so it is not the whole
mechanism and we have not isolated one.

**Japan's row rests on 50 players**, not 300, because that is the size Riot returns for that region.
Its medians are the noisiest in the table and we would not build an argument on the difference
between Japan and North America.

**And four days is the window.** We began daily collection on 2 August 2026. The ordering of regions by
challenger LP was the same on all four days, which tells us the table is not one afternoon's reading
and tells us nothing at all about direction.
