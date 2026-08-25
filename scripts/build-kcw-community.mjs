#!/usr/bin/env node
/**
 * **커뮤니티 첫 화면 한 장을 만든다** — `public/wikitip/community.html`
 *
 * 🔴 2번 지시(8/21 · 다섯 번째): 움직이지 않는 첫 화면 한 장. 서버·글쓰기·로그인 **없음**.
 *    스타 방 카드 **12장**(열두 띠에서 하나씩) · 카드 = 이름 + 띠 + 단추 · 줄 세운 목록 **0개**.
 *    사장님: 「케이컬쳐가 커뮤니티를 잘 만들어야 다른 유닛이 그대로 쓰지」 — 베낄 **본**이다.
 * 🔴 2번이 07:0x 에 임시 본을 만들어 주셨다(`docs/커뮤니티-첫본.html`). 고맙다.
 *    ⛔ 그것은 **한국어**다. kculturewire 는 영문 매체라 그대로 못 올린다. 영어로 다시 짓는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **이름을 지어내지 않는다.** `src/data/wikitip-star-signs.json` 에서 뽑는다.
 * ⛔ **점을 치지 않는다.** 띠는 방을 가르는 이름표일 뿐이다 —
 *    우리가 이미 「우연과 구분되지 않는다」를 발행했다(카이제곱 7.77 · 문턱 19.68).
 * ⛔ **줄 세운 목록을 안 만든다.** 2번 확인 항목이다.
 * ⛔ 글쓰기·로그인은 아직 안 넣는다. **읽는 자리**까지다.
 * ⛔ **화면에 한국어를 안 쓴다** — 주석도 마찬가지다. 우리 사정은 이 자에 적고 지면에서 뺀다.
 *   ⚠ 8/21 에 까닭을 HTML 주석으로 지면에 넣었다가 자가시험 넷이 한꺼번에 걸렸다.
 *     나가는 글에 우리말이 섞였고, 그 주석 안의 낱말이 다른 시험까지 헛걸리게 했다.
 *
 * ── 🔴 noindex 를 뺀 까닭 (2026-08-21) ────────────────────────
 * 처음엔 `noindex` 를 달았다. 그런데 사이트맵에는 방 열둘이 실려 있었다 —
 * 사이트맵 머리글이 금지한 **모순된 신호**다(「noindex 인 지면은 넣지 않는다」).
 * ⭐ 뺀 쪽은 noindex 다. 이 지면들은 스타 이름 1,047개를 담은 진짜 지면이고,
 *   사장님 지시가 「이름으로 검색 유입」이다. 숨길 까닭이 없다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-community.mjs
 *   node scripts/build-kcw-community.mjs --selftest
 */
import fs from 'node:fs';
import { 꼬리말 } from './kcw-static-footer.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
/* ⭐ 부딪히는 예명 목록은 **한 곳**에 둔다 — check-kcw-star-names 가 이미 손으로 뺀 것들이다.
   ⛔ 여기 베껴 두면 한쪽만 늘어난다(집안 규칙: 하나를 고치면 인용한 곳까지 따라간다) */
import { 부딪힘 } from './check-kcw-star-names.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자료길 = path.join(뿌리, 'src', 'data', 'wikitip-star-signs.json');
export const 낼길 = path.join(뿌리, 'public', 'wikitip', 'community.html');
export const 카드수 = 12;

/** 띠마다 가장 많이 읽힌 한 사람 — ⛔ 읽힘을 못 잰 사람은 대표로 안 세운다 */
export function 방들(자료) {
  return (자료.signs ?? []).map((s) => {
    const 대표 = (s.top ?? []).find((p) => typeof p.perMillion === 'number');
    return {
      sign: s.sign,
      people: s.people,
      withReads: s.withReads,
      star: 대표?.name ?? null,
      born: 대표?.born ?? null,
      perMillion: 대표?.perMillion ?? null,
      also: (s.top ?? []).filter((p) => p.name !== 대표?.name).slice(0, 2).map((p) => p.name),
    };
  }).filter((r) => r.star);
}

