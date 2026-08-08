---
title: "We said we could not count the acts our K-pop panel misses. We can, and it is 1,312 groups."
dek: "Wikidata holds 2,128 Korean musical groups. Our attention panel sees the 816 with an English Wikipedia article. Among singers the gap is wider — 5,408 exist, we measure 1,421, and 3,572 of the missing ones have a Korean article."
category: music
pubDate: 2026-08-08
dataAsOf: 2026-08-08T00:00:00+09:00
author: Newsroom
tags: ["k-pop", "wikipedia", "measurement", "coverage", "data quality"]
pages:
  - "/kpop-attention"
  - "/data"
sources:
  - org: "Wikidata"
    api: "Korean musical groups (P31/P279* from Q215380 with P495 = Q884) and people with Korean citizenship (P27 = Q884) in four music occupations — singer Q177220, rapper Q2252262, composer Q639669, musician Q753110 — counted with and without an English Wikipedia sitelink"
    url: "https://query.wikidata.org"
  - org: "Wikimedia"
    api: "Pageviews API (en.wikipedia, all-access, user), the source our attention panel is built from"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "The 816 groups with an English article is exactly the group count in our own panel, which is built by the same class and citizenship filters — the two queries agree without being told to"
  - "The occupation queries use the same four Wikidata occupation codes as the pageviews collector, so the comparison is against our real selection rule rather than a similar one"
  - "Occupation rows overlap, since a person can be both singer and composer, so they are reported separately and never summed"
excluded:
  - "Any total across the occupation rows. They overlap and adding them would double-count people"
  - "The number of Korean groups that have a Korean Wikipedia article but no English one. That query returned HTTP 504 on three attempts and we are leaving the cell empty rather than filling it with an estimate"
  - "Anyone Wikidata does not hold either. Every figure here is a floor on what we miss, not a total"
  - "Any claim about why coverage differs by occupation. We can show the pattern; we cannot measure the cause from these counts"
corrections:
  - date: 2026-08-08
    note: "Our /data page said of acts with no English Wikipedia article: 'they are invisible — and we cannot say how many there are.' That was true of the panel and false of what we could reach: Wikidata records the same acts and can be counted directly. The page now carries the figures below. Nothing in the attention panel changes; what changes is that the size of its blind spot is now stated instead of waved at."
---

Our K-pop attention panel has **2,362 rows** — 816 groups and 1,545 people. It is built from English
Wikipedia pageviews, so an act with no English Wikipedia article produces no row at all.

Until today [our data page](/data) said of that gap: *"they are invisible — and we cannot say how
many there are."*

The first half was true. The second half was us not trying. Wikidata records Korean acts whether or
not English Wikipedia does, and it can be counted.

## The size of the blind spot

| In Wikidata | Exists | We measure | We miss | Share missed |
| --- | ---: | ---: | ---: | ---: |
| Musical groups | 2,128 | 816 | **1,312** | 61.7% |
| Singers | 5,408 | 1,421 | **3,987** | 73.7% |
| Rappers | 357 | 248 | 109 | 30.5% |
| Composers | 243 | 96 | 147 | 60.5% |
| Musicians | 311 | 270 | 41 | 13.2% |

The group row is the cleanest test of the method, because our panel's own group count is **816** —
the same number, arrived at independently by the query that builds the panel. The two agree without
being told to, which is what makes the 2,128 usable as a denominator.

**The occupation rows overlap** — a person can be a singer and a composer both — so they are never
added together. Each row is its own comparison.

## Most of the missing are not obscure to Koreans

Of the 3,987 singers we cannot see, **3,572 have a Korean Wikipedia article.** They are documented,
they are just documented in Korean. The same holds for 110 of the 147 missing composers and 79 of
the 109 missing rappers.

That matters for what our attention numbers mean. A panel built on English pageviews is not a panel
of Korean music; it is a panel of **Korean music that has been written up in English**, and the two
diverge most exactly where a reader might most want the difference explained.

## The gap is not the same size everywhere

| | Share we miss |
| --- | ---: |
| Singers | 73.7% |
| Musical groups | 61.7% |
| Composers | 60.5% |
| Rappers | 30.5% |
| Musicians | 13.2% |

Rappers and musicians are covered two to five times better than singers. **We can show that and we
cannot explain it from these counts.** A plausible reading is that "singer" is the catch-all label
that Wikidata applies across decades of Korean popular music while "rapper" attaches mostly to a
narrower and more recent group, but that is a story about how Wikidata labels people, and testing it
would need debut years attached to every item — a different query, and one we have not run.

What we can say is that the blind spot is **structured, not random**. Any figure we publish about
attention is a figure about the covered part, and the covered part is a different shape in each
occupation.

## One cell we left empty

We wanted the same Korean-article breakdown for groups. That query returned **HTTP 504 three times**
and we stopped. The cell in our data file is `null`, not `0`, because those are different facts and a
zero there would say we had looked and found none.

## What changed on the page

`/data` no longer says we cannot count this. It says how many, per category, and it says the figure
is a floor — anyone missing from Wikidata as well is still uncounted, and we have no way to reach
them at all.

This is the second time this week a limitation we had written down turned out to be measurable once
we tried. The first was
[the claim that our source file repeats rows](/article/a-weekly-top-ten-is-not-ten-titles), which
turned out to be seasons charting separately. **A stated limitation is not a finished one**, and the
sentence that admits it is exactly the sentence nobody goes back to check.
