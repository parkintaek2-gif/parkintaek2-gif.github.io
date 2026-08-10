#!/usr/bin/env node
/**
 * **연예인 자체를 모은다** — 태어난 날 · 시작한 날 · 소속.
 *
 * 🔴 2026-08-10 사장님 — 「**연예인 자체에 대한 데이터를 수집해서 가공할 것**」
 *   2번이 짚은 대로 우리 사람 축은 `actors`·`actor-reach` **둘뿐**이었다.
 *   작품 축은 자료 쉰 개가 넘는데 **이슈는 대부분 사람에게 붙는다.**
 *
 * ── 어디서 받나 ───────────────────────────────────────────────
 *   이미 Q번호가 붙은 **1,355명**이 있다(`korean-cast-joined.json`).
 *   이름으로 다시 맞출 일이 없다 — **열쇠로 바로 묻는다.**
 *
 * ── ⛔ 공개 프로필에 있는 것만 ───────────────────────────────
 * ⛔ 사는 곳 · 가족 · 연락처는 **안 묻는다.** 질의에 그 속성이 아예 없다.
 *   ⭐ 받는 것: 태어난 날(P569) · 활동 시작(P2031) · 소속(P108) · 하는 일(P106) · 태어난 나라(P27)
 *
 * ── 🔴 태어난 시각은 없다 ────────────────────────────────────
 *   사주 여덟 글자는 연·월·일·**시** 넷인데 위키데이터에 시(時)가 없다.
 *   ⛔ 그러니 「이 사람 사주가 이렇다」로 쓰면 **거짓이 된다.**
 *   ⭐ 여럿을 묶어 세는 것은 참이다 — 「한국 배우 몇백 명의 띠가 이렇게 갈린다」.
 *      한 사람을 판정하지 않고 **분포**를 보이는 것이라 우리 강령(서열 안 매김)에도 맞는다.
 *
 * 결과 → archive/raw/wikidata/korean-people.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 붙은것 = 'archive/raw/netflix-top10/korean-cast-joined.json';
const 결과방 = 'archive/raw/wikidata';
const 결과 = path.join(결과방, 'korean-people.json');
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) korean people profiles';
const SPARQL = 'https://query.wikidata.org/sparql';
const 묶음 = 120;

/**
 * 띠 — 태어난 해로만 낸다. **달·날·시가 없어도 참인 유일한 칸**이다.
 * ⚠ 음력 설 앞에 난 사람은 앞 띠다. 그래서 1월·2월생은 **모름**으로 둔다 —
 *   ⛔ 틀린 띠를 채우느니 비워 둔다.
 */
export const 띠이름 = ['Monkey', 'Rooster', 'Dog', 'Pig', 'Rat', 'Ox',
  'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat'];
export function 띠(생일) {
  const m = String(생일 ?? '').match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  const 해 = +m[1]; const 달 = +m[2];
  if (달 <= 2) return null;               /* 설 앞뒤가 갈린다 — 비워 둔다 */
  return 띠이름[해 % 12];
}

