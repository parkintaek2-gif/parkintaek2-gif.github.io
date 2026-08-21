#!/usr/bin/env node
/**
 * build-wikitip-day-pillar-groups.mjs — 이름이 알려진 그룹 멤버가 **일간 열 칸에 어떻게 흩어지나.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 만 명을 세어 「우연과 구분되지 않는다」를 내면 맞는 말이지만 **아무도 자기 이야기로 안 읽는다.**
 * 사람이 아는 이름으로 같은 말을 한 번 더 한다 —
 * 「BTS 일곱이 열 칸 중 여섯 칸에 흩어져 있다」가 표 한 줄보다 세다.
 *
 * ── 🔴 첫 판을 버린 까닭 (2026-08-22 08:2x) ───────────────────
 * 처음엔 **영문 이름 글자로** 명단에서 찾았다. 그랬더니 BLACKPINK 의 «Lisa» 가
 * **1980년생 다른 사람**에게 붙었다(진짜 리사는 1997년생 태국 국적이라 한국 국적 명단에 없다).
 * ⛔ 한 글자 이름(모노님)은 이 방식으로 절대 못 가른다. 그대로 냈으면 **틀린 생년월일이
 *   활자로** 나갔다. 그래서 **이름으로 안 찾는다 — 위키데이터 소속(P463)으로 찾는다.**
 *
 * ⛔ 손으로 값을 적지 않는다. 물어서 적는다.
 * ⛔ 한국 국적이 아닌 멤버는 **그렇다고 적는다.** 빼거나 채우지 않는다.
 * ⚠ 그룹을 **우리가 골랐다.** 무작위 표본이 아니라는 것을 지면에 밝힌다.
 *
 * 쓰는 법  node scripts/build-wikitip-day-pillar-groups.mjs
 *          node scripts/build-wikitip-day-pillar-groups.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 일주 } from './lib/일주.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자료 = path.join(뿌리, 'src/data/wikitip-star-daypillar.json');

/** 볼 그룹 — **위키데이터 Q번호로 못박는다.** 이름 글자로 찾지 않는다(리사 사고) */
export const 그룹 = {
  BTS: 'Q13580495',
  Blackpink: 'Q25056945',
};

const 머리말 = {
  'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)',
  Accept: 'application/sparql-results+json',
};

/**
 * 소속으로 멤버를 묻는다 — **양쪽 다** 본다. 국적(P27)과 생년월일 정밀도까지 같이 받는다.
 *
 * 🔴 2026-08-22 08:3x — 처음엔 `?m rdfs:label ?name . FILTER(LANG = "en")` 로 이름을 받았다.
 *   그랬더니 **영문 라벨이 없는 사람이 조용히 빠졌다** — BLACKPINK 의 로제(Q27655344)가
 *   그렇게 넷에서 셋이 됐다. 「없는 사람」이 아니라 「이름표가 없는 사람」이었다.
 *   ⇒ 라벨은 `SERVICE wikibase:label` 에 맡긴다(없으면 Q번호가 그대로 온다 — 빠지지 않는다).
 * 🔴 그리고 소속이 사람→그룹(P463)으로만 적힌 것이 아니라 그룹→사람(P527)으로만 적힌
 *   경우가 있다. 한쪽만 보면 그만큼 빠진다. 둘을 합집합으로 본다.
 * 🔴 그리고 세 번째 구멍 — **정밀도가 낮은 옛 진술을 집었다.** 로제(Q27655344)는 P569 가
 *   `+1997-02-11`(precision 11)로 적혀 있는데, 같은 사람에게 정밀도 낮은 진술이 하나 더 있어
 *   우리 자가 그것을 집고 「달까지만 적혀 있다」로 셌다. **못 잰 것이 아니라 잘못 집은 것이다.**
 *   ⇒ ① 질의에서 `wikibase:BestRank` 만 받고 ② 같은 사람이 여러 줄로 와도 **정밀도가 높은
 *      쪽으로 올려** 잡는다.
 */
