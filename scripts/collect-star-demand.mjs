#!/usr/bin/env node
/**
 * collect-star-demand.mjs — **누가 실제로 많이 찾아지나**를 이름마다 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님 2026-08-22:
 *   「**스타 이름, 아이돌 그룹이름이 제일 많이 검색하지 않나?** 그중에서 **누가 검색이 많은 지를
 *    찾아서** 하면 사람들이 더 찾겠지… 온 사람들한테는 잊지 못할 콘텐트와 커뮤니티를 주면
 *    계속 재방문하겠지?」
 * 그리고 그 앞에 못박으셨다 — 「**키워드 검색량을 재서 해.**」
 *
 * 나는 그 전까지 «일간(日干)» 같은 자료의 말로 지면을 냈고, 재 보니 그 말은
 * 자동완성에 **0줄**이었다. 이 자는 그 잘못을 되풀이하지 않기 위해 있다 —
 * **이름을 먼저 재고, 많이 찾아지는 이름부터 지면을 만든다.**
 *
 * ── 무엇으로 재나 ─────────────────────────────────────────────
 * 위키백과 문서를 **몇 사람이 열었나**(Wikimedia Pageviews · 사람 트래픽만 · 지난 30일).
 * ⛔ 이것은 「검색량」이 아니다. **그 이름에 대한 관심의 크기**다. 그렇게만 부른다.
 * ⛔ 문서 제목을 **짐작하지 않는다.** 위키데이터 Q번호에서 실제 enwiki 제목을 받아 온다 —
 *    「IU」로 물으면 엉뚱한 문서가 잡히고, 그 수로 순위를 매기면 순위가 통째로 거짓이 된다.
 * ⛔ 못 물은 것은 `null` 이다. 0 으로 적지 않는다.
 *
 * 쓰는 법  node scripts/collect-star-demand.mjs --자가시험
 *          node scripts/collect-star-demand.mjs [--최소링크 14]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 낼곳 = path.join(뿌리, 'src/data/wikitip-star-demand.json');

const 머리말 = { 'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)', Accept: 'application/sparql-results+json' };
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/** Q번호 → enwiki 문서 제목. 짐작하지 않고 위키데이터에 묻는다 */
export const 제목질의 = (q들) => `
SELECT ?p ?title WHERE {
  VALUES ?p { ${q들.map((q) => `wd:${q}`).join(' ')} }
  ?a schema:about ?p ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?title .
}`;

/** 날짜 구간 — 어제까지 30일. ⚠ 오늘은 아직 안 채워져 있어 넣지 않는다 */
export function 구간(오늘 = new Date()) {
  const 끝 = new Date(오늘.getTime() - 2 * 86400000);
  const 시작 = new Date(오늘.getTime() - 32 * 86400000);
  const 꼴 = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
  return { 시작: 꼴(시작), 끝: 꼴(끝) };
}

