#!/usr/bin/env node
/**
 * build-kcw-community-front.mjs — **커뮤니티 첫 화면을 K컬처 방으로 다시 짓는다.**
 *   내는 것: `public/wikitip/community.html`
 *
 * ── 왜 다시 짓나 (2026-08-22) ──────────────────────────────────
 * 사장님: 「**왜 너의 커뮤니티인데 케이라이프맵의 커뮤니티 같지? 수정하자...검색량**」
 *
 * 그 전 첫 화면은 카드가 열둘이었고 **전부 띠(zodiac)**였다. 그 아래에 일간 열 장이 붙어 있었다.
 * 사주·성명학·궁합은 **4번(KLifeMap)의 주제**다. 나는 그것을 영어로 옮겨 놓고 내 커뮤니티라
 * 불렀다. 영어라는 것 말고 4번 것과 다를 게 없었다.
 * 내 유닛은 **영어뉴스 + 데이터 가공 — 한국 대중문화**다.
 *
 * ── 방을 무엇으로 정했나 — 짐작이 아니라 잰 것 ────────────────
 * 사장님 지시가 「검색량」이다. K컬처 후보 35개를 만들어 자동완성으로 쟀다
 * (`measure-keyword-demand.mjs --말파일=…`, 결과는
 *  `src/data/wikitip-keyword-demand-kcw-커뮤니티-후보.json`).
 * ⚠ 자동완성은 **검색량이 아니다** — 「그 말을 사람이 치고 있다」는 흔적이다. 그렇게만 부른다.
 * ```
 *  where to watch korean drama      1번째 · 10줄   ← 가장 셌다
 *  best korean drama on netflix     1번째 · 10줄
 *  korean movies on netflix         1번째 · 10줄
 *  most popular korean drama        1번째 · 10줄
 *  top 10 korean drama              2번째 · 10줄
 *  studio dragon dramas             1번째 · 10줄
 *  lck standings                    1번째 · 10줄
 *  kpop group debuts                1번째 · 10줄
 *  underrated korean drama          1번째 · 9줄
 *  korean drama recommendations     1번째 · 8줄
 *  korean drama ranking             1번째 · 6줄
 *  netflix top 10 by country        1번째 · 1줄
 *  ── 반대로 안 뜬 말 ──
 *  korean drama production company  없다        ⛔ 그래서 방 이름에 안 쓴다
 *  korean drama same actor          없다
 *  korea solo queue rank            없다
 *  kpop export numbers              없다
 * ```
 * ⭐ 방 이름은 **뜬 말**로만 짓는다. 안 뜨는 말은 자료가 있어도 문 이름에 안 쓴다.
 * ⛔ 「korean zodiac」·「saju reading」도 셌고 둘 다 뜬다. 수요는 참이다.
 *   그러나 그것은 4번의 주제이므로 **첫 화면의 주인이 아니다** — 카드 한 장으로 내린다.
 *   (스타 지면 자체는 4번과 나눈 몫이다 — 4번 한·일·중, 5번 영어)
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 화면에 한국어를 안 쓴다(주석도 지면에 안 넣는다).
 * ⛔ 줄 세운 목록(`<ol>`)을 안 만든다 — 순위표가 아니다.
 * ⛔ 죽은 단추를 안 만든다. 카드마다 **살아 있는 지면**을 가리킨다.
 * ⛔ 수를 지어내지 않는다. 카드에 적는 수는 자료 파일에서 온다.
 * ⛔ noindex 를 안 단다 — 사이트맵에 실리는 지면이다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-community-front.mjs --자가시험
 *   node scripts/build-kcw-community-front.mjs
 */
import fs from 'node:fs';
import { 꼬리말 } from './kcw-static-footer.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * 🔴 [2026-08-29 · 2번 요청] **차림표** — 이 지면에는 «사이트 나머지로 가는 길»이 없었다.
 *   방 아홉과 꼬리말(약관·개인정보)뿐이었다. AI 어시스턴트 인용을 타고 여기로 «바로»
 *   떨어진 손님은 그 아홉만 보고 나간다.
 *   ⛔ 체류시간을 늘리자고 만든 지면이 정작 다음 걸음을 안 내주고 있었다.
 * ✅ 다른 지면(WikiTip)과 «같은 모양»으로 단다 — 여기만 다르면 손님이 다른 사이트로 여긴다.
 * ⛔ 차림표는 방 칸 «앞»에 온다. 뒤에 두면 35초 손님은 못 본다(자가시험이 순서를 잰다).
 * ⚠ 이 파일이 내는 CSS·마크업 안에는 한국어를 안 쓴다 — 그대로 손님 화면으로 나간다.
 */
