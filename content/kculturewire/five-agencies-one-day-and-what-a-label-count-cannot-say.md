---
title: "Five agencies pushed releases on the same day. We can measure the reading for nine labels — and 147 we cannot"
dek: "Cube, SM and Hybe all had something out this week. For each of nine K-pop companies we hold a reader count, but the share of the roster we can see runs 37% to 67% — so the ranking everyone wants is the one thing the data will not give."
category: industry
purpose: both
pubDate: 2026-09-08
dataAsOf: 2026-09-04T20:39:00+09:00
author: Newsroom
tags: ["kpop", "labels", "industry", "wikipedia", "method", "attention"]
pages:
  - "/label-reach"
sources:
  - org: "Wikidata"
    api: "SPARQL — record label (P264) for each person in our Korean-stars panel, with labels grouped into their listed parent company so a group of labels counts once."
    url: "https://query.wikidata.org/sparql"
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — daily reads per person, human traffic only, expressed per day."
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "The coverage figure is published beside every company figure, and it is what makes this not a ranking. Of the artists we can attach to a company, the share who also reach a reader count runs from 37.2% at Hybe to 66.7% at FNC. Two companies measured at different coverage are not comparable, and the page says so in the same table rather than in a footnote."
  - "147 of 156 companies are excluded rather than shown with a small number. Our floor is 20 identifiable artists; below it a median moves on one person. The excluded count is printed, so a reader can see how much of the industry is missing rather than assuming the nine are the industry."
  - "A person attached to two companies is counted in both, so the company totals add up to more than the number of people. That is stated in the data file rather than silently reconciled, because collapsing it would mean choosing which company owns a person and we have no basis for that choice."
limitation: "A Wikipedia read is somebody looking a name up. It is not sales, not streams, not revenue and not a judgement of a company — we hold no financial data for any label here. Only artists whose Wikidata entry records a label can be attached to a company, and the ones who cannot be attached are concentrated among less-known names, which pushes every median upward. Only the English Wikipedia is counted."
---

Within one day this week, K-pop release news came from at least five different companies:
Jeon Soyeon of i-dle with a first full album (Cube), Hearts2Hearts with a teaser (SM),
Le Sserafim with one (Hybe), plus Evan and Close Your Eyes.

The obvious question is which agency's roster actually commands attention. We have a data
page that gets closer to it than anything else we hold, and the honest headline is that
**it refuses to answer that question** — for a reason worth explaining.

## What we can count

For every person in our Korean-stars panel, Wikidata sometimes records a record label. We
group labels into their listed parent company, so a company with several imprints counts
once, and then we add up how much each roster is read on English Wikipedia per day.

Nine companies clear our floor of 20 identifiable artists.

| Company | Artists we can name | Of those, with a reader count | Coverage | Reads per day, whole roster |
|---|---:|---:|---:|---:|
| YG Entertainment | 109 | 57 | 52.3% | 20,332 |
| Hybe | 94 | 35 | 37.2% | 13,106 |
| JYP Entertainment | 72 | 33 | 45.8% | 12,189 |
| Kakao Entertainment | 67 | 36 | 53.7% | 9,194 |
| SM Entertainment | 133 | 55 | 41.4% | 9,163 |
| CJ ENM | 69 | 36 | 52.2% | 6,078 |
| FNC Entertainment | 48 | 32 | 66.7% | 4,891 |
| Cube Entertainment | 38 | 25 | 65.8% | 3,233 |
| DSP Media | 46 | 24 | 52.2% | 3,226 |

## Why that is not a league table

Look at the coverage column before the reads column. Hybe's roster is measurable at
**37.2%**; FNC's at **66.7%**. Those two numbers are not the same measurement, so the
reads beside them cannot be laid side by side and called a result.

And the missing artists are not missing at random. The people whose Wikidata entry has no
label, or whose page draws no measurable reading, are concentrated among the less-known —
which means every median on this page is pulled upward, and pulled upward by different
amounts for different companies.

Then there is the rest of the industry. Our panel touches **156 companies**. Nine clear the
floor of 20 identifiable artists. **147 do not**, and we show them as a count rather than as
nine rows of noise. Anyone treating the nine as "the K-pop industry" is looking at the part
that happens to be written down.

## What the table is good for

Two things, and they are real.

First, **the spread within a roster.** YG's roster reads 20,332 a day in total and 198 for
its median artist; SM's reads 9,163 in total and 102 for its median. A company can be large
in aggregate because of a handful of names, or broad across many, and those are different
businesses. The gap between a total and a median is the part of this data that survives the
coverage problem, because it compares a company with itself.

Second, **the floor.** Below the biggest few names, the numbers get small fast, in a way
that matches what we found counting acts rather than companies: [24 acts of 774 hold half
of all the reading](/attention-share). The label view and the act view are two cuts of the
same lopsidedness.

## What we will not do

We will not publish a company ranking off a measurement that sees between a third and two
thirds of each roster. If a reader wants that ranking, the honest answer is that this data
cannot support it, and that saying so is more useful than a table that looks like it can.

The nine companies, the coverage figures, the top three names inside each roster, and the
count of what we had to leave out are on the data page: [how many artists we can actually
count](/label-reach).
