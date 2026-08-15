/**
 * build-wikitip-half-life.mjs — 93편. **파도의 반감기.**
 *
 * ── 92편이 남긴 자리에서 시작한다 ─────────────────────────────
 * 92편은 「파도가 지나간 뒤 바닥이 높은가」를 물었고, **신작에는 그 물음을 못 던진다**로
 * 끝났다. 문서가 작품과 함께 생기니 「전」이 없다. 서른다섯 편 중 스물아홉이 빠졌다.
 *
 * ⭐ 그런데 **「전」이 필요 없는 물음**이 하나 있다 —
 *   **봉우리 뒤 몇 달 만에 절반으로 떨어지는가.** 뒤만 보면 된다.
 *   신작이든 옛 작품이든 똑같이 답할 수 있고, 그래서 잴 수 있는 편수가 크게 는다.
 *
 * ── ⛔ 이 자가 스스로 막는 것 ─────────────────────────────────
 * ⛔ **봉우리가 얇으면 안 잰다.** 백만분율 한 자리에서 반토막은 잡음이다.
 * ⛔ **봉우리 뒤 관측이 짧으면 안 잰다.** 아직 안 떨어진 것을 「오래 간다」로 읽으면 안 된다.
 *    ⚠ 그것은 **아직 모른다**이지 **길다**가 아니다. 그 둘을 다른 칸에 넣는다.
 * ⛔ **덜 찬 마지막 달을 안 쓴다.**
 * ⛔ **반감기 뒤에 다시 오르는 것을 감추지 않는다.** 시즌 2 가 오면 다시 오른다.
 *    반감기는 「한 번 내려간 때」지 「끝난 때」가 아니다. 그 말을 자료에 박는다.
 * ⛔ **평균을 앞세우지 않는다.** 하나가 43달이면 평균이 통째로 끌린다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-half-life.mjs
 *   node scripts/build-wikitip-half-life.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';
import { 달별합, 중앙값, 평균, 한자리 } from './build-wikitip-wave-floor.mjs';
import { 하나빼기, 단단한가 } from './build-wikitip-one-out.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ⛔ 봉우리가 이보다 얇으면 반감기를 말하지 않는다.
 *
 * 백만분율 9 에서 4 로 가는 것도 「반토막」이지만, 그건 몇 사람이 안 본 것일 수 있다.
 * ⚠ 92편에서 `Physical: 100` 이 1.3 → 2.4 를 +82.7% 로 만든 것과 같은 자리다.
 */
export const 얇은봉우리 = 50;

/** ⛔ 봉우리 뒤 이만큼은 봐야 「안 떨어졌다」를 말할 수 있다 */
export const 지켜본달 = 6;

/**
 * ⭐ **반감기.** 봉우리 뒤 처음으로 봉우리의 절반 아래로 내려간 달까지의 개월 수.
 *
 * ⛔ 「아직 안 떨어졌다」와 「오래 간다」를 **같은 칸에 넣지 않는다.**
 *   봉우리가 지난달이면 안 떨어진 게 당연하다. 그건 모르는 것이다.
 * ⭐ 그리고 반감기 뒤에 **다시 오른 적이 있나**를 같이 낸다 —
 *   반감기는 「한 번 내려간 때」지 「끝난 때」가 아니다.
 */
/**
 * ⭐ 첫 달부터 끝 달까지 **빠짐없이** 늘어놓는다. 못 잰 달은 값이 null 인 채로 자리를 지킨다.
 *
 * 🔴🔴 8/15 — 예전에는 못 잰 달을 줄에서 **빼 버렸다.** 그러면 칸 사이 거리가 달력과
 *   어긋난다. 봉우리 다음 달을 못 쟀고 그 다음 달에 반토막이 났으면 **두 달**인데
 *   **한 달**로 셌다. 반감기는 시간의 길이다 — 못 잰 달이 있다고 시간이 줄지 않는다.
 *   ⚠ 자가시험이 이것을 잡고 있었는데, 그 시험이 **한 줄도 안 돌고 있었다.**
 */
export function 달력으로펴기(달값) {
  const 있는것 = Object.entries(달값).filter(([, v]) => v != null)
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (!있는것.length) return [];
  const [첫해, 첫달] = 있는것[0][0].split('-').map(Number);
  const [끝해, 끝달] = 있는것.at(-1)[0].split('-').map(Number);
  const 칸수 = (끝해 - 첫해) * 12 + (끝달 - 첫달) + 1;
  const 값맵 = new Map(있는것);
  return Array.from({ length: 칸수 }, (_, i) => {
    const y = 첫해 + Math.floor((첫달 - 1 + i) / 12);
    const m = ((첫달 - 1 + i) % 12) + 1;
    const 이름 = `${y}-${String(m).padStart(2, '0')}`;
    return [이름, 값맵.has(이름) ? 값맵.get(이름) : null];
  });
}

