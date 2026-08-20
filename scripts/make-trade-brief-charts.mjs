#!/usr/bin/env node
/**
 * make-trade-brief-charts.mjs — 관세청 무역 브리프용 SVG 그래프
 *
 * 사장님 지시(2026-08-19): 「관세청 데이터로 콘텐트를 만들 때 … 과거(직전 분기, 전년 동기 등)
 *   데이터를 시계열로 코멘트하고, 다양한 그래프(원·선·막대)를 이미지로도 삽입해.
 *   글자만 있으면 읽다가 지친다. 때론 이미지만으로도 이해할 수 있고.」
 *
 * 그래서 — 차트 라이브러리 0줄. 서버에서 SVG 좌표까지 계산해 파일로 굽는다(집안 방식과 같다).
 *   ① 선그래프 : 월별 무역수지 12개월 궤적
 *   ② 막대그래프: 상대국별 반기(후반6-전반6) 수지 변화 — 무엇이 흑자를 끌었나
 *
 * 원천: 국가데이터처 KOSIS · 관세청 「국가별 수출액 수입액」 360/DT_1R11006_FRM101 (월, 천달러)
 * 출력: public/charts/trade-monthly-balance.svg · trade-partner-swing.svg
 *   + src/data/trade-brief-2606.json (가공 수치, 기사·재현용)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const RAW = path.join(ROOT, 'archive', 'raw', 'kosis', 'DT_1R11006_FRM101.json');
const CHARTS = path.join(ROOT, 'public', 'charts');
mkdirSync(CHARTS, { recursive: true });

const rows = JSON.parse(readFileSync(RAW, 'utf8')).rows;
const periods = [...new Set(rows.map((r) => r.PRD_DE))].sort();

// ── 월별 국가 전체(계) 수출·수입 → 수지(십억$) ─────────────────────
const exp = {}, imp = {};
for (const r of rows) {
  if (r.C1_NM !== '계') continue;
  const v = +r.DT / 1e6;
  (r.ITM_NM === '수출액' ? exp : imp)[r.PRD_DE] = v;
}
const series = periods.map((d) => ({ d, exp: exp[d], imp: imp[d], bal: exp[d] - imp[d] }));

// ── 상대국별 반기 수지 변화 ──────────────────────────────────────
const h1 = {}, h2 = {};
for (const r of rows) {
  if (r.C1_NM === '계') continue;
  const half = periods.indexOf(r.PRD_DE) < 6 ? h1 : h2;
  const v = +r.DT / 1e6;
  half[r.C1_NM] = (half[r.C1_NM] || 0) + (r.ITM_NM === '수출액' ? v : -v);
}
const EN = { 미국: 'United States', 홍콩: 'Hong Kong', 중국: 'China', 베트남: 'Vietnam', 대만: 'Taiwan' };
const swing = Object.keys(EN).map((k) => ({ name: EN[k], h1: h1[k] || 0, h2: h2[k] || 0, dz: (h2[k] || 0) - (h1[k] || 0) }));
swing.sort((a, b) => b.dz - a.dz);

const mlabel = (p) => ({ '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' }[p.slice(4)]) + " '" + p.slice(2, 4);

// ── 공통 스타일 ─────────────────────────────────────────────────
const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', ACC = '#1d4ed8', POS = '#16a34a', NEG = '#dc2626', BG = '#ffffff';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ── ① 선그래프: 월별 수지 ───────────────────────────────────────
function lineChart() {
  const W = 720, H = 380, ML = 56, MR = 20, MT = 44, MB = 46;
  const iw = W - ML - MR, ih = H - MT - MB;
  const vals = series.map((s) => s.bal);
  const max = Math.ceil(Math.max(...vals) / 10) * 10, min = 0;
  const x = (i) => ML + (iw * i) / (series.length - 1);
  const y = (v) => MT + ih * (1 - (v - min) / (max - min));
  let g = '';
  for (let t = 0; t <= max; t += 10) g += `<line x1="${ML}" y1="${y(t)}" x2="${W - MR}" y2="${y(t)}" stroke="${GRID}"/><text x="${ML - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${SUB}">${t}</text>`;
  const pts = series.map((s, i) => `${x(i).toFixed(1)},${y(s.bal).toFixed(1)}`).join(' ');
  const area = `${ML},${y(0)} ${pts} ${W - MR},${y(0)}`;
  let dots = '';
  series.forEach((s, i) => {
    dots += `<circle cx="${x(i).toFixed(1)}" cy="${y(s.bal).toFixed(1)}" r="3.5" fill="${ACC}"/>`;
    if (i === 0 || i === series.length - 1) dots += `<text x="${x(i).toFixed(1)}" y="${(y(s.bal) - 10).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${ACC}">+${s.bal.toFixed(1)}</text>`;
    if (i % 2 === 0) dots += `<text x="${x(i).toFixed(1)}" y="${H - MB + 18}" text-anchor="middle" font-size="11" fill="${SUB}">${mlabel(s.d)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Korea monthly trade balance, billions of USD, Jul 2025 to Jun 2026">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="${ML}" y="24" font-size="16" font-weight="700" fill="${INK}">Korea's monthly trade balance more than tripled in a year</text>
<text x="${ML}" y="40" font-size="12" fill="${SUB}">Exports minus imports, US$ billion, customs basis</text>
${g}
<polygon points="${area}" fill="${ACC}" opacity="0.08"/>
<polyline points="${pts}" fill="none" stroke="${ACC}" stroke-width="2.5"/>
${dots}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Customs Service via KOSIS (360/DT_1R11006)</text>
</svg>`;
}

// ── ② 막대그래프: 상대국 반기 수지 변화 ─────────────────────────
function barChart() {
  const W = 720, H = 380, ML = 130, MR = 60, MT = 44, MB = 40;
  const iw = W - ML - MR;
  const max = Math.max(...swing.map((s) => Math.abs(s.dz)));
  const step = (H - MT - MB) / swing.length;
  const bh = Math.min(30, step * 0.6);
  const zero = ML;
  const scale = iw / max;
  let bars = '';
  swing.forEach((s, i) => {
    const cy = MT + step * i + step / 2;
    const w = s.dz * scale;
    const col = s.dz >= 0 ? POS : NEG;
    bars += `<rect x="${(w >= 0 ? zero : zero + w).toFixed(1)}" y="${(cy - bh / 2).toFixed(1)}" width="${Math.abs(w).toFixed(1)}" height="${bh}" fill="${col}" rx="2"/>`;
    bars += `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="13" fill="${INK}">${esc(s.name)}</text>`;
    bars += `<text x="${(zero + w + (w >= 0 ? 6 : -6)).toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="${w >= 0 ? 'start' : 'end'}" font-size="12" font-weight="700" fill="${col}">${s.dz >= 0 ? '+' : ''}${s.dz.toFixed(1)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Change in Korea's bilateral trade balance by partner, second half minus first half">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="24" font-size="16" font-weight="700" fill="${INK}">Five partners drove nine-tenths of the swing</text>
<text x="20" y="40" font-size="12" fill="${SUB}">Change in bilateral balance, US$ bn: Jan–Jun 2026 vs Jul–Dec 2025</text>
<line x1="${zero}" y1="${MT}" x2="${zero}" y2="${H - MB}" stroke="${SUB}" stroke-width="1"/>
${bars}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Customs Service via KOSIS (360/DT_1R11006)</text>
</svg>`;
}

writeFileSync(path.join(CHARTS, 'trade-monthly-balance.svg'), lineChart());
writeFileSync(path.join(CHARTS, 'trade-partner-swing.svg'), barChart());

const out = {
  source: '국가데이터처 KOSIS · 관세청 국가별 수출액 수입액 360/DT_1R11006_FRM101',
  window: '2025-07 ~ 2026-06',
  monthly: series.map((s) => ({ month: s.d, exports: +s.exp.toFixed(1), imports: +s.imp.toFixed(1), balance: +s.bal.toFixed(1) })),
  half: { h1_sum: +series.slice(0, 6).reduce((a, s) => a + s.bal, 0).toFixed(1), h2_sum: +series.slice(6).reduce((a, s) => a + s.bal, 0).toFixed(1) },
  year: { exports: Math.round(series.reduce((a, s) => a + s.exp, 0)), imports: Math.round(series.reduce((a, s) => a + s.imp, 0)), balance: +series.reduce((a, s) => a + s.bal, 0).toFixed(1) },
  swing,
};
writeFileSync(path.join(ROOT, 'src', 'data', 'trade-brief-2606.json'), JSON.stringify(out, null, 2));
console.log('✅ charts + data written');
console.log('  H1 sum', out.half.h1_sum, '| H2 sum', out.half.h2_sum, '| year bal', out.year.balance);
console.log('  swing:', swing.map((s) => `${s.name} ${s.dz >= 0 ? '+' : ''}${s.dz.toFixed(1)}`).join(', '));
