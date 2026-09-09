#!/usr/bin/env node
/**
 * collect-100y-fertility-rate.mjs — 「합계출산율은 얼마나 떨어졌고, 최근엔 어떻게 움직였나」를 받는다.
 *
 * ── 왜 이 표를 쓰나 (2026-09-09) ──────────────────────────────
 * /birth-sex-ratio(출생성비)·/nonmarital-birth(혼인 밖 출생)·/remarriage(재혼)와 이어지는
 * 인구동향조사 계열의 다음 칸이다. 101/DT_1B81A17(시군구/합계출산율, 모의 연령별 출산율,
 * 2000~2025)에서 전국 연도별 합계출산율(ITM_ID=T1)과 최신년도 시도별(2자리 C1 코드) 분포를 뽑는다.
 *
 * ⛔ 「출산율이 낮다/정상이다」로 판정하지 않는다 — 해마다·지역마다 값을 그대로 보여 준다.
 * ⛔ 시군구 단위(3자리+ C1 코드)는 안 쓴다 — 시도(2자리 코드)까지만 낸다.
 *
 * 자가시험: node scripts/collect-100y-fertility-rate.mjs --selftest
 * 실행:     node scripts/collect-100y-fertility-rate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/fertility-rate.json');

/** rows(PRD_DE=연도, DT=값)에서 연도별 합계출산율을 뽑는다(ITM_ID=T1·C1=00 전국만 넘겨받는다는 전제) */
export function 전국연도별뽑기(rows) {
  return (rows ?? [])
    .filter((r) => r.C1 === '00')
    .map((r) => ({ 해: r.PRD_DE, 합계출산율: r.DT != null ? Number(r.DT) : null }))
    .sort((a, b) => a.해.localeCompare(b.해));
}

/** rows(2자리 시도 C1 코드)에서 최신년도 시도분포를 값 내림차순으로 뽑는다(전국=00 제외) */
export function 시도분포뽑기(rows) {
  return (rows ?? [])
    .filter((r) => /^\d{2}$/.test(r.C1) && r.C1 !== '00')
    .map((r) => ({ 시도: r.C1_NM, 합계출산율: r.DT != null ? Number(r.DT) : null }))
    .filter((r) => r.합계출산율 != null)
    .sort((a, b) => b.합계출산율 - a.합계출산율);
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 연도표본 = [
    { C1: '00', PRD_DE: '2023', DT: '0.721' },
    { C1: '00', PRD_DE: '2000', DT: '1.48' },
    { C1: '11', PRD_DE: '2023', DT: '0.55' },
  ];
  const 연도별 = 전국연도별뽑기(연도표본);
  검('전국(C1=00)만 뽑는다', 연도별.length === 2);
  검('연도 오름차순 정렬', 연도별[0].해 === '2000' && 연도별[1].해 === '2023');
  검('숫자로 바꾼다', 연도별[0].합계출산율 === 1.48);

  const 시도표본 = [
    { C1: '00', C1_NM: '전국', DT: '0.799' },
    { C1: '11', C1_NM: '서울특별시', DT: '0.632' },
    { C1: '36', C1_NM: '전라남도', DT: '1.094' },
    { C1: '111', C1_NM: '종로구', DT: '0.5' },
  ];
  const 시도별 = 시도분포뽑기(시도표본);
  검('전국·시군구(3자리+) 제외, 시도만 남는다', 시도별.length === 2);
  검('값 내림차순 정렬(1등이 가장 높다)', 시도별[0].시도 === '전라남도');
  검('⛔ 값 없는 줄은 뺀다', 시도분포뽑기([{ C1: '11', C1_NM: '서울', DT: null }]).length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-fertility-rate 자가시험 통과 (6)');
  process.exit(0);
}

const 키 = 키읽기();

const 연도url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=T1&objL1=00&format=json&jsonVD=Y&orgId=101&tblId=DT_1B81A17&prdSe=Y&startPrdDe=2000&endPrdDe=2025`;
const 연도원 = await (await fetch(연도url)).json();
if (!Array.isArray(연도원)) { console.error(`⛔ 연도표 못 받음 — ${JSON.stringify(연도원).slice(0, 200)}`); process.exit(1); }
const 전국연도별 = 전국연도별뽑기(연도원);

if (전국연도별.length < 20) {
  console.error(`⛔ 자가대조 실패 — 연도 수가 너무 적다(${전국연도별.length}). 2000~2025 26개년을 기대했다.`);
  process.exit(1);
}

const 최신년도 = 전국연도별[전국연도별.length - 1].해;
const 시도url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=T1&objL1=ALL&format=json&jsonVD=Y&orgId=101&tblId=DT_1B81A17&prdSe=Y&startPrdDe=${최신년도}&endPrdDe=${최신년도}`;
const 시도원 = await (await fetch(시도url)).json();
if (!Array.isArray(시도원)) { console.error(`⛔ 시도표 못 받음 — ${JSON.stringify(시도원).slice(0, 200)}`); process.exit(1); }
const 시도분포 = 시도분포뽑기(시도원);

if (시도분포.length !== 17) {
  console.error(`⛔ 자가대조 실패 — 시도 수가 17이어야 하는데 ${시도분포.length}개다. 표를 의심한다.`);
  process.exit(1);
}

const 최신 = 전국연도별[전국연도별.length - 1];
const 첫해 = 전국연도별[0];
const 최고 = 전국연도별.reduce((a, b) => (b.합계출산율 ?? -1) > (a.합계출산율 ?? -1) ? b : a, 전국연도별[0]);
const 최저 = 전국연도별.reduce((a, b) => (b.합계출산율 ?? 99) < (a.합계출산율 ?? 99) ? b : a, 전국연도별[0]);

if (!(최저.합계출산율 < 최신.합계출산율)) {
  console.error('⛔ 자가대조 실패 — 최근 2년(2023→2025) 반등을 직접 확인했는데, 받은 값에서는 최신년도가 최저년도보다 낮다. 받은 값을 의심한다.');
  process.exit(1);
}

const 출력 = {
  출처: {
    이름: '국가데이터처 KOSIS · 「인구동향조사」(신고 기반 행정통계 — 표본조사 아님)',
    표: '101/DT_1B81A17 (시군구/합계출산율, 모의 연령별 출산율)',
    주의: '시군구 단위(3자리 이상 코드)는 안 쓰고 시도(2자리 코드)까지만 낸다.',
    정의: '합계출산율(가임여성 1명당 명) = 연령별(15~49세) 출산율의 합 ÷ 1,000. 나눈 값이 그 해 여성 1명이 낳을 것으로 예상되는 평균 출생아 수다.',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-09',
  전국_연도별: 전국연도별,
  전국_최신: 최신,
  전국_첫해: 첫해,
  전국_최고: 최고,
  전국_최저: 최저,
  시도분포_최신: 시도분포,
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ 전국 ${전국연도별.length}개년(${첫해.해}~${최신.해}) · 시도 ${시도분포.length}곳 → ${path.relative(뿌리, 낼길)}`);
