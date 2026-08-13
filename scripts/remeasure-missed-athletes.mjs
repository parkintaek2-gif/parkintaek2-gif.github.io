#!/usr/bin/env node
/**
 * **못 잰 24명을 다시 잰다.** — 차범근·이동국·이천수가 그 안에 있다.
 *
 * 🔴 이들은 「안 읽히는 사람」이 아니라 **호출이 실패한 사람**이다.
 *   그래서 0 으로 안 세고 따로 빼 뒀다. 이제 그 자리를 메운다.
 * ⛔ 다시 재도 안 되면 다시 `couldNotMeasure` 에 둔다. 억지로 채우지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 동남아, 모든판, 백만분율, 합치기, 문서있는판, 동남아합 } from './collect-sea-athletes.mjs';

const 자료길 = 'archive/raw/wikipedia/sea-athletes.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 처음 = '20250801';
const 끝 = '20260731';

/** 다시 잰 줄을 자료에 되돌려 놓는다. ⛔ 여전히 못 잰 것은 people 로 안 옮긴다 */
export function 되돌리기(자료, 다시잰것) {
  const 성공 = 다시잰것.filter((x) => x.seaPerMillionTotal !== null);
  const 실패 = 다시잰것.filter((x) => x.seaPerMillionTotal === null);
  const 성공q = new Set(성공.map((x) => x.q));
  return {
    ...자료,
    people: [...자료.people, ...성공].sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal),
    couldNotMeasure: (자료.couldNotMeasure ?? []).filter((x) => !성공q.has(x.q))
      .map((x) => ({ q: x.q, name: x.name, sports: x.sports })),
    peopleMeasured: 자료.peopleMeasured + 성공.length,
    peopleNotMeasured: 실패.length,
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 자료 = {
    people: [{ q: 'A', name: 'A', seaPerMillionTotal: 5 }],
    couldNotMeasure: [{ q: 'B', name: 'B', sports: ['football'] }, { q: 'C', name: 'C', sports: ['football'] }],
    peopleMeasured: 1,
    peopleNotMeasured: 2,
  };
  const 뒤 = 되돌리기(자료, [
    { q: 'B', name: 'B', sports: ['football'], seaPerMillionTotal: 9 },
    { q: 'C', name: 'C', sports: ['football'], seaPerMillionTotal: null },
  ]);
  재본다('성공한 사람이 people 로 들어간다', 뒤.people.map((x) => x.q), ['B', 'A']);
  재본다('성공한 사람은 못잰목록에서 빠진다', 뒤.couldNotMeasure.map((x) => x.q), ['C']);
  재본다('⛔ 여전히 못 잰 사람은 people 로 안 옮긴다', 뒤.people.some((x) => x.q === 'C'), false);
  재본다('잰 사람 수가 는다', 뒤.peopleMeasured, 2);
  재본다('못 잰 사람 수가 준다', 뒤.peopleNotMeasured, 1);
  재본다('큰 것부터 선다', 뒤.people[0].seaPerMillionTotal, 9);
  console.log(`다시 재는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/** 🔴 하드 시한 — `req.setTimeout` 은 소켓이 조용할 때만 걸린다. 그것만 믿다 죽은 적이 있다 */
function 받기(host, 길) {
  return new Promise((resolve) => {
    let 끝났나 = false;
    const 한번만 = (v) => { if (!끝났나) { 끝났나 = true; clearTimeout(시한); resolve(v); } };
    const 시한 = setTimeout(() => {
      try { req.destroy(); } catch { /* 이미 죽었다 */ }
      한번만({ code: 0, body: '', 온전한가: false });
    }, 60000);
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

async function 조회수(판, 제목) {
  const 길 = `/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/`
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/${처음}/${끝}`;
  for (let 번 = 0; 번 < 6; 번 += 1) {          /* ⭐ 본 수집보다 더 참는다. 스물넷뿐이다 */
    const r = await 받기('wikimedia.org', 길);
    if (r.code === 404) return null;
    if (r.code === 200 && r.온전한가) {          /* ⛔ 잘린 응답은 안 쓴다 */
      try { return 합치기(JSON.parse(r.body).items ?? []); } catch { /* 다시 */ }
    }
    await new Promise((s) => { setTimeout(s, 1500 * (번 + 1)); });
  }
  return undefined;
}

if (내가실행됐다) {
  const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 못잰 = 자료.couldNotMeasure ?? [];
  if (!못잰.length) { console.log('✅ 못 잰 사람이 없다'); process.exit(0); }
  console.log(`못 잰 ${못잰.length}명을 다시 잰다 — ${못잰.slice(0, 6).map((x) => x.name).join(', ')} …\n`);

  /**
   * ⭐ 제목이 없으면 **여기서 받아 온다.**
   *   처음엔 「수집기를 다시 돌려라」로 끝냈는데, 그건 950명을 40분 다시 재는 일이다.
   *   스물넷의 Q번호를 아는데 전부를 다시 잴 까닭이 없다. 한 번 물으면 된다.
   */
  if (!못잰[0].titles) {
    console.log('⚠ 못잰목록에 제목이 없다 — 스물넷 것만 받아 온다(전체를 다시 안 돈다)\n');
    const 고리 = 모든판.map((p) => `
    OPTIONAL { ?a_${p} schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> . }`).join('');
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(
      `SELECT ?p ${모든판.map((p) => `?a_${p}`).join(' ')} WHERE {
        VALUES ?p { ${못잰.map((x) => `wd:${x.q}`).join(' ')} }${고리}
      }`)}`);
    if (r.code !== 200 || !r.온전한가) { console.error(`⛔ 제목을 못 받았다 — ${r.code}`); process.exit(1); }
    const 줄들 = JSON.parse(r.body).results.bindings;
    const 제목 = new Map();
    for (const 줄 of 줄들) {
      const q = 줄.p.value.split('/').pop();
      if (!제목.has(q)) 제목.set(q, {});
      for (const p of 모든판) {
        const url = 줄[`a_${p}`]?.value;
        if (!url) continue;
        const 앞 = `https://${p}.wikipedia.org/wiki/`;
        if (url.startsWith(앞)) 제목.get(q)[p] = decodeURIComponent(url.slice(앞.length));
      }
    }
    let 붙은 = 0;
    for (const x of 못잰) {
      x.titles = 제목.get(x.q) ?? {};
      if (Object.keys(x.titles).length) 붙은 += 1;
    }
    console.log(`   제목을 붙인 사람 ${붙은}/${못잰.length}\n`);
  }

  const 다시 = [];
  for (const x of 못잰) {
    const views = {};
    for (const p of 모든판) views[p] = x.titles?.[p] ? await 조회수(p, x.titles[p]) : null;
    const perMillion = {};
    for (const p of 모든판) {
      perMillion[p] = views[p] === undefined ? undefined : 백만분율(views[p], 자료.editionTotals[p]);
    }
    const 줄 = {
      ...x, views, perMillion, seaEditionsWithArticle: 문서있는판({ views }),
    };
    줄.seaPerMillionTotal = 동남아합(줄);
    다시.push(줄);
    console.log(`   ${x.name.padEnd(20)} ${줄.seaPerMillionTotal === null ? '⛔ 또 못 쟀다' : 줄.seaPerMillionTotal}`);
  }

  const 뒤 = 되돌리기(자료, 다시);
  fs.writeFileSync(자료길, `${JSON.stringify(뒤, null, 2)}\n`);
  console.log(`\n⭐ 잰 사람 ${자료.peopleMeasured} → ${뒤.peopleMeasured} · 못 잰 사람 ${뒤.peopleNotMeasured}`);
}
