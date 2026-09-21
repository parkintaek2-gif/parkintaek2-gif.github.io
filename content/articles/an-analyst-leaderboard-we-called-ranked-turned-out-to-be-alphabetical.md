---
title: "An Analyst 'Leaderboard' We Called Ranked Turned Out to Be Alphabetical"
dek: "We published an article calling an analyst Korea's '#1-ranked' by score. The rank field we read was sorting 74 names alphabetically, not by performance. We're correcting it and showing how we caught it."
category: equities
pubDate: 2026-09-21
dataAsOf: 2026-09-18T14:42:57+09:00
author: Newsroom
tags: ["analysts", "equity research", "korea", "consensus", "data-quality"]
tickers: []
sources:
  - org: "Hankyung Consensus (Korea Economic Daily)"
    api: "Analyst leaderboard, api/v2/analyst/ranking endpoint"
    url: "https://markets.hankyung.com/analyst"
  - org: "SeoulMarkets"
    api: "Archived request/response our own collector made (collect-seoulmarkets-hankyung-analysts.mjs)"
    url: "https://seoulmarkets.com"
crossChecks:
  - "The collector's own documented request pattern for this endpoint is: /api/v2/analyst/ranking?page=N&periodType=1M&sort={\"key\":\"writerName\",\"orderBy\":\"asc\"}&paginate=true — writerName ascending, not a score or accuracy field."
  - "In the archived 18 September snapshot, all 74 analyst names run in exact Korean alphabetical order (verified by sorting the name list and comparing it to the stored order — identical)."
  - "The 'score' field in that same snapshot is not monotonic against the row position: row 1 is 8.16, row 2 is 7.79, row 3 is 8.1, row 4 is 9.4 — rising and falling, which a true score-sort could not do."
  - "Figures NOT affected by this error, independently re-verified from the score/accuracy columns directly rather than the row-position field: 27 of 74 analysts at 0% accuracy, 7 at 100%, median 25%, mean 31.7%, Pearson correlation between score and accuracy r=0.724 (previously published as 0.72)."
excluded:
  - "Whether the platform's page has a separate, true performance-sorted view we simply didn't capture — our collector records whichever request the page fires on load, and on this page that happens to be the name-sorted one. We have not gone back to find a differently-sorted request."
  - "Any performance judgment of Kang Min-gu or any other analyst — we no longer have grounds to call anyone '#1,' and we are not substituting a different #1 claim."
  - "Whether this endpoint's page=1 default has always been name-sorted, or changed at some point in the days we've been collecting it — we did not check every archived day's request pattern individually."
draft: false
---

Two days ago we published [an article](/article/top-ranked-korean-analyst-has-a-zero-percent-accuracy-score)
headlined "Korea's #1-ranked stock analyst has a stated 0 percent accuracy score." The headline
was wrong, and we're correcting it here.

## What we got wrong

The article treated a field labeled "순위" ("rank") — running 1 through 74 across a Hankyung
Consensus analyst leaderboard — as a performance ranking, and called the analyst in row 1, Kang
Min-gu of IBK Investment & Securities, "the analyst ranked #1 by score."

He isn't shown to be ranked first by anything. The request our own collector makes to fetch this
page is documented, in our own script, as sorting by `writerName` — the analyst's name — in
ascending order. We checked the archived data against that: all 74 names in the 18 September
snapshot run in exact Korean alphabetical order, start to finish. The "score" field sitting next
to each name jumps up and down with no relationship to row position — 8.16, then 7.79, then 8.1,
then 9.4 in the first four rows alone, which a genuine score-sort could never produce. Kang Min-gu
is first alphabetically, not first by performance. We had the field selection right and the
sentence wrong.

## What survives the correction

Not everything in the original article depended on the broken "rank" field. The correlation
figure and the accuracy distribution are computed directly from the score and accuracy columns,
which are real values regardless of what order the rows arrived in — sorting a list differently
doesn't change the numbers inside it.

| | Originally published | Re-verified today |
|---|---:|---:|
| Analysts in the snapshot | 74 | 74 |
| 0% accuracy | 27 (36.5%) | 27 (36.5%) |
| 100% accuracy | 7 (9.5%) | 7 (9.5%) |
| Median accuracy | 25% | 25% |
| Correlation, score vs. accuracy (r) | 0.72 | 0.724 |

Those hold up. What doesn't hold up is any claim about who is "#1," because we never actually had
a performance rank to read in the first place — only an alphabetical list that happened to also
carry score and accuracy columns.

## How we'd have caught this earlier

The tell was sitting in our own collector script the whole time: the request pattern it documents
literally names the sort key. We read the archived output without checking that comment against
the data. The fix going forward is mechanical, not judgment-based — before any article calls a
numbered field a "rank," we now check whether the value in the adjacent score/metric column is
monotonic against that number. If it isn't, the number is a list position, not a rank, whatever
the platform calls it.

A correction notice with this same explanation has been added to the original article.

*This is not investment advice. Figures are drawn from a published broker-research leaderboard
and are presented for data-quality reporting, not as a trading signal.*
