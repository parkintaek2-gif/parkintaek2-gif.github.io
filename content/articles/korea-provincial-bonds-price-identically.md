---
title: "Korea's provinces all borrow at the same price — the gaps are empty order books"
dek: "Seventeen regional governments issue near-identical bonds. In the vintages that actually trade, the widest gap between any two provinces is 3.2 basis points — narrower than the day-to-day swing inside a single province's own bond."
category: rates
pubDate: 2026-08-04
dataAsOf: 2026-07-31T18:00:00+09:00
author: Newsroom
tags: ["bonds", "local government", "credit spreads", "liquidity", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Korea)"
    api: "Bond Price Information Open API — getBondPriceInfo (daily close, yield, volume by issue)"
    url: "https://www.data.go.kr"
excluded:
  - "Any spread of provincial bonds over Korean treasuries. Treasury yields in this window run from 2.015% to 12.022% because the sample mixes maturities across the curve, and the feed does not carry a residual-maturity field. Averaging that into one number would be meaningless, so no sovereign comparison is made here"
  - "45 of 1,870 line items were dropped for implausible yields — a negative figure, three zeroes, and readings up to 21,911%. These are convertible and structured issues whose quoted yield the feed does not compute meaningfully. They were removed, not corrected"
  - "Why provincial credit is priced the same. The data shows that it is; it does not contain the reason"
  - "Anything about issuance volume or outstanding debt, which this price feed does not carry"
  - "Seoul, which issues urban railway bonds rather than a regional development bond and so has no comparable line in this table. Eighteen regional development programmes appear in the feed; 17 of them traded in the June vintage"
crossChecks:
  - "Five consecutive trading days, 27 to 31 July 2026, 1,870 line items in total"
  - "Provinces are compared only within a single issue month, so that every bond in a comparison shares an issue date and therefore a residual maturity — the field the feed leaves blank"
  - "Urban railway bonds are excluded from the provincial comparison because they carry a different maturity from regional development bonds and would not be like-for-like"
  - "The liquidity explanation was tested rather than assumed: spread width was compared against trade count and won volume for every vintage with at least four provinces trading"
draft: false
---

Buy a car in Korea and you must also buy a bond. Register property, win a public contract, apply for a construction permit — each triggers a compulsory purchase of the issuing province's regional development bond. Eighteen such programmes appear in the exchange's price feed, and the bonds trade openly, where anyone can watch what the market thinks they are worth. (Seoul is the exception: it issues urban railway bonds instead.)

The provinces are not alike. Sejong is a purpose-built administrative capital barely a decade old. Jeju is an island economy running on tourism. North Gyeongsang is heavy industry. Gyeonggi surrounds the capital and holds more people than most European countries.

The bond market charges all of them the same.

## The June 2026 vintage, all seventeen

Every one of these bonds was issued in the same month, so every one has the same residual maturity. Eighty-eight trades across five days.

| Province | Yield |
| --- | ---: |
| Daegu | 4.365% |
| North Jeolla | 4.365% |
| Daejeon | 4.372% |
| Gyeonggi | 4.373% |
| South Chungcheong | 4.373% |
| North Gyeongsang | 4.373% |
| Gangwon | 4.374% |
| Gwangju | 4.374% |
| Busan | 4.374% |
| North Chungcheong | 4.374% |
| Incheon | 4.381% |
| Ulsan | 4.381% |
| South Jeolla | 4.381% |
| South Gyeongsang | 4.390% |
| Changwon | 4.395% |
| Jeju | 4.397% |
| Sejong | 4.398% |

Top to bottom: **3.2 basis points.** Three hundredths of one percent separates the province the market likes most from the one it likes least.

The July vintage is tighter still — 16 provinces, 80 trades, **1.5 basis points** end to end.

## The comparison that settles it

A small number is only meaningful against something. Here is the one that matters: within that same June vintage, the median province's *own* bond traded across a **12.4 basis point** range over the five days. In July, 16.2.

So the gap between Sejong and Daegu is roughly a quarter of the gap between one Daegu trade and the next Daegu trade. **The market distinguishes between two Tuesdays more than it distinguishes between two provinces.**

## Then why do older bonds look so different?

Widen the sample to bonds issued in 2022 and 2023 and the picture appears to change completely.

| Issued | Provinces trading | Trades | Volume | Widest gap |
| --- | ---: | ---: | ---: | ---: |
| Nov 2022 | 6 | 8 | 420m won | 157.8bp |
| Feb 2023 | 6 | 6 | 60m won | 155.9bp |
| Feb 2022 | 4 | 4 | 10m won | 104.6bp |
| May 2022 | 8 | 11 | 440m won | 84.6bp |
| Jan 2022 | 4 | 4 | 20m won | 77.6bp |
| **Jun 2026** | **17** | **88** | **32.5bn won** | **18.2bp** |
| **Jul 2026** | **16** | **80** | **82.7bn won** | **16.2bp** |

Read the volume column before the spread column. The 2022 and 2023 vintages produced **four to eleven trades each, some of them on ten million won** — a few thousand dollars. The 2026 vintages produced 88 and 80 trades on tens of billions.

Averaged out: the older vintages show a 91.1bp spread on trades averaging 20m won. The 2026 vintages show 9.8bp on trades averaging 280m won.

**The spread is not a credit signal. It is the sound of an empty order book.** One stale print on a bond nobody has touched in weeks sets a yield that looks like a judgement on a province's finances, and is nothing of the kind. Anyone ranking Korean local government credit off these older lines is ranking illiquidity.

## The other market: a bond you buy in order to sell it

The same feed carries National Housing Bonds Type 1, the instrument Koreans must buy when registering real estate. Fifty-three separate issues traded, 137 times.

The median trade printed at **9,618.5 against a face value of 10,000** — 3.82% below par. Seventy-four percent of all trades were below par, and the weakest print was 8,458, a 15.4% discount.

That is the design working as intended, not a market failure. Most buyers are not investors; they are homebuyers who are required to buy the bond and sell it back the same day. The discount is what they pay for the privilege, and it functions as a transaction levy that never appears on a tax return.

## One last number, on the shape of the market

Across all five days, the exchange's bond boards carried 1,825 usable line items worth 26.8 trillion won. Of that:

- **Government bond board: 51 line items — 96.9% of the money**
- Small-lot board: 201 line items — 2.5%
- General bond board: 1,573 line items — 0.6%

Ninety-seven percent of the value moved through fifty-one prints. The 1,573-item general board, where nearly every corporate and local issue lives, moved 160 billion won across the whole week — roughly twelve minutes of turnover on the government board.

Korea has a deep, liquid market in exactly one instrument, and a long tail of bonds whose posted yields deserve to be read as what they are: the last price someone happened to pay.
