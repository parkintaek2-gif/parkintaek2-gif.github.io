/**
 * dist-ready.mjs — **「지금 dist 를 재도 되나」를 한 자리에서 판정한다.**
 *
 * ── 왜 (2026-08-29) ───────────────────────────────────────────
 * 오늘 하루에 **세 번** 빌드 도중에 dist 를 쟀다. 그때마다 자가 이렇게 답했다 —
 * ```
 *   「사이트맵에 없는 지면 1,300장」   ← 사이트맵 파일이 «아직 안 써진» 것이었다
 *   「지면 102장」                     ← 2,715장 중 102장까지 써진 순간이었다
 *   「netflix-korea-this-week 없음」   ← 아직 그 지면 차례가 안 온 것이었다
 * ```
 * ⛔ 셋 다 **거짓 빨강**이다. 그리고 더 나쁜 쪽도 있다 — 빌드 «직후»에 재면 옛 dist 가
 *   남아 있어 **거짓 초록**이 나온다. 어느 쪽이든 자가 거짓말을 한다.
 *
 * 🔴 실제로 하마터면 「가장 큰 검색 수요에 답하는 지면이 사이트맵에 빠져 있다」는
 *   틀린 발견을 사장님께 올릴 뻔했다. 소스를 열어 보니 «있었다».
 *
 * ── 그래서 규칙 ───────────────────────────────────────────────
 * ⛔ dist 를 읽는 자는 **먼저 이것을 부른다.** 「덜 지어졌다」면 재지 않고 «못 쟀다»고 적는다.
 * ⛔ 「못 쟀다」를 «통과»로도 «실패»로도 적지 않는다. 셋째 칸이다.
 * ⚠ 이 자는 «빌드가 도는지»를 알 수 없다. 아는 것은 **dist 가 온전해 보이나**뿐이다.
 *   그것으로 충분하다 — 덜 지어진 dist 는 재면 안 되는 것이 빌드 중이든 아니든 같다.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * 온전한 dist 라면 이만큼은 있어야 한다.
 * ⚠ 손으로 적은 수다. 지면이 크게 줄면 여기도 내려야 한다 — 안 내리면 늘 「못 쟀다」가 된다.
 *   ⛔ 반대로 이 수를 «지면 수에 맞춰 자동으로» 잡으면 안 된다. 그러면 덜 지어진 dist 도
 *     제 기준을 스스로 만족시켜 버린다.
 */
export const 최소지면 = 2000;

/** 온전한 dist 에 반드시 있는 파일들 */
export const 있어야할것 = [
  'wikitip/sitemap.xml',
  'wikitip/index.html',
];

/**
 * dist 가 잴 만한가.
 * @returns {{잴수있나: boolean, 까닭: string|null, 지면수: number|null}}
 */
export function dist상태(뿌리, 읽기 = fs) {
  const dist = path.join(뿌리, 'dist');
  if (!읽기.existsSync(dist)) {
    return { 잴수있나: false, 까닭: 'dist 가 없다 — 아직 한 번도 안 지었다', 지면수: null };
  }
  for (const 것 of 있어야할것) {
    if (!읽기.existsSync(path.join(dist, 것))) {
      return { 잴수있나: false, 까닭: `dist/${것} 이 없다 — 덜 지어졌다(빌드 중일 수 있다)`, 지면수: null };
    }
  }
  let 수 = 0;
  const 세기 = (방) => {
    let 것들;
    try { 것들 = 읽기.readdirSync(방, { withFileTypes: true }); } catch { return; }
    for (const e of 것들) {
      if (e.isDirectory()) 세기(path.join(방, e.name));
      else if (e.name.endsWith('.html')) 수 += 1;
    }
  };
  세기(path.join(dist, 'wikitip'));
  if (수 < 최소지면) {
    return {
      잴수있나: false,
      까닭: `dist/wikitip 에 지면이 ${수}장뿐이다(온전하면 ${최소지면}장 넘는다) — 덜 지어졌다`,
      지면수: 수,
    };
  }
  return { 잴수있나: true, 까닭: null, 지면수: 수 };
}

/**
 * 잴 수 없으면 «못 쟀다»고 적고 멈춘다. 자마다 같은 말을 쓰게 한 자리에 둔다.
 * ⛔ process.exit(1) 로 «실패»처럼 끝내지 않는다 — 못 잰 것은 깨진 것이 아니다.
 */
export function 못재면멈춘다(뿌리, 자이름, 적기 = console.log, 끝내기 = process.exit) {
  const s = dist상태(뿌리);
  if (s.잴수있나) return s;
  적기(`⬜ ${자이름} — 못 쟀다. ${s.까닭}`);
  적기('   ⛔ 이것은 「통과」도 「실패」도 아니다. 빌드가 끝난 뒤 다시 돌린다.');
  끝내기(0);
  return s;
}
