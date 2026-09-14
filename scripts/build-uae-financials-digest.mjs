#!/usr/bin/env node
/**
 * build-uae-financials-digest.mjs — collect-uae-adx-financials.mjs 가 종목별로 흩어 둔
 * 재무 요약(archive/raw/uae-adx-financials/*.json)을 손님이 받는 CSV 한 장으로 묶는다.
 * (같은 패턴: build-uae-disclosures-digest.mjs 참고)
 *
 * ⛔ Total Assets · Total Equity 는 없다 — collect-uae-adx-financials.mjs 헤더 주석 참고
 *   (ADX 의 AI 요약 자체가 손익 위주다. 대차대조표 항목은 아직 못 뽑았다).
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('archive/raw/uae-adx-financials');
const OUT_DIR = path.resolve('src/data/full');

function csv셀(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function csv줄(cols) { return cols.map(csv셀).join(','); }
function 오늘날짜() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

function main() {
  if (!existsSync(SRC_DIR)) { console.error('⛔ 못 쟀다 — 원본이 없다. collect-uae-adx-financials.mjs 를 먼저 돌린다'); process.exit(1); }
  const 행 = [['symbol', 'date', 'title', 'period', 'priorPeriod', 'revenueAED', 'expenseAED', 'netProfitAED', 'eps', 'cashAndEquivalentsAED', 'engPdfUrl']];
  let 종목수 = 0; let 분기수 = 0;
  for (const f of readdirSync(SRC_DIR).filter((f) => f.endsWith('.json') && f !== '_coverage.json')) {
    const j = JSON.parse(readFileSync(path.join(SRC_DIR, f), 'utf8'));
    const symbol = j._meta?.symbol ?? f.replace(/\.json$/, '');
    종목수 += 1;
    for (const q of (j.quarters ?? [])) {
      분기수 += 1;
      행.push([symbol, q.date, q.title, q.period, q.priorPeriod, q.revenue, q.expense, q.netProfit, q.eps, q.cashAndEquivalents, q.engPdfUrl]);
    }
  }
  if (행.length <= 1) { console.error('⛔ 못 쟀다 — 분기 데이터가 하나도 없다'); process.exit(1); }
  const 날짜 = 오늘날짜();
  const 파일 = path.join(OUT_DIR, `uae-adx-financials-digest-${날짜}.csv`);
  writeFileSync(파일, 행.map(csv줄).join('\r\n') + '\r\n');
  console.log(`✅ 종목 ${종목수}개 · 분기 ${분기수}행 → ${path.relative(process.cwd(), 파일)}`);
  console.log(`\n⚠ licence-datasets.mjs 의 파일명을 이 날짜(${날짜})로 맞춘다.`);
}
main();
