/**
 * Korea Valuation Tape — 전량 CSV. (seoulmarkets.com/data/korea-valuation.csv)
 *
 * ── 왜 무료로 여나 ──────────────────────────────────────────────
 * 「값을 부르기 전에 물건을 보인다.」 무료 CSV 가 유료 상품으로 가는 깔때기다.
 * 인용되는 것이 곧 검색 유입이다. QUICK 이 Japan Markets View 로 그 자리를 하고 있다.
 *
 * ── ⛔ 이 파일이 지키는 것 ──────────────────────────────────────
 * ⛔ 못 붙은 줄을 «빼지 않는다». 까닭을 notMeasured 칸에 담아 함께 낸다 —
 *   빼면 분모가 사라져 「2,499곳에 PER 이 있다」처럼 좋아 보이는 수만 남는다.
 * ⛔ 빈 칸을 0 으로 채우지 않는다. 비어 있으면 «못 쟀거나 뜻이 없는» 것이다.
 * 🔴 priceAsOf 와 fiscalYear 를 «줄마다» 싣는다 — 이 배수는 TTM 이 아니라 연간 후행이다.
 *   두 날짜가 없으면 손님이 우리 수를 검산할 수 없고, 그러면 자료가 아니라 「주장」이다.
 * ⛔ 화면·파일에 한국어를 내지 않는다 — 손님이 영어권이다. 영문 이름·업종이 2,709/2,709 붙었다.
 *   ⚠ 단 notMeasured 는 우리 내부 판정 글이라 «영문으로 갈아» 낸다(아래 까닭영문).
 *
 * 라이선스: DART(금융감독원) 공시 API + 공공데이터포털 시세를 «우리가 가공한» 표.
 *   출처를 지면과 이 머리글에 적는다. Not investment advice.
 */
import type { APIRoute } from 'astro';
import tape from '../../data/korea-valuation-tape.json';

export const prerender = true;

/** ⛔ 한국어 판정 글을 그대로 내보내지 않는다. 뜻이 같은 영문으로 바꾼다 */
const 까닭영문: Array<[RegExp, string]> = [
  [/재무제표가 없다/, 'no annual report for this fiscal year'],
  [/자본총계·순이익이 비어 있다/, 'annual report read but equity or net income line missing'],
  [/시가총액이 없다/, 'no market capitalisation on this trading day'],
];

export function reasonEn(s: unknown): string {
  const t = String(s ?? '').trim();
  if (!t) return '';
  for (const [pat, en] of 까닭영문) if (pat.test(t)) return en;
  /* ⛔ 모르는 까닭을 빈 칸으로 만들지 않는다 — 「모른다」고 적는다 */
  return 'not computed (reason not classified)';
}

/** CSV 한 칸. ⛔ null·undefined 는 «빈 칸»이다. 0 으로 바꾸지 않는다 */
export function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const cols = [
  'ticker', 'name_en', 'industry_en', 'market',
  'price_as_of', 'fiscal_year', 'report', 'basis',
  'market_cap_krw', 'net_income_krw', 'total_equity_krw', 'total_assets_krw',
  'revenue_krw', 'operating_income_krw',
  'per', 'pbr', 'roe', 'debt_to_equity',
  'not_measured',
] as const;

const marketNames: Record<string, string> = { Y: 'KOSPI', K: 'KOSDAQ', N: 'KONEX' };

export function rowOut(r: any): string {
  return [
    r.ticker, r.nameEn, r.industryEn,
    r.market ? (marketNames[r.market] ?? r.market) : null,
    r.priceAsOf, r.fiscalYear, r.report, r.basis,
    r.marketCap, r.netIncome, r.totalEquity, r.totalAssets,
    r.revenue, r.operatingIncome,
    r.per, r.pbr, r.roe, r.debtToEquity,
    r.notMeasured ? reasonEn(r.notMeasured) : '',
  ].map(cell).join(',');
}

export const GET: APIRoute = () => {
  const meta = (tape as any)._meta ?? {};
  const rows = ((tape as any).rows ?? []) as any[];

  /* 머리글 — 어디서 왔고 어떻게 읽어야 하나를 파일 «안»에 넣는다.
     ⛔ 지면에만 적으면 CSV 를 받아 간 사람은 그것을 못 본다 */
  const head = [
    `# Korea Valuation Tape — SeoulMarkets (${'https://seoulmarkets.com'}/data/valuation)`,
    `# rows: ${rows.length} · with PER: ${meta.withPer ?? ''} · with PBR: ${meta.withPbr ?? ''}`
      + ` · with ROE: ${meta.withRoe ?? ''} · not computed: ${meta.notMeasured ?? ''}`,
    `# market cap as of: ${meta.priceAsOf ?? ''} (Korean public data portal daily price dataset)`,
    `# financials: DART open API fnlttSinglAcntAll, annual report 11011, fiscal year ${meta.fiscalYear ?? ''}`,
    `# built: ${meta.builtAt ?? ''}`,
    '# HOW TO READ: these are trailing ANNUAL multiples, not trailing twelve months. market_cap_krw',
    '#   is one trading day; net_income_krw and total_equity_krw are the full annual report. Months',
    '#   separate the two dates, so both ship as columns and the ratio can be recomputed.',
    '# EMPTY CELLS: empty means not measured or not defined. It never means zero. PER is empty when',
    '#   net income is not positive; PBR and ROE are empty when total equity is not positive.',
    '# ROWS ARE KEPT: rows that could not be computed stay in this file with a reason in',
    '#   not_measured. Dropping them would remove the denominator.',
    '# basis: Consolidated where the company filed consolidated statements, Separate otherwise.',
    '#   The two are never mixed within a row.',
    '# NOT INVESTMENT ADVICE.',
  ].join('\n');

  const body = `${head}\n${cols.join(',')}\n${rows.map(rowOut).join('\n')}\n`;

  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'content-disposition': 'inline; filename="korea-valuation.csv"',
    },
  });
};
