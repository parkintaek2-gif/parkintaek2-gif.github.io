#!/usr/bin/env node
/**
 * make-oil-charts.mjs — KRX 석유시장 기사용 SVG 그래프 (라이브러리 0, 집안 방식).
 * 사장님 8/19 규칙: 데이터 콘텐트엔 시계열 + 그래프 이미지.
 *
 * 원천: KRX 석유시장 일별(archive/raw/commodities/*.ndjson, 시장="석유", 2020~2026).
 * 출력: public/charts/oil-volume-by-type.svg · oil-spread-direction.svg
 *   + src/data/oil-market-2026.json (가공 수치)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const DIR = path.join(ROOT, 'archive', 'raw', 'commodities');
const CH = path.join(ROOT, 'public', 'charts');
mkdirSync(CH, { recursive: true });

const TYPES = ['경유', '등유', '휘발유'];
const EN = { 경유: 'Diesel', 등유: 'Kerosene', 휘발유: 'Petrol' };
const agg = {};
for (const t of TYPES) agg[t] = { volByYear: {}, spreads: [], dearer: 0, cheaper: 0, compEmpty: 0, days: 0 };

for (const f of readdirSync(DIR).filter((x) => x.endsWith('.ndjson')).sort()) {
  for (const l of readFileSync(path.join(DIR, f), 'utf8').split(/\r?\n/)) {
    if (!l || !l.includes('석유')) continue;
    let o; try { o = JSON.parse(l); } catch { continue; }
    if (o.시장 !== '석유' || !agg[o.유종]) continue;
    const b = agg[o.유종], y = o.일자.slice(0, 4);
    b.days++;
    b.volByYear[y] = (b.volByYear[y] || 0) + (o.거래량 || 0);
    const c = o.경쟁가중평균, n = o.협의가중평균;
    if (!c || c === 0) b.compEmpty++;
    if (c > 0 && n > 0) { b.spreads.push(n - c); if (n > c) b.dearer++; else if (n < c) b.cheaper++; }
  }
}

const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025']; // 완결 연도만(2026 부분)
const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', BG = '#ffffff';
const COL = { 경유: '#1d4ed8', 등유: '#b45309', 휘발유: '#16a34a' };

// ── ① 유종별 거래량 추이(백만 L) ─────────────────────────────
function volChart() {
  const W = 720, H = 380, ML = 60, MR = 96, MT = 46, MB = 42;
  const iw = W - ML - MR, ih = H - MT - MB;
  const series = TYPES.map((t) => YEARS.map((y) => (agg[t].volByYear[y] || 0) / 1e6));
  const max = Math.ceil(Math.max(...series.flat()) / 500) * 500, min = 0;
  const x = (i) => ML + (iw * i) / (YEARS.length - 1);
  const y = (v) => MT + ih * (1 - (v - min) / (max - min));
  let g = '';
  for (let t = 0; t <= max; t += 1000) g += `<line x1="${ML}" y1="${y(t)}" x2="${W - MR}" y2="${y(t)}" stroke="${GRID}"/><text x="${ML - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${SUB}">${t}</text>`;
  YEARS.forEach((yr, i) => { g += `<text x="${x(i)}" y="${H - MB + 18}" text-anchor="middle" font-size="12" fill="${SUB}">${yr}</text>`; });
  let lines = '';
  TYPES.forEach((t, k) => {
    const pts = series[k].map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    lines += `<polyline points="${pts}" fill="none" stroke="${COL[t]}" stroke-width="2.5"/>`;
    series[k].forEach((v, i) => { lines += `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="${COL[t]}"/>`; });
    const ly = y(series[k][series[k].length - 1]);
    lines += `<text x="${W - MR + 8}" y="${(ly + 4).toFixed(1)}" font-size="13" font-weight="700" fill="${COL[t]}">${EN[t]}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Korea oil-exchange volume by fuel, million litres, 2020-2025">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="${ML}" y="24" font-size="16" font-weight="700" fill="${INK}">Diesel is draining off Korea's oil exchange</text>
<text x="${ML}" y="40" font-size="12" fill="${SUB}">Traded volume by fuel, million litres a year, KRX oil market</text>
${g}${lines}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Exchange oil market (daily), 2020-2025</text>
</svg>`;
}

// ── ② 협의가 경쟁보다 비쌌던 날의 비율(방향이 반반이면 «스프레드»가 아니다) ──
function spreadChart() {
  const W = 720, H = 320, ML = 130, MR = 60, MT = 52, MB = 40;
  const iw = W - ML - MR;
  const step = (H - MT - MB) / TYPES.length;
  const bh = Math.min(34, step * 0.5);
  let bars = '';
  TYPES.forEach((t, i) => {
    const b = agg[t], tot = b.dearer + b.cheaper;
    const pct = tot ? (100 * b.dearer) / tot : 0;
    const cy = MT + step * i + step / 2;
    const wFull = iw, wDear = (wFull * pct) / 100;
    bars += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${wFull}" height="${bh}" fill="${GRID}" rx="3"/>`;
    bars += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${wDear.toFixed(1)}" height="${bh}" fill="${COL[t]}" rx="3"/>`;
    bars += `<line x1="${ML + wFull / 2}" y1="${cy - bh / 2 - 4}" x2="${ML + wFull / 2}" y2="${cy + bh / 2 + 4}" stroke="${INK}" stroke-dasharray="3 3"/>`;
    bars += `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="13" fill="${INK}">${EN[t]}</text>`;
    bars += `<text x="${(ML + wDear + 8).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="12" font-weight="700" fill="${COL[t]}">${pct.toFixed(0)}%</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Share of days the negotiated price beat the competitive price, by fuel">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="24" font-size="16" font-weight="700" fill="${INK}">The negotiated book is dearer barely more than half the time</text>
<text x="20" y="40" font-size="12" fill="${SUB}">Share of trading days the negotiated price was above the competitive price (dashed = 50%)</text>
${bars}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Exchange oil market, 2020-2026</text>
</svg>`;
}

writeFileSync(path.join(CH, 'oil-volume-by-type.svg'), volChart());
writeFileSync(path.join(CH, 'oil-spread-direction.svg'), spreadChart());

const out = {};
for (const t of TYPES) {
  const b = agg[t], s = b.spreads, mean = s.reduce((a, x) => a + x, 0) / (s.length || 1);
  const sorted = [...s].sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)] || 0;
  out[EN[t]] = {
    days: b.days, comp_empty_days: b.compEmpty, comp_empty_pct: +(100 * b.compEmpty / b.days).toFixed(1),
    spread_mean_won: +mean.toFixed(2), spread_median_won: +med.toFixed(2),
    spread_min: +Math.min(...s).toFixed(2), spread_max: +Math.max(...s).toFixed(2),
    dearer_days: b.dearer, cheaper_days: b.cheaper,
    dearer_pct: +(100 * b.dearer / (b.dearer + b.cheaper)).toFixed(1),
    vol_2020_ML: Math.round(b.volByYear['2020'] / 1e6), vol_2025_ML: Math.round(b.volByYear['2025'] / 1e6),
    vol_change_pct: +(100 * (b.volByYear['2025'] - b.volByYear['2020']) / b.volByYear['2020']).toFixed(1),
  };
}
out._source = 'Korea Exchange oil market (daily), archive/raw/commodities, 2020-01 to 2026-08';
writeFileSync(path.join(ROOT, 'src', 'data', 'oil-market-2026.json'), JSON.stringify(out, null, 2));
console.log('✅ charts + data');
for (const t of TYPES) console.log(`  ${EN[t]}: vol ${out[EN[t]].vol_2020_ML}→${out[EN[t]].vol_2025_ML}M (${out[EN[t]].vol_change_pct}%) · spread med ${out[EN[t]].spread_median_won} · dearer ${out[EN[t]].dearer_pct}% · comp-empty ${out[EN[t]].comp_empty_pct}%`);
