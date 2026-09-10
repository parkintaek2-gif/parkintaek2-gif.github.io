---
title: "Korea lists about 260 currency futures. Ten of them trade."
dek: "Across seven sessions the Korean exchange carried 1,848 currency-futures listing-days. Seventy had any volume at all. The 1,260 belonging to one product class — dollar flex futures — recorded not a single trade."
category: fx
pubDate: 2026-09-11
dataAsOf: 2026-09-09T00:00:00+09:00
author: Newsroom
tags: ["fx", "currency futures", "KRX", "liquidity", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Korea) — derivative product prices, via data.go.kr"
    api: "KRX derivatives daily closes by listing; currency-futures rows only, 7 sessions from 1 to 9 September 2026"
    url: "https://www.data.go.kr"
crossChecks:
  - "The unit counted is a listing-day, not a contract series: 258 to 270 currency listings appear on each of 7 sessions, giving 1,848 rows. Series roll as they expire, so the same listing is not present on every day and we do not add days together to claim a number of listings"
  - "A listing-day counts as traded when its reported volume is 1 or more. Rows with zero volume are kept and counted, because what is being measured is how many listings sit there without trading"
  - "Volume by currency over the window: US dollar 5,839,344 contracts, yen 9,997, euro 2,009, yuan 166. Those sum to 5,851,516, of which the dollar is 99.79 percent"
  - "Open interest is summed separately from volume, because a listing can carry positions on a day it records no trade. Over the window: dollar 8,623,452, euro 170,001, yen 98,980, yuan 167"
  - "Currency names were taken from the exchange's own product-class field, not inferred from listing names. No row in the window failed to yield a currency"
excluded:
  - "Any comparison in money. Contract sizes differ between these currencies, and this dataset does not carry them, so the counts above are in contracts and are not converted to notional. A larger contract count is not a larger exposure"
  - "Why a class does not trade. A product can be listed for reasons this file does not record — a market-maker obligation, a standing quote facility, an institutional facility used off-book. The data shows the zero, not its cause"
  - "Options. This is futures only. Korea's options market is larger and different and is not in these rows"
  - "Any period longer than these 7 sessions. This collection had never been run before 11 September 2026, so there is no history behind it yet. Seven sessions is seven sessions"
---

Every financial outlet in Korea reports the won. Almost none reports the market where the won is
traded forward — and it turns out that market is much smaller than its listing count suggests.

We pulled seven sessions of Korean exchange derivatives and kept the currency rows: **1,848
listing-days**. Then we counted how many of them recorded any volume at all.

| | Listing-days |
| --- | ---: |
| Currency futures listed | 1,848 |
| With any volume | **70** |
| Share that traded | **3.79%** |

Per session that is a steady eight to eleven listings out of roughly 260. The count of listings falls
by two each day as series expire; the count that trades does not move.

## One product class accounts for the entire gap

The listings are not evenly dead. Of the 1,848 listing-days, **1,260 belong to dollar flex futures**,
a class of negotiated-terms contracts. Over seven sessions those 1,260 listing-days recorded:

| | Listing-days | With volume |
| --- | ---: | ---: |
| Dollar flex futures | 1,260 | **0** |
| Everything else | 588 | 70 |

Not one trade. That single class is about two-thirds of Korea's currency-futures board, and across
the whole window it did nothing at all.

That is not by itself a criticism. A listing can exist to be available rather than to be busy, and
this file does not record why any product is listed. But the number matters for anyone reading a
count of Korean currency products as a measure of market breadth: two-thirds of the board is a
facility, not a market.

## And the market that remains is one currency

| Currency | Listing-days | Traded days | Volume (contracts) | Open interest |
| --- | ---: | ---: | ---: | ---: |
| US dollar | 1,533 | 37 | 5,839,344 | 8,623,452 |
| Yen | 105 | 20 | 9,997 | 98,980 |
| Euro | 105 | 7 | 2,009 | 170,001 |
| Yuan | 105 | 6 | **166** | **167** |

The dollar is **99.79 percent** of the volume. That is not surprising in direction, but the size of
it is worth printing: the other three currencies together are two-tenths of one percent of the
contracts traded.

The yuan line is the one to sit with. China is Korea's largest trading partner. Over seven sessions
its futures traded on six listing-days for a total of **166 contracts**, and closed the window with
**167 contracts** of open interest — a number small enough to write out rather than round.

Two smaller things fall out of the same table. The yen traded on nearly three times as many
listing-days as the euro (20 against 7), yet the euro carries almost twice the open interest
(170,001 against 98,980) — positions held rather than turned over. And the dollar's own numbers show
the same shape at scale: 1,533 listing-days, 37 of them with a trade, and open interest larger than
the entire window's volume.

## What these counts are not

They are counts of **contracts**, not money. Contract sizes differ between these currencies and this
dataset does not carry them, so we have not converted anything to notional and no line above should
be read as exposure. A currency with more contracts is not thereby a bigger position.

They are also seven sessions. We started this collection on 11 September 2026 — the collector had
been written and never run, and the archive folder did not exist — so there is no prior history to
compare against. Nothing here says whether 3.79 percent is normal for this market or unusual for this
week. It says what these seven sessions held, which is more than was known about them yesterday.
