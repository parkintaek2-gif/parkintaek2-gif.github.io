/**
 * collect-sea-trip-lookups.mjs — **한국 여행을 「알아보는」 문서**의 동남아 월별 조회.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 89편이 「읽는 곳」과 「가는 곳」을 이으려다 못 이었다. 두 자가 너무 멀었다.
 * ⭐ 그 사이에 **「알아보는 것」**이 있다. 비자·공항·교통카드·철도를 찾아보는 사람은
 *   배우 이름을 찾아보는 사람보다 **발걸음에 훨씬 가깝다.**
 *
 * 90편의 물음: **한국 여행을 알아보는 달과, 비행기가 실제로 뜨는 달이 같은가.**
 *   항공 쪽은 `archive/raw/kosis/air.json` 에 60달치가 있다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **못 잰 달을 0 으로 세지 않는다.** 호출이 죽으면 null 로 두고 세는 데서 뺀다.
 *    8/13 에 여기서 크게 틀렸다 — 속도 제한에 걸린 것을 0 으로 더해 손흥민이 바닥에 깔렸다.
 * ⛔ **문서가 없는 판을 「관심 없음」으로 읽지 않는다.** 404 는 백과사전의 빈칸이다.
 * ⚠ 「알아봄」은 「감」이 아니다. 숙제로 읽는 사람도 있다. 그 말을 자료에 박는다.
 * ⚠ 조회수는 **판 크기**로 나눈다(백만분율) — 인도네시아가 크다고 앞서면 안 된다.
 *
 * 쓰는 법
 *   node scripts/collect-sea-trip-lookups.mjs
 *   node scripts/collect-sea-trip-lookups.mjs --selftest
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
 * ⭐ **25 달을 받는다. 24 가 아니다.**
 *
 * 항공 자료는 늘 한 달 늦다 — 조회는 7월까지 있는데 항공은 6월까지다. 겹치는 달만 쓰면
 * 23 이 되고, 23 으로는 **열두 달 대 열두 달**이 안 선다. 한 달이 모자라 계절을 못 뺀다.
 *
 * 🔴 한 달 하나로 재면 답이 뒤집힌다 — 대양주는 6월만 보면 **-25%**, 열두 달로 보면 **+2%** 다.
 *   같은 자료다. **자를 바꾸면 답이 바뀐다.** 그래서 열두 달 대 열두 달을 고집한다.
 *
 * ⚠ 창은 「지난달까지」로 잡으므로 이건 개수지 날짜가 아니다. 항공이 더 늦어지면 겹달이
 *   또 줄 수 있다 — 그때는 **모자라다고 말하지, 짧은 자로 재지 않는다.**
 */
export const 달수 = 25;

/**
 * ⭐ **여행을 준비할 때 여는 문서**만 고른다. 배우·노래는 안 넣는다 — 그건 이미 잰다.
 * ⚠ 영어판 제목이다. 판마다 제목이 다르므로 langlinks 로 옮긴다.
 */
export const 볼문서 = [
  'Tourism in South Korea',
  'Visa policy of South Korea',
  'Incheon International Airport',
  'Korea Train Express',
  'Seoul Metropolitan Subway',
  'T-money',
  'Korean cuisine',
  'Myeongdong',
  'Hongdae, Seoul',
  'Jeju Island',
];

