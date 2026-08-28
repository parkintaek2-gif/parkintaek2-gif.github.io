#!/usr/bin/env node
/**
 * build-real-wage-annual.mjs — 한국 «연간» 실질임금 시계열(SeoulMarkets 영문 기사·차트용).
 *
 * ── 왜 (2026-08-28, 사장님 지시: 사업체노동력조사 실질임금 수집·가공) ────────────
 * 3번이 100yearmap용으로 이미 KOSIS 실질임금을 수집한다(src/data/100yearmap/real-wage.json).
 * 재수집 대신 그 «연도별»(12개월 다 찬 해만)을 뽑아 SeoulMarkets 자체 파일로 소유한다.
 * 영문 데이터저널리즘이 우리 차별화 — 같은 자료를 영어로, 안 쓰던 축(연간 정체)으로.
 * 원천 KOSIS 고용노동부/통계청 → FSC 9/9 제4유형과 무관(안전).
 *
 * ── ⚠ 정직 규칙 ───────────────────────────────────────────────
 * · 월별은 특별급여(상여) 타이밍으로 심하게 출렁이고 정부 헤드라인과 기준이 달라 «연간»만 쓴다.
 * · 부분 연도(2026, 5개월)는 시계열에 «부분»으로 표시하고 완전 연도와 직접 비교하지 않는다.
 * · 6월 등 KOSIS 미게시 월은 만들지 않는다(3번 수집 노트: 「6월 KOSIS 미게시」).
 *
 * 출력: src/data/korea-real-wage-annual.json · public/charts/korea-real-wage-annual.svg
 * 자가시험: node scripts/build-real-wage-annual.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'src', 'data', '100yearmap', 'real-wage.json');
const OUT = path.join(ROOT, 'src', 'data', 'korea-real-wage-annual.json');
const CHART = path.join(ROOT, 'public', 'charts', 'korea-real-wage-annual.svg');
const IS_MAIN = import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === process.argv[1];

export function extract(src) {
  const y = src.연도별 || {};
  const rows = Object.entries(y).map(([yr, o]) => ({
    year: +yr,
    won: Math.round(o.평균),
    manwon: +(o.평균 / 10000).toFixed(1), // 만원
    months: o.개월수,
    partial: o.개월수 < 12,
  })).sort((a, b) => a.year - b.year);
  const full = rows.filter((r) => !r.partial);
  const peak = full.reduce((a, b) => (b.won > a.won ? b : a), full[0]);
  const last = full[full.length - 1];
  // 2021 이후 정체 계산 (완전 연도 기준)
  const y2021 = full.find((r) => r.year === 2021);
  return {
    source: src.출처 || null,
    receivedAt: src.받은때 || null,
    latestMonth: src.최근달 || null,
    recentYoY: src.검산?.최근YoY || null,
    pressNote: src.검산?.보도자료대조 || null,
    peakYear: peak.year, peakManwon: peak.manwon,
    lastFullYear: last.year, lastFullManwon: last.manwon,
    plateauSince: y2021 ? { year: 2021, manwon: y2021.manwon, changeToLastPct: +(((last.won / y2021.won) - 1) * 100).toFixed(1) } : null,
    rows,
  };
}

function chart(rows) {
  const full = rows.filter((r) => !r.partial);
  const W = 760, H = 340, ML = 56, MR = 20, MT = 24, MB = 44;
  const iw = W - ML - MR, ih = H - MT - MB;
  const vals = full.map((r) => r.manwon);
  const lo = Math.floor(Math.min(...vals) / 10) * 10 - 5, hi = Math.ceil(Math.max(...vals) / 10) * 10;
  const px = (i) => ML + (iw * i) / (full.length - 1);
  const py = (v) => MT + ih * (1 - (v - lo) / (hi - lo));
  const pts = full.map((r, i) => `${px(i).toFixed(1)},${py(r.manwon).toFixed(1)}`).join(' ');
  const dots = full.map((r, i) => `<circle cx="${px(i).toFixed(1)}" cy="${py(r.manwon).toFixed(1)}" r="2.6" fill="#2b4a6f"/>`).join('');
  const xlab = full.map((r, i) => (r.year % 2 === 1 || i === full.length - 1) ? `<text x="${px(i).toFixed(1)}" y="${H - MB + 16}" text-anchor="middle" font-size="10" fill="#667">${r.year}</text>` : '').join('');
  const yt = [lo, Math.round((lo + hi) / 2), hi];
  const grid = yt.map((v) => `<line x1="${ML}" y1="${py(v).toFixed(1)}" x2="${W - MR}" y2="${py(v).toFixed(1)}" stroke="#ececea"/><text x="${ML - 8}" y="${(py(v) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="#889">${v}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia,'Times New Roman',serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${ML}" y="15" font-size="11" fill="#667">Real monthly wage, 10,000 won (deflated, 2020=100) · full calendar years</text>
  ${grid}
  <polyline points="${pts}" fill="none" stroke="#2b4a6f" stroke-width="2"/>
  ${dots}${xlab}
</svg>`;
}

function selfTest() {
  const fake = { 연도별: { '2020': { 평균: 3526324, 개월수: 12 }, '2021': { 평균: 3599299, 개월수: 12 }, '2025': { 평균: 3606783, 개월수: 12 }, '2026': { 평균: 3648153, 개월수: 5 } }, 받은때: '2026-08-28' };
  const r = extract(fake);
  const ok = r.rows.length === 4 && r.rows.find((x) => x.year === 2026).partial === true
    && r.lastFullYear === 2025 && r.plateauSince.year === 2021
    && Math.abs(r.plateauSince.changeToLastPct - 0.2) < 0.1
    && chart(r.rows).includes('<svg');
  if (ok) { console.log('✅ 자가시험 통과'); process.exit(0); }
  console.error('❌ 자가시험 실패', JSON.stringify(r).slice(0, 300)); process.exit(1);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  if (!fs.existsSync(IN)) { console.log('못 만든다 — 100yearmap/real-wage.json 없음(3번 수집 대기)'); process.exit(0); }
  const src = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const out = extract(src);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  fs.mkdirSync(path.dirname(CHART), { recursive: true });
  fs.writeFileSync(CHART, chart(out.rows));
  console.log(`✅ 실질임금 연간 ${out.rows.length}개년 · 피크 ${out.peakYear}(${out.peakManwon}만) · 2021→${out.lastFullYear} ${out.plateauSince.changeToLastPct}% · ${OUT}`);
}

if (IS_MAIN) main();
