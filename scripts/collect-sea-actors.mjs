#!/usr/bin/env node
/**
 * **연예인은 선수보다 높은가** — 사장님 물음(8/13).
 *
 * 🔴 왜 이렇게 짓나 — Wikidata 에 「한국 배우 전부」를 물었더니 **네 번 죽었다**
 *   (질의 매달림 · 96KB 잘림 · 시간 초과 · 안 풀린 약속). 질의가 너무 무겁다.
 *   ⭐ 그런데 나는 이미 **배우 1,355명의 Q번호**를 갖고 있다
 *      (`korean-people.json` — 넷플릭스 차트에 오른 한국 작품의 출연진).
 *      Q번호를 **주고** 묻는 질의는 가볍다. 무거운 쪽은 「전부 찾아 줘」다.
 *
 * ⭐ 덤이 하나 더 있다 — 이 1,355명은 우리가 이미 다른 지면에서 쓰는 그 사람들이다.
 *    선수와 견주면서 **우리 기존 자료와도 이어진다.**
 * ⚠ ⛔ 그 대신 이 명단은 **넷플릭스 차트에 오른 작품의 배우**다. 한국 연예인 전부가 아니다.
 *    아이돌·가수 중 그 작품에 안 나온 사람은 여기 없다. 그 말을 자료에 담는다.
 *
 * 🔴 선수와 **같은 자**를 쓴다 — 같은 언어판 넷, 같은 12개월, 같은 백만분율.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 동남아, 백만분율, 합치기, 문서있는판 } from './collect-sea-athletes.mjs';
import { 지금 } from './_kst.mjs';

const 사람길 = 'archive/raw/wikidata/korean-people.json';
const 결과길 = 'archive/raw/wikipedia/sea-actors.json';
const 중간길 = 'archive/raw/wikipedia/sea-actors.partial.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 처음 = '20250801';
const 끝 = '20260731';
const 하드시한 = 60000;

/** 한 번에 몇 명을 묻나 — Q번호를 주고 묻는 질의라 가볍다 */
export const 덩이 = 120;

/** ⛔ 명단이 무엇인지 잊지 않는다 */
export const 명단설명 = 'Korean actors credited on a title that reached a Netflix country chart';

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
  재본다('못 잰 것은 0 이 아니다', 백만분율(null, 1000), null);
  재본다('문서 없음과 0 을 안 섞는다',
    문서있는판({ views: { id: 0, vi: null, th: 5, ms: undefined } }), 2);
  재본다('덩이가 너무 크지 않다 — 무거우면 또 죽는다', 덩이 <= 200, true);
  console.log(`배우 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/** 🔴 하드 시한 — `req.setTimeout` 은 소켓이 조용할 때만 걸린다. 그것만 믿다 죽었다 */
function 받기(host, 길) {
  return new Promise((resolve) => {
    let 끝났나 = false;
    const 한번만 = (v) => { if (!끝났나) { 끝났나 = true; clearTimeout(시한); resolve(v); } };
    const 시한 = setTimeout(() => {
      try { req.destroy(); } catch { /* 이미 죽었다 */ }
      한번만({ code: 0, body: '', 온전한가: false });
    }, 하드시한);
    const req = https.request({ host, path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } },
      (res) => {
        const 조각 = [];
        res.on('data', (c) => { 조각.push(c); });
        res.on('end', () => 한번만({
          code: res.statusCode,
          body: Buffer.concat(조각).toString('utf8'),
          온전한가: res.complete,        /* ⛔ 잘린 응답을 받아 쓰지 않는다 */
        }));
      });
    req.on('error', () => 한번만({ code: 0, body: '', 온전한가: false }));
    req.setTimeout(30000, () => { req.destroy(); 한번만({ code: 0, body: '', 온전한가: false }); });
    req.end();
  });
}

async function 스파클(질의) {
  for (let 번 = 0; 번 < 5; 번 += 1) {
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(질의)}`);
    if (r.code === 200 && r.온전한가) {
      try { return JSON.parse(r.body).results.bindings; } catch { /* 다시 */ }
    }
    await new Promise((s) => { setTimeout(s, 3000 * (번 + 1)); });
  }
  return null;
}

