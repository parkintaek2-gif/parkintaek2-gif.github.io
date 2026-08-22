#!/usr/bin/env node
/**
 * build-kcw-stem-rooms.mjs — **일간 열 칸을 이름으로 걷는 지면 열 장.** (`/stem/<gan>`)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * `/day-pillar` 은 표다. 표는 셈을 보여 주지만 **사람이 자기 이름으로 찾아 들어오는 자리는
 * 아니다.** 띠 방 열두 장에서 이미 겪었다 — 이름 1,047개를 한 장에 늘어놓으면 아무도 안 읽고,
 * 열두 장으로 갈라 놓으면 읽힌다. 사장님 상시 지시도 「스타 이름을 항상 제목과 본문에」다.
 *
 * ⭐ 그래서 캐 둔 9,249명을 **일간 열 칸으로 갈라** 열 장을 만든다. 새로 캘 것이 없다.
 * ⛔ 점을 치지 않는다. 칸 이름은 «가르는 이름표»일 뿐이고, 우리가 이미 잰 것을 각 장 머리에 적는다 —
 *   일간 분포는 카이제곱 17.91(문턱 16.92)로 문턱을 살짝 넘었지만, 반증을 넷 해 보고도
 *   「발견」이라 부르지 않기로 한 그 수다. 그 문장을 열 장에 그대로 싣는다.
 * ⛔ 「이 일간이면 이렇다」를 한 줄도 쓰지 않는다.
 * ⛔ 화면에 우리말을 쓰지 않는다(`check-english-only.mjs`).
 *
 * ── 지키는 것 ────────────────────────────────────────────────
 * ⚠ canonical 을 넣는다 — 커뮤니티 방 열두 장이 canonical 없이 나가 있었다(8/22 에 잡음).
 * ⚠ 들어오는 문을 같이 낸다 — 만들고 문을 안 내면 없는 것과 같다(여섯 번 겪었다).
 * ⚠ 이름은 위키데이터에서 캔 것만 쓴다. 손으로 적지 않는다.
 *
 * 쓰는 법  node scripts/build-kcw-stem-rooms.mjs --자가시험
 *          node scripts/build-kcw-stem-rooms.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 일주 } from './lib/일주.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 잰것 = path.join(뿌리, 'src/data/wikitip-star-daypillar.json');
const 낼방 = path.join(뿌리, 'public/wikitip/stem');

/** 일간 열 칸 — 한자와 로마자. 주소는 로마자 소문자다 */
export const 간 = [
  ['甲', 'gap'], ['乙', 'eul'], ['丙', 'byeong'], ['丁', 'jeong'], ['戊', 'mu'],
  ['己', 'gi'], ['庚', 'gyeong'], ['辛', 'sin'], ['壬', 'im'], ['癸', 'gye'],
];
export const 칸주소 = (로마자) => `/stem/${로마자}`;
const 로마자 = new Map(간);

/** 한 칸에 들어갈 사람 — 많이 링크된 순. ⚠ 링크 수는 «널리 쓰였나»의 대리 지표다 */
export function 칸나누기(사람들) {
  const 칸 = new Map(간.map(([h]) => [h, []]));
  for (const p of 사람들) {
    const j = 일주(p.born);
    if (!j.일간한자 || !칸.has(j.일간한자)) continue;
    칸.get(j.일간한자).push({ ...p, dayPillar: j.일주한자 });
  }
  for (const [, v] of 칸) v.sort((a, b) => b.sitelinks - a.sitelinks || a.name.localeCompare(b.name));
  return 칸;
}

