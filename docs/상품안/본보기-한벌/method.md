# Method

How every figure in this bundle is made. This is the same text our build scripts carry, not a summary
written for the sale.

## Which titles count as Korean

Netflix publishes a Top 10 for the world and one for each country. Neither carries a country of
production. We take the list of Korean films and series from Wikidata (country of origin
P495 = Q884) and match on the title text.

**Title text is a weak key, and we do not pretend otherwise.** Netflix splits its global charts by a
title's primary language, so a Korean work belongs on the Non-English chart; we count those only.
That single rule removed 52 titles that were being counted as Korean and are not — *The Perfect
Couple*, *Suits*, *The Circle*, *Hit Man* among them.

Inside the Non-English charts, same-name collisions remain. We hand-checked the largest 30 series and
20 films by hours and removed 8 more (China, Germany, Poland, Thailand, India). Below that line we
stopped eyeballing and **measured instead**: for every title we count, we asked Wikidata which
countries made a film or series with exactly that name.

| Verdict | Titles | Share of viewing |
| --- | ---: | ---: |
| Only Korean works carry this title | 154 | 82.8% |
| A foreign work shares the title | 76 | 16.8% |
| Wikidata gives no country | 2 | 0.4% |

The `attribution` column in `korean-title-panel.csv` carries that verdict per title. A shared title
is **not an error** — it is a case we cannot settle from text alone, and it is marked rather than
guessed at or dropped.

## Reach and weeks

`countries_reached` is how many of six Southeast Asian markets (Singapore, Malaysia, the
Philippines, Thailand, Indonesia, Vietnam) a title charted in **at any point** across 265
weeks. It is not simultaneous. A title that hit Vietnam in 2022 and Thailand in 2024 counts as two.

`weeks_on_chart` counts distinct weeks, once per title however many countries it appeared in.

`peak_rank` is the best position reached in any of the six.

## K-pop attention

`kpop-attention-panel.csv` carries 2,361 acts — 816 groups and
1545 individuals — measured over 30 days (20260708~20260806).

**The number is English Wikipedia article opens, and nothing else.** Not streams, not sales, not chart
position, not attention inside Korea. We use it because it is the only per-artist demand signal
published openly, daily, worldwide, with a history back to 2015. Wikimedia filters out declared bots;
what remains is human traffic, not verified humans.

The roster is a rule, not a list we typed: Wikidata — P27=Q884 (Korean citizenship) with occupation singer/rapper/composer/musician, plus musical groups reached by P31/P279* from Q215380 (so girl group, boy band and other subtypes count, not only the parent class) with P495=Q884. English Wikipedia article required for both.

That rule matters more than it looks. Selecting groups by `P31 = musical group` alone — the obvious
reading — silently dropped Blackpink, Twice, NewJeans, aespa, IVE and Girls' Generation, because
Wikidata types them as *girl group* and never as the parent class. It cost us 404 groups and produced
no error, no zero, and no warning. Walking subclasses (`P31/P279*`) is why they are here.

Groups and individuals are **counted apart and never added.** A group's article and its members'
articles are different pages, and summing them counts the same interest twice.

154 of these acts (6.5%) also appear on our screen-actor roster, because
Wikidata records both occupations for them — Jisoo and Cha Eun-woo really are both. We do not remove
them; we flag them in `also_on_screen_actor_roster` and report the size, which is larger than it
sounds: **23.1% of all views in this panel.** Filter that column out and the ranking changes
substantially. Both versions are defensible; the undisclosed one is not.

## Exports

Music: KOSIS table DT_113_STBL_1020468, 2005–2024, thousands of US dollars as
published. Region parts sum to the published total in every year except three, where they differ by
$1,000 — rounding in the source, not by us.

Broadcast: KOSIS table DT_113_STBL_1025706, 2012–2024. **This table classifies
on two levels** — form of export above (finished programmes, format sales, video and DVD, time blocks,
support for overseas Korean broadcasting, other) and type of company below — and returns only the
lower name, so several rows a year read "terrestrial broadcasters" and differ by code alone. Each
company type here is the sum of every export form published for it. Where the survey publishes its own
subtotal, our sum matches it to within $1,000.

Both series are nominal US dollars. No inflation or exchange-rate adjustment has been applied.

## Workforce

FSS DART annual report employee disclosures, filing year 2025, from every listed company that
discloses both tenure and headcount (2779 companies, 1,865,198 staff).

Group averages are **weighted by headcount**, so a 3,000-person studio and a 170-person label each
count for their own staff rather than one company one vote. Pay is weighted over companies that
disclose pay only — 99.3% of content staff and 98.9%
of the market. Leaving non-disclosing companies in the denominator averages their staff in at zero,
which is what we were doing until 7 August 2026.

## What is not here

- **Netflix's weekly source tables.** We publish aggregates of them and do not redistribute the rows.
- **Riot Games ladder data.** We collect it daily and it is not in this bundle.
- **Hours viewed by country.** Netflix publishes hours for the global chart only. Nothing here says
  how much anything was watched in any single market.
- **Anything below each Top 10.** A title watched steadily that never breaks a top ten is invisible.
- **Why anything happened.** Release timing, dubbing, marketing spend and recommendation weighting all
  move these numbers and none of them are in the published data.

## Sources

- Netflix Top 10 (Tudum) — https://www.netflix.com/tudum/top10
- Wikidata — https://www.wikidata.org
- KOSIS (Statistics Korea open API), Korea Creative Content Agency 콘텐츠산업조사 — https://kosis.kr
- FSS DART electronic disclosure — https://dart.fss.or.kr
