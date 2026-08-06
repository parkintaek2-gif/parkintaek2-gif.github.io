import type { APIRoute } from 'astro';

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

export const GET: APIRoute = () => {
  const entries: Entry[] = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/titles', priority: '0.9', changefreq: 'weekly' },
    { path: '/actors', priority: '0.9', changefreq: 'weekly' },
    { path: '/workforce', priority: '0.9', changefreq: 'weekly' },
    { path: '/esports', priority: '0.8', changefreq: 'daily' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
  ];
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
