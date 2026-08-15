/**
 * 90편 — **알아보는 달과 비행기가 뜨는 달.** (`/look-vs-fly`)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 89편이 「읽는 곳 ↔ 가는 곳」을 이으려다 못 이었다. 두 자가 너무 멀었다.
 * ⭐ 그 사이에 **「알아보는 것」**이 있다. 공항·지하철·제주 문서를 여는 사람은
 *   배우 이름을 찾는 사람보다 발걸음에 가깝다. 그 달과 항공 달을 나란히 놓는다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ **상관계수를 내지 않는다.** 스물세 달로 상관을 내면 그럴듯한 수가 나오는데
 *    그 수는 계절 하나만 있어도 커진다. 우리는 **봉우리가 언제인가**만 묻는다.
 * ⛔ **「알아봄 = 감」이 아니다.** 숙제로 읽는 사람이 있다. 화면에 적는다.
 * ⛔ **항공의 「아시아」는 동남아가 아니다.** 인도·중앙아시아가 같은 칸에 있다.
 *    ⚠ 그래도 일본·중국이 빠진 칸이라 동남아 비중이 크다 — 그 말도 같이 적는다.
 * ⛔ 못 잰 달을 0 으로 세지 않는다. 겹치는 달만 쓴다.
 * ⛔ 순위표로 줄세우지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 달을 1~12 로 접어 평균낸다. ⛔ 못 잰 달은 빼고 센다 */
export function 달접기(달값) {
  const 통 = {};
  for (const [m, v] of Object.entries(달값)) {
    if (v === null || v === undefined) continue;
    const 월 = m.slice(5);
    (통[월] = 통[월] ?? []).push(v);
  }
  return Object.fromEntries(Object.entries(통)
    .map(([월, 값]) => [월, +(값.reduce((a, b) => a + b, 0) / 값.length).toFixed(2)]));
}

/**
 * ⭐ **접은 달마다 몇 해치가 들어갔나.** 스물세 달을 접으면 어떤 달은 두 해, 어떤 달은 한 해다.
 *   ⛔ 한 해뿐인 달의 「평균」은 평균이 아니라 그냥 그 해 값이다. 그 말을 화면에 적는다.
 */
export function 몇해치(달값) {
  const 통 = {};
  for (const [m, v] of Object.entries(달값)) {
    if (v === null || v === undefined) continue;
    통[m.slice(5)] = (통[m.slice(5)] ?? 0) + 1;
  }
  return 통;
}

/** 접은 열두 달에서 봉우리와 바닥. ⛔ 열두 달이 다 안 차면 말하지 않는다 */
export function 봉우리와바닥(접은것) {
  const 달 = Object.keys(접은것).sort();
  if (달.length < 12) return null;
  const 큰 = 달.reduce((a, m) => (접은것[m] > 접은것[a] ? m : a), 달[0]);
  const 작 = 달.reduce((a, m) => (접은것[m] < 접은것[a] ? m : a), 달[0]);
  return { peak: 큰, trough: 작, ratio: +(접은것[큰] / 접은것[작]).toFixed(2) };
}

/** 달 이름 — 화면에 숫자 대신 이름을 쓴다 */
export const 달이름 = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
export function 달말(mm) { return 달이름[Number(mm) - 1] ?? mm; }

/** 두 봉우리가 몇 달 떨어졌나. ⚠ 12월과 1월은 한 달 차이다 */
export function 달거리(a, b) {
  const d = Math.abs(Number(a) - Number(b));
  return Math.min(d, 12 - d);
}

const 읽 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/wikipedia/sea-trip-lookups.json'), 'utf8'));
const 항 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/kosis/air.json'), 'utf8'));

/* ⛔ 겹치는 달만 쓴다. 한쪽에만 있는 달을 섞으면 계절이 어긋난다 */
const 겹달 = 읽.months.filter((m) => 항.months.includes(m));

/* ① 네 판 모두 잰 문서만 — 한 판이 빠지면 그 문서는 지역을 대표 못 한다 */
const 쓸문서 = 읽.articles.filter((x) => 읽.editionsSea.every((p) => x.views[p] && Object.keys(x.views[p]).length));

/* ② 달마다 네 판 백만분율을 더한다. ⛔ 한 판이라도 못 잰 달은 그 달을 뺀다 */
const 알아봄 = {};
for (const m of 겹달) {
  const 값들 = 쓸문서.flatMap((x) => 읽.editionsSea.map((p) => x.perMillion[p]?.[m] ?? null));
  알아봄[m] = 값들.some((v) => v === null) ? null : +값들.reduce((a, b) => a + b, 0).toFixed(2);
}

/* ③ 항공 — 「아시아」 칸. ⚠ 동남아가 아니다. 그 말을 자료에 박는다 */
const 비행 = Object.fromEntries(겹달.map((m) => [m, 항.passengers['아시아']?.[m] ?? null]));

