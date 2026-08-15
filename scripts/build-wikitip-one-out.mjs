/**
 * build-wikitip-one-out.mjs — 94편. **한 편을 빼면 답이 얼마나 움직이나.**
 *
 * ── 하루에 두 번 정정하고 나서 ─────────────────────────────────
 * 8/15 에 같은 자료로 답 둘을 냈다.
 * ```
 *   93편 반감기        중앙값 2달
 *   92편 파도 뒤 바닥   중앙값 −15.1%
 * ```
 * 작품을 35 → 59 로 늘리자 하나는 **그대로**였고 하나는 **−4.5% 로 무너졌다.**
 * 92편을 그날 두 번째로 정정했다.
 *
 * ⭐⭐ 그런데 **늘려 보기 전에 알 수 있었다.** 자는 한 줄이면 됐다 —
 *   **가진 표본에서 한 편씩 빼며 답을 다시 내고, 답이 얼마나 움직이는지 본다.**
 *   무작위도, 분포 가정도, 통계 지식도 필요 없다.
 * ```
 *   93편 반감기        하나 빼도 2달 → 2달      움직임 0
 *   92편 첫 발행       −6.7% 가 −11.8 ~ −5.8   움직임이 중앙값의 0.89배
 * ```
 *
 * ── ⛔ 이 자가 스스로 막는 것 ─────────────────────────────────
 * ⛔ **사분위 폭으로 재지 않는다.** 92편 첫 발행에서 사분위 폭은 1.78배로 **좁아 보였다** —
 *    사분위가 이상값(+60.2)을 통째로 숨겼기 때문이다. 흔들리는 답을 안 흔들린다고 할 뻔했다.
 * ⛔ **표본이 셋보다 적으면 안 잰다.** 둘에서 하나를 빼면 남는 것이 하나다.
 * ⛔ **「흔들린다」를 「틀렸다」로 적지 않는다.** 흔들리는 답은 **아직 답이 아닌 것**이지
 *    거짓이 아니다. 그 말을 자료에 박는다.
 * ⚠ 이 자는 중앙값을 쓰는 답에만 댈 수 있다. 합계나 비율에는 다른 자가 필요하다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-one-out.mjs
 *   node scripts/build-wikitip-one-out.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';
import { 중앙값, 평균, 한자리 } from './build-wikitip-wave-floor.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** ⛔ 이보다 적으면 하나를 뺄 수 없다 */
export const 적어도 = 3;

/**
 * ⭐ **한 편씩 빼며 중앙값을 다시 낸다.**
 *
 * ⚠ 이름이 「하나 빼기」인 까닭 — 어려운 이름을 붙이면 아무도 안 쓴다.
 *   통계에서는 jackknife 라 부르지만, 하는 일은 정확히 이것뿐이다.
 * ⛔ 무작위를 쓰지 않는다. 같은 자료면 늘 같은 답이 나와야 한다.
 */
export function 하나빼기(값들) {
  if (!Array.isArray(값들) || 값들.length < 적어도) return null;
  const 본 = 중앙값(값들);
  const 뺀것 = 값들.map((_, i) => 중앙값(값들.filter((__, j) => j !== i)));
  const 최소 = Math.min(...뺀것);
  const 최대 = Math.max(...뺀것);
  const 폭 = 최대 - 최소;
  return {
    n: 값들.length,
    median: 한자리(본),
    lowestWithoutOne: 한자리(최소),
    highestWithoutOne: 한자리(최대),
    swing: 한자리(폭),
    /**
     * ⭐ 중앙값에 견준 흔들림. 1 을 넘으면 「하나가 답을 바꾼다」.
     * ⚠ **소수 둘째 자리까지 낸다.** 한 자리로 자르면 0.88 이 0.9 가 되고,
     *   🔴 8/15 에 내가 손으로 0.89 를 적어 기사와 자료가 어긋났다. 배수는 작아서
     *   한 자리로는 뜻이 뭉개진다 — 0.05 와 0.14 가 둘 다 0.1 이 된다.
     */
    swingOverMedian: Math.abs(본) > 0 ? +(폭 / Math.abs(본)).toFixed(2) : null,
  };
}

/**
 * ⛔ **「흔들린다」와 「틀렸다」는 다르다.**
 * 흔들리는 답은 아직 답이 아닌 것이지 거짓이 아니다. 문턱을 하나 두되 그 말을 같이 낸다.
 * ⚠ 문턱 0.5 는 우리가 정한 것이다 — 「하나를 빼면 답이 절반쯤 움직인다」가 이미 너무 크다.
 */
export const 흔들림문턱 = 0.5;

