import type { APIRoute } from 'astro';
import { SITE_URL, CATEGORIES } from '../consts';

/**
 * 사이트맵 색인. 실제 URL 목록은 카테고리별 파일로 쪼개져 있다.
 * 기사가 수만 건이 돼도 파일 하나가 비대해지지 않는다.
 */
export const GET: APIRoute = () => {
  const files = ['pages', ...CATEGORIES.map((c) => c.slug)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `  <sitemap><loc>${SITE_URL}/sitemap-${f}.xml</loc></sitemap>`).join('\n')}
</sitemapindex>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
