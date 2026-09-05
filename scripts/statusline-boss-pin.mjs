#!/usr/bin/env node
// [2026-08-29 지시] "터미널(SessionStart/statusLine) — 사장님 지시 이력 상시 고정. 똑같이 만들어"
// 1번(klifemap)이 만든 것과 같은 자를 6번(dataeconomics)에도 둔다.
// 터미널 맨 아래 상태줄에 항상 뜬다 — 상태줄은 매 턴 다시 그려지므로 "바로 확인"에 맞다.
// 목록은 docs/고정-지시-목록.md 한 곳 — 사장님이 "N번 고정해제"라 하면 그 줄을 지운다.
//
// ── 🔴 [2026-09-03] 사장님: 「숫자 겹쳐서 안보여」 ─────────────────────────
// 까닭은 이 자가 **파일의 «모든 줄»을 상태줄에 그대로 뿌렸기** 때문이다.
// 그날 내가 여러 줄짜리 항목(3-b·3-c·3-d)을 넣자 상태줄이 59줄이 되어 서로 겹쳤다.
//
// ⛔ 상태줄은 «몇 줄 안 되는 자리»다. 여기에 본문을 쏟지 않는다.
// ✅ 그래서 이 자는 **항목의 «머리줄»만** 낸다 — `1.` `3-c.` 처럼 번호로 시작하는 줄.
//    들여쓴 이어지는 줄(설명·원문 인용)은 파일에 그대로 두고 상태줄에서만 뺀다.
// ✅ 한 항목은 «한 줄»로 자른다. 줄이 접히면 그것이 곧 겹침이다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 목록길 = path.join(__dirname, '..', 'docs', '고정-지시-목록.md');

/** 항목의 머리줄인가 — `1.` `3-a.` 처럼 번호로 시작하고 «들여쓰지 않은» 줄 */
export function 머리줄인가(줄) {
  const s = String(줄 ?? '');
  if (s.startsWith(' ') || s.startsWith('\t')) return false;   /* 들여쓴 것은 이어지는 줄이다 */
  return /^[0-9]+(-[a-z])?[.]\s/.test(s.trimEnd());
}

/**
 * 상태줄 한 줄로 다듬는다.
 * ⛔ 글자 수가 아니라 **터미널 칸 수**로 자른다 — 한글은 두 칸을 먹는다.
 *   글자 수로 자르면 한글 항목만 넘쳐서 접히고, 접힌 줄이 겹쳐 보인다.
 */
export function 칸너비(글) {
  let n = 0;
  for (const c of String(글 ?? '')) {
    const u = c.codePointAt(0);
    const 넓다 = (u >= 0x1100 && u <= 0x115f) || (u >= 0x2e80 && u <= 0xa4cf)
      || (u >= 0xac00 && u <= 0xd7a3) || (u >= 0xf900 && u <= 0xfaff)
      || (u >= 0xfe30 && u <= 0xfe6f) || (u >= 0xff00 && u <= 0xff60)
      || (u >= 0x1f300 && u <= 0x1faff);
    n += 넓다 ? 2 : 1;
  }
  return n;
}

export function 한줄로(글, 칸 = 150) {
  /* 굵게·인용부호 같은 장식을 뗀다 — 상태줄에서는 읽는 데 방해만 된다 */
  let s = String(글 ?? '').split('**').join('').split('`').join('');
  s = [...s].map((c) => (c.charCodeAt(0) <= 32 ? ' ' : c)).join('');
  s = s.split(' ').filter(Boolean).join(' ').trim();
  if (칸너비(s) <= 칸) return s;
  let 잘린 = '';
  for (const c of s) {
    if (칸너비(잘린 + c) > 칸 - 1) break;
    잘린 += c;
  }
  return 잘린 + '…';
}

function 읽기() {
  try {
    return fs.readFileSync(목록길, 'utf8').split('\n');
  } catch {
    return null;
  }
}

const 원줄 = 읽기();
if (!원줄) {
  console.log('📌 고정 지시 없음 (docs/고정-지시-목록.md 없음)');
} else {
  const 항목 = 원줄.filter((l) => !l.trimStart().startsWith('#')).filter(머리줄인가);
  if (!항목.length) {
    console.log('📌 고정 지시 없음');
  } else {
    /**
     * 🔴 [2026-09-05] 사장님이 **두 번** 말씀하셨다 —
     *   「고정지시 12건 중 **2~3개만** 노출하면 안되냐? **화면의 절반을 차지해** 내가 약간 불편해」
     *   「이것 중 **화면의 1/4 정도만** 차지하게 해라」 · 「아래 고정 지시 화면 크기 줄이라니까」
     *
     * ⛔ 나는 첫 말씀 때 «내 답변 끝의 칸»만 줄이고 **이 상태줄을 안 고쳤다.**
     *   사장님이 보시는 것은 이 자가 그리는 열세 줄이었다. 그래서 두 번 더 말씀하셨다.
     * ⚠ 지시를 받으면 **사장님이 실제로 보시는 화면**이 어디서 나오는지부터 찾는다.
     *
     * ✅ 그래서 «맨 앞 셋»만 낸다. 나머지는 파일에 그대로 있고, 수로 몇 건인지 알린다.
     *   앞자리가 가장 최근·가장 중한 것이므로 자르는 자리는 뒤쪽이다.
     */
    /* 🔴 [2026-09-05] 사장님이 세 번 말씀하셨다. 마지막이 「아래 **1/5로 더** 줄여줘」다.
       열세 줄 → 다섯 줄 → **한 줄**. 상태줄은 «있다는 것만 알리는» 자리로 둔다.
       ⛔ 내용을 여기서 읽게 하지 않는다. 읽을 곳은 파일이다. */
    console.log(`📌 고정지시 ${항목.length}건 · ${한줄로(항목[0], 78)} … docs/고정-지시-목록.md`);
  }
}
