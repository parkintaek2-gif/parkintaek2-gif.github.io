#!/usr/bin/env node
/**
 * **동남아는 한국 선수를 얼마나 읽나** — 위키백과 언어판별 조회수 수집기
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   사장님 지시(8/13) — 「동남아에서 인기 있는 한국인 프로스포츠선수, 이스포츠 포함」.
 *   ⛔ 「인기 있다」를 기자가 적으면 그건 인상이다. **읽힌 횟수**로 잰다.
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────
 *   인도네시아어(id) · 베트남어(vi) · 태국어(th) · 말레이어(ms) 위키백과에서
 *   그 선수 문서가 열린 횟수. 견주기 위해 영어(en)·한국어(ko)도 같이 받는다.
 *
 * ── 🔴 교란 셋. 안 죽이면 수가 거짓말한다 ──────────────────────
 *   ① 언어판 크기가 다르다 — vi 와 id 는 밑값이 다르다.
 *      → **백만분율**(그 판 전체 조회수 100만 건당 몇 건)로 고쳐 잰다.
 *   ② 동남아 사람도 영어판을 본다 — 그래서 언어판 조회수는 그 나라 관심의 **하한선**이다.
 *      → 자료에 그 말을 담는다. 「인기 순위」라고 안 쓴다.
 *   ③ 🔴 **필리핀은 이 자로 못 잰다.** 타갈로그판 전체가 한 달 190만 건뿐이고
 *      필리핀은 영어를 쓴다. → 못 잰다고 적는다. 0 으로 적지 않는다.
 *
 * ── ⛔ 이 수집기가 지키는 것 ───────────────────────────────────
 * ⛔ 제목을 손으로 찍지 않는다. **Wikidata 문서고리**에서 언어판별 제목을 받는다.
 *    (탐침에서 `Faker_(gamer)` 가 id·vi·th·ms 전부 「없음」으로 나왔다. 없는 게 아니라 이름이 달랐다.)
 * ⛔ 사람을 줄세우지 않는다. 나란히 놓고 **왜 다른지**를 같이 적는다.
 * ⛔ 문서가 없는 것과 조회수 0 을 섞지 않는다. 앞은 `null`, 뒤는 `0`.
 * ⚠ 이용 조건 — Wikidata CC0 · Wikimedia 조회수 API 는 공개(User-Agent 를 밝힌다). 1유형.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const 결과길 = 'archive/raw/wikipedia/sea-athletes.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';

/** 잴 언어판. tl(필리핀)은 일부러 뺐다 — 밑값이 너무 작아 잴 수 없다 */
export const 동남아 = ['id', 'vi', 'th', 'ms'];
export const 견줄판 = ['en', 'ko'];
export const 모든판 = [...동남아, ...견줄판];

/** 종목 — Wikidata 직업 Q번호 */
export const 종목 = [
  { key: 'football', label: 'Football', q: 'Q937857' },
  { key: 'esports', label: 'Esports', q: 'Q4379701' },
  { key: 'baseball', label: 'Baseball', q: 'Q10871364' },
  { key: 'golf', label: 'Golf', q: 'Q11303721' },
  { key: 'mma', label: 'MMA', q: 'Q13474373' },
];

/** 🔴 언어판 크기 차이를 죽인다 — 백만분율. 밑값이 없으면 null(0 이 아니다) */
export function 백만분율(조회, 밑값) {
  if (조회 === null || 조회 === undefined) return null;
  if (!밑값) return null;
  return +((1e6 * 조회) / 밑값).toFixed(2);
}

/** 문서가 없는 것(null)과 아무도 안 본 것(0)은 다르다 */
export function 합치기(항목들) {
  if (항목들 === null) return null;
  return 항목들.reduce((a, x) => a + x.views, 0);
}

/** 동남아 넷 중 몇 판에 문서가 있나 — 「읽힌다」기 전에 「있나」다 */
export function 문서있는판(줄) {
  return 동남아.filter((p) => 줄.views[p] !== null && 줄.views[p] !== undefined).length;
}

