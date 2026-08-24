/**
 * build-kcw-star-signs.mjs — **서양 별자리 열두 자리.** (`/star-sign/<이름>`)
 *
 * ── 🔴 왜 (2026-08-24 밤) ─────────────────────────────────────
 * 사장님 「방문자 늘리는 데 올인하라」로 잰 낱말을 다시 훑다가 **오늘 세 번째 같은 오류**를 찾았다.
 * ```
 *   kpop zodiac signs        자동완성 1번째 · 4줄
 *      kpop zodiac signs cancer
 *      kpop zodiac signs taurus     ← 손님이 묻는 것은 «서양 별자리»다
 *
 *   내 지면 /zodiac · /star-signs   둘 다 «띠»(Chinese zodiac, 해 단위)다
 *   지면에 cancer·taurus 라는 말    0번
 * ```
 * 🔴 자료는 있는데 낱알이 또 틀렸다. 생년월일 9,249건이 있으니 별자리는 «계산»이다.
 * 오늘 밤 같은 잘못을 세 번 했다 — 날/달, title-that-charted/korean-drama, 띠/별자리.
 * ⭐ 공통점: **내가 가진 이름표를 손님 이름표로 착각했다.**
 *
 * ── ⛔ 반드시 지키는 것 ───────────────────────────────────────
 * ⛔ **점을 치지 않는다.** 「사자자리는 이렇다」를 쓰지 않는다. 우리는 날짜를 셀 뿐이다.
 *   그리고 우리에겐 **직접 잰 반증**이 있다 — `/star-signs` 에서 띠가 차트 진입을 예측하는지
 *   재 보고 「우연과 구별되지 않는다」고 냈다. 그 결과를 열두 장에 그대로 붙인다.
 * ⛔ 날짜 경계를 «만들지» 않는다. 별자리 경계는 해마다 몇 시간씩 흔들린다 —
 *   널리 쓰는 날짜를 쓰되 **「경계일에 태어난 사람은 해에 따라 달라진다」**를 지면에 적는다.
 * ⛔ 못 읽은 생년월일을 0으로 세지 않는다.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
/* 🔴 2026-08-24 밤 — 처음에  으로 냈다가 **기존 /star-signs 지면을
   깨뜨렸다.** 그 지면이 이미 같은 이름으로 «띠» 자료를 쓰고 있었다. 같은 저장소에서
   이름이 겹치면 조용히 덮인다 — 빌드가 서서 알았지만 안 섰으면 지면이 틀린 자료를 그렸다.
   ⛔ 새 자료를 낼 때 «그 이름을 이미 쓰는 곳»을 먼저 찾는다. 서양 별자리는 western 이다 */
const 낼길 = path.join(뿌리, 'src/data/wikitip-western-signs.json');

/**
 * 별자리표. **널리 쓰는 날짜**다 — 경계는 해마다 몇 시간씩 흔들리므로 이것은 어림이고,
 * 그 사실을 지면이 적는다. ⛔ 우리가 새 경계를 만들지 않는다.
 */
export const 별자리표 = [
  { 슬러그: 'capricorn', 이름: 'Capricorn', 시작: [12, 22], 끝: [1, 19] },
  { 슬러그: 'aquarius', 이름: 'Aquarius', 시작: [1, 20], 끝: [2, 18] },
  { 슬러그: 'pisces', 이름: 'Pisces', 시작: [2, 19], 끝: [3, 20] },
  { 슬러그: 'aries', 이름: 'Aries', 시작: [3, 21], 끝: [4, 19] },
  { 슬러그: 'taurus', 이름: 'Taurus', 시작: [4, 20], 끝: [5, 20] },
  { 슬러그: 'gemini', 이름: 'Gemini', 시작: [5, 21], 끝: [6, 20] },
  { 슬러그: 'cancer', 이름: 'Cancer', 시작: [6, 21], 끝: [7, 22] },
  { 슬러그: 'leo', 이름: 'Leo', 시작: [7, 23], 끝: [8, 22] },
  { 슬러그: 'virgo', 이름: 'Virgo', 시작: [8, 23], 끝: [9, 22] },
  { 슬러그: 'libra', 이름: 'Libra', 시작: [9, 23], 끝: [10, 22] },
  { 슬러그: 'scorpio', 이름: 'Scorpio', 시작: [10, 23], 끝: [11, 21] },
  { 슬러그: 'sagittarius', 이름: 'Sagittarius', 시작: [11, 22], 끝: [12, 21] },
];

