#!/usr/bin/env node
/**
 * **명품·패션·자동차 브랜드는 스타만큼 읽히나** — 사장님 지시(8/13).
 *   「패션 브랜드, 명품 엠베서더 등도 먹히는 콘텐트인지 분석하고」
 *   「자동차까지 스타들의 일거수일투족이 모두 팬들은 궁금해할테니까」
 *
 * ── 🔴 먼저 못 하는 것을 적는다 ────────────────────────────────
 *   **Wikidata 에 「앰배서더」 관계가 없다.** 실물로 찾아봤고 0건이었다.
 *   그래서 「누가 어느 브랜드의 얼굴인가」는 이 자료로 **못 잰다.**
 *   ⛔ 못 재는 것을 재는 척하지 않는다. 대신 잴 수 있는 것을 잰다 —
 *   ⭐ **브랜드 문서가 그 나라에서 얼마나 읽히는가.** 스타와 같은 자에 올려놓으면
 *      「브랜드 이야기가 스타 이야기만큼 사람을 끄는가」에 답할 수 있다.
 *
 * ── ⛔ 지키는 것 ──────────────────────────────────────────────
 * ⛔ Q번호를 **기억으로 찍지 않는다.** 오늘 두 번 틀렸다(Q483076 은 러시아 사람, Q3181 은 폴란드 교회).
 *    아래 목록은 en 위키 문서 이름으로 **실물에서 받아 온 것**이다.
 * ⛔ 브랜드를 줄세우지 않는다. 스타와 **나란히** 놓고 크기를 견준다.
 * 🔴 선수·배우·가수와 **같은 자** — 같은 언어판 넷, 같은 12개월, 같은 백만분율.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 동남아, 백만분율, 합치기, 문서있는판 } from './collect-sea-athletes.mjs';
import { 지금 } from './_kst.mjs';

const 결과길 = 'archive/raw/wikipedia/sea-brands.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 처음 = '20250801';
const 끝 = '20260731';
const 하드시한 = 60000;

/**
 * ⭐ 전부 en 위키 문서 이름으로 **실물에서 받은** Q번호다(2026-08-13).
 *   `_probe-luxury-brands.mjs` 가 그 일을 했다. ⛔ 여기에 손으로 Q번호를 더하지 않는다.
 */
export const 브랜드 = [
  { q: 'Q218115', name: 'Chanel', kind: 'luxury' },
  { q: 'Q542767', name: 'Dior', kind: 'luxury' },
  { q: 'Q191485', name: 'Louis Vuitton', kind: 'luxury' },
  { q: 'Q178516', name: 'Gucci', kind: 'luxury' },
  { q: 'Q193136', name: 'Prada', kind: 'luxury' },
  { q: 'Q843887', name: 'Hermès', kind: 'luxury' },
  { q: 'Q390107', name: 'Burberry', kind: 'luxury' },
  { q: 'Q1530892', name: 'Balenciaga', kind: 'luxury' },
  { q: 'Q926575', name: 'Fendi', kind: 'luxury' },
  { q: 'Q894874', name: 'Bottega Veneta', kind: 'luxury' },
  { q: 'Q538587', name: 'Cartier', kind: 'jewellery' },
  { q: 'Q1066858', name: 'Tiffany & Co.', kind: 'jewellery' },
  { q: 'Q752515', name: 'Bulgari', kind: 'jewellery' },
  { q: 'Q62288', name: 'Rolex', kind: 'jewellery' },
  { q: 'Q214800', name: 'Calvin Klein', kind: 'fashion' },
  { q: 'Q136687', name: 'Tommy Hilfiger', kind: 'fashion' },
  { q: 'Q55931', name: 'Hyundai Motor Company', kind: 'car-korean' },
  { q: 'Q35349', name: 'Kia', kind: 'car-korean' },
  { q: 'Q21451523', name: 'Genesis Motor', kind: 'car-korean' },
  { q: 'Q36008', name: 'Mercedes-Benz', kind: 'car' },
  { q: 'Q26678', name: 'BMW', kind: 'car' },
  { q: 'Q40993', name: 'Porsche', kind: 'car' },
];

