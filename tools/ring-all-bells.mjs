#!/usr/bin/env node
/**
 * ring-all-bells.mjs — **네 유닛 비상벨을 한 번에 울려 본다.** (윈도 예약작업이 이것을 부른다)
 *
 * ── 왜 이 파일이 생겼나 (2026-09-01 20:2x · 5번) ────────────────────────────
 * 사장님 전체 공지 — 「**1번이 만든 비상벨이 있다. 모든 세션 잘 작동하는 지 확인하라.**」
 *
 * 확인해 보니 두 가지가 나왔다.
 * ```
 * ① 5번(kculturewire) 몫이 아예 없었다        → 만들었다(check-emergency-kcw.mjs)
 * ② 넷 다 «손으로» 돌려야 했다. 크론에 안 물려 있었다
 * ```
 * ⚠ ②가 더 큰 흠이다. **사람이 기억할 때만 도는 것은 비상벨이 아니다.**
 *   세션 안에서 거는 예약은 «세션이 죽으면 같이 죽는다». 비상은 세션이 죽었을 때 더 자주 온다.
 *   ⇒ 그래서 윈도 예약작업(세션과 무관하게 도는 자리)에 건다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────────────────
 * ⛔ **사장님 화면에 아무것도 안 띄운다.** 창을 열지 않고, 소리를 내지 않는다.
 *    (2026-09-01 사장님 — 「깨우는 애 좀 팝업안되 게 해라..정신 사납다」)
 *    빨간불은 각 벨이 «메일 창구»로 부른다. 그것이 사장님이 받기로 정하신 길이다.
 * ⛔ 초록일 때는 아무 짓도 안 한다 — 조용한 것이 정상이다.
 * ⛔ 한 벨이 죽어도 나머지를 계속 돌린다. 첫 실패에서 멈추면 뒤의 벨이 통째로 침묵한다
 *    (「검사묶음은 끝까지 돌려야 검사다」).
 *
 * 쓰는 법
 *   node tools/ring-all-bells.mjs              네 벨을 다 돌리고 한 줄로 요약한다
 *   node tools/ring-all-bells.mjs --예약등록     윈도 예약작업으로 건다(매시 :40)
 *   node tools/ring-all-bells.mjs --예약해제     걸어 둔 것을 뗀다
 */
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const 이칸 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(이칸, '..');
const 깃허브 = path.resolve(뿌리, '..');
const 작업이름 = 'KLifeDesign-비상벨';

const 벨들 = [
  { 유닛: '1번 klifemap.ai', 칸: path.join(깃허브, 'klifemap'), 자: 'tools/check-emergency.mjs' },
  { 유닛: '3번 100yearmap.com', 칸: 뿌리, 자: 'tools/check-emergency-100yearmap.mjs' },
  { 유닛: '5번 kculturewire.com', 칸: 뿌리, 자: 'tools/check-emergency-kcw.mjs' },
  { 유닛: '6번 seoulmarkets.com', 칸: 뿌리, 자: 'tools/check-emergency.mjs' },
];

function 다울린다() {
  const 결과 = [];
  for (const b of 벨들) {
    const 자리 = path.join(b.칸, b.자);
    if (!fs.existsSync(자리)) {
      /* ⛔ 없는 것을 「이상 없음」으로 넘기지 않는다 */
      결과.push({ ...b, 상태: '없다', 코드: null });
      continue;
    }
    const r = spawnSync('node', [b.자, '--조용히'], { cwd: b.칸, encoding: 'utf8', timeout: 120000 });
    /* 각 벨의 약속 — 0 초록 · 2 빨강(메일 부름) · 그 밖은 자 자체가 죽은 것 */
    const 상태 = r.status === 0 ? '초록' : r.status === 2 ? '빨강' : '자가 죽었다';
    결과.push({ ...b, 상태, 코드: r.status, 낸것: ((r.stdout || '') + (r.stderr || '')).trim() });
  }
  return 결과;
}

function 요약낸다(결과) {
  /* ⛔ toISOString() 은 UTC 다. 우리 기록은 다 KST 라 섞으면 아홉 시간 어긋난 채로 남는다
     (2026-09-01 첫 판이 「11:23」으로 찍혀 바로 고쳤다 — 실제로는 20:23 이었다). */
  const 이제 = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16);
  for (const r of 결과) {
    const 표 = r.상태 === '초록' ? '✅' : '🔴';
    console.log(`${표} ${r.유닛.padEnd(22)} ${r.상태}${r.코드 == null ? '' : ` (종료 ${r.코드})`}`);
    if (r.상태 !== '초록' && r.낸것) console.log('   ' + r.낸것.split('\n').slice(-4).join('\n   '));
  }
  const 성한것 = 결과.filter((r) => r.상태 === '초록').length;
  console.log(`\n■ ${이제} — 벨 ${결과.length}개 중 초록 ${성한것}개`);

  /* 로그는 남긴다. ⛔ 사장님 화면에는 안 띄운다 */
  try {
    const 줄 = `${이제}  초록 ${성한것}/${결과.length}  ${결과.map((r) => `${r.유닛.split(' ')[0]}:${r.상태}`).join(' ')}\n`;
    fs.appendFileSync(path.join(뿌리, 'docs', '비상벨-돌린기록.log'), 줄, 'utf8');
  } catch { /* 로그를 못 남기는 것으로 벨을 멈추지 않는다 */ }

  return 결과.some((r) => r.상태 !== '초록') ? 1 : 0;
}

function 예약등록() {
  /* ⛔ 창을 안 띄운다 — powershell -WindowStyle Hidden 으로 node 를 부른다.
     ⛔ /it (대화형) 을 안 쓴다. 사장님이 로그인해 있지 않아도 돌아야 한다. */
  const 명령 = `powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Set-Location '${뿌리}'; node tools/ring-all-bells.mjs *>> '${path.join(뿌리, 'docs', '비상벨-돌린기록.log')}'"`;
  const 인자 = ['/create', '/tn', 작업이름, '/tr', 명령, '/sc', 'hourly', '/mo', '1', '/st', '00:40', '/f'];
  const r = spawnSync('schtasks', 인자, { encoding: 'utf8' });
  console.log((r.stdout || '') + (r.stderr || ''));
  if (r.status !== 0) {
    console.error(`🔴 예약을 못 걸었다(종료 ${r.status}) — 관리자 권한이 필요할 수 있다.`);
    console.error('   ⛔ 「걸었다」고 적지 않는다. 못 걸었으면 못 걸었다고 적는다.');
    return 1;
  }
  console.log(`✅ 매시 :40 에 돈다. 창은 안 뜬다. 뗄 때는 --예약해제`);
  return 0;
}

function 예약해제() {
  const r = spawnSync('schtasks', ['/delete', '/tn', 작업이름, '/f'], { encoding: 'utf8' });
  console.log((r.stdout || '') + (r.stderr || ''));
  return r.status === 0 ? 0 : 1;
}

const 인자 = process.argv.slice(2);
if (인자.includes('--예약등록')) process.exit(예약등록());
else if (인자.includes('--예약해제')) process.exit(예약해제());
else process.exit(요약낸다(다울린다()));
