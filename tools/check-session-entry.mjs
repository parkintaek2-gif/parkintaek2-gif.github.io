#!/usr/bin/env node
/**
 * check-session-entry.mjs — **세션입구 .cmd 를 «실제로 돌려» 본다.**
 *
 * ── 왜 이 자가 생겼나 (2026-09-01 21:2x · 5번) ──────────────────────────────
 * 사장님 — 「세션입구 새로 만들어라」 「**확실하게 테스트해서 문제없게 만들어라**」
 *
 * ⚠ 오늘 내가 입구를 «세 번» 고쳤는데 세 번 다 돌려 보지 않고 끝냈다. 그 결과 —
 * ```
 * ① Bash 로 고쳐 역슬래시가 먹혔다 → set CLAUDE_CONFIG_DIR=C:UsersUSER.claude-u1
 *    한글도 latin1 로 써서 통째로 깨졌다
 * ② 옛 attach 로직이 남아 「No job matching '7b3dfbe0'」 로 떨어져 로그인 화면까지 못 갔다
 *    사장님이 그 화면을 보고 계셨다
 * ③ 파일 앞 BOM 이 @echo off 를 깨뜨렸다 — '?echo' 인식 안 됨
 * ④ 라벨을 한글로 두어 cmd 가 못 읽었다 — '끝' 인식 안 됨
 * ⑤ REM 주석에 쓴 꺾쇠를 cmd 가 «리다이렉션»으로 먼저 읽어 오류를 냈다
 * ```
 * ⇒ 「고쳤습니다」와 「돌아갑니다」는 다른 말이다. 이 자가 그 차이를 잰다.
 *
 * ── 어떻게 «안전하게» 재나 ──────────────────────────────────────────────────
 * ⛔ 실물 입구를 그대로 돌리면 «살아 있는 세션»에 붙어 남의 일을 방해한다.
 * ✅ 그래서 시험판을 만든다 — claude 부르는 줄을 «가짜»로 바꿔 흐름만 돌린다.
 *    가짜는 자기가 무슨 인자로 불렸는지 찍어 주므로 어느 갈래로 갔는지 눈으로 확인된다.
 * ✅ 대장 ID 가 «있을 때»와 «없을 때» 두 경우를 다 돌린다 — 한 경우만 재면 반쪽이다.
 *
 * ── 무엇을 잡나 ─────────────────────────────────────────────────────────────
 *  ① 배치가 «끝까지» 도나 (구문 오류·프롬프트로 떨어짐 없이)
 *  ② CLAUDE_CONFIG_DIR 가 그 유닛 값으로 실제로 서나 (역슬래시가 먹히지 않았나)
 *  ③ 대장 ID 가 있으면 --resume 로, 없으면 인자 없이 claude 로 가나
 *  ④ 한글이 깨져 나오지 않나
 *  ⑤ 줄바꿈이 CRLF 인가 (LF 면 클릭해도 안 열린다)
 *  ⑥ 옛 사고 문구(attach·백틱)가 «실제 명령»에 남아 있지 않나
 *  ⑦ 주석에 꺾쇠·파이프가 있지 않나 (cmd 가 리다이렉션으로 읽는다)
 *  ⑧ 파일 앞에 BOM 이 붙어 있지 않나
 *
 * 쓰는 법
 *   node tools/check-session-entry.mjs
 *   node tools/check-session-entry.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const 입구칸 = 'C:\\Users\\User\\Desktop\\00_세션입구';
const 유닛 = [
  { n: 1, 파일: '1번_KLifeMap.cmd' },
  { n: 2, 파일: '2번_조율.cmd' },
  { n: 3, 파일: '3번_백년지도.cmd' },
  { n: 4, 파일: '4번_KLifeMap보조.cmd' },
  { n: 5, 파일: '5번_케이컬처와이어.cmd' },
  { n: 6, 파일: '6번_서울마켓.cmd' },
];

/** 주석(REM · ::) 줄을 뺀 «실제 명령»만 남긴다. 자가 거짓경보를 내지 않게. */
export function 주석뺀다(글) {
  return String(글).split(/\r?\n/).filter((l) => !/^\s*(REM|::)/i.test(l)).join('\n');
}

/** claude 를 부르는 줄을 «가짜»로 바꾼다. 가짜는 인자를 찍고 성공으로 끝난다. */
export function 시험판만들기(글, 가짜) {
  return String(글).replace(/^(\s*)claude(\s|$)/gm, (m, 앞, 뒤) => `${앞}call "${가짜}"${뒤}`);
}