/**
 * 달·날에서 별자리를 찾는다. ⛔ 못 찾으면 null 이다 — 아무 자리에나 넣지 않는다.
 * ⚠ 염소자리는 «해를 넘어간다»(12/22~1/19). 그 하나만 다르게 본다.
 */
export function 별자리찾기(달, 날) {
  if (!Number.isInteger(달) || !Number.isInteger(날)) return null;
  if (달 < 1 || 달 > 12 || 날 < 1 || 날 > 31) return null;
  for (const b of 별자리표) {
    const [시달, 시날] = b.시작;
    const [끝달, 끝날] = b.끝;
    if (시달 > 끝달) {
      /* 해를 넘어가는 자리(염소자리) */
      if ((달 === 시달 && 날 >= 시날) || (달 === 끝달 && 날 <= 끝날)) return b.슬러그;
    } else if ((달 === 시달 && 날 >= 시날) || (달 === 끝달 && 날 <= 끝날)) return b.슬러그;
  }
  return null;
}

/** 경계일인가 — 시작일이나 마지막 날. ⚠ 그 사람들은 해에 따라 자리가 달라진다 */
export function 경계일인가(달, 날) {
  const s = 별자리찾기(달, 날);
  if (s === null) return null;
  return 별자리표.some((b) => (b.시작[0] === 달 && b.시작[1] === 날)
    || (b.끝[0] === 달 && b.끝[1] === 날));
}

/** 화면에 실을 이름인가. ⛔ 한글만 있는 이름은 영문 사이트에 안 싣는다 — 세기는 센다 */
export function 실을이름인가(이름) {
  const s = String(이름 ?? '').trim();
  return Boolean(s) && !/[가-힣]/.test(s);
}

export function 모으기(사람들) {
  const 통 = new Map(별자리표.map((b) => [b.슬러그, {
    slug: b.슬러그, name: b.이름,
    from: `${b.시작[0]}-${String(b.시작[1]).padStart(2, '0')}`,
    to: `${b.끝[0]}-${String(b.끝[1]).padStart(2, '0')}`,
    people: 0, listed: 0, onCusp: 0, top: [],
  }]));
  let 못읽음 = 0;
  const 이름통 = new Map(별자리표.map((b) => [b.슬러그, []]));

  for (const p of 사람들 ?? []) {
    const m = String(p?.born ?? '').match(/^-?\d{4}-(\d{2})-(\d{2})/);
    if (!m) { 못읽음++; continue; }
    const s = 별자리찾기(Number(m[1]), Number(m[2]));
    if (s === null) { 못읽음++; continue; }
    const v = 통.get(s);
    v.people++;
    if (경계일인가(Number(m[1]), Number(m[2]))) v.onCusp++;
    if (실을이름인가(p.name)) { v.listed++; 이름통.get(s).push(p); }
  }

  /* 보기로 들 이름 — 위키백과 판 수가 많은 순. ⛔ 「인기」라고 부르지 않는다 */
  for (const [s, 목록] of 이름통) {
    통.get(s).top = 목록
      .sort((a, b) => (b.sitelinks ?? 0) - (a.sitelinks ?? 0) || String(a.name).localeCompare(String(b.name)))
      .slice(0, 12)
      .map((p) => ({ name: p.name, born: p.born, languages: p.sitelinks ?? null }));
  }
  return { signs: [...통.values()], unreadable: 못읽음 };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('한여름은 게자리', 별자리찾기(7, 1) === 'cancer');
  검('사자자리 시작', 별자리찾기(7, 23) === 'leo');
  검('게자리 끝', 별자리찾기(7, 22) === 'cancer');
  검('황소자리', 별자리찾기(5, 1) === 'taurus');
  /* ⚠ 염소자리만 해를 넘어간다 — 이것이 틀리면 12월·1월 사람이 통째로 사라진다 */
  검('⭐ 염소자리는 해를 넘어간다 — 12월', 별자리찾기(12, 25) === 'capricorn');
  검('⭐ 염소자리는 해를 넘어간다 — 1월', 별자리찾기(1, 5) === 'capricorn');
  검('물병자리 시작', 별자리찾기(1, 20) === 'aquarius');
  검('사수자리 끝', 별자리찾기(12, 21) === 'sagittarius');
  검('말이 안 되는 날은 null', 별자리찾기(13, 1) === null && 별자리찾기(1, 0) === null);
  검('못 잰 값은 null', 별자리찾기(null, 1) === null && 별자리찾기(1, null) === null);

  /* 🔴 표에 구멍이 있으면 사람이 조용히 사라진다 — 366일을 다 훑는다 */
  const 날수 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const 빈날 = [];
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 날수[m - 1]; d++) {
    if (별자리찾기(m, d) === null) 빈날.push(`${m}-${d}`);
  }
  검('⭐ 366일 중 자리가 없는 날이 하나도 없다', 빈날.length === 0);

  검('경계일을 안다', 경계일인가(7, 23) === true && 경계일인가(7, 22) === true);
  검('가운데 날은 경계가 아니다', 경계일인가(7, 1) === false);

  검('한글 이름은 안 싣는다', 실을이름인가('홍길동') === false);
  검('라틴 이름은 싣는다', 실을이름인가('IU') === true);

  const 사람 = [
    { name: 'IU', born: '1993-05-16', sitelinks: 90 },
    { name: '홍길동', born: '1993-05-16', sitelinks: 5 },
    { name: 'Winter', born: '2001-01-01', sitelinks: 40 },
    { name: 'Nobody', born: '', sitelinks: 1 },
  ];
  const g = 모으기(사람);
  const 황소 = g.signs.find((x) => x.slug === 'taurus');
  검('별자리에 넣는다', 황소.people === 2);
  검('한글 이름은 세지만 안 싣는다', 황소.listed === 1 && !황소.top.some((t) => t.name === '홍길동'));
  검('⭐ 1월 1일은 염소자리다', g.signs.find((x) => x.slug === 'capricorn').people === 1);
  검('⛔ 못 읽은 사람을 0 으로 안 만든다', g.unreadable === 1);
  검('열두 자리가 다 있다', g.signs.length === 12);
  검('빈 것을 넣어도 안 터진다', 모으기(null).signs.length === 12);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ build-kcw-star-signs 자가시험 통과 (21)');
  process.exit(0);
}

