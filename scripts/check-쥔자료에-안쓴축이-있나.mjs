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

/**
 * 🔴🔴 [2026-10-12 20:3x · 5번] **이름 맞춤이 방금 낸 지면을 「없다」고 했다.**
 * ─────────────────────────────────────────────────────────────────────
 * `/data/workday-denominator` 를 내고 배포까지 끝낸 뒤에 이 자를 돌렸더니
 * `korea-workdays` 가 **여전히 「안 쓴 축」에 있었다.**
 * ⛔ 지면 이름(workday-denominator)과 자료 이름(korea-workdays)이 다르기 때문이다.
 *   그리고 그 자료를 읽는 것은 지면이 아니라 **자**(measure-workday-denominator.mjs)다.
 *
 * ⭐ 이름을 «짐작»하지 말고 **실제로 무엇을 읽는지**를 본다.
 *   지면과 자의 글에서 `src/data/<이름>.json` 과 `../../data/<이름>.json` 을 뽑는다.
 *   이것은 맞춤이 아니라 **의존**이라 틀릴 자리가 없다.
 * ⚠ 기사는 저장소에 소스가 없어 여전히 낱말로만 본다 — 그 한계는 따로 적는다.
 */
export function 글에서자료뽑기(글) {
  const 찾은것 = new Set();
  const 꼴 = /(?:src\/data|\.\.\/\.\.\/data|\.\/data|data)\/([A-Za-z0-9_\-/]+)\.(?:json|jsonl)/g;
  let m = 꼴.exec(String(글 ?? ''));
  while (m) {
    찾은것.add(m[1]);
    m = 꼴.exec(String(글 ?? ''));
  }
  return 찾은것;
}

