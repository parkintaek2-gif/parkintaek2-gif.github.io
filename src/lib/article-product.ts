/**
 * article-product.ts — **기사 한 편에 어느 «자료 상품»을 이어 줄 것인가.**
 *
 * ── 🔴 왜 새로 만드나 (2026-09-10) ────────────────────────────────────────
 *
 * 4번이 GSC 로 재서 넘겼다 —
 * ```
 *   기사 131편 가운데 /data 로 링크 건 것 «7편(5.3%)» 뿐이다.
 *   검색어는 기사로 떨어지는데(작지만 노출이 있다) 그 기사가 상품으로 다음 걸음을 안 연다.
 *   ⇒ 「깔때기가 없다」가 아니라 «입구는 있고 출구가 안 뚫려 있다».
 * ```
 * 까닭을 찾았다: 이어 주는 자가 **손으로 적은 슬러그 정규식 여덟 줄**이었다.
 * 새 기사를 쓸 때마다 그 줄에 낱말을 더해야 이어지는데, 아무도 더하지 않았다.
 *
 * ⛔ 사람이 기억해서 지키는 구조를 만들지 않는다.
 * ⇒ 슬러그를 짐작하는 대신 기사가 «이미 들고 있는» 것으로 잇는다 — 태그와 갈래.
 *   태그는 기사를 쓸 때 반드시 적는 칸이라 낡지 않는다.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────
 * ```
 * ⛔ 아무 상품이나 붙이지 않는다 — 맞는 것이 없으면 «자료 목록»(/data)으로 보낸다.
 *   그것도 없으면 null 이다. 엉뚱한 상품을 붙이는 것은 안 붙이는 것보다 나쁘다.
 * ⛔ 손으로 적은 슬러그 목록을 되살리지 않는다. 그것이 이 구멍의 원인이었다.
 * ⛔ 태그를 짐작으로 늘리지 않는다 — 기사에 실제로 쓰인 태그만 맞춘다.
 * ```
 */

export type 상품 = { href: string; name: string; blurb: string };

/** 상품마다 «어느 태그·갈래에 걸리나». 앞에 있는 것이 먼저 이긴다 */
export type 이음 = {
  키: string;
  상품: 상품;
  태그: string[];
  갈래?: string[];
};

export const 자료목록: 상품 = {
  href: '/data',
  name: 'the SeoulMarkets data catalogue',
  blurb: 'every dataset behind these articles — what is free, what is licensed, and the columns in each',
};

/**
 * ⚠ 태그는 «기사에 실제로 쓰인 것»만 적는다. 새 상품을 내면 여기 한 줄을 더한다.
 *   그 한 줄이 곧 그 상품의 깔때기다.
 */
