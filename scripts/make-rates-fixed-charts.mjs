#!/usr/bin/env node
/**
 * make-rates-fixed-charts.mjs — 고정·변동금리 대출 비중 기사용 SVG 그래프.
 *
 * 원천: 한국은행 「예금은행 대출 고정·변동금리 비중」(KOSIS org 301 · DT_121Y011), 단위 %.
 *   ⚠ 항목 라벨이 「잔액 기준」이다 — 신규취급액이 아니라 남아 있는 대출 잔액의 구성비다.
 * 출력: public/charts/rates-fixed-share-trend.svg(선) · rates-fixed-vs-floating.svg(막대)
 *   + src/data/rates-fixed-2606.json
 *
 * 차트 라이브러리 0줄 — 서버에서 SVG 좌표까지 굽는다(집안 방식).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const rows = JSON.parse(readFileSync(path.join(ROOT, 'archive', 'raw', 'kosis', 'DT_121Y011.json'), 'utf8')).rows;
const CHARTS = path.join(ROOT, 'public', 'charts');
mkdirSync(CHARTS, { recursive: true });

const periods = [...new Set(rows.map((r) => r.PRD_DE))].sort();
const get = (c, p) => { const r = rows.find((x) => x.C1_NM === c && x.PRD_DE === p); return r ? +r.DT : null; };

const SERIES = [
  { key: 'corporate', ko: '기업', fixed: '기업-고정금리대출 1)', color: '#1d4ed8' },
  { key: 'household', ko: '가계', fixed: '가계-고정금리대출 2) 5)', color: '#16a34a' },
  { key: 'mortgage', ko: '주택담보', fixed: '주택담보대출-고정금리대출 5)', color: '#b4472a' },
];
const label = { corporate: 'Corporate', household: 'Household', mortgage: 'Mortgage' };
const mlabel = (p) => ({ '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' }[p.slice(4)]) + " '" + p.slice(2, 4);

const trend = SERIES.map((s) => ({ ...s, values: periods.map((p) => get(s.fixed, p)) }));
const last = periods[periods.length - 1];
const latest = SERIES.map((s) => {
  const fx = get(s.fixed, last);
  return { key: s.key, ko: s.ko, fixed: fx, floating: +(100 - fx).toFixed(1) };
});

const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', BG = '#ffffff';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ── 선: 고정금리 비중 추이 ─────────────────────────────────────
function lineChart() {
  const W = 768, H = 400, ML = 46, MR = 132, MT = 48, MB = 46;
  const iw = W - ML - MR, ih = H - MT - MB;
  const all = trend.flatMap((t) => t.values);
  const max = Math.ceil(Math.max(...all) / 5) * 5, min = Math.floor(Math.min(...all) / 5) * 5;
  const x = (i) => ML + (iw * i) / (periods.length - 1);
  const y = (v) => MT + ih * (1 - (v - min) / (max - min));
  let grid = '';
  for (let t = min; t <= max; t += 5) grid += `<line x1="${ML}" y1="${y(t)}" x2="${W - MR}" y2="${y(t)}" stroke="${GRID}"/><text x="${ML - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${SUB}">${t}</text>`;
  let lines = '', labels = '';
  for (const t of trend) {
    const pts = t.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    lines += `<polyline points="${pts}" fill="none" stroke="${t.color}" stroke-width="2.5"/>`;
    const yl = y(t.values[t.values.length - 1]);
    labels += `<text x="${W - MR + 6}" y="${yl + 4}" font-size="12.5" font-weight="700" fill="${t.color}">${label[t.key]} ${t.values[t.values.length - 1]}%</text>`;
  }
  let xlab = '';
  periods.forEach((p, i) => { if (i % 2 === 0) xlab += `<text x="${x(i).toFixed(1)}" y="${H - MB + 18}" text-anchor="middle" font-size="11" fill="${SUB}">${mlabel(p)}</text>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Fixed-rate share of Korean bank loans by borrower type, falling from Jul 2025 to Jun 2026">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="${ML}" y="24" font-size="16" font-weight="700" fill="${INK}">The fixed-rate share fell for every kind of Korean borrower</text>
<text x="${ML}" y="40" font-size="12" fill="${SUB}">% of outstanding won bank loans on a fixed rate</text>
${grid}${lines}${labels}${xlab}
<text x="${W - 6}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Bank of Korea via KOSIS (301/DT_121Y011)</text>
</svg>`;
}

// ── 막대: 최신 고정 vs 변동 ────────────────────────────────────
function barChart() {
  const W = 720, H = 320, ML = 130, MR = 40, MT = 52, MB = 34;
  const iw = W - ML - MR;
  const step = (H - MT - MB) / latest.length;
  const bh = Math.min(40, step * 0.5);
  let bars = '';
  latest.forEach((d, i) => {
    const cy = MT + step * i + step / 2;
    const fw = iw * d.fixed / 100, vw = iw * d.floating / 100;
    bars += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${fw.toFixed(1)}" height="${bh}" fill="#1d4ed8"/>`;
    bars += `<rect x="${(ML + fw).toFixed(1)}" y="${(cy - bh / 2).toFixed(1)}" width="${vw.toFixed(1)}" height="${bh}" fill="#cbd5e1"/>`;
    bars += `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="13.5" fill="${INK}">${esc(label[d.key])}</text>`;
    bars += `<text x="${(ML + fw / 2).toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${d.fixed}</text>`;
    bars += `<text x="${(ML + fw + vw / 2).toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${INK}">${d.floating}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Fixed versus floating rate share of Korean loans by borrower type, June 2026">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="26" font-size="16" font-weight="700" fill="${INK}">Companies borrow floating; mortgages stay fixed</text>
<text x="20" y="42" font-size="12" fill="${SUB}">Share of outstanding won loans, June 2026 · blue = fixed, grey = floating</text>
${bars}
<text x="${W - 40}" y="${H - 8}" text-anchor="end" font-size="10" fill="${SUB}">Source: Bank of Korea via KOSIS (301/DT_121Y011)</text>
</svg>`;
}

writeFileSync(path.join(CHARTS, 'rates-fixed-share-trend.svg'), lineChart());
writeFileSync(path.join(CHARTS, 'rates-fixed-vs-floating.svg'), barChart());
writeFileSync(path.join(ROOT, 'src', 'data', 'rates-fixed-2606.json'), JSON.stringify({
  source: '한국은행 예금은행 대출 고정·변동금리 비중(잔액 기준) · KOSIS 301/DT_121Y011',
  unit: '%', basis: 'outstanding loan balances',
  window: { first: periods[0], last },
  trend: trend.map((t) => ({ type: t.key, first: t.values[0], last: t.values[t.values.length - 1] })),
  latest,
}, null, 2));
console.log('✅ rates charts + data');
console.log('  latest', last, latest.map((d) => `${d.key} fixed ${d.fixed}/float ${d.floating}`).join(' | '));
console.log('  trend first→last', trend.map((t) => `${t.key} ${t.values[0]}→${t.values[t.values.length - 1]}`).join(' | '));
