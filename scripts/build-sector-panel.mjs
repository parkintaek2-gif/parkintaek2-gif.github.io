#!/usr/bin/env node
/**
 * SeoulMarkets — **업종체계 × 우리 고유 노동데이터** 패널.
 *
 *   node scripts/build-sector-panel.mjs                    전 업종 요약을 낸다
 *   node scripts/build-sector-panel.mjs "Information Technology"   한 업종 종목 시트 + 본보기 CSV
 *
 * ── 왜 (사장님 지시 2026-08-08) ───────────────────────────────
 * 남이 장악한 곳(업종 분류 자체)엔 안 들어간다 — KRX·S&P·MSCI·FnGuide 가 이미 판다.
 * 우리가 파는 것은 그 **표준 업종 위에 우리만 가진 것**을 얹은 것이다:
 *   근속·이직·성별임금격차·1인당 인건비 — 대형 벤더가 재무는 줘도 **이건 안 준다.**
 * 「한국 금융·경제 노동데이터」의 유일 벤더가 되기 위한 첫 실물이다.
 * ⛔ 써먹지 못하는 데이터는 비용이다 — 그래서 본보기는 **누가 왜 사는가**가 보이게 만든다.
 *
 * ⛔ GICS(S&P·MSCI 독점) 데이터·상표는 쓰지 않는다. 11 대분류는 국제 통용 개념이고,
 *    우리는 그 개념만 차용해 공공 KSIC 에서 우리가 유도했다(비용 0·재배포 자유).
 *
 * ── 자료 ──────────────────────────────────────────────────────
 *   src/data/rankings.json           상장사 2,862 — 인원·임금·근속·성별·1인당시총
 *   src/data/seoulmarkets-sectors.json  KSIC division → SeoulMarkets 업종체계(11 대분류)
 *   archive/raw/stocks/<최신>.ndjson  종목별 시가총액(KRX 종가 기준, 공공데이터포털 경유)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);

/* rankings 컬럼 자리 */
const C = { name: 0, ticker: 1, industry: 2, region: 3, ceoFlag: 4, tenure: 5, tenureGap: 6,
  pay: 7, payRatio: 8, headcount: 9, femaleShare: 10, ceoTenure: 11, officers: 12, age: 13, mcphead: 14 };

const rankings = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/rankings.json'), 'utf8'));
const rows = Array.isArray(rankings) ? rankings : rankings.rows;
const sectorMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/seoulmarkets-sectors.json'), 'utf8')).map;

