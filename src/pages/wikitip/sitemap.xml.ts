import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import markets from '../../data/wikitip-markets.json';
import titlePages from '../../data/wikitip-title-pages.json';
import firmPages from '../../data/wikitip-firm-pages.json';
import weekPages from '../../data/kcw-week-pages.json';
/* 🔴 2026-08-24 밤 — 영상 21편 중 «9편만» 이 사이트맵에 있었다. 어느 벌에 실제로 잰
   썸네일이 있는지 자료에서 읽는다. ⛔ 없는 그림 주소를 사이트맵에 적지 않는다 */
import videoData from '../../data/wikitip-video.json';
/* 🔴 같은 날 밤 — 카드뉴스 96벌 474장도 사이트맵에 «0장»이었다. 파일을 세어 적어 둔 것을 읽는다 */
import cardnewsData from '../../data/wikitip-cardnews.json';
import schoolPages from '../../data/wikitip-schools.json';
import groupPages from '../../data/wikitip-groups.json';
import peoplePages from '../../data/wikitip-people.json';

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

/**
 * 🔴 2026-08-15 — **786장 중 88장에만 `lastmod` 가 있었다.** 기사에만 붙고 자료 지면엔 없었다.
 *   검색엔진은 그것으로 「무엇이 새 것인가」를 안다. 없으면 다시 안 와 본다.
 *   ⭐ 3번이 백년지도에서 lastmod 를 붙이고 네이버 수집을 얻었다. 같은 자리다.
 *
 * ⛔ **날짜를 지어내지 않는다.** 지면이 읽는 자료의 `generated` 를 그대로 쓴다.
 *   지면 → 자료는 그 지면 소스의 `import … from '…json'` 줄에서 읽는다. 손으로 짝을 적으면
 *   지면이 늘 때마다 빠진다 — 이 파일에서 이미 두 번 겪은 일이다.
 * ⚠ 자료가 없거나 `generated` 가 없으면 **안 붙인다.** 빈 것보다 틀린 날짜가 나쁘다.
 */
const 지면방 = path.resolve('src/pages/wikitip');
const 자료방 = path.resolve('src/data');

function 지어진날(지면길: string): string | undefined {
  const 소스 = path.join(지면방, `${지면길.replace(/^\//, '') || 'index'}.astro`);
  if (!fs.existsSync(소스)) return undefined;
  const 글 = fs.readFileSync(소스, 'utf8');
  /**
   * 🔴 처음엔 자료의 `generated` 만 봤다. 그랬더니 작품 지면 530장이 **08-09** 로 나왔다.
   *   그런데 그 530장은 8/14 에 내가 고쳤다(표의 한국어를 옮겼다). 자료는 안 바뀌고
   *   **지면이 바뀐** 것이다. ⛔ 자료만 보면 「안 바뀌었다」는 거짓 신호를 보낸다.
   *   ⭐ 지면이 바뀐 때도 같이 본다. 둘 중 **늦은 쪽**이 그 지면이 마지막으로 바뀐 날이다.
   */
  const 날들: string[] = [new Date(fs.statSync(소스).mtime).toISOString().slice(0, 10)];
  for (const m of 글.matchAll(/from\s+'[^']*\/data\/([A-Za-z0-9._-]+\.json)'/g)) {
    const j = path.join(자료방, m[1]);
    if (!fs.existsSync(j)) continue;
    try {
      const g = JSON.parse(fs.readFileSync(j, 'utf8')).generated;
      if (typeof g === 'string' && /^\d{4}-\d{2}-\d{2}/.test(g)) 날들.push(g.slice(0, 10));
    } catch { /* 자료가 깨졌으면 날짜를 안 만든다 */ }
  }
  /* 지면 하나가 자료 여럿을 읽으면 **늦은 쪽**이 그 지면이 바뀐 날이다 */
  return 날들.length ? 날들.sort().at(-1) : undefined;
}
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
  /**
   * 🔴 2026-08-14 — 숏영상 다섯 편이 **어디에도 안 걸려** 있었다. 사이트맵도 몰랐다.
   *   ⛔ 아침에 카드뉴스 15장에서 겪은 「만든 값이 0」을 영상에서 그대로 되풀이했다.
   *   ⭐ 검색이 영상을 찾아 주는 자리가 여기다. 그림과 같은 대접을 한다.
   */
  /* 🔴 한 지면에 영상이 «둘» 걸린 자리가 있다(`/places` 에 outside·places).
     예전 구조는 한 편만 받아서 둘째가 조용히 사라졌다 — 사이트맵 규격은 여러 편을 허용한다 */
  videos?: { loc: string; thumb: string; title: string; description: string; seconds: number }[];
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
  {
    set: 'instrument',
    page: '/titles-to-name',
    count: 5,
    title: 'The question was fine. The instrument was not.',
    caption: 'Five cards: a flat result, a changed ruler, and the same actors reading clearly.',
  },
  {
    set: 'brands',
    page: '/brand-kinds',
    count: 5,
    title: 'The same country is first and last, depending on what you count',
    caption: 'Five cards: Indonesia leads on German cars and trails on luxury houses, '
      + 'and one comparison we could not make.',
  },
  {
    set: 'counting',
    page: '/read-vs-visited',
    count: 5,
    title: 'Seoul has 25 districts. The tourist count can speak for five of them',
    caption: 'Five cards: what the public admissions table can and cannot see about Seoul.',
  },
  {
    set: 'season',
    page: '/look-vs-fly',
    count: 5,
    title: 'They agree on the quiet month, not the busy one',
    caption: 'Five cards: when Southeast Asia looks up a Korean trip, and when the planes fill.',
  },
  {
    set: 'control',
    page: '/what-actually-fell',
    count: 5,
    title: 'A number fell by a third. It was the wrong story',
    caption: 'Five cards: what a control group did to a headline we had already written.',
  },
  {
    set: 'wave',
    page: '/wave-and-floor',
    count: 5,
    /* ⚠ 8/15 정정으로 기사 축이 바뀌었다 — 카드 제목도 같이 바꾼다 */
    title: 'The article is born with the show',
    caption: 'Five cards: why what a Korean hit leaves behind cannot be asked of a new title.',
  },
  {
    set: 'halflife',
    page: '/half-life',
    count: 5,
    title: 'Half of it is gone in two months. Most of it comes back',
    caption: 'Five cards: how long a Korean title holds half its readers, and how often it returns.',
  },
  {
    set: 'oneout',
    page: '/one-out',
    count: 5,
    title: 'Remove one. Look again',
    caption: 'Five cards: the one-line check that told our two findings apart before we did.',
  },
];

