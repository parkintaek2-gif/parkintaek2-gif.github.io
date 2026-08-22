#!/usr/bin/env node
/**
 * make-import-price-charts.mjs — 수입물가 「환율 요인」 기사용 SVG.
 *
 * 원천: 한국은행 수입물가지수(KOSIS 301 · DT_401Y015), 2020=100.
 *   같은 수입품을 세 기준으로 잰다 — 원화기준·계약통화기준·달러기준.
 *   원화기준과 계약통화기준의 «차이»가 곧 환율이 물가에 얹은 몫이다.
 * 출력: public/charts/import-price-three-bases.svg(선) · import-price-movers.svg(막대)
 *   + src/data/import-price-2607.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const rows = JSON.parse(readFileSync(path.join(ROOT, 'archive', 'raw', 'kosis', 'DT_401Y015.json'), 'utf8')).rows;
const CHARTS = path.join(ROOT, 'public', 'charts');
mkdirSync(CHARTS, { recursive: true });

const periods = [...new Set(rows.map((r) => r.PRD_DE))].sort();
const idx = (item, basis, p) => { const r = rows.find((x) => x.C1_NM === item && x.C2_NM === basis && x.PRD_DE === p); return r ? +r.DT : null; };

const BASES = [
  { ko: '원화기준', en: 'Won', color: '#b4472a' },
  { ko: '계약통화기준', en: 'Contract ccy', color: '#1d4ed8' },
  { ko: '달러기준', en: 'US dollar', color: '#64748b' },
];
const total = BASES.map((b) => ({ ...b, values: periods.map((p) => idx('총지수', b.ko, p)) }));

// 품목별 원화기준 12개월 변화율 상·하위
const first = periods[0], last = periods[periods.length - 1];
const items = [...new Set(rows.map((r) => r.C1_NM))].filter((n) => n !== '총지수');
const EN = { '합성고무': 'Synthetic rubber', '경유': 'Diesel', '제트유': 'Jet fuel', '컴퓨터기억장치': 'Computer memory', '인쇄회로기판및실장기판': 'Printed circuit boards', '인쇄회로기판': 'Bare circuit boards', '기타기초유기화합물': 'Basic organic chemicals', '원당': 'Raw sugar', '제당및전분': 'Refined sugar & starch', '낙농품': 'Dairy', '육가공품및낙농품': 'Processed meat & dairy', '밸브': 'Valves' };
const movers = items.map((n) => {
  const a = idx(n, '원화기준', first), z = idx(n, '원화기준', last);
  if (a == null || z == null || a === 0) return null;
  return { ko: n, en: EN[n] || n, ch: +((z - a) / a * 100).toFixed(1) };
}).filter(Boolean).sort((x, y) => y.ch - x.ch);
const top = movers.slice(0, 7), bottom = movers.slice(-3).reverse();
const bars = top; // 막대엔 상승 품목만(음수 막대는 라벨과 겹친다). 하락은 본문·데이터에 남긴다.

const mlabel = (p) => ({ '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' }[p.slice(4)]) + " '" + p.slice(2, 4);
const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', BG = '#ffffff', POS = '#b4472a', NEG = '#16a34a';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function lineChart() {
  const W = 768, H = 400, ML = 46, MR = 118, MT = 48, MB = 46;
  const iw = W - ML - MR, ih = H - MT - MB;
  const all = total.flatMap((t) => t.values);
  const max = Math.ceil(Math.max(...all) / 10) * 10, min = Math.floor(Math.min(...all) / 10) * 10;
  const x = (i) => ML + (iw * i) / (periods.length - 1);
  const y = (v) => MT + ih * (1 - (v - min) / (max - min));
  let grid = '';
  for (let t = min; t <= max; t += 20) grid += `<line x1="${ML}" y1="${y(t)}" x2="${W - MR}" y2="${y(t)}" stroke="${GRID}"/><text x="${ML - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${SUB}">${t}</text>`;
  let lines = '', labels = '';
  for (const t of total) {
    lines += `<polyline points="${t.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${t.color}" stroke-width="2.5"/>`;
    const yl = y(t.values[t.values.length - 1]);
    labels += `<text x="${W - MR + 6}" y="${yl + 4}" font-size="12" font-weight="700" fill="${t.color}">${t.en} ${t.values[t.values.length - 1]}</text>`;
  }
  let xlab = '';
  periods.forEach((p, i) => { if (i % 2 === 0) xlab += `<text x="${x(i).toFixed(1)}" y="${H - MB + 18}" text-anchor="middle" font-size="11" fill="${SUB}">${mlabel(p)}</text>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Korea import price index on three bases, won versus contract currency versus US dollar, Aug 2025 to Jul 2026">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="${ML}" y="24" font-size="16" font-weight="700" fill="${INK}">The same imports, priced three ways — the won line runs highest</text>
<text x="${ML}" y="40" font-size="12" fill="${SUB}">Korea import price index, 2020 = 100</text>
${grid}${lines}${labels}${xlab}
<text x="${W - 6}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Bank of Korea via KOSIS (301/DT_401Y015)</text>
</svg>`;
}

function barChart() {
  const W = 768, H = 400, ML = 210, MR = 56, MT = 52, MB = 30;
  const iw = W - ML - MR;
  const max = Math.max(...bars.map((b) => Math.abs(b.ch)));
  const step = (H - MT - MB) / bars.length;
  const bh = Math.min(26, step * 0.62);
  const zero = ML, scale = iw / max;
  let out = '';
  bars.forEach((b, i) => {
    const cy = MT + step * i + step / 2, w = b.ch * scale, col = b.ch >= 0 ? POS : NEG;
    out += `<rect x="${(w >= 0 ? zero : zero + w).toFixed(1)}" y="${(cy - bh / 2).toFixed(1)}" width="${Math.abs(w).toFixed(1)}" height="${bh}" fill="${col}" rx="2"/>`;
    out += `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="12.5" fill="${INK}">${esc(b.en)}</text>`;
    out += `<text x="${(zero + w + (w >= 0 ? 6 : -6)).toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="${w >= 0 ? 'start' : 'end'}" font-size="12" font-weight="700" fill="${col}">${b.ch >= 0 ? '+' : ''}${b.ch}%</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Biggest movers in Korea won-basis import prices over the year to July 2026">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="26" font-size="16" font-weight="700" fill="${INK}">What got most expensive to import</text>
<text x="20" y="42" font-size="12" fill="${SUB}">Won-basis import price, 12-month change to Jul 2026 (top risers)</text>
<line x1="${zero}" y1="${MT}" x2="${zero}" y2="${H - MB}" stroke="${SUB}"/>
${out}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Bank of Korea via KOSIS (301/DT_401Y015)</text>
</svg>`;
}

writeFileSync(path.join(CHARTS, 'import-price-three-bases.svg'), lineChart());
writeFileSync(path.join(CHARTS, 'import-price-movers.svg'), barChart());
const chg = (b) => { const a = idx('총지수', b, first), z = idx('총지수', b, last); return { first: a, last: z, pct: +((z - a) / a * 100).toFixed(1) }; };
writeFileSync(path.join(ROOT, 'src', 'data', 'import-price-2607.json'), JSON.stringify({
  source: '한국은행 수입물가지수(기본분류) · KOSIS 301/DT_401Y015 · 2020=100',
  window: { first, last },
  total: { won: chg('원화기준'), contract: chg('계약통화기준'), usd: chg('달러기준') },
  movers: { top, bottom },
}, null, 2));
console.log('✅ import-price charts + data');
console.log('  총지수 12m:', ['원화기준', '계약통화기준', '달러기준'].map((b) => { const c = chg(b); return `${b} ${c.pct}%`; }).join(' | '));
console.log('  top:', top.map((t) => `${t.en} ${t.ch}%`).join(', '));
