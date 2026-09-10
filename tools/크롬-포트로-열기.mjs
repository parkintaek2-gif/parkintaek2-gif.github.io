#!/usr/bin/env node
/**
 * 크롬-포트로-열기.mjs — **원격 디버깅 포트를 켠 크롬을 띄운다.** (2026-09-10 · 5번)
 *
 *   node tools/크롬-포트로-열기.mjs --자가시험
 *   node tools/크롬-포트로-열기.mjs                 (지금 상태만 잰다)
 *   node tools/크롬-포트로-열기.mjs --입구글         (사장님이 누르실 .cmd 를 만든다)
 *
 * ── 🔴 왜 만드나 ────────────────────────────────────────────────────────
 *
 * 2026-09-10 에 사장님께 두 번 손을 빌렸다.
 *   「크롬만 켜 두시면 제가 들어가 세겠습니다」 → 사장님: 「열려있는데」
 *   재 보니 크롬은 «켜져 있었고» 포트만 없었다 — 그때 인자는 이랬다:
 *     --no-startup-window --flag-switches-begin --disable-features=...
 *   ⛔ `--remote-debugging-port=9222` 가 없으면 포트가 안 열린다. 그리고 그 포트는
 *     **크롬을 «시작할 때»만** 열린다 — 이미 뜬 창에는 나중에 못 붙인다.
 *
 * ⇒ 그러니 「크롬을 켜 주십시오」는 «틀린 부탁»이었다. 사장님은 이미 켜 두셨다.
 *   맞는 부탁은 「이 파일을 눌러 주십시오」 하나다. 그것을 만들어 둔다.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────
 * ```
 * ⛔ 사장님이 쓰시던 창을 «닫지 않는다». 이 자는 끄지 않는다 — 상태만 재고 입구글을 만든다.
 *   사장님 지시: 「내 창 건드려도 됨」이지만 우리 규율은 b.close() 금지다. 같은 마음이다
 * ⛔ 프로필을 «복사»해 로그인을 끌어오려 하지 않는다 — 2026-09-05 에 재 봤고 안 된다
 *   (요즘 크롬은 쿠키를 OS 키에 묶어 암호화한다. 복사본은 본문 51자짜리 빈 껍데기였다)
 * ⛔ 비밀번호·토큰을 읽거나 어디로 보내지 않는다. 화면과 그 화면의 «자료»만 다룬다
 * ⚠ 크롬을 이미 «포트 없이» 띄워 둔 상태에서 같은 프로필로 다시 띄우면 포트가 안 열린다 —
 *   기존 크롬이 그 요청을 자기 창으로 삼켜 버린다. 그래서 입구글이 그것을 먼저 말한다
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 포트 = 9222;

export const 크롬후보 = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Users/USER/AppData/Local/Google/Chrome/Application/chrome.exe',
];

/** 포트가 열렸나. ⛔ 못 물으면 「닫혔다」가 아니라 「못 쟀다」다 */
export async function 포트열렸나(밀리초 = 2500) {
  try {
    const r = await fetch(`http://127.0.0.1:${포트}/json/version`, {
      signal: AbortSignal.timeout(밀리초),
    });
    if (!r.ok) return { 열렸나: false, 왜: `HTTP ${r.status}` };
    const j = await r.json();
    return { 열렸나: true, 브라우저: j.Browser ?? '?' };
  } catch (e) {
    return { 열렸나: false, 왜: e.name === 'TimeoutError' ? '응답이 없다' : e.message };
  }
}

/** 크롬 실행 인자에 포트가 있나 */
export function 인자에포트있나(명령줄) {
  if (typeof 명령줄 !== 'string') return null;
  return /--remote-debugging-port\s*=\s*(\d+)/.test(명령줄);
}

/** 사장님이 누르실 입구글 한 장 */
export function 입구글만들기(크롬길, 포트값 = 포트) {
  return [
    '@echo off',
    'setlocal',
    'REM  Open Chrome with the remote debugging port so the units can attach.',
    'REM',
    'REM  WHY THIS FILE EXISTS (2026-09-10)',
    'REM    Chrome only opens the debugging port when it STARTS. You cannot turn it on',
    'REM    for a window that is already running. On 2026-09-10 Chrome was open but the',
    'REM    port was missing, so the unit could not read the Claude team member list.',
    'REM',
    'REM  WHAT THIS DOES',
    'REM    1. If Chrome is already running, it asks you to close it first. Chrome would',
    'REM       otherwise hand this request to the existing process and the port stays shut.',
    'REM    2. Starts Chrome with --remote-debugging-port and your normal profile, so you',
    'REM       stay signed in to Google, AdSense, Search Console and claude.ai.',
    'REM    3. Prints how to check the port.',
    'REM',
    'REM  NOTHING IS COPIED. Your profile is used in place. No password is read.',
    '',
    'tasklist /FI "IMAGENAME eq chrome.exe" 2>nul | find /I "chrome.exe" >nul',
    'if not errorlevel 1 (',
    '  echo.',
    '  echo   Chrome is already running WITHOUT the debugging port.',
    '  echo   Close every Chrome window first, then run this file again.',
    '  echo   Your tabs come back when Chrome reopens.',
    '  echo.',
    '  pause',
    '  exit /b 1',
    ')',
    '',
    `start "" "${크롬길.replace(/\//g, '\\')}" --remote-debugging-port=${포트값}`,
    '',
    'echo.',
    `echo   Chrome started with the debugging port ${포트값}.`,
    'echo   Check it with:',
    `echo     curl http://127.0.0.1:${포트값}/json/version`,
    'echo.',
    'pause',
    '',
  ].join('\r\n');
}

