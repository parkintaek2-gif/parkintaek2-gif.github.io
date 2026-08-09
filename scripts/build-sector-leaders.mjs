/**
 * build-sector-leaders.mjs — 「업종 주도주 vs 나머지 — 노동 격차」 상품 데이터 (P10)
 *
 * ── 사장님 원래 비전 ──────────────────────────────────────────
 *   "업종의 주도가 되는 종목들, 그리고 기타 종목들 나눠서" + "우리만의 노동데이터".
 *   업종마다 시총 상위(주도주)와 나머지를 갈라 급여·근속·여성비를 나란히 놓는다.
 *   대형 벤더는 이 축(같은 업종 안에서 대장주 대 나머지의 노동)을 안 판다.
 *
 * ── 정직/강령 ─────────────────────────────────────────────────
 *   · 주도주 = **업종 안 시가총액 상위 20%**(기계적·투명한 정의). 「좋은 주식」이 아니다.
 *   · 이것은 「큰 회사가 더 준다」는 서술적 사실이다. **투자자문 아님** — 대장주를 사라는 말이 아니다.
 *   · 1차 데이터만: rankings(급여·근속·여성비·직원수) + stocks(시가총액) + KSIC 섹터맵.
 *   · 표본 얇은 업종(30사 미만)·주도주 3사 미만은 접는다. 급여는 원(₩) 단위(연).
 *
 * 실행:  node scripts/build-sector-leaders.mjs
 * 출력:  src/data/sector-leaders.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rankings = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/rankings.json'), 'utf8'));
const rows = rankings.rows;
const sect = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/seoulmarkets-sectors.json'), 'utf8'));
const secOf = (ind) => sect.map[ind]?.sector || 'Unclassified';

// 시가총액 브릿지 (최신 stocks)
const stocksDir = path.join(ROOT, 'archive/raw/stocks');
const 최신 = fs.readdirSync(stocksDir).filter((f) => f.endsWith('.ndjson')).sort().at(-1);
const mcap = {};
for (const l of fs.readFileSync(path.join(stocksDir, 최신), 'utf8').split('\n')) {
  if (!l.trim()) continue;
  let o; try { o = JSON.parse(l); } catch { continue; }
  mcap[o.코드] = o.시가총액 || 0;
}

// rankings cols: 0name 1ticker 2industry 5tenure 7pay 9headcount 10femaleShare 14mktCapPerHead
const bySec = {};
for (const r of rows) {
  const code = String(r[1]); if (!code) continue;
  const s = secOf(r[2]);
  (bySec[s] = bySec[s] || []).push({
    code, mc: mcap[code] || 0,
    tenure: r[5], pay: r[7], head: r[9], fem: r[10],
  });
}

const med = (a) => { a = a.filter((x) => x != null && !isNaN(x)).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
const r1 = (x) => (x == null ? null : +x.toFixed(1));
const r2 = (x) => (x == null ? null : +x.toFixed(2));

const sectors = [];
let 더줌 = 0; let 총 = 0;
for (const [sector, arr] of Object.entries(bySec)) {
  if (arr.length < 30) continue; // 얇은 업종은 접는다
  arr.sort((a, b) => b.mc - a.mc);
  const k = Math.max(3, Math.round(arr.length * 0.2));
  const L = arr.slice(0, k), R = arr.slice(k);
  const lp = med(L.map((x) => x.pay)), rp = med(R.map((x) => x.pay));
  if (!lp || !rp) continue;
  const lt = med(L.map((x) => x.tenure)), rt = med(R.map((x) => x.tenure));
  const lf = med(L.map((x) => x.fem)), rf = med(R.map((x) => x.fem));
  총++; if (lp > rp) 더줌++;
  sectors.push({
    sector,
    companies: arr.length,
    leaders: k,
    leader_pay_krw: lp, rest_pay_krw: rp, pay_ratio: r2(lp / rp),
    leader_tenure_years: r1(lt), rest_tenure_years: r1(rt),
    tenure_gap_years: lt != null && rt != null ? r1(lt - rt) : null,
    leader_female_pct: r1(lf), rest_female_pct: r1(rf),
  });
}
sectors.sort((a, b) => b.pay_ratio - a.pay_ratio);

const out = {
  generated: null,
  source: 'SeoulMarkets sector-leaders — rankings (pay·tenure·female share) + archive/raw/stocks (market cap) + KSIC sector map',
  method_note: 'Leaders = the top 20% of a sector’s listed companies by market capitalisation (at least 3). A mechanical, transparent split by size, not a stock pick. Pay and tenure are medians; pay is annual won.',
  disclaimer: 'A descriptive fact about how the largest companies in each sector pay and retain, not investment advice and not a recommendation to buy leaders.',
  sectors_where_leaders_pay_more: 더줌,
  sectors_total: 총,
  sectors,
};
fs.writeFileSync(path.join(ROOT, 'src/data/sector-leaders.json'), JSON.stringify(out, null, 2));

console.log(`업종 주도주 vs 나머지 — ${총}개 업종 중 주도주가 더 주는 곳 ${더줌}`);
console.log('(급여배수 큰 순)');
for (const s of sectors) {
  console.log(`  ${s.sector.padEnd(24)} pay ${s.pay_ratio}x · 근속차 ${s.tenure_gap_years}년 · 여성 주도 ${s.leader_female_pct}% vs 나머지 ${s.rest_female_pct}%  (주도 ${s.leaders}/${s.companies})`);
}
