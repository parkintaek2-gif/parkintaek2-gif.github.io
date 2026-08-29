/**
 * person-jsonld.ts — **사람 지면의 구조화 데이터를 한 곳에서 짓는다.**
 *
 * ── 왜 있나 ──────────────────────────────────────────────────────────────
 * 2026-08-29 에 `check-search-readiness` 를 헛경보 걷어내고 다시 돌렸더니
 * 진짜가 하나 크게 남았다 —
 *
 * ```
 * 구조화 데이터가 없는 것 1,184장
 *     636  person      ← 이것
 *     263  group
 *      79  born-year
 *      55  school       …
 * ```
 *
 * 🔴 **사람 지면 636장에 `application/ld+json` 이 아예 없다.** 같은 636장이 구글에서
 * 「발견만」에 머물러 있다. 안쪽 링크는 굶지 않았다(가운데 9.5장에서 걸린다) —
 * 그러니 링크가 아니라 **크롤러에게 줄 것이 적었던** 쪽이 남는다.
 *
 * ⚠ ⛔ 「구조화 데이터를 붙이면 색인된다」고 **단정하지 않는다.** 색인은 구글이 정한다.
 *   여기서 말할 수 있는 것은 「사람 지면인데 사람이라고 말해 주지 않았다」까지다.
 *   9/05 쯤 노출을 다시 재서 움직였는지 본다. ⛔ 안 움직이면 안 움직였다고 적는다.
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────────────────────
 * ① **지면에 없는 것을 구조화 데이터에 적지 않는다.** 둘이 다르면 그것이 스팸이다.
 *   생일을 모르면 `birthDate` 를 **안 넣는다** — 빈 칸을 0 이나 추정으로 채우지 않는다.
 * ② `sameAs` 는 **우리가 실제로 들고 있는 것**만 — 위키데이터 Q번호와 영문 위키백과.
 *   ⛔ 인스타그램·팬 계정을 짐작으로 넣지 않는다.
 * ③ `jobTitle` 을 안 쓴다. 우리는 그 사람이 배우인지 가수인지 «판정하지 않는다» —
 *   우리가 아는 것은 「넷플릭스 차트에 든 한국 작품에 이름이 있다」까지다.
 */

export type 사람 = {
  name?: string;
  slug?: string;
  q?: string | null;
  wikiPage?: string | null;
  born?: string | null;
  titles?: Array<{ title?: string; slug?: string; type?: string }>;
};

/** 우리 사이트의 그 사람 주소 */
export function 사람주소(슬러그: unknown): string {
  return `https://www.kculturewire.com/person/${String(슬러그 ?? '')}`;
}

/**
 * 밖에서 같은 사람을 가리키는 주소들.
 * ⛔ 우리가 «들고 있는 것»만 낸다. 없으면 빈 목록이다 — 지어내지 않는다.
 */
export function 같은사람주소들(p: 사람): string[] {
  const 다: string[] = [];
  const q = String(p?.q ?? '');
  if (/^Q\d+$/.test(q)) 다.push(`https://www.wikidata.org/wiki/${q}`);
  const w = String(p?.wikiPage ?? '').trim();
  if (w) 다.push(`https://en.wikipedia.org/wiki/${encodeURIComponent(w.replace(/ /g, '_'))}`);
  return 다;
}

/**
 * 태어난 날 — `YYYY-MM-DD` 꼴일 때만 낸다.
 * ⛔ 이름이 겹쳐 못 가리는 사람(`bornUnknownWhy: 'ambiguous'`)은 지면에도 안 적는다.
 *   구조화 데이터에만 적으면 지면과 다른 말을 하는 것이다.
 */
export function 태어난날(born: unknown): string | null {
  const s = String(born ?? '');
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/**
 * 그 사람이 나온 작품들 — 지면에 실린 것 그대로.
 * ⚠ 작품 지면이 없는 것도 «이름은» 낸다. 있는 것만 `url` 을 붙인다.
 *   (지면 없는 곳으로 걸지 않는다 — `title-link.ts` 와 같은 규칙이다)
 */
export function 나온작품들(p: 사람, 지면있는슬러그: Set<string> | null = null) {
  return (p?.titles ?? []).map((t) => {
    const 것: Record<string, unknown> = {
      '@type': t?.type === 'TV' ? 'TVSeries' : 'Movie',
      name: String(t?.title ?? ''),
    };
    const s = String(t?.slug ?? '');
    if (s && (지면있는슬러그 === null || 지면있는슬러그.has(s))) {
      것.url = `https://www.kculturewire.com/title/${s}`;
    }
    return 것;
  }).filter((t) => t.name);
}

/**
 * 사람 지면의 구조화 데이터.
 * ⚠ `ProfilePage` 로 감싼다 — 이 지면은 「그 사람에 대한 지면」이지 그 사람 자신이 아니다.
 *   구글이 사람 지면을 그렇게 읽는다.
 */
export function 사람구조화(p: 사람, 지면있는슬러그: Set<string> | null = null) {
  const 이름 = String(p?.name ?? '');
  const 사람것: Record<string, unknown> = {
    '@type': 'Person',
    name: 이름,
    url: 사람주소(p?.slug),
  };
  const 날 = 태어난날(p?.born);
  if (날) 사람것.birthDate = 날;
  const 밖 = 같은사람주소들(p);
  if (밖.length) 사람것.sameAs = 밖;
  const 작품 = 나온작품들(p, 지면있는슬러그);
  if (작품.length) 사람것.performerIn = 작품;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: 사람주소(p?.slug),
    /* ⚠ 지면 제목이 아니라 «누구에 대한 지면인가»를 적는다 */
    name: 이름,
    mainEntity: 사람것,
    isPartOf: {
      '@type': 'WebSite',
      name: 'K Culture Wire',
      url: 'https://www.kculturewire.com',
    },
    /* ⭐ 우리 수가 어디서 왔는지 밝힌다 — 지면 아래에 적는 것과 같은 말이다 */
    isBasedOn: ['https://www.netflix.com/tudum/top10', 'https://www.wikidata.org'],
  };
}
