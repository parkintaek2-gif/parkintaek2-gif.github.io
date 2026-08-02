/**
 * 기관 사전 — 한글 사명을 **영문명·동일법인·기관유형**으로 편다.
 *
 * ── 왜 필요한가 ─────────────────────────────────────────────────
 * `/v1/research` 는 영문 API 인데 값이 한글로 나간다. "미래에셋증권", "매수".
 * 해외 개발자가 그대로 못 쓴다. **영문화가 이 데이터의 상품 실체다**
 * (docs/사업전략-데이터제공업.md §1-① — 「영문화가 가장 큰 빈칸」).
 *
 * ── 그런데 번역만으로는 안 된다. 두 가지가 더 있었다 ─────────────
 * 아카이브가 2007~2026 **20년치**라 그 사이의 변화가 그대로 쌓여 있다.
 *
 * **① 같은 회사가 여러 이름으로 들어 있다.**
 *   이트레이드증권 → 이베스트투자증권(2015) → LS증권(2024)
 *   이 셋을 따로 세면 「기관 44곳」이 부풀고, 「이 증권사의 20년 적중률」이 안 나온다.
 *   → `entity` 로 묶는다. **원본 이름은 그대로 두고** 같은 법인이라는 것만 표시한다.
 *
 * **② 증권사가 아닌 곳이 7곳 있다.**
 *   한국IR협의회·나이스디앤비·NICE평가정보·한국기업데이터·한국기술신용평가·
 *   서울평가정보·SCI평가정보 — **평가기관이지 증권사가 아니다.**
 *   이들은 기업분석 리포트를 내지만 **목표주가를 제시하지 않는다.**
 *   섞어 놓으면 「목표주가 없는 리포트」가 증권사의 누락처럼 보인다.
 *   실제로 `/v1/research` 첫 응답에 서울평가정보가 targetPrice:null 로 나왔다.
 *   → `type` 으로 가른다. 적중률을 낼 때 이걸 안 가르면 통계가 틀린다.
 *
 * ── 지어내지 않는다 ─────────────────────────────────────────────
 * 영문명을 확인하지 못한 곳은 `verified:false` 로 둔다. 그럴듯한 이름으로 채우면
 * 데이터 상품으로서 끝난다(api.mjs 설계원칙 2와 같다).
 * `verified:false` 는 **틀렸다는 뜻이 아니라 출처로 확인하지 못했다는 뜻**이다.
 */

/**
 * @typedef {Object} 기관
 * @property {string} en        영문명
 * @property {string} entity    동일 법인 식별자. 사명이 바뀌어도 이것은 안 바뀐다
 * @property {string} type      brokerage | credit-rating | ir-service
 * @property {boolean} verified 영문명을 출처로 확인했는가
 * @property {string} [note]    사명 변경 등 알아야 할 것
 */

