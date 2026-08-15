/**
 * collect-sea-trip-control.mjs — **대조군.** 한국 여행 문서가 줄어든 것이
 * 「한국 얘기」인지 「여행 문서 전반의 얘기」인지 가른다.
 *
 * ── 왜 이 자가 필요한가 ────────────────────────────────────────
 * 91편을 재다가 이런 수를 얻었다 — 동남아 네 판에서 **한국 여행 문서 조회가
 * 열두 달 사이 24~42% 줄었다.** 같은 창에서 아시아 노선 여객은 -0.7% 였다.
 *
 * 🔴 그대로 쓰면 「한국에 대한 관심이 식었다」가 된다. **그것이 거짓일 수 있다.**
 *   백과사전 조회는 지금 세계적으로 줄고 있다. 여행 문서는 특히 그렇다 —
 *   비자·환승·교통카드처럼 **답이 정해진 물음**은 백과사전 밖에서 답을 얻는다.
 *   ⛔ 그러면 우리가 잰 것은 한국이 아니라 **사람들이 답을 찾는 자리**의 변화다.
 *
 * ⭐ 가르는 법은 하나뿐이다 — **같은 판에서, 같은 창으로, 같은 종류의 문서**를
 *   다른 나라로 한 벌 더 잰다. 한국만 줄었으면 한국 얘기고,
 *   나란히 줄었으면 **한국 얘기가 아니다.**
 *
 * ── ⛔ 대조군을 고른 잣대 ─────────────────────────────────────
 * ⛔ 자기 나라를 대조군으로 두지 않는다. 태국판에서 「태국 여행」은 성격이 다르다.
 *    그래서 일본·대만이다 — **네 판 모두에게 외국**이고, 한국과 같은 동북아 여행지다.
 * ⭐ 짝을 지어 잰다. 「공항 ↔ 공항」·「고속철 ↔ 고속철」·「교통카드 ↔ 교통카드」.
 *    종류가 다른 문서를 섞으면 줄어든 까닭이 종류 탓인지 나라 탓인지 또 모른다.
 * ⚠ 짝이 없는 것은 짝이 없다고 적는다. 억지로 맞추지 않는다.
 *
 * ── ⛔ 앞의 자에서 배운 것을 그대로 지킨다 ─────────────────────
 * ⛔ 못 받은 칸을 0 으로 세지 않는다. null 로 두고 셈에서 뺀다.
 * ⛔ `redirects=1` 을 반드시 넣는다 — 빼면 넘겨주기 제목이 「그 판에 문서가 없다」로 나온다.
 * ⛔ 429 에 죽지 않는다. 물러섰다 다시 묻고, 끝내 못 받으면 못 받았다고 남긴다.
 *
 * 쓰는 법
 *   node scripts/collect-sea-trip-control.mjs
 *   node scripts/collect-sea-trip-control.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';
import { 판들, 판이름, 달수 } from './collect-sea-trip-lookups.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ⭐ **짝.** 왼쪽이 한국, 오른쪽이 대조군이다. 같은 종류끼리 붙였다.
 *
 * ⚠ 「홍대」와 「명동」은 한 나라 안에서도 성격이 달라 대조군을 하나씩만 붙였다.
 * ⚠ 대만은 문서 수가 적다. 적으면 적은 대로 적고, 없는 짝은 비운다.
 */
