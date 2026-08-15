/**
 * collect-sea-title-waves.mjs — **작품 하나가 만드는 파도**, 동남아 네 판 48달.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 92편 자료를 재다가 갈래 평균이 뒤집히는 것을 봤다 —
 * 「Screen」 묶음이 **평균 +88.7% · 중앙값 −29.1%** 였다. 문서 하나가 끌고 있었다.
 *
 * 그 하나를 열어 보니 이렇다(백만분율, 네 판 합):
 * ```
 * Squid Game   2024-11  130  →  2025-01  2046  →  2026-06  83
 * ```
 * ⭐ **스물다섯 배**다. 그리고 그 파도가 「한국 영상에 대한 관심」의 대부분이었다.
 *
 * ⭐⭐ 그래서 묻는다 — **파도가 지나간 뒤, 바닥은 전보다 높은가.**
 *   높으면 작품 하나가 관심의 바닥을 올린 것이고,
 *   같으면 파도는 왔다 갈 뿐 아무것도 남기지 않은 것이다.
 *   ⚠ 이건 K컬처 산업이 실제로 궁금해할 물음이다. 우리가 잴 수 있다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **48 달을 받는다.** 봉우리 앞뒤로 바닥을 보려면 25 달로는 짧다.
 * ⛔ **덜 찬 마지막 달을 셈에서 뺀다.** 8/15 에 2026-07 이 평소의 백분의 이로 왔다.
 *    그대로 두면 모든 작품이 「지금 바닥」에서 무너진 것으로 나온다.
 * ⛔ 봉우리가 창 끝이나 시작에 붙어 있으면 **못 잰다고 적는다.** 한쪽만으로 견주지 않는다.
 * ⛔ 못 받은 칸을 0 으로 세지 않는다. `redirects=1` 을 넣는다. 429 에 죽지 않는다.
 * ⛔ 이 파일을 import 해도 아무 일도 일어나지 않는다.
 *
 * 쓰는 법
 *   node scripts/collect-sea-title-waves.mjs
 *   node scripts/collect-sea-title-waves.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 판들 = ['id', 'vi', 'th', 'ms'];
export const 판이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
/**
 * ⭐ **72 달(여섯 해)을 받는다. 48 이 아니다.**
 *
 * 🔴 48 달로는 스무 편 중 **다섯 편**밖에 못 쟀다. 못 잰 까닭 중 넷이
 *   「봉우리가 창 **시작**에 붙었다」였다 — 2020~2022 년에 뜬 작품들이다.
 *   ⭐ 창을 앞으로 늘리면 그 넷의 앞바닥이 창 안에 들어온다.
 *
 * 🔴 그리고 더 큰 까닭이 있다. 잰 다섯 편의 봉우리가 **세 덩어리에 몰려 있었다**
 *   (2024-04 에 둘 · 2025-01·02 에 둘 · 2025-07). 그러면 우리가 잰 것이 작품인지
 *   그 몇 달인지 가를 수 없다. **창이 넓어지면 봉우리가 흩어진다.**
 *
 * ⚠ 위키미디어 per-article 은 2015-07 부터 있다. 72 달은 넉넉히 안쪽이다.
 */
export const 달수 = 72;

/** 봉우리 앞뒤로 바닥을 잴 달수. ⚠ 봉우리 달 자체와 그 둘레는 파도라 뺀다 */
export const 바닥달수 = 6;
export const 파도둘레 = 2;

/**
 * ⭐ 파도가 있었던 한국 작품. **드라마·영화·예능을 섞는다** — 한 갈래만 보면
 *   그 갈래의 버릇을 작품의 버릇으로 잘못 읽는다.
 * ⚠ 동남아 네 판에 문서가 있을 만한 것으로 골랐다. 없는 판은 없는 대로 적는다.
 * ⛔ 「많이 본 것」이 아니라 **「파도가 있었을 법한 것」**으로 골랐다. 그 편향을 자료에 적는다.
 */
