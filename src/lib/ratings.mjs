/**
 * 투자의견 사전 — 22종으로 흩어진 표기를 하나의 척도로 편다.
 *
 * ── 왜 필요한가 ─────────────────────────────────────────────────
 * 아카이브 66,071건의 `opinion` 값이 **22종**이다. 같은 뜻이 이렇게 갈려 있다.
 *
 *   Buy 37,571 · 매수 14,159        한글과 영문
 *   Buy / BUY                       대소문자
 *   Trading / Tirading              **원본 오타**
 *   MarketUnderPe                   **원본에서 잘린 표기**
 *   투자의견없음 2,465 · null 8,046  「없다」와 「아직 안 받았다」가 섞여 있다
 *
 * 이대로면 집계도 필터도 안 된다. 그리고 **적중률 엔진이 여기 걸려 있다** —
 * 「Trading 이 맞았나」를 세려면 Trading 이 무엇인지부터 정해야 한다.
 *
 * ── 지키는 선 ───────────────────────────────────────────────────
 * **원본 `rating` 은 그대로 내보낸다.** 증권사가 실제로 쓴 말이 사실이고,
 * 우리 분류는 그 위에 얹는 해석이다. 둘을 바꿔치기하면 원본을 잃는다.
 *
 * **Outperform 을 Buy 로 접지 않는다.** 한국 증권사에서 Outperform 은 Buy 보다
 * 한 단계 아래로 쓰인다. 접으면 편해지지만 그 순간 데이터가 거짓이 된다.
 *
 * **score 는 우리 것이라고 밝힌다.** 증권사가 매긴 숫자가 아니다.
 * 집계용으로 우리가 부여한 순서일 뿐이고, 응답에 그렇게 적는다.
 */

/**
 * 정규 등급. score 는 **집계용 순서**이지 증권사가 매긴 값이 아니다.
 * 높을수록 낙관. `none` 은 순서가 없으므로 null 이다.
 */
export const RATING_SCALE = {
  strong_buy: { label: 'Strong Buy', score: 6, stance: 'positive' },
  buy: { label: 'Buy', score: 5, stance: 'positive' },
  outperform: { label: 'Outperform', score: 4, stance: 'positive' },
  trading_buy: { label: 'Trading Buy', score: 4, stance: 'positive' },
  hold: { label: 'Hold', score: 3, stance: 'neutral' },
  underperform: { label: 'Underperform', score: 2, stance: 'negative' },
  sell: { label: 'Sell', score: 1, stance: 'negative' },
  none: { label: 'No rating', score: null, stance: null },
};

/**
 * 원본 표기 → 정규 등급.
 *
 * ⚠ **비교 전에 소문자로 바꾸고 공백을 뗀다.** 그래야 `Buy`/`BUY`/`buy` 가 한 줄로 끝난다.
 * ⚠ 오타(`Tirading`)와 잘린 표기(`MarketUnderPe`)를 **그대로 키로 넣는다.**
 *   원본을 고치지 않는다 — 우리가 받은 것이 그것이고, 언젠가 원본이 고쳐지면
 *   그때는 새 표기가 사전에 없어서 null 로 드러난다. 그게 맞는 동작이다.
 */
const 표기 = {
  /* 매수 계열 */
  strongbuy: 'strong_buy',
  buy: 'buy',
  매수: 'buy',
  outperform: 'outperform',
  비중확대: 'outperform',

  /* Trading Buy — 한국 시장 관행. 「단기 매수」이지 일반 매수가 아니다.
     Buy 로 접으면 기간이 다른 의견이 섞인다. */
  trading: 'trading_buy',
  tirading: 'trading_buy', // 원본 오타. 1건

  /* 중립 계열 */
  hold: 'hold',
  중립: 'hold',
  neutral: 'hold',
  marketperform: 'hold',
  시장수익률: 'hold',

  /* 매도 계열 */
  reduce: 'underperform',
  underperform: 'underperform',
  marketunderpe: 'underperform', // 원본에서 잘린 표기(MarketUnderPerform). 10건
  marketunderperform: 'underperform',
  비중축소: 'underperform',
  sell: 'sell',
  매도: 'sell',

  /* 의견을 내지 않은 것. **null(안 받음)과 다르다** */
  투자의견없음: 'none',
};

/**
 * 원본 표기를 정규 등급으로 바꾼다.
 *
 * 돌려주는 값 셋을 구분한다.
 *   `undefined` 입력 → null           아직 상세를 안 받았다
 *   사전에 있는 표기 → 등급 객체
 *   사전에 없는 표기 → `unknown` 표시  **추측하지 않는다.** 새 표기가 생겼다는 신호다
 */
export function normaliseRating(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const 키 = String(raw).toLowerCase().replace(/[\s._-]/g, '');
  const 등급 = 표기[키];
  if (!등급) {
    // 사전에 없는 값을 그럴듯하게 채우지 않는다. 드러내야 사전을 고친다.
    return { code: 'unknown', label: null, score: null, stance: null, raw: String(raw) };
  }
  return { code: 등급, ...RATING_SCALE[등급], raw: String(raw) };
}

/** 사전 통계. `/v1/meta` 가 쓴다. */
export const RATING_STATS = {
  source_forms: Object.keys(표기).length,
  normalised_levels: Object.keys(RATING_SCALE).length,
};
