/**
 * **한국이 만드는 것 중 무엇이 덜 읽히나 — 그리고 그게 한국 일인가.** (`/what-kind-fell`)
 *
 * ── 물음 ───────────────────────────────────────────────────────
 * 동남아가 한국에 대해 작년보다 덜 읽는다. **만드는 것 전부가 그런가, 무엇이냐에 따라 다른가.**
 * ⭐ 갈래 셋으로 갈랐다 — 음악 · 화면 · **언어와 공예**(한글·웹툰·한복·태권도).
 * ⭐⭐ 그리고 갈래마다 **일본 문서를 대조군으로** 둔다. 같이 떨어졌으면 한국 일이 아니다.
 *
 * ── 🔴 재 보고 알았다: 낼 수 있는 것은 셋 중 하나뿐이다 ──────
 * ```
 *   갈래                  한국      일본       하나빼기 흔들림
 *   Music                −10.9%   +14.5%     한국 1.13 🔴 · 일본 3.55 🔴   못 쓴다
 *   Screen                −4.2%   +22.9%     한국 4.94 🔴 · 일본 4.12 🔴   못 쓴다
 *   Language and craft   −25.5%   −28.2%     한국 0.08  · 일본 0.26      쓸 수 있다
 * ```
 * ⛔ 갈래마다 문서가 서넛뿐이다. 「한국 음악 −10.9%」는 네 편의 중앙값이고, 한 편을 빼면
 *   −17% 에서 −4.7% 사이로 움직인다. **그 수로는 아무 말도 못 한다.**
 * ⭐ 하나빼기가 없었으면 「한국만 떨어졌다」는 기사를 냈을 것이다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **못 쓰는 갈래를 감추지 않는다.** 빼면 「한국만 떨어졌다」로 읽힌다. 같은 지면에 싣는다.
 * ⛔ **「일본에 졌다」로 안 쓴다.** 일본은 대조군이지 경쟁자가 아니다.
 * ⛔ **하나빼기를 한쪽으로만 읽는다.** 잡은 흔들림은 진짜, 못 잡은 것은 **모르는 것**이다.
 * ⛔ **덜 찬 마지막 달을 안 쓴다.** 2026-07 이 평소의 2% 로 왔다.
 * ⛔ **갈래는 우리가 나눈 것**이다. 그 말을 자료에 박는다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-what-kind-fell.mjs
 *   node scripts/build-wikitip-what-kind-fell.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 하나빼기, 단단한가 } from './build-wikitip-one-out.mjs';
import {
  근거, 중앙값 as 중앙값자, 백만분율 as 백만분율자, 하나빼기 as 하나빼기자, 대조군 as 대조군자,
} from './_evidence-kcw.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-genre.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-what-kind-fell.json');

/** ⭐ 앞뒤로 견줄 달수. 24 달을 12 대 12 로 가른다 */
export const 반쪽달 = 12;

