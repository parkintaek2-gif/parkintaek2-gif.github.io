---
title: "Four of Korea's ten best-paying listed companies employ fewer than 200 people"
dek: "Every listed company files its average pay per employee. Read the ranking without checking headcount and you will misread what it measures — four of the top ten are head offices, not workforces."
category: equities
pubDate: 2026-08-04
updatedDate: 2026-08-05
dataAsOf: 2026-08-04T09:00:00+09:00
author: Newsroom
tags: ["compensation", "corporate disclosure", "holding companies", "human capital"]
tickers: []
sources:
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — empSttus (Employee Status, annual report item)"
    url: "https://opendart.fss.or.kr"
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — company (industry code, headquarters address, incorporation date)"
    url: "https://opendart.fss.or.kr"
crossChecks:
  - "Average pay per employee is a statutory disclosure item filed by the company itself, not an outside estimate"
  - "All 3,925 listed entities in DART's corporate registry were queried; 2,921 had filed a 2025 employee-status table; 1,846 of those met the thresholds used here"
  - "59 companies were excluded because a filed figure is outside any plausible range — pay above 1bn won or below 10m won, or tenure above 35 years. These are unit-entry errors by the filer. They were removed, not corrected"
  - "Only firms with at least 100 employees are counted, and headcount is reported alongside every pay figure so the reader can see the sample behind each number"
  - "Industry averages are weighted by headcount, not by company, so that a sector's figure reflects the people in it rather than the number of listings"
  - "Industry codes are filed at two to five digits — a mix of KSIC sub-class and detail-class. All were normalised to the two-digit division before grouping; ungrouped, the same industry splits across several rows"
excluded:
  - "Executive pay, which is disclosed separately and is not inside this figure"
  - "Whether pay is deserved, competitive, or rising — this article reports the filed level and its composition"
  - "Bonus and stock-option treatment, which filers handle differently and the disclosure does not itemise"
  - "Unlisted companies, which file no such table"
corrections:
  - date: 2026-08-05
    note: >-
      Headcount for companies that file their employee table split by business
      division was understating the total: only the first division was counted.
      986 of 2,921 companies were affected. Because average pay is weighted by
      the male and female headcounts, the pay figures moved too, and the ten
      best-paying companies are not the same ten. The table, the sample (1,560
      companies and 1,452,844 employees, now 1,846 and 1,798,592) and the two
      companies named at the foot of the table were all recomputed. The finding
      — that several of the best-paying filers are holding companies with a few
      hundred head-office staff — is unchanged.
  - date: 2026-08-05
    note: >-
      The headline said half of the top ten employ fewer than 200 people. The
      figure was four, as the article itself stated. The headline has been
      corrected. Separately, the company filing 18m won across 114 employees is
      Lynxeo Korea; it was first published as "Lingseo Korea".
draft: false
---

Every listed Korean company files, once a year, the average annual pay of its employees. Sort 1,846 of them and the top of the table looks like a verdict on which industries pay.

| # | Company | Average pay | Employees |
| ---: | --- | ---: | ---: |
| 1 | Meritz Securities | 219m won | 1,593 |
| 2 | Bookook Securities | 216m | 288 |
| 3 | KB Financial Group | 198m | **144** |
| 4 | Hanyang Securities | 193m | 459 |
| 5 | Woori Financial Group | 185m | **114** |
| 6 | SK hynix | 185m | 34,549 |
| 7 | NH Investment & Securities | 185m | 3,137 |
| 8 | LG Corp | 180m | **195** |
| 9 | Daol Investment & Securities | 178m | 344 |
| 10 | Shinhan Financial Group | 178m | **195** |

Look at the right-hand column. **Four of the top ten employ fewer than 200 people.** Widen it to the top twenty and nine do — most of them holding companies.

## What a holding company's pay figure is

KB Financial Group is not a bank. It is the entity that owns one. Its 144 employees are the group's head office — planning, finance, strategy, the executive layer — and none of the tellers, call-centre staff or branch managers who make up the tens of thousands of people the group actually employs.

The same is true of Woori Financial Group (114), Shinhan Financial Group (195), LG Corp (195) and JB Financial Group (108). Each files a pay figure that is accurate, statutory, and describes a head office.

Put that next to SK hynix at fifth place. SK hynix files 185m won across **34,549 people**. It is the only company in the top ten whose figure describes a workforce rather than a headquarters.

This is not a flaw in the disclosure. It is a flaw in reading the disclosure as a ranking.

## Weighted by people, the picture changes

Group by industry and weight by headcount rather than by company, and the ordering is different from what the top-ten table implies.

| Industry | Pay per employee | Companies |
| --- | ---: | ---: |
| Finance and insurance services | 144m won | 23 |
| Electronics, computers, telecom equipment | 128m | 173 |
| Telecommunications | 124m | 10 |
| Insurance and pensions | 123m | 14 |
| Motor vehicles and trailers | 119m | 90 |
| … | | |
| Retail | 62m | 24 |
| Medical, precision and optical instruments | 58m | 56 |
| Other scientific and technical services | 58m | 12 |
| Education services | 50m | 11 |

Finance still leads. But the distance to chipmaking is 16m won, not the 30m the company ranking suggests — because the industry figure counts the 34,549 people at SK hynix at their real weight, while the company ranking counts a 144-person holding company and a 34,549-person manufacturer as one row each.

## The spread, for context

Across the 1,846 companies and 1,798,592 employees in this sample:

- **Median company:** 64m won
- **Mean company:** 71m won
- **Top decile:** 103m won and above
- **Bottom decile:** 46m won and below

The bottom of the table is not an error. Lynxeo Korea files 18m won across 114 employees; Alchera files 31m across 203. Both are within the range a company can legitimately report, and both were checked against the range test that removed fifty-nine other filings as unit-entry mistakes.

## How to read this column

Average pay per employee answers one question well: what does the average person at this specific legal entity earn. It does not answer what a group pays, what a job pays, or what a sector pays — and the ranking format quietly invites all three readings.

The fix is not complicated. **Read the headcount column first.** Four of the ten highest-paying listed companies in Korea would not fill a mid-sized office.
