#!/usr/bin/env node
/**
 * write-seat-entries.mjs — 여섯 자리의 «세션입구» .cmd 를 하나의 본에서 찍어 낸다.
 *
 *   node tools/write-seat-entries.mjs            무엇이 달라지나만 보여 준다
 *   node tools/write-seat-entries.mjs --쓴다      실제로 쓴다 (옛 것은 _옛것/ 으로 옮긴다)
 *   node tools/write-seat-entries.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-10 · 사장님) ───────────────────────────────────
 *
 * 사장님: 「**3, 4, 6번이 no conversation**」 · 「**그리고 바로 닫힘**」
 * 사장님: 「세션입구를 정확히 해서, **다시 열면 바로 이어서 업무를 할 수 있게** 해줘, 제발」
 *        「**이런 일 있을 때마다 가슴이 철렁 내려앉는다, 놀래서**」
 *
 * 입구 여섯 장을 손으로 고치다가 다섯 장만 고치면 다시 같은 사고가 난다.
 * ⇒ **본을 하나만 두고 여섯 장을 찍는다.** 자리마다 다른 것은 표 한 줄뿐이다.
 *
 * ── 옛 입구가 왜 창을 닫았나 (실측) ──────────────────────────────────────
 * ```
 * claude --resume <없는 ID>   →  「no conversation」만 찍고 **종료코드 0**
 * .cmd 의 `if not errorlevel 1 goto done`  →  0 을 «성공»으로 읽고 :done 으로 뛴다
 * :done 뒤에 아무것도 없다                  →  **창이 그대로 닫힌다**
 * ```
 * 새 입구는 셋을 바꾼다 —
 * ```
 * 1. ID 를 «대장에서 읽지 않고» seat-resume-check.mjs 가 디스크를 훑어 찾는다 (낡지 않는다)
 * 2. 살아 있는 ID 가 없으면 애초에 --resume 을 «부르지 않는다» (새 대화로 간다)
 * 3. 🔴 어느 길로 가도 마지막에 pause 가 있다 — **창이 말없이 닫히는 길이 없다**
 * ```
 *
 * ⚠ ASCII 만 쓴다. cmd.exe 는 .cmd 를 시스템 코드페이지로 읽어서 한글 주석이 깨지고,
 *   깨진 바이트를 «명령»으로 파싱한다. BOM 이 붙으면 `@echo off` 부터 깨진다.
 *   ⇒ 한국어 설명은 이 파일과 `_입구설명.md` 에 둔다. 입구에는 안 넣는다.
 */

import fs from 'node:fs';
import path from 'node:path';

export const 입구방 = 'C:/Users/User/OneDrive/Desktop/00_세션입구';
export const 검사자 = 'C:\\Users\\User\\Documents\\GitHub\\dataeconomics\\tools\\seat-resume-check.mjs';

/**
 * 자리마다 다른 것은 이 표뿐이다.
 * ⚠ 설정폴더는 실제 폴더 이름 그대로 적는다 — 실측하면 대문자 USER 다.
 */
export const 자리표 = [
  { 자리: 1, 파일: '1번_KLifeMap.cmd',        영문: 'KLifeMap',       계정: 'u1@klifedesign.net', 설정: 'C:\\Users\\USER\\.claude-u1', 작업: 'C:\\Users\\USER\\Documents\\GitHub\\klifemap' },
  { 자리: 2, 파일: '2번_조율.cmd',            영문: 'Coordinator',    계정: 'u2@klifedesign.net', 설정: 'C:\\Users\\USER\\.claude-u2', 작업: 'C:\\Users\\User\\Documents\\GitHub\\dataeconomics' },
  { 자리: 3, 파일: '3번_백년지도.cmd',        영문: 'HundredYear',    계정: 'u3@klifedesign.net', 설정: 'C:\\Users\\USER\\.claude-u3', 작업: 'C:\\Users\\User\\Documents\\GitHub\\dataeconomics' },
  { 자리: 4, 파일: '4번_KLifeMap보조.cmd',    영문: 'KLifeMap-2',     계정: 'u4@klifedesign.net', 설정: 'C:\\Users\\USER\\.claude-u4', 작업: 'C:\\Users\\USER\\Documents\\GitHub\\klifemap' },
  { 자리: 5, 파일: '5번_케이컬처와이어.cmd',  영문: 'KCultureWire',   계정: 'u5@klifedesign.net', 설정: 'C:\\Users\\USER\\.claude-u5', 작업: 'C:\\Users\\User\\Documents\\GitHub\\dataeconomics' },
  { 자리: 6, 파일: '6번_서울마켓.cmd',        영문: 'SeoulMarkets',   계정: 'u6@klifedesign.net', 설정: 'C:\\Users\\USER\\.claude-u6', 작업: 'C:\\Users\\User\\Documents\\GitHub\\dataeconomics' },
];