function 한번돌린다(유닛번호, 파일, 대장ID) {
  const 시험칸 = fs.mkdtempSync(path.join(os.tmpdir(), '입구시험-'));
  try {
    const 원본 = fs.readFileSync(path.join(입구칸, 파일), 'utf8');
    const 가짜 = path.join(시험칸, '가짜claude.cmd');
    fs.writeFileSync(가짜, '@echo off\r\nchcp 65001 >nul\r\necho GAJJA_CLAUDE_ARGS=[%*]\r\nexit /b 0\r\n', 'utf8');
    /* 대장 자리를 시험칸 안에 만든다 — ⛔ 실물 대장을 건드리지 않는다 */
    fs.mkdirSync(path.join(시험칸, '_현재'), { recursive: true });
    if (대장ID) fs.writeFileSync(path.join(시험칸, '_현재', `${유닛번호}.id`), 대장ID, 'utf8');
    const 시험본 = path.join(시험칸, 파일);
    fs.writeFileSync(시험본, 시험판만들기(원본, 가짜), 'utf8');
    const r = spawnSync('cmd.exe', ['/c', 시험본], { encoding: 'utf8', timeout: 30000, cwd: 시험칸 });
    return { 코드: r.status, 낸것: (r.stdout || '') + (r.stderr || '') };
  } finally {
    try { fs.rmSync(시험칸, { recursive: true, force: true }); } catch { /* 임시칸은 못 지워도 넘어간다 */ }
  }
}

