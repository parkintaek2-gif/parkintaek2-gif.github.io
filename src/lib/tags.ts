import { publishedArticles } from './articles';

/**
 * 태그 → 지면 묶기. (2026-08-25, 5번 총괄 지시: 앞말 태그가 화면·색인에 없다 = 구멍)
 *
 * · slug: 소문자·공백→하이픈·[a-z0-9-]만·하이픈 겹침 정리. 같은 slug 로 합쳐지는 표기는 한 지면으로 묶는다.
 * · 지면(/tag/{slug})은 **2편 이상**인 태그만 낸다 — 한 편짜리는 404 를 만들지 않으려고 지면을 안 낸다.
 *   (기사에는 글자로 남기되 링크만 안 건다 — 그건 article 템플릿에서 처리)
 * · 지면 문턱과 사이트맵 문턱을 «같게»(2편) 둔다 — 어긋나면 사이트맵에 404 가 실린다.
 */
export const TAG_THRESHOLD = 2;

export function tagSlug(tag: string): string {
  return String(tag).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export type TagEntry = { slug: string; label: string; articles: Awaited<ReturnType<typeof publishedArticles>> };

/** slug → { label, articles[] }. label 은 그 slug 로 합쳐진 표기 중 가장 자주 쓰인 것. */
export async function getTagMap(): Promise<Map<string, TagEntry>> {
  const all = await publishedArticles();
  const map = new Map<string, TagEntry & { _labels: Record<string, number> }>();
  for (const a of all) {
    const seen = new Set<string>();
    for (const raw of (a.data.tags ?? [])) {
      const slug = tagSlug(raw);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      let e = map.get(slug);
      if (!e) { e = { slug, label: raw, articles: [], _labels: {} }; map.set(slug, e); }
      e.articles.push(a);
      e._labels[raw] = (e._labels[raw] || 0) + 1;
    }
  }
  for (const e of map.values()) {
    e.label = Object.entries(e._labels).sort((x, y) => y[1] - x[1])[0][0];
  }
  return map as Map<string, TagEntry>;
}

/** 2편 이상인 태그만(지면·사이트맵용). */
export async function getPagedTags(): Promise<TagEntry[]> {
  const map = await getTagMap();
  return [...map.values()]
    .filter((e) => e.articles.length >= TAG_THRESHOLD)
    .sort((a, b) => b.articles.length - a.articles.length);
}

/** 한 기사의 태그를 화면용으로: { label, slug, paged } — paged=true 면 /tag/{slug} 로 링크. */
export async function tagsForArticle(tags: string[] | undefined): Promise<Array<{ label: string; slug: string; paged: boolean }>> {
  const map = await getTagMap();
  const out: Array<{ label: string; slug: string; paged: boolean }> = [];
  const seen = new Set<string>();
  for (const raw of (tags ?? [])) {
    const slug = tagSlug(raw);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const e = map.get(slug);
    out.push({ label: raw, slug, paged: !!e && e.articles.length >= TAG_THRESHOLD });
  }
  return out;
}
