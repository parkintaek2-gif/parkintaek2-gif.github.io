#!/usr/bin/env node
/**
 * **못맞춤 14편의 한국 작품 Q번호를 찾아 온다.** (`--찾기`)
 *
 * ── 🔴 왜 못 맞췄나 ──────────────────────────────────────────
 *   `collect-korean-titles-keyed.mjs` 는 한국 작품을 **영어 이름표(rdfs:label)** 와
 *   **영어 위키백과 문서명** 둘로만 맞춘다. 그래서 이런 것이 샌다 —
 *
 *     넷플릭스 제목   Undercover
 *     위키데이터 이름표  Undercover (South Korean TV series)   ← 안 맞는다
 *     별칭(altLabel)   Undercover                             ← ⭐ 여기 있었다
 *
 *   ⛔ 「위키데이터에 한국 작품이 없다」가 아니라 **우리가 안 본 칸에 있었다**는 뜻이다.
 *   2번 지시: 「없다는 답이 나오면 **자를 먼저 의심한다**」. 이 자가 그 의심이다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **자동으로 열쇠를 붙이지 않는다.** 후보를 내놓을 뿐이다.
 *    사람이 하나씩 보고 `korean-titles-keyed.json` 에 넣는다.
 *    같은 이름을 여러 나라가 쓰는 것이 애초에 이 문제의 원인이다 —
 *    자동으로 붙이면 **바로 그 실수를 자가 대신 저지른다.**
 * ⛔ **한 편도 빼지 않는다.** 후보가 0이어도 목록에 남긴다.
 * ⚠ 한국이라는 근거를 **둘 다** 받는다 — 제작국(P495=Q884) 또는 원어(P364=Q9176).
 *    드라마는 P495 가 비어 있고 P364 만 있는 것이 흔하다.
 * ⚠ 넷플릭스 표에서 **언제·어디서 떴는지**를 같이 낸다. 후보가 여럿일 때
 *    사람이 고를 근거는 연도다(2014년 드라마인가 2021년 드라마인가).
 *
 * 결과 → docs/5번-못맞춤-후보.md   (사람이 읽고 고르는 표)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 자료 = 'src/data/wikitip-title-ambiguity.json';
const 표방 = 'archive/raw/netflix-top10';
const 결과 = 'docs/5번-못맞춤-후보.md';
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) unconfirmed korean keys';
const SPARQL = 'https://query.wikidata.org/sparql';

/** SPARQL 문자열 안에 제목을 넣는다. ⛔ 따옴표·역슬래시를 안 막으면 질의가 깨진다. */
export function 따옴(글) {
  return String(글).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 한 제목에 대한 질의. 이름표·별칭 **양쪽**을 본다.
 * ⛔ 갈래를 영화·시리즈로 묶어 두는 것은 기존 수집기와 같게 하려는 것이다 —
 *    여기서만 넓히면 두 자의 답이 갈려 어느 쪽이 맞는지 알 수 없게 된다.
 */
export function 질의(제목) {
  const t = 따옴(제목);
  return `SELECT DISTINCT ?w ?name ?year ?an ?ko WHERE {
    VALUES ?cls { wd:Q11424 wd:Q5398426 }
    ?w wdt:P31/wdt:P279* ?cls .
    { ?w wdt:P495 wd:Q884 } UNION { ?w wdt:P364 wd:Q9176 }
    { ?w rdfs:label ?n } UNION { ?w skos:altLabel ?n }
    FILTER(LCASE(STR(?n)) = LCASE("${t}"))
    OPTIONAL { ?w rdfs:label ?name . FILTER(LANG(?name) = 'en') }
    OPTIONAL { ?w rdfs:label ?ko . FILTER(LANG(?ko) = 'ko') }
    OPTIONAL { ?w wdt:P577 ?d . BIND(YEAR(?d) AS ?year) }
    OPTIONAL { ?s schema:about ?w ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?an . }
  } LIMIT 40`;
}

async function 물기(q) {
  for (let 시도 = 0; 시도 < 3; 시도 += 1) {
    try {
      const r = await fetch(SPARQL, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          Accept: 'application/sparql-results+json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ query: q }),
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).results.bindings;
    } catch {
      if (시도 === 2) return null;
      await new Promise((s) => setTimeout(s, 6000));
    }
  }
  return null;
}

/** 같은 Q번호가 여러 줄로 오는 것을 한 줄로 접는다(연도·문서명이 여럿일 수 있다). */
export function 접기(줄들) {
  const 통 = new Map();
  for (const b of 줄들 ?? []) {
    const q = b.w.value.split('/').pop();
    const 것 = 통.get(q) ?? { q, 이름: null, 한글: null, 문서: null, 해: new Set() };
    것.이름 ??= b.name?.value ?? null;
    것.한글 ??= b.ko?.value ?? null;
    것.문서 ??= b.an?.value ?? null;
    if (b.year?.value) 것.해.add(+b.year.value);
    통.set(q, 것);
  }
  return [...통.values()].map((x) => ({ ...x, 해: [...x.해].sort((a, b) => a - b) }));
}

/**
 * 넷플릭스 표에서 이 제목들이 **언제·어디서** 떴는지. 후보를 고르는 근거다.
 *
 * 🔴 2026-08-10 05:2x — 처음에 `country_name`·`week` 로 찾다가 **모든 편이 「0개 시장」**으로 나왔다.
 *   이 저장소의 `countries.ndjson` 은 칸 이름이 **한글**이다(`주`·`국가`·`제목`·`구분`·`시즌`).
 *   ⛔ 0 이 나왔을 때 「안 떴다」로 안 읽고 원자료 한 줄을 열어 봤다. 칸 이름이 틀렸던 것이다.
 *   ⚠ 이 칸이 비면 **Undercover 가 한국 드라마인지 벨기에 시리즈인지 못 가른다** — 있어야 하는 증거다.
 */
export function 표증거(제목집, 읽기 = fs) {
  const 통 = new Map([...제목집].map((t) => [t, {
    나라: new Set(), 구분: new Set(), 첫주: null, 끝주: null, 줄: 0,
  }]));
  const p = path.join(표방, 'countries.ndjson');
  if (!읽기.existsSync(p)) return null;             /* ⛔ 「없다」가 아니라 「못 쟀다」다 */
  for (const 줄 of 읽기.readFileSync(p, 'utf8').split('\n')) {
    if (!줄.trim()) continue;
    let j; try { j = JSON.parse(줄); } catch { continue; }
    const t = j.제목 ?? j.show_title ?? j.title;
    const 것 = 통.get(t);
    if (!것) continue;
    것.줄 += 1;
    const c = j.국가 ?? j.country_name ?? j.country;
    if (c) 것.나라.add(c);
    if (j.구분) 것.구분.add(j.구분);
    const w = j.주 ?? j.week;
    if (w) {
      if (!것.첫주 || w < 것.첫주) 것.첫주 = w;
      if (!것.끝주 || w > 것.끝주) 것.끝주 = w;
    }
  }
  return 통;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('따옴 — 그냥', 따옴('Undercover'), 'Undercover');
  재본다('따옴 — 따옴표', 따옴('He said "no"'), 'He said \\"no\\"');
  재본다('따옴 — 역슬래시', 따옴('a\\b'), 'a\\\\b');
  재본다('질의에 제목이 들어간다', 질의('V.I.P.').includes('LCASE("V.I.P.")'), true);
  재본다('질의가 별칭도 본다', 질의('x').includes('skos:altLabel'), true);
  재본다('질의가 원어도 본다', 질의('x').includes('wdt:P364 wd:Q9176'), true);
  재본다('접기 — 같은 Q를 한 줄로', 접기([
    { w: { value: 'http://www.wikidata.org/entity/Q1' }, year: { value: '2021' } },
    { w: { value: 'http://www.wikidata.org/entity/Q1' }, year: { value: '2021' } },
    { w: { value: 'http://www.wikidata.org/entity/Q2' }, name: { value: 'B' } },
  ]).length, 2);
  재본다('접기 — 연도를 모은다', 접기([
    { w: { value: 'http://www.wikidata.org/entity/Q1' }, year: { value: '2014' } },
    { w: { value: 'http://www.wikidata.org/entity/Q1' }, year: { value: '2012' } },
  ])[0].해, [2012, 2014]);
  재본다('접기 — 빈 것도 견딘다', 접기(null), []);
  재본다('표증거 — 파일이 없으면 null(「없다」가 아니다)', 표증거(new Set(['x']), {
    existsSync: () => false, readFileSync: () => '',
  }), null);
  /* 🔴 이 저장소의 칸 이름은 한글이다. 영어 칸으로 읽으면 조용히 0이 나온다 — 그래서 한글로 잰다. */
  재본다('표증거 — 한글 칸으로 나라·주·구분을 모은다', (() => {
    const r = 표증거(new Set(['A']), {
      existsSync: () => true,
      readFileSync: () => [
        JSON.stringify({ 제목: 'A', 국가: 'South Korea', 주: '2021-05-02', 구분: 'TV' }),
        JSON.stringify({ 제목: 'A', 국가: 'Japan', 주: '2021-04-25', 구분: 'TV' }),
        JSON.stringify({ 제목: 'B', 국가: 'Japan', 주: '2021-04-25', 구분: 'Films' }),
      ].join('\n'),
    }).get('A');
    return {
      줄: r.줄, 나라: [...r.나라].sort(), 구분: [...r.구분], 첫주: r.첫주, 끝주: r.끝주,
    };
  })(), {
    줄: 2, 나라: ['Japan', 'South Korea'], 구분: ['TV'], 첫주: '2021-04-25', 끝주: '2021-05-02',
  });
  재본다('표증거 — 영어 칸 원자료도 아직 읽는다', 표증거(new Set(['A']), {
    existsSync: () => true,
    readFileSync: () => JSON.stringify({ show_title: 'A', country_name: 'Japan', week: '2021-04-25' }),
  }).get('A').나라.size, 1);
  console.log(`못맞춤 후보 찾는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(자료)) { console.error(`⛔ 없다 — ${자료}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 줄선것 = d.koreaUnconfirmedQueue ?? [];
  if (!줄선것.length) { console.log('✅ 못맞춤이 없다'); process.exit(0); }
  console.log(`못맞춤 ${줄선것.length}편 · ${줄선것.reduce((s, x) => s + x.places, 0)}자리 — 하나씩 묻는다\n`);

  const 증거 = 표증거(new Set(줄선것.map((x) => x.title)));
  if (!증거) console.log('⚠ countries.ndjson 이 이 창에 없다 — 표 증거 없이 낸다(못 쟀다는 뜻이다)\n');

  /* `--증거만` — 위키데이터를 다시 안 묻고 **표 증거만** 본다.
     후보를 손으로 가릴 때 「어느 시장에서 떴나」만 다시 보고 싶은 일이 잦다. */
  if (process.argv.includes('--증거만')) {
    if (!증거) { console.error('⛔ 표를 못 읽었다'); process.exit(1); }
    for (const x of 줄선것) {
      const e = 증거.get(x.title);
      console.log(`\n${x.title} — ${x.places}자리 · ${e.줄}줄 · ${[...e.구분].join('/')} · ${e.첫주} ~ ${e.끝주}`);
      console.log(`   ${e.나라.size}개 시장: ${[...e.나라].sort().join(', ')}`);
    }
    process.exit(0);
  }

  const 나온것 = [];
  for (const x of 줄선것) {
    const rows = await 물기(질의(x.title));
    if (rows === null) { console.log(`  ⚠ ${x.title} — 위키데이터를 못 받았다(빼지 않는다)`); 나온것.push({ ...x, 후보: null }); continue; }
    const 후보 = 접기(rows);
    console.log(`  ${후보.length ? '⭐' : '  '} ${x.title.padEnd(28)} 후보 ${후보.length}`);
    나온것.push({ ...x, 후보 });
    await new Promise((s) => setTimeout(s, 700));
  }

  const 줄 = [];
  줄.push('# 5번 — 못맞춤 편의 한국 작품 후보');
  줄.push('');
  줄.push('⛔ **이 파일은 답이 아니라 후보다.** 사람이 하나씩 보고 고른다.');
  줄.push('⛔ 자동으로 붙이지 않는다 — 같은 이름을 여러 나라가 쓰는 것이 이 문제의 원인이다.');
  줄.push('⛔ 후보가 0인 편도 **빼지 않는다.** 그대로 남긴다.');
  줄.push('');
  줄.push(`자가 돈 때 ${new Date().toISOString()} · ${줄선것.length}편 · `
    + `${줄선것.reduce((s, x) => s + x.places, 0)}자리`);
  줄.push('');
  for (const x of 나온것) {
    const e = 증거?.get(x.title);
    줄.push(`## ${x.title} — ${x.places}자리`);
    줄.push('');
    줄.push(`- 위키데이터가 아는 **딴 나라** 작품: ${x.countries.join(', ')}`);
    if (e) {
      줄.push(`- 넷플릭스 표: ${e.줄.toLocaleString('en-US')}줄 · ${e.나라.size}개 시장 · `
        + `${[...e.구분].join('/') || '—'} · ${e.첫주} ~ ${e.끝주}`);
      줄.push(`- 뜬 시장: ${[...e.나라].sort().join(', ')}`);
    } else {
      줄.push('- 넷플릭스 표: ⚠ 이 창에서 **못 쟀다**(archive 가 없다). 「안 떴다」가 아니다.');
    }
    if (x.후보 === null) { 줄.push('- ⚠ **위키데이터를 못 받았다.** 다시 돌린다.'); 줄.push(''); continue; }
    if (!x.후보.length) {
      줄.push('- 🔴 **후보 0** — 이름표에도 별칭에도 없다. 손으로 찾거나, 정말 한국 작품이 아니다.');
      줄.push('');
      continue;
    }
    줄.push('');
    줄.push('| Q번호 | 이름표 | 한국어 | 연도 | 영어 위키백과 |');
    줄.push('|---|---|---|---:|---|');
    for (const c of x.후보) {
      줄.push(`| \`${c.q}\` | ${c.이름 ?? '—'} | ${c.한글 ?? '—'} | ${c.해.join(', ') || '—'} | ${c.문서 ?? '—'} |`);
    }
    줄.push('');
  }
  fs.writeFileSync(결과, `${줄.join('\n')}\n`);

  const 있음 = 나온것.filter((x) => x.후보?.length).length;
  const 없음 = 나온것.filter((x) => x.후보 && !x.후보.length).length;
  const 못받음 = 나온것.filter((x) => x.후보 === null).length;
  console.log(`\n후보 있음 ${있음}편 · 후보 0 ${없음}편 · 못 받음 ${못받음}편 → ${결과}`);
  console.log('⛔ 자동으로 안 붙였다. 사람이 골라 korean-titles-keyed.json 에 넣는다.');
}
