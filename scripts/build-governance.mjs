#!/usr/bin/env node
/*
 * SeoulMarkets — 상장사 지배구조·경영진 (P5). 업종별 이사회 지문.
 *
 *   node scripts/build-governance.mjs
 *
 * 왜 (사장님 데이터 상품 사업): 대형 벤더가 안 파는 「업종별 이사회 구성」 —
 *   여성 임원 비율·오너경영·CEO 재임·임원 나이. 의결권자문·거버넌스펀드·리서치가 산다.
 *
 * 자료: archive/raw/dart-executives (임원별 성별·직위·대표·오너·생년월·재직개월),
 *   종목코드 → rankings industry → seoulmarkets-sectors 로 업종 결합.
 *
 * 정직 단서(지면에): 오너 필드는 공시 원문에 결측이 많아 오너경영 비율은 하한이다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

/* ticker → industry (rankings), industry → sector (우리 체계) */
const rankings = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/rankings.json'), 'utf8'));
const rows = Array.isArray(rankings) ? rankings : rankings.rows;
const t2ind = new Map();
for (const r of rows) t2ind.set(String(r[1]), r[2]);
const sectorMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/seoulmarkets-sectors.json'), 'utf8')).map;

/* 임원 순회 → 종목별 집계 */
const execFile = path.join(ROOT, 'archive/raw/dart-executives/executives-2025.ndjson');
const byStock = new Map();
for (const l of fs.readFileSync(execFile, 'utf8').split('\n')) {
  if (!l.trim()) continue;
  let o; try { o = JSON.parse(l); } catch { continue; }
  const code = String(o.종목 || '');
  if (!code) continue;
  if (!byStock.has(code)) byStock.set(code, { n: 0, 여: 0, 대표: false, 오너: false, 나이: [], 재직: [] });
  const s = byStock.get(code);
  s.n++;
  if (o.성별 === '여') s.여++;
  if (o.대표 === 'Y' || o.대표 === true) s.대표 = true;
  if (o.오너 === true || o.오너 === 'Y') s.오너 = true;
  if (o.생년월) { const y = +String(o.생년월).slice(0, 4); if (y > 1930 && y < 2010) s.나이.push(2026 - y); }
  if (o.재직개월 && !Number.isNaN(+o.재직개월)) s.재직.push(+o.재직개월);
}

const 중앙값 = (a) => { const b = a.filter((v) => v != null).sort((x, y) => x - y); if (!b.length) return null; const m = Math.floor(b.length / 2); return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };

/* 종목 → sector, sector별 집계 */
const bySector = new Map();
for (const [code, s] of byStock) {
  const ind = t2ind.get(code);
  const sector = ind && sectorMap[ind] ? sectorMap[ind].sector : 'Unclassified';
  if (!bySector.has(sector)) bySector.set(sector, { 회사: 0, 임원: 0, 여: 0, 오너: 0, 나이: [], 대표재직: [] });
  const g = bySector.get(sector);
  g.회사++; g.임원 += s.n; g.여 += s.여; if (s.오너) g.오너++;
  g.나이.push(...s.나이);
  const 대표재직 = 중앙값(s.재직); if (대표재직 != null) g.대표재직.push(대표재직 / 12);
}

const pct = (a, b) => (b ? +(a / b * 100).toFixed(1) : null);
const sectors = [...bySector.entries()].filter(([, g]) => g.회사 >= 20)
  .map(([sector, g]) => ({
    sector, companies: g.회사, officers: g.임원,
    femaleOfficerPct: pct(g.여, g.임원),
    ownerLedPctFloor: pct(g.오너, g.회사),
    medianOfficerAge: 중앙값(g.나이),
    medianTenureYears: +(중앙값(g.대표재직) ?? 0).toFixed(1),
  }))
  .sort((a, b) => b.companies - a.companies);

/* 전체 */
let 임원=0, 여=0; for (const [, g] of bySector) { 임원 += g.임원; 여 += g.여; }
const out = {
  _왜: '업종별 상장사 이사회 지문 — 여성 임원·오너경영·CEO 재임·임원 나이. build-governance.mjs 산출.',
  _단서: ['오너 필드는 공시 결측이 많아 오너경영 비율은 하한(floor)이다', '임원=등기·비등기 공시된 자, 회사 20곳+ 업종만 표시'],
  임원총수: 임원, 여성임원비율: pct(여, 임원), 업종: sectors,
};
fs.writeFileSync(path.join(ROOT, 'src/data/governance.json'), JSON.stringify(out, null, 2));
console.log(`지배구조 — 임원 ${임원} · 여성 ${pct(여, 임원)}% · 업종 ${sectors.length}`);
for (const s of sectors) console.log(`  ${s.sector.padEnd(24)} 회사 ${String(s.companies).padStart(4)} 여성임원 ${String(s.femaleOfficerPct).padStart(4)}% 오너 ${String(s.ownerLedPctFloor).padStart(4)}%+ 나이 ${s.medianOfficerAge} 재직 ${s.medianTenureYears}y`);
console.log('→ src/data/governance.json');