/**
 * 「명령 자리」만 남긴다 — REM 주석과 echo 로 «말하는» 줄을 걷어낸다.
 *
 * ⛔ 이것이 없으면 「goto done 을 쓰지 않는다」를 설명한 REM 줄이 «goto done 을 쓴 것»으로
 *   걸린다. 금지를 «말하는» 문장은 금지를 «어기는» 코드가 아니다.
 */
export function 명령줄만(글) {
  return String(글 ?? '')
    .split(/\r?\n/)
    .map((줄) => 줄.trim())
    .filter((줄) => 줄 && !/^REM\b/i.test(줄) && !/^echo\b/i.test(줄) && !/^echo\.$/i.test(줄))
    .join('\n');
}

/** ASCII 만인가 — 입구 파일은 이것을 통과해야 한다 */
export function 아스키만인가(글) {
  return !/[^\x09\x0A\x0D\x20-\x7E]/.test(String(글 ?? ''));
}

/** 한 자리의 입구 글을 찍는다. ⛔ 한글을 넣지 않는다 */
export function 입구글(칸, 검사길 = 검사자) {
  const { 자리, 영문, 계정, 설정, 작업 } = 칸;
  const 줄 = [
    '@echo off',
    'chcp 65001 >nul',
    `title Seat ${자리} - ${영문}`,
    'REM ---------------------------------------------------------------',
    `REM  Seat ${자리} - ${영문}`,
    'REM',
    'REM  GENERATED FILE - do not hand-edit.',
    'REM  Source of truth: dataeconomics/tools/write-seat-entries.mjs',
    'REM  Regenerate with:  node tools/write-seat-entries.mjs --write',
    'REM  Korean notes live in that generator, never in this file.',
    'REM',
    'REM  WHY ASCII ONLY: cmd.exe reads .cmd files in the system codepage,',
    'REM  not UTF-8. Korean comments in a BOM-less UTF-8 file get mangled and',
    'REM  stray bytes are parsed as commands. Angle brackets and pipes are',
    'REM  parsed as redirection even after REM. A BOM breaks @echo off.',
    'REM',
    'REM  WHAT WENT WRONG ON 2026-09-09 (measured 2026-09-10):',
    'REM    The old entry read a session id from a hand-kept ledger file and',
    'REM    called',
    'REM    claude --resume with it. When that id no longer had a transcript,',
    'REM    claude printed "No conversation found" and exited with code 0.',
    'REM    The old line "if not errorlevel 1 goto done" read 0 as success and',
    'REM    jumped to :done, which was the end of the file - so the window',
    'REM    closed instantly. Seats 3, 4 and 6 died that way.',
    'REM',
    'REM  WHAT THIS FILE DOES INSTEAD:',
    'REM    1. seat-resume-check.mjs scans this seat\'s config dir on disk and',
    'REM       prints the id of a live transcript (>=20KB, <=36h old), or nothing.',
    'REM       No stale ledger is involved, so there is nothing to go stale.',
    'REM    2. If no id comes back we never call --resume at all; we open fresh.',
    'REM    3. Every path ends at :ended with a pause. This window never closes',
    'REM       silently again - if something failed you can read why.',
    'REM',
    'REM  DO NOT delete the CLAUDE_CONFIG_DIR line. Without it this window',
    `REM  signs in as admin@klifedesign.net instead of ${계정}.`,
    'REM',
    'REM  NOTE ON DIRECTORIES: a transcript folder is fixed by the directory the',
    'REM  session FIRST opened in, not by where you resume from. That is why we',
    'REM  resume BY ID (works from any directory) and cd to the work dir below.',
    'REM  Do not switch this to "claude --continue" - that looks only at the',
    'REM  current directory and would open a blank session for live seats.',
    'REM ---------------------------------------------------------------',
    '',
    `set CLAUDE_SEAT=${자리}`,
    `set CLAUDE_CONFIG_DIR=${설정}`,
    `set SEATCHECK=${검사길}`,
    '',
    `cd /d ${작업}`,
    'if errorlevel 1 goto nodir',
    '',
    'set LIVEID=',
    `for /f "usebackq delims=" %%i in (\`node "%SEATCHECK%" ${자리} --id\`) do set LIVEID=%%i`,
    '',
    'if not defined LIVEID goto fresh',
    'echo.',
    'echo   [.] Resuming this seat\'s live conversation.',
    'echo       id %LIVEID%',
    'echo.',
    'claude --resume %LIVEID%',
    'goto ended',
    '',
    ':fresh',
    'echo.',
    `echo   [+] No live conversation for seat ${자리}. Opening a new one.`,
    'echo       Read CLAUDE.md first - it names the handover doc and the',
    'echo       shared memo file to read next - then carry on from today.',
    `echo       If a login screen appears, sign in as ${계정}`,
    'echo.',
    'claude',
    'goto ended',
    '',
    ':nodir',
    'echo.',
    `echo   [!] Work directory is missing: ${작업}`,
    'echo       Fix the path in tools/write-seat-entries.mjs and regenerate.',
    'goto ended',
    '',
    ':ended',
    'echo.',
    `echo   Seat ${자리} session ended. This window stays open on purpose.`,
    'pause',
  ];
  return 줄.join('\r\n') + '\r\n';
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('자리가 여섯이다', 자리표.length === 6);
  재다('자리 번호가 1~6 이고 겹치지 않는다',
    JSON.stringify(자리표.map((x) => x.자리)) === JSON.stringify([1, 2, 3, 4, 5, 6]));
  재다('설정폴더가 자리마다 다르다', new Set(자리표.map((x) => x.설정)).size === 6);
  재다('계정이 자리마다 다르다', new Set(자리표.map((x) => x.계정)).size === 6);
  재다('파일이름이 자리마다 다르다', new Set(자리표.map((x) => x.파일)).size === 6);

  재다('아스키만인가: 영문은 통과', 아스키만인가('set CLAUDE_SEAT=3\r\npause\r\n') === true);
  재다('⛔ 아스키만인가: 한글이 있으면 걸린다', 아스키만인가('REM 한글') === false);
  재다('⛔ 아스키만인가: BOM 도 걸린다', 아스키만인가('\uFEFF@echo off') === false);
  재다('⛔ 아스키만인가: 동그라미 숫자도 걸린다', 아스키만인가('REM 1') === true && 아스키만인가('REM \u2460') === false);

  const 글3 = 입구글(자리표[2]);
  /* 🔴 예외를 두지 않는다. 처음엔 「한국어 경로 줄만 빼고 ASCII」로 느슨하게 재다가
   *   실제 파일에 한국어 넉 줄(REM 둘 · echo 둘)이 남았다. echo 는 사장님 화면에
   *   깨진 글자로 나온다. ⇒ 예외 없이 전부 ASCII 여야 통과한다. */
  재다('🔴 입구글: 전부 ASCII 다 — 예외 줄이 하나도 없다', 아스키만인가(글3));
  for (const 칸 of 자리표) {
    재다(`🔴 입구글: ${칸.자리}번도 전부 ASCII 다`, 아스키만인가(입구글(칸)));
  }
  재다('입구글: BOM 이 없다', !글3.startsWith('\uFEFF'));
  재다('입구글: 줄바꿈이 CRLF 다', 글3.includes('\r\n') && !/[^\r]\n/.test(글3));

  재다('🔴 입구글: 마지막이 pause 다 — 말없이 닫히는 길이 없다', /pause\r\n$/.test(글3));
  /* 🔴 [2026-09-10] 여기서 오탐이 셋 났다 — 금지꼴을 «설명하는 REM 줄»을 코드로 셌다.
   *   이 무늬는 오늘 벌써 세 번째다(사이트맵의 checkout · 깨움이의 Riot).
   *   ⇒ 「그 낱말이 있나」가 아니라 「그 낱말이 «명령 자리»에 있나」를 잰다. */
  재다('명령줄만: REM 을 걷어낸다', 명령줄만('REM goto done\r\ngoto ended\r\n') === 'goto ended');
  재다('명령줄만: echo 로 «말하는» 것도 명령이 아니다', 명령줄만('echo --continue\r\nclaude\r\n') === 'claude');
  const 명령3 = 명령줄만(글3);
  재다('🔴 입구글: goto done 을 «부르지» 않는다 — 그것이 창을 닫던 줄이다', !/goto done/.test(명령3));
  재다('🔴 입구글: errorlevel 로 이어열기 성공을 판정하지 않는다',
    !/if not errorlevel 1 goto/.test(명령3));
  재다('🔴 입구글: --continue 를 «부르지» 않는다 — 살아 있는 자리가 빈 대화로 열린다',
    !/--continue/.test(명령3));
  재다('🔴 입구글: 옛 ID 대장(_현재)을 읽지 않는다', !/set \/p LIVEID=/.test(명령3));

  재다('입구글: 설정폴더를 못박는다', 글3.includes('set CLAUDE_CONFIG_DIR=C:\\Users\\USER\\.claude-u3'));
  재다('입구글: 작업폴더로 cd 한다', 글3.includes('cd /d C:\\Users\\User\\Documents\\GitHub\\dataeconomics'));
  재다('입구글: 검사자를 부르고 --id 로 받는다', /node "%SEATCHECK%" 3 --id/.test(글3));
  재다('입구글: 작업폴더가 없을 때도 pause 로 간다', /:nodir[\s\S]*goto ended/.test(글3));
  재다('입구글: 세 갈래가 모두 :ended 로 모인다',
    (글3.match(/goto ended/g) || []).length === 3);

  const 글1 = 입구글(자리표[0]);
  재다('입구글: 1번은 klifemap 으로 cd 한다', 글1.includes('GitHub\\klifemap'));
  재다('입구글: 1번 설정폴더는 u1 이다', 글1.includes('.claude-u1'));
  재다('입구글: 검사자 경로는 자리와 무관하게 같다 — 1번도 dataeconomics 의 자를 부른다',
    글1.includes('dataeconomics\\tools\\seat-resume-check.mjs'));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
}