export const 작품들 = [
  'Squid Game', 'Parasite (2019 film)', 'Kingdom (South Korean TV series)',
  'Sweet Home (South Korean TV series)', 'All of Us Are Dead', 'Hellbound',
  'The Glory (TV series)', 'Extraordinary Attorney Woo', 'Alchemy of Souls',
  'Physical: 100', 'Crash Landing on You', 'Itaewon Class', 'Vincenzo (TV series)',
  'Queen of Tears', 'Moving (TV series)', 'Mask Girl', 'Train to Busan',
  'Oldboy (2003 film)', 'The8 Show', 'Culinary Class Wars',
  /**
   * ⭐ **2019~2023 년에 뜬 것을 더 넣는다.** 창을 72 달로 늘렸으니 이들의 봉우리가
   *   창 **가운데**에 온다 — 앞뒤로 바닥을 잴 수 있다.
   * ⭐⭐ 그리고 이것이 「봉우리가 몰렸다」는 유보를 푸는 길이다. 뜬 해가 흩어져 있으면
   *   봉우리도 흩어지고, 그때 비로소 **작품을 잰 것**이 된다.
   * ⚠ 여전히 「파도가 있었을 법한 것」으로 고른 것이다. 그 치우침은 그대로 남는다.
   */
  'Business Proposal (TV series)', 'Twenty-Five Twenty-One', 'Reborn Rich',
  'My Name (TV series)', 'The King: Eternal Monarch', 'Hotel del Luna',
  'Start-Up (South Korean TV series)', 'Mr. Sunshine (TV series)',
  'Descendants of the Sun', 'Goblin (TV series)', 'Signal (South Korean TV series)',
  'Burning (2018 film)', 'The Handmaiden', 'Minari (film)', 'Broker (2022 film)',
];

export const 못받음 = Symbol('못받음');

/** ⛔ redirects=1 — 빼면 넘겨주기 제목이 「그 판에 문서가 없다」로 나온다 */
export function 주소만들기(제목) {
  return 'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1'
    + `&prop=langlinks&lllimit=500&titles=${encodeURIComponent(제목)}`;
}

export const 달앞 = (m) => `${m.replace('-', '')}0100`;

/**
 * ⭐ **파도를 잰다.** 달값 표를 받아 봉우리와 그 앞뒤 바닥을 낸다.
 *
 * ⛔ 봉우리 앞이나 뒤에 바닥을 잴 달이 모자라면 **null 을 돌려준다.**
 *   한쪽만 보고 「올랐다/내렸다」를 말하지 않는다.
 * ⚠ 봉우리 둘레 `파도둘레` 달은 앞뒤 바닥에서 뺀다 — 그건 파도지 바닥이 아니다.
 */
export function 파도재기(달값, 옵션 = {}) {
  const 바닥 = 옵션.바닥달수 ?? 바닥달수;
  const 둘레 = 옵션.파도둘레 ?? 파도둘레;
  const 줄 = Object.entries(달값)
    .filter(([, v]) => v != null)
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (줄.length < 바닥 * 2 + 둘레 * 2 + 1) return null;

  let 봉 = 0;
  for (let i = 1; i < 줄.length; i += 1) if (줄[i][1] > 줄[봉][1]) 봉 = i;

  const 앞끝 = 봉 - 둘레;
  const 뒤처음 = 봉 + 둘레 + 1;
  if (앞끝 < 바닥 || 줄.length - 뒤처음 < 바닥) {
    return { peakMonth: 줄[봉][0], peak: 줄[봉][1], comparable: false,
      why: 앞끝 < 바닥 ? 'the peak sits too close to the start of the window'
        : 'the peak sits too close to the end of the window' };
  }
  const 평 = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const 앞칸 = 줄.slice(앞끝 - 바닥, 앞끝);
  const 뒤칸 = 줄.slice(뒤처음, 뒤처음 + 바닥);
  const 앞바닥 = 평(앞칸.map(([, v]) => v));
  const 뒤바닥 = 평(뒤칸.map(([, v]) => v));
  return {
    peakMonth: 줄[봉][0],
    peak: +줄[봉][1].toFixed(1),
    comparable: true,
    beforeFloor: +앞바닥.toFixed(1),
    afterFloor: +뒤바닥.toFixed(1),
    floorChangePc: 앞바닥 > 0 ? +((100 * (뒤바닥 - 앞바닥)) / 앞바닥).toFixed(1) : null,
    peakOverBeforeFloor: 앞바닥 > 0 ? +(줄[봉][1] / 앞바닥).toFixed(1) : null,
    monthsEachSide: 바닥,
    /* ⛔ 뒤바닥이 진짜 바닥인지 따로 잰다 — 아래를 보라 */
    afterIsFloor: 진짜바닥인가(뒤칸, 앞바닥),
    /* ⛔ 앞바닥이 얇으면 배수가 아무 뜻이 없다 — 「올랐다」에 넣지 않는다 */
    beforeFloorIsThin: 얇은가(앞바닥),
  };
}

