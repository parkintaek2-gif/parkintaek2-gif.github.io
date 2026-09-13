/**
 * tests/v1-new-endpoints.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 사장님 지시 (2026-09-13): 「마무리 해」 — /v1/financials · /v1/consensus · /v1/indices.
 *
 * 🔴 이 검사가 지키는 것은 «셋이 산다»가 아니라 «못 잰 것을 0 으로 팔지 않는다» 다.
 *   유료로 파는 자료다. 0 하나가 옳은 스물셋을 같이 의심받게 한다(강령 ③).
 *
 * ⚠ 빌더의 자가시험(18·21·23)은 «표를 짓는 규칙»을 잰다. 이 검사는 «API 가 내는 답»을 잰다.
 *   둘은 다른 자리다 — 빌더가 맞아도 라우팅이 빠지면 손님은 404 를 본다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../src/lib/api.mjs';

/**
 * handleApi(pathname, searchParams, ctx) → { status, headers, body }.
 * ⚠ free 등급은 분당 60번이다. 검사가 한 아이피를 다 쓰면 뒤쪽이 429 로 떨어진다 —
 *   부를 때마다 다른 아이피를 준다. 한도를 재는 검사가 아니다.
 */
let 부른수 = 0;
async function 불러(길) {
  const u = new URL('https://seoulmarkets.com' + 길);
  부른수 += 1;
  const 답 = await handleApi(u.pathname, u.searchParams, { ip: '10.0.0.' + (부른수 % 250), headers: {} });
  assert.ok(답, '이 갈래를 API 가 아예 안 받는다: ' + 길);
  assert.notEqual(답.status, 429, '한도에 걸렸다 — 검사 쪽 문제다: ' + 길);
  const 몸 = JSON.parse(답.body);
  /* 오류는 { error: { code, message, hint } } 꼴이다. 검사에서 편히 읽게 펴 준다 */
  if (몸 && 몸.error && typeof 몸.error === 'object') {
    return { 답, 몸: { ...몸, error: 몸.error.code, message: 몸.error.message, hint: 몸.error.hint } };
  }
  return { 답, 몸 };
}

/* ── /v1 색인 — 적어 놓고 안 지은 것이 없어야 한다 ─────────── */
test('/v1 색인에 네 갈래가 다 적혀 있다', async () => {
  const { 답, 몸 } = await 불러('/v1');
  assert.equal(답.status, 200);
  for (const 이름 of ['GET /v1/financials', 'GET /v1/consensus', 'GET /v1/indices', 'GET /v1/ownership']) {
    assert.ok(몸.endpoints[이름], 이름 + ' 이 색인에 없다');
  }
});

/**
 * 🔴 이 검사가 잡는 것은 「색인에 적어 놓고 라우팅을 안 붙인 갈래」다 — 오늘 셋이 그랬다.
 * ⚠ 400(물음이 빠졌다)·「아직 안 모았다」는 정직한 답이지 구멍이 아니다.
 *   /v1/hs 는 q 가 있어야 하고, /v1/trade/flash 는 수집을 아직 안 시작했다고 스스로 말한다.
 *   그 둘을 실패로 세면 이 검사가 「고칠 수 없는 빨강」이 되어 아무도 안 보게 된다.
 */
test('색인에 적힌 갈래는 하나도 «없는 갈래»가 아니다', async () => {
  const { 몸 } = await 불러('/v1');
  const 길들 = Object.keys(몸.endpoints)
    .filter((k) => k.startsWith('GET /v1/'))
    .map((k) => k.replace('GET ', '').split('?')[0])
    .filter((x) => !x.includes('{'));
  assert.ok(길들.length >= 10);
  for (const 길 of 길들) {
    const { 답, 몸: 답몸 } = await 불러(길);
    assert.notEqual(답몸.error, 'unknown_endpoint', 길 + ' 이 색인에 적혔는데 라우팅이 없다');
    assert.ok([200, 400, 404].includes(답.status), 길 + ' 이 뜻밖의 값을 냈다: ' + 답.status);
    if (답.status === 404) {
      assert.ok(답몸.message || 답몸.hint, 길 + ' 이 404 인데 까닭을 말하지 않는다');
    }
  }
});

/* ── /v1/financials ───────────────────────────────────────── */
test('financials — 줄이 나오고 커버리지가 붙는다', async () => {
  const { 답, 몸 } = await 불러('/v1/financials?limit=5');
  assert.equal(답.status, 200);
  assert.equal(몸.results.length, 5);
  assert.ok(몸.returned_of > 1000, '줄이 너무 적다: ' + 몸.returned_of);
  assert.ok(몸.coverage.source.includes('DART'));
  assert.ok(몸.coverage.years.length >= 1);
});

