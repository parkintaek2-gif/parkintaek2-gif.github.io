/**
 * 기사가 금지어 하나로 죽지 않는다 — 2026-10-28 · 5번
 * ─────────────────────────────────────────────────────────────────────────
 * [무엇이 있었나] 아침에 세운 금지어 관문이 오늘 09시 기사를 「따냈」 한 낱말로 막았다.
 *   10시까지 중부매일 발행이 0건이었다. 막는 것은 옳았지만 **막기만 하고 끝나서
 *   기사가 통째로 사라졌다.** 데스킹은 「막는다」가 아니라 「고쳐서 내보낸다」다.
 *
 * [무엇을 굳히나]
 *   ① 금지어를 «바꿔 쓸 말»로 바꾼다
 *   ② 바꾸고 나면 **조사를 그 말에 맞춘다** — 「까닭은」을 「이유」로 바꾸니
 *     「이유은」이 나왔다(실측). 받침이 있고 없고에 따라 은/는·이/가·을/를·으로/로 가 갈린다
 *   ③ 손이 필요한 안내(「(빼고 쓴다)」)는 바꾸지 않는다 — 관문이 막고 사람이 고친다
 */
import test from 'node:test';
import assert from 'node:assert';

const M = await import('../scripts/collect-jbnews-sports-articles.mjs');

test('🔴 금지어를 바꿔 쓸 말로 바꾼다', () => {
  assert.strictEqual(M.금지어를바꾼다('한국이 동메달을 따냈다.', false), '한국이 동메달을 확보했다.');
});

test('🔴 바꾼 뒤 조사를 맞춘다 — 「이유은」이 나오면 안 된다', () => {
  const 결과 = M.금지어를바꾼다('그 까닭은 분명하다.', false);
  assert.strictEqual(결과, '그 이유는 분명하다.');
  assert.ok(!결과.includes('이유은'), '받침 없는 말에 「은」이 붙었다');
});

test('🔴 이/가 도 맞춘다', () => {
  assert.strictEqual(M.금지어를바꾼다('그 까닭이 있다.', false), '그 이유가 있다.');
});

test('🔴 으로 / 로 — 받침으로 가른다', () => {
  assert.strictEqual(M.조사맞추기('기준로 삼는다', '기준'), '기준으로 삼는다');
  assert.strictEqual(M.조사맞추기('이유으로 삼는다', '이유'), '이유로 삼는다');
});

test('⛔ 받침이 있는 말에는 받침꼴 조사를 둔다', () => {
  assert.strictEqual(M.조사맞추기('기준은 하나다', '기준'), '기준은 하나다');
  assert.strictEqual(M.조사맞추기('기준는 하나다', '기준'), '기준은 하나다');
});

test('⛔ 깨끗한 글은 건드리지 않는다', () => {
  const 글 = '오늘 경기는 3회에 승부가 결정됐다. 이유는 불펜이었다.';
  assert.strictEqual(M.금지어를바꾼다(글, false), 글);
});

test('⛔ 빈 것에 안 터진다', () => {
  assert.strictEqual(M.금지어를바꾼다(null, false), '');
  assert.strictEqual(M.조사맞추기(null, '이유'), '');
  assert.strictEqual(M.조사맞추기('그대로', ''), '그대로');
});

test('받침 가르기가 맞다', () => {
  assert.strictEqual(M.받침있나('기준'[1]), true);   /* 준 — ㄴ 받침 */
  assert.strictEqual(M.받침있나('이유'[1]), false);  /* 유 — 받침 없음 */
  assert.strictEqual(M.받침있나('A'), false);
});