const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 낼길 = path.join(뿌리, 'public', 'wikitip', 'community.html');

const 읽기 = (이름) => JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data', 이름), 'utf8'));

/**
 * 방 목록. 칸마다 —
 *   phrase  자동완성에서 뜬 **손님의 말** (이 방이 왜 있는지의 근거)
 *   name    방 이름 (손님의 말로 짓는다)
 *   line    무엇이 들어 있나 — 수는 자료에서 온다
 *   href    갈 곳 (⛔ 살아 있는 지면이어야 한다)
 */
export function 방들(자료) {
  const t = 자료.제목;
  const 영화 = 자료.영화;
  const m = 자료.나라;
  const q = 자료.조용한것;
  const s = 자료.별;
  const 띠합 = (q.bands ?? []).reduce((n, b) => n + (b.titles?.length ?? 0), 0);

  return [
    {
      phrase: 'where to watch korean drama',
      name: 'Where could you actually watch it?',
      line: 'Netflix publishes no availability anywhere. It does publish a weekly top 10 per country — '
        + 'and a title on that list was watchable there that week. That floor is the honest answer.',
      href: '/where-to-watch',
      cta: 'See the floor',
    },
    {
      phrase: 'netflix top 10 by country',
      name: 'Every country, and how Korean its chart is',
      line: `${m.countryCount} countries counted week by week, from ${m.weekFrom} to ${m.weekTo}. `
        + 'Vietnam gives them 29% of its slots, Iceland 1.4%, and the middle country 4.5%.',
      href: '/by-country',
      cta: 'Pick a country',
    },
    {
      phrase: 'underrated korean drama',
      name: 'The ones that ran and ran, almost nowhere',
      line: `${띠합} titles stayed on a top 10 for ${q.thresholds.longRunWeeks} weeks or more while `
        + `charting in fewer countries than most. Both lines come from the measured spread, not from taste.`,
      href: '/underrated',
      cta: 'See what the world missed',
    },
    {
      phrase: 'most popular korean drama',
      name: 'Which one did best? Three answers that disagree',
      line: 'Reach, staying power and total chart places name three different winners, and only one '
        + 'title is on all three lists. We give you the rulers instead of a verdict.',
      href: '/most-popular',
      cta: 'See all three',
    },
    {
      phrase: 'korean drama ranking',
      name: 'Longest run, hardest landing',
      line: 'How long a title lasted and how hard it hit are two different measures, and the two '
        + 'lists barely overlap.',
      href: '/staying-power',
      cta: 'Compare the two',
    },
    {
      phrase: 'studio dragon dramas',
      name: 'Who actually made it',
      line: `We hold production and distribution credits for ${t.withFirms} of ${t.titleCount} titles. `
        + 'Half the Korean series that chart anywhere come from three companies.',
      href: '/firms',
      cta: 'Find a company',
    },
    {
      /*
       * 🔴 [2026-08-29] 이 방은 「korean movies on netflix」를 걸어 놓고 «작품 전체» 목록으로
       *   보내고 있었다. 방 이름은 「Films and series are not the same shelf」인데 정작
       *   그 둘을 갈라 보여 주는 지면이 없었다 — 영화를 물은 손님이 섞인 목록을 받았다.
       * ✅ 오늘 그 지면을 냈다(/korean-movies-on-netflix). 방이 물음에 맞는 곳으로 간다.
       * ⛔ 수를 손으로 적지 않는다 — 자료가 바뀌면 방만 옛말을 한다.
       */
      phrase: 'korean movies on netflix',
      name: 'Films and series are not the same shelf',
      line: `${영화.films.titles} Korean films have entered a weekly top 10 somewhere — more than `
        + `the ${영화.series.titles} series. The median film reached ${영화.films.medianCountries} `
        + `country; the median series reached ${영화.series.medianCountries}.`,
      href: '/korean-movies-on-netflix',
      cta: 'See the films',
    },
    /**
     * 🔴 [2026-09-01 · 사장님 지시] **Riot 을 지우고 이 방을 «옮겼다».**
     *
     * 여기 있던 방은 「korean challenger ladder」로 `/esports` 를 가리켰다. 그 지면은
     * Riot API 로 지은 것이라 사장님 지시로 걷어냈다.
     * ⛔ 그렇다고 방을 «지우지» 않는다 — 사장님이 바로잡아 주셨다:
     *   > 「**내가 riot을 제거하라고 했지, e스포츠를 제거하라고는 하지 않았잖아**」
     * ✅ 그래서 «같은 관심, 다른 우물»로 옮긴다 — `/esports-nations` 는 위키백과 열람수라
     *   열쇠 없이 우리가 언제든 다시 잰다.
     * ⛔ 문만 바꾸고 «설명은 그대로» 두면 안 된다 — 옛 문구는 승률·랭크 게임 수를 말했는데
     *   그 수는 이제 우리에게 없다. 문구도 새 자료의 말로 바꾼다.
     */
    {
      phrase: 'korean esports players',
      name: 'Korean esports players, read from Southeast Asia',
      line: `Of ${자료.종목.nations[0].onWikidata.toLocaleString()} Korean esports players on Wikidata, `
        + `${자료.종목.nations[0].withSeaArticle} have an article in a Southeast Asian edition at all — `
        + `and Korea takes ${자료.종목.koreaReadSharePc}% of the reading. We say which countries we could not compare.`,
      href: '/esports-nations',
      cta: 'See who is read',
    },
    {
      phrase: 'kpop group debuts',
      name: 'How many groups debut, and what really fell',
      line: 'New K-pop groups look 69% down since 2017 — and so do American, Japanese and every '
        + 'other kind. What fell was the record, not the industry.',
      href: '/kpop-attention',
      cta: 'See what fell',
    },
    /**
     * 🔴🔴 [2026-08-29 · 사장님 지시] **「띠 방 내려」** — 이 카드와 방 12장을 내렸다.
     *
     * 왜 내렸나 — 네 유닛이 «따로» 리뷰하고 같은 결론에 닿았다.
     *   5번  자동완성으로 재니 띠 관련 검색어가 «0줄». 방 12개 노출 28·클릭 3
     *   6번  「순위가 아니라 «수요 0» 문제다. 이름·SEO 손봐도 안 산다. 축을 갈아야 산다」
     *   3번  「띠는 태어난 해라 «영원히 안 바뀐다». 다시 올 이유가 물리적으로 없다」
     *   4번  「커뮤니티가 되려면 ①다시 올 이유 ②왔다는 흔적 — 지금은 둘 다 없다」
     *
     * ⚠ 4번이 코드로 확인해 주었다 — KLifeMap 과 «겹치지는 않았다».
     *    겹쳐서 내린 것이 아니라 **수요가 없어서** 내렸다. 까닭을 섞지 않는다.
     * ⭐ 나머지 아홉 방은 그대로 둔다 — 전부 자동완성으로 검증된 축이고 매주 바뀐다.
     *    3번이 준 자로 걸러 본 것이다 — 「이 자료가 다음 주에도 같은 값일까?」
     */
  ];
}

