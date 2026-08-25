import type { APIRoute } from 'astro';
import fs from 'node:fs';
import { SITE_URL, CATEGORIES } from '../consts';
import { publishedArticles } from '../lib/articles';
import { getPagedTags } from '../lib/tags';

type Video = { title: string; description: string; thumbnail: string; content: string };
type Url = { loc: string; lastmod?: Date; priority: string; changefreq: string; video?: Video };

// XML 이스케이프 — 제목·설명에 &, <, > 가 들어오면 사이트맵이 깨진다.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function getStaticPaths() {
  return [{ params: { section: 'pages' } }, ...CATEGORIES.map((c) => ({ params: { section: c.slug } }))];
}

const xml = (urls: Url[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.video ? `
    <video:video>
      <video:thumbnail_loc>${SITE_URL}${u.video.thumbnail}</video:thumbnail_loc>
      <video:title>${esc(u.video.title)}</video:title>
      <video:description>${esc(u.video.description)}</video:description>
      <video:content_loc>${SITE_URL}${u.video.content}</video:content_loc>
    </video:video>` : ''}
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
      // 커뮤니티 허브 — 손님이 「갈 곳」이자 갈래 지면으로 가는 문. 새 지면이라 목록에 빠져 있었다(2026-08-21).
      { loc: '/community', lastmod: newest, changefreq: 'weekly', priority: '0.7' },
      // 데이터 API 판매 화면. 개발자 검색 유입이 곧 영업이라 우선순위를 높게 둔다.
      { loc: '/api', changefreq: 'weekly', priority: '0.9' },
      // 파는 지면 — 사는 쪽이 검색으로 찾는 자리다.
      { loc: '/pricing', changefreq: 'weekly', priority: '0.6' },
      { loc: '/about', changefreq: 'monthly', priority: '0.5' },
      { loc: '/contact', changefreq: 'monthly', priority: '0.4' },
      { loc: '/privacy', changefreq: 'monthly', priority: '0.3' },
      // 데이터 랭킹 지면 — 검색 유입 가치가 있는데 사이트맵에 빠져 있었다(손님 걸음 2026-08-07 실측).
      { loc: '/rankings', lastmod: newest, changefreq: 'weekly', priority: '0.8' },
      // 영상 갤러리 — 세로 숏영상 51편을 한자리에. 구글 비디오 축 + 체류(2026-08-24 방문 올인).
      { loc: '/video', lastmod: newest, changefreq: 'weekly', priority: '0.7' },
      // 데이터 상품 지면들 — 기업이 살 「주소」다. 검색 유입이 곧 영업. 5장이 사이트맵에 0개였다(56316, 2026-08-09).
      { loc: '/data', changefreq: 'weekly', priority: '0.9' },
      { loc: '/data/sector-workforce-panel', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/pension-wage-panel', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/target-price-accuracy', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/board-composition', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/analyst-attention', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/broker-candour', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/sector-leaders', changefreq: 'weekly', priority: '0.8' },
      // 관세청 무역 데이터 상품 — 국가×월 수출입. 무료 CSV + 라이브 API 로 이어진다(2026-08-21).
      { loc: '/data/korea-trade-dataset', lastmod: newest, changefreq: 'weekly', priority: '0.8' },
      // Korea Concentration Index — 주가×관세청 교차. 무료 지면 + 일일 CSV → 유료 피드(2026-08-22).
      { loc: '/data/concentration', lastmod: newest, changefreq: 'daily', priority: '0.9' },
      { loc: '/data/korea-concentration.csv', changefreq: 'daily', priority: '0.6' },
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
      // 태그 허브(2편↑) — 지면 문턱과 «같은 2편»(어긋나면 404 가 사이트맵에 실린다). 2026-08-25.
      ...(await getPagedTags()).map((t) => ({
        loc: `/tag/${t.slug}`,
        lastmod: t.articles[0]?.data.pubDate,
        changefreq: 'weekly',
        priority: '0.6',
      })),
    ];
  } else {
    // 기사에 세로 숏영상(+썸네일용 첫 카드뉴스)이 있으면 <video:video> 를 붙여 구글 비디오 검색에 알린다.
    // 썸네일 없으면 구글이 버리므로 mp4·첫카드 둘 다 있을 때만(2026-08-24 5번 총괄 발견).
    urls = (await publishedArticles(section)).map((a) => {
      const hasVid = fs.existsSync(`public/video/${a.id}.mp4`) && fs.existsSync(`public/cardnews/${a.id}-1.png`);
      return {
        loc: `/article/${a.id}`,
        lastmod: a.data.updatedDate ?? a.data.pubDate,
        changefreq: 'weekly',
        priority: '0.7',
        ...(hasVid
          ? {
              video: {
                title: a.data.title.slice(0, 100),
                description: a.data.dek.slice(0, 2048),
                thumbnail: `/cardnews/${a.id}-1.png`,
                content: `/video/${a.id}.mp4`,
              },
            }
          : {}),
      };
    });
  }

  return new Response(xml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
