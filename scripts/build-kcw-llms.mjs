#!/usr/bin/env node
/**
 * build-kcw-llms.mjs — **K Culture Wire 의 `llms.txt` 를 «지어내지 않고» 짓는다.**
 *
 * ── 🔴 왜 만드나 (2026-08-30 15:5x · 5번) ──────────────────
 * 오늘 재 보니 **kculturewire.com/llms.txt 가 404** 였다.
 * 100yearmap.com 과 seoulmarkets.com 은 둘 다 있는데 우리만 없었다.
 *
 * ⚠ 이것이 아픈 까닭 — 8/29 에 세 바깥 채널을 90일로 재서 이렇게 나왔다:
 * ```
 * 유튜브        2명
 * SNS           3명
 * AI 어시스턴트 23명   ← 손 하나 안 대고 가장 컸다
 * ```
 * **가장 큰 문에 안내문이 없었다.** llms.txt 는 AI 답변엔진이 「이 집에 뭐가 있나」를
 * 한 장으로 읽는 자리다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **설명을 지어내지 않는다.** 각 줄의 설명은 **실제로 지어진 지면의 description** 에서
 *   그대로 가져온다. 손으로 쓰면 지면이 바뀔 때 조용히 거짓말이 된다.
 * ⛔ **없는 지면을 적지 않는다.** dist 에 파일이 없으면 그 줄을 «빼고», 뺐다고 말한다.
 * ⛔ 수(작품 몇 편·사람 몇 명)는 **세어서** 넣는다. 어림하지 않는다.
 * ⚠ dist 가 없으면 **못 짓는다**고 말하고 멈춘다 — 빈 안내문을 내지 않는다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-llms.mjs --자가시험
 *   node scripts/build-kcw-llms.mjs           src/data/kcw-llms.json 을 낸다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 지어진곳 = path.join(뿌리, 'dist/wikitip');
const 낼길 = path.join(뿌리, 'src/data/kcw-llms.json');

/** 지면 하나에서 제목과 설명을 꺼낸다. ⛔ 없으면 null — 지어내지 않는다 */
export function 지면읽기(html) {
  if (typeof html !== 'string' || !html) return null;
  const 제목 = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? null;
  const 설명 = (html.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? null;
  if (!제목 && !설명) return null;
  return { 제목: 제목 && 풀기(제목), 설명: 설명 && 풀기(설명) };
}

/** HTML 실체참조를 사람 글자로. ⛔ 안 풀면 llms.txt 에 &amp; 가 그대로 나간다 */
export function 풀기(s) {
  return String(s ?? '')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&lsquo;|&rsquo;|&#39;/g, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 설명을 한 줄로 줄인다 — llms.txt 는 «한 장»이어야 읽힌다.
 * ⛔ 말 가운데서 자르지 않는다. ⛔ 줄이면 「…」을 붙여 «줄였다»는 것을 보인다.
 */
export function 한줄로(설명, 최대 = 200) {
  const s = 풀기(설명);
  if (!s) return null;
  if (s.length <= 최대) return s;
  const 자른것 = s.slice(0, 최대);
  const 끝 = Math.max(자른것.lastIndexOf('. '), 자른것.lastIndexOf(' '));
  return `${자른것.slice(0, 끝 > 60 ? 끝 : 최대).trim()}…`;
}

/** 한 줄을 llms.txt 꼴로. ⛔ 설명이 없으면 제목만 낸다 — 빈 괄호를 안 낸다 */
export function 줄만들기({ 길, 이름, 설명 }, 밑 = 'https://www.kculturewire.com') {
  if (!길 || !이름) return null;
  const 앞 = `- [${이름}](${밑}${길})`;
  return 설명 ? `${앞}: ${설명}` : 앞;
}

/* ⭐ 어느 지면을 낼지는 «손으로» 고른다 — 무엇이 중요한지는 자가 모른다.
   ⛔ 다만 «설명»은 손으로 안 쓴다. 실제 지면에서 가져온다. */
export const 차례 = [
  {
    갈래: 'Start here',
    것들: [
      ['/', 'K Culture Wire'],
      ['/most-popular', 'Which Korean title did best — it depends what you count'],
      ['/titles', 'Every Korean title we hold'],
      ['/data', 'Data and sources'],
    ],
  },
  {
    갈래: 'Netflix reach — how far a Korean title travelled',
    것들: [
      ['/hit-or-flop', 'Hit or flop?'],
      ['/what-to-watch-after', 'What to watch after a Korean show'],
      ['/netflix-which-country', 'Which country charted it'],
      ['/reach', 'How many countries a title reaches'],
      ['/staying-power', 'How long titles stay'],
      ['/time-to-peak', 'How fast titles peak'],
      ['/world-share', 'Korea\'s share of the world top 10'],
      ['/underrated', 'Titles that travelled further than their fame'],
      ['/netflix-top-10-korean-drama', 'Korean drama in the Netflix top 10'],
      ['/netflix-korea-this-week', 'This week in Korea'],
    ],
  },
  {
    갈래: 'People — actors, idols, where they came from',
    것들: [
      ['/actors', 'Korean actors we hold'],
      ['/actor-reach', 'How far each actor\'s work travelled'],
      ['/bts-hometowns', 'Where each BTS member was born'],
      ['/hometowns', 'Where Korean stars were born'],
      ['/born-abroad', 'Korean stars born outside Korea'],
      ['/debut-age', 'How old they were at debut'],
      ['/star-signs', 'Star signs across Korean stars'],
      ['/school', 'The schools Korean stars went to'],
    ],
  },
  {
    갈래: 'Industry — who makes it',
    것들: [
      ['/firms', 'Production companies'],
      ['/who-makes-it', 'Who makes Korean shows'],
      ['/webtoon', 'Titles that began as webtoons'],
      ['/tv-exports', 'Korean TV exports'],
      ['/two-pipelines', 'Two pipelines into the top 10'],
    ],
  },
  {
    갈래: 'Esports',
    것들: [
      ['/esports', 'Korean esports'],
      ['/esports-nations', 'Esports by nation'],
      ['/esports-games', 'Esports by game'],
    ],
  },
  /* 🔴 [2026-08-30 16:0x] 처음에 33줄만 골랐더니 **지킴이가 63장이 빠졌다고 울었다.**
     ⚠ 「안내문은 짧아야 한다」와 「AI 가 우리 지면을 알아야 한다」가 여기서 부딪힌다.
     ⭐ 갈랐다 — 위쪽 갈래는 «큰 문»이고, 아래 셋은 «가진 것을 다 보이는» 자리다.
       AI 답변엔진은 사람과 달리 긴 목록을 힘들어하지 않는다. 사람 눈에 띌 것만 위에 둔다.
     ⛔ 그래도 «낱장»(2,700장)은 안 넣는다 — 그러면 안내문이 아니라 사이트맵이 된다.
       낱장은 아래 「Per-entity pages」에서 «꼴과 수»로만 밝힌다. */
  {
    갈래: 'How a title moves — climb, hold, fall',
    것들: [
      ['/climb', 'How titles climb'],
      ['/opening', 'Opening week'],
      ['/arrival', 'When a title arrives'],
      ['/half-life', 'How fast attention halves'],
      ['/run-length', 'How long a run lasts'],
      ['/exit', 'How titles leave the chart'],
      ['/what-actually-fell', 'What actually fell'],
      ['/what-kind-fell', 'What kind of title fell'],
      ['/rank-shape', 'The shape of a rank run'],
      ['/rank-tells', 'What a rank does and does not tell'],
      ['/wave-and-floor', 'The wave and the floor'],
      ['/one-month', 'One month on the chart'],
      ['/lead-lag', 'Which country leads and which lags'],
    ],
  },
  {
    갈래: 'Where it travelled — countries and catalogues',
    것들: [
      ['/by-country', 'Country by country'],
      ['/spread', 'How a title spreads across countries'],
      ['/where-it-moved', 'Where it moved'],
      ['/where-to-watch', 'Where a title was watchable'],
      ['/foothold', 'Getting a foothold'],
      ['/hard-markets', 'The hard markets'],
      ['/crowding', 'Crowding on the chart'],
      ['/clumping', 'Clumping'],
      ['/catalogue-reach', 'Catalogue reach'],
      ['/catalogue-depth', 'Catalogue depth'],
      ['/malaysia', 'Malaysia'],
      ['/one-out', 'The one country left out'],
      ['/one-title', 'Countries that charted one Korean title'],
      ['/fewer-titles', 'Fewer titles, further reach'],
      ['/screen-split', 'How the screen splits'],
      ['/korean-movies-on-netflix', 'Korean movies on Netflix'],
      ['/watched', 'What was watched'],
      ['/netflix-top10-data', 'The Netflix top 10 data itself'],
      /* 🔴 [2026-09-02 · GEO] 지킴이가 「빠진 큰 지면」으로 울리던 자리다.
         AI 는 «표를 가진 지면»부터 인용한다 — 이 지면은 랭킹 자를 셋으로 갈라 센다.
         빼 둘 이유가 없었고, 안 넣은 것은 그냥 빠뜨린 것이었다. */
      ['/which-ranking', 'Which ranking is the real one'],
    ],
  },
  {
    갈래: 'Names, attention and identity',
    것들: [
      ['/most-read', 'Most-read names'],
      ['/kpop-attention', 'K-pop attention'],
      ['/fame-compare', 'Comparing fame'],
      ['/member-vs-group', 'Member versus group'],
      ['/own-star', 'A star of one\'s own'],
      ['/who-is-first', 'Who comes first'],
      ['/who-reads-least', 'Who is read least'],
      ['/read-vs-visited', 'Read versus visited'],
      ['/works-and-readers', 'Works and readers'],
      ['/siblings', 'Siblings'],
      ['/home-first', 'Home first'],
      ['/home-abroad', 'Home and abroad'],
      ['/is-it-korean', 'Is it Korean?'],
      ['/only-one-wikipedia', 'Only one Wikipedia'],
      ['/how-many-languages', 'How many languages'],
      ['/titles-to-name', 'Titles to a name'],
      ['/written-down-first', 'Written down first'],
      ['/provenance', 'Provenance'],
      ['/places', 'Places'],
      ['/actors-first', 'Actors first'],
      ['/zodiac', 'Zodiac'],
      ['/day-pillar', 'Day pillar'],
      ['/sea-athletes', 'Southeast Asian athletes'],
    ],
  },
  {
    갈래: 'Industry structure',
    것들: [
      ['/industry', 'The industry'],
      ['/exports', 'Exports'],
      ['/workforce', 'Workforce'],
      ['/brand-kinds', 'Kinds of brand'],
      ['/leverage', 'Leverage'],
      ['/look-vs-fly', 'Look versus fly'],
      ['/returns', 'Returns'],
      ['/ladder-gap', 'The ladder gap'],
      ['/ladder-churn', 'Ladder churn'],
    ],
  },
  {
    갈래: 'How we work',
    것들: [
      ['/about', 'About K Culture Wire'],
      ['/corrections', 'Corrections'],
      ['/articles', 'All articles'],
      ['/community', 'Community'],
      ['/weeks', 'Every week of the Netflix country top 10'],
    ],
  },
];

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('제목과 설명을 꺼낸다', (() => {
    const r = 지면읽기('<html><title>A</title><meta name="description" content="B"></html>');
    return r.제목 === 'A' && r.설명 === 'B';
  })());
  검('⛔ 둘 다 없으면 null — 지어내지 않는다', 지면읽기('<html></html>') === null);
  검('⛔ 빈 값도 null', 지면읽기('') === null && 지면읽기(null) === null);
  검('설명이 없으면 제목만 온다',
    지면읽기('<title>A</title>').설명 === null);

  검('🔴 실체참조를 푼다 — 안 풀면 &amp; 가 그대로 나간다', 풀기('A &amp; B') === 'A & B');
  검('긴 대시와 따옴표도 푼다', 풀기('a &mdash; &ldquo;b&rdquo;') === 'a — "b"');
  검('여러 공백을 하나로', 풀기('a   \n b') === 'a b');

  검('짧으면 그대로', 한줄로('short one', 200) === 'short one');
  검('⛔ 줄이면 「…」로 줄였다고 보인다', 한줄로('x'.repeat(300), 100).endsWith('…'));
  검('말 가운데서 안 자른다', (() => {
    const s = '한 문장이다. 두 번째 문장은 훨씬 길어서 잘릴 것이다 그리고 더 길다';
    return !/\s$/.test(한줄로(s, 30).replace('…', ''));
  })());
  검('⛔ 빈 설명은 null', 한줄로('') === null && 한줄로(null) === null);

  검('줄을 만든다',
    줄만들기({ 길: '/a', 이름: 'A', 설명: 'B' }) === '- [A](https://www.kculturewire.com/a): B');
  검('⛔ 설명이 없으면 빈 괄호를 안 낸다',
    줄만들기({ 길: '/a', 이름: 'A', 설명: null }) === '- [A](https://www.kculturewire.com/a)');
  검('⛔ 길이 없으면 null', 줄만들기({ 이름: 'A', 설명: 'B' }) === null);

  검('차례에 오늘 낸 지면이 들어 있다',
    차례.some((s) => s.것들.some(([길]) => 길 === '/what-to-watch-after')));
  검('차례의 길이 모두 / 로 시작한다',
    차례.every((s) => s.것들.every(([길]) => 길.startsWith('/'))));

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ llms.txt 짓는 자 — 자가시험 16 통과');
  process.exit(0);
}

if (내가실행됐다) {
  if (!fs.existsSync(지어진곳)) {
    console.log('⬜ **못 지었다** — dist/wikitip 이 없다. 먼저 `npx astro build` 를 돌린다.');
    console.log('   ⛔ 빈 안내문을 내지 않는다.');
    process.exit(1);
  }

  /* 실제로 지어진 파일에서만 읽는다 */
  /* ⚠ [2026-08-30] 홈은 `dist/wikitip/index.html` 이 아니라 **`dist/wikitip.html`** 로 지어진다
     (astro 가 접두사 폴더의 index 를 «폴더 이름 .html» 로 낸다). 처음에 그것을 몰라
     홈 줄이 조용히 빠졌다 — 자가 「뺐다」고 말해 줘서 알았다.
     ⭐ 잃은 것을 «세어서 말하는» 자였기에 잡혔다. 조용히 뺐으면 못 봤다. */
  const 찾기 = (길) => {
    const 후보 = 길 === '/'
      ? [path.join(지어진곳, 'index.html'), `${지어진곳}.html`]
      : [path.join(지어진곳, `${길.slice(1)}.html`), path.join(지어진곳, 길.slice(1), 'index.html')];
    for (const p of 후보) if (fs.existsSync(p)) return p;
    return null;
  };

  const 갈래들 = [];
  const 빠진것 = [];
  for (const { 갈래, 것들 } of 차례) {
    const 줄들 = [];
    for (const [길, 이름] of 것들) {
      const p = 찾기(길);
      if (!p) { 빠진것.push(길); continue; }      /* ⛔ 없는 지면은 안 적는다 */
      const 읽은것 = 지면읽기(fs.readFileSync(p, 'utf8'));
      줄들.push({ 길, 이름, 설명: 한줄로(읽은것?.설명) });
    }
    if (줄들.length) 갈래들.push({ 갈래, 줄들 });
  }

  /* 수는 «세어서» 넣는다 */
  const 센다 = (하위) => {
    try { return fs.readdirSync(path.join(지어진곳, 하위)).filter((f) => f.endsWith('.html')).length; }
    catch { return null; }
  };
  const 셈 = {
    작품: 센다('title'), 사람: 센다('person'), 학교: 센다('school'),
    나라: 센다('market'), 그룹: 센다('group'), 주: 센다('week'), 회사: 센다('firm'),
  };

  fs.writeFileSync(낼길, `${JSON.stringify({
    지은날: new Date().toISOString(), 갈래들, 셈, 빠진것,
  }, null, 1)}\n`);

  console.log(`✅ 갈래 ${갈래들.length} · 줄 ${갈래들.reduce((n, s) => n + s.줄들.length, 0)}`
    + ` → ${path.relative(뿌리, 낼길)}`);
  for (const [k, v] of Object.entries(셈)) {
    console.log(`   ${k.padEnd(4)} ${v === null ? '⚠ 못 셌다' : `${v}장`}`);
  }
  if (빠진것.length) {
    console.log(`\n⚠ **지어지지 않아 뺀 줄 ${빠진것.length}개** — ${빠진것.join(' · ')}`);
    console.log('   ⛔ 없는 지면을 안내문에 적지 않는다. 뺐다고 여기 남긴다.');
  }
}
