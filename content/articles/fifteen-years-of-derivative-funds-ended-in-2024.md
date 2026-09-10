---
title: "For fifteen straight years, the most common new Korean fund was a derivative. In 2024 that stopped."
dek: "Read by establishment year, Korea's fund register has changed hands three times: mixed-bond funds through 2008, derivative funds 2009 to 2023, funds-of-funds since. Derivative codes fell from 1,633 to 238 in one year."
category: funds
pubDate: 2026-09-11
dataAsOf: 2026-08-20T00:00:00+09:00
author: Newsroom
tags: ["funds", "asset management", "derivatives", "fund of funds", "korea"]
tickers: []
sources:
  - org: "Korea Financial Investment Association (KOFIA) — fund standard-code registry, via data.go.kr"
    api: "Registered fund master (표준코드 · 유형 · 설정일), 183,351 rows, snapshot to 20 August 2026"
    url: "https://www.data.go.kr"
crossChecks:
  - "Every figure is a count of registered fund codes carrying an establishment date, not a count of funds and not an amount of money. 183,351 rows were read; 183,346 carry a readable establishment date and 5 do not, and those 5 are left out rather than counted as zero"
  - "Codes by establishment year and type were counted from the 유형 field with no reclassification. The type shares quoted are that year's count divided by that year's total codes"
  - "Derivative-type codes: 1,674 (2022), 1,633 (2023), 238 (2024), 183 (2025). Fund-of-funds codes over the same years: 744, 604, 893, 1,281. Both series come from the same field in the same file"
  - "1998 is the largest single establishment year still on the register at 13,925 codes, against 4,137 in 1997 and 5,052 in 1999. The spread inside 1998 was checked for a placeholder date: the codes fall across all twelve months, with October at 3,304 and November at 3,359, so the spike is not one repeated date"
excluded:
  - "Money. A registry weighs a ₩1bn fund and a ₩1tn fund identically. Nothing here says where Korean savings sit, only what was registered and when"
  - "Fund counts. One fund is registered once per share class — ClassA, ClassC1, ClassC-P2e and so on each hold their own code and their own establishment date. Every number here is a count of codes, and stripping class suffixes from names to recover funds would mean guessing, so we did not"
  - "Closed funds. Codes are not retired cleanly, so this is a register of what is still listed. Older years are therefore counted only through their survivors, which makes every decline stated here a lower bound rather than the full fall"
  - "Asset managers. The standard code is not one format — KR5…, K55…, KRM… and K5V… families sit side by side, so the four digits that look like a manager code in one family are not one in another. We hold no table turning those codes into names, so no manager-level count appears here"
  - "Why any of it changed. This is a count of registrations by date. It does not carry the reason a category stopped being registered"
---

Korea's fund registry does one thing very well: it dates things. Every registered code carries the
day the fund behind it was established. Nobody seems to read the file that way, so we did — 183,351
codes, sorted by the year they were set up and by what type they were.

Read like that, the shelf has changed hands three times.

## Three eras on one shelf

| Years | The most common new code was | Its share of that year's codes |
| --- | --- | ---: |
| to 2008 | mixed-bond funds | 30–44% |
| 2009–2023 | derivative funds | 30–56% |
| 2024– | funds-of-funds | 39–47% |

The middle era is the striking one. For **fifteen consecutive years** — 2009 through 2023 — the single
most common thing registered on the Korean fund shelf was a derivative fund, and in six of those
years it was more than half of everything registered.

Then it stopped, in one year.

| Establishment year | Derivative codes | Fund-of-funds codes | All codes |
| --- | ---: | ---: | ---: |
| 2020 | 3,343 | 894 | 5,990 |
| 2021 | 2,051 | 595 | 4,060 |
| 2022 | 1,674 | 744 | 3,285 |
| 2023 | 1,633 | 604 | 3,197 |
| 2024 | **238** | **893** | 2,312 |
| 2025 | 183 | 1,281 | 2,698 |

Derivative registrations fell **85 percent in a single year** while the overall shelf shrank by 28
percent. That is not a slow retreat inside a shrinking industry; it is one category being switched off
and another switched on in its place. Fund-of-funds codes rose from 604 to 893 to 1,281 across the
same three years and are now nearly half of everything newly registered.

We can date the change precisely. We cannot say from this file why it happened — the registry records
what was registered and when, not what anyone decided. Readers who follow Korean retail finance will
know what else was happening in early 2024; this file neither confirms nor contradicts it, and we are
not going to borrow the connection and print it as a finding.

## The biggest cohort on the shelf is from 1998

The same read produces a second thing nobody counts. The largest single establishment year still
sitting on the Korean register is not recent:

| Establishment year | Codes still registered |
| --- | ---: |
| 1997 | 4,137 |
| **1998** | **13,925** |
| 1999 | 5,052 |
| 2007 | 13,569 |
| 2025 | 2,698 |

A 3.4-fold spike in one year is exactly the shape a data error makes, so we checked it before writing
it down. If it were a placeholder date, the codes would pile onto one day. They do not: 1998 spreads
across all twelve months, with the weight in **October (3,304) and November (3,359)**. And 10,410 of
the 13,925 are bond funds against **three** equity funds.

That is a real cohort, and its composition dates it — a bond-fund flood in the autumn after the 1997
crisis, still on the register twenty-eight years later.

It also corrects something we published ourselves. Our [earlier read of this registry](/article/korea-fund-factory-slowing)
described new registrations as peaking around 2020 near 6,000 a year. Within the window that piece
looked at, that was right. Across the whole file it is not: 1998 and 2007 are both more than twice
2020, and we should have said so. The decline that piece described is real and, if anything,
understated — but the peak it named was the peak of its window, not of the data.

## What a count of codes cannot tell you

Everything above counts **codes**, not funds and not money. One fund holds a separate code for each
share class, so a fund sold in eight classes appears eight times, with eight establishment dates. We
could strip class suffixes off the names to guess at funds, and we are not going to, because the
guessing would be invisible in the result.

Older years are also counted only through their survivors. Codes are not retired cleanly, but they do
disappear, so 1998's 13,925 is what is *left* of 1998 — the year was larger than that. Every fall
stated here is therefore a floor, not the whole drop.

And we cannot name asset managers from this file. The standard code comes in at least four families
(KR5…, K55…, KRM…, K5V…), and the four digits that identify a manager in one family do not in another.
We hold no table that turns those codes into names. That is a gap we can close by finding the mapping,
not by reading company names out of fund titles — so for now it stays a gap.

The full year-by-year table, including every type in every year, is on
[the fund shelf page](/data/fund-shelf).
