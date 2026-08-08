#!/usr/bin/env node
/**
 * **넷플릭스 차트는 한국 작품의 몇 퍼센트인가** — 분모를 처음 센다.
 *
 *   node scripts/collect-korean-output-denominator.mjs → src/data/wikitip-output-denominator.json
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08 12:1x. 오전에 K팝 쪽에서 「우리 표가 못 보는 사람」을 처음 셌다.
 * 화면 쪽에는 **그 분모가 아직 없다.** 우리는 늘 「차트에 오른 397편」을 말하는데,
 * 한국이 그동안 **몇 편을 만들었는지**는 한 번도 안 적었다. 분모 없는 비율은 비율이 아니다.
 *
 * ⛔ 「위키데이터에 있는 것 = 만들어진 것」이 아니다. 위키데이터는 옮겨 적힌 것만 담는다.
 *    그래서 이 수는 **생산량이 아니라 「기록된 것」**이고, 우리 비율은 **위쪽 경계**다.
 *    (실제 생산량이 더 크면 우리가 덮는 비율은 더 낮아진다. 낮아지지 높아지지 않는다.)
 *
 * ⚠ 연도는 **P577(공개일) 또는 P580(시작일)** 이다. 영화는 앞엣것, 시리즈는 뒤엣것을 쓴다.
 *   P577 만 보면 시리즈가 4,752편 중 210편만 잡힌다 — 분모가 우리 패널보다 작아진다.
 */
import fs from 'node:fs';

const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) korean output denominator';
const SPARQL = 'https://query.wikidata.org/sparql';

/** 영화 · TV 시리즈. 우리 패널이 쓰는 갈래와 같게 잡는다 */
export const 갈래 = [
  { key: 'film', label: 'Films', cls: 'wd:Q11424' },
  { key: 'series', label: 'Television series', cls: 'wd:Q5398426' },
];

/** 차트 시대. 넷플릭스 나라별 주간 표가 2021-07-04 부터다 — 그 전 작품은 오를 기회가 없었다 */
export const 차트시작연도 = 2021;

export function 질의(cls, { since = null, needYear = false } = {}) {
  /* ⛔ 처음엔 P577(공개일) 하나만 봤다. 그러면 **시리즈가 4,752편 중 210편만** 잡힌다 —
     시리즈는 P580(시작일)을 쓴다. 우리 패널 237편이 분모 84를 넘어서 알았다.
     덮는 비율이 100%를 넘으면 패널이 아니라 **분모가 틀린 것**이다. 둘 다 받는다. */
  const 해 = needYear || since
    ? '{ ?item wdt:P577 ?date } UNION { ?item wdt:P580 ?date } BIND(YEAR(?date) AS ?y)'
    : '';
  const 거름 = since ? `FILTER(?y >= ${since})` : '';
  return `SELECT (COUNT(DISTINCT ?item) AS ?n) WHERE {
    ?item wdt:P31/wdt:P279* ${cls} ; wdt:P495 wd:Q884 .
    ${해} ${거름}
  }`;
}

/** 우리가 덮는 비율. **분모가 없거나 0이면 비율을 만들지 않는다** */
export function 덮는비율(덮은것, 전체) {
  if (!전체 || 덮은것 === null || 전체 === null) return null;
  const v = +((100 * 덮은것) / 전체).toFixed(1);
  /* ⛔ 우리가 덮은 것이 분모보다 많을 수는 없다. 그러면 **분모가 틀린 것**이다.
     비율을 내지 않고 null 로 둔다 — 말이 안 되는 수를 지면에 내는 것이 제일 나쁘다. */
  return v > 100 ? null : v;
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

if (process.argv[1] && process.argv[1].endsWith('collect-korean-output-denominator.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('연도 없이 물으면 날짜를 안 쓴다', !질의('wd:Q11424').includes('P577'));
  자가('연도를 물으면 P580 도 받는다', 질의('wd:Q11424', { needYear: true }).includes('P580'));
  자가('덮은 것이 분모를 넘으면 비율이 없다', 덮는비율(237, 84) === null);
  자가('연도를 넣으면 P577 을 쓴다', 질의('wd:Q11424', { needYear: true }).includes('P577'));
  자가('시작연도를 거른다', 질의('wd:Q11424', { since: 2021 }).includes('?y >= 2021'));
  자가('비율을 한 자리로', 덮는비율(160, 2000) === 8);
  자가('분모가 0이면 비율이 없다', 덮는비율(10, 0) === null);
  자가('못 센 것은 비율이 없다', 덮는비율(null, 100) === null);
  console.log(`분모 자 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  /* 우리가 덮은 것 — 이미 세어 둔 패널에서 읽는다. 다시 세면 두 자가 어긋난다 */
  const t = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));
  const 우리 = { film: 0, series: 0 };
  for (const r of t.rows) (/^TV|series/i.test(r.type) ? 우리.series++ : 우리.film++);

  const rows = [];
  for (const g of 갈래) {
    const all = await 센다(질의(g.cls));
    const withYear = await 센다(질의(g.cls, { needYear: true }));
    const sinceChart = await 센다(질의(g.cls, { since: 차트시작연도 }));
    rows.push({
      key: g.key,
      label: g.label,
      /** 위키데이터가 담은 한국 작품 — 생산량이 아니라 **기록된 것** */
      recorded: all,
      /** 공개일이 적힌 것. 아래 sinceChart 의 분모다 */
      withReleaseYear: withYear,
      recordedWithoutYear: all === null || withYear === null ? null : all - withYear,
      sinceChartEra: sinceChart,
      ourPanel: 우리[g.key],
      coveragePc: 덮는비율(우리[g.key], all),
      coverageSinceChartEraPc: 덮는비율(우리[g.key], sinceChart),
    });
    console.log(`  ${g.label.padEnd(18)} 기록 ${String(all).padStart(6)} · 연도 있음 ${String(withYear).padStart(6)} · ${차트시작연도}년 이후 ${String(sinceChart).padStart(5)} · 우리 ${우리[g.key]}`);
  }

  const out = {
    generated: new Date().toLocaleString('ko-KR'),
    source: 'Wikidata — works with country of origin P495 = Q884, by type (film Q11424, television series Q5398426), counted whole and from the chart era',
    sourceKo: '위키데이터 — 한국 작품 수를 갈래별로',
    panelSource: 'src/data/wikitip-titles.json — our Southeast Asia chart panel',
    chartEraFrom: 차트시작연도,
    method: 'Our panel only contains titles that reached a Netflix Top 10, so it has never had a denominator. This counts what Wikidata records as Korean film and television, whole and from 2021 on, to put one under it.',
    /** ⛔ 지면과 기사가 반드시 같이 말해야 하는 한계 */
    limit: 'Wikidata records what someone wrote down, not what was made. These counts are therefore a floor on output and our coverage share is a ceiling — if more was made than is recorded, our share is lower than shown, never higher.',
    yearWarning: 'Year comes from P577 (publication date) or P580 (start time) — films carry the first, series the second. Items with neither are excluded from the chart-era rows, so those rows are not comparable to the whole-catalogue rows.',
    rows,
    panelTitles: t.rows.length,
  };
  fs.writeFileSync('src/data/wikitip-output-denominator.json', JSON.stringify(out, null, 2));
  console.log(`\n→ src/data/wikitip-output-denominator.json`);
}
