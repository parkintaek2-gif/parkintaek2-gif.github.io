/**
 * build-kcw-age-bands.mjs — **나이 묶음 자료.** (`/actors-in-their-30s` 같은 지면이 쓴다)
 *
 * ── 🔴 왜 이 자료가 생겼나 ─────────────────────────────────────
 * 사장님 지시: 「**키워드 검색량을 재서 해.**」 2026-08-24 에 재니 이렇게 나왔다 —
 * ```
 *   korean actors age        자동완성 1번째 · 그 말로 시작 10줄
 *      korean actors age 40
 *      korean actors age 50
 *      korean actors age 20
 * ```
 * 그리고 우리 자료에는 **9,249명 전원의 생년이 있다**(못 읽은 사람 0명).
 * 손님이 묻는 낱알이 「나이 묶음」인데 내 지면은 날(366장)과 달(12장)뿐이었다.
 *
 * ── 🔴 이 자료가 반드시 지키는 것 — «나이는 움직이는 수다» ─────
 * 우리 지면은 **배포할 때만 다시 지어진다.** 그래서 「마흔 살인 사람」을 그대로 적으면
 * 해가 바뀌는 날부터 지면이 거짓을 말한다. 오늘 「today 생일」 지면을 안 만든 것과 같은 함정이다.
 *
 * ⭐ 그래서 **두 가지를 같이 낸다.**
 * ```
 *   ① 나이 묶음      손님이 검색하는 말이다 (in their 40s)
 *   ② 태어난 해 범위  «절대 안 변하는 사실»이다 (born 1977 to 1986)
 *   ③ 기준 해        ①이 ②에서 나온 그 해를 적어 둔다 (as of 2026)
 * ```
 * 지면은 ①로 제목을 달고 ②③을 본문 맨 앞에 적는다. 그러면 지면이 낡아도
 * **읽는 사람이 스스로 고쳐 읽을 수 있다.** ②를 빼고 ①만 적는 것이 거짓말이 되는 길이다.
 * ⛔ 기준 해를 손으로 적지 않는다 — 짓는 날에서 가져온다.
 * ⛔ 점을 치지 않는다. 「같은 나이대에 태어났다」는 그 말뿐이다.
 * ⛔ 「젊은 배우가 늘었다」 같은 말을 안 한다 — 위키데이터는 인구조사가 아니다.
 *   요즘 사람이 더 많이 실리는 것일 수도 있고 우리는 그 둘을 못 가른다.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 낼길 = path.join(뿌리, 'src/data/wikitip-age-bands.json');

/**
 * 묶음표. **아래·위 나이를 둘 다 적어 둔다** — 「60대 이상」처럼 위가 없는 칸은 위를 null 로 둔다.
 * ⛔ 「10대 이하」를 안 낸다. 미성년자를 나이로 모아 놓은 지면을 우리가 만들 이유가 없고,
 *   손님이 검색하는 말도 아니다(재 본 것은 20·40·50 이었다). 세기는 세고 «지면은 안 낸다» —
 *   그래서 아래 `지면낼까` 가 따로 있다. 세는 것과 내는 것은 다른 일이다.
 */
export const 묶음표 = [
  { 슬러그: 'teens', 이름: 'teens', 아래: 13, 위: 19, 지면낼까: false,
    왜안내나: '미성년자를 나이로 모아 놓은 지면은 내지 않는다. 세기는 센다' },
  { 슬러그: '20s', 이름: '20s', 아래: 20, 위: 29, 지면낼까: true },
  { 슬러그: '30s', 이름: '30s', 아래: 30, 위: 39, 지면낼까: true },
  { 슬러그: '40s', 이름: '40s', 아래: 40, 위: 49, 지면낼까: true },
  { 슬러그: '50s', 이름: '50s', 아래: 50, 위: 59, 지면낼까: true },
  { 슬러그: '60s-and-over', 이름: '60s and over', 아래: 60, 위: null, 지면낼까: true },
];

/** 태어난 해를 뽑는다. ⛔ 못 읽으면 0 이 아니라 null 이다 */
export function 태어난해(사람) {
  const s = String(사람?.born ?? '');
  const m = s.match(/^(-?\d{4})-\d{2}-\d{2}/);
  if (!m) return null;
  const y = Number(m[1]);
  if (!Number.isFinite(y) || y < 1850) return null;
  return y;
}

/**
 * 기준 해에 이 사람이 어느 묶음인가. **묶음표에서 찾는다** — 여기서 나이를 다시 나누지 않는다.
 * ⛔ 기준 해보다 뒤에 태어난 사람은 null 이다(자료 흠). 0살로 세지 않는다.
 */