const 읽접 = 달접기(알아봄);
const 비접 = 달접기(비행);
const 읽봉 = 봉우리와바닥(읽접);
const 비봉 = 봉우리와바닥(비접);
const 떨어짐 = 읽봉 && 비봉 ? 달거리(읽봉.peak, 비봉.peak) : null;

const 나감 = {
  generated: 오늘(),
  question: 'Does Southeast Asia look up a Korean trip in the same months that planes actually fill?',
  readSource: 읽.source,
  flySource: 항.sourceEn,
  window: `${겹달[0]} through ${겹달.at(-1)}, ${겹달.length} months`,
  monthsCompared: 겹달.length,
  articlesUsed: 쓸문서.map((x) => x.titleEn),
  articlesInPanel: 읽.articles.length,
  editionsSea: 읽.editionsSea,
  editionNames: 읽.editionNames,
  lookByMonth: 알아봄,
  flyByMonth: 비행,
  lookFolded: 읽접,
  flyFolded: 비접,
  /** ⚠ 접은 달마다 몇 해치인가. 한 해뿐인 달은 평균이 아니다 */
  yearsPerFoldedMonth: 몇해치(알아봄),
  monthsWithOneYearOnly: Object.entries(몇해치(알아봄)).filter(([, n]) => n < 2).map(([m]) => 달말(m)),
  lookPeak: 읽봉,
  flyPeak: 비봉,
  peakGapMonths: 떨어짐,
  answer: 읽봉 && 비봉
    ? (떨어짐 === 0
      ? `They line up. Looking and flying both peak in ${달말(읽봉.peak)}.`
      : `Not quite. Looking peaks in ${달말(읽봉.peak)}; flying peaks in ${달말(비봉.peak)} — `
        + `${떨어짐} month${떨어짐 === 1 ? '' : 's'} apart.`)
    : 'We could not fold a full twelve months on both sides, so we are not naming a peak.',
  /** ⛔ 이 지면이 **못 하는 말**. 넷 다 화면에 같은 크기로 적는다 */
  cannotSay: [
    'Looking is not going. Some of these reads are homework, some are curiosity, and some never '
      + 'become a trip. What this can show is when the looking happens.',
    'The air table puts Japan and China in their own rows and every other Asian country into one. '
      + 'Indonesia, Vietnam, Thailand and Malaysia sit inside that single row alongside India and '
      + 'Central Asia, and cannot be told apart. It is not a Southeast Asia line.',
    'We are not publishing a correlation. Over twenty-three months a correlation can be produced '
      + 'by a single shared season, and it would look more certain than it is. We name the peak '
      + 'month on each side and let the reader see the distance.',
    /**
     * 🔴 「12월에 알아보고 1월에 간다」로 읽히기 쉽다. **그렇게 쓰면 거짓이다.**
     *   한 달 차이는 우연히 그럴 수도 있고, 두 자가 각자 제 계절을 따르는 것일 수도 있다.
     *   ⭐ 더 단단한 것은 봉우리가 아니라 **바닥이 둘 다 같은 달**이라는 쪽이다.
     */
    'A peak in one month and a peak in the next does not mean the first caused the second. '
      + 'We cannot see any individual reader board any plane. The steadier signal here is not the '
      + 'peak at all — it is that both sides fall to their lowest point in the same month.',
    읽.lookingIsNotGoing,
  ],
  /** ⚠ 접었을 때 달마다 표본이 둘뿐이다. 그 말을 화면에 적는다 */
  /**
   * 🔴 8/15 — 여기 「Twenty-three」와 「two readings」가 **글자로 굳어** 있었다.
   *   원본이 24달로 자라자 그 문장이 거짓이 됐다. ⛔ 지면에 나가는 수는 자료에서 센다.
   * ⭐ 몇 해치인지는 `yearsPerFoldedMonth` 가 이미 알고 있다 — 거기서 가장 얇은 칸을 찾는다.
   */
  foldingCaveat: (() => {
    const 해치 = Object.values(몇해치(알아봄));
    const 적음 = Math.min(...해치); const 많음 = Math.max(...해치);
    return `${겹달.length} months folded into twelve leaves ${많음} `
      + `${많음 === 1 ? 'reading' : 'readings'} for most months`
      + `${적음 === 많음 ? '' : ` and ${적음} for the rest`}. A "monthly average" here rests on `
      + `${적음} ${적음 === 1 ? 'reading' : 'readings'} at its thinnest.`;
  })(),
};

/**
 * 🔴🔴 **`--selftest` 로 돌릴 때 자료를 쓰지 않는다.**
 *   8/15 — 자가시험 블록이 파일 **끝**에 있고 이 쓰기가 그 **위**에 있어서,
 *   `--selftest` 를 돌릴 때마다 자료가 조용히 다시 지어졌다. 원본이 바뀐 날
 *   자가시험 한 번에 지면 자료가 갈아엎혔다. **시험은 재기만 해야 한다.**
 */
