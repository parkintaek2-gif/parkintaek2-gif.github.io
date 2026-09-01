#!/usr/bin/env node
/**
 * build-kcw-breakout-transfer.mjs — **급등한 한국 작품이 배우에게 얼마나 옮겨 가나.**
 *   → `src/data/kcw-breakout-transfer.json`
 *
 * ── 무엇을 재나 ──────────────────────────────────────────────
 * 작품마다 ① 영문 위키백과에서 «가장 많이 읽힌 하루»를 찾고
 *          ② 그날 «출연진 전원»의 열람수를 재서 ③ 가장 많이 읽힌 사람의 몫을 낸다.
 *
 * ⭐ 「주연」을 **내가 고르지 않는다.** 2026-09-01 에 손으로 골랐다가 12편 중 2편이 틀렸다 —
 *   헬바운드의 최다 열람은 유아인이 아니라 **김현주**, 고요의 바다는 배두나가 아니라 **공유**였다.
 *   ⇒ 재서 뽑으면 내 짐작이 안 섞인다.
 *
 * ⛔ 못 잰 사람을 0 으로 안 쓴다 — `못잰사람` 으로 따로 센다.
 * ⛔ 이 12편은 «급등한 줄 아는» 것을 내가 고른 것이다. 무작위 표본이 아니다. 그 말을 자료에 적는다.
 * ⚠ 위키미디어 per-article 은 «묶음 수»로 막는다(2026-09-01 실측: 40건 통과·200건 중 156 막힘).
 *   그래서 요청 사이를 띄우고, 막히기 시작하면 그 자리에서 멈추고 「끝까지 못 쟀다」로 적는다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-breakout-transfer.mjs --자가시험
 *   node scripts/build-kcw-breakout-transfer.mjs
 */
import fs from 'node:fs';

export const UA = 'KCultureWire/1.0 (https://www.kculturewire.com; u5@klifedesign.net)';
export const 멈출막힘수 = 10;
export const 쉬는밀리 = 600;

/** 급등한 줄 아는 12편 — ⛔ 무작위 표본이 아니다 */
export const 판 = [
  { 슬러그: 'Kingdom_(South_Korean_TV_series)', 이름: 'Kingdom', 창: ['20190101', '20190430'] },
  { 슬러그: 'Crash_Landing_on_You', 이름: 'Crash Landing on You', 창: ['20191201', '20200331'] },
  { 슬러그: 'Itaewon_Class', 이름: 'Itaewon Class', 창: ['20200101', '20200430'] },
  { 슬러그: 'Parasite_(2019_film)', 이름: 'Parasite', 창: ['20200101', '20200331'] },
  { 슬러그: 'Sweet_Home_(TV_series)', 이름: 'Sweet Home', 창: ['20201201', '20210228'] },
  { 슬러그: 'Squid_Game', 이름: 'Squid Game', 창: ['20210901', '20211130'] },
  { 슬러그: 'Hellbound_(TV_series)', 이름: 'Hellbound', 창: ['20211101', '20220131'] },
  { 슬러그: 'The_Silent_Sea_(TV_series)', 이름: 'The Silent Sea', 창: ['20211201', '20220228'] },
  { 슬러그: 'All_of_Us_Are_Dead', 이름: 'All of Us Are Dead', 창: ['20220101', '20220331'] },
  { 슬러그: 'Extraordinary_Attorney_Woo', 이름: 'Extraordinary Attorney Woo', 창: ['20220601', '20220930'] },
  { 슬러그: 'The_Glory_(TV_series)', 이름: 'The Glory', 창: ['20221201', '20230331'] },
  { 슬러그: 'Mousetrap_(TV_series)', 이름: 'Mousetrap', 창: ['20260801', '20260830'] },
];

const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/** 이름을 슬러그에서 만든다 — 라벨 조회가 «비어» 오는 일이 있다(2026-09-01 실측, 터졌다) */
export const 이름으로 = (슬) => decodeURIComponent(슬).replace(/_/g, ' ').replace(/\s*\([^)]*\)\s*$/, '');

