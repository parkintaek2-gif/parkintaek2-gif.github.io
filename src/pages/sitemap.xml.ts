import type { APIRoute } from 'astro';
import { SITE_URL, CATEGORIES } from '../consts';

/**
 * 사이트맵 색인. 실제 URL 목록은 카테고리별 파일로 쪼개져 있다.
 * 기사가 수만 건이 돼도 파일 하나가 비대해지지 않는다.
 */
export const GET: APIRoute = () => {
  /* ⚠ 나라를 하나 열면 «두 곳»을 고쳐야 한다 — 여기(색인)와 sitemap-[section].xml.ts.
     여기만 빠지면 그 나라 사이트맵이 «만들어지지만 아무도 부르지 않는» 파일이 된다. */
  const files = ['pages', 'companies', 'japan', 'taiwan', 'uae', ...CATEGORIES.map((c) => c.slug)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `  <sitemap><loc>${SITE_URL}/sitemap-${f}.xml</loc></sitemap>`).join('\n')}
</sitemapindex>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
