#!/usr/bin/env node
/**
 * **AI 상투어를 잡는 자** — 사장님 지시(8/13) 「AI 상투어 절대 사용 금지」를 영문에 옮긴 것.
 *
 * ── 사장님이 금하신 한국어 목록 ──────────────────────────────
 *   결론적으로 · 요약하자면 · 살펴보았습니다 · ~라 할 수 있습니다 · 시사하는 바가 크다
 *   기대가 모아집니다 · 눈길을 끕니다 · 관심이 쏠립니다 · 주목받고 있다
 *
 * ── 옮긴 뜻 ──────────────────────────────────────────────────
 *   금하신 아홉은 **두 갈래**다. 그 갈래를 영문에 옮긴다. 낱말을 직역하지 않는다.
 *   ⓐ 기계적인 맺음말 — 「결론적으로」·「요약하자면」·「살펴보았습니다」
 *   ⓑ 값을 안 대고 값이 있다고 말하기 — 「주목받고 있다」·「시사하는 바가 크다」
 *      🔴 이것이 우리에게 더 위험하다. **수를 안 대고 크다고 말하는 것**이기 때문이다.
 *
 * ⛔ 이 자는 **줄이기만 하는 수**다. 늘리면 막는다.
 * ⚠ 인용문 안은 손대지 않는다. 남이 한 말은 남의 말투다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 글방 = 'content/kculturewire';
const 기준선 = 0;        /* 🔴 지금 몇인지 재고 나서 정한다. 늘리는 수는 막는다 */

/** ⓐ 기계적인 맺음말 — 기사가 스스로를 요약한다 */
export const 맺음말 = [
  'in conclusion', 'to summarise', 'to summarize', 'in summary', 'to sum up',
  'as we have seen', 'as we saw above', 'in this article we', 'we have explored',
  'let us delve', "let's delve", 'delve into', 'it is important to note',
  "it's important to note", 'it is worth noting', "it's worth noting",
];

/** ⓑ 값을 안 대고 값이 있다고 말하기 — 🔴 데이터 매체에 제일 나쁘다 */
export const 값없는칭찬 = [
  'is drawing attention', 'has drawn attention', 'is attracting attention',
  'is gaining traction', 'has been gaining traction', 'is turning heads',
  'speaks volumes', 'is a testament to', 'a testament to',
  'underscores the importance', 'highlights the importance',
  'sheds light on', 'paints a picture', 'paints a vivid picture',
  'it remains to be seen', 'only time will tell',
  'the numbers speak for themselves', 'game-changer', 'game changer',
  'a deep dive into', 'unpack the', 'at the end of the day',
];

export const 모든상투어 = [...맺음말, ...값없는칭찬];

/**
 * ⚠ 인용문(" … " 또는 ' … ') 안은 지운다 — 남이 한 말은 우리 말투가 아니다.
 *   코드 덩이(``` … ```)도 지운다.
 */
export function 우리말만(글) {
  return 글
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^---[\s\S]*?^---/m, ' ')       /* 앞말은 뺀다 — 제목·부제는 따로 본다 */
    .replace(/"[^"\n]{0,400}"/g, ' ')
    .replace(/“[^”\n]{0,400}”/g, ' ');
}

/** 낱말 경계로 찾는다 — `a testament to` 가 `testament` 를 겹쳐 세지 않게 긴 것부터 */
export function 찾기(글) {
  const 몸 = 우리말만(글).toLowerCase();
  const 찾은 = [];
  const 덮인 = [];
  for (const 말 of [...모든상투어].sort((a, b) => b.length - a.length)) {
    let 자리 = 몸.indexOf(말);
    while (자리 !== -1) {
      const 끝 = 자리 + 말.length;
      const 앞OK = 자리 === 0 || !/[a-z]/.test(몸[자리 - 1]);
      const 뒤OK = 끝 >= 몸.length || !/[a-z]/.test(몸[끝]);
      const 겹침 = 덮인.some(([a, b]) => 자리 < b && 끝 > a);
      if (앞OK && 뒤OK && !겹침) { 찾은.push(말); 덮인.push([자리, 끝]); }
      자리 = 몸.indexOf(말, 자리 + 1);
    }
  }
  return 찾은;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('깨끗한 글은 0', 찾기('Seventy-five titles charted in 93 countries.'), []);
  재본다('맺음말을 잡는다', 찾기('In conclusion, the number rose.'), ['in conclusion']);
  재본다('값 없는 칭찬을 잡는다', 찾기('The series is drawing attention.'), ['is drawing attention']);
  재본다('⚠ 인용문 안은 안 잡는다',
    찾기('Netflix said "it is worth noting that the show grew".'), []);
  재본다('⚠ 코드 덩이 안은 안 잡는다', 찾기('```\nin conclusion\n```'), []);
  재본다('낱말 한가운데는 안 잡는다', 찾기('Undelve intoxicated'), []);
  재본다('겹치는 것을 두 번 안 센다', 찾기('It is a testament to the format.'), ['is a testament to']);
  재본다('여럿을 다 센다',
    찾기('Only time will tell. In summary, it sheds light on this.').sort(),
    ['in summary', 'only time will tell', 'sheds light on']);
  재본다('큰 글자·작은 글자를 같이 본다', 찾기('IN CONCLUSION, yes.'), ['in conclusion']);
  재본다('목록에 겹치는 말이 없다', 모든상투어.length, new Set(모든상투어).size);
  console.log(`상투어 잡는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 글들 = fs.readdirSync(글방).filter((f) => f.endsWith('.md'));
  const 걸린것 = [];
  const 셈 = new Map();
  for (const f of 글들) {
    const 찾은 = 찾기(fs.readFileSync(path.join(글방, f), 'utf8'));
    if (!찾은.length) continue;
    걸린것.push({ 글: f, 말: 찾은 });
    for (const w of 찾은) 셈.set(w, (셈.get(w) ?? 0) + 1);
  }
  const 총 = [...셈.values()].reduce((a, b) => a + b, 0);
  console.log(`기사 ${글들.length}편 · 상투어 ${총}개 · 걸린 기사 ${걸린것.length}편 (기준선 ${기준선})`);
  for (const x of 걸린것) console.log(`   ${x.글}\n      ${x.말.join(' · ')}`);
  if (총 > 기준선) {
    console.error(`\n⛔ 기준선 ${기준선} 보다 ${총 - 기준선} 많다. 늘리는 수는 막는다.`);
    process.exit(1);
  }
  console.log('✅ 상투어 없음');
}
