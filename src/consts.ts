/**
 * 사이트 전역 설정. 도메인·법인정보를 바꿀 때 이 파일만 고치면 된다.
 */

// 도메인 확정 시 여기만 교체. (2026-07-31 기준 등록 가능 확인)
export const SITE_URL = 'https://seoulmarkets.com';

export const SITE = {
  // 한 단어로 붙여 쓰고 각 낱말의 첫 글자를 대문자로. (KLifeMap 과 같은 표기 방식)
  name: 'SeoulMarkets',
  /** 로고에서 뒷부분에 강조색을 주기 위한 분할. name 을 바꾸면 여기도 맞출 것. */
  nameParts: ['Seoul', 'Markets'],
  tagline: 'Korean markets, explained with data.',
  description:
    'Data journalism on Korean equities, currencies, bonds, commodities and macroeconomics — sourced from official Korean government open data, published in English.',
  locale: 'en-US',
  lang: 'en',
} as const;

/**
 * 발행 주체 정보. 구글은 금융 콘텐츠를 YMYL로 심사하므로
 * 법인명·주소·연락처가 비어 있으면 검색 노출이 사실상 막힌다.
 * 출처: 사업자등록증(법인사업자), 세종세무서장 발급 2025-07-17.
 */
export const PUBLISHER = {
  legalName: 'Yeopkeopon Sejong Co., Ltd.',
  legalNameKo: '주식회사 옆커폰세종',
  representative: 'Kim Mi-hee',
  representativeKo: '김미희',
  bizRegNo: '456-87-03384',
  address: 'Unit 101, 1F, Commercial Bldg. 1, 441 Namsejong-ro, Boram-dong, Sejong, Republic of Korea',
  addressKo: '세종특별자치시 남세종로 441 상가1동 1층 101호 (보람동, 호려울마을5단지)',
  // 실제 수신되는 주소다. editor@seoulmarkets.com 은 메일함이 없어서 쓰지 않는다.
  // 나중에 도메인 메일을 만들면 여기만 바꾸면 About·푸터·JSON-LD 가 함께 따라간다.
  email: 'sibcheongan@gmail.com',
  foundedYear: 2025, // 법인 개업일 2025-07-15
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
