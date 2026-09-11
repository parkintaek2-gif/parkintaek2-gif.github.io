#!/usr/bin/env node
/**
 * build-implied-upside.mjs — 차별화 상품: «브로커 목표가 대비 실주가 괴리».
 *   재료 = ① /v1/research 최근 브로커 목표가(broker facts) ② 현재 종가(공공데이터포털 15094808)
 *   ③ rankings.json 업종. 이름으로 조인. 단일피드 벤더가 못 만드는 교차.
 *
 * ⛔ 개별종목 «사라»가 아니다. 시장·업종 «집계»로 낸다 — 브로커가 그렇게 말했다는 사실(데이터).
 * 산출: src/data/implied-upside.json  (지면·기사가 읽는다)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const norm = (s) => String(s || '').replace(/\s/g, '').replace(/\(.*?\)/g, '');

// ── 최근 종가: name → {close, mktcap, code, mkt} ──
import { 시세 } from '../src/lib/stock-prices-datago.mjs';
/* 🔴 [2026-09-09] KRX 직접 경로에서 공공데이터포털로 갈아탔다.
 *   사장님: 「공공데이터포털에서만 수집하도록 해, krx 자료가 전혀 필요없네」
 *   까닭: KRX OPEN API 약관 제6조② 「비상업적인 목적으로만」 · 제11조 「제3자 제공 금지」.
 *   포털 15094808(금융위원회 · 이용허락범위 «제한 없음») 쪽이 커버도 넓다 —
 *   유가증권 943 → 코스닥·코넥스까지 2,873 종목.
 *   ⭐ 칸 이름은 KRX 그대로 나온다(MKTCAP·ISU_NM·ACC_TRDVAL…) — 아래 셈은 안 바꿨다.
 *   금지·대체의 정본: docs/수집-금지경로.tsv · 검사: scripts/check-forbidden-sources.mjs */
const { 날: dd, 줄들: 시세줄들, 까닭: 시세까닭 } = 시세(ROOT);
if (!시세줄들.length) { console.log(`⚠ 못 쟀다 — ${시세까닭}. 기존 출력 그대로 둔다.`); process.exit(0); }
const latestDd = dd;
const px = new Map();
for (const r of 시세줄들) px.set(norm(r.ISU_NM), { close: +r.TDD_CLSPRC, mktcap: +r.MKTCAP, code: r.ISU_CD, mkt: r.MKT_NM });

// ── 업종: rankings.json name → industry ──
const rk = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/rankings.json'), 'utf8'));
const ci = { name: rk.cols.indexOf('name'), ind: rk.cols.indexOf('industry') };
const sector = new Map();
for (const row of rk.rows) sector.set(norm(row[ci.name]), row[ci.ind]);

// ── 최근 브로커 목표가: /v1/research since ──
const since = process.argv[2] || '2026-05-01';
const base = 'https://seoulmarkets.com/v1/research';
let all = [], offset = 0;
for (let page = 0; page < 8; page++) {
  const r = await fetch(`${base}?since=${since}&limit=200`, { signal: AbortSignal.timeout(30000) });
  const j = await r.json();
  const rows = j.results || [];
  all = all.concat(rows);
  if (rows.length < 200) break; // since 필터라 페이지네이션 없음 — 한 번에 온다
  break;
}
// 종목별 최신 목표가(브로커 평균) — 같은 종목 여러 브로커면 평균
const byStock = new Map();
for (const rp of all) {
  if (!rp.targetPrice || rp.targetPrice <= 0) continue;
  const key = norm(rp.subject);
  if (!byStock.has(key)) byStock.set(key, { subject: rp.subject, subjectEn: rp.subjectEn, targets: [], brokers: new Set() });
  const s = byStock.get(key);
  s.targets.push(rp.targetPrice); s.brokers.add(rp.brokerEntity);
}

// ── 조인 & 괴리 ──
const joined = [];
for (const [key, s] of byStock) {
  const p = px.get(key);
  if (!p || !p.close) continue;
  const consensusTarget = s.targets.reduce((a, b) => a + b, 0) / s.targets.length;
  const upside = (consensusTarget / p.close - 1) * 100;
  if (!isFinite(upside) || Math.abs(upside) > 300) continue; // 이상치·괴리 300%↑ 제외(자료오류 방지)
  joined.push({ subject: s.subject, subjectEn: s.subjectEn, sector: sector.get(key) || null, brokers: s.brokers.size, target: Math.round(consensusTarget), close: p.close, upside: +upside.toFixed(1), mktcap: p.mktcap });
}
joined.sort((a, b) => b.upside - a.upside);

const med = (arr) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
const ups = joined.map((j) => j.upside);
// 업종별 중앙값(표본 5+)
const bySector = {};
for (const j of joined) { if (!j.sector) continue; (bySector[j.sector] ??= []).push(j.upside); }
const sectorMed = Object.entries(bySector).filter(([, v]) => v.length >= 5).map(([k, v]) => ({ sector: k, n: v.length, median: +med(v).toFixed(1) })).sort((a, b) => b.median - a.median);

console.log(`조인 ${joined.length}종목 · 브로커목표(since ${since}) ${all.length}건 · KRX ${latestDd}`);
console.log(`시장 전체 괴리 중앙값 ${med(ups).toFixed(1)}% · 평균 ${(ups.reduce((a,b)=>a+b,0)/ups.length).toFixed(1)}%`);
console.log('업종 상위5:', sectorMed.slice(0, 5).map((s) => `${s.sector} ${s.median}%(n${s.n})`).join(' | '));
console.log('업종 하위5:', sectorMed.slice(-5).reverse().map((s) => `${s.sector} ${s.median}%(n${s.n})`).join(' | '));
console.log('괴리 큰 5:', joined.slice(0, 5).map((j) => `${j.subjectEn||j.subject} +${j.upside}%(${j.brokers}곳)`).join(' | '));
console.log('괴리 작은/음5:', joined.slice(-5).reverse().map((j) => `${j.subjectEn||j.subject} ${j.upside}%`).join(' | '));

fs.writeFileSync(path.join(ROOT, 'src/data/implied-upside.json'), JSON.stringify({
  _왜: '브로커 목표가(팩트) vs KRX 현재종가. 개별 추천 아님 — 시장·업종 집계.',
  /* 🔴 [2026-09-11] 출처 칸 — 이 파일을 읽고 기사·지면을 쓰는 쪽이 «어디서 왔나»를
   * 다시 찾아 헤매지 않게 파일 안에 못박는다(largest-companies·market-concentration·
   * turnover-concentration 차트 세 개는 이미 SVG 캡션에 Source 줄이 있다 — 실측 확인). */
  _출처: 'Broker target prices: SeoulMarkets /v1/research (Hankyung Consensus, collected daily). '
    + `Current price and market cap: Korean public data portal, dataset 15094808 (금융위원회, usage `
    + `scope: no restriction), trading date ${latestDd}. Sector labels: rankings.json (DART-derived).`,
  asOf: latestDd, since, stocks: joined.length, brokerReports: all.length,
  marketMedian: +med(ups).toFixed(1), sectorMed, top: joined.slice(0, 15), bottom: joined.slice(-10),
}, null, 1));
console.log('저장 src/data/implied-upside.json');