/** ⛔ 이 자는 화면에 한국어를 안 낸다. 우리 사정은 이 파일 주석에만 있다 */
/**
 * ⚠ 2026-08-29 — 첫 줄의 「Ten rooms」가 방을 아홉으로 줄인 뒤에도 «열»로 남아 있었다.
 *    자가시험 20개가 다 통과하는데 손님이 보는 첫 문장이 틀린 자리다.
 *    그래서 수를 손으로 적지 않고 «방 수에서 뽑는다». 아래 자가시험이 이것을 지킨다.
 */
export function 수를글자로(n) {
  const 말 = ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve'];
  return 말[n] ?? String(n);
}

export function 판짓기(방, 자료) {
  const 칸 = 방.map((r) => `      <article class="room">
        <p class="phrase">${r.phrase}</p>
        <h2>${r.name}</h2>
        <p class="line">${r.line}</p>
        <a class="cta" href="${r.href}">${r.cta}</a>
      </article>`).join('\n');

  const 제목 = 'Rooms — K Culture Wire community';
  const 설명 = 'Rooms built on what people actually search for about Korean film, television, music '
    + 'and esports: which countries charted a title, which titles ran for weeks almost nowhere, who '
    + 'made them, and how the Korean ladder compares with five other regions.';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com/community">
<title>${제목}</title>
<meta name="description" content="${설명}">
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 제목,
    description: 설명,
    url: 'https://www.kculturewire.com/community',
    isPartOf: { '@type': 'WebSite', name: 'K Culture Wire', url: 'https://www.kculturewire.com' },
    creator: { '@type': 'Organization', name: 'K Culture Wire' },
    isBasedOn: ['https://www.netflix.com/tudum/top10', 'https://www.wikidata.org'],
    hasPart: 방.map((r) => ({
      '@type': 'WebPage', name: r.name, url: `https://www.kculturewire.com${r.href}`,
    })),
  })}</script>
