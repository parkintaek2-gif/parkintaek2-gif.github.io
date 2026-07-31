---
title: "Korea's current-account surplus is widening for the wrong reason"
dek: "The headline surplus improved again last quarter. Imports fell faster than exports rose — a composition that historically shows up before domestic demand weakens, not after it recovers."
category: macro
pubDate: 2026-07-28
dataAsOf: 2026-07-27T09:00:00+09:00
author: Economics Desk
tags: ["sample", "current account", "trade", "Bank of Korea"]
sources:
  - org: "Bank of Korea"
    api: "National Accounts open dataset"
    url: "https://www.data.go.kr/data/15059629/openapi.do"
  - org: "Bank of Korea"
    api: "External Debt and External Claims open dataset"
    url: "https://www.data.go.kr/data/15059636/openapi.do"
crossChecks:
  - "Quarterly series checked against the prior published vintage for revisions"
  - "Import and export components summed and reconciled to the reported balance"
excluded:
  - "Monthly trade figures from the customs service — outside the source set cleared for redistribution"
draft: false
---

> **This is a layout sample.** The figures below are illustrative and were written to test
> rendering, not reported from a live data pull. Delete this file before the site goes public.

A current-account surplus is one of those numbers that sounds unambiguously good. A country selling more to the world than it buys is, in the standard telling, competitive. Korea's surplus widened again last quarter, and the standard telling was duly applied.

The composition says something different.

## What the data shows

The surplus improved. But decomposing it, the improvement came predominantly from the import side falling rather than the export side rising. Exports contributed, but the larger share of the change was a contraction in what Korea bought from abroad.

This is what economists sometimes call a recession surplus — the balance improves not because the country is selling more but because it is buying less.

<figure class="chart">
<p class="chart__title">The surplus widened because imports fell, not because exports rose</p>
<p class="chart__sub">Change on the same quarter a year earlier, per cent</p>
<svg viewBox="0 0 640 152" role="img" aria-label="Exports rose 2.1 per cent while imports fell 6.4 per cent, so the improvement in the balance came mostly from the import side.">
  <line class="grid" x1="203" y1="14" x2="203" y2="118"/>
  <line class="grid" x1="286" y1="14" x2="286" y2="118"/>
  <line class="grid" x1="537" y1="14" x2="537" y2="118"/>
  <path d="M453,26 h83.5 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-83.5 z" fill="var(--c1)"/>
  <path d="M453,74 h-249 a4,4 0 0 0 -4,4 v12 a4,4 0 0 0 4,4 h249 z" fill="var(--c-neg)"/>
  <text x="445" y="40" text-anchor="end">Exports</text>
  <text x="461" y="88" text-anchor="start">Imports</text>
  <text class="v" x="552" y="40">+2.1%</text>
  <text class="v" x="192" y="88" text-anchor="end">−6.4%</text>
  <line class="axis" x1="453" y1="14" x2="453" y2="118"/>
  <text x="453" y="136" text-anchor="middle">0</text>
  <text x="203" y="136" text-anchor="middle">−6</text>
  <text x="286" y="136" text-anchor="middle">−4</text>
  <text x="537" y="136" text-anchor="middle">+2</text>
</svg>
<figcaption>Illustrative figures for layout testing. In a live article: Bank of Korea national accounts, with the import and export components summed and reconciled to the published balance. Not investment advice.</figcaption>
</figure>

## The mechanism

Korea imports the great majority of its energy and a large share of its industrial inputs. Import volumes therefore track domestic industrial activity and household consumption fairly closely, with the added complication that the won-denominated value moves with both commodity prices and the exchange rate.

When domestic demand softens, imports fall quickly. Exports respond to foreign demand on a longer lag. The gap between those two response speeds is exactly what produces a widening surplus in the early phase of a domestic slowdown — and it is why the headline balance can look strongest at precisely the moment the domestic economy is weakest.

## Where this breaks

The pattern is suggestive, not deterministic.

A falling import bill can also reflect cheaper energy rather than weaker demand, and the balance-of-payments data alone cannot separate a price effect from a volume effect. If global energy prices fell materially over the period, part of the improvement is simply a cheaper import basket, and the domestic-demand reading weakens accordingly.

National accounts data is also heavily revised. The quarterly current-account series routinely moves between vintages, occasionally enough to change the sign of a quarter-on-quarter comparison. We checked this release against the prior vintage, but a revision six months from now could undo the comparison entirely.

And a single quarter is not a trend. The composition described here has to persist for two or three quarters before it says anything about the cycle.

## The evidence

The claim rests on the decomposition: the reported balance, and its import and export components, taken from the Bank of Korea national-accounts dataset and summed to confirm they reconcile to the published balance. The revision check compares this release against the previously published vintage of the same series.

We did not use customs-service monthly trade figures, which would have allowed a cleaner volume-versus-price split, because that source sits outside the set we have cleared for redistribution. That is a real limitation of this article, and it is listed below rather than papered over.

## The verdict

The surplus is real and the improvement is real. The interpretation attached to it in most coverage — that Korean external competitiveness strengthened — is not supported by the composition of the change.

Read as a demand signal rather than a competitiveness signal, the same number points the other way. This is an observation about national accounting, not a forecast and not advice about any asset.
