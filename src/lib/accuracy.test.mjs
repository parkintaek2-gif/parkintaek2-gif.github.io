/**
 * 적중률 엔진 시험.
 *
 * **주가가 없어도 로직이 맞는지 지금 증명한다.** 합성 주가를 넣어 판정을 확인한다.
 * 포털이 열려 실제 주가가 오면, 바꿀 것은 주가 공급자 하나뿐이고 이 시험은 그대로 통과해야 한다.
 *
 * 실행: npm run test:accuracy
 */

import { evaluateOne, evaluateMany, OUTCOME } from './accuracy.mjs';

let 통과 = 0;
let 실패 = 0;
const 확인 = (이름, 조건, 덧 = '') => {
  if (조건) { 통과++; console.log(`  ✅ ${이름}`); }
  else { 실패++; console.log(`  ✕ ${이름}${덧 ? ' — ' + 덧 : ''}`); }
};

/** 합성 주가. 종목명으로 시나리오를 고른다. */
const 가짜주가 = {
  async range(종목) {
    switch (종목) {
      case '오른종목': return { high: 120000, low: 90000, last: 115000, days: 240 };
      case '안오른종목': return { high: 80000, low: 60000, last: 70000, days: 240 };
      case '찍고내린종목': return { high: 105000, low: 50000, last: 55000, days: 240 };
      case '상장폐지종목': return { high: 60000, low: 0, last: 0, days: 30, delistedOn: '2025-03-10' };
      case '주가없음': return null;
      default: return null;
    }
  },
};

const 레코드 = (덮기 = {}) => ({
  d: '2025-01-02', h: '삼성증권', s: '오른종목', p: 100000, o: '매수', f: true, ...덮기,
});

console.log('적중률 엔진 시험');
console.log('');

console.log('① 기본 판정');
{
  const r = await evaluateOne(레코드(), 가짜주가);
  확인('목표가에 닿으면 hit', r.outcome === OUTCOME.hit, r.outcome);
  확인('법인 식별자가 붙는다', r.broker === 'samsung', r.broker);

  const m = await evaluateOne(레코드({ s: '안오른종목' }), 가짜주가);
  확인('못 닿으면 miss', m.outcome === OUTCOME.miss, m.outcome);
}

console.log('');
console.log('② ⭐ 찍고 내려온 것은 적중이다');
{
  /* 목표주가는 「거기까지 간다」는 예측이지 「그날 그 값이다」가 아니다.
     마지막 종가로만 재면 이 건이 빗나감이 되는데 그건 틀린 판정이다. */
  const r = await evaluateOne(레코드({ s: '찍고내린종목' }), 가짜주가);
  확인('기간 중 고가가 목표를 넘으면 hit', r.outcome === OUTCOME.hit, r.outcome);
  확인('오차율은 마지막 종가 기준으로 따로 낸다', r.errorRatio > 0, String(r.errorRatio));
}

console.log('');
console.log('③ ⭐ 주가를 모르면 miss 가 아니라 unknown 이다');
{
  const r = await evaluateOne(레코드({ s: '주가없음' }), 가짜주가);
  확인('unknown 이다', r.outcome === OUTCOME.unknown, r.outcome);
  확인('miss 가 아니다', r.outcome !== OUTCOME.miss);
  확인('제외 이유가 남는다', r.excluded === 'no_price_data', r.excluded);
}

console.log('');
console.log('④ ⭐ 평가 대상이 아닌 것을 걸러낸다');
{
  const 평가기관 = await evaluateOne(레코드({ h: '서울평가정보' }), 가짜주가);
  확인('평가기관은 제외 (목표주가를 애초에 안 낸다)', 평가기관.excluded === 'not_a_brokerage', 평가기관.excluded);

  const 목표없음 = await evaluateOne(레코드({ p: null }), 가짜주가);
  확인('목표주가 없으면 제외', 목표없음.excluded === 'no_target_price', 목표없음.excluded);

  const 의견없음 = await evaluateOne(레코드({ o: '투자의견없음' }), 가짜주가);
  확인('의견 없으면 제외', 의견없음.excluded === 'no_rating', 의견없음.excluded);

  const 모르는곳 = await evaluateOne(레코드({ h: '처음보는증권' }), 가짜주가);
  확인('사전에 없는 기관은 추측하지 않고 제외', 모르는곳.excluded === 'unknown_institution', 모르는곳.excluded);
}

console.log('');
console.log('⑤ ⭐ 상장폐지를 조용히 빼지 않는다 (생존편향)');
{
  const r = await evaluateOne(레코드({ s: '상장폐지종목' }), 가짜주가);
  확인('판정은 한다', r.outcome === OUTCOME.miss, r.outcome);
  확인('상장폐지를 표시한다', r.delistedOn === '2025-03-10', String(r.delistedOn));
}

console.log('');
console.log('⑥ ⭐ 사명이 달라도 한 법인으로 묶인다');
{
  const { summary } = await evaluateMany(
    [
      레코드({ h: '이트레이드증권' }),
      레코드({ h: '이베스트투자증권' }),
      레코드({ h: '이베스트증권', s: '안오른종목' }),
    ],
    가짜주가,
  );
  const e = summary.byBroker['ls-securities'];
  확인('세 이름이 한 법인으로 합쳐진다', e && e.evaluated === 3, JSON.stringify(Object.keys(summary.byBroker)));
  확인('적중률이 계산된다', e && e.hitRate === 66.67, String(e?.hitRate));
}

console.log('');
console.log('⑦ ⭐ unknown 은 분모에 안 들어간다');
{
  const { summary } = await evaluateMany(
    [레코드(), 레코드({ s: '안오른종목' }), 레코드({ s: '주가없음' }), 레코드({ h: '서울평가정보' })],
    가짜주가,
  );
  확인('판정한 것만 분모다 (2건)', summary.evaluated === 2, String(summary.evaluated));
  확인('적중률 50%', summary.hitRate === 50, String(summary.hitRate));
  확인('unknown 2건이 따로 세어진다', summary.unknown === 2, String(summary.unknown));
  확인('커버리지를 드러낸다 (50%)', summary.coverage === 50, String(summary.coverage));
  확인('제외 사유가 집계된다', summary.excluded['no_price_data'] === 1 && summary.excluded['not_a_brokerage'] === 1,
    JSON.stringify(summary.excluded));
}

console.log('');
console.log('─'.repeat(50));
console.log(`통과 ${통과} · 실패 ${실패}`);
if (실패) process.exit(1);
