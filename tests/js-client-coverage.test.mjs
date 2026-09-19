/**
 * tests/js-client-coverage.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-19 · 2번] 실측 — clients/js/seoulmarkets.mjs 가 「손님이 API 를
 * 처음 만나는 자리」라고 자기 머리글에 적어 두고도, 실제로 도는 /v1 갈래 19개
 * 중 6개만 감싸고 있었다(hs·search·countries·meta·tradeFlash·tradeExports).
 * financials·valuation·people·mezzanine·ownership·consensus·indices·
 * index-tape·research·institutions·account-dictionary·uae-financials 열두
 * 개가 빠져 있었다 — 오늘 세 번째로 만난 같은 병(api.astro·openapi.mjs 도
 * 같은 이유로 빠져 있었다)이다.
 *
 * ⛔ 이 검사가 지키는 것 — /v1 색인에 있는 모든 GET 갈래를 이 클라이언트가
 *   메서드로 감싼다. `fetch` 를 진짜 네트워크가 아니라 handleApi() 로 바로
 *   보내는 다리를 꽂아서(주입식 fetch), 실제로 맞는 경로를 부르는지까지 잰다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../src/lib/api.mjs';
import { Client, SeoulMarketsError } from '../clients/js/seoulmarkets.mjs';

/** fetch 를 흉내 내되, 네트워크 대신 handleApi() 를 바로 부른다 */
function 다리fetch(ip = '198.51.100.1') {
  return async (url) => {
    const u = url instanceof URL ? url : new URL(String(url));
    const 답 = await handleApi(u.pathname, u.searchParams, { ip, headers: {} });
    return {
      ok: 답.status >= 200 && 답.status < 300,
      status: 답.status,
      statusText: '',
      json: async () => JSON.parse(답.body),
    };
  };
}

/** /v1 색인의 GET 경로 → 클라이언트 메서드 이름. ⛔ 여기 없는 경로가 생기면 아래 검사가 잡는다 */
const 경로대메서드 = {
  '/openapi.json': null, // 클라이언트가 감쌀 대상이 아니다(문서 자체)
  '/meta': 'meta',
  '/hs/{code}': 'hs',
  '/hs?q=': 'search',
  '/countries': 'countries',
  '/institutions': 'institutions',
  '/research': 'research',
  '/trade/flash': 'tradeFlash',
  '/trade/exports': 'tradeExports',
  '/valuation': 'valuation',
  '/index-tape': 'indexTape',
  '/account-dictionary': 'accountDictionary',
  '/people': 'people',
  '/mezzanine': 'mezzanine',
  '/ownership': 'ownership',
  '/financials': 'financials',
  '/uae-financials': 'uaeFinancials',
  '/consensus': 'consensus',
  '/indices': 'indices',
};

test('🔴 /v1 색인의 모든 GET 갈래가 클라이언트 메서드 이름표에 있다', async () => {
  const 답 = await handleApi('/v1', new URLSearchParams(), { ip: '198.51.100.2', headers: {} });
  const 몸 = JSON.parse(답.body);
  const 색인갈래들 = Object.keys(몸.endpoints)
    .filter((k) => k.startsWith('GET /v1/'))
    .map((k) => k.replace('GET /v1', '').split('?')[0] + (k.includes('?q=') ? '?q=' : ''));

  const 안적힌것 = [];
  for (const 경로 of 색인갈래들) {
    if (경로 in 경로대메서드) continue;
    if (경로 === '/hs' && '/hs?q=' in 경로대메서드) continue; // search 항목이 대신한다
    안적힌것.push(경로);
  }
  assert.deepStrictEqual(안적힌것, [], '이름표에 없는 /v1 갈래: ' + 안적힌것.join(', '));
});

test('🔴 이름표에 적힌 메서드는 실제로 Client 위에 있다', () => {
  const 없는것 = [];
  for (const [경로, 메서드] of Object.entries(경로대메서드)) {
    if (!메서드) continue;
    if (typeof Client.prototype[메서드] !== 'function') 없는것.push(`${경로} → ${메서드}`);
  }
  assert.deepStrictEqual(없는것, [], 'Client 에 없는 메서드: ' + 없는것.join(', '));
});

test('research()·financials()·valuation()·people() 이 실제로 맞는 갈래를 부른다(handleApi 다리로)', async () => {
  const sm = new Client({ fetch: 다리fetch() });

  const r1 = await sm.research({ limit: 1 });
  assert.ok(Array.isArray(r1.results));

  const r2 = await sm.financials({ ticker: '005930' });
  assert.equal(r2.results[0].code ?? r2.results[0].ticker, '005930');

  const r3 = await sm.valuation({ ticker: '005930' });
  assert.ok(r3.result, 'ticker= 로 부르면 {result} 가 나와야 한다(financials 의 {results} 와 다른 모양이다)');

  const r4 = await sm.people({ limit: 1 });
  assert.ok(Array.isArray(r4.results));
});

test('uaeFinancials()·consensus()·indices()·ownership() 도 맞는 갈래를 부른다', async () => {
  const sm = new Client({ fetch: 다리fetch() });

  const r1 = await sm.uaeFinancials({ symbol: 'ALDAR' });
  assert.ok(r1.results.length >= 1);

  const r2 = await sm.consensus({ ticker: '121600' });
  assert.ok(Array.isArray(r2.results));

  const r3 = await sm.indices({ name: 'KOSPI 200' });
  assert.ok(Array.isArray(r3.results));

  const r4 = await sm.ownership({ ticker: '005930' });
  assert.ok(Array.isArray(r4.results));
});

test('모르는 종목은 SeoulMarketsError 로 던진다 — 조용히 빈 값을 안 준다', async () => {
  const sm = new Client({ fetch: 다리fetch() });
  await assert.rejects(() => sm.financials({ ticker: '000000' }), SeoulMarketsError);
});