export const 질의만들기 = (q) => `
SELECT ?m ?mLabel ?alias ?koLabel ?b ?prec ?citLabel WHERE {
  { ?m wdt:P463 wd:${q} } UNION { wd:${q} wdt:P527 ?m }
  ?m wdt:P31 wd:Q5 .
  ?m p:P569 ?st . ?st a wikibase:BestRank ;
     psv:P569 [ wikibase:timeValue ?b ; wikibase:timePrecision ?prec ] .
  OPTIONAL { ?m wdt:P27 ?cit . }
  OPTIONAL { ?m skos:altLabel ?alias . FILTER(LANG(?alias) = "en") }
  OPTIONAL { ?m rdfs:label ?koLabel . FILTER(LANG(?koLabel) = "ko") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

/** 받은 줄 → 멤버 한 줄씩. 날까지 없으면 일간을 세우지 않는다 */
export function 줄정리(줄들) {
  const 본것 = new Map();
  for (const b of 줄들 ?? []) {
    const q = b.m.value.split('/').pop();
    const prec = Number(b.prec.value);
    const 국적 = b.citLabel?.value ?? null;
    /* 이름표 — 영문 라벨 → 영문 별칭 → 한국어 라벨 → Q번호. **사람을 빠뜨리지 않는다** */
    const 이름 = (b.mLabel?.value && b.mLabel.value !== q ? b.mLabel.value : null)
      ?? b.alias?.value ?? b.koLabel?.value ?? q;
    const 앞 = 본것.get(q);
    if (앞) {
      if (국적 && !앞.citizenships.includes(국적)) 앞.citizenships.push(국적);
      if (prec <= 앞.prec) continue;      /* 정밀도가 낮은 줄은 버린다 — 올려서만 잡는다 */
    }
    const 날 = prec >= 11 ? b.b.value.slice(0, 10) : null;
    const j = 날 ? 일주(날) : null;
    본것.set(q, {
      q, member: 이름, born: 날, prec,
      dayPillar: j?.일주한자 ?? null, stem: j?.일간한자 ?? null,
      citizenships: 앞?.citizenships ?? (국적 ? [국적] : []),
      note: 날 ? null : 'date of birth recorded only to the month or year',
    });
  }
  const 멤버 = [...본것.values()].sort((a, b) => (a.born ?? '').localeCompare(b.born ?? ''));
  return {
    members: 멤버,
    found: 멤버.filter((m) => m.stem).length,
    withoutDay: 멤버.filter((m) => !m.stem).length,
    distinctStems: new Set(멤버.filter((m) => m.stem).map((m) => m.stem)).size,
    nonKorean: 멤버.filter((m) => m.citizenships.length && !m.citizenships.includes('South Korea')).length,
  };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 줄 = (q, name, b, prec, cit) => ({
    m: { value: 'http://www.wikidata.org/entity/' + q }, mLabel: { value: name },
    b: { value: b }, prec: { value: String(prec) },
    ...(cit ? { citLabel: { value: cit } } : {}),
  });
  const r = 줄정리([
    줄('Q1', 'Jungkook', '1997-09-01T00:00:00Z', 11, 'South Korea'),
    줄('Q2', 'Jimin', '1995-10-13T00:00:00Z', 11, 'South Korea'),
    줄('Q3', 'Lisa', '1997-03-27T00:00:00Z', 11, 'Thailand'),
    줄('Q4', 'Nameless', '1990-01-01T00:00:00Z', 9),
    줄('Q1', 'Jungkook', '1997-09-01T00:00:00Z', 11, 'Japan'),  /* 같은 사람 두 줄 — 국적만 더 붙는다 */
  ]);
  검('같은 사람을 두 번 안 센다', r.members.length === 4);
  검('국적이 여럿이면 모아 둔다', r.members.find((m) => m.q === 'Q1').citizenships.length === 2);
  검('일간을 세운다', r.members.find((m) => m.member === 'Jungkook').dayPillar === '丙午');
  검('날까지 없으면 일간을 안 세운다', r.members.find((m) => m.member === 'Nameless').stem === null);
  검('못 세운 사람을 따로 센다', r.withoutDay === 1 && r.found === 3);
  검('⛔ 한국 국적이 아닌 사람을 세어 둔다(리사 사고)', r.nonKorean === 1);
  검('서로 다른 일간 칸을 센다', r.distinctStems === 3);
  /* 🔴 로제 사고 — 정밀도 낮은 줄이 먼저 와도 높은 쪽으로 올려 잡아야 한다 */
  const r2 = 줄정리([
    줄('Q9', 'Rose', '1997-01-01T00:00:00Z', 9, 'South Korea'),
    줄('Q9', 'Rose', '1997-02-11T00:00:00Z', 11, 'South Korea'),
  ]);
  검('정밀도가 높은 줄로 올려 잡는다', r2.members[0].born === '1997-02-11' && r2.found === 1);
  검('올려 잡아도 국적을 안 잃는다', r2.members[0].citizenships.includes('South Korea'));
  검('질의는 소속 양쪽(P463·P527)으로 찾는다',
    질의만들기('Q1').includes('wdt:P463') && 질의만들기('Q1').includes('wdt:P527'));
  검('⛔ 이름 글자로 사람을 찾지 않는다(리사 사고)', !/rdfs:label\s+"/.test(질의만들기('Q1')));
  검('가장 잘 매겨진 생년월일만 읽는다(로제 사고)', 질의만들기('Q1').includes('wikibase:BestRank'));
  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ build-wikitip-day-pillar-groups 자가시험 통과 (12)');
  process.exit(0);
}

const 낸것 = {};
for (const [이름, q] of Object.entries(그룹)) {
  const u = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(질의만들기(q));
  let 줄들;
  for (let i = 0; i < 4 && !줄들; i++) {
    try {
      const r = await fetch(u, { headers: 머리말 });
      if (r.ok) 줄들 = (await r.json()).results.bindings;
      else if (r.status !== 429 && r.status < 500) break;
    } catch { /* 되묻는다 */ }
    if (!줄들) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  if (!줄들) { console.error(`❌ ${이름}(${q}) — 못 물었다. 「없다」로 안 적는다`); process.exit(1); }
  낸것[이름] = { wikidata: q, ...줄정리(줄들) };
  await new Promise((r) => setTimeout(r, 1200));
}

const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
d.groupSpotChecks = {
  weChose: 'We picked these two groups because their names are widely known, not by sampling. Members are resolved by Wikidata membership in both directions (P463 and P527), never by matching a stage name: an earlier version of this table attached BLACKPINK\'s Lisa to a different person born in 1980. Where an item carries no English label we fall back to an English alias and then to the Korean label, so nobody is dropped for want of a name. Only best-ranked birth dates are read, because an older low-precision statement had us report one member as undated when her date is on record to the day.',
  groups: 낸것,
};
fs.writeFileSync(자료, JSON.stringify(d, null, 1));

for (const [이름, r] of Object.entries(낸것)) {
  console.log(`${이름} — 멤버 ${r.members.length} · 일간 세운 사람 ${r.found} · 서로 다른 칸 ${r.distinctStems} · 한국 국적 아닌 사람 ${r.nonKorean}`);
  for (const m of r.members) console.log(`   ${m.member.padEnd(16)} ${m.born ?? '—'}  ${m.dayPillar ?? m.note}  [${m.citizenships.join('/') || '국적 없음'}]`);
}
console.log(`\n✅ ${path.relative(뿌리, 자료)} 에 groupSpotChecks 를 다시 넣었다`);