/**
 * 🔴 2026-08-14 — **목소리 얹은 숏영상만 여기 적는다.**
 *   목소리 없는 편은 사장님 지시(「젊고 멋진 남성과 여성의 목소리로」) 이전 것이라 안 낸다.
 * ⚠ 벌 이름은 `public/wikitip/video/<벌>.mp4` 이자 카드뉴스 벌 이름이다. 둘이 같아야 한다.
 */
/* 영상에서 뽑은 썸네일이 있는 벌. ⛔ 없는 그림을 사이트맵에 적지 않는다 */
const 영상그림 = new Set((videoData.videos ?? []).map((v: any) => v.set));

/* 🔴🔴 2026-08-24 밤 — **여기 아홉 편만 적혀 있었고 열두 편이 빠져 있었다.**
   영상은 21편인데 사이트맵에 9편이었다. 사장님 「방문자 늘리는 데 올인하라」로 세다 잡았다.
   ⛔ 손으로 적은 목록이 자료보다 짧으면 영상을 늘려도 목록이 안 따라온다 — 그것이 뿌리다.
      그래서 `scripts/check-kcw-video-sitemap.mjs` 가 이 목록과 `wikitip-video.json` 을
      견주고, 하나라도 빠지면 «막는다». 다음에 또 조용히 빠지지 않는다.
   ⚠ 아래 열두 편의 제목은 **라이브 지면 제목에서 가져왔다** — 지어내지 않았다. */
