---
title: "New K-pop groups look 69% down. So does every other kind"
dek: "Four countries, one identical decline: new group debuts look 69% down since 2017 in Korea, and just as far down in Japan, America and Britain. What we had measured was not the industry but how fast Wikidata records a new group."
category: titles
genre: music
purpose: both
pubDate: 2026-08-08
dataAsOf: 2026-08-08T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "wikidata", "measurement", "method"]
pages: []
sources:
  - org: "Wikidata"
    api: "Musical groups (P31/P279* = Q215380) by country of origin (P495 = Q884, Q17, Q30, Q145), with inception (P571) and dissolution (P576), queried 2026-08-08"
    url: "https://query.wikidata.org"
crossChecks:
  - "All four countries are counted with the identical query, changing only the country identifier, so nothing about the method differs between the group we care about and the controls"
  - "The two comparison windows are three years each and fixed before the control countries were run — 2015 to 2017 against 2023 to 2025"
  - "The collector refuses to run if any country's earlier window is empty, because a ratio against zero would look like a finding"
excluded:
  - "Any claim about how many Korean groups actually debut each year. That is the number we wanted and the number we do not have"
  - "Any claim that Wikidata is slow, as opposed to something else that moves all four countries together. We can show the four move together; we cannot show why"
  - "How long Korean groups last. Only 67 of 691 carry a dissolution date, and the ones that do are not a random sample"
  - "Groups with no recorded inception date at all, which are excluded from every figure here and are not counted anywhere on this page"
---

Here is a question we get asked, and it looks easy: **how many new K-pop groups debut each year?**

New K-pop groups look 69% down since 2017 — that is what the query says, and it is the sentence
we nearly published as a finding.

Wikidata answers it in one query. Korean musical groups, with a recorded formation date, counted by
year. It returns 691 groups and a clean shape: a rise through the 2010s, a peak, then a fall.

| | 2015–2017, per year | 2023–2025, per year | Remaining |
| --- | ---: | ---: | ---: |
| South Korea | 38.7 | 12.0 | **31%** |

Read alone, that is a story. New Korean groups down by more than two-thirds in six years, right as
the industry's global profile was supposedly at its highest. We could have published it this
morning.

## Then we ran the same query for three other countries

| | Groups with a formation date | 2015–2017, per year | 2023–2025, per year | Remaining |
| --- | ---: | ---: | ---: | ---: |
| South Korea | 691 | 38.7 | 12.0 | 31% |
| Japan | 1,381 | 28.3 | 12.3 | 43% |
| the United States | 11,058 | 60.3 | 13.3 | 22% |
| the United Kingdom | 3,820 | 26.7 | 6.0 | 22% |

Every one of them falls. American group formation does not collapse by 78% in the same six years
that Korean group formation collapses by 69% and British by 78%, for reasons internal to four
separate music industries. **What fell is not the number of groups. It is how quickly this source
records them.**

A group formed in 2024 does not get a Wikidata item the week it debuts. Someone writes an article,
someone else creates the item, someone else adds a formation date. The lag is invisible in any
single country's chart, and it looks exactly like a decline.

## Why we are publishing the failure instead of the finding

We nearly ran the first table on its own. The reason we did not is that the control took eleven
minutes and the article would have been wrong for years.

That is the whole method here, and it is not specific to K-pop: **when a count comes from a source
that people maintain by hand, ask what the same count does somewhere the story should not apply.**
If the shape survives, it is about the subject. If the shape appears everywhere, it is about the
source.

We are keeping the query and the numbers in our data files, marked unusable as a trend, because
someone will run it again — possibly us — and get the same clean-looking line.

It is the same discipline behind [our K-pop attention page](/kpop-attention), where the counts come
from Wikipedia traffic that is recorded the day it happens rather than whenever an editor gets to
it, and behind [how we build every number here](/about).

## The other thing this source cannot tell you

While we were in there we tried a second question: **how long does a Korean group last?** There is a
widely repeated idea that seven years is the natural span, because that is the length of a standard
Korean artist contract.

Of the 691 Korean groups with a recorded formation date, **67 have a recorded dissolution date** —
9.7%. Among those the median span is 3 years, and there is no bump at seven: 7 groups ended at seven
years against 6 at six.

We are not reporting that as evidence against the seven-year idea, because a 9.7% sample of endings
is not a sample of endings at all. **Groups that quietly stop are far less likely to have someone
record a dissolution date than groups that announce a split.** The number we can produce is
therefore biased in a direction we cannot size, and the honest output is this paragraph rather than
a chart.

## What would answer either question

For debuts, a source that records the event at the time it happens — a national registry, a chart
body, or a broadcaster's own listings. For endings, the same. Wikidata is excellent at telling you
what exists and poor at telling you when you are looking at all of it.

If a reader knows of a Korean source that publishes group debuts by year with a fixed collection
date, we would like to hear about it: [parkintaek2@gmail.com](mailto:parkintaek2@gmail.com). We
would rather run the count properly than not run it.
