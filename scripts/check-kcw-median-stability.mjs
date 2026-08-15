/**
 * **작은 표본의 중앙값이 지면에 답으로 실려 있는지 훑는다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 8/15 에 같은 자료로 답 둘을 내고 하나를 **두 번** 정정했다. 다섯 값의 중앙값이었고,
 * 하나를 빼면 제 크기의 0.89배만큼 움직였다. 그날 그 흔들림을 재는 자를 만들었다
 * (`build-wikitip-one-out.mjs`, 94편).
 *
 * ⛔ 그런데 자를 만들고 **두 자료에만** 붙였다. 나머지는 그대로였다.
 *   ⭐ 그래서 이 자가 **내 자료 전부를 열어** 같은 자리를 찾는다.
 *
 * ── 찾는 것 ────────────────────────────────────────────────────
 * 자료 안 어느 객체가 `median…` 칸을 갖고 있고, 같은 객체에 표본 크기가 있으며,
 * 그 크기가 문턱보다 작으면 알린다. **그 중앙값은 하나가 들고 나면 움직인다.**
 *
 * ⛔ 이 자는 **고치지 않는다.** 세어서 보여 줄 뿐이다.
 * ⛔ 빨강으로 세우지 않는다 — 작은 표본이 늘 흠은 아니다. 표의 한 칸일 수도 있다.
 *    ⚠ 사람이 열어 보고 「이게 지면에 **답으로** 실렸나」를 묻는다.
 * ⛔ 남의 자료(100y · seoulmarkets)는 안 본다. `wikitip-` 만 본다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-median-stability.mjs
 *   node scripts/check-kcw-median-stability.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자료방 = path.join(뿌리, 'src', 'data');

/**
 * ⛔ 이보다 적은 표본의 중앙값은 하나가 들고 날 때마다 움직인다.
 * ⚠ 12 는 우리가 정한 것이다. 8/15 에 흔들린 것은 5·6·9 였고, 안 흔들린 것은 16·26 이었다.
 */
export const 작은표본 = 12;

/** 표본 크기가 담길 만한 이름들. ⚠ 자료마다 이름이 다르다 */
export const 크기이름 = ['n', 'count', 'titles', 'actors', 'people', 'firms', 'rows',
  'markets', 'measured', 'sampleSize', 'articleEditionPairs', 'cells'];

/**
 * ⭐ 한 객체가 「작은 표본의 중앙값」인가.
 * ⛔ 중앙값 칸이 **수**여야 한다 — null 이면 이미 「못 낸다」로 적힌 것이다.
 */
export function 작은중앙값인가(o, 문턱 = 작은표본) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const 중키 = Object.keys(o).filter((k) => /^median/i.test(k) && typeof o[k] === 'number');
  if (!중키.length) return null;
  const 크기 = 크기이름.map((k) => o[k]).find((v) => typeof v === 'number');
  if (typeof 크기 !== 'number' || 크기 >= 문턱) return null;
  return { n: 크기, medians: 중키 };
}

/**
 * ⭐⭐ **곁에 늘어선 줄이 표본 크기다.**
 *
 * 🔴🔴 8/15 — `wikitip-sea-athletes.json` 이 이 그물을 빠져나갔다. 중앙값 두 개가
 *   **뿌리에** 있고, 표본 크기는 수 칸이 아니라 `footballManagers` 배열의 **길이**(12)였다.
 *   지면과 기사가 그 중앙값을 답으로 싣고 있었는데 이 검사는 초록이었다.
 *   ⛔ 검사가 못 잡았다고 안전한 것이 아니다. 그물을 넓힌다.
 *
 * ⚠ 중앙값 이름과 배열 이름이 늘 맞아떨어지지는 않는다. 그래서 **같은 객체에서 가장 짧은
 *   배열**을 표본으로 본다 — 넘겨짚는 것이니 사람이 열어 보라고만 한다.
 */
export function 곁의줄길이(o) {
  const 길이들 = Object.values(o)
    .filter((v) => Array.isArray(v) && v.length > 0)
    .map((v) => v.length);
  return 길이들.length ? Math.min(...길이들) : null;
}

/** ⭐ 배열 길이를 표본으로 보는 자리 */
export function 줄로잰중앙값인가(o, 문턱 = 작은표본) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  /* ⛔ 수 칸으로 이미 잡히는 것은 안 본다 — 두 번 알리면 거짓 빨강이다 */
  if (작은중앙값인가(o, 문턱)) return null;
  const 중키 = Object.keys(o).filter((k) => /^median/i.test(k) && typeof o[k] === 'number');
  if (!중키.length) return null;
  const 크기 = 곁의줄길이(o);
  if (typeof 크기 !== 'number' || 크기 >= 문턱) return null;
  return { n: 크기, medians: 중키, 줄로잼: true };
}

