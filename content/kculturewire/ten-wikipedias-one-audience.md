---
title: "Sing and act, and 10 Wikipedias write you up. Singers get 1"
dek: "Across 9,246 Korean entertainers, the 992 credited with both singing and acting sit in a median of 10 Wikipedia language editions, against 1 for either alone. Hold that count fixed and actors are still opened more often."
category: stars
purpose: both
pubDate: 2026-09-03
dataAsOf: 2026-08-27T14:34:00+09:00
author: Newsroom
tags: ["korea", "kpop", "actors", "wikipedia", "wikidata", "measurement"]
pages:
  - "/how-many-languages"
  - "/works-and-readers"
  - "/actor-reach"
sources:
  - org: "Wikidata"
    api: "P106 occupation and P463 member of musical group for 9,249 Korean entertainers, used to split people into singing, acting, or both"
    url: "https://query.wikidata.org"
  - org: "Wikidata"
    api: "Sitelink counts and dates of birth for the same roster, used for how many language editions carry a person and for age"
    url: "https://query.wikidata.org"
  - org: "Wikimedia"
    api: "REST pageviews API for English Wikipedia, human traffic only, 30 days to 2026-08-22"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "The language-edition gap is recomputed inside four age bands, because a longer career leaves a longer record, and it survives all four at 4x to 15x"
  - "The reading comparison is recomputed inside four bands of equal language-edition count, so the two sides are matched on how thoroughly the encyclopedia already covers them"
  - "People credited with both are split by whether they belong to a musical group, and the same split is run on people credited with singing alone as a control"
  - "Counts of people and counts of people with a reading figure are reported separately, because only 1,590 of the 9,246 appear on either pageview roster"
excluded:
  - "Direction. A widely covered person is more likely to have a second occupation recorded at all, and nothing here separates that from a second occupation drawing wider coverage"
  - "Whether a credit reflects a career. Wikidata records that a person is listed as a singer and an actor, not how much of either they did"
  - "Readers outside English Wikipedia. The reading figures are English only and say nothing about audiences inside Korea"
  - "The 7,656 people on the roster who appear on neither pageview list. They are counted as unmeasured, never as zero"
  - "Any claim that taking on a second craft will widen a person's record"
---

Two things get said about Korean entertainers who both sing and act. That the crossover is
everywhere now, and that it works. The first is countable. The second turns out to depend
entirely on what you mean by "works."

Wikidata records occupations for **9,249** Korean entertainers. Three have none recorded and drop
out. Of the remaining **9,246**, **992** carry credits for both singing and acting — one in nine.

## The record is ten times wider

Every person on Wikidata carries a sitelink count: the number of Wikipedia language editions that
have an article about them. It is the cleanest measure we hold of how far a name has travelled,
because it is filled in for all 9,246 people, not just the famous ones.

| Credited with | People | In a group | Median language editions | 90th percentile | In 10+ editions | In 1 edition only |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Both** | 992 | 557 | **10** | 26 | **51.9%** | 16.1% |
| Singing only | 3,671 | 1,343 | **1** | 8 | 8.1% | 64.9% |
| Acting only | 4,554 | 0 | **1** | 14 | 18.4% | 52.5% |
| Other | 29 | 0 | 3 | 10 | 13.8% | 24.1% |

Ten against one. Half the crossover group is written up in ten languages or more; among people
credited with singing alone, eight in a hundred are.

## It is not that they are older

A longer career leaves a longer record, and someone who has done two things has usually been
working longer. So the same comparison runs again inside four age bands.

| Age | Both | Singing only | Acting only | Both ÷ singing | Both ÷ acting |
| --- | ---: | ---: | ---: | ---: | ---: |
| Under 30 | 10 (n=139) | 1 (n=894) | 1 (n=597) | 10× | 10× |
| 30–39 | **15** (n=400) | 1 (n=1,211) | 1 (n=1,212) | **15×** | **15×** |
| 40–49 | 10 (n=254) | 1 (n=783) | 1 (n=1,305) | 10× | 10× |
| 50 and over | 4 (n=199) | 1 (n=783) | 1 (n=1,440) | 4× | 4× |

The gap survives every band, and it is **widest among people in their thirties**, not the oldest
ones. Age does not explain it away. If anything the youngest crossovers already have it.

## Being in a group stacks on top

Of the 992, **557 belong to a musical group** and 435 do not. Splitting there separates two things
that usually get discussed as one.

| | People | Median language editions | In 10+ editions | In 1 edition only |
| --- | ---: | ---: | ---: | ---: |
| Both, in a group | 557 | **14** | 66.1% | 6.5% |
| Both, no group | 435 | 5 | 33.8% | 28.5% |
| Singing only, in a group | 1,343 | 2 | 15.7% | 40.9% |
| Singing only, no group | 2,328 | 1 | 3.8% | 78.8% |

Group membership on its own moves the median from 1 to 2. Crossing into acting on its own moves it
from 1 to 5. Doing both puts it at 14. The control matters: if group membership were doing the work,
the singing-only rows would show it, and they move by one edition.

## Now the part that does not follow

A wider record is not a wider audience. English Wikipedia publishes how often each page is opened,
and **1,590** of the 9,246 appear on one of the two pageview rosters we hold. Matching the two sides
on language-edition count — so we are comparing people the encyclopedia covers equally thoroughly —
the ranking changes.

| Language editions | Both | Singing only | Acting only |
| --- | ---: | ---: | ---: |
| 1–2 | 4 (n=7) | 4 (n=45) | **111** (n=37) |
| 3–9 | 18 (n=123) | 12 (n=245) | **47** (n=163) |
| 10–24 | 83 (n=257) | 68 (n=154) | **141** (n=373) |
| 25 and over | 435 (n=84) | 396 (n=19) | **825** (n=65) |

Median daily openings. **Acting alone leads in all four bands.** Against people credited with
singing alone, the crossover group is ahead everywhere, but by 1.1× to 1.5× — not by ten.

So the ten-to-one is real and it is about the encyclopedia. Crossing crafts multiplies how many
languages carry your name. It does not multiply how many people open the page.

## What this cannot tell you

The direction is not settled and cannot be settled here. A person the world already covers widely is
more likely to have a second occupation entered on Wikidata at all — the record grows in both
directions at once, and nothing in these tables separates them. Read the ten-to-one as a description
of the record, never as advice about a career.

Three further limits. Wikidata says a person is *listed* as a singer and an actor; it does not say
how much of either they did, so a single film role and a decade of them count the same. The reading
figures are English Wikipedia only and are silent about audiences inside Korea. And **7,656** of the
9,246 appear on neither pageview roster — they are unmeasured here, not zero, and the crossover
group is over-represented among those we can measure precisely because they appear on both the
singer roster and the actor roster.

One number in the first table is worth keeping. **16.1% of the people credited with both are still
in one language edition only.** Doing two things is not a passport. It is a pattern that holds across
992 people and fails for 160 of them.

The tables behind this are at [kculturewire.com/how-many-languages](/how-many-languages?from=body), [kculturewire.com/works-and-readers](/works-and-readers?from=body) and [kculturewire.com/actor-reach](/actor-reach?from=body).
