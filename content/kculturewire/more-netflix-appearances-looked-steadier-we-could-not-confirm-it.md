---
title: "More Netflix Chart Appearances Looked Steadier. We Could Not Confirm It"
dek: "Korean cast in 7+ Netflix Top 10 titles had a narrower 30-day Wikipedia reading spread (0.25) than those in just 1 title (0.31). A resample test says that gap shows by chance alone 11.2% of the time — short of what we call confirmed."
category: industry
purpose: both
genre: drama
pubDate: 2026-09-22
dataAsOf: 2026-09-04T00:00:00+09:00
author: Newsroom
tags: ["netflix", "wikipedia", "method", "steadiness", "limits"]
pages:
  - "/what-moves-english-reading"
sources:
  - org: "Wikimedia Foundation — Pageviews API"
    api: "Daily pageviews on English Wikipedia, all-access, user agents only, 24 July-22 August 2026 (30 days), for 1,113 Korean cast members."
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata + Netflix Top 10 (Tudum) weekly country lists"
    api: "P161 (cast member) crossed with Korean titles that reached a Netflix country chart, to count how many charting titles each person appeared in."
    url: "https://www.wikidata.org/"
crossChecks:
  - "Steadiness ratio = last 7 days of reading summed / first 7 days summed, over the 30-day window. A ratio near 1.0 means reading held roughly flat; further from 1.0 means it moved."
  - "1 charting title (446 people): median ratio 0.98, interquartile spread 0.31. 2-3 titles (362 people): spread 0.27. 4-6 titles (199 people): spread 0.26. 7+ titles (106 people): spread 0.25."
  - "The spread does narrow as chart-title count rises, in the direction 'more appearances, steadier reading.'"
  - "Resample test: we redrew 106 people from the 1-title group 10,000 times and checked how often that redraw's spread matched or beat the actual 7+-title group's spread of 0.25, purely from the smaller sample size alone (no real steadiness effect). Result: 11.2% of the redraws did. A smaller sample narrows the spread on its own, so seeing the real 7+ group's narrower spread only some of the time in a real-effect-free redraw means we cannot rule out that sample size alone explains what we saw."
excluded:
  - "A claim that more Netflix chart appearances cause steadier attention. Even if the gap is real, this cannot separate 'more appearances → steadier reading' from 'people who are already steadily read get cast more.'"
  - "Anything about Korean-language attention. This counts English Wikipedia reading only."
  - "A finding we would call confirmed. We are publishing the negative result — a real-looking gap that a noise check could not clear — rather than rounding it up to a finding."
---

Actors and other cast members who showed up in seven or more Netflix Top 10 Korean titles had a narrower spread of 30-day English Wikipedia reading swings than people who appeared in just one. The gap points the direction you would expect. We ran the number that tells you whether to believe it, and it falls short.

## What we measured

For each of 1,113 Korean cast members credited on a Netflix-charting Korean title, we took the ratio of their last 7 days of English Wikipedia reading to their first 7 days, across a 30-day window. A ratio near 1.0 means their reading held steady; a ratio far from 1.0 means it moved a lot in one direction.

| Netflix charting titles | People | Median ratio | Interquartile spread |
|---|---|---|---|
| 1 title | 446 | 0.98 | 0.31 |
| 2-3 titles | 362 | 1.01 | 0.27 |
| 4-6 titles | 199 | 1.03 | 0.26 |
| 7+ titles | 106 | 1.04 | 0.25 |

The spread — how wide the middle half of each group's ratios is — narrows steadily as chart-title count rises, from 0.31 down to 0.25.

## Why we are not calling this confirmed

A narrower spread in a smaller group can happen just because it has fewer people, with no real effect behind it — extreme swings are rarer to catch in a smaller sample by chance alone. To check whether that is all that happened here, we redrew 106 people from the 1-title group at random, 10,000 times, and asked how often that random redraw's spread came out as narrow as, or narrower than, the actual 7+-title group's 0.25 — with no real steadiness effect built in, since it's the same 1-title population every time. The answer: 11.2% of the 10,000 redraws did.

That is not nothing — a truly random relationship would not usually clear a real group's narrower spread — but it is short of the bar we hold for calling a pattern confirmed. We are reporting the gap and the test together, rather than the gap alone.

More single-cause and multi-day spikes are tracked on our
[what-moves-english-reading](/what-moves-english-reading) hub.

*These are statistics, not you. This is not investment advice.*