if (!existsSync(원자료)) { console.error(`⛔ 원자료가 없다 — ${원자료}`); process.exit(1); }
const 원 = JSON.parse(readFileSync(원자료, 'utf8'));
const 사람들 = Array.isArray(원) ? 원 : (원.사람 ?? Object.values(원).find(Array.isArray));
if (!Array.isArray(사람들)) { console.error('⛔ 사람 배열을 못 찾았다'); process.exit(1); }

const { signs, unreadable } = 모으기(사람들);
const 합 = signs.reduce((s, x) => s + x.people, 0);

mkdirSync(path.dirname(낼길), { recursive: true });
writeFileSync(낼길, `${JSON.stringify({
  generated: new Date().toISOString(),
  whatThisIs: 'Korean entertainers grouped by the western star sign their birth date falls in, '
    + 'counted from Wikidata birth dates. The sign is arithmetic on a date, nothing more.',
  whatThisIsNot: 'This is not astrology and we make no claim about what a sign means. We tested the '
    + 'nearest thing to a claim — whether a birth-year animal predicts reaching a Netflix chart — '
    + 'and the spread was indistinguishable from chance.',
  boundaryNote: 'Sign boundaries shift by a few hours from year to year. We use the widely published '
    + 'dates, so someone born on a boundary day may fall the other way in their own birth year. '
    + 'Each page says how many of its people are on a boundary day.',
  peopleTotal: 사람들.length,
  placed: 합,
  unreadableBirthDate: unreadable,
  signs,
}, null, 2)}\n`);

console.log('■ 서양 별자리 — 생년월일에서 «계산»했다. 점이 아니다\n');
console.log('자리          사람   이름실림   경계일   날짜');
for (const s of signs) {
  console.log(`${s.name.padEnd(13)} ${String(s.people).padStart(5)} ${String(s.listed).padStart(9)}`
    + ` ${String(s.onCusp).padStart(7)}   ${s.from} ~ ${s.to}`);
}
console.log(`\n합 ${합} · 생년월일을 못 읽은 사람 ${unreadable}`);
if (합 + unreadable !== 사람들.length) {
  console.error(`🔴 셈이 안 맞는다 — ${합}+${unreadable} ≠ ${사람들.length}. 사람이 사라졌다`);
  process.exit(1);
}
console.log(`✅ 셈이 맞는다 — ${합}+${unreadable} = ${사람들.length}. 아무도 안 사라졌다`);
console.log(`냈다 — ${path.relative(뿌리, 낼길)}`);
