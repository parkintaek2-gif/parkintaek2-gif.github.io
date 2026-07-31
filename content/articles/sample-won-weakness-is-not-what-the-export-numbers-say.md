---
title: "The won keeps sliding while exports hold up. Both can be true."
dek: "A weaker currency is usually read as a verdict on the economy behind it. In Korea's case the published rate and the trade data have been pointing in opposite directions for weeks."
category: fx
pubDate: 2026-07-29
dataAsOf: 2026-07-28T11:00:00+09:00
author: Currencies Desk
tags: ["sample", "KRW", "exchange rate", "dollar"]
sources:
  - org: "Export-Import Bank of Korea"
    api: "Published Exchange Rate Open API"
    url: "https://www.data.go.kr/data/3068846/openapi.do"
  - org: "Bank of Korea"
    api: "National Accounts open dataset"
    url: "https://www.data.go.kr/data/15059629/openapi.do"
crossChecks:
  - "Published rate series checked against Bank of Korea currency statistics for the same dates"
excluded:
  - "Interbank spot quotes and intraday ranges — not available in any redistributable public source"
  - "Central bank intervention estimates — not published"
draft: false
---

> **This is a layout sample.** The figures below are illustrative and were written to test
> rendering, not reported from a live data pull. Delete this file before the site goes public.

Before anything else, a definition that matters more than it sounds. The rate discussed here is the one **published by the Export-Import Bank of Korea**. It is not an interbank spot quote, and it is not the intraday print you would see on a trading screen. No public source we are permitted to redistribute carries those. Everything below should be read with that substitution in place.

## What the data shows

On that basis, the won has weakened against the dollar over recent weeks, and the direction has been persistent rather than choppy — the kind of drift that usually accompanies a deteriorating story about the underlying economy.

The trade data has not cooperated with that story. Export values have held up over the same stretch.

<figure class="chart">
<p class="chart__title">The currency and the trade data point opposite ways</p>
<p class="chart__sub">Both indexed to 100 at week 1. A rising currency line means a weaker won.</p>
<ul class="chart__legend">
  <li><span class="chart__key" style="background:var(--c2)"></span>Won per dollar (published rate)</li>
  <li><span class="chart__key" style="background:var(--c1)"></span>Export value</li>
</ul>
<svg viewBox="0 0 640 230" role="img" aria-label="Over eight weeks the won-per-dollar index rose from 100 to 103.4 while the export-value index rose only from 100 to 101.9.">
  <line class="grid" x1="56" y1="190" x2="600" y2="190"/>
  <line class="grid" x1="56" y1="126" x2="600" y2="126"/>
  <line class="grid" x1="56" y1="62" x2="600" y2="62"/>
  <text x="48" y="194" text-anchor="end">99</text>
  <text x="48" y="130" text-anchor="end">101</text>
  <text x="48" y="66" text-anchor="end">103</text>
  <polyline fill="none" stroke="var(--c2)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
    points="56,158 134,138 212,122 290,126 368,100 446,84 524,65 602,49"/>
  <polyline fill="none" stroke="var(--c1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
    points="56,158 134,145 212,164 290,129 368,120 446,136 524,110 602,97"/>
  <circle cx="602" cy="49" r="4" fill="var(--c2)" stroke="var(--paper)" stroke-width="2"/>
  <circle cx="602" cy="97" r="4" fill="var(--c1)" stroke="var(--paper)" stroke-width="2"/>
  <text class="v" x="592" y="36" text-anchor="end">103.4</text>
  <text class="v" x="592" y="115" text-anchor="end">101.9</text>
  <line class="axis" x1="56" y1="200" x2="600" y2="200"/>
  <text x="56" y="218" text-anchor="start">Week 1</text>
  <text x="602" y="218" text-anchor="end">Week 8</text>
</svg>
<figcaption>Illustrative figures for layout testing. In a live article: Export-Import Bank of Korea published rates and Bank of Korea national accounts, indexed to a common base — never plotted on two separate scales. Not investment advice.</figcaption>
</figure>

## The mechanism

The reflex reading of a falling currency is that the market has downgraded the country. Sometimes that is right. Often, for Korea specifically, it is not, because the won trades as a high-beta proxy for something else entirely: global risk appetite and the dollar cycle.

Korea runs an open capital account, deep and liquid equity markets, and an export base concentrated in the most cyclical industry on earth. That combination makes the won one of the instruments global investors reach for when they want to express a view on world growth. The view being expressed is frequently not about Korea at all.

When the dollar strengthens broadly, the won weakens along with most of its peers, and Korean export competitiveness in third markets actually *improves*. A weaker won and resilient exports are not a contradiction. They are, some of the time, the same fact seen from two sides.

## Where this breaks

The benign reading has limits, and they are worth stating plainly.

A weaker won raises the cost of imported energy and industrial inputs, which Korea buys in volume. That shows up in producer prices with a lag, and it squeezes the domestic economy even while it flatters export receipts. The comfortable interpretation only holds while the currency move stays orderly.

The published-rate caveat also cuts deeper than a wording quibble. Published rates are set once and do not show intraday range. A currency can be far more disorderly than a daily series suggests, and we have no way to see that from this source.

And export *values* are not export *volumes*. If value held up while the currency fell, part of that is arithmetic — the same goods translate into more won. Separating the two requires volume data we did not use here.

## The evidence

The claim rests on two series: the published rate over the period, from the Export-Import Bank dataset, and export values from the Bank of Korea national accounts. The rate series was checked against Bank of Korea currency statistics for the same dates and agreed.

Everything about market microstructure — where the currency traded intraday, whether the move was orderly, whether the authorities were present — is not in evidence, and is listed under excluded figures.

## The verdict

"Currency down, therefore country down" does not survive contact with the trade data here. The move is more consistent with a dollar story than a Korea story.

That is an interpretation of two public series, not a forecast of where the won goes next, and not advice about any position in it.
