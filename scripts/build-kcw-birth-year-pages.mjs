#!/usr/bin/env node
/**
 * build-kcw-birth-year-pages.mjs — **「1995년에 난 한국 배우」 지면.** (`/born-year/<해>`)
 *
 * ## 🔴 왜 냈나 — 자동완성을 «재서» 냈다 (2026-08-26)
 *
 * 구글 자동완성에 이 말이 **있다**(1번째 자리) —
 * ```
 *   korean actors born in 1995     있다(1번째)
 *   korean idols born in december  있다(1번째)   ← 달 축은 이미 있다(/born-in/<달> 12장)
 *   korean actors by age           있다(1번째)   ← 나이 축도 있다(/actors-in-their 5장)
 * ```
 * ⭐ **날(366장)과 달(12장)은 있는데 «해»가 없었다.** 사람이 치는 말인데 답할 지면이 없었다.
 *
 * ⚠ 자동완성은 «검색량»이 아니다. 「사람이 치는 꼴인가」까지만 말한다. 그래서 이 지면을
 *   내는 근거는 「많이 검색된다」가 아니라 **「사람이 이 꼴로 친다 + 우리에게 자료가 있다」**다.
 *
 * ## ⛔ 얇으면 안 낸다
 *
 * 9,249명을 해로 갈라 보니 113개 해가 나오는데, **여덟 명 미만인 해가 35개**다.
 * 그것들은 안 낸다 — 얇은 지면은 색인이 안 되고 벌점이다(market 지면에서 배운 규칙).
 * 남는 것이 78개 해다.
 *
 * ## ⛔ 이 지면이 말하지 «않는» 것
 *
 * 「1995년생이 잘된다」 같은 말을 하지 않는다. 우리는 **몇 명이 났나**를 셀 뿐이다.
 * 태어난 해가 많은 것은 그 해에 사람이 많이 났다는 뜻이지 그 세대가 뛰어나다는 뜻이 아니다.
 * ⭐ 그리고 **위키데이터에 실린 사람만** 센다. 실리지 않은 사람은 0이 아니라 «안 세어진» 것이다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-birth-year-pages.mjs
 *   node scripts/build-kcw-birth-year-pages.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { 꼬리말 } from './kcw-static-footer.mjs';

const 뿌리 = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 수요길 = path.join(뿌리, 'src/data/wikitip-star-demand.json');
const 사람지면길 = path.join(뿌리, 'src/data/wikitip-people.json');
const 낼방 = path.join(뿌리, 'public/wikitip/born-year');
const 낼자료 = path.join(뿌리, 'src/data/kcw-birth-year-pages.json');

/** 지면을 낼 최소 인원. ⛔ 이보다 적으면 안 낸다 — 얇은 지면은 색인이 안 된다 */
export const 최소인원 = 8;
/** 한 지면에 이름을 몇까지 싣나. 너무 길면 손님이 못 읽는다 */
export const 실을수 = 60;

/** 생년월일에서 해를 뽑는다. ⛔ 네 자리가 아니면 «버리지 않고» null 로 남긴다 */
export function 해뽑기(생일) {
  const y = String(생일 ?? '').slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

/** 해마다 몇 명인지 센다 */
export function 해별로(사람들) {
  const 표 = new Map();
  let 해없음 = 0;
  for (const p of 사람들 ?? []) {
    const y = 해뽑기(p.born);
    if (!y) { 해없음 += 1; continue; }
    if (!표.has(y)) 표.set(y, []);
    표.get(y).push(p);
  }
  return { 표, 해없음 };
}

/** 낼 해와 안 낼 해를 가른다. ⛔ 안 내는 것을 «조용히» 버리지 않고 수를 돌려준다 */
export function 낼해고르기(표, 최소 = 최소인원) {
  const 낼것 = []; const 얇은것 = [];
  for (const [해, 사람] of 표) (사람.length >= 최소 ? 낼것 : 얇은것).push({ 해, 수: 사람.length });
  낼것.sort((a, b) => Number(a.해) - Number(b.해));
  얇은것.sort((a, b) => Number(a.해) - Number(b.해));
  return { 낼것, 얇은것 };
}

/** 영어 이름이 없는 사람은 «싣지» 않는다 — 영문 사이트다. ⛔ 다만 «세기»는 한다 */
export function 실을사람고르기(사람들, 수요) {
  const 실을것 = []; let 안실은수 = 0;
  for (const p of 사람들) {
    const 이름 = String(p.name ?? '').trim();
    if (!이름 || /[가-힣]/.test(이름)) { 안실은수 += 1; continue; }
    실을것.push({ 이름, born: p.born, q: p.q, reads: 수요.get(p.q)?.reads ?? null });
  }
  /* 많이 읽힌 사람부터 — 손님이 아는 이름이 먼저 보여야 한 걸음 더 걷는다.
     ⚠ 못 잰 사람(reads null)은 «맨 뒤»로. 0 으로 세면 「아무도 안 읽었다」가 되어 거짓이다 */
  실을것.sort((a, b) => (b.reads ?? -1) - (a.reads ?? -1));
  return { 실을것, 안실은수 };
}

const 벗 = (s) => String(s).replace(/\s*\([^)]*\)\s*$/, '').trim();
const 감 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* ── 자가시험 ─────────────────────────────────────────────
   ⛔ 말로 적은 규칙은 잊힌다. 겪은 것을 검사로 굳힌다. */
