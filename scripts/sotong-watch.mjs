#!/usr/bin/env node
/**
 * sotong-watch.mjs — **자리가 제때 말했는지 잰다.**
 *
 * 🔴 사장님(2026-08-14): 「**왜 제때 소통 안 하지? 1시간에 한 번~두 번 소통하라고 했지**」
 *
 * ⛔ 주기는 오래전에 정해 놨다. 그런데 **지키는지 아무도 재지 않았다.**
 *    자리 지킴이(seat-watchdog)는 「창이 살아 있나」만 본다. 「말을 했나」는 안 본다.
 *    그래서 조용해도 아무 일도 일어나지 않았다. 그것이 오늘 아침의 원인이다.
 *
 * 쓰는 법  node scripts/sotong-watch.mjs        /  --selftest
 */
import fs from 'node:fs';
import path from 'node:path';

export const 늦음분 = 60; // 한 시간에 한 번은 말해야 한다

/** 「[진행] 8번 10:57」 · 「3번 11:5x —」 · 「[진도] 8번 16:56」 에서 자리와 시각을 뽑는다 */
/* ⚠ [아는 구멍 · 2026-08-14] 「N번」 바로 뒤에 시각이 와야 읽는다.
   「[보고] 1번 아침보고 2026-08-14 10:00」 처럼 사이에 글자가 끼면 **못 읽는다.**
   ⛔ 넓혀 보려다 6번·7번을 도리어 놓쳤다(2026-08-14 14:0x). 그래서 **되돌렸다.**
   ⭐ 그러니 이 자가 「오늘 말 없음」이라 해도 **정말 조용한지 눈으로 한 번 더 본다.**
      자리에는 `[진행] N번 HH:MM` 꼴로 적으라고 했다. 그 꼴이면 정확하다. */
export function 줄읽기(줄) {
  const m = /(?:\[(?:진행|진도|보고|요청)\]\s*)?([1-8])번\s+(\d{1,2}):(\d{2}|\d[xX])/.exec(줄 || '');
  if (!m) return null;
  const 분 = /^\d\d$/.test(m[3]) ? Number(m[3]) : Number(m[3][0]) * 10;
  return { 자리: Number(m[1]), 시: Number(m[2]), 분 };
}

/**
 * 늦었나.
 * 🔴 [고침 1] 처음엔 음수를 그냥 통과시켰다 — 어제 23:56 을 오늘 것으로 읽고
 *    「-693분 전」이라면서 ✅ 를 줬다. **지금보다 늦은 시각은 오늘 말한 것이 아니다.**
 */
export function 늦었나(마지막분, 지금분) {
  if (마지막분 == null) return true;
  if (마지막분 > 지금분) return true;
  return (지금분 - 마지막분) > 늦음분;
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [줄읽기('[진행] 8번 10:57'), { 자리: 8, 시: 10, 분: 57 }, '[진행] 줄을 읽는다'],
    [줄읽기('3번 11:5x — 대표메일 고침'), { 자리: 3, 시: 11, 분: 50 }, '11:5x 는 11:50 으로 읽는다'],
    [줄읽기('[진도] 8번 16:56  개봉 준비 65%'), { 자리: 8, 시: 16, 분: 56 }, '[진도] 줄을 읽는다'],
    [줄읽기('아무 말도 아니다'), null, '아닌 줄은 안 읽는다'],
    [늦었나(null, 660), true, '한 번도 말 안 했으면 늦은 것이다'],
    [늦었나(600, 660), false, '한 시간 딱이면 아직 늦지 않았다'],
    [늦었나(599, 660), true, '한 시간을 넘기면 늦은 것이다'],
    [늦었나(1436, 660), true, '⛔ 지금보다 늦은 시각은 어제 것이다 — 말 안 한 것으로 센다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) {
      console.error(`❌ ${이름}  — 잰 것 ${JSON.stringify(잰것)}`);
      틀림++;
    }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 소통 자 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

const 볼곳 = [
  'docs/세션간-메모.md',
  path.join('C:/Users/USER/Documents/GitHub/klifemap', 'docs/세션간-메모.md'),
];

/* 🔴 [고침 2] 처음엔 **가장 큰 시각**을 골랐다. 그래서 어제 23:56 이 오늘 11:00 을 이겼다.
   메모는 뒤에 붙여 쓰는 글이므로 **파일에서 마지막에 나온 줄**이 가장 최근이다. */
const 마지막 = {}; // 자리 → 분
for (const 곳 of 볼곳) {
  let 글;
  try { 글 = fs.readFileSync(곳, 'utf8'); } catch { continue; }
  const 이곳 = {};
  for (const 줄 of 글.split('\n')) {
    const r = 줄읽기(줄);
    if (r) 이곳[r.자리] = r.시 * 60 + r.분; // 뒤에 나온 것이 이긴다
  }
  for (const [자리, 분] of Object.entries(이곳)) {
    if (마지막[자리] == null || 분 > 마지막[자리]) 마지막[자리] = 분;
  }
}

const 이제 = new Date();
const 지금분 = 이제.getHours() * 60 + 이제.getMinutes();
const 꼴 = (분) => `${String(Math.floor(분 / 60)).padStart(2, '0')}:${String(분 % 60).padStart(2, '0')}`;

console.log(`\n지금 ${꼴(지금분)} — 자리별 마지막 말\n`);
let 늦은자리 = 0;
for (const 자리 of [1, 3, 4, 5, 6, 7, 8]) {
  const m = 마지막[자리];
  const 늦음 = 늦었나(m, 지금분);
  if (늦음) 늦은자리++;
  const 오늘것 = m != null && m <= 지금분;
  console.log(`  ${늦음 ? '🔴' : '✅'} ${자리}번   ${오늘것 ? 꼴(m) : '오늘 말 없음'}   ${오늘것 ? `${지금분 - m}분 전` : '—'}`);
}
console.log(`\n한 시간 넘게 조용한 자리 — ${늦은자리}곳`);
if (늦은자리) console.log('⛔ 2번은 이 자리들을 깨워 말을 받아 냅니다.');
process.exit(늦은자리 ? 2 : 0);
