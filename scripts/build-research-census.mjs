#!/usr/bin/env node
/**
 * SeoulMarkets — **증권사 리서치 센서스** (P2 상품 본보기).
 *
 *   node scripts/build-research-census.mjs           전 기간 집계
 *   node scripts/build-research-census.mjs 2026       한 해만
 *
 * ── 왜 (사장님 지시 2026-08-08) ───────────────────────────────
 * 우리는 한국 소매 리서치 게시판의 리포트를 날짜별로 다 모았다(archive/raw/research).
 * 각 건: 종목·증권사·투자의견(Buy/Hold/Sell)·목표가·날짜.
 * 대형 벤더(FnGuide WiseReport)는 리포트를 모아 주지만, **매도의견 희소성·
 * 증권사별 성향·중립 소멸 시계열**을 상품으로 팔지 않는다 — 그게 우리 각도다.
 * 「twenty-six-sell-ratings」 기사가 이 데이터에서 나왔다. 이제 상품으로 만든다.
 *
 * ⛔ 파일이 수만 건이라 **카운터만 누적**한다(스트리밍) — 램에 다 안 올린다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 방 = path.join(ROOT, 'archive/raw/research');
const 해 = process.argv[2]; // 예: '2026' 이면 그 해 폴더만

/** 투자의견을 Buy/Hold/Sell/기타 로 묶는다. 표기가 여러 가지다. */
function 의견묶기(op) {
  if (!op) return '기타';
  const s = String(op).toLowerCase().replace(/\s/g, '');
  if (/(buy|매수|outperform|overweight|strongbuy|적극매수|비중확대)/.test(s)) return 'Buy';
  if (/(hold|중립|neutral|marketperform|equalweight|시장수익률|보유)/.test(s)) return 'Hold';
  if (/(sell|매도|underperform|underweight|비중축소|reduce)/.test(s)) return 'Sell';
  return '기타';
}

const 폴더 = fs.readdirSync(방)
  .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  .filter((d) => !해 || d.startsWith(해))
  .sort();

const house별 = new Map();   // house → {총, Buy, Hold, Sell, 기타}
const 종목별 = new Map();    // code → {stock, 총}
const 연도별 = new Map();    // yyyy → {총, Sell}
let 총건 = 0; let 목표가있음 = 0;
const 전체 = { Buy: 0, Hold: 0, Sell: 0, 기타: 0 };

for (const d of 폴더) {
  const dir = path.join(방, d);
  let 파일;
  try { 파일 = fs.readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { continue; }
  const yyyy = d.slice(0, 4);
  if (!연도별.has(yyyy)) 연도별.set(yyyy, { 총: 0, Sell: 0 });
  for (const f of 파일) {
    let o;
    try { o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    const g = 의견묶기(o.opinion);
    총건++; 전체[g]++;
    if (o.targetPrice) 목표가있음++;
    const h = o.house || '(미상)';
    if (!house별.has(h)) house별.set(h, { 총: 0, Buy: 0, Hold: 0, Sell: 0, 기타: 0 });
    const hh = house별.get(h); hh.총++; hh[g]++;
    if (o.code) {
      if (!종목별.has(o.code)) 종목별.set(o.code, { stock: o.stock, 총: 0 });
      종목별.get(o.code).총++;
    }
    const yy = 연도별.get(yyyy); yy.총++; if (g === 'Sell') yy.Sell++;
  }
}

const pct = (n, d) => (d ? (n / d) * 100 : 0);
console.log(`증권사 리서치 센서스${해 ? ` — ${해}` : ' — 전 기간'}`);
console.log(`리포트 ${총건.toLocaleString()}건 · 증권사 ${house별.size} · 종목 ${종목별.size} · 목표가 있는 것 ${pct(목표가있음, 총건).toFixed(1)}%`);
console.log(`\n전체 투자의견 분포:`);
console.log(`  Buy ${pct(전체.Buy, 총건).toFixed(1)}%  ·  Hold ${pct(전체.Hold, 총건).toFixed(1)}%  ·  Sell ${pct(전체.Sell, 총건).toFixed(2)}%  ·  기타 ${pct(전체.기타, 총건).toFixed(1)}%`);

console.log(`\n연도별 매도의견 비율(중립·매도 소멸 추세):`);
for (const [y, v] of [...연도별.entries()].sort()) {
  if (v.총 < 50) continue;
  console.log(`  ${y}  리포트 ${String(v.총).padStart(6)}  Sell ${pct(v.Sell, v.총).toFixed(2)}%`);
}

console.log(`\n증권사별 성향 (리포트 200건 이상, 매도비율 낮은 순):`);
const hs = [...house별.entries()].filter(([, v]) => v.총 >= 200)
  .sort((a, b) => pct(a[1].Sell, a[1].총) - pct(b[1].Sell, b[1].총));
for (const [h, v] of hs.slice(0, 12)) {
  console.log(`  ${h.padEnd(14)} 총 ${String(v.총).padStart(6)}  Buy ${pct(v.Buy, v.총).toFixed(0).padStart(3)}%  Hold ${pct(v.Hold, v.총).toFixed(0).padStart(3)}%  Sell ${pct(v.Sell, v.총).toFixed(2)}%`);
}

/* 본보기 CSV — 증권사별 성향 시트 */
const CSV = [
  'house,total_reports,buy_pct,hold_pct,sell_pct,other_pct',
  ...[...house별.entries()].sort((a, b) => b[1].총 - a[1].총).map(([h, v]) =>
    [`"${h}"`, v.총, pct(v.Buy, v.총).toFixed(2), pct(v.Hold, v.총).toFixed(2), pct(v.Sell, v.총).toFixed(2), pct(v.기타, v.총).toFixed(2)].join(',')),
].join('\n');
const 낼곳 = path.join(ROOT, 'docs/상품안/본보기-리서치-센서스.csv');
fs.writeFileSync(낼곳, CSV);
console.log(`\n→ ${path.relative(ROOT, 낼곳)} (증권사 ${house별.size}행)`);
