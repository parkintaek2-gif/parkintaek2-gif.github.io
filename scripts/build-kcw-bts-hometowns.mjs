#!/usr/bin/env node
/**
 * build-kcw-bts-hometowns.mjs — **「which BTS member is from Busan」에 답하는 자리.** (`/bts-hometowns`)
 *
 * ── 왜 (2026-08-29) ───────────────────────────────────────────
 * 사장님 지시 — 「**인기 검색어는 스타 이름·작품명·노래제목이다. 그 말이 제목과 본문의
 * 위·가운데·끝에 나와야 한다**」.
 *
 * 🔴 **잰 수요** — Search Console 실측(2026-08-26 창)에서 BTS 고향을 물어본 질의가
 * **열넷**, 노출 26회, 자리 3~11위였다.
 * ```
 *   who is from busan in bts            4회  7위
 *   bts members from busan              3회  9위
 *   which bts member is from daegu      2회  5위
 *   which bts members are from daegu    2회  3위
 *   daegu bts member · is bts from busan · which bts member is from busan …
 * ```
 * ⚠ `/hometowns` 가 이미 3~11위로 잡히고 있다. 그런데 그 지면은 **123명 전체의 생김새**를
 *   말한다 — 손님이 물은 것은 **「BTS 중 누구」** 하나다. 물음에 곧장 답하는 지면이 없다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * 🔴 **P19 는 「태어난 곳」이지 「고향」이 아니다.** 병원이 있는 도시가 적히는 일이 흔하다.
 *   이 지면은 「born in」이라고만 쓰고 **「hometown」이라고 쓰지 않는다.**
 *   ⛔ 「from Busan」이라는 손님 말에 우리가 「born in Busan」으로 답하고, 그 둘이 다르다는
 *     것을 «지면에 적는다». 물음말을 그대로 되돌려 주면서 틀린 확신을 주지 않는다.
 * ⛔ 읽힌 수는 **동남아 네 위키백과**의 조회다 — 한국에서의 인기가 아니다.
 * ⛔ 못 찾은 사람을 지어내지 않는다 — 일곱 명이 다 안 나오면 «몇 명 못 찾았는지» 적는다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-bts-hometowns.mjs --자가시험
 *   node scripts/build-kcw-bts-hometowns.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
/* 🔴 [2026-09-03] UTC 로 날짜를 만들던 자리를 KST 로 고쳤다 —
   CLAUDE.md 🔴 「toISOString() 도 쓰지 않는다. 날짜를 만들면 새벽에 하루가 어긋난다」 */
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자료길 = path.join(뿌리, 'src/data/wikitip-hometowns.json');
const 질의길 = path.join(뿌리, 'src/data/gsc-kcw-2026-08-26.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-bts-hometowns.json');

/**
 * 일곱 명. ⛔ 우리가 «고른» 목록이 아니라 그룹이 일곱이라 일곱이다.
 * ⚠ 활동명과 본명이 자료마다 다르게 적힌다 — 둘 다 둔다.
 */
export const 멤버들 = [
  { stage: 'RM', birth: 'Kim Nam-joon', order: 1 },
  { stage: 'Jin', birth: 'Kim Seok-jin', order: 2 },
  { stage: 'Suga', birth: 'Min Yoon-gi', order: 3 },
  { stage: 'J-Hope', birth: 'Jung Ho-seok', order: 4 },
  { stage: 'Jimin', birth: 'Park Ji-min', order: 5 },
  { stage: 'V', birth: 'Kim Tae-hyung', order: 6 },
  { stage: 'Jungkook', birth: 'Jeon Jung-kook', order: 7 },
];

/** 견주려고 이름을 고른다 */
export function 이름고르기(s) {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
}

