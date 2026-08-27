#!/usr/bin/env node
/**
 * build-country-trade-profiles.mjs — 나라별 «한국과의 무역» 프로필(programmatic SEO + 캐시카우 미끼).
 *
 * ── 왜 (2026-08-27, 사장님 지시: 관세청 데이터로 캐시카우·방문 지렛대) ────────────
 * 「korea trade with vietnam」 「korea exports to germany」 같은 나라 이름 검색은 꾸준한데
 * 지면이 하나도 없었다. 주요 교역국마다 한 장씩 만들어 그 롱테일을 대량으로 받는다(콜드스타트 탈출).
 * 각 장은 유료 데이터(/data/korea-trade-dataset)로 가는 문이 된다.
 *
 * ── ⚠ 스케일브레이크 규칙 ([[6번-무역데이터-스케일브레이크]]) ──────────────────
 * 월별 절대 달러값은 2026-03부터 못 믿는다. 그래서 **절대 무역액을 절대 쓰지 않는다.**
 * 오직 within-year 비율·순위·방향만: 수출점유율·수입점유율·수출순위·수입순위·흑자/적자.
 * 이 값들은 스케일 오차가 상쇄돼 안전하다.
 *
 * 출력: src/data/country-trade-profiles.json
 * 자가시험: node scripts/build-country-trade-profiles.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'src', 'data', 'trade-country-monthly.json');
const OUT = path.join(ROOT, 'src', 'data', 'country-trade-profiles.json');
const IS_MAIN = import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === process.argv[1];

// 지저분한 원본 이름 → 깔끔한 표시 이름. 없으면 기본 정리 규칙을 쓴다.
const NAME_MAP = {
  "China peoples' republic of": 'China',
  'U.S.A': 'the United States',
  'Hong kong(BR)': 'Hong Kong',
  'U.arab emirates': 'the United Arab Emirates',
  'Netherland': 'the Netherlands',
  'Viet Nam': 'Vietnam',
  'Quatar': 'Qatar',
  'Russian Federation': 'Russia',
  'Korea, Dem.people\'s rep.of': 'North Korea',
  'United Kingdom': 'the United Kingdom',
  'Czech Republic': 'the Czech Republic',
  'Saudi-arabia': 'Saudi Arabia',
};
const SLUG_MAP = {
  "China peoples' republic of": 'china',
  'U.S.A': 'united-states',
  'Hong kong(BR)': 'hong-kong',
  'U.arab emirates': 'united-arab-emirates',
  'Netherland': 'netherlands',
  'Viet Nam': 'vietnam',
  'Quatar': 'qatar',
  'Russian Federation': 'russia',
  'Saudi-arabia': 'saudi-arabia',
};
function cleanName(en) {
  return NAME_MAP[en] || en.replace(/\s*\(BR\)/, '').replace(/peoples.*/i, '').replace(/,.*$/, '').trim();
}
function toSlug(en) {
  if (SLUG_MAP[en]) return SLUG_MAP[en];
  return cleanName(en).replace(/^the\s+/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
// 표시 이름을 문장 첫머리 등에서 쓸 때 «the» 없는 형태도 필요하다.
function bareName(disp) { return disp.replace(/^the\s+/i, ''); }
const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

export function computeProfiles(data, topN = 60) {
  const C = data.countries || [];
  const N = data.national || [];
  const sum = (a, k) => a.reduce((s, m) => s + m[k], 0);
  const totExp = sum(N, 'exports'), totImp = sum(N, 'imports');
  let rows = C.map((c) => {
    const exp = sum(c.months, 'exports'), imp = sum(c.months, 'imports');
    return { en: c.name_en, ko: c.name_ko, exp, imp, two: exp + imp };
  }).filter((r) => r.two > 0);
  // 순위 부여 (수출/수입/양방향)
  const rank = (key) => {
    const s = [...rows].sort((a, b) => b[key] - a[key]);
    s.forEach((r, i) => { r[key + 'Rank'] = i + 1; });
  };
  rank('exp'); rank('imp'); rank('two');
  rows.sort((a, b) => a.twoRank - b.twoRank);
  const total = rows.length;
  const top = rows.slice(0, topN);
  const profiles = top.map((r, i) => {
    const disp = cleanName(r.en);
    return {
      slug: toSlug(r.en),
      name: disp,
      bare: bareName(disp),
      nameKo: r.ko,
      twoWayRank: r.twoRank,
      exportShare: +(r.exp / totExp * 100).toFixed(1),
      importShare: +(r.imp / totImp * 100).toFixed(1),
      exportRank: r.expRank,
      importRank: r.impRank,
      exportRankOrd: ordinal(r.expRank),
      importRankOrd: ordinal(r.impRank),
      direction: r.exp >= r.imp ? 'surplus' : 'deficit',
      // 이웃 순위 나라들 — 내부 링크(체류·크롤)
      related: [],
    };
  });
  // 관련국: 양방향 순위 ±3 이웃 중 앞뒤로 최대 4개
  profiles.forEach((p, i) => {
    const near = [profiles[i - 2], profiles[i - 1], profiles[i + 1], profiles[i + 2]].filter(Boolean);
    p.related = near.map((n) => ({ slug: n.slug, name: n.name }));
  });
  return { asOf: data.as_of || null, window: data.window || null, totalCountries: total, topN, coverage: +(top.reduce((s, r) => s + r.two, 0) / (totExp + totImp) * 100).toFixed(1), profiles };
}

function selfTest() {
  const fake = {
    as_of: '2026-08-20', window: { months: 12 },
    national: [{ month: '2026-01', exports: 100, imports: 80 }],
    countries: [
      { name_en: 'U.S.A', name_ko: '미국', months: [{ month: '2026-01', exports: 40, imports: 10 }] },
      { name_en: 'Japan', name_ko: '일본', months: [{ month: '2026-01', exports: 10, imports: 30 }] },
      { name_en: 'Viet Nam', name_ko: '베트남', months: [{ month: '2026-01', exports: 20, imports: 5 }] },
    ],
  };
  const r = computeProfiles(fake, 3);
  const us = r.profiles.find((p) => p.slug === 'united-states');
  const jp = r.profiles.find((p) => p.slug === 'japan');
  const checks = [
    ['us name', us.name === 'the United States'],
    ['us surplus', us.direction === 'surplus'],
    ['jp deficit', jp.direction === 'deficit'],
    ['us export rank 1', us.exportRank === 1],
    ['no absolute dollar field', !('exp' in us) && !('two' in us)],
    ['vietnam slug', r.profiles.some((p) => p.slug === 'vietnam')],
    ['ordinal', us.exportRankOrd === '1st'],
  ];
  let pass = 0;
  for (const [n, ok] of checks) { console.log(`${ok ? '✅' : '❌'} ${n}`); if (ok) pass++; }
  if (pass === checks.length) { console.log(`\n✅ 자가시험 ${pass}/${checks.length} 통과`); process.exit(0); }
  console.error(`\n❌ ${pass}/${checks.length}`); process.exit(1);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  if (!fs.existsSync(IN)) { console.log('못 만든다 — trade-country-monthly.json 없음'); process.exit(0); }
  const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const out = computeProfiles(data, 60);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`✅ 나라 프로필 ${out.profiles.length}개 (무역 상위 ${out.topN}, 커버리지 ${out.coverage}%) · ${OUT}`);
  console.log(`   표본: ${out.profiles.slice(0, 5).map((p) => p.slug + '(' + p.direction[0] + ')').join(', ')}`);
}

if (IS_MAIN) main();
