#!/usr/bin/env node
/**
 * check-cmd가-한글경로에-쓸수있나.mjs — **예약작업 .cmd 가 한글 경로에 적을 수 있나 본다.**
 *
 * ── 🔴🔴 왜 만드나 (2026-11-02 · 사장님 「색인, seo, geo 제대로 하고 있나」) ──
 * `run-index-request.cmd` 가 날마다 11시 10분에 돌았고, 작업 스케줄러는 해마다
 * 「성공(0)」을 돌려줬다. 그런데 **2026-10-23 부터 11-01 까지 9일 동안 색인 요청이
 * 한 건도 안 나갔다.** 로그 파일은 그 9일 동안 한 글자도 늘지 않았다.
 *
 * 까닭 — 그 .cmd 는 **UTF-8 로 저장**돼 있는데 로그 경로에 한글이 들어 있다.
 *     node "scripts\demand-pages.mjs" >> "docs\고정업무-마커\색인요청.log" 2>&1
 * cmd.exe 는 배치 파일을 **그때의 코드페이지(CP949)**로 읽는다. 한글이 깨진 바이트가 되어
 * 「파일 이름, 디렉터리 이름 또는 볼륨 레이블 구문이 잘못되었습니다」가 나고
 * **그 줄이 통째로 건너뛰어진다.** node 는 아예 돌지 않는다.
 * 그런데도 `exit /b %ERRORLEVEL%` 는 **0** 을 돌려준다 — 작업은 「성공」으로 남는다.
 *
 * ⛔ 「걸어 뒀다」를 「돌고 있다」로 읽지 않는다. 0 은 「했다」가 아니다.
 *
 * ── 고치는 법은 이미 한 번 찾아 놨었다 ──────────────────────────────
 * `run-jbnews-sports-collect.cmd` 가 2026-10-15 에 같은 일을 겪고 `chcp 65001 >nul` 로
 * 고쳤다. **그 고침이 나머지 .cmd 로 따라가지 않아** 색인 요청이 조용히 죽었다.
 * ⇒ 하나를 고치면 인용한 곳까지 따라간다. 이 검사가 그 일을 대신한다.
 *
 * 쓰는 법
 *   node scripts/check-cmd가-한글경로에-쓸수있나.mjs
 *   node scripts/check-cmd가-한글경로에-쓸수있나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 리디렉션(> 또는 >>) 으로 보내는 경로에 한글이 들었나 */
export function 한글경로로보내나(글) {
  return /(^|\s)>>?\s*"?[^"\r\n|&]*[가-힣]/m.test(String(글 ?? ''));
}

/** 코드페이지를 UTF-8 로 세우는 줄이 있나 */
export function 코드페이지를세우나(글) {
  return /^\s*chcp\s+65001\b/mi.test(String(글 ?? ''));
}

/** 이 파일이 UTF-8 로 저장돼 있나 — ASCII 만 있으면 코드페이지와 무관하다 */
export function 한글이들었나(글) {
  return /[가-힣]/.test(String(글 ?? ''));
}

/**
 * 이 .cmd 가 성한가.
 * 「한글 경로로 보내는데 chcp 가 없다」면 깨진 것이다.
 * 한글을 안 쓰면 코드페이지와 무관하니 볼 것이 없다.
 */
export function 성한가(글) {
  if (!한글이들었나(글)) return true;
  if (!한글경로로보내나(글)) return true;
  return 코드페이지를세우나(글);
}

/* ── 자가시험 ───────────────────────────────────────────────────── */
export function 자가시험() {
  const 결 = [];
  const 검 = (이름, 참) => 결.push([이름, !!참]);

  검('🔴 한글 경로로 보내는데 chcp 가 없으면 깨진 것이다',
    !성한가('@echo off\r\nnode a.mjs >> "docs\고정업무-마커\색인요청.log" 2>&1\r\n'));
  검('✅ chcp 가 있으면 성하다',
    성한가('@echo off\r\nchcp 65001 >nul\r\nnode a.mjs >> "docs\고정업무-마커\색인요청.log" 2>&1\r\n'));
  검('⬜ 경로가 다 영문이면 볼 것이 없다',
    성한가('@echo off\r\nnode a.mjs >> ".auto-1600-report.log" 2>&1\r\n'));
  검('⬜ 한글이 주석에만 있고 경로는 영문이면 성하다',
    성한가('@echo off\r\nrem 이것은 설명이다\r\nnode a.mjs >> "run.log" 2>&1\r\n'));
  검('🔴 슬래시 경로도 똑같이 깨진다',
    !성한가('@echo off\r\nnode a.mjs >> "docs/고정업무-마커/거둠.log" 2>&1\r\n'));
  검('🔴 > 하나짜리도 본다',
    !성한가('@echo off\r\necho x > "docs\\마커\\한글.log"\r\n'));
  검('⛔ 빈 글은 볼 것이 없다', 성한가(''));
  검('한글 경로를 알아본다', 한글경로로보내나('node a >> "docs\\한글\\x.log"'));
  검('⛔ 영문 경로를 한글로 세지 않는다', !한글경로로보내나('node a >> "docs\\x.log"'));
  검('chcp 를 알아본다', 코드페이지를세우나('chcp 65001 >nul'));
  검('⛔ 다른 코드페이지는 세지 않는다', !코드페이지를세우나('chcp 949 >nul'));

  결.forEach(([이름, 참]) => console.log((참 ? '  ✅ ' : '  ❌ ') + 이름));
  const 깨짐 = 결.filter((x) => !x[1]).length;
  console.log(깨짐 ? `\n■ 자가시험 ${깨짐}건 실패` : `\n■ 자가시험 ${결.length}건 모두 통과`);
  return 깨짐 === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  const 방 = path.join(뿌리, 'scripts');
  const 것들 = fs.readdirSync(방).filter((x) => /\.cmd$/i.test(x));

  console.log('■ 예약작업 .cmd 가 한글 경로에 적을 수 있나');
  console.log('  🔴 못 적으면 그 줄이 통째로 건너뛰어진다 — 그런데도 「성공(0)」이 돌아온다');
  console.log('     색인 요청이 이렇게 9일 동안 조용히 멈춰 있었다 (2026-10-23 ~ 11-01)\n');

  const 깨진것 = [];
  for (const 이름 of 것들) {
    const 글 = fs.readFileSync(path.join(방, 이름), 'utf8');
    if (성한가(글)) continue;
    깨진것.push(이름);
    console.log(`  ❌ ${이름} — 한글 경로로 보내는데 «chcp 65001 >nul» 이 없다`);
  }

  if (!깨진것.length) {
    console.log(`  ✅ .cmd ${것들.length}개 모두 성하다`);
    console.log('\n🟢 예약작업이 로그에 적을 수 있다');
    process.exit(0);
  }
  console.log(`\n🔴 ${깨진것.length}개가 깨졌다 — @echo off 다음 줄에 «chcp 65001 >nul» 을 넣는다`);
  process.exit(1);
}
