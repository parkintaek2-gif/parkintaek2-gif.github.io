#!/usr/bin/env node
/**
 * quiz-to-onedrive.mjs — **그날 낸 퀴즈를 OneDrive 에 올린다.**
 *
 * 🔴 사장님(2026-08-09 00:2x)
 *   *「퀴즈낸 것은 따로 원드라이브에만 올려놔라. 파일명: 퀴즈」*
 *   *「그날치것만. 매일 올려」*
 *
 * ⛔ 저장소에 두지 않는다. **OneDrive 한 곳에만** 둔다.
 * ⛔ 그날치만 담는다 — 어제 것을 다시 안 담는다.
 *
 * 쓰는 법
 *   node scripts/quiz-to-onedrive.mjs --오늘 2026-08-09
 *   node scripts/quiz-to-onedrive.mjs --selftest
 *
 * ⚠ 날짜는 밖에서 넘긴다. 자가 시계를 보면 자정 근처에서 혼자 날이 바뀐다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { 모든문제, 문제뽑기 } from './achim-quiz.mjs';

export const 낼곳 = 'C:/Users/USER/OneDrive';
export const 자리이름 = {
  '2': '조율·경영', '3': '백년지도', '5': 'K Culture Wire', '6': 'SeoulMarkets',
  '1': 'KLifeMap', '4': '일본(KLifeMap 보조)', '7': '감수(KLifeMap 보조)', '8': '자료 검증(백년지도 보조)',
};

/** 파일 이름 — 사장님이 「퀴즈」라 하셨다. 날짜를 붙여 그날치를 남긴다 */
export const 파일이름 = (오늘) => `퀴즈_${String(오늘 ?? '').replace(/-/g, '').slice(4)}.md`;

/** 그날 낸 퀴즈를 글로 만든다. ⛔ 한 물음은 한 번만 싣는다(공통이 여덟 번 나오면 안 된다) */
export function 글만들기(오늘, 문제들 = 모든문제) {
  const 줄 = [
    `# 퀴즈 — ${오늘}`,
    '',
    '> 🔴 사장님 지시 — 「강령과 상시 지시를 읽고 시작하게 해. 아예 **퀴즈를 풀게 해.**',
    '>   다 풀면 그때 그날 일을 시작할 수 있게 해」',
    '> ⛔ 틀리면 **답을 알려 주지 않는다.** 볼 곳만 알려 주고 맞출 때까지 다시 풀게 한다.',
    '',
    '```',
    '문제   node scripts/achim-quiz.mjs --자리 N --오늘 ' + 오늘,
    '제출   node scripts/achim-quiz.mjs --자리 N --오늘 ' + 오늘 + ' --답 3,2,…',
    '```',
    '',
    '| 자리 | 문제 수 |',
    '|---|---:|',
    ...Object.keys(자리이름).map((n) => `| ${n}번 ${자리이름[n]} | ${문제뽑기(n, 문제들).length}문제 |`),
    '',
    '---',
    '',
  ];

  const 이미 = new Set();
  for (const n of Object.keys(자리이름)) {
    const 것 = 문제뽑기(n, 문제들).filter((q) => !이미.has(q.물음));
    if (!것.length) continue;
    줄.push(`## ${것[0].자리 === '*' ? '모든 자리 공통' : `${n}번 · ${자리이름[n]}`}`, '');
    for (const q of 것) {
      이미.add(q.물음);
      줄.push(`**${q.물음}**`, '');
      q.보기.forEach((b, i) => 줄.push(`  ${i + 1}) ${b}`));
      줄.push('', `> 정답 **${q.답}** — ${q.왜}`, '');
    }
    줄.push('---', '');
  }
  return 줄.join('\n');
}

/* ── 검사 ── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 100)}`); }
  };
  const 본 = [
    { 자리: '3', 물음: 'ㄱ', 보기: ['a', 'b', 'c', 'd'], 답: 2, 왜: '까닭ㄱ' },
    { 자리: '*', 물음: 'ㄷ', 보기: ['a', 'b', 'c', 'd'], 답: 1, 왜: '까닭ㄷ' },
  ];
  const 글 = 글만들기('2026-08-09', 본);
  재본다('날짜가 제목에 있다', 글.includes('# 퀴즈 — 2026-08-09'), true);
  재본다('공통 물음은 한 번만 실린다', (글.match(/\*\*ㄷ\*\*/g) ?? []).length, 1);
  재본다('자리 물음도 실린다', 글.includes('**ㄱ**'), true);
  재본다('정답과 까닭이 실린다', 글.includes('정답 **2** — 까닭ㄱ'), true);
  재본다('파일 이름은 퀴즈_MMDD', 파일이름('2026-08-09'), '퀴즈_0809.md');
  재본다('빈 날짜에 안 죽는다', typeof 파일이름(null), 'string');
  재본다('진짜 문제로도 글이 나온다', 글만들기('2026-08-09').includes('모든 자리 공통'), true);
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
const argv = process.argv.slice(2);
const i = argv.indexOf('--오늘');
const 오늘 = i >= 0 ? String(argv[i + 1] ?? '').trim() : '';
if (!오늘) { console.error('⛔ 쓰는 법: node scripts/quiz-to-onedrive.mjs --오늘 2026-08-09'); process.exit(2); }

const 길 = path.join(낼곳, 파일이름(오늘));
fs.writeFileSync(길, 글만들기(오늘), 'utf8');
console.log(`✅ ${길}  ·  문제 ${모든문제.length}개`);
