/**
 * tests/v1-openapi-coverage.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-19 · 2번] 실측 — src/lib/openapi.mjs 가 /v1 색인(handleApi('/v1',…))
 * 보다 «네 갈래 뒤처져» 있었다: financials·consensus·indices·uae-financials 가
 * src/lib/api.mjs 에는 실제로 있는데 openapi 스펙과 사람이 읽는 src/pages/api.astro
 * 문서 양쪽에 다 빠져 있었다. 「새로 만든 것일수록 안 잡힌다」의 실측 사례다.
 *
 * ⛔ 이 검사가 지키는 것 — /v1 색인(«한 곳의 진실», root() 가 낸다)에 있는 모든
 *   GET 갈래가 openapi.mjs 스펙에도 있다. 하나라도 빠지면 검사가 막는다.
 * ⚠ 반대(스펙에만 있고 색인에 없음)는 안 잰다 — 스펙이 색인보다 «먼저» 앞서
 *   설계되는 경우가 있을 수 있어(문서 먼저 쓰고 구현 나중) 그건 흠이 아니다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../src/lib/api.mjs';
import { openapi } from '../src/lib/openapi.mjs';

test('🔴 /v1 색인에 있는 GET 갈래는 openapi.mjs 스펙에도 있다', async () => {
  const u = new URL('https://seoulmarkets.com/v1');
  const 답 = await handleApi(u.pathname, u.searchParams, { ip: '172.16.0.1', headers: {} });
  assert.equal(답.status, 200);
  const 몸 = JSON.parse(답.body);

  const 색인갈래들 = Object.keys(몸.endpoints)
    .filter((k) => k.startsWith('GET /v1/'))
    .map((k) => k.replace('GET /v1', '').split('?')[0]) // '/v1/hs?q=' → '/hs'
    .filter((p) => p !== '/openapi.json'); // 스펙 자기 자신은 스펙 안에 자기를 안 싣는다

  const spec = openapi('https://seoulmarkets.com/v1');
  const 스펙갈래들 = new Set(Object.keys(spec.paths));

  const 빠진것 = 색인갈래들.filter((p) => !스펙갈래들.has(p));
  assert.deepStrictEqual(빠진것, [], 'openapi.mjs 스펙에 없는 /v1 갈래: ' + 빠진것.join(', '));
});

test('openapi 스펙 — 갈래마다 GET 오퍼레이션과 설명이 있다(빈 문서를 스펙이라 부르지 않는다)', () => {
  const spec = openapi('https://seoulmarkets.com/v1');
  for (const [path, ops] of Object.entries(spec.paths)) {
    assert.ok(ops.get, path + ' 에 get 오퍼레이션이 없다');
    const 설명글 = ops.get.description || ops.get.summary || '';
    assert.ok(설명글.length > 15, path + ' 의 설명(description·summary)이 없거나 너무 짧다');
    assert.ok(ops.get.responses?.[200], path + ' 에 200 응답 설명이 없다');
  }
});
