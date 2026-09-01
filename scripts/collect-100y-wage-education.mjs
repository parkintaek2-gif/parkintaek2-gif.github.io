#!/usr/bin/env node
/**
 * collect-100y-wage-education.mjs — **학력별로 월급여·시간당임금이 얼마나 다른가**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * `docs/새데이터-KOSIS-후보.md` 후보 — 「대학 갔을 때와 안 갔을 때를 같은 자로 재는
 * 유일한 축」. 표 118/DT_118N_LCE0003(고용형태별근로실태조사, 학력별 임금 및 근로시간).
 *
 * 🔴 2026-09-01 사고 뒤 — 이 표를 쓰기 전에 `scripts/lib/kosis-probe.mjs`로 objL 단계부터
 *   쟀다(2단계, err21 안 남). 짐작으로 3단계를 넣지 않았다.
 *
 * ── 표 ─────────────────────────────────────────────────────────
 *   118/DT_118N_LCE0003  「고용형태별근로실태조사」 학력별 임금 및 근로시간
 *   C1(고용형태) = 전체근로자 · 정규근로자 · 비정규근로자 (+특수형태 포함 변형 둘, 안 쓴다)
 *   C2(학력) = 전체 · 중졸이하 · 고졸 · 전문대졸 · 대졸 · 대학원졸
 *   조사기준 — 매년 6월. 표본사업체 33,000곳·근로자 약 100만명.
 *
 * ⛔⛔ 함정 — 「월급여액」은 **정액급여+초과급여**다. **상여금·성과급이 빠졌다**
 *   (통계설명 원문: 「전년도 연간 상여금 및 성과급 총액」은 별도 항목). 연봉 개념의
 *   총소득이 아니다 — 그 말을 지면에 못박는다.
 * ⛔ 학력만으로 임금 차이의 «원인»을 말하지 않는다. 근속연수·연령·산업·직종이 다 섞여
 *   있고 이 표는 그것들을 통제하지 않는다 — 상관이지 인과가 아니다.
 * ⛔ 「학력」은 그 근로자 개인의 최종학력이지, 하는 일의 요건이 아니다.
 *
 * 쓰는 법  node scripts/collect-100y-wage-education.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기, objL단계찾기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '118';
export const TBL = 'DT_118N_LCE0003';
export const 학력칸들 = ['중졸이하', '고졸', '전문대졸', '대졸', '대학원졸'];

/** 「3437」같은 문자열을 수로. 안 되면 null — 0으로 지어내지 않는다 */
export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 배수 — 대학원졸이 중졸이하의 몇 배인가. 소수 둘째자리 */
export function 배수(위, 아래) {
  if (위 == null || 아래 == null || !아래) return null;
  return Math.round((위 / 아래) * 100) / 100;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 학력칸이 다섯이다', 학력칸들.length === 5);
  본다('③ 쉼표 섞인 수를 읽는다', 수로('5,740') === 5740);
  본다('④ 배수를 낸다', 배수(5740, 1934) === 2.97);
  본다('⑤ 밑이 0이면 배수를 안 낸다', 배수(5, 0) === null && 배수(null, 5) === null);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-wage-education.mjs';
if (내가직접불렸나) {
  const 키 = 키읽기();
  const { 단계 } = await objL단계찾기(키, ORG, TBL);
  if (단계 == null) throw new Error(`${ORG}/${TBL} — objL 1~5단계 다 실패. 표를 의심해야 한다`);

  const objs = Array.from({ length: 단계 }, (_, i) => `&objL${i + 1}=ALL`).join('');
  const j = await (await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
    `&itmId=ALL${objs}&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=Y&newEstPrdCnt=1`
  )).json();
  if (!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0, 200));

  const 최신 = [...new Set(j.map((x) => x.PRD_DE))].sort().at(-1);
  const 값 = (고용형태, 학력, 항목) => 수로(j.find(
    (x) => x.PRD_DE === 최신 && x.C1_NM === 고용형태 && x.C2_NM === 학력 && x.ITM_NM === 항목)?.DT);

  const 표 = (고용형태) => 학력칸들.map((칸) => ({
    칸,
    월급여_천원: 값(고용형태, 칸, '월급여액'),
    시간당임금_원: 값(고용형태, 칸, '시간당임금총액'),
    총근로시간: 값(고용형태, 칸, '총근로시간'),
  }));

  const 전체 = 표('전체근로자');
  const 정규 = 표('정규근로자');
  const 비정규 = 표('비정규근로자');

  const 최고 = 전체.reduce((a, b) => (b.월급여_천원 > a.월급여_천원 ? b : a));
  const 최저 = 전체.reduce((a, b) => (b.월급여_천원 < a.월급여_천원 ? b : a));

  const 자료 = {
    무엇: '학력별 월급여·시간당임금 — 고용형태별근로실태조사',
    만든날: new Date().toLocaleString('sv-SE').slice(0, 10),
    최신: 최신,
    출처: {
      기관: '국가데이터처',
      표: '고용형태별근로실태조사 「학력별 임금 및 근로시간」',
      창구: 'KOSIS',
      orgId: ORG,
      tblId: TBL,
      조사대상: '표본사업체 33,000곳·근로자 약 100만명(근로자 1인 이상 사업체)',
      조사시점: '매년 6월 기준',
    },
    '⛔ 월급여액은 총소득이 아니다': '정액급여+초과급여만입니다. 「전년도 연간 상여금 및 성과급 총액」은 이 표에서 따로 잡는 별도 항목이라 빠졌습니다 — 연봉 개념이 아닙니다.',
    '⛔ 학력이 원인이라는 뜻이 아니다': '근속연수·연령·산업·직종을 이 표는 가르지 않습니다. 학력별 차이는 상관관계이지, 학력 하나가 임금을 결정한다는 인과관계가 아닙니다.',
    학력별_전체근로자: 전체,
    학력별_정규근로자: 정규,
    학력별_비정규근로자: 비정규,
    최고칸: 최고,
    최저칸: 최저,
    최고최저_배수: 배수(최고.월급여_천원, 최저.월급여_천원),
    자가대조: {
      '학력별 오름차순인가(중졸→대학원졸 갈수록 월급여가 늚)': 전체.every(
        (r, i) => i === 0 || r.월급여_천원 >= 전체[i - 1].월급여_천원,
      ),
    },
  };

  fs.writeFileSync(
    path.join(뿌리, 'src', 'data', '100yearmap', 'wage-education.json'),
    JSON.stringify(자료, null, 1) + '\n',
    'utf8',
  );
  console.log(`✅ ${최신}년 — 대졸/대학원졸 vs 중졸이하 월급여 배수: ${배수(전체[3].월급여_천원, 전체[0].월급여_천원)}배 · 전체 배수(최고/최저): ${자료.최고최저_배수}배`);
}
