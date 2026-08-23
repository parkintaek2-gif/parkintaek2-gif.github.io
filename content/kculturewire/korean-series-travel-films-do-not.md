---
title: "Korean series reach three times as many countries as Korean films, and the gap is not about runtime"
dek: "Among the 232 Korean titles Netflix has verifiably filed as Non-English, the median series charted in 35 countries and the median film in 11. Series also last longer — but the country gap is the one runtime cannot explain."
category: titles
purpose: both
pubDate: 2026-08-07
dataAsOf: 2026-08-07T00:00:00+09:00
author: Newsroom
tags: ["korean drama", "korean film", "netflix", "reach", "korea"]
pages:
  - "/titles"
  - "/reach"
sources:
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), global and per-country, 265 weeks from 2021-07-04 to 2026-07-26"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin (P495 = Q884) and instance-of, to identify Korean titles and split film from series"
    url: "https://query.wikidata.org"
crossChecks:
  - "This piece uses only the 232 Korean titles that have appeared in a global Top 10 at least once, because Netflix labels the global chart by a title's primary language and the label is what verifies a title is the Korean work rather than a foreign one with the same name. Country charts carry no language field"
  - "Weeks count distinct chart weeks per title across every list it appeared in. Countries count distinct markets. Both are our aggregates of Netflix's published rows; we do not republish the rows"
  - "Film and series come from Wikidata's own instance-of statement, not from our reading of a title"
  - "Medians are used throughout. Squid Game distorts a mean of 144 series and tells you nothing about the typical one"
excluded:
  - "The 707 Korean titles that never reached a global Top 10. They cannot be language-verified, they are small — the median charted in one country for three weeks — and including them would mix an unverified population into a comparison this piece rests on"
  - "Hours viewed by country. Netflix publishes hours for the global chart only, so nothing here says how much anything was watched in any single market"
  - "Any claim about production budgets, licensing terms or how Netflix decides what to promote. None of that is published"
  - "Any claim that this is Korean output. It is Korean output that charted, which is a small and self-selected slice"
---

Netflix files its global Top 10 by a title's primary language, so a Korean work belongs on the
Non-English side. That label is the only thing in the published data that verifies a title is the
Korean work and not a foreign one with the same name. **238 Korean titles carry it.** Split them by
Wikidata's own film-or-series statement and the two halves behave very differently.

| | Films | Series |
| --- | ---: | ---: |
| Titles | 93 | 145 |
| Median weeks on a chart | 6 | 9 |
| Median countries reached | 11 | **35** |
| Reached 25 countries or more | 38.7% | **60.7%** |
| Lasted 10 weeks or more | 24.7% | 43.4% |

The staying-power gap has an easy explanation, and we have printed it on `/reach` for weeks: a film
is one sitting and a series is sixteen episodes, so a series holds a chart slot longer almost by
construction. Six weeks against nine is close to what runtime alone would produce.

**The country gap is not that.** Charting in Indonesia and not in Thailand is a different event from
staying on one chart for an extra fortnight. Nothing about episode count makes a title appear in
Poland. The median Korean series reached three times as many markets as the median Korean film, and
61.1% of series crossed 25 countries against 39.8% of films.

## What that leaves

Two things this data cannot settle, and we will not pretend otherwise.

We do not know how Netflix promotes titles, in which markets, or with what dubbing and subtitle
coverage. A series may travel further because a serial hooks a viewer for weeks and is therefore
worth pushing in more places — that is a plausible mechanism and it is not in the published data.

We also do not know what the 707 excluded titles would do. They are the ones that never reached a
global Top 10, so they carry no language label and we cannot confirm they are Korean at all. They
are small — the median charted in a single country for three weeks — but they are three-quarters of
the names our roster matched, and a comparison built on them would be a comparison built on
unverified rows. They are counted and named on `/titles` rather than quietly dropped.

Everything above is chart presence. It is not viewing, it is not revenue, and it is one service.
A Korean film absent from these lists may be doing well somewhere we cannot see.

---

Series travel further abroad. They also behave differently at home. [Read which titles skip Korea’s own chart →](/article/a-third-of-what-travels-never-charts-at-home)
