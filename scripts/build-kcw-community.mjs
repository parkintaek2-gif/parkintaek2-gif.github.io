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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

    <footer>
      <p><strong>This is a first draft of a shell.</strong> There is no server, no sign-in and no
      posting yet, so every button above is deliberately inert. Nothing is ranked and there is no
      feed.</p>
      <p>K Culture Wire &middot; kculturewire.com</p>
    </footer>
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
export function 방짓기(칸, 자료) {
  const 잰것 = (칸.all ?? []).filter((p) => typeof p.perMillion === 'number');
  const 못잰것 = (칸.all ?? []).filter((p) => typeof p.perMillion !== 'number');
  const 줄 = 잰것.map((p) => `        <tr><td class="nm">${p.name}</td><td class="fine">${p.born}</td>`
    + `<td class="num">${p.perMillion}</td></tr>`).join('\n');
  const 못잰줄 = 못잰것.length
    ? `      <h2>Also born in this year</h2>
      <p class="note">We hold a birth date for these ${못잰것.length} but no read count, because
      they are not in the panel we measure. They are named here rather than dropped &mdash;
      not measured is not the same as not read.</p>
      <p class="names">${못잰것.map((p) => p.name).join(' &middot; ')}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com${방주소(칸.sign)}">
<title>Year of the ${칸.sign} &mdash; K Culture Wire star rooms</title>
<meta name="description" content="The ${칸.people} Korean stars born in a ${칸.sign} year, including ${잰것.slice(0, 3).map((p) => p.name).join(', ')}.">
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

    <section class="axis">
      <h2>The same people, split by the day instead of the year</h2>
      <p>This room is a birth <em>year</em>. Every name in it also has a birth <em>day</em>, and the
      day has its own ten pages &mdash; <a href="/day-pillar">the count is here</a>, and the names
      are on the ten day-stem pages (<a href="/stem/gyeong">庚 gyeong</a>,
      <a href="/stem/jeong">丁 jeong</a>, <a href="/stem/byeong">丙 byeong</a> and seven more).</p>
      <p class="fine"><strong>A room name is not a reading</strong>, and neither is a day stem.</p>
    </section>

    <footer>
      <p><strong>This room is read-only for now.</strong> There is no server, no sign-in and no
      posting yet.</p>
      <p>K Culture Wire &middot; kculturewire.com</p>
    </footer>
  </div>
</body>
</html>
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

  console.log(`커뮤니티 첫 본 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 방 = 방들(자료);
  if (방.length !== 카드수) {
    console.error(`⛔ 방이 ${방.length}개다 — ${카드수}개여야 한다. 짓지 않는다.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, 판짓기(방, 자료));
  console.log(`✅ ${path.relative(뿌리, 낼길)} — 방 ${방.length}개`);

  /* 🔴 열두 방을 다 만든다 — 하나만 열면 나머지 열하나가 죽은 단추다 */
  const 방방 = path.join(뿌리, 'public', 'wikitip', 'room');
  fs.mkdirSync(방방, { recursive: true });
  let 이름합 = 0;
  for (const s of 자료.signs) {
    const 길 = path.join(방방, `${s.sign.toLowerCase()}.html`);
    fs.writeFileSync(길, 방짓기(s, 자료));
    이름합 += s.all.length;
    console.log(`   ${방주소(s.sign).padEnd(18)} 이름 ${String(s.all.length).padStart(3)}`
      + `  (읽힘 ${s.withReads} · 못 잰 ${s.all.length - s.withReads})`);
  }
  console.log(`\n방 ${자료.signs.length}개 · 이름 합계 ${이름합}`);
}
