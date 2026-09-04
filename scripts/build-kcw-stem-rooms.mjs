#!/usr/bin/env node
/**
 * build-kcw-stem-rooms.mjs — **일간 열 칸을 이름으로 걷는 지면 열 장.** (`/stem/<gan>`)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * `/day-pillar` 은 표다. 표는 셈을 보여 주지만 **사람이 자기 이름으로 찾아 들어오는 자리는
 * 아니다.** 띠 방 열두 장에서 이미 겪었다 — 이름 1,047개를 한 장에 늘어놓으면 아무도 안 읽고,
 * 열두 장으로 갈라 놓으면 읽힌다. 사장님 상시 지시도 「스타 이름을 항상 제목과 본문에」다.
 *
 * ⭐ 그래서 캐 둔 9,249명을 **일간 열 칸으로 갈라** 열 장을 만든다. 새로 캘 것이 없다.
 * ⛔ 점을 치지 않는다. 칸 이름은 «가르는 이름표»일 뿐이고, 우리가 이미 잰 것을 각 장 머리에 적는다 —
 *   일간 분포는 카이제곱 17.91(문턱 16.92)로 문턱을 살짝 넘었지만, 반증을 넷 해 보고도
 *   「발견」이라 부르지 않기로 한 그 수다. 그 문장을 열 장에 그대로 싣는다.
 * ⛔ 「이 일간이면 이렇다」를 한 줄도 쓰지 않는다.
 * ⛔ 화면에 우리말을 쓰지 않는다(`check-english-only.mjs`).
 *
 * ── 지키는 것 ────────────────────────────────────────────────
 * ⚠ canonical 을 넣는다 — 커뮤니티 방 열두 장이 canonical 없이 나가 있었다(8/22 에 잡음).
 * ⚠ 들어오는 문을 같이 낸다 — 만들고 문을 안 내면 없는 것과 같다(여섯 번 겪었다).
 * ⚠ 이름은 위키데이터에서 캔 것만 쓴다. 손으로 적지 않는다.
 *
 * 쓰는 법  node scripts/build-kcw-stem-rooms.mjs --자가시험
 *          node scripts/build-kcw-stem-rooms.mjs
 */
import fs from 'node:fs';
import { 꼬리말 } from './kcw-static-footer.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 일주 } from './lib/일주.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 잰것 = path.join(뿌리, 'src/data/wikitip-star-daypillar.json');
const 낼방 = path.join(뿌리, 'public/wikitip/stem');

/* 🔴 [2026-08-26] 사람 지면 명단을 한 번 읽어 이름에 문을 단다.
   ⚠ 명단이 없으면 «걸지 않는다» — 예전과 똑같이 글자로 나간다. 빌드가 죽지 않게. */
const 사람지면길 = path.join(뿌리, 'src/data/wikitip-people.json');
let 사람이름표들 = null;
if (fs.existsSync(사람지면길)) {
  const j = JSON.parse(fs.readFileSync(사람지면길, 'utf8'));
  const r = 사람이름표(j.people ?? []);
  사람이름표들 = r.표;
  console.log(`사람 지면 ${(j.people ?? []).length}장 → 이름 ${r.표.size}개에 문을 단다`
    + (r.겹친수 ? ` (겹쳐서 «안 거는» 것 ${r.겹친수}개)` : ''));
} else {
  console.log('⚠ 사람 지면 명단이 없다 — 이름을 글자로만 낸다(예전과 같다)');
}

/** 일간 열 칸 — 한자와 로마자. 주소는 로마자 소문자다 */
export const 간 = [
  ['甲', 'gap'], ['乙', 'eul'], ['丙', 'byeong'], ['丁', 'jeong'], ['戊', 'mu'],
  ['己', 'gi'], ['庚', 'gyeong'], ['辛', 'sin'], ['壬', 'im'], ['癸', 'gye'],
];
export const 칸주소 = (로마자) => `/stem/${로마자}`;
const 로마자 = new Map(간);

/** 한 칸에 들어갈 사람 — 많이 링크된 순. ⚠ 링크 수는 «널리 쓰였나»의 대리 지표다 */
/* ⭐ [2026-09-02] 기사 문을 내는 자는 «한 곳»에 둔다 — build-kcw-community-front.mjs 것을 쓴다.
   ⛔ 여기 베껴 적으면 한쪽만 고쳐진다. */
import { 기사읽기, 이지면기사 } from './build-kcw-community-front.mjs';

