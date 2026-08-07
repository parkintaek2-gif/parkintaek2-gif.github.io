/**
 * 유료 상품 1안의 **한 벌**을 만든다 — 받는 사람이 여는 그대로.
 *
 * 2번 지시(2026-08-07 10:2x): 「본보기를 받는 사람이 여는 그대로 한 벌로 묶는다.
 *   표 + method(정의 원문) + corrections + 읽는 법 한 장. 폴더 하나로.
 *   값은 사장님이 정하신다. 정하시려면 **받는 것을 보셔야** 한다」
 *
 * 결과 → docs/상품안/본보기-한벌/
 *          README.md                  읽는 법 한 장 — 맨 먼저 열리는 것
 *          korean-title-panel.csv     동남아 405편 전부. 맛보기가 아니다
 *          provenance.csv             이 표를 얼마나 믿어야 하나
 *          industry-panel.csv         KOSIS 수출 × DART 인력
 *          corrections.csv            우리가 틀렸던 것 전부
 *          method.md                  정의 원문 — 우리 빌드 스크립트가 말하는 그대로
 *
 * ── ⛔ 담지 않는 것 ────────────────────────────────────────────
 * 넷플릭스 Tudum **원본 주간 표**는 안 담는다. 우리 지면이 「원본 표 재배포 없이 집계만」이라고
 * 이미 밝히고 있다. 담는 것은 우리 **집계**와 우리 **판정**뿐이다.
 * Riot 사다리도 안 담는다 — Production Key(App 866800) 심사 중이고 승인 전 상업 이용은
 * 접근 영구 취소다.
 *
 * ⛔ 아직 파는 물건이 아니다. **사장님 판단을 받기 위한 실물**이다.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'docs/상품안/본보기-한벌';
fs.mkdirSync(OUT, { recursive: true });

const 읽기 = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const titles = 읽기('src/data/wikitip-titles.json');
const amb = 읽기('src/data/wikitip-title-ambiguity.json');
const music = 읽기('src/data/wikitip-music-export.json');
const bcast = 읽기('src/data/wikitip-broadcast-export.json');
const ind = 읽기('src/data/wikitip-content-industry.json');
const pageFix = 읽기('src/data/wikitip-page-corrections.json');

const csv = (rows) => rows.map((r) => r.map((v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(',')).join('\n') + '\n';

/* ── ① 작품 패널 ── 405편 **전부**. 맛보기 25줄이 아니다. */
const 판정 = new Map(amb.perTitle.map((r) => [r.title, r]));
const panel = [[
  'title', 'format', 'countries_reached', 'weeks_on_chart', 'peak_rank',
  'attribution', 'attribution_countries',
]];
for (const r of titles.rows) {
  const v = 판정.get(r.title);
  panel.push([
    r.title,
    /^TV/i.test(r.type) ? 'series' : 'film',
    r.countries, r.weeks, r.peak,
    v ? v.verdict : 'not_assessed',
    v && v.verdict === 'shared' ? v.countries.join('|') : '',
  ]);
}
fs.writeFileSync(path.join(OUT, 'korean-title-panel.csv'), csv(panel));

/* 패널 자체의 판정 분포. 글로벌 목록의 비중과 **다르다** — 동남아 전용 작품은
   작고 이름이 흔해 겹침이 훨씬 많다. 사는 사람이 놀라지 않게 README 에 그대로 싣는다. */
const 패널분포 = panel.slice(1).reduce((a, r) => { a[r[5]] = (a[r[5]] || 0) + 1; return a; }, {});

/* ── ② 출처 판정 ── 이 상품의 값이 여기 있다. */
const prov = [['measure', 'titles', 'share_of_viewing_pc', 'what_it_means']];
prov.push(['korea_only', amb.koreaOnly.titles, amb.koreaOnly.sharePc,
  'Only Korean works carry this exact title. A title-text rule cannot mismatch it.']);
prov.push(['shared_title', amb.shared.titles, amb.shared.sharePc,
  'A non-Korean work shares the exact title. We cannot tell from text alone which one charted. Not an error — an unresolved case.']);
prov.push(['no_country_on_wikidata', amb.unknown.titles, amb.unknown.sharePc,
  'Wikidata records no country of origin for any work with this title. No basis to judge.']);
fs.writeFileSync(path.join(OUT, 'provenance.csv'), csv(prov));