if (process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 검 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  검('해를 뽑는다', 해뽑기('1995-12-30') === '1995');
  검('네 자리가 아니면 null', 해뽑기('19') === null && 해뽑기('') === null && 해뽑기(null) === null);
  검('해가 없는 사람을 «버리지» 않고 센다', (() => {
    const r = 해별로([{ born: '1995-01-01' }, { born: '' }, { born: null }]);
    return r.해없음 === 2 && r.표.get('1995').length === 1;
  })());

  const 표 = new Map([['1995', new Array(20).fill({})], ['1900', new Array(3).fill({})]]);
  const g = 낼해고르기(표);
  검('여덟 명 이상만 낸다', g.낼것.length === 1 && g.낼것[0].해 === '1995');
  /* ⛔ 안 내는 해를 조용히 버리면, 나중에 「113개 해가 있는데 왜 78장뿐이냐」를 못 푼다 */
  검('⭐ 안 내는 해도 «수»를 돌려준다', g.얇은것.length === 1 && g.얇은것[0].수 === 3);
  검('해 차례로 낸다', 낼해고르기(new Map([['2000', new Array(9).fill({})],
    ['1990', new Array(9).fill({})]])).낼것[0].해 === '1990');

  const 수요 = new Map([['Q1', { reads: 100 }], ['Q3', { reads: 500 }]]);
  const s = 실을사람고르기([
    { name: 'Alpha', q: 'Q1', born: '1995-01-01' },
    { name: '한글이름', q: 'Q2', born: '1995-02-02' },
    { name: 'Gamma', q: 'Q3', born: '1995-03-03' },
    { name: 'Delta', q: 'Q4', born: '1995-04-04' },
  ], 수요);
  검('한글 이름만 있는 사람은 안 싣는다', s.안실은수 === 1);
  검('많이 읽힌 사람이 앞에 온다', s.실을것[0].이름 === 'Gamma');
  /* 🔴 못 잰 사람을 0 으로 세면 「아무도 안 읽었다」가 되어 거짓이다. 맨 뒤로 보낸다 */
  검('⭐ 못 잰 사람은 «맨 뒤»다 (0 이 아니다)',
    s.실을것[s.실을것.length - 1].이름 === 'Delta' && s.실을것[s.실을것.length - 1].reads === null);
  검('빈 것에 안 깨진다', 실을사람고르기([], new Map()).실을것.length === 0);

  console.log(실 === 0 ? `✅ build-kcw-birth-year-pages 자가시험 통과 (${통})` : `⛔ ${실}개 실패`);
  process.exit(실 === 0 ? 0 : 1);
}

/* ── 실제로 짓는다 ─────────────────────────────────────── */
if (!fs.existsSync(원자료)) {
  console.error(`⛔ 원자료가 없다 — ${원자료}. 0장으로 넘어가지 않는다`);
  process.exit(1);
}
const 사람들 = JSON.parse(fs.readFileSync(원자료, 'utf8')).사람 ?? [];
const 수요 = new Map();
if (fs.existsSync(수요길)) {
  for (const p of JSON.parse(fs.readFileSync(수요길, 'utf8')).people ?? []) 수요.set(p.q, p);
}
/* 사람 지면이 있는 이름에는 문을 단다. ⛔ 없는 지면에 걸면 죽은 링크가 된다 */
const 이름표 = new Map();
if (fs.existsSync(사람지면길)) {
  const j = JSON.parse(fs.readFileSync(사람지면길, 'utf8'));
  const 겹친것 = new Set();
  for (const p of (j.people ?? [])) {
    for (const 이름 of [p.name, p.wikiPage]) {
      const k = String(이름 ?? '').toLowerCase().trim();
      if (!k || !p.slug) continue;
      const 있던 = 이름표.get(k);
      if (있던 && 있던 !== p.slug) { 겹친것.add(k); continue; }
      이름표.set(k, p.slug);
    }
  }
  /* ⛔ 이름이 겹치면 «안 건다». 틀린 사람에게 보내는 것이 안 보내는 것보다 나쁘다 */
  for (const k of 겹친것) 이름표.delete(k);
}
const 이름칸 = (이름) => {
  const s = 이름표.get(String(이름).toLowerCase().trim());
  return s ? `<a href="/person/${s}">${감(벗(이름))}</a>` : 감(벗(이름));
};

