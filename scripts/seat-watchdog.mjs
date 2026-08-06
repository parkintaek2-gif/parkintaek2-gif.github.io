#!/usr/bin/env node
/**
 * 자리 지킴이 — **여섯 창이 스물네 시간 살아 있게 한다.**
 *
 * ── 왜 만드는가 ─────────────────────────────────────────────────
 * 사장님(2026-08-07): 「3번이 손을 놓고 있니? **1~6번 모두 제대로 24시간 깨워 있게 조치해.**
 *   일이 얼마나 많은데」
 *
 * 3번은 손을 놓은 것이 아니라 **창이 닫혀 있었다.** 열여섯 시간 동안.
 * 그리고 창이 닫히면 그 창의 **매시 예약이 같이 죽는다** — 예약은 세션 안에만 산다(session-only).
 * 그래서 한 번 닫힌 자리는 **스스로 못 돌아온다.** 사람이 열어 줘야 한다. 그 자리를 없앤다.
 *
 * ── 무엇을 하나 ────────────────────────────────────────────────
 *   ① 자리마다 마지막 대화록을 찾아 **언제 마지막으로 살아 있었는지** 잰다
 *   ② 정한 시간(기본 40분)을 넘겨 조용하면 그 자리의 입구 단추를 **연다**
 *      단추가 번호를 심어 주고(CLAUDE_SEAT) 창이 열리면서 역할 카드를 읽는다
 *   ③ 한 일을 로그로 남긴다
 *
 * ⛔ 남의 세션에 `-p` 로 말을 걸지 않는다. 창을 여는 것까지가 지킴이 몫이고,
 *   무엇을 할지는 그 자리가 역할 카드와 세션간 메모를 보고 스스로 정한다.
 * ⛔ 창이 살아 있으면 **아무것도 하지 않는다.** 두 번 여는 것이 안 여는 것보다 나쁘다.
 *
 * 쓰는 법
 *   node scripts/seat-watchdog.mjs            재우지 않고 실제로 연다
 *   node scripts/seat-watchdog.mjs --dry      보기만 한다 (열지 않는다)
 *   node scripts/seat-watchdog.mjs --selftest 판정 규칙을 검산한다
 */

import { readFileSync, existsSync, readdirSync, statSync, appendFileSync, mkdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';

const 입구 = 'C:/Users/USER/Desktop/00_세션입구';
const 현재 = path.join(입구, '_현재');
const 로그 = path.join(현재, '지킴이.log');
const 대화록뿌리 = 'C:/Users/USER/.claude/projects';

const 단추 = {
  1: '1번_KLifeMap.cmd',
  2: '2번_조율.cmd',
  3: '3번_백년지도.cmd',
  4: '4번_KLifeMap보조.cmd',
  5: '5번_케이컬처와이어.cmd',
  6: '6번_서울마켓.cmd',
};

/** 조용한 지 얼마나 됐으면 죽은 것으로 보나 */
const 죽음판정분 = 40;

/** ⚠ 이 함수만 시험하면 판정은 시험된 것이다. 시각 계산을 밖에서 넣는다. */
export function 살았나(마지막밀리초, 지금밀리초, 한계분 = 죽음판정분) {
  if (!마지막밀리초) return { 살았다: false, 조용한분: null };  // 흔적을 못 찾았다 = 죽은 것으로 본다
  const 조용한분 = Math.round((지금밀리초 - 마지막밀리초) / 60000);
  return { 살았다: 조용한분 < 한계분, 조용한분 };
}

if (process.argv.includes('--selftest')) {
  const 지금 = 1_000_000_000_000;
  const 시험 = [
    [살았나(지금 - 5 * 60000, 지금).살았다, true, '5분 전이면 살아 있다'],
    [살았나(지금 - 39 * 60000, 지금).살았다, true, '39분 전이면 아직 살아 있다'],
    [살았나(지금 - 41 * 60000, 지금).살았다, false, '41분이면 죽은 것으로 본다'],
    [살았나(null, 지금).살았다, false, '흔적이 없으면 죽은 것으로 본다'],
    [살았나(지금 - 41 * 60000, 지금, 120).살았다, true, '한계를 늘리면 살아 있다'],
  ];
  const 틀림 = 시험.filter(([낸것, 답]) => 낸것 !== 답).map(([, , 이름]) => 이름);
  console.log(틀림.length ? `⛔ 자가시험 실패\n  ${틀림.join('\n  ')}` : `✅ 자리 지킴이 자가시험 ${시험.length}건 통과`);
  process.exit(틀림.length ? 1 : 0);
}

/** 그 자리의 세션 ID — 창이 스스로 적어 둔 것이 사실이다 */
function 자리ID(번호) {
  const p = path.join(현재, `${번호}.id`);
  if (existsSync(p)) return readFileSync(p, 'utf8').trim();
  return null;
}

/** 대화록 파일의 마지막 수정 시각. ID 를 알면 그 파일만, 모르면 못 잰다 */
function 마지막흔적(id) {
  if (!id) return null;
  for (const d of readdirSync(대화록뿌리, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const p = path.join(대화록뿌리, d.name, `${id}.jsonl`);
    if (existsSync(p)) return statSync(p).mtimeMs;
  }
  return null;
}

const 마른실행 = process.argv.includes('--dry');
const 지금 = Date.now();
const 찍기 = (s) => {
  console.log(s);
  try { mkdirSync(현재, { recursive: true }); appendFileSync(로그, `${new Date().toLocaleString('sv-SE')}  ${s}\n`, 'utf8'); } catch {}
};

for (const [번호, 파일] of Object.entries(단추)) {
  const id = 자리ID(번호);
  const { 살았다, 조용한분 } = 살았나(마지막흔적(id), 지금);

  if (살았다) { 찍기(`${번호}번 살아 있다 (${조용한분}분 전)`); continue; }

  const 상태 = id ? `${조용한분 ?? '?'}분째 조용하다` : '자기 ID 를 아직 안 적었다';
  if (마른실행) { 찍기(`${번호}번 ⚠ ${상태} — (--dry 라 열지 않았다)`); continue; }

  const 단추길 = path.join(입구, 파일);
  if (!existsSync(단추길)) { 찍기(`${번호}번 ⛔ 단추가 없다: ${단추길}`); continue; }

  // 창을 연다. 번호는 단추가 심고, 무엇을 할지는 역할 카드와 세션간 메모가 알려 준다.
  execFile('cmd.exe', ['/c', 'start', '', 단추길], { windowsHide: false }, () => {});
  찍기(`${번호}번 🔴 ${상태} — 창을 연다`);
}
