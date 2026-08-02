/**
 * 적중률 계산 엔진 — 증권사 목표주가가 맞았는가.
 *
 * ── 왜 지금 짜는가 ──────────────────────────────────────────────
 * 주가 데이터가 아직 없다(공공데이터포털 가입 차단). 그런데 **로직은 지금 짤 수 있고,
 * 주가가 오는 날 바로 돈다.** `docs/작업스케줄-2026하반기.md` 8월 항목에 그렇게 잡혀 있다.
 *
 * 그리고 이것이 아카이브를 상품으로 만드는 자리다. 66,071건은 그 자체로는 목록이고,
 * **「그래서 맞았나」에 답할 때 비로소 아무도 못 만드는 것이 된다.**
 *
 * ── 표본 (2026-08-03 실측) ──────────────────────────────────────
 *   전체 66,071
 *   ✕  4,164  증권사가 아니다 — 평가기관·IR기관은 목표주가를 애초에 안 낸다
 *   ✕  6,198  목표주가가 없다
 *   ✕    486  의견이 없거나 상세를 못 받았다
 *   ✅ 55,223  평가 가능 (83.6%)
 *
 * ⚠ **연도 분포가 고르지 않다.** 2007년 11건 뒤 **2008~2013 이 통째로 비어 있고**
 *   2014년부터 조밀하다. 「2007~2026 20년치」는 범위로는 맞지만 **밀도로는 2014년부터**다.
 *   적중률을 연도별로 낼 때 이 구멍을 표시하지 않으면 추이가 거짓말이 된다.
 *
 * ── 이 엔진이 지키는 것 ─────────────────────────────────────────
 * **① 주가가 없으면 「빗나감」이 아니라 「평가 못 함」이다.**
 *    없는 것을 실패로 세면 증권사를 모함하는 것이고, 우리 숫자가 틀린 것이다.
 * **② 상장폐지된 종목을 조용히 빼지 않는다.**
 *    빼면 살아남은 종목만 남아 적중률이 부풀려진다(생존편향). 별도로 센다.
 * **③ 판정은 규칙이 한다.** LLM 을 부르지 않는다.
 *    같은 입력에 같은 답이 나와야 하고, 그것이 이 데이터의 값어치다.
 */

import { describeInstitution } from './institutions.mjs';
import { normaliseRating } from './ratings.mjs';

/**
 * 주가 공급자 계약.
 *
 * 아직 구현이 없다. 포털이 열리면 이 모양에 맞춰 하나 만들면 엔진이 그대로 돈다.
 * **엔진이 주가 출처를 몰라야** 나중에 출처를 바꿔도 판정 로직이 안 흔들린다.
 *
 * @typedef {Object} 주가공급자
 * @property {(종목:string, 시작:string, 끝:string) => Promise<null | {high:number, low:number, last:number, days:number, delistedOn?:string}>} range
 *   기간 내 고가·저가·마지막 종가. **모르면 null 을 준다. 0 이나 추정을 주지 않는다.**
 */

/** 판정 결과. `unknown` 은 실패가 아니다 — 셋을 절대 섞지 않는다. */
export const OUTCOME = {
  hit: 'hit',           // 기간 안에 목표주가에 닿았다
  miss: 'miss',         // 안 닿았다
  unknown: 'unknown',   // 주가를 몰라 판정할 수 없다  ← miss 와 다르다
};

/** 기본 평가 기간. 증권사 목표주가의 관행이 12개월이다. */
export const DEFAULT_HORIZON_DAYS = 365;

/**
 * 한 건을 평가한다.
 *
 * @param {object} rec  인덱스 레코드 {d,h,s,p,o,f}
 * @param {주가공급자} prices
 */
