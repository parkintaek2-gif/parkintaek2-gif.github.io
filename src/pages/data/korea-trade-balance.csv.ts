/**
 * 한국 무역수지 — 국가별 월 수출입을 **CSV 로 그대로 내려받게 한다.**
 *
 * ── 왜 무료로 여나 ───────────────────────────────────────────────
 * 「B2B 는 지면을 안 산다. 표를 산다.」 우리 마케팅은 검색 유입뿐이고,
 * **데이터가 인용되는 것이 곧 유입**이다. "korea trade balance data / csv" 로 찾는
 * 사람에게 재고를 먼저 쌓아 준다. 유료 축(HS 품목·API)은 나중에 긋는다.
 *
 * 유료 API `/v1/trade/exports` 와 **같은 번들 소스**(src/lib/trade-data.mjs)에서 나온다 —
 * 숫자가 어긋날 수 없고, 빌드가 같이 떨어뜨리니 비용 0.
 *
 * ── 출처·라이선스 ────────────────────────────────────────────────
 * 관세청 통관통계(국가데이터처 KOSIS 360/DT_1R11006). 상업활용 가능·출처표시.
 * 우리가 한 것은 파싱·정규화·영문화다. 단위는 원자료 그대로 천달러.
 */
import type { APIRoute } from 'astro';
// @ts-ignore — 자동 생성 .mjs 데이터 번들
import { TRADE } from '../../lib/trade-data.mjs';

export const prerender = true;

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: APIRoute = () => {
  const head = [
    '# Korea trade balance — exports, imports and balance by partner country and month',
    `# Window ${TRADE.window.first_month} to ${TRADE.window.latest_month} (${TRADE.window.months} months). Unit: ${TRADE.source.unit}.`,
    `# Source: ${TRADE.source.org} — ${TRADE.source.dataset}.`,
    `# Licence: ${TRADE.source.licence}. We parsed, normalised and translated.`,
    '# Granularity: partner country x month. HS-code (product) breakdown not in this table.',
    '# country = "TOTAL" rows are Korea\'s national totals across all partners.',
    '# Customs figures are provisional and get revised; the latest month is least settled.',
    '# Hong Kong includes entrepot re-exports onward to mainland China. Goods trade, customs basis.',
    '# Not investment advice. https://seoulmarkets.com/v1/trade/exports',
  ].join('\n');

  const cols = ['country_en', 'month', 'exports_usd_thousand', 'imports_usd_thousand', 'balance_usd_thousand'];

  const lines: string[] = [];
  for (const m of TRADE.national) {
    lines.push([cell('TOTAL'), m.month, m.exports, m.imports, m.balance].map(cell).join(','));
  }
  for (const c of TRADE.countries) {
    for (const m of c.months) {
      lines.push([c.name_en, m.month, m.exports, m.imports, m.balance].map(cell).join(','));
    }
  }

  return new Response([head, cols.join(','), ...lines].join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="korea-trade-balance.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
