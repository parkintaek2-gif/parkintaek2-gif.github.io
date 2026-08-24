import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import schools from '../../data/100yearmap/pages-school.json';
import 지역단위 from '../../data/100yearmap/areas.json';
import 중단자료 from '../../data/100yearmap/school-dropout.json';
import 학급자료 from '../../data/100yearmap/school-class-size.json';
import { 한벌로팔만한가 } from '../../lib/school-area';
import { 파는지면검색 } from '../../lib/price';

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

/**
 * ⭐ 2026-08-24 — **카드뉴스 1,196장을 여기 더한다.**
 *
 * 5번(총괄)이 세 사이트 사이트맵을 다 열어 보고 알려 왔다 —
 * 「3번은 카드뉴스 1,196장을 만들어 놓고 구글에 한 장도 안 알렸습니다.」
 * 구글 이미지 검색은 구글 웹 검색과 **다른 자리**다. 만들어 둔 그림이 있는데
 * 그 자리를 통째로 비워 두고 있었다.
 *
 * ⛔ 5번이 겪은 함정을 그대로 밟지 않는다 —
 *   ① 장수를 손으로 안 적는다. `public/100y/cardnews` 를 **세어서** 쓴다.
 *   ② 근거 없는 파일에 지면을 지어내지 않는다 — `.근거.json` 이 없으면 **뺀다**.
 *   ③ 파는 지면(`/price`)으로 가는 근거 줄은 이미지의 «집»으로 안 쓴다 — 그 카드가
 *     실제로 실려 있는 무료 지면(`/report/area/...` 등)을 우선한다.
 */
const 카드뉴스방 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public/100y/cardnews');

function 카드뉴스짝들(): 짝[] {
  if (!fs.existsSync(카드뉴스방)) return [];
  const 파일들 = fs.readdirSync(카드뉴스방);
  const 덱별: Map<string, string[]> = new Map();
  for (const f of 파일들) {
    const m = f.match(/^(.+)-(\d+)\.png$/);
    if (!m) continue;
    const 슬러그 = m[1];
    if (!덱별.has(슬러그)) 덱별.set(슬러그, []);
    (덱별.get(슬러그) as string[]).push(f);
  }
  const 나온것: 짝[] = [];
  for (const [슬러그, 파일들] of 덱별) {
    const 근거길 = path.join(카드뉴스방, `${슬러그}.근거.json`);
    if (!fs.existsSync(근거길)) continue; // ⛔ 근거 없이 지면을 지어내지 않는다
    let 근거: any;
    try {
      근거 = JSON.parse(fs.readFileSync(근거길, 'utf8'));
    } catch {
      continue;
    }
    const 줄들 = Array.isArray(근거) ? 근거 : (근거.자료 ?? 근거.근거 ?? []);
    if (!Array.isArray(줄들) || !줄들.length) continue;
    const 지면후보 = 줄들.map((r: any) => r.지면).filter(Boolean) as string[];
    if (!지면후보.length) continue;
    /* ⛔ /price 는 파는 지면이다. 카드의 «집»으로 안 쓴다 — 무료 지면을 먼저 고른다 */
    const 지면 = 지면후보.find((u) => !u.includes('/price')) ?? 지면후보[0];
    const 지면경로 = 지면.replace(ORIGIN, '');
    /** ⛔ 제목을 지어내지 않는다 — 근거의 첫 줄 «뜻»을 그대로 쓴다 */
    const 제목 = (줄들[0]?.뜻 as string) ?? 슬러그;
    for (const f of 파일들.sort()) {
      나온것.push({ 지면: 지면경로, 그림: `/cardnews/${f}`, 제목 });
    }
  }
  return 나온것;
}

export const GET: APIRoute = () => {
  const 짝들: 짝[] = [];

  /* 지역 한 벌 — **지면 사이트맵과 같은 조건.** 2026-08-25 사장님 지시로 파는 지면도
     검색에 열렸다(`price.ts` 의 `파는지면검색.연다`) — 손으로 조건을 다시 안 적는다 */
  for (const a of (지역단위 as any).단위 as any[]) {
    if (!파는지면검색.연다 && 한벌로팔만한가(a.곳)) continue;
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

  짝들.push(...카드뉴스짝들());

  /* ⭐ 주제 지면 전용 공유카드(make-og-100y-topics.mjs) — 새 지면 낼 때마다 한 줄씩 늘린다 */
  짝들.push(
    { 지면: '/hiking', 그림: '/og/hiking.png', 제목: '나이대별 등산 참여율' },
    { 지면: '/golf', 그림: '/og/golf.png', 제목: '나이대별 골프 참여율' },
    { 지면: '/workout', 그림: '/og/workout.png', 제목: '나이대별 헬스 참여율' },
    { 지면: '/cycling', 그림: '/og/cycling.png', 제목: '나이대별 자전거 참여율' },
    { 지면: '/swimming', 그림: '/og/swimming.png', 제목: '나이대별 수영 참여율' },
    { 지면: '/soccer', 그림: '/og/soccer.png', 제목: '나이대별 축구·풋살 참여율' },
    { 지면: '/parental-leave', 그림: '/og/parental-leave.png', 제목: '부모 나이대별 육아휴직 사용률' },
    { 지면: '/nursery-fill', 그림: '/og/nursery-fill.png', 제목: '어린이집 정원 대비 현원' },
  );

  /** ⭐ 한 지면에 그림이 여럿이면(예: report/area 의 OG 카드 + 카드뉴스 다섯 장) 한 <url> 에 모은다.
   *  ⛔ 같은 loc 으로 <url> 을 두 번 안 낸다 — 구글이 겹친 것으로 헷갈릴 수 있다. */
  const 지면별: Map<string, { 제목: string; 그림들: string[] }> = new Map();
  for (const x of 짝들) {
    if (!지면별.has(x.지면)) 지면별.set(x.지면, { 제목: x.제목, 그림들: [] });
    지면별.get(x.지면)!.그림들.push(x.그림);
  }

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...지면별.entries()]
  .map(
    ([지면, v]) =>
      `  <url><loc>${주소(지면)}</loc>${v.그림들
        .map((그림) => `<image:image><image:loc>${주소(그림)}</image:loc><image:title>${esc(v.제목)}</image:title></image:image>`)
        .join('')}</url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