const 쓴다 = process.argv.includes('--쓴다') || process.argv.includes('--write');
const 옛것방 = path.join(입구방, '_옛것');

if (!자가시험()) {
  console.log('🔴 자가시험이 깨졌다 — 쓰지 않는다.');
  process.exit(1);
}
console.log('');

let 바뀐것 = 0;
for (const 칸 of 자리표) {
  const 길 = path.join(입구방, 칸.파일);
  const 새글 = 입구글(칸);
  let 옛글 = null;
  try { 옛글 = fs.readFileSync(길, 'utf8'); } catch { /* 없으면 새로 만든다 */ }

  if (옛글 === 새글) { console.log(`  ⬜ ${칸.자리}번 ${칸.파일} — 그대로다`); continue; }
  바뀐것 += 1;
  if (!쓴다) {
    console.log(`  · ${칸.자리}번 ${칸.파일} — ${옛글 === null ? '새로 만든다' : `고친다 (${옛글.length}자 → ${새글.length}자)`}`);
    continue;
  }
  /* ⛔ 옛 것을 지우지 않는다 — 되돌릴 길을 남긴다 */
  if (옛글 !== null) {
    try { fs.mkdirSync(옛것방, { recursive: true }); } catch { /* 있으면 그만 */ }
    const 날 = new Date();
    const 도장 = `${날.getFullYear()}${String(날.getMonth() + 1).padStart(2, '0')}${String(날.getDate()).padStart(2, '0')}`
      + `-${String(날.getHours()).padStart(2, '0')}${String(날.getMinutes()).padStart(2, '0')}`;
    fs.writeFileSync(path.join(옛것방, `${칸.파일}.${도장}`), 옛글, 'utf8');
  }
  fs.writeFileSync(길, 새글, 'utf8');
  console.log(`  ✅ ${칸.자리}번 ${칸.파일} — 썼다`);
}

console.log('');
if (!쓴다 && 바뀐것) console.log(`  ⚠ 아직 안 썼다. 쓰려면 --쓴다 를 붙인다 (${바뀐것}장이 바뀐다)`);
if (쓴다) console.log(`  옛 것은 ${옛것방} 에 날짜를 붙여 두었다.`);
