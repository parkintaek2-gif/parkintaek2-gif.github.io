#!/usr/bin/env node
/**
 * build-youth-unemployment.mjs — 한국 «청년(15~29) 실업률» 연간 시계열(SeoulMarkets 영문 기사·차트).
 *
 * ── 왜 (2026-08-28, 사장님 지시: 내년 예산안 검토 → 청년 실태를 데이터로) ──────────
 * 예산 수치(43조)는 미게시라 못 쓴다. 대신 예산이 향하는 «청년 실태»를 검증 가능한 데이터로.
 * 3번(100yearmap·한글)은 쉬었음인구·자산격차를 맡고, 6번은 «청년 실업률/고용률»(영문·시장경제)로 갈랐다.
 * 원천 KOSIS 통계청 경제활동인구조사 → FSC 9/9 제4유형과 무관(안전).
 *
 * ── ⚠ 정직 규칙 ───────────────────────────────────────────────
 * · 월별은 졸업철(2~3월) 계절성이 커 «연간»만 쓴다(실질임금과 같은 규율).
 * · 실업률 하락은 일부 «쉬었음»(구직 포기 → 실업자 아님) 증가가 섞였다 — 기사에서 밝힌다.
 *
 * 출력: src/data/korea-youth-unemployment.json · public/charts/korea-youth-unemployment.svg
 * 실행(네트워크): node scripts/build-youth-unemployment.mjs  (KOSIS 키 필요)
 * 자가시험: node scripts/build-youth-unemployment.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'data', 'korea-youth-unemployment.json');
const CHART = path.join(ROOT, 'public', 'charts', 'korea-youth-unemployment.svg');
const ORG = '101', TBL = 'DT_1DA7102S';
const IS_MAIN = import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === process.argv[1];

function keyFrom(env) { const m = env.match(/^KOSIS_API_KEY=(.+)$/m); if (!m) throw new Error('.env 에 KOSIS_API_KEY 없음'); return m[1].trim(); }

export function shape(rows) {
  // rows: KOSIS getList 배열. 계(성별)·연령대별 실업률. 연간만.
  const pick = (band) => rows.filter((x) => x.C1_NM === '계' && x.C2_NM === band)
    .map((x) => ({ year: +String(x.PRD_DE).slice(0, 4), rate: +x.DT }))
    .sort((a, b) => a.year - b.year);
  const youth = pick('15 - 29세');
  const all = pick('계');
  const allByYear = Object.fromEntries(all.map((r) => [r.year, r.rate]));
  const merged = youth.map((r) => ({ year: r.year, youth: r.rate, all: allByYear[r.year] ?? null, ratio: allByYear[r.year] ? +(r.rate / allByYear[r.year]).toFixed(2) : null }));
  const peak = merged.reduce((a, b) => (b.youth > a.youth ? b : a), merged[0]);
  const last = merged[merged.length - 1];
  const trough = merged.reduce((a, b) => (b.youth < a.youth ? b : a), merged[0]);
  return { source: 'KOSIS · Statistics Korea, Economically Active Population Survey (경제활동인구조사), table DT_1DA7102S — unemployment rate by sex and age, annual', peakYear: peak.year, peakRate: peak.youth, troughYear: trough.year, troughRate: trough.youth, lastYear: last.year, lastRate: last.youth, lastRatioToAll: last.ratio, rows: merged };
}

function chart(rows) {
  const W = 760, H = 340, ML = 46, MR = 20, MT = 24, MB = 44;
  const iw = W - ML - MR, ih = H - MT - MB;
  const vals = rows.flatMap((r) => [r.youth, r.all]).filter((v) => v != null);
  const lo = 0, hi = Math.ceil(Math.max(...vals) + 1);
  const px = (i) => ML + (iw * i) / (rows.length - 1);
  const py = (v) => MT + ih * (1 - (v - lo) / (hi - lo));
  const line = (key, col) => `<polyline points="${rows.map((r, i) => `${px(i).toFixed(1)},${py(r[key]).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="2"/>`;
  const dots = (key, col) => rows.map((r, i) => `<circle cx="${px(i).toFixed(1)}" cy="${py(r[key]).toFixed(1)}" r="2.4" fill="${col}"/>`).join('');
  const xlab = rows.map((r, i) => (r.year % 2 === 0) ? `<text x="${px(i).toFixed(1)}" y="${H - MB + 16}" text-anchor="middle" font-size="10" fill="#667">${r.year}</text>` : '').join('');
  const yt = [0, Math.round(hi / 2), hi];
  const grid = yt.map((v) => `<line x1="${ML}" y1="${py(v).toFixed(1)}" x2="${W - MR}" y2="${py(v).toFixed(1)}" stroke="#ececea"/><text x="${ML - 8}" y="${(py(v) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="#889">${v}%</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia,'Times New Roman',serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${ML}" y="15" font-size="11" fill="#667">Unemployment rate, % · <tspan fill="#b4472a">youth 15–29</tspan> vs <tspan fill="#2b4a6f">all ages</tspan> · annual</text>
  ${grid}
  ${line('all', '#2b4a6f')}${line('youth', '#b4472a')}${dots('all', '#2b4a6f')}${dots('youth', '#b4472a')}${xlab}
</svg>`;
}

async function get(url) { const r = await fetch(url, { signal: AbortSignal.timeout(40000) }); const t = await r.text(); const j = JSON.parse(t); if (!Array.isArray(j)) throw new Error(`${j.err ?? ''} ${j.errMsg ?? ''}`.trim()); return j; }

function selfTest() {
  const fake = [
    { C1_NM: '계', C2_NM: '15 - 29세', PRD_DE: '2016', DT: '9.8' },
    { C1_NM: '계', C2_NM: '15 - 29세', PRD_DE: '2025', DT: '6.1' },
    { C1_NM: '계', C2_NM: '계', PRD_DE: '2016', DT: '3.7' },
    { C1_NM: '계', C2_NM: '계', PRD_DE: '2025', DT: '2.8' },
    { C1_NM: '남자', C2_NM: '15 - 29세', PRD_DE: '2025', DT: '6.5' },
  ];
  const s = shape(fake);
  const ok = s.rows.length === 2 && s.peakYear === 2016 && s.peakRate === 9.8 && s.lastYear === 2025 && s.lastRate === 6.1
    && s.rows[1].ratio === +(6.1 / 2.8).toFixed(2) && chart(s.rows).includes('<svg') && !s.rows.some((r) => r.year === undefined);
  if (ok) { console.log('✅ 자가시험 통과'); process.exit(0); }
  console.error('❌ 자가시험 실패', JSON.stringify(s).slice(0, 300)); process.exit(1);
}

async function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  const k = keyFrom(fs.readFileSync(path.join(ROOT, '.env'), 'utf8'));
  const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
    + `&orgId=${ORG}&tblId=${TBL}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=16`;
  const rows = await get(url);
  const out = shape(rows);
  out.receivedAt = new Date().toLocaleString('sv-SE');
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  fs.mkdirSync(path.dirname(CHART), { recursive: true });
  fs.writeFileSync(CHART, chart(out.rows));
  console.log(`✅ 청년실업률 ${out.rows.length}개년 · 정점 ${out.peakYear} ${out.peakRate}% → ${out.lastYear} ${out.lastRate}%(전체의 ${out.lastRatioToAll}배) · ${OUT}`);
}

if (IS_MAIN) main();
