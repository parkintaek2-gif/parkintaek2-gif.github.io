---
title: "New Korean groups look 69% down since 2015. We are not publishing that, and here is what killed it"
category: industry
dek: "Wikidata records 691 Korean musical groups with a formation year. The 2023-25 average is 31% of the 2015-17 average. Then we ran the same count for Japan, the United States and the United Kingdom — and all three fell too."
pubDate: 2026-08-22
dataAsOf: 2026-08-08T00:00:00+09:00
author: Newsroom
pages:
  - "/what-actually-fell"
tags: ["korea", "k-pop", "industry", "method", "limits"]
sources:
  - org: "Wikidata"
    api: "Musical groups (P31/P279* = Q215380) by country of origin (P495), with inception (P571) and dissolution (P576), CC0"
    url: "https://www.wikidata.org/"
crossChecks:
  - "The same query was run unchanged for Japan, the United States and the United Kingdom; all four countries fall by a similar amount over the same years."
  - "Only 67 of the 691 Korean groups carry a dissolution date — 9.7% coverage — so the lifespan question cannot be answered from this source either."
---

Count the Korean musical groups on Wikidata that carry a formation year and you get 691. Sort them
by that year and the shape is dramatic: an average of 38.7 new groups a year in 2015-17, down to 12
a year in 2023-25. That is 31% remaining — a fall of 69%.

It would make a headline. We are not running it, because we ran one more query first.

## The query that killed it

We changed one field — country of origin — and asked the same question of three other music
industries.

| Country | Groups with a formation year | 2015-17 average | 2023-25 average | Remaining |
| --- | --- | --- | --- | --- |
| South Korea | 691 | 38.7 | 12.0 | 31% |
| Japan | 1,381 | 28.3 | 12.3 | 43% |
| United States | 11,058 | 60.3 | 13.3 | 22% |
| United Kingdom | 3,820 | 26.7 | 6.0 | 22% |

All four fall. The United States and the United Kingdom fall harder than Korea does.

Four unrelated music industries do not decline together on the same schedule. What fell is not the
number of groups being formed. It is **how quickly this source records them.** A group that started
in 2015 has had eleven years for someone to write it into Wikidata; a group that started in 2024
has had two.

## Why we looked at all

Because the number was sitting in a file we had already built, and a 69% fall in new Korean groups
is the kind of thing that gets repeated once someone prints it. The control cost one query.

This is the same instrument we used on a different question two weeks ago: a fall of a third in
reads of Korean pages turned out to be a fall in reads of *everything*, and the story changed from
"Korea is fading" to "this is what a quiet quarter looks like". That one is on
[what actually fell](/what-actually-fell).

## The second question this source cannot answer either

How long does a Korean group last? Of the 691 groups with a formation year, only **67** carry a
dissolution year. That is 9.7% coverage.

The 67 have a median life of three years, and we are not printing that as an answer. A group only
gets a dissolution date on Wikidata if someone bothered to record that it ended, which selects for
groups whose ending was newsworthy. The other 624 are a mix of groups still working and groups
that quietly stopped, and this source cannot tell those apart.

## What we would need

A registry of debuts kept by someone whose job is to keep it — a national body, a label
association, a chart operator — with a fixed rule for what counts as a debut and a fixed date of
entry. Wikidata is a volunteer encyclopaedia. It is excellent at recording that a group exists and
poor at recording it *promptly*, and those two things look identical in a chart until you add a
control.

We measured this on 8 August 2026 and left it unpublished for two weeks because there was nothing
to say. Writing down that a number is unusable is also a result, so here it is.
