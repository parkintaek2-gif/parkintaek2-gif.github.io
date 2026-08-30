#!/usr/bin/env node
// 투자AI — 자가시험. 규칙을 문장이 아니라 «검사»로 둔다(신조 §2-④).
// 돈이 움직이는 자리(②③)의 성질을 못박는다: 결정론·롱온리·신선도·한도컷·③가 ②를 멈춘다.
import path from 'node:path';
import { 신호검증, 신호거르기 } from './lib-signal.mjs';
import { 포지션정하기, 신선도 } from './fund-manager.mjs';
import { 심사, 기본한도 } from './risk-manager.mjs';
import { 페이퍼실행 } from './run-paper.mjs';

let 통과 = 0, 실패 = 0;
const ok = (c, m) => (c ? (통과++, console.log('  ✔ ' + m)) : (실패++, console.log('  ✘ ' + m)));
const 근사 = (a, b) => Math.abs(a - b) < 1e-9;

const 신호 = (o = {}) => ({ ts: '20260828', source: 'x', sourceId: 'S1', entity: { market: 'TEST', code: 'T00001' }, kind: '실적', direction: 1, strength: 2, horizon: 20, evidence: 'e', model: 'm', ...o });

console.log('투자AI 자가시험 — 결정론 층(②③)');

// 1. 스키마: 온전한 것 통과, 흠 있는 것 거부(조용히 통과시키지 않는다)
ok(신호검증(신호()).length === 0, '온전한 신호는 통과');
ok(신호검증(신호({ direction: 2 })).length > 0, 'direction 범위 밖은 거부');
ok(신호검증(신호({ sourceId: '' })).length > 0, 'sourceId 없으면 거부(되짚기 불가)');
ok(신호검증(신호({ evidence: '' })).length > 0, 'evidence 없으면 거부(근거 없는 신호 안 받음)');
ok(신호검증(신호({ model: '' })).length > 0, 'model 없으면 거부(성과비교 깨짐)');
const { 통과: 통, 탈락 } = 신호거르기([신호(), 신호({ sourceId: '', direction: 9 })]);
ok(통.length === 1 && 탈락.length === 1 && 탈락[0].흠.length > 0, '거르기: 통과/탈락을 사유와 함께 가른다');

// 2. 신선도: 미래 신호 0, 만료 신호 0, 기간 안이면 선형
ok(신선도(신호({ ts: '20260901' }), 20260830) === 0, '미래 신호는 무게 0(룩어헤드 금지)');
ok(신선도(신호({ ts: '20260801', horizon: 15 }), 20260830) === 0, '반영기간 지난 신호는 무게 0');
ok(신선도(신호({ ts: '20260830', horizon: 20 }), 20260830) === 1, '갓 나온 신호는 무게 1');

// 3. 펀드매니저: 롱온리(음의 신호 제외), 같은 종목 합산, 비중합=1
const { 목표 } = 포지션정하기([
  신호({ sourceId: 'A', entity: { market: 'TEST', code: 'T1' }, direction: 1, strength: 3, ts: '20260830', horizon: 40 }),
  신호({ sourceId: 'B', entity: { market: 'TEST', code: 'T2' }, direction: -1, strength: 3, ts: '20260830', horizon: 40 }),
], 20260830);
ok(!('T2' in 목표), '음의 신호(공매도)는 편입 안 함 — 롱온리');
ok(근사(Object.values(목표).reduce((a, b) => a + b, 0), 1), '투자 시 비중합 = 1');
const { 목표: 빈 } = 포지션정하기([신호({ direction: 0 })], 20260830);
ok(Object.keys(빈).length === 0, '살 게 없으면 전액 현금(비중합 0)');

// 4. 결정론: 같은 입력 → 같은 출력(두 번 돌려 동일)
const 픽스처 = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../src/data/invest-ai/signals-fixture.jsonl');
const r1 = 페이퍼실행(픽스처), r2 = 페이퍼실행(픽스처);
ok(JSON.stringify(r1.승인비중) === JSON.stringify(r2.승인비중), '결정론: 같은 신호집합 → 같은 승인비중');
ok(!('T00003' in r1.승인비중), '픽스처: 음의 수급(T00003) 제외됨');
ok(!('T00004' in r1.승인비중), '픽스처: 만료 신호(T00004) 무게 0으로 빠짐');

// 5. 리스크 관리자: 종목상한 컷, 섹터상한 축소
const 심1 = 심사({ T1: 0.5, T2: 0.5 }, {}, 기본한도);
ok(심1.승인비중.T1 <= 기본한도.종목상한 + 1e-9, '종목상한(20%) 초과분을 깎는다');
const 심2 = 심사({ A: 0.2, B: 0.2, C: 0.2 }, {}, 기본한도, { A: '반도체', B: '반도체', C: '반도체' });
const 섹터합 = 심2.승인비중.A + 심2.승인비중.B + 심2.승인비중.C;
ok(섹터합 <= 기본한도.섹터상한 + 1e-9, '섹터상한(40%) 초과 시 그 섹터를 비례 축소');

// 6. ③가 ②를 멈춘다 — 이 설계의 핵심
const 손실 = 심사({ T1: 0.2 }, { 당일수익: -0.05 }, 기본한도);
ok(손실.발주중단 === true && Object.keys(손실.승인비중).length === 0, '일일손실 한도 넘으면 ③이 발주를 멈춘다(승인비중 비움)');
const 낙폭 = 심사({ T1: 0.2 }, { 누적수익: -0.20 }, 기본한도);
ok(낙폭.낙폭잠금 === true && 낙폭.발주중단 === true, '최대낙폭 넘으면 ③이 낙폭잠금');
const 재기동 = 심사({ T1: 0.2 }, { 누적수익: -0.02, 낙폭잠금: true }, 기본한도);
ok(재기동.낙폭잠금 === true, '낙폭잠금은 자동복구 안 됨 — 사람이 꺼줘야 풀린다');

console.log(`\n결과: ${통과} 통과 / ${실패} 실패`);
process.exit(실패 ? 1 : 0);
