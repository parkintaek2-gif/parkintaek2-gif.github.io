---
title: "Only 1.8% of Korean casting pairs ever work together twice — barely more than chance would give you"
dek: "Across 635 charting Korean titles there are 13,558 pairs of actors who have shared a production. 250 of them have done it more than once. Shuffle the same casts at random and you get about 208. The repertory company is mostly not there."
category: people
pubDate: 2026-08-08
dataAsOf: 2026-08-08T00:00:00+09:00
author: Newsroom
tags: ["korea", "casting", "network", "wikidata", "null model"]
pages:
  - "/actors"
  - "/titles"
sources:
  - org: "Wikidata"
    api: "Cast member (P161) for every Korean title matched to a Wikidata item, restricted to people with Korean citizenship (P27 = Q884), joined on Q-numbers rather than names"
    url: "https://query.wikidata.org"
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), global and per-country, used to decide which titles are in the panel at all"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "The null model reshuffles the same people across the same titles, holding every cast size fixed, so it compares the observed pairing against chance with the same number of roles to fill"
  - "The null was run 30 times; the median is quoted and the range is given rather than a single draw"
  - "Pairs are counted once per title, so two people credited together in one production count once however many scenes they share"
excluded:
  - "Directors, writers and producers. Wikidata's P161 is cast, and a repertory habit could easily live behind the camera where we cannot see it"
  - "Any claim that Wikidata's cast lists are complete. They are not, and the direction of that error is stated below"
  - "Titles with no recorded cast. 266 of the 901 matched Korean titles carry no P161 statement and are absent from this entirely"
---

Take every Korean film and series that has reached a Netflix Top 10 and has a cast recorded in
Wikidata — **635 titles, 1,355 people, 3,413 credited roles**. Draw a line between two people every
time they appear in the same production.

You get **13,558 distinct pairs**. Of those, **250 have worked together more than once.** That is
**1.8%**.

| Times a pair has shared a title | Pairs |
| --- | ---: |
| Once | 13,308 |
| Twice | 235 |
| Three times | 13 |
| Four times | 2 |

The two pairs at four are Jo Woo-jin with Kim Eui-sung, and Ma Dong-seok with Park Ji-hwan. Across
635 productions, nobody in this data has shared a credit with the same person five times.

## Chance would give you almost the same number

1.8% sounds low, but low compared to what? So we built the comparison: keep every title's cast size
exactly as it is, pour all 3,413 roles into one pile, and deal them back out at random.

**A random Korean film industry produces about 208 repeat pairs. The real one produces 250.**

Thirty shuffles gave a median of 208 and a range of 167 to 263 — so the observed 250 sits above the
middle of the random distribution but inside its range, and one shuffle in thirty beat it outright.
**Observed is 1.2 times chance.** That is a real effect and a small one.

## What that rules out

**It rules out the repertory company as a description of the whole industry.** If Korean production
ran on a few tight circles who cast each other repeatedly, this ratio would not be 1.2. It would be
several times chance, and the four-time pairs would be commonplace rather than two of them.

It does not rule out that such circles exist. Ma Dong-seok and Park Ji-hwan have made four of these
titles together, which is not chance for those two people. The finding is about the aggregate: **the
circles are too few and too small to bend the whole distribution.**

## What could hide a repertory habit from us

Three things, and all of them push in the same direction — **they make the real figure higher than
1.8%, not lower.**

**Wikidata's cast lists are short.** The median title here lists four people. A real production has
dozens of credited actors, and the ones Wikidata records are the well-known ones. Two character
actors who work together constantly can share ten films and never produce a single pair in our data
because neither is listed.

**We only see titles that charted.** A director who casts the same four people in everything will
show up here only for the productions that reached a Netflix Top 10. The rest of that body of work is
outside the panel.

**And we cannot see behind the camera.** P161 is cast. If Korean production has a repertory habit, the
most likely place for it is a director returning to the same crew, and none of that is in this data.

So read 1.8% as **a floor on repetition and a ceiling on how confidently we can talk about it.** What
we can say is narrower: in the part of the industry that is visible in charting titles and recorded
casts, actors pair up close to randomly.

## Why we ran the shuffle at all

Because "only 1.8% repeat" is the kind of number that reads as a finding and is not one on its own. A
sparse network of 1,355 people spread over 635 small casts will produce very few repeats no matter how
it is organised. Without the null model we would have published a fact about arithmetic and called it
a fact about Korean casting.

The shuffle is what turns it into a claim: **not "repeats are rare" but "repeats are barely more
common than they would be if nobody chose anybody."**
