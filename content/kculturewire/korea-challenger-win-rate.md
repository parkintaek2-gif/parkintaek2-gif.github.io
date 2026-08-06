---
title: "Korean challengers win less than any other region's. That is what a deep ladder looks like."
dek: "Korea's top 300 League of Legends players win 53.65% of their ranked games — the lowest of six regions, on all four days we have measured. A win rate at the top is set by who you have to play, and in Korea that is everybody else."
category: esports
pubDate: 2026-08-06
dataAsOf: 2026-08-06T21:50:00+09:00
author: Newsroom
tags: ["league of legends", "esports", "korea", "solo queue", "riot games"]
sources:
  - org: "Riot Games"
    api: "Developer API — /lol/league/v4/challengerleagues, queue RANKED_SOLO_5x5, six regions, collected daily at 22:00 KST"
    url: "https://developer.riotgames.com"
crossChecks:
  - "Collected on 2026-08-02, 08-03, 08-04 and 08-06 at the same hour. Korea returns the lowest challenger win rate on all four days — 53.64, 53.72, 53.73 and 53.65 — and the rank order of the six regions is identical each day. The finding is the ordering's stability, not a single reading"
  - "The gap to the next-lowest region is about 0.8 points (Southeast Asia, 54.43–54.60) and to the highest about 1.9 (Japan and Vietnam, ~55.5). Small in absolute terms, but it does not move day to day while the underlying player set turns over"
  - "Games played per challenger is read from the same call: Europe West 921, Korea 770, North America 659, Vietnam 601, Japan 465, Southeast Asia 410 on 2026-08-06, and the ordering is likewise unchanged across the four days"
  - "No player identifiers are stored. Riot returns them and the collector discards puuid and summonerId before writing, keeping distributions only"
excluded:
  - "Any claim that Korean players are better or worse than others. This measures the field a top player faces, not the player. A lower win rate at the top is consistent with stronger opposition and equally consistent with other causes we cannot separate here"
  - "Japan's tier size. Its challenger tier holds 50 players against roughly 300 elsewhere, so it is a narrower cut of a smaller population — that alone should lift its win rate, and we have not adjusted for it. Japan's number is reported and not leaned on"
  - "What the win rate is calculated over. Riot returns wins and losses for the current ranked split, which includes games against opponents outside challenger, so this is not a challenger-versus-challenger figure"
  - "Any trend. Four days is a snapshot, not a series. Nothing here says the gap is widening or narrowing, and the collection has a gap on 2026-08-05 that cannot be recovered"
  - "Grandmaster and below. The API returns those tiers and they are archived, but this article reads challenger only"
draft: false
---

The claim that Korea is the strongest region in League of Legends is old enough that nobody bothers to check it. It is also awkward to check, because the obvious measure points the wrong way.

We have been pulling the challenger ladder — the top roughly 300 ranked players — from six regions each night. Korea's challengers win **53.65%** of their ranked games. That is the **lowest** of the six.

| Region | Challengers | Win rate | Games each | Median LP |
| --- | ---: | ---: | ---: | ---: |
| Japan | 50 | 55.50% | 465 | 1,695 |
| Vietnam | 300 | 55.46% | 601 | 1,868 |
| North America | 302 | 55.16% | 659 | 1,649 |
| Europe West | 300 | 54.95% | 921 | 2,623 |
| Southeast Asia | 300 | 54.43% | 410 | 1,061 |
| **Korea** | **300** | **53.65%** | **770** | **2,008** |

Read carelessly, that says Korea's best players are the worst of the six. It says the opposite.

## A win rate at the top is a measurement of everyone below

A challenger's win rate is not a property of the challenger. It is a property of the queue they get put into. These players are not mostly playing each other — there are only a few hundred of them — so most of their games are against the strongest players *outside* challenger. The better that pool is, the closer each game runs, and the fewer of them the challenger wins.

So a low win rate at the top of a ladder is what a deep ladder looks like from the inside. The people just below the top are close enough to take games off the top.

## The reason to believe it

One night's number proves nothing. The ordering does.

| Date | Korea | SE Asia | Europe West | North America | Vietnam | Japan |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-08-02 | 53.64 | 54.60 | 55.04 | 55.02 | 55.51 | 55.56 |
| 2026-08-03 | 53.72 | 54.54 | 55.02 | 55.00 | 55.60 | 55.42 |
| 2026-08-04 | 53.73 | 54.53 | 54.95 | 55.04 | 55.50 | 55.42 |
| 2026-08-06 | 53.65 | 54.43 | 54.95 | 55.16 | 55.46 | 55.50 |

Korea is last on every day, by a margin that does not wander. The individual players in a challenger tier churn constantly — people are promoted and demoted daily — and the figure still lands within a tenth of a point of itself.

## What Korea is not

It is not the hardest grind. That is Europe West, whose challengers average **921 ranked games** against Korea's 770, and who sit at a median 2,623 LP against Korea's 2,008. Europe West's top players are playing more and accumulating more, and still winning a larger share of their games than Korea's do.

Southeast Asia is the other end: 410 games each, median 1,061 LP. Reaching the top there takes less than half the volume it takes in Europe.

So the three things are separate, and it is worth keeping them apart when someone says a region is "strong":

- **How much you must play** — Europe West, then Korea.
- **How much you accumulate** — Europe West, then Korea.
- **How hard each individual game is** — Korea, clearly, and consistently.

Only the third is about the depth of the player base, and it is the one that does not show up in a highlight reel.