/**
 * ⛔⛔ **뒤바닥이 바닥이 아닐 수 있다.**
 *
 * 🔴 8/15 — 일곱 작품 중 오징어게임 하나만 파도 뒤 바닥이 올랐다(+366%). 그것만 보고
 *   「큰 파도는 바닥을 올린다」로 쓸 뻔했다. 뒤바닥 여섯 달을 열어 보니 이랬다:
 * ```
 *   2025-04  211 · 05  144 · 06  386 · 07  617 · 08  169 · 09  96
 * ```
 *   ⛔ 06·07 은 바닥이 아니라 **시즌 3 파도**다. 바닥이 오른 것이 아니라 **다음 파도가
 *     바닥 자리에 들어앉은 것**이다. 그걸 「남은 것」으로 세면 거짓이 된다.
 *
 * ⭐ 그래서 뒤바닥 안에 **앞바닥의 몇 배를 넘는 달**이 있으면 「바닥이 아니다」라고 적는다.
 * ⚠ 문턱은 우리가 정한 것이다. 그래서 걸린 달을 그대로 같이 낸다 — 사람이 보게.
 */
export const 또파도문턱 = 3;

/**
 * ⛔ **앞바닥이 너무 얇으면 배수를 말하지 않는다.**
 *
 * `Physical: 100` 은 앞바닥이 백만분율 **1.3** 이고 뒤바닥이 2.4 다. +82.7% 로 나오지만
 * 거의 0 에서 거의 0 으로 간 것이다. ⚠ 작은 분모는 **아무 수나 크게 만든다.**
 * ⭐ 그래서 얇은 것은 「올랐다」에 넣지 않고 **얇다고 적는다.**
 */
export const 얇음문턱 = 10;

export function 얇은가(앞바닥, 문턱 = 얇음문턱) {
  return !(앞바닥 >= 문턱);
}

export function 진짜바닥인가(뒤칸, 앞바닥, 문턱 = 또파도문턱) {
  if (!(앞바닥 > 0)) return { isFloor: null, why: 'the floor before the peak was zero' };
  const 튄달 = 뒤칸.filter(([, v]) => v > 앞바닥 * 문턱).map(([m, v]) => ({ month: m, value: +v.toFixed(1) }));
  if (!튄달.length) return { isFloor: true, monthsAboveThreshold: [] };
  return {
    isFloor: false,
    monthsAboveThreshold: 튄달,
    why: `${튄달.length} of the months we counted as the floor after the wave are themselves `
      + `more than ${문턱} times the floor before it. That is a second wave sitting in the `
      + 'window, not a floor, and the rise cannot be read as something the first wave left behind.',
  };
}

function 받기(url) {
  return new Promise((풀림, 깨짐) => {
    https.get(url, { headers: { 'User-Agent': 'kculturewire/1.0 (parkintaek2@gmail.com)' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); 깨짐(new Error(`HTTP ${res.statusCode}`)); return; }
      let 몸 = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { 몸 += d; });
      res.on('end', () => { try { 풀림(JSON.parse(몸)); } catch (e) { 깨짐(e); } });
    }).on('error', 깨짐);
  });
}

