#!/usr/bin/env node
/**
 * build-gulf-macro-tape.mjs — **걸프 여섯 나라의 «석유 말고 나머지»를 잰다.**
 *
 *   node scripts/build-gulf-macro-tape.mjs
 *   node scripts/build-gulf-macro-tape.mjs --자가시험
 *
 * ── 🔴 왜 (2026-09-22 · 5번) ────────────────────────────────────────────
 *   사장님 지시 — 「모은 자료는 반드시 지면이나 콘텐트로 낸다」.
 *   `archive/raw/gccstat` 에 국민계정 25,813줄이 2026-09-16 부터 쌓여 있는데
 *   읽는 지면이 한 장도 없었다.
 *
 * ── ⭐ 이 자가 내는 것 — 「다변화했나」를 «두 가지 방법»으로 잰다 ──────────
 *   GCC 통계국은 나라·해마다 **석유 부문 / 비석유 부문**을 갈라 낸다. 우리 추정이 아니다.
 *
 *   ① 비석유 «비중»  (경상가격)   — 흔히 쓰는 수. 그런데 **유가가 떨어지면 저절로 오른다**
 *   ② 비석유 «크기»  (불변가격)   — 유가와 무관하다. 진짜 커졌나를 이것이 답한다
 *
 *   ⛔ ①만 내면 2014~2016 유가 폭락을 「다변화 성공」으로 읽게 만든다. 둘을 같이 낸다.
 *
 * ── ⛔ 이 자가 안 하는 것 ──────────────────────────────────────────────
 *   ⛔ 불변가격 «수준»을 나라끼리 맞대지 않는다 — 기준해가 넷이다
 *     (쿠웨이트·바레인·에미리트 2010=100 · 카타르·오만 2018=100 · 사우디 연쇄 2023=100).
 *     나라끼리는 «경상가격 비중»으로, 한 나라 안에서는 «불변가격 지수»로 본다.
 *   ⛔ 빠진 해를 앞뒤로 메우지 않는다. 없으면 없다고 적는다.
 *   ⛔ 「좋아졌다·나빠졌다」로 적지 않는다. 오르고 내린 것만 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 곳간 = path.join(뿌리, 'archive', 'raw', 'gccstat');
const 나갈곳 = path.join(뿌리, 'src', 'data', 'gulf-macro.json');

/** GCC 통계국이 쓰는 이름 → 우리가 손님에게 쓰는 이름 */
export const 나라이름 = {
  'Saudi Arabia': 'Saudi Arabia',
  Emirates: 'United Arab Emirates',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
  Oman: 'Oman',
  Bahrain: 'Bahrain',
  'Gulf Cooperation Council': 'GCC (all six)',
};
export const 나라차례 = ['Saudi Arabia', 'Emirates', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Gulf Cooperation Council'];

export const 지표이름 = {
  'Oil sector at current prices': ['oil', '경상'],
  'Non-oil sector at current prices': ['nonoil', '경상'],
  'Gross Domestic Product at Current Prices': ['gdp', '경상'],
  'Oil sector at constant prices': ['oil', '불변'],
  'Non-oil sector at constant prices': ['nonoil', '불변'],
  'Gross Domestic Product at Constant Prices': ['gdp', '불변'],
};

/**
 * 따옴표를 아는 CSV 한 줄 자르기.
 * ⚠ GCC 자료에는 `"01. Agriculture, hunting"` 처럼 **칸 안에 쉼표**가 있다.
 *   split(',') 로 자르면 칸이 밀려 다른 나라 수가 그 자리에 들어간다.
 */
export function 줄자르기(줄) {
  const 것 = [];
  let 칸 = '';
  let 따옴표 = false;
  const s = String(줄 ?? '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (따옴표 && s[i + 1] === '"') { 칸 += '"'; i++; } else 따옴표 = !따옴표;
    } else if (c === ',' && !따옴표) { 것.push(칸); 칸 = ''; } else 칸 += c;
  }
  것.push(칸);
  return 것;
}

/** 해마다 낸 값만 쓴다 — 분기(2024-Q1)는 여기서 안 쓴다 */
export function 해인가(t) { return /^\d{4}$/.test(String(t ?? '')); }