function 낸다() {
  let 흠 = 0;
  const 잡는다 = (말) => { 흠++; console.log(`   🔴 ${말}`); };

  console.log(`■ 세션입구를 «실제로 돌려» 본다 — ${new Date().toLocaleString('ko-KR')}`);
  console.log('  ⛔ 살아 있는 세션에 안 붙는다. claude 부르는 줄을 가짜로 바꿔 흐름만 돈다.\n');

  for (const u of 유닛) {
    const 자리 = path.join(입구칸, u.파일);
    if (!fs.existsSync(자리)) { 잡는다(`${u.n}번 입구가 없다 — ${u.파일}`); continue; }
    console.log(`── ${u.n}번  ${u.파일}`);

    const 바이트 = fs.readFileSync(자리);
    const 글 = 바이트.toString('utf8');
    const 명령줄만 = 주석뺀다(글);

    /* ⑧ BOM — @echo off 를 깨뜨린다 */
    if (바이트[0] === 0xef && 바이트[1] === 0xbb && 바이트[2] === 0xbf) {
      잡는다(`${u.n}번 파일 앞에 BOM 이 있다 — '?echo' 인식 안 됨 오류가 난다`);
    }
    /* ⑤ 줄바꿈 */
    if (/(^|[^\r])\n/.test(글)) 잡는다(`${u.n}번 줄바꿈에 LF 가 섞였다 — 클릭해도 안 열린다`);
    /* ② 설정 뿌리 */
    const 뿌리줄 = ((글.match(/^set CLAUDE_CONFIG_DIR=(.*)$/m) || [])[1] || '').trim();
    if (!뿌리줄) 잡는다(`${u.n}번 CLAUDE_CONFIG_DIR 줄이 없다 — 열면 사장님 자리(admin@)로 붙는다`);
    else if (!/^[A-Za-z]:\\/.test(뿌리줄)) 잡는다(`${u.n}번 설정 뿌리 경로가 깨졌다 — 「${뿌리줄}」 (역슬래시가 먹혔다)`);
    else if (!뿌리줄.includes(`.claude-u${u.n}`)) 잡는다(`${u.n}번 설정 뿌리가 자기 것이 아니다 — 「${뿌리줄}」`);
    /* ④ 인코딩 */
    if (글.includes('\uFFFD')) 잡는다(`${u.n}번 한글이 깨져 있다(인코딩 사고) — PowerShell 로 다시 쓴다`);
    /* ⑥ 옛 사고 문구 — 주석은 뺀다 */
    if (/claude\s+attach/.test(명령줄만)) 잡는다(`${u.n}번에 옛 attach 로직이 남아 있다 — 「No job matching」 으로 떨어진다`);
    if (/usebackq/.test(명령줄만) || 명령줄만.includes('`')) 잡는다(`${u.n}번 실제 명령에 백틱이 있다 — 외부 스크립트를 백틱으로 부르는 것은 취약하다`);
    /* ⑦ 주석의 꺾쇠·파이프 — REM 뒤라도 cmd 는 리다이렉션을 먼저 읽는다 */
    for (const 줄 of 글.split(/\r?\n/)) {
      if (!/^\s*(REM|::)/i.test(줄)) continue;
      if (/[<>|]/.test(줄)) { 잡는다(`${u.n}번 주석에 꺾쇠·파이프가 있다 — cmd 가 리다이렉션으로 읽어 오류를 낸다: 「${줄.trim().slice(0, 56)}」`); break; }
    }

    /* ①③ 실제로 돌려 본다 */
    const 가짜ID = '00000000-1111-2222-3333-444444444444';
    for (const [이름, 대장ID] of [['대장 비었을 때', null], ['대장 있을 때', 가짜ID]]) {
      const r = 한번돌린다(u.n, u.파일, 대장ID);
      const 인자 = (r.낸것.match(/GAJJA_CLAUDE_ARGS=\[(.*)\]/) || [])[1];
      if (r.코드 !== 0) { 잡는다(`${u.n}번 ${이름} — 배치가 종료코드 ${r.코드} 로 끝났다`); continue; }
      if (인자 == null) { 잡는다(`${u.n}번 ${이름} — claude 를 «아예 안 불렀다»(프롬프트로 떨어졌을 수 있다)`); continue; }
      if (대장ID) {
        if (!인자.includes('--resume') || !인자.includes(대장ID)) 잡는다(`${u.n}번 ${이름} — --resume 로 안 갔다. 실제 인자 「${인자}」`);
        else console.log(`   ✅ ${이름} → claude --resume 로 갔다`);
      } else if (인자.trim() !== '') 잡는다(`${u.n}번 ${이름} — 인자 없이 불러야 하는데 「${인자}」 가 붙었다`);
      else console.log(`   ✅ ${이름} → 인자 없이 새 대화로 갔다`);
      if (/is not recognized|찾을 수 없습니다|구문이 올바르지/.test(r.낸것)) {
        const 조각 = (r.낸것.match(/'[^']*' is not recognized/) || [''])[0];
        잡는다(`${u.n}번 ${이름} — 배치 안에서 오류가 났다 ${조각 ? `(${조각})` : ''}`);
      }
    }
  }

  console.log('');
  console.log(흠 ? `══ 흠 ${흠}개 ══  🔴 고치기 전에는 못 쓴다` : '══ 흠 0개 ══  ✅ 여섯 입구가 두 경우 다 제대로 돈다');
  return 흠;
}

/* ── 자가시험 — 이 자가 «정말 잡는지» 지어낸 글로 잰다 ── */
function 자가시험() {
  let 통과 = 0, 실패 = 0;
  const 본다 = (참, 말) => { if (참) 통과++; else { 실패++; console.log('   🔴', 말); } };

  /* ① 주석뺀다 */
  본다(주석뺀다('REM claude attach\r\nclaude\r\n') === 'claude\n', '주석을 안 뺀다');
  본다(주석뺀다(':: usebackq 설명\r\nclaude\r\n') === 'claude\n', ':: 주석을 안 뺀다');
  본다(주석뺀다('  rem 소문자 주석\r\nclaude\r\n') === 'claude\n', '소문자 rem 을 안 뺀다');

  /* ② 시험판만들기 — 줄 앞의 claude 만 바꾸고 주석은 안 건드린다 */
  {
    const 새 = 시험판만들기('REM claude attach 는 설명이다\r\nclaude --resume %LIVEID%\r\nclaude\r\n', 'C:\\가짜.cmd');
    본다(새.includes('REM claude attach 는 설명이다'), '주석 안의 claude 를 건드렸다');
    본다(새.includes('call "C:\\가짜.cmd" --resume %LIVEID%'), 'resume 줄을 가짜로 안 바꿨다');
    본다(/call "C:\\가짜\.cmd"\r?\n/.test(새), '인자 없는 claude 줄을 가짜로 안 바꿨다');
    본다(!/^claude/m.test(새), '실물 claude 호출이 남았다 — 살아 있는 세션에 붙을 수 있다');
  }
  {
    본다(시험판만들기('  claude --resume X\r\n', 'C:\\가짜.cmd').includes('call "C:\\가짜.cmd" --resume X'), '들여쓴 claude 를 안 바꿨다');
  }
  /* ③ 깨진 경로 무늬 */
  본다(!/^[A-Za-z]:\\/.test('C:UsersUSER.claude-u1'), '역슬래시 먹힌 경로를 성한 것으로 본다');
  본다(/^[A-Za-z]:\\/.test('C:\\Users\\USER\\.claude-u1'), '성한 경로를 깨진 것으로 본다');
  /* ④ LF 무늬 */
  본다(/(^|[^\r])\n/.test('a\nb'), 'LF 를 못 잡는다');
  본다(!/(^|[^\r])\n/.test('a\r\nb\r\n'), 'CRLF 를 LF 로 잘못 잡는다');
  /* ⑤ 주석 꺾쇠 무늬 */
  본다(/[<>|]/.test('REM  node "x" 1 "y" <세션ID>'), '주석의 꺾쇠를 못 잡는다');
  본다(!/[<>|]/.test('REM  node "x" 1 "y" 세션ID'), '꺾쇠 없는 주석을 잡는다');
  /* ⑥ 백틱 무늬 — 주석에 있으면 안 잡고, 명령에 있으면 잡는다 */
  본다(!주석뺀다('REM 백틱(for /f usebackq) 설명\r\nclaude\r\n').includes('usebackq'), '주석의 usebackq 설명을 명령으로 본다');
  본다(주석뺀다('for /f "usebackq" %%i in (x) do echo %%i\r\n').includes('usebackq'), '명령의 usebackq 를 못 본다');

  console.log(`\n══ 자가시험 통과 ${통과} · 실패 ${실패} ══ ${실패 ? '🔴' : '✅'}`);
  return 실패;
}

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험') || 인자.includes('--selftest')) process.exit(자가시험() ? 1 : 0);
else process.exit(낸다() ? 1 : 0);
