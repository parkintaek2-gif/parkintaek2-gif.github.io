#!/usr/bin/env node
/*
 * SeoulMarkets — 목표주가 적중률 (P7). 발행시 목표가 vs 12개월 뒤 실제주가.
 *
 *   node scripts/build-target-price-accuracy.mjs 2024   한 해(발행연도) 정본
 *   node scripts/build-target-price-accuracy.mjs        전 기간(무겁다 — background 로)
 *
 * 왜 (사장님 2026-08-08): 「어느 증권사의 목표주가가 맞았나」 — 국내외에 파는 곳이 없다.
 *   시간이 쌓여야만 만들어진다. 아카이브가 곧 해자다.
 *
 * 방법:
 *   · 리포트에서 발행일·증권사·종목·목표가를 읽는다(과거는 code 없어 종목명→code 백필).
 *   · 발행일 종가(그 날 stocks)와 12개월 뒤 종가(발행일+365일 근처 stocks)를 조인.
 *   · 달성 = 12개월 뒤 종가 >= 목표가. 괴리 = (실제-목표)/목표.
 *   · 증권사별 집계 → src/data/target-price-accuracy.json (지면이 읽는다).
 *
 * ⚠ 정직 단서(지면에 반드시): ① 상폐·개명 종목은 code 복원 실패로 빠진다(생존편향, 상방).
 *   ② 12개월 종가 하나로 재니 기간 중 도달했다 빠진 것은 못 센다(달성 과소). 정본에 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 해 = process.argv[2];
const sd = path.join(ROOT, 'archive/raw/stocks');
const rd = path.join(ROOT, 'archive/raw/research');

/* 최신 stocks 로 종목명→code 백필 사전 */
const latest = fs.readdirSync(sd).filter((f) => f.endsWith('.ndjson')).sort().pop();
const n2c = new Map();
for (const l of fs.readFileSync(path.join(sd, latest), 'utf8').split('\n')) {
  if (!l.trim()) continue; const o = JSON.parse(l); if (o.이름 && o.코드) n2c.set(o.이름.replace(/\s/g, ''), String(o.코드));
}

/* stocks 종가맵 캐시 — 날짜(YYYYMMDD)별로 한 번만 읽는다. 근처 ±5일 파일도 찾는다 */
const 시세파일 = new Set(fs.readdirSync(sd).filter((f) => f.endsWith('.ndjson')).map((f) => f.replace('.ndjson', '')));
const closeCache = new Map();
function 종가맵(yyyymmdd) {
  if (closeCache.has(yyyymmdd)) return closeCache.get(yyyymmdd);
  let use = null;
  for (let off = 0; off <= 7; off++) {
    for (const s of [off, -off]) {
      const d = shift(yyyymmdd, s);
      if (시세파일.has(d)) { use = d; break; }
    }
    if (use) break;
  }
  const m = new Map();
  if (use) for (const l of fs.readFileSync(path.join(sd, use + '.ndjson'), 'utf8').split('\n')) {
    if (!l.trim()) continue; const o = JSON.parse(l); if (o.코드 && o.종가) m.set(String(o.코드), o.종가);
  }
  closeCache.set(yyyymmdd, m);
  return m;
}
function shift(yyyymmdd, days) {
  const y = +yyyymmdd.slice(0, 4), mo = +yyyymmdd.slice(4, 6), da = +yyyymmdd.slice(6, 8);
  const dt = new Date(Date.UTC(y, mo - 1, da + days));
  return `${dt.getUTCFullYear()}${String(dt.getUTCMonth() + 1).padStart(2, '0')}${String(dt.getUTCDate()).padStart(2, '0')}`;
}

/* 리포트 순회 — 발행연도 필터 */
const dirs = fs.readdirSync(rd).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).filter((d) => !해 || d.startsWith(해)).sort();
const house = new Map();
let 총 = 0, 조인 = 0, 백필 = 0, code없음 = 0;
for (const d of dirs) {
  const ymd = d.replace(/-/g, '');
  for (const f of fs.readdirSync(path.join(rd, d)).filter((f) => f.endsWith('.json'))) {
    let o; try { o = JSON.parse(fs.readFileSync(path.join(rd, d, f), 'utf8')); } catch { continue; }
    if (!o.targetPrice || !o.stock) continue;
    총++;
    let code = o.code ? String(o.code) : n2c.get(o.stock.replace(/\s/g, ''));
    if (!o.code && code) 백필++;
    if (!code) { code없음++; continue; }
    const open = 종가맵(ymd).get(code);
    const fut = 종가맵(shift(ymd, 365)).get(code);
    if (!open || !fut) continue;
    조인++;
    const 여력 = (o.targetPrice / open - 1) * 100;
    const 실제 = (fut / open - 1) * 100;
    const 달성 = fut >= o.targetPrice;
    const h = o.house || '(미상)';
    if (!house.has(h)) house.set(h, { n: 0, 달성: 0, 여력합: 0, 실제합: 0 });
    const hh = house.get(h); hh.n++; if (달성) hh.달성++; hh.여력합 += 여력; hh.실제합 += 실제;
  }
}

const rows = [...house.entries()].filter(([, v]) => v.n >= 20)
  .map(([h, v]) => ({ house: h, n: v.n, hitRate: +(v.달성 / v.n * 100).toFixed(1),
    avgTargetUpside: +(v.여력합 / v.n).toFixed(1), avgActual: +(v.실제합 / v.n).toFixed(1) }))
  .sort((a, b) => b.hitRate - a.hitRate);

const out = {
  _왜: '목표주가 적중률 — 발행시 목표가 vs 12개월 뒤 실제주가. scripts/build-target-price-accuracy.mjs 산출.',
  _단서: ['상폐·개명 종목은 빠짐(생존편향·상방)', '12개월 종가 하나로 재 기간 중 도달분은 과소', '발행연도 필터: ' + (해 || '전기간')],
  기준일: latest.replace('.ndjson', ''), 대상리포트: 총, 조인성공: 조인, 종목명백필: 백필, code없음,
  증권사: rows,
};
fs.writeFileSync(path.join(ROOT, 'src/data/target-price-accuracy.json'), JSON.stringify(out, null, 2));
console.log(`목표주가 적중률 ${해 || '전기간'} — 리포트 ${총} · 조인 ${조인} · 백필 ${백필} · code없음 ${code없음}`);
console.log('증권사별(달성률 순, 20건+):');
for (const r of rows.slice(0, 12)) console.log(`  ${r.house.padEnd(14)} n=${String(r.n).padStart(4)} 달성 ${String(r.hitRate).padStart(4)}% 목표여력 ${r.avgTargetUpside}% 실제 ${r.avgActual}%`);
console.log('→ src/data/target-price-accuracy.json');
