/**
 * **어느 나라가 한국 작품을 먼저 적는가.** (95편 자료)
 *
 * ⛔⛔⛔ **접었다 (2026-08-15). 이 자로 지면을 만들지 않는다.**
 *   재려던 「생일」이 문서 이동에 오염된다 — 「오징어 게임」 첫 판이 **2025-01** 로 나온다.
 *   2021년 작품인데. 까닭과 다시 오는 길은 `collect-sea-title-birth.mjs` 머리에 적었다.
 *   ⚠ 자와 자가시험은 남긴다. 오염을 가릴 자를 갖추면 그대로 쓴다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 92편이 「파도 앞의 바닥」을 재려다 막혔다 — 신작에는 「전」이 없다. 문서가 작품과
 * 함께 생기기 때문이다. 스물아홉 편이 그래서 빠졌다.
 * ⭐ **그 빠진 것이 이 자료다.** 바닥이 없는 대신 생일이 있다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **순위표로 줄세우지 않는다.** 「1등 인도네시아」 같은 것을 만들지 않는다.
 *    나라마다 위키피디아의 크기와 나이가 다르다. 시차의 중앙값만 낸다.
 * ⛔ **안 적힌 것을 늦은 것으로 세지 않는다.** 안 적힌 문서는 시차가 없다 — 무한이 아니다.
 * ⛔⛔ **못 받은 것을 「없는 것」으로 세지 않는다.** 수집기가 429 에 막혔던 자리다.
 *    못 받은 것이 남아 있으면 **그 판을 통째로 답에서 뺀다.**
 * ⛔ **중앙값을 그냥 싣지 않는다.** 94편의 하나빼기를 같이 낸다 — 한 편을 빼면 얼마나
 *    움직이는지 자료가 스스로 말하게 한다. 흔들리면 지면이 「기대지 마라」를 싣는다.
 * ⛔ **한국어판이 먼저라고 미리 정하지 않는다.** 음수가 나오면 그대로 싣는다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 되돌아 참조 — `build-wikitip-one-out.mjs` 에서 **함수만** 가져온다.
 *    ⛔ 값(상수)을 가져오면 안 된다. ESM 이 아직 안 만들었을 수 있다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-who-writes-first.mjs
 *   node scripts/build-wikitip-who-writes-first.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 하나빼기, 단단한가 } from './build-wikitip-one-out.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-title-birth.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-who-writes-first.json');

/** ⛔ 이보다 적게 잰 판은 답으로 내지 않는다. 다섯 편으로 나라를 말할 수 없다 */
export const 적어도잰것 = 8;

/**
 * ⛔⛔ **다 안 받은 원본으로 짓지 않는다.**
 * 🔴 8/15 에 수집기가 스물한 편에서 죽었다. 그 파일로 지으면 숫자가 다 나오고 **그럴듯하다** —
 *   틀렸다는 표가 어디에도 안 뜬다. 그래서 자료가 스스로 「다 받았다」를 말하게 했다.
 */
export function 다받았나(원본, 셈한작품수) {
  if (원본?.complete === true) return { ok: true };
  return {
    ok: false,
    why: 원본?.complete === false
      ? `원본이 스스로 「아직 다 못 받았다」고 적고 있다 (받은 것 ${셈한작품수}편`
        + `${원본.couldNotFetch ? ` · 못 받은 것 ${원본.couldNotFetch}건` : ''})`
      : '원본에 `complete` 칸이 없다 — 언제 적 자가 만든 것인지 알 수 없다',
  };
}

