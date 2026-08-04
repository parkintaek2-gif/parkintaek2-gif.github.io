import type { APIRoute } from 'astro';
import majors from '../../data/100yearmap/pages-major.json';
import schools from '../../data/100yearmap/pages-school.json';

/**
 * 백년지도 사이트맵.
 *
 * 왜 따로 두나 — `src/pages/sitemap.xml.ts` 는 서울마켓(SITE_URL) 것이다.
 *   백년지도는 도메인이 다르다. server.mjs 가 `100yearmap.com/sitemap.xml` 을
 *   `dist/100y/sitemap.xml` 로 보내므로, 이 파일이 그 자리에 놓인다.
 *
 * ⚠ 주소에 접두사 `/100y` 를 붙이지 않는다.
 *   방문자가 보는 주소는 `https://100yearmap.com/major/조리과` 다.
 *   `/100y` 는 우리가 한 서버에서 세 사이트를 돌리려고 쓰는 내부 사정일 뿐,
 *   검색엔진에 그 사정을 알릴 이유가 없다.
 *
 * ⚠ 3,450장을 한 파일에 넣는다. 사이트맵 한도는 5만 URL · 50MB 라 아직 여유가 있다.
 *   대학알리미가 들어와 학과 페이지가 늘면 그때 쪼갠다.
 *
 * ⛔ 아직 noindex 인 페이지도 사이트맵에는 넣는다 — 색인 여부는 페이지의 robots 태그가 정한다.
 *   둘이 어긋나면 검색엔진이 「사이트맵엔 있는데 막혀 있다」고 경고한다.
 *   ⚠ 그래서 **noindex 를 뗄 때 이 파일도 같이 확인**한다. 지금은 사장님 판단 대기 중이다.
 */

const ORIGIN = 'https://100yearmap.com';

/** 한글 주소는 그대로 두면 XML 파서가 깨진다. 인코딩하고 & 를 escape 한다 */
const loc = (path: string) =>
  ORIGIN +
  path
    .split('/')
    .map((seg) => (seg ? encodeURIComponent(seg) : seg))
    .join('/');

type Entry = { path: string; priority: string; changefreq: string };

export const GET: APIRoute = () => {
  const entries: Entry[] = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/major', priority: '0.9', changefreq: 'weekly' },
    { path: '/school', priority: '0.8', changefreq: 'weekly' },
    // 학과가 학교보다 앞이다. 「어떤 길인가」가 「어느 학교인가」보다 먼저 오는 질문이다
    ...(majors as any[]).map((m) => ({
      path: m.url as string,
      priority: '0.8',
      changefreq: 'monthly',
    })),
    ...(schools as any[]).map((s) => ({
      path: s.url as string,
      priority: '0.6',
      changefreq: 'monthly',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${loc(e.path)}</loc><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
