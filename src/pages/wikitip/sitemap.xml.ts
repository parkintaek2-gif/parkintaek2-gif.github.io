import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import markets from '../../data/wikitip-markets.json';

/**
 * K Culture Wire 사이트맵.
 * server.mjs 가 www.kculturewire.com/sitemap.xml → dist/wikitip/sitemap.xml 로 보낸다.
 * ⚠ 주소에 내부 접두사 `/wikitip` 을 붙이지 않는다. 방문자 주소는 https://www.kculturewire.com/titles 다.
 * ⚠ noindex 인 지면(404)은 넣지 않는다 — 사이트맵과 메타태그가 어긋나면 모순된 신호가 된다.
 * 도메인은 **www** 다(2026-08-06 · 루트는 www 로 301). canonical 과 같은 주소를 쓴다.
 *
 * ── 그림도 올린다 (2026-08-08, 2번 지시 · 사장님 지시) ────────
 * 사장님: 「사진이 등록돼 있는지 확인하고 안 되었으면 직접 등록하라. 텍스트뿐 아니라 모든 콘텐츠 다」
 * 카드 37장을 만들어 놓고 사이트맵이 그걸 모르면 만든 값이 절반이다.
 *
 * ⛔ **그림은 기사에만 단다.** 자료 지면(/titles 같은 것)에는 안 단다 —
 *    그 지면들이 담은 것은 표지 그림이 아니라 표다. 기본 카드를 스물몇 장에 똑같이 달면
 *    「이 지면에 이 그림이 있다」는 **거짓 신호**가 된다. 우리가 파는 것이 신뢰인데 거기서 깎인다.
 *    기사 카드는 다르다 — 그 기사의 제목과 그 기사의 수가 박힌, **그 기사만의 그림**이다.
 *
 * ⚠ 지면을 새로 만들면 여기 한 줄을 같이 넣는다. 안 넣으면 검색엔 열려 있는데 사이트맵엔 없다 —
 *   실제로 `/data` 가 하루 동안 그 상태였다(2026-08-08 09:4x 실측). 이제
 *   `check-search-readiness.mjs` 가 빌드된 지면과 사이트맵을 맞대 보고 빠지면 선다.
 */
const ORIGIN = 'https://www.kculturewire.com';
type Entry = {
  path: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
  /** 그 지면을 대표하는 그림. 기사에만 붙는다 — 위 ⛔ 를 볼 것 */
  image?: { loc: string; title: string; caption: string };
};

