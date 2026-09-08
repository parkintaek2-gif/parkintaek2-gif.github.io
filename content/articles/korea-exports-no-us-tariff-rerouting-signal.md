---
title: "Korea's exports show no sign of US-tariff rerouting"
dek: "A popular worry is exporters rerouting around US tariffs via Vietnam or Mexico. Korea's own customs data shows the opposite over the past year: the US share of Korean exports rose 2.6 points; Vietnam and Mexico's shares both fell."
category: macro
pubDate: 2026-09-08
dataAsOf: 2026-06-30T00:00:00+09:00
author: Newsroom
tags: ["trade", "tariffs", "exports", "supply chain", "korea"]
tickers: []
sources:
  - org: "Korea Customs Service (via KOSIS, Statistics Korea)"
    api: "Exports by partner country, monthly, July 2025–June 2026 (table DT_1R11006_FRM101 / 360)"
crossChecks:
  - "Share of Korea's total exports, first month of the window vs. last: United States 17.02% (Jul 2025) → 19.60% (Jun 2026), +2.58 points. China 18.19% → 19.59%, +1.40 points. Vietnam 9.12% → 8.44%, −0.69 points. Mexico 1.77% → 1.54%, −0.23 points"
  - "Vietnam and Mexico are the two destinations most often named when 'transshipment' or tariff-rerouting is discussed for East Asian exporters, because both have free-trade or low-tariff access to the US. Neither shows a rising export share from Korea over this window — both fell"
  - "Shares are used throughout, not dollar levels — the underlying monthly totals contain a scale break from March 2026, so absolute figures are not reported, but within-month shares are stable across the break and can be compared"
  - "This is a country-level check only. It cannot see product-level rerouting hidden inside a stable country share — that requires HS-code (product) granularity, which this dataset does not carry"
excluded:
  - "Any product-level (HS-code) detection of rerouting. This dataset is partner-country totals only; a circumvention pattern confined to specific goods could exist underneath an unchanged or falling country share and would not show up here"
  - "Any claim about other countries' trade (e.g. China routing goods through Vietnam to the US). This measures only Korea's own exports by destination"
  - "Absolute dollar levels. The monthly customs totals contain a scale break from March 2026, so shares are reported, not levels"
  - "Not investment advice"
draft: false
---

A student team at Korea's trade-statistics competition this month pitched a model for catching export rerouting (우회수출) — shipping used to dodge tariffs or trade restrictions — before it shows up in the numbers everyone else is watching. It's a real concern: with US tariff pressure ongoing, the textbook workaround is to ship through a third country with easier US market access, rather than direct.

Korea's own customs data gives a first, coarse test of whether that's visible in the aggregate. It isn't — at least not in the direction the story predicts.

## What the shares did, a year apart

| Destination | Jul 2025 share | Jun 2026 share | Change |
| --- | ---: | ---: | ---: |
| United States | 17.02% | 19.60% | +2.58pp |
| China | 18.19% | 19.59% | +1.40pp |
| Vietnam | 9.12% | 8.44% | −0.69pp |
| Mexico | 1.77% | 1.54% | −0.23pp |

Vietnam and Mexico are the two destinations most commonly named as transshipment routes for exporters trying to keep US market access while sidestepping US tariffs on their own goods — both have trade terms with the US that a direct shipment wouldn't get. If Korean exporters were quietly shifting volume through either one, their share of Korea's exports should be climbing while the direct US share falls. Instead, both fell, by less than a point apiece, while direct exports to the US rose by more than any of the four.

## What this does and doesn't show

This is a blunt instrument. It works only at the country level — a shift in the total mix of what Korea sends to Vietnam or Mexico. A narrower pattern, confined to one or two tariff-exposed product categories and hidden inside an otherwise flat or falling country total, would not appear here at all; catching that needs product-level (HS-code) trade data, which this dataset does not carry.

What it does show is that the simplest version of the rerouting story — Korea leaning more on Vietnam or Mexico as a whole over the past year — isn't in the aggregate numbers. If anything, Korea's exports concentrated further on its two largest, most direct markets.

Not investment advice.
