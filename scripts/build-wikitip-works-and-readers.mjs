/**
 * **작품이 많은 배우가 더 읽히나 — 그리고 그 말이 한 사람에 대해 무엇을 말해 주나.**
 * (`/works-and-readers`)
 *
 * ── 물음 ───────────────────────────────────────────────────────
 * 차트에 오른 작품이 하나인 배우와 다섯 넘는 배우를 동남아 네 위키피디아에서 견준다.
 * ⭐ 가운데값 사다리는 넷 다 오른다. **그런데 사다리는 무리의 성질이다.**
 * ⭐⭐ 그래서 **한 사람 수준의 수**를 같이 낸다 — 두 무리에서 한 명씩 뽑았을 때
 *    작품이 많은 쪽이 더 읽힐 확률. 이것이 common-language effect size 다
 *    (McGraw & Wong 1992). 값은 Mann–Whitney U 를 짝 수로 나눈 것과 같다(Mann & Whitney 1947).
 *
 * ── 🔴 재 보고 알았다: 날것의 사다리에는 **가짜가 섞여 있다** ──
 * ```
 *   원본의 seaPerMillionTotal 은 **문서가 있는 판만 더한 합**이다.
 *   작품이 많은 배우일수록 네 판 다 문서가 있다(1편 14% → 5편이상 32%).
 *   그러니 날것의 사다리는 「많이 읽힌다」가 아니라 「판이 더 많다」를 섞어 재고 있다.
 * ```
 * ⭐ 갈랐다 — **한 판(인도네시아어)만** 보면 판 수가 상수가 된다. 사다리는 살아남는다.
 * ⛔ 「네 판 다 있는 사람끼리만」으로 맞추는 길도 있으나 **그 길은 안 쓴다.**
 *   문서가 몇 판에 있느냐는 읽힘의 **뒤에 오는 것**이라, 그것으로 나누면
 *   나누는 순간 무리가 바뀐다(collider — Cole 외 2010). 그 수도 자료에 남기되 쓰지 않는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **사다리만 내지 않는다.** 가운데값 열 배는 한 사람에 대해 거의 아무 말도 안 한다.
 * ⛔ **방향을 말하지 않는다.** 작품이 읽힘을 부른 것인지, 읽히는 사람이 캐스팅되는 것인지,
 *   셋째 것이 둘 다를 부르는 것인지 **못 가른다.** 못 가른다고 적는다.
 * ⛔ **겹침을 감추지 않는다.** 1편인 배우 열에 하나가 5편이상의 가운데를 넘는다.
 * ⛔ **하나빼기를 한쪽으로만 읽는다.** 잡은 흔들림은 진짜, 못 잡은 것은 **모르는 것**이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-works-and-readers.mjs
 *   node scripts/build-wikitip-works-and-readers.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 하나빼기, 단단한가 } from './build-wikitip-one-out.mjs';
import {
  근거, 중앙값 as 중앙값자, 백만분율 as 백만분율자, 하나빼기 as 하나빼기자,
} from './_evidence-kcw.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-actors.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-works-and-readers.json');

/** ⚠ 띠는 **우리가 나눈 것**이다. 다르게 나누면 다른 수가 나온다. 그 말을 자료에 박는다 */
export const 띠들 = [
  { key: '1', label: 'one', from: 1, to: 2 },
  { key: '2', label: 'two', from: 2, to: 3 },
  { key: '3-4', label: 'three or four', from: 3, to: 5 },
  { key: '5+', label: 'five or more', from: 5, to: Infinity },
];

/** ⛔ 띠 하나가 이보다 얇으면 그 띠를 안 쓴다 */
export const 최소인원 = 15;

/** ⭐ 판 수가 상수가 되는 자리. 넷 중 문서가 제일 많은 판이다 */
export const 대조판 = 'id';

/** ⚠ 원본에는 판 이름이 없다. 손님에게 `id` 를 보이지 않으려고 여기서 준다 */
export const 판이름 = {
  id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay',
};