/** `2026-06` ↔ `20260601`. Pageviews API 는 붙여 쓴 날짜를 받는다 */
export function 달앞(달) { return `${달.replace('-', '')}01`; }
export function 달꼴(prd) {
  const s = String(prd ?? '');
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}` : s;
}

/** 백만분율. ⛔ 못 잰 것은 null — 0 이 아니다 */
export function 백만분율(조회, 밑값) {
  if (조회 === null || 조회 === undefined) return null;
  if (!밑값) return null;
  return +((1e6 * 조회) / 밑값).toFixed(2);
}

/** 봉우리가 어느 달인가. ⛔ 못 잰 달이 하나라도 있으면 봉우리를 말하지 않는다 */
export function 봉우리(달값) {
  const 달 = Object.keys(달값).sort();
  if (!달.length) return null;
  if (달.some((m) => 달값[m] === null)) return null;
  return 달.reduce((a, m) => (달값[m] > 달값[a] ? m : a), 달[0]);
}

/** 달을 1~12 로 접는다 — 해가 달라도 같은 계절끼리 모은다 */
export function 달접기(달값) {
  const 통 = {};
  for (const [m, v] of Object.entries(달값)) {
    if (v === null) continue;
    const 월 = m.slice(5);
    (통[월] = 통[월] ?? []).push(v);
  }
  const 평 = {};
  for (const [월, 값들] of Object.entries(통)) {
    평[월] = +(값들.reduce((a, b) => a + b, 0) / 값들.length).toFixed(2);
  }
  return 평;
}

function 받기(url) {
  return new Promise((resolve, reject) => {
    let 끝 = false;
    const 한번만 = (f, v) => { if (!끝) { 끝 = true; clearTimeout(t); f(v); } };
    /* ⚠ req.setTimeout 은 쉬는 시간 재기다. 찔끔 오는 서버엔 안 걸린다. 밖에서 센다 */
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만(reject, new Error('시간 초과')); }, 45000);
    const req = https.get(url, { headers: { 'User-Agent': 'KCultureWire/seat5 (data journalism; contact via kculturewire.com)' } }, (res) => {
      const 조각 = [];
      res.on('data', (c) => 조각.push(c));
      res.on('end', () => {
        if (res.complete === false) return 한번만(reject, new Error('응답이 잘렸다'));
        if (res.statusCode === 404) return 한번만(resolve, null);   // ⚠ 문서가 없는 것. 오류가 아니다
        if (res.statusCode !== 200) return 한번만(reject, new Error(`HTTP ${res.statusCode}`));
        return 한번만(resolve, Buffer.concat(조각).toString('utf8'));
      });
    });
    req.on('error', (e) => 한번만(reject, e));
  });
}

/**
 * 🔴 2026-08-15 — 처음 돌렸더니 **HTTP 429** 에 죽었다. 속도 제한이다.
 *   ⛔ 이것이 **8/13 사고의 뿌리**다. 그때는 429 로 죽은 칸을 0 으로 세어
 *     손흥민이 「아무도 안 읽는 사람」이 되어 바닥에 깔렸다.
 *   ⭐ 두 가지를 고친다 — ① 429 면 **더 오래** 기다린다 ② 그래도 안 되면 **null 로 돌려준다.**
 *     ⛔ 던져서 프로세스를 죽이지 않는다. 죽으면 앞서 받은 것까지 다 잃는다.
 */
export const 못받음 = Symbol('못받음');

async function 세번해본다(url, 번수 = 4) {
  for (let n = 1; n <= 번수; n += 1) {
    try { return await 받기(url); } catch (e) {
      const 제한 = /HTTP 429|HTTP 5\d\d/.test(String(e.message));
      if (n === 번수) return 못받음;
      /* 속도 제한이면 곱절로 기다린다. 그 밖은 짧게 */
      await new Promise((s) => setTimeout(s, 제한 ? 5000 * 2 ** (n - 1) : 2000 * n));
    }
  }
  return 못받음;
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('달을 API 꼴로', 달앞('2026-06') === '20260601');
  참('API 꼴을 달로', 달꼴('20260601') === '2026-06');
  참('백만분율을 센다', 백만분율(10, 1e6) === 10);
  참('밑값이 없으면 null', 백만분율(10, 0) === null);
  참('🔴 못 잰 것은 0 이 아니다', 백만분율(null, 1e6) === null);
  참('봉우리를 찾는다', 봉우리({ '2026-01': 1, '2026-02': 9 }) === '2026-02');
  참('🔴 못 잰 달이 있으면 봉우리를 안 말한다', 봉우리({ '2026-01': 1, '2026-02': null }) === null);
  참('빈 것이면 null', 봉우리({}) === null);
  참('달을 접어 평균낸다',
    달접기({ '2025-06': 10, '2026-06': 20 })['06'] === 15);
  참('못 잰 달은 접을 때 뺀다',
    달접기({ '2025-06': 10, '2026-06': null })['06'] === 10);
  참('볼 문서에 배우·노래를 안 넣는다',
    볼문서.every((t) => !/BTS|Blackpink|Squid/i.test(t)));
  /**
   * 🔴 처음엔 `볼문서.length === 10` 이라 적었다. 그러면 **문서를 늘릴 때 검사가 선다** —
   *   자물쇠지 검사가 아니다. 어제 소셜 킷에서 「벌이 다섯」으로 같은 짓을 했다.
   * ⭐ 물어야 할 것은 「몇 개인가」가 아니라 **「제대로 된 목록인가」**다.
   */
  참('볼 문서가 하나 이상이다', 볼문서.length > 0);
  참('⛔ 같은 문서를 두 번 안 센다', new Set(볼문서).size === 볼문서.length);
  참('빈 이름이 없다', 볼문서.every((t) => typeof t === 'string' && t.trim().length > 0));
  /* 🔴 8/15 — redirects=1 을 안 넣어 세 문서가 「없음」으로 나왔다. 넘김이었다 */
  참('⛔ 제목 호출이 넘김을 따라간다',
    fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').includes('&redirects=1&prop=langlinks'));
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

/**
 * ① 판마다 제목을 옮긴다. ⛔ 제목을 내가 짐작해 적지 않는다.
 *
 * 🔴 2026-08-15 — 처음에 `redirects=1` 을 안 넣었다. 그랬더니 세 문서가
 *   **네 판 전부 「없음」**으로 나왔다 — KTX·명동·홍대. 셋 다 실제로는 **넘김**이었다:
 *     Korea Train Express → KTX · Myeongdong → Myeong-dong · Hongdae, Seoul → Hongdae (area)
 *   ⛔ 「문서가 없다」가 아니라 **내 호출이 넘김을 안 따라간 것**이었다.
 *     그대로 냈으면 「동남아 백과사전에 명동 문서가 없다」는 거짓을 낼 뻔했다.
 */
/**
 * ⛔ **여기부터는 직접 실행할 때만 돈다.**
 *
 * 🔴 8/15 에 물렸다. `collect-sea-trip-control.mjs` 가 이 자에서 `판들`·`달수` 만
 *   가져다 쓰려고 import 했는데, **이 자가 통째로 돌아** 위키미디어를 백 번 두드리고
 *   원본 파일까지 다시 썼다. 내가 만든 훑기의 ②번(임포트 부수효과)에 내가 걸렸다.
 * ⚠ 이번엔 값이 같아 해가 없었다. 다음엔 아니다 — **남의 자가 내 파일을 덮어쓴다.**
 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
const 제목 = {};
for (const t of 볼문서) {
  제목[t] = {};
  const u = 'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=langlinks'
    + `&lllimit=500&titles=${encodeURIComponent(t)}`;
  const 몸 = await 세번해본다(u);
  if (몸 === 못받음) { console.log(`   🔴 ${t} — 제목을 못 받았다(속도 제한). 이 문서는 빠진다`); continue; }
  if (!몸) { console.log(`   ⚠ ${t} — 영어판에 없다`); continue; }
  let j; try { j = JSON.parse(몸); } catch { console.log(`   ⚠ ${t} — 답이 JSON 이 아니다`); continue; }
  const 쪽 = Object.values(j.query?.pages ?? {})[0];
  for (const l of 쪽?.langlinks ?? []) {
    if (판들.includes(l.lang)) 제목[t][l.lang] = l['*'];
  }
  await new Promise((s) => setTimeout(s, 500));
}

/* ② 판 크기(밑값)를 받는다 — 백만분율의 분모다 */
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
  if (몸 === 못받음 || !몸) { console.log(`   🔴 ${p} 판 밑값을 못 받았다 — 그 판은 백만분율이 안 나온다`); continue; }
  let j; try { j = JSON.parse(몸); } catch { continue; }
  for (const it of j.items ?? []) 밑값[p][달꼴(it.timestamp.slice(0, 8))] = it.views;
  await new Promise((s) => setTimeout(s, 600));
}
console.log(`판 밑값 — ${판들.map((p) => `${p}:${Object.keys(밑값[p]).length}달`).join(' · ')}`);

/* ③ 문서 × 판 × 달 조회수 */
const 자료 = [];
let 못잰것 = 0;
for (const t of 볼문서) {
  const 줄 = { titleEn: t, titles: 제목[t], views: {}, perMillion: {} };
  for (const p of 판들) {
    const 그제목 = 제목[t][p];
    if (!그제목) { 줄.views[p] = null; 줄.perMillion[p] = null; continue; }
    const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${p}.wikipedia/all-access/user`
      + `/${encodeURIComponent(그제목.replace(/ /g, '_'))}/monthly/${달앞(달목록[0])}/${달앞(달목록.at(-1))}`;
    const 몸 = await 세번해본다(u);
    /* 🔴 못 받은 것과 문서가 없는 것은 **다르다.** 앞엣것은 null, 뒤엣것은 빈 표 */
    if (몸 === 못받음) { 줄.views[p] = null; 줄.perMillion[p] = null; 못잰것 += 1; continue; }
    if (몸 === null) { 줄.views[p] = {}; 줄.perMillion[p] = {}; continue; }   // 문서 없음
    let j; try { j = JSON.parse(몸); } catch { 줄.views[p] = null; 줄.perMillion[p] = null; 못잰것 += 1; continue; }
    줄.views[p] = {}; 줄.perMillion[p] = {};
    for (const it of j.items ?? []) {
      const m = 달꼴(it.timestamp.slice(0, 8));
      줄.views[p][m] = it.views;
      줄.perMillion[p][m] = 백만분율(it.views, 밑값[p][m] ?? null);
    }
    await new Promise((s) => setTimeout(s, 600));
  }
  자료.push(줄);
  console.log(`   ${t.padEnd(30)} ${판들.map((p) => (줄.views[p] === null ? '—' : Object.keys(줄.views[p]).length)).join('/')}`);
}