export const 짝들 = [
  /* ── 축 ①: 여행. 「가려고 알아보는」 문서다 ───────────────── */
  { 축: 'trip', 종류: 'Country tourism', 한: 'Tourism in South Korea', 대: ['Tourism in Japan', 'Tourism in Taiwan'] },
  { 축: 'trip', 종류: 'Visa policy', 한: 'Visa policy of South Korea', 대: ['Visa policy of Japan', 'Visa policy of Taiwan'] },
  { 축: 'trip', 종류: 'Main airport', 한: 'Incheon International Airport', 대: ['Narita International Airport', 'Taiwan Taoyuan International Airport'] },
  { 축: 'trip', 종류: 'High-speed rail', 한: 'Korea Train Express', 대: ['Shinkansen', 'Taiwan High Speed Rail'] },
  { 축: 'trip', 종류: 'Capital subway', 한: 'Seoul Metropolitan Subway', 대: ['Tokyo Metro', 'Taipei Metro'] },
  { 축: 'trip', 종류: 'Transit card', 한: 'T-money', 대: ['Suica', 'EasyCard'] },
  { 축: 'trip', 종류: 'National cuisine', 한: 'Korean cuisine', 대: ['Japanese cuisine', 'Taiwanese cuisine'] },
  { 축: 'trip', 종류: 'Shopping district', 한: 'Myeongdong', 대: ['Shibuya', 'Ximending'] },
  { 축: 'trip', 종류: 'Nightlife district', 한: 'Hongdae, Seoul', 대: ['Shinjuku'] },
  { 축: 'trip', 종류: 'Resort island', 한: 'Jeju Island', 대: ['Okinawa Island', 'Penghu'] },

  /**
   * ── 축 ②: 문화. **이 축이 답을 가른다** ─────────────────────
   *
   * ⭐ 여행 문서가 줄어든 것이 「한국에 대한 관심이 식어서」인지,
   *   「여행 정보를 백과사전에서 안 찾게 돼서」인지는 여행 문서만 봐서는 못 가른다.
   *   같은 판·같은 창에서 **한국 문화 문서**를 보면 갈린다 —
   *     문화가 안 줄었으면 식은 것이 아니라 **찾는 자리**가 바뀐 것이다.
   *     문화도 같이 줄었으면 그때는 관심 쪽을 의심할 자리가 생긴다.
   * ⚠ 백만분율은 판 전체 조회로 나눈 값이다. 그러니 「백과사전 전체가 준다」는
   *   이미 빠져 있다. 여기서 줄었다면 **판 안에서 몫이 준 것**이다.
   */
  { 축: 'culture', 종류: 'The country itself', 한: 'South Korea', 대: ['Japan', 'Taiwan'] },
  { 축: 'culture', 종류: 'Pop music', 한: 'K-pop', 대: ['J-pop', 'Mandopop'] },
  { 축: 'culture', 종류: 'Television drama', 한: 'Korean drama', 대: ['Japanese television drama', 'Taiwanese drama'] },
  { 축: 'culture', 종류: 'Cinema', 한: 'Cinema of South Korea', 대: ['Cinema of Japan', 'Cinema of Taiwan'] },
  { 축: 'culture', 종류: 'Language', 한: 'Korean language', 대: ['Japanese language', 'Taiwanese Hokkien'] },
  { 축: 'culture', 종류: 'Cultural export wave', 한: 'Korean wave', 대: ['Cool Japan'] },
  { 축: 'culture', 종류: 'Writing system', 한: 'Hangul', 대: ['Kana', 'Traditional Chinese characters'] },
];

/** ⭐ 한국 쪽 문서도 이 자가 받는다 — 문화 축은 여행 수집기에 없다 */
export function 한국쪽받을것(짝 = 짝들) {
  return [...new Set(짝.filter((x) => x.축 === 'culture').map((x) => x.한))];
}

/** 대조군 문서만 납작하게 — 받을 목록이다 */
export function 받을것(짝 = 짝들) {
  return [...new Set(짝.flatMap((x) => x.대))];
}

export const 못받음 = Symbol('못받음');

function 받기(url) {
  return new Promise((풀림, 깨짐) => {
    https.get(url, { headers: { 'User-Agent': 'kculturewire/1.0 (parkintaek2@gmail.com)' } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        깨짐(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let 몸 = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { 몸 += d; });
      res.on('end', () => { try { 풀림(JSON.parse(몸)); } catch (e) { 깨짐(e); } });
    }).on('error', 깨짐);
  });
}

/**
 * ⛔ 429 에 프로세스가 죽지 않는다 — 8/13 사고의 뿌리가 그것이었다.
 * ⭐ 속도 제한이면 곱절씩 물러선다. 끝내 못 받으면 **못받음**을 돌려준다(0 이 아니다).
 */