/** 이 질의가 BTS 고향을 묻고 있나 */
export function 고향을묻나(q) {
  const s = String(q ?? '').toLowerCase();
  if (!/\bbts\b/.test(s)) return false;
  return /\b(from|born|birthplace|birthplaces|hometown|city|cities)\b/.test(s)
    || /\b(busan|daegu|gwangju|goyang|gwacheon|seoul|ilsan)\b/.test(s);
}

/**
 * 도시 표에서 한 사람을 찾는다.
 * ⛔ 비슷한 이름으로 «때우지» 않는다 — 활동명이나 본명이 그대로 맞을 때만.
 */
export function 사람찾기(멤버, 도시들) {
  const 후보 = [이름고르기(멤버.stage), 이름고르기(멤버.birth)];
  for (const c of 도시들 ?? []) {
    for (const p of c.people ?? []) {
      if (후보.includes(이름고르기(p.name))) {
        return { place: c.place, placeQ: c.placeQ, coord: c.coord, person: p, cityPeople: c.people };
      }
    }
  }
  return null;
}

/** 한 도시에서 온 다른 이름들 — ⛔ 본인은 뺀다 */
export function 같은도시다른이름(찾음, n = 8) {
  if (!찾음) return [];
  return (찾음.cityPeople ?? [])
    .filter((p) => p.name !== 찾음.person.name)
    .slice(0, n)
    .map((p) => ({ name: p.name, perMillion: p.perMillionTotal ?? null }));
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('일곱 명이다', 멤버들.length === 7);
  검('활동명과 본명을 둘 다 쥔다', 멤버들.every((m) => m.stage && m.birth));

  검('이름을 눌러 붙인다', 이름고르기('J-Hope') === 'jhope');
  검('띄어쓰기도 눌러 붙인다', 이름고르기('Kim Seok-jin') === 'kimseokjin');
  검('⛔ 빈 것도 안 터진다', 이름고르기(undefined) === '');

  검('고향 물음을 알아본다', 고향을묻나('which bts member is from busan') === true);
  검('도시 이름만 있어도 알아본다', 고향을묻나('daegu bts member') === true);
  검('birthplaces 도 알아본다', 고향을묻나('bts birthplaces') === true);
  검('⛔ BTS 가 없으면 아니다', 고향을묻나('who is from busan in blackpink') === false);
  검('⛔ 고향 물음이 아니면 아니다', 고향을묻나('bts new album') === false);
  검('⛔ 빈 것도 안 터진다', 고향을묻나(null) === false);

  const 도시들 = [
    { place: 'Busan', placeQ: 'Q16520', people: [{ name: 'Jungkook', perMillionTotal: 139.67 },
      { name: 'Jimin', perMillionTotal: 55.52 }] },
    { place: 'Gwacheon', placeQ: 'Q42121', people: [{ name: 'Kim Seok-jin', perMillionTotal: 74.42 }] },
  ];
  검('활동명으로 찾는다', 사람찾기({ stage: 'Jungkook', birth: 'Jeon Jung-kook' }, 도시들).place === 'Busan');
  검('본명으로도 찾는다', 사람찾기({ stage: 'Jin', birth: 'Kim Seok-jin' }, 도시들).place === 'Gwacheon');
  검('⛔ 없으면 null — 지어내지 않는다', 사람찾기({ stage: 'Zzz', birth: 'Yyy' }, 도시들) === null);
  검('⛔ 빈 표에서도 안 터진다', 사람찾기({ stage: 'a', birth: 'b' }, undefined) === null);

  const 찾음 = 사람찾기({ stage: 'Jungkook', birth: 'Jeon Jung-kook' }, 도시들);
  const 다른 = 같은도시다른이름(찾음);
  검('같은 도시의 다른 이름을 준다', 다른.length === 1 && 다른[0].name === 'Jimin');
  검('⛔ 본인은 뺀다', !다른.some((x) => x.name === 'Jungkook'));
  검('⛔ 못 찾은 사람이면 빈 줄', 같은도시다른이름(null).length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-bts-hometowns 자가시험 통과 (19)');
  process.exit(0);
}

/* ── 짓는다 ───────────────────────────────────────────────── */
const 원 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
const 도시들 = 원.cities ?? [];
if (!도시들.length) {
  console.error('🔴 못 짓는다 — 도시 표가 비어 있다.');
  process.exit(1);
}

const 줄 = [];
const 못찾음 = [];
for (const m of 멤버들) {
  const 찾음 = 사람찾기(m, 도시들);
  if (!찾음) {
    못찾음.push(m.stage);
    줄.push({ ...m, found: false,
      whyNot: 'Wikidata records no place of birth we could place on a map for this member, or '
        + 'records it under a name we did not match. We leave the row empty rather than fill it.' });
    continue;
  }
  줄.push({
    ...m,
    found: true,
    wikidataName: 찾음.person.name,
    bornIn: 찾음.place,
    placeQ: 찾음.placeQ,
    perMillion: 찾음.person.perMillionTotal ?? null,
    alsoFromHere: 같은도시다른이름(찾음),
    cityTotal: (찾음.cityPeople ?? []).length,
  });
}

/* 도시별로 묶는다 — 손님이 묻는 모양이 「부산은 누구」다 */
const 도시별 = new Map();
for (const r of 줄.filter((x) => x.found)) {
  if (!도시별.has(r.bornIn)) 도시별.set(r.bornIn, { place: r.bornIn, placeQ: r.placeQ, members: [], cityTotal: r.cityTotal });
  도시별.get(r.bornIn).members.push(r.stage);
}

const 질의 = JSON.parse(fs.readFileSync(질의길, 'utf8')).rows ?? [];
const 물음들 = 질의.filter((r) => 고향을묻나(r.key)).sort((a, b) => b.impressions - a.impressions);

const 낼것 = {
  generated: 오늘(),
  source: 원.source,
  window: 원.window,
  peopleInBox: 원.inBox,
  members: 줄,
  found: 줄.filter((x) => x.found).length,
  missing: 못찾음,
  byCity: [...도시별.values()].sort((a, b) => b.members.length - a.members.length
    || String(a.place).localeCompare(String(b.place))),
  asked: 물음들.map((r) => ({ q: r.key, impressions: r.impressions, position: r.position })),
  askedImpressions: 물음들.reduce((a, b) => a + b.impressions, 0),

  /* 🔴 이 지면이 절대 흐리면 안 되는 것 */
  bornNotFrom: 'Wikidata records place of birth, which is not the same thing as where somebody is '
    + 'from. A hospital city is often recorded instead of the town a person grew up in. Everything '
    + 'below says "born in" and never "hometown", and where the two are known to differ, fans are '
    + 'usually right and the database is usually the one recording a hospital.',
  cannotAnswer: [
    'Where a member grew up, went to school, or considers home. None of that is in this data.',
    'Anything about popularity in Korea. Our reading figures are lookups on four Southeast Asian '
      + 'Wikipedia editions, which measure curiosity in that region and nothing else.',
    'Anything about the city itself. A birthplace is a fact about one person, not about a place.',
  ],
};

fs.writeFileSync(낼길, `${JSON.stringify(낼것, null, 2)}\n`);

console.log('■ /bts-hometowns 자료를 지었다');
console.log(`   일곱 명 중 ✅ 찾음 ${낼것.found} · ⬜ 못 찾음 ${못찾음.length}${못찾음.length ? ` (${못찾음.join(', ')})` : ''}`);
for (const c of 낼것.byCity) console.log(`   ${c.place.padEnd(10)} ${c.members.join(', ')}`);
console.log(`   물어본 질의 ${물음들.length}개 · 노출 ${낼것.askedImpressions}회`);
console.log('   ⛔ 「born in」이라고만 쓴다 — 「hometown」이라고 쓰지 않는다');
console.log(`\n✔ ${path.relative(뿌리, 낼길)}`);
