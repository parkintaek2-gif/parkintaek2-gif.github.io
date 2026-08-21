/**
 * 라이브재기.mjs — **우리가 우리 사이트를 잴 때 쓰는 fetch.**
 *
 * 🔴 왜 만들었나 (2026-08-21 · 3번)
 * ─────────────────────────────────────────────────────────────────
 * 사장님께 「7일에 하루 1,081명」이라 적으려다 그 수를 못 믿게 됐다. 까닭은 이것이다 —
 *
 *   node 내장 fetch 가 보내는 user-agent 는 그냥 **"node"** 다.
 *   봇을 걸러내는 자(`src/lib/traffic.mjs` 의 봇패턴)에는 `node-fetch` 는 있는데
 *   **`node` 단독은 없다.** 그래서 안 걸린다.
 *
 *   ⇒ 내가 오늘 라이브 200 을 수십 번 쟀고 7번·2번도 같은 방법으로 잰다.
 *     **그것이 전부 「사람」으로 세어졌다.** 유입 경로 「(직접) 14,363」의 큰 부분이 우리다.
 *
 * ⛔ 내 손이 만든 수를 손님으로 세면 그 통계는 거짓이다. 목표가 「하루 1,000명」인데
 *    내가 재는 것으로 그 수를 채우면 아무 뜻이 없다.
 *
 * ── 어떻게 고치나 ──────────────────────────────────────────────
 * 봇패턴에 이미 `monitor` 가 있다. 그래서 **UA 에 그 낱말을 넣는다.**
 * 공용 부품(traffic.mjs)을 안 건드리고 **재는 쪽만** 고치는 것이다 — 그것이 내 집이다.
 *
 * ⭐ 그리고 이 자를 쓰면 통계에서 빠지는 것이 **눈에 보인다.** UA 에 적혀 있다.
 *    남이 나중에 「이 수는 왜 이렇게 세나」 물으면 UA 한 줄이 답이 된다.
 *
 * ── 쓰는 법 ────────────────────────────────────────────────────
 *   import { 재기 } from './lib/라이브재기.mjs';
 *   const r = await 재기('https://100yearmap.com/care');
 *   console.log(r.status);
 *
 *   node -e 로 즉석에서 잴 때도 이것을 쓴다 —
 *   node --input-type=module -e "import('./scripts/lib/라이브재기.mjs').then(async m=>{ … })"
 *
 * 자가시험  node scripts/lib/라이브재기.mjs --selftest
 */
import path from 'node:path';

/**
 * ⭐ 이 UA 의 `monitor` 가 통계에서 우리를 빼 준다.
 * ⛔ 이 낱말을 지우면 우리 검사가 다시 「사람」으로 세어진다. 지우지 않는다.
 *
 * ⛔⛔ **한글을 넣지 않는다.** HTTP 헤더는 ByteString(latin-1)만 실린다 —
 *   한글을 넣으면 fetch 가 「Cannot convert argument to a ByteString」으로 던지고
 *   **재기가 통째로 실패한다.** 8/21 에 60장을 재려다 60장 다 실패했다.
 *   그래서 까닭은 영문으로 적는다.
 */
export const 재는이UA = '100yearmap-selfcheck-monitor/1.0 (+self-check, not a visitor)';

/** traffic.mjs 의 봇패턴 — ⛔ 두 벌로 적는 것이 아니라 «내 UA 가 걸리나»를 여기서 시험하려고 둔다 */
export const 봇패턴 = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|curl|wget|python-requests|node-fetch|axios|go-http|monitor|uptime|pingdom/i;

/** 통계에서 빠지나 — 이 자의 존재 이유를 스스로 검사한다 */
export const 통계에서빠지나 = (ua = 재는이UA) => 봇패턴.test(String(ua));

/**
 * 우리 사이트를 잰다. 다른 것은 평소 fetch 와 같다.
 * @param {string} 주소
 * @param {RequestInit} [옵션]
 */
export async function 재기(주소, 옵션 = {}) {
  const 머리 = { ...(옵션.headers ?? {}), 'user-agent': 재는이UA };
  return fetch(주소, { ...옵션, headers: 머리 });
}

/** 여러 장을 차례로 잰다 — 한꺼번에 때리지 않는다(우리 서버다) */
export async function 여러장(주소들, 옵션 = {}) {
  const 낸다 = [];
  for (const u of 주소들) {
    try {
      const r = await 재기(u, 옵션);
      낸다.push({ 주소: u, 상태: r.status, 크기: Number(r.headers.get('content-length')) || null, 잰것: r });
    } catch (e) {
      낸다.push({ 주소: u, 상태: null, 까닭: String(e.message).slice(0, 80) });
    }
  }
  return 낸다;
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === '라이브재기.mjs';
if (내가직접불렸나 && process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① ⭐ 이 UA 는 통계에서 빠진다 — 이 자의 존재 이유다', 통계에서빠지나());
  본다('② ⛔ node 기본 UA 는 안 빠진다 — 그것이 오늘의 문제였다', !통계에서빠지나('node'));
  본다('③ ⛔ 빈 UA 도 안 빠진다', !통계에서빠지나(''));
  본다('④ UA 에 「monitor」가 들어 있다 — 지우면 ①이 깨진다', 재는이UA.includes('monitor'));
  본다('⑤ UA 에 왜 그런지가 적혀 있다', 재는이UA.includes('not a visitor'));
  /* 🔴 8/21 에 실제로 60장을 다 놓친 자리 — 한글이 들어가면 fetch 가 던진다 */
  본다('⑥ ⛔ UA 가 latin-1 로만 되어 있다 — 한글이 들어가면 재기가 통째로 실패한다',
    // eslint-disable-next-line no-control-regex
    /^[\x20-\x7E]+$/.test(재는이UA));
  본다('⑦ ⛔ 진짜로 헤더에 실리나 — 던지지 않는지 본다', (() => {
    try { new Headers({ 'user-agent': 재는이UA }); return true; } catch { return false; }
  })());
  process.exit();
}
