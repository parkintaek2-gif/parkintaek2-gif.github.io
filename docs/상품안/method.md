# Korean Listed Workforce Panel — method

> Definitions are quoted from the source filings and standards, not paraphrased, so a buyer can audit our judgment.
> Data: FSS DART annual reports (empSttus/exctvSttus) parsed by SeoulMarkets; market cap from KRX daily close (data.go.kr, 2026-08-05).
> Full category shown: **Electronics and telecom equipment** (320 listed companies). The paid panel covers all 2,862.

## Columns

| Column | Definition (as filed / as standardised) |
|---|---|
| `company_en` | Company's English name from its DART registry entry; Korean name where no English is filed. |
| `ticker` | 6-digit KRX code. |
| `industry` | KSIC 2-digit division, mapped to the government English label. Blank where DART carries no code → shown as "Other", never invented. |
| `avg_tenure_years` | DART 근속연수, filed as free text in Korean ("5년 8월") and parsed to decimal years, weighted by male and female headcount. |
| `tenure_gap_M_minus_F_years` | Male average tenure minus female average tenure. Positive = men stay longer. |
| `avg_annual_pay_krw` | 1인평균 급여액 as filed. ⚠ Bonus and option treatment differs by company; holding companies count head office only. |
| `female_to_male_pay_pct` | Female average pay ÷ male average pay × 100. 100 = equal. |
| `employees` | 인원 — the company's own total row where it files one, otherwise the sum of its divisions. ⚠ Reading only the first row drops 482,227 people from the market (see corrections). |
| `female_share_pct` | Female headcount ÷ total headcount × 100. |
| `ceo_tenure_months` | Longest-serving representative director's tenure. ⚠ 113 firms report a CEO tenure longer than the company's own age (predecessor service or post-merger re-incorporation); flagged, not dropped. |
| `market_cap_per_employee_krw` | KRX market cap ÷ employees. **Capital intensity, not productivity** — market cap is a forward bet, not value staff produced. At the company level it is dominated by holding companies (head-office headcount) and pre-revenue biotech; use the industry median (17.5× top-to-bottom across 26 industries), never a company ranking. |

## Rules we keep
- Empty cell = not disclosed. Never zero.
- Unit-entry errors (개월↔년, 천원↔원) are filtered, not corrected — correcting would invent a figure. Filtered counts are published in coverage.csv.
- Every figure is re-derived from the raw filing, and re-checked against the source. Discrepancies go in corrections.csv, not a silent edit.

## Redistribution
KOSIS Art. 8 (commercial use allowed) · DART / KRX via data.go.kr, no restriction. Raw filings are **not** resold — what we sell is our parse, join and correction record.
