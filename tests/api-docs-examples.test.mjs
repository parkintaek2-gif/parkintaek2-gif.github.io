/**
 * tests/api-docs-examples.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * src/pages/api.astro 머리글이 스스로 못박은 규칙 — 「이 예제는 실제 응답과
 * 글자 단위로 같아야 한다」·「문서와 실물이 다르면 안 되는 지면」. 그런데 그
 * 규칙을 재는 검사가 없었다(astro 파일이라 못 불렀다) — 목록을
 * src/lib/api-docs.mjs 로 뺀 뒤 여기서 직접 잰다.
 *
 * ⛔ 이 검사가 지키는 것 — `live[]` 의 모든 example 주소가 handleApi() 로 실제
 *   200 을 낸다. 404·400 이 나오면 「살 수 있는 것처럼 보이는 죽은 링크」다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../src/lib/api.mjs';
import { buildLive, soon } from '../src/lib/api-docs.mjs';
import stats from '../src/data/research-stats.json' with { type: 'json' };

test('🔴 api.astro 의 example 주소는 전부 handleApi() 에서 실제로 200 이다', async () => {
  const live = buildLive(stats);
  assert.ok(live.length >= 10, 'live 목록이 너무 짧다 — 빠졌는지 본다');

  const 실패한것 = [];
  for (const e of live) {
    /* {code}·{keyword} 처럼 손님이 채워 넣을 자리표가 있으면 example 이 그걸
       실제 값으로 이미 바꿔 둔 것이다 — path 의 표시가 아니라 example 을 부른다 */
    const u = new URL('https://seoulmarkets.com' + e.example);
    // eslint-disable-next-line no-await-in-loop
    const 답 = await handleApi(u.pathname, u.searchParams, { ip: '203.0.113.' + (실패한것.length % 250 + 1), headers: {} });
    if (답.status !== 200) 실패한것.push(`${e.path} → ${e.example} (${답.status})`);
  }
  assert.deepStrictEqual(실패한것, [], '문서의 example 이 200 이 아니다:\n  · ' + 실패한것.join('\n  · '));
});

test('live 목록 — path·what·example 이 전부 있다(빈 칸으로 팔지 않는다)', () => {
  const live = buildLive(stats);
  for (const e of live) {
    assert.ok(e.path, 'path 없는 항목이 있다');
    assert.ok(e.what && e.what.length > 10, e.path + ' 의 설명이 없거나 너무 짧다');
    assert.ok(e.example, e.path + ' 의 example 이 없다');
  }
});

test('soon 목록 — path·what 이 있고 example 은 없다(아직 안 여는 것에 시연을 달지 않는다)', () => {
  for (const e of soon) {
    assert.ok(e.path && e.what);
    assert.ok(!('example' in e), e.path + ' 은 아직 안 여는데 example 이 있다');
  }
});
