---
title: "Why the Korean market numbers you can legally read are always a day old"
dek: "The data this site publishes settles on a one-business-day lag — not by editorial choice but because that is what the redistributable sources release. One exception changes what is possible."
category: macro
pubDate: 2026-08-01
dataAsOf: 2026-08-01T00:00:00+09:00
author: Newsroom
tags: ["methodology", "market data", "disclosure", "DART"]
sources:
  - org: "Financial Services Commission (Republic of Korea)"
    api: "Stock Price Information Open API"
    url: "https://www.data.go.kr/data/15094808/openapi.do"
  - org: "Financial Services Commission (Republic of Korea)"
    api: "Corporate Disclosure Information Open API"
    url: "https://www.data.go.kr/data/15059649/openapi.do"
  - org: "Financial Supervisory Service (Republic of Korea)"
    api: "Periodic Report Financial Information — multi-company key accounts"
    url: "https://www.data.go.kr/data/15060622/openapi.do"
  - org: "Korea Exchange"
    api: "Website terms of use, Articles 12 and 13"
    url: "https://data.krx.co.kr/contents/MDC/INFO/informationController/MDCINFO003.cmd"
crossChecks:
  - "Licence scope confirmed on each dataset page individually, not inferred from the portal as a whole"
  - "Update-lag language taken from the operator's own notice rather than the summary field"
excluded:
  - "Korea Exchange market data taken from data.krx.co.kr — redistribution requires prior permission under the site's terms"
  - "Vendor consensus and research-report data — licensed products we do not hold"
draft: false
---

Every article on this site carries a timestamp that is usually one business day behind the market. That is unusual enough to explain, because the reason is not caution or slowness. It is the licence.

## What the data shows

There are two ways to obtain Korean market data. Only one of them can be redistributed by a publication funded by advertising.

The Korea Exchange operates its own data site, and its terms are explicit:

> Users shall not copy, reproduce, distribute, transmit or publicly transmit the information on this site without the prior permission of the Exchange.
> — Korea Exchange website terms of use, Article 12(2)

The second route is the Korea Public Data Portal, where the Financial Services Commission publishes the same underlying prices as open data. The licence field on those datasets reads "no restriction on scope of use," and the cost is zero.

We use the second route exclusively. It carries one condition that shapes everything downstream: the feed is not live. The operator's own notice states that data is updated **after 1 p.m. on the business day following the reference date** — so Friday's session appears the following Monday, and a Monday holiday pushes it to Tuesday.

## The mechanism

The lag is not a technical limitation. It is what happens when market data passes through a government open-data pipeline rather than a commercial one.

Exchanges sell real-time feeds. That is a significant revenue line for every major exchange in the world, and it is why live prices sit behind licences that cost money and restrict redistribution. What reaches an open-data portal is the settled, end-of-day version, published once the commercial value of immediacy has expired.

The practical consequence for a reader is worth stating plainly. When this site reports that an index closed at a certain level, that close is real and verifiable — but it is not today's close. It is the last one that could be published under a licence permitting redistribution.

## Where this breaks

There is one exception, and it is large enough to change what this publication can do.

Corporate disclosures do not follow the same rule. When a listed company files a treasury-share purchase, a capital increase, a merger, or a bankruptcy notice, that filing becomes public the moment it is accepted. The Financial Supervisory Service's disclosure data is available without the one-day settlement that applies to prices.

So the constraint is asymmetric. Prices are T+1. Filings are immediate.

That means a story built on a disclosure can be published the same day, while a story built on price action cannot. Where an article uses both — a filing that landed this morning, prices that settled yesterday — the two timestamps must be stated separately. Blurring them would let a reader assume a price is current when it is not, which is precisely the error this whole arrangement is designed to avoid.

The second limitation is subtler. Open-data feeds publish prices and volumes, not investor-type breakdowns or order-book detail. Analysis that depends on knowing *who* traded is not available to us at any price we are willing to pay in licence terms, and where we infer it we say so.

## The evidence

Each dataset's licence scope was confirmed on its own page rather than assumed from the portal as a whole — the distinction matters, because datasets sitting side by side on the same portal carry different terms depending on which agency published them. Some carry restrictions on commercial use. Those we do not touch.

The update lag comes from the operator's notice text, not from the summary field. The summary field on several of these datasets says "real time," which is not what the accompanying notice describes.

## The verdict

A publication that cannot afford a market-data licence has two options: use restricted data and hope, or use open data and be explicit about what that costs.

We took the second. The cost is a day on prices, and it is stated at the top of every article. The benefit is that nothing here rests on a licence we do not hold.

None of the above is investment advice, and the timestamps exist precisely so that nobody mistakes a settled figure for a live one.