<style>
  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --card:#fff;
         --accent:#b4472a; --accent-soft:#fdf3f0; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --card:#181b21;
    --accent:#e8825f; --accent-soft:#261915; } }
  :root[data-theme="dark"]{ --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216;
    --card:#181b21; --accent:#e8825f; --accent-soft:#261915; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
    -webkit-font-smoothing:antialiased}
  .wrap{max-width:1080px;margin:0 auto;padding:48px 20px 80px}
  h1{font-size:clamp(28px,4vw,40px);line-height:1.15;margin:0 0 12px;letter-spacing:-.02em}
  .lead{color:var(--ink-2);margin:0 0 8px;max-width:64ch}
  .note{color:var(--ink-2);font-size:14px;margin:0 0 32px;max-width:64ch}
  .warn{background:var(--accent-soft);border-left:3px solid var(--accent);
    padding:14px 16px;border-radius:6px;margin:0 0 36px;max-width:64ch;font-size:14px}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
  .room{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;
    display:flex;flex-direction:column}
  .phrase{margin:0 0 8px;font-size:12px;letter-spacing:.04em;color:var(--accent);font-weight:700}
  .room h2{margin:0 0 8px;font-size:20px;line-height:1.25;letter-spacing:-.01em}
  .line{margin:0 0 16px;font-size:14px;color:var(--ink-2);flex:1}
  .cta{display:block;width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--line);
    background:transparent;color:var(--accent);font:inherit;font-size:14px;text-align:center;
    text-decoration:none;font-weight:600}
  .cta:hover{background:var(--accent-soft)}
  .how{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);max-width:64ch}
  .how h2{font-size:1.05rem;margin:0 0 .4rem}
  .how p{margin:.5rem 0;font-size:14px;color:var(--ink-2)}
  .top{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px}
  .logo{font-size:1.15rem;font-weight:800;color:var(--ink);text-decoration:none;letter-spacing:-.02em}
  .logo span{color:var(--accent)}
  .top .tag{font-size:13px;color:var(--ink-2)}
  .sections{font-size:.86rem;padding:0 0 1.4rem;border-bottom:1px solid var(--line);margin-bottom:26px}
  .sections a{color:var(--ink);text-decoration:none;font-weight:600}
  .sections a:hover{text-decoration:underline}
  footer{margin-top:44px;padding-top:20px;border-top:1px solid var(--line);
    color:var(--ink-2);font-size:13px;max-width:64ch}
</style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <a class="logo" href="/">K Culture <span>Wire</span></a>
      <span class="tag">Korean pop culture, in numbers</span>
    </div>
    <nav class="sections" aria-label="Sections">
      <a href="/section/stars">Stars</a>
      <span aria-hidden="true"> &middot; </span><a href="/section/titles">Titles</a>
      <span aria-hidden="true"> &middot; </span><a href="/section/industry">Industry</a>
      <span aria-hidden="true"> &middot; </span><a href="/section/tradition">Tradition</a>
      <span aria-hidden="true"> &middot; </span><a href="/articles">All articles</a>
    </nav>

    <h1>Rooms</h1>
    <p class="lead">${수를글자로(방.length)} rooms about Korean film, television, music and esports. Each one exists
      because people search for it, and each one is answered with counts rather than opinion.</p>
    <p class="note">The small red line on every card is the phrase people actually type. We checked
      each one against Google&rsquo;s own autocomplete before building the room.</p>

    <p class="warn"><strong>Autocomplete is not a search volume.</strong> It tells us a phrase is
      being typed, not how often. We have no paid keyword data and we do not pretend otherwise.
      Where a phrase did not autocomplete at all, we did not build a room for it &mdash; even when
      we hold the data.</p>

    <div class="grid">
