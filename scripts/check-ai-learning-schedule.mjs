#!/usr/bin/env node
/**
 * check-ai-learning-schedule.mjs — **AI 자료판독 예약이 실제로 걸려 있나**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 왜 있나 (2026-09-25 · 사장님)
 *   「**투자AI 폴더를 읽고 어떻게 해야 할 지 방법을 강구해**」
 *
 * [겪은 것] 투자 AI 판독은 6번 세션의 크론으로 돌고 있었다. 그 자리가 없어지자 크론도
 *   함께 사라졌고 **2026-09-15 부터 9일 동안 아무도 모른 채 멈춰 있었다.**
 *   그래서 윈도 작업 스케줄러로 옮겼는데, **그 예약은 git 밖(이 PC 안)에 있다** —
 *   누가 끄거나 이름을 바꾸거나 PC 를 갈면 조용히 사라진다.
 *
 * ⛔ 「예약을 걸었다」를 「돈다」로 세지 않는다. **기계가 실제 등록값을 읽어 잰다.**
 *
 * [2026-09-25 에 이름을 바꿨다]
 *   옛 이름 `SeoulMarkets-자체AI-학습` → 새 이름 `SeoulMarkets-AI자료판독`.
 *   사장님이 짚으셨다 — 「**이름과 하는 일이 다르다**」. 모델을 훈련시키지 않는다.
 *   옛것은 **지우지 않고 껐다**(Disabled). 되돌릴 수 있게 남긴 것이다.
 *
 * 쓰는 법
 *   node scripts/check-ai-learning-schedule.mjs
 *   node scripts/check-ai-learning-schedule.mjs --자가시험
 */
import { execFileSync } from 'node:child_process';

export const 예약이름 = 'SeoulMarkets-AI자료판독';
export const 옛이름 = 'SeoulMarkets-자체AI-학습';

/** 스케줄러가 내놓은 글에서 이 예약의 상태를 읽는다 */
export function 상태읽기(글, 이름) {
  for (const 줄 of String(글 ?? '').split(/\r?\n/)) {
    const [n, s] = 줄.split('\t');
    if ((n ?? '').trim() === 이름) return (s ?? '').trim();
  }
  return null;
}

/** 반복 설정이 「매시 · 열네 시간」인가 — 07:10~21:10 이 그것이다 */
export function 매시열네시간인가(간격, 기간) {
  return String(간격).trim() === 'PT1H' && String(기간).trim() === 'PT14H';
}

/* ⛔ [2026-09-25] PowerShell 은 기본으로 **CP949** 로 내놓는다. node 가 그것을 UTF-8 로
   읽으면 한글 예약 이름이 깨져 «없다»로 판정된다 — 실제로 여기서 한 번 틀렸다.
   그러면 멀쩡한 예약을 「사라졌다」고 보고하게 된다. 출력 인코딩을 못박는다. */
const UTF8로 = '[Console]::OutputEncoding=[Text.Encoding]::UTF8; ';

function 물어보기() {
  const ps = UTF8로 + 'Get-ScheduledTask | Where-Object { $_.TaskName -like "SeoulMarkets-*" } | '
    + 'ForEach-Object { $_.TaskName + [char]9 + $_.State }';
  const 표 = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  const ps2 = UTF8로 + `$t = Get-ScheduledTask -TaskName "${예약이름}"; `
    + '$t.Triggers[0].Repetition.Interval + [char]9 + $t.Triggers[0].Repetition.Duration + [char]9 + '
    + '($t.Actions | ForEach-Object { $_.Execute })';
  let 반복 = '';
  try { 반복 = execFileSync('powershell', ['-NoProfile', '-Command', ps2], { encoding: 'utf8' }); }
  catch { 반복 = ''; }
  return { 표, 반복 };
}

const 직접돌리나 = process.argv[1] && process.argv[1].endsWith('check-ai-learning-schedule.mjs');

if (직접돌리나 && process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);
  const 보기 = `${예약이름}\tReady\n${옛이름}\tDisabled\nSeoulMarkets-중부매일스포츠-거두기\tReady`;

  본다('새 이름의 상태를 읽는다', 상태읽기(보기, 예약이름) === 'Ready');
  본다('옛 이름의 상태를 읽는다', 상태읽기(보기, 옛이름) === 'Disabled');
  본다('없는 이름은 null 이다 — 짐작으로 Ready 를 내지 않는다', 상태읽기(보기, '없는것') === null);
  본다('빈 글에도 터지지 않는다', 상태읽기('', 예약이름) === null && 상태읽기(null, 예약이름) === null);
  본다('🔴 매시·열네 시간을 가른다', 매시열네시간인가('PT1H', 'PT14H'));
  본다('⛔ 간격이 다르면 떨어진다 — 하루 한 번으로 줄어든 것을 못 보고 넘기지 않는다',
    !매시열네시간인가('PT1D', 'PT14H') && !매시열네시간인가('PT1H', 'PT2H'));
  /* ⛔ 옛 이름으로 되돌아가면 사장님이 짚으신 것이 되살아난다 */
  본다('🔴 옛 이름과 새 이름이 다르다', 예약이름 !== 옛이름 && !예약이름.includes('학습'));

  const 떨 = 잰다.filter(([, v]) => !v);
  for (const [이, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이}`);
  console.log(떨.length ? `\n🔴 ${떨.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(떨.length ? 1 : 0);
}

if (직접돌리나) {
  const { 표, 반복 } = 물어보기();
  const 새것 = 상태읽기(표, 예약이름);
  const 옛것 = 상태읽기(표, 옛이름);
  const [간격 = '', 기간 = '', 부르는것 = ''] = String(반복).trim().split('\t');

  const 흠 = [];
  console.log('■ AI 자료판독 예약 — 실제 등록값을 읽어 잰다');
  console.log(`   ${예약이름}   ${새것 ?? '⛔ 없다'}`);
  console.log(`   반복                        ${간격 || '(못 읽었다)'} / ${기간 || '(못 읽었다)'}`);
  console.log(`   부르는 것                    ${부르는것 || '(못 읽었다)'}`);
  console.log(`   ${옛이름}  ${옛것 ?? '(없다)'}`);

  if (새것 !== 'Ready') 흠.push(`${예약이름} 이 Ready 가 아니다 — AI 가 자료를 안 읽는다`);
  if (!매시열네시간인가(간격, 기간)) 흠.push(`반복이 매시·열네 시간이 아니다 (${간격}/${기간})`);
  if (!/run-ai-learning\.cmd$/i.test(부르는것)) 흠.push('부르는 것이 run-ai-learning.cmd 가 아니다');
  if (옛것 === 'Ready') 흠.push(`${옛이름} 이 다시 켜져 있다 — 둘이 같이 돌면 로그가 섞인다`);

  console.log('');
  if (흠.length) { for (const h of 흠) console.log(`🔴 ${h}`); process.exit(1); }
  console.log('✅ 예약이 제대로 걸려 있다');
}