/* ── 자가시험 ───────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0, 막힘 = 0;
  const 본다 = (무엇, 됐나, 덧 = '') => {
    if (됐나) 통과 += 1;
    else { 막힘 += 1; console.log(`  ✕ ${무엇}${덧 ? ' — ' + 덧 : ''}`); }
  };
  console.log('자가시험 — 크롬-포트로-열기.mjs');

  본다('포트가 9222 다', 포트 === 9222);
  본다('크롬 후보가 셋 이상', 크롬후보.length >= 3);

  본다('인자에 포트가 있으면 참', 인자에포트있나('chrome.exe --remote-debugging-port=9222') === true);
  본다('빈칸이 있어도 잡는다', 인자에포트있나('chrome.exe --remote-debugging-port = 9222') === true);
  본다('🔴 오늘 실측한 인자에는 없다',
    인자에포트있나('"chrome.exe" --no-startup-window /prefetch:5 --flag-switches-begin') === false);
  본다('글이 아니면 null', 인자에포트있나(null) === null);

  const 글 = 입구글만들기('C:/Program Files/Google/Chrome/Application/chrome.exe');
  본다('입구글이 ASCII 만 쓴다 — .cmd 는 한글이 깨진다', !/[^\x00-\x7F]/.test(글));
  본다('입구글에 포트 인자가 있다', 글.includes('--remote-debugging-port=9222'));
  본다('입구글이 역슬래시 경로를 쓴다', 글.includes('C:\\Program Files\\Google'));
  본다('⛔ 입구글이 크롬을 «끄지» 않는다 — 사장님 창을 닫지 않는다',
    !/taskkill|\/f\b/i.test(글));
  본다('이미 켜져 있으면 먼저 닫으라고 말한다', 글.includes('Close every Chrome window first'));
  본다('입구글이 CRLF 다 — 배치 파일이다', 글.includes('\r\n'));
  본다('확인하는 법을 적어 준다', 글.includes('/json/version'));

  console.log(`\n통과 ${통과} · 막힘 ${막힘}`);
  return 막힘 === 0;
}

/* ── 실행 ───────────────────────────────────────────────────────── */

const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  const 상태 = await 포트열렸나();
  console.log('■ 크롬 원격 디버깅 포트\n');
  if (상태.열렸나) {
    console.log(`   ✅ 포트 ${포트} 가 열려 있다 — ${상태.브라우저}`);
    console.log('   ⇒ 지금 바로 붙어 일할 수 있다. 입구글을 만들 일이 없다.');
    process.exit(0);
  }
  console.log(`   🔴 포트 ${포트} 가 닫혀 있다 (${상태.왜})`);
  console.log('   ⚠ 크롬이 «켜져 있어도» 시작할 때 포트를 안 켰으면 닫힌 것이다.');
  console.log('     그 포트는 시작할 때만 열린다 — 이미 뜬 창에는 나중에 못 붙인다.\n');

  const 크롬길 = 크롬후보.find((p) => fs.existsSync(p));
  if (!크롬길) { console.log('   ⬜ 크롬을 못 찾았다 — 후보 셋에 없다. 경로를 알려 주십시오.'); process.exit(1); }
  console.log(`   크롬: ${크롬길}`);

  if (!process.argv.includes('--입구글')) {
    console.log('\n   ⇒ 사장님이 누르실 입구글을 만들려면 --입구글 을 붙인다.');
    process.exit(0);
  }

  const 낼곳 = 'C:/Users/User/OneDrive/Desktop/00_세션입구/0_크롬_포트열고_열기.cmd';
  fs.mkdirSync(path.dirname(낼곳), { recursive: true });
  fs.writeFileSync(낼곳, 입구글만들기(크롬길), 'utf8');
  console.log(`\n   ✔ 만들었다 — ${낼곳}`);
  console.log('   ⇒ 사장님께는 「크롬을 켜 주십시오」가 아니라 «이 파일을 눌러 주십시오»로 말한다.');
  console.log('     오늘 「열려있는데」라는 답을 들은 까닭이 그것이다 — 부탁이 틀렸다.');
  process.exit(0);
}
