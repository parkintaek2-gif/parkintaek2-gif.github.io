/**
 * group-jsonld.ts — **그룹 지면의 구조화 데이터를 한 곳에서 짓는다.**
 *
 * ── 왜 있나 ──────────────────────────────────────────────────────────────
 * 2026-08-29, 사람 지면 636장에 구조화 데이터가 없던 것을 고친 뒤 남은 것을 다시 셌다 —
 * `group` 263장이 다음으로 컸다. 사람과 같은 결함이고 같은 값이 있는 자리다.
 *
 * ⭐ 그룹 이름은 **우리 인기 검색어의 한 갈래**다(사장님: 「스타 이름·작품명」).
 *   그런데 크롤러에게 「이것은 음악 그룹이고 멤버는 이 사람들이다」를 말해 준 적이 없다.
 *
 * ── ⛔ 지키는 것 — 사람 쪽과 같다 ────────────────────────────────────────
 * ① **지면에 없는 것을 적지 않는다.** 생일을 모르는 멤버는 `birthDate` 를 안 넣는다.
 * ② ⛔ `genre` 를 안 쓴다. 우리는 그 그룹이 무슨 갈래 음악인지 «판정하지 않는다» —
 *   우리가 아는 것은 「위키데이터가 이 사람들을 이 그룹의 멤버로 적었다」까지다.
 * ③ ⛔ 「인기」·「대표」류를 안 쓴다.
 * ④ ⚠ 우리 자료의 `members` 는 **위키데이터가 적어 둔 것**이고 «지금» 멤버라는 뜻이 아니다.
 *   (지면도 그렇게 적어 두었다 — `whyNotCurrentMembers`) 그래서 `member` 로만 내고
 *   「현재 멤버」라고 말하지 않는다.
 */

export type 멤버 = { name?: string; born?: string | null; slug?: string | null };
export type 그룹 = { name?: string; slug?: string; members?: 멤버[] };

export function 그룹주소(슬러그: unknown): string {
  return `https://www.kculturewire.com/group/${String(슬러그 ?? '')}`;
}

/** 온전한 날짜만. ⛔ 해만 있거나 없으면 안 낸다 */
export function 태어난날(born: unknown): string | null {
  const s = String(born ?? '');
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/**
 * 멤버 목록.
 * ⚠ 사람 지면이 «있는» 멤버만 `url` 을 붙인다 — 없는 곳으로 걸지 않는다.
 *   (person-link.ts · title-link.ts · firm-link.ts 와 같은 규칙, 네 번째 자리다)
 */
export function 멤버들(g: 그룹, 사람문: Map<string, string> | null = null) {
  return (g?.members ?? []).map((m) => {
    const 이름 = String(m?.name ?? '').trim();
    if (!이름) return null;
    const 것: Record<string, unknown> = { '@type': 'Person', name: 이름 };
    const 날 = 태어난날(m?.born);
    if (날) 것.birthDate = 날;
    const 슬 = 사람문?.get(이름.toLowerCase().replace(/\s+/g, ' ').trim());
    if (슬) 것.url = `https://www.kculturewire.com/person/${슬}`;
    return 것;
  }).filter(Boolean) as Array<Record<string, unknown>>;
}

/**
 * 그룹 지면의 구조화 데이터.
 * ⚠ `MusicGroup` 을 알맹이로 두고 `CollectionPage` 로 감싸지 않는다 — 이 지면은
 *   「그 그룹에 대한 지면」이라 `ProfilePage` 가 맞다(사람 쪽과 같은 결).
 */
export function 그룹구조화(g: 그룹, 사람문: Map<string, string> | null = null) {
  const 이름 = String(g?.name ?? '');
  const 알맹이: Record<string, unknown> = {
    '@type': 'MusicGroup',
    name: 이름,
    url: 그룹주소(g?.slug),
  };
  const 다 = 멤버들(g, 사람문);
  if (다.length) 알맹이.member = 다;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: 그룹주소(g?.slug),
    name: 이름,
    mainEntity: 알맹이,
    isPartOf: {
      '@type': 'WebSite',
      name: 'K Culture Wire',
      url: 'https://www.kculturewire.com',
    },
    isBasedOn: ['https://www.wikidata.org'],
  };
}
