/**
 * school-jsonld.ts — **학교 지면의 구조화 데이터를 한 곳에서 짓는다.**
 *
 * ── 왜 있나 ──────────────────────────────────────────────────────────────
 * 2026-08-29, 구조화 데이터가 없는 지면 1,184장을 갈래로 갈랐더니 학교가 55장 있었다.
 * 사람(636)·그룹(263) 다음이다.
 *
 * ⭐ 그리고 학교 지면에는 **다른 유닛이 준 자료**가 하나 더 있다 — 90일 동안 AI 를 타고
 *   들어온 사람이 3번(백년지도)에서 «학교 코드 지면»에 가장 많이 왔다(15세션 중 8장이 학교).
 *   AI 가 인용하는 것은 기사가 아니라 **「그 하나를 답하는 지면」**이라는 뜻이다.
 *   ⚠ 표본 15다. 「AI 가 이런 글을 좋아한다」로 읽지 않는다 — 그래도 학교 지면에
 *     「이것은 학교이고 여기 이 사람들이 다녔다」를 말해 주지 않을 까닭은 없다.
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────────────────────
 * ① ⛔ **「이 학교에 가면 멀리 간다」로 읽히면 안 된다.** 자료 파일이 스스로 적어 둔 한계다 —
 *   인과를 못 가린다. 그러니 구조화 데이터에도 «순위·평판»에 해당하는 것을 안 넣는다.
 *   `aggregateRating` 류는 절대 안 쓴다.
 * ② **동문은 `alumni` 로 낸다.** 그것이 위키데이터가 적어 둔 사실이다.
 *   ⚠ 「지금 다닌다」가 아니다 — 우리 자료는 졸업·재학을 안 가른다. 그래서 `alumni` 다.
 * ③ 사람 지면이 «있는» 사람만 `url` 을 붙인다(네 번째로 같은 규칙이다).
 */

export type 동문 = { name?: string };
export type 학교 = { name?: string; slug?: string; q?: string | null; top?: 동문[] };

export function 학교주소(슬러그: unknown): string {
  return `https://www.kculturewire.com/school/${String(슬러그 ?? '')}`;
}

/** 위키데이터로 잇는다. ⛔ Q번호 꼴이 아니면 안 넣는다 */
export function 같은곳주소들(s: 학교): string[] {
  const q = String(s?.q ?? '');
  return /^Q\d+$/.test(q) ? [`https://www.wikidata.org/wiki/${q}`] : [];
}

/**
 * 동문 목록 — 지면에 실린 사람 그대로.
 * ⚠ 사람 지면이 있는 사람만 `url` 을 붙인다. 없으면 이름만 낸다.
 */
export function 동문들(s: 학교, 사람문: Map<string, string> | null = null) {
  return (s?.top ?? []).map((p) => {
    const 이름 = String(p?.name ?? '').trim();
    if (!이름) return null;
    const 것: Record<string, unknown> = { '@type': 'Person', name: 이름 };
    const 슬 = 사람문?.get(이름.toLowerCase().replace(/\s+/g, ' ').trim());
    if (슬) 것.url = `https://www.kculturewire.com/person/${슬}`;
    return 것;
  }).filter(Boolean) as Array<Record<string, unknown>>;
}

/**
 * 학교 지면의 구조화 데이터.
 * ⚠ `CollectionPage` 가 아니라 `ProfilePage` 다 — 이 지면은 「그 학교에 대한 지면」이다.
 */
export function 학교구조화(s: 학교, 사람문: Map<string, string> | null = null) {
  const 이름 = String(s?.name ?? '');
  const 알맹이: Record<string, unknown> = {
    '@type': 'EducationalOrganization',
    name: 이름,
    url: 학교주소(s?.slug),
  };
  const 밖 = 같은곳주소들(s);
  if (밖.length) 알맹이.sameAs = 밖;
  const 다 = 동문들(s, 사람문);
  if (다.length) 알맹이.alumni = 다;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: 학교주소(s?.slug),
    name: 이름,
    mainEntity: 알맹이,
    isPartOf: {
      '@type': 'WebSite',
      name: 'K Culture Wire',
      url: 'https://www.kculturewire.com',
    },
    isBasedOn: ['https://www.wikidata.org', 'https://www.netflix.com/tudum/top10'],
  };
}
