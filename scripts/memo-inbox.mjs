#!/usr/bin/env node
/**
 * **세션간 메모 받은편지함** — 나에게 온 것 중 **아직 답 안 한 것**만 보여 준다.
 *
 *   npm run inbox              나(2번)에게 온 미응답
 *   npm run inbox -- --all     전부 (응답한 것 포함)
 *   npm run inbox -- --me 3    3번 기준으로 본다
 *
 * ── 왜 만드나 ──────────────────────────────────────────────────
 * 사장님 지시(2026-08-04 20:0x KST): **「협업을 철저히 잘 해서 내가 안 나서게 좀 해라」**
 *
 * 오늘 사장님이 세 번 나서셨고 **셋 다 내가 메모를 안 읽고 움직인 탓**이다.
 *   ① 「KDI 키 두 개냐」 — 답이 3번 메모에 있었는데 `.env` 만 보고 답했다
 *   ② 3번 파일을 고치고 **24분 뒤에** 알렸다 — 그 사이 3번이 스스로 발견했다
 *   ③ 내 현황판의 틀린 KDI 주소를 확인 없이 넘겨 사장님을 헛걸음시켰다
 *
 * 원인은 하나다 — **`docs/세션간-메모.md` 가 5,000줄이 넘는데 나는 꼬리만 본다.**
 * 나에게 온 것이 중간에 끼면 영영 안 읽힌다.
 *
 * ⚠ **약속으로는 또 어긴다.** 그래서 기계로 만든다.
 *   `session-brief.mjs` 가 세션 시작마다 이걸 부른다.
 *
 * ── 판정 방법 ──────────────────────────────────────────────────
 * 머리말이 `[3번 → 2번]` · `3번 → 1번·2번` 꼴이다. 이걸 긁어서
 * **나에게 온 줄 뒤에 내가 쓴 줄이 있으면 「답함」**, 없으면 「미응답」으로 본다.
 * 완벽하지 않다 — 답을 다른 곳에 썼을 수도 있다. 그래도 **안 보는 것보다 낫다.**
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 메모경로 = path.resolve('docs/세션간-메모.md');

/** `[3번 → 2번]` · `3번 → 1번·2번` · `3번(100yearsmap) → 2번` 을 다 잡는다 */
const 머리말 = /^#{1,3}\s*(.*?)(\d)\s*번[^→\n]*?(?:→|->)\s*([^\n]*)$/;

export function 훑기(본문) {
  const 줄들 = 본문.split('\n');
  const 목록 = [];
  for (let i = 0; i < 줄들.length; i++) {
    const l = 줄들[i];
    if (!l.startsWith('#')) continue;
    const m = l.match(머리말);
    if (!m) continue;
    const 보낸이 = m[2];
    /* 받는 쪽에 여러 번호가 올 수 있다 — 「1번·2번」 */
    const 받는이 = [...m[3].matchAll(/(\d)\s*번/g)].map((x) => x[1]);
    if (!받는이.length) continue;
    const 날짜 = (l.match(/(\d{4}-\d{2}-\d{2})[^)]*?(\d{2}:\d{2})?/) || [])[0] ?? '';
    목록.push({
      줄: i + 1,
      보낸이,
      받는이,
      날짜,
      제목: l.replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 96),
    });
  }
  return 목록;
}

/**
 * 나에게 온 것 중 **그 뒤에 내가 쓴 것이 없는 것**을 고른다.
 * ⚠ 「내가 쓴 것」은 받는이를 안 따진다 — 어디에 답했든 그 뒤엔 읽었다고 본다.
 */
export function 미응답(목록, 나) {
  const 내가쓴줄 = 목록.filter((x) => x.보낸이 === 나).map((x) => x.줄);
  const 마지막내글 = 내가쓴줄.length ? Math.max(...내가쓴줄) : 0;
  return 목록.filter((x) => x.받는이.includes(나) && x.보낸이 !== 나 && x.줄 > 마지막내글);
}

export function 만들기(본문, 나 = '2', 전부 = false) {
  const 목록 = 훑기(본문);
  const 온것 = 목록.filter((x) => x.받는이.includes(나) && x.보낸이 !== 나);
  const 안읽은 = 미응답(목록, 나);
  const 줄 = [];

  if (안읽은.length) {
    줄.push(`🔴 **${나}번에게 온 것 중 아직 답 안 한 것 ${안읽은.length}건** — 이것부터 본다`);
    for (const x of 안읽은) 줄.push(`   ${String(x.줄).padStart(5)}줄  ${x.제목}`);
  } else {
    줄.push(`✅ ${나}번 앞으로 온 것에 전부 답했다 (받은 것 ${온것.length}건)`);
  }

  if (전부) {
    줄.push('', `— 전체 ${목록.length}건 —`);
    for (const x of 목록) {
      const 표 = x.받는이.includes(나) ? (안읽은.includes(x) ? '🔴' : '  ') : '· ';
      줄.push(`${표} ${String(x.줄).padStart(5)}줄  ${x.보낸이}→${x.받는이.join(',')}  ${x.제목.slice(0, 70)}`);
    }
  }
  return 줄.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const 나 = (argv.find((a) => a.startsWith('--me')) ? argv[argv.indexOf('--me') + 1] : '2') ?? '2';
  if (!existsSync(메모경로)) { console.log('세션간-메모.md 가 없다.'); return; }
  console.log(만들기(readFileSync(메모경로, 'utf8'), 나, argv.includes('--all')));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
