/**
 * 사이트 전역 설정. 도메인·법인정보를 바꿀 때 이 파일만 고치면 된다.
 */

// 도메인 확정 시 여기만 교체. (2026-07-31 기준 등록 가능 확인)
export const SITE_URL = 'https://seoulmarkets.com';

export const SITE = {
  name: 'Seoul Markets',
  tagline: 'Korean markets, explained with data.',
  description:
    'Data journalism on Korean equities, currencies, bonds, commodities and macroeconomics — sourced from official Korean government open data, published in English.',
  locale: 'en-US',
  lang: 'en',
} as const;

/**
 * 발행 주체 정보. 구글은 금융 콘텐츠를 YMYL로 심사하므로
 * 법인명·주소·연락처가 비어 있으면 검색 노출이 사실상 막힌다.
 * ⚠ TODO: 아래 PLACEHOLDER를 실제 사업자등록 정보로 교체할 것.
 */
export const PUBLISHER = {
  legalName: 'PLACEHOLDER Co., Ltd.', // TODO: 사업자등록증상 법인명(영문)
  legalNameKo: 'PLACEHOLDER 주식회사', // TODO: 국문 법인명
  bizRegNo: '000-00-00000', // TODO: 사업자등록번호
  address: 'PLACEHOLDER, Seoul, Republic of Korea', // TODO: 사업장 주소(영문)
  email: 'editor@seoulmarkets.com', // TODO: 실제 수신 가능한 주소
  foundedYear: 2026,
} as const;

/**
 * 카테고리는 「데이터 출처가 확보된 시장」 단위로 나눈다.
 * 선물·옵션은 별도 카테고리로 두지 않고 기초자산이 속한 시장에 넣는다
 * (코스피200선물→equities, 달러선물→fx, 국채선물→rates).
 * 금융 매체가 실제로 지면을 나누는 방식이고, 내비게이션도 5개 선에서 지킬 수 있다.
 */
export const CATEGORIES = [
  {
    slug: 'equities',
    label: 'Equities',
    blurb: 'Listed Korean stocks, indices, ETFs and equity derivatives.',
  },
  {
    slug: 'fx',
    label: 'FX',
    blurb: 'The won against the dollar and its major crosses, plus currency futures.',
  },
  {
    slug: 'rates',
    label: 'Rates',
    blurb: 'Korean government and corporate bonds, yields, and the policy rate.',
  },
  {
    slug: 'commodities',
    label: 'Commodities',
    blurb: 'Oil, gold and emissions traded through Korean venues.',
  },
  {
    slug: 'macro',
    label: 'Macro',
    blurb: 'Growth, prices, employment and the external balance.',
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

/**
 * 광고. 승인 후 여기에 클라이언트 ID를 넣으면 슬롯이 살아난다.
 * 비어 있으면 운영 빌드에서 빈 박스를 그리지 않는다.
 */
export const ADS = {
  client: '', // 예: 'ca-pub-0000000000000000'
  slots: { banner: '', inArticle: '' },
} as const;

export const DISCLAIMER = {
  short: 'Not investment advice.',
  ai: 'AI-assisted, human-reviewed sourcing.',
  long: `${SITE.name} publishes data journalism for general information only. Nothing here is investment advice, a recommendation, or an offer to buy or sell any security. Figures are derived from official public data sources and may be revised by the issuing agency. Verify independently before acting.`,
} as const;
