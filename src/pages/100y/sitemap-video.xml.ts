import type { APIRoute } from 'astro';
import videos from '../../data/100yearmap/videos.json';

/**
 * 백년지도 **영상 사이트맵** — `/sitemap-video.xml`
 *
 * ⭐ 2026-08-24 — 5번(총괄)이 세 사이트 사이트맵을 다 열어 보고 알려 왔다.
 *   「구글 이미지 검색 · 구글 비디오 검색은 «다른 자리»입니다. 3번은 영상 12편을
 *   만들어 놓고 그 자리에 0편 알렸습니다.」 이미 만든 자료(`videos.json`)를 그대로 옮긴다.
 *
 * ⛔ 5번이 겪은 함정을 그대로 밟지 않는다 —
 *   ① 썸네일이 없는 항목은 구글이 버린다. **반쪽 스키마는 없느니만 못하다** — 뺀다.
 *   ② 길이(`video:duration`)는 초 단위 정수다. `기간`(ISO 8601, "PT14S")이 아니라
 *     이미 있는 `초` 필드(정수)를 그대로 쓴다 — 다시 파싱하지 않는다.
 *   ③ 장수를 손으로 안 적는다 — `videos.json` 을 그대로 돈다.
 */

const ORIGIN = 'https://100yearmap.com';

/** ⚠ 파일 경로가 `/100y/...` 로 저장돼 있다 — server.mjs 가 이 접두사를 벗겨 서비스하므로 뗀다 */
const 접두사뗀다 = (p: string) => p.replace(/^\/100y/, '');

const 주소 = (경로: string) =>
  ORIGIN +
  경로
    .split('/')
    .map((조각) => (조각 ? encodeURIComponent(조각) : 조각))
    .join('/');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = () => {
  const 자료 = (videos as any).영상 as any[];

  /** ⛔ 썸네일·길이·댈지면·파일이 없으면 뺀다 — 반쪽 스키마를 내지 않는다 */
  const 쓸것 = 자료.filter((v) => v.그림 && v.초 != null && v.댈지면 && v.파일);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${쓸것
  .map((v) => {
    const 발행 = v.올라간때 ? `<video:publication_date>${v.올라간때}</video:publication_date>` : '';
    return `  <url><loc>${주소(v.댈지면)}</loc><video:video><video:thumbnail_loc>${주소(접두사뗀다(v.그림))}</video:thumbnail_loc><video:title>${esc(v.이름)}</video:title><video:description>${esc(v.한줄)}</video:description><video:content_loc>${주소(접두사뗀다(v.파일))}</video:content_loc><video:duration>${v.초}</video:duration>${발행}</video:video></url>`;
  })
  .join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