/**
 * 🔴 몫이 100%를 넘으면 «발견»이 아니라 자의 결함이다.
 *   2026-09-01 에 고요의 바다를 `The_Silent_Sea`(엉뚱한 문서, 788회)로 재서 **1485.5%** 가 나왔다.
 *   맞는 문서는 `The_Silent_Sea_(TV_series)`(59,760회)였다.
 */
export const 믿을만한가 = (몫) => Number.isFinite(몫) && 몫 > 0 && 몫 <= 100;

export function 상관(X, Y) {
  const n = X.length;
  if (n < 3) return null;
  const mx = X.reduce((a, b) => a + b) / n;
  const my = Y.reduce((a, b) => a + b) / n;
  const cov = X.map((x, i) => (x - mx) * (Y[i] - my)).reduce((a, b) => a + b);
  const sx = Math.sqrt(X.map((x) => (x - mx) ** 2).reduce((a, b) => a + b));
  const sy = Math.sqrt(Y.map((y) => (y - my) ** 2).reduce((a, b) => a + b));
  if (!sx || !sy) return null;
  const r = cov / (sx * sy);
  return { r, n, t: r * Math.sqrt((n - 2) / (1 - r * r)), 자유도: n - 2 };
}

/* ── 자가시험 ───────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = []; let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  검('① 12편이다', 판.length === 12);
  검('① 슬러그가 겹치지 않는다', new Set(판.map((x) => x.슬러그)).size === 12);
  검('① 창이 모두 시작<끝', 판.every((x) => x.창[0] < x.창[1]));

  // ② 🔴 몫이 100%를 넘으면 버린다 — 위 「믿을만한가」 주석의 1485.5% 사건
  검('② 1485.5% 는 버린다', 믿을만한가(1485.5) === false);
  검('② 0% 도 버린다', 믿을만한가(0) === false);
  검('② 34.2% 는 쓴다', 믿을만한가(34.2) === true);
  검('② 100% 는 쓴다', 믿을만한가(100) === true);
  검('② 숫자가 아니면 버린다', 믿을만한가(null) === false && 믿을만한가(NaN) === false);

  // ③ 이름 만들기 — 괄호를 뗀다
  검('③ 괄호를 뗀다', 이름으로('Mousetrap_(TV_series)') === 'Mousetrap');
  검('③ 밑줄을 뗀다', 이름으로('Song_Kang') === 'Song Kang');
  검('③ 쉼표는 남긴다', 이름으로('Four_Hands,_Two_Sonatas') === 'Four Hands, Two Sonatas');

  // ④ 상관 — 아는 값으로
  const c = 상관([1, 2, 3, 4], [4, 3, 2, 1]);
  검('④ 완전 역상관은 -1', c !== null && Math.abs(c.r + 1) < 1e-9);
  검('④ 셋 미만이면 null', 상관([1, 2], [1, 2]) === null);
  검('④ 자유도가 n-2', c !== null && c.자유도 === 2);
  검('④ 한쪽이 다 같으면 null', 상관([1, 1, 1], [1, 2, 3]) === null);

  console.log(실패.length
    ? `⛔ ${센것}개 중 ${실패.length}개 실패\n   ${실패.join('\n   ')}`
    : `✅ 자가시험 ${센것}개 다 통과`);
  process.exit(실패.length ? 1 : 0);
}

/* ── 돌리기 ─────────────────────────────────────────────────── */
let 막힘 = 0;
const 자 = async (슬, a, b) => {
  const 주소 = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(슬)}/daily/${a}/${b}`;
  const r = await fetch(주소, { headers: { 'user-agent': UA } });
  if (r.status === 429) { 막힘 += 1; return 'BLOCK'; }
  if (!r.ok) return null;
  return (await r.json()).items;
};

const 출연받기 = async (슬) => {
  const Q = `SELECT ?castArticle WHERE { <https://en.wikipedia.org/wiki/${encodeURI(슬)}> schema:about ?item. ?item wdt:P161 ?c. ?castArticle schema:about ?c; schema:isPartOf <https://en.wikipedia.org/>. }`;
  const r = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded', accept: 'application/sparql-results+json' },
    body: `query=${encodeURIComponent(Q)}`,
  });
  if (!r.ok) return null;
  return (await r.json()).results.bindings.map((b) => decodeURIComponent(b.castArticle.value.split('/wiki/')[1]));
};