/**
 * 🔴 2번 지시(8/21 08:2x) — 「카드를 눌렀을 때 **갈 곳**을 만드십시오.
 *   손님이 한 번 눌러 보고 안 되면 다시 안 옵니다.」
 * ⛔ 그래서 단추가 이제 **간다.** 열두 방을 다 만든다 — 하나만 열면 나머지 열하나가 죽은 단추다.
 * ⛔ 글쓰기·로그인은 아직 안 넣는다(2번 지시). **읽는 자리**까지다.
 */
export const 단추말 = 'Open the room';
export const 방주소 = (띠) => `/room/${String(띠).toLowerCase()}`;

/*
 * 방 열둘은 태어난 «해»로, 일간 열 장은 같은 사람을 태어난 «날»로 가른다.
 * 두 축은 같은 것을 두 번 세는 것이 아니다 — 한 축으로 들어온 손님이 다른 축으로 갈 수 있어야 한다.
 * ⛔ 이 사정을 **HTML 주석으로 지면에 싣지 않는다.** 2026-08-22 에 그렇게 했다가
 *   check-no-internal-leak 이 잡았다 — 손님 지면에 우리 사정을 적는 자리는 없다.
 */
export function 판짓기(방, 자료) {
  const 칸 = 방.map((r) => `      <article class="room">
        <p class="sign">Year of the ${r.sign}</p>
        <h2>${r.star}</h2>
        <p class="born">Born ${r.born} &middot; ${r.perMillion} reads per million</p>
        <p class="also">${r.also.length ? `Also here: ${r.also.join(', ')}` : 'First room of this year'}</p>
        <p class="count">${r.people} Korean stars share this year</p>
        <a class="cta" href="${방주소(r.sign)}">${단추말}</a>
      </article>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com/community">
<title>Star rooms &mdash; K Culture Wire community</title>
<meta name="description" content="Twelve rooms, one for each Chinese zodiac year, named for the Korean star most read in that year across four Southeast Asian Wikipedias.">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Star rooms — K Culture Wire community","description":"Twelve rooms, one for each Chinese zodiac year, named for the Korean star most read in that year across four Southeast Asian Wikipedias.","url":"https://www.kculturewire.com/community","isPartOf":{"@type":"WebSite","name":"K Culture Wire","url":"https://www.kculturewire.com"},"creator":{"@type":"Organization","name":"K Culture Wire"},"isBasedOn":["https://www.wikidata.org","https://wikimedia.org/api/rest_v1/"]}</script>
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
  .lead{color:var(--ink-2);margin:0 0 8px;max-width:62ch}
  .note{color:var(--ink-2);font-size:14px;margin:0 0 32px;max-width:62ch}
  .warn{background:var(--accent-soft);border-left:3px solid var(--accent);
    padding:14px 16px;border-radius:6px;margin:0 0 36px;max-width:62ch;font-size:14px}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
  .room{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px}
  .sign{margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--accent);font-weight:700}
  .room h2{margin:0 0 6px;font-size:21px;letter-spacing:-.01em}
  .born,.also,.count{margin:0 0 6px;font-size:13px;color:var(--ink-2)}
  .count{margin-bottom:14px}
  .cta{display:block;width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--line);
    background:transparent;color:var(--accent);font:inherit;font-size:14px;text-align:center;
    text-decoration:none;font-weight:600}
  .cta:hover{background:var(--accent-soft)}
  .axis{margin-top:40px;padding-top:18px;border-top:1px solid var(--line)}
  .axis h2{font-size:1.05rem;margin:0 0 .4rem}
  .axis p{margin:.4rem 0}
  footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--line);
    color:var(--ink-2);font-size:13px;max-width:62ch}
</style>
</head>
<body>
  <div class="wrap">
    <h1>Star rooms</h1>
    <p class="lead">Twelve rooms, one for each Chinese zodiac year. Each is named for the Korean
      star born in that year who is read most across the Indonesian, Vietnamese, Thai and Malay
      Wikipedias.</p>
    <p class="note">Names and birth dates come from Wikidata; read counts from the Wikimedia
      Pageviews API, ${자료.window}.</p>

    <p class="warn"><strong>A room name is not a reading.</strong> We tested whether the zodiac
      year picks out who reaches a Netflix chart, and it does not &mdash; the result was
      indistinguishable from chance. The years are here to divide ${자료.peopleWithSign} stars into
      twelve rooms, nothing more.</p>

    <div class="grid">
${칸}
    </div>

    <section class="axis">
      <h2>The other axis &mdash; by the day, not the year</h2>
      <p>These twelve rooms sort people by the year they were born. There is a second axis almost
      nobody counts: the day. We built the day pillar for 9,249 Korean entertainers and split them
      into <a href="/day-pillar">ten day-stem pages</a> &mdash; IU on
      <a href="/stem/jeong">丁 jeong</a>, Jungkook on <a href="/stem/byeong">丙 byeong</a>,
      Suga on <a href="/stem/gi">己 gi</a>, ROSÉ on <a href="/stem/gap">甲 gap</a>.</p>
      <p class="fine"><strong>Neither axis is a reading.</strong> The birth-year spread is
      indistinguishable from chance, and the day-stem spread crossed the 0.05 line by a hair &mdash;
      we tried four ways to kill that and still do not call it a finding.</p>
    </section>

    ${꼬리말(['<strong>This is a first draft of a shell.</strong> There is no server, no sign-in and no posting yet, so every button above is deliberately inert. Nothing is ranked and there is no feed.'])}
  </div>
</body>
</html>
`;
}

/**
 * 방 한 곳 — 그 띠 사람 **전부**의 이름.
 * ⛔ 읽힘을 못 잰 사람도 이름은 싣는다. 「안 읽혔다」와 「우리가 못 쟀다」는 다르다.
 * ⛔ 줄 세운 목록(`<ol>`)을 안 쓴다 — 순위표가 아니다. 표로 놓되 등수 칸을 안 둔다.
 */
/**
 * 🔴 [2026-08-26] **띠 방 열두 장도 이름을 «글자로만» 싣고 있었다** (한 장에 60명 남짓).
 *   사람 지면 636장은 구글에서 「발견만」이고, 이런 이름 목록이 그리로 가는 문이다.
 * ⛔ 규칙은 `src/lib/person-link.ts` 와 «같다» — 바꿀 때 세 곳을 같이 바꾼다
 *   (person-link.ts · build-kcw-birthday-pages.mjs · build-kcw-stem-rooms.mjs · 여기).
 *   ① 지면이 있는 이름만 건다  ② 겹친 이름은 «안 건다»  ③ name·wikiPage 둘 다로 찾는다
 *   ⭐ 틀린 문은 없는 문보다 나쁘다.
 */
export function 사람이름표(사람들 = []) {
  const 키 = (x) => String(x ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const 표 = new Map();
  const 겹친것 = new Set();
  for (const q of 사람들) {
    if (!q?.slug) continue;
    for (const 이름 of [q.name, q.wikiPage]) {
      const k = 키(이름);
      if (!k) continue;
      const 있던 = 표.get(k);
      if (있던 && 있던 !== q.slug) { 겹친것.add(k); continue; }
      표.set(k, q.slug);
    }
  }
  for (const k of 겹친것) 표.delete(k);
  return { 표, 겹친수: 겹친것.size };
}

/** 이름 한 칸 — 지면이 있으면 문, 없으면 글자. ⛔ 지어내지 않는다. */
export function 사람칸(이름, 표) {
  const 안전 = String(이름 ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slug = 표?.get(String(이름 ?? '').toLowerCase().replace(/\s+/g, ' ').trim());
  return slug ? `<a href="/person/${slug}">${안전}</a>` : 안전;
}

export function 방짓기(칸, 자료, 기사들 = [], 이름표 = null) {
  const 잰것 = (칸.all ?? []).filter((p) => typeof p.perMillion === 'number');
  const 못잰것 = (칸.all ?? []).filter((p) => typeof p.perMillion !== 'number');
  const 줄 = 잰것.map((p) => `        <tr><td class="nm">${사람칸(p.name, 이름표)}</td><td class="fine">${p.born}</td>`
    + `<td class="num">${p.perMillion}</td></tr>`).join('\n');
  const 못잰줄 = 못잰것.length
    ? `      <h2>Also born in this year</h2>
      <p class="note">We hold a birth date for these ${못잰것.length} but no read count, because
      they are not in the panel we measure. They are named here rather than dropped &mdash;
      not measured is not the same as not read.</p>
      <p class="names">${못잰것.map((p) => 사람칸(p.name, 이름표)).join(' &middot; ')}</p>`
    : '';

  /* ⭐ 이 방 사람의 이름이 제목에 든 기사만. 걸린 것이 없으면 칸을 안 낸다 */
  const 읽을것 = 읽을것칸(방기사(기사들, (칸.all ?? []).map((x) => x.name), 칸.sign));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com${방주소(칸.sign)}">
<title>Year of the ${칸.sign} &mdash; K Culture Wire star rooms</title>
<meta name="description" content="The ${칸.people} Korean stars born in a ${칸.sign} year, including ${잰것.slice(0, 3).map((p) => p.name).join(', ')}.">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `Year of the ${칸.sign} — K Culture Wire star rooms`,
  description: `The ${칸.people} Korean stars born in a ${칸.sign} year.`,
  url: `https://www.kculturewire.com${방주소(칸.sign)}`,
  isPartOf: { '@type': 'WebSite', name: 'K Culture Wire', url: 'https://www.kculturewire.com' },
  creator: { '@type': 'Organization', name: 'K Culture Wire' },
  isBasedOn: ['https://www.wikidata.org', 'https://wikimedia.org/api/rest_v1/'],
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: 칸.people,
    itemListElement: 잰것.slice(0, 10).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name })),
  },
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
  .wrap{max-width:760px;margin:0 auto;padding:32px 20px 80px}
  .back{display:inline-block;margin-bottom:24px;color:var(--accent);text-decoration:none;font-size:14px}
  h1{font-size:clamp(26px,4vw,36px);line-height:1.15;margin:0 0 10px;letter-spacing:-.02em}
  h2{font-size:19px;margin:36px 0 8px}
  .lead{color:var(--ink-2);margin:0 0 6px;max-width:62ch}
  .note{color:var(--ink-2);font-size:14px;margin:0 0 20px;max-width:62ch}
  .warn{background:var(--accent-soft);border-left:3px solid var(--accent);
    padding:12px 14px;border-radius:6px;margin:18px 0 28px;max-width:62ch;font-size:14px}
  table{width:100%;border-collapse:collapse;background:var(--card);
    border:1px solid var(--line);border-radius:10px;overflow:hidden}
  th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);font-size:14px}
  th{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2)}
  tr:last-child td{border-bottom:none}
  .nm{font-weight:600}
  .fine{color:var(--ink-2)}
  .num{text-align:right;white-space:nowrap}
  .names{color:var(--ink-2);font-size:14px;line-height:1.9;max-width:62ch}
  .reads{list-style:none;padding:0;margin:10px 0 0;max-width:62ch}
  .reads li{padding:10px 0;border-bottom:1px solid var(--line);font-size:14px}
  .reads li:last-child{border-bottom:none}
  .axis{margin-top:36px;padding-top:16px;border-top:1px solid var(--line)}
  .axis h2{font-size:1.02rem;margin:0 0 .4rem}
  .axis p{margin:.4rem 0}
  footer{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);
    color:var(--ink-2);font-size:13px;max-width:62ch}
