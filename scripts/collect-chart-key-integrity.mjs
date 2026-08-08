#!/usr/bin/env node
/**
 * 넷플릭스 나라별 주간 표에서 **무엇이 열쇠인가**를 잰다.
 *
 *   node scripts/collect-chart-key-integrity.mjs   → src/data/wikitip-key-integrity.json
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08 09:2x. 「원자료가 같은 줄을 1,179번 겹쳐 담는다」고 적어 놓고 **왜인지는 안 봤다.**
 * 열쇠를 (제목·나라·주)로 잡고 센 것이었는데, 넷플릭스는
 *   · **Films 와 TV 를 따로** 내고(구분)
 *   · **시즌을 따로** 올린다(시즌)
 * 그래서 「겹쳤다」의 대부분은 겹친 것이 아니라 **다른 칸**이었다. 한 겹만 보고 아래를 안 본 것이다.
 *
 * ⛔ 이 자는 「자료가 더럽다」고 말하지 않는다. 자리(나라·주·구분·순위)로 보면 **한 칸에 한 편씩,
 *    겹치는 줄이 하나도 없다.** 더러운 것이 아니라 **제목이 열쇠가 아닌 것**이다.
 *
 * ⭐ 남는 몇 줄이 이 매체의 핵심 문제 그 자체다 — 시즌까지 넣어도 같은 칸에 두 번 든 것들은
 *    **한 나라 한 주의 열 편 안에서 같은 이름을 쓰는 서로 다른 영화**다. 조인 없이 생긴 충돌이다.
 */
import fs from 'node:fs';
import readline from 'node:readline';

const 원자료 = 'archive/raw/netflix-top10/countries.ndjson';
const 패널길 = 'src/data/wikitip-titles.json';
const 낼곳 = 'src/data/wikitip-key-integrity.json';

/** 열쇠를 몇 겹으로 잡느냐에 따라 「겹침」이 달라진다. 그 겹을 이름 붙여 둔다. */
export const 열쇠들 = {
  row: (o) => JSON.stringify(o),
  titleCountryWeek: (o) => `${o.제목}|${o.국가}|${o.주}`,
  withList: (o) => `${o.제목}|${o.국가}|${o.주}|${o.구분}`,
  withSeason: (o) => `${o.제목}|${o.국가}|${o.주}|${o.구분}|${o.시즌}`,
  slot: (o) => `${o.국가}|${o.주}|${o.구분}|${o.순위}`,
};

/** 「한 편이 한 목록에서 몇 칸을 차지했나」의 분포 */
export function 칸분포(칸별줄수) {
  const d = new Map();
  for (const n of 칸별줄수) if (n > 1) d.set(n, (d.get(n) || 0) + 1);
  return [...d].sort((a, b) => a[0] - b[0]).map(([places, times]) => ({ places, times }));
}