/* ── ③ 산업 패널 ── KOSIS 수출과 DART 인력을 한 표에. 두 기관은 서로를 안 본다. */
const industry = [[
  'year', 'series', 'measure', 'value', 'unit', 'source',
]];
for (const r of music.rows) {
  industry.push([r.year, 'music_exports', 'total', r.total, 'thousand USD', 'KOSIS DT_113_STBL_1020468']);
  for (const [k, v] of Object.entries(r.parts)) {
    if (v === null) continue;
    industry.push([r.year, 'music_exports', k, v, 'thousand USD', 'KOSIS DT_113_STBL_1020468']);
  }
}
for (const r of bcast.rows) {
  industry.push([r.year, 'broadcast_exports', 'total', r.total, 'thousand USD', 'KOSIS DT_113_STBL_1025706']);
  for (const [k, v] of Object.entries(r.parts)) {
    industry.push([r.year, 'broadcast_exports', k, v, 'thousand USD', 'KOSIS DT_113_STBL_1025706']);
  }
}
for (const g of ind.groups) {
  industry.push([ind.year, 'listed_workforce', `${g.key} — companies`, g.n, 'count', 'FSS DART']);
  industry.push([ind.year, 'listed_workforce', `${g.key} — staff`, g.staff, 'persons', 'FSS DART']);
  industry.push([ind.year, 'listed_workforce', `${g.key} — avg tenure`, g.tenure, 'years (headcount-weighted)', 'FSS DART']);
  industry.push([ind.year, 'listed_workforce', `${g.key} — women`, g.female, 'percent', 'FSS DART']);
}
industry.push([ind.year, 'listed_workforce', 'whole listed market — avg tenure', ind.market.tenure, 'years (headcount-weighted)', 'FSS DART']);
fs.writeFileSync(path.join(OUT, 'industry-panel.csv'), csv(industry));

/* ── ④ 정정 ── /corrections 와 **같은 자료**에서 온다. 손으로 옮기면 다음에 빠진다. */
const 기사정정 = [];
const CD = 'content/kculturewire';
for (const f of fs.readdirSync(CD).filter((x) => x.endsWith('.md'))) {
  const src = fs.readFileSync(path.join(CD, f), 'utf8');
  const block = src.match(/^corrections:\n((?:\s{2}- date:[\s\S]*?)(?=^\w|^---$))/m);
  if (!block) continue;
  for (const m of block[1].matchAll(/- date:\s*(\S+)\s*\n\s*note:\s*"([\s\S]*?)"\s*(?=\n\s*- date:|\n\S|$)/g)) {
    기사정정.push({ date: m[1], where: f.replace(/\.md$/, ''), kind: 'article', note: m[2].replace(/\s+/g, ' ').trim() });
  }
}
const fixes = [['date', 'kind', 'where', 'what', 'from', 'to', 'why']];
for (const r of pageFix.rows) fixes.push([r.date, 'data page', r.where, r.what, r.from, r.to, r.why]);
for (const r of 기사정정) fixes.push([r.date, 'article', `/article/${r.where}`, '', '', '', r.note]);
fs.writeFileSync(path.join(OUT, 'corrections.csv'), csv(fixes));

/* ── ⑤ 정의 원문 ── 우리 화면에 가두지 않는다. */
const method = `# Method

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
| Only Korean works carry this title | ${amb.koreaOnly.titles} | ${amb.koreaOnly.sharePc}% |
| A foreign work shares the title | ${amb.shared.titles} | ${amb.shared.sharePc}% |
| Wikidata gives no country | ${amb.unknown.titles} | ${amb.unknown.sharePc}% |

The \`attribution\` column in \`korean-title-panel.csv\` carries that verdict per title. A shared title
is **not an error** — it is a case we cannot settle from text alone, and it is marked rather than
guessed at or dropped.

## Reach and weeks

\`countries_reached\` is how many of six Southeast Asian markets (Singapore, Malaysia, the
Philippines, Thailand, Indonesia, Vietnam) a title charted in **at any point** across ${titles.weekCount}
weeks. It is not simultaneous. A title that hit Vietnam in 2022 and Thailand in 2024 counts as two.

\`weeks_on_chart\` counts distinct weeks, once per title however many countries it appeared in.

\`peak_rank\` is the best position reached in any of the six.

## Exports

Music: KOSIS table DT_113_STBL_1020468, ${music.yearFrom}–${music.yearTo}, thousands of US dollars as
published. Region parts sum to the published total in every year except three, where they differ by
$1,000 — rounding in the source, not by us.

Broadcast: KOSIS table DT_113_STBL_1025706, ${bcast.yearFrom}–${bcast.yearTo}. **This table classifies
on two levels** — form of export above (finished programmes, format sales, video and DVD, time blocks,
support for overseas Korean broadcasting, other) and type of company below — and returns only the
lower name, so several rows a year read "terrestrial broadcasters" and differ by code alone. Each
company type here is the sum of every export form published for it. Where the survey publishes its own
subtotal, our sum matches it to within $1,000.

Both series are nominal US dollars. No inflation or exchange-rate adjustment has been applied.

## Workforce

FSS DART annual report employee disclosures, filing year ${ind.year}, from every listed company that
discloses both tenure and headcount (${ind.market.n} companies, ${ind.market.staff.toLocaleString()} staff).

Group averages are **weighted by headcount**, so a 3,000-person studio and a 170-person label each
count for their own staff rather than one company one vote. Pay is weighted over companies that
disclose pay only — ${ind.payCoverage.content.pc}% of content staff and ${ind.payCoverage.market.pc}%
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
`;
fs.writeFileSync(path.join(OUT, 'method.md'), method);

