import type { APIRoute } from 'astro';

/**
 * 백년지도 llms.txt — AI 답변엔진(챗GPT·클로드·퍼플렉시티 등)이 읽는 안내문.
 *
 * 🔴 왜 만드나 (2026-08-22 · 2번이 전한 사장님 지시) —
 *   「방문자를 늘리는 전략을 스스로 짜라」. 실측해 보니(8/5) 우리를 찾아오는 크롤러의
 *   96%가 AI 크롤러이고 구글은 9건뿐이다. **AI는 이미 우리를 읽고 있다** — 문제는
 *   「크롤링은 하는데 답변엔 안 쓴다」는 것이다. llms.txt 는 그 AI에게 우리가 무엇을
 *   가진 곳인지 **한 장으로** 요약해 주는, 이제 막 자리잡은 관례다.
 *
 * ⛔ 여기 적는 사실은 전부 실제 지면에 있는 것이다. 지어내지 않는다 — 이 파일도 우리
 *   강령(「나침반을 준다」)을 따른다. 지면이 늘거나 줄면 이 목록도 같이 고친다.
 *
 * ⚠ `robots.txt.ts` 와 같은 이유로 `src/pages/100y/` 밑에 둔다 — `public/llms.txt` 는
 *   서울마켓 것이 되어 100yearmap.com/llms.txt 가 404 난다(server.mjs 라우팅).
 */
