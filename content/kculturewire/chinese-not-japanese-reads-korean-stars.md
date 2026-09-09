---
title: "Chinese Wikipedia, not Japanese, is where Korean stars are read most — 306 of 478"
dek: "We asked Wikimedia how many people opened 478 Korean entertainers' articles in 15 language editions over three months. With English set aside, Chinese leads for 306 of them and Japanese for 142. These are languages, not countries."
category: stars
pubDate: 2026-09-09
dataAsOf: 2026-08-31T23:59:59+09:00
author: Newsroom
tags: ["kpop", "actors", "wikipedia", "language", "audience", "method"]
pages:
  - "/read-in"
sources:
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — pageviews/per-article, all-access, user agent only (bots excluded), monthly granularity, June to August 2026, requested separately for each of 15 language editions."
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Sitelinks — each edition's article title was read from the person's Wikidata entry rather than guessed, so a Japanese title is the one Japanese Wikipedia actually uses."
    url: "https://www.wikidata.org"
crossChecks:
  - "Every one of the 7,170 person-edition requests came back. None was blocked or rate-limited, so no cell in this count is a silent zero standing in for a failed request."
  - "Titles were resolved from Wikidata sitelinks, never constructed from a romanised name. We learned this the hard way: an early guess at one singer's entry returned a football stadium, which would have entered the count as that person's reads."
  - "English is excluded from the contest and we say so on the page rather than dropping it quietly. Every person here is read most in English, so leaving it in would produce one row and no information. Each person's English count is still printed."
  - "The Chinese lead survives a stricter test than the one we report. 59 of the 478 are read at least three times more in Chinese than in Japanese, a rule fixed before we looked at the result rather than tuned to it."
excluded:
  - "Any statement about why Chinese leads. Diaspora size, promotion patterns and the editing habits of each Wikipedia would all produce this shape, and nothing in pageview data separates them."
  - "1,511 of the 7,170 person-edition cells, which have no article at all. They are left empty rather than counted as zero: an edition with no article is a different fact from an article nobody opened."
---

Korean entertainment is usually described as reaching Japan first and the rest of Asia
after. We went to check that against reading, and the count came out the other way round.

We asked Wikimedia how many people opened the Wikipedia article of each of **478 Korean
entertainers**, in each of **15 language editions**, over **June to August 2026**. Setting
the English edition aside, the edition that reads them most is **Chinese for 306 of them**
and **Japanese for 142**.

## Which edition leads, with English set aside

| Edition | People it leads for | Share |
|---|---:|---:|
| Chinese | 306 | 64.0% |
| Japanese | 142 | 29.7% |
| Spanish | 15 | 3.1% |
| French | 5 | 1.0% |
| German | 5 | 1.0% |
| Russian | 4 | 0.8% |
| Thai | 1 | 0.2% |

Chinese does not merely edge Japanese. For **59 of the 478**, the Chinese edition is read at
least three times as much as the Japanese one — a rule we fixed before looking at the
answer, so that the threshold could not be chosen to flatter the result.

## The one thing that would make this article wrong

**A language edition is not a country.** Chinese Wikipedia is blocked in mainland China. Its
readers are in Taiwan, Hong Kong, Singapore, Malaysia and the wider Chinese-speaking
diaspora. If you read the table above as "China watches Korean stars," you have read it
incorrectly, and the error is ours to prevent rather than yours to catch.

The same caution applies down the column. Spanish is read across Spain and Latin America.
French covers France, Quebec and much of West Africa. Every row is a language.

## Why English is set aside, in the open

Every person in this panel is read most in English. Leaving English in the contest produces
a single row and tells you nothing, so we removed it — and we print that we removed it. A
comparison that quietly drops its largest column is not a comparison.

## What this is not

**It is not the whole roster.** Only people whose Wikidata entry links to at least 20
Wikipedia editions were measured, which is 478 of them. Someone with articles in two
editions is absent. So this describes widely documented people, not Korean entertainers in
general — and a threshold that we chose is doing part of the work, which is why it is
printed here rather than buried.

**It is not popularity.** A page climbs for good news and bad. We report the count and never
the reason.

**We do not say why.** Whether the Chinese lead reflects diaspora size, which stars are
promoted where, or simply how each Wikipedia is written, nothing in this data separates
those explanations. Measuring which of them is true would take a different dataset, and
until we have one, the honest sentence is that we cannot tell.

The full table, by edition and by person, is on
[which language edition reads Korean stars](/read-in).

*This is a count of Wikipedia reads. It is a statistic, not a statement about any
individual.*