/** @type {Record<string, 기관>} */
export const INSTITUTIONS = {
  /* ── 증권사 ─────────────────────────────────────────────── */
  하나증권: { en: 'Hana Securities', entity: 'hana', type: 'brokerage', verified: true, note: 'Formerly Hana Financial Investment' },
  미래에셋증권: { en: 'Mirae Asset Securities', entity: 'mirae-asset', type: 'brokerage', verified: true },
  대우증권: { en: 'Daewoo Securities', entity: 'mirae-asset', type: 'brokerage', verified: true, note: 'Merged into Mirae Asset (via Mirae Asset Daewoo, 2016)' },
  키움증권: { en: 'Kiwoom Securities', entity: 'kiwoom', type: 'brokerage', verified: true },
  대신증권: { en: 'Daishin Securities', entity: 'daishin', type: 'brokerage', verified: true },
  신한투자증권: { en: 'Shinhan Securities', entity: 'shinhan', type: 'brokerage', verified: true, note: 'Formerly Shinhan Investment' },
  굿모닝증권: { en: 'Good Morning Securities', entity: 'shinhan', type: 'brokerage', verified: true, note: 'Became Good Morning Shinhan, then Shinhan Investment' },
  IBK투자증권: { en: 'IBK Investment & Securities', entity: 'ibk', type: 'brokerage', verified: true },

  /* 이트레이드 → 이베스트투자 → LS. 네 표기가 전부 아카이브에 있다.
     「이베스트투자」는 리스트 수집에서 잘린 표기로 보인다 — 원본을 고치지 않고 여기서 흡수한다. */
  이트레이드증권: { en: 'E*TRADE Korea Securities', entity: 'ls-securities', type: 'brokerage', verified: true, note: 'Renamed eBEST Investment & Securities in 2015' },
  이베스트투자증권: { en: 'eBEST Investment & Securities', entity: 'ls-securities', type: 'brokerage', verified: true, note: 'Renamed LS Securities in 2024' },
  이베스트증권: { en: 'eBEST Investment & Securities', entity: 'ls-securities', type: 'brokerage', verified: true, note: 'Same firm as eBEST Investment & Securities; now LS Securities' },
  이베스트투자: { en: 'eBEST Investment & Securities', entity: 'ls-securities', type: 'brokerage', verified: true, note: 'Truncated form found in the source listing' },

  현대차증권: { en: 'Hyundai Motor Securities', entity: 'hyundai-motor', type: 'brokerage', verified: true },
  교보증권: { en: 'Kyobo Securities', entity: 'kyobo', type: 'brokerage', verified: true },
  DB금융투자: { en: 'DB Financial Investment', entity: 'db', type: 'brokerage', verified: true, note: 'Formerly Dongbu Securities' },
  SK증권: { en: 'SK Securities', entity: 'sk', type: 'brokerage', verified: true },
  유진투자증권: { en: 'Eugene Investment & Securities', entity: 'eugene', type: 'brokerage', verified: true },
  유안타증권: { en: 'Yuanta Securities Korea', entity: 'yuanta', type: 'brokerage', verified: true, note: 'Formerly Tongyang Securities' },
  한화투자증권: { en: 'Hanwha Investment & Securities', entity: 'hanwha', type: 'brokerage', verified: true },
  DS투자증권: { en: 'DS Investment & Securities', entity: 'ds', type: 'brokerage', verified: true },

  /* LIG → 케이프. 두 이름이 다 있다. */
  LIG투자증권: { en: 'LIG Investment & Securities', entity: 'cape', type: 'brokerage', verified: true, note: 'Became Cape Investment & Securities' },
  케이프투자증권: { en: 'Cape Investment & Securities', entity: 'cape', type: 'brokerage', verified: true },

  /* 하이투자 → iM. 대구은행 지주(iM금융)로 편입되며 바뀌었다. */
  하이투자증권: { en: 'Hi Investment & Securities', entity: 'im-securities', type: 'brokerage', verified: true, note: 'Renamed iM Securities' },
  iM증권: { en: 'iM Securities', entity: 'im-securities', type: 'brokerage', verified: true, note: 'Formerly Hi Investment & Securities' },

  /* KTB → 다올 (2022-03-24). 아카이브에는 옛 이름만 있다. */
  KTB투자증권: { en: 'KTB Investment & Securities', entity: 'daol', type: 'brokerage', verified: true, note: 'Renamed Daol Investment & Securities in March 2022' },

  삼성증권: { en: 'Samsung Securities', entity: 'samsung', type: 'brokerage', verified: true },

  /* 메리츠 — 종금 겸업 시절 표기가 셋. 「메리츠종금」은 잘린 표기다. */
  메리츠종금증권: { en: 'Meritz Securities', entity: 'meritz', type: 'brokerage', verified: true, note: 'Formerly Meritz Comprehensive Financial Securities' },
  메리츠종금: { en: 'Meritz Securities', entity: 'meritz', type: 'brokerage', verified: true, note: 'Truncated form found in the source listing' },
  메리츠증권: { en: 'Meritz Securities', entity: 'meritz', type: 'brokerage', verified: true },

  한국투자증권: { en: 'Korea Investment & Securities', entity: 'korea-investment', type: 'brokerage', verified: true },
  토러스투자증권: { en: 'Taurus Investment & Securities', entity: 'taurus', type: 'brokerage', verified: true },
  KB증권: { en: 'KB Securities', entity: 'kb', type: 'brokerage', verified: true },
  한양증권: { en: 'Hanyang Securities', entity: 'hanyang', type: 'brokerage', verified: true },
  NH투자증권: { en: 'NH Investment & Securities', entity: 'nh', type: 'brokerage', verified: true },
  BNK투자증권: { en: 'BNK Investment & Securities', entity: 'bnk', type: 'brokerage', verified: true },
  골든브릿지투자증권: { en: 'Golden Bridge Investment & Securities', entity: 'golden-bridge', type: 'brokerage', verified: true },
  신영증권: { en: 'Shinyoung Securities', entity: 'shinyoung', type: 'brokerage', verified: true },

  /* ── 증권사가 아닌 곳 ────────────────────────────────────────
     **목표주가를 제시하지 않는다.** 적중률 통계에서 반드시 갈라야 한다. */
  한국IR협의회: { en: 'Korea IR Service', entity: 'kirs', type: 'ir-service', verified: false, note: 'Industry body publishing sponsored company analysis; does not issue target prices' },
  나이스디앤비: { en: 'NICE D&B', entity: 'nice-dnb', type: 'credit-rating', verified: true },
  NICE평가정보: { en: 'NICE Information Service', entity: 'nice-info', type: 'credit-rating', verified: true },
  한국기업데이터: { en: 'Korea Enterprise Data', entity: 'ked', type: 'credit-rating', verified: false, note: 'Now trading as KODATA' },
  '한국기술신용평가(주)': { en: 'Korea Technology Credit Rating', entity: 'ktcr', type: 'credit-rating', verified: false, note: 'English name not confirmed against an official source' },
  SCI평가정보: { en: 'SCI Information Service', entity: 'seoul-credit', type: 'credit-rating', verified: false, note: 'Renamed Seoul Credit Rating & Information in April 2025' },
  서울평가정보: { en: 'Seoul Credit Rating & Information', entity: 'seoul-credit', type: 'credit-rating', verified: false, note: 'Formerly SCI Information Service' },
};

