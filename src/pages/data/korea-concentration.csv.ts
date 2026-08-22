/**
 * Korea Concentration Index — 일일 시계열 CSV. (seoulmarkets.com/data/korea-concentration.csv)
 *
 * ── 왜 무료로 여나 ──────────────────────────────────────────────
 * 「값을 부르기 전에 물건을 보인다.」 무료 CSV(미끼)가 유료 피드로 가는 깔때기다.
 * 인용되는 것이 곧 검색 유입이다.
 *
 * ── 무엇이 들어 있나 ────────────────────────────────────────────
 * KRX(유가증권+코스닥) 하루치에서 뽑은 «집중도 지수» 시계열 —
 *   giniCap/giniTurnover(집중도 본체), 상위N 점유율, KOSDAQ 비중, 회전율, 무거래 종목 수.
 * ⚠ 전부 «비율/Gini» — 시세 스케일과 무관, 검증가능. 절대 시세는 안 낸다.
 *   원본 archive 는 git 미추적이라, 이 커밋본(src/data/krx-daily-history.json)이 시계열의 진본.
 * 라이선스: 우리가 KRX 원자료를 가공한 지수. 출처는 Korea Exchange OPEN API. Not investment advice.
 */
import type { APIRoute } from 'astro';
import hist from '../../data/krx-daily-history.json';

export const prerender = true;

const cols = [
  'date', 'issues', 'zeroTrade', 'giniCap', 'giniTurnover',
  'capTop1', 'capTop5', 'capTop10', 'valTop1', 'valTop5', 'valTop10',
  'kospiCapPct', 'kosdaqCapPct', 'kospiValPct', 'kosdaqValPct', 'kospiVel', 'kosdaqVel',
];

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: APIRoute = () => {
  const days = (hist as any).days || [];
  const head = [
    '# Korea Concentration Index — daily time series',
    '# giniCap / giniTurnover: Gini of market cap / trading value across all listed issues (0=even, 1=all in one).',
    '# capTopN / valTopN: share (%) of total market cap / trading value held by the N largest issues.',
    '# kosdaqCapPct/kosdaqValPct: KOSDAQ share of cap / trading. Vel: day turnover per 1,000 of cap.',
    '# All figures are ratios or Gini — scale-invariant, independent of the price level. Absolute prices are not published.',
    `# Coverage: ${days.length} trading day(s); latest ${(hist as any).asOf || 'n/a'}. Source: Korea Exchange OPEN API (KOSPI + KOSDAQ daily).`,
    '# Licence: our derived index from KRX raw data; attribute SeoulMarkets. Not investment advice.',
    '# Page: https://seoulmarkets.com/data/concentration',
  ].join('\n');

  const rows = days.map((d: any) => cols.map((c) => cell(d[c])).join(','));
  return new Response([head, cols.join(','), ...rows].join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="korea-concentration-index-daily.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
