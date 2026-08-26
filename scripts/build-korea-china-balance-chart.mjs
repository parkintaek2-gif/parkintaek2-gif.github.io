#!/usr/bin/env node
/**
 * build-korea-china-balance-chart.mjs — 한국의 대중국 «월별 무역수지» 막대차트.
 *
 * ── 왜 (2026-08-26, 방문 올인 · FSC 무관 원천) ────────────────
 * 연간으로 보면 대중국은 «거의 상쇄»(±소액)지만, 월별로 보면 2025 하반기 적자 → 2026 흑자로 뒤집혔다.
 * 연간 헤드라인이 감추는 연중 반전 — 분포/추세 렌즈. 관세청/KOSIS 출처라 금융위 9/9 공지와 무관.
 *
 * ── ⚠ 정직 규칙 ───────────────────────────────────────────────
 * · 값은 trade-country-monthly.json 그대로(천 USD → bn 환산). 절대 USD 이지만 월 비교라 스케일 일관.
 * · 적자 빨강(아래)·흑자 초록(위)·0선 명확. 최신월(오른쪽)까지.
 *
 * 출력: public/charts/korea-china-trade-balance.svg
 * 자가시험: node scripts/build-korea-china-balance-chart.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'src', 'data', 'trade-country-monthly.json');
const OUT = path.join(ROOT, 'public', 'charts', 'korea-china-trade-balance.svg');

export function chart(series) {
  // series: [{m:'2026-06', bal: 3.59}, ...]
  const W = 760, H = 320, ML = 52, MR = 20, MT = 24, MB = 56;
  const iw = W - ML - MR, ih = H - MT - MB;
  const vals = series.map((r) => r.bal);
  const lo = Math.min(-1, ...vals), hi = Math.max(1, ...vals);
  const span = hi - lo;
  const py = (v) => MT + ih * (1 - (v - lo) / span);
  const zy = py(0);
  const bw = (iw / series.length) * 0.62;
  const cx = (i) => ML + (iw / series.length) * (i + 0.5);
  const bars = series.map((r, i) => {
    const x = cx(i) - bw / 2;
    const yv = py(r.bal);
    const up = r.bal >= 0;
    const y = up ? yv : zy, h = Math.abs(yv - zy);
    const fill = up ? '#2b6f4a' : '#b4472a';
    const lbl = (r.bal >= 0 ? '+' : '') + r.bal.toFixed(1);
    const lblY = up ? yv - 5 : yv + 14;
    const mLbl = r.m.slice(2).replace('-', '/'); // 25/07
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}"/>` +
      `<text x="${cx(i).toFixed(1)}" y="${lblY.toFixed(1)}" text-anchor="middle" font-size="11" fill="#222">${lbl}</text>` +
      `<text x="${cx(i).toFixed(1)}" y="${(H - MB + 16).toFixed(1)}" text-anchor="middle" font-size="11" fill="#555">${mLbl}</text>`;
  }).join('\n  ');
  const yt = [Math.ceil(lo), 0, Math.floor(hi)].filter((v, i, a) => a.indexOf(v) === i);
  const grid = yt.map((v) => `<line x1="${ML}" y1="${py(v).toFixed(1)}" x2="${W - MR}" y2="${py(v).toFixed(1)}" stroke="${v === 0 ? '#333' : '#e6e6e3'}"/><text x="${ML - 8}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#888">${v > 0 ? '+' : ''}${v}</text>`).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia,'Times New Roman',serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${ML}" y="16" font-size="12" fill="#555">USD bn, monthly balance</text>
  ${grid}
  ${bars}
</svg>`;
}

function selfTest() {
  const svg = chart([{ m: '2025-09', bal: -1.83 }, { m: '2026-06', bal: 3.59 }]);
  const ok = svg.includes('-1.8') && svg.includes('+3.6') && svg.includes('<svg') && svg.includes('09'.padStart(2, '0'));
  if (ok) { console.log('✅ 자가시험 통과'); process.exit(0); }
  console.error('❌ 자가시험 실패', svg.slice(0, 200)); process.exit(1);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  if (!fs.existsSync(IN)) { console.log('못 만든다 — trade-country-monthly.json 없음'); process.exit(0); }
  const j = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const cn = (j.countries || []).find((c) => /china/i.test(c.name_en) && !/hong/i.test(c.name_en));
  if (!cn) { console.log('못 만든다 — 중국 없음'); process.exit(0); }
  const series = cn.months.map((m) => ({ m: m.month, bal: m.balance / 1e6 }));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, chart(series));
  const last = series[series.length - 1];
  console.log(`✅ 대중 월별수지 ${series.length}개월 · 최신 ${last.m} ${last.bal >= 0 ? '+' : ''}${last.bal.toFixed(2)}bn · ${OUT}`);
}

main();
