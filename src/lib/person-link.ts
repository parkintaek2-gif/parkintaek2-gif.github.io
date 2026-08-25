/**
 * person-link.ts — **사람 이름을 사람 지면으로 잇는 한 곳.**
 *
 * ── 왜 있나 ──────────────────────────────────────────────────────────────
 * 2026-08-26 에 갈래마다 「다음 걸음이 어디 있나」를 전수로 재다가 찾았다.
 * 사람 지면 636장을 8/25 에 냈는데, **그리로 거는 지면이 셋뿐**이었다 —
 * `/person` 첫 장 · 사람 지면끼리 · 작품 지면. 그 밖의 이름 목록은 전부 «글자»였다:
 *
 * ```
 * born-on  366장   같은 날 태어난 사람 스무 남짓  → 링크 0
 * group    263장   그룹 멤버 이름                → 링크 0
 * school    55장   동문 이름                     → 링크 0
 * ```
 *
 * ⛔ 그 636장은 지금 구글에서 **「발견만」**에 머물러 있다. 안쪽 링크가 색인을 끌어오는
 *   가장 큰 힘인데, 가장 자연스러운 문들이 닫혀 있었다.
 *
 * ── 지키는 것 셋 ─────────────────────────────────────────────────────────
 * ① **지면이 있는 이름만 건다.** 사람 지면은 「최소편수 2」를 넘긴 사람만 있다.
 *   목록에 있다고 지면이 있는 것이 아니다. ⛔ 없는 곳으로 걸면 손님이 404 를 본다.
 * ② **이름이 겹치면 안 건다.** 로마자 이름이 같은 사람이 실제로 있다(그래서 사람 지면에
 *   `sameNameAs` 가 있다). 하나를 골라 걸면 손님을 **다른 사람**에게 보낸다.
 *   ⭐ **틀린 문은 없는 문보다 나쁘다.** 안 거는 쪽을 고른다.
 * ③ **이름은 두 자리에서 온다.** `name` 과 `wikiPage` 가 다를 수 있다
 *   (「Lee You-mi」 / 「Lee Yoo-mi」). 둘 다로 찾는다.
 *
 * ⚠ Astro 의 `getStaticPaths` 는 **따로 떼어 돌아간다** — 바깥 선언이 안 보인다.
 *   그러니 이 함수를 «그 안에서» 부르고, 지면이 쓸 것은 props 로 건넨다.
 */

/** 이름을 견줄 수 있는 꼴로 — 대소문자·여백만 맞춘다. ⛔ 붙임표를 지우지 않는다:
 *  「Lee Min-ho」와 「Lee Minho」는 위키백과에서 다른 문서일 수 있다. */
export function 이름키(이름: unknown): string {
  return String(이름 ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export type 사람줄 = { name?: string; wikiPage?: string; slug?: string };

/**
 * 이름 → 사람 지면 슬러그 표를 만든다.
 * @returns 표(Map) 와 «겹쳐서 뺀» 이름 수
 */
export function 이름표만들기(사람들: 사람줄[] = []): { 표: Map<string, string>; 겹친수: number } {
  const 표 = new Map<string, string>();
  const 겹친것 = new Set<string>();
  for (const p of 사람들) {
    if (!p?.slug) continue;
    for (const 이름 of [p.name, p.wikiPage]) {
      const k = 이름키(이름);
      if (!k) continue;
      const 있던 = 표.get(k);
      if (있던 && 있던 !== p.slug) { 겹친것.add(k); continue; }
      표.set(k, p.slug);
    }
  }
  /* 겹친 이름은 아예 뺀다 — 반쯤 맞는 문을 남기지 않는다 */
  for (const k of 겹친것) 표.delete(k);
  return { 표, 겹친수: 겹친것.size };
}

/**
 * 목록에 실을 이름들 중 **지면이 있는 것만** 골라 `{이름: 슬러그}` 로 준다.
 * props 로 건네기 좋게 작다 — 표 전체(수백 줄)를 지면마다 실어 보내지 않는다.
 */
export function 이지면의문(이름들: unknown[], 표: Map<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const 이름 of 이름들) {
    const k = 이름키(이름);
    const slug = 표.get(k);
    if (slug) out[k] = slug;
  }
  return out;
}

/** 지면에서 쓴다 — 슬러그가 있으면 주소, 없으면 null(그러면 글자로 둔다). */
export function 문(이름: unknown, 문들: Record<string, string> | null | undefined): string | null {
  const slug = 문들?.[이름키(이름)];
  return slug ? `/person/${slug}` : null;
}
