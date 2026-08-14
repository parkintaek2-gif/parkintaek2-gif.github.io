#!/usr/bin/env node
/**
 * **차트에 오른 한국 배우들의 띠는 고른가.** (`/zodiac` · 전통문화 갈래 첫 글)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   1번이 K사주 첫 편 초안을 넘겼고(사장님 지시), 케이컬쳐는 **데이터를 얹어** 낸다.
 *   영어권이 실제로 묻는 것 중 가장 잦은 것이 「is bazi real」이다.
 *   ⭐ 우리는 그 물음에 **우리 자로** 답할 수 있다 — 우리 명단의 배우들 띠를 세면 된다.
 *
 * ── ⛔ 이 자료가 지키는 것 ───────────────────────────────────
 * ⛔ **한 사람을 판정하지 않는다.** 태어난 시각이 없어 한 사람의 사주는 못 낸다. 분포만 낸다.
 * ⛔ **어느 띠가 낫다고 안 쓴다.** 우리 강령이다. 표는 띠 이름 순으로 낸다 — 크기 순이 아니다.
 * ⛔ 1·2월생은 띠를 안 붙였다. 한국의 해는 **2월 초**에 바뀐다. 틀린 띠를 채우지 않는다.
 * ⚠ 고르다는 결과가 나오면 그대로 낸다. **음성도 결과다.**
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 사람길 = 'archive/raw/wikidata/korean-people.json';
const 결과 = 'src/data/wikitip-zodiac.json';

/** 띠 이름 — **띠 차례대로**. ⛔ 큰 것부터 늘어놓지 않는다(줄세우기가 된다) */
export const 차례 = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

/**
 * 고른지 잰다. 카이제곱 — 12칸이니 자유도 11, 5% 문턱은 19.68.
 * ⛔ 「문턱을 넘었다/못 넘었다」만 내지 않는다. **값도 같이** 낸다.
 */
export const 문턱 = 19.68;
export function 카이제곱(셈, 칸수 = 12) {
  const 값 = Object.values(셈);
  const 총 = 값.reduce((a, b) => a + b, 0);
  if (!총) return null;
  const 기대 = 총 / 칸수;
  return +값.reduce((s, v) => s + ((v - 기대) ** 2) / 기대, 0).toFixed(2);
}

/** 가운데값과 사분위. ⛔ 평균을 안 쓴다 — 한 사람이 끌고 간다 */
export function 사분위(수들) {
  if (!수들.length) return null;
  const s = [...수들].sort((a, b) => a - b);
  const 뽑 = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))];
  return { 아래: 뽑(0.25), 가운데: s[s.length >> 1], 위: 뽑(0.75), 수: s.length };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('차례가 열둘', 차례.length, 12);
  재본다('카이제곱 — 완전히 고르면 0', 카이제곱({ a: 5, b: 5 }, 2), 0);
  재본다('카이제곱 — 쏠리면 커진다', 카이제곱({ a: 10, b: 0 }, 2), 10);
  재본다('카이제곱 — 빈 것은 null(0 이 아니다)', 카이제곱({}, 2), null);
  재본다('사분위', 사분위([1, 2, 3, 4, 5]), { 아래: 2, 가운데: 3, 위: 4, 수: 5 });
  재본다('사분위 — 빈 것', 사분위([]), null);
  /* ⛔ 표를 크기 순으로 내면 줄세우기가 된다 — 차례가 띠 순인지 본다 */
  재본다('차례가 띠 순이다', 차례[0] === 'Rat' && 차례[11] === 'Pig', true);
  console.log(`띠 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(사람길)) { console.error(`⛔ 없다 — ${사람길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(사람길, 'utf8'));

  const 셈 = Object.fromEntries(차례.map((z) => [z, 0]));
  for (const p of d.사람) if (p.zodiac && 셈[p.zodiac] !== undefined) 셈[p.zodiac] += 1;
  const 총 = Object.values(셈).reduce((a, b) => a + b, 0);
  const 기대 = +(총 / 12).toFixed(1);
  const 카 = 카이제곱(셈);

  const 나이 = 사분위(d.사람.filter((p) => p.ageAtStart).map((p) => p.ageAtStart));

  /* 🔴 이 자료의 뼈대 — 고른지 아닌지가 뒤집히면 기사를 다시 써야 한다 */
  const 고른가 = 카 < 문턱;

  const out = {
    generated: 지금(),
    source: 'Wikidata public profiles for the Korean actors already keyed in our Netflix cast panel',
    question: 'Does the year someone was born pick out who ends up on a Netflix chart?',
    unit: 'People. One row is one actor, counted once.',
    peopleKeyed: d.사람수,
    withBirthDate: d.태어난날있음,
    withZodiac: 총,
    expectedPerSign: 기대,
    chiSquare: 카,
    chiSquareThreshold: 문턱,
    /** ⚠ 참이면 「볼 것이 없다」는 뜻이다. 그것도 결과다 */
    indistinguishableFromChance: 고른가,
    /** ⛔ 띠 차례대로. 크기 순이 아니다 */
    counts: 차례.map((z) => ({ sign: z, people: 셈[z], sharePc: +((100 * 셈[z]) / 총).toFixed(1) })),
    debutAge: 나이 ? {
      people: 나이.수, median: 나이.가운데, lowerQuartile: 나이.아래, upperQuartile: 나이.위,
    } : null,
    whyJanFebExcluded: 'The Korean year turns in early February, not on 1 January, so anyone born '
      + 'in January or February may belong to the previous animal. Those people are left without a '
      + 'sign rather than given the wrong one.',
    whyNoIndividualReading: 'A full saju needs the hour of birth. Public profiles carry dates and '
      + 'almost never hours, so we can count how a thousand actors are distributed and we cannot '
      + 'produce any one of their charts.',
    cannotAnswer: 'A flat distribution says the birth year does not select who reaches a chart. It '
      + 'says nothing about what a reading means to the person who has one, which is not a thing a '
      + 'count can reach.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`띠 붙은 사람 ${총}명 · 한 띠에 ${기대}명 기대 · 카이제곱 ${카} (문턱 ${문턱})`);
  console.log(고른가 ? '⭐ 고르다 — 우연과 구별되지 않는다' : '🔴 안 고르다 — 기사를 다시 봐야 한다');
  console.log(`데뷔 나이 ${나이.수}명 · 가운데 ${나이.가운데}세 · ${나이.아래}~${나이.위}세`);
}
