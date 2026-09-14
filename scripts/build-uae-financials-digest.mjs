#!/usr/bin/env node
/**
 * build-uae-financials-digest.mjs — ADX(collect-uae-adx-financials.mjs)와
 * DFM(collect-dubai-dfm-financials.mjs)이 종목별로 흩어 둔 재무 요약을 손님이 받는
 * CSV 한 장으로 묶는다. (같은 패턴: build-uae-disclosures-digest.mjs 참고)
 *
 * 🔴 [2026-09-14 18:xx · 5번 지침] DFM 재무제표를 여기 합친다 — 칸 이름은 ADX 와
 * «똑같이» 맞춘다(symbol·date·period·revenueAED·expenseAED·netProfitAED·eps·
 * cashAndEquivalentsAED). 두 거래소가 칸이 다르면 손님이 한 표로 못 쓴다.
 * exchange 열만 하나 앞에 더 붙인다(uae-adx-board-2026-09-14.csv 와 같은 관례).
 *
 * ⛔ DFM: expenseAED·cashAndEquivalentsAED 없음(회사마다 라벨이 달라 자신 있게 하나로
 *   못 골랐다 — collect-dubai-dfm-financials.mjs 헤더 주석 참고). 둘 다 «못 잰 건
 *   못 쟀다»로 빈 칸으로 둔다 — 있는 척 채우지 않는다.
 *
 * 🔴 [2026-09-14 21:5x · 5번] ADX 대차대조표(collect-uae-adx-balance-sheet.mjs)가
 * archive/raw/uae-adx-financials/<종목>.json 의 각 quarter 에 여섯 칸을 덧붙였다 —
 * totalAssetsAED·totalLiabilitiesAED·totalEquityAED·balanceSheetReconciled·
 * liabilitiesDerived·unitHint·balanceSheetReason. DFM 은 아직 대차대조표가 없어 이
 * 여섯 칸은 항상 빈 칸이다. ⛔ liabilitiesDerived=true 인 줄의 totalLiabilitiesAED
 * 는 «읽은 값»이 아니라 자산−자본으로 뺀 값이다 — 반드시 그 칸과 «같이» 낸다,
 * 감춰서 읽은 값처럼 보이게 하지 않는다.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ADX_DIR = path.resolve('archive/raw/uae-adx-financials');
const DFM_DIR = path.resolve('archive/raw/dubai-dfm-financials');
const OUT_DIR = path.resolve('src/data/full');

function csv셀(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function csv줄(cols) { return cols.map(csv셀).join(','); }
function 오늘날짜() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

function 거래소읽기(dir, 거래소이름) {
  let 종목수 = 0; let 분기수 = 0; const 행 = [];
  if (!existsSync(dir)) return { 행, 종목수, 분기수 };
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== '_coverage.json')) {
    const j = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
    const symbol = j._meta?.symbol ?? f.replace(/\.json$/, '');
    종목수 += 1;
    for (const q of (j.quarters ?? [])) {
      분기수 += 1;
      행.push([
        거래소이름, symbol, q.date, q.title, q.period, q.priorPeriod,
        q.revenue, q.expense, q.netProfit, q.eps, q.cashAndEquivalents,
        q.totalAssets ?? '', q.totalLiabilities ?? '', q.totalEquity ?? '',
        q.balanceSheetReconciled ?? '', q.liabilitiesDerived ?? '', q.unitHint ?? '', q.balanceSheetReason ?? '',
        q.engPdfUrl,
      ]);
    }
  }
  return { 행, 종목수, 분기수 };
}

function main() {
  if (!existsSync(ADX_DIR) && !existsSync(DFM_DIR)) { console.error('⛔ 못 쟀다 — 원본이 없다. 수집기를 먼저 돌린다'); process.exit(1); }
  const adx = 거래소읽기(ADX_DIR, 'ADX');
  const dfm = 거래소읽기(DFM_DIR, 'DFM');
  const 행 = [[
    'exchange', 'symbol', 'date', 'title', 'period', 'priorPeriod',
    'revenueAED', 'expenseAED', 'netProfitAED', 'eps', 'cashAndEquivalentsAED',
    'totalAssetsAED', 'totalLiabilitiesAED', 'totalEquityAED',
    'balanceSheetReconciled', 'liabilitiesDerived', 'unitHint', 'balanceSheetReason',
    'engPdfUrl',
  ], ...adx.행, ...dfm.행];
  if (행.length <= 1) { console.error('⛔ 못 쟀다 — 분기 데이터가 하나도 없다'); process.exit(1); }
  const 날짜 = 오늘날짜();
  const 파일 = path.join(OUT_DIR, `uae-financials-digest-${날짜}.csv`);
  writeFileSync(파일, 행.map(csv줄).join('\r\n') + '\r\n');
  console.log(`ADX  종목 ${adx.종목수}개 · 분기 ${adx.분기수}행`);
  console.log(`DFM  종목 ${dfm.종목수}개 · 분기 ${dfm.분기수}행`);
  console.log(`✅ 합계 ${adx.분기수 + dfm.분기수}행 → ${path.relative(process.cwd(), 파일)}`);
  console.log(`\n⚠ licence-datasets.mjs 의 파일명을 이 날짜(${날짜})로 맞춘다.`);
}
main();