export function 중앙값(값들) {
  const s = [...값들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

export function 분위(값들, q) {
  const s = [...값들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

/**
 * ⭐⭐ 이 자의 핵심 — **한 사람 수준의 수.**
 * 두 무리에서 한 명씩 아무렇게나 뽑았을 때 A 가 더 큰 확률. 비기면 절반으로 센다.
 * `P(A>B) + ½P(A=B)` — common-language effect size (McGraw & Wong 1992),
 * 값은 `U / (n₁n₂)` 와 같다(Mann–Whitney U; Mann & Whitney 1947).
 *
 * ⭐ 여기서는 **등수로** 낸다. 짝을 다 세는 길과 결과가 같아야 하고,
 *   그 두 길이 같은지를 자가시험이 지킨다 — 자기 셈을 자기 말로만 믿지 않는다.
 * ⛔ 이 수는 **얼마나 큰 차이인지는 말하지 않는다.** 등수만 보기 때문이다.
 */
export function 이길확률(A, B) {
  const a = A.filter((v) => typeof v === 'number');
  const b = B.filter((v) => typeof v === 'number');
  if (!a.length || !b.length) return null;
  /* 합쳐서 등수를 매긴다 — 비긴 것은 가운데 등수(midrank)를 나눠 가진다 */
  const 모두 = [...a.map((v) => ({ v, 쪽: 0 })), ...b.map((v) => ({ v, 쪽: 1 }))]
    .sort((x, y) => x.v - y.v);
  let i = 0;
  let A등수합 = 0;
  while (i < 모두.length) {
    let j = i;
    while (j + 1 < 모두.length && 모두[j + 1].v === 모두[i].v) j += 1;
    const 가운데등수 = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k += 1) if (모두[k].쪽 === 0) A등수합 += 가운데등수;
    i = j + 1;
  }
  const U = A등수합 - (a.length * (a.length + 1)) / 2;
  return +(U / (a.length * b.length)).toFixed(4);
}

/** ⛔ 등수 길이 맞는지 견주는 상대. 자가시험 전용이다 — 짝을 전부 센다 */
export function 이길확률_짝세기(A, B) {
  const a = A.filter((v) => typeof v === 'number');
  const b = B.filter((v) => typeof v === 'number');
  if (!a.length || !b.length) return null;
  let 이김 = 0;
  let 비김 = 0;
  for (const x of a) for (const y of b) { if (x > y) 이김 += 1; else if (x === y) 비김 += 1; }
  return +((이김 + 비김 / 2) / (a.length * b.length)).toFixed(4);
}

/** 한 띠의 값들을 요약한다 — 가운데값·사분위·양끝, 그리고 하나빼기 */
export function 띠재기(값들) {
  const v = 값들.filter((x) => typeof x === 'number');
  if (v.length < 최소인원) {
    return { measured: v.length, tooThin: true, why: `fewer than ${최소인원} actors` };
  }
  const oneOut = 하나빼기(v);
  return {
    measured: v.length,
    tooThin: false,
    median: +중앙값(v).toFixed(2),
    q1: +분위(v, 0.25).toFixed(2),
    q3: +분위(v, 0.75).toFixed(2),
    min: +Math.min(...v).toFixed(2),
    max: +Math.max(...v).toFixed(2),
    oneOut,
    verdict: 단단한가(oneOut),
  };
}

/**
 * ⭐ 사다리가 넷 다 오르나. 「대체로 오른다」가 아니라 **한 칸씩** 본다.
 * ⛔ 한 칸이라도 안 오르면 사다리라고 안 부른다.
 */
export function 사다리인가(가운데들) {
  const v = 가운데들.filter((x) => typeof x === 'number');
  if (v.length < 2) return null;
  const 오른칸 = [];
  for (let i = 1; i < v.length; i += 1) 오른칸.push(v[i] > v[i - 1]);
  return {
    steps: 오른칸.length,
    everyStepRises: 오른칸.every(Boolean),
    fromTo: +(v.at(-1) / v[0]).toFixed(2),
  };
}

/**
 * ⛔⛔ 「열 배」를 그대로 내보내면 한 사람 이야기로 읽힌다. 그래서 **겹침을 같이 낸다.**
 * 아래 띠에서 위 띠의 가운데를 넘는 사람이 몇인가, 그 반대는 몇인가.
 */
export function 겹침(아래값, 위값) {
  const a = 아래값.filter((v) => typeof v === 'number');
  const b = 위값.filter((v) => typeof v === 'number');
  if (!a.length || !b.length) return null;
  const 아래가운데 = 중앙값(a);
  const 위가운데 = 중앙값(b);
  const 아래가위를넘음 = a.filter((v) => v > 위가운데).length;
  const 위가아래아래 = b.filter((v) => v < 아래가운데).length;
  return {
    lowBandAboveHighMedian: 아래가위를넘음,
    lowBandN: a.length,
    lowBandAbovePc: +((100 * 아래가위를넘음) / a.length).toFixed(1),
    highBandBelowLowMedian: 위가아래아래,
    highBandN: b.length,
    highBandBelowPc: +((100 * 위가아래아래) / b.length).toFixed(1),
  };
}

/** 배우 한 사람의 「한 판만」 값 — 그 판에 문서가 없으면 그 사람을 뺀다 */
export function 한판값(사람, 판 = 대조판) {
  const v = 사람?.perMillion?.[판];
  return typeof v === 'number' ? v : null;
}

/** 배우 한 사람의 「네 판 합」 값 — ⚠ 문서가 있는 판만 더해진 수다 */
export function 합값(사람) {
  return typeof 사람?.seaPerMillionTotal === 'number' ? 사람.seaPerMillionTotal : null;
}

export function 띠나누기(사람들, 띠) {
  return 사람들.filter((x) => typeof x.chartingTitles === 'number'
    && x.chartingTitles >= 띠.from && x.chartingTitles < 띠.to);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  참('중앙값 홀수', 중앙값([3, 1, 2]) === 2);
  참('중앙값 짝수는 평균', 중앙값([1, 2, 3, 4]) === 2.5);
  참('⛔ 빈 것은 null', 중앙값([]) === null);
  참('사분위', 분위([1, 2, 3, 4], 0.25) === 2);

  /* ⭐⭐ 두 길이 같은 수를 내야 한다 — 자기 셈을 자기 말로만 믿지 않는다 */
  const A = [5, 3, 9, 1, 7]; const B = [2, 8, 4];
  참('⭐⭐ 등수 길과 짝세기 길이 같다', 이길확률(A, B) === 이길확률_짝세기(A, B));
  참('⭐ 완전히 위면 1', 이길확률([10, 11], [1, 2]) === 1);
  참('⭐ 완전히 아래면 0', 이길확률([1, 2], [10, 11]) === 0);
  참('⭐⭐ 같은 값들끼리면 0.5 — 비긴 것을 반으로 센다', 이길확률([4, 4], [4, 4]) === 0.5);
  참('비김이 섞여도 두 길이 같다',
    이길확률([1, 2, 2, 3], [2, 2, 5]) === 이길확률_짝세기([1, 2, 2, 3], [2, 2, 5]));
  참('⛔ 한쪽이 비면 null', 이길확률([], [1]) === null);

  /* ⛔ 얇은 띠는 안 쓴다 */
  참('⛔ 열다섯이 안 되면 못 쓴다', 띠재기([1, 2, 3]).tooThin === true);
  const 스물 = Array.from({ length: 20 }, (_, i) => i + 1);
  /* ⚠ 스물은 짝수라 가운데가 둘이다 — 10 과 11 의 평균 10.5 다. 위쪽을 고르지 않는다 */
  참('스물이면 잰다', 띠재기(스물).tooThin === false && 띠재기(스물).median === 10.5);
  참('⭐ 하나빼기를 같이 낸다', typeof 띠재기(스물).oneOut?.swingOverMedian === 'number');
  참('⛔⛔ 못 잡은 흔들림을 「단단하다」로 안 읽는다',
    /not evidence of\s+stability/.test(띠재기(스물).verdict.limitation.replace(/\s+/g, ' ')));

  /* ⛔ 한 칸이라도 안 오르면 사다리가 아니다 */
  참('⭐ 넷 다 오르면 사다리', 사다리인가([1, 2, 3, 4]).everyStepRises === true);
  참('⛔ 한 칸이 안 오르면 사다리가 아니다', 사다리인가([1, 3, 2, 4]).everyStepRises === false);
  참('끝 대 끝 배수를 낸다', 사다리인가([1, 2, 3, 10]).fromTo === 10);

  /* ⛔⛔ 겹침을 감추지 않는다 */
  const ㄱ = 겹침([1, 2, 100], [3, 4, 5]);
  참('⭐ 아래 띠가 위 가운데를 넘는 수를 센다', ㄱ.lowBandAboveHighMedian === 1);
  참('⭐ 그 반대도 센다', 겹침([10, 20, 30], [1, 2, 100]).highBandBelowLowMedian === 2);
  참('⛔ 백분율까지 낸다', ㄱ.lowBandAbovePc === 33.3);

  /* ⛔ 한 판에 문서가 없는 사람을 0 으로 세지 않는다 */
  참('한 판 값을 꺼낸다', 한판값({ perMillion: { id: 3.5 } }) === 3.5);
  참('⛔⛔ 그 판에 문서가 없으면 0 이 아니라 null', 한판값({ perMillion: { id: null } }) === null);
  참('⛔ 판이 통째로 없어도 null', 한판값({}) === null);
  참('합값을 꺼낸다', 합값({ seaPerMillionTotal: 9 }) === 9);

  참('띠를 나눈다', 띠나누기(
    [{ chartingTitles: 1 }, { chartingTitles: 3 }, { chartingTitles: 4 }, { chartingTitles: 9 }],
    띠들[2],
  ).length === 2);
  참('5+ 는 위가 없다', 띠나누기([{ chartingTitles: 99 }], 띠들[3]).length === 1);

  참('⭐ 원본이 있다', fs.existsSync(원본길));
  참('⛔ 손님에게 `id` 를 안 보인다 — 판 이름이 넷 다 있다',
    ['id', 'vi', 'th', 'ms'].every((p) => typeof 판이름[p] === 'string' && 판이름[p].length > 2));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 쓸사람 = 원.people.filter((x) => typeof x.chartingTitles === 'number'
    && x.chartingTitles > 0 && typeof x.seaPerMillionTotal === 'number');

  const 띠 = 띠들.map((b) => {
    const g = 띠나누기(쓸사람, b);
    const 한판 = g.map((x) => 한판값(x)).filter((v) => v != null);
    const 넷다 = g.filter((x) => x.seaEditionsWithArticle === 4).length;
    return {
      ...b,
      actors: g.length,
      /* ⚠ 날것 — 문서가 있는 판만 더한 합이다. 판 수가 섞여 있다 */
      summed: 띠재기(g.map((x) => 합값(x))),
      /* ⭐ 갈라낸 것 — 한 판만 보면 판 수가 상수가 된다 */
      oneEdition: 띠재기(한판),
      editionsWithArticle: {
        median: 중앙값(g.map((x) => x.seaEditionsWithArticle)),
        allFour: 넷다,
        allFourPc: +((100 * 넷다) / g.length).toFixed(1),
      },
      _값한판: 한판,
      _값합: g.map((x) => 합값(x)).filter((v) => v != null),
    };
  });

  const 아래 = 띠[0];
  const 위 = 띠.at(-1);

  const 자료 = {
    generatedAt: 원.generated?.slice(0, 10) ?? null,
    source: 원.source,
    window: 원.window,
    panel: 원.panel,
    panelCaveat: 원.panelCaveat,
    editions: 원.editionsSea,
    editionNames: 원.editionNames ?? 판이름,
    question: 'An actor with five charting titles is read about ten times as often as an actor '
      + 'with one. How much does that tell you about any one actor?',
    actorsMeasured: 쓸사람.length,
    bandsAreOurs: 'The four bands are ours. We cut at one, two, three-or-four and five-or-more '
      + 'titles because those splits leave every band with enough actors to measure; a different '
      + 'cut would give different medians.',
    controlEdition: 대조판,
    /**
     * 🔴 이 지면의 뼈대. 날것의 사다리에는 판 수가 섞여 있고, 갈라내도 사다리는 산다.
     */
    whySplitByEdition: 'The raw figure adds up an actor\'s reads across only the editions that '
      + 'have an article about them, and actors with more titles have articles in more editions. '
      + 'So the raw ladder is partly counting article coverage rather than reading. Measuring a '
      + 'single edition holds that constant, and the ladder survives it.',
    /**
     * ⛔ 「네 판 다 있는 사람끼리만」으로 맞추는 길을 안 쓰는 까닭. 수는 남긴다.
     */
    whyNotMatchOnEditions: 'The other way to hold coverage constant is to compare only actors '
      + 'who have an article in all four editions. We do not use it. Having four articles is a '
      + 'consequence of being read, not a fact settled beforehand, so selecting on it changes who '
      + 'is in each band — a collider (Cole et al. 2010). The counts are on this page so you can '
      + 'see how coverage varies, and no median is drawn from them.',
    bands: 띠.map(({ _값한판, _값합, ...b }) => b),
    ladder: {
      summed: 사다리인가(띠.map((b) => b.summed.median)),
      oneEdition: 사다리인가(띠.map((b) => b.oneEdition.median)),
    },
    /**
     * ⭐⭐ 한 사람 수준의 수. 사다리 밑에 반드시 이 수가 따라붙는다.
     */
    personLevel: {
      summed: 이길확률(위._값합, 아래._값합),
      oneEdition: 이길확률(위._값한판, 아래._값한판),
      whatItIs: 'The chance that a randomly chosen actor from the top band is read more than a '
        + 'randomly chosen actor from the bottom band, counting ties as half. This is the '
        + 'common-language effect size (McGraw and Wong 1992); it equals the Mann-Whitney U '
        + 'statistic divided by the number of pairs (Mann and Whitney 1947).',
      whatFiftyMeans: 'Fifty per cent would mean the bands tell you nothing at all about an '
        + 'individual. A hundred would mean every actor in the top band outreads every actor in '
        + 'the bottom one.',
    },
    overlap: {
      summed: 겹침(아래._값합, 위._값합),
      oneEdition: 겹침(아래._값한판, 위._값한판),
    },
    ...근거([중앙값자, 백만분율자, 하나빼기자], {
      방법: 'Each band is summarised by its median, and every median is reported twice — once '
        + 'from the four-edition sum and once from a single edition, which holds article coverage '
        + 'constant. Beside the medians we report the chance that one actor from the top band '
        + 'outreads one actor from the bottom band, so a group-level ladder is never presented as '
        + 'a fact about a person.',
      한계: 'This cannot tell you which way it runs. More titles may bring more readers, being '
        + 'read may bring more casting, or something we have not measured may drive both, and '
        + 'nothing on this page separates them. The panel is the cast of Korean titles that '
        + 'reached a Netflix country chart, so an actor whose work never charted is absent '
        + 'entirely, and the number of charting titles is capped by what Netflix publishes. The '
        + 'pair probability is built from ranks, so it says how often the top band wins and '
        + 'nothing about by how much.',
    }),
    cannotSay: [
      'Not cause. We measured that the two go together. Which one moves the other, or whether a '
        + 'third thing moves both, is not on this page and we are not going to guess.',
      'Not about an individual actor. The bands differ, and they still overlap heavily — the '
        + 'figures for that overlap are on this page.',
      'Not every Korean actor. The panel is the cast of titles that reached a Netflix country '
        + 'chart, and an actor who has never been in one is not counted.',
      'Not fame. This counts people opening an encyclopaedia article in four languages.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`배우 ${자료.actorsMeasured}명 · 창 ${자료.window}\n`);
  console.log('띠            n   합 가운데   한 판 가운데   네 판 다 있는 비율');
  for (const b of 자료.bands) {
    console.log(`${b.label.padEnd(14)}${String(b.actors).padStart(4)}`
      + `${String(b.summed.median ?? '⛔').padStart(11)}`
      + `${String(b.oneEdition.median ?? '⛔').padStart(15)}`
      + `${String(`${b.editionsWithArticle.allFourPc}%`).padStart(20)}`);
  }
  const L = 자료.ladder;
  console.log(`\n사다리 — 합 ${L.summed.everyStepRises ? '넷 다 오른다' : '한 칸이 안 오른다'}`
    + ` ${L.summed.fromTo}배 · 한 판 ${L.oneEdition.everyStepRises ? '넷 다 오른다' : '한 칸이 안 오른다'}`
    + ` ${L.oneEdition.fromTo}배`);
  console.log(`⭐ 한 사람 수준 — 위 띠 한 명이 아래 띠 한 명보다 많이 읽힐 확률`
    + ` ${(100 * 자료.personLevel.oneEdition).toFixed(1)}% (한 판 기준)`);
  const O = 자료.overlap.oneEdition;
  console.log(`⛔ 겹침 — 1편인데 5편이상의 가운데를 넘는 배우 ${O.lowBandAboveHighMedian}/${O.lowBandN}`
    + ` (${O.lowBandAbovePc}%) · 5편이상인데 1편의 가운데 아래 ${O.highBandBelowLowMedian}/${O.highBandN}`
    + ` (${O.highBandBelowPc}%)`);
  for (const b of 자료.bands) {
    if (b.oneEdition.verdict?.swingDetected) {
      console.log(`🔴 띠 ${b.label} 의 한 판 가운데가 하나빼기에 흔들린다`
        + ` (${b.oneEdition.oneOut.swingOverMedian}배)`);
    }
  }
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
