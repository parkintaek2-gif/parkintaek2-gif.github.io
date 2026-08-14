#!/usr/bin/env node
/**
 * **연예인은 선수보다 높은가** — 사장님 물음(8/13).
 *
 * 🔴 자를 바꾸면 비교가 안 된다. `collect-sea-athletes.mjs` 와 **똑같은 자**를 쓴다 —
 *   같은 언어판 넷, 같은 12개월, 같은 백만분율. 그래야 선수 342.3 과 나란히 놓을 수 있다.
 *
 * ⛔ 이 수집기가 지키는 것
 * ⛔ 제목을 손으로 찍지 않는다. Wikidata 문서고리에서 받는다.
 * ⛔ 「못 쟀다」(undefined)를 0 으로 세지 않는다. 8/13 에 그것으로 표 전체가 거짓이 됐다.
 * ⛔ 필리핀은 안 잰다. 타갈로그판이 너무 작다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 동남아, 견줄판, 모든판, 백만분율, 합치기, 문서있는판 } from './collect-sea-athletes.mjs';
import { 지금 } from './_kst.mjs';

const 결과길 = 'archive/raw/wikipedia/sea-celebrities.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';

/**
 * 갈래 — Wikidata 직업 Q번호.
 * ⚠ 8/13 — 다섯 갈래로 돌렸더니 시간을 넘겨 죽었다. **둘로 줄인다.**
 *   아이돌·래퍼·모델은 대부분 가수(Q177220)와 같은 사람이라 얻는 것에 비해 비싸다.
 *   ⛔ 「빼도 된다」가 아니라 **뺐다고 자료에 적는다.**
 */
export const 갈래 = [
  { key: 'actor', label: 'Actor', q: 'Q33999' },
  { key: 'singer', label: 'Singer', q: 'Q177220' },
];

