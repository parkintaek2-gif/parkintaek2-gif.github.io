/**
 * K Culture Wire — 한국 **음악** 쪽 관심도(영문 위키백과 조회수)를 모은다.
 *
 * ── 왜 이 자료인가 ─────────────────────────────────────────────
 * 사장님 지시(2026-08-05): 「k팝 등에 관심이 많은 **해외 대상**이다」.
 * 그런데 우리 지면 열다섯 장 중 음악은 `/exports` **한 장뿐**이고 그것도 수출 금액이다.
 * 사람이 K팝을 검색해 들어올 자리가 없다. 이 수집이 그 자리를 만든다.
 *
 * ── 명단을 사람이 고르지 않는다 ────────────────────────────────
 * 배우 쪽에서 쓴 규칙 그대로다 — 우리가 고르면 우리 취향이 순위가 된다.
 *   Wikidata: 한국 국적(P27=Q884)이고 직업이 가수·래퍼·작곡가·음악가인 사람
 *           + 한국(P495=Q884)이 만든 음악 그룹(P31=Q215380)
 *   영문 위키 문서가 있는 것만 — 조회수를 잴 수 없으면 셀 수도 없다
 *
 * ⚠ 조회수는 **인기가 아니라 관심**이다. 좋은 일로도 나쁜 일로도 오른다.
 *   지면에 「인기 순위」라고 쓰지 않는다. **「관심도」**라고 쓴다.
 * ⚠ 404 는 「문서가 없다」이지 「0회」가 아니다. 0 으로 세면 순위가 통째로 틀린다.
 *
 * 결과 → archive/raw/star-pageviews/kpop-YYYYMMDD.json (원자료)
 * 키·로그인 필요 없음. 2015년부터 소급된다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { 날짜, 한명 } from './collect-star-pageviews.mjs';

const OUT = path.resolve('archive/raw/star-pageviews');
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) k-pop attention';
const SPARQL = 'https://query.wikidata.org/sparql';
const 간격ms = 120;
const 창 = 30;

/** 직업 코드 — 가수 · 래퍼 · 작곡가 · 음악가. 배우는 일부러 뺀다(그쪽은 /actors 다). */
const 직업 = ['wd:Q177220', 'wd:Q2252262', 'wd:Q639669', 'wd:Q753110'];

/**
 * ⚠ 한 번에 다 물으면 **504** 가 난다. 실제로 그랬다.
 *   그룹 하나, 직업 하나씩 — 좁은 질의 다섯 번으로 나눠 묻고 합친다.
 *   느린 대신 답이 온다. 답이 안 오는 빠른 질의는 아무 값이 없다.
 */
async function 한질의(where, kind) {
  const q = `SELECT DISTINCT ?enwiki WHERE {
    ${where}
    ?sitelink schema:about ?item ;
              schema:isPartOf <https://en.wikipedia.org/> ;
              schema:name ?enwiki .
  }`;
  for (let 시도 = 0; 시도 < 3; 시도++) {
    try {
      const r = await fetch(SPARQL, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          Accept: 'application/sparql-results+json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ query: q }),
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      return j.results.bindings.map((b) => ({ name: b.enwiki.value, kind }));
    } catch (e) {
      if (시도 === 2) { console.log(`  ⚠ 이 갈래는 못 물었다 (${kind}): ${e.message}`); return null; }
      await new Promise((s) => setTimeout(s, 5000));
    }
  }
  return null;
}

async function 명단() {
  const 조각 = [
    ['?item wdt:P31 wd:Q215380 ; wdt:P495 wd:Q884 .', 'group'],
    ...직업.map((o) => [`?item wdt:P31 wd:Q5 ; wdt:P27 wd:Q884 ; wdt:P106 ${o} .`, 'person']),
  ];
  /* 같은 이름이 두 갈래로 오면 사람 쪽을 남긴다 — 그룹 판정이 더 헐겁다. */
  const m = new Map();
  let 못물음 = 0;
  for (const [where, kind] of 조각) {
    const rows = await 한질의(where, kind);
    if (rows === null) { 못물음++; continue; }
    for (const r of rows) if (!m.has(r.name) || r.kind === 'person') m.set(r.name, r.kind);
    process.stdout.write(`${rows.length} `);
  }
  process.stdout.write('\n');
  /* 못 물은 갈래가 있으면 **명단이 덜 찬 것**이다. 조용히 넘기지 않는다. */
  if (못물음) console.log(`  ⚠ ${조각.length}개 갈래 중 ${못물음}개를 못 물었다 — 명단이 덜 찼다`);
  return { roster: [...m].map(([name, kind]) => ({ name, kind })), 못물음, 갈래수: 조각.length };
}

const 오늘 = new Date();
const 끝 = new Date(오늘); 끝.setDate(끝.getDate() - 1);
const 시작 = new Date(끝); 시작.setDate(시작.getDate() - (창 - 1));

console.log('명단을 위키데이터에 묻는다…');
const { roster, 못물음, 갈래수 } = await 명단();
console.log(`명단 ${roster.length}명·팀 (그룹 ${roster.filter((x) => x.kind === 'group').length})`);

const 결과 = [];
let 잡힘 = 0, 없음 = 0;
for (const [i, p] of roster.entries()) {
  try {
    const v = await 한명(p.name, 날짜(시작), 날짜(끝));
    if (v === null) { 없음++; }
    else {
      const 합 = v.reduce((s, x) => s + x.views, 0);
      const 최고 = v.reduce((a, x) => (x.views > a.views ? x : a), v[0]);
      const 최근7 = v.slice(-7).reduce((s, x) => s + x.views, 0);
      const 첫7 = v.slice(0, 7).reduce((s, x) => s + x.views, 0);
      결과.push({
        이름: p.name,
        갈래: p.kind,
        합,
        일수: v.length,
        하루평균: Math.round(합 / v.length),
        최고일: 최고.timestamp.slice(0, 8),
        최고조회: 최고.views,
        최근7일: 최근7,
        /* 첫 7일이 0 이면 배수를 못 낸다 — null 로 둔다. 0 으로 나누지 않는다. */
        상승배수: 첫7 > 0 ? +(최근7 / 첫7).toFixed(2) : null,
      });
      잡힘++;
    }
  } catch (e) {
    /* 한 사람이 실패해도 멈추지 않는다. 다만 세어서 밝힌다. */
    없음++;
  }
  if (i % 100 === 0) process.stdout.write('.');
  await new Promise((s) => setTimeout(s, 간격ms));
}
process.stdout.write('\n');

fs.mkdirSync(OUT, { recursive: true });
const 파일 = path.join(OUT, `kpop-${날짜(끝)}.json`);
fs.writeFileSync(파일, JSON.stringify({
  갱신: new Date().toLocaleString('ko-KR'),
  출처: 'Wikimedia Pageviews API (en.wikipedia, all-access, user)',
  명단출처: 'Wikidata — P27=Q884 with occupation singer/rapper/composer/musician, plus P31=Q215380 musical groups with P495=Q884. English Wikipedia article required.',
  기간: `${날짜(시작)}~${날짜(끝)}`,
  일수: 창,
  대상: roster.length,
  명단못물은갈래: 못물음,
  명단갈래수: 갈래수,
  잡힘,
  못찾음: 없음,
  사람: 결과,
}, null, 2));

console.log(`저장 ${파일}`);
console.log(`대상 ${roster.length} · 잡힘 ${잡힘} · 못 찾음 ${없음}`);
console.log('관심 상위 8:', [...결과].sort((a, b) => b.합 - a.합).slice(0, 8)
  .map((r) => `${r.이름}(${r.합.toLocaleString()})`).join(' · '));