async function 세번해본다(url, 번수 = 4) {
  for (let n = 1; n <= 번수; n += 1) {
    try { return await 받기(url); } catch (e) {
      const 제한 = /HTTP 429|HTTP 5\d\d/.test(String(e.message));
      if (n === 번수) return 못받음;
      await new Promise((s) => setTimeout(s, 제한 ? 5000 * 2 ** (n - 1) : 2000 * n));
    }
  }
  return 못받음;
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('작품이 하나 이상이다', 작품들.length > 0);
  참('⛔ 작품 제목이 겹치지 않는다', new Set(작품들).size === 작품들.length);
  참('⛔ 빈 제목이 없다', 작품들.every((t) => t.trim().length > 0));
  참('넘겨주기를 따라간다', 주소만들기('Squid Game').includes('redirects=1'));
  참('⛔ & 가 주소를 자르지 못한다', 주소만들기('A & B').includes('%26'));
  참('못받음은 0 이 아니다', 못받음 !== 0 && typeof 못받음 === 'symbol');
  참('⭐ 48 달을 받는다 — 봉우리 앞뒤로 바닥이 있어야 한다', 달수 >= 바닥달수 * 2 + 파도둘레 * 2 + 1);

  /* ⭐ 파도 재기 — 가운데에 봉우리가 있는 스무 달 */
  const 표 = {};
  for (let i = 0; i < 20; i += 1) 표[`2024-${String(i + 1).padStart(2, '0')}`] = 10;
  표['2024-10'] = 500;                       /* 봉우리 — 열째 달 */
  /**
   * 🔴 처음엔 `i = 12` 부터 20 으로 채웠다가 검사가 걸렸다. 봉우리(열째)에서 둘레 1 을 두면
   *   뒤바닥은 **열두째 달부터** 시작한다. 열두째가 아직 10 이어서 뒤바닥이 16.7 로 나왔다.
   *   ⛔ **검사가 옳고 본보기가 틀렸다.** 이 자리는 오늘만 두 번째다.
   */
  for (let i = 11; i < 20; i += 1) 표[`2024-${String(i + 1).padStart(2, '0')}`] = 20;
  const r = 파도재기(표, { 바닥달수: 3, 파도둘레: 1 });
  참('봉우리 달을 찾는다', r.peakMonth === '2024-10');
  참('견줄 수 있다고 낸다', r.comparable === true);
  참('앞바닥을 낸다', r.beforeFloor === 10);
  참('뒤바닥을 낸다', r.afterFloor === 20);
  참('바닥이 얼마나 올랐는지 낸다', r.floorChangePc === 100);
  참('봉우리가 앞바닥의 몇 배인지 낸다', r.peakOverBeforeFloor === 50);

  /* ⛔ 봉우리가 끝에 붙으면 뒤바닥이 없다 — 한쪽만으로 말하지 않는다 */
  const 끝봉 = {};
  for (let i = 0; i < 12; i += 1) 끝봉[`2024-${String(i + 1).padStart(2, '0')}`] = 10;
  끝봉['2024-12'] = 900;
  const e = 파도재기(끝봉, { 바닥달수: 3, 파도둘레: 1 });
  참('⛔ 봉우리가 끝에 붙으면 못 잰다', e.comparable === false);
  참('왜 못 재는지 적는다', /end of the window/.test(e.why));

  /* ⛔ 봉우리가 시작에 붙으면 앞바닥이 없다 */
  const 앞봉 = {};
  for (let i = 0; i < 12; i += 1) 앞봉[`2024-${String(i + 1).padStart(2, '0')}`] = 10;
  앞봉['2024-01'] = 900;
  const s = 파도재기(앞봉, { 바닥달수: 3, 파도둘레: 1 });
  참('⛔ 봉우리가 시작에 붙어도 못 잰다', s.comparable === false);
  참('그때도 봉우리 달은 적는다', s.peakMonth === '2024-01');

  참('⛔ 달이 모자라면 null', 파도재기({ a: 1, b: 2 }) === null);

  /**
   * 🔴 **오늘 제일 크게 물릴 뻔한 자리.** 오징어게임의 「파도 뒤 바닥」 안에 시즌 3 파도가
   *   통째로 들어 있었다. 그것을 바닥으로 세면 「큰 파도는 바닥을 올린다」는 거짓이 나온다.
   */
  참('⭐ 조용한 뒤바닥은 진짜 바닥이다',
    진짜바닥인가([['a', 10], ['b', 12], ['c', 9]], 10).isFloor === true);
  참('⛔ 뒤바닥 안의 두 번째 파도를 잡는다',
    진짜바닥인가([['a', 10], ['b', 400], ['c', 9]], 10).isFloor === false);
  참('걸린 달을 그대로 낸다',
    진짜바닥인가([['a', 10], ['b', 400], ['c', 9]], 10).monthsAboveThreshold[0].month === 'b');
  참('⛔ 조금 높은 것은 파도로 안 본다 — 두 배까지는 둔다',
    진짜바닥인가([['a', 10], ['b', 20], ['c', 9]], 10).isFloor === true);
  /* ⛔ 작은 분모는 아무 수나 크게 만든다 — Physical: 100 은 1.3 에서 2.4 로 갔다 */
  참('⛔ 얇은 앞바닥을 얇다고 잡는다', 얇은가(1.3) === true);
  참('두꺼우면 안 잡는다', 얇은가(58) === false);
  참('문턱 값 자체는 얇지 않다', 얇은가(얇음문턱) === false);
  참('⛔ 앞바닥이 0 이면 판정하지 않는다',
    진짜바닥인가([['a', 10]], 0).isFloor === null);
  /* 파도재기가 그 판정을 달고 나오나 */
  const 두파도 = {};
  for (let i = 0; i < 20; i += 1) 두파도[`2024-${String(i + 1).padStart(2, '0')}`] = 10;
  두파도['2024-10'] = 500;
  두파도['2024-13'] = 300;                    /* 뒤바닥 자리에 두 번째 파도 */
  const t = 파도재기(두파도, { 바닥달수: 3, 파도둘레: 1 });
  참('⭐ 파도재기가 「뒤바닥이 바닥이 아니다」를 달고 나온다', t.afterIsFloor.isFloor === false);
  /* ⚠ 이 본보기의 앞바닥은 10 이라 문턱과 같다 — 얇지 않다. 경계를 그대로 잰다 */
  참('⛔ 파도재기가 얇음 여부를 달고 나온다', t.beforeFloorIsThin === false);
  참('⛔ 못 잰 달은 셈에서 빠진다',
    파도재기(Object.fromEntries([...Array(20)].map((_, i) => [`2024-${String(i + 1).padStart(2, '0')}`,
      i === 3 ? null : (i === 9 ? 500 : 10)])), { 바닥달수: 3, 파도둘레: 1 }) !== null);

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 끝달 = new Date();
  끝달.setMonth(끝달.getMonth() - 1);
  const 달목록 = Array.from({ length: 달수 }, (_, i) => {
    const d = new Date(끝달);
    d.setMonth(d.getMonth() - (달수 - 1 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const 밑값 = {};
  for (const p of 판들) {
    밑값[p] = {};
    const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/${p}.wikipedia/all-access/user`
      + `/monthly/${달앞(달목록[0])}/${달앞(달목록.at(-1))}`;
    const 몸 = await 세번해본다(u);
    if (몸 !== 못받음) {
      for (const it of 몸.items ?? []) {
        밑값[p][`${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}`] = it.views;
      }
    }
    await new Promise((s) => setTimeout(s, 400));
  }
  console.log(`판 밑값 — ${판들.map((p) => `${p}:${Object.keys(밑값[p]).length}달`).join(' · ')}`);

  const 제목표 = {};
  for (const 제목 of 작품들) {
    제목표[제목] = {};
    const 몸 = await 세번해본다(주소만들기(제목));
    if (몸 !== 못받음) {
      for (const 쪽 of Object.values(몸.query?.pages ?? {})) {
        for (const l of 쪽.langlinks ?? []) if (판들.includes(l.lang)) 제목표[제목][l.lang] = l['*'];
      }
    }
    await new Promise((s) => setTimeout(s, 300));
  }

  let 못잰것 = 0;
  const 자료 = [];
  for (const 제목 of 작품들) {
    const 줄 = { titleEn: 제목, titles: 제목표[제목], views: {} };
    for (const p of 판들) {
      const 판제목 = 제목표[제목][p];
      if (!판제목) continue;
      줄.views[p] = {};
      const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${p}.wikipedia/all-access/user`
        + `/${encodeURIComponent(판제목.replace(/ /g, '_'))}/monthly/${달앞(달목록[0])}/${달앞(달목록.at(-1))}`;
      const 몸 = await 세번해본다(u);
      if (몸 === 못받음) { 못잰것 += 1; continue; }
      for (const it of 몸.items ?? []) {
        줄.views[p][`${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}`] = it.views;
      }
      await new Promise((s) => setTimeout(s, 250));
    }
    자료.push(줄);
    console.log(`   ${제목.slice(0, 36).padEnd(36)} ${판들.map((p) => (줄.views[p] ? Object.keys(줄.views[p]).length : '—')).join('/')}`);
  }

  const 나감 = {
    generated: 오늘(),
    question: 'A Korean title arrives, the encyclopaedia fills up, and then it empties again. '
      + 'When the wave has passed, is the floor higher than it was before?',
    window: `${달목록[0]} through ${달목록.at(-1)}, ${달수} months`,
    months: 달목록,
    editionsSea: 판들,
    editionNames: 판이름,
    editionTotals: 밑값,
    unit: 'reads per million reads of that edition, summed across the four editions',
    titles: 작품들,
    articles: 자료,
    unfetched: 못잰것,
    floorMonths: 바닥달수,
    waveMonths: 파도둘레,
    /** ⚠ 고른 방식이 답을 만들 수 있다. 그 말을 자료에 박는다 */
    howTitlesWereChosen: 'These are Korean titles we expected to have had a wave, not the most '
      + 'read Korean titles and not a random sample. A title with no wave would not test the '
      + 'question, but choosing this way means the set is tilted toward titles that travelled.',
    lastMonthWarning: 'Wikimedia monthly totals can still be filling for the most recent month. '
      + 'Anything reading this file should check the last month against the ones before it.',
  };
  const 낼곳 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-title-waves.json');
  fs.mkdirSync(path.dirname(낼곳), { recursive: true });
  fs.writeFileSync(낼곳, `${JSON.stringify(나감, null, 2)}\n`);
  console.log(`\n✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   작품 ${자료.length} · 달 ${달수} (${달목록[0]} ~ ${달목록.at(-1)}) · 못 잰 칸 ${못잰것}`);
}