/* 시총 — 최신 stocks ndjson 에서 코드→시가총액 */
const stockDir = path.join(ROOT, 'archive/raw/stocks');
const 최신 = fs.readdirSync(stockDir).filter((f) => f.endsWith('.ndjson')).sort().pop();
const 시총맵 = new Map();
for (const line of fs.readFileSync(path.join(stockDir, 최신), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const o = JSON.parse(line);
  if (o.코드 && o.시가총액) 시총맵.set(String(o.코드), o.시가총액);
}

/* 각 종목에 업종(sector) + 시총 붙이기 */
const 종목 = [];
for (const r of rows) {
  const ksic = r[C.industry];
  const g = sectorMap[ksic];
  const sector = g ? g.sector : 'Unclassified';
  const 시총 = 시총맵.get(String(r[C.ticker])) ?? null;
  종목.push({
    sector, ksic, name: r[C.name], ticker: r[C.ticker], 시총,
    인원: r[C.headcount], 임금: r[C.pay], 근속: r[C.tenure], 성별임금비: r[C.payRatio],
    여성비: r[C.femaleShare], 근속격차: r[C.tenureGap], 인당시총: r[C.mcphead],
  });
}

const 원 = (v) => (v == null ? '' : Math.round(v).toLocaleString('en-US'));
const 중앙값 = (arr) => {
  const a = arr.filter((v) => v != null && !Number.isNaN(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

/* ── 전 업종 요약 ─────────────────────────────────────────────── */
const 섹터별 = new Map();
for (const t of 종목) {
  if (!섹터별.has(t.sector)) 섹터별.set(t.sector, []);
  섹터별.get(t.sector).push(t);
}
const 총시총 = [...종목].reduce((s, t) => s + (t.시총 || 0), 0);

const 섹터요약 = [...섹터별.entries()].map(([sector, ts]) => {
  const 시총합 = ts.reduce((s, t) => s + (t.시총 || 0), 0);
  const 상위3 = [...ts].filter((t) => t.시총).sort((a, b) => b.시총 - a.시총).slice(0, 3);
  const 상위3시총 = 상위3.reduce((s, t) => s + t.시총, 0);
  return {
    sector, 종목수: ts.length, 시총합,
    시장비중: 총시총 ? (시총합 / 총시총) * 100 : 0,
    집중도: 시총합 ? (상위3시총 / 시총합) * 100 : 0,
    주도주: 상위3.map((t) => t.name).join(' · '),
    인원중앙: 중앙값(ts.map((t) => t.인원)),
    임금중앙: 중앙값(ts.map((t) => t.임금)),
    근속중앙: 중앙값(ts.map((t) => t.근속)),
    성별임금비중앙: 중앙값(ts.map((t) => t.성별임금비)),
    여성비중앙: 중앙값(ts.map((t) => t.여성비)),
  };
}).sort((a, b) => b.시총합 - a.시총합);

const 고른섹터 = process.argv[2];

if (!고른섹터) {
  console.log(`SeoulMarkets 업종체계 · 시총 기준일 ${최신.replace('.ndjson', '')} · 상장사 ${종목.length} · 매핑된 시총 ${종목.filter((t) => t.시총).length}\n`);
  console.log('SECTOR                         종목  시장비중  상위3집중  근속중앙  임금중앙(원)   여성비');
  for (const s of 섹터요약) {
    console.log(
      s.sector.padEnd(28),
      String(s.종목수).padStart(4),
      `${s.시장비중.toFixed(1)}%`.padStart(8),
      `${s.집중도.toFixed(0)}%`.padStart(9),
      `${s.근속중앙?.toFixed(1) ?? '-'}y`.padStart(8),
      원(s.임금중앙).padStart(13),
      `${s.여성비중앙?.toFixed(0) ?? '-'}%`.padStart(7),
    );
  }
  console.log('\n한 업종 시트를 내려면:  node scripts/build-sector-panel.mjs "Information Technology"');
  process.exit(0);
}

/* ── 한 업종: 종목 시트 + 본보기 CSV ─────────────────────────── */
const ts = (섹터별.get(고른섹터) ?? []).slice();
if (!ts.length) { console.log(`⛔ 그런 업종이 없다: ${고른섹터}`); process.exit(1); }

const 시총합 = ts.reduce((s, t) => s + (t.시총 || 0), 0);
ts.sort((a, b) => (b.시총 || 0) - (a.시총 || 0));
/* 주도주 = 시총 상위, 누적이 업종 시총의 70% 에 닿을 때까지. 나머지는 기타. */
let 누적 = 0;
for (const t of ts) { 누적 += t.시총 || 0; t.주도 = 누적 <= 시총합 * 0.70 || 시총합 === 0 ? '주도주' : '기타'; }
const 주도수 = ts.filter((t) => t.주도 === '주도주').length;

const CSV = [
  'sector,source_industry_ksic,company_en,ticker,lead_or_other,market_cap_krw,employees,avg_annual_pay_krw,avg_tenure_years,female_to_male_pay_pct,female_share_pct,market_cap_per_employee_krw',
  ...ts.map((t) => [
    고른섹터, `"${t.ksic}"`, `"${t.name}"`, t.ticker, t.주도,
    t.시총 ?? '', t.인원 ?? '', t.임금 ?? '', t.근속 ?? '', t.성별임금비 ?? '', t.여성비 ?? '', t.인당시총 ?? '',
  ].join(',')),
].join('\n');

const 낼곳 = path.join(ROOT, 'docs/상품안/본보기-업종-패널.csv');
fs.writeFileSync(낼곳, CSV);

console.log(`업종: ${고른섹터}  ·  시총 기준일 ${최신.replace('.ndjson', '')}`);
console.log(`종목 ${ts.length}  ·  주도주 ${주도수}(시총 70% 누적)  ·  기타 ${ts.length - 주도수}`);
console.log(`업종 시총 ${원(시총합)} 원  ·  근속중앙 ${중앙값(ts.map((t) => t.근속))?.toFixed(1)}y  ·  임금중앙 ${원(중앙값(ts.map((t) => t.임금)))}원`);
console.log('\n주도주 (시총 상위):');
for (const t of ts.filter((x) => x.주도 === '주도주').slice(0, 8)) {
  console.log(`  ${t.name.slice(0, 30).padEnd(31)} 시총 ${원(t.시총).padStart(16)}  인원 ${String(t.인원 ?? '-').padStart(7)}  근속 ${t.근속 ?? '-'}y  임금 ${원(t.임금)}`);
}
console.log(`\n→ ${path.relative(ROOT, 낼곳)} (${ts.length}행)`);
