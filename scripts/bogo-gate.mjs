#!/usr/bin/env node
/**
 * bogo-gate.mjs — **몇 시간에 한 번 보고하지 않으면 일을 못 하게 막는다.**
 *
 * 🔴 사장님(2026-08-15 00:0x): 「**늘 보고 받아. 몇 시간에 한 번씩 모든 유닛에게
 *                              너한테 보고하게 해. 강제 장치를 만들어**」
 *
 * ⛔ 왜 「강제」인가 — 말로 된 주기는 **오늘 하루 종일 안 지켜졌습니다.**
 *    · 13:00 진도율 — 일곱 자리 중 하나만 냈다
 *    · 16:00 진도율 — 둘만 냈다
 *    · 1번은 21:0x 이후 세 시간 조용했다
 *    말로 적은 규칙은 잊힌다. 그래서 **막는 자**로 만든다.
 *
 * ⭐ 이 자는 「보고했나」가 아니라 **「무엇을 냈나」**를 본다.
 *    오늘 6번이 하루 종일 움직였지만 기사는 0편이었다. 움직임은 성과가 아니다.
 *
 * 쓰는 법
 *   node scripts/bogo-gate.mjs            지금 누가 늦었나
 *   node scripts/bogo-gate.mjs --막기      늦은 자리가 있으면 종료코드 2 (배포·커밋 전에 부른다)
 *   node scripts/bogo-gate.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';

export const 주기시간 = 3; // 세 시간에 한 번은 보고한다

/** 보고 한 줄에서 자리·시각·낸것을 뽑는다 — 「[보고] 6번 03:00 낸것 2」 */
export function 보고읽기(줄) {
  const m = /\[보고\]\s*([1-8])번\s+(\d{1,2}):(\d{2})\s+낸것\s+(\d+)/.exec(줄 || '');
  if (!m) return null;
  return { 자리: Number(m[1]), 분: Number(m[2]) * 60 + Number(m[3]), 낸것: Number(m[4]) };
}

/** 늦었나 — 안 했거나 주기를 넘겼으면 늦은 것 */
export function 늦었나(마지막분, 지금분) {
  if (마지막분 == null) return true;
  if (마지막분 > 지금분) return true; // 어제 것이다
  return 지금분 - 마지막분 > 주기시간 * 60;
}

/** 🔴 낸 것이 0이면 보고를 했어도 빨간불이다 */
export function 빈손인가(줄) {
  return !줄 || 줄.낸것 === 0;
}

/**
 * 🔴 메모 확인 — 사장님(8/15): 「**1시간에 한 번씩 자기한테 온 메모가 있는지 확인하는 것도
 *                             강제적인 조치에 포함**」
 *
 * ⛔ 오늘 실제로 있었던 일 — 2번이 메모에 걸어 둔 것을 자리들이 안 읽어 늦게 움직였다.
 *    4번은 15:00 약속을 **3시간 반** 늦게 답했고, 그 까닭이 「16:16 에 2번 독촉을 보고서야」였다.
 *
 * ⭐ 「읽었다」를 말로 받지 않는다. **마지막 읽은 커밋**을 적게 하고,
 *    그 뒤에 붙은 줄 중 자기 번호가 든 것을 센다.
 */
export function 안읽은줄세기(붙은줄들, 자리) {
  if (!Array.isArray(붙은줄들)) return 0;
  const 나 = `${자리}번`;
  return 붙은줄들.filter((l) => l.startsWith('+') && !l.startsWith('+++') && l.includes(나)).length;
}

