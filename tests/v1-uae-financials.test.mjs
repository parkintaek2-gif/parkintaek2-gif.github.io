/**
 * tests/v1-uae-financials.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * /v1/uae-financials — 5번 지침(2026-09-14 21:5x)「/v1 갈래와 CSV 에 새 칸 여섯을
 * 실어 주십시오」의 API 쪽. CSV(build-uae-financials-digest.mjs)와 같은 원자료를
 * 낸다 — 여기서는 «API 가 실제로 내는 답»만 잰다(빌더 자가시험은 별도).
 *
 * ⛔ 이 검사가 지키는 것 — liabilities_derived=true 인 줄이 total_liabilities_aed 를
 *   «읽은 값처럼» 감춰서 내지 않는다. 감추면 우리가 지어낸 숫자를 판 것이 된다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../src/lib/api.mjs';

let 부른수 = 0;
async function 불러(길) {
  const u = new URL('https://seoulmarkets.com' + 길);
  부른수 += 1;
  const 답 = await handleApi(u.pathname, u.searchParams, { ip: '10.0.1.' + (부른수 % 250), headers: {} });
  const 몸 = JSON.parse(답.body);
  return { 답, 몸 };
}

test('/v1 색인에 uae-financials 가 적혀 있다', async () => {
  const { 몸 } = await 불러('/v1');
  assert.ok(몸.endpoints['GET /v1/uae-financials'], 'GET /v1/uae-financials 이 색인에 없다');
});

test('symbol= 로 종목 하나를 골라 낸다', async () => {
  const { 답, 몸 } = await 불러('/v1/uae-financials?symbol=ALDAR');
  assert.equal(답.status, 200);
  assert.ok(몸.results.length > 0);
  assert.ok(몸.results.every((r) => r.symbol === 'ALDAR'));
});

test('모르는 symbol 은 404 다', async () => {
  const { 답, 몸 } = await 불러('/v1/uae-financials?symbol=NOSUCHTICKER');
  assert.equal(답.status, 404);
  assert.equal(몸.error.code, 'unknown_symbol');
});

test('exchange= 로 거래소를 가른다', async () => {
  const { 몸 } = await 불러('/v1/uae-financials?exchange=DFM&limit=200');
  assert.ok(몸.results.length > 0);
  assert.ok(몸.results.every((r) => r.exchange === 'DFM'));
});

test('balance_sheet=true 는 대차대조표 있는 줄만 낸다', async () => {
  const { 몸 } = await 불러('/v1/uae-financials?balance_sheet=true&limit=200');
  assert.ok(몸.results.length > 0);
  assert.ok(몸.results.every((r) => r.balance_sheet_reconciled === true || r.liabilities_derived === true));
});

/*
 * 🔴 [2026-09-19 · 2번이 고침] 이 검사가 「DFM 은 대차대조표를 아직 안 낸다」고
 * 못박아 두었는데, 그 사이 걸프 대차대조표 수집이 진짜로 DFM 까지 넓어졌다
 * (커밋 49179ccc2·ddb4ed227 — OCR 로 얻은 줄이 실제로 늘었다). 값이 «생겼다»는
 * 사실이 아니라 값이 «지어낸 것인가」가 지켜야 할 것이었는데, 검사가 후자 대신
 * 전자(DFM 은 영원히 0건)를 재고 있었다. ⛔ 좋아진 데이터를 흠으로 잘못 세지
 * 않는다 — 「값이 있다」가 아니라 「값에 출처가 없다」를 잡게 고친다.
 */
test('🔴 값이 있는 줄은 전부 출처(대조 또는 뺀 값)가 있다 — 0 으로 채우지 않는다', async () => {
  const { 몸 } = await 불러('/v1/uae-financials?limit=500');
  const 값있는줄들 = 몸.results.filter((r) => r.total_assets_aed !== null);
  assert.ok(값있는줄들.length > 0, '값이 있는 줄이 하나도 없다 — 아래 검사가 헛돈다');
  const 출처없는것 = 값있는줄들.filter((r) => r.balance_sheet_reconciled !== true && r.liabilities_derived !== true);
  assert.deepStrictEqual(
    출처없는것.map((r) => `${r.exchange}/${r.symbol}`),
    [],
    '대조도 안 됐고 뺀 값도 아닌데 대차대조표 값이 있다 — 지어낸 값일 수 있다',
  );
  /* ⛔ 0 으로 채우는 것도 «지어낸 값»이다 — 값이 있다면서 실제로는 0 이면 안 된다 */
  assert.ok(값있는줄들.every((r) => r.total_assets_aed !== 0), '총자산이 0 으로 채워진 줄이 있다');
});

test('🔴 liabilities_derived=true 인 줄은 그 칸을 감추지 않고 함께 낸다', async () => {
  const { 몸 } = await 불러('/v1/uae-financials?balance_sheet=true&limit=300');
  const 뺀값줄 = 몸.results.find((r) => r.liabilities_derived === true);
  if (뺀값줄) {
    assert.ok(뺀값줄.total_liabilities_aed !== null, 'liabilities_derived 줄에 값이 없다');
    /* 뺀 값이니 자산 = 부채 + 자본 이 정확히 맞아야 한다(그렇게 구했으므로) */
    assert.ok(
      Math.abs(뺀값줄.total_assets_aed - (뺀값줄.total_liabilities_aed + 뺀값줄.total_equity_aed)) < 1,
      '뺀 부채가 자산−자본과 안 맞는다',
    );
  }
});

test('coverage 에 ADX·DFM 회사 수와 대차대조표 안내가 있다', async () => {
  const { 몸 } = await 불러('/v1/uae-financials?limit=1');
  assert.ok(Number.isFinite(몸.coverage.adx_companies_with_data));
  assert.ok(Number.isFinite(몸.coverage.dfm_companies_with_data));
  assert.ok(typeof 몸.coverage.balance_sheet_note === 'string' && 몸.coverage.balance_sheet_note.length > 0);
  assert.ok(typeof 몸.coverage.adx_etf_note === 'string');
});

test('투자자문·감사 아님을 밝힌다', async () => {
  const { 몸 } = await 불러('/v1/uae-financials?limit=1');
  const 전체 = JSON.stringify(몸.coverage.not_this);
  assert.match(전체, /investment advice/i);
  assert.match(전체, /audited/i);
});