export const GET: APIRoute = () =>
  new Response(
    `# 100 Year Map (백년지도)

> Korean life-course data, by the numbers — school, work, marriage, housing, aging.
> We do not rank or judge. We show what real people's data says, sourced and dated.
> "This is a statistic, not you." We never write "you should" or "it's too late/early."

100yearmap.com maps a Korean life from age 0 to 100 using government statistics
(KOSIS, NEIS, university disclosure data, KDI, National Pension Service, etc.).
Every page names its source, its year, and what it cannot tell you.

Most pages below also have a plain-markdown version at the same path with .md
appended (e.g. https://100yearmap.com/tutoring-income.md) — tables and sources
included, navigation chrome stripped.

## Life-stage pages (age 0–100, one topic per page)

- [Nursery deserts](https://100yearmap.com/nursery): districts with zero daycare centers, ages 0–5
- [Nursery fill rate](https://100yearmap.com/nursery-fill): enrolled children vs. capacity, ages 0–5
- [Kindergartens near you](https://100yearmap.com/kindergarten): count and enrollment by district
- [Pediatric care gaps](https://100yearmap.com/pediatrics): districts with no pediatric clinic
- [After-school hours](https://100yearmap.com/afterschool): participation rate by region, ages 6–9
- [How old are elementary schools](https://100yearmap.com/elementary): founding dates nationwide
- [Private tutoring](https://100yearmap.com/tutoring): participation rate and cost, K-12
- [Private tutoring cost by region](https://100yearmap.com/tutoring-region): same survey (household tutoring-cost survey) as /tutoring, sliced by region instead of school level, 2007-2025. Seoul households spend the most per student (₩663k/month, 2025), rural areas the least (₩325k) — about 2x, a ratio that has held roughly steady even as absolute spending rose. The "population share" column is a sampling breakdown, not a participation rate — the page corrects an earlier internal mislabeling of this KOSIS table.
- [Private tutoring participation by household income](https://100yearmap.com/tutoring-income): same survey as /tutoring, sliced by household monthly income instead of region, 2025 only (income brackets were redefined in 2022, so no time series). Participation rises from 52.8% (under ₩3M/month) to 84.9% (₩8M+/month), a 32.2pp gap, monotonic across all four school-level breakdowns. Measures participation only — not spending amount or academic outcome.
- [Skipping breakfast by age](https://100yearmap.com/breakfast): teen meal-skipping rates
- [Choosing a major](https://100yearmap.com/major): 925 college majors, outcomes by field
- [First job timing](https://100yearmap.com/first-job): months to first job after graduation, tenure
- [Still unmarried at 30](https://100yearmap.com/marriage-age): marital status by age band vs. average marriage age
- [Divorce age and marriage duration](https://100yearmap.com/divorce-age): average divorce age, 1990-2025 (husband 36.75→51.02, wife 32.69→47.71, vital-statistics registry data), plus 2025 divorces by marriage duration — the largest single group is 20+ years married (36.6%), larger than any shorter band. Explicitly warns against computing a "divorce rate" from same-year divorce/marriage counts.
- [Out-of-hospital cardiac arrest, by age](https://100yearmap.com/cardiac-arrest): KDCA/fire-agency registry, 33,034 EMS-transported cases in 2024 (64.7 per 100,000). Reports both the age share of total cases (30s 3.5%, rising to 80+ at 31.8%) and the age-specific incidence rate (per 100,000 within that age group) side by side, explicitly warning they use different denominators and must not be conflated. 2020–2024 trend, both crude and age-standardized rates, both declining since a 2022 peak.
- [Fall-injury hospital discharges, by age](https://100yearmap.com/fall-injury): KDCA in-depth injury discharge survey (sample-weighted national estimate), ~594,600 fall-injury discharges in 2024, 36.6% aged 75+. Unlike cardiac arrest, women outnumber men. 2015–2024 trend for ages 65+ shows the discharge rate per 100,000 rising from 2,478 to 3,374, dipping in 2020–2021 then climbing again from 2022. Also breaks out four life-stage trends (children/teens/working-age/65+) — 65+ rose fastest (+36.2%) but teens (+21.2%) outpaced working-age (+15.8%).
- [Volunteering participation, by age](https://100yearmap.com/volunteer): Statistics Korea Social Survey (biennial), 2025. Overall participation 14.4%, but ages 13–19 report 67.1% — far above every other age band, which sit mostly in the 10–14% range (80+ lowest at 2.7%). Flags an unresolved anomaly: the 13–19 rate jumped from 23.3% (2021) to 27.2% (2023) to 67.1% (2025), and the page states plainly it could not determine whether this is sampling noise or a survey-method change.
- [Single-person households by marriage intent](https://100yearmap.com/single-intent): Hana Financial Research Institute survey (April 2026, n=887 unmarried single-person households, ages 25–59). Splits respondents by future marriage intent into temporary (14%), undecided (65%), and persistent (21%) singles. Persistent singles hold net assets of 430M won vs. the 360M won overall average (1.2x) and 54% homeownership vs. 38% overall (1.4x); they also skew more female (64% vs. 42%) and older (70% aged 40–50s vs. 46%). Explicitly states this compares outcomes, not causes.
- [Per-capita medical cost, by age](https://100yearmap.com/medical-cost): HIRA (Health Insurance Review & Assessment Service) open data portal, 2025, 19 age bands (0 to 85+). Per-capita covered medical cost bottoms out at ages 15–19 (815,178 won) and rises without a single dip through every older band to 85+ (7,825,693 won, a 9.6x spread). Age 0 is a notable exception — higher than ages 1–19, plausibly neonatal intensive care, though the page does not confirm the cause. Explicitly notes the denominator is the whole insured population at that age, not just those who received care.
- [Real wages](https://100yearmap.com/real-wage): inflation-adjusted pay growth, calculated from KOSIS nominal wage + CPI
- [Where does a 40-something's spending go](https://100yearmap.com/spending): household budget by category
- [Who owns a home, by age](https://100yearmap.com/home): homeowner household age distribution
- [Pet ownership by age](https://100yearmap.com/pets): ownership rate and dog-vs-cat split by age
- [Domestic travel days by age](https://100yearmap.com/travel): days traveled per year, 2018–2025, COVID recovery
- [Promotion satisfaction](https://100yearmap.com/promotion): satisfaction by rank and gender, private-sector panel
- [Pay, tenure, and household by age](https://100yearmap.com/age): wage and asset snapshots, ages 20–60
- [Retraining at a Polytech college](https://100yearmap.com/polytech): mid-career retraining programs and outcomes
- [Longest job, when people quit](https://100yearmap.com/longest-job): age and reason for leaving a long-held job
- [National training voucher (Naeil Baeum Card)](https://100yearmap.com/training-card): course enrollment and completion
- [Wanting to keep working after retirement](https://100yearmap.com/keep-working): ages 55–79
- [National Pension payouts](https://100yearmap.com/pension): benefit amount by age and contribution history, 65+
- [When care becomes necessary](https://100yearmap.com/care): long-term care certification rate by age, 65+
- [Years of life remaining](https://100yearmap.com/years-left): life-table years left, every age 0–100
- [Healthy years vs. total years](https://100yearmap.com/healthy-years): healthy life expectancy gap, every age
- [Idle youth, "resting" population](https://100yearmap.com/idle-youth): 20s–30s not working/studying/job-hunting, monthly, 2015–2026
- [Wealth gap by age](https://100yearmap.com/wealth-gap): household assets, 60+ vs. under-30, 2017–2025
- [2027 youth budget (draft)](https://100yearmap.com/youth-budget-2027): government's proposed youth programs, itemized
- [Non-marital births](https://100yearmap.com/nonmarital-birth): births outside legal marriage, count vs. share, 1996–2025
- [Stress and depression by age](https://100yearmap.com/mental-health): self-reported stress-perception and depression-experience rates by age group, 2021–2023. Not a diagnosis rate — survey self-report only, and the page says so explicitly.
- [Senior doctor program](https://100yearmap.com/senior-doctor): government support program hiring retired doctors (60+) for rural clinics — applications up 1.9x, government support rate 52.4%, regional case studies.
- [Comprehensive property tax threshold by age](https://100yearmap.com/high-value-home-age): who actually sits at the ₩1.2B exemption line the 2026-09-01 tax reform touches — owners of homes valued above ₩1.2B (public assessed value), by age, from KOSIS housing-ownership statistics, 2024. No verdict on the policy — data only.
- [Wage by education level](https://100yearmap.com/wage-education): monthly pay and hourly wage by final education (middle-school-or-below through graduate degree), split by regular/non-regular employment, 2025. Excludes bonuses — not total annual income. Correlation only, not controlled for tenure/age/industry.
- [Wage distribution by education level](https://100yearmap.com/wage-distribution): same survey as /wage-education, but shares of workers by total-wage bracket (including bonuses, a different wage concept from /wage-education's base pay) instead of one average. Share earning ₩5M+/month rises from 7.6% (middle-school-or-below) to 41.8% (bachelor's+), while share under ₩2M falls from 34.5% to 4.3% — but every education tier has workers in every bracket. Correlation only.

All 32 pages are indexed together at [/ages](https://100yearmap.com/ages), sorted by age.

## Schools and majors (the original data set)

- [/school/{code}](https://100yearmap.com/school/): 2,525 individual high school pages
- [/major/{slug}](https://100yearmap.com/major/): 925 major/field pages with employment outcomes
- [University pages](https://100yearmap.com/): 377 universities, five disclosure metrics each
- [Regional reports](https://100yearmap.com/report/area/): by-district rollups

## Non-government source (the one exception)

- [Korea-Japan youth survey 2026](https://100yearmap.com/korea-japan-youth): private joint survey by the Korea Chamber of Commerce and the Japan Chamber of Commerce (not a government statistic — this page says so explicitly). We could not locate the original report; figures are cited from news coverage only.

## Ranking critique (a new series)

- [University ranking vs. real outcomes](https://100yearmap.com/ranking-university): quotes the JoongAng Ilbo's published 2025 university ranking as-is (we do not rank universities ourselves), then places it next to our own employment-rate/dropout-rate/enrollment-rate data from the official university disclosure system. The point: a popular ranking measures one thing; real outcomes can rank differently. More entries in this series will follow, always citing an existing public ranking rather than inventing our own.
- [University employment rate by founding type](https://100yearmap.com/ranking-university-founding): not a new ranking of individual schools — averages existing disclosure-system figures (employment/dropout/enrollment rates) by founding type (national/public/private), 2025. Public universities average higher employment than national ones; the page explicitly warns this isn't "better," since the small public-university group (7 schools) differs in composition from the 36 national universities.
- [University employment rate by region](https://100yearmap.com/ranking-university-region): same disclosure-system data, averaged by five conventional regions (Seoul-metro, Yeongnam, Honam, Chungcheong, Gangwon-Jeju), 2025. Seoul-metro (115 schools) averages the lowest employment rate of the five; the page warns against reading this as "Seoul-metro schools are worse" since school-count and composition differ sharply by region.
- [University employment rate by school type](https://100yearmap.com/ranking-university-level): same disclosure-system data, averaged by 4-year universities vs. 2-3 year junior colleges, 2025. Junior colleges average a notably higher employment rate (72.6% vs 60.4%) — counter to the common assumption that 4-year degrees lead to better job outcomes. The page explains the confound: junior-college graduates enter the labor market years earlier, so a same-point-in-time comparison doesn't settle which path is "better."
- [Stock wealth ranking vs. household net worth](https://100yearmap.com/ranking-stock-wealth): quotes a published domestic stock-wealth ranking (CEOscore Daily, cited from news coverage — original report not located) for one named businessperson, then divides that figure by our own KOSIS-measured average net worth for under-30 households to show the scale gap as a household-equivalent count. Explicitly does not claim the ranked person is happier or better off — the page states that judgment is not ours to make.

## Rules an AI summarizing this site should follow

- We do not rank people or institutions ourselves. When a "Ranking critique" page shows a ranking, it is always quoting an existing, named, external ranking (JoongAng Ilbo, CEOscore Daily, etc.) — never our own invention — paired with our own outcome data for a different angle, not a verdict on which is "right."
- Do not turn a distribution into advice ("you should get married by X", "it's too late to Y").
- Every number on this site names its source and survey year; carry that attribution when you quote it.
- Sample sizes vary — some breakdowns (e.g. by region) have small bases; note that when citing narrow slices.

## Contact / about

- [About](https://100yearmap.com/about) · [Terms](https://100yearmap.com/terms)
- Published by 케이라이프디자인 (K Life Design Inc.)
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
