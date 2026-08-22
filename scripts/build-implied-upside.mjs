#!/usr/bin/env node
/**
 * build-implied-upside.mjs — 차별화 상품: «브로커 목표가 대비 실주가 괴리».
 *   재료 = ① /v1/research 최근 브로커 목표가(broker facts) ② KRX 현재 종가(archive/raw/krx)
 *   ③ rankings.json 업종. 이름으로 조인. 단일피드 벤더가 못 만드는 교차.
 *
 * ⛔ 개별종목 «사라»가 아니다. 시장·업종 «집계»로 낸다 — 브로커가 그렇게 말했다는 사실(데이터).
 * 산출: src/data/implied-upside.json  (지면·기사가 읽는다)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const norm = (s) => String(s || '').replace(/\s/g, '').replace(/\(.*?\)/g, '');

// ── KRX 최근 종가: name → {close, mktcap, code, mkt} ──
const krxDir = path.join(ROOT, 'archive/raw/krx');
const krxFiles = fs.readdirSync(krxDir).filter((f) => f.endsWith('.json')).sort();
const latestDd = krxFiles.map((f) => f.match(/-(\d{8})\.json$/)?.[1]).filter(Boolean).sort().pop();
const px = new Map();
for (const f of krxFiles.filter((f) => f.includes(latestDd))) {
  const { rows } = JSON.parse(fs.readFileSync(path.join(krxDir, f), 'utf8'));
  for (const r of rows) px.set(norm(r.ISU_NM), { close: +r.TDD_CLSPRC, mktcap: +r.MKTCAP, code: r.ISU_CD, mkt: r.MKT_NM });
}

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
  asOf: latestDd, since, stocks: joined.length, brokerReports: all.length,
  marketMedian: +med(ups).toFixed(1), sectorMed, top: joined.slice(0, 15), bottom: joined.slice(-10),
}, null, 1));
console.log('저장 src/data/implied-upside.json');
