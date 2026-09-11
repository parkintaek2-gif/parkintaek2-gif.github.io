import type { APIRoute } from 'astro';
import fs from 'node:fs';
import { SITE_URL, CATEGORIES } from '../consts';
import { publishedArticles } from '../lib/articles';
import { getPagedTags } from '../lib/tags';
import countryProfiles from '../data/country-trade-profiles.json';

type Video = { title: string; description: string; thumbnail: string; content: string };
type Image = { loc: string; title: string };
type Url = { loc: string; lastmod?: Date; priority: string; changefreq: string; video?: Video; image?: Image };

// XML 이스케이프 — 제목·설명에 &, <, > 가 들어오면 사이트맵이 깨진다.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function getStaticPaths() {
  return [{ params: { section: 'pages' } }, ...CATEGORIES.map((c) => ({ params: { section: c.slug } }))];
}

const xml = (urls: Url[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.image ? `
    <image:image>
      <image:loc>${SITE_URL}${u.image.loc}</image:loc>
      <image:title>${esc(u.image.title)}</image:title>
    </image:image>` : ''}${u.video ? `
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
      /* 🔴 [2026-09-11 · 5번] 기사·태그 «허브». 낱장 132·108 장이 사는데 모으는 장이 404 였다.
       *   손님이 닿을 길이 사이트맵뿐이었고, 사이트맵을 손으로 여는 손님은 없다. */
      { loc: '/article', lastmod: newest, changefreq: 'daily', priority: '0.9' },
      { loc: '/tag', lastmod: newest, changefreq: 'weekly', priority: '0.8' },
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
      /* 🔴 [2026-09-12 · 4번] F6 무료 영문 지면 넷(Financials·Valuation·Index·Consensus) —
       *   target-changes(Consensus)만 여기 있었고 나머지 셋은 라이브 200인데 이 목록에
       *   없었다. 같은 사고가 이 파일에서 벌써 세 번째다(위 5번 주석 두 곳 참고).
       *   ⛔ 지면을 만들면 «같은 커밋에서» 이 목록에 넣는다. */
      { loc: '/data/financials', changefreq: 'weekly', priority: '0.9' },
      { loc: '/data/valuation', changefreq: 'weekly', priority: '0.9' },
      { loc: '/data/indices', changefreq: 'weekly', priority: '0.9' },
      { loc: '/data/sector-workforce-panel', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/pension-wage-panel', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/target-price-accuracy', changefreq: 'weekly', priority: '0.8' },
      /* 🔴 [2026-09-09 · 5번] P5 무료 지면 — Korea Consensus Tape 의 깔때기.
       *   ⚠ 「맞췄나」(target-price-accuracy)와 다른 지면이다 — 이쪽은 「누가 언제 «바꿨나»」다.
       *   ⛔ 지면을 내면 사이트맵에 «같은 커밋에서» 넣는다. 오늘 KCW 쪽에서 이것을 잊어
       *     세 지면이 라이브 200 이면서 검색엔 안 알려진 채로 몇 시간 있었다. */
      { loc: '/data/target-changes', changefreq: 'daily', priority: '0.8' },
      /* P5 둘째 무료 지면 — Korea Ownership Ledger 의 깔때기 (2026-09-09 · 5번) */
      { loc: '/data/ownership', changefreq: 'weekly', priority: '0.8' },
      /* P5 셋째 무료 지면 — Korea Mezzanine Book 의 깔때기 (2026-09-09 · 5번) */
      { loc: '/data/mezzanine', changefreq: 'weekly', priority: '0.8' },
      /* P5 넷째 무료 지면 — Korea People Panel 의 깔때기 (2026-09-09 · 5번) */
      { loc: '/data/people', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/board-composition', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/analyst-attention', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/broker-candour', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/sector-leaders', changefreq: 'weekly', priority: '0.8' },
      // 관세청 무역 데이터 상품 — 국가×월 수출입. 무료 CSV + 라이브 API 로 이어진다(2026-08-21).
      { loc: '/data/korea-trade-dataset', lastmod: newest, changefreq: 'weekly', priority: '0.8' },
      // Korea Concentration Index — 주가×관세청 교차. 무료 지면 + 일일 CSV → 유료 피드(2026-08-22).
      { loc: '/data/concentration', lastmod: newest, changefreq: 'daily', priority: '0.9' },
      { loc: '/data/korea-concentration.csv', changefreq: 'daily', priority: '0.6' },
      // 채권 거래집중 무료 CSV — 인용 유도용(2026-08-26, 5번 「자료 먼저」). 발견돼야 인용된다.
      { loc: '/data/korea-bond-concentration.csv', changefreq: 'weekly', priority: '0.6' },
      // 🔴 [2026-09-11 · 5번] 이 둘을 «만들고 여기 넣는 것을 잊었다». bond-boards 는
      // 오늘 새벽에 냈는데 몇 시간 동안 라이브 200 이면서 검색엔 안 알려진 상태였다.
      // ⛔ 지면을 만들면 «같은 커밋에서» 이 목록에 넣는다.
      { loc: '/data/bond-boards', changefreq: 'daily', priority: '0.9' },
      // 펀드 등록원부를 «설정연도 × 유형»으로 읽은 지면. 남들이 안 세는 축이다.
      { loc: '/data/fund-shelf', changefreq: 'weekly', priority: '0.9' },
      /* 🔴 [2026-09-12 · 4번] 전수 대조로 더 찾은 누락 넷 — 전부 라이브 200,
       *   셋(kospi-weights·largest-companies·trading-partners)은 «서치콘솔이 가리켜»
       *   5번이 2026-09-11에 만든 지면인데 사이트맵에는 못 들어갔다. 수요를 확인하고
       *   만든 지면이 검색엔 안 보이는 채로 있었다. */
      { loc: '/data/kospi-weights', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/largest-companies', changefreq: 'weekly', priority: '0.8' },
      { loc: '/data/trading-partners', changefreq: 'weekly', priority: '0.7' },
      { loc: '/data/korea-valuation.csv', changefreq: 'weekly', priority: '0.6' },
      { loc: '/data/korea-trade.csv', changefreq: 'weekly', priority: '0.6' },
      { loc: '/data/korea-trade-balance.csv', changefreq: 'weekly', priority: '0.6' },
      { loc: '/data/korean-listed-workforce.csv', changefreq: 'weekly', priority: '0.6' },
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
      // 나라별 무역 프로필 — 「korea trade with X」 롱테일 대량(2026-08-27 사장님 지시: 관세청 캐시카우·방문 지렛대).
      { loc: '/trade', lastmod: newest, changefreq: 'weekly', priority: '0.8' },
      ...countryProfiles.profiles.map((p: { slug: string }) => ({
        loc: `/trade/${p.slug}`,
        lastmod: countryProfiles.asOf ? new Date(countryProfiles.asOf) : newest,
        changefreq: 'weekly',
        priority: '0.7',
      })),
    ];
  } else {
    // 기사에 세로 숏영상(+썸네일용 첫 카드뉴스)이 있으면 <video:video> 를 붙여 구글 비디오 검색에 알린다.
    // 썸네일 없으면 구글이 버리므로 mp4·첫카드 둘 다 있을 때만(2026-08-24 5번 총괄 발견).
    urls = (await publishedArticles(section)).map((a) => {
      const hasVid = fs.existsSync(`public/video/${a.id}.mp4`) && fs.existsSync(`public/cardnews/${a.id}-1.png`);
      // 기사별 공유카드(og)를 이미지 사이트맵에 — 구글 이미지 검색 노출 자리(2026-08-25 사장님 말씀: 카드도 검색자리).
      const hasOg = fs.existsSync(`public/og/${a.id}.png`);
      return {
        loc: `/article/${a.id}`,
        lastmod: a.data.updatedDate ?? a.data.pubDate,
        changefreq: 'weekly',
        priority: '0.7',
        ...(hasOg ? { image: { loc: `/og/${a.id}.png`, title: a.data.title.slice(0, 200) } } : {}),
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
