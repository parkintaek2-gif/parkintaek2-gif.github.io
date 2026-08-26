#!/usr/bin/env node
/**
 * build-korea-trade-balance-monthly.mjs — 한국 «전국» 월별 무역수지 막대차트 (12개월).
 *
 * ── 왜 (2026-08-27, 방문 올인 · FSC 무관 원천) ────────────────
 * 파트너별 흑자(대미·대중)는 이미 다뤘다. 아직 안 쓴 축 = «전국 총계»의 월별 리듬이다.
 * 12개월 내내 흑자지만, 흑자 규모가 2026-02/03에 계단식으로 뛰었다($6.5bn→$36.1bn).
 * 수준이 아니라 «국면»이 바뀐 이야기 — KOSPI 변동성 기사와 같은 분포/국면 렌즈.
 * 관세청/KOSIS(통관) 출처라 금융위 9/9 제4유형 공지와 무관하다.
 *
 * ── ⚠ 정직 규칙 ───────────────────────────────────────────────
 * · 값은 trade-country-monthly.json 의 national[] 그대로(천 USD → bn 환산). 명목 USD.
 * · 12개월 전부 흑자라 전부 초록 — 이야기는 «상승»이다. 최신월(오른쪽)까지.
 *
 * 출력: public/charts/korea-trade-balance-monthly.svg
 * 자가시험: node scripts/build-korea-trade-balance-monthly.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'src', 'data', 'trade-country-monthly.json');
const OUT = path.join(ROOT, 'public', 'charts', 'korea-trade-balance-monthly.svg');
const IS_MAIN = import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === process.argv[1];

export function chart(series) {
  // series: [{m:'2025-07', bal: 6.51}, ...]  bal in USD bn
  const W = 760, H = 320, ML = 52, MR = 20, MT = 24, MB = 56;
  const iw = W - ML - MR, ih = H - MT - MB;
  const vals = series.map((r) => r.bal);
  const lo = Math.min(0, ...vals), hi = Math.max(1, ...vals) * 1.08;
  const span = hi - lo;
  const py = (v) => MT + ih * (1 - (v - lo) / span);
  const zy = py(0);
  const bw = (iw / series.length) * 0.62;
  const cx = (i) => ML + (iw / series.length) * (i + 0.5);
  const bars = series.map((r, i) => {
    const x = cx(i) - bw / 2;
    const yv = py(r.bal);
    const y = yv, h = Math.abs(zy - yv);
    const fill = '#2b6f4a';
    const lbl = '+' + r.bal.toFixed(1);
    const mLbl = r.m.slice(2).replace('-', '/'); // 25/07
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}"/>` +
      `<text x="${cx(i).toFixed(1)}" y="${(yv - 5).toFixed(1)}" text-anchor="middle" font-size="11" fill="#222">${lbl}</text>` +
      `<text x="${cx(i).toFixed(1)}" y="${(H - MB + 16).toFixed(1)}" text-anchor="middle" font-size="11" fill="#555">${mLbl}</text>`;
  }).join('\n  ');
  const yt = [0, Math.round(hi / 2), Math.floor(hi)].filter((v, i, a) => a.indexOf(v) === i);
  const grid = yt.map((v) => `<line x1="${ML}" y1="${py(v).toFixed(1)}" x2="${W - MR}" y2="${py(v).toFixed(1)}" stroke="${v === 0 ? '#333' : '#e6e6e3'}"/><text x="${ML - 8}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#888">+${v}</text>`).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia,'Times New Roman',serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${ML}" y="16" font-size="12" fill="#555">USD bn, monthly trade surplus (customs basis)</text>
  ${grid}
  ${bars}
</svg>`;
}

function selfTest() {
  const svg = chart([{ m: '2025-07', bal: 6.51 }, { m: '2026-06', bal: 36.09 }]);
  const ok = svg.includes('+6.5') && svg.includes('+36.1') && svg.includes('<svg') && svg.includes('25/07');
  if (ok) { console.log('✅ 자가시험 통과'); process.exit(0); }
  console.error('❌ 자가시험 실패', svg.slice(0, 200)); process.exit(1);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  if (!fs.existsSync(IN)) { console.log('못 만든다 — trade-country-monthly.json 없음'); process.exit(0); }
  const j = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const nat = j.national || [];
  if (nat.length < 2) { console.log('못 만든다 — national[] 없음'); process.exit(0); }
  const series = nat.map((m) => ({ m: m.month, bal: m.balance / 1e6 }));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, chart(series));
  const first = series[0], last = series[series.length - 1];
  console.log(`✅ 전국 월별수지 ${series.length}개월 · ${first.m} +${first.bal.toFixed(1)}bn → ${last.m} +${last.bal.toFixed(1)}bn · ${OUT}`);
}

if (IS_MAIN) main();