/** `1993-05-04T00:00:00Z` → `1993-05-04`. 연도만 있는 것(`1993-01-01T…` 정밀도 9)은 걸러야 한다 */
export function 날짜(값) {
  const m = String(값 ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** 시작 나이 — 데뷔 해에서 태어난 해를 뺀다. 둘 중 하나가 없으면 null */
export function 시작나이(생일, 시작) {
  const a = String(생일 ?? '').slice(0, 4);
  const b = String(시작 ?? '').slice(0, 4);
  if (!/^\d{4}$/.test(a) || !/^\d{4}$/.test(b)) return null;
  const n = +b - +a;
  return (n >= 5 && n <= 80) ? n : null;   /* ⛔ 말이 안 되는 값은 버린다 */
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

/**
 * 🔴 위키데이터는 **연도만 아는 생일**을 `1993-01-01` 로 적어 둔다(정밀도 9).
 *   그대로 읽었더니 1월 1일이 34명 — 하루 평균의 **9.3배**였다.
 *   ⛔ 그 34명은 「1월 1일생」이 아니라 「날을 모르는 사람」이다.
 *   ⚠ 진짜 1월 1일생도 몇은 있겠지만, **가짜가 아홉 배**라 가릴 수 없다. 통째로 「모름」으로 둔다.
 *   ⭐ 자를 안 고치고 지면에 냈으면 「한국 배우는 1월에 많이 난다」는 거짓이 나갔다.
 */
export function 날짜믿을만한가(값) {
  const d = 날짜(값);
  if (!d) return null;
  if (d.slice(5) === '01-01') return null;   /* 연도만 아는 것 — 날을 모른다 */
  return d;
}

export function 질의(큐들) {
  const v = 큐들.map((q) => `wd:${q}`).join(' ');
  return `SELECT ?p ?born ?started ?agencyLabel ?jobLabel WHERE {
    VALUES ?p { ${v} }
    OPTIONAL { ?p wdt:P569 ?born }
    OPTIONAL { ?p wdt:P2031 ?started }
    OPTIONAL { ?p wdt:P108 ?agency }
    OPTIONAL { ?p wdt:P106 ?job }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
  }`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('날짜', 날짜('1993-05-04T00:00:00Z'), '1993-05-04');
  재본다('날짜 — 아니면 null', 날짜(''), null);
  재본다('띠 — 1992-05 는 원숭이', 띠('1992-05-01'), 'Monkey');
  재본다('띠 — 1993-05 는 닭', 띠('1993-05-01'), 'Rooster');
  /* ⛔ 설 앞뒤가 갈리는 달은 비운다 — 틀린 띠를 채우지 않는다 */
  재본다('띠 — 1월생은 모름', 띠('1993-01-20'), null);
  재본다('띠 — 2월생은 모름', 띠('1993-02-20'), null);
  재본다('띠 — 날짜가 없으면 null', 띠(null), null);
  재본다('시작나이', 시작나이('1993-05-04', '2011-07-01'), 18);
  /* 🔴 1월 1일이 하루 평균의 9.3배였다 — 위키데이터가 연도만 알 때 쓰는 자리다 */
  재본다('01-01 은 안 믿는다', 날짜믿을만한가('1993-01-01T00:00:00Z'), null);
  재본다('다른 날은 믿는다', 날짜믿을만한가('1993-01-02T00:00:00Z'), '1993-01-02');
  재본다('시작나이 — 하나가 없으면 null', 시작나이('1993-05-04', null), null);
  재본다('시작나이 — 말이 안 되면 null', 시작나이('1993-05-04', '1995-01-01'), null);
  재본다('질의에 열쇠가 들어간다', 질의(['Q1', 'Q2']).includes('wd:Q1 wd:Q2'), true);
  /* ⛔ 사는 곳·가족·연락처를 안 묻는다 — 그 속성이 질의에 없어야 한다 */
  재본다('⛔ 사는 곳(P551)을 안 묻는다', 질의(['Q1']).includes('P551'), false);
  재본다('⛔ 가족(P26·P40)을 안 묻는다', /P26\b|P40\b/.test(질의(['Q1'])), false);
  console.log(`연예인 모으는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(붙은것)) { console.error(`⛔ 없다 — ${붙은것}`); process.exit(1); }
  const 원 = JSON.parse(fs.readFileSync(붙은것, 'utf8'));
  const 사람 = new Map(Object.entries(원.배우));
  const 큐들 = [...사람.keys()];
  console.log(`열쇠 붙은 사람 ${큐들.length}명 — ${묶음}명씩 묻는다`);

  const 받은것 = new Map();
  let 못받은묶음 = 0;
  for (let i = 0; i < 큐들.length; i += 묶음) {
    const 조각 = 큐들.slice(i, i + 묶음);
    const rows = await 물기(질의(조각));
    if (rows === null) { 못받은묶음 += 1; process.stdout.write('x'); continue; }
    for (const b of rows) {
      const q = b.p.value.split('/').pop();
      const 것 = 받은것.get(q) ?? { q, 태어난날: null, 시작한날: null, 소속: new Set(), 하는일: new Set() };
      것.태어난날 ??= 날짜믿을만한가(b.born?.value);
      것.시작한날 ??= 날짜(b.started?.value);
      if (b.agencyLabel?.value) 것.소속.add(b.agencyLabel.value);
      if (b.jobLabel?.value) 것.하는일.add(b.jobLabel.value);
      받은것.set(q, 것);
    }
    process.stdout.write('.');
    await new Promise((s) => setTimeout(s, 400));
  }
  process.stdout.write('\n');

  const 나온것 = 큐들.map((q) => {
    const r = 받은것.get(q);
    const 이름 = 사람.get(q).이름;
    const 태어난날 = r?.태어난날 ?? null;
    const 시작한날 = r?.시작한날 ?? null;
    return {
      q,
      name: 이름,
      born: 태어난날,
      zodiac: 띠(태어난날),
      startedYear: 시작한날 ? +시작한날.slice(0, 4) : null,
      ageAtStart: 시작나이(태어난날, 시작한날),
      agencies: r ? [...r.소속].sort() : [],
      jobs: r ? [...r.하는일].sort() : [],
      titles: 사람.get(q).작품?.length ?? 0,
    };
  });

  const 있는것 = (f) => 나온것.filter(f).length;
  const out = {
    갱신: new Date().toISOString(),
    출처: 'Wikidata — 이미 Q번호가 붙은 한국 배우 명단에 공개 프로필 속성만 붙였다',
    주의: '⛔ 태어난 **시각**은 위키데이터에 없다. 한 사람의 사주로 쓰면 거짓이 된다. 분포로만 쓴다.',
    안모은것: '사는 곳 · 가족 · 연락처 — 질의에 그 속성이 없다',
    사람수: 나온것.length,
    태어난날있음: 있는것((x) => x.born),
    띠붙음: 있는것((x) => x.zodiac),
    시작한해있음: 있는것((x) => x.startedYear),
    소속있음: 있는것((x) => x.agencies.length),
    못받은묶음,
    사람: 나온것,
  };
  if (!fs.existsSync(결과방)) fs.mkdirSync(결과방, { recursive: true });
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`${out.사람수}명 · 태어난날 ${out.태어난날있음} · 띠 ${out.띠붙음} · 시작한해 ${out.시작한해있음} · 소속 ${out.소속있음}`);
  if (못받은묶음) console.log(`⚠ 못 받은 묶음 ${못받은묶음}개 — 「없다」가 아니라 「못 물었다」다`);
  console.log(`→ ${결과}`);
}