</style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="/community">&larr; All star rooms</a>
    <h1>Year of the ${칸.sign}</h1>
    <p class="lead">${칸.people} Korean actors and singers were born in a ${칸.sign} year.
      Here they all are.</p>
    <p class="note">Read counts are per million reads of the Indonesian, Vietnamese, Thai and
      Malay Wikipedias, ${자료.window}. Ordered by reads, which is a measure of being looked up.</p>

    <p class="warn"><strong>The year is a label, not a reading.</strong> We tested whether the
      zodiac year picks out who reaches a Netflix chart and the result was indistinguishable from
      chance. Sharing a year with ${잰것[0]?.name ?? 'anyone here'} means you share a birth year,
      and nothing else. <a href="/article/iu-is-a-rooster-go-youn-jung-a-rat">How we tested that, and what the twelve rooms are for &rarr;</a></p>

    <table>
      <thead><tr><th>Star</th><th>Born</th><th class="num">Reads per million</th></tr></thead>
      <tbody>
${줄}
      </tbody>
    </table>

${못잰줄}

${읽을것}
    <section class="axis">
      <h2>The same people, split by the day instead of the year</h2>
      <p>This room is a birth <em>year</em>. Every name in it also has a birth <em>day</em>, and the
      day has its own ten pages &mdash; <a href="/day-pillar">the count is here</a>, and the names
      are on the ten day-stem pages (<a href="/stem/gyeong">庚 gyeong</a>,
      <a href="/stem/jeong">丁 jeong</a>, <a href="/stem/byeong">丙 byeong</a> and seven more).</p>
      <p class="fine"><strong>A room name is not a reading</strong>, and neither is a day stem.</p>
    </section>

    ${꼬리말(['<strong>This room is read-only for now.</strong> There is no server, no sign-in and no posting yet.'])}
  </div>
