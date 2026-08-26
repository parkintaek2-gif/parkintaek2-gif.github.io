#!/usr/bin/env node
/**
 * build-korea-us-balance-chart.mjs — 한국의 대미국 «월별 무역수지» 막대차트.
 * china 차트의 chart() 를 그대로 재사용(DRY). 원천 관세청/KOSIS(금융위 9/9 공지 무관).
 * 자가시험: node scripts/build-korea-us-balance-chart.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chart } from './build-korea-china-balance-chart.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'src', 'data', 'trade-country-monthly.json');
const OUT = path.join(ROOT, 'public', 'charts', 'korea-us-trade-balance.svg');

function main() {
  if (process.argv.includes('--self-test')) {
    const svg = chart([{ m: '2025-07', bal: 3.91 }, { m: '2026-06', bal: 12.10 }]);
    const ok = svg.includes('+3.9') && svg.includes('+12.1') && svg.includes('<svg');
    if (ok) { console.log('✅ 자가시험 통과'); process.exit(0); }
    console.error('❌ 자가시험 실패'); process.exit(1);
  }
  if (!fs.existsSync(IN)) { console.log('못 만든다 — trade-country-monthly.json 없음'); process.exit(0); }
  const j = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const us = (j.countries || []).find((c) => /^u\.?s\.?a/i.test(c.name_en) || /united states/i.test(c.name_en));
  if (!us) { console.log('못 만든다 — 미국 없음'); process.exit(0); }
  const series = us.months.map((m) => ({ m: m.month, bal: m.balance / 1e6 }));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, chart(series));
  const last = series[series.length - 1];
  console.log(`✅ 대미 월별수지 ${series.length}개월 · 최신 ${last.m} +${last.bal.toFixed(2)}bn · ${OUT}`);
}

main();
