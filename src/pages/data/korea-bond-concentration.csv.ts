/**
 * Korea Bond Trading Concentration — 일일 시계열 CSV. (seoulmarkets.com/data/korea-bond-concentration.csv)
 *
 * ── 왜 무료로 여나 (2026-08-26, 5번 총괄 지시: 「자료 먼저, 그다음 사람」) ──
 * 「우리 지면 좀 봐 주세요」로는 아무도 안 건다. 표를 통째로 주면 그 표를 인용한다.
 * 인용이 도메인 권위를 만들고, 권위가 검색 유입을 만든다. 그래서 「바벨/채권 집중」의 수를
 * 기사 옆에 CSV 로 통째로 연다 — 기사 한 편보다 인용될 자리가 넓다.
 *
 * ── 무엇이 들어 있나 ────────────────────────────────────────────
 * KRX 상장채권 하루치에서 뽑은 «거래 집중도» 시계열 —
 *   issues(그날 호가 잡힌 종목 수), top10(상위10 거래대금 점유 %), ktbShare(국고채 점유 %),
 *   k90(거래대금 90% 도달에 필요한 종목 수).
 * ⚠ 모수 = 그날 KRX 채권 파일에 종가·거래대금이 «잡힌» 종목(=호가 있던 것). 등록 채권 전체가
 *   아니다 — 모든 점유율은 «호가 잡힌 채권의 거래대금 중»으로 읽는다. 미거래분은 이 파일에 없다.
 * ⚠ 전부 비율/개수 — 시세 스케일과 무관, 검증가능. 절대 시세는 안 낸다.
 *   원본 archive 는 git 미추적이라, 이 커밋본(src/data/bond-trading-concentration.json)이 진본.
 */
import type { APIRoute } from 'astro';
import data from '../../data/bond-trading-concentration.json';

export const prerender = true;

const cols = ['date', 'issues', 'top10', 'ktbShare', 'k90'];

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: APIRoute = () => {
  const series = (data as any).series || [];
  const head = [
    '# Korea Bond Trading Concentration — daily time series',
    '# issues: bonds that carried a quote (close + trading value) in the KRX daily file that day.',
    '# top10: share (%) of the day\'s bond trading value held by the 10 most-traded issues.',
    '# ktbShare: share (%) of the day\'s bond trading value that was Korea Treasury Bonds (국고).',
    '# k90: how many issues (largest first) it took to reach 90% of the day\'s trading value.',
    '# Read every share as \'of quoted-bond turnover\' — non-trading listed bonds are absent, not zero.',
    '# All figures are ratios or counts — scale-invariant, independent of the price level.',
    `# Coverage: ${series.length} trading day(s); latest ${(data as any).asOf || 'n/a'}. Source: Korea Exchange OPEN API (listed bonds, daily).`,
    '# Free to reproduce. Cite as SeoulMarkets (seoulmarkets.com) and link back. Not investment advice.',
    '# Page: https://seoulmarkets.com/article/korea-bond-trading-six-issues',
  ].join('\n');

  const rows = series.map((d: any) => cols.map((c) => cell(d[c])).join(','));
  return new Response([head, cols.join(','), ...rows].join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="korea-bond-trading-concentration-daily.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
