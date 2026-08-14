/**
 * **한국 시각으로 날짜를 적는다.**
 *
 * 🔴 2026-08-15 — 자료의 `generated` 가 **하루 앞서** 적혀 있었다.
 *   `new Date().toISOString()` 은 UTC 다. 한국 새벽 3시가 UTC 로는 전날 저녁이라,
 *   새벽에 지은 자료가 전날 것으로 적힌다.
 *
 *   ⛔ 이것은 **조용한 흠**이다. 자료 안에서는 아무도 못 알아본다.
 *     그런데 그 값이 **사이트맵 `lastmod` 로 나간다** — 검색엔진과 손님이 보는 날짜가
 *     하루 앞서게 된다. 새벽에 일하는 자리에서는 늘 어긋난다.
 *
 *   ⚠ 우리는 한국에서 일하고 한국 독자·검색엔진을 상대한다. 기준은 KST 다.
 *
 * 쓰는 법
 *   import { 오늘 } from './_kst.mjs';
 *   generated: 오늘(),
 */

/** KST 는 UTC+9. 고정 오프셋이라 서머타임이 없다 */
export const KST밀리 = 9 * 3600 * 1000;

/** `2026-08-15` */
export function 오늘(때 = Date.now()) {
  return new Date(때 + KST밀리).toISOString().slice(0, 10);
}

/** `2026-08-15T03:12` — 시각까지 남길 때 */
export function 지금(때 = Date.now()) {
  return `${new Date(때 + KST밀리).toISOString().slice(0, 16)}+09:00`;
}

/** UTC 로 적었을 때와 다른가. ⚠ 새벽 0~9시에만 다르다 */
export function 어긋나나(때 = Date.now()) {
  return 오늘(때) !== new Date(때).toISOString().slice(0, 10);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  /* 2026-08-14 20:00 UTC = 2026-08-15 05:00 KST */
  const 새벽 = Date.parse('2026-08-14T20:00:00Z');
  참('새벽엔 UTC 와 하루 다르다', 오늘(새벽) === '2026-08-15');
  참('그때 UTC 는 전날이다', new Date(새벽).toISOString().slice(0, 10) === '2026-08-14');
  참('어긋남을 알아본다', 어긋나나(새벽) === true);
  /* 2026-08-14 06:00 UTC = 2026-08-14 15:00 KST */
  const 낮 = Date.parse('2026-08-14T06:00:00Z');
  참('낮엔 UTC 와 같다', 오늘(낮) === '2026-08-14' && 어긋나나(낮) === false);
  참('꼴이 yyyy-mm-dd', /^\d{4}-\d{2}-\d{2}$/.test(오늘()));
  참('지금()은 시각과 +09:00 을 붙인다', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\+09:00$/.test(지금()));
  참('지금()도 새벽에 하루 앞서지 않는다', 지금(새벽).startsWith('2026-08-15T05:00'));
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}