/** 숫자로 읽되, 못 읽으면 «0 이 아니라» null 이다 */
export function 수로(v) {
  /* ⛔ Number('') 는 0 이다 — 빈 칸이 「0 달러」가 되어 표에 진짜 0 처럼 앉는다.
     GCC 자료는 못 낸 값을 빈 칸으로 둔다. 빈 것은 «못 쟀다»이지 0 이 아니다. */
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 비중(%) — 못 재면 null. ⛔ 분모가 0이면 0% 가 아니라 못 잰 것이다 */
export function 비중(부분, 전체) {
  if (부분 == null || 전체 == null || !(전체 > 0)) return null;
  return (부분 / 전체) * 100;
}

/** 첫 해를 100 으로 둔 지수 — 기준해가 나라마다 달라도 «자기 자신과»는 견줄 수 있다 */
export function 지수(값들, 첫값) {
  if (첫값 == null || !(첫값 > 0)) return null;
  return 값들.map((v) => (v == null ? null : (v / 첫값) * 100));
}

/** 가장 최근에 받은 날 폴더 */
export function 최근날(날들) {
  const 것 = (날들 || []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  return 것.length ? 것[것.length - 1] : null;
}

/**
 * 국민계정 CSV 를 읽어 나라·해별 석유/비석유/전체를 만든다.
 * @returns {{값: object, 기준해: object, 해들: string[]}}
 */
export function 국민계정읽기(글) {
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  if (줄들.length < 2) return { 값: {}, 기준해: {}, 해들: [] };
  const 머리 = 줄자르기(줄들[0]);
  const 칸 = (이름) => 머리.indexOf(이름);
  const c나라 = 칸('COUNTRY'); const c가격 = 칸('PRICES TYPES'); const c지표 = 칸('INDICATOR');
  const c해 = 칸('TIME_PERIOD'); const c값 = 칸('OBS_VALUE');
  if ([c나라, c가격, c지표, c해, c값].some((x) => x < 0)) return { 값: {}, 기준해: {}, 해들: [] };

  const 값 = {};
  const 기준해 = {};
  const 해모음 = new Set();
  for (let i = 1; i < 줄들.length; i++) {
    if (!줄들[i]) continue;
    const r = 줄자르기(줄들[i]);
    const 지 = 지표이름[r[c지표]];
    if (!지) continue;
    const 해 = r[c해];
    if (!해인가(해)) continue;
    const 나 = r[c나라];
    if (!(나 in 나라이름)) continue;
    const [무엇, 가격] = 지;
    const v = 수로(r[c값]);
    if (v == null) continue;
    값[나] = 값[나] || {};
    값[나][해] = 값[나][해] || {};
    값[나][해][`${무엇}_${가격}`] = v;
    해모음.add(해);
    if (가격 === '불변') 기준해[나] = r[c가격];
  }
  return { 값, 기준해, 해들: [...해모음].sort() };
}

/** 한 나라를 손님 줄로 — 비중과 지수를 여기서 셈한다 */
export function 나라줄(코드, 해들, 값) {
  const 것 = 값[코드] || {};
  const 있는해 = 해들.filter((y) => 것[y] && 것[y].gdp_경상 != null);
  const 비석유비중 = 있는해.map((y) => 비중(것[y].nonoil_경상, 것[y].gdp_경상));
  const 불변비석유 = 있는해.map((y) => (것[y].nonoil_불변 ?? null));
  const 불변석유 = 있는해.map((y) => (것[y].oil_불변 ?? null));
  const 첫불변 = 불변비석유.find((v) => v != null) ?? null;
  const 첫석유 = 불변석유.find((v) => v != null) ?? null;
  return {
    code: 코드,
    name: 나라이름[코드],
    years: 있는해,
    /* 나라끼리 견줄 수 있는 것 — 경상가격 비중 */
    nonoil_share: 비석유비중.map((v) => (v == null ? null : Math.round(v * 10) / 10)),
    /* 한 나라 «안»에서만 견주는 것 — 첫 해를 100 으로 둔 불변가격 지수 */
    nonoil_index: (지수(불변비석유, 첫불변) || []).map((v) => (v == null ? null : Math.round(v * 10) / 10)),
    oil_index: (지수(불변석유, 첫석유) || []).map((v) => (v == null ? null : Math.round(v * 10) / 10)),
    gdp_usd_m: 있는해.map((y) => (것[y].gdp_경상 == null ? null : Math.round(것[y].gdp_경상))),
  };
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);

  검('칸 안 쉼표를 안 깬다',
    줄자르기('a,"01. Agriculture, hunting",c').length === 3
    && 줄자르기('a,"01. Agriculture, hunting",c')[1] === '01. Agriculture, hunting');
  검('겹따옴표를 푼다', 줄자르기('a,"he said ""hi""",c')[1] === 'he said "hi"');
  검('빈 칸을 잃지 않는다', 줄자르기('a,,c').length === 3 && 줄자르기('a,,c')[1] === '');
  검('⛔ null 에도 안 터진다', 줄자르기(null).length === 1);

  검('해만 고른다', 해인가('2024') && !해인가('2024-Q1') && !해인가('') && !해인가(null));

  검('숫자를 읽는다', 수로('1234.5') === 1234.5);
  검('⛔ 못 읽으면 0 이 아니라 null 이다', 수로('') === null && 수로('n/a') === null && 수로(null) === null);

  검('비중을 낸다', Math.round(비중(60, 200)) === 30);
  검('⛔ 분모가 0 이면 못 잰 것이다', 비중(10, 0) === null);
  검('⛔ 값이 없으면 못 잰 것이다', 비중(null, 100) === null && 비중(10, null) === null);

  검('지수를 낸다 — 첫 해가 100', 지수([50, 75], 50)[0] === 100 && 지수([50, 75], 50)[1] === 150);
  검('⛔ 구멍을 메우지 않는다', 지수([50, null, 75], 50)[1] === null);
  검('⛔ 첫값이 0 이면 지수를 안 만든다', 지수([0, 5], 0) === null);

  검('가장 최근 날을 고른다', 최근날(['2026-09-16', '2026-08-01']) === '2026-09-16');
  검('⛔ 날꼴이 아닌 것은 안 센다', 최근날(['_tmp', '2026-09-16']) === '2026-09-16');
  검('⛔ 빈 것이면 null', 최근날([]) === null && 최근날(null) === null);

  const 보기 = [
    'COUNTRY,FREQUENCY,PRICES TYPES,INDICATOR,UNIT,TIME_PERIOD,OBS_VALUE',
    'Oman,Annual,Current prices,Oil sector at current prices,"United States Dollar, Million",2010,30000',
    'Oman,Annual,Current prices,Non-oil sector at current prices,"United States Dollar, Million",2010,30000',
    'Oman,Annual,Current prices,Gross Domestic Product at Current Prices,"United States Dollar, Million",2010,60000',
    'Oman,Annual,Constant prices 2018=100,Non-oil sector at constant prices,"United States Dollar, Million",2010,30000',
    'Oman,Annual,Current prices,Oil sector at current prices,"United States Dollar, Million",2020,15000',
    'Oman,Annual,Current prices,Non-oil sector at current prices,"United States Dollar, Million",2020,45000',
    'Oman,Annual,Current prices,Gross Domestic Product at Current Prices,"United States Dollar, Million",2020,60000',
    'Oman,Annual,Constant prices 2018=100,Non-oil sector at constant prices,"United States Dollar, Million",2020,33000',
    'Oman,Annual,Current prices,Oil sector at current prices,"United States Dollar, Million",2020-Q1,1',
    'Narnia,Annual,Current prices,Gross Domestic Product at Current Prices,"United States Dollar, Million",2020,1',
  ].join('\n');
  const 읽은 = 국민계정읽기(보기);
  검('국민계정을 읽는다', 읽은.해들.join(',') === '2010,2020');
  검('⛔ 분기는 안 담는다', !읽은.해들.includes('2020-Q1'));
  검('⛔ 모르는 나라는 안 담는다', !('Narnia' in 읽은.값));
  검('불변가격 기준해를 적어 둔다', 읽은.기준해.Oman === 'Constant prices 2018=100');

  const 줄 = 나라줄('Oman', 읽은.해들, 읽은.값);
  검('비석유 비중을 낸다 — 50% → 75%', 줄.nonoil_share[0] === 50 && 줄.nonoil_share[1] === 75);
  검('🔴 그런데 불변가격으로는 10% 만 컸다', 줄.nonoil_index[0] === 100 && 줄.nonoil_index[1] === 110);
  검('⭐ 비중과 지수가 다른 말을 한다 — 이것이 이 지면의 이야기다',
    줄.nonoil_share[1] - 줄.nonoil_share[0] === 25 && 줄.nonoil_index[1] - 줄.nonoil_index[0] === 10);
  검('손님 이름을 쓴다', 나라줄('Emirates', [], {}).name === 'United Arab Emirates');
  검('⛔ 자료가 없으면 빈 해 목록을 준다', 나라줄('Qatar', ['2010'], {}).years.length === 0);
  검('GDP 를 백만 달러로 담는다', 줄.gdp_usd_m[0] === 60000);
  검('나라 차례에 여섯과 합계가 있다', 나라차례.length === 7 && 나라차례.includes('Gulf Cooperation Council'));
  검('⛔ 손님 이름에 한국어가 없다', !/[가-힣]/.test(Object.values(나라이름).join('')));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 짓는다 ──────────────────────────────────────────────── */
if (내가진입점) {
  if (!fs.existsSync(곳간)) { console.error('🔴 곳간이 없다 — archive/raw/gccstat'); process.exit(1); }
  const 날 = 최근날(fs.readdirSync(곳간));
  if (!날) { console.error('🔴 받은 날이 없다'); process.exit(1); }
  const 길 = path.join(곳간, 날, 'national-accounts.csv');
  if (!fs.existsSync(길)) { console.error(`🔴 국민계정 파일이 없다 — ${날}`); process.exit(1); }

  const { 값, 기준해, 해들 } = 국민계정읽기(fs.readFileSync(길, 'utf8'));
  const 줄들 = 나라차례.map((c) => 나라줄(c, 해들, 값)).filter((r) => r.years.length);
  if (!줄들.length) { console.error('🔴 읽은 나라가 없다'); process.exit(1); }

  const 낼것 = {
    무엇: 'Oil and non-oil GDP for the six Gulf states, as the GCC’s own statistics office splits it.',
    출처: 'GCC Statistical Centre (GCC-Stat), SDMX API — gccstat.org',
    받은날: 날,
    해들,
    /* 🔴 기준해가 나라마다 다르다 — 지면이 이것을 손님에게 말한다 */
    기준해: Object.fromEntries(Object.entries(기준해).map(([k, v]) => [나라이름[k] || k, v])),
    rows: 줄들,
  };
  const 글 = JSON.stringify(낼것);
  if (/[가-힣]/.test(글.replace(/"(무엇|출처|받은날|해들|기준해)"/g, ''))) {
    /* 칸 이름은 우리 것이라 한국어여도 되지만 «값»에는 없어야 한다 */
    const 값글 = JSON.stringify(줄들);
    if (/[가-힣]/.test(값글)) { console.error('🔴 손님 자료에 한국어가 있다 — 안 낸다'); process.exit(1); }
  }
  fs.writeFileSync(나갈곳, 글, 'utf8');

  console.log(`■ 걸프 국민계정 — 나라 ${줄들.length} · ${해들[0]}~${해들[해들.length - 1]} (받은날 ${날})`);
  for (const r of 줄들) {
    const a = r.nonoil_share[0]; const b = r.nonoil_share[r.nonoil_share.length - 1];
    const ia = r.nonoil_index[0]; const ib = r.nonoil_index[r.nonoil_index.length - 1];
    console.log(`   ${r.name.padEnd(24)} 비석유비중 ${a == null ? ' — ' : String(a).padStart(5)}% → ${b == null ? ' — ' : String(b).padStart(5)}%`
      + `   불변지수 ${ia == null ? ' — ' : ia} → ${ib == null ? ' — ' : ib}   (${r.years[0]}~${r.years[r.years.length - 1]})`);
  }
  console.log(`   → ${path.relative(뿌리, 나갈곳)}`);
}