async function 조회수(판, 제목) {
  const 길 = `/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/`
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/${처음}/${끝}`;
  for (let 번 = 0; 번 < 4; 번 += 1) {
    const r = await 받기('wikimedia.org', 길);
    if (r.code === 404) return null;
    if (r.code === 200 && r.온전한가) {
      try { return 합치기(JSON.parse(r.body).items ?? []); } catch { /* 다시 */ }
    }
    await new Promise((s) => { setTimeout(s, 800 * (2 ** 번)); });
  }
  return undefined;
}

async function 밑값(판) {
  const 길 = `/api/rest_v1/metrics/pageviews/aggregate/${판}.wikipedia/all-access/user/monthly/${처음}/${끝}`;
  const r = await 받기('wikimedia.org', 길);
  if (r.code !== 200 || !r.온전한가) return null;
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
  const 사람 = JSON.parse(fs.readFileSync(사람길, 'utf8')).사람;
  console.log(`명단 ${사람.length}명 — ${명단설명}\n`);

  console.log('① 언어판 밑값 — 🔴 선수 자료와 같은 창');
  const 밑 = {};
  for (const p of 동남아) {
    밑[p] = await 밑값(p);
    console.log(`   ${p.padEnd(3)} ${밑[p] ? 밑[p].toLocaleString('en-US') : '⛔ 못 쟀다'}`);
  }

  console.log('\n② Q번호를 **주고** 문서 제목을 묻는다 (무거운 쪽은 「전부 찾아 줘」다)');
  const 제목 = new Map();
  let 막힌덩이 = 0;
  for (let i = 0; i < 사람.length; i += 덩이) {
    const 이번 = 사람.slice(i, i + 덩이);
    const 고리 = 동남아.map((p) => `
    OPTIONAL { ?a_${p} schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> . }`).join('');
    const 줄들 = await 스파클(`SELECT ?p ${동남아.map((p) => `?a_${p}`).join(' ')} WHERE {
      VALUES ?p { ${이번.map((x) => `wd:${x.q}`).join(' ')} }${고리}
    }`);
    if (줄들 === null) { 막힌덩이 += 1; process.stdout.write(`   ${i + 이번.length}/${사람.length} ⛔\n`); continue; }
    for (const 줄 of 줄들) {
      const q = 줄.p.value.split('/').pop();
      if (!제목.has(q)) 제목.set(q, {});
      for (const p of 동남아) {
        const url = 줄[`a_${p}`]?.value;
        if (!url) continue;
        const 앞 = `https://${p}.wikipedia.org/wiki/`;
        if (url.startsWith(앞)) 제목.get(q)[p] = decodeURIComponent(url.slice(앞.length));
      }
    }
    process.stdout.write(`   ${i + 이번.length}/${사람.length}\n`);
  }
  if (막힌덩이) console.log(`   ⚠ 못 받은 덩이 ${막힌덩이}개 — 그 사람들은 「문서 없음」이 아니라 **모른다**`);

  const 잴사람 = 사람.filter((x) => 동남아.some((p) => 제목.get(x.q)?.[p]));
  console.log(`\n③ ${사람.length}명 중 동남아 판에 문서가 있는 **${잴사람.length}명**`);

  const 이미 = fs.existsSync(중간길)
    ? new Map(Object.entries(JSON.parse(fs.readFileSync(중간길, 'utf8')))) : new Map();
  if (이미.size) console.log(`   ⭐ 지난번에 잰 ${이미.size}명을 이어받는다`);

  console.log('\n④ 조회수 — 12개월 · 동남아 넷');
  let 센 = 0;
  const 모은것 = new Map(이미);
  const 적어두기 = () => fs.writeFileSync(중간길, JSON.stringify(Object.fromEntries(모은것)));
  const 줄들 = await 떼로(잴사람.map((x) => async () => {
    if (모은것.has(x.q)) { 센 += 1; return 모은것.get(x.q); }
    const t = 제목.get(x.q);
    const views = {};
    for (const p of 동남아) views[p] = t[p] ? await 조회수(p, t[p]) : null;
    센 += 1;
    const perMillion = {};
    for (const p of 동남아) perMillion[p] = views[p] === undefined ? undefined : 백만분율(views[p], 밑[p]);
    const 못잰것있나 = 동남아.some((p) => views[p] === undefined);
    const 줄 = {
      q: x.q,
      name: x.name,
      jobs: x.jobs ?? [],
      chartingTitles: x.titles ?? null,
      titles: t,
      views,
      perMillion,
      seaEditionsWithArticle: 문서있는판({ views }),
      seaPerMillionTotal: 못잰것있나 ? null
        : +동남아.reduce((a, p) => a + (perMillion[p] ?? 0), 0).toFixed(2),
    };
    모은것.set(x.q, 줄);
    if (센 % 40 === 0) { 적어두기(); process.stdout.write(`   ${센}/${잴사람.length} (적어 뒀다)\n`); }
    return 줄;
  }), 3);
  적어두기();

  const 잰것 = 줄들.filter((x) => x.seaPerMillionTotal !== null);
  const 못잰것 = 줄들.filter((x) => x.seaPerMillionTotal === null);
  잰것.sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);

  fs.writeFileSync(결과길, `${JSON.stringify({
    generated: 지금(),
    source: 'Wikidata (CC0) for article links; Wikimedia Pageviews API for reads',
    window: '2025-08 through 2026-07, 12 months, human traffic only',
    comparableWith: 'archive/raw/wikipedia/sea-athletes.json — same editions, same window, same unit',
    panel: 명단설명,
    panelCaveat: 'This is not every Korean celebrity. It is the cast of Korean titles that reached a '
      + 'Netflix country chart, which is the panel the rest of our data is built on. A singer or '
      + 'idol who never appeared in one of those titles is not here.',
    editionsSea: 동남아,
    editionTotals: 밑,
    peopleInPanel: 사람.length,
    peopleWithArticle: 잴사람.length,
    peopleMeasured: 잰것.length,
    peopleNotMeasured: 못잰것.length,
    queryChunksLost: 막힌덩이,
    people: 잰것,
    couldNotMeasure: 못잰것.map((x) => ({ q: x.q, name: x.name, titles: x.titles })),
  }, null, 2)}\n`);

  console.log(`\n⭐ ${결과길}`);
  console.log(`   잰 사람 ${잰것.length}명 · 못 잰 사람 ${못잰것.length}명`);
  console.log('\n동남아 백만분율 합이 큰 순 — 🔴 선수 맨 위는 손흥민 342.3, 감독 맨 위는 김상식 137.8');
  for (const x of 잰것.slice(0, 30)) {
    console.log(`   ${x.name.padEnd(24)} ${String(x.seaPerMillionTotal).padStart(8)}  `
      + `${동남아.map((p) => `${p} ${x.perMillion[p] ?? '—'}`).join(' · ')}`);
  }
}