/**
 * 그 칸의 제목. **사람 이름을 앞에 놓는다.**
 *
 * 🔴 [2026-09-05 00:4x] 전 제목은 「甲 (gap) day stem — 949 Korean entertainers」였다.
 *   열 장이 다 같은 꼴이고 **이름이 하나도 없다.**
 *   ⛔ 사람이 검색하는 것은 「Jisoo」이지 「gap day stem」이 아니다.
 *   ⭐ 어제(9/3) 네 유닛이 정한 규칙 — 「제목에 사람이 실제로 검색하는 실명 +
 *     아무도 답하지 않는 물음」. 「누가 같은 일간을 갖고 있나」는 아무도 안 센다.
 *   ⚠ 이름은 이미 설명에 쓰고 있었다(이름셋). 제목에만 없었다.
 *
 * ⛔ 「이 일간이면 이렇다」로 읽히게 짓지 않는다 — 이 지면은 **셈이지 감명이 아니다.**
 *   그래서 「share」로 쓴다. 성격도 운도 말하지 않는다.
 * ⬜ 실을 이름이 없으면 옛 꼴로 돌아간다. 없는 이름을 지어내지 않는다.
 */
/**
 * h1 앞머리 — 실을 이름이 있으면 「A and B share the 」를 만든다.
 * ⛔ 삼항 연산자를 지면 문자열 «안에» 넣지 않는다. 따옴표가 겹쳐 파일이 깨진다
 *   (2026-09-05 00:5x 에 실제로 깨뜨렸다 — 백틱 안의 홑따옴표가 문자열을 닫았다).
 */
export function 이름앞머리(실을것 = []) {
  const 둘 = (실을것 ?? []).slice(0, 2).map((x) => x.name).filter(Boolean);
  if (!둘.length) return '';
  return `${둘.join(' and ')} share the `;
}

export function 칸제목(한자, rom, 사람수, 이름들 = []) {
  const 둘 = (이름들 ?? []).filter(Boolean).slice(0, 2);
  const 뒤 = `the ${한자} (${rom}) day stem, ${사람수} in all`;
  if (!둘.length) return `${한자} (${rom}) day stem — ${사람수} Korean entertainers`;
  const 꼴들 = [
    `${둘.join(' and ')} share ${뒤}`,
    `${둘.join(', ')} — ${뒤}`,
    `${둘[0]} — ${뒤}`,
  ];
  return 꼴들.find((t) => t.length <= 60) ?? 꼴들[꼴들.length - 1];
}
export function 칸나누기(사람들) {
  const 칸 = new Map(간.map(([h]) => [h, []]));
  for (const p of 사람들) {
    const j = 일주(p.born);
    if (!j.일간한자 || !칸.has(j.일간한자)) continue;
    칸.get(j.일간한자).push({ ...p, dayPillar: j.일주한자 });
  }
  for (const [, v] of 칸) v.sort((a, b) => b.sitelinks - a.sitelinks || a.name.localeCompare(b.name));
  return 칸;
}

const 벗기기 = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * 🔴 2026-08-22 13:2x — 첫 판이 **영어 지면에 한글 이름을 내보냈다**(`check-english-only` 가 열 장을 잡았다).
 *   위키데이터에 영문 이름표도 영문 별칭도 없는 사람이 **2,246명**이고, 그 사람들은 한국어 이름표로
 *   떨어져 있었다. 5번 손님은 영어권이라 화면에 한국어가 있으면 거기서 끝난다.
 * ⛔ 그렇다고 그 사람들을 **셈에서 빼지 않는다** — 못 잰 것을 없는 것으로 만드는 짓이다.
 *   셈에는 넣고 **목록에서만 빼고, 몇 명을 왜 안 실었는지 지면에 적는다.**
 */
