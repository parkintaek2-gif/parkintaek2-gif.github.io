#!/usr/bin/env node
/**
 * check-쥔자료에-안쓴축이-있나.mjs
 *   — **우리가 쥔 자료 가운데 아직 지면이 없는 것**을 센다.
 *
 * ── 🔴 왜 (2026-10-12 11:3x · 5번) ───────────────────────────────────
 *   사장님 2026-10-11 — 「**구글 ai 검색에 올인해. 헛소리 하지말고. seo geo 색인 등**」
 *
 *   오늘 아침에 AI 유입을 지면 «꼴»로 갈라 세니 이랬다 —
 *   (사이트맵 전체 장 수로 나눈 수다. 생존자 편향을 뺐다)
 *     SM 데이터  20세션 /  49장 = 0.41
 *     SM 기사    11세션 / 177장 = 0.06      → **데이터가 6.6배**
 *     KCW 데이터 29세션 /   9장 = 3.2
 *     KCW 기사   12세션 / 274장 = 0.04      → **데이터가 80배**
 *
 *   ⇒ 데이터 지면을 더 내는 것이 AI 유입을 늘리는 가장 빠른 길이다.
 *     그런데 **무엇을 낼지**를 정하는 자가 없었다.
 *
 * ── ⭐ 우리 강령에 답이 적혀 있다 ───────────────────────────────────
 *   「K Culture Wire — 한국 대중문화를 영문으로, **쥔 자료의 «안 쓰던 축»부터 찾아 낸다**」
 *   ⇒ 새 자료를 모으기 전에 **이미 쥔 것 가운데 지면이 없는 것**부터 센다.
 *     모으는 것보다 꺼내는 것이 싸다 — 오늘 새벽 얇은 지면을 채우며 겪었다.
 *
 * ── ⚠ 이 자가 말하지 «않는» 것 ───────────────────────────────────────
 *   ⛔ 「지면이 없다 = 내야 한다」가 아니다. 낼 값이 없는 자료도 있다
 *     (중간 계산물·점검 기록·다른 유닛 몫).
 *   ⛔ 그래서 이 자는 **「살펴볼 것」**을 내놓지 「만들어라」고 하지 않는다.
 *   ⚠ 이름만 보고 가른다 — 속을 열어 보지 않는다. 더 좁히려면 사람이 본다.
 *
 * 쓰는 법
 *   node scripts/check-쥔자료에-안쓴축이-있나.mjs
 *   node scripts/check-쥔자료에-안쓴축이-있나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 자료 이름에서 「축 이름」을 뽑는다 — 꼬리와 쪽수를 뗀다 */
export function 축이름(파일) {
  return String(파일 ?? '')
    .replace(/\.(json|jsonl|csv|tsv|mjs|js|ts)$/i, '')
    .replace(/-(latest|state|snapshot|tape|raw|index|meta)$/i, '')
    .trim();
}

/** 지면으로 낼 «값이 있을 만한» 자료인가 — ⛔ 「내야 한다」가 아니라 「살펴볼 것」이다 */
export function 살펴볼만한가(파일) {
  const n = String(파일 ?? '');
  if (!/\.(json|jsonl|csv)$/i.test(n)) return false;          /* 코드·문서는 뺀다 */
  /* ⛔ 다른 유닛 몫은 안 센다 — 남의 유닛 일에 끼어들지 않는다.
     🔴 [2026-10-12 11:4x · 5번] 처음엔 `/^…/` 로 **앞머리만** 봤다.
       그랬더니 `gsc-100y-2026-09-01` 같은 이름이 다 통과해 목록을 뒤덮었다 —
       서치콘솔을 날마다 긁어 둔 것이고 100yearmap(3번) 몫이다.
       ⭐ **앞머리만 보면 가운데 든 이름을 놓친다.** */
  if (/(^|[-_])(100yearmap|100y|klifemap|kcw|kculturewire)([-_]|$)/i.test(n)) return false;
  /* ⛔ 날짜가 이름에 든 것은 **날마다 쌓이는 기록**이지 지면 거리가 아니다 */
  if (/\d{4}-\d{2}-\d{2}/.test(n)) return false;
  /* ⛔ 우리 살림살이는 지면이 아니다 */
  if (/(checklist|diagnosis|audit|retry|eligibility|coverage|keyword-demand|ctr-gap|title-audit|indexed|lastmod|state-|-state|log|queue|cache|seen|sent|플레이북|점검|기록|대장)/i.test(n)) return false;
  return true;
}

/** 지면 파일 이름에서 「길」을 뽑는다 — /data/valuation 의 valuation */
export function 지면이름(파일) {
  return String(파일 ?? '').replace(/\.(astro|html|md|mdx)$/i, '').trim();
}