</body>
</html>
`;
}

/**
 * ⭐⭐ 방마다 «읽을 것»을 붙인다 — 2026-08-23.
 *
 * 사장님 상시 지시: 「사람들이 방문하게 하고, **방문한 사람들이 오래 머무는 것**에 집중해라」.
 * 방 열두 장에는 이름이 1,047개 있는데 **나가는 문이 하나뿐**이었다(카이제곱 기사 한 편).
 * 이름을 보고 들어온 손님이 그 사람에 대해 우리가 쓴 글로 걸어갈 길이 없었다.
 *
 * ⛔ 「관련 기사」를 우리가 골라 주지 않는다. **제목에 그 방 사람의 이름이 든 것**만 싣고,
 *   왜 걸렸는지(어느 이름이 걸렸는지)를 지면에 같이 적는다. 고른 것이 아니라 잰 것이다.
 * ⛔ 걸린 것이 없으면 칸을 아예 안 낸다. 빈 「관련 기사」 칸은 없는 것보다 나쁘다.
 * ⛔ 이름은 본문이 아니라 **제목**에서만 본다 — 표 안에 이름이 스치기만 한 기사를
 *   「이 사람에 대한 글」이라고 부르면 거짓이다.
 */
export const 기사방 = path.join(뿌리, 'content', 'kculturewire');

/** 앞말에서 몇 칸만 뽑는다. ⛔ YAML 을 다 풀지 않는다 — 필요한 것만 본다 */
export function 앞말뽑기(글) {
  const 앞 = String(글 ?? '').split(/^---\s*$/m)[1];
  if (!앞) return null;
  const 값 = (키) => {
    for (const 줄 of 앞.split(/\r?\n/)) {
      if (!줄.startsWith(`${키}:`)) continue;
      let v = 줄.slice(키.length + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return v;
    }
    return null;
  };
  return {
    title: 값('title'), dek: 값('dek'), pubDate: 값('pubDate'), draft: 값('draft') === 'true',
  };
}

export function 기사읽기(방 = 기사방, 읽기 = fs) {
  if (!읽기.existsSync(방)) return [];
  return 읽기.readdirSync(방).filter((n) => n.endsWith('.md')).map((f) => {
    const a = 앞말뽑기(읽기.readFileSync(path.join(방, f), 'utf8'));
    if (!a || !a.title || a.draft) return null;
    return { slug: f.replace(/\.md$/, ''), ...a };
  }).filter(Boolean);
}

/**
 * ⛔ 이름이 낱말 조각에 걸리면 안 된다 — 「June(달)」이 예명 June 으로 걸린 적이 있다.
 *   아포스트로피는 경계다: 소유격도 이름이다(「BTS's」).
 */
/**
 * ⛔ **역슬래시를 이 자리에 안 쓴다.** 이 함수를 셸로 넣다가 `\` 두 개가 먹혀 파일이
 *   깨졌다(2026-08-23, 오늘 세 번째다). 글자를 하나씩 세어 붙이는 편이 안 깨진다.
 */
export const 자에서뺄것 = new Set([...'.*+?^${}()|[]']);

export function 이름자(이름) {
  const n = [...String(이름)]
    .map((c) => (자에서뺄것.has(c) ? String.fromCharCode(92) + c : c)).join('');
  return new RegExp(`(^|[^A-Za-z0-9-])${n}([^A-Za-z0-9-]|$)`);
}

/** ⭐ 제목에 이 방 사람의 이름이 들었나. 든 이름을 **함께 돌려준다** — 지면에 까닭으로 적는다 */
export function 방기사(기사들, 이름들, 띠, 최대 = 4) {
  const 자들 = (이름들 ?? [])
    .filter((n) => n && n.length >= 2 && !부딪힘.has(n))
    .map((n) => [n, 이름자(n)]);
  const 띠자 = 이름자(띠);
  const 걸림 = [];
  for (const a of 기사들 ?? []) {
    const 든이름 = 자들.filter(([, r]) => r.test(a.title)).map(([n]) => n);
    if (든이름.length) 걸림.push({ ...a, 까닭: `names ${든이름.slice(0, 3).join(', ')}` });
    else if (띠자.test(a.title)) 걸림.push({ ...a, 까닭: `names the ${띠}` });
  }
  걸림.sort((x, y) => String(y.pubDate ?? '').localeCompare(String(x.pubDate ?? '')));
  return 걸림.slice(0, 최대);
}

export function 읽을것칸(걸린것) {
  if (!(걸린것 ?? []).length) return '';
  const 줄 = 걸린것.map((a) => `        <li><a href="/article/${a.slug}">${a.title}</a>`
    + `<br><span class="fine">${a.까닭}</span></li>`).join('\n');
  return `    <section class="axis">
      <h2>What we have written that names someone in this room</h2>
      <p class="fine">These are here because the headline names a person on this page &mdash;
      not because we judged them relevant. The reason each one is listed is printed under it.</p>
      <ul class="reads">
