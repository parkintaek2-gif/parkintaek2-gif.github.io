import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import markets from '../../data/wikitip-markets.json';
import titlePages from '../../data/wikitip-title-pages.json';
import firmPages from '../../data/wikitip-firm-pages.json';

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
  /**
   * 카드뉴스 여러 장. 2026-08-14 —
   * 🔴 카드뉴스 15장을 서버에 올려 놓고 **사이트맵에도 어느 지면에도 안 걸어** 두었다.
   *   서버에 있는 것과 걸린 것은 다르다. 안 걸면 검색이 못 보고, 만든 값이 0이다.
   * ⛔ 손으로 적지 않는다. `cardnewsSets` 에서 뽑는다 — 벌이 늘면 저절로 따라온다.
   */
  images?: { loc: string; title: string; caption: string }[];
};

/**
 * 카드뉴스 벌. `public/wikitip/cardnews/<이름>/01..05.png` 와 짝이 맞아야 한다.
 * ⚠ 벌을 새로 만들면 여기 한 줄을 같이 넣는다 — 안 넣으면 검색이 그 벌을 모른다.
 */
const cardnewsSets: { set: string; page: string; count: number; title: string; caption: string }[] = [
  {
    set: 'fame',
    page: '/fame-compare',
    count: 5,
    title: 'One Korean act outreads Son Heung-min in Southeast Asia',
    caption: 'Five cards: BTS, Son Heung-min and the brands they front, on one scale.',
  },
  {
    set: 'manager',
    page: '/sea-athletes',
    count: 5,
    title: 'A Korean football manager is read where he was hired',
    caption: 'Five cards: players spread across the region, managers concentrate in one country.',
  },
  {
    set: 'malaysia',
    page: '/malaysia',
    count: 5,
    title: 'Malaysia reads Korean brands more readily than Korean people',
    caption: 'Five cards: four groups in a narrow band, one well outside it.',
  },
  {
    set: 'places',
    page: '/places',
    count: 5,
    title: 'A Korean record label is looked up more than Seoul is',
    caption: 'Five cards: where reading about Korea sits, and what this cannot see.',
  },
];

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
    /* 56편째 기사의 표. 2026-08-09 07:3x — 차트 한가운데에 산다 */
    { path: '/rank-shape', priority: '0.9', changefreq: 'weekly' },
    /* 57편째 기사의 표. 2026-08-09 08:3x — 카탈로그가 커도 편당은 안 늘어난다 */
    { path: '/catalogue-reach', priority: '0.9', changefreq: 'weekly' },
    /* 58편째 기사의 표. 2026-08-09 10:2x — 방송을 거친 시리즈와 안 거친 시리즈 */
    { path: '/two-pipelines', priority: '0.9', changefreq: 'weekly' },
    /* 59편째 기사의 표. 2026-08-09 12:2x — 돌아온 줄 알았더니 시즌 2 */
    { path: '/returns', priority: '0.9', changefreq: 'weekly' },
    /*
     * 61편째 기사의 표. 2026-08-09 16:2x — 회사가 한 나라에 발을 들이면 다음 작품이 쉬운가.
     * ⚠ 지면을 낸 그 빌드에서 이 줄을 안 넣어 검사가 잡았다. 오늘 GSC 에서 본
     *   「Google에는 아직 알려지지 않은 URL」이 바로 이 상태에서 나온다.
     */
    { path: '/foothold', priority: '0.9', changefreq: 'weekly' },
    /* 62편째 기사의 표. 2026-08-09 18:0x — 같은 회사 작품 둘이 한 차트에 서면 반 칸 내려간다 */
    { path: '/siblings', priority: '0.9', changefreq: 'weekly' },
    /* 63편째 기사의 표. 2026-08-09 18:2x — 이웃 차트는 신호가 아니라 하나의 줄이다 */
    { path: '/lead-lag', priority: '0.9', changefreq: 'weekly' },
    /* 64편째 기사의 표. 2026-08-09 19:1x — 순위가 시청을 얼마나 말해 주나(우리 물건의 한계) */
    { path: '/rank-tells', priority: '0.9', changefreq: 'weekly' },
    /* 65편째 기사의 표. 2026-08-09 21:2x — 7.7% 는 고르게가 아니라 몰려 있다 */
    { path: '/clumping', priority: '0.9', changefreq: 'weekly' },
    /* 66편째 기사의 표. 2026-08-09 22:3x — 제작비 27배 이야기가 예고한 몰림은 **안 왔다** */
    { path: '/leverage', priority: '0.9', changefreq: 'weekly' },
    /* 67편째 기사의 표. 2026-08-09 23:2x — 들어오는 것만 재 왔다. **나가는 자리**를 처음 잰다 */
    { path: '/exit', priority: '0.9', changefreq: 'weekly' },
    /* 68편째 기사의 표. 2026-08-10 00:4x — 작품은 26.4% 줄었는데 자리는 안 줄었다 */
    { path: '/fewer-titles', priority: '0.9', changefreq: 'weekly' },
    /* 69편째 기사의 표. 2026-08-10 01:3x — 한국 영화는 남과 같고 **한국 시리즈만** 오래 간다 */
    { path: '/run-length', priority: '0.9', changefreq: 'weekly' },
    /* 70편째 기사의 표. 2026-08-10 02:2x — 들어온 자리가 얼마나 갈지를 얼마나 말해 주나 */
    { path: '/opening', priority: '0.9', changefreq: 'weekly' },
    /* 71편째 기사의 표. 2026-08-10 04:0x — 언제 가장 넓게 퍼지나(밀어 줄 때) */
    { path: '/time-to-peak', priority: '0.9', changefreq: 'weekly' },
    /* 72편째 기사의 표. 2026-08-10 04:4x — 어느 시장이 넓은 작품만 받나(배급 순서) */
    { path: '/hard-markets', priority: '0.9', changefreq: 'weekly' },
    { path: '/provenance', priority: '0.9', changefreq: 'weekly' },
    { path: '/crowding', priority: '0.9', changefreq: 'weekly' },
    /* 갈래 목록 — ⛔ 기사가 없는 갈래(tradition)는 지면이 안 생기므로 여기 안 넣는다 */
    { path: '/section/stars', priority: '0.8', changefreq: 'weekly' },
    { path: '/section/titles', priority: '0.8', changefreq: 'weekly' },
    { path: '/section/industry', priority: '0.8', changefreq: 'weekly' },
    { path: '/section/tradition', priority: '0.8', changefreq: 'weekly' },
    { path: '/zodiac', priority: '0.9', changefreq: 'weekly' },
    /* 77편째 기사의 표. 2026-08-13 — 동남아 넷이 서로 다른 한국 선수를 찾아본다(사장님 지시) */
    { path: '/sea-athletes', priority: '0.9', changefreq: 'weekly' },
    /* 76편째 기사의 표. 2026-08-13 — 배우 절반이 차트 작품 한 편뿐. 음성 결과를 같이 낸다 */
    { path: '/one-title', priority: '0.9', changefreq: 'weekly' },
    /* 78편째 기사의 표. 2026-08-13 — 이스포츠 열한 명이 전원 같은 한 달에 몰린다 */
    { path: '/one-month', priority: '0.9', changefreq: 'weekly' },
    /* 79편째 기사의 표. 2026-08-13 — 견줄 상대가 화면에 없다. 비교가 안 된 것이 결과다 */
    { path: '/esports-nations', priority: '0.9', changefreq: 'weekly' },
    /* 80편째 기사의 표. 2026-08-13 — 「이스포츠」라 부른 것이 한 게임이었다. 78편을 좁힌다 */
    { path: '/esports-games', priority: '0.9', changefreq: 'weekly' },
    /* 81편째 기사. 2026-08-13 — 감독은 자기를 뽑은 나라에서만 읽힌다(사장님 물음) */
    /* 82·83편째 기사의 표. 2026-08-13 — 연예인이 선수보다 높나(사장님 물음).
       배우만 볼 땐 아니었는데 가수를 넣으니 BTS 하나가 손흥민을 넘었다. 브랜드·자동차도 같이 잰다 */
    { path: '/fame-compare', priority: '0.9', changefreq: 'weekly' },
    /* 85편째 기사의 표. 2026-08-14 — 무엇이 나라를 안 가리나. K팝 그룹이 가장 고르다.
       ⚠ 이스포츠 100% 는 관심이 아니라 **문서가 한 판에만 있어서**다. 지면에 그 말을 적었다 */
    { path: '/spread', priority: '0.9', changefreq: 'weekly' },
    /* 86편째 기사의 표. 2026-08-14 — 사장님 지도 시장 조사 지시.
       ⛔ 가게는 못 잰다(위키에 식당 문서가 없다). TourAPI 열쇠가 있어야 얹힌다 */
    { path: '/places', priority: '0.9', changefreq: 'weekly' },
    /* 84편째 기사의 표. 2026-08-14 — 말레이시아만 다르다. 사람은 8%인데 브랜드는 23% */
    { path: '/malaysia', priority: '0.9', changefreq: 'weekly' },
    /* 파는 자리. 2026-08-09 12:5x — 2번 지시(B2B 손님이 올 첫 지면) */
    { path: '/for-industry', priority: '0.9', changefreq: 'monthly' },
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

  /*
   * 회사 지면 8장. 2026-08-09 21:5x — 2번 지시(「지면 8장」).
   * ⛔ 손으로 안 적는다. 시장·작품과 **같은 방식으로 자료에서 뽑는다** — 늘거나 줄면 저절로 따라온다.
   */
  for (const x of firmPages.firms) {
    entries.push({ path: `/firm/${x.slug}`, priority: '0.8', changefreq: 'weekly' });
  }

  /* 작품 지면. 2026-08-09 09:0x — 시장과 **같은 방식으로 자료에서 뽑는다.**
     ⛔ 손으로 적지 않는다. 얇아서 안 내는 작품은 hasPage 가 false 라 저절로 빠진다.
     2번이 「사이트맵에 들어갔나 — 오늘 두 번 빠뜨린 자리」라고 짚은 그 자리다. */
  for (const x of titlePages.titles.filter((y) => y.hasPage)) {
    entries.push({ path: `/title/${x.slug}`, priority: '0.7', changefreq: 'weekly' });
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

  /**
   * 🔴 2026-08-14 — 카드뉴스를 그 지면 줄에 **그림으로 붙인다.**
   *   지면은 이미 목록에 있으니 새 줄을 만들지 않는다. 그림만 얹는다.
   * ⛔ 짝이 되는 지면이 목록에 없으면 **조용히 넘기지 않고 던진다** —
   *   조용히 넘기면 오늘 겪은 그 일(만들어 놓고 안 걸림)이 그대로 되풀이된다.
   */
  for (const c of cardnewsSets) {
    const 줄 = entries.find((e) => e.path === c.page);
    if (!줄) throw new Error(`카드뉴스 ${c.set} 의 짝 지면 ${c.page} 이 사이트맵에 없다`);
    줄.images = Array.from({ length: c.count }, (_, i) => ({
      loc: `${ORIGIN}/cardnews/${c.set}/${String(i + 1).padStart(2, '0')}.png`,
      title: c.title,
      caption: c.caption,
    }));
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
    for (const img of [...(e.image ? [e.image] : []), ...(e.images ?? [])]) {
      줄.push('    <image:image>');
      줄.push(`      <image:loc>${img.loc}</image:loc>`);
      줄.push(`      <image:title>${xml(img.title)}</image:title>`);
      줄.push(`      <image:caption>${xml(img.caption)}</image:caption>`);
      줄.push('    </image:image>');
    }
    return `  <url>\n${줄.join('\n')}\n  </url>`;
  })
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