export function 중앙값(값들) {
  const s = [...값들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : +((s[n / 2 - 1] + s[n / 2]) / 2).toFixed(2);
}

/**
 * 한 문서의 그달 백만분율(네 판 합).
 * ⛔ **한 판이라도 빈 달은 그 달을 통째로 뺀다.** 0 으로 메우면 「아무도 안 봤다」가 되는데
 *   그건 「못 받았다」와 다른 말이다.
 */
export function 달합(문서, 달, 판들, 밑값) {
  let 합 = 0; let 잰판 = 0;
  for (const p of 판들) {
    if (!문서.views?.[p]) continue;
    const v = 문서.views[p][달];
    const 밑 = 밑값[p]?.[달];
    if (v == null || 밑 == null || 밑 === 0) return null;
    합 += (1e6 * v) / 밑;
    잰판 += 1;
  }
  return 잰판 > 0 ? 합 : null;
}

/** ⛔ 열두 달이 다 차야 평균을 낸다 — 빈 달을 건너뛰면 계절이 섞인다 */
export function 반쪽평균(문서, 달들, 판들, 밑값) {
  const 값 = 달들.map((m) => 달합(문서, m, 판들, 밑값));
  return 값.every((v) => v != null) ? 값.reduce((a, b) => a + b, 0) / 값.length : null;
}

/** 앞 열두 달 대비 뒤 열두 달의 변화(%) */
export function 변화(앞, 뒤) {
  if (앞 == null || 뒤 == null || 앞 === 0) return null;
  return +((100 * (뒤 - 앞)) / 앞).toFixed(1);
}

/**
 * ⭐⭐ 갈래 한 쪽(한국 또는 일본)을 잰다.
 * ⛔ **하나빼기를 반드시 붙인다.** 서넛의 중앙값을 그냥 내면 안 된다.
 */
export function 한쪽재기(제목들, 자료, 앞달, 뒤달) {
  const 판들 = 자료.editionsSea;
  const 줄 = [];
  for (const t of 제목들) {
    const a = 자료.articles.find((x) => (x.titleEn ?? x.title) === t);
    if (!a) continue;
    const 앞 = 반쪽평균(a, 앞달, 판들, 자료.editionTotals);
    const 뒤 = 반쪽평균(a, 뒤달, 판들, 자료.editionTotals);
    const c = 변화(앞, 뒤);
    if (c != null) 줄.push({ title: t, before: +앞.toFixed(1), after: +뒤.toFixed(1), changePc: c });
  }
  const 값 = 줄.map((x) => x.changePc);
  const 잼 = 하나빼기(값);
  return {
    articles: 줄,
    measured: 줄.length,
    medianChangePc: 중앙값(값),
    stability: 잼 ? { ...잼, verdict: 단단한가(잼) } : null,
  };
}

/**
 * ⭐⭐⭐ **이 갈래로 말할 수 있나.**
 * ⛔ 한쪽이라도 흔들림이 잡히면 못 쓴다 — 견주는 두 수 중 하나가 흔들리면 견줌이 무너진다.
 */
export function 말할수있나(한국, 일본) {
  const 흔들 = [];
  if (한국.stability?.verdict?.swingDetected) 흔들.push('Korea');
  if (일본.stability?.verdict?.swingDetected) 흔들.push('Japan');
  if (흔들.length) {
    return {
      usable: false,
      swingIn: 흔들,
      why: `removing one article moves the ${흔들.join(' and ')} median by more than half its `
        + 'own size, so the two figures cannot be compared with each other',
    };
  }
  return { usable: true };
}

/**
 * ⭐ 대조군이 무엇을 말하나 — **둘 다 떨어졌으면 한국 일이 아니다.**
 * ⛔ 「일본에 졌다」로 쓰지 않는다. 일본은 대조군이지 경쟁자가 아니다.
 */
export function 대조가말하는것(한국중앙, 일본중앙) {
  if (한국중앙 == null || 일본중앙 == null) return null;
  const 둘다내림 = 한국중앙 < 0 && 일본중앙 < 0;
  return {
    koreaFell: 한국중앙 < 0,
    japanFell: 일본중앙 < 0,
    bothFell: 둘다내림,
    reading: 둘다내림
      ? 'both fell, so this is something happening to this kind of article rather than '
        + 'something happening to Korea'
      : '한국만 떨어졌다면 그 갈래에서 한국에 일어난 일이다',
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  참('변화를 낸다', 변화(100, 75) === -25);
  참('⛔ 앞이 0 이면 못 낸다', 변화(0, 5) === null);
  참('⛔ 한쪽이 없으면 못 낸다', 변화(null, 5) === null && 변화(5, null) === null);
  참('중앙값 짝수는 평균', 중앙값([1, 2, 3, 4]) === 2.5);

  /* ⛔ 한 판이라도 빈 달은 그 달을 통째로 뺀다 */
  const 밑 = { id: { '2024-07': 1e6 }, vi: { '2024-07': 1e6 } };
  참('두 판을 더한다',
    달합({ views: { id: { '2024-07': 5 }, vi: { '2024-07': 3 } } }, '2024-07', ['id', 'vi'], 밑) === 8);
  참('⛔⛔ 한 판이 비면 그 달을 통째로 뺀다',
    달합({ views: { id: { '2024-07': 5 }, vi: { '2024-07': null } } }, '2024-07', ['id', 'vi'], 밑) === null);
  참('⛔ 밑이 없어도 뺀다',
    달합({ views: { id: { '2024-07': 5 } } }, '2024-07', ['id'], { id: {} }) === null);

  /* ⛔ 열두 달이 다 차야 평균을 낸다 */
  const 문서 = { views: { id: { '2024-07': 5, '2024-08': 7 } } };
  참('다 차면 평균을 낸다',
    반쪽평균(문서, ['2024-07', '2024-08'], ['id'], { id: { '2024-07': 1e6, '2024-08': 1e6 } }) === 6);
  참('⛔ 한 달이라도 비면 못 낸다',
    반쪽평균(문서, ['2024-07', '2024-09'], ['id'], { id: { '2024-07': 1e6, '2024-09': 1e6 } }) === null);

  /**
   * ⭐⭐⭐ 8/16 — 이 자리가 이 자의 전부다. 하나빼기가 없었으면
   *   「한국만 떨어졌다」는 기사를 냈을 것이다.
   */
  const 흔들림 = { stability: { verdict: { swingDetected: true } } };
  const 단단 = { stability: { verdict: { swingDetected: false } } };
  참('⛔⛔ 한쪽이 흔들리면 못 쓴다', 말할수있나(흔들림, 단단).usable === false);
  참('⛔ 일본 쪽이 흔들려도 못 쓴다', 말할수있나(단단, 흔들림).usable === false);
  참('⛔ 어느 쪽이 흔들리는지 적는다',
    말할수있나(흔들림, 흔들림).swingIn.join() === 'Korea,Japan');
  참('⭐ 둘 다 단단하면 쓴다', 말할수있나(단단, 단단).usable === true);
  참('⛔ 못 쓰는 까닭을 적는다', /cannot be compared/.test(말할수있나(흔들림, 단단).why));

  /* ⛔ 「일본에 졌다」로 쓰지 않는다 — 대조군이지 경쟁자가 아니다 */
  const 둘다 = 대조가말하는것(-25.5, -28.2);
  참('⭐⭐ 둘 다 떨어지면 한국 일이 아니라고 읽는다', 둘다.bothFell === true);
  참('⛔ 그 말을 그대로 적는다', /happening to this kind of article/.test(둘다.reading));
  참('⛔ 「졌다」는 말을 안 쓴다', !/beat|lost|behind|worse/i.test(둘다.reading));
  참('한국만 떨어진 경우를 가른다', 대조가말하는것(-10.9, 14.5).bothFell === false);
  참('⛔ 못 재면 null', 대조가말하는것(null, -5) === null);

  참('⭐ 원본이 있다', fs.existsSync(원본길));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  /* ⛔ 덜 찬 마지막 달을 안 쓴다 — 2026-07 이 평소의 2% 로 왔다 */
  const 쓸달 = 원.months.slice(0, -1);
  const 앞달 = 쓸달.slice(0, 반쪽달);
  const 뒤달 = 쓸달.slice(-반쪽달);

  const 갈래들 = 원.genres.map((g) => {
    const 한국 = 한쪽재기(g.korea, 원, 앞달, 뒤달);
    const 일본 = 한쪽재기(g.japan, 원, 앞달, 뒤달);
    const 쓸수 = 말할수있나(한국, 일본);
    return {
      key: g.key,
      name: g.name,
      korea: 한국,
      japan: 일본,
      ...쓸수,
      control: 쓸수.usable ? 대조가말하는것(한국.medianChangePc, 일본.medianChangePc) : null,
    };
  });

  const 쓸것 = 갈래들.filter((g) => g.usable);
  const 못쓸것 = 갈래들.filter((g) => !g.usable);

  const 자료 = {
    generatedAt: 원.generated?.slice(0, 10) ?? null,
    source: 'Wikimedia Pageviews API, human traffic only, monthly, per Wikipedia edition; '
      + 'reads expressed per million reads of that edition in that month',
    window: `${쓸달[0]} through ${쓸달.at(-1)}, ${쓸달.length} months, split ${반쪽달} against ${반쪽달}`,
    droppedLastMonth: 원.incompleteLastMonth ?? null,
    editions: 원.editionsSea,
    editionNames: 원.editionNames,
    question: 'Southeast Asia reads less about Korea than it did a year ago. Is that true of '
      + 'everything Korea makes, or does it depend on what?',
    ...근거([중앙값자, 백만분율자, 하나빼기자, 대조군자], {
      방법: 'Each genre is summarised by the median change across its articles, and each Korean '
        + 'genre is read against Japanese articles of the same kind measured the same way.',
      한계: 'The genres are ours, not Wikipedia\'s — we chose which article belongs to which, and '
        + 'a different grouping would give different medians. Each genre holds only three to five '
        + 'articles, which is why two of the three could not be used at all. An encyclopaedia '
        + 'article is not the thing itself: reads of "Korean language" are not people learning it.',
    }),
    genresAreOurs: 원.genresAreOurs ?? null,
    japanIsControl: 원.japanIsControl ?? null,
    usable: 쓸것,
    notUsable: 못쓸것,
    cannotSay: [
      'Not why. A control can remove an explanation — if Japanese articles of the same kind fell '
        + 'too, the fall is not about Korea — but it does not supply the one that replaces it.',
      'Not two of the three genres. Music and Screen have too few articles for their medians to '
        + 'survive removing one, so this page reports that it cannot use them rather than '
        + 'quietly leaving them out.',
      'Not interest, and not learning. This counts people opening an encyclopaedia article.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`창 ${자료.window}\n`);
  for (const g of 갈래들) {
    console.log(`${g.usable ? '⭐' : '⏭'} ${g.name.padEnd(20)} `
      + `한국 ${String(g.korea.medianChangePc).padStart(6)}% (n=${g.korea.measured}) · `
      + `일본 ${String(g.japan.medianChangePc).padStart(6)}% (n=${g.japan.measured})`);
    if (!g.usable) { console.log(`   🔴 ${g.why.slice(0, 88)}`); continue; }
    console.log(`   ⭐ ${g.control.reading.slice(0, 88)}`);
  }
  console.log(`\n쓸 수 있는 갈래 ${쓸것.length}/${갈래들.length}`);
  console.log(`자료 → ${path.relative(뿌리, 낼길)}`);
}