export const 라틴이름 = (이름) => /^[A-Za-z0-9À-ɏḀ-ỿ' .,\-()&+/]+$/.test(이름);

/**
 * 🔴 [2026-08-26] **이 지면들도 사람 이름을 «글자로만» 싣고 있었다.**
 *   재 보니 일진(stem) 열 장에 68명 · 방(room) 열두 장에 61명이 글자였다.
 *   사람 지면 636장은 지금 구글에서 「발견만」이고, 이런 목록이 그리로 가는 문이다.
 *
 * ⛔ 규칙은 `src/lib/person-link.ts` 와 «같다». 여기 다시 적는 까닭은 이 파일이
 *   Astro 밖에서 도는 자라 그 모듈(.ts)을 그대로 못 부르기 때문이다.
 *   ⚠ 규칙이 두 곳에 있으면 갈라진다 — **바꿀 때 둘 다 바꾼다.** 여기 적어 둔다.
 *
 *   ① 지면이 있는 이름만 건다     ⛔ 없는 곳으로 걸면 손님이 404 를 본다
 *   ② 이름이 겹치면 «안 건다»     ⭐ 틀린 문은 없는 문보다 나쁘다
 *   ③ 이름은 name·wikiPage 둘 다로 찾는다
 */
export function 사람이름표(사람들 = []) {
  const 키 = (x) => String(x ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const 표 = new Map();
  const 겹친것 = new Set();
  for (const p2 of 사람들) {
    if (!p2?.slug) continue;
    for (const 이름 of [p2.name, p2.wikiPage]) {
      const k = 키(이름);
      if (!k) continue;
      const 있던 = 표.get(k);
      if (있던 && 있던 !== p2.slug) { 겹친것.add(k); continue; }
      표.set(k, p2.slug);
    }
  }
  for (const k of 겹친것) 표.delete(k);
  return { 표, 겹친수: 겹친것.size };
}

/** 이름 한 칸 — 지면이 있으면 문, 없으면 글자. ⛔ 지어내지 않는다. */
export function 사람칸(이름, 표) {
  const slug = 표?.get(String(이름 ?? '').toLowerCase().replace(/\s+/g, ' ').trim());
  return slug ? `<a href="/person/${slug}">${벗기기(이름)}</a>` : 벗기기(이름);
}

/**
 * 이 지면에 걸리겠다고 기사가 적어 둔 것들을 한 토막으로 짓는다.
 * ⚠ 없으면 토막을 아예 안 낸다 — 빈 상자는 없는 것만 못하다.
 * ⚠ 내는 글 안에는 «주석을 달지 않는다» — 그대로 손님 화면이고, 한국어가 섞이면
 *   `check-kcw-korean-leak` 이 잡는다.
 */
export function 읽을것칸(걸린것) {
  if (!(걸린것 ?? []).length) return '';
  const 줄 = (걸린것 ?? []).map((a) => `    <p class="read"><a href="/article/${a.slug}">${a.title}</a>`
    + `${a.dek ? `<br><span class="fine">${a.dek}</span>` : ''}</p>`).join('\n');
  return `<section class="reads">
    <h2>What we wrote from this data</h2>
    <p class="fine">Each of these is here because <strong>the article itself says it belongs on
    this page</strong> &mdash; not because we ranked it or judged it relevant.</p>
${줄}
  </section>
`;
}

/**
 * @param 기사들 [2026-09-02] 이 지면에 걸리겠다고 «기사가 스스로 적어 둔» 것들.
 *   🔴 이것이 없어서 daystem 기사가 「/stem/jeong · /stem/sin · /stem/im 에 걸린다」고
 *     적어 놓고 세 지면 어디에도 링크가 없었다. check-article-reach.mjs 가 잡았다.
 *   ⚠ 기본값을 빈 배열로 둔다 — 앞서 이 자를 네 인자로 부르는 자리가 있다.
 */
export function 방짓기(한자, 사람들, 잼, 이름표 = null, 기사들 = []) {
  const rom = 로마자.get(한자);
  const 실을것 = 사람들.filter((p) => 라틴이름(p.name));
  const 안실은수 = 사람들.length - 실을것.length;
  const 이름셋 = 실을것.slice(0, 3).map((p) => p.name).join(', ');
  const 줄 = 실을것.map((p) => `<tr><td>${사람칸(p.name, 이름표)}</td><td class="fine">${p.born}</td><td>${p.dayPillar}</td><td class="fine">${p.sitelinks}</td></tr>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com${칸주소(rom)}">
<title>${칸제목(한자, rom, 사람들.length, 실을것.slice(0, 2).map((p) => p.name))} | K Culture Wire</title>
<meta name="description" content="The ${사람달수(사람들)} Korean actors and singers born on a ${한자} (${rom}) day, including ${벗기기(이름셋)}. A count, not a reading.">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `Korean stars born on a ${한자} (${rom}) day`,
  description: `The ${사람달수(사람들)} Korean actors and singers born on a ${한자} (${rom}) day. A count, not a reading.`,
  url: `https://www.kculturewire.com/stem/${rom.toLowerCase()}`,
  isPartOf: { '@type': 'WebSite', name: 'K Culture Wire', url: 'https://www.kculturewire.com' },
  creator: { '@type': 'Organization', name: 'K Culture Wire' },
  isBasedOn: ['https://www.wikidata.org'],
})}</script>
<style>
  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --card:#fff; --accent:#b4472a; --accent-soft:#fdf3f0; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --card:#181b21; --accent:#e8825f; --accent-soft:#261915; } }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
  .wrap{max-width:860px;margin:0 auto;padding:2rem 1.1rem 4rem}
  h1{font-size:1.5rem;line-height:1.3;margin:.2rem 0 .6rem;letter-spacing:-.01em}
  .kicker{color:var(--accent);font-weight:700;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;margin:0}
  .warn{border:1px solid var(--accent);border-radius:6px;padding:.7rem 1rem;background:var(--accent-soft);margin:1.2rem 0}
  .warn p{margin:.35rem 0;font-size:.9rem}
  table{border-collapse:collapse;width:100%;font-size:.93rem}
  th,td{text-align:left;padding:.42rem .5rem;border-bottom:1px solid var(--line)}
  th{font-size:.78rem;color:var(--ink-2);text-transform:uppercase;letter-spacing:.05em}
  .reads{margin-top:36px;padding-top:16px;border-top:1px solid var(--line)}
  .reads h2{font-size:1.05rem;margin:0 0 .4rem}
  .read{margin:0;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px;max-width:64ch}
  .read:last-of-type{border-bottom:none}
  .fine{color:var(--ink-2);font-size:.86rem}
  .scroll{overflow-x:auto}
  nav a{color:var(--accent);font-weight:600;margin-right:.8rem}
  footer{margin-top:2.4rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--ink-2);font-size:.85rem}