/** 읽은 지 한 시간이 넘었나 */
export function 읽기늦었나(읽은분, 지금분) {
  if (읽은분 == null) return true;
  if (읽은분 > 지금분) return true;
  return 지금분 - 읽은분 > 60;
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [보고읽기('[보고] 6번 03:00 낸것 2'), { 자리: 6, 분: 180, 낸것: 2 }, '보고 줄을 읽는다'],
    [보고읽기('[보고] 6번 03:00 낸것 0'), { 자리: 6, 분: 180, 낸것: 0 }, '0 도 읽는다'],
    [보고읽기('[진행] 6번 03:00 했다: …'), null, '⛔ [진행] 은 보고가 아니다'],
    [보고읽기('[보고] 6번 03:00 열심히 했습니다'), null, '⛔ 「낸것 N」이 없으면 보고가 아니다'],
    [늦었나(null, 600), true, '한 번도 안 했으면 늦은 것'],
    [늦었나(600, 780), false, '세 시간 딱이면 아직'],
    [늦었나(600, 781), true, '세 시간을 넘기면 늦은 것'],
    [늦었나(1400, 600), true, '⛔ 지금보다 늦은 시각은 어제 것 — 안 한 것으로 센다'],
    [빈손인가({ 낸것: 0 }), true, '⭐ 보고했어도 낸 것이 0 이면 빨간불'],
    [빈손인가({ 낸것: 1 }), false, '하나라도 냈으면 통과'],
    [안읽은줄세기(['+ [2번 → 4번] 성명학 답 주십시오', '+ 딴 이야기'], 4),
      1, '⭐ 내 번호가 든 새 줄을 센다'],
    [안읽은줄세기(['+++ b/docs/세션간-메모.md', '+ 4번 어쩌고'], 4),
      1, '⛔ +++ 머리줄은 안 센다 — 파일 이름에 걸려 헛세면 안 된다'],
    [안읽은줄세기(['- [2번 → 4번] 지운 줄'], 4), 0, '지운 줄(-)은 안 센다'],
    [안읽은줄세기([], 4), 0, '붙은 것이 없으면 0'],
    [읽기늦었나(null, 600), true, '한 번도 안 읽었으면 늦은 것'],
    [읽기늦었나(540, 600), false, '한 시간 딱이면 아직'],
    [읽기늦었나(539, 600), true, '한 시간을 넘기면 늦은 것'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) {
      console.error(`❌ ${이름}  — 잰 것 ${JSON.stringify(잰것)}`);
      틀림++;
    }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 보고 관문 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

const 볼곳 = [
  'docs/세션간-메모.md',
  path.join('C:/Users/USER/Documents/GitHub/klifemap', 'docs/세션간-메모.md'),
];

const 마지막 = {};
for (const 곳 of 볼곳) {
  let 글;
  try { 글 = fs.readFileSync(곳, 'utf8'); } catch { continue; }
  for (const 줄 of 글.split('\n')) {
    const r = 보고읽기(줄);
    if (r) 마지막[r.자리] = r; // 뒤에 나온 것이 이긴다
  }
}

const 이제 = new Date();
const 지금분 = 이제.getHours() * 60 + 이제.getMinutes();
const 꼴 = (분) => `${String(Math.floor(분 / 60)).padStart(2, '0')}:${String(분 % 60).padStart(2, '0')}`;

console.log(`\n지금 ${꼴(지금분)} — 보고 관문 (${주기시간}시간에 한 번)\n`);
let 늦음 = 0, 빈손 = 0;
for (const 자리 of [1, 3, 4, 5, 6, 7, 8]) {
  const r = 마지막[자리];
  const 오늘것 = r && r.분 <= 지금분;
  const late = 늦었나(오늘것 ? r.분 : null, 지금분);
  const empty = 오늘것 && !late && 빈손인가(r);
  if (late) 늦음++;
  if (empty) 빈손++;
  const 표 = late ? '🔴 늦음' : empty ? '🟡 빈손' : '✅';
  console.log(`  ${표}  ${자리}번   ${오늘것 ? 꼴(r.분) : '오늘 보고 없음'}   ${오늘것 ? `낸것 ${r.낸것}` : '—'}`);
}

console.log(`\n늦은 자리 ${늦음}곳 · 보고는 했으나 **낸 것이 0** 인 자리 ${빈손}곳`);
if (늦음 || 빈손) {
  console.log('\n⛔ 보고 꼴 —  `[보고] N번 HH:MM 낸것 M  ·  스스로 낸 것: … (촉발: 나/사장님/2번)`');
  console.log('⛔ 「낸것」은 **손님에게 나간 것**입니다. 도구·진단·회의는 0 입니다.');
  console.log('⭐ 움직인 것과 낸 것은 다릅니다 — 8/14 에 6번이 종일 움직이고 기사 0편이었습니다.');
}
process.exit((process.argv.includes('--막기') && (늦음 || 빈손)) ? 2 : 0);