if (process.argv[1] && process.argv[1].endsWith('collect-chart-key-integrity.mjs')) {
  /* ── 자가시험 ── */
  let 시험 = 0; let 통과 = 0;
  const 본다 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  const 줄 = { 제목: 'X', 국가: 'Korea', 주: 'w1', 구분: 'TV', 순위: 3, 시즌: 'X: Season 2' };
  본다('시즌이 열쇠에 든다', 열쇠들.withSeason(줄) !== 열쇠들.withList(줄));
  본다('자리 열쇠는 제목을 안 쓴다', !열쇠들.slot(줄).includes('X|'));
  본다('분포는 한 칸짜리를 안 센다', 칸분포([1, 1, 1]).length === 0);
  본다('분포가 칸수별로 모인다', JSON.stringify(칸분포([2, 2, 3])) === JSON.stringify([{ places: 2, times: 2 }, { places: 3, times: 1 }]));
  console.log(`열쇠 자 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 패널 = new Set(JSON.parse(fs.readFileSync(패널길, 'utf8')).rows.map((r) => r.title));
  const 셈 = Object.fromEntries(Object.keys(열쇠들).map((k) => [k, new Map()]));
  const 목록칸 = new Map();     // 제목|나라|주|구분 → 줄들 (시즌으로 설명되나 보려고)
  const 시즌뒤 = new Map();     // 시즌까지 넣어도 겹치는 칸 → 줄들
  let 줄수 = 0;
  let 패널줄 = 0; const 패널칸 = new Map();

  const rl = readline.createInterface({ input: fs.createReadStream(원자료), crlfDelay: Infinity });
  for await (const l of rl) {
    if (!l.trim()) continue;
    let o; try { o = JSON.parse(l); } catch { continue; }
    줄수++;
    for (const [이름, fn] of Object.entries(열쇠들)) {
      const k = fn(o);
      셈[이름].set(k, (셈[이름].get(k) || 0) + 1);
    }
    const a = 열쇠들.withList(o);
    if (!목록칸.has(a)) 목록칸.set(a, []);
    목록칸.get(a).push(o);
    const b = 열쇠들.withSeason(o);
    if (!시즌뒤.has(b)) 시즌뒤.set(b, []);
    시즌뒤.get(b).push(o);
    if (패널.has(o.제목)) {
      패널줄++;
      const t = 열쇠들.titleCountryWeek(o);
      패널칸.set(t, (패널칸.get(t) || 0) + 1);
    }
  }

  const 겹친줄 = (이름) => 줄수 - 셈[이름].size;
  const 여럿 = [...목록칸.values()].filter((r) => r.length > 1);
  const 겹친제목 = new Set(); const 겹친나라 = new Set();
  for (const rows of 여럿) { 겹친제목.add(rows[0].제목); 겹친나라.add(rows[0].국가); }

  /* 여섯 칸 이상 — 사람이 보고 놀라는 자리다. 순위까지 같이 낸다 */
  const 큰것 = 여럿.filter((r) => r.length >= 6).map((rows) => ({
    title: rows[0].제목, country: rows[0].국가, week: rows[0].주, list: rows[0].구분,
    places: rows.length, ranks: rows.map((r) => r.순위).sort((a, b) => a - b),
  })).sort((a, b) => b.places - a.places || a.country.localeCompare(b.country));

  /* 시즌까지 넣어도 남는 것 — 이름이 같은 **다른 작품**이다 */
  const 남은 = [...시즌뒤.values()].filter((r) => r.length > 1);
  const 남은쌍 = 남은.reduce((s, r) => s + r.length - 1, 0);
  const 누적주로갈림 = 남은.filter((r) => new Set(r.map((x) => x.누적주)).size > 1).length;
  const 제목별남은 = new Map();
  for (const r of 남은) 제목별남은.set(r[0].제목, (제목별남은.get(r[0].제목) || 0) + 1);

  const out = {
    generated: new Date().toLocaleString('ko-KR'),
    source: 'Netflix Top 10 (Tudum) per-country weekly lists, every country Netflix publishes',
    sourceKo: '넷플릭스 Tudum 나라별 주간 Top 10',
    question: 'Is a title a key? Each row carries week, country, list (Films or TV), rank, title, season and weeks-on-chart.',
    rows: 줄수,
    /** 자리(나라·주·구분·순위)로 보면 겹치는 줄이 없다 — 자료가 더러운 것이 아니다 */
    distinctSlots: 셈.slot.size,
    duplicateSlots: 겹친줄('slot'),
    duplicateWholeRows: 겹친줄('row'),
    /** 제목을 열쇠로 쓰면 이만큼 더 나온다 */
    extraRowsByTitleCountryWeek: 겹친줄('titleCountryWeek'),
    extraRowsWithList: 겹친줄('withList'),
    extraRowsWithSeason: 겹친줄('withSeason'),
    extraRowsPc: +((100 * 겹친줄('withList')) / 줄수).toFixed(2),
    listsWithARepeatedTitle: 여럿.length,
    titlesAffected: 겹친제목.size,
    countriesAffected: 겹친나라.size,
    /** 시즌이 설명하는 줄수. 나머지가 진짜 이름 충돌이다 */
    explainedBySeason: 겹친줄('withList') - 겹친줄('withSeason'),
    explainedBySeasonPc: +((100 * (겹친줄('withList') - 겹친줄('withSeason'))) / 겹친줄('withList')).toFixed(1),
    placesDistribution: 칸분포(여럿.map((r) => r.length)),
    biggest: 큰것.slice(0, 12),
    biggestCount: 큰것.length,
    nameCollisions: {
      pairs: 남은쌍,
      /** 넷플릭스 자신의 「몇 주째」 칸이 서로 달라 다른 작품임이 드러난 것 */
      separatedByWeeksOnChart: 누적주로갈림,
      unresolvable: 남은.length - 누적주로갈림,
      byTitle: [...제목별남은].sort((a, b) => b[1] - a[1]).map(([title, pairs]) => ({ title, pairs })),
      examples: 남은.slice(0, 40).map((r) => ({
        title: r[0].제목, country: r[0].국가, week: r[0].주,
        ranks: r.map((x) => x.순위), weeksOnChart: r.map((x) => x.누적주),
      })),
    },
    /** 우리 패널이 이 함정에 얼마나 노출돼 있나 */
    ourPanel: {
      titles: 패널.size,
      rowsRead: 패널줄,
      distinctTitleCountryWeeks: 패널칸.size,
      extraRowsIfCountingRows: 패널줄 - 패널칸.size,
      extraRowsPc: +((100 * (패널줄 - 패널칸.size)) / 패널줄).toFixed(1),
      worst: [...패널칸].sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([k, n]) => ({ title: k.split('|')[0], country: k.split('|')[1], week: k.split('|')[2], rows: n })),
    },
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 2));
  console.log(`줄 ${out.rows.toLocaleString()} · 자리 ${out.distinctSlots.toLocaleString()} · 자리 겹침 ${out.duplicateSlots}`);
  console.log(`제목을 열쇠로 쓰면 ${out.extraRowsWithList.toLocaleString()}줄(${out.extraRowsPc}%) 더 나온다`);
  console.log(`  시즌이 ${out.explainedBySeason.toLocaleString()}줄(${out.explainedBySeasonPc}%)을 설명한다`);
  console.log(`  남는 ${out.nameCollisions.pairs}쌍은 **같은 이름의 다른 작품** — ${out.nameCollisions.separatedByWeeksOnChart}쌍은 몇 주째 칸이 갈라 준다`);
  console.log(`한 목록에서 여섯 칸 이상 차지한 것 ${out.biggestCount}건 · 우리 패널은 줄로 세면 ${out.ourPanel.extraRowsPc}% 부풀려진다`);
}