const 벗기기 = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function 방짓기(한자, 사람들, 잼) {
  const rom = 로마자.get(한자);
  const 이름셋 = 사람들.slice(0, 3).map((p) => p.name).join(', ');
  const 줄 = 사람들.map((p) => `<tr><td>${벗기기(p.name)}</td><td class="fine">${p.born}</td><td>${p.dayPillar}</td><td class="fine">${p.sitelinks}</td></tr>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com${칸주소(rom)}">
<title>${한자} (${rom}) day stem &mdash; ${사람들.length} Korean entertainers | K Culture Wire</title>
<meta name="description" content="The ${사람달수(사람들)} Korean actors and singers born on a ${한자} (${rom}) day, including ${벗기기(이름셋)}. A count, not a reading.">
<style>
  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --card:#fff; --accent:#b4472a; --accent-soft:#fdf3f0; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --card:#181b21; --accent:#e8825f; --accent-soft:#261915; } }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
  .wrap{max-width:860px;margin:0 auto;padding:2rem 1.1rem 4rem}
  h1{font-size:1.5rem;line-height:1.3;margin:.2rem 0 .6rem;letter-spacing:-.01em}
  .kicker{color:var(--accent);font-weight:700;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;margin:0}
  .warn{border:1px solid var(--accent);border-radius:6px;padding:.7rem 1rem;background:var(--accent-soft);margin:1.2rem 0}
  .warn p{margin:.35rem 0;font-size:.9rem}
  table{border-collapse:collapse;width:100%;font-size:.93rem}
  th,td{text-align:left;padding:.42rem .5rem;border-bottom:1px solid var(--line)}
  th{font-size:.78rem;color:var(--ink-2);text-transform:uppercase;letter-spacing:.05em}
  .fine{color:var(--ink-2);font-size:.86rem}
  .scroll{overflow-x:auto}
  nav a{color:var(--accent);font-weight:600;margin-right:.8rem}
  footer{margin-top:2.4rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--ink-2);font-size:.85rem}
</style>
</head>
<body>
<div class="wrap">
  <p class="kicker">K Culture Wire &middot; day stem</p>
  <h1>${한자} (${rom}) &mdash; ${사람들.length} Korean entertainers were born on this day stem</h1>
  <p>${벗기기(이름셋)} and ${사람들.length - 3} others. Ordered by how many Wikipedia editions carry an article about them, so the name you are most likely to know comes first.</p>

  <div class="warn">
    <p><strong>This is a count, not a reading.</strong> A day stem is one character of the four pillars, and the hour pillar cannot be built for anyone here: public records carry birth dates and almost never birth hours.</p>
    <p>Across all ${잼.measured.toLocaleString('en-US')} people we counted, the spread over the ten stems came out at chi-square ${잼.all.chiSquareDayStem.카이제곱} against a 0.05 threshold of ${잼.thresholds['9']}. It crossed by a hair, we tried four ways to kill it, and we do not call it a finding. <a href="/day-pillar">The tests are here</a>.</p>
    <p>Nothing on this page says what a ${한자} day means for anyone.</p>
  </div>

  <div class="scroll">
  <table>
    <thead><tr><th>Name</th><th>Born</th><th>Day pillar</th><th>Wikipedia editions</th></tr></thead>
    <tbody>
${줄}
    </tbody>
  </table>
  </div>

  <footer>
    <nav>
      <a href="/day-pillar">All ten stems, counted</a>
      <a href="/star-signs">The same test on birth years</a>
      <a href="/community">The twelve birth-year rooms</a>
    </nav>
    <p>Source: Wikidata (date of birth, best-ranked, day precision; South Korean citizenship; entertainment occupation), CC0. Day pillars from our own sixty-cycle table, anchored on 1900-01-01 = 甲戌.</p>
  </footer>
</div>
</body>
</html>
`;
}

/** 「N명」을 영문 지면에 쓸 수로 — 세 자리 쉼표 */
export const 사람달수 = (사람들) => 사람들.length.toLocaleString('en-US');

/** 열 장으로 가는 문 한 덩어리 — `/day-pillar` 에 넣는다 */
export function 문덩어리(칸) {
  const 줄 = 간.map(([h, r]) => {
    const v = 칸.get(h) ?? [];
    const 이름 = v.slice(0, 2).map((p) => p.name).join(', ');
    return `      <li><a href="${칸주소(r)}">${h} ${r}</a> &mdash; ${v.length} names${이름 ? `, including ${이름}` : ''}</li>`;
  }).join('\n');
  return `  <section>
    <h2>The ten stems, with every name in them</h2>
    <p>
      The table above is the count. If you want the names, they are split into ten pages, one per
      day stem, ordered by how widely each person is written about.
    </p>
    <ul>
${줄}
    </ul>
    <p class="note">
      <strong>A page name is not a reading.</strong> The pages exist because a list of 9,249 names
      is not a page anyone finishes and ten pages of about nine hundred are.
    </p>
  </section>
`;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 사람 = [
    { q: 'Q1', name: 'IU', born: '1993-05-16', sitelinks: 90 },
    { q: 'Q2', name: 'Jungkook', born: '1997-09-01', sitelinks: 80 },
    { q: 'Q3', name: 'Karina', born: '2000-04-11', sitelinks: 30 },
  ];
  const 칸 = 칸나누기(사람);
  검('열 칸을 다 만든다', 칸.size === 10);
  검('아이유는 丁 칸', 칸.get('丁')[0].name === 'IU');
  검('정국은 丙 칸', 칸.get('丙')[0].name === 'Jungkook');
  검('카리나는 己 칸', 칸.get('己')[0].name === 'Karina');
  검('빈 칸도 배열로 둔다 — undefined 로 안 둔다', Array.isArray(칸.get('甲')));
  검('주소는 로마자 소문자', 칸주소('gyeong') === '/stem/gyeong');

  const 잼 = { measured: 9249, thresholds: { 9: 16.92 }, all: { chiSquareDayStem: { 카이제곱: 17.91 } } };
  const h = 방짓기('丁', 칸.get('丁'), 잼);
  검('canonical 이 있다', h.includes('rel="canonical" href="https://www.kculturewire.com/stem/jeong"'));
  검('이름이 지면에 있다', h.includes('IU'));
  검('«발견이 아니다»를 지면에 적는다', h.includes('we do not call it a finding'));
  검('나가는 문이 있다', h.includes('href="/day-pillar"'));
  검('⛔ 화면에 우리말이 없다', !/[가-힣]/.test(h));
  검('문덩어리에 열 줄이 있다', (문덩어리(칸).match(/href="\/stem\//g) ?? []).length === 10);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ build-kcw-stem-rooms 자가시험 통과 (12)');
  process.exit(0);
}

if (!fs.existsSync(원자료)) {
  console.error(`❌ 캔 명단이 없다 — ${path.relative(뿌리, 원자료)}\n   먼저 node scripts/collect-star-daypillar.mjs 를 돌린다. 없는 것을 지어내지 않는다`);
  process.exit(1);
}
const 사람들 = JSON.parse(fs.readFileSync(원자료, 'utf8')).사람;
const 잼 = JSON.parse(fs.readFileSync(잰것, 'utf8'));
const 칸 = 칸나누기(사람들);

fs.mkdirSync(낼방, { recursive: true });
let 합 = 0;
for (const [한자, rom] of 간) {
  const v = 칸.get(한자);
  if (!v.length) { console.error(`⛔ ${한자} 칸이 비었다 — 짓지 않는다`); process.exit(1); }
  fs.writeFileSync(path.join(낼방, `${rom}.html`), 방짓기(한자, v, 잼));
  합 += v.length;
  console.log(`   ${칸주소(rom).padEnd(14)} 이름 ${String(v.length).padStart(4)}  (으뜸 ${v[0].name})`);
}
fs.writeFileSync(path.join(뿌리, 'src/data/wikitip-stem-rooms.json'), JSON.stringify({
  generated: new Date().toISOString(),
  measured: 사람들.length,
  rooms: 간.map(([h, r]) => ({ stem: h, slug: r, url: 칸주소(r), people: 칸.get(h).length, top: 칸.get(h).slice(0, 3).map((p) => p.name) })),
}, null, 1));
console.log(`\n방 ${간.length}장 · 이름 합계 ${합}`);
console.log(`⚠ 들어오는 문을 아직 안 냈다 — /day-pillar 에 넣을 덩어리는 문덩어리() 로 뽑아 쓴다`);
