/**
 * list-jsonld.ts — **목록 지면의 구조화 데이터를 한 곳에서 짓는다.**
 *
 * ── 왜 있나 ──────────────────────────────────────────────────────────────
 * 2026-08-29, 구조화 데이터가 없는 지면을 사람(636)·그룹(263)·학교(55) 순으로 고치고
 * 남은 213장을 갈래로 갈랐더니 **전부 「목록 지면」이었다.**
 *
 * ```
 * born-year 79 · tag 64 · from 37 · born-in 12 · star-sign 12 · actors-in-their 5 …
 * ```
 *
 * ⭐ 갈래는 일곱인데 «하는 일»이 같다 — 「어떤 조건에 맞는 사람들의 목록」이다.
 *   그래서 자를 일곱 개 짓지 않고 하나로 둔다. 일곱 개를 지으면 하나를 고칠 때
 *   나머지 여섯이 안 따라온다(오늘 아침에 그 결함으로 기사 셋을 고쳤다).
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────────────────────
 * ① **`ItemList` 는 지면에 «실제로 보이는 순서»여야 한다.** 우리가 보기 좋게 다시
 *   정렬해서 넣으면 지면과 다른 말을 하는 것이다.
 * ② ⛔ **`ItemList` 를 순위로 만들지 않는다.** `ItemListOrderType` 을 안 쓴다 —
 *   born-year·from·tag 는 순위가 아니라 «묶음»이다.
 * ③ 사람 지면이 «있는» 사람만 `url` 을 붙인다. 없으면 이름만 낸다.
 *   (person-link · title-link · firm-link · group/school-jsonld 에 이어 다섯째다)
 * ④ ⚠ 목록이 비면 `ItemList` 를 **안 넣는다** — 빈 목록을 내는 것은 0 으로 채우는 것이다.
 */

export type 줄 = { name?: string; url?: string | null };

export type 목록지면 = {
  주소: string;        // 손님이 보는 주소 (`/from/ansan`)
  이름: string;        // 지면이 무엇인지 (`Korean stars from Ansan`)
  설명?: string | null;
  줄들?: 줄[];
};

const 뿌리 = 'https://www.kculturewire.com';

export function 온주소(주소: unknown): string {
  const p = String(주소 ?? '');
  return p.startsWith('http') ? p : `${뿌리}${p.startsWith('/') ? '' : '/'}${p}`;
}

/**
 * 목록의 칸들 — 지면에 보이는 순서 그대로.
 * ⚠ `position` 은 1부터다. ⛔ 그것이 «순위»라는 뜻이 아니라 «몇 번째 줄»이라는 뜻이다.
 */
export function 칸들(줄들: 줄[] = []) {
  return 줄들
    .map((r) => ({ 이름: String(r?.name ?? '').trim(), 주소: r?.url ? String(r.url) : null }))
    .filter((r) => r.이름)
    .map((r, i) => {
      const 것: Record<string, unknown> = { '@type': 'ListItem', position: i + 1, name: r.이름 };
      if (r.주소) 것.url = 온주소(r.주소);
      return 것;
    });
}

/**
 * 목록 지면의 구조화 데이터.
 * ⚠ `CollectionPage` 다 — 「무엇 하나에 대한 지면」이 아니라 「모아 놓은 지면」이다.
 *   (사람·그룹·학교는 `ProfilePage` 였다. 둘을 섞지 않는다)
 */
export function 목록구조화(지면: 목록지면, 출처: string[] = ['https://www.wikidata.org']) {
  const 것: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: 온주소(지면?.주소),
    name: String(지면?.이름 ?? ''),
    isPartOf: { '@type': 'WebSite', name: 'K Culture Wire', url: 뿌리 },
  };
  const 설명 = String(지면?.설명 ?? '').trim();
  if (설명) 것.description = 설명;

  const 다 = 칸들(지면?.줄들 ?? []);
  if (다.length) {
    것.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: 다.length,
      itemListElement: 다,
    };
  }
  if (출처?.length) 것.isBasedOn = 출처;
  return 것;
}
