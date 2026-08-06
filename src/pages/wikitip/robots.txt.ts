import type { APIRoute } from 'astro';

/**
 * K Culture Wire robots.txt.
 * server.mjs 가 www.kculturewire.com/robots.txt → dist/wikitip/robots.txt 로 보낸다.
 * 크롤러를 막지 않는다 — 검색 유입이 유일한 마케팅이다. 색인 여부는 각 페이지 robots 메타태그가 정한다.
 * `Sitemap:` 줄이 크롤러가 사이트맵을 찾는 자리다.
 */
export const GET: APIRoute = () =>
  new Response(
    `# K Culture Wire — Korean pop culture, in numbers.
# Search traffic is our only marketing, so we block no crawler.
# Indexing is decided per page by the robots meta tag.
User-agent: *
Allow: /

Sitemap: https://www.kculturewire.com/sitemap.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
