#!/usr/bin/env node
/**
 * collect-100y-retire-income.mjs — **나이대별 가구 소득 — 은퇴 후 소득은 얼마나 줄어드나**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님(2026-08-22) — 「0~100세 × 다섯 분야」 기획서 1단계 로드맵 4번째, 경제(노후) 첫 지면.
 *
 * ── 표 ────────────────────────────────────────────────────────
 *   DT_1HDAAA06  org 101(국가데이터처)  「가구주연령계층별(10세) 자산 부채 소득 현황」
 *   가계금융복지조사 · 전가구 평균 · 5개 나이칸(29세 이하~60세 이상)
 *
 * ── ⭐ 실측으로 찾은 것 ──────────────────────────────────────────
 * 소득은 50대(9,416만원)에서 60세 이상(5,767만원)으로 -38.7% 급락한다 — 다른 어떤
 * 나이 구간 전환보다 크다. 그런데 자산은 50대(6억 6,205만원)→60세 이상(6억 95만원)으로
 * -9.2%만 줄어든다. **소득은 절벽처럼 줄지만 자산(주로 부동산)은 상대적으로 유지된다.**
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · "가구주 나이"별 평균이다 — 은퇴 시점 자체를 재는 표가 아니다(은퇴자만 따로 못 가른다)
 * · 평균이다. 중앙값과 다르며, 소수의 고액 가구가 평균을 끌어올릴 수 있다
 * · 60세 이상은 하나로 묶은 칸이다 — 60대와 80대는 소득·자산이 서로 다를 수 있으나
 *   이 표는 그 안을 더 못 가른다
 *
 * 쓰는 법  node scripts/collect-100y-retire-income.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '101';
export const TBL = 'DT_1HDAAA06';
export const 나이칸들 = ['29세 이하', '30~39세', '40~49세', '50~59세', '60세 이상'];

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** ⭐ 나이칸을 옮겨갈 때 값이 몇 % 바뀌는지 재고, 가장 크게 떨어지는 구간을 찾는다 */
export function 제일큰낙차(칸들, 키) {
  const 변화들 = [];
  for (let i = 1; i < 칸들.length; i++) {
    const 전 = 칸들[i - 1][키]; const 후 = 칸들[i][키];
    if (전 == null || 후 == null || 전 === 0) continue;
    변화들.push({ 전칸: 칸들[i - 1].칸, 후칸: 칸들[i].칸, 변화율: Number((((후 - 전) / 전) * 100).toFixed(1)) });
  }
  if (!변화들.length) return null;
  return 변화들.reduce((a, b) => (b.변화율 < a.변화율 ? b : a));
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 소수를 읽는다', 수로('9416.43') === 9416.43);
  본다('③ 다섯 칸이다', 나이칸들.length === 5);
  const 표본 = [
    { 칸: '29세 이하', v: 100 }, { 칸: '30~39세', v: 150 }, { 칸: '40~49세', v: 200 },
    { 칸: '50~59세', v: 210 }, { 칸: '60세 이상', v: 120 },
  ];
  const 낙 = 제일큰낙차(표본, 'v');
  본다('④ 가장 크게 떨어지는 구간을 찾는다', 낙.전칸 === '50~59세' && 낙.후칸 === '60세 이상');
  본다('⑤ 변화율을 계산한다(-42.9%)', Math.abs(낙.변화율 - (-42.9)) < 0.2);
  본다('⑥ 값이 없으면 그 구간은 건너뛰고 다음 유효한 구간을 쓴다', 제일큰낙차(
    [{ 칸: 'a', v: 100 }, { 칸: 'b', v: null }, { 칸: 'c', v: 50 }, { 칸: 'd', v: 80 }], 'v').후칸 === 'd');
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-retire-income.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const j = await (await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&itmId=ALL&objL1=ALL&objL2=ALL&objL3=ALL&prdSe=Y&newEstPrdCnt=2`)).json();
  if (!Array.isArray(j)) throw new Error(`${TBL}: ${JSON.stringify(j).slice(0, 200)}`);

  const 최신 = [...new Set(j.map((x) => x.PRD_DE))].sort().at(-1);
  const 값 = (c3, 칸) => 수로(j.find((x) => x.PRD_DE === 최신 && x.C1_NM === '전체' && x.ITM_NM === '전가구 평균' && x.C3_NM === c3 && x.C2_NM === 칸)?.DT);

  const 반올림 = (v) => (v == null ? null : Math.round(v));
  const 나이별 = 나이칸들.map((칸) => {
    const 자산 = 반올림(값('자산', 칸)); const 부채 = 반올림(값('부채', 칸));
    return {
      칸,
      경상소득: 반올림(값('경상소득(전년도)', 칸)),
      처분가능소득: 반올림(값('처분가능소득(전년도)', 칸)),
      자산, 부채,
      순자산: 자산 != null && 부채 != null ? 자산 - 부채 : null,
    };
  });

  /* 🔴 자가대조 — 처분가능소득은 경상소득에서 비소비지출을 뺀 것이니, 항상 경상소득 이하여야 한다 */
  const 어긋난것 = 나이별.filter((r) => r.경상소득 != null && r.처분가능소득 != null && r.처분가능소득 > r.경상소득 + 1);
  const 자가대조 = {
    '처분가능소득 ≤ 경상소득': { 어긋난칸수: 어긋난것.length, 맞나: 어긋난것.length === 0 },
    뜻: '처분가능소득(세금·이자 등 뺀 뒤)은 경상소득(세전)을 넘어설 수 없다',
  };

  const 소득낙차 = 제일큰낙차(나이별, '경상소득');
  const 자산낙차 = 제일큰낙차(나이별, '자산');

  const 낸다 = {
    무엇: '나이대별 가구 소득 — 은퇴 후 소득은 얼마나 줄어드나',
    만든날: new Date().toISOString().slice(0, 10),
    최신,
    출처: {
      기관: '국가데이터처(통계청) · 가계금융복지조사', 표: '가구주연령계층별(10세) 자산 부채 소득 현황',
      창구: 'KOSIS', orgId: ORG, tblId: TBL,
    },
    나이별,
    '⭐ 소득이 가장 크게 떨어지는 구간': 소득낙차,
    '⭐ 자산이 떨어지는 구간(비교용)': 자산낙차,
    '⚠ 이 자료가 못 가르는 것': [
      '"가구주 나이"별 평균입니다. 실제 은퇴 시점을 재는 표가 아니라, 은퇴자만 따로 가르지 못합니다.',
      '평균입니다. 중앙값과 다르며 소수의 고액 가구가 평균을 끌어올릴 수 있습니다.',
      '60세 이상은 하나로 묶은 칸입니다 — 60대와 80대의 차이는 이 표로 못 가릅니다.',
    ],
    자가대조,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/retire-income.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');

  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   ${최신}년 · 경상소득(만원): ${나이별.map((r) => `${r.칸} ${r.경상소득}`).join(' · ')}`);
  console.log(`   소득 최대 낙차: ${소득낙차.전칸}→${소득낙차.후칸} ${소득낙차.변화율}% · 자산 낙차(같은 구간 비교): ${자산낙차.전칸}→${자산낙차.후칸} ${자산낙차.변화율}%`);
  console.log(`   자가대조: 어긋난 칸 ${자가대조['처분가능소득 ≤ 경상소득'].어긋난칸수}개`);
}
