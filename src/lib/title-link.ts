/**
 * title-link.ts — **작품 이름을 작품 지면으로 잇는 한 곳.**
 *
 * ── 왜 있나 ──────────────────────────────────────────────────────────────
 * 2026-08-29 에 새로 지은 `check-kcw-broken-links.mjs` 가 라이브 지면에서
 * **없는 작품 지면으로 가는 링크 세 개**를 잡았다 —
 *
 * ```
 * /title/breathless           where-to-watch · year/2024 · year/2025   3장에서 가리킴
 * /title/one-more-time        underrated · year/2023                   2장
 * /title/dangerous-liaisons   year/2022                                1장
 * ```
 *
 * 까닭은 하나다. 지면들이 **작품 이름에서 슬러그를 만들어 그냥 걸었다.**
 * 그런데 작품 지면은 아무 작품에나 나는 것이 아니다 — 차트에 오른 줄이
 * `minRowsForPage`(지금 6) 를 넘긴 작품만 지면이 있다. 줄이 적은 작품은
 * **일부러 지면을 안 낸다**(적게 잰 것으로 한 장을 만들면 그 지면이 거의 비어 있다).
 *
 * ⭐ 이것은 `person-link.ts` 가 사람 이름에 대해 이미 지키던 규칙과 **같은 규칙**이다.
 *   사람 쪽에는 있고 작품 쪽에는 없었다. 그래서 짝을 맞춘다.
 *
 * ── 지키는 것 ────────────────────────────────────────────────────────────
 * ① **지면이 있는 슬러그만 건다.** 목록에 있다고 지면이 있는 것이 아니다.
 * ② 지면이 없으면 **링크를 안 걸고 이름은 그대로 낸다.** 이름을 지우지 않는다 —
 *   손님이 찾는 것은 이름이고, 그 작품이 차트에 있었다는 것은 사실이다.
 * ③ ⛔ 「없으면 목록 지면(/titles)으로 보내자」를 하지 않는다. 손님이 누른 것은
 *   그 작품이지 목록이 아니다. **틀린 문은 없는 문보다 나쁘다.**
 *
 * ⚠ Astro 의 `getStaticPaths` 는 따로 떼어 돌아간다 — 이 함수를 그 안에서 부르고,
 *   지면이 쓸 것은 props 로 건넨다(`person-link.ts` 와 같은 주의다).
 */

export type 작품줄 = { slug?: string; hasPage?: boolean };

/**
 * 지면이 «있는» 슬러그만 모은다.
 * ⚠ `hasPage` 가 아예 없는 옛 자료면 그 자료로는 «못 가린다» — 그때는 빈 자리를 낸다.
 *   0 으로 채우지 않는 것과 같은 뜻이다. 못 가리면 아래 `있나()` 가 늘 참을 낸다.
 */
export function 지면있는것들(작품들: 작품줄[] = []): Set<string> | null {
  const 잰다 = 작품들.some((t) => typeof t?.hasPage === 'boolean');
  if (!잰다) return null;
  const 표 = new Set<string>();
  for (const t of 작품들) {
    if (t?.hasPage && typeof t.slug === 'string' && t.slug) 표.add(t.slug);
  }
  return 표;
}

/**
 * 이 슬러그로 갈 지면이 있나.
 * @param 표 `지면있는것들()` 이 낸 것. null 이면 **못 쟀다**는 뜻이라 막지 않는다.
 */
export function 있나(슬러그: unknown, 표: Set<string> | null): boolean {
  if (표 === null) return true;
  const s = String(슬러그 ?? '');
  return s.length > 0 && 표.has(s);
}

/**
 * 지면이 있으면 주소를, 없으면 null 을 낸다.
 * 쓰는 쪽에서 `{주소 ? <a href={주소}>{이름}</a> : 이름}` 꼴로 쓴다.
 */
export function 작품주소(슬러그: unknown, 표: Set<string> | null): string | null {
  return 있나(슬러그, 표) ? `/title/${String(슬러그)}` : null;
}
