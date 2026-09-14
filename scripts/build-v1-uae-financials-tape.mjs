#!/usr/bin/env node
/**
 * build-v1-uae-financials-tape.mjs — `/v1/uae-financials` 가 내줄 표를 짓는다.
 * ─────────────────────────────────────────────────────────────────────────
 * 한국 쪽(/v1/financials·consensus·indices)과 같은 이중 배달 — CSV(licence-datasets.mjs
 * 의 uae-financials)와 JSON API 를 «같은 원자료»에서 함께 낸다. 우물은
 * build-uae-financials-digest.mjs 와 동일: archive/raw/uae-adx-financials +
 * archive/raw/dubai-dfm-financials.
 *
 * 🔴 [2026-09-14 21:5x · 5번] 「/v1 갈래와 CSV 에 새 칸 여섯을 실어 주십시오」 —
 * 대차대조표 여섯 칸(totalAssets·totalLiabilities·totalEquity·balanceSheetReconciled·
 * liabilitiesDerived·unitHint)을 CSV 에 이미 실었고(build-uae-financials-digest.mjs),
 * 이 자가 그 나머지 절반(JSON API)이다.
 *
 * ⛔ liabilitiesDerived=true 인 줄의 totalLiabilities 는 «읽은 값»이 아니라 자산−자본
 *   으로 뺀 값이다 — API 응답에도 그 칸을 반드시 같이 낸다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const ADX_DIR = path.join(뿌리, 'archive/raw/uae-adx-financials');
const DFM_DIR = path.join(뿌리, 'archive/raw/dubai-dfm-financials');
const 낼곳 = path.join(뿌리, 'src/data/uae-financials-tape.json');

/** raw quarter 객체(수집기 그대로) → API 가 낼 한 줄. exchange·symbol 은 밖에서 붙인다. */
export function 한줄(q, exchange, symbol) {
  return {
    exchange,
    symbol,
    date: q.date ?? null,
    title: q.title ?? null,
    period: q.period ?? null,
    prior_period: q.priorPeriod ?? null,
    revenue_aed: q.revenue ?? null,
    expense_aed: q.expense ?? null,
    net_profit_aed: q.netProfit ?? null,
    eps: q.eps ?? null,
    cash_and_equivalents_aed: q.cashAndEquivalents ?? null,
    total_assets_aed: q.totalAssets ?? null,
    total_liabilities_aed: q.totalLiabilities ?? null,
    total_equity_aed: q.totalEquity ?? null,
    balance_sheet_reconciled: q.balanceSheetReconciled ?? null,
    liabilities_derived: q.liabilitiesDerived ?? null,
    unit_hint: q.unitHint ?? null,
    balance_sheet_reason: q.balanceSheetReason ?? null,
    eng_pdf_url: q.engPdfUrl ?? null,
  };
}

function 거래소읽기(dir, exchange) {
  const 행 = []; const 종목들 = new Set();
  if (!fs.existsSync(dir)) return { 행, 종목들 };
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== '_coverage.json')) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const symbol = j._meta?.symbol ?? f.replace(/\.json$/, '');
    const quarters = j.quarters ?? [];
    if (quarters.length) 종목들.add(symbol);
    for (const q of quarters) 행.push(한줄(q, exchange, symbol));
  }
  return { 행, 종목들 };
}

