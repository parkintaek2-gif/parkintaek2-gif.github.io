import type { APIRoute } from 'astro';

/**
 * 백년지도 robots.txt.
 *
 * 왜 따로 두나 — `public/robots.txt` 는 서울마켓 것이고, 사이트맵 주소도 그쪽을 가리킨다.
 *   그리고 그 파일은 `dist/` 최상위에만 놓이므로 `100yearmap.com/robots.txt` 는 **404 였다**
 *   (server.mjs 가 `/robots.txt` 를 `/100y/robots.txt` 로 보내는데 그 파일이 없었다).
 *   사이트맵 위치를 알릴 방법이 없었다는 뜻이다. 검색 유입이 우리의 유일한 마케팅인데.
 *
 * ⚠ 여기서 크롤러를 막지 않는다. 색인 여부는 **페이지마다의 robots 메타태그**가 정한다.
 *   robots.txt 로 막으면 검색엔진이 페이지를 열어 보지도 못해서, 안에 있는 noindex 를
 *   읽지 못한다. 그러면 「막혀 있지만 색인된」 최악의 상태가 된다.
 *
 * ⛔ 우리는 남의 robots 를 지키는 만큼 우리 것도 정직하게 쓴다.
 *   숨겨 두고 크롤링만 받아 가는 경로를 만들지 않는다.
 */
export const GET: APIRoute = () =>
  new Response(
    `# 백년지도 — 교육은 백년지계.
# 검색 유입이 유일한 마케팅이라 어떤 크롤러도 막지 않는다.
# 색인 여부는 각 페이지의 robots 메타태그가 정한다.
User-agent: *
Allow: /

Sitemap: https://100yearmap.com/sitemap.xml
Sitemap: https://100yearmap.com/sitemap-image.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