/** 🔴 조회수는 **동남아 넷만** 잰다. en·ko 까지 재면 호출이 세 배가 되고 시간을 넘긴다 */
export const 잴판 = 동남아;

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('🔴 선수와 **같은 언어판**을 쓴다 — 아니면 비교가 안 된다', 동남아, ['id', 'vi', 'th', 'ms']);
  재본다('🔴 선수와 같은 백만분율 셈', 백만분율(5086, 50430364), 100.85);
  재본다('갈래 둘 — 8/13 에 다섯에서 줄였다(시간 초과)', 갈래.length, 2);
  재본다('배우가 들어 있다', 갈래.some((x) => x.key === 'actor'), true);
  재본다('가수가 들어 있다', 갈래.some((x) => x.key === 'singer'), true);
  재본다('🔴 조회수는 동남아 넷만 잰다 — 여섯을 재면 시간을 넘긴다', 잴판.length, 4);
  재본다('⛔ 견줄판(en·ko)은 조회수를 안 잰다', 잴판.some((p) => 견줄판.includes(p)), false);
  재본다('못 잰 것은 0 이 아니다', 백만분율(null, 1000), null);
  console.log(`연예인 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/**
 * 🔴 8/13 — 여기서 자료가 깨졌다. 조각을 **문자열로 이어붙이면**
 *   태국어·베트남어 같은 여러 바이트 글자가 **조각 경계에서 두 동강** 난다.
 *   작은 응답은 조각이 하나라 멀쩡해 보이고, 224KB 쯤에서 JSON 이 터진다.
 *   → Buffer 로 모아 **끝에 한 번만** 글자로 바꾼다.
 */
/**
 * 🔴 8/13 — 세 번째로 여기서 죽었다(exit 13, 안 풀린 약속).
 *   `req.setTimeout` 은 **소켓이 조용할 때만** 걸린다. 서버가 찔끔찔끔 보내면
 *   영영 안 걸리고 `end` 도 영영 안 온다. → **밖에서 하드 시한**을 건다.
 * ⛔ 한 번만 풀리게 잠근다. 두 번 resolve 하면 조용히 앞의 값이 이긴다.
 */
const 하드시한 = 100000;
function 받기(host, 길) {
  return new Promise((resolve) => {
    let 끝났나 = false;
    const 한번만 = (v) => { if (!끝났나) { 끝났나 = true; clearTimeout(시한); resolve(v); } };
    const 시한 = setTimeout(() => {
      try { req.destroy(); } catch { /* 이미 죽었다 */ }
      한번만({ code: 0, body: 'hard-timeout', 온전한가: false });
    }, 하드시한);
    const req = https.request({ host, path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } },
      (res) => {
        const 조각 = [];
        res.on('data', (c) => { 조각.push(c); });
        res.on('end', () => 한번만({
          code: res.statusCode,
          body: Buffer.concat(조각).toString('utf8'),
          /**
           * 🔴 8/13 — 96KB 에서 JSON 이 잘렸다. 조각 이어붙이기 문제가 아니라
           *   **연결이 중간에 끊기고도 `end` 가 불린 것**이다. node 는 그것을
           *   `res.complete === false` 로 알려 준다. 이걸 안 보면 **반쪽 자료를 받아 쓴다.**
           */
          온전한가: res.complete,
        }));
      });
    req.on('error', (e) => 한번만({ code: 0, body: e.message, 온전한가: false }));
    req.setTimeout(45000, () => { req.destroy(); 한번만({ code: 0, body: 'idle-timeout', 온전한가: false }); });
    req.end();
  });
}

/**
 * 🔴 8/13 — 여기서 두 번 죽었다. 고친 것 둘:
 *   ① `JSON.parse` 를 `try` 밖에 두어서, 잘린 응답 하나에 **재시도 없이 전부 죽었다**
 *   ② 잘렸는지를 안 봤다. `res.complete` 가 거짓이면 **버리고 다시 묻는다**
 * ⛔ 반쪽 자료를 받아 쓰느니 못 받았다고 하는 것이 낫다.
 */
async function 스파클(질의) {
  for (let 번 = 0; 번 < 5; 번 += 1) {
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(질의)}`);
    if (r.code === 200 && r.온전한가) {
      try { return JSON.parse(r.body).results.bindings; } catch (e) {
        console.log(`   ⚠ ${번 + 1}번째 — 200 이고 온전하다는데 JSON 이 안 풀린다: ${e.message.slice(0, 60)}`);
      }
    } else if (r.code === 200) {
      console.log(`   ⚠ ${번 + 1}번째 — 응답이 **잘려서** 왔다(${r.body.length}자). 버리고 다시 묻는다`);
    }
    await new Promise((s) => { setTimeout(s, 4000 * (번 + 1)); });
  }
  return null;
}

/**
 * 🔴 8/13 — 판 여섯을 OPTIONAL 로 한 질의에 넣었더니 배우 6,007명에서 **질의가 매달려 죽었다**
 *   (unsettled top-level await, exit 13). 판마다 따로 묻는다. 하나하나는 가볍다.
 * ⭐ 덤으로 결과가 작아진다 — 그 판에 문서가 **있는 사람만** 돌아오기 때문이다.
 */
/**
 * ⚠ 한 번에 다 받으면 응답이 커서 잘린다(8/13 에 96KB 에서 잘렸다).
 *   **쪽으로 나눠 묻는다.** ⛔ `ORDER BY` 없이 `OFFSET` 을 쓰면 쪽마다 순서가 달라져
 *   어떤 사람은 두 번 오고 어떤 사람은 아예 안 온다. 반드시 정렬한다.
 */
const 쪽크기 = 500;
function 질의만들기(직업Q, 판, 쪽 = 0) {
  return `SELECT ?p ?pLabel ?a WHERE {
  ?p wdt:P31 wd:Q5 ; wdt:P27 wd:Q884 ; wdt:P106 wd:${직업Q} .
  ?a schema:about ?p ; schema:isPartOf <https://${판}.wikipedia.org/> .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} ORDER BY ?p LIMIT ${쪽크기} OFFSET ${쪽 * 쪽크기}`;
}

