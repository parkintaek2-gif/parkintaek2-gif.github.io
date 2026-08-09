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
 *
 * ✅✅ **2026-08-06 — 상호 변경등기 교합 완료. 새 이름으로 바꿨다.**
 *
 * ```
 * 옛 이름   주식회사 옆커폰세종 · Yeopkeopon Sejong Co., Ltd.
 * 새 이름   주식회사 케이라이프디자인            ← 지금 이것이 법적으로 맞다
 * 사업자등록번호  456-87-03384 — 법인이 같아 **바뀌지 않는다**
 * ```
 *
 * 사장님이 2026-08-05 에 접수하셨고 **8/6 에 교합(校合)이 끝났다.**
 * 교합은 등기관이 기입 내용을 신청서와 대조·날인하는 마지막 절차라, 여기까지 오면 처리가 끝난 것이다.
 * (8/8~8/12 로 잡았던 것이 이틀 앞당겨졌다)
 *
 * 🔴 **「케이라이프디자인」이다. 「K라이프디자인」이 아니다.**
 *   문서 곳곳에 영문 K 로 적혀 있었고 나도 그렇게 배포할 뻔했다.
 *   사장님께 등기부 상호를 여쭤 **한글 「케이」**임을 확인하고 잡았다.
 *   금융·교육은 YMYL 이라 발행 주체 표기가 **등기부와 한 자라도 다르면 그게 더 나쁘다.**
 *   앞으로도 상호는 **사람이 부르는 말이 아니라 등기부 글자**로 적는다.
 *
 * ⬜ 영문 상호는 **등기부에 없다.** 국내 법인 등기는 한글 상호만 올린다.
 *   ⚠ 2026-08-07 정정 — **영문 상호가 등기부에 있다**(KLifeDesign InC.). 우리가 정할 것이 아니었다.
 *   해외 송금·계약서도 이 표기로 맞춘다.
 *
 * ⚠ **전화번호는 네 사이트 공통 070 하나로 통일한다**(사장님 지시 2026-08-05).
 *   개인 휴대폰을 지면에 올리지 않는다 — 한 번 공개하면 되돌릴 수 없다.
 *   이 번호는 claw-ops 월 구독이다. 끊기면 번호가 반납되고 등록증의 번호가 죽는다.
 *   ⛔ **아직 어느 지면에도 쓰지 않는다.** 지금 걸면 klifemap 전용 ARS 만 나온다.
 *      1번이 매체별 분기를 넣은 뒤에 화면에 올린다.
 */
export const PUBLISHER = {
  /* 🔴 2026-08-07 — 등기사항전부증명서를 실제로 받아 대조했다. **등기부에 영문 상호가 있다.**
     「KLifeDesign InC.」 — 우리가 정해 쓰던 「K Life Design Co., Ltd.」는 등기부에 없는 표기였다.
     ⚠ 등기부 표기를 그대로 쓴다. 대문자·띄어쓰기까지 등기부 글자다(InC. 도 그대로다). */
  legalName: 'KLifeDesign InC.',
  legalNameKo: '주식회사 케이라이프디자인',      /* 🔴 등기부 글자 그대로. 「K라이프디자인」 아니다 */
  /* 법인등록번호는 공개 정보다(등기부 첫 줄). 사업자등록번호와 다른 번호다 */
  corpRegNo: '164711-0015700',
  representative: 'Kim Mi-hee',
  representativeKo: '김미희',
  bizRegNo: '456-87-03384',
  /* ⚠ 본점 표기도 등기부 그대로다 — **「제상가1동 101호」**. 「상가1동 1층 101호」가 아니다.
     「1층」은 우리가 덧붙인 말이었다. 등기부에 없는 말을 주소에 넣지 않는다. */
  address: 'Unit 101, Commercial Bldg. 1, 441 Namsejong-ro, Boram-dong, Sejong, Republic of Korea',
  addressKo: '세종특별자치시 남세종로 441, 제상가1동 101호 (보람동, 호려울마을5단지)',
  /** 네 사이트 공통 대표번호. 국제 표기는 +82-70-5236-1029 */
  tel: '070-5236-1029',
  telIntl: '+82-70-5236-1029',
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
    slug: 'funds',
    label: 'Funds',
    blurb: 'Korean fund performance, fees and the managers behind them.',
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
  client: 'ca-pub-5113515144381167', // 애드센스 승인·등록 완료(2번 61153, pub-5113515144381167)
  slots: { banner: '', inArticle: '' },
} as const;

export const DISCLAIMER = {
  short: 'Not investment advice.',
  ai: 'AI-assisted, human-reviewed sourcing.',
  long: `${SITE.name} publishes data journalism for general information only. Nothing here is investment advice, a recommendation, or an offer to buy or sell any security. Figures are derived from official public data sources and may be revised by the issuing agency. Verify independently before acting.`,
} as const;

/**
 * ⭐ **자매 사이트** — 우리 마케팅 두 축 중 하나.
 *
 * 사장님이 정하신 유일한 마케팅은 **검색 유입**과 **자사 사이트 간 유입**이다.
 * 2026-08-05 에 실측해 보니 **네 사이트 사이 링크가 0개**였다. 축 하나가 없었다.
 *
 * 검색 쪽에도 걸린다 — 인바운드 링크가 하나도 없으면 검색엔진이 **찾아올 길이 없다.**
 * 그날 서버 기록으로 24시간 동안 검색엔진 크롤러가 **0건**이었다.
 *
 * ⚠ 여기에 **klifemap.ai 는 아직 안 넣는다.** 오픈이 PG 승인으로 보류돼 있다.
 *   준비 안 된 곳으로 독자를 보내면 두 사이트가 같이 깎인다. 열리면 넣는다.
 * ⚠ wiki-tip.com 도 안 넣는다 — 네임서버가 아직 안 넘어왔다(302).
 *   **살아 있는 것만 건다.** 죽은 링크는 없느니만 못하다.
 */
export const SISTER_SITES = [
  {
    name: '100 Year Map',
    url: 'https://100yearmap.com/',
    what: 'Korean schools and majors, by the numbers',
  },
] as const;
