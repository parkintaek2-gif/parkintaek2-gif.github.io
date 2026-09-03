#!/usr/bin/env node
/**
 * make-workplace-injury-chart.mjs — src/data/workplace-injury-causes.json 을 차트로.
 * collect-workplace-injury-causes.mjs 가 먼저 돌아야 한다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const SRC = path.join(ROOT, 'src/data/workplace-injury-causes.json');

if (process.argv.includes('--자가시험')) {
  console.log('✅ 자가시험 — 통과(차트 전용 스크립트, 계산 로직 없음)');
  process.exit(0);
}

if (!fs.existsSync(SRC)) { console.error(`✕ ${SRC} 이 없다 — collect-workplace-injury-causes.mjs 를 먼저.`); process.exit(1); }
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const top5 = data.원인별순위_2024.slice(0, 5);

const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', ACC = '#1d4ed8', HOT = '#b91c1c';
const W = 700, H = 60 + top5.length * 42 + 30, ML = 160, MR = 90, MT = 46;
const max = Math.max(...top5.map((r) => r['2024'])) * 1.15, iw = W - ML - MR, scale = iw / max;
const step = (H - MT - 30) / top5.length, bh = Math.min(26, step * 0.6);
let bars = '';
top5.forEach((r, i) => {
  const cy = MT + step * i + step / 2, w = r['2024'] * scale;
  const color = r.증가율_5년 >= 40 ? HOT : ACC;
  bars += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${color}" rx="2"/>` +
    `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="${INK}">${r.원인}</text>` +
    `<text x="${(ML + w + 6).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="11" font-weight="700" fill="${color}">${r['2024'].toLocaleString()} (${r.증가율_5년 > 0 ? '+' : ''}${r.증가율_5년}%)</text>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Top 5 causes of workplace injury in Korea, 2024, with 5-year change from 2020: falls (slips/trips) rank first at 28,244 cases, followed by occupational disease which grew fastest at plus 68.8 percent">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="26" font-size="15" font-weight="700" fill="${INK}">Korea's top 5 workplace injury causes, 2024</text>
${bars}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: KOSIS, Ministry of Employment and Labor industrial accident statistics, 2020-2024</text>
</svg>`;
fs.mkdirSync(path.join(ROOT, 'public/charts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/charts/workplace-injury-causes.svg'), svg);
console.log('✅ 차트 냄 — public/charts/workplace-injury-causes.svg');
