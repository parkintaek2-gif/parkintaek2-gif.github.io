/**
 * 상장사 인력 데이터 — **CSV 로 그대로 내려받게 한다.**
 *
 * ── 왜 만드나 ────────────────────────────────────────────────────
 * 「우리가 일하는 법」 전략 Ⅲ (3번 제안):
 *   **「B2B 는 지면을 안 산다. 표를 산다.」**
 *   그런데 그 표를 우리는 이미 갖고 있고 **안 내놓고 있을 뿐이다.**
 *
 * `/rankings` 지면이 쓰는 것과 **똑같은 파일**에서 나온다. 그래서
 *   · 지면과 숫자가 어긋날 수 없다 (같은 원본이다)
 *   · 만드는 비용이 **0** 이다 (빌드가 같이 떨어뜨린다)
 *
 * ── ⚠ 무료로 여는 이유 ──────────────────────────────────────────
 * 우리 마케팅은 검색 유입뿐이다. **데이터가 인용되는 것이 곧 유입**이다.
 * 지금 단계에서 막아 두면 아무도 우리를 모른다. **재고부터 쌓고 경계는 나중에 긋는다.**
 *
 * ── 출처 표기 ───────────────────────────────────────────────────
 * 원자료는 금융감독원 DART 공시다. 우리가 한 것은 **파싱·정규화·영문화**다.
 * 그 사실을 파일 첫 줄 주석에 적는다 — 받은 사람이 출처를 잃지 않게.
 */
import type { APIRoute } from 'astro';
import rankings from '../../data/rankings.json';

export const prerender = true;

/** ⚠ 쉼표·따옴표·줄바꿈이 든 값은 반드시 감싼다. 안 그러면 열이 밀린다 */
function 칸(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: APIRoute = () => {
  const R = rankings as { cols: string[]; rows: unknown[][]; year: number; generated: string };

  /* 사람이 읽는 열 이름. 코드 이름을 그대로 내보내지 않는다 */
  const 이름: Record<string, string> = {
    name: 'company_en', ticker: 'ticker', industry: 'industry', region: 'region',
    ceoFlag: 'ceo_tenure_exceeds_company_age', tenure: 'avg_tenure_years',
    tenureGap: 'tenure_gap_male_minus_female_years', pay: 'avg_annual_pay_krw',
    payRatio: 'pay_ratio_male_to_female', headcount: 'employees',
    femaleShare: 'female_share_pct', ceoTenure: 'ceo_tenure_months',
    officers: 'registered_officers', age: 'company_age_years',
  };

  const 머리 = [
    '# Korean listed companies — workforce disclosure, normalised',
    `# Fiscal year ${R.year}. ${R.rows.length} companies. Built ${R.generated} KST.`,
    '# Source: Financial Supervisory Service (DART), annual workforce filings (empSttus, hyslrSttus).',
    '# We parsed, normalised and translated. Figures are as filed by each company.',
    '# Empty cell = the company did not disclose that field. It does not mean zero.',
    '# avg_tenure_years is filed as free text in Korean ("5년 8월"); we parsed it to decimal years.',
    '# Not investment advice. https://seoulmarkets.com/rankings',
  ].join('\n');

  const 열 = R.cols.map((c) => 이름[c] ?? c);
  const 줄 = R.rows.map((r) => r.map(칸).join(','));

  return new Response([머리, 열.join(','), ...줄].join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="korean-listed-workforce.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