</style>
</head>
<body>
<div class="wrap">
  <p class="kicker">K Culture Wire &middot; day stem</p>
  <h1>${이름앞머리(실을것)}${한자} (${rom}) day stem &mdash; ${사람들.length} Korean entertainers in all</h1>
  <p>${벗기기(이름셋)} and ${실을것.length - 3} others. Ordered by how many Wikipedia editions carry an article about them, so the name you are most likely to know comes first.</p>
  ${안실은수 ? `<p class="fine"><strong>${안실은수} of these ${사람들.length} people are counted but not listed.</strong> Wikidata holds no English name for them, only a Korean one. This is an English-language site, so putting a name our readers cannot read next to a date would help nobody &mdash; but dropping them from the count would be worse. They are inside every figure on this page and in <a href="/day-pillar">the totals</a>.</p>` : ''}

  <div class="warn">
    <p><strong>This is a count, not a reading.</strong> A day stem is one character of the four pillars, and the hour pillar cannot be built for anyone here: public records carry birth dates and almost never birth hours.</p>
    <p>Across all ${잼.measured.toLocaleString('en-US')} people we counted, the spread over the ten stems came out at chi-square ${잼.all.chiSquareDayStem.카이제곱} against a 0.05 threshold of ${잼.thresholds['9']}. It crossed by a hair, we tried four ways to kill it, and we do not call it a finding. <a href="/day-pillar">The tests are here</a>.</p>
    <p>Nothing on this page says what a ${한자} day means for anyone.</p>
  </div>

  <div class="scroll">
  <table>
    <thead><tr><th>Name</th><th>Born</th><th>Day pillar</th><th>Wikipedia editions</th></tr></thead>
    <tbody>
${줄}
    </tbody>
  </table>
  </div>

  ${읽을것칸(이지면기사(기사들, 칸주소(rom)))}
  ${꼬리말([
      '<a href="/day-pillar">All ten stems, counted</a> &middot; '
        + '<a href="/star-signs">The same test on birth years</a> &middot; '
        + '<a href="/community">The twelve birth-year rooms</a>',
    ])}
    <footer>
    <p>Source: Wikidata (date of birth, best-ranked, day precision; South Korean citizenship; entertainment occupation), CC0. Day pillars from our own sixty-cycle table, anchored on 1900-01-01 = 甲戌.</p>
  </footer>