/** 자료 축 이름이 어느 지면에 쓰였나 — ⚠ 느슨하게 맞춘다. 이름이 꼭 같지는 않다 */
export function 쓰였나(축, 지면들) {
  const a = String(축ded(축)).toLowerCase();
  for (const p of 지면들 ?? []) {
    const b = String(축ded(p)).toLowerCase();
    if (!a || !b) continue;
    if (a === b || a.includes(b) || b.includes(a)) return true;
  }
  return false;
}
/** 견주기 쉽게 — 붙임표·밑줄을 걷는다 */
function 축ded(s) {
  return String(s ?? '').replace(/[-_\s]+/g, '');
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;

  test('자료 이름에서 축을 뽑는다', () => {
    A.equal(축이름('bond-yield-curve.json'), 'bond-yield-curve');
    A.equal(축이름('korea-index-tape.json'), 'korea-index');
    A.equal(축이름('invest-ai/state-latest.jsonl'), 'invest-ai/state', '꼬리(-latest)는 뗀다');
  });
  test('⛔ 다른 유닛 몫은 안 센다', () => {
    A.equal(살펴볼만한가('100yearmap-indexed.json'), false);
    A.equal(살펴볼만한가('klifemap-something.json'), false);
  });
  test('⛔ 우리 살림살이는 지면이 아니다', () => {
    A.equal(살펴볼만한가('daily-checklist.json'), false);
    A.equal(살펴볼만한가('index-diagnosis.json'), false);
    A.equal(살펴볼만한가('preferred-sources-eligibility.json'), false);
  });
  test('🔴 가운데 든 유닛 이름도 잡는다 — 앞머리만 보면 놓친다', () => {
    /* 2026-10-12 에 실제로 그랬다. gsc-100y-… 283개가 목록을 뒤덮었다. */
    A.equal(살펴볼만한가('gsc-100y-page-2026-10-03.json'), false);
    A.equal(살펴볼만한가('build-kcw-something.json'), false);
  });
  test('⛔ 날짜가 든 것은 날마다 쌓이는 기록이다 — 지면 거리가 아니다', () => {
    A.equal(살펴볼만한가('무엇-2026-09-01.json'), false);
  });
  test('⚠ 그래도 멀쩡한 이름을 잘못 빼지 않는다', () => {
    /* ⛔ 거르기를 넓히다 진짜 자료까지 빼면 이 자가 아무것도 안 보게 된다. */
    A.equal(살펴볼만한가('bond-yield-curve.json'), true);
    A.equal(살펴볼만한가('korea-index-tape.json'), true);
  });

  test('⛔ 코드 파일은 안 센다', () => {
    A.equal(살펴볼만한가('daily-checklist.mjs'), false);
  });
  test('✅ 진짜 자료는 센다', () => {
    A.equal(살펴볼만한가('bond-yield-curve.json'), true);
    A.equal(살펴볼만한가('country-trade-profiles.json'), true);
  });
  test('🔴 지면에 쓰인 축을 알아본다 — 이름이 꼭 같지는 않다', () => {
    A.equal(쓰였나('kospi-weights', ['kospi-weights']), true);
    A.equal(쓰였나('bond_yield_curve', ['bond-yield-curve']), true, '붙임표·밑줄은 걷는다');
    A.equal(쓰였나('valuation', ['data-valuation-extra']), true, '품으면 쓰인 것으로 본다');
  });
  test('⛔ 안 쓰인 것은 안 쓰였다고 한다', () => {
    A.equal(쓰였나('bond-yield-curve', ['valuation', 'concentration']), false);
    A.equal(쓰였나('무엇', []), false);
  });
  test('⚠ 이 자가 「만들어라」고 하지 않는다 — 코드에 그렇게 적혀 있다', () => {
    const 나 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
    A.ok(나.includes('「만들어라」고 하지 않는다'));
    A.ok(나.includes('낼 값이 없는 자료도 있다'));
  });
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  await 자가시험();
} else {
  console.log('■ 우리가 «쥔» 자료 가운데 아직 지면이 없는 것');
  console.log('   🔴 사장님 2026-10-11 — 「구글 ai 검색에 올인해. seo geo 색인 등」');
  console.log('   ⭐ AI 유입은 데이터 지면이 기사의 **6.6배**다(장 수로 나눈 수).');
  console.log('   ⭐ 우리 강령 — 「쥔 자료의 «안 쓰던 축»부터 찾아 낸다」. 모으는 것보다 꺼내는 것이 싸다.');
  console.log('');

  let 자료들; let 지면들;
  try { 자료들 = fs.readdirSync(path.join(뿌리, 'src', 'data')); }
  catch (e) { console.log('⬜ 자료방을 못 읽었다 — **못 쟀다**: ' + e.message); process.exit(0); }
  try { 지면들 = fs.readdirSync(path.join(뿌리, 'src', 'pages', 'data')).map(지면이름); }
  catch (e) { console.log('⬜ 지면방을 못 읽었다 — **못 쟀다**: ' + e.message); process.exit(0); }

  const 볼것 = 자료들.filter(살펴볼만한가);
  const 안쓴것 = 볼것.map(축이름).filter((축) => !쓰였나(축, 지면들));

  console.log('   자료 ' + 자료들.length + '개 · 그중 살펴볼 만한 것 ' + 볼것.length + '개');
  console.log('   데이터 지면 ' + 지면들.length + '장');
  console.log('   ⇒ 지면이 «없는» 축 ' + 안쓴것.length + '개');
  console.log('');

  if (!안쓴것.length) {
    console.log('✅ 쥔 자료가 다 지면으로 나와 있다 — 새 자료를 모을 때다');
    process.exit(0);
  }

  console.log('   ■ 살펴볼 것 (이름순 · 서른 개까지)');
  for (const 축 of 안쓴것.slice(0, 30)) console.log('      · ' + 축);
  if (안쓴것.length > 30) console.log('      … 그 밖 ' + (안쓴것.length - 30) + '개');

  console.log('');
  console.log('   ⛔ 「지면이 없다 = 내야 한다」가 아니다 — 낼 값이 없는 자료도 있다.');
  console.log('      이 자는 **「살펴볼 것」**을 내놓지 「만들어라」고 하지 않는다.');
  console.log('   ⚠ 이름만 보고 가른다 — 속을 열어 보지 않았다. 더 좁히려면 사람이 본다.');
  console.log('   ⭐ 고를 때 — 「그 지면에만 있는 수」가 나오는 자료부터 본다.');
  console.log('      오늘 새벽 얇은 지면 열여섯 장을 채우며 가장 잘 들었던 것이 그것이다.');
}