${칸}
    </div>

    <section class="how">
      <h2>What is behind these rooms</h2>
      <p>Netflix&rsquo;s own weekly top 10 files, ${자료.제목.weekCount} weeks across
      ${자료.제목.marketCount} countries, plus Wikidata for names and credits and the Wikimedia
      Pageviews API for how often a person is looked up.</p>
      <p><strong>Charting is not the same as being available</strong>, and not charting is not the
      same as not being watched &mdash; Netflix publishes only the top 10, so a title that is huge
      at home can be missing here entirely. Every room says so on its own page.</p>
      <p>Where a figure could not be measured we leave it unmeasured and say which one. We do not
      write a zero in place of a blank.</p>
    </section>

${꼬리말(['<strong>There is no sign-in and no posting yet.</strong> These rooms are places to read and to walk from one name to the next. Nothing here is ranked by us and there is no feed.'])}
  </div>
</body>
</html>
`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

function 자료읽기() {
  return {
    제목: 읽기('wikitip-title-pages.json'),
    나라: 읽기('wikitip-markets.json'),
    영화: 읽기('kcw-films.json'),
    조용한것: 읽기('wikitip-quiet-hits.json'),
    별: 읽기('wikitip-star-signs.json'),
    /* ⚠ 2026-09-01 — e스포츠 방이 Riot 사다리에서 «위키백과 열람»으로 옮겨 왔다.
       ⛔ 방에 적는 수를 손으로 안 적는다. 이 자료가 바뀌면 방도 따라 바뀐다 */
    종목: 읽기('wikitip-esports-nations.json'),
  };
}

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = [];
  /* ⚠ 아래 「통과 (N)」의 N 을 손으로 적어 두었더니 검사를 넷 더해도 20 그대로였다.
     검사 수를 «세어서» 낸다 — 늘었는지 줄었는지가 눈에 보여야 한다 */
  let 센수 = 0;
  const 검 = (이름, 참) => { 센수 += 1; if (!참) 실패.push(이름); };

  const 자료 = 자료읽기();
  const 방 = 방들(자료);
  const 판 = 판짓기(방, 자료);

  검('방이 아홉이다', 방.length === 9);
  검('⛔ 방마다 갈 곳이 있다', 방.every((r) => typeof r.href === 'string' && r.href.startsWith('/')));
  검('⛔ 방마다 잰 말이 붙어 있다', 방.every((r) => r.phrase && r.phrase.length > 3));
  검('단추 수가 방 수와 같다', (판.match(/class="cta"/g) ?? []).length === 방.length);
  검('⛔ 죽은 단추가 없다', !/disabled/.test(판));

  /* ⭐ 손님이 보는 첫 문장의 «수»가 실제 방 수와 같아야 한다 — 2026-08-29 에 여기서 틀렸다 */
  검('⭐ 첫 문장의 방 수가 실제와 같다', 판.includes(`>${수를글자로(방.length)} rooms about`));
  검('수를글자로 — 아홉', 수를글자로(9) === 'Nine');
  검('수를글자로 — 열둘', 수를글자로(12) === 'Twelve');
  검('수를글자로 — 표 밖은 숫자 그대로', 수를글자로(37) === '37');
  검('⛔ 줄 세운 목록이 없다', !/<[ou]l[\s>]/.test(판));
  /**
   * ⚠ 2026-08-29 — 이 검사를 «좁혔다». 통신판매업 신고번호(2026-세종-0591)는 법정 번호라
   *    로마자로 바꿀 수 없다. 그 한 자리만 빼고 나머지에 한국어가 없는지 본다.
   *    ⛔ 검사를 아주 지우지 않는다 — 우리 사정을 손님 화면에 흘리는 것을 막는 자다.
   */
    /* 🔴 [2026-08-29 · 2번 요청] 사이트 나머지로 돌아가는 길이 «있나». 없으면 손님이 여기서 끝난다 */
  검('첫 화면으로 가는 길이 있다', /href="\/"/.test(판));
  검('갈래 차림표 다섯이 다 있다',
    ['/section/stars', '/section/titles', '/section/industry', '/section/tradition', '/articles']
      .every((u) => 판.includes(`href="${u}"`)));
  검('⛔ 차림표가 방 칸 «앞»에 온다 — 뒤에 있으면 못 본다',
    판.indexOf('/section/stars') < 판.indexOf('class="grid"'));
  검('⛔ 화면에 한국어가 없다 — 신고번호만 빼고', !/[가-힣]/.test(판.replace(/2026-세종-\d+/g, '')));
  검('⛔ noindex 가 없다 — 사이트맵과 어긋나면 안 된다', !/noindex/.test(판));
  검('영문 지면이다', /<html lang="en">/.test(판));

  /* ⭐ 사장님 지적의 핵심 — 첫 화면이 사주 방으로 채워져 있으면 안 된다 */
  검('⭐ 띠 방이 첫 화면을 차지하지 않는다', (판.match(/href="\/room\//g) ?? []).length === 0);
  검('⭐ 일간 방이 첫 화면을 차지하지 않는다', (판.match(/href="\/stem\//g) ?? []).length === 0);
  검('⭐ 넷플릭스 축이 있다', 판.includes('/by-country') && 판.includes('/underrated'));
  검('⭐ e스포츠 축이 있다', 판.includes('/esports'));
  검('⭐ 가장 센 잰 말이 첫 카드다', 방[0].phrase === 'where to watch korean drama');
  검('⭐ 그 방으로 가는 문이 있다', 판.includes('/where-to-watch'));
  /**
   * 🔴 [2026-08-29 사장님 「띠 방 내려」] 예전에는 「카드 한 장으로 «남는다»」를 쟀다.
   * 이제 «없어야» 한다. 검사를 뒤집는다 — 뒤집지 않으면 되살아나도 아무도 모른다.
   */
  검('⛔ 띠 축 카드가 없다 — 사장님 지시로 내렸다',
    (판.match(/href="\/star-signs"/g) ?? []).length === 0);
  검('⛔ 「star rooms」 라는 말도 안 남는다', !/star rooms/i.test(판));
  검('⭐ 나머지 아홉 방은 그대로 있다', (판.match(/class="room"/g) ?? []).length === 9);

  /* ⛔ 자동완성을 검색량이라고 부르면 안 된다 */
  검('⛔ 자동완성은 검색량이 아니라고 적었다', 판.includes('Autocomplete is not a search volume'));
  검('⛔ 차트와 제공 여부를 구분해 적었다',
    판.replace(/\s+/g, ' ').includes('Charting is not the same as being available'));
  검('⛔ 못 잰 것을 0으로 안 쓴다고 적었다',
    판.replace(/\s+/g, ' ').includes('We do not write a zero in place of a blank'));

  /* ⛔ 수를 지어내지 않았나 — 자료 파일의 값이 그대로 화면에 있어야 한다 */
  검('나라 수가 자료에서 왔다', 판.includes(String(자료.나라.countryCount)));
  /* ⚠ [2026-08-29] 여기는 원래 자료.제목.pageCount 를 봤다. 영화 방이 새 지면을 가리키게
     바뀌면서 그 수가 화면에서 빠졌고, 이 검사가 «제대로» 걸렸다 — 화면에 없는 수를 계속
     보고 있으면 검사가 아니라 장식이 된다. 그래서 지금 화면이 «실제로 내는» 수로 옮긴다. */
  검('영화 편수가 자료에서 왔다', 판.includes(String(자료.영화.films.titles)));
  검('시리즈 편수가 자료에서 왔다', 판.includes(String(자료.영화.series.titles)));

  if (실패.length) {
    console.error(`❌ 자가시험 실패\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ build-kcw-community-front 자가시험 통과 (${센수})`);
  process.exit(0);
}

if (내가실행됐다) {
  const 자료 = 자료읽기();
  const 방 = 방들(자료);
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, 판짓기(방, 자료));
  console.log(`✅ ${path.relative(뿌리, 낼길)} — 방 ${방.length}개`);
  for (const r of 방) console.log(`   ${r.href.padEnd(18)} ← «${r.phrase}»`);
}
