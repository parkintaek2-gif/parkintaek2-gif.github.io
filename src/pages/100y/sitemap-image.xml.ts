import type { APIRoute } from 'astro';
import schools from '../../data/100yearmap/pages-school.json';
import 지역단위 from '../../data/100yearmap/areas.json';
import 중단자료 from '../../data/100yearmap/school-dropout.json';
import 학급자료 from '../../data/100yearmap/school-class-size.json';
import { 한벌로팔만한가 } from '../../lib/school-area';

/** ⚠ `sitemap.xml.ts` · `school/[code].astro` 와 **같은 집합**이라야 한다 */
const 중단있는코드 = new Set(((중단자료 as any).자료 as any[]).map((r) => r.code));
const 학급있는코드 = new Set(((학급자료 as any).자료 as any[]).map((r) => r.code));

/**
 * 백년지도 **이미지 사이트맵** — `/sitemap-image.xml`
 *
 * 🔴 2번 지시(2026-08-08 12:1x) — *「이미지 사이트맵이 404 입니다. 카드가 생기면 같이 냅니다」*
 *
 * ## 왜 따로 내나
 *
 *   지면 사이트맵(`/sitemap.xml`)은 「이 주소를 색인해 달라」는 목록이다.
 *   그 지면에 **어떤 그림이 붙어 있는지**는 거기서 안 보인다.
 *   구글 이미지 검색은 이 목록을 따로 본다.
 *
 * ## ⛔ 파는 지면은 안 넣는다
 *
 *   지면이 `noindex` 인데 그 그림을 색인해 달라고 하면 **모순된 신호**다.
 *   지면 사이트맵과 **같은 조건**(`한벌로팔만한가`)을 쓴다 — 손으로 10 을 다시 적지 않는다.
 *
 * ⚠ 카드 파일 이름은 `scripts/make-og-100y-pages.mjs` 가 정한다.
 *   여기와 지면(`ogImage`)과 굽는 쪽, **세 곳이 같아야** 404 가 안 난다.
 */

const ORIGIN = 'https://100yearmap.com';

/** 한글 주소는 그대로 두면 XML 파서가 깨진다 */
const 주소 = (경로: string) =>
  ORIGIN +
  경로
    .split('/')
    .map((조각) => (조각 ? encodeURIComponent(조각) : 조각))
    .join('/');

type 짝 = { 지면: string; 그림: string; 제목: string };

export const GET: APIRoute = () => {
  const 짝들: 짝[] = [];

  /* 지역 한 벌 — **무료로 연 것만.** 파는 쪽은 지면이 noindex 라 넣지 않는다 */
  for (const a of (지역단위 as any).단위 as any[]) {
    if (한벌로팔만한가(a.곳)) continue;
    짝들.push({
      지면: `/report/area/${a.slug}`,
      그림: `/og/area-${a.slug}.png`,
      제목: `${a.이름} 고등학교 ${a.곳}곳`,
    });
  }

  /**
   * 학교 — 지면 사이트맵과 **한 글자도 같은 조건**으로 연 것만 넣는다.
   * ⚠ 얇은 지면은 `school/[code].astro` 가 noindex 를 건다. 여기서도 뺀다.
   * ⛔ 조건을 여기 새로 적지 않는다. `sitemap.xml.ts` 와 같은 자료로 같은 집합을 만든다.
   */
  for (const s of schools as any[]) {
    if (!((s.학과 ?? []).length > 0 || 중단있는코드.has(s.code) || 학급있는코드.has(s.code))) continue;
    짝들.push({
      지면: s.url as string,
      그림: `/og/school-${s.code}.png`,
      제목: s.title as string,
    });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${짝들
  .map(
    (x) =>
      `  <url><loc>${주소(x.지면)}</loc><image:image><image:loc>${주소(x.그림)}</image:loc><image:title>${x.제목
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</image:title></image:image></url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