</div>
</body>
</html>
`;
}

/** 「N명」을 영문 지면에 쓸 수로 — 세 자리 쉼표 */
export const 사람달수 = (사람들) => 사람들.length.toLocaleString('en-US');

/** 열 장으로 가는 문 한 덩어리 — `/day-pillar` 에 넣는다 */
export function 문덩어리(칸) {
  const 줄 = 간.map(([h, r]) => {
    const v = 칸.get(h) ?? [];
    const 이름 = v.slice(0, 2).map((p) => p.name).join(', ');
    return `      <li><a href="${칸주소(r)}">${h} ${r}</a> &mdash; ${v.length} names${이름 ? `, including ${이름}` : ''}</li>`;
  }).join('\n');
  return `  <section>
    <h2>The ten stems, with every name in them</h2>
    <p>
      The table above is the count. If you want the names, they are split into ten pages, one per
      day stem, ordered by how widely each person is written about.
    </p>
    <ul>
${줄}
    </ul>
    <p class="note">
      <strong>A page name is not a reading.</strong> The pages exist because a list of 9,249 names
      is not a page anyone finishes and ten pages of about nine hundred are.
    </p>
  </section>
`;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 사람 = [
    { q: 'Q1', name: 'IU', born: '1993-05-16', sitelinks: 90 },
    { q: 'Q2', name: 'Jungkook', born: '1997-09-01', sitelinks: 80 },
    { q: 'Q3', name: 'Karina', born: '2000-04-11', sitelinks: 30 },
  ];
  const 칸 = 칸나누기(사람);
  검('열 칸을 다 만든다', 칸.size === 10);
  검('아이유는 丁 칸', 칸.get('丁')[0].name === 'IU');
  검('정국은 丙 칸', 칸.get('丙')[0].name === 'Jungkook');
  검('카리나는 己 칸', 칸.get('己')[0].name === 'Karina');
  검('빈 칸도 배열로 둔다 — undefined 로 안 둔다', Array.isArray(칸.get('甲')));
  검('주소는 로마자 소문자', 칸주소('gyeong') === '/stem/gyeong');

  const 잼 = { measured: 9249, thresholds: { 9: 16.92 }, all: { chiSquareDayStem: { 카이제곱: 17.91 } } };
  const h = 방짓기('丁', 칸.get('丁'), 잼);
  검('canonical 이 있다', h.includes('rel="canonical" href="https://www.kculturewire.com/stem/jeong"'));
  검('이름이 지면에 있다', h.includes('IU'));
  검('«발견이 아니다»를 지면에 적는다', h.includes('we do not call it a finding'));
  검('나가는 문이 있다', h.includes('href="/day-pillar"'));
  /**
   * 🔴 [2026-09-05 00:5x] 이 시험이 «오래» 빨강이었다. 그런데 지면이 틀린 것이 아니다 —
   *   걸린 우리말은 「세종」 하나이고, 통신판매업 신고번호 2026-세종-0591 이다.
   *   법으로 그대로 적어야 하는 번호다.
   * ⚠ **오늘 같은 뿌리를 세 번째로 만났다** —
   *   check-kcw-korean-leak.mjs (2,795/2,796 빨강) · build-kcw-week-pages.mjs · 그리고 이것.
   *   앞의 둘은 고쳤는데 이 자는 그 고침을 못 받고 있었다.
   * ⭐ 강령 ⑤ 그대로다 — 「하나를 고치면 인용한 곳까지 따라간다」.
   *   ⛔ 그러니 다음에 이런 것을 고치면 **결함에 이름을 붙이고 저장소를 훑는다.**
   */
  const 뜻없는우리말 = (글) => [...new Set((String(글 ?? '')
    .replace(/[0-9]{4}-세종-[0-9]{4}/g, '').match(/[가-힣]+/g) ?? []))];
  검(`⛔ 화면에 뜻 없는 우리말이 없다 (걸린 것: ${뜻없는우리말(h).join(',') || '없음'})`,
    뜻없는우리말(h).length === 0);
  /* ⛔ 예외를 넣으면 다 통과하게 될 위험이 있다 — 자가 정말 도는지 재 둔다 */
  검('뜻 없는 우리말은 그대로 잡는다', 뜻없는우리말('<p>손님</p>').join(',') === '손님');
  검('신고번호의 세종은 빼고 본다', 뜻없는우리말('licence 2026-세종-0591').length === 0);
  검('문덩어리에 열 줄이 있다', (문덩어리(칸).match(/href="\/stem\//g) ?? []).length === 10);
  /* 🔴 영어 지면에 한글이 나가면 손님이 거기서 끝난다 — 셈에는 넣고 목록에서만 뺀다 */
  const 한글든것 = [{ name: '홍길동', born: '1993-05-16', sitelinks: 1, dayPillar: '丁酉' },
    { name: 'IU', born: '1993-05-16', sitelinks: 9, dayPillar: '丁酉' }];
  const h2 = 방짓기('丁', 한글든것, 잼);
  검('라틴 이름만 가른다', 라틴이름('Go Youn-jung') && !라틴이름('고윤정'));
  검('한글 이름을 목록에 안 싣는다', !h2.includes('홍길동'));
  검('안 실은 수를 지면에 적는다', h2.includes('counted but not listed'));
  검('⛔ 셈에서는 안 뺀다 — 전체 수를 그대로 적는다', h2.includes('of these 2 people'));

  /* 🔴 열 장이 다 같은 꼴이고 이름이 하나도 없던 자리 */
  검('h1 앞머리를 만든다',
    이름앞머리([{ name: 'ROSÉ' }, { name: 'Jisoo' }]) === 'ROSÉ and Jisoo share the ');
  검('이름앞머리가 빈 값이면 빈 글자다', 이름앞머리([]) === '');
  검('제목에 사람 이름이 앞에 온다',
    칸제목('甲', 'gap', 949, ['ROSÉ', 'Jisoo'])
      === 'ROSÉ and Jisoo share the 甲 (gap) day stem, 949 in all');
  검('60자를 넘으면 짧은 꼴로 물러난다',
    칸제목('甲', 'gap', 949, ['Kim Seok-jin', 'Park Ji-hyeon']).length <= 60);
  검('이름이 없으면 옛 꼴로 돌아간다',
    칸제목('甲', 'gap', 949, []) === '甲 (gap) day stem — 949 Korean entertainers');
  검('이름이 하나면 그 하나로 짓는다',
    칸제목('甲', 'gap', 949, ['Jisoo']).startsWith('Jisoo share'));
  검('⛔ 감명으로 읽히는 말을 쓰지 않는다',
    !/means|says|reveals|personality|luck/i.test(칸제목('甲', 'gap', 949, ['ROSÉ', 'Jisoo'])));

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ build-kcw-stem-rooms 자가시험 통과 (21)');
  process.exit(0);
}

if (!fs.existsSync(원자료)) {
  console.error(`❌ 캔 명단이 없다 — ${path.relative(뿌리, 원자료)}\n   먼저 node scripts/collect-star-daypillar.mjs 를 돌린다. 없는 것을 지어내지 않는다`);
  process.exit(1);
}
const 사람들 = JSON.parse(fs.readFileSync(원자료, 'utf8')).사람;
const 잼 = JSON.parse(fs.readFileSync(잰것, 'utf8'));
const 칸 = 칸나누기(사람들);
const 기사 = 기사읽기();

fs.mkdirSync(낼방, { recursive: true });
let 합 = 0;
for (const [한자, rom] of 간) {
  const v = 칸.get(한자);
  if (!v.length) { console.error(`⛔ ${한자} 칸이 비었다 — 짓지 않는다`); process.exit(1); }
  fs.writeFileSync(path.join(낼방, `${rom}.html`), 방짓기(한자, v, 잼, 사람이름표들, 기사));
  합 += v.length;
  console.log(`   ${칸주소(rom).padEnd(14)} 이름 ${String(v.length).padStart(4)}  (으뜸 ${v[0].name})`);
}
fs.writeFileSync(path.join(뿌리, 'src/data/wikitip-stem-rooms.json'), JSON.stringify({
  generated: new Date().toISOString(),
  measured: 사람들.length,
  /* ⚠ top 은 `/day-pillar`(영문 지면)에 그대로 찍힌다 — **라틴 이름만** 넣는다.
     오늘은 우연히 열 칸 다 라틴이었지만, 자료가 바뀌면 한글이 새어 나갈 자리다 */
  rooms: 간.map(([h, r]) => ({
    stem: h, slug: r, url: 칸주소(r), people: 칸.get(h).length,
    top: 칸.get(h).filter((p) => 라틴이름(p.name)).slice(0, 3).map((p) => p.name),
  })),
}, null, 1));
console.log(`\n방 ${간.length}장 · 이름 합계 ${합}`);
console.log(`⚠ 들어오는 문을 아직 안 냈다 — /day-pillar 에 넣을 덩어리는 문덩어리() 로 뽑아 쓴다`);