async function 세번해본다(url, 번수 = 4) {
  for (let n = 1; n <= 번수; n += 1) {
    try {
      return await 받기(url);
    } catch (e) {
      const 제한 = /HTTP 429|HTTP 5\d\d/.test(String(e.message));
      if (n === 번수) return 못받음;
      await new Promise((s) => setTimeout(s, 제한 ? 5000 * 2 ** (n - 1) : 2000 * n));
    }
  }
  return 못받음;
}

const 달앞 = (m) => `${m.replace('-', '')}0100`;
const 달말 = (m) => `${m.replace('-', '')}0100`;

/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  /* ⭐ 「몇 개인가」가 아니라 「제대로 된 목록인가」를 묻는다 — 짝이 늘어도 검사가 서지 않는다 */
  참('짝이 하나 이상이다', 짝들.length > 0);
  참('⛔ 한국 쪽 제목이 겹치지 않는다', new Set(짝들.map((x) => x.한)).size === 짝들.length);
  참('⛔ 종류 이름이 겹치지 않는다', new Set(짝들.map((x) => x.종류)).size === 짝들.length);
  참('짝마다 대조군이 하나 이상 있다', 짝들.every((x) => x.대.length > 0));
  참('⛔ 빈 제목이 없다', 짝들.every((x) => x.한.trim() && x.대.every((d) => d.trim())));
  /* ⛔ 한국 문서를 대조군에 섞으면 대조가 아니다 */
  참('⛔ 대조군에 한국 문서가 없다',
    !받을것().some((t) => /Korea|Seoul|Jeju|Myeongdong|Hongdae|T-money/i.test(t)));
  참('받을 목록에 중복이 없다', new Set(받을것()).size === 받을것().length);
  /* ⭐ 축이 둘 다 서 있어야 답을 가른다 — 하나만 남으면 이 자는 뜻이 없다 */
  참('축이 둘 다 있다', 짝들.some((x) => x.축 === 'trip') && 짝들.some((x) => x.축 === 'culture'));
  참('⛔ 축 이름이 둘뿐이다', new Set(짝들.map((x) => x.축)).size === 2);
  /* ⛔ 여행 축의 한국 문서는 조회 자가 이미 받았다 — 두 번 받으면 판을 두 번 두드린다 */
  참('⛔ 문화 축의 한국 문서만 새로 받는다',
    한국쪽받을것().every((t) => 짝들.find((x) => x.한 === t).축 === 'culture'));
  참('한국 쪽 받을 것에 중복이 없다', new Set(한국쪽받을것()).size === 한국쪽받을것().length);
  /* 🔴 redirects=1 을 빼면 명동·홍대·KTX 가 「네 판 전부 없음」으로 나왔다 */
  참('넘겨주기를 따라간다', 주소만들기('Shinkansen').includes('redirects=1'));
  참('못받음은 0 이 아니다', 못받음 !== 0 && typeof 못받음 === 'symbol');
  참('창 길이를 조회 자에서 가져온다', 달수 >= 24);
  참('달 주소가 위키미디어 꼴이다', 달앞('2025-01') === '202501' + '0100');
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

