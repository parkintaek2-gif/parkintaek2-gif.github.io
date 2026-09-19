/**
 * tests/data-page-billing-claim.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-19 · 2번] 실측 — src/pages/data/index.astro 가 「월간 플랜이
 * 없다·자동갱신이 없다」고 적어 뒀는데, 같은 지면의 Buy 상자(Annual/Monthly
 * 토글)는 실제로 월간 정기결제(single_monthly·all_monthly, PayPal 구독,
 * 「Cancel any time」)를 판다. 돈을 받는 지면에서 손님에게 결제 조건을
 * 틀리게 말한 것이다 — 같은 날(2026-09-13) 만들어진 기능인데 문구만
 * 안 따라갔다.
 *
 * ⛔ 이 검사가 지키는 것 — 월간(recurring) 상품이 licence-products.mjs 에
 *   있는 한, /data 지면이 「월간 플랜이 없다」는 취지의 문장을 다시 적지
 *   않는다. 소스 텍스트를 직접 읽는다(astro 파일이라 렌더링해서 재는 것보다
 *   가볍고, 이 검사는 «문구가 있나/없나»만 보면 된다).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { 상품 } from '../src/data/licence-products.mjs';

const 지면길 = fileURLToPath(new URL('../src/pages/data/index.astro', import.meta.url));

test('🔴 월간(정기결제) 상품이 있으면, 지면이 「월간 플랜이 없다」고 말하지 않는다', () => {
  const 월간있음 = Object.values(상품).some((p) => p.기간 === 'month');
  assert.ok(월간있음, '지금 월간 상품이 하나도 없다 — 이 검사가 무엇을 지키는지 다시 본다');

  const 글 = fs.readFileSync(지면길, 'utf8');
  assert.doesNotMatch(글, /no monthly plan/i, '월간 상품이 있는데 지면이 「월간 플랜이 없다」고 말한다');
  assert.doesNotMatch(글, /there is no monthly plan and no automatic renewal/i);
});

test('/data 지면이 월간 결제의 자동갱신·취소 조건을 실제로 안내한다', () => {
  const 글 = fs.readFileSync(지면길, 'utf8');
  assert.match(글, /renews? (every month|automatically|monthly)/i, '월간 결제가 자동갱신된다는 안내를 못 찾았다');
  assert.match(글, /cancel/i, '취소 방법·조건에 대한 언급을 못 찾았다');
});
