#!/usr/bin/env node
/**
 * collect-uae-adx-financials.mjs — **UAE 재무제표 수치, 항목4(5번 지침) 대응.**
 *
 *   node scripts/collect-uae-adx-financials.mjs --자가시험
 *   node scripts/collect-uae-adx-financials.mjs                전 종목(ADX 96개사)
 *   node scripts/collect-uae-adx-financials.mjs --종목 ALDAR,FAB
 *
 * ── 배경 — 5번 지침(2026-09-14 10:1x) 항목4 ──────────────────────────────────
 * "ADX·DFM 다 PDF 목록만 주지 수치를 안 준다. PDF 를 열어 (가)텍스트인지 스캔인지
 * (나)표가 규칙적인지 (다)영문이 있는지 판단하라"는 지시였다. ALDAR(부동산)·FAB(은행)·
 * ADNOCGAS(산업재) 세 PDF 를 실제로 받아 pdftotext 로 열어 본 결과 —
 *
 *   (가) 텍스트형이다(스캔 이미지 아님) — pdftotext 로 글자가 그대로 뽑힌다
 *   (나) ⛔ 표 구조가 불규칙하다 — 재무상태표(대차대조표)는 다열(多列) 숫자가
 *        pdftotext -layout 으로도 라벨과 어긋난다(자산 항목명과 숫자 줄이 밀린다).
 *        좌표 기반 파싱(pdfplumber 급)이 있어야 안전하게 뽑는다 — 지금은 못 한다.
 *   (다) 영문 있음 — ADX 는 매 공시에 engUrl(영문 PDF)·arbUrl(아랍어 PDF)을 따로 준다.
 *
 * ── 🔴 그런데 PDF 를 파싱하지 않고도 되는 길을 찾았다 ────────────────────────
 * ADX 공시 원본(disclosureType=1, "Financial Report")에 **ADX 자체 AI가 이미 뽑아 둔
 * aiJsonDataEn** 이 함께 온다 — Revenue·Expense(세부 항목별)·Net Profit·EPS·
 * Cash and Cash Equivalents 를 이번 분기/전년 동기/증감률로 표에 담아 준다(은행은
 * Revenue·Expense 를 세부 계정별로 쪼개고, 비은행은 한 줄로 합쳐 준다 — 실측 확인:
 * FAB·ADCB·ADIB=세부형, ALDAR·ADNOCGAS·EAND=단순형).
 *
 * ⛔ 이것은 **ADX 가 만든 AI 요약**이지 우리가 지어낸 것도, 감사받은 원문 수치를 직접
 *   옮긴 것도 아니다 — `collect-uae-adx-disclosures.mjs` 의 aiSummary 처리와 같은 원칙.
 *   실제 재무제표 원문과 대조 검증은 안 했다 — 참고용 요약으로만 판다(투자 신호 아님).
 * ⛔ Total Assets · Total Equity 는 이 표에 없다 — 대차대조표 자체가 아니라 손익 위주
 *   요약이다. **그 둘은 여전히 "아직 못 뽑았다"** — PDF 좌표기반 파싱이 있어야 한다.
 * ⚠ financial-report(disclosureType=1) 공시 전부가 이 표를 갖진 않는다(실측: 10개사
 *   표본 110건 중 37건만 aiJsonDataEn 이 채워짐 — MD&A·Integrated Report·중복 보도자료류는
 *   빈 문자열이다). 빈 것과 "이 필터링에서 걸러진 것"을 coverage 로 구분해 적는다.
 *
 * 저장: archive/raw/uae-adx-financials/<종목>.json (종목마다 한 파일, 멱등)
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { put } from '../src/lib/store.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
const APIKEY = '1863a94c-582b-46f9-b4f0-0d02c0cc5307';
const GATEWAY = 'https://apigateway.adx.ae/adx';
const 기본종목 = ['ALDAR', 'ADIB', 'FAB', 'ADNOCGAS', 'IHC', 'ADCB', 'EAND'];

function 헤더인자() {
  return [
    '-A', UA,
    '-H', 'Accept: application/json',
    '-H', 'Referer: https://www.adx.ae/',
    '-H', 'Origin: https://www.adx.ae',
    '-H', 'channel-id: OSS WEB',
    '-H', 'x-correlation-id: uuid',
    '-H', 'x-uuid: ',
    '-H', `adx-gateway-apikey: ${APIKEY}`,
  ];
}
function curlJson(url) {
  const 글자 = execFileSync('curl', ['-sS', '-f', ...헤더인자(), url], { maxBuffer: 1024 * 1024 * 20 }).toString('utf8');
  return JSON.parse(글자);
}

/** Date → "MM/DD/YYYY" (collect-uae-adx-disclosures.mjs 와 같은 함수 — import 하면 그 파일의
 * CLI 가드가 process.argv(전역)를 그대로 봐서 --자가시험 이 여기로도 새 버려 따로 둔다). */
