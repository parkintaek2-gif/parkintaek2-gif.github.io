---
title: "The Same Analyst Dataset That Mislabeled a Rank Would Also Let You Rank Firms on 3 Data Points"
dek: "Grouping the September 18 analyst snapshot by brokerage firm gives averages from 16.7% to 54.2% accuracy. The lowest belongs to the firm of the analyst our earlier article wrongly called 'ranked #1' — driven by a three-person sample."
category: equities
pubDate: 2026-09-21
dataAsOf: 2026-09-18T00:00:00+09:00
author: Newsroom
tags: ["hankyung-consensus", "analysts", "data-quality", "sample-size", "korea"]
sources:
  - org: "Hankyung Consensus (Korea Economic Daily)"
    api: "Analyst leaderboard, api/v2/analyst/ranking endpoint (collect-seoulmarkets-hankyung-analysts.mjs)"
    url: "https://markets.hankyung.com/analyst"
crossChecks:
  - "The 18 September snapshot lists 74 analysts across 12 brokerage firms. Grouping the accuracy column by firm gives firm averages ranging from 16.7% (IBK Investment & Securities, n=3) to 54.2% (Eugene Investment & Securities, n=4)."
  - "Kang Min-gu — the analyst our earlier, corrected article mistakenly called 'ranked #1 by score' (he was actually row 1 of an alphabetically-sorted list) — works at IBK Investment & Securities, the firm with the lowest average of the 12 in this snapshot."
  - "IBK's three analysts individually score 0%, 50%, and 0% accuracy. The firm's 16.7% average is arithmetic on three numbers, one of which (the 50%) is doing all the work of keeping it above zero."
  - "Eugene Investment & Securities' four analysts score 100%, 100%, 16.7%, and 0% — the highest firm average in the snapshot also comes from four numbers that disagree with each other by 100 percentage points."
excluded:
  - "Any claim that IBK Investment & Securities' research team is weaker than other firms' — three analysts in a one-month snapshot cannot support that claim, which is this article's point, not something it is working around."
  - "Any causal link between the rank-field error in our earlier piece and this firm-level pattern — they are two separate issues inside the same dataset, not the same mistake twice."
  - "Firm-level figures for brokerages with only one analyst in the snapshot (for example Sangsangin Securities, n=1) — we do not report those as a 'firm score' anywhere below, because one person is not a firm."
  - "Any period longer than this one-month snapshot — the platform re-computes this window fresh each time we collect it, so we cannot yet build a multi-month firm trend from our own archive."
draft: false
---

Earlier today we corrected an article that had called an analyst "ranked #1 by score" when the
field we read was actually an alphabetically sorted row position. That analyst, Kang Min-gu, works
at IBK Investment & Securities. Looking at the same snapshot from a different angle turns up a
second, unrelated way this dataset can mislead: IBK's three analysts average the lowest accuracy of
any brokerage firm in the list — 16.7 percent — and that average rests on a sample small enough that
one analyst's one good month is the only thing keeping it off zero.

## What the firm-level numbers actually show

| Firm | Analysts (n) | Average accuracy |
|---|---:|---:|
| Eugene Investment & Securities | 4 | 54.2% |
| Hanwha Investment & Securities | 5 | 48.3% |
| eBest Investment & Securities | 3 | 43.9% |
| Daishin Securities | 10 | 39.0% |
| Hi Investment & Securities | 5 | 38.6% |
| iM Securities | 8 | 35.7% |
| Sangsangin Securities | 1 | 33.3% |
| SK Securities | 11 | 23.8% |
| Yuanta Securities | 11 | 23.8% |
| LS Securities | 7 | 21.8% |
| Meritz Securities | 6 | 20.8% |
| IBK Investment & Securities | 3 | 16.7% |

Every one of these is a one-month accuracy figure averaged across however many analysts the
platform happened to list for that firm on that day — anywhere from 1 to 11. IBK's three analysts
score 0%, 50%, and 0%; take away the analyst who scored 50% and the firm average is zero. Eugene's
four analysts score 100%, 100%, 16.7%, and 0% — the firm sitting at the top of this table contains
two analysts who called almost everything right and one who called almost everything wrong.

## Why we are not calling this a firm ranking

A table like this invites reading down the "average accuracy" column as if it ranked research
quality by firm. We don't think it supports that. Three or four data points is not a research
department's track record; it is a coin-flip-sized sample dressed in a percentage. The same caution
applies in the other direction — we are not defending IBK's number either. Both ends of this table
say more about sample size than about any firm's analysts.

## What connects this to this morning's correction

Nothing causal — the two problems are independent. The morning correction was about a mislabeled
field (a name-sorted list called a performance rank). This one is about a labeled field (accuracy)
that is real and correctly computed, but thin enough per firm that averaging it produces numbers
that swing on one analyst's one month. Both sit in the same underlying dataset, which is why we
keep coming back to it today rather than treating either finding as a one-off.

*This is not investment advice. Figures are drawn from a published broker-research leaderboard and
are presented for data-quality reporting, not as a trading signal or an assessment of any firm's
research quality.*
