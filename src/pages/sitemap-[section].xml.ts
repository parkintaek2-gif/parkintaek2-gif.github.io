import type { APIRoute } from 'astro';
import { SITE_URL, CATEGORIES } from '../consts';
import { publishedArticles } from '../lib/articles';

type Url = { loc: string; lastmod?: Date; priority: string; changefreq: string };

export function getStaticPaths() {
  return [{ params: { section: 'pages' } }, ...CATEGORIES.map((c) => ({ params: { section: c.slug } }))];
}

const xml = (urls: Url[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

export const GET: APIRoute = async ({ params }) => {
  const section = params.section!;
  let urls: Url[];

  if (section === 'pages') {
    const all = await publishedArticles();
    const newest = all[0]?.data.pubDate;
    urls = [
      { loc: '', lastmod: newest, changefreq: 'daily', priority: '1.0' },
      // 데이터 API 판매 화면. 개발자 검색 유입이 곧 영업이라 우선순위를 높게 둔다.
      { loc: '/api', changefreq: 'weekly', priority: '0.9' },
      { loc: '/about', changefreq: 'monthly', priority: '0.5' },
      // 데이터 랭킹 지면 — 검색 유입 가치가 있는데 사이트맵에 빠져 있었다(손님 걸음 2026-08-07 실측).
      { loc: '/rankings', lastmod: newest, changefreq: 'weekly', priority: '0.8' },
      // 데이터 상품 지면들 — 기업이 살 「주소」다. 검색 유입이 곧 영업. 5장이 사이트맵에 0개였다(56316, 2026-08-09).
      { loc: '/data', changefreq: 'weekly', priority: '0.9' },
      { loc: '/data/sector-workforce-panel', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/pension-wage-panel', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/target-price-accuracy', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/board-composition', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/analyst-attention', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/broker-candour', changefreq: 'weekly', priority: '0.8' },
      // 파는 조건 지면 — 사는 쪽 법무가 본다.
      { loc: '/terms', changefreq: 'monthly', priority: '0.3' },
      { loc: '/refund', changefreq: 'monthly', priority: '0.3' },
      // 구독자 모으는 유일한 자리 — 검색이 못 찾으면 유입이 없다.
      { loc: '/newsletter', changefreq: 'monthly', priority: '0.5' },
      ...CATEGORIES.map((c) => ({
        loc: `/${c.slug}`,
        lastmod: all.find((a) => a.data.category === c.slug)?.data.pubDate,
        changefreq: 'daily',
        priority: '0.8',
      })),
    ];
  } else {
    urls = (await publishedArticles(section)).map((a) => ({
      loc: `/article/${a.id}`,
      lastmod: a.data.updatedDate ?? a.data.pubDate,
      changefreq: 'weekly',
      priority: '0.7',
    }));
  }

  return new Response(xml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