const videoSets = [
  {
    set: 'actors',
    page: '/actors-first',
    title: 'Three actors lead four Southeast Asian Wikipedias, and three names lead none',
    description: '14 seconds on who sits at the top of each edition, and on the names that appear '
      + 'on every list without leading any of them.',
  },
  {
    set: 'debut',
    page: '/debut-age',
    title: 'IU started at 15 and Ma Dong-seok at 32 — and it is not just career length',
    description: '14 seconds on the ladder of median readers by debut age, and on the objection '
      + 'that older debuts simply had less time.',
  },
  {
    set: 'first',
    page: '/written-down-first',
    title: 'The same Korean title reaches four Wikipedias in a fixed order',
    description: '14 seconds on which edition writes a Korean title down first, and why it is not '
      + 'the biggest one.',
  },
  {
    set: 'least',
    page: '/who-reads-least',
    title: 'BTS, Babymonster and Byeon Woo-seok are read least in the same country',
    description: '14 seconds on three Korean acts read most in three different places and least in '
      + 'one and the same place.',
  },
  {
    set: 'malaysia',
    page: '/malaysia',
    title: 'Malaysia reads Korean brands nearly three times as readily as Korean people',
    description: '14 seconds on the country where the gap between brands and people is widest, '
      + 'counted from Wikipedia readers.',
  },
  {
    set: 'manager',
    page: '/sea-athletes',
    title: 'Indonesia and Thailand look up Son Heung-min. Vietnam looks up Faker',
    description: '14 seconds on which Korean sportsperson each Southeast Asian Wikipedia reads '
      + 'most, and on the one that breaks the pattern.',
  },
  {
    set: 'onlyone',
    page: '/only-one-wikipedia',
    title: 'Only the Indonesian Wikipedia has written about Ahn Sung-ki and Choi Jiwoo',
    description: '14 seconds on Korean names that exist in exactly one Southeast Asian edition, '
      + 'and on which edition that turns out to be.',
  },
  {
    set: 'places',
    page: '/places',
    title: 'An entertainment company is looked up more than Seoul is',
    description: '14 seconds on Korean places and companies side by side in Wikipedia reader '
      + 'counts, and on what that ordering does and does not mean.',
  },
  {
    set: 'outside',
    page: '/places',
    title: 'The Korean places Southeast Asia reads about are not the ones on the tour route',
    description: '14 seconds on which Korean locations get looked up, counted from Wikipedia '
      + 'readers rather than from visitor numbers.',
  },
  {
    set: 'shelf',
    page: '/what-kind-fell',
    title: 'Southeast Asia is reading less about Korean language and craft',
    description: '14 seconds on which kinds of Korean subject lost readers, and on the fact that '
      + 'the same is true of Japan.',
  },
  {
    set: 'signs',
    page: '/star-signs',
    title: 'We checked whether a Chinese zodiac sign predicts reaching a Netflix chart',
    description: '14 seconds on 1,047 Korean actors sorted by birth-year sign, and on a spread '
      + 'that is indistinguishable from chance.',
  },
  {
    set: 'works',
    page: '/works-and-readers',
    title: 'Actors with five charting titles are read seven times as often',
    description: '14 seconds on the relation between charting titles and Wikipedia readers, and '
      + 'on why it still says little about any one actor.',
  },
  {
    set: 'fame',
    page: '/fame-compare',
    title: 'One Korean act is read more than any Korean athlete in Southeast Asia',
    description: '14 seconds, with a male and female voice reading out the figures from the table '
      + 'on the page.',
  },
  {
    set: 'instrument',
    page: '/titles-to-name',
    title: 'The question was fine. The instrument was not.',
    description: '14 seconds on a measurement that came out flat one day and read clearly the next, '
      + 'because the ruler changed and the panel did not.',
  },
  {
    set: 'brands',
    page: '/brand-kinds',
    title: 'The same country is first and last, depending on what you count',
    description: '14 seconds on how four Southeast Asian Wikipedias read German car makers and '
      + 'luxury houses in opposite orders.',
  },
  {
    set: 'counting',
    page: '/read-vs-visited',
    title: 'Seoul has 25 districts. The tourist count can speak for five of them',
    description: '14 seconds on what Korea\'s public admissions table can and cannot see about '
      + 'its own capital.',
  },
  {
    set: 'season',
    page: '/look-vs-fly',
    title: 'They agree on the quiet month, not the busy one',
    description: '14 seconds on when Southeast Asia looks up a Korean trip, when the planes fill, '
      + 'and the one month both fall lowest.',
  },
  {
    set: 'control',
    page: '/what-actually-fell',
    title: 'A number fell by a third. It was the wrong story',
    description: '14 seconds on what a control group did to a headline about Korea that had '
      + 'already been written, and on the one figure in the table that rose.',
  },
  {
    set: 'wave',
    page: '/wave-and-floor',
    title: 'The article is born with the show',
    description: '14 seconds on why what a Korean hit leaves behind cannot be asked of a new '
      + 'title at all, and on the six older ones that could answer.',
  },
  {
    set: 'halflife',
    page: '/half-life',
    title: 'Half of it is gone in two months. Most of it comes back',
    description: '14 seconds on how long sixteen Korean titles held half their readers after '
      + 'peaking, and how many of them later rose above half again.',
  },
  {
    set: 'oneout',
    page: '/one-out',
    title: 'Remove one. Look again',
    description: '14 seconds on the one-line check that separated a finding we could keep from '
      + 'one we had to correct, using our own two published medians.',
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
    /* 2026-08-22 — 잰 검색 수요로 낸 두 장. 커뮤니티 방이 이 둘을 가리킨다
       (「underrated korean drama」·「netflix top 10 by country」 둘 다 자동완성 1번째) */
    { path: '/underrated', priority: '0.9', changefreq: 'weekly' },
    { path: '/by-country', priority: '0.9', changefreq: 'weekly' },
    { path: '/firms', priority: '0.9', changefreq: 'weekly' },
    { path: '/where-to-watch', priority: '0.9', changefreq: 'weekly' },
    { path: '/most-popular', priority: '0.9', changefreq: 'weekly' },
    /* 2026-08-23 — 잰 연도 축. 열 개가 전부 자동완성 1번째였다 */
    { path: '/year/2026', priority: '0.8', changefreq: 'weekly' },
    { path: '/year/2025', priority: '0.8', changefreq: 'weekly' },
    { path: '/year/2024', priority: '0.8', changefreq: 'weekly' },
    { path: '/year/2023', priority: '0.8', changefreq: 'weekly' },
    { path: '/year/2022', priority: '0.8', changefreq: 'weekly' },
    { path: '/year/2021', priority: '0.8', changefreq: 'weekly' },
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
    /* 87편째 기사의 표. 2026-08-14 — 76편이 못 읽은 것을 자를 바꿔 읽었다.
       ⚠ 76편을 안 지운다. 76편이 옳았고 여기서 자를 바꿨다 */
    { path: '/titles-to-name', priority: '0.9', changefreq: 'weekly' },
    { path: '/brand-kinds', priority: '0.9', changefreq: 'weekly' },
    /* 89편째 기사의 표. 2026-08-15 — 사장님 관광 자료 지시. 재려다 못 쟀고, 못 잰 까닭을 냈다.
       ⛔ 서울 스물다섯 중 열여섯 구에 집계된 유료 관광지가 하나도 없다 */
    { path: '/read-vs-visited', priority: '0.9', changefreq: 'weekly' },
    /* 90편째 기사의 표. 2026-08-15 — 사장님 항공 통계 지시. 알아보는 달과 나는 달.
       ⭐ 요점은 봉우리가 아니라 바닥이 둘 다 6월이라는 쪽이다 */
    { path: '/look-vs-fly', priority: '0.9', changefreq: 'weekly' },
    /* 91편째 기사의 표. 2026-08-15 — 여행 문서가 3할 떨어진 것을 「한국 관심이 식었다」로
       낼 뻔했다. 대조군(일본·대만)과 문화 축을 놓으니 아니었다.
       ⭐ 실린 것은 같은 나라 안 두 축이다 — 여행 -31% · 문화 -14% · 비행기 -0.7% */
    { path: '/what-actually-fell', priority: '0.9', changefreq: 'weekly' },
    /* 92편째 기사의 표. 2026-08-15 — 파도가 지나간 자리에 무엇이 남는가.
       ⭐ 스무 편 중 다섯 편만 말할 수 있다. 못 잰 열다섯의 까닭을 표로 낸다
       🔴 제일 큰 파도(오징어게임 35배)는 뒤바닥에 시즌3 이 들어앉아 못 쓴다 */
    { path: '/wave-and-floor', priority: '0.9', changefreq: 'weekly' },
    /* 93편째 기사의 표. 2026-08-15 — 92편이 「신작에는 전이 없다」로 막힌 자리에서,
       전이 필요 없는 물음으로 바꿨다. 봉우리 뒤 반감기.
       ⭐ 중앙값 두 달인데 열여섯 중 열둘이 뒤에 다시 올랐다 — 파도는 되풀이된다 */
    { path: '/half-life', priority: '0.9', changefreq: 'weekly' },
    /* 94편째 기사의 표. 2026-08-15 — 하루에 답 둘을 내고 하나를 두 번 정정한 뒤,
       어느 답이 흔들릴지 미리 아는 자를 만들었다. 표본에서 한 편씩 빼 본다.
       ⭐ 사분위로 재면 1.5 대 1.8 로 같아 보인다. 하나 빼기로 재면 0 대 0.89 다 */
    { path: '/one-out', priority: '0.9', changefreq: 'weekly' },
    /* 95편째 기사의 표. 2026-08-15 — 같은 작품이 네 위키피디아에 도착하는 차례.
       25편 중 24편을 인도네시아어판이 먼저 적고, 한 번도 마지막이 아니다.
       ⭐ 가장 흔한 설명(「그 위키가 더 커서」)을 표로 죽였다 — 베트남어판이 문서·편집자·판
         수 셋 다 앞선다. ⛔ 그래도 「왜」는 말하지 않는다.
       🔴 이 지면은 첫 판 날짜로 서 있고, 그 날짜는 문서를 옮기면 지워진다. 읽힌 달과 견줘
         153개 중 0개가 어긋났음을 지면에 적었고, 검증 못 하는 한국어판은 아예 뺐다.
       ⚠ 이름을 `/arrival-order` 로 지었다가 바꿨다 — 이미 있는 `/arrival` 과 헷갈린다 */
    { path: '/written-down-first', priority: '0.9', changefreq: 'weekly' },
    /* 96편째 기사의 표. 2026-08-16 — 무엇이 덜 읽히나, 그리고 그게 한국 일인가.
       ⭐ 갈래 셋 중 **하나만** 썼다. 나머지 둘은 하나빼기로 무너져 「못 쓴다」를 같이 실었다.
       ⛔ 언어·공예는 한국도 일본도 −25~−28%. 둘 다 떨어졌으니 한국에 일어난 일이 아니다 */
    { path: '/what-kind-fell', priority: '0.9', changefreq: 'weekly' },
    /* 2026-08-20 — 사장님 지시(8/16) 「스타의 이름을 제목에 넣는다」의 첫 지면.
       ⭐ 제목이 BTS·Babymonster 다. 「가수 1,701팀」이 아니라 **이름**이 검색어다.
       ⛔ 네 판을 합치지 않는다 — 합치면 1등이 하나가 되고, 인도네시아만 다르다는 것이 죽는다.
       ⛔ Q27655344 가 베트남어판 여섯째에 앉아 있었다. Q번호는 빼고 뺀 수를 지면에 적는다 */
    { path: '/who-is-first', priority: '0.9', changefreq: 'weekly' },
    /* 2026-08-20 — 위 지면의 배우판. ⭐ 값은 순위표가 아니라 **모양이 다르다**는 것이다.
       음악 1등 두 명·넷 다에 든 이름 하나 / 배우 1등 **세 명**·넷 다에 든 이름 **셋**.
       같은 함수로 같은 창을 재서 견줄 수 있게 했다(앞 자의 함수를 import 한다. 안 베낀다)
       ⛔ 가수와 배우를 갈랐다고 말하지 않는다 — 명단이 출연진이라 IU·T.O.P·Jisoo 가 섞여 있다 */
    { path: '/actors-first', priority: '0.9', changefreq: 'weekly' },
    /* 97편째 기사의 표. 2026-08-16 — 작품이 많으면 더 읽히나, 그게 **한 사람**에 대해 뭘 말하나.
       ⭐ 사다리는 넷 다 오른다(한 판 기준 7.1배). ⛔ 그 옆에 **한 사람 확률 81.8%** 를 둔다 —
         가운데값은 무리의 성질이고, 손님이 알고 싶은 것은 대개 한 사람이다.
         (common-language effect size · McGraw & Wong 1992 = Mann–Whitney U ÷ 짝 수)
       🔴 날것의 합계는 「문서가 있는 판만 더한 수」라 판 수가 섞여 있다(9.99배 → 7.1배).
         한 판만 보아 갈랐다. ⛔ 「네 판 다 있는 사람끼리」로 맞추는 길은 collider 라 안 썼다 */
    { path: '/works-and-readers', priority: '0.9', changefreq: 'weekly' },
    /* 113편째 자료 지면. 2026-08-22 — 한 사람이 몇 개 언어판에 있나(9,249명).
       ⭐ 안 쓰던 축이다 — 이 원자료를 다른 자리가 생일로만 썼고 sitelinks 는 아무도 안 셌다.
       🔴 가운데가 1 이다. 맨 위는 Psy 97 로 BTS·BLACKPINK 멤버 전원보다 많다.
       ⛔ 「오래돼서 그렇다」를 열 해별로 재서 죽였다 — 1940~60년대생이 제일 좁다(1% 안팎) */
    { path: '/how-many-languages', priority: '0.9', changefreq: 'weekly' },
    /* 101편째 자료 지면. 2026-08-20 — 멤버의 이름과 그룹의 이름을 한 줄에.
       ⭐ 사장님 지시(8/16): 손님은 「V」와 「BTS」를 친다. 「가수 1,446명」을 안 친다.
       ⛔ 「멤버가 그룹을 이겼다」로 안 쓴다 — 두 문서는 손님에게 다른 물음에 답한다 */
    { path: '/member-vs-group', priority: '0.9', changefreq: 'weekly' },
    /* 108편째 자료 지면. 2026-08-21 — 나라마다 «자기 스타»가 따로 있다.
       ⭐ JAY B(GOT7) 는 태국에서만 86.6% · Tempest 는 베트남 86.1% · 고른 값은 25% 다.
       ⛔ 말레이시아가 여덟 명뿐인 것을 감추지 않는다 — 그 자체가 결과다.
       ⛔ 「그 나라가 더 좋아한다」로 안 쓴다. 잰 것은 읽힘의 쏠림이다 */
    { path: '/own-star', priority: '0.9', changefreq: 'weekly' },
    /* 107편째 짝. 2026-08-21 — 네 판 중 **한 판만** 갖고 있는 스타는 누구인가.
       ⭐ 배우 421/1,023 · 음악 828/1,701 이 한 판에만 있고, 그 대부분이 인도네시아어판이다
         (배우 409 · 음악 746). 표 첫 칸이 수가 아니라 **이름**이다(사장님 8/16).
       ⛔ 크기 반론을 표로 죽였다 — 베트남어판이 더 큰데 31개뿐이다. 「왜」는 말하지 않는다
       ⛔ 「한 판만 있다」를 「인기 없다」로 안 읽는다 — 문서 유무는 편집자가 정한다 */
    { path: '/only-one-wikipedia', priority: '0.9', changefreq: 'weekly' },
    /* 108편째 짝. 2026-08-21 — 1등은 바뀌는데 꼴찌는 안 바뀐다.
       ⭐ 네 판 다 있는 스타 374명. 첫째는 태국 153·베트남 123·인도네시아 81 로 갈리는데
         꼴찌는 말레이판이 310(82.9%)이고 **위 20명은 20명 전부** 말레이가 꼴찌다
       ⛔ 「관심 없다」로 안 읽는다 — 말레이어와 인도네시아어는 서로 통해서 말레이시아 손님이
         인도네시아어판을 읽을 수 있다. 못 가른다고 첫 화면 가까이에 적었다
       ⛔ 백만분율이라 판 크기는 이미 나눠져 있다. 「판이 작아서」는 답이 아니다 */
    { path: '/who-reads-least', priority: '0.9', changefreq: 'weekly' },
    /* 자료 지면. 2026-08-22 — 가장 많이 읽히는 스타가 **태어난 도시**를, 도시마다 이름을 다 적어.
       🔴 사장님 지시(8/20) 「관광지도 스타의 고향 등 연고지가 중심이 되는 게 좋겠지.
          이때도 스타의 이름, 소속그룹의 그룹명을 꼭 넣도록」
       ⭐ 서울 50/123(41%)인데 **BTS 여섯 명은 한 명도 서울이 아니다**(V·슈가 대구, 정국·지민 부산,
          RM 고양, 제이홉 광주). 진은 이 판에 안 들어와 못 짚는다고 적었다
       ⛔ 「고향」이라 안 쓴다 — P19 는 태어난 곳이고 병원 도시가 적히기도 한다
       ⛔ 「밖」을 「외국」으로 안 읽는다 — 상자가 북위 39.0 까지라 회령(이순재)이 밖으로 떨어진다 */
    { path: '/hometowns', priority: '0.9', changefreq: 'weekly' },
    /* 자료 지면. 2026-08-20 — 띠마다 어느 스타가 있나, 이름으로.
       ⭐ 3번의 한국어 사주 지면(100yearmap.com/saju)에 대한 영어판 유입구다.
       ⛔⛔ 점을 치지 않는다 — 우리가 이미 카이제곱 7.77(문턱 19.68)로 반대를 발행했다 */
    { path: '/star-signs', priority: '0.9', changefreq: 'weekly' },
    /* 자료 지면. 2026-08-22 — 일간 열 칸·일지 열두 칸에 연예인 만 명이 어떻게 갈리나.
       ⭐ 영문권 여덟 곳이 «한 사람을 풀어 주는» 자리라 아무도 분모를 만들지 않았다. 그 분모다.
       ⛔ 점을 치지 않는다 — 이 지면이 하는 말은 「고른가 안 고른가」 하나다 */
    { path: '/day-pillar', priority: '0.9', changefreq: 'weekly' },
    /* 2026-08-22 — 사장님: 「키워드 검색량을 재서 해」·「누가 검색이 많은 지를 찾아서 하면」.
       1,019명의 위키백과 열람 수를 재서 낸 지면. 달마다 다시 재므로 순위가 움직인다 —
       그것이 손님이 다시 올 까닭이다. ⛔ 「검색량」이라 부르지 않는다 */
    { path: '/most-read', priority: '1.0', changefreq: 'monthly' },
    /* 2026-08-22 — Search Console 실측으로 낸 지면. 우리에게 오는 노출 185개가 **Tudum 파일 주소
       그 자체**였다(순위 7~11 · 클릭 0). 파일 안에 무엇이 있나를 묻는 사람에게 답이 없었다.
       ⭐ 파일이 안 알려 주는 것을 적는다 — views 가 102주 비어 있고, 제목 71%는 세계 파일에 줄이 없다
       ⛔ 파일을 다시 배포하지 않는다. 넷플릭스 주소로 보낸다 */
    { path: '/netflix-top10-data', priority: '1.0', changefreq: 'weekly' },
    /* 2026-08-24 — 사장님 지시(「키워드 검색량을 재서 해」)로 자동완성을 재서 낸 지면.
       잰 것: `netflix top 10 korea` 가 자동완성 1번째이고 그 말로 시작하는 제안이 9줄이었다 —
       `netflix top 10 korean drama` · `korean series` · `korean drama 2026`.
       내 쪽을 세니 지면 1,550장 중 제목에 「drama」가 든 것이 5장뿐이고, 자료에 든 한국 TV
       398편을 모아 놓은 지면은 **없었다.** 손님은 「korean drama」라고 치는데 나는
       「titles·series」라고 쓰고 있었다 — 자료는 있고 말이 없었다.
       ⛔ 낱말을 채워 넣은 것이 아니다. 이 지면은 실제로 TV 만 담고, 영화 578편을 뺐다고 밝힌다.
       ⛔ `/titles`(976편 전부)와 겹치지 않는다 — 여기는 갈래를 가른 쪽이다 */
    { path: '/netflix-top-10-korean-drama', priority: '1.0', changefreq: 'weekly' },
    /* 2026-08-22 — 생일 지면 366장. 재서 고른 축이다(「iu birthday」 자동완성 10줄 vs
       「byeong day stem」 0줄). 이름으로 들어와 같은 생일의 다른 이름으로 걸어간다.
       ⛔ 점을 치지 않는다 — 「같은 날 태어났다」는 그 말뿐이라고 각 장에 적었다 */
    /* 2026-08-24 — 달 지면 12장. 🔴 내가 한 시간 전에 「이 축은 죽었다」고 접은 것을
       자동완성이 뒤집었다: `korean actors birthday` 1번째·10줄인데 그 줄들이 «달» 단위다
       (`in may`·`in june`·`in july`). 날 366장은 낱알이 손님 말과 안 맞았다.
       ⛔ `today` 지면은 안 만든다 — 배포할 때만 다시 지어지니 다음 날부터 거짓이 된다.
       ⭐ 이 12장이 날 지면 366장으로 가는 복도다 — 그 366장은 들어오는 문이 거의 없었다 */
    { path: '/born-in/january', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/february', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/march', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/april', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/may', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/june', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/july', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/august', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/september', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/october', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/november', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-in/december', priority: '0.8', changefreq: 'monthly' },
    /* 2026-08-24 — 나이 묶음 지면. 재서 고른 축이다(`korean actors age` 자동완성
       1번째·10줄이고 그 줄들이 age 40 · age 50 · age 20 이다). 자료는 이미 있었고
       손님이 묻는 낱알만 없었다 — 같은 잘못을 오늘 두 번 했다(날/달 · title that charted).
       ⛔ 열세 살 아래 묶음은 세지만 주소를 안 만든다. changefreq 가 yearly 인 까닭은
          나이가 «해마다» 바뀌기 때문이다 — 지면에 기준 해를 박아 두었다 */
    { path: '/actors-in-their/20s', priority: '0.8', changefreq: 'yearly' },
    { path: '/actors-in-their/30s', priority: '0.8', changefreq: 'yearly' },
    { path: '/actors-in-their/40s', priority: '0.8', changefreq: 'yearly' },
    { path: '/actors-in-their/50s', priority: '0.8', changefreq: 'yearly' },
    { path: '/actors-in-their/60s-and-over', priority: '0.8', changefreq: 'yearly' },
    /* 2026-08-24 밤 — 서양 별자리 12장. 오늘 밤 «세 번째» 같은 낱알 오류를 고친 것이다 —
       `kpop zodiac signs` 자동완성 1번째·4줄인데 그 줄들이 cancer·taurus(서양 별자리)이고,
       내 지면 /zodiac·/star-signs 는 둘 다 띠(해 단위)였다. 그 지면에 cancer 라는 말이 0번이었다.
       ⛔ 점을 치지 않는다 — 열두 장 전부에 「우리는 이것이 무엇을 뜻하는지 말하지 않는다」와
          1,047명으로 잰 반증(우연과 구별되지 않는다)을 붙였다. */
    { path: '/star-sign/capricorn', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/aquarius', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/pisces', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/aries', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/taurus', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/gemini', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/cancer', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/leo', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/virgo', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/libra', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/scorpio', priority: '0.8', changefreq: 'monthly' },
    { path: '/star-sign/sagittarius', priority: '0.8', changefreq: 'monthly' },
    { path: '/born-on', priority: '0.9', changefreq: 'monthly' },
    { path: '/born-on/01-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/01-31', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/02-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/03-31', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/04-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/05-31', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/06-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/07-31', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/08-31', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/09-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/10-31', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/11-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-01', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-02', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-03', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-04', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-05', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-06', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-07', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-08', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-09', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-10', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-11', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-12', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-13', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-14', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-15', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-16', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-17', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-18', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-19', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-20', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-21', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-22', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-23', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-24', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-25', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-26', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-27', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-28', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-29', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-30', priority: '0.7', changefreq: 'monthly' },
    { path: '/born-on/12-31', priority: '0.7', changefreq: 'monthly' },
    /* 일간 열 칸을 이름으로 걷는 지면. 2026-08-22 — 9,249명을 열 장으로 갈랐다.
       ⭐ 띠 방 열둘에서 배운 것 — 이름 천 개를 한 장에 두면 아무도 안 읽고, 갈라 놓으면 읽힌다.
       ⛔ 점을 치지 않는다. 각 장 머리에 «발견이라 부르지 않는다»를 그대로 싣는다 */
    { path: '/stem/gap', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/eul', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/byeong', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/jeong', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/mu', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/gi', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/gyeong', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/sin', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/im', priority: '0.8', changefreq: 'monthly' },
    { path: '/stem/gye', priority: '0.8', changefreq: 'monthly' },
    /* 데뷔 나이 지면. 2026-08-21 — 일찍 시작한 스타가 지금 더 읽힌다(4.89배).
       ⭐ 가장 뻔한 반론(경력이 길어 쌓인 것)을 표보다 **먼저** 죽인다 — 띠마다 경력 20~22년.
       ⛔ 경력을 붙들면 위 두 띠가 붙어 사다리가 넷에서 셋이 된다. 그것을 지면에 적었다.
       ⛔ 데뷔 나이와 지금 나이는 못 갈랐다고 적었다 */
    { path: '/debut-age', priority: '0.9', changefreq: 'weekly' },
    /* 별 방 열둘. 2026-08-21 — 2번 지시로 커뮤니티 카드가 갈 곳을 만들었다.
       ⭐ 방마다 그 띠 스타의 **이름이 전부** 있다(가장 큰 개띠 103명).
       ⛔ 글쓰기·로그인은 없다 — 읽는 자리까지다. 눌러도 안 되는 단추가 오늘의 병이었다.
       ⛔ 방 목록을 손으로 안 적는다. 자료가 정한 띠 그대로다 */
    /* 🔴 2026-08-22 — 방 열둘은 여기 있는데 **그 방들의 현관(`/community`)이 빠져 있었다.**
       `check-search-readiness` 가 「빌드됐는데 사이트맵에 없는 것 1장」으로 잡았다.
       ⭐ 방을 다 적고 현관을 빼면, 검색은 방을 서로 무관한 열두 장으로 본다 */
    { path: '/community', priority: '0.8', changefreq: 'weekly' },
    { path: '/room/rat', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/ox', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/tiger', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/rabbit', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/dragon', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/snake', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/horse', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/goat', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/monkey', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/rooster', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/dog', priority: '0.7', changefreq: 'monthly' },
    { path: '/room/pig', priority: '0.7', changefreq: 'monthly' },
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
  /*
   * 학교 지면. 2026-08-25 새벽 — 사장님 「키워드 검색량을 재서 해」로 잰 것이다.
   *   school of performing arts seoul  자동완성 1번째 · 그 말로 시작 10줄
   *   hanlim multi art school          자동완성 1번째 · 그 말로 시작 10줄
   * 손님이 치는 것은 학교 이름 그 자체여서 주소도 학교 이름으로 갔다.
   * ⛔ 손으로 55줄을 적지 않는다 — build-kcw-schools.mjs 가 낸 자료에서 뽑는다.
   *   15명에 못 미쳐 안 내는 학교는 그 자료에 이미 없으므로 저절로 빠진다.
   */
  /*
   * 그룹 지면. 2026-08-25 — 우리 검색 실측에서 노출 1위가 BTS 기사(68노출)였고,
   * 그 갈래 수요가 bts members age·birthday 로 자동완성 1번째·10줄이었다.
   * ⛔ 손으로 263줄을 적지 않는다 — build-kcw-groups.mjs 가 낸 자료에서 뽑는다.
   */
  /* 2026-08-25 사장님 지시 — 만든 콘텐트를 우리 사이트에도 싣고 서로 잇는다 */
  entries.push({ path: '/video', priority: '0.8', changefreq: 'weekly' });
  /*
   * 태그 지면. 기사 117편 전부 앞말에 태그가 있었는데 «화면에 나오는 지면이 0장»이었다.
   * ⛔ 손으로 적지 않는다 — 기사 앞말에서 세어 두 편 이상인 태그만 뽑는다.
   *   `tag/[tag].astro` 와 «같은 규칙·같은 문턱(2편)»이어야 한다. 어긋나면 404 가 사이트맵에 실린다.
   */
  {
    const 태그슬러그 = (t: string) => String(t ?? '').toLowerCase()
      .replace(/[’'`]/g, '').replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const 셈 = new Map<string, number>();
    for (const e of (await getCollection('kcwArticles')).filter((x: any) => !x.data.draft)) {
      for (const t of (e.data.tags ?? [])) {
        const s = 태그슬러그(t);
        if (s) 셈.set(s, (셈.get(s) ?? 0) + 1);
      }
    }
    for (const [s, n] of 셈) {
      if (n >= 2) entries.push({ path: `/tag/${s}`, priority: '0.6', changefreq: 'weekly' });
    }
  }
  entries.push({ path: '/group', priority: '0.9', changefreq: 'monthly' });
  for (const x of groupPages.groups) {
    entries.push({ path: `/group/${x.slug}`, priority: '0.8', changefreq: 'monthly' });
  }
  /*
   * 🔴 2026-08-25 — 사람 지면. 사장님 「특히 케이컬쳐는 **스타의 이름**」에서 나온 것이다.
   * ⛔ 손으로 줄을 적지 않는다 — build-kcw-people.mjs 가 낸 자료에서 뽑는다.
   * ⛔ 문턱(2편)이 `person/[person].astro` 와 «같은 자료»에서 오므로 어긋날 수 없다.
   */
  entries.push({ path: '/person', priority: '0.9', changefreq: 'weekly' });
  for (const x of peoplePages.people) {
    entries.push({ path: `/person/${x.slug}`, priority: '0.8', changefreq: 'monthly' });
  }
  entries.push({ path: '/school', priority: '0.9', changefreq: 'monthly' });
  for (const x of schoolPages.schools) {
    entries.push({ path: `/school/${x.slug}`, priority: '0.8', changefreq: 'monthly' });
  }
  for (const x of titlePages.titles.filter((y) => y.hasPage)) {
    entries.push({ path: `/title/${x.slug}`, priority: '0.7', changefreq: 'weekly' });
  }

  /*
   * 주별 지면. 2026-08-23 — 검색 실측에서 「netflix.com/tudum/top10?week=2024-11-03」 꼴이
   * 노출 120건(6.8~7.7위 · 클릭 0)이었다. 그 주를 보여 주는 지면이 없어서 답을 못 했다.
   * ⛔ 손으로 268줄을 적지 않는다 — `build-kcw-week-pages.mjs` 가 낸 자료에서 뽑는다.
   *   ⚠ 지난 주는 안 바뀌므로 monthly 다. 목록만 새 주가 붙어 weekly 다.
   */
  /* ⚠ 이 지면들은 `public/` 에 미리 지은 것이라 소스 파일이 없다 — 아래 lastmod 자동
     채우기가 못 찾는다(방 지면도 그렇다). 그래서 **자료가 지어진 날**을 여기서 준다.
     ⛔ 오늘 날짜를 쓰지 않는다. 지면이 실제로 바뀐 날이 아니면 거짓 신호다. */
  const 주지어진날 = String(weekPages.generated ?? '').slice(0, 10) || undefined;
  entries.push({ path: '/weeks', priority: '0.8', changefreq: 'weekly', lastmod: 주지어진날 });
  for (const w of weekPages.weeks) {
    entries.push({
      path: `/week/${w.week}`, priority: '0.6', changefreq: 'monthly', lastmod: 주지어진날,
    });
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
      /*
        🔴🔴 2026-08-24 밤 — **카드뉴스 96벌 474장이 사이트맵에 «0장»이었다.**
        만들어서 서버에 올려 놓고 구글에 한 번도 알린 적이 없다.
        ⭐ 구글 이미지는 웹 검색과 «다른 자리»다. 474장이 그 자리에 하나도 없었다.
        ⛔ 벌이 없는 기사는 빈 배열이라 아무것도 안 나간다(21편이 그렇다).
        ⚠ 장수를 손으로 적지 않는다 — `build-kcw-cardnews-index.mjs` 가 파일을 세어 적는다.
      */
      images: (() => {
        const c = (cardnewsData.sets ?? []).find((x: any) => x.set === a.id);
        if (!c) return [];
        return [
          ...c.sq.map((n: number) => ({
            loc: `${ORIGIN}/cardnews/${c.set}-sq-${n}.png`,
            title: a.data.title,
            caption: `Card ${n} of ${c.sq.length} — the figures from this article as an image.`,
          })),
          ...c.v.map((n: number) => ({
            loc: `${ORIGIN}/cardnews/${c.set}-v-${n}.png`,
            title: a.data.title,
            caption: `Tall card ${n} of ${c.v.length} — the figures from this article as an image.`,
          })),
        ];
      })(),
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

  /**
   * 🔴 2026-08-14 — 숏영상도 같은 자리에 붙인다. 그러지 않아서 다섯 편이 묻혀 있었다.
   * ⚠ 미리보기 그림은 그 벌 카드뉴스 첫 장을 쓴다 — 영상에서 따로 뽑으면 또 어긋난다.
   * ⛔ 짝 지면이 없으면 던진다. 조용히 넘기는 것이 이 사고의 뿌리였다.
   */
  for (const v of videoSets) {
    const 줄 = entries.find((e) => e.path === v.page);
    if (!줄) throw new Error(`숏영상 ${v.set} 의 짝 지면 ${v.page} 이 사이트맵에 없다`);
    /* ⭐ 미리보기는 «영상에서 뽑은 것»을 먼저 쓴다(build-kcw-video-schema.mjs 가 ffmpeg 으로
       2초 지점을 뽑는다 — 첫 칸은 검은 화면일 때가 많다). 없으면 그 벌 카드뉴스 첫 장으로
       떨어진다. ⛔ 둘 다 없으면 던진다 — 조용히 넘기는 것이 이 사고의 뿌리였다 */
    const 미리보기 = 영상그림.has(v.set)
      ? `${ORIGIN}/video/thumb/${v.set}.jpg`
      : 줄.images?.[0]?.loc;
    if (!미리보기) throw new Error(`숏영상 ${v.set} 의 미리보기가 없다 — 썸네일도 카드뉴스도 없다`);
    if (!줄.videos) 줄.videos = [];
    줄.videos.push({
      loc: `${ORIGIN}/video/${v.set}.mp4`,
      thumb: 미리보기,
      title: v.title,
      description: v.description,
      seconds: 14,
    });
  }

  /**
   * 🔴 lastmod 가 없는 줄에 붙인다. **기사에는 이미 있으니 덮어쓰지 않는다.**
   * ⚠ `/title/<slug>` 530장은 한 소스에서 나오므로 같은 날이 된다. 그것이 맞다 —
   *   그 지면들은 실제로 같은 자료가 바뀔 때 같이 바뀐다.
   */
  for (const e of entries) {
    if (e.lastmod) continue;
    /* ⚠ 자리표(`[slug]`)로 나오는 지면은 소스 이름이 주소와 다르다. 넷 다 적는다 —
       하나라도 빠뜨리면 그 지면만 조용히 날짜 없이 나간다(section 이 실제로 그랬다) */
    const 날 = 지어진날(e.path.startsWith('/title/') ? '/title/[slug]'
      : e.path.startsWith('/firm/') ? '/firm/[slug]'
        : e.path.startsWith('/market/') ? '/market/[slug]'
          : e.path.startsWith('/section/') ? '/section/[category]' : e.path);
    if (날) e.lastmod = 날;
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
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
    /* ⛔ 한 편만 내보내던 것을 여러 편으로 고쳤다 — `/places` 의 둘째 영상이 조용히 빠져 있었다 */
    for (const v of (e.videos ?? [])) {
      줄.push('    <video:video>');
      줄.push(`      <video:thumbnail_loc>${v.thumb}</video:thumbnail_loc>`);
      줄.push(`      <video:title>${xml(v.title)}</video:title>`);
      줄.push(`      <video:description>${xml(v.description)}</video:description>`);
      줄.push(`      <video:content_loc>${v.loc}</video:content_loc>`);
      줄.push(`      <video:duration>${v.seconds}</video:duration>`);
      줄.push('    </video:video>');
    }
    return `  <url>\n${줄.join('\n')}\n  </url>`;
  })
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