function 미국식날짜(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

/** 🔴 [2026-09-14] collect-uae-adx-disclosures.mjs 와 같은 우물(scrollingTicker) — 중복이지만
 * 그 파일을 건드리지 않으려고(이미 감수·커밋됨) 이 자에서 따로 들고 있다. */
async function 종목목록받기() {
  const j = curlJson(`${GATEWAY}/marketwatch-delayed/1.1/scrollingTicker`);
  const rows = j?.response?.results;
  if (!Array.isArray(rows) || !rows.length) throw new Error('scrollingTicker 가 빈 배열');
  return rows.map((r) => r.companySymbol).filter(Boolean);
}

/** "27.900B" · "(18.023B)" · "0.930" 같은 ADX AI 표 값 → 숫자(단위 AED, B=10억). null이면 못 읽음. */
export function 값파싱(s) {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  const m = t.match(/^\(?(-?[\d.]+)\s*([MB])?\)?$/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (Number.isNaN(n)) return null;
  if (t.startsWith('(') && t.endsWith(')')) n = -Math.abs(n);
  const unit = (m[2] || '').toUpperCase();
  if (unit === 'B') n *= 1e9;
  else if (unit === 'M') n *= 1e6;
  return n;
}

/**
 * ADX aiJsonDataEn(문자열) → 정규화된 재무 요약 하나(그 공시 한 건).
 * "Revenue: xxx" 세부 줄은 합산해 revenue 로, "Expense: xxx" 도 합산해 expense 로 접는다
 * (은행처럼 세부로 나온 경우) — 이미 한 줄("Revenue")이면 그 값을 그대로 쓴다.
 */
export function 재무표파싱(aiJsonDataEn) {
  if (!aiJsonDataEn) return null;
  let parsed;
  try { parsed = JSON.parse(aiJsonDataEn); } catch { return null; }
  const rows = parsed?.table?.rows;
  if (!Array.isArray(rows) || !rows.length) return null;
  const cols = parsed?.table?.columns ?? [];
  const periodLabel = cols.find((c) => c.key === 'col2')?.label ?? null;
  const priorLabel = cols.find((c) => c.key === 'col3')?.label ?? null;

  let revenue = 0; let revenueHas = false;
  let expense = 0; let expenseHas = false;
  let netProfit = null; let eps = null; let cash = null;
  for (const r of rows) {
    const label = String(r.col1 ?? '');
    const v = 값파싱(r.col2);
    if (v == null) continue;
    if (/^revenue\b/i.test(label)) { revenue += v; revenueHas = true; }
    else if (/^expense\b/i.test(label)) { expense += v; expenseHas = true; }
    else if (/^net profit$/i.test(label)) netProfit = v;
    else if (/^eps$/i.test(label)) eps = v;
    else if (/^cash and cash equivalents$/i.test(label)) cash = v;
  }
  return {
    period: periodLabel,
    priorPeriod: priorLabel,
    revenue: revenueHas ? revenue : null,
    expense: expenseHas ? expense : null,
    netProfit,
    eps,
    cashAndEquivalents: cash,
    lineItemCount: rows.length,
  };
}

/* ── 자가시험 — 실측한 진짜 aiJsonDataEn 값으로 잰다 ────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('값파싱: "27.900B" → 27,900,000,000', 값파싱('27.900B') === 27_900_000_000);
  재다('값파싱: "(18.023B)"(괄호=음수) → -18,023,000,000', 값파싱('(18.023B)') === -18_023_000_000);
  재다('값파싱: "0.930"(단위 없음) → 0.93', 값파싱('0.930') === 0.93);
  재다('값파싱: null/빈문자열 → null', 값파싱(null) === null && 값파싱('') === null);
  재다('값파싱: 못 읽는 문자열 → null', 값파싱('n/a') === null);

  const 단순형 = JSON.stringify({
    table: {
      columns: [{ key: 'col1', label: 'Metric' }, { key: 'col2', label: 'Q2 2026' }, { key: 'col3', label: 'Q2 2025' }, { key: 'col4', label: 'YoY Change' }],
      rows: [
        { col1: 'Revenue', col2: '38.143B', col3: '34.176B', col4: '+11.6%' },
        { col1: 'Expense', col2: '(25.603B)', col3: '(22.727B)', col4: '+12.7%' },
        { col1: 'Net Profit', col2: '7.007B', col3: '9.858B', col4: '-28.9%' },
        { col1: 'EPS', col2: '0.690', col3: '1.010', col4: '-31.7%' },
        { col1: 'Cash and Cash Equivalents', col2: '8.496B', col3: '13.017B', col4: '-34.7%' },
      ],
    },
  });
  const 단순결과 = 재무표파싱(단순형);
  재다('🔴 실측(EAND, 단순형): revenue = 38.143B', 단순결과.revenue === 38_143_000_000);
  재다('실측(EAND): expense = -25.603B(괄호=지출)', 단순결과.expense === -25_603_000_000);
  재다('실측(EAND): netProfit = 7.007B', 단순결과.netProfit === 7_007_000_000);
  재다('실측(EAND): eps = 0.69', 단순결과.eps === 0.69);
  재다('실측(EAND): cashAndEquivalents = 8.496B', 단순결과.cashAndEquivalents === 8_496_000_000);
  재다('실측(EAND): period = "Q2 2026"', 단순결과.period === 'Q2 2026');

  const 세부형 = JSON.stringify({
    table: {
      columns: [{ key: 'col1', label: 'Metric' }, { key: 'col2', label: 'Q2 2026' }, { key: 'col3', label: 'Q2 2025' }, { key: 'col4', label: 'YoY Change' }],
      rows: [
        { col1: 'Revenue: Interest income', col2: '27.900B', col3: '28.004B', col4: '-0.4%' },
        { col1: 'Revenue: Fee and commission income', col2: '3.863B', col3: '3.344B', col4: '+15.5%' },
        { col1: 'Expense: Interest expense', col2: '(18.023B)', col3: '(19.029B)', col4: '-5.3%' },
        { col1: 'Expense: General, administration and other operating expenses', col2: '(4.251B)', col3: '(3.999B)', col4: '+6.3%' },
        { col1: 'Net Profit', col2: '10.765B', col3: '10.650B', col4: '+1.1%' },
        { col1: 'EPS', col2: '0.930', col3: '0.930', col4: '+0.0%' },
        { col1: 'Cash and Cash Equivalents', col2: '280.425B', col3: '263.526B', col4: '+6.4%' },
      ],
    },
  });
  const 세부결과 = 재무표파싱(세부형);
  재다('🔴 실측(FAB, 은행 세부형): revenue = 두 줄 합산 31.763B', Math.abs(세부결과.revenue - 31_763_000_000) < 1e6);
  재다('실측(FAB): expense = 두 줄 합산 -22.274B', Math.abs(세부결과.expense - (-22_274_000_000)) < 1e6);
  재다('실측(FAB): netProfit = 10.765B(세부 항목 합산이 아니라 그 줄 그대로)', 세부결과.netProfit === 10_765_000_000);

  재다('재무표파싱: aiJsonDataEn 빈 문자열 → null(진짜 없음)', 재무표파싱('') === null);
  재다('재무표파싱: aiJsonDataEn undefined → null', 재무표파싱(undefined) === null);
  재다('재무표파싱: JSON 깨짐 → null(못 읽음— 던지지 않는다)', 재무표파싱('{broken') === null);
  재다('재무표파싱: rows 없는 표 → null', 재무표파싱(JSON.stringify({ table: { rows: [] } })) === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }
console.log('');

const 대기 = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const 인자 = process.argv.find((a) => a.startsWith('--종목'));
  let 종목들;
  if (인자) {
    종목들 = 인자.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean);
  } else if (process.argv.includes('--표본')) {
    종목들 = 기본종목;
  } else {
    console.log('종목 목록을 받는다 — scrollingTicker');
    종목들 = await 종목목록받기();
    console.log(`${종목들.length}개 종목`);
  }

  const 끝 = new Date();
  const 시작 = new Date(끝); 시작.setDate(시작.getDate() - 364);
  const fromDate = 미국식날짜(시작); const toDate = 미국식날짜(끝);

  let 성공 = 0; let 실패 = 0;
  const 커버리지 = { attempted: 0, withData: 0, empty: 0, emptyReason: {} };
  for (const 종목 of 종목들) {
    커버리지.attempted += 1;
    try {
      const j = curlJson(`${GATEWAY}/tradings/1.1/news/category?categoryName=cdc&symbol=${종목}&fromDate=${fromDate}&toDate=${toDate}`);
      const rows = (j?.response?.results ?? []).filter((r) => r.disclosureType === '1');

      const 분기들 = rows.map((r) => {
        const 표 = 재무표파싱(r.aiJsonDataEn);
        if (!표) return null;
        return {
          date: r.publishedDate,
          title: r.title,
          engPdfUrl: r.engUrl ?? null,
          arbPdfUrl: r.arbUrl ?? null,
          ...표,
        };
      }).filter(Boolean).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

      const 이유 = 분기들.length ? null : (rows.length ? 'financial-report-filings-exist-but-no-ai-table(MD&A/Integrated-Report-type)' : 'no-financial-report-disclosures-in-feed');
      if (분기들.length) 커버리지.withData += 1;
      else { 커버리지.empty += 1; 커버리지.emptyReason[이유] = (커버리지.emptyReason[이유] ?? 0) + 1; }

      const 결과 = await put(`raw/uae-adx-financials/${종목}.json`, JSON.stringify({
        _meta: {
          product: 'ADX financial highlights — Revenue/Expense/Net Profit/EPS/Cash, sourced from ADX’s own AI-generated disclosure summary (not audited raw figures; not a trading signal)',
          symbol: 종목,
          builtAt: new Date().toISOString(),
          source: 'ADX company disclosure feed — aiJsonDataEn field (public, no login)',
          coverage: { attempted: true, withData: 분기들.length > 0, empty: 분기들.length === 0, emptyReason: 이유 },
          notThis: [
            'Total Assets and Total Equity are NOT included — this is an income-statement-style AI summary, not a balance sheet extract.',
            'Not independently verified against the filed PDF — ADX’s own AI summary, carried through as-is.',
            'Not investment advice, not a trading signal.',
          ],
        },
        quarters: 분기들,
      }, null, 1), 'application/json');
      console.log(`  ✅ ${종목}  재무공시 ${rows.length}건 중 AI표 있음 ${분기들.length}건 → ${결과.local}`);
      성공 += 1;
    } catch (e) {
      console.error(`  ✕ ${종목}  ${e.message}`);
      실패 += 1;
      커버리지.empty += 1;
      커버리지.emptyReason[`fetch-failed: ${e.message}`] = (커버리지.emptyReason[`fetch-failed: ${e.message}`] ?? 0) + 1;
    }
    await 대기(300);
  }
  await put('raw/uae-adx-financials/_coverage.json', JSON.stringify({
    _meta: { product: 'ADX financials collector run coverage — attempted/withData/empty + why', builtAt: new Date().toISOString() },
    ...커버리지,
  }, null, 1), 'application/json');
  console.log(`\n합계 성공 ${성공} · 실패 ${실패} · 커버리지: 시도 ${커버리지.attempted} · 데이터있음 ${커버리지.withData} · 빔 ${커버리지.empty} · archive/raw/uae-adx-financials/`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await main();