export async function evaluateOne(rec, prices, { horizonDays = DEFAULT_HORIZON_DAYS } = {}) {
  const inst = describeInstitution(rec.h);
  const rating = normaliseRating(rec.o);

  /* 평가 대상이 아닌 것을 미리 걷어낸다. **제외 이유를 남긴다** —
     나중에 「왜 이 건이 빠졌나」에 답할 수 있어야 한다. */
  if (!inst) return { outcome: OUTCOME.unknown, excluded: 'unknown_institution' };
  if (inst.type !== 'brokerage') return { outcome: OUTCOME.unknown, excluded: 'not_a_brokerage' };
  if (rec.p === null || rec.p === undefined) return { outcome: OUTCOME.unknown, excluded: 'no_target_price' };
  if (!rating || rating.score === null) return { outcome: OUTCOME.unknown, excluded: 'no_rating' };
  if (!rec.d || !rec.s) return { outcome: OUTCOME.unknown, excluded: 'incomplete_record' };

  const 시작 = rec.d;
  const 끝 = 날짜더하기(rec.d, horizonDays);

  const px = await prices.range(rec.s, 시작, 끝);
  /* ⚠ 주가를 모르면 여기서 끝난다. **빗나감으로 세지 않는다.** */
  if (!px) return { outcome: OUTCOME.unknown, excluded: 'no_price_data', broker: inst.entity, from: 시작, to: 끝 };

  /* 상장폐지는 빼지 않고 표시해 둔다. 빼면 생존편향으로 적중률이 부풀려진다. */
  const 상장폐지 = px.delistedOn ?? null;

  /**
   * 판정 — **기간 안에 한 번이라도 목표가에 닿았으면 적중**이다.
   * 마지막 종가로만 재면 「목표가를 찍고 내려온 것」이 빗나감이 되는데,
   * 목표주가는 「거기까지 간다」는 예측이지 「그날 그 값이다」가 아니다.
   */
  const 닿음 = px.high >= rec.p;

  /* 오차율은 마지막 종가 기준. 「얼마나 빗나갔나」는 도달 여부와 다른 질문이다. */
  const 오차 = px.last > 0 ? (rec.p - px.last) / px.last : null;

  return {
    outcome: 닿음 ? OUTCOME.hit : OUTCOME.miss,
    broker: inst.entity,
    brokerName: inst.en,
    subject: rec.s,
    date: rec.d,
    targetPrice: rec.p,
    rating: rating.code,
    stance: rating.stance,
    high: px.high,
    last: px.last,
    /** 목표가 대비 마지막 종가의 괴리. 양수면 목표가가 높았던 것 */
    errorRatio: 오차 === null ? null : Number(오차.toFixed(4)),
    tradingDays: px.days,
    ...(상장폐지 ? { delistedOn: 상장폐지 } : {}),
  };
}

/**
 * 여러 건을 평가해 집계한다.
 *
 * **집계 단위는 `entity` 다.** 사명이 바뀐 회사를 따로 세면
 * 「이 증권사의 12년 적중률」이 안 나온다(eBEST 는 네 이름으로 흩어져 있었다).
 */
export async function evaluateMany(records, prices, opts = {}) {
  const 결과 = [];
  for (const r of records) 결과.push(await evaluateOne(r, prices, opts));

  const 집계 = {
    total: records.length,
    hit: 0,
    miss: 0,
    unknown: 0,
    excluded: {},
    byBroker: {},
    byYear: {},
    delisted: 0,
  };

  for (const e of 결과) {
    집계[e.outcome]++;
    if (e.excluded) 집계.excluded[e.excluded] = (집계.excluded[e.excluded] ?? 0) + 1;
    if (e.delistedOn) 집계.delisted++;
    if (e.outcome === OUTCOME.unknown) continue;

    for (const [키, 통] of [
      [e.broker, 집계.byBroker],
      [(e.date ?? '').slice(0, 4), 집계.byYear],
    ]) {
      if (!키) continue;
      통[키] ??= { hit: 0, miss: 0, errorSum: 0, errorN: 0, name: e.brokerName };
      통[키][e.outcome]++;
      if (e.errorRatio !== null) { 통[키].errorSum += e.errorRatio; 통[키].errorN++; }
    }
  }

  /* 비율은 마지막에 낸다. **판정한 것만 분모에 넣는다** — unknown 을 넣으면
     주가를 못 구한 만큼 적중률이 내려가고, 그건 증권사 탓이 아니다. */
  const 마무리 = (통) => {
    for (const v of Object.values(통)) {
      const n = v.hit + v.miss;
      v.evaluated = n;
      v.hitRate = n ? Number(((v.hit / n) * 100).toFixed(2)) : null;
      v.meanError = v.errorN ? Number((v.errorSum / v.errorN).toFixed(4)) : null;
      delete v.errorSum; delete v.errorN;
    }
  };
  마무리(집계.byBroker);
  마무리(집계.byYear);

  const 판정됨 = 집계.hit + 집계.miss;
  집계.evaluated = 판정됨;
  집계.hitRate = 판정됨 ? Number(((집계.hit / 판정됨) * 100).toFixed(2)) : null;
  /** 얼마나 평가하지 못했나. **이 숫자를 감추면 적중률이 거짓말이 된다** */
  집계.coverage = records.length ? Number(((판정됨 / records.length) * 100).toFixed(2)) : null;

  return { results: 결과, summary: 집계 };
}

/** 날짜에 일수를 더한다. 이 PC 는 KST 다 — toISOString 은 UTC 라 쓰지 않는다. */
function 날짜더하기(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number);
  const t = new Date(y, m - 1, d + days);
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}