/**
 * 법인의 **현재 이름**. 아카이브의 표기와 다를 수 있어서 따로 둔다.
 *
 * ── 왜 필요한가 ─────────────────────────────────────────────────
 * 처음엔 사전에 먼저 나온 표기를 대표명으로 썼는데, 그러면 **가장 오래된 사명이
 * 대표가 된다.** `ls-securities` 가 「E*TRADE Korea Securities」로 나왔다 —
 * 2015년에 없어진 이름이다. 이용자에게 없는 회사를 알려 주는 셈이다.
 *
 * 그리고 **현재 이름이 아카이브에 아예 없는 경우가 있다.** LS증권은 2024년에 바뀌었는데
 * 우리 리포트에는 아직 「이베스트투자증권」으로만 들어와 있다. 그래서 별표로 둔다.
 *
 * 여기 없는 법인은 그 법인의 표기 중 하나를 쓴다(이름이 안 바뀐 곳들이다).
 */
export const ENTITY_CURRENT_NAME = {
  'ls-securities': { en: 'LS Securities', ko: 'LS증권', since: '2024' },
  'im-securities': { en: 'iM Securities', ko: 'iM증권', since: '2024' },
  daol: { en: 'Daol Investment & Securities', ko: '다올투자증권', since: '2022' },
  'mirae-asset': { en: 'Mirae Asset Securities', ko: '미래에셋증권' },
  shinhan: { en: 'Shinhan Securities', ko: '신한투자증권' },
  cape: { en: 'Cape Investment & Securities', ko: '케이프투자증권' },
  meritz: { en: 'Meritz Securities', ko: '메리츠증권' },
  hana: { en: 'Hana Securities', ko: '하나증권' },
  'seoul-credit': { en: 'Seoul Credit Rating & Information', ko: '서울평가정보', since: '2025' },
  ked: { en: 'KODATA', ko: '한국평가데이터', since: '2020' },
};

/** 기관 유형을 사람이 읽는 말로. 응답에 그대로 실린다. */
export const INSTITUTION_TYPES = {
  brokerage: 'Securities firm. Issues investment opinions and target prices.',
  'credit-rating': 'Credit rating or corporate information agency. Publishes company analysis but does not issue target prices.',
  'ir-service': 'Investor relations body. Publishes sponsored company analysis; does not issue target prices.',
};

/**
 * 한글 사명을 편다. **모르는 이름은 null 을 돌려준다 — 추측하지 않는다.**
 * 새 증권사가 아카이브에 나타나면 여기서 null 이 나오고, 그게 사전을 고치라는 신호다.
 */
export function describeInstitution(name) {
  if (!name) return null;
  const hit = INSTITUTIONS[name];
  if (!hit) return null;
  return { ...hit, ko: name };
}

/** 사전 통계. `/v1/meta` 가 쓴다. */
export const INSTITUTION_STATS = {
  names: Object.keys(INSTITUTIONS).length,
  entities: new Set(Object.values(INSTITUTIONS).map((v) => v.entity)).size,
  brokerages: new Set(Object.values(INSTITUTIONS).filter((v) => v.type === 'brokerage').map((v) => v.entity)).size,
  non_brokerages: new Set(Object.values(INSTITUTIONS).filter((v) => v.type !== 'brokerage').map((v) => v.entity)).size,
  unverified: Object.values(INSTITUTIONS).filter((v) => !v.verified).length,
};