test('financials — 못 잰 줄은 null 이지 0 이 아니다', async () => {
  const { 몸 } = await 불러('/v1/financials?limit=200');
  const 못잰것 = 몸.results.filter((r) => !r.measured);
  for (const r of 못잰것) {
    for (const 칸 of ['assets_krw', 'equity_krw', 'revenue_krw', 'operating_profit_krw', 'net_profit_krw']) {
      assert.equal(r[칸], null, r.code + ' 의 ' + 칸 + ' 가 못 잰 줄인데 null 이 아니다');
    }
    assert.equal(r.basis, null);
  }
});

test('financials — basis 는 CFS 나 OFS 뿐이다', async () => {
  const { 몸 } = await 불러('/v1/financials?limit=200');
  for (const r of 몸.results) {
    assert.ok([null, 'CFS', 'OFS'].includes(r.basis), '모르는 basis: ' + r.basis);
    if (r.measured) assert.ok(r.basis, '쟀다면서 basis 가 없다: ' + r.code);
  }
});

test('financials — 없는 종목은 404 로 «까닭과 함께»', async () => {
  const { 답, 몸 } = await 불러('/v1/financials?ticker=999999');
  assert.equal(답.status, 404);
  assert.equal(몸.error, 'unknown_ticker');
  assert.ok(몸.hint.includes('6-digit'));
});

test('financials — 해로 거를 수 있다', async () => {
  const { 몸 } = await 불러('/v1/financials?year=2025&limit=50');
  assert.ok(몸.results.length > 0);
  assert.ok(몸.results.every((r) => r.year === 2025));
});

test('financials — measured=true 는 못 잰 줄을 뺀다', async () => {
  const 다 = await 불러('/v1/financials?year=2025&limit=1');
  const 잰것 = await 불러('/v1/financials?year=2025&measured=true&limit=1');
  assert.ok(잰것.몸.returned_of < 다.몸.returned_of, '거른 쪽이 더 적어야 한다');
  assert.ok(잰것.몸.results.every((r) => r.measured));
});

/* ── /v1/consensus ────────────────────────────────────────── */
test('consensus — 리포트가 기본이다', async () => {
  const { 답, 몸 } = await 불러('/v1/consensus?limit=5');
  assert.equal(답.status, 200);
  assert.equal(몸.kind, 'reports');
  assert.equal(몸.results.length, 5);
  assert.ok(몸.coverage.report_snapshots.length >= 1);
});

test('consensus — 이전 목표가가 없으면 변동률이 null 이다', async () => {
  const { 몸 } = await 불러('/v1/consensus?limit=200');
  for (const r of 몸.results) {
    if (r.previous_target_price_krw === null) {
      assert.equal(r.target_change_pct, null,
        '이전 목표가가 없는데 변동률이 있다 — 「모른다」를 「안 바뀌었다」로 판 것이다: ' + r.report_id);
    }
  }
});

test('consensus — 같은 보고서가 두 번 나오지 않는다', async () => {
  const { 몸 } = await 불러('/v1/consensus?limit=200');
  const 본것 = new Set(몸.results.map((r) => r.report_id));
  assert.equal(본것.size, 몸.results.length, '겹친 보고서가 있다');
});

test('consensus — 애널리스트 순위의 정확도 0 은 «안 낸 것»이다', async () => {
  const { 몸 } = await 불러('/v1/consensus?kind=analysts&limit=100');
  assert.equal(몸.kind, 'analysts');
  assert.ok(몸.results.length > 0);
  for (const r of 몸.results) {
    assert.notEqual(r.accuracy, 0, '정확도 0 을 그대로 팔고 있다: ' + r.name);
    if (r.accuracy === null) assert.equal(r.accuracy_not_published, true);
  }
});

test('consensus — 모르는 kind 는 400 이다', async () => {
  const { 답, 몸 } = await 불러('/v1/consensus?kind=엉뚱');
  assert.equal(답.status, 400);
  assert.equal(몸.error, 'unknown_kind');
});

test('consensus — target_changed=true 는 변동률이 있는 것만 낸다', async () => {
  const { 몸 } = await 불러('/v1/consensus?target_changed=true&limit=50');
  assert.ok(몸.results.length > 0);
  assert.ok(몸.results.every((r) => r.target_change_pct !== null));
});

/* ── /v1/indices ──────────────────────────────────────────── */
test('indices — 날짜가 붙은 이력이다', async () => {
  const { 답, 몸 } = await 불러('/v1/indices?limit=5');
  assert.equal(답.status, 200);
  assert.equal(몸.results.length, 5);
  assert.ok(몸.coverage.days >= 2, '하루치뿐이면 이력이 아니다');
  assert.ok(몸.results.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date)));
});

