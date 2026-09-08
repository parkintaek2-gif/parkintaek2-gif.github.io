---
title: "A Korean singer has been barred from the country for 24 years. Our data cannot see him — and that is the finding"
dek: "Wikidata records a birthplace for 149 of the 3,204 Korean names we track: 4.7%. Seven were born outside Korea. Nationality is not in there at all, so the biggest Korean story about citizenship and stardom is invisible to this record."
category: stars
purpose: both
pubDate: 2026-09-08
dataAsOf: 2026-08-21T00:00:00+09:00
author: Newsroom
tags: ["kpop", "wikipedia", "method", "data-gaps", "actors", "identity"]
pages:
  - "/born-abroad"
sources:
  - org: "Wikidata"
    api: "SPARQL — place of birth (P19) for each name in our Korean-stars panel, tested against Korea by coordinates (P625) rather than by country field (P17)."
    url: "https://query.wikidata.org/sparql"
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — reads per million of each language edition, August 2025 to July 2026, human traffic only."
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "We test Korea by coordinates, not by the country field, and that choice was forced by an error we made. Wikidata's P17 records involvement as well as location, which is how a battle fought in Vietnam once entered our list of Korean places. Coordinates cannot be dragged in by involvement, so the test is on a bounding box instead."
  - "The bounding box reaches 39.0 degrees north, which puts most of North Korea outside it. One person in the panel — Lee Soon-jae, born in Hoeryong — falls north of the box and is counted separately rather than filed as born abroad. A test built on a box has an edge, and naming the edge is cheaper than pretending it has none."
  - "The 149 with a birthplace are reported against the full 3,204, not treated as the panel. Nine more have a country recorded but no city, and nine have nothing usable; both counts are printed. The claim in this article is about coverage, so hiding the denominator would have destroyed the point."
limitation: "Wikidata's P19 records where a person was born, which is not where they are from — a hospital city is often recorded instead of the town somebody grew up in, so this article says 'born in' and never 'hometown'. Nationality, citizenship and immigration status are not fields we read at all, and nothing here should be taken as a claim about any individual's citizenship. Reading is counted on Wikipedia language editions, which is not the same as an audience in a country."
---

This week marked 24 years since a Korean singer, one of the biggest of his era, was barred
from entering the country over his change of citizenship. It remains one of the most argued
stories in Korean entertainment, and it is about nationality.

We went to check what our data says about nationality among Korean stars. The answer is
nothing, and it is worth publishing why, because the gap is larger than we expected.

## 149 of 3,204

Our Korean-stars panel holds **3,204 names**. Wikidata records a place of birth for
**149** of them — **4.7%**.

| What the record holds | People |
|---|---:|
| Born inside our Korea box | 123 |
| Born outside Korea | 7 |
| North of the box (North Korea) | 1 |
| A country but no city | 9 |
| Nothing usable | 9 |
| **Any birthplace at all** | **149 of 3,204** |

Nationality is not a field we read. Citizenship changes, dual citizenship, military-service
status, immigration bans — none of it is in the data we hold. So the single most famous
Korean story about citizenship and stardom sits entirely outside what this page can see, and
so does the singer at the centre of it: he is not in our reading panel either.

## The seven who are recorded

For completeness, here is everyone in the panel whose recorded birthplace is outside Korea,
with how much they are read across the Southeast Asian editions we track.

| Name | Born in | Reads per million |
|---|---|---:|
| Mark Lee | Toronto | 86.7 |
| Moon Ga-young | Karlsruhe | 75.1 |
| Jay Park | Seattle | 74.12 |
| DPR Ian | Sydney | 67.73 |
| Lomon | Tashkent | 54.67 |
| Felix Lee | Sydney | 46.01 |
| Jessica Jung | San Francisco | 42.84 |

Seven people. Not seven percent — seven people, out of a panel of more than three thousand
names. It would be easy to build a story on "Korean stars born abroad are read more," and
with seven cases we are not going to.

## Two decisions inside that table worth stating

**We test Korea by coordinates, not by country field.** Wikidata's country property records
involvement as well as location, which is how a battle fought in Vietnam once ended up in
our list of Korean places. Coordinates cannot be dragged in by involvement, so the test is a
bounding box.

**A box has an edge, and ours cuts North Korea.** It reaches 39.0 degrees north. Lee
Soon-jae, born in Hoeryong, falls outside the box but was not born abroad, so he is counted
in his own row rather than filed with the seven. That row exists because the alternative was
a quietly wrong number.

## Why publish an absence

Because the absence is the useful part. Anyone reading a "Korean stars born abroad" list —
ours included — should know it is drawn from the 4.7% of names that have a birthplace
recorded, and that the field says nothing about nationality. A list built on 4.7% coverage
can be interesting and cannot be representative, and those two things are easy to confuse
when the list is short and the names are famous.

We would rather print the denominator than the pattern. The seven names, the box, the edge
cases and the coverage counts are on the data page: [Korean actors born
abroad](/born-abroad).