export function 반감기재기(달값, 옵션 = {}) {
  const 얇음 = 옵션.얇은봉우리 ?? 얇은봉우리;
  const 지켜봄 = 옵션.지켜본달 ?? 지켜본달;
  /* ⛔ 못 잰 달을 빼지 않는다 — 자리는 지키고 값만 null 이다 */
  const 줄 = 달력으로펴기(달값);
  if (줄.filter(([, v]) => v != null).length < 2) return null;

  let 봉 = 줄.findIndex(([, v]) => v != null);
  for (let i = 봉 + 1; i < 줄.length; i += 1) {
    if (줄[i][1] != null && 줄[i][1] > 줄[봉][1]) 봉 = i;
  }
  const 봉값 = 줄[봉][1];
  const 뒤달수 = 줄.length - 1 - 봉;
  /* ⚠ 「본 달」과 「잰 달」을 가른다. 빈 달로 채워 문턱을 넘기면 안 된다 */
  const 뒤잰달수 = 줄.slice(봉 + 1).filter(([, v]) => v != null).length;

  if (봉값 < 얇음) {
    return { peakMonth: 줄[봉][0], peak: 한자리(봉값), measurable: false,
      why: `the peak was only ${한자리(봉값)} per million, thin enough that halving is noise` };
  }
  if (뒤잰달수 < 지켜봄) {
    return { peakMonth: 줄[봉][0], peak: 한자리(봉값), measurable: false,
      monthsWatched: 뒤달수, monthsMeasured: 뒤잰달수,
      why: `only ${뒤잰달수} months follow the peak, which is not long enough to say it has not `
        + 'fallen — that is unknown, not slow' };
  }

  let 반 = null;
  for (let i = 봉 + 1; i < 줄.length; i += 1) {
    if (줄[i][1] != null && 줄[i][1] < 봉값 / 2) { 반 = i - 봉; break; }
  }
  if (반 === null) {
    return { peakMonth: 줄[봉][0], peak: 한자리(봉값), measurable: true, halfLifeMonths: null,
      monthsWatched: 뒤달수,
      why: `it never fell below half its peak in the ${뒤달수} months we watched` };
  }

  /**
   * ⭐⭐ 반감기 뒤에 다시 오른 적이 있나. ⛔ 「끝났다」로 읽히면 안 된다 —
   *   시즌 2 가 오면 다시 오른다. 열여섯 편 중 **열둘**이 그랬다.
   *
   * ⭐ 이어진 달은 **한 덩어리**로 센다. 석 달 내리 절반 위였으면 그건 파도 하나지 셋이 아니다.
   * ⚠ 「몇 번 왔나」와 「처음 언제 왔나」를 둘 다 낸다 — 앞은 잦음, 뒤는 기다림이다.
   */
  const 뒤에 = 줄.slice(봉 + 반);
  const 다시오름 = 뒤에.filter(([, v]) => v != null && v >= 봉값 / 2)
    .map(([m, v]) => ({ month: m, value: 한자리(v) }));
  const 덩어리 = [];
  for (let i = 0; i < 뒤에.length; i += 1) {
    const [m, v] = 뒤에[i];
    /* ⛔ 못 잰 달은 덩어리를 잇지도, 끊지도 않는다 — 그냥 모르는 달이다 */
    if (v == null || v < 봉값 / 2) continue;
    const 앞 = 덩어리.at(-1);
    if (앞 && 앞.끝index === i - 1) { 앞.끝index = i; 앞.months.push(m); } else {
      덩어리.push({ 끝index: i, months: [m], firstMonth: m, monthsAfterHalving: i });
    }
  }

  return {
    peakMonth: 줄[봉][0],
    peak: 한자리(봉값),
    measurable: true,
    halfLifeMonths: 반,
    monthsWatched: 뒤달수,
    roseAboveHalfAgain: 다시오름.length > 0,
    roseAgainMonths: 다시오름,
    /* ⭐ 이어진 달을 한 덩어리로 — 「몇 번 왔나」 */
    returnWaves: 덩어리.length,
    firstReturnAfterMonths: 덩어리.length ? 덩어리[0].monthsAfterHalving + 반 : null,
    returnWaveMonths: 덩어리.map((c) => c.months),
  };
}

