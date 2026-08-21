/**
 * 한국 무역(관세청 국가별 월 수출입) — **CSV 로 그대로 내려받게 한다.**
 *
 * ── 왜 무료로 여나 ──────────────────────────────────────────────
 * 2번: 「값을 부르기 전에 물건을 보인다.」 무료 CSV 가 유료 API(/v1/trade/exports)로
 * 가는 깔때기다. 그리고 데이터가 인용되는 것이 곧 검색 유입이다.
 *
 * ⚠ 유료 API 와 **같은 원본**(src/lib/trade-data.mjs)에서 나온다 — 숫자가 어긋날 수 없다.
 *   원본은 KOSIS 360(관세청 통관통계) 국가별 수출액 수입액, 단위 천달러.
 *
 * ── 라이선스 ────────────────────────────────────────────────────
 * KOSIS 통계정보 활용약관 — 상업활용 가능(제8조)·출처표시(제7조). raw 를 그대로 제3자에
 * 유료 재판매만 금지(제5조). 우리가 가공해 지면·표로 내는 것은 된다. 첫 줄에 출처를 박는다.
 */
import type { APIRoute } from 'astro';
import { TRADE } from '../../lib/trade-data.mjs';

export const prerender = true;

function 칸(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: APIRoute = () => {
  const 머리 = [
    '# Korea trade — exports, imports and balance by partner country and month',
    `# Window ${TRADE.window.first_month} to ${TRADE.window.latest_month} (${TRADE.window.months} months). Unit: thousand USD, customs basis.`,
    `# Source: ${TRADE.source.org} — ${TRADE.source.dataset}.`,
    `# Licence: ${TRADE.source.licence}.`,
    `# ${TRADE.hs_note}`,
    '# scope=national is the country total ("계"); otherwise the partner country.',
    '# Balance = exports - imports. Customs figures are provisional and get revised.',
    '# Hong Kong includes entrepot re-exports onward to mainland China. Not investment advice.',
    '# Live API (same data, queryable): https://seoulmarkets.com/v1/trade/exports',
    '# https://seoulmarkets.com/data/trade',
  ].join('\n');

  const 열 = ['scope', 'partner_country_en', 'partner_country_ko', 'month', 'exports_usd_thousand', 'imports_usd_thousand', 'balance_usd_thousand'];

  const 줄: string[] = [];
  for (const m of TRADE.national) {
    줄.push(['national', 'ALL', '계', m.month, m.exports, m.imports, m.balance].map(칸).join(','));
  }
  for (const c of TRADE.countries) {
    for (const m of c.months) {
      줄.push(['partner', c.name_en, c.name_ko, m.month, m.exports, m.imports, m.balance].map(칸).join(','));
    }
  }

  return new Response([머리, 열.join(','), ...줄].join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="korea-trade-by-country-month.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
