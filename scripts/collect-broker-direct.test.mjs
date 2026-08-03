#!/usr/bin/env node
/**
 * 목표주가·투자의견 파서 시험.
 *
 *   npm run test:broker
 *
 * ── 왜 시험이 필요한가 ─────────────────────────────────────────
 * 이 파서가 틀리면 **숫자가 조용히 틀린다.** 화면은 멀쩡하고 기사도 나가는데
 * 목표주가만 다른 값이다. 「적중률」을 파는 매체에서 이건 치명적이다.
 *
 * 실제로 한 번 틀릴 뻔했다 —
 *   「목표주가를 245,000원에서 280,000원으로 상향」
 * 단순 규칙은 245,000(옛 값)을 집는다. HD현대 건은 앞 문단에 새 값이 먼저 나와서
 * **우연히** 맞았다. 문장이 하나뿐이었으면 그대로 틀린 채 나갔다.
 *
 * 표본은 전부 **실제 리포트 문장**에서 가져왔다. 지어내지 않았다.
 */

import { parseTargetPrice, normalizeRating } from './collect-broker-direct.mjs';

let 통과 = 0;
let 실패 = 0;

function 같나(이름, 실제, 기대) {
  if (실제 === 기대) {
    통과++;
  } else {
    실패++;
    console.log(`  ✗ ${이름}\n      기대 ${기대} · 실제 ${실제}`);
  }
}

console.log('목표주가 파서');

// ── 실제 문장 ────────────────────────────────────────────────
같나(
  '미래에셋 S-Oil — 만원 단위',
  parseTargetPrice('투자의견: 목표주가 15만원으로 상향 및 매수 의견 유지'),
  150000,
);
같나(
  '미래에셋 S-Oil — 기존 A에서 B로',
  parseTargetPrice('S-Oil의 목표주가를 기존 13.5만원에서 15만원으로 상향하며, 매수 의견을 유지한다.'),
  150000,
);
같나(
  '🔴 미래에셋 HD현대 — A원에서 B원으로 (옛 값을 집으면 안 된다)',
  parseTargetPrice('동사에 대한 목표주가를 245,000원에서 280,000원으로 상향한다. 상승여력은 40.3%로'),
  280000,
);
같나('원 단위 콤마', parseTargetPrice('목표주가 280,000원으로 상향하며 매수 의견 유지'), 280000);
같나('적정주가 표기', parseTargetPrice('적정주가를 52,000원으로 제시한다'), 52000);
같나('목표가 축약', parseTargetPrice('목표가 9,800원'), 9800);

// ── 없는 것을 만들어 내지 않는다 ─────────────────────────────
같나('목표주가 미제시', parseTargetPrice('투자의견 N.R, 목표주가 -'), null);
같나('숫자가 없는 문장', parseTargetPrice('목표주가를 상향 조정한다'), null);
같나('빈 입력', parseTargetPrice(''), null);
같나('null 입력', parseTargetPrice(null), null);
같나(
  '상승여력·현재주가를 목표주가로 착각하지 않는다',
  parseTargetPrice('현재주가 7,160원 대비 상승여력 40.3%'),
  null,
);
같나('말도 안 되는 값은 버린다', parseTargetPrice('목표주가 5원'), null);

console.log('투자의견 정규화');
같나('매수', normalizeRating('매수'), 'BUY');
같나('BUY 소문자', normalizeRating('buy'), 'BUY');
같나('중립', normalizeRating('중립'), 'HOLD');
같나('Hold', normalizeRating('Hold'), 'HOLD');
같나('매도', normalizeRating('매도'), 'SELL');
같나('N.R', normalizeRating('N.R'), 'NR');
같나('NR', normalizeRating('NR'), 'NR');
같나('모르는 표기는 null', normalizeRating('관심'), null);
같나('빈값', normalizeRating(''), null);

console.log(`\n${통과} 통과 · ${실패} 실패`);
process.exit(실패 ? 1 : 0);
