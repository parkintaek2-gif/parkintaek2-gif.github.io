---
title: "Korea publishes two housing numbers. They routinely disagree, and both are right."
dek: "Transaction records say what actually sold. The official index says which way the market moved. In a thin market these diverge — and the gap is the story, not an error in either."
category: macro
pubDate: 2026-08-01
dataAsOf: 2026-08-01T00:00:00+09:00
author: Newsroom
tags: ["housing", "real estate", "methodology", "index construction"]
sources:
  - org: "Ministry of Land, Infrastructure and Transport (Republic of Korea)"
    api: "Apartment Sale Transaction Price Open API"
    url: "https://www.data.go.kr/data/15126469/openapi.do"
  - org: "Ministry of Land, Infrastructure and Transport (Republic of Korea)"
    api: "Apartment Rental Transaction Price Open API"
    url: "https://www.data.go.kr/data/15126474/openapi.do"
  - org: "Korea Real Estate Board"
    api: "Real Estate Statistics Inquiry Service"
    url: "https://www.data.go.kr/data/15134761/openapi.do"
crossChecks:
  - "Licence scope confirmed individually on each dataset page"
  - "Coverage and disclosure limits taken from the publishing agency's own notice"
excluded:
  - "Bank-published appraisal prices — no open API and separate terms of use; not redistributed here"
  - "Commercial aggregator estimates — derived products, not primary sources"
draft: false
---

Ask how Korean apartment prices moved last month and you can get two defensible answers that point in opposite directions. This is not a data quality problem. It is two instruments measuring different things.

## What the data shows

Korea publishes housing data through two separate public channels, both freely redistributable.

The **Ministry of Land, Infrastructure and Transport** publishes actual transactions. Every apartment sale reported under the real-estate transaction reporting law becomes a public record, queryable by administrative district code and contract month. Rentals, pre-sale rights transfers and commercial property have their own equivalent feeds. This is not a sample or an estimate — it is the contracts themselves.

The **Korea Real Estate Board** publishes indices. Its statistics service covers land price change surveys, the national housing price trend survey, an apartment real-transaction price index, commercial property rent surveys, officetel price trends and transaction volume. Its weekly apartment price survey is released every Thursday and exists specifically, in the agency's own words, to provide a timely read on the direction of sale and lease prices.

One counts what happened. The other measures direction.

## The mechanism

The two can diverge sharply, and the reason is structural rather than accidental.

Transaction data is a record of whatever actually traded. In a month when few units change hands, the average is set by that small set of buildings — and which buildings sold is not random. If the units that transact happen to be larger, newer, or in more expensive districts than last month's, the average transaction price rises even if every individual building is worth less than before. Statisticians call this composition effect, and in a thin market it can dominate entirely.

An index exists to strip that out. Survey-based indices track a fixed basket and ask what comparable properties are worth, so the number is not thrown around by which particular units happened to sell. That makes the index better at answering "which way is the market moving."

The cost is that an index is a construction. It depends on the composition of its basket, on survey methodology, and on judgement about comparability. When transaction volume collapses, an index is measuring something closer to an opinion about value than a record of exchange — and reasonable methodologies can produce different opinions.

So the tension is fixed: **transactions are real but unrepresentative; indices are representative but constructed.** In a liquid market the two converge and nobody notices. In a frozen one they separate, and that is exactly when people most want an answer.

## Where this breaks

The divergence is not evidence that either source is wrong, and reporting it as a contradiction would be a mistake.

There are also limits specific to each. Transaction records carry a reporting lag — a contract signed today appears once it has been filed, not immediately. They are also deliberately incomplete on identifying detail: only floor information is published, with unit-level detail added only after registration of ownership transfer is complete. That is a privacy protection, and it means transaction data cannot always distinguish between units that differ materially within the same building.

Cancelled contracts are a further complication. A reported transaction that is later voided distorts an average until the correction propagates, and unusually high reported prices have historically drawn scrutiny for exactly this reason.

On the index side, the weekly survey trades accuracy for timeliness by design. A weekly read on a market where individual assets trade every several years is necessarily an estimate, and the agency presents it as one.

## The evidence

Both source families were confirmed individually on their dataset pages: the Ministry's transaction feeds and the Real Estate Board's statistics service each carry an unrestricted use licence at no cost. Coverage limits — the floor-only disclosure rule, the registration condition for unit detail — come from the publishing agency's own notice rather than from secondary description.

We did not use bank-published appraisal prices, which are widely referenced in Korea for mortgage collateral purposes but have no open API and carry separate terms. Nor did we use commercial aggregators, which are derived products built on the same ministry data we can query directly.

## The verdict

A reader who wants to know what a specific apartment sold for should look at transactions. A reader who wants to know whether the market is rising should look at the index. Using either to answer the other's question produces confident nonsense.

Where the two disagree, the honest report states both and explains why — which is what we will do when we cover this market, and which is why both timestamps and both methodologies will appear in the article rather than in a footnote.

None of this is investment advice, and nothing here is a forecast about Korean housing prices.
