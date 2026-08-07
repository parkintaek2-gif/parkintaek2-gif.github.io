---
title: "Eight Korean brokers publish fractional-share lists. Only 46 stocks are buyable at all eight."
dek: "The industry body posts each broker's list of stocks you can own in fractions. Put the eight side by side and the longest list turns out to be mostly sell-only — and 1,202 of the 2,586 listed stocks cannot be bought in fractions anywhere."
category: equities
pubDate: 2026-08-07
dataAsOf: 2026-02-27T00:00:00+09:00
author: Newsroom
tags: ["fractional shares", "brokerages", "retail investing", "market structure", "korea"]
tickers: []
sources:
  - org: "Korea Financial Investment Association (KOFIA)"
    api: "증권사별 국내주식 소수점 매매 가능 종목 목록 — eight broker files, posted 2026-02-27"
    url: "https://www.kofia.or.kr/brd/m_52/list.do"
crossChecks:
  - "The eight files are matched on the six-character KRX code, not the stock name. Brokers write the same company differently — CJ대한통운 at one firm is 씨제이대한통운보통주 at another — so matching on names would have split single stocks into two"
  - "Each file carries a 비고 (remarks) column that three of the eight brokers actually use. Every distinct value was mapped explicitly: blank and 정상 to tradable, 매도만 가능 to sell-only, 매매불가 to blocked. Kiwoom's three other values — 감리, 거래정지, 관리대상 — are market-wide suspension states, not broker policy, and are counted separately rather than folded into 'tradable'"
  - "Korean stock codes are not all digits — 00088K and 0126Z0 are real codes for preferred shares and subscription-rights certificates. An earlier digits-only parse rejected one KB row and stopped the run rather than silently dropping it"
  - "Row counts were read from the sheets themselves, not from the summary figure each file prints in its second row, which is roughly double the row count in every file"
  - "Eight household names — Samsung Electronics, SK Hynix, Hyundai Motor, NAVER, Kakao, LG Chem, Samsung Biologics, LG Energy Solution — were checked individually and are buyable in fractions at all eight brokers"
excluded:
  - "Why a stock is sell-only. Shinhan marks 2,022 of its 2,450 entries 매도만 가능, and the files give no reason. A plausible reading is that fractions can arrive through corporate actions at stocks the firm never opened for buying, but the data does not say so and we do not assert it"
  - "Minimum order sizes, fees and the FX and settlement terms attached to fractional orders. These differ by broker and are not in the files"
  - "Whether a broker's list has changed since the 27 February posting. KOFIA posts a snapshot, not a feed; brokers may have added or dropped stocks since"
  - "Overseas stocks. Every Korean broker in the files also offers fractional trading in US shares under separate rules; these lists cover domestic stocks only"
  - "Any judgement about which broker is better. A longer list is not a better service, and this article ranks lists, not firms"
draft: false
---

Buying a fraction of a share sounds like a feature of the market. In Korea it is a feature of your brokerage account. Each firm decides which stocks it will slice, and the lists do not agree — not roughly, not at the edges. Put all eight side by side and the overlap is 46 stocks.

The Korea Financial Investment Association posts the lists, one spreadsheet per broker, in a corner of its notices board. Nobody has put them next to each other. We did.

## The eight lists

| Broker | Stocks listed | Of those, buyable |
| --- | ---: | ---: |
| Shinhan Investment | 2,450 | **428** |
| Kiwoom Securities | 1,051 | 1,032 |
| NH Investment | 847 | 847 |
| Samsung Securities | 656 | 656 |
| Hanwha Investment | 448 | **76** |
| Hana Securities | 404 | 404 |
| KB Securities | 402 | 402 |
| Mirae Asset Securities | 330 | 330 |

Read the first column and Shinhan looks like the most generous house in Korea, with a list nearly six times Mirae Asset's. Read the second and it drops to fourth. Of its 2,450 entries, **2,022 are marked 매도만 가능** — sell only. You can dispose of a fraction there; you cannot open one.

Hanwha's file is blunter still. It marks each row 정상 or 매매불가, and 372 of 448 are 매매불가 — blocked. Seventy-six stocks survive. It publishes the fifth-longest list and offers the smallest fractional universe of the eight.

Kiwoom is the only broker whose exclusions are not its own doing: nineteen of its rows are marked 감리, 거래정지 or 관리대상 — surveillance, trading halt, administrative issue. Those are exchange states. Every other name on its list is open.

## What the overlap looks like

Across the eight files there are **2,586 distinct stocks**. That number is the one a press release would use, and it is the one to distrust. Only **1,384** can be bought in fractions at even one of the eight. The other 1,202 appear solely on sell-only or blocked lists — they are on the paperwork and not on the menu.

Then the 1,384 fan out:

| Buyable at… | Stocks |
| --- | ---: |
| all 8 brokers | **46** |
| 7 brokers | 115 |
| 6 brokers | 106 |
| 5 brokers | 83 |
| 4 brokers | 133 |
| 3 brokers | 161 |
| 2 brokers | 196 |
| exactly 1 broker | **544** |

Forty-six stocks are fractionally buyable everywhere. Five hundred and forty-four — nearly two in five of the buyable universe — exist at exactly one firm, and two firms hold most of them: Kiwoom is the sole fractional venue for 300 stocks, NH for 178. Samsung has 30, Shinhan 27, Hana four, Hanwha three, Mirae Asset two. KB is the only broker that is nobody's only option.

## The part that works

None of this touches the top of the market. Samsung Electronics, SK Hynix, Hyundai Motor, NAVER, Kakao, LG Chem, Samsung Biologics and LG Energy Solution are fractionally buyable at all eight brokers — we checked each one. Someone opening an account with fifty thousand won and an interest in Korea's largest companies will not notice any of this.

It bites one step down. The stocks that show up at one broker and nowhere else are mid-caps and preferred lines — the second tier, where a small investor most needs fractions to build a position at all. There, the answer to "can I buy a tenth of this" is not a market fact. It is a fact about which app you downloaded.

## Why the count is the story

The lists are public, and each one is accurate about itself. What no single file can show is that the word "listed" means something different at each firm. One broker lists what it sells. Another lists what it will let you exit. A third lists what it has blocked. Stack them and you get 2,586 — a number that is true of the paperwork and false about the market.

The honest count is 1,384, and the number a fractional investor can rely on regardless of where they hold their account is 46.
