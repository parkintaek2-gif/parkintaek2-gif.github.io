/**
 * tests/api-page-rate-limit-claim.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-20 · 2번] 실측 — ENFORCE_FROM(2026-08-17)이 지난 지 한 달이 넘었는데
 * src/pages/api.astro·/v1/meta 의 tiers.policy 가 계속 "아직 시행 전 · 절대
 * 막지 않는다"고 말하고 있었다. 실제로는 이미 429 를 돌려주고 있다(개발자가
 * 이 문서만 믿고 붙이면 첫 429 에서 문서를 의심하게 된다).
 *
 * ⛔ 이 검사가 지키는 것 — 시행 중일 때 보여줄 문장(429 언급)과 시행 전에
 *   보여줄 문장("nothing is ever rejected")이 실제로 `한도정책.enforced`
 *   조건으로 갈라져 있는지를 소스에서 직접 본다. astro 파일은 조건부 JSX라
 *   dist/ 렌더 결과가 아니면 「지금 어느 문구가 나가나」를 텍스트만으로
 *   가를 수 없으므로, 삼항 연산자의 두 갈래를 각각 떼어 확인한다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tierNote } from '../src/lib/tiers.mjs';

const 지면길 = fileURLToPath(new URL('../src/pages/api.astro', import.meta.url));

test('🔴 tierNote().enforced 가 참이면 429 를 말하고 과거형 "절대 막지 않는다"는 안 말한다', () => {
  const 정책 = tierNote();
  assert.equal(정책.enforced, true, 'ENFORCE_FROM 이 과거로 고정돼 있는데 아직 enforced=false 다 — 날짜를 다시 본다');

  const 글 = fs.readFileSync(지면길, 'utf8');
  const 갈림 = 글.match(/한도정책\.enforced \? \(([\s\S]*?)\) : \(([\s\S]*?)\)\}\s*<\/p>/);
  assert.ok(갈림, '한도정책.enforced 로 가르는 삼항 JSX 블록을 못 찾았다 — 구조가 바뀌었다');

  const [, 시행중문구, 시행전문구] = 갈림;
  assert.match(시행중문구, /429/, '시행 중 갈래에 429 언급이 없다');
  assert.doesNotMatch(시행중문구, /nothing is ever rejected/i, '시행 중 갈래에 옛 「절대 막지 않는다」 문구가 남아 있다');
  assert.match(시행전문구, /nothing is ever rejected/i, '시행 전 갈래 문구 자체가 사라졌다 — 공지 약속을 지킬 수 없다');
});

test('tierNote() 의 policy 문장이 enforced 값과 어긋나지 않는다', () => {
  const 정책 = tierNote();
  if (정책.enforced) {
    assert.match(정책.policy, /429/, 'enforced=true 인데 policy 문장에 429 언급이 없다');
  } else {
    assert.match(정책.policy, /never rejected/i, 'enforced=false 인데 policy 문장이 달라졌다');
  }
});