const 줄 = []; const 못한것 = [];
for (const p of 판) {
  if (막힘 >= 멈출막힘수) { 못한것.push(`${p.이름}(막혀서 끝까지 못 쟀다)`); continue; }
  const it = await 자(p.슬러그, ...p.창); await 쉼(쉬는밀리);
  if (!it || it === 'BLOCK') { 못한것.push(`${p.이름}(작품 열람 자료 없음)`); continue; }
  const 최고 = it.reduce((x, y) => (y.views > x.views ? y : x), { views: 0, timestamp: '' });
  const 날 = 최고.timestamp.slice(0, 8);
  const 출연 = await 출연받기(p.슬러그);
  if (!출연 || !출연.length) { 못한것.push(`${p.이름}(출연 목록 없음)`); continue; }
  let 으뜸 = null; let 으뜸값 = 0; let 잰사람 = 0; let 못잰사람 = 0;
  for (const c of 출연) {
    const ci = await 자(c, ...p.창); await 쉼(쉬는밀리);
    if (!ci || ci === 'BLOCK') { 못잰사람 += 1; continue; }
    const v = ci.find((x) => x.timestamp.slice(0, 8) === 날)?.views;
    if (v == null) { 못잰사람 += 1; continue; }
    잰사람 += 1;
    if (v > 으뜸값) { 으뜸값 = v; 으뜸 = c; }
  }
  if (!으뜸) { 못한것.push(`${p.이름}(출연 아무도 못 쟀다)`); continue; }
  const 몫 = (으뜸값 / 최고.views) * 100;
  if (!믿을만한가(몫)) { 못한것.push(`${p.이름}(몫 ${몫.toFixed(0)}% — 문서가 잘못 짝지어졌다)`); continue; }
  줄.push({
    작품: p.이름,
    슬러그: p.슬러그,
    최고일: 날,
    작품최고: 최고.views,
    으뜸: 이름으로(으뜸),
    으뜸슬러그: 으뜸,
    으뜸값,
    몫: Number(몫.toFixed(1)),
    잰사람,
    못잰사람,
  });
  console.log(`${String(최고.views).padStart(8)} ${String(으뜸값).padStart(8)}  ${몫.toFixed(1).padStart(5)}%  ${p.이름} / ${이름으로(으뜸)}`);
}

줄.sort((a, b) => b.작품최고 - a.작품최고);
const c = 상관(줄.map((x) => Math.log10(x.작품최고)), 줄.map((x) => x.몫));
const 결과 = {
  만든때: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }),
  잰것: '영문 위키백과 per-article, all-access, user only',
  '⛔표본이아니다': '이 12편은 급등한 줄 아는 것을 우리가 고른 것이다. 한국 작품의 무작위 표본이 아니며, 이 안에서 나온 관계가 밖으로 그대로 가지 않는다.',
  '⭐주연을고르지않았다': '작품 최고일에 출연진 전원을 재서 가장 많이 읽힌 사람을 썼다. 손으로 고르면 틀린다 — 12편 중 2편이 그랬다(헬바운드=김현주, 고요의 바다=공유).',
  '⚠같은날끼리견준다': '작품 최고일과 «같은 날»의 출연진 값이다. 배우는 하루이틀 뒤에 정점이 오는 일이 많아, 이 몫은 결국 옮겨간 양의 «바닥값»이다.',
  줄,
  못한것,
  막힘,
  상관: c,
};
fs.writeFileSync('src/data/kcw-breakout-transfer.json', JSON.stringify(결과, null, 1));
console.log(`\n잰 것 ${줄.length}편 · ⬜ 못 한 것 ${못한것.length}편 · 막힘 ${막힘}건`);
for (const x of 못한것) console.log(`   ⬜ ${x}`);
if (c) console.log(`r = ${c.r.toFixed(3)} · n = ${c.n} · t = ${c.t.toFixed(2)} · 자유도 ${c.자유도}`);
console.log('→ src/data/kcw-breakout-transfer.json');