/**
 * 🔴 **못 잰 것을 0 으로 세지 않는다.** 8/13 에 여기서 크게 틀렸다 —
 *   조회수 호출이 속도 제한에 걸려 죽었는데 그것을 0 으로 더해서
 *   손흥민이 「아무도 안 읽는 사람」이 되어 바닥에 깔렸다.
 *   null(문서 없음)은 0 으로 세도 된다. undefined(못 쟀다)는 **합 자체를 못 낸다.**
 */
export function 동남아합(줄) {
  if (동남아.some((p) => 줄.views[p] === undefined)) return null;
  const s = 동남아.reduce((a, p) => a + (줄.perMillion[p] ?? 0), 0);
  return +s.toFixed(2);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('동남아 넷', 동남아.length, 4);
  재본다('⛔ tl(필리핀)은 안 잰다 — 밑값이 너무 작다', 동남아.includes('tl'), false);
  재본다('견줄 판 둘', 견줄판, ['en', 'ko']);
  재본다('백만분율', 백만분율(5086, 50430364), 100.85);
  재본다('백만분율 — 문서 없음은 null 을 지킨다', 백만분율(null, 50430364), null);
  재본다('백만분율 — 밑값 없으면 null(0 이 아니다)', 백만분율(10, 0), null);
  재본다('합치기', 합치기([{ views: 3 }, { views: 4 }]), 7);
  재본다('합치기 — 없는 문서는 null 그대로', 합치기(null), null);
  재본다('합치기 — 있는데 0 은 0', 합치기([{ views: 0 }]), 0);
  재본다('문서있는판 — 0 과 null 을 안 섞는다',
    문서있는판({ views: { id: 0, vi: null, th: 5, ms: undefined } }), 2);
  /* 🔴 8/13 에 여기서 틀렸다. 자물쇠를 건다 */
  재본다('동남아합 — 못 잰 판이 하나라도 있으면 합을 안 낸다',
    동남아합({ views: { id: 5, vi: undefined, th: null, ms: 1 }, perMillion: { id: 2, vi: null, th: null, ms: 1 } }),
    null);
  재본다('동남아합 — 문서 없음(null)은 0 으로 세도 된다',
    동남아합({ views: { id: 5, vi: null, th: null, ms: 1 }, perMillion: { id: 2, vi: null, th: null, ms: 1 } }),
    3);
  재본다('종목 다섯', 종목.length, 5);
  재본다('종목에 이스포츠가 있다', 종목.some((s) => s.key === 'esports'), true);
  console.log(`동남아 선수 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/* ────────────────────────── 실제 수집 ────────────────────────── */

/**
 * 🔴 8/13 — 조각을 **문자열로 이어붙이면** 태국어·베트남어처럼 여러 바이트인 글자가
 *   조각 경계에서 두 동강 난다. 작은 응답은 멀쩡해 보이고 큰 응답에서 JSON 이 터진다
 *   (연예인 수집기가 224KB 지점에서 그렇게 죽었다). Buffer 로 모아 끝에 한 번만 바꾼다.
 */
function 받기(host, 길) {
  return new Promise((resolve) => {
    const req = https.request({
      host, path: 길, method: 'GET',
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    }, (res) => {
      const 조각 = [];
      res.on('data', (c) => { 조각.push(c); });
      res.on('end', () => resolve({ code: res.statusCode, body: Buffer.concat(조각).toString('utf8') }));
    });
    req.on('error', (e) => resolve({ code: 0, body: String(e.message) }));
    req.setTimeout(60000, () => { req.destroy(); resolve({ code: 0, body: 'timeout' }); });
    req.end();
  });
}

async function 스파클(질의) {
  const 길 = `/sparql?format=json&query=${encodeURIComponent(질의)}`;
  for (let 번 = 0; 번 < 3; 번 += 1) {
    const r = await 받기('query.wikidata.org', 길);
    if (r.code === 200) return JSON.parse(r.body).results.bindings;
    await new Promise((s) => { setTimeout(s, 3000 * (번 + 1)); });
  }
  return null;
}

/** 한 종목의 한국 선수 + 언어판별 문서 제목 */
function 질의만들기(직업Q) {
  const 고리 = 모든판.map((p) => `
  OPTIONAL {
    ?a_${p} schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> .
  }`).join('');
  return `SELECT ?p ?pLabel ${모든판.map((p) => `?a_${p}`).join(' ')} WHERE {
  ?p wdt:P31 wd:Q5 ; wdt:P27 wd:Q884 ; wdt:P106 wd:${직업Q} .
  ${고리}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}

function 제목뽑기(url, 판) {
  if (!url) return null;
  const 앞 = `https://${판}.wikipedia.org/wiki/`;
  if (!url.startsWith(앞)) return null;
  return decodeURIComponent(url.slice(앞.length));
}

const 처음 = '20250801';
const 끝 = '20260731';

/**
 * 🔴 8/13 — 여기가 조용히 죽어서 자료가 통째로 거짓이 됐다.
 *   429·5xx·연결끊김은 **다시 묻는다.** 그래도 안 되면 undefined 로 남겨 「못 쟀다」를 지킨다.
 */
const 실패셈 = new Map();
async function 조회수(판, 제목) {
  const 길 = `/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/`
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/${처음}/${끝}`;
  for (let 번 = 0; 번 < 4; 번 += 1) {
    const r = await 받기('wikimedia.org', 길);
    if (r.code === 404) return null;                 /* 문서는 있는데 조회 기록이 없다 */
    if (r.code === 200) {
      try { return 합치기(JSON.parse(r.body).items ?? []); } catch { /* 다시 묻는다 */ }
    }
    실패셈.set(r.code, (실패셈.get(r.code) ?? 0) + 1);
    await new Promise((s) => { setTimeout(s, 800 * (2 ** 번)); });
  }
  return undefined;                                   /* 못 쟀다 — 0 이 아니다 */
}

async function 밑값(판) {
  const 길 = `/api/rest_v1/metrics/pageviews/aggregate/${판}.wikipedia/all-access/user/monthly/${처음}/${끝}`;
  const r = await 받기('wikimedia.org', 길);
  if (r.code !== 200) return null;
  try { return 합치기(JSON.parse(r.body).items ?? []); } catch { return null; }
}

/** 동시에 몇 개까지 — 남의 서버다. 넉넉히 잡지 않는다 */
async function 떼로(일들, 폭 = 5) {
  const 답 = [];
  for (let i = 0; i < 일들.length; i += 폭) {
    답.push(...await Promise.all(일들.slice(i, i + 폭).map((f) => f())));
  }
  return 답;
}

if (내가실행됐다) {
  fs.mkdirSync(path.dirname(결과길), { recursive: true });

  console.log('① 언어판 밑값 — 크기 차이를 죽일 자');
  const 밑 = {};
  for (const p of 모든판) {
    밑[p] = await 밑값(p);
    console.log(`   ${p.padEnd(3)} ${밑[p] ? 밑[p].toLocaleString('en-US') : '⛔ 못 쟀다'}`);
  }

  console.log('\n② 종목별 한국 선수와 언어판 문서');
  const 사람 = new Map();
  for (const s of 종목) {
    const 줄들 = await 스파클(질의만들기(s.q));
    if (줄들 === null) { console.log(`   ${s.label.padEnd(9)} ⛔ 못 받았다`); continue; }
    let 새로 = 0;
    for (const 줄 of 줄들) {
      const q = 줄.p.value.split('/').pop();
      if (!사람.has(q)) {
        사람.set(q, { q, name: 줄.pLabel?.value ?? q, sports: [], titles: {} });
        새로 += 1;
      }
      const 그 = 사람.get(q);
      if (!그.sports.includes(s.key)) 그.sports.push(s.key);
      for (const p of 모든판) {
        const t = 제목뽑기(줄[`a_${p}`]?.value, p);
        if (t) 그.titles[p] = t;
      }
    }
    console.log(`   ${s.label.padEnd(9)} ${줄들.length}줄 · 새 사람 ${새로}`);
  }

  /* ⛔ 동남아 넷 중 한 판에도 문서가 없으면 잴 것이 없다 — 조회수를 안 부른다 */
  const 잴사람 = [...사람.values()].filter((x) => 동남아.some((p) => x.titles[p]));
  console.log(`\n③ 사람 ${사람.size}명 중 동남아 판에 문서가 있는 사람 ${잴사람.length}명`);
  console.log(`   ⚠ 나머지 ${사람.size - 잴사람.length}명은 「인기 없다」가 아니라 **문서가 없다**`);

  console.log('\n④ 조회수 — 12개월(2025-08 ~ 2026-07)');
  let 센 = 0;
  const 줄들 = await 떼로(잴사람.map((x) => async () => {
    const views = {};
    for (const p of 모든판) {
      views[p] = x.titles[p] ? await 조회수(p, x.titles[p]) : null;
    }
    센 += 1;
    if (센 % 25 === 0) process.stdout.write(`   ${센}/${잴사람.length}\n`);
    const perMillion = {};
    for (const p of 모든판) {
      perMillion[p] = views[p] === undefined ? undefined : 백만분율(views[p], 밑[p]);
    }
    const 줄 = {
      q: x.q,
      name: x.name,
      sports: x.sports,
      titles: x.titles,
      views,
      perMillion,
      seaEditionsWithArticle: 문서있는판({ views }),
    };
    줄.seaPerMillionTotal = 동남아합(줄);      /* 🔴 못 잰 판이 있으면 null 이다 */
    return 줄;
  }), 3);

  /* ⛔ 못 잰 사람을 바닥에 깔지 않는다. 아예 갈라 둔다 */
  const 잰것 = 줄들.filter((x) => x.seaPerMillionTotal !== null);
  const 못잰것 = 줄들.filter((x) => x.seaPerMillionTotal === null);
  잰것.sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);
  if (실패셈.size) {
    console.log(`\n⚠ 다시 물은 응답 — ${[...실패셈].map(([c, n]) => `${c}:${n}`).join(' · ')}`);
  }
  console.log(`⚠ 끝내 못 잰 사람 ${못잰것.length}명 — **0 으로 안 센다**`);

  const out = {
    generated: new Date().toISOString(),
    source: 'Wikidata (CC0) for people and article links; Wikimedia Pageviews API for reads',
    window: '2025-08 through 2026-07, 12 months, human traffic only',
    unit: 'Reads of that person\'s article in that language edition, and reads per million reads '
      + 'of the whole edition.',
    editionsSea: 동남아,
    editionsCompare: 견줄판,
    editionTotals: 밑,
    peopleFound: 사람.size,
    peopleMeasured: 잰것.length,
    peopleNotMeasured: 못잰것.length,
    people: 잰것,
    /**
     * 🔴 못 잰 사람은 「안 읽힌 사람」이 아니다. 갈라서 남긴다.
     * ⚠ 8/13 — 처음에 이름만 남겼더니 **다시 재려 할 때 문서 제목이 없어 못 쟀다.**
     *   제목을 같이 남긴다. 다시 재는 자가 그것으로 산다.
     */
    couldNotMeasure: 못잰것.map((x) => ({
      q: x.q, name: x.name, sports: x.sports, role: x.role, titles: x.titles,
    })),
    whyNotPhilippines: 'Tagalog Wikipedia is too small to measure with — the whole edition draws '
      + 'fewer reads in a year than a single popular article does elsewhere, and Filipino readers '
      + 'largely use the English edition. We do not report a Philippines number rather than report '
      + 'a weak one.',
    whyThisIsAFloor: 'Readers in Southeast Asia also use the English edition, so a language-edition '
      + 'count is a floor on interest in that country, not a measure of it.',
    cannotAnswer: 'Reading an encyclopaedia article is not the same as following a sport. This '
      + 'counts people looking someone up. It cannot say who is liked, only who is looked up.',
  };
  fs.writeFileSync(결과길, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`\n⭐ ${결과길}`);
  console.log(`   사람 ${사람.size}명 · 잰 사람 ${잰것.length}명 · 못 잰 사람 ${못잰것.length}명`);
  console.log('\n동남아 백만분율 합이 큰 순 (⛔ 순위표가 아니다 — 왜 다른지는 지면에서 적는다)');
  for (const x of 잰것.slice(0, 25)) {
    console.log(`   ${x.name.padEnd(22)} ${String(x.seaPerMillionTotal).padStart(8)}  `
      + `${동남아.map((p) => `${p} ${x.perMillion[p] ?? '—'}`).join(' · ')}  [${x.sports.join(',')}]`);
  }
}