/**
 * 🔴🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자를 import 하는 쪽이 있으면 argv 를
 *   가로채고, 반대로 이 자가 import 한 자에게 가로채인다. 8/15 에 실제로 그랬다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  const 만들기 = (값들) => Object.fromEntries(값들.map((v, i) => [`2024-${String(i + 1).padStart(2, '0')}`, v]));

  /* ⭐ 봉우리 100, 다음 달 40 → 반감기 1달 */
  const a = 반감기재기(만들기([10, 100, 40, 30, 20, 15, 12, 11]));
  참('봉우리 달을 찾는다', a.peakMonth === '2024-02');
  참('반감기를 낸다', a.halfLifeMonths === 1);
  참('봉우리 뒤 몇 달 봤는지 낸다', a.monthsWatched === 6);
  참('⛔ 다시 오르지 않았으면 그렇게 낸다', a.roseAboveHalfAgain === false);

  /* ⭐ 천천히 내려가는 것 */
  const b = 반감기재기(만들기([10, 100, 90, 80, 70, 60, 40, 30]));
  참('천천히 내려가면 반감기가 길다', b.halfLifeMonths === 5);

  /* ⛔ 봉우리가 얇으면 안 잰다 — 잡음이다 */
  const c = 반감기재기(만들기([1, 9, 4, 3, 2, 2, 1, 1]));
  참('⛔ 얇은 봉우리는 안 잰다', c.measurable === false);
  참('얼마나 얇았는지 적는다', /only 9 per million/.test(c.why));

  /* ⛔ 봉우리 뒤가 짧으면 「안 떨어졌다」를 말할 수 없다 */
  const d2 = 반감기재기(만들기([10, 20, 30, 40, 50, 60, 500, 400]));
  참('⛔ 봉우리 뒤가 짧으면 안 잰다', d2.measurable === false);
  참('⭐ 「모른다」와 「느리다」를 가른다', /unknown, not slow/.test(d2.why));

  /* ⭐ 끝까지 안 떨어진 것 — 잴 수는 있고 반감기는 없다 */
  const e = 반감기재기(만들기([10, 100, 95, 90, 88, 86, 85, 84]));
  참('잴 수는 있다', e.measurable === true);
  참('⛔ 반감기가 없으면 null 이지 0 이 아니다', e.halfLifeMonths === null);
  참('몇 달 봤는지 적는다', /in the 6 months we watched/.test(e.why));

  /**
   * ⭐⭐ 반감기 뒤에 다시 오르는 것 — 시즌 2
   * 🔴🔴 8/15 — 이 보기 셋이 **틀려 있었다.** 재상승을 원 봉우리보다 **크게**(300) 적어서
   *   봉우리가 그리로 옮겨 갔고, 뒤에 두 달밖에 안 남아 `measurable:false` 가 됐다.
   *   그래서 `f.roseAgainMonths` 가 아예 없었고 시험이 터졌다.
   *   ⚠ 그런데 **터지는 줄도 몰랐다** — 이 자가 import 한 다른 자가 `--selftest` 를
   *   제 것으로 알고 가로채, 이 시험은 **한 줄도 안 돌고 있었다.**
   * ⛔ 재상승은 원 봉우리보다 **작아야** 이 자를 시험한다.
   */
  const f = 반감기재기(만들기([10, 100, 40, 30, 20, 80, 60, 50]));
  참('다시 오른 것을 잡는다', f.roseAboveHalfAgain === true);
  참('언제 다시 올랐는지 적는다', f.roseAgainMonths.some((x) => x.month === '2024-06'));
  참('⛔ 그래도 반감기는 첫 하락으로 센다', f.halfLifeMonths === 1);
  참('⛔ 봉우리가 재상승으로 옮겨 가지 않았다', f.peakMonth === '2024-02');
  /* ⭐ 이어진 달은 한 덩어리다 — 석 달 내리 절반 위였으면 파도 하나지 셋이 아니다 */
  const g = 반감기재기(만들기([10, 100, 40, 80, 75, 70, 30, 20]));
  참('⭐ 이어진 재상승은 한 덩어리로 센다', g.returnWaves === 1);
  참('덩어리에 든 달을 그대로 낸다', g.returnWaveMonths[0].length === 3);
  const h = 반감기재기(만들기([10, 100, 40, 80, 30, 20, 75, 20, 15]));
  참('⭐ 끊어진 재상승은 따로 센다', h.returnWaves === 2);
  참('첫 재상승까지 몇 달인지 낸다', h.firstReturnAfterMonths === 2);
  참('⛔ 다시 안 오르면 null 이지 0 이 아니다', a.firstReturnAfterMonths === null);

  참('⛔ 달이 하나면 null', 반감기재기({ '2024-01': 5 }) === null);
  참('⛔ 못 잰 달은 셈에서 빠진다',
    반감기재기(만들기([10, 100, null, 40, 30, 20, 15, 12, 10])).halfLifeMonths === 2);

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/wikipedia/sea-title-waves.json'), 'utf8'));

  /* ⛔ 덜 찬 마지막 달을 안 쓴다 — 92편에서 세운 규칙 그대로 */
  const 달합 = Object.fromEntries(원.months.map((m) => [m,
    원.articles.reduce((a, x) => a + 원.editionsSea.reduce((b, p) => b + (x.views[p]?.[m] ?? 0), 0), 0)]));
  const 끝달 = 원.months.at(-1);
  const 앞선평 = 평균(원.months.slice(-13, -1).map((m) => 달합[m]));
  const 끝달이덜찼나 = 달합[끝달] < 앞선평 * 0.2;
  const 쓸달 = 끝달이덜찼나 ? 원.months.slice(0, -1) : 원.months;

  const 잰것들 = 원.articles.map((줄) => ({
    title: 줄.titleEn,
    editions: 원.editionsSea.filter((p) => 줄.views[p]).length,
    half: 반감기재기(달별합(줄, 원.editionTotals, 원.editionsSea, 쓸달)),
  }));

  const 잴수있는 = 잰것들.filter((r) => r.half && r.half.measurable);
  const 반감기있는 = 잴수있는.filter((r) => r.half.halfLifeMonths != null);
  const 안떨어진것 = 잴수있는.filter((r) => r.half.halfLifeMonths == null);
  const 못잰것 = 잰것들.filter((r) => !r.half || !r.half.measurable);

  const 반들 = 반감기있는.map((r) => r.half.halfLifeMonths);
  const 다시오른것 = 반감기있는.filter((r) => r.half.roseAboveHalfAgain);

  /* 몇 달 만에 반토막인지 셈 — 한 달이 몇 편인가가 이 기사의 뼈다 */
  const 달별셈 = {};
  for (const v of 반들) 달별셈[v] = (달별셈[v] ?? 0) + 1;

  const 나감 = {
    generated: 오늘(),
    question: '92 asked what a Korean title leaves behind, and could not answer for new titles: '
      + 'the encyclopaedia article is created when the title arrives, so there is no before. '
      + 'This asks the question that needs no before — after the peak, how long until half of it '
      + 'is gone?',
    window: `${쓸달[0]} through ${쓸달.at(-1)}, ${쓸달.length} months`,
    /* ⭐ ① 잰 데이터 — 자료 파일 자체에 적는다. 지면이 바뀌면 손으로 적은 출처는 안 따라온다 */
    source: 'Wikimedia Pageviews API, human traffic only, monthly, per Wikipedia edition; '
      + 'reads expressed per million reads of that edition in that month',
    editions: 원.editionsSea,
    editionNames: 원.editionNames,
    unit: 원.unit,
    method: {
      thinPeakBelow: 얇은봉우리,
      monthsWatchedAtLeast: 지켜본달,
      note: 'For each title we find its highest month and count forward to the first month below '
        + 'half that value. A title is only reported if its peak is thick enough that halving is '
        + 'not noise, and if we have watched it for at least six months afterwards — a title that '
        + 'peaked last month has not failed to fall, we simply do not know yet.',
    },
    titles: 반감기있는.map((r) => ({
      title: r.title,
      editions: r.editions,
      peakMonth: r.half.peakMonth,
      peak: r.half.peak,
      halfLifeMonths: r.half.halfLifeMonths,
      monthsWatched: r.half.monthsWatched,
      roseAboveHalfAgain: r.half.roseAboveHalfAgain,
      roseAgainMonths: r.half.roseAgainMonths,
      returnWaves: r.half.returnWaves,
      firstReturnAfterMonths: r.half.firstReturnAfterMonths,
      returnWaveMonths: r.half.returnWaveMonths,
    })).sort((a, b) => a.halfLifeMonths - b.halfLifeMonths || b.peak - a.peak),
    neverHalved: 안떨어진것.map((r) => ({
      title: r.title, peakMonth: r.half.peakMonth, peak: r.half.peak,
      monthsWatched: r.half.monthsWatched,
    })),
    notMeasured: 못잰것.map((r) => ({
      title: r.title,
      why: r.half ? r.half.why : 'not enough months in the four editions',
      peakMonth: r.half?.peakMonth ?? null,
    })),

    /**
     * ⭐⭐ **근거 칸** — 사장님 지시(2026-08-15)를 자로 바꾼다.
     *   「판단 장치는 추측이 아니라 <데이터, 검증된 과학기술, 학술적 근거>」
     *
     * ⛔ ③ 은 「인용이 있나」가 아니라 **「그 방법의 알려진 한계가 적혀 있나」**다.
     *   학술적 근거를 쓴다는 것은 권위를 빌리는 것이 아니라 **한계를 물려받는 것**이다.
     * ⚠ 이 자료가 그 본보기다. 나머지 서른셋도 이 모양으로 채운다.
     */
    method: 'Median of the per-title half-life, not the mean. The mean is pulled up by a long '
      + 'right tail — a few titles that never fell — and would read longer than most titles '
      + 'actually lasted. Stability of that median is checked by a jackknife (leave-one-out; '
      + 'Quenouille 1949, Tukey 1958).',
    limitation: 'A median says where the middle title sits and nothing about the shape around '
      + 'it, so we publish the full distribution beside it. The jackknife understates how much '
      + 'a median varies and is not consistent for the median (Miller 1974): a swing it finds '
      + 'is real, a swing it misses is not evidence of stability. Monthly data also puts a '
      + 'floor under every half-life — ten days and thirty both read as one month.',

    answer: {
      measured: 반감기있는.length,
      outOf: 잰것들.length,
      halfLifeMedianMonths: 중앙값(반들),
      halfLifeMeanMonths: 한자리(평균(반들)),
      byMonth: 달별셈,
      halvedWithinOneMonth: 반들.filter((v) => v <= 1).length,
      neverHalved: 안떨어진것.length,
      roseAboveHalfAgain: 다시오른것.length,
      /**
       * ⭐ **94편에서 만든 자를 여기 붙인다.** 자를 만들고 안 쓰면 기사 한 편으로 끝난다.
       *   중앙값을 내는 자리마다 「한 편을 빼면 얼마나 움직이나」를 같이 낸다.
       * ⚠ 이 답은 8/15 에 16편에서도 26편에서도 흔들림 0 이었다.
       */
      stability: (() => {
        const 잼 = 하나빼기(반들);
        return 잼 ? { ...잼, verdict: 단단한가(잼) } : null;
      })(),
      /* ⭐ 되풀이의 모양 — 몇 번 오나, 처음 오기까지 얼마나 기다리나 */
      returnWavesMedian: 중앙값(다시오른것.map((r) => r.half.returnWaves)),
      firstReturnMedianMonths: 중앙값(다시오른것.map((r) => r.half.firstReturnAfterMonths)),
    },

    /** ⛔ 이 자료가 **못 하는 말** */
    cannotSay: [
      'A half-life is not an ending. Where a title rose back above half its peak later — usually '
        + 'a new season — we say so beside it. The number counts the first fall, not the last.',
      'The titles were chosen as ones we expected to have had a wave, not the most-read Korean '
        + 'titles and not a random sample. A set chosen this way leans toward titles that '
        + 'travelled far enough to have a peak worth measuring.',
      'A read is not a viewer. Someone opening an encyclopaedia article may have watched the '
        + 'show, may be deciding whether to, or may have seen the name and been curious.',
      'Monthly resolution puts a floor under the answer. A title that lost half its readers in '
        + 'ten days and a title that took thirty both read as one month here.',
    ],
  };

  const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-half-life.json');
  fs.writeFileSync(낼곳, `${JSON.stringify(나감, null, 2)}\n`);
  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   창 ${쓸달[0]} ~ ${쓸달.at(-1)}`);
  console.log(`   반감기를 잰 작품 ${반감기있는.length}/${잰것들.length}`);
  console.log(`   중앙값 ${나감.answer.halfLifeMedianMonths}달 · 평균 ${나감.answer.halfLifeMeanMonths}달`);
  console.log(`   한 달 안에 반토막 ${나감.answer.halvedWithinOneMonth}편 · 끝내 안 떨어진 것 ${안떨어진것.length}편`);
  console.log(`   반감기 뒤 다시 오른 것 ${다시오른것.length}편`);
  const 잼 = 나감.answer.stability;
  if (잼) {
    console.log(`   ⭐ 하나 빼기 — 흔들림 ${잼.swingOverMedian}배 · `
      + `${잼.verdict.steady ? '단단하다' : '🔴 아직 답이 아니다'}`);
  }
}