/** 읽힘 합. ⛔ 못 물으면 null — 0 과 다르다 */
export async function 읽힘(제목, 부르기 = fetch, 오늘) {
  const { 시작, 끝 } = 구간(오늘);
  const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(제목.replace(/ /g, '_'))}/daily/${시작}/${끝}`;
  try {
    const r = await 부르기(u, { headers: 머리말 });
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j.items)) return null;
    return j.items.reduce((a, x) => a + (x.views ?? 0), 0);
  } catch { return null; }
}

/** 잰 것 → 순위표. 못 잰 사람은 **뒤로 밀지 않고 따로 센다** */
export function 순위표(사람들) {
  const 잰것 = 사람들.filter((p) => typeof p.reads === 'number');
  const 못잰것 = 사람들.filter((p) => typeof p.reads !== 'number');
  잰것.sort((a, b) => b.reads - a.reads || a.name.localeCompare(b.name));
  return { 잰것, 못잰수: 못잰것.length, 못잰이름: 못잰것.slice(0, 5).map((p) => p.name) };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 가짜 = (본문, ok = true) => async () => ({ ok, json: async () => JSON.parse(본문) });

  검('질의가 Q번호를 그대로 쓴다', 제목질의(['Q1', 'Q2']).includes('wd:Q1') && 제목질의(['Q1']).includes('en.wikipedia.org'));
  검('⛔ 제목을 이름에서 짐작하지 않는다', !제목질의(['Q1']).includes('rdfs:label'));

  const c = 구간(new Date('2026-08-22T00:00:00Z'));
  검('어제까지 30일을 본다', c.끝 === '20260820' && c.시작 === '20260721');

  검('읽힘을 더한다', (await 읽힘('X', 가짜(JSON.stringify({ items: [{ views: 7 }, { views: 3 }] })))) === 10);
  검('못 물으면 null 이다', (await 읽힘('X', 가짜('', false))) === null);
  검('꼴이 다르면 null 이다', (await 읽힘('X', 가짜(JSON.stringify({ items: null })))) === null);

  const t = 순위표([{ name: 'A', reads: 5 }, { name: 'B', reads: 50 }, { name: 'C', reads: null }]);
  검('많이 읽힌 순', t.잰것[0].name === 'B');
  검('⛔ 못 잰 사람을 0 으로 안 세운다', t.못잰수 === 1 && t.잰것.length === 2);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ collect-star-demand 자가시험 통과 (8)');
  process.exit(0);
}

if (!fs.existsSync(원자료)) {
  console.error(`❌ 명단이 없다 — ${path.relative(뿌리, 원자료)}. 먼저 collect-star-daypillar.mjs 를 돌린다`);
  process.exit(1);
}
const 최소 = Number((process.argv.find((a) => a.startsWith('--최소링크='))?.split('=')[1]) ?? 14);
const 사람들 = JSON.parse(fs.readFileSync(원자료, 'utf8')).사람.filter((p) => p.sitelinks >= 최소);
console.log(`명단 ${사람들.length}명 (위키 판 ${최소}개 이상)`);

/* ① 제목 받기 — 쉰 개씩 묶어 묻는다 */
const 제목 = new Map();
for (let i = 0; i < 사람들.length; i += 50) {
  const 묶음 = 사람들.slice(i, i + 50);
  const u = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(제목질의(묶음.map((p) => p.q)));
  let 줄;
  for (let t = 0; t < 3 && !줄; t++) {
    try { const r = await fetch(u, { headers: 머리말 }); if (r.ok) 줄 = (await r.json()).results.bindings; } catch { /* 되묻는다 */ }
    if (!줄) await 쉼(1500 * (t + 1));
  }
  if (!줄) { console.error(`⚠ ${i}~${i + 50} 제목을 못 물었다 — 그 사람들은 「못 잼」으로 남는다`); continue; }
  for (const b of 줄) 제목.set(b.p.value.split('/').pop(), b.title.value);
  console.log(`  제목 ${제목.size}/${사람들.length}`);
  await 쉼(800);
}

/* ② 읽힘 재기 */
const 잰것 = [];
let 센수 = 0;
for (const p of 사람들) {
  const t = 제목.get(p.q);
  const v = t ? await 읽힘(t) : null;
  잰것.push({ q: p.q, name: p.name, enTitle: t ?? null, born: p.born, sitelinks: p.sitelinks, reads: v });
  if (++센수 % 100 === 0) console.log(`  읽힘 ${센수}/${사람들.length}`);
  await 쉼(120);
}

const { 잰것: 순, 못잰수, 못잰이름 } = 순위표(잰것);
fs.writeFileSync(낼곳, JSON.stringify({
  generated: new Date().toISOString(),
  whatThisIs: 'How many people opened each person\'s English Wikipedia article in the last 30 days (human traffic only). Titles are resolved from Wikidata, never guessed.',
  whatThisIsNot: 'Search volume. We hold no paid keyword data. This is the size of interest in a name, not the number of searches for it.',
  window: 구간(),
  minSitelinks: 최소,
  measured: 순.length,
  unmeasured: 못잰수,
  unmeasuredExamples: 못잰이름,
  people: 순.slice(0, 300),
}, null, 1));

console.log(`\n■ 가장 많이 열린 이름 20 (지난 30일 · 사람 트래픽)`);
for (const p of 순.slice(0, 20)) console.log(`  ${String(p.reads).padStart(8)}  ${p.name}${p.enTitle && p.enTitle !== p.name ? ` (${p.enTitle})` : ''}`);
console.log(`\n잰 사람 ${순.length}명 · 못 잰 사람 ${못잰수}명 ⛔ 0 으로 안 셌다`);
console.log(`냈다 — ${path.relative(뿌리, 낼곳)}`);
