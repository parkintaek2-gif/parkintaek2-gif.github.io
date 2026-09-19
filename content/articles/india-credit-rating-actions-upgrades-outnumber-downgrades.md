---
title: "India's listed companies: credit-rating upgrades have outnumbered downgrades 3.6 to 1"
dek: "Across 22,295 rating actions logged for NSE-listed and SME companies, 2,629 were upgrades against 736 downgrades — a first look at a market SeoulMarkets has not covered before."
category: equities
pubDate: 2026-09-19
dataAsOf: 2026-09-18T00:00:00+09:00
author: Newsroom
tags: ["india", "nse", "credit rating", "crisil", "india ratings"]
tickers: []
sources:
  - org: "National Stock Exchange of India (NSE)"
    api: "System-driven disclosure — credit rating actions (SEBI LODR Regulation 30)"
    url: "https://www.nseindia.com/companies-listing/corporate-sdd-credit-rating-reg30"
  - org: "SeoulMarkets"
    api: "Daily scrape of the NSE credit-rating-actions disclosure feed (collect-india-nse-credit-rating.mjs)"
    url: "https://seoulmarkets.com"
crossChecks:
  - "22,295 rows cover both the equities segment (21,330 actions) and the SME segment (965 actions) of NSE"
  - "Re-affirmations are excluded by design — the disclosure feed itself only carries rating changes, not confirmations of an existing rating, so this is not an artifact of our own filtering"
  - "Action counts come directly from each filing's own \"action\" field as filed by the rating agency (India Ratings, CRISIL, CARE, ICRA, and others), not from us reading rating letters and inferring direction"
excluded:
  - "How far back this history runs — the feed we hold does not carry a reliable action date for every row, so we report the action totals without claiming a fixed calendar window"
  - "Which sector or rating agency drives the upgrade skew — we have not broken this out by agency or sector yet"
  - "Whether this ratio is high or low by historical Indian market standards — we have no prior benchmark to compare it to; this is our first coverage of this market"
draft: false
---

Among 22,295 credit-rating actions logged for companies listed on India's National Stock
Exchange, 2,629 were upgrades and 736 were downgrades — a ratio of 3.6 upgrades for every
downgrade. This is SeoulMarkets' first published look at Indian credit-rating data.

## What the feed holds

| Action | Count |
|---|---:|
| Other (reissue, withdrawal, outlook-only change) | 17,318 |
| Upgrade | 2,629 |
| New rating assigned | 1,610 |
| Downgrade | 736 |
| Unclassified | 2 |
| **Total actions** | **22,295** |

The feed comes from NSE's own system-driven disclosure channel, built under India's securities
regulator (SEBI) Listing Obligations and Disclosure Requirements, Regulation 30. Credit rating
agencies — India Ratings and Research, CRISIL, CARE, ICRA, and others — file rating actions
directly, and NSE disseminates them. The channel carries changes, not re-affirmations: a rating
agency confirming an existing rating with no change does not appear in this feed at all, so the
totals above are not diluted by routine confirmations.

## What we are not claiming

We do not yet know whether the 3.6-to-1 upgrade skew is typical for the Indian market or a
feature of the specific window this feed happens to cover, because we have no earlier data to
compare it against — this is the first day we have collected and published this source. We also
have not broken the count out by rating agency or sector, which could show a very different
picture in, say, financials versus infrastructure. Those are follow-up work, not settled here.

## Method

We collect NSE's credit-rating-actions disclosure feed, which spans both the equities and SME
listing segments, and classify each row by the "action" field the filer supplied (upgrade,
downgrade, new, or other/reissue/withdrawal). We did not reclassify or infer direction from
rating letters ourselves. Not investment advice.
