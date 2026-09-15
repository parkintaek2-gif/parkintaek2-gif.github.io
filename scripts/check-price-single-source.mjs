#!/usr/bin/env node
/**
 * check-price-single-source.mjs — **지면에 적힌 값이 정본과 어긋나지 않았나.**
 *
 * ── 왜 이 자가 생겼나 (2026-09-15 아침 점검) ────────────────────────────────
 * 일일 점검표에 「값이 한 곳에서 오나 — ⬜ 손으로 본다」가 있었다. 손으로 봤더니 이랬다 —
 *
 *   ✅ 결제 위젯      /api/pay/config → src/data/licence-products.mjs 를 «읽는다»
 *   🔴 상품 카드      /data 지면에 값이 «글자로 박혀» 있다 (import 가 아예 없다)
 *        price: '$29 — one-time' · 'From $990/yr — buy below' · 'Pro from $99/mo'
 *
 * 오늘은 여섯 값이 다 맞았다. 그러나 «맞는 것»과 «맞게 되어 있는 것»은 다르다 —
 * 정본을 고치면 지면은 옛 값을 그대로 보인다. 정본 파일이 자기 머리글에 이렇게 적어 뒀다:
 *   「지면의 값과 페이팔이 받는 값이 어긋나면 **그것이 사고다**.
 *    한쪽만 고치면 손님이 화면에서 본 값과 다른 금액이 청구된다」
 *
 * ⇒ 지면을 통째로 고쳐 정본을 읽게 하는 것이 «더» 옳지만, 그것은 6번의 지면이고
 *   큰 손질이다. 그 사이에 사고가 나지 않게 **먼저 문지기를 세운다.**
 *   회사 강령 ④ — 규칙은 문장이 아니라 «검사»로 둔다.
 *
 * ⛔ 이 자는 「값이 얼마여야 한다」를 정하지 않는다. 정본이 정한다.
 *   이 자가 하는 일은 «지면이 정본과 다른 수를 말하고 있나»를 잡는 것뿐이다.
 *
 *   node scripts/check-price-single-source.mjs --자가시험
 *   node scripts/check-price-single-source.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 지면 = 'src/pages/data/index.astro';

/** 1234.5 → "1,234" · "990.00" → "990" (지면은 소수점 없이 쓴다) */
export function 돈글(값) {
  const n = Number(값);
  if (!Number.isFinite(n)) return null;
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 글에서 «$수»를 다 꺼낸다. 쉼표는 지우고 수만 남긴다 */
export function 지면속달러(글) {
  return [...String(글 ?? '').matchAll(/\$([\d,]+(?:\.\d+)?)/g)]
    .map((m) => Number(m[1].replace(/,/g, '')))
    .filter((n) => Number.isFinite(n));
}

/**
 * 지면의 «상품 카드 값 글»만 꺼낸다 — price: '…' 로 적힌 줄.
 * ⚠ 본문 산문에 나오는 수(경쟁사 값·월 환산)는 여기 안 들어온다. 그것까지 잡으면
 *   「FnGuide 연 ≈$12,000」 같은 «남의 값»을 우리 값으로 오해해 거짓 경보가 난다.
 */
export function 카드값글들(글) {
  return [...String(글 ?? '').matchAll(/price:\s*'([^']*)'/g)]
    .map((m) => m[1])
    .filter((v) => v.includes('$'));
}

/**
 * 지면 카드에 적힌 달러 수가 «전부» 정본 안에 있나.
 * 있으면 빈 배열, 어긋나면 어긋난 것들을 낸다.
 */
export function 어긋난값찾기(글, 상품표) {
  const 정본 = new Set(Object.values(상품표 ?? {}).map((p) => Math.round(Number(p.usd))));
  const 나온것 = [];
  for (const 값글 of 카드값글들(글)) {
    for (const n of 지면속달러(값글)) {
      if (!정본.has(Math.round(n))) 나온것.push({ 값글, 수: n });
    }
  }
  return 나온것;
}

/* ── 자가시험 ──────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const 표 = { a: { usd: '990.00' }, b: { usd: '29.00' }, c: { usd: '99.00' } };

  재다('돈글: 990.00 → 990', 돈글('990.00') === '990');
  재다('돈글: 2990 → 2,990', 돈글(2990) === '2,990');
  재다('돈글: 글자면 null', 돈글('값없음') === null);

  재다('지면속달러: 쉼표를 지운다', JSON.stringify(지면속달러('$2,990/yr')) === JSON.stringify([2990]));
  재다('지면속달러: 여럿을 다 꺼낸다', JSON.stringify(지면속달러('$99 or $990')) === JSON.stringify([99, 990]));
  재다('지면속달러: 값이 없으면 빈 배열', 지면속달러('Free page').length === 0);

  재다('카드값글: price 줄만 본다 · $ 없는 줄은 뺀다',
    JSON.stringify(카드값글들("price: 'Free page',\nprice: '$29 — one-time',")) === JSON.stringify(['$29 — one-time']));

  /* 🔴 이 자의 핵심 — 정본에 없는 수가 카드에 있으면 잡는다 */
  재다('🔴 정본에 없는 값이 카드에 있으면 잡는다',
    어긋난값찾기("price: '$777 — one-time',", 표).length === 1);
  재다('정본에 있는 값이면 안 잡는다', 어긋난값찾기("price: 'From $990/yr',", 표).length === 0);
  재다('여러 카드를 다 본다',
    어긋난값찾기("price: '$29 — one-time',\nprice: '$888/yr',", 표).length === 1);

  /* ⚠ 거짓 경보를 막는 자리 — 산문 속 «남의 값»은 안 본다 */
  재다('⚠ 본문 산문의 경쟁사 값은 안 잡는다(FnGuide ≈$12,000)',
    어긋난값찾기('FnGuide 전체 묶음(연 ≈$12,000)보다 낮다', 표).length === 0);
  재다('⚠ 월 환산 표기도 카드 밖이면 안 본다', 어긋난값찾기('<td>$990 ($82.50/mo)</td>', 표).length === 0);

  재다('빈 글이면 아무것도 안 잡는다', 어긋난값찾기('', 표).length === 0);
  재다('상품표가 비면 카드 값이 다 어긋난 것이다', 어긋난값찾기("price: '$29',", {}).length === 1);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

async function 본일() {
  if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 재지 않는다.'); process.exit(1); }

  const 정본경로 = path.resolve('src/data/licence-products.mjs');
  const { 상품 } = await import(pathToFileURL(정본경로).href);
  const 글 = readFileSync(path.resolve(지면), 'utf8');

  console.log('\n■ 값이 한 곳에서 오나 — 정본 src/data/licence-products.mjs');
  for (const p of Object.values(상품)) {
    console.log('   ' + String(p.코드).padEnd(16) + '$' + String(돈글(p.usd)).padStart(6) + '  ' + (p.기간글 || ''));
  }

  const 카드 = 카드값글들(글);
  console.log('\n■ ' + 지면 + ' 의 상품 카드에 «글자로 박힌» 값 ' + 카드.length + '개');
  for (const v of [...new Set(카드)]) console.log('   ' + v);

  const 읽나 = /licence-products/.test(글);
  console.log('\n■ 지면이 정본을 import 하나 — ' + (읽나 ? '✅ 한다' : '⚠ 안 한다(값 글을 따로 적는다)'));
  console.log('   ⭐ 결제 위젯은 /api/pay/config 를 거쳐 정본을 읽는다 — 청구되는 금액은 언제나 정본이다');

  const 어긋남 = 어긋난값찾기(글, 상품);
  if (어긋남.length) {
    console.log('\n🔴 **지면이 정본에 없는 값을 말하고 있다 — ' + 어긋남.length + '건**');
    for (const x of 어긋남) console.log('   $' + x.수 + '  ←  ' + x.값글);
    console.log('   ⛔ 손님이 화면에서 본 값과 다른 금액이 청구된다. 그 자리에서 고친다.');
    process.exit(1);
  }
  console.log('\n✅ 지면 카드의 값이 모두 정본 안에 있다 — 어긋난 것 없음');
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await 본일();