export function 단단한가(재본것, 문턱 = 흔들림문턱) {
  if (!재본것 || 재본것.swingOverMedian == null) return null;
  return {
    steady: 재본것.swingOverMedian < 문턱,
    threshold: 문턱,
    note: 재본것.swingOverMedian < 문턱
      ? 'removing any single item leaves the answer where it was'
      : 'removing a single item moves the answer by a large fraction of itself, which means '
        + 'the sample is not yet large enough for this median to be reported as a finding — '
        + 'not that the figure is wrong',
  };
}

/**
 * ⭐ **사분위 폭은 이 일을 못 한다.** 92편 첫 발행에서 값은 이랬다:
 * ```
 *   −27.8  −16.9  −6.7  −5.0  +60.2
 * ```
 *   사분위 폭은 11.9 로 좁아 보이지만, **+60.2 를 통째로 밖에 두어서** 그렇다.
 *   하나 빼기는 그 값을 뺐을 때 중앙값이 어디로 가는지 실제로 본다.
 * ⚠ 이 함수는 견주려고 둔다. 이 자가 쓰는 자가 아니다.
 */
export function 사분위폭(값들) {
  if (!Array.isArray(값들) || 값들.length < 4) return null;
  const 줄 = [...값들].sort((a, b) => a - b);
  const 몫 = (q) => {
    const i = (줄.length - 1) * q;
    const lo = Math.floor(i); const hi = Math.ceil(i);
    return lo === hi ? 줄[lo] : 줄[lo] + (줄[hi] - 줄[lo]) * (i - lo);
  };
  const 폭 = 몫(0.75) - 몫(0.25);
  const 중 = 중앙값(값들);
  /* ⚠ 견주는 값이니 배수는 같은 자리수로 낸다 */
  return { iqr: 한자리(폭), overMedian: Math.abs(중) > 0 ? +(폭 / Math.abs(중)).toFixed(2) : null };
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  /* ⭐ 반감기처럼 촘촘한 것 — 하나를 빼도 안 움직인다 */
  const 촘촘 = 하나빼기([1, 1, 1, 2, 2, 2, 3, 3, 4]);
  참('촘촘하면 안 움직인다', 촘촘.swing === 0);
  참('흔들림이 0 이다', 촘촘.swingOverMedian === 0);
  참('⭐ 단단하다고 낸다', 단단한가(촘촘).steady === true);

  /* 🔴 92편 첫 발행의 실제 값 — 하나 빼면 중앙값이 그만큼 움직였다 */
  const 흩어짐 = 하나빼기([-27.8, -16.9, -6.7, -5, 60.2]);
  참('중앙값을 낸다', 흩어짐.median === -6.7);
  참('하나 빼면 어디까지 가는지 낸다', 흩어짐.lowestWithoutOne === -11.8 && 흩어짐.highestWithoutOne === -5.8);
  참('🔴 흔들림이 크다', 흩어짐.swingOverMedian > 0.5);
  /* ⚠ 한 자리로 자르면 0.88 이 0.9 가 된다 — 기사와 어긋난 자리다 */
  참('⭐ 배수를 둘째 자리까지 낸다', 흩어짐.swingOverMedian === 0.88);
  참('⛔ 단단하지 않다고 낸다', 단단한가(흩어짐).steady === false);
  /* ⛔ 「틀렸다」가 아니라 「아직 답이 아니다」라고 적는다 */
  참('⛔ 「틀렸다」로 적지 않는다', /not that the figure is wrong/.test(단단한가(흩어짐).note));

  /* 🔴 사분위 폭은 이상값을 숨긴다 — 그래서 안 쓴다 */
  const 사 = 사분위폭([-27.8, -16.9, -6.7, -5, 60.2]);
  참('🔴 사분위 폭은 좁아 보인다', 사.overMedian < 2);
  참('⭐ 하나 빼기는 그것을 놓치지 않는다', 흩어짐.swingOverMedian >= 0.5);

  참('⛔ 셋보다 적으면 못 잰다', 하나빼기([1, 2]) === null);
  참('⛔ 배열이 아니면 null', 하나빼기('1,2,3') === null);
  참('⛔ 중앙값이 0 이면 몫을 못 낸다', 하나빼기([-1, 0, 1]).swingOverMedian === null);
  참('⛔ 못 재면 판정도 안 한다', 단단한가(null) === null);
  /* ⛔ 무작위를 쓰지 않는다 — 같은 자료면 같은 답 */
  참('⭐ 두 번 재도 같다',
    JSON.stringify(하나빼기([3, 1, 4, 1, 5, 9])) === JSON.stringify(하나빼기([3, 1, 4, 1, 5, 9])));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 반감 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-half-life.json'), 'utf8'));
  const 파도 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-wave-floor.json'), 'utf8'));

  /**
   * ⭐ 오늘 실제로 낸 두 답, 그리고 그 답이 발행될 때마다 어떤 값들이었나.
   * ⛔ 옛 값을 손으로 적지 않는다 — 정정문에 적힌 것과 같아야 하므로 여기 한 곳에만 둔다.
   */
  const 판 = [
    {
      key: 'half-life',
      what: 'Months for a Korean title to lose half its readers',
      article: '/half-life',
      unit: 'months',
      atFirstPublication: { n: 16, values: [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 5, 7, 7] },
      now: { n: 반감.answer.measured, values: 반감.titles.map((t) => t.halfLifeMonths) },
    },
    {
      key: 'wave-floor',
      what: 'Percentage change in the floor after a wave passes',
      article: '/wave-and-floor',
      unit: 'per cent',
      atFirstPublication: { n: 5, values: [-27.8, -16.9, -6.7, -5, 60.2] },
      now: { n: 파도.answer.measured, values: 파도.titlesMeasured.map((t) => t.floorChangePc) },
    },
  ].map((r) => ({
    ...r,
    atFirstPublication: {
      ...r.atFirstPublication,
      oneOut: 하나빼기(r.atFirstPublication.values),
      verdict: 단단한가(하나빼기(r.atFirstPublication.values)),
      /* ⚠ 견주려고 같이 낸다 — 이 자가 쓰는 자가 아니다 */
      iqr: 사분위폭(r.atFirstPublication.values),
    },
    now: {
      ...r.now,
      oneOut: 하나빼기(r.now.values),
      verdict: 단단한가(하나빼기(r.now.values)),
      iqr: 사분위폭(r.now.values),
    },
  }));

  const 나감 = {
    generated: 오늘(),
    question: 'We published two findings from the same data on the same day. Widening the sample '
      + 'left one untouched and cut the other to a third, and we corrected it. Could we have '
      + 'known which one would move, before we widened anything?',
    method: {
      name: 'leave one out',
      how: 'Take the numbers you have. Remove one, recompute the median. Do that once for every '
        + 'number. If the median barely moves, one more or one fewer observation will not change '
        + 'your finding. If it moves by a large fraction of itself, it will.',
      threshold: 흔들림문턱,
      whyNotIqr: 'The interquartile range cannot do this job. On the five values behind our first '
        + 'publication it read 1.78 times the median, which looks narrow — because it puts the '
        + 'one extreme value outside its own range and stops looking at it. Leave-one-out asks '
        + 'what happens when that value is the one removed.',
      noRandomness: 'There is no sampling and no random seed here. The same numbers always give '
        + 'the same answer, which is why we can put it in a build script.',
    },
    findings: 판,
    answer: {
      couldWeHaveKnown: 판.every((r) => r.atFirstPublication.verdict?.steady === (r.key === 'half-life')),
      steadyOne: 판.find((r) => r.atFirstPublication.verdict?.steady)?.key ?? null,
      shakyOne: 판.find((r) => r.atFirstPublication.verdict?.steady === false)?.key ?? null,
    },

    /** ⛔ 이 자료가 **못 하는 말** */
    cannotSay: [
      'Leave-one-out does not tell you a finding is wrong. It tells you the sample is not yet '
        + 'large enough for that finding to be reported as one. Those are different things and '
        + 'we have conflated them before.',
      'It works on a median. A share, a total or a correlation needs a different check, and we '
        + 'do not have one for those yet.',
      'A steady median is not a true one. Every title here was chosen by us, and a biased sample '
        + 'can give a very steady wrong answer — this check cannot see that at all.',
      'Two findings is not a study of findings. We are describing what we did today, not '
        + 'establishing how often this happens.',
    ],
  };

  const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-one-out.json');
  fs.writeFileSync(낼곳, `${JSON.stringify(나감, null, 2)}\n`);
  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  for (const r of 판) {
    console.log(`   ${r.key}`);
    console.log(`     첫 발행 n=${r.atFirstPublication.n}  중앙 ${r.atFirstPublication.oneOut.median}  `
      + `흔들림 ${r.atFirstPublication.oneOut.swingOverMedian}배  ${r.atFirstPublication.verdict.steady ? '단단' : '흔들림'}`
      + `   (사분위로 재면 ${r.atFirstPublication.iqr?.overMedian}배)`);
    console.log(`     지금   n=${r.now.n}  중앙 ${r.now.oneOut.median}  `
      + `흔들림 ${r.now.oneOut.swingOverMedian}배  ${r.now.verdict.steady ? '단단' : '흔들림'}`);
  }
  console.log(`\n   미리 알 수 있었나: ${나감.answer.couldWeHaveKnown}`);
}
