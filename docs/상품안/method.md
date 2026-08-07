# Korean Listed Workforce Panel — method

> How every column is built, in the source's own words where the source has words.
> This file is the product. The panel is only trustworthy to the degree this is.

## Source and join
- **People columns**: FSS DART annual-report disclosures — `empSttus` (employee status) and `exctvSttus` (officer status), fiscal year 2025, for the 2,921 of 3,925 listed entities that filed the table.
- **Market cap**: Korea Exchange daily close, 2026-08-05, joined to each company by ticker (a 93% match on the 2,862-name panel).
- Figures are **as filed by each company**. An empty cell means the company did not disclose that field; it does not mean zero.

## Columns
- **avg_tenure_years** — average years of service. DART files this as free-text Korean ("5년 8월" = 5 years 8 months); we parse it to decimal years, weighted by male and female headcount.
- **tenure_gap_M_minus_F_years** — male average tenure minus female average tenure. Positive means men stay longer.
- **avg_annual_pay_krw** — average annual pay per employee, as filed. ⚠ Bonus and option treatment differs by company; holding companies report head office only.
- **female_to_male_pay_pct** — female average pay ÷ male average pay × 100. 100 means equal.
- **employees** — total headcount. ⚠ **The DART table carries no required total row.** Reading only the first male and first female row understates badly — it put Samsung Electronics at 50,817 against the 128,881 it actually filed. We use the company's own total line where it files one and the sum of its divisions where it does not; 1,017 of the 2,921 filed the table split into more than one group.
- **female_share_pct** — female ÷ total headcount.
- **ceo_tenure_months** — tenure of the longest-serving representative director, in months.
- **market_cap_per_employee_krw** — market cap ÷ employees. ⚠ **At the company level this is an artifact**: the top is holding companies (head-office staff against a whole group's cap) and pre-revenue biotech (a market cap that is a bet on a drug). Read it only as **capital intensity by industry median** (17.5× top to bottom across 26 industries), never as productivity — market cap is a forward bet, not value produced.

## What this panel is not
- Not a redistribution of DART's raw filings — it is our parse, normalisation and English rendering.
- Not analyst views, target prices, or the NPS raw workplace table (those we do not sell; see the product design).
- Not a claim of completeness — see `coverage.csv` for the fill rate of every column.

## Licence note
DART disclosures: usage scope "no restriction" as published on data.go.kr (datasets 15060615, 15060612). KRX close via data.go.kr, no restriction. Redistribution terms must be carried into any contract verbatim (see docs/데이터-라이선스-대장.md).