/** 자료 하나를 통째로 훑는다 */
export function 훑기(자료, 문턱 = 작은표본) {
  const 걸린것 = [];
  (function 파고들기(o, 길) {
    if (!o || typeof o !== 'object') return;
    const 잡힘 = 작은중앙값인가(o, 문턱) ?? 줄로잰중앙값인가(o, 문턱);
    if (잡힘) 걸린것.push({ ...잡힘, where: 길 || '(뿌리)', 그객체: o });
    for (const [k, v] of Object.entries(o)) 파고들기(v, `${길}.${k}`);
  }(자료, ''));
  return 걸린것;
}

/**
 * ⭐ **이미 흔들림을 잰 자리는 빼 준다.** 92·93편 자료에는 `stability` 칸이 붙어 있다 —
 *   그건 이미 본 자리이고, 다시 알리면 거짓 빨강이 된다.
 * 🔴 오늘 훑기에서 배운 그대로다. 거짓이 많은 검사는 아무도 안 본다.
 */
export function 이미잰것인가(길, 객체 = null) {
  if (/\.stability|\.oneOut$/.test(길)) return true;
  /**
   * ⭐ 칸 이름이 `stability` 로 **시작**하기만 해도 이미 잰 것이다.
   * 🔴 8/15 — `sea-athletes` 에 `stabilityPlayers`·`stabilityManagers` 를 붙였는데도
   *   이 자가 계속 알렸다. 정확히 `stability` 인 칸만 봤기 때문이다.
   *   ⛔ 붙여 놓은 것을 못 알아보는 검사는 거짓 빨강을 낸다.
   */
  return !!객체 && typeof 객체 === 'object'
    && Object.keys(객체).some((k) => /^stability/i.test(k) || /^oneOut/i.test(k));
}

