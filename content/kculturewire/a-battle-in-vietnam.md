---
title: "The most-read Korean place in Vietnamese was a battle fought in Vietnam"
category: tradition
dek: "We published 2,238 Korean places. Nineteen are not in Korea, including the one leading the Vietnamese column. The field we selected on records who was involved, not only where a thing is — and our first check reused it and found nothing."
pubDate: 2026-08-16
dataAsOf: 2026-08-16T00:00:00+09:00
author: Newsroom
tags: ["wikipedia", "southeast asia", "places", "method", "correction"]
pages:
  - "/places"
sources:
  - org: "Wikidata"
    api: "Country (P17) and coordinate location (P625), CC0"
    url: "https://www.wikidata.org/"
  - org: "Wikimedia"
    api: "Pageviews API, human traffic only, monthly, per edition"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "All 2,238 places were re-tested against their coordinates, not a sample. Every one returned a coordinate, so nothing was left unmeasured."
  - "The nineteen removals were checked one by one by name and coordinate rather than by rule alone."
---

Since 9 August this site has carried a page answering a simple question: which parts of Korea do
readers in Indonesia, Vietnam, Thailand and Malaysia look up? It ranked 2,238 places by how often
their Wikipedia articles were opened.

At the top of the Vietnamese column sat the Battle of Khe Sanh.

Khe Sanh is in Quang Tri Province. The battle was fought there in 1968. It is not a Korean place,
and it should never have been on that page.

## How it got in

We did not choose the places by hand. An earlier version of the collector listed a dozen Wikidata
types — palace, island, district — and came back with zero neighbourhoods and zero districts,
because Korean administrative units carry their own type items that we had not guessed. So the
collector was rewritten to ask a simpler question: everything whose country is South Korea and
which has a coordinate.

That is where the mistake lives. Wikidata's country property does not only record where something
is. It also records who was involved. The Battle of Khe Sanh carries two countries — South Vietnam
and South Korea — because South Korean troops fought in that war.

Eighteen more entered the same way. Two Korean Air crash sites, at the point where each aircraft
came down rather than where the airline is based. The Order of Friars Minor, whose coordinate is in
Rome. Jang Bogo Station, which is Korean and is in Antarctica. Two North Korean provinces, one of
them typed on Wikidata as a province of *South* Korea. Three circles of latitude, whose recorded
longitude is zero.

## What our own check said first

We wrote a check for this. It asked Wikidata for the country of all 2,238 places and counted how
many were not South Korea.

It found none.

Of course it did. The panel was selected on the country property, so a check that reads the country
property will agree with the panel every time. It was not a check. It was the same question asked
twice.

The instrument that works is the coordinate. A location does not follow a belligerent. We drew a
box around Korea — latitude 32.5 to 39.0, longitude 124.0 to 132.5, deliberately generous, wide
enough to hold Jeju and Dokdo — and tested every place against it.

Nineteen fall outside. Together they were **4.61 per cent** of every read in the panel, and one of
them led a column.

| Removed | What it is | Reads per million | Where it actually is |
| --- | --- | --- | --- |
| Battle of Khe Sanh | battle | 63.42 | 16.65, 106.72 |
| East China Sea | marginal sea | 13.55 | 30.00, 125.00 |
| Yellow Sea | sea | 11.87 | 35.00, 123.00 |
| Korean Air Lines Flight 007 crash | airspace intrusion | 11.72 | 46.57, 141.28 |
| East Asian Football Federation | governing body | 11.50 | 35.49, 137.27 |
| Order of Friars Minor | mendicant order | 7.99 | 41.90, 12.45 |
| Korean Air Flight 858 | aviation accident | 4.80 | 14.55, 97.38 |
| Jang Bogo Station | Antarctic research station | 0.12 | −74.62, 164.20 |

Eleven smaller ones are listed on the page itself.

## What changes

The Vietnamese column now opens with President of South Korea at 46.88 reads per million, then
Seoul at 45.91. The panel holds 2,219 places rather than 2,238. The page's headline finding — that
an entertainment company is looked up more than Seoul is — does not move, because none of the
nineteen were near it.

We have listed the nineteen on the page with their coordinates rather than removing them quietly.
A correction that only says "we took some things out" asks you to trust exactly the judgement that
just failed.

## The part worth keeping

The box is ours. We drew it, we drew it wide, and a place sitting a few kilometres outside it would
be dropped for a reason that is our decision rather than a fact. We would rather keep a borderline
Korean place than lose one, so the box errs large. Socotra Rock, a submerged reef South Korea and
China both claim, sits just outside it and is among the nineteen.

The more useful lesson is the one about our first check. A check built from the same field as the
thing it checks cannot fail, and a check that cannot fail is not evidence of anything. That was
also true of a measure we published yesterday: a leave-one-out test that could detect instability
in a median but could never establish stability, because the method understates how much a median
moves.

Both times the fix was the same. Reach for a different instrument, and be specific about what the
old one could never have seen.

The full list, the box, and the page it corrects are at
[which parts of Korea get looked up](https://www.kculturewire.com/places).
