#!/usr/bin/env node
/**
 * build-kcw-people.mjs — **사람이 «주인공»인 지면 자료를 만든다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 🔴 2026-08-25, 사장님 지시 —
 *   「인기 검색어도 찾아야지. **특히 케이컬쳐는 스타의 이름**, 작품명, 노래제목 등이겠지」
 *
 * 그날 `check-name-placement.mjs` 로 재 보니 —
 *   작품 이름은 네 자리(제목·위·가운데·끝)에 다 있는데 **사람 이름은 1/4~3/4**였고,
 *   더 큰 것은 **사람이 주인공인 지면이 0장**이라는 것이었다. 작품은 `/title/{작품}`
 *   556장이 있는데 사람은 표 안의 «한 줄»로만 있었다.
 *
 * ── 무엇을 낼지는 «재서» 정했다 ────────────────────────────────
 * 사람 이름 뒤에 붙는 말 다섯 꼴을 자동완성으로 쟀다(배우 14명 × 5꼴). 가지 수 합 —
 *   age 51 · movies and tv shows 45 · netflix 44 · tv shows 24 · drama list 22
 * ⚠ `age` 가 가장 크지만 그 답은 구글이 지식패널로 «즉시» 준다. 우리가 이길 자리가 아니다.
 * ⭐ 우리만 가진 것은 **「그 작품이 어느 나라까지 갔나」**다. 그래서 지면의 축은
 *   `movies and tv shows` + `netflix` (합 89)로 두고, 나이는 «아는 사람만» 사실로 적는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **9,249명 지면을 내지 않는다.** 얇은 지면 수천 장은 오늘 아침 `/title` 색인을 재며 본 함정이다.
 *   지면이 나오는 사람은 **우리가 이미 지면을 낸 작품에 2편 이상** 나온 사람뿐이다.
 * ⛔ 생일이 없으면 **없다고 적는다.** 0 이나 빈칸으로 채우지 않는다.
 * ⛔ 같은 이름이 둘 이상이면 **고르지 않는다** — 생일을 안 붙이고 `ambiguous` 로 센다.
 * ⛔ 「이 사람의 전체 출연작」이 아니다. **넷플릭스 톱10에 오른 한국 작품 중 우리가 지면을 낸 것**뿐이다.
 *
 * 쓰는 법  node scripts/build-kcw-people.mjs --자가시험
 *          node scripts/build-kcw-people.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 최소편수 = 2;

/** 이름을 주소로. ⛔ 대문자·따옴표·점을 그대로 두면 주소가 깨진다 */
export function 슬러그(이름) {
  return String(이름 ?? '').toLowerCase()
    .replace(/[’'`.]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 위키백과 문서명에 붙는 괄호를 뗀다 — `Ha Young (actress)` → `Ha Young`.
 * ⚠ 떼는 것은 **보여 줄 때**뿐이다. 문서를 다시 물을 때는 원래 이름을 쓴다.
 *
 * 🔴 2026-08-25 — 처음 돌리자 화면에 **`Wi  Ha-jun`** 이 겹공백째로 나왔고,
 *   그 이름으로 생일을 물으니 `notFound` 였다. 위키데이터 쪽 이름에 공백이 둘이었다.
 *   ⛔ 눈에 안 띄는 겹공백 하나가 «이름도 틀리고 생일도 잃게» 만든다. 여기서 접는다.
 */
export function 보일이름(이름) {
  return String(이름 ?? '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
}

/** 태어난 날에서 나이. ⛔ 생일이 없으면 «없다» — 0 이 아니다 */
export function 나이(태어난날, 기준 = '2026-08-25') {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(태어난날 ?? ''));
  if (!m) return null;
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]);
  const 조각 = String(기준).split('-').map(Number);
  let a = 조각[0] - y;
  if (조각[1] < mo || (조각[1] === mo && 조각[2] < d)) a -= 1;
  return a >= 0 && a < 130 ? a : null;
}

/**
 * 작품 표를 뒤집어 사람 → 작품 으로 만든다.
 * ⛔ `hasPage` 가 아닌 작품은 **넣지 않는다** — 링크가 죽는다.
 */
export function 사람별작품(작품들) {
  const m = new Map();
  for (const t of 작품들 ?? []) {
    if (!t.hasPage) continue;
    for (const c of t.cast ?? []) {
      const 키 = c.page || c.name;
      if (!키) continue;
      if (!m.has(키)) m.set(키, { key: 키, name: c.name || 키, titles: [] });
      m.get(키).titles.push(t);
    }
  }
  return m;
}

/** 그 사람의 작품들이 «닿은 나라» — 겹친 것을 지운 수. ⛔ 나라 수를 더하지 않는다 */
export function 닿은나라(작품들) {
  const s = new Set();
  for (const t of 작품들 ?? []) for (const b of t.byMarket ?? []) if (b.iso2) s.add(b.iso2);
  return s.size;
}

/** 생일 곳간을 이름으로 찾는다. ⛔ 같은 이름이 둘이면 «고르지 않는다» */
export function 생일찾기(생일지도, 이름) {
  const v = 생일지도.get(보일이름(이름).toLowerCase());
  if (!v) return { born: null, why: 'notFound' };
  if (v.length > 1) return { born: null, why: 'ambiguous' };
  return { born: v[0].born ?? null, why: v[0].born ? null : 'noDate' };
}

if (process.argv.includes('--자가시험')) {
  let 실패 = 0;
  const 검 = (무엇, 참인가) => {
    if (!참인가) { console.error('❌ ' + 무엇); 실패++; } else console.log('✅ ' + 무엇);
  };

  검('슬러그가 소문자로 잇는다', 슬러그('Jung Hae-in') === 'jung-hae-in');
  검('아포스트로피를 지운다', 슬러그("Kim Da-mis") === 'kim-da-mis');
  검('괄호가 주소를 안 깨뜨린다', 슬러그('Ha Young (actress)') === 'ha-young-actress');
  검('앞뒤 붙임표가 안 남는다', !/^-|-$/.test(슬러그('  Lee  Jung-jae  ')));

  검('괄호를 떼고 보여 준다', 보일이름('Ha Young (actress)') === 'Ha Young');
  검('괄호가 없으면 그대로', 보일이름('Jung Hae-in') === 'Jung Hae-in');
  검('가운데 괄호는 안 뗀다', 보일이름('A (b) c') === 'A (b) c');
  /* 🔴 겪은 것 — 겹공백이 화면에 그대로 나가고 생일 찾기까지 놓쳤다 */
  검('겹공백을 접는다', 보일이름('Wi  Ha-jun') === 'Wi Ha-jun');

  검('나이를 센다', 나이('1988-04-01', '2026-08-25') === 38);
  검('생일 전이면 한 살 적다', 나이('1988-12-01', '2026-08-25') === 37);
  검('생일 당일이면 그 나이', 나이('1988-08-25', '2026-08-25') === 38);
  검('⛔ 생일이 없으면 0 이 아니라 없다', 나이(null) === null && 나이('') === null);
  검('⛔ 말이 안 되는 해는 안 받는다', 나이('1700-01-01', '2026-08-25') === null);

  const 표본 = [
    { title: 'A', slug: 'a', hasPage: true, cast: [{ name: 'X', page: 'X' }, { name: 'Y', page: 'Y' }], byMarket: [{ iso2: 'KR' }, { iso2: 'JP' }] },
    { title: 'B', slug: 'b', hasPage: true, cast: [{ name: 'X', page: 'X' }], byMarket: [{ iso2: 'JP' }, { iso2: 'US' }] },
    { title: 'C', slug: 'c', hasPage: false, cast: [{ name: 'X', page: 'X' }], byMarket: [{ iso2: 'FR' }] },
  ];
  const 뒤집힌 = 사람별작품(표본);
  검('사람으로 뒤집는다', 뒤집힌.get('X').titles.length === 2 && 뒤집힌.get('Y').titles.length === 1);
  검('⛔ 지면 없는 작품은 안 담는다', !뒤집힌.get('X').titles.some((t) => t.slug === 'c'));
  검('⛔ 닿은 나라를 더하지 않는다 — 겹치면 하나다', 닿은나라(뒤집힌.get('X').titles) === 3);
  검('나라 자료가 없으면 0 이다', 닿은나라([{ byMarket: [] }]) === 0);

  const 생일 = new Map([
    ['jung hae-in', [{ born: '1988-04-01' }]],
    ['kim min-ji', [{ born: '1990-01-01' }, { born: '1995-05-05' }]],
    ['no date', [{ born: null }]],
  ]);
  검('생일을 찾는다', 생일찾기(생일, 'Jung Hae-in').born === '1988-04-01');
  검('괄호가 붙어도 찾는다', 생일찾기(생일, 'Jung Hae-in (actor)').born === '1988-04-01');
  검('⛔ 같은 이름이 둘이면 고르지 않는다',
    생일찾기(생일, 'Kim Min-ji').born === null && 생일찾기(생일, 'Kim Min-ji').why === 'ambiguous');
  검('없는 사람은 notFound 다', 생일찾기(생일, 'Nobody').why === 'notFound');
  검('있는데 날짜가 없으면 noDate 다', 생일찾기(생일, 'No Date').why === 'noDate');

  console.log(실패 ? '\n❌ ' + 실패 + '개 실패' : '\n✅ 전부 지나갔다');
  process.exit(실패 ? 1 : 0);
}

/* ── 여기서부터 실제로 짓는다 ───────────────────────────────── */
const 작품길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 생일길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 조회길 = path.join(뿌리, 'src/data/wikitip-actors.json');
const 낼곳 = path.join(뿌리, 'src/data/wikitip-people.json');

for (const p of [작품길, 생일길]) {
  if (!fs.existsSync(p)) {
    console.error('⛔ 자료가 없다 — ' + p + '. 빈 지면을 내지 않는다');
    process.exit(1);
  }
}

const 작품자료 = JSON.parse(fs.readFileSync(작품길, 'utf8'));
const 생일자료 = JSON.parse(fs.readFileSync(생일길, 'utf8'));
const 조회자료 = fs.existsSync(조회길) ? JSON.parse(fs.readFileSync(조회길, 'utf8')) : { rows: [] };

/** ⚠ 같은 이름이 여럿이면 배열에 쌓아 둔다 — 나중에 «고르지 않기» 위해서다 */
const 생일지도 = new Map();
for (const p of 생일자료.사람 ?? []) {
  const k = 보일이름(p.name).toLowerCase();
  if (!k) continue;
  if (!생일지도.has(k)) 생일지도.set(k, []);
  생일지도.get(k).push(p);
}

const 조회지도 = new Map();
for (const r of 조회자료.rows ?? []) 조회지도.set(보일이름(r.name).toLowerCase(), r);

const 뒤집힌 = 사람별작품(작품자료.titles);
const 셈 = { 이름총: 뒤집힌.size, 얇아서제외: 0, 생일있음: 0, 생일없음: 0, 이름겹침: 0, 슬러그충돌: 0, 조회있음: 0 };
const 슬러그본것 = new Map();
const 떨어진것 = [];

for (const v of 뒤집힌.values()) {
  if (v.titles.length < 최소편수) { 셈.얇아서제외++; continue; }
  const 보임 = 보일이름(v.name);
  const s = 슬러그(보임);
  if (!s) continue;

  const b = 생일찾기(생일지도, v.name);
  if (b.born) 셈.생일있음++; else 셈.생일없음++;
  if (b.why === 'ambiguous') 셈.이름겹침++;

  const 조회 = 조회지도.get(보임.toLowerCase()) ?? null;
  if (조회) 셈.조회있음++;

  const 작품 = v.titles
    .map((t) => ({
      title: t.title, slug: t.slug, type: t.type,
      places: t.places, markets: t.markets, weeks: t.weeks,
      peak: t.peak, firstWeek: t.firstWeek, lastWeek: t.lastWeek,
    }))
    .sort((a, c) => (c.places ?? 0) - (a.places ?? 0) || String(a.title).localeCompare(String(c.title)));

  const 사람 = {
    name: 보임,
    wikiPage: v.key,
    slug: s,
    born: b.born,
    /** ⛔ 왜 생일이 없는지를 «적는다». 빈칸은 이유를 못 말한다 */
    bornUnknownWhy: b.born ? null : b.why,
    age: 나이(b.born),
    titles: 작품,
    titleCount: 작품.length,
    /** 그 사람 작품들이 차지한 톱10 자리 수의 «합». ⚠ 사람의 인기가 아니라 작품의 자취다 */
    places: 작품.reduce((a, t) => a + (t.places ?? 0), 0),
    countries: 닿은나라(v.titles),
    /** ⚠ 위키백과 30일 조회. «그 이름에 대한 관심»이고 «우리 지면을 볼 사람 수»가 아니다 */
    reads30d: 조회 ? 조회.total : null,
  };

  /*
   * 🔴 2026-08-25 — 충돌 둘이 다 **진짜 다른 사람**이었다.
   *   `Lee Joo-young (actress, born 1992)` ↔ `(actress, born 1987)`
   *   `Kim Min-jae (actor, born 1996)`    ↔ `(actor, born 1979)`
   * ⛔ 합치지 않는다 — 남남이다. ⛔ **버리지도 않는다** — 둘 다 지면이 있어야 할 사람이다.
   *   ⭐ 먼저 온 쪽이 짧은 주소를 갖고, 뒤에 온 쪽은 **위키 문서명으로 만든 긴 주소**를 갖는다.
   *   그러면 잃는 사람이 없고, 어느 주소가 누구인지도 헷갈리지 않는다.
   *   ⚠ 화면에는 반드시 **「이름이 같은 다른 사람이 있다」**를 적는다. 안 적으면 손님이 섞어 읽는다.
   */
  if (슬러그본것.has(s)) {
    셈.슬러그충돌++;
    const 먼저 = 슬러그본것.get(s);
    const 긴주소 = 슬러그(사람.wikiPage);
    사람.slug = 긴주소 && 긴주소 !== s ? 긴주소 : s + '-2';
    사람.sameNameAs = 먼저.slug;
    먼저.sameNameAs = 사람.slug;
    슬러그본것.set(사람.slug, 사람);
    떨어진것.push({
      name: 사람.name, wikiPage: 사람.wikiPage, wantedSlug: s,
      gotSlug: 사람.slug, sharedWith: 먼저.wikiPage,
      note: 'Different person with the same romanised name. Both are published; neither is merged.',
    });
  } else 슬러그본것.set(s, 사람);
}

const 낼사람 = [...슬러그본것.values()]
  .sort((a, b) => (b.places ?? 0) - (a.places ?? 0) || a.name.localeCompare(b.name));

fs.writeFileSync(낼곳, JSON.stringify({
  generated: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
  source: 'Netflix Top 10 (Tudum) weekly country lists, joined to Wikidata cast lists (P161) filtered to '
    + 'Korean citizenship (P27), and to Wikidata birth dates (P569). Wikipedia reads from the Wikimedia '
    + 'Pageviews API, human traffic only.',
  whatThisIs: 'One row per person who appears in at least two Korean titles that reached a Netflix weekly '
    + 'top 10 and that have enough weeks of data for us to publish a page.',
  whatThisIsNot: 'This is NOT a filmography. It counts only Netflix top-10 charting titles we publish a page '
    + 'for. A person can have many more credits than the number here. It is a floor, not a total.',
  minTitles: 최소편수,
  asOf: '2026-08-25',
  counts: 셈,
  peopleTotal: 뒤집힌.size,
  peoplePublished: 낼사람.length,
  sameNameSplit: 떨어진것,
  people: 낼사람,
}, null, 2));

console.log('■ 사람 지면 자료 — ' + 낼사람.length + '명 (이름 ' + 셈.이름총 + ' 중 '
  + 셈.얇아서제외 + '명은 ' + 최소편수 + '편 미만이라 안 낸다)');
console.log('  생일 있음 ' + 셈.생일있음 + ' · 없음 ' + 셈.생일없음 + '(이름겹침 ' + 셈.이름겹침
  + ') · 조회 잰 사람 ' + 셈.조회있음 + ' · 주소 충돌 ' + 셈.슬러그충돌);
console.log('  냈다 — ' + path.relative(뿌리, 낼곳));
