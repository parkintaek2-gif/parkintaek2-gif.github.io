#!/usr/bin/env node
/**
 * build-korea-deficit-chart.mjs — 한국의 «최대 무역적자 상대국» 가로 막대(2026 상반기).
 * 원천 관세청/KOSIS(금융위 9/9 공지 무관). 값 = 상반기 수지 합(USD bn), 전부 적자라 빨강.
 * 자가시험: node scripts/build-korea-deficit-chart.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'src', 'data', 'trade-country-monthly.json');
const OUT = path.join(ROOT, 'public', 'charts', 'korea-trade-deficit-partners.svg');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// rows: [{label, value(음수), energy(bool)}] — value 오름차순(가장 큰 적자 위)
export function chart(rows) {
  const W = 760, rowH = 34, MT = 30, MB = 14, ML = 150, MR = 70;
  const H = MT + MB + rows.length * rowH;
  const lo = Math.min(...rows.map((r) => r.value), -1);
  const x0 = ML, x1 = W - MR;
  const px = (v) => x1 - (v / lo) * (x1 - x0); // 0 → x1(오른쪽), lo → x0(왼쪽)
  const bars = rows.map((r, i) => {
    const cy = MT + i * rowH + rowH / 2;
    const bx = px(r.value);
    const fill = r.energy ? '#b4472a' : '#7a5a3a'; // 에너지=진빨강, 그 외 적자=갈색
    return `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="14" fill="#222">${esc(r.label)}</text>` +
      `<rect x="${bx.toFixed(1)}" y="${(cy - 10).toFixed(1)}" width="${(x1 - bx).toFixed(1)}" height="20" fill="${fill}"/>` +
      `<text x="${(bx + 6).toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="start" font-size="13" fill="#ffffff">${r.value.toFixed(1)}</text>`;
  }).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia,'Times New Roman',serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${x1}" y="18" text-anchor="end" font-size="12" fill="#555">USD bn · 2026 H1 balance · red = energy</text>
  <line x1="${x1}" y1="${MT - 6}" x2="${x1}" y2="${H - MB + 2}" stroke="#333"/>
  ${bars}
</svg>`;
}

const ENERGY = /saudi|arab emirates|iraq|quatar|qatar|oman|kuwait|algeria|australia|iran|libya|nigeria|kazakhstan/i;

function selfTest() {
  const svg = chart([{ label: 'Saudi', value: -11.6, energy: true }, { label: 'Japan', value: -10.7, energy: false }]);
  const ok = svg.includes('-11.6') && svg.includes('Japan') && svg.includes('<svg');
  if (ok) { console.log('✅ 자가시험 통과'); process.exit(0); }
  console.error('❌ 자가시험 실패'); process.exit(1);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  if (!fs.existsSync(IN)) { console.log('못 만든다 — trade-country-monthly.json 없음'); process.exit(0); }
  const j = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const rows = (j.countries || []).map((c) => {
    const bal = c.months.filter((m) => m.month >= '2026-01').reduce((s, m) => s + m.balance, 0) / 1e6;
    return { label: c.name_en.replace(/\(BR\)|peoples.*|,.*$/i, '').trim(), value: bal, energy: ENERGY.test(c.name_en) };
  }).filter((r) => r.value < 0).sort((a, b) => a.value - b.value).slice(0, 9);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, chart(rows));
  console.log(`✅ 적자 상위 ${rows.length}국 · 1위 ${rows[0].label} ${rows[0].value.toFixed(1)}bn · ${OUT}`);
}

const IS_MAIN = import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === process.argv[1];
if (IS_MAIN) main();
