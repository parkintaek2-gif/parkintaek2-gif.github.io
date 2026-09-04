---
title: "HYBE alone is two-thirds of Korea's listed K-pop value"
dek: "Korea's six listed K-pop agencies have a combined market value of ₩11.56 trillion. HYBE alone is 65.6% of that, more than the other five combined. A seventh name, CJ E&M, sits in DART's registry but filed and traded nothing in over a year."
category: equities
pubDate: 2026-09-04
dataAsOf: 2026-09-03T18:00:00+09:00
author: Newsroom
tags: ["k-pop", "hybe", "entertainment", "korean equities", "market concentration"]
tickers: ["352820", "041510", "035900", "122870", "182360", "173940"]
sources:
  - org: "Korea Exchange (KRX Data Marketplace)"
    api: "stk_bydd_trd / ksq_bydd_trd — daily trading and market capitalisation by listed issue, basis date 2026-09-03"
    url: "https://data.krx.co.kr"
  - org: "Financial Supervisory Service (DART, Open DART API)"
    api: "company.json (corporate registry) and list.json (disclosure list), corp codes matched via Wikidata's parent-company links (P264/P749/P127) for K-pop labels"
    url: "https://opendart.fss.or.kr"
crossChecks:
  - "The seven candidate tickers came from a Wikidata query grouping K-pop labels by their listed parent (P264 record label, P749 parent organisation, P127 owner), cross-checked against DART's corporate registry for a matching stock code — not our own judgement of which company owns which label"
  - "HYBE's own registry entry lists seven constituent labels (Big Hit Music, Pledis Entertainment, Source Music, Belift Lab, KOZ Entertainment, ADOR and the HYBE corporate label itself); grouping by label name alone would undercount HYBE by roughly 5 to 1 against grouping by the listed parent"
  - "One entity in the same source list, corp code 00838421 (CJ E&M Corporation, stock code 130960), returned a valid, active-looking registry record from DART's company.json — a real CEO, a real incorporation date — but a full-year disclosure search (2025-01-01 to 2026-09-04) returned zero filings, and it does not appear in either of the Korea Exchange's daily trading files for 2026-09-03. Both checks, from two independent sources, agree it is not a live listed issue; it is excluded from every figure below"
  - "HYBE's most recent treasury-stock filing (25 August 2026) was a disposal, not a purchase: 24,420 common shares at ₩174,600 each, ₩4.26 billion total, for employee and affiliate compensation, disposal window 1 September to 25 November 2026"
excluded:
  - "Revenue, profit, or any operating comparison between the six companies. This piece measures only what the market pays for each share times shares outstanding — market value, not business performance"
  - "Whether HYBE's size reflects its artists' popularity, its catalogue, or investor sentiment toward the stock. The data measures a price, not a cause"
  - "Buyback or treasury-stock activity at SM, JYP, YG, Cube or FNC. A DART disclosure search (1 June to 4 September 2026) found none at any of the five; only HYBE filed"
  - "Any company below the size of these six. This is not a census of Korean entertainment companies — it is the set that a Wikidata parent-company query returned with a matching, currently-traded KRX stock code"
draft: false
---

Six Korean entertainment companies trade on the Korea Exchange under a name most listeners would recognise. As of 3 September 2026, their combined market value is ₩11.56 trillion. One of them is worth more than the other five put together.

## Six companies, one basis date

| Company | Ticker | Close (₩) | Market value | Share of the six |
| --- | --- | ---: | ---: | ---: |
| HYBE | 352820 | 176,000 | ₩7.59tn | 65.6% |
| SM Entertainment | 041510 | 75,300 | ₩1.72tn | 14.9% |
| JYP Entertainment | 035900 | 38,500 | ₩1.37tn | 11.8% |
| YG Entertainment | 122870 | 40,650 | ₩0.76tn | 6.6% |
| Cube Entertainment | 182360 | 5,670 | ₩0.09tn | 0.8% |
| FNC Entertainment | 173940 | 2,160 | ₩0.03tn | 0.3% |

HYBE's ₩7.59 trillion is not just the largest slice — at 65.6% of the six-company total, it is bigger than SM, JYP, YG, Cube and FNC's market values added together (₩3.97 trillion, 34.4%). The next-largest company, SM, is worth less than a quarter of HYBE.

Part of that scale is structural, not incidental. HYBE's own DART registry entry lists seven constituent labels under one listed parent — Big Hit Music, Pledis Entertainment, Source Music, Belift Lab, KOZ Entertainment, ADOR and the HYBE label itself. Counting by label name alone undercounts the group roughly five to one against counting by the entity that actually trades on the exchange. The market value above is priced at the parent, which is the level a share of stock actually represents.

## The seventh name that isn't there

A parent-company query should have returned a seventh ticker: CJ E&M Corporation, stock code 130960. DART's own company registry answers a lookup for it cleanly — a named chief executive, an incorporation date of 2 September 2010, a Seoul address. On paper, it looks like an active filer.

It is not. A full-year search of DART's disclosure list, 1 January 2025 through 4 September 2026, returns zero filings. It does not appear in either of the Korea Exchange's daily trading files for 3 September 2026 — not the main board, not KOSDAQ. Two independent sources, a disclosure archive and a live trading tape, agree on the same absence. Whatever this entity once was, it is not currently a traded security, and it is excluded from every number in this piece.

## What moved recently

Of the six active companies, only one has filed a treasury-stock transaction in the past three months. On 25 August 2026, HYBE disclosed a disposal — not a purchase — of 24,420 common shares at ₩174,600 apiece, ₩4.26 billion in total, earmarked for employee and affiliate compensation over a window running from 1 September to 25 November. SM, JYP, YG, Cube and FNC show no treasury-stock filings in the same three-month search. That is a single data point about one company's compensation mechanics, not a signal about the group as a whole — but it is the only piece of recent corporate action any of the six has on file.
