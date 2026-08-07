---
title: "Appearing in more Netflix hits raises a Korean actor's floor, not their ceiling"
dek: "Actors in six to nine charting Korean titles are looked up seven times as often as those in one. But the busiest are not the most looked-up: Lee Byung-hun has 19 charting titles and 54,309 views; Steven Yeun has one and 106,201."
category: people
pubDate: 2026-08-07
dataAsOf: 2026-08-03T00:00:00+09:00
author: Newsroom
tags: ["korean drama", "netflix", "attention", "wikipedia", "actors", "korea"]
pages:
  - "/actors"
sources:
  - org: "Wikimedia Foundation"
    api: "Pageviews API, en.wikipedia, all-access, user agent class 'user', 30 days from 2026-07-05 to 2026-08-03"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Cast member (P161) on the Korean films and series that have appeared in a Netflix Top 10"
    url: "https://query.wikidata.org"
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), used to decide which Korean titles the roster is drawn from"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "The roster is a rule, not a list we typed: everyone Wikidata records as a cast member of a Korean title that reached a Netflix Top 10, and who has an English Wikipedia article. 1,008 were measured"
  - "787 of the 1,008 qualify for this piece. We require at least 300 views over the month and at least 25 days of data, because a name with 40 views produces a wild median from ordinary noise. The 221 excluded are small, not hidden"
  - "Medians are used throughout, not means. Lee Byung-hun and Steven Yeun each distort a mean and neither tells you about the typical actor"
  - "The relationship is also reported as a rank correlation over all 787, so the banded table cannot be accused of choosing its own cut points. Spearman is 0.341"
  - "Every view figure comes from the actor panel's own window, 2026-07-05 to 2026-08-03. It is not the same window as our K-pop panel and the two are never mixed inside one number"
excluded:
  - "Filmography. The count here is Korean titles that reached a Netflix Top 10 — not a career. An actor with thirty years of work shows 1 if only one of those works ever charted"
  - "Which titles. Our collector stored how many charting titles each actor appeared in and not which ones, so we cannot say what drove any individual's attention. We are fixing the collector; we are not going to guess in the meantime"
  - "Any claim about causation in either direction. Being cast in hits and being looked up are both downstream of things this data does not contain"
  - "Any claim about pay, billing or role size. A lead and a one-scene part are the same row in P161"
---

Take every Korean actor Wikidata places in the cast of a title that has reached a Netflix Top 10 —
1,008 of them have English Wikipedia articles — and ask a simple question: does appearing in more of
those titles mean more people look you up?

Yes, and the effect is large. It also stops.

| Charting Korean titles | Actors | Median views in 30 days |
| --- | ---: | ---: |
| 1 | 261 | 1,811 |
| 2 | 170 | 3,347 |
| 3 | 117 | 4,767 |
| 4–5 | 132 | 8,966 |
| 6–9 | 84 | **13,194** |
| 10 or more | 23 | 11,863 |

From one title to six-to-nine, the median rises **more than sevenfold**. Then it turns over. The
twenty-three actors with ten or more charting titles are looked up slightly *less* often than the
eighty-four with six to nine.

Across all 787 actors the rank correlation is **0.341** — real, and much weaker than the table alone
suggests. Volume explains part of this and nothing like all of it.

## The busiest people are not the most looked-up

| | Charting titles | Views |
| --- | ---: | ---: |
| Lee Byung-hun | 19 | 54,309 |
| Ma Dong-seok | 18 | 43,207 |
| Ha Jung-woo | 18 | 10,182 |
| Sul Kyung-gu | 17 | 10,747 |
| Hwang Jung-min | 15 | 20,544 |
| Kim Eui-sung | 15 | 4,417 |

Now the other end of the same panel:

| | Charting titles | Views |
| --- | ---: | ---: |
| Steven Yeun | 1 | 106,201 |
| Nam Joo-hyuk | 2 | 101,843 |
| Jisoo | 1 | 76,744 |

Kim Eui-sung has fifteen charting titles and 4,417 views. Steven Yeun has one and 106,201 — more
than twenty times as many. Both figures are correct and they are not in tension, because they
measure different things: one is how much Korean screen work a person has done that travelled, the
other is how many people typed their name into English Wikipedia in July.

The reading that survives is narrower than the headline table. **Appearing in more hits raises the
floor, not the ceiling.** Working constantly moves an actor from 1,811 to 13,194 — from invisible to
solidly present. It does not put anyone at the top. The top of this panel is held by people carrying
something the panel cannot see: a career in English-language film, a place in a globally known
group, a single show that broke out.

## One title versus two

The cleanest cut in the data is not at ten. It is at two.

| | Actors | Share of actors | Share of views | Median |
| --- | ---: | ---: | ---: | ---: |
| One charting title | 261 | 33.2% | 13.7% | 1,811 |
| Two or more | 526 | 66.8% | 86.3% | 5,852 |

A third of the panel has appeared in exactly one Korean title that reached a Netflix Top 10, and
that third holds an eighth of the attention. The median actor with two or more charting titles is
looked up **3.23 times** as often as the median actor with one.

Whether that is a second title creating attention or attention creating a second booking, this data
cannot say, and neither can any dataset we can reach.

## Three things this does not measure, and one we broke ourselves

**It is not a filmography.** A charting title means a Korean film or series that reached a Netflix
Top 10 somewhere. An actor with thirty years of work shows 1 if only one of those works ever
charted. Kim Eui-sung's fifteen is fifteen *charting* titles, not fifteen credits.

**It is not billing.** Wikidata's P161 records a cast member. A lead and a one-scene part are the
same row. Some of the ten-or-more group are character actors who appear in everything, which is a
plausible reason that band turns over, and we cannot test it here.

**It is not popularity.** Every figure counts openings of an English Wikipedia article over thirty
days. Not tickets, not streams, not attention inside Korea.

And one gap is our own doing. **Our collector stored how many charting titles each actor appeared
in, and not which ones.** So we can tell you that Roh Yoon-seo drew 100,832 views across four
charting titles, and we cannot tell you which four. Every question that begins *did this show move
its cast* is unanswerable from what we saved. We are fixing the collector to keep the link. The
pageview history can be re-fetched at any time; the join we discarded has to be re-queried from
scratch, which is the more expensive of the two mistakes and the one we made.

We would rather print that than report the count as though it were the whole story.
