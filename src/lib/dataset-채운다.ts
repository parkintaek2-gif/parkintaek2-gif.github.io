/**
 * dataset-채운다.ts — **내보내기 직전에 Dataset 에 빠진 칸을 채운다.**
 *
 * ── 🔴 왜 한 곳에서 하나 (2026-10-05 23:0x · 5번) ─────────────────────
 *   사장님이 넘겨 주신 구글 메일로 재 보니 Dataset 를 내는 파일이 **232개**인데
 *   `license` 가 179파일, `url` 이 208파일 빠져 있었다.
 *   ⛔ 232 파일을 손으로 고치면 **다음에 새로 만든 지면이 또 빠진다.**
 *   ⭐ 세 레이아웃(Base·HundredYear·WikiTip)이 모두 `jsonLd` 를 한 줄에서 내보낸다.
 *     거기서 채우면 **지금 것도 앞으로 것도 다 채워진다.**
 *
 * ── ⛔ 이 자가 «안» 하는 것 ──────────────────────────────────────────
 *   **이미 있는 값을 덮지 않는다.** 지면이 자기 license·url 을 적었으면 그것이 맞다.
 *   **없는 것을 지어내지 않는다** — url 은 그 지면의 진짜 주소를 받아야만 넣는다.
 *   ⚠ 틀린 url 을 넣으면 구글이 **다른 지면을 정본으로** 고를 수 있다. 비우는 편이 낫다.
 *
 * ── ⚠ 생김새가 셋이다 ────────────────────────────────────────────────
 *   ① 한 덩이        `{ '@type': 'Dataset', … }`
 *   ② `@graph` 배열   `{ '@graph': [ {Dataset}, {FAQPage} ] }`
 *   ③ 배열 그 자체     `[ {Dataset}, … ]`
 *   셋 다 받는다. 하나만 받으면 나머지가 조용히 안 채워진다.
 */

import { 약관주소, type 사이트딱지 } from './dataset-license';

/** 그 덩이가 Dataset 인가 */
function 데이터세트인가(것: unknown): boolean {
  if (!것 || typeof 것 !== 'object') return false;
  const t = (것 as Record<string, unknown>)['@type'];
  if (typeof t === 'string') return t === 'Dataset';
  if (Array.isArray(t)) return t.includes('Dataset');
  return false;
}

/** 한 Dataset 덩이를 채운다. ⛔ 있는 값은 안 덮는다 */
function 한덩이채우기(것: Record<string, unknown>, 딱지: 사이트딱지, 정본?: string) {
  if (!('license' in 것) || !것.license) 것.license = 약관주소[딱지];
  /* ⛔ 정본을 못 받으면 url 을 «안» 넣는다 — 지어낸 주소가 비어 있는 것보다 나쁘다 */
  if ((!('url' in 것) || !것.url) && 정본) 것.url = 정본;
  return 것;
}

/**
 * jsonLd 를 통째로 받아 Dataset 만 채워 돌려준다.
 *
 * @param jsonLd  지면이 만든 구조화 자료(무엇이든)
 * @param 딱지    어느 사이트인가
 * @param 정본    그 지면의 정본 주소. 없으면 url 을 안 넣는다
 *
 * ⛔ 원본을 고치지 않는다 — 깊은 복사본을 돌려준다.
 *   같은 상수를 여러 지면이 나눠 쓰면 한 지면의 주소가 다른 지면에 새어 들어간다.
 */
export function 데이터세트채우기(jsonLd: unknown, 딱지: 사이트딱지, 정본?: string): unknown {
  if (!jsonLd || typeof jsonLd !== 'object') return jsonLd;

  let 것: unknown;
  try { 것 = JSON.parse(JSON.stringify(jsonLd)); } catch { return jsonLd; }

  const 훑기 = (x: unknown): void => {
    if (Array.isArray(x)) { for (const y of x) 훑기(y); return; }
    if (!x || typeof x !== 'object') return;
    const o = x as Record<string, unknown>;
    if (데이터세트인가(o)) 한덩이채우기(o, 딱지, 정본);
    /* @graph 안쪽도 본다 — 하나만 받으면 나머지가 조용히 안 채워진다 */
    for (const 키 of Object.keys(o)) {
      const v = o[키];
      if (v && typeof v === 'object') 훑기(v);
    }
  };
  훑기(것);
  return 것;
}