/* ── ⑥ 읽는 법 ── 맨 먼저 열리는 것. 여기서 못 잰 것을 먼저 말한다. */
const readme = `# K Culture Wire — Korean Content Panel

Sample bundle, ${new Date().toISOString().slice(0, 10)}. Six files. Start here.

| File | What it is | Rows |
| --- | --- | ---: |
| \`korean-title-panel.csv\` | Every Korean title that charted in six Southeast Asian markets since ${titles.weekFrom.slice(0, 4)} | ${panel.length - 1} |
| \`provenance.csv\` | How sure we are that each title is Korean, and how much of the total that covers | ${prov.length - 1} |
| \`industry-panel.csv\` | Korean music and broadcast exports by year, beside the workforce of listed content companies | ${industry.length - 1} |
| \`corrections.csv\` | Every figure we have published and had to change | ${fixes.length - 1} |
| \`method.md\` | How each number is made, in the words our build scripts use | — |

## The column most people will not have seen

\`attribution\`, in the title panel.

Netflix does not say where a title was made. Anyone building a Korean panel has to decide that for
themselves, and the usual way is to match a list of Korean titles against the chart by name. That
works until two countries make something with the same name — and they do, often.

So every row here carries what we think **and how sure we are**:

- \`koreaOnly\` — only Korean works carry this exact title. A name match cannot go wrong.
- \`shared\` — a foreign work shares the name. The \`attribution_countries\` column names them. We do
  not know which one charted, and we say so instead of choosing.
- \`unknown\` — Wikidata gives no country for any work with this name.

Two different numbers, and both matter.

| | Only Korean | Shared name | No country |
| --- | ---: | ---: | ---: |
| This panel, by titles | ${패널분포.koreaOnly ?? 0} | ${패널분포.shared ?? 0} | ${패널분포.unknown ?? 0} |
| Global catalogue, by viewing hours | ${amb.koreaOnly.sharePc}% | ${amb.shared.sharePc}% | ${amb.unknown.sharePc}% |

**The panel has a much higher share of shared names than the global catalogue does.** That is not a
different standard — it is the same test on a different population. Titles that chart in Southeast
Asia without ever reaching the global Top 10 are smaller, and smaller titles carry ordinary English
names far more often. Weighted by viewing, the ambiguity is concentrated in the tail.
If you need a conservative cut, filter to \`koreaOnly\`. If you need coverage, take all of it and
report the share. Either way you can state your own error bound, which is the point.

## \`corrections.csv\`

Every number we have published and then changed, with the old value, the new value and the reason.

We include it because a figure that changes quietly is worse than one that was never published —
somebody has already quoted it. On 7 August 2026 a single flaw in how we matched titles had put wrong
figures on seven pages and four articles at once. All of it is in that file, including the size of
the error.

If you put one of our numbers in a report, this file tells you whether it still stands.

## What we could not measure

Stated plainly, because you will hit these:

1. **${amb.shared.sharePc}% of viewing sits on titles a foreign work shares a name with.** We mark them; we do not
   resolve them. Nothing in the published data resolves them.
2. **Country charts carry no hours.** \`countries_reached\` is chart entry, not viewing. There is no
   viewing figure per market anywhere in Netflix's country data.
3. **Only the top ten exists.** A title watched widely that never breaks a top ten is absent entirely.
4. **Exports are nominal dollars.** Part of every increase is price, not volume. We did not adjust.
5. **Workforce covers listed companies only.** Much of Korean production is private and files nothing.

## Terms

Aggregates and our own attribution work, not redistribution of anyone's source tables. Netflix's
weekly tables and Riot Games ladder data are not in this bundle. KOSIS and DART figures are Korean
public open data and are cited above.

Questions: parkintaek2@gmail.com
`;
fs.writeFileSync(path.join(OUT, 'README.md'), readme);

/* ── 검산 ── 정정 건수가 지면과 어긋나면 둘 중 하나가 빠진 것이다. */
const 지면건수 = pageFix.rows.length;
const 총정정 = fixes.length - 1;
if (총정정 !== 지면건수 + 기사정정.length) throw new Error('정정 건수가 안 맞는다');
if (기사정정.length === 0) throw new Error('기사 정정을 하나도 못 읽었다 — 앞말 파싱이 깨졌다');

console.log(`한 벌을 ${OUT}/ 에 냈다 — 파일 6개`);
console.log(` 작품 패널   ${panel.length - 1}줄 (맛보기가 아니라 전부)`);
console.log(` 산업 패널   ${industry.length - 1}줄`);
console.log(` 정정        ${총정정}건 (지면 ${지면건수} · 기사 ${기사정정.length})`);
console.log(` 출처 판정   한국만 ${amb.koreaOnly.sharePc}% · 겹침 ${amb.shared.sharePc}% · 모름 ${amb.unknown.sharePc}%`);
