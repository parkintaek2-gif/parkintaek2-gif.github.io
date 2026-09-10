---
title: "Korea's euro futures are held and not traded. Its yen futures are traded and not held."
dek: "A follow-up to our August count, on an axis it did not carry: open interest. Korea's euro book is two-thirds larger than its yen book and turns over about a fortieth as fast. Yuan open interest is 21 to 41 contracts."
category: fx
pubDate: 2026-09-11
dataAsOf: 2026-09-09T00:00:00+09:00
author: Newsroom
tags: ["fx", "currency futures", "KRX", "open interest", "liquidity", "korea"]
tickers: []
corrections:
  - date: 2026-09-11
    note: "First published as a fresh count of listed-versus-traded currency futures. That was our own August finding restated on a shorter window, and this piece has been rewritten to cite that article as the count of record and to report only the axis it did not carry, open interest. The listing and turnover figures now appear here only as agreement with the earlier, larger sample."
sources:
  - org: "Financial Services Commission (Korea) — derivative product prices, via data.go.kr"
    api: "KRX derivatives daily closes, volume and open interest by listing; currency-futures rows only, 7 sessions from 1 to 9 September 2026"
    url: "https://www.data.go.kr"
crossChecks:
  - "Open interest and volume are summed per currency per session from the exchange's own fields, with no reclassification. Currency names come from the exchange's product-class field, not from listing names"
  - "Daily open interest by currency across the seven sessions: euro 24,040 to 25,588, yen 13,229 to 14,688, yuan 21 to 41. Daily volume over the same sessions: euro 9 to 1,551, yen 432 to 2,529, yuan 0 to 60"
  - "Turnover is stated as a ratio of that session's volume to that session's open interest, so the length of the window does not affect it. Median across the seven sessions: yen 11.75 percent, euro 0.29 percent. Both are computed per session and then taken at the middle, never by dividing one currency's total by another's"
  - "The listing and concentration figures agree with our own larger count of 629 trading days to 3 August 2026: dollar 99.0 percent of turnover there, 99.79 percent here; 1,272 never-traded flexible dollar listings there, 1,260 listing-days with no trade here"
excluded:
  - "The primary count of this market. That is our August article on 629 trading days, cited below. Seven sessions cannot improve on it and this piece does not try"
  - "Any comparison in money. Contract sizes differ between these currencies and this dataset does not carry them, so every figure here is in contracts. A larger contract count is not a larger exposure, and the euro-versus-yen comparison below is deliberately stated as a ratio within each currency rather than across them"
  - "Why the euro book sits still. Hedging horizon, participant type and roll behaviour would all produce this shape, and the data carries none of them"
  - "Options, and any period outside these seven sessions. The daily archive behind this piece begins on 1 September 2026"
---

On 4 August we published [a count of Korea's currency futures](/article/korea-currency-futures-one-contract)
across 629 trading days: the dollar was 99.0 percent of turnover, and 1,272 flexible-dated dollar
listings had never traded once. That remains the count of record, and this piece does not restate it.

It does add one axis that count did not carry. Alongside volume, the exchange publishes **open
interest** — the positions still standing at the close. Volume says what moved. Open interest says
what is being held. For two of Korea's currency futures those two numbers point in opposite
directions, and they do it on every one of the seven sessions we have.

## The euro book is bigger and barely moves

| Session | Euro open interest | Euro volume | Yen open interest | Yen volume |
| --- | ---: | ---: | ---: | ---: |
| 1 Sep | 25,588 | 52 | 13,229 | 1,555 |
| 2 Sep | 24,129 | 1,551 | 13,477 | 432 |
| 3 Sep | 24,083 | 179 | 13,824 | 2,529 |
| 4 Sep | 24,062 | 69 | 14,533 | 2,094 |
| 7 Sep | 24,040 | 52 | 14,634 | 587 |
| 8 Sep | 24,049 | 97 | 14,688 | 1,804 |
| 9 Sep | 24,050 | 9 | 14,595 | 996 |

The euro book is about **two-thirds larger** than the yen book and sat within 1.5 percent of 24,050
contracts for six straight sessions. On 9 September nine contracts changed hands against 24,050 held.

Stated as turnover — that session's volume over that session's open interest — the middle session
looks like this:

| | Median turnover |
| --- | ---: |
| Yen | **11.75%** |
| Euro | **0.29%** |

About **forty times** the churn on the smaller book. The euro position in Korea is something
market participants put on and leave; the yen position is something they trade.

We are not going to tell you why. Hedging horizon, who the holders are, and how they roll would each
produce this shape, and none of the three is in this file. What the file supports is that the two
behave differently enough that reading either one from turnover alone would mislead you: by volume the
yen looks like the second currency in this market, and by positions held it is the third.

## And the yuan book is 21 to 41 contracts

Our August piece put yuan futures at 0.03 percent of turnover. Open interest gives the same fact a
blunter form. Across these seven sessions the standing yuan position was:

| Session | 1 Sep | 2 Sep | 3 Sep | 4 Sep | 7 Sep | 8 Sep | 9 Sep |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Open interest | 21 | 21 | **1** | 21 | 21 | 41 | 41 |

Twenty-one contracts. On 3 September, one. China is Korea's largest trading partner, and the standing
position in its currency on Korea's own exchange is a number you can write out.

## Where this agrees with the larger count

Two figures here can be checked against the 629-day sample, and they match:

| | 629 days to 3 Aug | 7 sessions to 9 Sep |
| --- | ---: | ---: |
| Dollar share of turnover | 99.0% | 99.79% |
| Flexible dollar listings with no trade | 1,272 contracts | 1,260 listing-days |

That agreement is the only reason to trust a seven-session read at all, and it is why the open-interest
finding above is stated as what these seven sessions hold rather than as how this market works.