/** XML 에 그대로 넣으면 안 되는 글자. 제목에 & 와 ' 가 실제로 있다 */
const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const entries: Entry[] = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/titles', priority: '0.9', changefreq: 'weekly' },
    { path: '/watched', priority: '0.9', changefreq: 'weekly' },
    { path: '/actors', priority: '0.9', changefreq: 'weekly' },
    { path: '/workforce', priority: '0.9', changefreq: 'weekly' },
    { path: '/exports', priority: '0.9', changefreq: 'yearly' },   // KOSIS 가 해마다 낸다
    { path: '/tv-exports', priority: '0.9', changefreq: 'yearly' },
    { path: '/webtoon', priority: '0.9', changefreq: 'yearly' },
    { path: '/industry', priority: '0.9', changefreq: 'yearly' },
    { path: '/staying-power', priority: '0.9', changefreq: 'weekly' },
    { path: '/ladder-gap', priority: '0.9', changefreq: 'daily' },
    { path: '/reach', priority: '0.9', changefreq: 'weekly' },
    { path: '/ladder-churn', priority: '0.9', changefreq: 'daily' },
    { path: '/screen-split', priority: '0.9', changefreq: 'weekly' },
    { path: '/kpop-attention', priority: '0.9', changefreq: 'weekly' },
    /* 44편째 기사의 표. 2026-08-08 17:0x — 기사만 내고 지면을 안 내면 카드의
       「every figure has a table behind it」이 거짓말이 된다 */
    { path: '/home-first', priority: '0.9', changefreq: 'weekly' },
    /* 45편째 기사의 표. 2026-08-08 17:2x — 93개국 자리 셈 */
    { path: '/world-share', priority: '0.9', changefreq: 'weekly' },
    /* 46편째 기사의 표. 2026-08-08 18:5x, 2번 지시 —
       기사에 「every figure has a table behind it」이라 적어 놓고 표가 없던 것을 메운다 */
    { path: '/catalogue-depth', priority: '0.9', changefreq: 'weekly' },
    /* 48편째 기사의 표. 2026-08-08 21:1x — 들어온 주가 꼭대기였나 */
    { path: '/climb', priority: '0.9', changefreq: 'weekly' },
    /* 51편째 기사의 표. 2026-08-09 04:1x — 집에서 오래 걸리면 밖으로도 가나 */
    { path: '/home-abroad', priority: '0.9', changefreq: 'weekly' },
    /* 52편째 기사의 표. 2026-08-09 05:0x — 도착하나 번지나 */
    { path: '/arrival', priority: '0.9', changefreq: 'weekly' },
    /* 53편째 기사의 표. 2026-08-09 05:3x — 줄어든 게 아니라 옮겨 갔다 */
    { path: '/where-it-moved', priority: '0.9', changefreq: 'weekly' },
    /* 54편째 기사의 표. 2026-08-09 06:2x — 작품이 멀리 가면 배우도 더 찾아보나 */
    { path: '/actor-reach', priority: '0.9', changefreq: 'weekly' },
    /* 55편째 기사의 표. 2026-08-09 06:3x — 몇 곳이 절반인가 */
    { path: '/who-makes-it', priority: '0.9', changefreq: 'weekly' },
    /*
     * 파는 자료의 착륙 지면. 2026-08-08 04:3x 에 만들어 놓고 **여기 한 줄을 안 넣었다** —
     * 하루 동안 검색엔 열려 있는데 사이트맵엔 없는 어긋난 상태였다. 위 ⚠ 가 이것이다.
     */
    { path: '/data', priority: '0.9', changefreq: 'weekly' },
    /* 기사 목록. 2026-08-07 에 만들었다 — 그전엔 404 라 15편 중 3편만 닿을 수 있었다. */
    { path: '/articles', priority: '0.8', changefreq: 'daily' },
    { path: '/subscribe', priority: '0.8', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    { path: '/corrections', priority: '0.7', changefreq: 'weekly' },
    { path: '/esports', priority: '0.8', changefreq: 'daily' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    /* 쿠키·접속기록을 밝히는 지면. 2026-08-08 에 분석 태그를 붙이면서 같이 냈다 */
    { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
    /* 파는 조건. 2026-08-08 13:4x, 2번 지시로 냈다 */
    { path: '/terms', priority: '0.5', changefreq: 'yearly' },
    { path: '/refund', priority: '0.5', changefreq: 'yearly' },
  ];

  /*
   * 기사는 **손으로 넣지 않는다.** 위 목록처럼 적어 두면 다음 기사를 낼 때 빼먹는다 —
   * 백년지도가 2,483장을 만들어 놓고 사이트맵에 한 번도 안 올린 적이 있다.
   * 컬렉션에서 바로 읽으니 기사를 쓰면 사이트맵에 저절로 들어간다. draft 는 뺀다.
   */
  /*
   * 🔴 2026-08-09 07:2x — **시장 93장을 내고 여기 한 줄을 안 넣었다.**
   *   위 ⚠ 가 정확히 이 일을 적어 두었는데(「지면을 새로 만들면 여기 한 줄을 같이 넣는다」)
   *   그대로 다시 했다. 라이브 사이트맵에 `/market/` 이 **0개**였다.
   *   ⛔ 그리고 `check-search-readiness` 는 **통과했다** — 그 자도 하위 폴더를 안 봤다.
   * ⭐ 그래서 손으로 안 적는다. 기사와 같은 방식으로 **자료에서 뽑는다.**
   *   시장이 늘거나 줄면 사이트맵이 저절로 따라온다.
   */
  for (const m of markets.markets.filter((x) => x.hasPage)) {
    entries.push({ path: `/market/${m.slug}`, priority: '0.8', changefreq: 'weekly' });
  }

  const articles = await getCollection('kcwArticles');
  for (const a of articles.filter((e) => !e.data.draft)) {
    const 날 = a.data.updatedDate ?? a.data.pubDate;
    entries.push({
      path: `/article/${a.id}`,
      priority: '0.9',
      changefreq: 'monthly',
      lastmod: new Date(날).toISOString().slice(0, 10),
      image: {
        /* `scripts/make-og-articles.mjs` 가 기사마다 한 장씩 만든다. 없으면 검사가 선다 */
        loc: `${ORIGIN}/og/${a.id}.png`,
        title: a.data.title,
        caption: a.data.dek,
      },
    });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map((e) => {
    const 줄 = [`    <loc>${ORIGIN}${e.path}</loc>`];
    if (e.lastmod) 줄.push(`    <lastmod>${e.lastmod}</lastmod>`);
    줄.push(`    <changefreq>${e.changefreq}</changefreq>`);
    줄.push(`    <priority>${e.priority}</priority>`);
    if (e.image) {
      줄.push('    <image:image>');
      줄.push(`      <image:loc>${e.image.loc}</image:loc>`);
      줄.push(`      <image:title>${xml(e.image.title)}</image:title>`);
      줄.push(`      <image:caption>${xml(e.image.caption)}</image:caption>`);
      줄.push('    </image:image>');
    }
    return `  <url>\n${줄.join('\n')}\n  </url>`;
  })
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
