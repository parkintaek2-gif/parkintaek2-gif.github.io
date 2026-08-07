---
title: "Almost every Korean title on Netflix shares an actor with almost every other. Removing the 100 busiest barely dents it."
dek: "Of 660 Korean titles with a recorded cast, 639 form a single connected body through shared actors. We expected a few very busy people to be holding it together. Take out the 100 busiest and 93.5% is still one piece."
category: screen
pubDate: 2026-08-07
dataAsOf: 2026-08-07T00:00:00+09:00
author: Newsroom
tags: ["korean drama", "korean film", "netflix", "wikidata", "casting", "korea"]
pages:
  - "/actors"
  - "/titles"
sources:
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), global and per-country, used to decide which titles enter the set"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin (P495 = Q884) to identify Korean titles; cast member (P161) with citizenship (P27 = Q884) for the cast of each"
    url: "https://query.wikidata.org"
crossChecks:
  - "Titles and people are joined on Wikidata Q-numbers, not on title text. Matching by text put cast on only 317 of 1,005 titles because article names differ from chart names; matching on Q-numbers reaches 660 of 959"
  - "This piece uses no pageview data at all. Nothing here depends on whether a person has an English Wikipedia article, so the selection bias that shapes our attention panels is absent"
  - "A link means two titles share at least one credited actor. That is a weak relation on purpose, and it is why we report the median number of links per title (16) beside the size of the connected body, rather than the body alone"
  - "The robustness test removes actors in order of how many titles they appear in, and is reported against the mirror-image test that removes the same number of the least busy actors. Both are shown"
  - "959 of the titles Netflix has charted are matched to a Korean Wikidata item. 660 of those have at least one cast member recorded. The 299 with none are absent from this analysis and counted here"
excluded:
  - "Any claim about the whole Korean industry. This is what reached a Netflix Top 10, which is a small and unrepresentative slice of what Korea makes"
  - "Directors, writers, producers, studios and agencies. The link here is cast only. The industry may be far more connected through people we did not measure"
  - "Foreign cast. We filter to Korean citizenship (P27 = Q884), so international co-productions lose their non-Korean cast and the links those would create"
  - "Any claim that Wikidata's cast lists are complete. They are not, and they skew towards well-known names — which understates how many links exist and overstates how much of the linking famous people do"
---

Join every Korean film and series that has reached a Netflix Top 10 to the actors credited in it, and
a shape appears that is hard to see from any one title.

**660 titles. 1,370 actors. 3,494 casting slots.** Draw a line between two titles whenever they share
a credited actor, and the median title is connected to **16** others. *12.12: The Day* is connected to
112. Only 21 titles — 3.2% — share nobody with anything else.

Follow those lines and **639 of the 660 titles, 96.8%, form a single connected body.** There are 22
separate groups in total: one containing almost everything, and 21 titles sitting alone.

## We assumed a few people were holding it together. They are not.

The obvious explanation is a small repertory of very busy actors. Hwang Jung-min appears in 21 of
these titles, Ma Dong-seok in 18, Lee Byung-hun, Sul Kyung-gu and Ha Jung-woo in 17 each. Thirty-four
actors appear in ten or more. Pull those people out and the whole thing should fall apart.

We tested it. It does not.

| Actors removed | Titles left | Largest connected body | Median links per title |
| --- | ---: | ---: | ---: |
| none | 660 | 639 (96.8%) | 16 |
| 10 busiest | 650 | 629 (96.8%) | 13 |
| 20 busiest | 649 | 627 (96.6%) | 12 |
| 34 busiest (everyone with 10+ titles) | 643 | 617 (96.0%) | 10 |
| 50 busiest | 637 | 608 (95.4%) | 9 |
| 100 busiest | 612 | 572 (**93.5%**) | 7 |

Remove the hundred busiest actors in Korean Netflix-charting film and television — a seventh of
everyone in the set — and the remaining 612 titles are still 93.5% one connected body.

The median number of links does fall, from 16 to 7. Busy actors do a great deal of the connecting.
They are simply not load-bearing: take them out and the structure stands on everyone else.

For comparison, removing the hundred *least* busy actors changes almost nothing, as you would expect:
639 of 658 titles, 97.1%.

## Where the connection actually comes from

**Half the actors in this set appear in exactly one title.** 661 of 1,370 — 48.2%. Only 201 appear in
five or more.

So the connectivity is not the work of a famous few. It is the accumulated effect of a very large
number of people who did two or three of these, overlapping in different combinations. A production
does not need to hire a star to be joined to the rest; it needs to hire almost anyone who has worked
before.

| Title | Linked to | Cast recorded |
| --- | ---: | ---: |
| 12.12: The Day | 112 titles | 28 |
| Mr. Sunshine | 105 | 32 |
| Ashfall | 86 | 12 |
| Inside Men | 83 | 13 |
| Squid Game | 69 | 16 |

Note that *Ashfall* reaches 86 titles on twelve recorded cast members while *Pinocchio* reaches 66 on
forty-three. How connected a title is has little to do with how large its cast is.

## What would change this number

**A link is one shared actor.** That is deliberately weak. A single character actor with a scene in
two unrelated films joins them here. The median-links figure is the honest companion to the
96.8%: it says the typical title is not hanging on by one thread but sitting in a mesh of sixteen.

**Wikidata's cast lists are incomplete**, and they skew towards names someone thought worth writing
down. That cuts both ways: the true number of links is higher than we measure, and the share of
linking done by famous people is lower than it looks here.

**299 titles have no cast recorded at all** — 959 Korean titles are matched to Wikidata items and only
660 carry a P161 statement. Those 299 are not counted as isolated; they are absent.

**Only Korean citizens are counted.** International co-productions lose their non-Korean cast, and
with them the links to everything else those people have been in.

And this is cast alone. Directors, writers, producers, studios and agencies are not in it. If the
question is whether Korean screen output is made by an overlapping pool of people, cast is one
answer, and almost certainly the most conservative one available.
