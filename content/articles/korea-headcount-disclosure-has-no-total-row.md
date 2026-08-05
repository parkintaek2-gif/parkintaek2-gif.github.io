---
title: "One in three Korean listed companies files its headcount in pieces. Forty-two add it up."
dek: "The employee table in a Korean annual report carries no required total. Read only the first row — as we did until yesterday — and 482,227 people disappear from a sample of 853,817."
category: equities
pubDate: 2026-08-05
dataAsOf: 2026-08-05T09:00:00+09:00
author: Newsroom
tags: ["corporate disclosure", "human capital", "data quality", "methodology"]
tickers: ["005930", "005440"]
sources:
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — empSttus (Employee Status, annual report item)"
    url: "https://opendart.fss.or.kr"
crossChecks:
  - "All 3,925 listed entities in DART's corporate registry were queried; 2,921 had filed a 2025 employee-status table. Every row of every filing was stored, not just the parsed result, so the counts below are re-derived from the raw filings rather than from our own earlier output"
  - "The headline loss figure compares two readings of the same 975 filings: the first male row plus the first female row, against the company's own total row where it files one and the sum of its divisions where it does not"
  - "Samsung Electronics is quoted from its own filing, which contains an explicit 성별합계 (gender total) line of 94,273 men and 34,608 women"
  - "The National Pension Service publishes subscriber counts by workplace on a separate schedule. For Samsung Electronics it lists 125,592 against the 128,881 filed with DART — a 2.6 percent difference, which is what a correct reading should look like"
excluded:
  - "Whether any company intends to understate. Nothing here supports that reading — the divisions are disclosed in full, and a reader who adds them gets the right answer"
  - "Companies below the disclosure threshold, and unlisted companies, which file no such table"
  - "Turnover. The National Pension Service files monthly joiners and leavers, but its business-registration numbers are truncated to six digits, which is not enough to attach a multi-site company's branches to the parent with confidence"
corrections:
  - date: 2026-08-05
    note: >-
      This article exists because we made the mistake it describes. Our own
      reading of the employee table took the first male and first female row and
      stopped, which understated Samsung Electronics at 50,817 against the
      128,881 it filed. Three earlier articles and the rankings table were
      recomputed and corrected on 5 August 2026.
draft: false
---

Every listed company in Korea files, once a year, a table of how many people it employs — split by sex, with average tenure and average pay for each. It is a statutory item. It sits near the back of the annual report.

What it does not carry is a total.

Of the 2,921 listed companies that filed the table for 2025, **1,017 filed it split into more than one group** — by business division, by job category, by employment type. Of those 1,017, **forty-two** included a line that adds the groups up. The other 975 leave the addition to the reader.

## What that costs a reader who does not add

Take the 975 companies where the difference is measurable. Read only the first male row and the first female row of each filing:

| | Employees |
| --- | ---: |
| First row of each filing | 371,590 |
| What the filings actually say | **853,817** |
| Missing | **482,227** |

Fifty-seven percent of the workforce in that sample is in rows two and after — 56.5 percent, to be exact.

The effect is not evenly spread. It is worst where a company is organised into a large operating arm and a small head office, because the head office is often listed first.

| Company | First row | Filed | Share |
| --- | ---: | ---: | ---: |
| HDC Labs | 98 | 6,465 | 2% |
| Tokai Carbon Korea | 6 | 471 | 1% |
| Great Rich Technologies | 22 | 919 | 2% |
| Samsung Electronics | 50,817 | 128,881 | 39% |

HDC Labs files four groups. The first is its research centre, at 98 people. Its field-service arm, at 5,947, is fourth.

## Samsung is the easy case, and it is still a trap

Samsung Electronics is one of the forty-two that files a total. Its table reads:

| Division | Men | Women |
| --- | ---: | ---: |
| DX | 38,119 | 12,698 |
| DS | 56,154 | 21,910 |
| **성별합계** (gender total) | **94,273** | **34,608** |

The correct number, 128,881, is written in the filing. But it is on the fifth and sixth rows, under a Korean label, after two rows that also look like a complete male-and-female pair. A reader — or a parser — that takes the first pair gets 50,817, which is the DX division alone and 39 percent of the company.

We know because that is the number we published. It is corrected now, along with three articles that used it.

## The label is not standard either

There is no controlled vocabulary for the grouping column. Companies use whatever describes them:

- Samsung Electronics splits by business division (DX, DS) and labels its total 성별합계
- HDC Labs splits by internal organisation (research centre, business division, support division, field service)
- Tokai Carbon Korea splits by employment category — registered officers, production staff, administrative staff

The third is not a business-division split at all. Its "registered officers" row holds five people. Anything that keys on a fixed set of division names will miss it.

Matching on a word is also unsafe. An earlier version of our own filter treated any label ending in 계 as a total, which silently swallowed 기계 — the Korean word for machinery, and a real division name at several manufacturers.

## How to read it

The rule that survives contact with the actual filings is short:

1. If any row's group label is exactly a total — 전사, 전체, 합계, 총계, 성별합계, 계, 소계 — use only those rows.
2. Otherwise sum every row, by sex.
3. Weight tenure and pay by the headcount of the row they came from. A simple average across divisions gives the 300-person plant and the 5-person office the same say.

Getting rule 1 wrong is not symmetric, and not in the direction we first assumed.

A division misread as a total loses everything else — that is the Samsung failure. But a **total misread as a division is worse**: it does not fall through harmlessly to the sum. It gets added to the divisions it was summarising, and the company doubles.

We found five of those in our own output after fixing the first bug. Samsung Electro-Mechanics was carrying 24,346 employees against the 12,173 it filed, because its total row is labelled 성별 총계 — with a space, and 총계 rather than 합계 — and our matcher only knew 성별합계. Hansol Technics, Solum, Daejoo Electronic Materials and 3billion were doubled the same way.

The tell came from outside the filing. The National Pension Service lists 12,528 subscribers at Samsung Electro-Mechanics. Against our 24,346 that looked like a matching failure on their side. It was ours.

So the label match has to be generous about the wrapper — 전사, 전체, 회사, 성별 as prefixes, 합계, 총계, 소계, 계 as the noun — and strict about everything else. Never a suffix test: `/계$/` promotes 기계, 농기계, 건설기계, 설계, 반도체설계 and 광주신세계 to totals. All six are real division labels in this dataset.

## What this is not

It is not evidence that anyone is hiding anything. The divisions are disclosed in full and correctly; the arithmetic is simply left undone, which the disclosure rule permits. A company that files four groups and no total has complied.

It is a warning about a specific, common, silent failure. Nothing errors. The filing parses. The number is plausible — 50,817 is a large company. It is just the wrong company.

For anyone building on the DART employee table: store the rows, not your reading of them. We did not, for the tenure figures, and re-deriving them cost 2,921 API calls that a stored raw column would have made free.
