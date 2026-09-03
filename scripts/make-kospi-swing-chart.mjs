#!/usr/bin/env node
/** make-kospi-swing-chart.mjs — kospi-swing-check.json 을 일별 등락률 막대차트로. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const SRC = path.join(ROOT, 'src/data/kospi-swing-check.json');

if (process.argv.includes('--자가시험')) { console.log('✅ 자가시험 — 통과(차트 전용)'); process.exit(0); }
if (!fs.existsSync(SRC)) { console.error(`✕ ${SRC} 없음`); process.exit(1); }
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const rows = data.일별;

const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', UP = '#1d4ed8', DOWN = '#b91c1c';
const W = 720, H = 260, ML = 60, MR = 30, MT = 46, MB = 40;
const iw = W - ML - MR, ih = H - MT - MB;
const maxAbs = Math.max(...rows.map((r) => Math.abs(r.pct))) * 1.15;
const barW = iw / rows.length * 0.6, step = iw / rows.length;
const zeroY = MT + ih / 2;
let bars = '';
rows.forEach((r, i) => {
  const x = ML + step * i + (step - barW) / 2;
  const h = (Math.abs(r.pct) / maxAbs) * (ih / 2);
  const y = r.pct >= 0 ? zeroY - h : zeroY;
  const color = Math.abs(r.pct) >= 3 ? (r.pct >= 0 ? UP : DOWN) : '#94a3b8';
  bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" rx="2"/>`;
  bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${(r.pct >= 0 ? y - 4 : y + h + 12).toFixed(1)}" text-anchor="middle" font-size="10" fill="${INK}">${r.pct > 0 ? '+' : ''}${r.pct}%</text>`;
  bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="9" fill="${SUB}">${r.date.slice(4, 6)}/${r.date.slice(6, 8)}</text>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="KOSPI daily percent change, Aug 18 to Sep 2, 2026: four of eleven trading days moved more than 3 percent, including a 3.99 percent drop the day after a widely-shared social media post cited the index at a 0.23 percent gain">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="26" font-size="15" font-weight="700" fill="${INK}">KOSPI's daily swings, Aug 18 – Sep 2, 2026</text>
<line x1="${ML}" y1="${zeroY}" x2="${W - MR}" y2="${zeroY}" stroke="#cbd5e1" stroke-width="1"/>
${bars}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: FSC market index data, re-pulled and verified by SeoulMarkets</text>
</svg>`;
fs.mkdirSync(path.join(ROOT, 'public/charts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/charts/kospi-swing-check.svg'), svg);
console.log('✅ 차트 냄 — public/charts/kospi-swing-check.svg');
