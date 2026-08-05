import type { APIRoute } from 'astro';
import majors from '../../data/100yearmap/pages-major.json';
import schools from '../../data/100yearmap/pages-school.json';
import universities from '../../data/100yearmap/pages-university.json';

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
 * 🔴 **noindex 인 지면은 사이트맵에 넣지 않는다** (2026-08-05 정정).
 *
 * 앞선 주석은 반대로 적혀 있었다 — 「noindex 인 페이지도 넣는다」.
 * 그러면 검색엔진에 **모순된 신호**를 준다. 사이트맵은 「이걸 색인해 달라」는 뜻인데
 * 그 지면이 「색인하지 마라」고 말한다. Search Console 이 경고를 띄우고,
 * 그런 URL 이 많으면 사이트맵 전체의 신뢰가 깎인다.
 *
 * ```
 * 사장님 결정 2026-08-05 「얇은 것만 빼고 지금 떼라」
 *   ▶ 넣는다  학과 · 대학 · **학과가 있는 학교** · 고정 지면
 *   ⏸ 뺀다    학과가 없는 일반고 — `school/[code].astro` 가 같은 조건으로 noindex 를 건다
 * ```
 *
 * ⚠ **두 파일의 조건이 같아야 한다.** 한쪽만 고치면 다시 어긋난다.
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
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    /* 🔴 「대학 다음이 제일 중요」(사장님 2026-08-06). 우리가 남과 다른 자리라 첫 화면 다음으로 높다.
       ⚠ 새 고정 지면을 만들면 **여기 한 줄을 같이 넣는다.** 안 넣으면 지면은 검색에 열려 있는데
         사이트맵에는 없는 어긋난 상태가 된다 — /after 를 만들고 실제로 그랬다(2026-08-06). */
    { path: '/after', priority: '0.9', changefreq: 'weekly' },
    { path: '/major', priority: '0.9', changefreq: 'weekly' },
    { path: '/school', priority: '0.8', changefreq: 'weekly' },
    { path: '/university', priority: '0.9', changefreq: 'weekly' },
    { path: '/research', priority: '0.7', changefreq: 'monthly' },
    { path: '/data', priority: '0.8', changefreq: 'weekly' },
    // 학과가 학교보다 앞이다. 「어떤 길인가」가 「어느 학교인가」보다 먼저 오는 질문이다
    ...(majors as any[]).map((m) => ({
      path: m.url as string,
      priority: '0.8',
      changefreq: 'monthly',
    })),
    /* ⚠ **학과가 없는 일반고 1,353장은 뺀다.** `school/[code].astro` 가 같은 조건으로
       noindex 를 걸기 때문이다. 두 곳의 조건이 어긋나면 모순된 신호가 나간다.
       실측 2026-08-05 — 학교 2,525 = 학과 있음 1,172 + 없음 1,353 */
    ...(schools as any[])
      .filter((s) => (s.학과 ?? []).length > 0)
      .map((s) => ({
        path: s.url as string,
        priority: '0.6',
        changefreq: 'monthly',
      })),
    ...(universities as any[]).map((u) => ({
      path: u.url as string,
      priority: '0.7',
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
