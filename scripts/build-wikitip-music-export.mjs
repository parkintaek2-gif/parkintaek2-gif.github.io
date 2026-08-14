/**
 * K Culture Wire — 한국 음악산업 수출액, 지역별 20년. (/exports)
 *
 * 결과 → src/data/wikitip-music-export.json
 * 입력 → archive/raw/kosis/music-export-2005-2024.json (KOSIS DT_113_STBL_1020468)
 *
 * ── 왜 이제 와서 스크립트를 만드나 ─────────────────────────────
 * 이 자료 파일은 **손으로 만들어져 있었다.** 값은 원자료와 맞는 것을 2026-08-07 되짚기에서
 * 확인했다(총계 20년 + 지역별 117칸, 어긋남 0). 그런데 **다시 만들 방법이 없는 자료는
 * 판정이나 분류가 바뀌어도 안 따라온다.** 실제로 그렇게 해서 /staying-power 와 첫 화면이
 * 틀린 채로 라이브에 남았다. 값이 맞을 때 되돌려 둔다.
 *
 * ── ⚠ /tv-exports 에서 겪은 결함이 여기엔 없다 ─────────────────
 * 방송수출 표는 통계분류가 두 층인데 아래층 이름만 내려와서 「지상파 방송」이라는 줄이
 * 한 해에 다섯 개였다. 이 표는 **한 층**이다 — 같은 이름이 코드 여럿으로 갈리는 칸이 0개임을
 * 확인했고, 아래에서 매번 다시 확인한다. 확인 없이 「이 표는 괜찮다」고 두지 않는다.
 *
 * ⛔ 「분류못함」을 다른 지역에 나눠 넣지 않는다. 조사가 못 가른 것을 우리가 가르면 그건 추정이다.
 */
import fs from 'node:fs';
import { 지금 } from './_kst.mjs';

const RAW = 'archive/raw/kosis/music-export-2005-2024.json';
const rows0 = JSON.parse(fs.readFileSync(RAW, 'utf8')).filter((r) => r.ITM_NM === '수출액');

/** 코드 → 지면 이름. 코드로 집는다. 이름으로 집으면 이름이 겹칠 때 조용히 틀린다. */
const REGIONS = [
  ['003', 'Japan'],
  ['002', 'Greater China'],
  ['004', 'Southeast Asia'],
  ['005', 'North America'],
  ['006', 'Europe'],
  ['007', 'Other'],
  ['008', 'Unclassified'],
];
const TOTAL = '001';

const suffix = (r) => String(r.C1).split('.')[1] || '';

/* ── 검산 ① ── 한 층인지 매번 본다. 같은 (해, 이름)에 코드가 둘 이상이면 두 층 표다. */
const 이름별 = new Map();
for (const r of rows0) {
  const k = `${r.PRD_DE}|${r.C1_NM}`;
  이름별.set(k, (이름별.get(k) || new Set()).add(suffix(r)));
}
const 겹침 = [...이름별].filter(([, v]) => v.size > 1);
if (겹침.length) {
  throw new Error(`같은 이름이 코드 ${겹침.length}곳에서 갈린다 — 두 층 표다. 분류를 먼저 확인한다`);
}

const val = (year, code) => {
  const hit = rows0.find((r) => r.PRD_DE === String(year) && suffix(r) === code);
  return hit ? +hit.DT : null;
};

const years = [...new Set(rows0.map((r) => +r.PRD_DE))].sort((a, b) => a - b);
const rows = [];
for (const year of years) {
  const total = val(year, TOTAL);
  if (total === null) continue;
  const parts = {};
  for (const [code, label] of REGIONS) parts[label] = val(year, code);
  /* 조사가 안 실은 칸은 null 로 둔다. 0 으로 두면 「그 해에 안 팔았다」가 되어 뜻이 달라진다. */
  const named = Object.values(parts).reduce((s, v) => s + (v ?? 0), 0);
  /* checksum 은 **정확히** 맞는지다. 느슨하게 두면 안 된다 —
     기사 korea-music-outsells-television 의 정정이 「2017·2021·2022 는 천달러 어긋난다」를
     밝히고 있다. 검사를 넓히면 그 문장이 지면과 어긋나게 된다. */
  rows.push({ year, total, parts, checksum: named === total, gap: named - total });
}

/* ── 검산 ② ── 지역을 다 더하면 총계가 나와야 한다. 반올림으로 ±2천달러까지는 벌어진다.
   그보다 크게 벌어지면 코드를 잘못 짚은 것이다 — 세우지 않는다. */
const 최대차 = Math.max(...rows.map((r) => Math.abs(r.gap)));
if (최대차 > 2) throw new Error(`지역 합이 총계와 ${최대차}천달러 벌어졌다 — 코드를 다시 본다`);
const 어긋난해 = rows.filter((r) => !r.checksum).map((r) => r.year);

const out = {
  generated: 지금(),
  source: 'Korea Creative Content Agency, 콘텐츠산업조사 (Content Industry Survey), via KOSIS table DT_113_STBL_1020468 — music industry exports by region',
  sourceKo: '국가데이터처 KOSIS, 한국콘텐츠진흥원 「콘텐츠산업조사」',
  unit: 'thousand USD',
  unitKo: '천 달러',
  regions: REGIONS.map(([, l]) => l),
  yearFrom: rows[0].year,
  yearTo: rows[rows.length - 1].year,
  rows,
};
fs.writeFileSync('src/data/wikitip-music-export.json', JSON.stringify(out, null, 2));

console.log(`${rows.length}년 (${out.yearFrom}~${out.yearTo}) · 한 층 표 확인 ✅ · 지역합이 총계와 어긋난 해 ${어긋난해.length}개 ${어긋난해.join(',')}`);
for (const y of [2005, 2012, 2024]) {
  const r = rows.find((x) => x.year === y);
  if (r) console.log(` ${y} 총 ${r.total.toLocaleString()} · 일본 ${r.parts.Japan ?? '—'} · 분류못함 ${r.parts.Unclassified ?? '—'}`);
}
