---
title: "Foreign-disclosed holdings of Korean securities fell 12.7 percent in a year"
dek: "Among 73 countries reporting a Korea position to the IMF in both 2023 and 2024, combined holdings fell from $729.1B to $636.1B. A lower bound, not a full total — non-reporters are absent, not zero."
category: macro
pubDate: 2026-09-17
dataAsOf: 2026-09-16T08:25:00+09:00
author: Newsroom
tags: ["portfolio investment", "foreign holdings", "imf", "capital flows", "korea"]
tickers: []
sources:
  - org: "International Monetary Fund"
    api: "Coordinated Portfolio Investment Survey (PIP dataset), SDMX API"
    url: "https://api.imf.org/external/sdmx/2.1/data/PIP"
  - org: "SeoulMarkets"
    api: "Mirror-method aggregation across all reporting counterpart countries (collect-imf-pip-mirror.mjs)"
    url: "https://seoulmarkets.com/data/foreign-holdings"
crossChecks:
  - "Year-over-year change is computed only for the 73 of 75 countries that reported a Korea position in both 2023 and 2024, so the comparison is apples-to-apples rather than mixing in newly-appearing or disappearing reporters"
  - "Percentage changes for small holders (many under $100 million) are excluded from any headline claim — a move from near-zero produces triple-digit percentages that carry no weight; only the largest absolute dollar movers are reported"
  - "Korea does not report who holds its own securities; this ranking sums what other countries disclose holding in Korea, which is why the total is a floor, not a census"
excluded:
  - "Why holdings moved — currency valuation effects, price changes in the underlying securities, and actual buying or selling are all mixed together in a position figure, and this dataset cannot separate them"
  - "China and other major economies that do not participate in this IMF survey are absent from both years, not counted as zero, and are not part of this comparison"
  - "Any view on whether this flow is bullish or bearish for Korean markets — this is not investment advice"
draft: false
---

Foreign countries disclosed holding $636.1 billion in Korean portfolio securities as of 2024, down from $729.1 billion a year earlier — a 12.7 percent decline among the 73 countries that reported a Korea position in both years.

No country tells the IMF who holds its own securities. What exists instead is each other country's own disclosure of what it holds abroad, and Korea's position can be reconstructed by summing every one of those disclosures where the counterpart country is Korea. That is the method behind this figure, and it means the total is a floor: China and other large economies that do not participate in the survey are simply missing, not counted as zero.

## Where the decline concentrated

The pullback was not spread evenly. Four holders account for the bulk of the dollar decline, and three holders moved the other way by enough to partly offset it.

| Country | 2024 | 2023 | Change |
|---|---:|---:|---:|
| United States | $195.4B | $252.6B | −$57.2B (−22.6%) |
| Singapore | $73.9B | $87.8B | −$13.9B (−15.9%) |
| Luxembourg | $38.2B | $48.2B | −$10.0B (−20.6%) |
| Ireland | $29.8B | $36.4B | −$6.6B (−18.1%) |
| **United Kingdom** | **$49.7B** | **$39.8B** | **+$9.9B (+24.9%)** |
| **Hong Kong** | **$39.0B** | **$31.2B** | **+$7.8B (+25.1%)** |
| Norway | $27.1B | $24.1B | +$3.0B (+12.5%) |

The United States remains by far the largest disclosed holder even after the pullback, at 30.7 percent of the 2024 total — more than the next five countries combined. Its $57.2 billion decline alone is larger than the entire holding of every country ranked fifth or lower.

Singapore, Luxembourg and Ireland are financial-centre holders: global funds are domiciled there, so a position recorded against those countries reflects fund administration as much as it reflects the ultimate investor's location. The same caveat applies to the two countries that grew — a shift booked against the United Kingdom or Hong Kong may represent Korean securities moving between fund vehicles rather than a change in who ultimately owns them.

## What this figure cannot tell you

A holding figure is a position at one point in time, in US dollars. It moves for three reasons this dataset cannot separate: the securities were actually bought or sold, their market price changed, or the won-to-dollar exchange rate moved. A $57 billion decline in the US position could reflect selling, a price decline in the underlying holdings, currency translation, or some mix of all three — and nothing in the IMF survey lets us apportion the difference. We report the position change; we do not claim to know its cause.

## Method, in full

This figure sums every reporting country's own disclosure of its portfolio investment position in Korea — equities, fund shares, and long- and short-term debt securities — from the IMF's Coordinated Portfolio Investment Survey. Korea itself does not separately report who holds its own securities, only what it holds abroad, so this ranking is built by flipping the data around. Countries that do not participate in the survey are absent from the total, not counted as zero; the full country-by-country breakdown, current and prior year, is published at seoulmarkets.com/data/foreign-holdings. Not investment advice.