const { 표: 해표, 해없음 } = 해별로(사람들);
const { 낼것, 얇은것 } = 낼해고르기(해표);

fs.mkdirSync(낼방, { recursive: true });
const 목록 = [];
for (let i = 0; i < 낼것.length; i += 1) {
  const { 해 } = 낼것[i];
  const { 실을것, 안실은수 } = 실을사람고르기(해표.get(해), 수요);
  const 보일것 = 실을것.slice(0, 실을수);
  const 으뜸 = 보일것[0];
  const 앞 = 낼것[i - 1]?.해;
  const 뒤 = 낼것[i + 1]?.해;
  const 나이 = 2026 - Number(해);
  const 제목 = 으뜸
    ? `Korean actors born in ${해} — ${벗(으뜸.이름)} and ${해표.get(해).length - 1} more`
    : `Korean actors born in ${해}`;
  const 줄 = 보일것.map((p) => `<tr><td>${이름칸(p.이름)}</td><td class="fine">${감(p.born)}</td>`
    + `<td class="fine">${p.reads === null ? '&mdash;' : p.reads.toLocaleString('en-US')}</td></tr>`).join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com/born-year/${해}">
<title>${감(제목)} | K Culture Wire</title>
<meta name="description" content="${해표.get(해).length} Korean actors, singers and songwriters were born in ${해}${으뜸 ? `, including ${감(벗(으뜸.이름))}` : ''}. They turn ${나이} this year. Birth dates from Wikidata; readers counted from English Wikipedia.">
<style>
  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --accent:#b4472a; --accent-soft:#fdf3f0; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --accent:#e8825f; --accent-soft:#261915; } }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  .wrap{max-width:52rem;margin:0 auto;padding:2rem 1.1rem 3rem}
  .kicker{color:var(--ink-2);font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;margin:0 0 .4rem}
  h1{font-size:1.7rem;line-height:1.25;margin:0 0 .8rem}
  table{border-collapse:collapse;width:100%;margin:1.2rem 0;font-size:.94rem}
  th,td{padding:.4rem .55rem;border-bottom:1px solid var(--line);text-align:left}
  th:last-child,td:last-child{text-align:right;font-variant-numeric:tabular-nums}
  a{color:var(--accent)}
  .fine{color:var(--ink-2);font-size:.87rem}
  .warn{background:var(--accent-soft);border-left:3px solid var(--accent);padding:.1rem .9rem;margin:1.2rem 0}
  nav{margin:1.4rem 0;display:flex;gap:1rem;flex-wrap:wrap}
  nav a,footer a{color:var(--accent);font-weight:600}
  footer{margin-top:2.2rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--ink-2);font-size:.85rem}
</style>
</head>
<body>
<div class="wrap">
  <p class="kicker">K Culture Wire &middot; birth years</p>
  <h1>${감(제목)}</h1>
  <p><b>${해표.get(해).length}</b> Korean actors, singers and songwriters in our roster were born in
  <b>${해}</b>. They turn <b>${나이}</b> this year. Ordered by how many people opened their English
  Wikipedia article in the last 30 days, so the name you are most likely to know is first.</p>
  ${안실은수 ? `<p class="fine"><strong>${안실은수} more people born in ${해} are counted but not listed</strong> — Wikidata holds no English name for them, only a Korean one, and this is an English-language site. They are inside the ${해표.get(해).length} total.</p>` : ''}
  ${실을것.length > 실을수 ? `<p class="fine">Showing the ${실을수} most-read of ${실을것.length} listed names.</p>` : ''}

  <div class="warn">
    <p><strong>A birth year is a birth year.</strong> Nothing here says people born in ${해} are
    better or luckier. A busy year means more people were born and recorded, not that the year
    was special. We tested whether birth year predicts reaching a chart, and it does not &mdash;
    <a href="/star-signs">that test is here</a>.</p>
  </div>

  <table>
    <thead><tr><th>Name</th><th>Born</th><th>Readers, 30 days</th></tr></thead>
    <tbody>
