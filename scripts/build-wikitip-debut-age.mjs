#!/usr/bin/env node
/**
 * **몇 살에 시작했나, 그리고 지금 얼마나 읽히나.** (`/debut-age`)
 *
 * ⭐⭐ 사장님 지시(8/16·8/20) — 스타의 **이름**을 제목과 표에. 손님은 이름을 검색한다.
 *    그래서 띠마다 그 띠에서 가장 읽히는 이름을 자료가 들고 있게 한다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **「일찍 시작해서 많이 읽힌다」로 안 쓴다.** 방향을 못 가른다.
 * ⛔ **가장 뻔한 반론을 먼저 죽인다** — 「일찍 시작했으니 경력이 길어 쌓인 것 아닌가」.
 *    ⭐ 재 보니 아니다. 띠마다 경력 가운데값이 20~22년으로 **거의 같다.**
 *    그리고 경력을 10~20년으로 붙들고 다시 재도 사다리가 산다.
 * ⛔ **붙들고 재면 위 두 띠가 붙는다**는 것을 감추지 않는다. 사다리가 넷에서 셋이 된다.
 * ⛔ **무리의 수 옆에 한 사람 수준의 수**를 둔다(McGraw & Wong 1992).
 * ⛔ **지금 나이는 못 가른다.** 1992년에 다섯 살로 시작한 사람은 지금 서른아홉이다.
 *    데뷔 나이와 현재 나이가 얽혀 있고, 이 자료로는 못 뗀다. 그 말을 적는다.
 * ⛔ 광고 자리를 만들지 않는다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-debut-age.mjs
 *   node scripts/build-wikitip-debut-age.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 하나빼기, 단단한가 } from './build-wikitip-one-out.mjs';
import { 이길확률, 이길확률_짝세기 } from './build-wikitip-works-and-readers.mjs';
import {
  근거, 중앙값 as 중앙값자, 백만분율 as 백만분율자, 하나빼기 as 하나빼기자, 대조군 as 대조군자,
} from './_evidence-kcw.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 사람길 = path.join(뿌리, 'archive', 'raw', 'wikidata', 'korean-people.json');
export const 띠길 = path.join(뿌리, 'src', 'data', 'wikitip-star-signs.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-debut-age.json');

/** ⚠ 띠는 **우리가 나눈 것**이다. 다르게 나누면 다른 수가 나온다. 그 말을 자료에 박는다 */
export const 띠들 = [
  { key: 'under18', label: 'under 18', from: 0, to: 18 },
  { key: '18-21', label: '18 to 21', from: 18, to: 22 },
  { key: '22-25', label: '22 to 25', from: 22, to: 26 },
  { key: '26plus', label: '26 or older', from: 26, to: Infinity },
];

/** ⛔ 이보다 얇은 띠는 가운데값을 안 낸다 */
export const 최소인원 = 15;
/** ⭐ 경력을 붙드는 창. 이 안에 있는 사람끼리만 다시 견준다 */
export const 경력창 = { 부터: 10, 까지: 20 };
/** 자료의 마지막 해 — ⛔ `new Date()` 를 안 쓴다. 창이 언제 열려도 같은 수가 나와야 한다 */
export const 셈한해 = 2026;

