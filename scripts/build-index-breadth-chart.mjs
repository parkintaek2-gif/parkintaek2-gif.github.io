#!/usr/bin/env node
/**
 * build-index-breadth-chart.mjs — «고점 이후 섹터별 등락» 발산 막대차트.
 *
 * ── 왜 (2026-08-26) ───────────────────────────────────────────
 * 「랠리는 좁았고 조정은 넓다」 기사가 분포 이야기인데 시각자료가 없었다. home-charts.json 의
 * sectors(6/22 고점 이후 섹터별 % 변화)를 발산 막대로 그려 «리더가 가장 크게 빠졌다»를 한눈에 보인다.
 *
 * ── ⚠ 정직 규칙 ───────────────────────────────────────────────
 * · 값은 home-charts.json 그대로(2026-08-03 기준). 스케일 무관 % 변화.
 * · 0선을 명확히. 음수는 왼쪽, 양수는 오른쪽. 정렬은 값 오름차순(가장 많이 빠진 것이 위).
 *
 * 출력: public/charts/korea-index-breadth-since-peak.svg
 * 자가시험: node scripts/build-index-breadth-chart.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'src', 'data', 'home-charts.json');
const OUT = path.join(ROOT, 'public', 'charts', 'korea-index-breadth-since-peak.svg');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function chart(sectors) {
  const rows = [...sectors].sort((a, b) => a.value - b.value); // 가장 많이 빠진 것 위
  const W = 760, rowH = 34, MT = 24, MB = 28, ML = 200, MR = 60;
  const H = MT + MB + rows.length * rowH;
  const vals = rows.map((r) => r.value);
  const lo = Math.min(-1, ...vals), hi = Math.max(1, ...vals);
  const span = hi - lo;
  const x0 = ML, x1 = W - MR;
  const px = (v) => x0 + ((v - lo) / span) * (x1 - x0);
  const zx = px(0);
  const bars = rows.map((r, i) => {
    const cy = MT + i * rowH + rowH / 2;
    const bx = px(r.value);
    const neg = r.value < 0;
    const rx = neg ? bx : zx, rw = Math.abs(bx - zx);
    const fill = neg ? '#b4472a' : '#2b6f4a';
    // 음수 라벨은 막대 «안쪽»(왼쪽 끝 오른쪽, 흰 글자) — 섹터 이름과 안 겹치게. 양수는 막대 바깥 오른쪽(진한 글자).
    const lblX = neg ? bx + 6 : bx + 6;
    const lblFill = neg ? '#ffffff' : '#222';
    return `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="14" fill="#222">${esc(r.label)}</text>` +
      `<rect x="${rx.toFixed(1)}" y="${(cy - 10).toFixed(1)}" width="${rw.toFixed(1)}" height="20" fill="${fill}"/>` +
      `<text x="${lblX.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="start" font-size="13" fill="${lblFill}">${r.value > 0 ? '+' : ''}${r.value.toFixed(1)}%</text>`;
  }).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia,'Times New Roman',serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <line x1="${zx.toFixed(1)}" y1="${MT - 6}" x2="${zx.toFixed(1)}" y2="${H - MB + 6}" stroke="#333"/>
  ${bars}
</svg>`;
}

function selfTest() {
  const svg = chart([{ label: 'A', value: -40.5 }, { label: 'B', value: 6.1 }, { label: 'C', value: 0.1 }]);
  const ok = svg.includes('-40.5%') && svg.includes('+6.1%') && svg.includes('<svg') && svg.includes('B') ;
  if (ok) { console.log('✅ 자가시험 통과'); process.exit(0); }
  console.error('❌ 자가시험 실패'); process.exit(1);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  if (!fs.existsSync(IN)) { console.log('못 만든다 — home-charts.json 없음'); process.exit(0); }
  const j = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const sectors = j.sectors || [];
  if (!sectors.length) { console.log('못 만든다 — sectors 0'); process.exit(0); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, chart(sectors));
  console.log(`✅ ${sectors.length}개 섹터 · ${OUT} (기준 ${j.to})`);
}

main();