const 나감 = {
  generated: 오늘(),
  source: 'Wikimedia Pageviews API, human traffic only; titles resolved via Wikipedia langlinks',
  window: `${달목록[0]} through ${달목록.at(-1)}, ${달수} months`,
  unit: 'reads per million reads of that edition (백만분율)',
  editionsSea: 판들,
  editionNames: 판이름,
  months: 달목록,
  /** ⚠ 이 자료가 **못 하는 말**. 기사에 그대로 옮긴다 */
  lookingIsNotGoing: 'Opening an encyclopaedia article about a visa rule or an airport is not the '
    + 'same as boarding a plane. Some of these reads are homework, some are curiosity, and some '
    + 'never become a trip. What this can show is when the looking happens.',
  articles: 자료,
  articlesMeasured: 자료.length,
  editionArticleMisses: 못잰것,
  editionTotals: 밑값,
};

const 길 = path.join(뿌리, 'archive/raw/wikipedia/sea-trip-lookups.json');
fs.mkdirSync(path.dirname(길), { recursive: true });
fs.writeFileSync(길, `${JSON.stringify(나감, null, 2)}\n`);
console.log(`\n✅ ${path.relative(뿌리, 길)}`);
console.log(`   문서 ${자료.length} · 달 ${달수} (${달목록[0]} ~ ${달목록.at(-1)}) · 못 잰 칸 ${못잰것}`);

}