export function 중앙값(값들) {
  const s = [...값들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/**
 * ⭐ 한 판을 요약한다.
 * ⛔ 못 받은 것이 하나라도 있으면 **그 판을 답에서 뺀다** — 반쪽 자료로 나라를 말하지 않는다.
 */
export function 한판재기(작품들, 판, 문턱 = 적어도잰것) {
  const 못받음수 = 작품들.filter((t) => (t.couldNotFetch ?? []).includes(판)).length;
  const 값들 = 작품들.map((t) => t.monthsAfterKorean?.[판]).filter((v) => typeof v === 'number');
  const 안적힘 = 작품들.filter((t) => (t.notWritten ?? []).includes(판)).length;

  if (못받음수) {
    return {
      edition: 판, usable: false, couldNotFetch: 못받음수,
      why: 'some articles in this edition could not be fetched, so the figure would be built '
        + 'on a partial list — that is a gap in our collection, not a fact about the edition',
    };
  }
  if (값들.length < 문턱) {
    return {
      edition: 판, usable: false, measured: 값들.length, notWritten: 안적힘,
      why: `only ${값들.length} titles could be compared, fewer than the ${문턱} we require `
        + 'before naming a figure for a whole edition',
    };
  }
  const 잰것 = 하나빼기(값들);
  return {
    edition: 판,
    usable: true,
    measured: 값들.length,
    notWritten: 안적힘,
    medianMonthsAfterKorean: 중앙값(값들),
    /* ⭐ 한국어판보다 먼저 적은 것이 몇 편인가 — 「늘 한국이 먼저」가 참인지 자료가 답한다 */
    writtenBeforeKorean: 값들.filter((v) => v < 0).length,
    sameMonth: 값들.filter((v) => v === 0).length,
    range: [Math.min(...값들), Math.max(...값들)],
    /* ⛔ 중앙값을 그냥 싣지 않는다 — 94편의 자를 붙인다 */
    stability: 잰것 ? { ...잰것, verdict: 단단한가(잰것) } : null,
  };
}

/**
 * ⭐ 넷 중 어디가 먼저 적었나를 센다.
 * ⛔ **네 판을 다 아는 작품만 센다.** 세 판만 아는 작품을 넣으면 빠진 판이 늘 진다.
 */
export function 먼저적은곳세기(작품들, 판들) {
  const 온전한것 = 작품들.filter((t) => 판들.every((p) => typeof t.monthsAfterKorean?.[p] === 'number'));
  const 셈 = Object.fromEntries(판들.map((p) => [p, 0]));
  const 나눠가짐 = [];
  for (const t of 온전한것) {
    const 값 = 판들.map((p) => [p, t.monthsAfterKorean[p]]);
    const 가장이름 = Math.min(...값.map(([, v]) => v));
    const 이긴판 = 값.filter(([, v]) => v === 가장이름).map(([p]) => p);
    if (이긴판.length > 1) 나눠가짐.push({ title: t.titleEn, editions: 이긴판, months: 가장이름 });
    for (const p of 이긴판) 셈[p] += 1;
  }
  return { outOf: 온전한것.length, counts: 셈, ties: 나눠가짐 };
}

/** ⭐ 한국어판이 늘 먼저인가 — 이 물음에 자료가 직접 답한다 */
export function 한국이늘먼저인가(작품들, 판들) {
  const 잰것 = 작품들.filter((t) => 판들.some((p) => typeof t.monthsAfterKorean?.[p] === 'number'));
  const 앞선것 = 잰것.filter((t) => 판들.some((p) => t.monthsAfterKorean?.[p] < 0));
  return {
    outOf: 잰것.length,
    someEditionWasEarlier: 앞선것.length,
    always: 앞선것.length === 0,
    titles: 앞선것.map((t) => ({
      title: t.titleEn,
      koreanFirstWritten: t.koreanFirstWritten,
      earlier: Object.entries(t.monthsAfterKorean).filter(([, v]) => typeof v === 'number' && v < 0)
        .map(([p, v]) => ({ edition: p, monthsEarlier: -v })),
    })),
  };
}

/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  const 판들 = ['id', 'vi'];
  const 짓기 = (n, 값, 나머지 = {}) => ({
    titleEn: `T${n}`, monthsAfterKorean: 값, notWritten: [], couldNotFetch: [], ...나머지,
  });

  참('중앙값 홀수', 중앙값([1, 9, 5]) === 5);
  참('⛔ 빈 것은 null', 중앙값([]) === null);

  const 여덟 = Array.from({ length: 9 }, (_, i) => 짓기(i, { id: i }));
  const r = 한판재기(여덟, 'id');
  참('여덟을 넘으면 답을 낸다', r.usable === true && r.measured === 9);
  참('중앙값을 낸다', r.medianMonthsAfterKorean === 4);
  참('⭐ 하나빼기를 같이 낸다', r.stability && typeof r.stability.swingOverMedian === 'number');
  참('⭐ 판정이 붙는다', typeof r.stability.verdict.steady === 'boolean');
  참('폭을 낸다', r.range[0] === 0 && r.range[1] === 8);

  참('⛔ 적게 잰 판은 답으로 안 낸다',
    한판재기([짓기(1, { id: 1 }), 짓기(2, { id: 2 })], 'id').usable === false);
  참('⛔ 왜 못 내는지 적는다',
    (한판재기([짓기(1, { id: 1 })], 'id').why ?? '').length > 20);

  /* 🔴🔴 수집기가 429 에 막혔던 자리 — 반쪽 자료로 나라를 말하지 않는다 */
  const 못받은것 = [...여덟, 짓기(99, {}, { couldNotFetch: ['id'] })];
  참('⛔⛔ 못 받은 것이 있으면 그 판을 통째로 뺀다',
    한판재기(못받은것, 'id').usable === false);
  참('⛔ 못 받았다고 분명히 적는다',
    한판재기(못받은것, 'id').couldNotFetch === 1
    && /could not be fetched/.test(한판재기(못받은것, 'id').why));
  참('⭐ 못 받은 것이 없으면 그대로 답을 낸다', 한판재기(여덟, 'id').usable === true);

  /* ⛔ 안 적힌 것은 늦은 것이 아니다 */
  const 안적힌것 = [...여덟, 짓기(98, {}, { notWritten: ['id'] })];
  참('⛔ 안 적힌 것이 중앙값을 안 민다',
    한판재기(안적힌것, 'id').medianMonthsAfterKorean === 4);
  참('안 적힌 것을 따로 센다', 한판재기(안적힌것, 'id').notWritten === 1);

  참('⭐ 한국보다 먼저인 것을 센다',
    한판재기(Array.from({ length: 9 }, (_, i) => 짓기(i, { id: i - 2 })), 'id').writtenBeforeKorean === 2);
  참('같은 달을 센다',
    한판재기(Array.from({ length: 9 }, (_, i) => 짓기(i, { id: i - 2 })), 'id').sameMonth === 1);

  const 먼저 = 먼저적은곳세기([짓기(1, { id: 1, vi: 3 }), 짓기(2, { id: 5, vi: 2 })], 판들);
  참('먼저 적은 곳을 센다', 먼저.counts.id === 1 && 먼저.counts.vi === 1);
  참('둘 다 아는 것만 센다', 먼저.outOf === 2);
  /* ⛔ 세 판만 아는 작품을 넣으면 빠진 판이 늘 진다 */
  참('⛔ 한 판이 비면 그 작품을 안 센다',
    먼저적은곳세기([짓기(1, { id: 1 })], 판들).outOf === 0);
  const 비김 = 먼저적은곳세기([짓기(1, { id: 2, vi: 2 })], 판들);
  참('⭐ 비기면 둘 다 세고 따로 적는다',
    비김.counts.id === 1 && 비김.counts.vi === 1 && 비김.ties.length === 1);

  /* ⭐ 「한국이 늘 먼저」가 참인지 자료가 답한다 — 미리 정하지 않는다 */
  const 늘 = 한국이늘먼저인가([짓기(1, { id: 2 }), 짓기(2, { id: 3 })], 판들);
  참('한국이 늘 먼저면 그렇게 말한다', 늘.always === true && 늘.someEditionWasEarlier === 0);
  const 아님 = 한국이늘먼저인가([짓기(1, { id: -4 }), 짓기(2, { id: 3 })], 판들);
  참('⭐ 아니면 아니라고 말한다', 아님.always === false && 아님.someEditionWasEarlier === 1);
  참('⭐ 어느 작품인지 이름을 적는다',
    아님.titles[0].title === 'T1' && 아님.titles[0].earlier[0].monthsEarlier === 4);
  참('⛔ 못 잰 작품은 분모에 안 넣는다', 한국이늘먼저인가([짓기(1, {})], 판들).outOf === 0);

  /* 🔴🔴 8/15 — 수집기가 스물한 편에서 죽었고, 그 파일로 지으면 숫자가 그럴듯하게 다 나온다 */
  참('⛔⛔ 다 안 받은 원본을 안 쓴다', 다받았나({ complete: false, couldNotFetch: 5 }, 21).ok === false);
  참('⛔ 왜 안 쓰는지 적는다', /21편/.test(다받았나({ complete: false }, 21).why));
  참('⛔ `complete` 칸이 없으면 안 쓴다', 다받았나({}, 21).ok === false);
  참('⛔ 원본이 아예 없어도 안 쓴다', 다받았나(null, 0).ok === false);
  참('⭐ 다 받았으면 쓴다', 다받았나({ complete: true }, 59).ok === true);

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  if (!fs.existsSync(원본길)) {
    console.error('🔴 원본이 없다 — 먼저 `node scripts/collect-sea-title-birth.mjs` 를 돌린다');
    process.exit(1);
  }
  const 원본 = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 판들 = 원본.editions;
  const 작품들 = 원본.titles ?? [];

  /* ⛔⛔ 반쪽 원본으로 짓지 않는다. 지으면 숫자가 그럴듯하게 다 나온다 */
  const 다받음 = 다받았나(원본, 작품들.length);
  if (!다받음.ok) {
    console.error(`🔴 ${다받음.why}`);
    console.error('   `node scripts/collect-sea-title-birth.mjs` 를 다시 돌린다 — 빈 것만 묻는다.');
    process.exit(1);
  }

  const 판별 = 판들.map((p) => 한판재기(작품들, p));
  const 쓸판 = 판별.filter((x) => x.usable);

  const 자료 = {
    generatedAt: 원본.generatedAt,
    source: 원본.source,
    baseEdition: 원본.baseEdition,
    editions: 판들,
    editionNames: 원본.editionNames,
    question: 'When a Korean title is written up on the Korean Wikipedia, how long until '
      + 'Southeast Asian Wikipedias write it up too — and does one of them get there first?',
    totalTitles: 작품들.length,
    koreanKnown: 작품들.filter((t) => t.koreanFirstWritten).length,
    byEdition: 판별,
    whoGotThereFirst: 먼저적은곳세기(작품들, 쓸판.map((x) => x.edition)),
    koreanAlwaysFirst: 한국이늘먼저인가(작품들, 판들),
    titles: 작품들.map((t) => ({
      title: t.titleEn,
      koreanFirstWritten: t.koreanFirstWritten,
      monthsAfterKorean: t.monthsAfterKorean,
      notWritten: t.notWritten,
      couldNotFetch: t.couldNotFetch,
    })),
    cannotSay: [
      'This measures when an article was written, not when a title was watched. An article can '
        + 'appear months after an audience does, or before one arrives at all.',
      'Wikipedia editions differ in size and age. A slower edition here may simply have fewer '
        + 'editors, which is why we do not rank them.',
      'A title with no article in an edition is left out of that edition\'s figure entirely. It '
        + 'is not counted as arriving late, because it has not arrived.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`작품 ${자료.totalTitles}편 · 한국어판 생일을 아는 것 ${자료.koreanKnown}편\n`);
  for (const x of 판별) {
    if (!x.usable) { console.log(`  ⏭ ${원본.editionNames[x.edition]} — ${x.why.slice(0, 62)}`); continue; }
    console.log(`  ${원본.editionNames[x.edition].padEnd(11)} 잰 것 ${String(x.measured).padStart(2)}편 · `
      + `중앙 ${String(x.medianMonthsAfterKorean).padStart(5)}달 뒤 · `
      + `한국보다 먼저 ${x.writtenBeforeKorean}편 · 안 적힘 ${x.notWritten}편`);
    console.log(`  ${' '.repeat(11)} ⭐ 하나빼기 흔들림 ${x.stability.swingOverMedian}배 · `
      + `${x.stability.verdict.steady ? '단단하다' : '🔴 아직 답이 아니다'}`);
  }
  const w = 자료.whoGotThereFirst;
  console.log(`\n넷을 다 아는 ${w.outOf}편에서 먼저 적은 곳: `
    + Object.entries(w.counts).map(([p, n]) => `${원본.editionNames[p]} ${n}`).join(' · ')
    + (w.ties.length ? ` (비긴 것 ${w.ties.length}편)` : ''));
  const k = 자료.koreanAlwaysFirst;
  console.log(`한국어판이 늘 먼저인가 — ${k.always ? '그렇다' : `아니다. ${k.outOf}편 중 ${k.someEditionWasEarlier}편은 딴 나라가 먼저 적었다`}`);
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
