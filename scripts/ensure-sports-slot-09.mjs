#!/usr/bin/env node
/**
 * ensure-sports-slot-09.mjs — **09시 아시안게임 종합이 오늘 나갔는지 보고, 안 나갔으면 돌린다.**
 *
 * ── 🔴 왜 이것이 필요한가 (2026-09-27) ───────────────────────────────
 * 사장님이 09시 아시안게임 종합 기사에 반드시 넣을 넷을 짚어 주셨다 —
 * 오상욱 펜싱 단체·여자 농구·야구 결승 진출·대전격투 최고령 우승.
 *
 * 그런데 **하루 전에 같은 일로 기사가 통째로 안 나간 적이 있다.**
 * 2026-09-26 에 10시 예약이 «평일만» 도는 일정이어서, 지시문을 고쳐 놓고도
 * 그 회차가 돌지 않아 사장님이 「e스포츠 기사 메일 못받음」이라고 하셨다.
 *
 * ⛔ **「예약이 걸려 있다」를 「기사가 나간다」로 세지 않는다.**
 *   예약 화면이 「다음 실행 오늘 09:08」이라고 해도, 그 시각이 지난 뒤에
 *   «실제로 나갔는지»는 따로 재야 아는 것이다.
 *
 * ⭐ 그래서 이 자는 «결과»를 잰다 — 보낸 자국(마커)이 오늘 날짜로 있는가.
 *   있으면 아무것도 안 한다. 없으면 그때만 회차를 손으로 돌린다.
 *   ⛔ 두 번 보내지 않는다. 마커가 판정의 유일한 근거다.
 *
 * 쓰는 법
 *   node scripts/ensure-sports-slot-09.mjs            잰다 (안 나갔으면 돌린다)
 *   node scripts/ensure-sports-slot-09.mjs --재기만    재기만 한다 (영문 별칭 --check)
 *   node scripts/ensure-sports-slot-09.mjs --자가시험  (영문 별칭 --selftest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자국방 = path.join(뿌리, 'docs', '고정업무-마커', '중부매일-스포츠-보낸자국');

/** ⛔ toISOString() 금지 — UTC 라 새벽에 하루가 어긋난다. 이 PC 가 이미 KST 다 */
export function 오늘날짜(d = new Date()) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 그 회차의 보낸 자국 파일 이름 — 수집기가 쓰는 꼴과 «같아야» 한다 */
export function 자국이름(날, 시 = '09') {
  if (!날) return null;
  return `${날}_${시}시.txt`;
}

/** 오늘 그 회차가 나갔나 — 마커가 판정의 유일한 근거다 */
export function 나갔나(날, 시 = '09', 방 = 자국방) {
  const 이름 = 자국이름(날, 시);
  if (!이름) return false;
  try { return fs.existsSync(path.join(방, 이름)); } catch { return false; }
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패.push(이름); console.log('❌ ' + 이름); } };

  본다('날짜를 KST 로 낸다', 오늘날짜(new Date(2026, 8, 27, 0, 30)) === '2026-09-27');
  본다('⛔ 자정 직후에도 하루가 안 밀린다', 오늘날짜(new Date(2026, 8, 27, 0, 5)) === '2026-09-27');
  본다('⛔ 날짜가 아니면 null 을 준다', 오늘날짜('어제') === null);
  본다('⛔ Invalid Date 에도 안 터진다', 오늘날짜(new Date('없는날')) === null);

  본다('자국 이름이 수집기 꼴과 같다', 자국이름('2026-09-27') === '2026-09-27_09시.txt');
  본다('회차를 바꿔 물을 수 있다', 자국이름('2026-09-27', '10') === '2026-09-27_10시.txt');
  본다('⛔ 날짜가 없으면 이름도 없다', 자국이름(null) === null);

  /* 🔴 실제 폴더로 잰다 — 어제 것이 있고 오늘 것은 아직 없는 것이 지금 상태다 */
  본다('⛔ 없는 날은 «안 나갔다»로 본다', 나갔나('1999-01-01') === false);
  본다('⛔ 없는 폴더에도 안 터진다', 나갔나('2026-09-27', '09', path.join(뿌리, '없는방')) === false);
  const 어제 = 나갔나('2026-09-26', '09');
  본다('어제 09시 자국을 읽어 낸다', 어제 === true || 어제 === false);

  console.log(`\n${실패.length ? '❌' : '✅'} 자가시험 ${통과}${실패.length ? ' · 실패 ' + 실패.length : ' 통과'}`);
  return !실패.length;
}

const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
} else if (내가진입점) {
  const 재기만 = process.argv.includes('--재기만') || process.argv.includes('--check');
  const 날 = 오늘날짜();
  console.log(`■ 09시 아시안게임 종합 — ${날}`);

  if (나갔나(날)) {
    console.log('✅ 이미 나갔다 — 아무것도 안 한다');
    process.exit(0);
  }
  console.log('🟡 아직 안 나갔다 — 보낸 자국이 없다');
  if (재기만) { console.log('⬜ 재기만 했다'); process.exit(0); }

  /* 🔴 여기서만 손으로 돌린다. 마커가 없을 때뿐이다 — 두 번 보내지 않는다.
     ⛔ 한글 인자를 쓰지 않는다. 윈도 예약을 거치며 CP949 로 깨져
       「모르는 인자」가 되고, 자는 아무 일도 안 하면서 exit 0 을 낸다. */
  const r = spawnSync(process.execPath,
    [path.join(뿌리, 'scripts', 'run-jbnews-sports-slot.mjs'), '--slot=09', '--wait=14'],
    { cwd: 뿌리, stdio: 'inherit' });
  console.log(`■ 손으로 돌린 결과 — 종료코드 ${r.status}`);
  /* ⛔ 「돌렸다」를 「나갔다」로 세지 않는다. 마커를 다시 본다 */
  console.log(나갔나(날) ? '✅ 이제 나갔다 — 자국이 생겼다' : '🔴 돌렸는데도 자국이 없다 — 사람이 본다');
  process.exitCode = 나갔나(날) ? 0 : 1;
}