export function 짓기() {
  const adx = 거래소읽기(ADX_DIR, 'ADX');
  const dfm = 거래소읽기(DFM_DIR, 'DFM');
  const rows = [...adx.행, ...dfm.행];
  const 대차대조표있음 = rows.filter((r) => r.balance_sheet_reconciled || r.liabilities_derived).length;
  return {
    _meta: {
      source: 'ADX company disclosure feed (aiJsonDataEn) + ADX/DFM filed PDFs (pdftotext -table)',
      built_at: new Date().toISOString(),
      rows: rows.length,
      adx_companies_with_data: adx.종목들.size,
      adx_etf_note: 'ADX lists 96 symbols; the rest are ETFs with no income statement and contribute 0 rows here.',
      dfm_companies_with_data: dfm.종목들.size,
      dfm_scanned_note: 'DFM filers whose statements are scanned images (no extractable text) are excluded, not zero-filled.',
      balance_sheet_rows: 대차대조표있음,
      balance_sheet_note: 'total_assets_aed/total_liabilities_aed/total_equity_aed are published only where assets = liabilities + equity reconciles, or liabilities is derived as assets - equity (flagged via liabilities_derived).',
      not_this: [
        'Not audited figures — ADX rows are the exchange’s own AI summary, DFM rows are parsed directly from the filed PDF by us.',
        'unit_hint carries the unit as printed in the filing (e.g. AED’000) — figures are never rescaled.',
        'Not investment advice, not a trading signal.',
      ],
    },
    rows,
  };
}

function 자가시험() {
  const 흠 = [];
  const 재다 = (이름, 됐나) => { if (!됐나) 흠.push(이름); };

  const 줄 = 한줄({
    date: '2026-07-29', title: 'x', period: 'Q2 2026', priorPeriod: 'Q2 2025',
    revenue: 100, expense: -50, netProfit: 40, eps: 0.1, cashAndEquivalents: 10,
    totalAssets: 1000, totalLiabilities: 600, totalEquity: 400,
    balanceSheetReconciled: true, liabilitiesDerived: false, unitHint: "AED'000",
    engPdfUrl: 'https://x',
  }, 'ADX', 'ALDAR');
  재다('한줄: exchange·symbol 이 밖에서 붙는다', 줄.exchange === 'ADX' && 줄.symbol === 'ALDAR');
  재다('한줄: revenue_aed 로 이름이 바뀐다(스네이크케이스)', 줄.revenue_aed === 100);
  재다('한줄: total_assets_aed·total_liabilities_aed·total_equity_aed 가 다 있다',
    줄.total_assets_aed === 1000 && 줄.total_liabilities_aed === 600 && 줄.total_equity_aed === 400);
  재다('한줄: balance_sheet_reconciled·liabilities_derived·unit_hint 가 다 있다',
    줄.balance_sheet_reconciled === true && 줄.liabilities_derived === false && 줄.unit_hint === "AED'000");

  const 뺀값줄 = 한줄({ totalAssets: 1000, totalEquity: 400, liabilitiesDerived: true, totalLiabilities: 600 }, 'ADX', 'X');
  재다('⛔ liabilitiesDerived=true 면 liabilities_derived 칸이 true 로 함께 나간다(감추지 않는다)',
    뺀값줄.liabilities_derived === true && 뺀값줄.total_liabilities_aed === 600);

  const 빈줄 = 한줄({}, 'DFM', 'Y');
  재다('한줄: 값이 없으면 null(0 으로 안 채운다)', 빈줄.revenue_aed === null && 빈줄.total_assets_aed === null);

  const 표 = 짓기();
  재다('짓기: rows 가 배열이다', Array.isArray(표.rows));
  재다('짓기: _meta.balance_sheet_note 가 있다', typeof 표._meta.balance_sheet_note === 'string');
  재다('짓기: _meta.rows 가 실제 rows.length 와 같다', 표._meta.rows === 표.rows.length);

  return 흠;
}

if (process.argv[1] && process.argv[1].endsWith('build-v1-uae-financials-tape.mjs')) {
  const 흠 = 자가시험();
  if (흠.length) { console.log('🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ')); process.exit(1); }
  console.log(`✅ 자가시험 통과`);

  const 표 = 짓기();
  if (!표.rows.length) { console.log('🔴 못 쟀다 — 원본이 없다. 수집기를 먼저 돌린다'); process.exit(1); }
  fs.writeFileSync(낼곳, JSON.stringify(표, null, 1));
  console.log(`✅ ${path.relative(process.cwd(), 낼곳)}`);
  console.log(`   행 ${표.rows.length} · ADX ${표._meta.adx_companies_with_data}개사 · DFM ${표._meta.dfm_companies_with_data}개사 · 대차대조표 ${표._meta.balance_sheet_rows}건`);
}