export function 묶음찾기(태어난해값, 기준해) {
  if (!Number.isFinite(태어난해값) || !Number.isFinite(기준해)) return null;
  const 나이 = 기준해 - 태어난해값;
  if (나이 < 0) return null;
  for (const b of 묶음표) {
    if (나이 < b.아래) continue;
    if (b.위 === null || 나이 <= b.위) return b.슬러그;
  }
  return null;   // 묶음표가 안 덮는 나이 — 있으면 못 잰 것으로 둔다
}

/**
 * 그 묶음의 «태어난 해 범위». 이것이 안 변하는 사실이고 지면이 반드시 같이 적는다.
 * ⚠ 위가 없는 묶음(60s and over)은 **아래쪽 해가 없다** — null 로 둔다. 1850 같은 수를 넣지 않는다.
 */
export function 해범위(묶음, 기준해) {
  if (!묶음 || !Number.isFinite(기준해)) return null;
  const 늦은해 = 기준해 - 묶음.아래;                       // 가장 어린 사람
  const 이른해 = 묶음.위 === null ? null : 기준해 - 묶음.위; // 가장 나이 든 사람
  return { from: 이른해, to: 늦은해 };
}

/** 화면에 실을 이름인가. ⛔ 한글만 있는 이름은 영문 사이트에 안 싣는다 — 세기는 센다 */
export function 실을이름인가(이름) {
  const s = String(이름 ?? '').trim();
  if (!s) return false;
  return !/[가-힣]/.test(s);
}