/** ⛔ redirects=1 — 빼면 넘겨주기 제목이 「그 판에 문서가 없다」로 나온다 */
export function 주소만들기(제목) {
  return 'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1'
    + `&prop=langlinks&lllimit=500&titles=${encodeURIComponent(제목)}`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  /* ① 창 — 조회 자와 **똑같이** 잡는다. 창이 다르면 대조가 아니다 */
  const 끝달 = new Date();
  끝달.setMonth(끝달.getMonth() - 1);
  const 달목록 = Array.from({ length: 달수 }, (_, i) => {
    const d = new Date(끝달);
    d.setMonth(d.getMonth() - (달수 - 1 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  /* ② 판 밑값 — 백만분율의 분모. 조회 자와 같은 값이어야 한다 */
  const 밑값 = {};
  for (const p of 판들) {
    밑값[p] = {};
    const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/${p}.wikipedia/all-access/user`
      + `/monthly/${달앞(달목록[0])}/${달말(달목록.at(-1))}`;
    const 몸 = await 세번해본다(u);
    if (몸 !== 못받음) {
      for (const it of 몸.items ?? []) {
        밑값[p][`${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}`] = it.views;
      }
    }
    await new Promise((s) => setTimeout(s, 400));
  }
  console.log(`판 밑값 — ${판들.map((p) => `${p}:${Object.keys(밑값[p]).length}달`).join(' · ')}`);

  /**
   * ③ 받을 목록 — 대조군 + **문화 축의 한국 문서**.
   * ⚠ 여행 축의 한국 문서는 `collect-sea-trip-lookups.mjs` 가 이미 받았다. 두 번 받지 않는다.
   */
  const 받을목록 = [...new Set([...받을것(), ...한국쪽받을것()])];

  /* 판별 제목 — langlinks 로 옮긴다 */
  const 제목표 = {};
  for (const 제목 of 받을목록) {
    제목표[제목] = {};
    const 몸 = await 세번해본다(주소만들기(제목));
    if (몸 !== 못받음) {
      const 쪽들 = Object.values(몸.query?.pages ?? {});
      for (const 쪽 of 쪽들) {
        for (const l of 쪽.langlinks ?? []) if (판들.includes(l.lang)) 제목표[제목][l.lang] = l['*'];
      }
    }
    await new Promise((s) => setTimeout(s, 300));
  }

  /* ④ 달별 조회 */
  let 못잰것 = 0;
  const 자료 = [];
  for (const 제목 of 받을목록) {
    const 줄 = { title: 제목, titles: 제목표[제목], views: {} };
    for (const p of 판들) {
      const 판제목 = 제목표[제목][p];
      if (!판제목) continue;
      줄.views[p] = {};
      const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${p}.wikipedia/all-access/user`
        + `/${encodeURIComponent(판제목.replace(/ /g, '_'))}/monthly/${달앞(달목록[0])}/${달말(달목록.at(-1))}`;
      const 몸 = await 세번해본다(u);
      if (몸 === 못받음) { 못잰것 += 1; continue; }
      for (const it of 몸.items ?? []) {
        줄.views[p][`${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}`] = it.views;
      }
      await new Promise((s) => setTimeout(s, 250));
    }
    자료.push(줄);
    console.log(`   ${제목.slice(0, 34).padEnd(34)} ${판들.map((p) => (줄.views[p] ? Object.keys(줄.views[p]).length : '—')).join('/')}`);
  }

  const 나감 = {
    generated: 오늘(),
    purpose: 'Control group for the Korea trip-lookup series. If Korean travel articles fell '
      + 'while comparable Japanese and Taiwanese ones held steady, the fall is about Korea. '
      + 'If they fell together, it is about how people look things up, not about Korea.',
    window: `${달목록[0]} through ${달목록.at(-1)}, ${달수} months`,
    months: 달목록,
    editionsSea: 판들,
    editionNames: 판이름,
    editionTotals: 밑값,
    pairs: 짝들.map((x) => ({ axis: x.축, kind: x.종류, korea: x.한, controls: x.대 })),
    whyTwoAxes: 'The trip axis alone cannot separate two explanations: that interest in Korea '
      + 'fell, or that people stopped using an encyclopaedia to plan a trip. The culture axis '
      + 'separates them. Both axes are measured in the same editions over the same months.',
    articles: 자료,
    unfetched: 못잰것,
    caveat: 'The control countries are Japan and Taiwan: foreign to all four Southeast Asian '
      + 'editions, and comparable to Korea as Northeast Asian destinations. We do not use '
      + 'Thailand or Vietnam as controls, because in the Thai and Vietnamese editions those '
      + 'are domestic subjects and behave differently.',
  };
  const 낼곳 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-trip-control.json');
  fs.writeFileSync(낼곳, JSON.stringify(나감, null, 2));
  console.log(`\n✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   대조 문서 ${자료.length} · 달 ${달수} (${달목록[0]} ~ ${달목록.at(-1)}) · 못 잰 칸 ${못잰것}`);
}
