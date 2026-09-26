#!/usr/bin/env node
/**
 * check-session-entry.mjs — **세션입구 단추가 «실제로 그 자리를 여는가»를 잰다.**
 *
 * 🔴 사장님 지시 (2026-09-27): 「**세션입구가 제대로 작동하는 지 꼭 테스트해봐**」
 *
 * ── 왜 검사로 두나 ──────────────────────────────────────────────
 * 한 번 손으로 눌러 보는 것으로는 다음 달에 또 어긋난다. 실제로 오늘 아침 —
 *   ① 바탕화면 단추가 **통째로 사라져** 있었다 (`_현재` 폴더만 남아 있었다)
 *   ② 백업 단추에는 `CLAUDE_CONFIG_DIR` 이 없었다 — 그대로 눌렀으면 기본 `.claude` 가
 *      열려 **그 자리의 대화가 없는 빈 창**이 떴을 것이다
 *   ③ 마지막 수단인 세션ID 찾기가 **남의 자리 ID 를 주고 있었다** —
 *      1번을 물으면 2번을, 2번을 물으면 5번을 주었다
 *
 * ⛔ ③ 은 사장님이 단추를 누르셨을 때 «남의 세션»이 열리는 사고다. 눌러 보기 전에는
 *   아무도 몰랐다. 그러니 사람의 기억이 아니라 자가 잰다.
 *
 * ⚠ 이 자는 창을 «열지 않는다». 열지 않고 잴 수 있는 것만 잰다 —
 *   단추가 있나 · 무엇을 심나 · 그 대화록이 실재하나 · 자리마다 다른 것을 가리키나.
 *
 * 쓰는 법
 *   node scripts/check-session-entry.mjs
 *   node scripts/check-session-entry.mjs --자가시험   (영문 별칭 --selftest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 도는자리, 쉬는자리, 자리번호, 설정폴더, 대화록뿌리 } from './lib/seats.mjs';

export const 입구 = 'C:\\Users\\USER\\Desktop\\00_세션입구';
export const 현재방 = path.join(입구, '_현재');

/** 단추 글에서 심는 설정폴더를 읽는다 */
export function 단추가심는폴더(글) {
  const m = String(글 ?? '').match(/^set\s+CLAUDE_CONFIG_DIR=(.+?)\s*$/m);
  return m ? m[1] : null;
}

/** 단추 글에서 심는 자리 번호를 읽는다 */
export function 단추가심는번호(글) {
  const m = String(글 ?? '').match(/^set\s+CLAUDE_SEAT=(\d+)\s*$/m);
  return m ? m[1] : null;
}

/** 창이 스스로 적어 둔 세션 ID */
export function 창이적은ID(번호, 방 = 현재방) {
  try {
    const s = fs.readFileSync(path.join(방, `${번호}.id`), 'utf8').trim();
    return /^[0-9a-f-]{36}$/.test(s) ? s : null;
  } catch { return null; }
}