export const 이음표: 이음[] = [
  {
    키: 'valuation',
    상품: {
      href: '/data/valuation',
      name: 'the Korea valuation tape',
      blurb: 'PER, PBR and ROE for every listed Korean company, with the price date and the fiscal year on every row',
    },
    태그: ['valuation', 'per', 'pbr', 'roe', 'earnings', 'financials', 'profit', 'dart',
      'financial-statements', 'net-income'],
  },
  {
    키: 'concentration',
    상품: {
      href: '/data/concentration',
      name: 'the Korea Concentration Index',
      blurb: 'how top-heavy Korea’s market and trade are — Samsung’s KOSPI weight, top partners, updated daily',
    },
    태그: ['concentration', 'market-cap', 'kospi', 'kosdaq', 'trade', 'exports', 'imports',
      'trade-partners', 'gini', 'samsung', 'largest'],
  },
  {
    키: 'mezzanine',
    상품: {
      href: '/data/mezzanine',
      name: 'the Korea mezzanine book',
      blurb: 'convertible bonds, warrants and exchangeables — 46 columns, in English, conversion prices and refixing included',
    },
    태그: ['mezzanine', 'convertible', 'bond', 'bonds', 'warrant', 'cb', 'bw', 'issuance'],
  },
  {
    키: 'ownership',
    상품: {
      href: '/data/ownership',
      name: 'the Korea ownership ledger',
      blurb: 'the 5% rule filings and insider holdings, normalised into English',
    },
    태그: ['ownership', 'shareholder', 'stake', 'insider', 'holdings', 'treasury', 'buyback'],
  },
  {
    키: 'target',
    상품: {
      href: '/data/target-changes',
      name: 'the Korea consensus tape',
      blurb: 'target-price changes and the analysts behind them, snapshotted every day because the window closes',
    },
    태그: ['price-target', 'target-price', 'consensus', 'analyst', 'analysts', 'estimate',
      'estimates', 'research', 'broker', 'brokers'],
  },
  {
    키: 'candour',
    상품: {
      href: '/data/broker-candour',
      name: 'broker candour, the vanishing Sell',
      blurb: 'each brokerage’s Buy/Hold/Sell mix — the Sell rating has all but disappeared',
    },
    태그: ['rating', 'ratings', 'sell-rating', 'buy-rating', 'candour', 'recommendation'],
  },
  {
    키: 'attention',
    상품: {
      href: '/data/analyst-attention',
      name: 'analyst attention',
      blurb: 'where equity research piles up and where it thins, from our broker-report archive',
    },
    태그: ['attention', 'coverage', 'uncovered', 'ignored', 'neglected'],
  },
  {
    키: 'board',
    상품: {
      href: '/data/board-composition',
      name: 'board composition',
      blurb: 'who sits on Korean boards, for how long, and how the mix differs by size',
    },
    태그: ['board', 'director', 'directors', 'governance', 'officer', 'executives', 'ceo'],
  },
  {
    키: 'wage',
    상품: {
      href: '/data/pension-wage-panel',
      name: 'the pension and wage panel',
      blurb: 'workplace-level pay and headcount churn from the national pension register',
    },
    태그: ['pension', 'wage', 'wages', 'pay', 'churn', 'separation', 'hiring', 'workplace'],
  },
  {
    키: 'sector',
    상품: {
      href: '/data/sector-workforce-panel',
      name: 'the sector workforce panel',
      blurb: 'tenure, headcount and the pay gap by sector — as a distribution, never as a benchmark',
    },
    태그: ['tenure', 'workforce', 'headcount', 'gender', 'gender-gap', 'employees', 'staff'],
  },
  {
    키: 'leaders',
    상품: {
      href: '/data/sector-leaders',
      name: 'sector leaders vs the rest',
      blurb: 'how a sector’s biggest companies pay, retain and staff their top differently',
    },
    태그: ['leaders', 'sector', 'sectors', 'industry'],
  },
];

/** 갈래마다 «마지막으로 기댈» 상품. ⛔ 없으면 자료 목록으로 보낸다 */
export const 갈래기본: Record<string, string> = {
  equities: 'valuation',
  macro: 'concentration',
  commodities: 'concentration',
  rates: 'mezzanine',
  fx: 'concentration',
  funds: 'valuation',
};

/** 태그 글자를 맞추기 좋게 — 소문자, 공백·밑줄을 붙임표로 */
export function 태그다듬기(t: unknown): string {
  return String(t ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-');
}

/**
 * 기사 한 편에 이어 줄 상품을 고른다.
 *
 * @returns {{상품: 상품, 왜: string}} — ⛔ 「왜 골랐나」를 같이 낸다. 짐작이 아니라는 증거다
 */
export function 상품고르기(
  { tags = [], category = null }: { tags?: unknown[]; category?: string | null },
   표: 이음[] = 이음표,
   기본: Record<string, string> = 갈래기본,
): { 상품: 상품; 왜: string } {
  const 내태그 = new Set((Array.isArray(tags) ? tags : []).map(태그다듬기).filter(Boolean));

  /* ① 태그가 맞는 것 — 맞은 태그 수가 «가장 많은» 상품을 고른다 */
  let 으뜸: { 이음: 이음; 몇개: number; 맞은것: string[] } | null = null;
  for (const it of 표) {
    const 맞은것 = it.태그.map(태그다듬기).filter((t) => 내태그.has(t));
    if (!맞은것.length) continue;
    if (!으뜸 || 맞은것.length > 으뜸.몇개) 으뜸 = { 이음: it, 몇개: 맞은것.length, 맞은것 };
  }
  if (으뜸) {
    return { 상품: 으뜸.이음.상품, 왜: `tag ${으뜸.맞은것.join(', ')}` };
  }

  /* ② 갈래로 기댄다 */
  const 갈래 = 태그다듬기(category);
  const 키 = 갈래 ? 기본[갈래] : undefined;
  const 그것 = 키 ? 표.find((x) => x.키 === 키) : undefined;
  if (그것) return { 상품: 그것.상품, 왜: `category ${갈래}` };

  /* ③ ⛔ 엉뚱한 상품을 붙이지 않는다 — 자료 목록으로 보낸다 */
  return { 상품: 자료목록, 왜: 'catalogue fallback' };
}
