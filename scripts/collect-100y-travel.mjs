#!/usr/bin/env node
/**
 * collect-100y-travel.mjs — **1년에 국내여행을 며칠이나 갈까, 나이대로 다른가**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님(2026-08-07, docs/백년지도-남들은-어떻게.md 「열두 고민」) — 「여행은?」
 * 열두 고민 중 반려동물 다음으로 여행 자리를 낸다(/pets 참고 · scripts/collect-100y-pets.mjs).
 *
 * ── 표 하나, 8년치 · 나이대까지 ──────────────────────────────────
 *   DT_113_STBL_1029263  문화체육관광부 「국민여행조사」 1인 평균 국내여행 일수 (만 15세 이상)
 *   2018~2025 여덟 해. 나이대·성별·직업·학력·소득·가구원수까지 갈래가 있다.
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · 표본조사다(전수조사 아님) — 국민여행조사 표본. 갈래가 잘게 갈릴수록 오차가 커진다
 * · 「일수」이지 「횟수」가 아니다. 하루짜리 여행 셋과 사흘짜리 여행 하나가 같은 3일로 잡힌다
 * · 2020~2021년은 코로나 시기다 — 그 두 해를 「평소」로 읽으면 안 된다
 * · 만 15세 이상만이다. 어린이 여행은 이 표에 없다
 *
 * 쓰는 법  node scripts/collect-100y-travel.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '113';
export const TBL = 'DT_113_STBL_1029263';

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
export const 한자리 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/** ⭐ 코로나 두 해(2020·2021)를 뺀 나머지 해 가운데 최근값이 코로나 전보다 회복됐나 */
export function 회복됐나(흐름) {
  const 코로나전 = 흐름.filter((r) => Number(r.해) < 2020);
  const 최근 = 흐름[흐름.length - 1];
  if (!코로나전.length || !최근) return null;
  const 코로나전평균 = 코로나전.reduce((s, r) => s + r.국내전체, 0) / 코로나전.length;
  return { 코로나전평균: 한자리(코로나전평균), 최근: 최근.국내전체, 회복: 최근.국내전체 >= 코로나전평균 };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 소수를 읽는다', 수로('10.15') === 10.15);
  본다('③ 코로나 전 평균보다 최근이 높으면 회복', 회복됐나([
    { 해: '2018', 국내전체: 12 }, { 해: '2019', 국내전체: 13 },
    { 해: '2020', 국내전체: 7 }, { 해: '2021', 국내전체: 8 }, { 해: '2025', 국내전체: 14 },
  ]).회복 === true);
  본다('④ 코로나 전보다 낮으면 회복이 아니다', 회복됐나([
    { 해: '2018', 국내전체: 12 }, { 해: '2019', 국내전체: 13 },
    { 해: '2020', 국내전체: 7 }, { 해: '2021', 국내전체: 8 }, { 해: '2025', 국내전체: 9 },
  ]).회복 === false);
  본다('⑤ 코로나 전 해가 없으면 못 잰다', 회복됐나([{ 해: '2020', 국내전체: 7 }]) === null);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-travel.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const j = await (await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&itmId=ALL&objL1=ALL&prdSe=Y&newEstPrdCnt=15`)).json();
  if (!Array.isArray(j)) throw new Error(`${TBL}: ${JSON.stringify(j).slice(0, 150)}`);

  const 해들 = [...new Set(j.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];
  const 값 = (해, 칸, 항) => 수로(j.find((x) => x.PRD_DE === 해 && x.C1_NM === 칸 && x.ITM_NM === 항)?.DT);

  const 흐름 = 해들.map((해) => ({
    해,
    국내전체: 값(해, '전체', '국내전체'),
    국내숙박: 값(해, '전체', '국내숙박'),
    국내당일: 값(해, '전체', '국내당일'),
  })).filter((r) => r.국내전체 != null);

  const 연령칸 = ['15~19세', '20대', '30대', '40대', '50대', '60대', '70세 이상'];
  const 연령별 = 연령칸.map((칸) => ({
    칸, 국내전체: 값(최신, 칸, '국내전체'), 국내숙박: 값(최신, 칸, '국내숙박'), 국내당일: 값(최신, 칸, '국내당일'),
  }));

  const 성별 = ['남자', '여자'].map((칸) => ({ 칸, 국내전체: 값(최신, 칸, '국내전체') }));

  /* 🔴 자가 대조 — 국내전체 = 국내숙박 + 국내당일 (정의상 같아야 한다)
   * ⚠ 표의 세 칸은 저마다 소수 둘째 자리로 **따로 반올림**되어 있다 — 그래서 두 조각을
   *   더한 값이 전체 칸과 0.01~0.02 차이 나는 것은 어긋난 것이 아니라 반올림이다.
   *   0.1 을 넘게 벌어지는 칸만 「어긋났다」고 본다(그 이상은 반올림으로 못 설명한다) */
  const 어긋난것 = [];
  for (const r of [...흐름, ...연령별]) {
    if (r.국내숙박 == null || r.국내당일 == null || r.국내전체 == null) continue;
    const 합 = r.국내숙박 + r.국내당일;
    if (Math.abs(합 - r.국내전체) > 0.1) 어긋난것.push({ ...r, 합: 한자리(합) });
  }
  const 자가대조 = {
    '국내숙박 + 국내당일 = 국내전체(반올림 0.1일 안)': { 어긋난칸수: 어긋난것.length, 맞나: 어긋난것.length === 0 },
    뜻: '세 칸이 저마다 따로 반올림되어 있어 0.1일 안의 차이는 반올림이다. 그 이상 벌어지면 내가 칸을 잘못 짝지은 것이다',
  };

  const 최신칸 = 흐름.find((r) => r.해 === 최신);
  const 가장많은연령 = [...연령별].filter((r) => r.국내전체 != null).sort((a, b) => b.국내전체 - a.국내전체)[0];
  const 가장적은연령 = [...연령별].filter((r) => r.국내전체 != null).sort((a, b) => a.국내전체 - b.국내전체)[0];
  const 회복 = 회복됐나(흐름);

  const 낸다 = {
    무엇: '1년에 국내여행을 며칠이나 갈까, 나이대로 다른가',
    만든날: new Date().toISOString().slice(0, 10),
    최신, 해들, 해수: 해들.length,
    출처: {
      기관: '문화체육관광부',
      표: '국민여행조사 「1인 평균 국내여행 일수(만 15세 이상 전 국민)」',
      창구: 'KOSIS', orgId: ORG, tblId: TBL,
    },
    '⚠ 이 자료가 못 가르는 것': [
      '표본조사입니다(전수조사 아님) — 갈래가 잘게 갈릴수록(나이대·성별 교차 등) 오차가 커집니다.',
      '「일수」이지 「횟수」가 아닙니다. 하루짜리 여행 셋과 사흘짜리 여행 하나가 같은 3일로 잡힙니다.',
      '2020~2021년은 코로나 시기입니다 — 그 두 해를 「평소」로 읽으면 안 됩니다.',
      '만 15세 이상만입니다. 어린이 여행은 이 표에 없습니다.',
    ],
    흐름, 최신칸, 연령별, 성별, 가장많은연령, 가장적은연령, 회복, 자가대조,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/travel.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');

  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   ${해들[0]}~${최신} (${해들.length}해) · ${최신}년 전체 ${최신칸.국내전체}일`);
  console.log(`   가장 많은 나이대 ${가장많은연령.칸}(${가장많은연령.국내전체}일) · 가장 적은 나이대 ${가장적은연령.칸}(${가장적은연령.국내전체}일)`);
  console.log(`   코로나 전(2018~2019) 평균 ${회복?.코로나전평균}일 → ${최신}년 ${회복?.최근}일 — ${회복?.회복 ? '회복됨' : '아직 못 미침'}`);
  console.log(`   자가대조: 숙박+당일=전체(반올림 0.1일 안) — 어긋난 칸 ${자가대조['국내숙박 + 국내당일 = 국내전체(반올림 0.1일 안)'].어긋난칸수}개`);
}
