#!/usr/bin/env node
/**
 * make-ppi-chip-charts.mjs — 생산자물가 「평균 뒤의 반도체」 기사용 SVG.
 *
 * 원천: 한국은행 생산자물가지수(KOSIS 301 · DT_404Y014), 2020=100.
 *   총지수는 +7.7%뿐인데 집적회로·메모리·반도체가 그 밑에서 폭등했다. 평균이 격차를 가린다.
 * 출력: public/charts/ppi-chips-vs-total.svg(선) · ppi-top-risers.svg(막대)
 *   + src/data/ppi-chip-2607.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const rows = JSON.parse(readFileSync(path.join(ROOT, 'archive', 'raw', 'kosis', 'DT_404Y014.json'), 'utf8')).rows;
const CHARTS = path.join(ROOT, 'public', 'charts');
mkdirSync(CHARTS, { recursive: true });

const periods = [...new Set(rows.map((r) => r.PRD_DE))].sort();
const val = (item, p) => { const r = rows.find((x) => x.C1_NM === item && x.PRD_DE === p); return r ? +r.DT : null; };

const LINES = [
  { ko: '집적회로', en: 'Integrated circuits', color: '#b4472a' },
  { ko: '컴퓨터기억장치', en: 'Memory', color: '#1d4ed8' },
  { ko: '반도체', en: 'Semiconductors', color: '#16a34a' },
  { ko: '총지수', en: 'All producer prices', color: '#94a3b8' },
];
const series = LINES.map((l) => ({ ...l, values: periods.map((p) => val(l.ko, p)) }));

const first = periods[0], last = periods[periods.length - 1];
const items = [...new Set(rows.map((r) => r.C1_NM))].filter((n) => n !== '총지수');
const EN = { '집적회로': 'Integrated circuits', '컴퓨터기억장치': 'Computer memory', '기타석유정제제품': 'Other refined petroleum', '반도체': 'Semiconductors', '윤활유및기타석유정제품': 'Lubricants & refined oil', '컴퓨터및주변기기': 'Computers & peripherals', '식용임산물': 'Edible forest products', '임산물': 'Forest products', '채소': 'Vegetables', '채소및과실': 'Vegetables & fruit' };
const movers = items.map((n) => { const a = val(n, first), z = val(n, last); if (a == null || z == null || a === 0) return null; return { ko: n, en: EN[n] || n, ch: +((z - a) / a * 100).toFixed(1) }; }).filter(Boolean).sort((x, y) => y.ch - x.ch);
const top = movers.slice(0, 6), bottom = movers.slice(-4).reverse();

const mlabel = (p) => ({ '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' }[p.slice(4)]) + " '" + p.slice(2, 4);
const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', BG = '#ffffff', POS = '#b4472a';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function lineChart() {
  const W = 768, H = 410, ML = 46, MR = 150, MT = 48, MB = 46;
  const iw = W - ML - MR, ih = H - MT - MB;
  const all = series.flatMap((t) => t.values);
  const max = Math.ceil(Math.max(...all) / 50) * 50, min = 50;
  const x = (i) => ML + (iw * i) / (periods.length - 1);
  const y = (v) => MT + ih * (1 - (v - min) / (max - min));
  let grid = '';
  for (let t = min; t <= max; t += 50) grid += `<line x1="${ML}" y1="${y(t)}" x2="${W - MR}" y2="${y(t)}" stroke="${GRID}"/><text x="${ML - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${SUB}">${t}</text>`;
  let lines = '', labels = '', placed = [];
  for (const t of series) {
    lines += `<polyline points="${t.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${t.color}" stroke-width="2.5"/>`;
    let yl = y(t.values[t.values.length - 1]);
    while (placed.some((p) => Math.abs(p - yl) < 15)) yl += 15; // 라벨 겹침 방지
    placed.push(yl);
    labels += `<text x="${W - MR + 6}" y="${yl + 4}" font-size="12" font-weight="700" fill="${t.color}">${t.en}</text>`;
  }
  let xlab = '';
  periods.forEach((p, i) => { if (i % 2 === 0) xlab += `<text x="${x(i).toFixed(1)}" y="${H - MB + 18}" text-anchor="middle" font-size="11" fill="${SUB}">${mlabel(p)}</text>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Korea producer price index: integrated circuits, memory and semiconductors soar while the overall index stays flat, Aug 2025 to Jul 2026">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="${ML}" y="24" font-size="16" font-weight="700" fill="${INK}">Producer prices barely moved — chip prices left the chart</text>
<text x="${ML}" y="40" font-size="12" fill="${SUB}">Korea producer price index, 2020 = 100</text>
${grid}${lines}${labels}${xlab}
<text x="${W - 6}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Bank of Korea via KOSIS (301/DT_404Y014)</text>
</svg>`;
}

function barChart() {
  const W = 768, H = 380, ML = 220, MR = 60, MT = 52, MB = 30;
  const iw = W - ML - MR;
  const max = Math.max(...top.map((b) => b.ch));
  const step = (H - MT - MB) / top.length;
  const bh = Math.min(30, step * 0.62);
  const scale = iw / max;
  let out = '';
  top.forEach((b, i) => {
    const cy = MT + step * i + step / 2, w = b.ch * scale;
    out += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${POS}" rx="2"/>`;
    out += `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="12.5" fill="${INK}">${esc(b.en)}</text>`;
    out += `<text x="${(ML + w + 6).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="12" font-weight="700" fill="${POS}">+${b.ch}%</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Biggest risers in Korea producer prices over the year to July 2026, led by integrated circuits and memory">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="26" font-size="16" font-weight="700" fill="${INK}">The risers are almost all silicon</text>
<text x="20" y="42" font-size="12" fill="${SUB}">Producer price, 12-month change to Jul 2026 (top risers)</text>
${out}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Bank of Korea via KOSIS (301/DT_404Y014)</text>
</svg>`;
}

writeFileSync(path.join(CHARTS, 'ppi-chips-vs-total.svg'), lineChart());
writeFileSync(path.join(CHARTS, 'ppi-top-risers.svg'), barChart());
const chg = (n) => { const a = val(n, first), z = val(n, last); return { first: a, last: z, pct: +((z - a) / a * 100).toFixed(1) }; };
writeFileSync(path.join(ROOT, 'src', 'data', 'ppi-chip-2607.json'), JSON.stringify({
  source: '한국은행 생산자물가지수(기본분류) · KOSIS 301/DT_404Y014 · 2020=100',
  window: { first, last },
  total: chg('총지수'), ic: chg('집적회로'), memory: chg('컴퓨터기억장치'), semiconductor: chg('반도체'),
  top, bottom,
}, null, 2));
console.log('✅ ppi chip charts + data');
console.log('  총지수', chg('총지수').pct + '%', '| IC', chg('집적회로').pct + '%', '| 메모리', chg('컴퓨터기억장치').pct + '%', '| 반도체', chg('반도체').pct + '%');
console.log('  bottom:', bottom.map((b) => `${b.en} ${b.ch}%`).join(', '));
