---
title: "Korea's exchange prices the same gold twice. The retail bar is not the dearer one."
dek: "KRX lists 99.99% gold in two sizes: a 1kg bar and a 100g mini. Over 49 sessions the mini closed higher by a median of 0.015 percent — and it closed lower on 22 of them. On five days the two moved in opposite directions."
category: commodities
pubDate: 2026-09-11
dataAsOf: 2026-09-09T00:00:00+09:00
author: Newsroom
tags: ["gold", "commodities", "KRX", "retail investors", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Korea) — general commodity market prices, via data.go.kr"
    api: "KRX gold market daily closes by listing (1kg and 100g bars), 49 sessions from 1 July to 9 September 2026"
    url: "https://www.data.go.kr"
crossChecks:
  - "Both listings are 99.99% gold on the same exchange, differing in bar size. Only sessions carrying a close for both were compared: 49 of 49 files held both, and none was dropped"
  - "The premium is the 100g close over the 1kg close, taken per session. The middle value across 49 sessions is 0.015 percent; the narrowest session is minus 0.291 percent (21 July) and the widest is plus 1.047 percent (9 September)"
  - "Direction was counted from each listing's own reported daily change. On 44 sessions both moved the same way and on 5 they moved opposite ways. Sessions where either listing reported zero change were counted as undetermined rather than as agreement; there were none"
  - "Median session volume was 221,569 for the 1kg listing against 10,983 for the 100g. The premium figures are printed beside those volumes because a thin listing and a deep one do not carry the same meaning"
excluded:
  - "Why the two prices part. This is a count of closes and reported changes. The registry carries no order book, no participant type and no settlement detail, so the mechanism behind a gap is not in this data"
  - "Physical premiums outside the exchange. Bank and dealer bars carry their own margins and are not in this file. Nothing here describes what a Korean household pays at a counter"
  - "Any period longer than these 49 sessions. Ten weeks is ten weeks. We restarted this collection on 11 September 2026 and it had never been run before, so there is no longer history to compare against yet"
  - "The oil side of the same dataset. It carries two separate weighted averages per fuel, competitive and negotiated, and deserves its own count rather than a paragraph here"
---

The Korea Exchange lists gold in two sizes. One contract is a **1kg bar** of 99.99 percent gold; the
other is a **100g mini bar** of the same metal at the same purity. Two listings, one substance.

We have counted this pair once before, on a different axis: in August we reported that
[turnover in the retail-sized 100g contract rose through the price decline](/article/korea-exchange-gold-down-from-january-peak),
running 72.3 percent above the 2025 daily average. That piece measured how much of each contract
traded. This one measures what the two of them cost.

The obvious assumption is that the small bar costs more — smaller units usually do. We counted 49
sessions to see whether that is true on this exchange. It is not, or at least not reliably.

## The gap is small, and it changes sign

| | Value |
| --- | ---: |
| Median premium of the 100g over the 1kg | **0.015%** |
| Sessions where the 100g closed **lower** | 22 of 49 |
| Narrowest session (21 July) | −0.291% |
| Widest session (9 September) | +1.047% |

A median of 0.015 percent is, for practical purposes, no premium at all: on a 190,000-won gram price
that is about 29 won. And the mini closed *below* the 1kg bar on nearly half the sessions, which is
the part that rules out a standing retail markup inside the exchange.

This is worth saying plainly because a single session would have told the opposite story. On
9 September the mini closed at 193,000 against 191,000 — a 1.047 percent premium, and the widest gap
in the whole window. Read that day alone and you would report that Korean retail-size gold trades a
percent dearer. It does not; that day was the outlier we happened to look at first.

## Five days when the same metal moved in opposite directions

The more interesting count is not the level but the direction. Each listing reports its own daily
change, so we counted how often the two agreed.

| | Sessions |
| --- | ---: |
| Both moved the same way | 44 |
| They moved **opposite** ways | **5** |
| Undetermined | 0 |

| Session | 1kg | 100g | Gap that day |
| --- | ---: | ---: | ---: |
| 13 August | +0.05% | −0.19% | −0.165% |
| 1 September | −0.10% | +0.09% | +0.265% |
| 4 September | +0.40% | −0.26% | +0.221% |
| 8 September | +0.28% | −0.08% | +0.272% |
| 9 September | −0.09% | +0.68% | +1.047% |

Gold did not do two things on those days. The same metal, on the same exchange, in the same session,
closed up in one size and down in the other. Four of the five fall in a two-week stretch at the start
of September, which is also where the widest gaps sit.

The likely reason is depth, and we can show the depth without claiming the mechanism: the 1kg listing
turned over a median of **221,569** units per session against **10,983** for the mini — about twenty
to one. A thin book moves on fewer orders. But this dataset holds closes and reported changes, not
order books, so that is where our evidence stops and we are leaving it there.

## Why this had never been counted

The data was already open and approved, and the collector for it was written on 4 August 2026. When we
looked today, `archive/raw/commodities` held **zero files**. The collector had never been run.

That is a worse failure than not having the data, because the header of that same collector records
the previous version of the mistake: *"the data was open and we had not attached a collector, so we
believed there was no source."* This time the collector existed and nobody pointed it at anything.

We have now pulled 1 July to 9 September — 49 sessions, 245 rows across gold and oil — and put the collection under the
same daily watch as the bond and broker archives. There is no way to recover the sessions before
1 July that the exchange no longer serves, and we are not going to pretend the ten weeks we have is a
year.