export function 중앙값(값들) {
  const s = [...값들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

export function 띠고르기(사람들, 띠) {
  return 사람들.filter((p) => p.debutAge >= 띠.from && p.debutAge < 띠.to);
}

/**
 * 한 띠를 요약한다. ⛔ 얇으면 가운데값을 **안 낸다** — 비율만 크게 보인다.
 * ⭐ 이름을 셋 들고 간다. 지면 표의 첫 칸이 그것이다(사장님 지시).
 */
export function 띠재기(사람들) {
  const v = 사람들.map((p) => p.perMillion);
  if (사람들.length < 최소인원) {
    return { measured: 사람들.length, tooThin: true, why: `fewer than ${최소인원} people` };
  }
  const oneOut = 하나빼기(v);
  const 많은순 = [...사람들].sort((a, b) => b.perMillion - a.perMillion);
  return {
    measured: 사람들.length,
    tooThin: false,
    median: +중앙값(v).toFixed(2),
    careerMedian: 중앙값(사람들.map((p) => p.careerYears)),
    topNames: 많은순.slice(0, 3).map((p) => ({
      name: p.name, debutAge: p.debutAge, perMillion: p.perMillion,
    })),
    oneOut,
    verdict: 단단한가(oneOut),
  };
}

/** ⭐ 사다리가 한 칸씩 내려가나. ⛔ 한 칸이라도 안 내려가면 사다리라고 안 부른다 */
export function 사다리인가(가운데들) {
  const v = 가운데들.filter((x) => typeof x === 'number');
  if (v.length < 2) return null;
  const 칸 = [];
  for (let i = 1; i < v.length; i += 1) 칸.push(v[i] < v[i - 1]);
  return {
    steps: 칸.length,
    everyStepFalls: 칸.every(Boolean),
    fromTo: +(v[0] / v.at(-1)).toFixed(2),
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };

  재본다('중앙값 홀수', 중앙값([3, 1, 2]), 2);
  재본다('중앙값 짝수는 평균', 중앙값([1, 2, 3, 4]), 2.5);
  재본다('⛔ 빈 것은 null', 중앙값([]), null);

  const 사람 = (나이, r, 경력 = 15) => ({ name: `n${나이}-${r}`, debutAge: 나이, perMillion: r, careerYears: 경력 });
  재본다('⛔ 띠 경계는 위가 안 겹친다',
    띠고르기([사람(17, 1), 사람(18, 1), 사람(21, 1), 사람(22, 1)], 띠들[1]).length, 2);
  재본다('26+ 는 위가 없다', 띠고르기([사람(45, 1)], 띠들[3]).length, 1);

  재본다('⛔⛔ 열다섯이 안 되면 가운데값을 안 낸다',
    띠재기([사람(10, 1), 사람(10, 2)]).tooThin, true);
  const 스물 = Array.from({ length: 20 }, (_, i) => 사람(10, i + 1));
  const r = 띠재기(스물);
  재본다('스물이면 잰다', [r.tooThin, r.median], [false, 10.5]);
  재본다('⭐ 이름 셋을 들고 간다', r.topNames.length, 3);
  재본다('⭐ 이름은 많이 읽힌 순이다', r.topNames[0].perMillion, 20);
  재본다('⛔ 경력 가운데값도 낸다', r.careerMedian, 15);
  재본다('⛔⛔ 못 잡은 흔들림을 「단단하다」로 안 읽는다',
    r.verdict.limitation.replace(/\s+/g, ' '), (s) => /not evidence of stability/.test(s));

  재본다('⭐ 넷 다 내려가면 사다리', 사다리인가([10, 8, 6, 4]).everyStepFalls, true);
  재본다('⛔ 한 칸이 안 내려가면 사다리가 아니다', 사다리인가([10, 8, 9, 4]).everyStepFalls, false);
  재본다('끝 대 끝 배수', 사다리인가([10, 8, 6, 2]).fromTo, 5);

  /* ⭐⭐ 한 사람 수준의 수 — 두 길이 같은 답을 내야 한다 */
  const A = [5, 3, 9, 1, 7]; const B = [2, 8, 4];
  재본다('⭐⭐ 등수 길과 짝세기 길이 같다', 이길확률(A, B), 이길확률_짝세기(A, B));

  /* ⛔ 창이 언제 열려도 같은 수가 나와야 한다 */
  재본다('⛔ 오늘 날짜를 안 쓴다', fs.readFileSync(
    path.join(뿌리, 'scripts', 'build-wikitip-debut-age.mjs'), 'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, ' '), (s) => !/new Date\(\)/.test(s));

  재본다('⭐ 원본이 있다', [fs.existsSync(사람길), fs.existsSync(띠길)], (v) => v.every(Boolean));

  console.log(`데뷔 나이 재는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(사람길, 'utf8'));
  const 띠자료 = JSON.parse(fs.readFileSync(띠길, 'utf8'));
  /* 읽힘은 이미 이어 둔 자료에서 가져온다 — 두 번 잇지 않는다 */
  const 읽힘 = new Map();
  for (const s of 띠자료.signs) for (const p of s.all) if (p.perMillion != null) 읽힘.set(p.name, p.perMillion);

  const 사람들 = 원.사람
    .filter((p) => Number.isInteger(p.ageAtStart) && Number.isInteger(p.startedYear)
      && 읽힘.has(p.name))
    .map((p) => ({
      name: p.name,
      debutAge: p.ageAtStart,
      startedYear: p.startedYear,
      careerYears: 셈한해 - p.startedYear,
      perMillion: 읽힘.get(p.name),
    }));

  const 띠 = 띠들.map((b) => {
    const g = 띠고르기(사람들, b);
    const 붙든것 = g.filter((p) => p.careerYears >= 경력창.부터 && p.careerYears <= 경력창.까지);
    return {
      ...b,
      all: 띠재기(g),
      careerHeld: 띠재기(붙든것),
      _값: g.map((p) => p.perMillion),
    };
  });

  const 위 = 띠[0]; const 아래 = 띠.at(-1);
  const 붙든사다리 = 사다리인가(띠.map((b) => b.careerHeld.median));

  const 자료 = {
    generated: 원.갱신?.slice(0, 10) ?? null,
    source: 'Wikidata (CC0) for the year a career started and the date of birth; '
      + 'Wikimedia Pageviews API for reads',
    window: 띠자료.window,
    countedTo: 셈한해,
    question: 'Korean stars who started before they were 18 are read more today than those who '
      + 'started at 26. Is that about starting young, or about having been around longer?',
    measured: 사람들.length,
    bandsAreOurs: 'The four bands are ours. We cut at 18, 22 and 26 because those splits leave '
      + 'every band with enough people to measure; a different cut would give different medians.',
    /**
     * ⭐⭐ 이 지면의 뼈대 — 가장 뻔한 반론을 먼저 죽인다.
     */
    theObviousObjection: {
      says: 'The obvious objection is that someone who started at ten has simply had longer to '
        + 'collect readers. It does not hold: the median career length is within two years of '
        + 'itself in all four bands.',
      careerMedians: Object.fromEntries(띠.map((b) => [b.key, b.all.careerMedian])),
      thenWhat: `We also held career length inside a window of ${경력창.부터} to ${경력창.까지} `
        + 'years and measured again. The ladder survives, but the two youngest bands come '
        + 'together — so it becomes three steps rather than four.',
      careerWindow: 경력창,
      ladderWithCareerHeld: 붙든사다리,
    },
    ladder: {
      all: 사다리인가(띠.map((b) => b.all.median)),
      careerHeld: 붙든사다리,
    },
    personLevel: {
      value: 이길확률(위._값, 아래._값),
      whatItIs: 'The chance that a randomly chosen star who started before 18 is read more than a '
        + 'randomly chosen star who started at 26 or later, counting ties as half. This is the '
        + 'common-language effect size (McGraw and Wong 1992); it equals the Mann-Whitney U '
        + 'statistic divided by the number of pairs (Mann and Whitney 1947).',
      whatFiftyMeans: 'Fifty per cent would mean the bands say nothing at all about an individual.',
    },
    bands: 띠.map(({ _값, ...b }) => b),
    ...근거([중앙값자, 백만분율자, 하나빼기자, 대조군자], {
      방법: 'Each band is summarised by its median, and then measured again with career length '
        + 'held inside a ten-year window, because the first thing a reader will ask is whether '
        + 'early starters have simply had more time. Beside the medians we report the chance that '
        + 'one person from the youngest band outreads one person from the oldest.',
      한계: 'Debut age and present age are tangled and this data cannot separate them: someone who '
        + 'started at five in 1992 is in their late thirties now, and we cannot tell whether the '
        + 'reading follows when they started or how old they are today. The panel is people whose '
        + 'career start year is recorded on Wikidata, which is not everyone, and a missing start '
        + 'year is more likely for someone less written about. Nothing here says starting young '
        + 'causes anything.',
    }),
    cannotSay: [
      'Not cause. Starting young may bring readers, being the kind of child who gets cast may be '
        + 'the thing that shows up later, or something we have not measured drives both.',
      'Not present age. Debut age and current age move together here and we cannot separate them.',
      'Not everyone. Only stars whose career start year is on Wikidata are in this panel.',
      'Not popularity. Reads count people opening an encyclopaedia article in four languages.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`사람 ${자료.measured}명 (데뷔 해와 읽힘을 둘 다 아는 사람)\n`);
  console.log('띠            n   가운데   경력가운데   경력붙든뒤   이름');
  for (const b of 자료.bands) {
    console.log(`${b.label.padEnd(14)}${String(b.all.measured).padStart(4)}`
      + `${String(b.all.median ?? '⛔').padStart(9)}${String(b.all.careerMedian ?? '—').padStart(12)}`
      + `${String(b.careerHeld.median ?? `⛔ n=${b.careerHeld.measured}`).padStart(13)}   `
      + b.all.topNames.map((x) => x.name).join(', '));
  }
  const L = 자료.ladder;
  console.log(`\n사다리 — 전부 ${L.all.everyStepFalls ? '넷 다 내려간다' : '한 칸이 안 내려간다'}`
    + ` ${L.all.fromTo}배 · 경력 붙든 뒤 `
    + `${L.careerHeld.everyStepFalls ? '넷 다 내려간다' : '한 칸이 안 내려간다'} ${L.careerHeld.fromTo}배`);
  console.log(`⭐ 한 사람 수준 ${(100 * 자료.personLevel.value).toFixed(1)}%`);
  for (const b of 자료.bands) {
    if (b.all.verdict?.swingDetected) {
      console.log(`🔴 띠 ${b.label} 가운데값이 하나빼기에 흔들린다 (${b.all.oneOut.swingOverMedian}배)`);
    }
  }
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
