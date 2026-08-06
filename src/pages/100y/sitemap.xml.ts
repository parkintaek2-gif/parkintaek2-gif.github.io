import type { APIRoute } from 'astro';
import majors from '../../data/100yearmap/pages-major.json';
import schools from '../../data/100yearmap/pages-school.json';
import universities from '../../data/100yearmap/pages-university.json';
import 중단자료 from '../../data/100yearmap/school-dropout.json';
import { 짧은지역명 } from '../../lib/region';

/** ⚠ `school/[code].astro` 의 `noindex` 조건과 **한 글자도 다르면 안 된다** */
const 중단있는코드 = new Set(((중단자료 as any).자료 as any[]).map((r) => r.code));

/** 지역 지면의 주소는 `짧은지역명` 이다. `region/[slug].astro` 의 getStaticPaths 와 **같은 데서 뽑는다** —
 *  한쪽에 손으로 적어 두면 지역 이름이 바뀔 때 사이트맵만 옛 주소를 가리키게 된다 */
const 지역들 = [
  ...new Set((schools as any[]).map((s) => 짧은지역명(s.지역)).filter(Boolean)),
];

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
    /* 메뉴 셋째 축. 이름은 사장님 결정 대기지만 **주소는 `/work` 로 고정**이다
       (이름을 주소에 안 박았다 — 지면 앞머리 주석 참조).
       ⭐ 이 줄을 일부러 안 넣고 빌드해 봤더니 `check:100y:launch` 가 그 자리에서 잡았다.
          검사가 헛돌지 않는다는 것을 실제로 확인한 셈이다(2026-08-06). */
    { path: '/work', priority: '0.9', changefreq: 'weekly' },
    { path: '/major', priority: '0.9', changefreq: 'weekly' },
    { path: '/school', priority: '0.8', changefreq: 'weekly' },
    { path: '/university', priority: '0.9', changefreq: 'weekly' },
    { path: '/research', priority: '0.7', changefreq: 'monthly' },
    { path: '/data', priority: '0.8', changefreq: 'weekly' },
    /* 지역으로 보기 — 「경기도 고등학교」처럼 **지역으로 찾는 검색**을 받는 자리다.
       ⭐ 이번에도 검사가 먼저 잡았다(2026-08-06 17:0x). 지면을 만들고 이 줄을 잊었더니
          `check:100y:launch` 가 「검색엔 열렸는데 사이트맵에 없다 — /region」으로 세웠다.
          `/after` 때와 **똑같은 실수**다. 고정 지면을 만들면 여기부터 온다. */
    { path: '/region', priority: '0.8', changefreq: 'monthly' },
    ...지역들.map((지역) => ({
      path: `/region/${지역}`,
      priority: '0.7',
      changefreq: 'monthly',
    })),
    /* 나이로 보기 — 「32살 평균 연봉」·「결혼 적령기」처럼 **나이로 찾는 검색**을 받는 자리다.
       ⚠ 나이 목록은 `age/[age].astro` 의 getStaticPaths 와 **같아야 한다.** 늘릴 때 두 곳을 함께 고친다. */
    { path: '/age', priority: '0.8', changefreq: 'monthly' },
    ...[25, 32, 40, 55, 68].map((나이) => ({
      path: `/age/${나이}`,
      priority: '0.7',
      changefreq: 'monthly',
    })),
    // 학과가 학교보다 앞이다. 「어떤 길인가」가 「어느 학교인가」보다 먼저 오는 질문이다
    ...(majors as any[]).map((m) => ({
      path: m.url as string,
      priority: '0.8',
      changefreq: 'monthly',
    })),
    /* ⚠ **얇은 지면은 뺀다.** `school/[code].astro` 가 **같은 조건으로** noindex 를 건다.
       두 곳이 어긋나면 모순된 신호가 나간다.

       ⭐ 2026-08-06 — 조건이 하나 늘었다. 학교별 **학업중단 수치**가 붙은 지면은
         학과가 없어도 연다. 유형 평균이 아니라 **이 학교 하나의 숫자**라서다.
         실측 — 학교 2,525 = 학과 있음 1,172 + 학과 없지만 수치 있음 1,269 + 둘 다 없음 84 */
    ...(schools as any[])
      .filter((s) => (s.학과 ?? []).length > 0 || 중단있는코드.has(s.code))
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
