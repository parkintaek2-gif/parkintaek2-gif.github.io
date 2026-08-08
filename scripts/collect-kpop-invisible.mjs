#!/usr/bin/env node
/**
 * **우리 K팝 표에 못 들어오는 사람이 몇인가** — 처음으로 세어 본다.
 *
 *   node scripts/collect-kpop-invisible.mjs   → src/data/wikitip-kpop-invisible.json
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * `/data` 에 우리가 이렇게 적어 두었다 —
 *   「Acts with no English Wikipedia article produce no row, so they are invisible —
 *     **and we cannot say how many there are.**」
 *
 * 못 센다고 적어 두고 **세어 볼 생각을 안 했다.** 셀 수 있다.
 * 관심도는 영어 위키백과 조회수라 영어 문서가 있어야 줄이 생긴다. 그런데
 * **위키데이터에는 영어 문서가 없는 한국 음악인도 들어 있다.** 그쪽을 세면 크기가 나온다.
 *
 * ⛔ 「없는 사람」을 센 것이 아니다. **위키데이터에 있는데 영어 문서가 없는 사람**을 셌다.
 *    위키데이터에도 없는 사람은 여전히 못 센다. 그 한계는 그대로 적는다.
 *
 * ⚠ 한 번에 다 물으면 504 가 난다(수집기 형제들이 겪은 것). 좁은 질의로 나눠 묻는다.
 */
import fs from 'node:fs';

const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) k-pop coverage gap';
const SPARQL = 'https://query.wikidata.org/sparql';

/** 직업 코드 — 가수 · 래퍼 · 작곡가 · 음악가. `collect-kpop-pageviews.mjs` 와 **같은 것**을 쓴다 */
export const 직업 = ['wd:Q177220', 'wd:Q2252262', 'wd:Q639669', 'wd:Q753110'];

/**
 * 갈래마다 세 수를 센다.
 *   전부 · 영어 문서 있는 것 · 한국어 문서는 있는데 영어가 없는 것
 * 셋째가 요점이다 — **한국에서는 문서가 있는데 우리 표에는 안 들어오는 사람**이다.
 */
export function 질의들(where) {
  const 영어 = '?sl schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .';
  const 한국어 = '?slko schema:about ?item ; schema:isPartOf <https://ko.wikipedia.org/> .';
  return {
    all: `SELECT (COUNT(DISTINCT ?item) AS ?n) WHERE { ${where} }`,
    withEn: `SELECT (COUNT(DISTINCT ?item) AS ?n) WHERE { ${where} ${영어} }`,
    koNotEn: `SELECT (COUNT(DISTINCT ?item) AS ?n) WHERE { ${where} ${한국어}
      FILTER NOT EXISTS { ${영어} } }`,
  };
}

/** 못 센 것을 0으로 적지 않는다. **null 은 「못 물었다」**이고 0 과 다르다. */
export function 빈틈(all, withEn) {
  if (all === null || withEn === null) return null;
  return { missing: all - withEn, missingPc: all ? +((100 * (all - withEn)) / all).toFixed(1) : 0 };
}

async function 센다(q) {
  for (let 시도 = 0; 시도 < 3; 시도++) {
    try {
      const r = await fetch(SPARQL, {
        method: 'POST',
        headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ query: q }),
        signal: AbortSignal.timeout(180000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      return Number(j.results.bindings[0].n.value);
    } catch (e) {
      if (시도 === 2) { console.log(`  ⚠ 못 물었다: ${e.message}`); return null; }
      await new Promise((s) => setTimeout(s, 6000));
    }
  }
  return null;
}

if (process.argv[1] && process.argv[1].endsWith('collect-kpop-invisible.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('세 질의를 낸다', Object.keys(질의들('?item wdt:P31 wd:Q5 .')).length === 3);
  자가('한국어만 있는 것은 영어를 빼고 센다', 질의들('x').koNotEn.includes('FILTER NOT EXISTS'));
  자가('빈틈을 센다', 빈틈(100, 40).missing === 60 && 빈틈(100, 40).missingPc === 60);
  자가('못 물으면 0이 아니라 null', 빈틈(null, 40) === null && 빈틈(100, null) === null);
  자가('직업 코드가 조회수 수집기와 같다', 직업.length === 4 && 직업[0] === 'wd:Q177220');
  console.log(`안 보이는 사람 자 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  /* 갈래를 좁게 나눈다. 한 번에 물으면 504 다 */
  const 갈래 = [
    { key: 'groups', 이름: 'Musical groups', where: '?item wdt:P31/wdt:P279* wd:Q215380 ; wdt:P495 wd:Q884 .' },
    ...직업.map((o, i) => ({
      key: ['singer', 'rapper', 'composer', 'musician'][i],
      이름: ['Singers', 'Rappers', 'Composers', 'Musicians'][i],
      where: `?item wdt:P27 wd:Q884 ; wdt:P106 ${o} .`,
    })),
  ];

  const rows = [];
  for (const g of 갈래) {
    const q = 질의들(g.where);
    const all = await 센다(q.all);
    const withEn = await 센다(q.withEn);
    const koNotEn = await 센다(q.koNotEn);
    const b = 빈틈(all, withEn);
    rows.push({ key: g.key, label: g.이름, all, withEn, koNotEn, ...(b ?? { missing: null, missingPc: null }) });
    console.log(`  ${g.이름.padEnd(16)} 전부 ${String(all).padStart(6)} · 영어 있음 ${String(withEn).padStart(6)} · 한국어만 ${String(koNotEn).padStart(6)}`);
  }

  const 물은것 = rows.filter((r) => r.all !== null && r.withEn !== null);
  const out = {
    generated: new Date().toLocaleString('ko-KR'),
    source: 'Wikidata — Korean musical groups (P31/P279* from Q215380 with P495=Q884) and people with Korean citizenship (P27=Q884) in four music occupations',
    sourceKo: '위키데이터 — 한국 음악 그룹과 한국 국적 음악인',
    method: 'Our attention panel is built from English Wikipedia pageviews, so an act with no English article produces no row. Wikidata records many that English Wikipedia does not, which puts a floor under how many we cannot see.',
    /** ⛔ 이 자가 못 재는 것. 지면과 기사가 반드시 같이 말해야 한다 */
    limit: 'This counts what Wikidata holds. Anyone absent from Wikidata as well is still uncounted, so every figure here is a floor, not a total.',
    occupations: 직업,
    rows,
    /** 갈래가 겹친다(가수이면서 작곡가). 합계를 내지 않고 갈래별로만 낸다 */
    overlapWarning: 'A person can hold several of these occupations, so the occupation rows overlap and must not be summed.',
    queriedGroups: 물은것.length,
    failedGroups: rows.length - 물은것.length,
  };
  fs.writeFileSync('src/data/wikitip-kpop-invisible.json', JSON.stringify(out, null, 2));
  console.log(`\n갈래 ${rows.length} 중 ${물은것.length}개를 물었다 → src/data/wikitip-kpop-invisible.json`);
}