test('indices — index-tape 와 다른 것임을 밝힌다', async () => {
  const { 몸 } = await 불러('/v1/indices?limit=1');
  assert.ok(몸.coverage.not_index_tape.includes('/v1/index-tape'),
    '두 갈래가 어떻게 다른지 손님에게 말해 주지 않는다');
});

test('indices — 연최저 0 을 팔지 않는다', async () => {
  const { 몸 } = await 불러('/v1/indices?limit=200');
  for (const r of 몸.results) {
    assert.notEqual(r.year_low, 0, '연최저 0 을 그대로 팔고 있다: ' + r.name + ' ' + r.date);
    if (r.year_low === null) assert.equal(r.year_low_not_measured, true);
  }
});

test('indices — 이름 목록을 «한글·영문 짝»으로 낸다', async () => {
  const { 몸 } = await 불러('/v1/indices?list=names');
  assert.ok(몸.count > 100, '지수가 너무 적다: ' + 몸.count);
  const 코스피 = 몸.names.find((x) => x.name === '코스피');
  assert.ok(코스피, '코스피가 목록에 없다');
  assert.ok(코스피.name_en, '영문 이름이 없다 — 영어권 손님은 무엇을 물어야 할지 모른다');
  /* 🔴 영어 매체다. 영문이 안 붙은 지수가 많으면 목록이 쓸모가 없다 */
  const 영문있는것 = 몸.names.filter((x) => x.name_en).length;
  assert.ok(영문있는것 / 몸.count > 0.9, '영문 이름이 붙은 비율이 낮다: ' + 영문있는것 + '/' + 몸.count);
});

test('indices — 영문 이름으로도 찾을 수 있다', async () => {
  const { 몸: 한글 } = await 불러('/v1/indices?name=코스피&limit=50');
  const 영문이름 = 한글.results[0].name_en;
  assert.ok(영문이름, '코스피에 영문 이름이 없다');
  const { 답, 몸 } = await 불러('/v1/indices?name=' + encodeURIComponent(영문이름) + '&limit=50');
  assert.equal(답.status, 200);
  assert.equal(몸.returned_of, 한글.returned_of, '영문으로 물었을 때 줄 수가 다르다');
});

test('indices — 이름은 «정확히» 맞을 때만 낸다', async () => {
  const { 몸 } = await 불러('/v1/indices?name=코스피&limit=200');
  /* ⛔ 「코스피 200」·「코스피 200 금융」이 섞이면 손님이 남의 값을 자기 것으로 읽는다 */
  assert.ok(몸.results.every((r) => r.name === '코스피'),
    '부분일치가 섞였다: ' + [...new Set(몸.results.map((r) => r.name))].join(' · '));
});

test('indices — 이름 하나로 시계열이 나온다', async () => {
  const { 몸 } = await 불러('/v1/indices?name=코스피&limit=50');
  assert.ok(몸.results.length >= 2, '코스피가 하루치뿐이다');
  assert.ok(몸.results.every((r) => r.name === '코스피'));
  /* 최신 날이 앞에 온다 */
  assert.ok(몸.results[0].date >= 몸.results[몸.results.length - 1].date);
});

test('indices — 없는 이름은 404 로 «어디서 이름을 보는지»까지 말한다', async () => {
  const { 답, 몸 } = await 불러('/v1/indices?name=없는지수');
  assert.equal(답.status, 404);
  assert.equal(몸.error, 'unknown_index');
  assert.ok(몸.hint.includes('list=names'));
});

test('indices — since 로 자를 수 있다', async () => {
  const { 몸: 다 } = await 불러('/v1/indices?name=코스피&limit=50');
  const 가운데 = 다.results[Math.floor(다.results.length / 2)].date;
  const { 몸: 자른것 } = await 불러('/v1/indices?name=코스피&since=' + 가운데 + '&limit=50');
  assert.ok(자른것.results.every((r) => r.date >= 가운데));
  assert.ok(자른것.returned_of <= 다.returned_of);
});

/* ── 셋 다 «이건 자문이 아니다»를 달고 나간다 ──────────────── */
test('세 갈래 모두 「우리 것이 아니다·자문이 아니다」를 붙인다', async () => {
  for (const 길 of ['/v1/financials?limit=1', '/v1/consensus?limit=1', '/v1/indices?limit=1']) {
    const { 몸 } = await 불러(길);
    assert.ok(몸.coverage.not_this, 길 + ' 에 not_this 가 없다');
  }
});
