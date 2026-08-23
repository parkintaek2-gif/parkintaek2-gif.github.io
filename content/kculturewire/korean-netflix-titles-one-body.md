---
title: "Remove Ma Dong-seok, Hwang Jung-min and 98 more, and Korean Netflix is still one connected body"
dek: "Of 668 Korean titles with a recorded cast, 651 form a single connected body through shared actors. We expected a few very busy people to be holding it together. Take out the 100 busiest and 94.6% is still one piece."
category: titles
purpose: both
pubDate: 2026-08-07
dataAsOf: 2026-08-23T00:00:00+09:00
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
  - "Titles and people are joined on Wikidata Q-numbers, not on title text. Matching by text put cast on only 317 of 1,005 titles because article names differ from chart names; matching on Q-numbers reaches 668 of 945"
  - "This piece uses no pageview data at all. Nothing here depends on whether a person has an English Wikipedia article, so the selection bias that shapes our attention panels is absent"
  - "A link means two titles share at least one credited actor. That is a weak relation on purpose, and it is why we report the median number of links per title (16) beside the size of the connected body, rather than the body alone"
  - "The robustness test removes actors in order of how many titles they appear in, and is reported against the mirror-image test that removes the same number of the least busy actors. Both are shown"
  - "945 of the titles Netflix has charted are matched to a Korean Wikidata item. 668 of those have at least one cast member recorded. The 277 with none are absent from this analysis and counted here"
excluded:
  - "Any claim about the whole Korean industry. This is what reached a Netflix Top 10, which is a small and unrepresentative slice of what Korea makes"
  - "Directors, writers, producers, studios and agencies. The link here is cast only. The industry may be far more connected through people we did not measure"
  - "Foreign cast. We filter to Korean citizenship (P27 = Q884), so international co-productions lose their non-Korean cast and the links those would create"
  - "Any claim that Wikidata's cast lists are complete. They are not, and they skew towards well-known names — which understates how many links exist and overstates how much of the linking famous people do"
---

Join every Korean film and series that has reached a Netflix Top 10 to the actors credited in it, and
a shape appears that is hard to see from any one title.

**668 titles. 1,395 actors. 3,588 casting slots.** Draw a line between two titles whenever they share
a credited actor, and the median title is connected to **16** others. *12.12: The Day* is connected to
115. Only 15 titles — 2.2% — share nobody with anything else.

Follow those lines and **651 of the 668 titles, 97.5%, form a single connected body.** There are 17
separate groups in total: one containing almost everything, and 15 titles sitting alone.

## We assumed a few people were holding it together. They are not.

The obvious explanation is a small repertory of very busy actors. Ma Dong-seok appears in 21 of
these titles, Hwang Jung-min in 20, Lee Byung-hun in 18, Sul Kyung-gu and Ha Jung-woo in 17 each.
Thirty-nine actors appear in ten or more. Pull those people out and the whole thing should fall apart.

We tested it. It does not.

| Actors removed | Titles left | Largest connected body | Median links per title |
| --- | ---: | ---: | ---: |
| none | 668 | 651 (97.5%) | 16 |
| 10 busiest | 656 | 638 (97.3%) | 14 |
| 20 busiest | 656 | 636 (97.0%) | 12 |
| 39 busiest (everyone with 10+ titles) | 647 | 626 (96.8%) | 11 |
| 50 busiest | 641 | 619 (96.6%) | 10 |
| 100 busiest | 615 | 582 (**94.6%**) | 7 |

Remove the hundred busiest actors in Korean Netflix-charting film and television — one in fourteen of
everyone in the set — and the remaining 615 titles are still 94.6% one connected body.

The median number of links does fall, from 16 to 7. Busy actors do a great deal of the connecting.
They are simply not load-bearing: take them out and the structure stands on everyone else.

For comparison, removing the hundred *least* busy actors changes almost nothing, as you would expect:
651 of 667 titles, 97.6%.

## Where the connection actually comes from

**Half the actors in this set appear in exactly one title.** 676 of 1,395 — 48.5%. Only 205 appear in
five or more.

So the connectivity is not the work of a famous few. It is the accumulated effect of a very large
number of people who did two or three of these, overlapping in different combinations. A production
does not need to hire a star to be joined to the rest; it needs to hire almost anyone who has worked
before.

| Title | Linked to | Cast recorded |
| --- | ---: | ---: |
| 12.12: The Day | 115 titles | 28 |
| Mr. Sunshine | 110 | 32 |
| Squid Game | 74 | 16 |
| The Thieves | 69 | 11 |
| Pinocchio | 70 | 43 |

Note that *The Thieves* reaches 69 titles on eleven recorded cast members while *Pinocchio* reaches 70 — one on eleven recorded cast
members, the other on forty-three. How connected a title is has little to do with how large its cast is.

## What would change this number

**A link is one shared actor.** That is deliberately weak. A single character actor with a scene in
two unrelated films joins them here. The median-links figure is the honest companion to the
97.5%: it says the typical title is not hanging on by one thread but sitting in a mesh of sixteen.

**Wikidata's cast lists are incomplete**, and they skew towards names someone thought worth writing
down. That cuts both ways: the true number of links is higher than we measure, and the share of
linking done by famous people is lower than it looks here.

**277 titles have no cast recorded at all** — 945 Korean titles are matched to Wikidata items and only
668 carry a P161 statement. Those 277 are not counted as isolated; they are absent.

**Only Korean citizens are counted.** International co-productions lose their non-Korean cast, and
with them the links to everything else those people have been in.

And this is cast alone. Directors, writers, producers, studios and agencies are not in it. If the
question is whether Korean screen output is made by an overlapping pool of people, cast is one
answer, and almost certainly the most conservative one available.

---

The body holds without its busiest people. It is built from pairs — and those barely repeat. [Read how rarely two actors work together twice →](/article/korean-casting-barely-repeats-itself)