/** 그 ID 의 대화록이 «그 자리 폴더 안»에 실재하나 */
export function 대화록있나(번호, id) {
  if (!id) return false;
  const 방 = 대화록뿌리(번호);
  if (!fs.existsSync(방)) return false;
  for (const 함 of fs.readdirSync(방, { withFileTypes: true })) {
    if (!함.isDirectory()) continue;
    if (fs.existsSync(path.join(방, 함.name, `${id}.jsonl`))) return true;
  }
  return false;
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패.push(이름); console.log('❌ ' + 이름); } };

  본다('단추에서 설정폴더를 읽는다',
    단추가심는폴더('@echo off\r\nset CLAUDE_CONFIG_DIR=C:\\Users\\USER\\.claude-u5\r\n') === 'C:\\Users\\USER\\.claude-u5');
  본다('⛔ 없으면 null 이다', 단추가심는폴더('@echo off') === null);
  본다('⛔ 빈 것·null 에도 안 터진다', 단추가심는폴더(null) === null && 단추가심는번호(null) === null);
  본다('단추에서 자리 번호를 읽는다', 단추가심는번호('set CLAUDE_SEAT=2\r\n') === '2');
  /* ⚠ 주석 줄에 든 말을 설정으로 읽으면 안 된다 */
  본다('⛔ 주석에 적힌 것을 설정으로 읽지 않는다',
    단추가심는폴더('REM set CLAUDE_CONFIG_DIR=엉뚱한곳\r\nset CLAUDE_CONFIG_DIR=진짜\r\n') === '진짜');
  본다('⛔ 없는 자리의 ID 는 null', 창이적은ID(99) === null);
  본다('⛔ 없는 대화록은 false', 대화록있나(5, '00000000-0000-0000-0000-000000000000') === false);
  본다('⛔ id 가 없으면 false', 대화록있나(5, null) === false);

  console.log(`\n${실패.length ? '❌' : '✅'} 자가시험 ${통과}${실패.length ? ' · 실패 ' + 실패.length : ' 통과'}`);
  return !실패.length;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
} else if (내가진입점) {
  const 흠 = [];
  console.log(`■ 세션입구 검사 — 도는 자리 ${자리번호.join('·')}번`);

  if (!fs.existsSync(입구)) {
    console.log(`🔴 입구 폴더가 없다 — ${입구}`);
    console.log('   ⇒ node scripts/build-session-entry.mjs --짓는다');
    process.exit(1);
  }

  const 본ID = new Map();
  for (const n of 자리번호) {
    const 이름 = 도는자리[n];
    const 길 = path.join(입구, 이름);
    if (!fs.existsSync(길)) { 흠.push(`${n}번 단추가 없다 — ${이름}`); console.log(`  🔴 ${n}번 — 단추가 없다`); continue; }
    const 글 = fs.readFileSync(길, 'utf8');

    const 심는번호 = 단추가심는번호(글);
    const 심는폴더 = 단추가심는폴더(글);
    const 맞는폴더 = 설정폴더(n);
    const id = 창이적은ID(n);
    const 실재 = 대화록있나(n, id);

    if (심는번호 !== String(n)) 흠.push(`${n}번 단추가 심는 번호가 ${심는번호} 다`);
    /* 🔴 이것이 없으면 기본 .claude 가 열려 «빈 창»이 뜬다 — 2026-08 에 나흘치를 잃었다 */
    if (!심는폴더) 흠.push(`${n}번 단추에 CLAUDE_CONFIG_DIR 이 없다 — 누르면 빈 창이 열린다`);
    else if (심는폴더 !== 맞는폴더) 흠.push(`${n}번 단추가 ${심는폴더} 를 심는다 (맞는 것은 ${맞는폴더})`);
    /* ⛔ 박아 둔 ID 는 한 달 뒤 죽는다 */
    if (/--resume\s+[0-9a-f]{8}-/.test(글)) 흠.push(`${n}번 단추에 세션 ID 가 박혀 있다 — 낡으면 죽은 ID 로 연다`);
    if (!id) 흠.push(`${n}번 — 창이 적어 둔 ID 가 없다 (_현재\\${n}.id)`);
    else if (!실재) 흠.push(`${n}번 — 그 ID 의 대화록이 .claude-u${n} 에 없다`);
    else 본ID.set(n, id);

    console.log(`  ${심는폴더 === 맞는폴더 && 실재 ? '✅' : '🔴'} ${n}번  seat=${심는번호}  dir=${심는폴더 ?? '없다'}  id=${id ? id.slice(0, 8) + '…' : '없다'}${실재 ? '' : ' (대화록 없다)'}`);
  }

  /* 🔴 자리마다 «다른» 세션을 가리켜야 한다 — 같으면 남의 창을 여는 것이다 */
  const ids = [...본ID.values()];
  if (ids.length !== new Set(ids).size) 흠.push('두 자리가 «같은» 세션을 가리킨다 — 남의 창이 열린다');

  /* ⛔ 쉬는 자리 단추가 남아 있으면 사장님이 그것을 누르신다 */
  for (const [n, 이름] of Object.entries(쉬는자리)) {
    if (fs.existsSync(path.join(입구, 이름))) 흠.push(`쉬는 자리 ${n}번 단추가 남아 있다 — ${이름}`);
  }
  if (fs.existsSync(path.join(입구, '0_여섯창_한번에.cmd'))) 흠.push('옛 「여섯창 한 번에」가 남아 있다');

  /* 마지막 수단이 살아 있나 */
  if (!fs.existsSync(path.join(입구, '_세션ID-찾기.mjs'))) 흠.push('_세션ID-찾기.mjs 가 없다 — 단추가 못 열었을 때 기댈 곳이 없다');

  if (!흠.length) {
    console.log(`\n✅ 세션입구가 제대로 선다 — ${자리번호.length}자리가 저마다 제 폴더·제 대화를 연다`);
    process.exit(0);
  }
  console.log(`\n🔴 흠 ${흠.length}개`);
  for (const s of 흠) console.log(`   · ${s}`);
  console.log('\n   ⇒ 고치는 법: node scripts/build-session-entry.mjs --짓는다');
  process.exit(1);
}
