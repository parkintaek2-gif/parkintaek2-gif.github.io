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

const 결과길 = 'archive/raw/wikipedia/sea-celebrities.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';

/** 갈래 — Wikidata 직업 Q번호. ⚠ 선수 자료와 겹치는 사람은 뒤에서 갈라 표시한다 */
export const 갈래 = [
  { key: 'actor', label: 'Actor', q: 'Q33999' },
  { key: 'singer', label: 'Singer', q: 'Q177220' },
  { key: 'idol', label: 'K-pop idol', q: 'Q108163588' },
  { key: 'rapper', label: 'Rapper', q: 'Q2252262' },
  { key: 'model', label: 'Model', q: 'Q4610556' },
];

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
  재본다('갈래 다섯', 갈래.length, 5);
  재본다('배우가 들어 있다', 갈래.some((x) => x.key === 'actor'), true);
  재본다('아이돌이 들어 있다', 갈래.some((x) => x.key === 'idol'), true);
  재본다('못 잰 것은 0 이 아니다', 백만분율(null, 1000), null);
  console.log(`연예인 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

function 받기(host, 길) {
  return new Promise((resolve) => {
    const req = https.request({ host, path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } },
      (res) => { let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ code: res.statusCode, body: b })); });
    req.on('error', (e) => resolve({ code: 0, body: e.message }));
    req.setTimeout(90000, () => { req.destroy(); resolve({ code: 0, body: 'timeout' }); });
    req.end();
  });
}

async function 스파클(질의) {
  for (let 번 = 0; 번 < 3; 번 += 1) {
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(질의)}`);
    if (r.code === 200) return JSON.parse(r.body).results.bindings;
    await new Promise((s) => { setTimeout(s, 3000 * (번 + 1)); });
  }
  return null;
}

/**
 * 🔴 8/13 — 판 여섯을 OPTIONAL 로 한 질의에 넣었더니 배우 6,007명에서 **질의가 매달려 죽었다**
 *   (unsettled top-level await, exit 13). 판마다 따로 묻는다. 하나하나는 가볍다.
 * ⭐ 덤으로 결과가 작아진다 — 그 판에 문서가 **있는 사람만** 돌아오기 때문이다.
 */
function 질의만들기(직업Q, 판) {
  return `SELECT ?p ?pLabel ?a WHERE {
  ?p wdt:P31 wd:Q5 ; wdt:P27 wd:Q884 ; wdt:P106 wd:${직업Q} .
  ?a schema:about ?p ; schema:isPartOf <https://${판}.wikipedia.org/> .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
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
    if (r.code === 200) {
      try { return 합치기(JSON.parse(r.body).items ?? []); } catch { /* 다시 */ }
    }
    실패셈.set(r.code, (실패셈.get(r.code) ?? 0) + 1);
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

  console.log('① 언어판 밑값 — 🔴 선수 자료와 같은 창을 쓴다');
  const 밑 = {};
  for (const p of 모든판) {
    밑[p] = await 밑값(p);
    console.log(`   ${p.padEnd(3)} ${밑[p] ? 밑[p].toLocaleString('en-US') : '⛔ 못 쟀다'}`);
  }

  console.log('\n② 갈래 × 언어판으로 나눠 묻는다 (한 질의에 다 넣으면 매달려 죽는다)');
  const 사람 = new Map();
  for (const g of 갈래) {
    const 셈 = [];
    for (const p of 모든판) {
      const 줄들 = await 스파클(질의만들기(g.q, p));
      if (줄들 === null) { 셈.push(`${p} ⛔`); continue; }
      for (const 줄 of 줄들) {
        const q = 줄.p.value.split('/').pop();
        if (!사람.has(q)) 사람.set(q, { q, name: 줄.pLabel?.value ?? q, kinds: [], titles: {} });
        const 그 = 사람.get(q);
        if (!그.kinds.includes(g.key)) 그.kinds.push(g.key);
        const t = 제목뽑기(줄.a?.value, p);
        if (t) 그.titles[p] = t;
      }
      셈.push(`${p} ${줄들.length}`);
    }
    console.log(`   ${g.label.padEnd(12)} ${셈.join(' · ')}`);
  }

  const 잴사람 = [...사람.values()].filter((x) => 동남아.some((p) => x.titles[p]));
  console.log(`\n③ 어느 판에든 문서가 있는 ${사람.size}명 중 **동남아 판**에 있는 ${잴사람.length}명`);

  console.log('\n④ 조회수 — 12개월');
  let 센 = 0;
  const 줄들 = await 떼로(잴사람.map((x) => async () => {
    const views = {};
    for (const p of 모든판) views[p] = x.titles[p] ? await 조회수(p, x.titles[p]) : null;
    센 += 1;
    if (센 % 50 === 0) process.stdout.write(`   ${센}/${잴사람.length}\n`);
    const perMillion = {};
    for (const p of 모든판) {
      perMillion[p] = views[p] === undefined ? undefined : 백만분율(views[p], 밑[p]);
    }
    const 못잰것있나 = 동남아.some((p) => views[p] === undefined);
    return {
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
  }), 3);

  const 잰것 = 줄들.filter((x) => x.seaPerMillionTotal !== null);
  const 못잰것 = 줄들.filter((x) => x.seaPerMillionTotal === null);
  잰것.sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);

  const out = {
    generated: new Date().toISOString(),
    source: 'Wikidata (CC0) for people and article links; Wikimedia Pageviews API for reads',
    window: '2025-08 through 2026-07, 12 months, human traffic only',
    comparableWith: 'archive/raw/wikipedia/sea-athletes.json — same editions, same window, same unit',
    editionsSea: 동남아,
    editionsCompare: 견줄판,
    editionTotals: 밑,
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
