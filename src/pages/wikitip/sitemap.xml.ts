import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * K Culture Wire 사이트맵.
 * server.mjs 가 www.kculturewire.com/sitemap.xml → dist/wikitip/sitemap.xml 로 보낸다.
 * ⚠ 주소에 내부 접두사 `/wikitip` 을 붙이지 않는다. 방문자 주소는 https://www.kculturewire.com/titles 다.
 * ⚠ noindex 인 지면(404)은 넣지 않는다 — 사이트맵과 메타태그가 어긋나면 모순된 신호가 된다.
 * 도메인은 **www** 다(2026-08-06 · 루트는 www 로 301). canonical 과 같은 주소를 쓴다.
 * 지면을 새로 만들면 여기 한 줄을 같이 넣는다(안 넣으면 검색엔 열려 있는데 사이트맵엔 없는 어긋난 상태).
 */
const ORIGIN = 'https://www.kculturewire.com';
type Entry = { path: string; priority: string; changefreq: string };

export const GET: APIRoute = async () => {
  const entries: Entry[] = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/titles', priority: '0.9', changefreq: 'weekly' },
    { path: '/watched', priority: '0.9', changefreq: 'weekly' },
    { path: '/actors', priority: '0.9', changefreq: 'weekly' },
    { path: '/workforce', priority: '0.9', changefreq: 'weekly' },
    { path: '/exports', priority: '0.9', changefreq: 'yearly' },   // KOSIS 가 해마다 낸다
    { path: '/tv-exports', priority: '0.9', changefreq: 'yearly' },
    { path: '/webtoon', priority: '0.9', changefreq: 'yearly' },
    { path: '/industry', priority: '0.9', changefreq: 'yearly' },
    { path: '/staying-power', priority: '0.9', changefreq: 'weekly' },
    { path: '/esports', priority: '0.8', changefreq: 'daily' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
  ];

  /*
   * 기사는 **손으로 넣지 않는다.** 위 목록처럼 적어 두면 다음 기사를 낼 때 빼먹는다 —
   * 백년지도가 2,483장을 만들어 놓고 사이트맵에 한 번도 안 올린 적이 있다.
   * 컬렉션에서 바로 읽으니 기사를 쓰면 사이트맵에 저절로 들어간다. draft 는 뺀다.
   */
  const articles = await getCollection('kcwArticles');
  for (const a of articles.filter((e) => !e.data.draft)) {
    entries.push({ path: `/article/${a.id}`, priority: '0.9', changefreq: 'monthly' });
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${ORIGIN}${e.path}</loc><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
