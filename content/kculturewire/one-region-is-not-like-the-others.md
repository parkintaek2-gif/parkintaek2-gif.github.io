---
title: "Five of six League regions agree on how many top players are on a hot streak. North America is ten points out."
dek: "Riot flags a player on a winning run. Across Korea, Vietnam, Europe West, Japan and Southeast Asia the share sits between 18.7% and 20.0%. North America is 30.8%, on all four days — and the obvious explanation fails."
category: esports
purpose: both
pubDate: 2026-08-08
dataAsOf: 2026-08-06T22:00:00+09:00
author: Newsroom
tags: ["league of legends", "esports", "korea", "north america", "measurement"]
pages:
  - "/esports"
  - "/ladder-churn"
sources:
  - org: "Riot Games"
    api: "Developer API — challenger and grandmaster league entries, queue RANKED_SOLO_5x5, for kr, vn2, euw1, jp1, sg2 and na1. Hot streak and veteran are Riot's own per-player flags"
    url: "https://developer.riotgames.com"
crossChecks:
  - "Every share is recomputed from the raw daily files rather than read from a summary, so the figures here and on our ladder pages come from the same rows"
  - "The pattern is checked on all four collected days, not only the last one: North America is the highest on every day"
  - "Player identifiers are discarded at collection. Only distributions are kept, so nothing here can be traced to a person"
excluded:
  - "Any explanation of why North America differs. We tested the obvious one and it failed; we are not offering a replacement we cannot measure"
  - "Anything about professional play. This is the public solo-queue ladder and nothing else"
  - "Trend claims from Japan's movement. Japan has 50 challenger slots, so one player is two percentage points and a four-point move is two people"
  - "Days after 6 August 2026. Our API key expired and ladder state cannot be backfilled, so this window is closed permanently at four days"
---

Riot marks a ranked player as being on a **hot streak** — a current winning run — and publishes that
flag with every entry in the challenger and grandmaster tiers. We have been collecting those tiers
for six regions and had never looked at this column.

It turns out to be the flattest number on the ladder, and then it is not.

## Five regions, one and a third points apart

| Region | Challengers on a hot streak | Veterans of the tier |
| --- | ---: | ---: |
| Korea | 18.7% | 54.0% |
| Southeast Asia | 19.0% | 37.3% |
| Vietnam | 19.7% | 49.7% |
| Japan | 20.0% | 42.0% |
| Europe West | 20.0% | 49.3% |
| **North America** | **30.8%** | 36.8% |

Five of the six sit inside a band **1.3 points wide**. These are regions that differ enormously on
everything else we have measured — Korea's challengers
[stay in the tier far longer than anyone else's](/article/the-top-tier-is-where-players-stay),
Europe West's [play more than twice as many ranked games as Southeast Asia's](/article/korea-ladder-games-played),
and the [LP it takes to be top 300 varies by a factor of two and a half](/article/what-it-costs-to-be-top-300).

On this one number they agree.

**North America is 10.8 points above the top of that band**, and it is not a one-day reading. It is
the highest region on every day we collected: 36.1%, 33.8%, 31.8%, 30.8%. It is also falling faster
than any other region moved over the same four days.

## The obvious explanation fails

The tempting story is turnover. A tier that churns has more players who just arrived on a winning
run; a tier full of long-term residents has more players sitting at equilibrium. North America has
the lowest veteran share of the six, so the story fits.

Put the two least-veteran regions side by side and it stops fitting.

| | Veterans | On a hot streak |
| --- | ---: | ---: |
| North America | 36.8% | **30.8%** |
| Southeast Asia | 37.3% | **19.0%** |

**0.5 points apart on veterans; 11.8 points apart on hot streaks.** Southeast Asia has almost
exactly North America's churn and a completely ordinary hot-streak share. Whatever makes North
America different, it is not simply that fewer players stay.

We do not have a replacement explanation, and we are not going to invent one. What would settle it
is the tier's promotion and demotion history — who entered this week, and from where — and Riot's
public API does not expose it.

## Where the difference is, and is not

The gap narrows sharply one tier down.

| | Challenger | Grandmaster |
| --- | ---: | ---: |
| North America | 30.8% | 21.3% |
| Next highest region | 20.0% | 19.0% |
| Gap | **10.8 points** | **2.3 points** |

Whatever this is, it lives in the **top 300**, not in the wider top thousand. That is a narrower and
more specific finding than "North America is different", and it is the part a reader can do
something with.

One more detail worth stating rather than smoothing over: North America was carrying **302**
challenger slots and **718** grandmaster slots when we sampled, where the other large regions showed
exactly 300 and 700. Tier sizes are not perfectly fixed at the moment of reading, and we have left
the real counts in rather than rounding them to the numbers we expected.

## What we cannot say

Japan moved from 16.0% to 20.0% across the four days, which looks like a trend and is not one: Japan
has **50 challenger slots**, so a single player is two percentage points and that whole movement is
two people.

And this window is closed. Our Riot key expired after 6 August and **ladder state cannot be
backfilled** — there is no archive to fetch, because the ladder only ever exists in the present. Four
days is all this measurement will ever have, which is why we are reporting the size of the gap and
not a trajectory.
