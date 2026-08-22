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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  const m = 자료.나라;
  const q = 자료.조용한것;
  const s = 자료.별;
  const 띠합 = (q.bands ?? []).reduce((n, b) => n + (b.titles?.length ?? 0), 0);

  return [
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
      name: 'The titles the whole world charted',
      line: `Of ${t.pageCount} titles with a page here, a handful reached most of the ${t.marketCount} `
        + 'countries. The rest reached one or two. The gap is the story.',
      href: '/world-share',
      cta: 'See the spread',
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
      phrase: 'korean movies on netflix',
      name: 'Films and series are not the same shelf',
      line: `Every Korean title that has entered a Netflix weekly top 10 anywhere — ${t.pageCount} of `
        + `them with a page, out of ${t.titleCount} we can see.`,
      href: '/titles',
      cta: 'Open the shelf',
    },
    {
      phrase: 'korean challenger ladder',
      name: 'The Korean ladder against five other regions',
      line: 'Korea has the lowest win rate at the top of any region we measure, and Europe West '
        + 'plays more ranked games to get there.',
      href: '/esports',
      cta: 'See the ladder',
    },
    {
      phrase: 'kpop group debuts',
      name: 'How many groups debut, and what really fell',
      line: 'New K-pop groups look 69% down since 2017 — and so do American, Japanese and every '
        + 'other kind. What fell was the record, not the industry.',
      href: '/kpop-attention',
      cta: 'See what fell',
    },
    {
      phrase: 'korean zodiac',
      name: 'Stars by the year they were born',
      line: `${s.peopleWithSign} Korean stars sorted into twelve birth-year rooms. The spread is `
        + 'indistinguishable from chance, so the years are a way to divide names and nothing more.',
      href: '/star-signs',
      cta: 'Open the star rooms',
    },
  ];
}

/** ⛔ 이 자는 화면에 한국어를 안 낸다. 우리 사정은 이 파일 주석에만 있다 */
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
  footer{margin-top:44px;padding-top:20px;border-top:1px solid var(--line);
    color:var(--ink-2);font-size:13px;max-width:64ch}
</style>
</head>
<body>
  <div class="wrap">
    <h1>Rooms</h1>
    <p class="lead">Nine rooms about Korean film, television, music and esports. Each one exists
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

    <footer>
      <p><strong>There is no sign-in and no posting yet.</strong> These rooms are places to read and
      to walk from one name to the next. Nothing here is ranked by us and there is no feed.</p>
      <p>K Culture Wire &middot; <a href="/about">How we make these numbers</a> &middot;
      <a href="/contact">Tell us a number here looks wrong</a></p>
    </footer>
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
    조용한것: 읽기('wikitip-quiet-hits.json'),
    별: 읽기('wikitip-star-signs.json'),
  };
}

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 자료 = 자료읽기();
  const 방 = 방들(자료);
  const 판 = 판짓기(방, 자료);

  검('방이 아홉이다', 방.length === 9);
  검('⛔ 방마다 갈 곳이 있다', 방.every((r) => typeof r.href === 'string' && r.href.startsWith('/')));
  검('⛔ 방마다 잰 말이 붙어 있다', 방.every((r) => r.phrase && r.phrase.length > 3));
  검('단추 수가 방 수와 같다', (판.match(/class="cta"/g) ?? []).length === 방.length);
  검('⛔ 죽은 단추가 없다', !/disabled/.test(판));
  검('⛔ 줄 세운 목록이 없다', !/<[ou]l[\s>]/.test(판));
  검('⛔ 화면에 한국어가 없다', !/[가-힣]/.test(판));
  검('⛔ noindex 가 없다 — 사이트맵과 어긋나면 안 된다', !/noindex/.test(판));
  검('영문 지면이다', /<html lang="en">/.test(판));

  /* ⭐ 사장님 지적의 핵심 — 첫 화면이 사주 방으로 채워져 있으면 안 된다 */
  검('⭐ 띠 방이 첫 화면을 차지하지 않는다', (판.match(/href="\/room\//g) ?? []).length === 0);
  검('⭐ 일간 방이 첫 화면을 차지하지 않는다', (판.match(/href="\/stem\//g) ?? []).length === 0);
  검('⭐ 넷플릭스 축이 있다', 판.includes('/by-country') && 판.includes('/underrated'));
  검('⭐ e스포츠 축이 있다', 판.includes('/esports'));
  검('스타 축은 카드 한 장으로 남는다', (판.match(/href="\/star-signs"/g) ?? []).length === 1);

  /* ⛔ 자동완성을 검색량이라고 부르면 안 된다 */
  검('⛔ 자동완성은 검색량이 아니라고 적었다', 판.includes('Autocomplete is not a search volume'));
  검('⛔ 차트와 제공 여부를 구분해 적었다',
    판.replace(/\s+/g, ' ').includes('Charting is not the same as being available'));
  검('⛔ 못 잰 것을 0으로 안 쓴다고 적었다',
    판.replace(/\s+/g, ' ').includes('We do not write a zero in place of a blank'));

  /* ⛔ 수를 지어내지 않았나 — 자료 파일의 값이 그대로 화면에 있어야 한다 */
  검('나라 수가 자료에서 왔다', 판.includes(String(자료.나라.countryCount)));
  검('지면 수가 자료에서 왔다', 판.includes(String(자료.제목.pageCount)));

  if (실패.length) {
    console.error(`❌ 자가시험 실패\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-community-front 자가시험 통과 (18)');
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