${줄}
      </ul>
    </section>

`;
}
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 방 = 방들(자료);
  재본다('⭐ 방이 열둘이다 — 2번 확인 ②', 방.length, 카드수);
  /**
   * ⚠ 처음에 「두 글자 넘는 이름」을 요구했다가 **IU 에서 걸렸다.** IU 는 실재하는 이름이고
   *   닭띠에서 가장 많이 읽힌 사람이다. 여기 이름은 **자료에서 뽑은 것**이라 짧아도 참이다.
   *   ⛔ 제목 검사기(check-kcw-star-names)에서 짧은 이름을 뺀 것과 자리가 다르다 —
   *     거기는 **글자를 맞추는** 자리라 겹침이 문제였고, 여기는 맞추지 않는다.
   */
  재본다('⛔ 이름을 못 뽑은 방이 없다', 방.every((r) => typeof r.star === 'string' && r.star.length > 0), true);
  재본다('⛔ 읽힘을 못 잰 사람을 대표로 안 세운다',
    방.every((r) => typeof r.perMillion === 'number'), true);

  const 판 = 판짓기(방, 자료);
  재본다('⭐ 스타 실명이 화면에 있다 — 2번 확인 ④',
    방.every((r) => 판.includes(r.star)), true);
  /* ⛔ 2번 확인 ③ — 줄 세운 목록 0개 */
  재본다('⛔⛔ 줄 세운 목록이 없다', /<[ou]l[\s>]/.test(판), false);
  /* 🔴 2번 지시(08:2x) — 이제 단추가 **간다.** 죽은 단추가 하나라도 있으면 안 된다 */
  재본다('⛔⛔ 단추가 갈 곳이 있다', /<a class="cta" href="\/room\//.test(판), true);
  재본다('⛔ 죽은 단추가 없다', /disabled/.test(판), false);
  재본다('⛔ 단추 수가 방 수와 같다', (판.match(/class="cta"/g) ?? []).length, 카드수);
  재본다('⛔ 화면에 한국어가 없다', /[가-힣]/.test(판), false);
  재본다('⛔ 점을 안 친다는 말이 있다', /indistinguishable from chance/.test(판), true);
  재본다('영문 지면이다', /<html lang="en">/.test(판), true);
  /* 🔴 사이트맵에 실린 지면에 noindex 를 달면 모순된 신호다 */
  재본다('⛔⛔ noindex 가 없다 — 사이트맵과 어긋나면 안 된다', /noindex/.test(판), false);

  /* ── 방 한 곳 ── */
  const 닭 = 자료.signs.find((s) => s.sign === 'Rooster');
  const 방판 = 방짓기(닭, 자료);
  재본다('⭐ 방에 그 띠 사람이 **다** 보인다 — 2번 확인 ②',
    닭.all.every((p) => 방판.includes(p.name)), true);
  재본다('⛔⛔ 읽힘 못 잰 사람도 이름이 남는다',
    닭.all.filter((p) => p.perMillion == null).every((p) => 방판.includes(p.name)), true);
  재본다('⛔ 방에도 줄 세운 목록이 없다', /<[ou]l[\s>]/.test(방판), false);
  재본다('⭐ 첫 화면으로 돌아가는 길이 있다', /href="\/community"/.test(방판), true);
  /* ⚠ 글이 줄바꿈으로 끊겨 있어 낱말 사이 공백을 s+ 로 본다 — 지면은 맞는데 자가 틀렸었다 */
  /**
   * ⚠ 이 글이 줄바꿈으로 끊겨 있다. 낱말 사이를 한 칸으로만 보면 **지면은 맞는데 자가 틀린다.**
   *   그래서 공백을 한 칸 이상으로 본다. (오늘 셋째 번 겪는 자리다)
   */
  const 붙여 = (s) => s.replace(/\s+/g, ' ');
  재본다('⛔ 방에서도 점을 안 친다',
    붙여(방판).includes('indistinguishable from chance'), true);
  재본다('⛔ 방에 한국어가 없다', /[가-힣]/.test(방판), false);
  재본다('⛔ 아직 글쓰기가 없다고 적는다', /no sign-in and no\s+posting/.test(방판), true);
  재본다('⛔⛔ 방에도 noindex 가 없다', /noindex/.test(방판), false);
  재본다('방 주소를 소문자로 만든다', 방주소('Rooster'), '/room/rooster');

  /* ── ⭐ 방에서 나가는 문 (2026-08-23) ─────────────────────── */
  const 견본 = [
    { slug: 'a', title: "IU's saju holds", pubDate: '2026-08-23' },
    { slug: 'b', title: 'Jungkook and Karina', pubDate: '2026-08-22' },
    { slug: 'c', title: 'Nothing to do with anyone here', pubDate: '2026-08-21' },
    { slug: 'd', title: 'What the Rooster room is for', pubDate: '2026-08-20' },
  ];
  재본다('⭐ 제목에 이름이 든 것만 걸린다',
    방기사(견본, ['IU', 'Karina'], 'Rooster').map((x) => x.slug), ['a', 'b', 'd']);
  재본다('⛔ 아무 이름도 없는 기사는 안 걸린다',
    방기사(견본, ['IU'], 'Rooster').some((x) => x.slug === 'c'), false);
  재본다('⭐ 왜 걸렸는지를 함께 돌려준다',
    방기사(견본, ['IU'], 'Rooster')[0].까닭, 'names IU');
  재본다('⭐ 띠 이름만 든 것은 띠로 걸렸다고 적는다',
    방기사(견본, ['IU'], 'Rooster').find((x) => x.slug === 'd').까닭, 'names the Rooster');
  재본다('⭐ 새것부터 놓는다',
    방기사(견본, ['IU', 'Karina'], 'Rooster')[0].slug, 'a');
  재본다('⭐ 넷까지만 싣는다', 방기사(견본, ['IU', 'Karina'], 'Rooster', 2).length, 2);
  /* ⛔ 낱말 조각·보통 낱말에 걸리면 거짓 문이 생긴다 */
  재본다('⛔ 낱말 조각에 안 걸린다',
    방기사([{ slug: 'x', title: 'IUY is not a name', pubDate: '1' }], ['IU'], 'Rat').length, 0);
  재본다('⛔ 소유격은 이름으로 센다',
    방기사([{ slug: 'x', title: "BTS's month", pubDate: '1' }], ['BTS'], 'Rat').length, 1);
  재본다('⛔ 부딪히는 예명은 아예 안 센다',
    방기사([{ slug: 'x', title: 'Rain or shine', pubDate: '1' }], ['Rain'], 'Rat').length, 0);
  /* 🔴 걸린 것이 없으면 **칸을 아예 안 낸다.** 빈 「관련 기사」는 없는 것보다 나쁘다 */
  재본다('⛔ 걸린 것이 없으면 칸을 안 낸다', 읽을것칸([]), '');
  재본다('⭐ 걸린 것이 있으면 까닭까지 싣는다',
    읽을것칸(방기사(견본, ['IU'], 'Rat')).includes('names IU'), true);
  재본다('⛔ 「관련」이라고 우기지 않는다 — 까닭을 적는다고 밝힌다',
    읽을것칸(방기사(견본, ['IU'], 'Rat')).includes('not because we judged them relevant'), true);
  /* ⛔ 앞말을 다 풀지 않고 몇 칸만 뽑는다 — 그 몇 칸이 맞는지는 재 둔다 */
  재본다('⭐ 앞말에서 제목을 뽑는다',
    앞말뽑기('---\ntitle: "A B"\ndraft: false\n---\nbody').title, 'A B');
  재본다('⛔ 초안은 뺀다',
    앞말뽑기('---\ntitle: "A"\ndraft: true\n---\n').draft, true);
  재본다('⛔ 앞말이 없으면 null', 앞말뽑기('no frontmatter'), null);

  console.log(`커뮤니티 첫 본 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 방 = 방들(자료);
  const 기사 = 기사읽기();
  if (방.length !== 카드수) {
    console.error(`⛔ 방이 ${방.length}개다 — ${카드수}개여야 한다. 짓지 않는다.`);
    process.exit(1);
  }
  /**
   * 🔴 2026-08-22 — 사장님: 「왜 너의 커뮤니티인데 케이라이프맵의 커뮤니티 같지?」
   *   첫 화면이 띠 카드 열둘이었다. 사주는 4번(KLifeMap)의 주제다.
   *   ⭐ 첫 화면은 이제 build-kcw-community-front.mjs 가 K컬처 방으로 짓는다.
   *   ⛔ 이 자는 첫 화면을 **더 쓰지 않는다** — 두 자가 한 파일을 쓰면 나중 것이 앞 것을 지운다.
   *   이 자가 계속 하는 일은 띠 방 열두 장이다. 그 방들은 살아 있고 /star-signs 에서 닿는다.
   */
  console.log(`⛔ 첫 화면은 안 쓴다 — build-kcw-community-front.mjs 몫이다`);

  /* 🔴 열두 방을 다 만든다 — 하나만 열면 나머지 열하나가 죽은 단추다 */
  /* 🔴 [2026-08-26] 사람 지면 명단을 한 번 읽어 이름에 문을 단다.
     ⚠ 명단이 없으면 걸지 않는다 — 예전과 똑같이 글자로 나간다. 빌드가 죽지 않게. */
  const 사람지면길 = path.join(뿌리, 'src/data/wikitip-people.json');
  let 사람이름표들 = null;
  if (fs.existsSync(사람지면길)) {
    const j = JSON.parse(fs.readFileSync(사람지면길, 'utf8'));
    const r = 사람이름표(j.people ?? []);
    사람이름표들 = r.표;
    console.log(`   사람 지면 ${(j.people ?? []).length}장 → 이름 ${r.표.size}개에 문을 단다`
      + (r.겹친수 ? ` (겹쳐서 «안 거는» 것 ${r.겹친수}개)` : ''));
  } else {
    console.log('   ⚠ 사람 지면 명단이 없다 — 이름을 글자로만 낸다(예전과 같다)');
  }

  const 방방 = path.join(뿌리, 'public', 'wikitip', 'room');
  fs.mkdirSync(방방, { recursive: true });
  let 이름합 = 0;
  for (const s of 자료.signs) {
    const 길 = path.join(방방, `${s.sign.toLowerCase()}.html`);
    fs.writeFileSync(길, 방짓기(s, 자료, 기사, 사람이름표들));
    이름합 += s.all.length;
    console.log(`   ${방주소(s.sign).padEnd(18)} 이름 ${String(s.all.length).padStart(3)}`
      + `  (읽힘 ${s.withReads} · 못 잰 ${s.all.length - s.withReads})`);
  }
  console.log(`\n방 ${자료.signs.length}개 · 이름 합계 ${이름합}`);
}