const 제목뽑기 = (url, 판) => {
  if (!url) return null;
  const 앞 = `https://${판}.wikipedia.org/wiki/`;
  return url.startsWith(앞) ? decodeURIComponent(url.slice(앞.length)) : null;
};

const 처음 = '20250801';
const 끝 = '20260731';
const 실패셈 = new Map();

async function 조회수(판, 제목) {
  const 길 = `/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/`
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/${처음}/${끝}`;
  for (let 번 = 0; 번 < 4; 번 += 1) {
    const r = await 받기('wikimedia.org', 길);
    if (r.code === 404) return null;
    if (r.code === 200 && r.온전한가) {          /* ⛔ 잘린 응답은 안 쓴다 */
      try { return 합치기(JSON.parse(r.body).items ?? []); } catch { /* 다시 */ }
    }
    실패셈.set(r.온전한가 === false ? '잘림' : r.code,
      (실패셈.get(r.온전한가 === false ? '잘림' : r.code) ?? 0) + 1);
    await new Promise((s) => { setTimeout(s, 800 * (2 ** 번)); });
  }
  return undefined;
}

async function 밑값(판) {
  const 길 = `/api/rest_v1/metrics/pageviews/aggregate/${판}.wikipedia/all-access/user/monthly/${처음}/${끝}`;
  const r = await 받기('wikimedia.org', 길);
  if (r.code !== 200) return null;
  try { return 합치기(JSON.parse(r.body).items ?? []); } catch { return null; }
}

async function 떼로(일들, 폭 = 3) {
  const 답 = [];
  for (let i = 0; i < 일들.length; i += 폭) {
    답.push(...await Promise.all(일들.slice(i, i + 폭).map((f) => f())));
  }
  return 답;
}

if (내가실행됐다) {
  fs.mkdirSync(path.dirname(결과길), { recursive: true });

  /** 🔴 8/13 — 두 번 죽었다(질의 매달림 · 시간 초과). **가다 죽어도 이어서 하게** 중간에 적는다 */
  const 중간길 = 'archive/raw/wikipedia/sea-celebrities.partial.json';
  const 이미 = fs.existsSync(중간길)
    ? new Map(Object.entries(JSON.parse(fs.readFileSync(중간길, 'utf8'))))
    : new Map();
  if (이미.size) console.log(`⭐ 지난번에 잰 ${이미.size}명을 이어받는다\n`);

  console.log('① 언어판 밑값 — 🔴 선수 자료와 같은 창을 쓴다');
  const 밑 = {};
  for (const p of 잴판) {
    밑[p] = await 밑값(p);
    console.log(`   ${p.padEnd(3)} ${밑[p] ? 밑[p].toLocaleString('en-US') : '⛔ 못 쟀다'}`);
  }

  console.log('\n② 갈래 × 언어판으로 나눠 묻는다 (한 질의에 다 넣으면 매달려 죽는다)');
  const 사람 = new Map();
  for (const g of 갈래) {
    const 셈 = [];
    for (const p of 잴판) {
      let 받은 = 0;
      let 막힘 = false;
      for (let 쪽 = 0; 쪽 < 40; 쪽 += 1) {          /* 40쪽 = 최대 20,000명. 넉넉하다 */
        const 줄들 = await 스파클(질의만들기(g.q, p, 쪽));
        if (줄들 === null) { 막힘 = true; break; }
        for (const 줄 of 줄들) {
          const q = 줄.p.value.split('/').pop();
          if (!사람.has(q)) 사람.set(q, { q, name: 줄.pLabel?.value ?? q, kinds: [], titles: {} });
          const 그 = 사람.get(q);
          if (!그.kinds.includes(g.key)) 그.kinds.push(g.key);
          const t = 제목뽑기(줄.a?.value, p);
          if (t) 그.titles[p] = t;
        }
        받은 += 줄들.length;
        if (줄들.length < 쪽크기) break;            /* 마지막 쪽이다 */
      }
      셈.push(`${p} ${받은}${막힘 ? '⛔' : ''}`);
    }
    console.log(`   ${g.label.padEnd(12)} ${셈.join(' · ')}`);
  }

  const 잴사람 = [...사람.values()].filter((x) => 동남아.some((p) => x.titles[p]));
  console.log(`\n③ 어느 판에든 문서가 있는 ${사람.size}명 중 **동남아 판**에 있는 ${잴사람.length}명`);

  console.log('\n④ 조회수 — 12개월 · 동남아 넷만');
  let 센 = 0;
  const 새로잰것 = new Map(이미);
  const 적어두기 = () => fs.writeFileSync(중간길, JSON.stringify(Object.fromEntries(새로잰것)));
  const 줄들 = await 떼로(잴사람.map((x) => async () => {
    if (새로잰것.has(x.q)) { 센 += 1; return 새로잰것.get(x.q); }
    const views = {};
    for (const p of 잴판) views[p] = x.titles[p] ? await 조회수(p, x.titles[p]) : null;
    센 += 1;
    const perMillion = {};
    for (const p of 잴판) {
      perMillion[p] = views[p] === undefined ? undefined : 백만분율(views[p], 밑[p]);
    }
    const 못잰것있나 = 동남아.some((p) => views[p] === undefined);
    const 줄 = {
      q: x.q,
      name: x.name,
      kinds: x.kinds,
      titles: x.titles,
      views,
      perMillion,
      seaEditionsWithArticle: 문서있는판({ views }),
      seaPerMillionTotal: 못잰것있나 ? null
        : +동남아.reduce((a, p) => a + (perMillion[p] ?? 0), 0).toFixed(2),
    };
    새로잰것.set(x.q, 줄);
    if (센 % 50 === 0) { 적어두기(); process.stdout.write(`   ${센}/${잴사람.length} (적어 뒀다)\n`); }
    return 줄;
  }), 3);
  적어두기();

  const 잰것 = 줄들.filter((x) => x.seaPerMillionTotal !== null);
  const 못잰것 = 줄들.filter((x) => x.seaPerMillionTotal === null);
  잰것.sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);

  const out = {
    generated: 지금(),
    source: 'Wikidata (CC0) for people and article links; Wikimedia Pageviews API for reads',
    window: '2025-08 through 2026-07, 12 months, human traffic only',
    comparableWith: 'archive/raw/wikipedia/sea-athletes.json — same editions, same window, same unit',
    editionsSea: 동남아,
    editionTotals: 밑,
    kindsCounted: 갈래.map((g) => g.key),
    whatWasLeftOut: 'Idol, rapper and model were dropped as separate Wikidata occupations. Almost '
      + 'everyone carrying them also carries singer, so they cost query time without adding people. '
      + 'A Korean celebrity who is recorded only as an idol and never as a singer or actor is '
      + 'therefore absent from this panel.',
    peopleFound: 사람.size,
    peopleMeasured: 잰것.length,
    peopleNotMeasured: 못잰것.length,
    people: 잰것,
    couldNotMeasure: 못잰것.map((x) => ({ q: x.q, name: x.name, kinds: x.kinds })),
  };
  fs.writeFileSync(결과길, `${JSON.stringify(out, null, 2)}\n`);

  if (실패셈.size) console.log(`\n⚠ 다시 물은 응답 — ${[...실패셈].map(([c, n]) => `${c}:${n}`).join(' · ')}`);
  console.log(`\n⭐ ${결과길}`);
  console.log(`   사람 ${사람.size}명 · 잰 사람 ${잰것.length}명 · 못 잰 사람 ${못잰것.length}명`);
  console.log('\n동남아 백만분율 합이 큰 순 (선수 맨 위는 손흥민 342.3)');
  for (const x of 잰것.slice(0, 30)) {
    console.log(`   ${x.name.padEnd(24)} ${String(x.seaPerMillionTotal).padStart(8)}  `
      + `${동남아.map((p) => `${p} ${x.perMillion[p] ?? '—'}`).join(' · ')}  [${x.kinds.join(',')}]`);
  }
}