/** 지면과 자가 «실제로 읽는» 자료 이름을 모은다 */
export function 읽히는자료(뿌리, fsMod = fs, pathMod = path) {
  const 모은것 = new Set();
  const 볼곳 = [
    { 방: pathMod.join(뿌리, 'src', 'pages', 'data'), 꼬리: /\.(astro|ts|js|mjs)$/i },
    { 방: pathMod.join(뿌리, 'scripts'), 꼬리: /^measure-.*\.mjs$/i },
  ];
  for (const { 방, 꼬리 } of 볼곳) {
    let 이름들;
    try { 이름들 = fsMod.readdirSync(방); } catch { continue; }   /* ⬜ 못 읽으면 넘어간다 */
    for (const n of 이름들) {
      if (!꼬리.test(n)) continue;
      let 글;
      try { 글 = fsMod.readFileSync(pathMod.join(방, n), 'utf8'); } catch { continue; }
      for (const d of 글에서자료뽑기(글)) 모은것.add(d);
    }
  }
  return 모은것;
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
  /* 🔴 [2026-10-12 20:3x] 이름 맞춤이 방금 낸 지면을 「없다」고 했다 — 의존을 읽는다 */
  test('🔴 지면 글에서 «실제로 읽는» 자료를 뽑는다', () => {
    A.deepEqual([...글에서자료뽑기("import f from '../../data/ceo-tenure.json';")], ['ceo-tenure']);
    A.deepEqual([...글에서자료뽑기("readFileSync(path.join(뿌리, 'src/data/korea-workdays.json'))")],
      ['korea-workdays']);
    A.ok(글에서자료뽑기("'src/data/invest-ai/state-latest.jsonl'").has('invest-ai/state-latest'),
      '폴더가 든 길도 읽는다');
  });
  test('⛔ 한 글에 여럿이면 다 뽑는다 — 하나만 보면 샌다', () => {
    const 글 = "import a from '../../data/x.json';\nreadFileSync('src/data/y.json')";
    A.deepEqual([...글에서자료뽑기(글)].sort(), ['x', 'y']);
  });
  test('⛔ 없으면 빈 집합이다 — null 이 아니다', () => {
    A.equal(글에서자료뽑기('아무 자료도 안 읽는다').size, 0);
    A.equal(글에서자료뽑기(null).size, 0);
  });
  test('⬜ 방을 못 읽으면 넘어간다 — 터지지 않는다', () => {
    const 가짜fs = { readdirSync() { throw new Error('없다'); }, readFileSync() { return ''; } };
    A.equal(읽히는자료('/아무데나', 가짜fs, path).size, 0);
  });
  test('🔴 지면이 아니라 «자»가 읽는 자료도 잡는다 — workday 건이 그랬다', () => {
    const 가짜fs = {
      readdirSync(방) {
        return String(방).includes('scripts') ? ['measure-workday-denominator.mjs'] : [];
      },
      readFileSync() { return "readFileSync(path.join(뿌리, 'src/data/korea-workdays.json'))"; },
    };
    A.ok(읽히는자료('/뿌리', 가짜fs, path).has('korea-workdays'));
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

  /* 🔴 이름을 짐작하지 않고 «실제로 읽히는» 자료를 본다(위 읽히는자료 주석) */
  const 읽힘 = 읽히는자료(뿌리);
  const 읽힘정규 = new Set([...읽힘].map((d) => 축ded(축이름(d + '.json')).toLowerCase()));

  const 볼것 = 자료들.filter(살펴볼만한가);
  const 안쓴것 = 볼것
    .map(축이름)
    .filter((축) => !읽힘정규.has(축ded(축).toLowerCase()))
    .filter((축) => !쓰였나(축, 지면들));

  console.log('   자료 ' + 자료들.length + '개 · 그중 살펴볼 만한 것 ' + 볼것.length + '개');
  console.log('   데이터 지면 ' + 지면들.length + '장 · 지면과 자가 «실제로 읽는» 자료 ' + 읽힘.size + '개');
  console.log('   ⇒ 지면이 «없는» 축 ' + 안쓴것.length + '개');
  console.log('');

  if (!안쓴것.length) {
    console.log('✅ 쥔 자료가 다 지면으로 나와 있다 — 새 자료를 모을 때다');
    process.exit(0);
  }

  /* 🔴🔴 [2026-10-12 17:2x · 5번] **이 자가 「이미 쓴 축」을 「안 쓴 축」이라고 내놓았다.**
     ─────────────────────────────────────────────────────────────────────
     오늘 korea-executives-tape 를 골라 `/data/ceo-tenure` 를 다 짓고 빌드한 «뒤에야»
     우리 기사 `/article/korea-ceo-tenure-eleven-year-median` 이 있는 것을 봤다.
     tenure 축으로 쓴 기사가 **여섯 장 더** 있었다.
     ⛔ 까닭 — 이 자는 `src/pages/data` 만 센다. **기사는 저장소에 소스가 없고**
       빌드 산출물(`dist/article`)에만 있어 아예 안 세어졌다.
     ⭐ 더 나빴던 것 — 그 기사는 설립일보다 긴 재임 148건을 **이미 걸러냈는데**
       내 첫 자는 안 걸러, 기사가 「의심스럽다」고 밝힌 줄을 지면 맨 앞에 낼 뻔했다.
     ⇒ 고른 축마다 `check-이축으로-이미낸게있나.mjs` 로 **한 번 더 본다.**
       ⛔ 이름만으로는 못 잇는다(korea-executives ↔ ceo-tenure). 그 자는 «자료 속 열쇠»로 찾는다.
     ⚠ dist 가 없으면 **못 쟀다**고 적는다 — 「없다」로 읽지 않는다. */
  const 기사방 = path.join(뿌리, 'dist', 'article');
  /* ⬜ 못 쟀으면 null 로 둔다 — 빈 Set 으로 두면 「걸린 것이 없다」가 되어 거짓이 난다 */
  let 걸린축 = null;
  if (!fs.existsSync(기사방)) {
    console.log('   ⬜ dist/article 이 없다 — **기사로 이미 쓴 축을 못 가린다.**');
    console.log('      아래 목록에 «이미 기사로 낸 축»이 섞여 있을 수 있다.');
    console.log('      먼저 npx astro build 를 돌리면 이 자가 걸러 준다.');
  } else {
    let 이미낸것;
    try { ({ 이미낸것 } = await import('./check-이축으로-이미낸게있나.mjs')); }
    catch { 이미낸것 = null; }
    if (typeof 이미낸것 !== 'function') {
      console.log('   ⬜ check-이축으로-이미낸게있나 를 못 불러왔다 — **기사 쪽을 못 쟀다**');
    } else {
      const 걸린것 = [];
      for (const 축 of 안쓴것) {
        let r = null;
        try { r = 이미낸것(축); } catch { /* 한 축이 깨져도 나머지는 센다 */ }
        const 기사걸림 = (r?.맞은것 ?? []).filter((x) => x.어디 === '기사');
        if (기사걸림.length) 걸린것.push({ 축, 수: 기사걸림.length, 첫: 기사걸림[0] });
      }
      /* ⭐ [2026-10-12 18:0x · 5번] **목록을 뒤집는다.**
         처음에는 185개를 내놓고 「이 가운데 155개가 의심스럽다」고 덧붙였다.
         ⛔ 그건 거꾸로다 — 사람은 **바로 손댈 수 있는 것**을 보고 싶어 한다.
         걸린 것 가운데 진짜가 많았다(bond-yield-curve ↔ korea-government-bond-yield-curve,
         cpi-telecom-base-effect ↔ korea-cpi-mobile-fee-base-effect).
         ⇒ 그러면 「안 쓴 축 185개」라는 말 자체가 틀렸던 것이다. 빼고 보여 준다. */
      걸린축 = new Set(걸린것.map((g) => g.축));
      console.log('   기사 ' + fs.readdirSync(기사방).length + '장도 함께 봤다 — '
        + '그 가운데 **이미 기사로 다룬 듯한 축 ' + 걸린것.length + '개는 아래 목록에서 뺀다**');
      if (걸린것.length) {
        console.log('   ⚠ 뺀 보기 — ' + 걸린것.slice(0, 3)
          .map((g) => g.축 + '(' + g.첫.이름.replace('.html', '').slice(0, 40) + ')').join(' · '));
        console.log('   ⛔ 「뺐다 = 쓸 수 없다」가 아니다 — 같은 자료의 «다른 축»은 낼 수 있다.');
        console.log('      다만 짓기 «전»에 그 기사를 읽는다. 수가 어긋나면 안 된다 —');
        console.log('      2026-10-12 에 기사가 이미 거른 148건을 내 지면이 안 걸러 낼 뻔했다.');
        console.log('      그 축을 보려면  node scripts/check-이축으로-이미낸게있나.mjs <자료이름>');
      }
      console.log('');
    }
  }

  /* 기사로 이미 다룬 축을 뺀 것 — ⛔ 못 쟀을 때(걸린축이 null)는 다 보여 준다 */
  const 깨끗한것 = 걸린축 ? 안쓴것.filter((축) => !걸린축.has(축)) : 안쓴것;
  console.log('   ■ 살펴볼 것 — ' + (걸린축 ? '지면도 기사도 «없는» 축 ' + 깨끗한것.length + '개' : '(기사는 못 쟀다)'));
  for (const 축 of 깨끗한것.slice(0, 30)) console.log('      · ' + 축);
  if (깨끗한것.length > 30) console.log('      … 그 밖 ' + (깨끗한것.length - 30) + '개');
  if (걸린축 && !깨끗한것.length) {
    console.log('      (없다 — 쥔 자료가 다 지면이나 기사로 한 번은 나갔다)');
  }

  console.log('');
  console.log('   ⛔ 「지면이 없다 = 내야 한다」가 아니다 — 낼 값이 없는 자료도 있다.');
  console.log('      이 자는 **「살펴볼 것」**을 내놓지 「만들어라」고 하지 않는다.');
  console.log('   ⚠ 어디까지 쟀나 — ⛔ 「없다」를 「못 찾았다」와 가른다');
  console.log('      ✅ 지면·자가 «실제로 읽는» 자료는 의존을 읽어 뺐다 — 짐작이 아니다');
  console.log('      ⚠ 기사는 저장소에 소스가 없어 **낱말로만** 봤다. 이름이 아주 다르면 못 잡는다');
  console.log('      ⚠ 자료 속은 안 열어 봤다 — 낼 값이 있나는 사람이 본다');
  console.log('   ⭐ 고를 때 — 「그 지면에만 있는 수」가 나오는 자료부터 본다.');
  console.log('      오늘 새벽 얇은 지면 열여섯 장을 채우며 가장 잘 들었던 것이 그것이다.');
}
