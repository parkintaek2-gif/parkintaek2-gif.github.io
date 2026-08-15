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

/** 자료 하나를 통째로 훑는다 */
export function 훑기(자료, 문턱 = 작은표본) {
  const 걸린것 = [];
  (function 파고들기(o, 길) {
    if (!o || typeof o !== 'object') return;
    const 잡힘 = 작은중앙값인가(o, 문턱);
    if (잡힘) 걸린것.push({ ...잡힘, where: 길 || '(뿌리)' });
    for (const [k, v] of Object.entries(o)) 파고들기(v, `${길}.${k}`);
  }(자료, ''));
  return 걸린것;
}

/**
 * ⭐ **이미 흔들림을 잰 자리는 빼 준다.** 92·93편 자료에는 `stability` 칸이 붙어 있다 —
 *   그건 이미 본 자리이고, 다시 알리면 거짓 빨강이 된다.
 * 🔴 오늘 훑기에서 배운 그대로다. 거짓이 많은 검사는 아무도 안 본다.
 */
export function 이미잰것인가(길) {
  return /\.stability$|\.oneOut$/.test(길);
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
    const 걸린것 = 훑기(자료).filter((x) => !이미잰것인가(x.where));
    if (걸린것.length) { 표.push({ f, 걸린것 }); 모두 += 걸린것.length; }
  }

  console.log(`내 자료 ${파일들.length}개를 훑는다 — 표본이 ${작은표본} 미만인데 중앙값을 낸 자리\n`);
  for (const { f, 걸린것 } of 표) {
    console.log(`⚠ ${f}  (${걸린것.length}곳)`);
    for (const x of 걸린것.slice(0, 4)) {
      console.log(`      n=${String(x.n).padStart(2)}  ${x.medians.join(', ').slice(0, 44).padEnd(46)}${x.where.slice(0, 44)}`);
    }
    if (걸린것.length > 4) console.log(`      … 그리고 ${걸린것.length - 4}곳 더`);
  }
  if (!모두) console.log('✅ 없다');

  console.log(`\n모두 ${모두}곳.`);
  console.log('⚠ 이 자는 세기만 한다. 열어 보고 물을 것 — **이 중앙값이 지면에 답으로 실렸나.**');
  console.log('   표의 한 칸이면 둬도 된다. 답이면 `build-wikitip-one-out.mjs` 의 하나빼기를 붙인다.');
}