${줄 || '<tr><td colspan="3" class="fine">Nobody in our roster was born in this year.</td></tr>'}
    </tbody>
  </table>

  <nav>
    ${앞 ? `<a href="/born-year/${앞}">&larr; ${앞}</a>` : ''}
    ${뒤 ? `<a href="/born-year/${뒤}">${뒤} &rarr;</a>` : ''}
    <a href="/born-year">All ${낼것.length} years</a>
    <a href="/born-on">Birthdays, day by day</a>
  </nav>

  ${꼬리말([
    '<a href="/most-read">The 100 most-read Korean stars this month</a> &middot; '
      + `<a href="/actors-in-their/${나이 >= 60 ? '60s-and-over' : `${Math.floor(나이 / 10)}0s`}">Korean actors in their ${나이 >= 60 ? '60s and over' : `${Math.floor(나이 / 10)}0s`}</a> &middot; `
      + '<a href="/hometowns">Where they were born</a>',
    'Birth dates: Wikidata (best-ranked, day precision; South Korean citizenship; entertainment '
      + 'occupation), CC0. Readers: Wikimedia Pageviews, human traffic only. Readers are not searches.',
  ])}
</div>
</body>
</html>
`;
  fs.writeFileSync(path.join(낼방, `${해}.html`), html);
  목록.push({ year: 해, url: `/born-year/${해}`, people: 해표.get(해).length, listed: 보일것.length, top: 보일것.slice(0, 3).map((p) => 벗(p.이름)) });
}

/* 첫 지면 — ⛔ 낱장만 내고 들어오는 문을 안 내면 손님도 구글도 못 찾는다 */
const 첫줄 = 목록.map((r) => `<tr><td><a href="${r.url}">${r.year}</a></td>`
  + `<td class="fine">${r.people}</td><td class="fine">${감(r.top.join(' &middot; '))}</td></tr>`).join('\n');
fs.writeFileSync(path.join(낼방, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com/born-year">
<title>Korean actors by birth year — ${낼것.length} years | K Culture Wire</title>
<meta name="description" content="Korean actors, singers and songwriters grouped by the year they were born. ${낼것.length} years with eight or more names, counted from Wikidata birth dates.">
<style>
  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --accent:#b4472a; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --accent:#e8825f; } }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  .wrap{max-width:52rem;margin:0 auto;padding:2rem 1.1rem 3rem}
  h1{font-size:1.7rem;line-height:1.25;margin:0 0 .8rem}
  table{border-collapse:collapse;width:100%;margin:1.2rem 0;font-size:.94rem}
  th,td{padding:.4rem .55rem;border-bottom:1px solid var(--line);text-align:left}
  a{color:var(--accent)} .fine{color:var(--ink-2);font-size:.87rem}
  footer{margin-top:2.2rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--ink-2);font-size:.85rem}
  footer a{color:var(--accent);font-weight:600}
</style>
</head>
<body>
<div class="wrap">
  <h1>Korean actors by birth year</h1>
  <p>${낼것.length} years with eight or more names in our roster. ${얇은것.length} more years have
  fewer than eight and do not get a page &mdash; a page with three names is not worth your click.
  ${해없음 ? `${해없음} people have no birth date recorded at all.` : ''}</p>
  <table>
    <thead><tr><th>Year</th><th>People</th><th>Most-read names</th></tr></thead>
    <tbody>
${첫줄}
    </tbody>
  </table>
  ${꼬리말(['<a href="/born-on">Birthdays, day by day</a> &middot; '
    + '<a href="/hometowns">Where they were born</a> &middot; '
    + '<a href="/most-read">The 100 most-read Korean stars this month</a>'])}
</div>
</body>
</html>
`);

fs.writeFileSync(낼자료, `${JSON.stringify({
  generated: new Date().toISOString(),
  whatThisIs: 'Korean entertainers grouped by birth year, from Wikidata birth dates.',
  whatThisIsNot: 'A claim that any birth year is better. A busy year means more people were born and recorded.',
  minimumPeople: 최소인원,
  peopleTotal: 사람들.length,
  yearsAll: 해표.size,
  yearsWithPage: 낼것.length,
  yearsTooThin: 얇은것.length,
  peopleWithNoBirthDate: 해없음,
  years: 목록,
}, null, 2)}\n`);

console.log(`지면 ${낼것.length}장 · 실은 사람 ${사람들.length}명 중 해가 있는 사람 ${사람들.length - 해없음}명`);
console.log(`⛔ 여덟 명 미만이라 «안 낸» 해 ${얇은것.length}개 — 얇은 지면은 색인이 안 된다`);
console.log(`⚠ 생년월일이 아예 없는 사람 ${해없음}명 — 0 이 아니라 «안 세어진» 것이다`);
console.log('가장 붐비는 해:');
[...목록].sort((a, b) => b.people - a.people).slice(0, 5)
  .forEach((r) => console.log(`   ${r.year}  ${String(r.people).padStart(4)}명  ${r.top.join(' · ')}`));
console.log(`\n냈다 — ${낼방} · ${낼자료}`);
