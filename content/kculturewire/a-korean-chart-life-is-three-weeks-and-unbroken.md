---
title: "87% of Korean chart runs have no gap in them at all"
dek: "The scattered cases are the famous ones. Of 7,730 Korean chart lives lasting two weeks or more, 6,725 are present every single week from first to last. The median is three weeks, spanning three weeks, unbroken."
category: titles
purpose: both
pubDate: 2026-09-03
dataAsOf: 2026-08-23T00:00:00+09:00
author: Newsroom
tags: ["netflix", "charts", "measurement", "method"]
pages:
  - "/weeks-counter"
  - "/exit"
sources:
  - org: "Netflix"
    what: "Tudum weekly Top 10, per-country lists"
    api: "500,340 rows across 269 weeks and 93 markets, 2021-07-04 to 2026-08-23. Russia excluded — Netflix stopped publishing its list in February 2022"
limitations:
  - "One-week cells are left out of the unbroken count. Their span and their streak are both one week, so counting them would make 'unbroken' true by definition rather than by measurement. Their number is reported separately."
  - "A cell is one title, with its season label, on one chart, in one country. The same show in two countries is two cells, and its two seasons are two more."
  - "This is chart position, not viewing. Netflix publishes the rank and not how many people watched."
  - "The window opens on 2021-07-04, the first week Netflix published these lists, so a run already under way then is counted from that week rather than from its real start."
draft: false
---

*Squid Game* has been in India's top 10 for 43 weeks spread across four years. *Crash Landing on
You* took 96 weeks of calendar to accumulate 72 weeks in Japan. Those are the cases that get
written about, and they gave us a question we had not answered: **is a scattered chart life normal?**

It is not. It is rare, and here is the count.

## Nearly nine in ten are one unbroken block

A cell is one title, with its season label, on one chart, in one country. There are **11,181** Korean
cells in the five years of files. **7,730** of them last two weeks or more.

| Korean cells lasting two weeks or more | Count |
| --- | ---: |
| Cells | 7,730 |
| **Unbroken** — present every week from first to last | **6,725** (87%) |
| Scattered — span at least twice the weeks present | 631 |
| Median weeks present | 3 |
| Median weeks spanned | 3 |
| Median longest unbroken run | 3 |

Read the three medians together. The typical Korean chart life is **three weeks long, spanning three
weeks, with an unbroken run of three** — the same number three times, which is what it looks like
when a title arrives, stays, and leaves once.

Only **631** cells — 8.2% of the 7,730 — are scattered enough that their span is at least twice the
weeks they were actually present. Those are the ones that make good headlines, and they are the
exception.

## The other finding is the one-week cell

We left one-week cells out of the table above on purpose: their span and their streak are both one
week, so counting them would make "unbroken" true by definition rather than by measurement.

But their number is worth having. There are **3,451** of them — **30.9%** of all Korean cells. Nearly
a third of the times a Korean title reaches a country's top 10, it is there for one week and never
comes back to that chart.

That is not a failure. A country's top 10 has ten places and 52 weeks a year, so 520 places a year
in each of 93 markets; getting one of them for one week is still getting one.

## Why we had to measure this before writing about the long ones

The number Netflix publishes on each row — weeks in top 10 — is
[cumulative rather than consecutive](/article/netflix-weeks-in-top-10-is-not-weeks-in-a-row). It
adds one on every consecutive week without exception, and after a gap it keeps counting 98% of the
time instead of restarting.

So a large counter can mean either of two very different things, and the field alone cannot tell you
which:

- **a long unbroken stay** — which is what 87% of Korean runs are, and
- **a scattered return over years** — which is what the famous examples are.

Every run length on this site is computed from the weeks themselves for exactly this reason. The
counts above, the medians and the row totals behind them are on
[the weeks-counter page](/weeks-counter); what a departure from a chart looks like is on
[the exit page](/exit).