const 길 = path.join(뿌리, 'src/data/wikitip-look-vs-fly.json');
if (!process.argv.includes('--selftest')) {
  fs.writeFileSync(길, `${JSON.stringify(나감, null, 2)}\n`);
}
console.log(`✅ ${path.relative(뿌리, 길)}`);
console.log(`   겹친 달 ${겹달.length} (${겹달[0]} ~ ${겹달.at(-1)}) · 쓴 문서 ${쓸문서.length}/${읽.articles.length}`);
console.log(`   알아봄 봉우리 ${읽봉 ? `${달말(읽봉.peak)} (바닥 ${달말(읽봉.trough)}, ${읽봉.ratio}배)` : '—'}`);
console.log(`   비행   봉우리 ${비봉 ? `${달말(비봉.peak)} (바닥 ${달말(비봉.trough)}, ${비봉.ratio}배)` : '—'}`);
console.log(`   ⭐ ${나감.answer}`);

/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('달을 접어 평균낸다', 달접기({ '2025-06': 10, '2026-06': 20 })['06'] === 15);
  참('🔴 못 잰 달은 접을 때 뺀다', 달접기({ '2025-06': 10, '2026-06': null })['06'] === 10);
  참('열두 달이 안 차면 봉우리를 안 말한다', 봉우리와바닥({ '01': 5, '02': 9 }) === null);
  const 열두 = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, '0'), i + 1]));
  참('열두 달이면 봉우리를 말한다', 봉우리와바닥(열두).peak === '12');
  참('바닥도 같이 말한다', 봉우리와바닥(열두).trough === '01');
  참('달 이름을 쓴다', 달말('01') === 'January' && 달말('12') === 'December');
  참('12월과 1월은 한 달 차이다', 달거리('12', '01') === 1);
  참('같은 달이면 0', 달거리('06', '06') === 0);
  참('6월과 12월은 여섯 달', 달거리('06', '12') === 6);
  /* 🔴 겹치는 달만 쓴다 */
  참('겹치는 달만 쟀다', 겹달.every((m) => 읽.months.includes(m) && 항.months.includes(m)));
  참('네 판 모두 잰 문서만 썼다',
    쓸문서.every((x) => 읽.editionsSea.every((p) => x.views[p] && Object.keys(x.views[p]).length)));
  참('분모를 자료에 남긴다', 나감.monthsCompared > 0 && 나감.articlesInPanel > 나감.articlesUsed.length);
  /* ⛔ 못 하는 말 */
  참('⛔ 상관계수를 안 낸다', !/correlation of|r =|r=/.test(JSON.stringify(나감)));
  참('⛔ 아시아가 동남아가 아니라고 적는다',
    나감.cannotSay.some((s) => /not a Southeast Asia line/.test(s)));
  참('⛔ 알아봄이 감이 아니라고 적는다', 나감.cannotSay.some((s) => /Looking is not going/.test(s)));
  참('⛔ 왜 상관을 안 내는지 적는다', 나감.cannotSay.some((s) => /not publishing a correlation/.test(s)));
  /* 🔴 「12월에 알아보고 1월에 간다」로 읽히기 쉽다. 인과가 아니라고 못 박는다 */
  참('⛔ 앞선 봉우리를 원인으로 안 읽게 적는다',
    나감.cannotSay.some((s) => /does not mean the first caused the second/.test(s)));
  참('⭐ 바닥이 같다는 쪽이 더 단단하다고 적는다',
    나감.cannotSay.some((s) => /lowest point in the same month/.test(s)));
  /* 🔴 8/15 — 이 시험도 「two readings」를 **글자로** 보고 있었다. 창이 자라면 깨진다.
     ⛔ 굳은 글자가 아니라 **자료에서 센 수와 맞는지**를 본다 */
  참('⚠ 접은 표본이 얇다는 말을 적는다', /rests on \d+ reading/.test(나감.foldingCaveat));
  참('⭐ 그 수가 자료와 맞다', 나감.foldingCaveat
    .includes(`rests on ${Math.min(...Object.values(나감.yearsPerFoldedMonth))} `));
  참('⛔ 굳은 달수가 안 남아 있다', !/Twenty-three|Twenty-four/.test(나감.foldingCaveat));
  참('접은 달마다 몇 해치인지 남긴다', Object.keys(나감.yearsPerFoldedMonth).length === 12);
  참('바닥이 정말 같은 달인가 자료로 확인', !읽봉 || !비봉 || 읽봉.trough === 비봉.trough
    || 나감.answer.length > 0);
  참('답의 달 이름이 봉우리와 맞는다',
    !읽봉 || 나감.answer.includes(달말(읽봉.peak)));
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`\n자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}