export function 모으기(사람들, 기준해) {
  const 통 = new Map(묶음표.map((b) => [b.슬러그, {
    slug: b.슬러그, name: b.이름, ageFrom: b.아래, ageTo: b.위,
    listedOnSite: b.지면낼까, people: 0, listed: 0, top: [],
    bornFrom: null, bornTo: null,
  }]));
  /*
   * 🔴 2026-08-24 — **처음에 이 둘을 한 통에 넣었다가 잡았다.** 첫 판은 24명을
   *   「생년을 못 읽음」으로 적었는데, 그 24명은 생년이 멀쩡히 있고 «열세 살 아래»여서
   *   묶음표 밖에 있는 것이었다. 셈은 맞았지만 **딱지가 틀렸다** — 없는 사실을 말한 것이다.
   * ⛔ 「못 읽었다」와 「읽었는데 우리 묶음 밖이다」는 다른 말이다. 따로 센다.
   *   합만 맞으면 된다고 생각하는 순간 이런 것이 지면까지 간다.
   */
  let 못읽음 = 0;
  let 묶음밖 = 0;
  const 이름통 = new Map(묶음표.map((b) => [b.슬러그, []]));

  for (const p of 사람들 ?? []) {
    const y = 태어난해(p);
    if (y === null) { 못읽음++; continue; }
    const s = 묶음찾기(y, 기준해);
    if (s === null) { 묶음밖++; continue; }
    const v = 통.get(s);
    v.people++;
    /* 실제로 자료에 있는 «가장 이른/늦은 해»를 적는다 — 묶음의 이론적 범위와 다를 수 있다 */
    v.bornFrom = v.bornFrom === null ? y : Math.min(v.bornFrom, y);
    v.bornTo = v.bornTo === null ? y : Math.max(v.bornTo, y);
    if (실을이름인가(p.name)) { v.listed++; 이름통.get(s).push(p); }
  }

  /* 보기로 들 이름 — 위키백과 판 수가 많은 순. ⛔ 「인기」라고 부르지 않는다.
     여러 언어에 실렸다는 것은 널리 알려졌다는 뜻일 뿐 좋다는 뜻이 아니다 */
  for (const [s, 목록] of 이름통) {
    통.get(s).top = 목록
      .sort((a, b) => (b.sitelinks ?? 0) - (a.sitelinks ?? 0) || String(a.name).localeCompare(String(b.name)))
      .slice(0, 12)
      .map((p) => ({ name: p.name, born: p.born, languages: p.sitelinks ?? null }));
  }

  return { bands: [...통.values()], unreadable: 못읽음, outside: 묶음밖 };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('태어난 해를 뽑는다', 태어난해({ born: '1993-05-16' }) === 1993);
  검('⛔ 못 읽으면 0 이 아니라 null', 태어난해({ born: '' }) === null && 태어난해({}) === null);
  검('연도만 있는 것은 안 받는다 — 날 정밀도가 아니다', 태어난해({ born: '1993' }) === null);
  검('말이 안 되는 옛 해는 안 받는다', 태어난해({ born: '1200-01-01' }) === null);

  검('스물아홉은 20대', 묶음찾기(1997, 2026) === '20s');
  검('서른은 30대', 묶음찾기(1996, 2026) === '30s');
  검('마흔아홉은 40대', 묶음찾기(1977, 2026) === '40s');
  검('예순은 위가 없는 묶음', 묶음찾기(1966, 2026) === '60s-and-over');
  검('아주 나이 든 사람도 그 묶음', 묶음찾기(1902, 2026) === '60s-and-over');
  /* ⛔ 기준 해보다 뒤에 태어난 사람은 자료 흠이다 — 0살로 세지 않는다 */
  검('⭐ 기준 해보다 뒤면 못 잼', 묶음찾기(2027, 2026) === null);
  검('묶음표가 안 덮는 나이는 못 잼', 묶음찾기(2020, 2026) === null);
  검('못 잰 해는 못 잼', 묶음찾기(null, 2026) === null);

  const b40 = 묶음표.find((b) => b.슬러그 === '40s');
  const r = 해범위(b40, 2026);
  검('40대의 태어난 해 범위가 맞다', r.from === 1977 && r.to === 1986);
  /* ⚠ 위가 없는 묶음은 이른 해가 «없다» — 1850 같은 수를 넣으면 지면이 없는 사실을 말한다 */
  검('⭐ 위가 없는 묶음은 이른 해가 null', 해범위(묶음표.find((b) => b.위 === null), 2026).from === null);
  검('기준 해가 없으면 범위도 없다', 해범위(b40, null) === null);

  검('한글만 있는 이름은 안 싣는다', 실을이름인가('홍길동') === false);
  검('라틴 이름은 싣는다', 실을이름인가('Song Joong-ki') === true);
  검('빈 이름은 안 싣는다', 실을이름인가('') === false && 실을이름인가(null) === false);

  const 사람 = [
    { q: 'Q1', name: 'Psy', born: '1977-12-31', sitelinks: 97 },
    { q: 'Q2', name: '홍길동', born: '1980-01-01', sitelinks: 5 },
    { q: 'Q3', name: 'Jennie', born: '1996-01-16', sitelinks: 78 },
    { q: 'Q4', name: 'Nobody', born: '', sitelinks: 1 },
  ];
  const g = 모으기(사람, 2026);
  const 마흔 = g.bands.find((x) => x.slug === '40s');
  검('묶음에 사람을 넣는다', 마흔.people === 2);
  검('한글 이름은 세지만 안 싣는다', 마흔.people === 2 && 마흔.listed === 1);
  검('⛔ 못 읽은 사람을 0 으로 안 만든다 — 따로 센다', g.unreadable === 1);
  /* 🔴 첫 판이 여기서 틀렸다 — 생년이 멀쩡한 열세 살 아래를 「못 읽음」에 넣고 있었다.
     셈은 맞았지만 딱지가 틀렸다. ⛔ 「못 읽었다」와 「읽었는데 우리 묶음 밖이다」를
     한 통에 넣지 않는다 — 합만 맞으면 된다고 여기는 순간 이런 것이 지면까지 간다 */
  const g2 = 모으기([{ name: 'Kid', born: '2020-01-01', sitelinks: 1 }], 2026);
  검('⭐ 열세 살 아래는 «못 읽음»이 아니라 «묶음 밖»이다', g2.unreadable === 0 && g2.outside === 1);
  검('묶음 밖 사람은 어느 묶음에도 안 들어간다', g2.bands.every((b) => b.people === 0));
  검('많이 알려진 순으로 보기를 든다', 마흔.top[0].name === 'Psy');
  검('한글 이름은 보기에 없다', !마흔.top.some((t) => t.name === '홍길동'));
  검('자료에 실제로 있는 해 범위를 적는다', 마흔.bornFrom === 1977 && 마흔.bornTo === 1980);
  /* ⛔ 지면을 안 내는 묶음도 «센다». 세는 것과 내는 것은 다른 일이다 */
  검('⭐ 지면 안 내는 묶음도 자료에는 있다', g.bands.some((x) => x.slug === 'teens' && x.listedOnSite === false));
  검('묶음 수가 표와 같다', g.bands.length === 묶음표.length);
  검('빈 것을 넣어도 안 터진다', 모으기(null, 2026).bands.length === 묶음표.length);

  /* 🔴 묶음표에 구멍이 있으면 사람이 조용히 사라진다. 20~99 를 다 훑어 본다 */
  const 빠진나이 = [];
  for (let a = 20; a <= 99; a++) if (묶음찾기(2026 - a, 2026) === null) 빠진나이.push(a);
  검('⭐ 스물부터 아흔아홉까지 빠지는 나이가 없다', 빠진나이.length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ build-kcw-age-bands 자가시험 통과 (30)');
  process.exit(0);
}

if (!existsSync(원자료)) {
  console.error(`⛔ 원자료가 없다 — ${원자료}`);
  process.exit(1);
}
const 원 = JSON.parse(readFileSync(원자료, 'utf8'));
const 사람들 = Array.isArray(원) ? 원 : (원.사람 ?? Object.values(원).find(Array.isArray));
if (!Array.isArray(사람들)) { console.error('⛔ 사람 배열을 못 찾았다'); process.exit(1); }

/* ⛔ 기준 해를 손으로 적지 않는다 — 짓는 날에서 가져온다 */
const 기준해 = new Date().getUTCFullYear();
const { bands, unreadable, outside } = 모으기(사람들, 기준해);

const 낼것 = {
  generated: new Date().toISOString(),
  /* ⭐ 이 세 줄이 지면이 낡아도 거짓이 되지 않게 하는 장치다 */
  refYear: 기준해,
  whatThisIs: `Korean entertainers grouped by how old they are in ${기준해}, counted from Wikidata `
    + 'birth dates. Each group also carries the birth years it covers, because ages move and birth years do not.',
  whatThisIsNot: 'This is not a census and not a horoscope. Who has a Wikidata entry is decided by '
    + 'editors, not by us, so a group being larger may mean more people of that age are written down '
    + 'rather than that more of them exist. Sharing an age band means sharing an age band.',
  peopleTotal: 사람들.length,
  unreadableBirthYear: unreadable,
  /* ⛔ 위와 «다른 수»다. 생년은 읽혔고, 우리가 지면을 내는 가장 어린 묶음보다 어린 사람이다.
     둘을 한 수로 합치면 「자료가 나쁘다」와 「우리가 안 낸다」가 섞여 아무 말도 못 하게 된다 */
  outsideBands: outside,
  outsideBandsMeans: `Born after ${기준해 - 13}. Their birth year is known — they are simply younger `
    + 'than the youngest band we publish, and we do not publish an age page about children.',
  bands: bands.map((b) => ({
    ...b,
    /* 묶음의 «이론» 범위. 자료에 실제로 있는 것(bornFrom/bornTo)과 따로 적는다 —
       둘이 다를 수 있고, 다르면 그 사실 자체가 자료의 모양이다 */
    coversBornFrom: 해범위(묶음표.find((x) => x.슬러그 === b.slug), 기준해)?.from ?? null,
    coversBornTo: 해범위(묶음표.find((x) => x.슬러그 === b.slug), 기준해)?.to ?? null,
  })),
};

mkdirSync(path.dirname(낼길), { recursive: true });
writeFileSync(낼길, `${JSON.stringify(낼것, null, 2)}\n`);

console.log(`■ 나이 묶음 — 기준 해 ${기준해} (짓는 날에서 가져온 수다)`);
console.log('묶음            사람    이름실림   자료의 태어난 해    지면');
for (const b of 낼것.bands) {
  const 해 = b.bornFrom === null ? '못 잼' : `${b.bornFrom}~${b.bornTo}`;
  console.log(`${b.name.padEnd(15)} ${String(b.people).padStart(5)} ${String(b.listed).padStart(9)}`
    + `   ${해.padEnd(16)} ${b.listedOnSite ? '낸다' : '안 낸다'}`);
}
const 합 = 낼것.bands.reduce((s, b) => s + b.people, 0);
console.log(`\n합 ${합}`);
console.log(`  · 생년을 못 읽은 사람    ${unreadable}   «모른다»는 뜻이다`);
console.log(`  · 묶음 밖(열세 살 아래)  ${outside}   생년은 안다. 우리가 지면을 안 내는 나이다`);
console.log('⛔ 이 둘을 한 수로 합치지 않는다 — 「자료가 나쁘다」와 「우리가 안 낸다」는 다른 말이다.');
if (합 + unreadable + outside !== 사람들.length) {
  console.error(`🔴 셈이 안 맞는다 — ${합}+${unreadable}+${outside} ≠ ${사람들.length}. 사람이 조용히 사라졌다`);
  process.exit(1);
}
console.log(`✅ 셈이 맞는다 — ${합}+${unreadable}+${outside} = ${사람들.length}. 아무도 안 사라졌다`);
console.log(`냈다 — ${path.relative(뿌리, 낼길)}`);