/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  참('작은 표본의 중앙값을 잡는다',
    작은중앙값인가({ n: 5, medianThing: 3 })?.n === 5);
  참('큰 표본은 안 잡는다', 작은중앙값인가({ n: 26, medianThing: 3 }) === null);
  참('⛔ 중앙값이 없으면 안 잡는다', 작은중앙값인가({ n: 5, mean: 3 }) === null);
  참('⛔ 중앙값이 null 이면 안 잡는다', 작은중앙값인가({ n: 5, medianThing: null }) === null);
  참('⛔ 표본 크기가 없으면 못 잡는다', 작은중앙값인가({ medianThing: 3 }) === null);
  참('⛔ 배열은 안 본다', 작은중앙값인가([{ n: 5, medianThing: 3 }]) === null);
  참('여러 중앙값 칸을 다 적는다',
    작은중앙값인가({ n: 9, medianHours: 1, medianWeeks: 2 }).medians.length === 2);
  /* ⚠ 자료마다 크기 이름이 다르다 */
  참('다른 이름의 크기도 알아본다',
    작은중앙값인가({ titles: 6, medianThing: 3 })?.n === 6
    && 작은중앙값인가({ measured: 9, medianThing: 3 })?.n === 9);

  const 걸 = 훑기({ a: { n: 5, medianX: 1 }, b: { c: { count: 40, medianY: 2 } }, d: [{ n: 3, medianZ: 9 }] });
  참('깊은 곳도 찾는다', 걸.some((x) => x.where === '.a'));
  참('⛔ 큰 표본은 안 걸린다', !걸.some((x) => x.where.includes('.b.c')));
  참('배열 속도 찾는다', 걸.some((x) => x.where === '.d.0'));

  /**
   * 🔴🔴 8/15 — `sea-athletes` 가 그물을 빠져나갔다. 중앙값이 뿌리에 있고 표본은
   *   배열 **길이**였다. 지면이 그 중앙값을 답으로 싣는데 검사는 초록이었다.
   */
  참('⭐⭐ 곁에 늘어선 줄을 표본으로 본다',
    줄로잰중앙값인가({ medianA: 8, 줄: [1, 2, 3] })?.n === 3);
  참('⭐ 가장 짧은 배열을 택한다',
    곁의줄길이({ a: [1, 2, 3], b: [1, 2] }) === 2);
  참('⛔ 긴 배열만 있으면 안 잡는다',
    줄로잰중앙값인가({ medianA: 8, 줄: Array(30).fill(0) }) === null);
  참('⛔ 배열이 없으면 못 잰다', 곁의줄길이({ a: 1 }) === null);
  참('⛔ 빈 배열은 표본이 아니다', 곁의줄길이({ a: [], b: [1, 2, 3] }) === 3);
  참('⛔ 중앙값이 없으면 안 잡는다', 줄로잰중앙값인가({ 줄: [1, 2] }) === null);
  /* ⛔ 수 칸으로 이미 잡히는 것을 두 번 알리면 거짓 빨강이다 */
  참('⛔ 수 칸으로 잡히는 것은 이 자가 안 본다',
    줄로잰중앙값인가({ n: 5, medianA: 8, 줄: [1, 2, 3] }) === null);
  참('⭐ 훑기가 둘 다 잡는다', (() => {
    const r = 훑기({ 뿌: { medianX: 1, 줄: [1, 2] }, 딴: { n: 4, medianY: 2 } });
    return r.length === 2 && r.some((x) => x.줄로잼) && r.some((x) => !x.줄로잼);
  })());

  /* 🔴 이미 잰 자리를 다시 알리면 거짓 빨강이다 */
  참('⭐ 이미 잰 자리를 알아본다',
    이미잰것인가('.answer.stability') && 이미잰것인가('.findings.1.now.oneOut'));
  참('⛔ 그 밖은 이미 잰 것이 아니다', !이미잰것인가('.bySport.0'));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 파일들 = fs.readdirSync(자료방).filter((f) => f.startsWith('wikitip-') && f.endsWith('.json'));
  let 모두 = 0;
  const 표 = [];

  for (const f of 파일들) {
    let 자료;
    try { 자료 = JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8')); } catch { continue; }
    const 걸린것 = 훑기(자료).filter((x) => !이미잰것인가(x.where, x.그객체));
    if (걸린것.length) { 표.push({ f, 걸린것 }); 모두 += 걸린것.length; }
  }

  console.log(`내 자료 ${파일들.length}개를 훑는다 — 표본이 ${작은표본} 미만인데 중앙값을 낸 자리\n`);

  /**
   * ⛔⛔ **확실한 것과 짐작을 가른다.**
   * 🔴 8/15 — 그물을 넓히자 5곳이 33곳이 됐다. 늘어난 것은 대부분 **배열 길이를
   *   표본으로 넘겨짚은 것**이다(판 넷을 담은 `byCountry[4]` 를 「표본 4」로 읽는 식).
   *   ⛔ 거짓이 많은 검사는 아무도 안 본다. 없애는 대신 **어느 것이 짐작인지 밝힌다.**
   */
  const 낸다 = (것들, 머리, 꼬리) => {
    const 줄들 = 표.map(({ f, 걸린것 }) => ({ f, 걸린것: 걸린것.filter(것들) }))
      .filter((x) => x.걸린것.length);
    const 셈 = 줄들.reduce((a, x) => a + x.걸린것.length, 0);
    console.log(`${머리} — ${셈}곳`);
    if (꼬리) console.log(`   ${꼬리}`);
    for (const { f, 걸린것 } of 줄들) {
      console.log(`⚠ ${f}  (${걸린것.length}곳)`);
      for (const x of 걸린것.slice(0, 3)) {
        console.log(`      n=${String(x.n).padStart(2)}  ${x.medians.join(', ').slice(0, 40).padEnd(42)}${x.where.slice(0, 40)}`);
      }
      if (걸린것.length > 3) console.log(`      … 그리고 ${걸린것.length - 3}곳 더`);
    }
    console.log('');
    return 셈;
  };

  const 확실 = 낸다((x) => !x.줄로잼, '── 표본 크기가 자료에 적혀 있다 (확실하다)');
  const 짐작 = 낸다((x) => x.줄로잼, '── 곁의 배열 길이를 표본으로 본 것 (짐작이다)',
    '⚠ 판 넷을 담은 배열을 「표본 4」로 읽었을 수 있다. 열어 보고 가른다.');

  if (!모두) console.log('✅ 없다');
  console.log(`모두 ${모두}곳 — 확실한 것 ${확실} · 짐작 ${짐작}.`);
  console.log('⚠ 이 자는 세기만 한다. 열어 보고 물을 것 — **이 중앙값이 지면에 답으로 실렸나.**');
  console.log('   표의 한 칸이면 둬도 된다. 답이면 `build-wikitip-one-out.mjs` 의 하나빼기를 붙인다.');
}