/** 🔴 못 재는 것 — 자료에 그대로 싣는다 */
export const 못재는것 = 'Wikidata records no ambassador or endorsement relation between people and '
  + 'brands. We checked and found none in use. So this cannot say who fronts which house. It '
  + 'measures how much a brand is read about, next to how much a person is read about, on one scale.';

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('🔴 사람 자료와 같은 언어판', 동남아, ['id', 'vi', 'th', 'ms']);
  재본다('🔴 같은 백만분율 셈', 백만분율(5086, 50430364), 100.85);
  재본다('브랜드 스물 넘는다', 브랜드.length >= 20, true);
  재본다('Q번호가 안 겹친다', 브랜드.length, new Set(브랜드.map((b) => b.q)).size);
  재본다('이름이 안 겹친다', 브랜드.length, new Set(브랜드.map((b) => b.name)).size);
  재본다('모든 Q번호가 Q 로 시작하고 숫자다',
    브랜드.every((b) => /^Q\d+$/.test(b.q)), true);
  재본다('한국 차가 들어 있다 — 사장님이 자동차를 말씀하셨다',
    브랜드.filter((b) => b.kind === 'car-korean').length, 3);
  재본다('⛔ 못 재는 것을 적어 뒀다', 못재는것.includes('no ambassador'), true);
  재본다('못 잰 것은 0 이 아니다', 백만분율(null, 1000), null);
  console.log(`브랜드 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

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
          온전한가: res.complete,
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

if (내가실행됐다) {
  console.log(`브랜드 ${브랜드.length}개 — 🔴 ${못재는것.slice(0, 70)}…\n`);

  console.log('① 언어판 밑값 — 사람 자료와 같은 창');
  const 밑 = {};
  for (const p of 동남아) {
    밑[p] = await 밑값(p);
    console.log(`   ${p.padEnd(3)} ${밑[p] ? 밑[p].toLocaleString('en-US') : '⛔ 못 쟀다'}`);
  }

  console.log('\n② 문서 제목 받기');
  const 고리 = 동남아.map((p) => `
    OPTIONAL { ?a_${p} schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> . }`).join('');
  const 줄들 = await 스파클(`SELECT ?p ${동남아.map((p) => `?a_${p}`).join(' ')} WHERE {
    VALUES ?p { ${브랜드.map((b) => `wd:${b.q}`).join(' ')} }${고리}
  }`);
  if (줄들 === null) { console.error('⛔ 문서 제목을 못 받았다'); process.exit(1); }
  const 제목 = new Map();
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

  console.log('\n③ 조회수 — 12개월');
  const 결과 = [];
  for (const b of 브랜드) {
    const t = 제목.get(b.q) ?? {};
    const views = {};
    for (const p of 동남아) views[p] = t[p] ? await 조회수(p, t[p]) : null;
    const perMillion = {};
    for (const p of 동남아) perMillion[p] = views[p] === undefined ? undefined : 백만분율(views[p], 밑[p]);
    const 못잰것있나 = 동남아.some((p) => views[p] === undefined);
    결과.push({
      ...b,
      titles: t,
      views,
      perMillion,
      seaEditionsWithArticle: 문서있는판({ views }),
      seaPerMillionTotal: 못잰것있나 ? null
        : +동남아.reduce((a, p) => a + (perMillion[p] ?? 0), 0).toFixed(2),
    });
    process.stdout.write(`   ${b.name.padEnd(24)} ${결과[결과.length - 1].seaPerMillionTotal ?? '⛔'}\n`);
  }

  const 잰것 = 결과.filter((x) => x.seaPerMillionTotal !== null)
    .sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);

  fs.writeFileSync(결과길, `${JSON.stringify({
    generated: 지금(),
    source: 'Wikidata (CC0) for article links; Wikimedia Pageviews API for reads',
    window: '2025-08 through 2026-07, 12 months, human traffic only',
    comparableWith: 'sea-athletes.json · sea-actors.json · sea-musicians.json — same editions, '
      + 'same window, same unit',
    panel: 'Luxury, fashion, jewellery and car brands, chosen by name and resolved to Wikidata items',
    cannotAnswer: 못재는것,
    editionsSea: 동남아,
    editionTotals: 밑,
    brandsMeasured: 잰것.length,
    brandsNotMeasured: 결과.length - 잰것.length,
    people: 잰것,
  }, null, 2)}\n`);

  console.log(`\n⭐ ${결과길} — 잰 것 ${잰것.length}/${결과.length}`);
  console.log('\n🔴 견줄 자리 — 손흥민 342.3 · 고윤정 273.1\n');
  for (const x of 잰것) {
    console.log(`   ${x.name.padEnd(24)} ${String(x.seaPerMillionTotal).padStart(8)}  `
      + `${동남아.map((p) => `${p} ${x.perMillion[p] ?? '—'}`).join(' · ')}  [${x.kind}]`);
  }
}
