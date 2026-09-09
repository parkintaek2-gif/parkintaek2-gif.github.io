#!/usr/bin/env node
/**
 * collect-100y-multicultural-marriage.mjs — 「다문화 혼인은 늘었나 줄었나」를 받는다.
 *
 * ── 왜 이 표를 쓰나 (2026-09-09) ──────────────────────────────
 * /marriage-age·/divorce-age·/remarriage 의 다음 칸이다. 101/DT_1BB0002(지역별
 * 다문화 혼인, 2008~2024)로 전국 연도별 추세와 2024년 시도별 분포를 함께 뽑는다.
 *
 * ⛔ 이 표의 「다문화 혼인」은 부부 중 한쪽이 외국인이거나 귀화자인 혼인을 뜻한다 —
 *   국제결혼 전체가 아니라 이 표의 정의를 그대로 따른다.
 * ⛔ 시군구 단위(C1 다섯 자리)까지 있지만 이 지면은 시도 단위(C1 두 자리)까지만 쓴다.
 *   「국외」(재외국민 등, C1 두 자리이지만 시도가 아니다) 행은 지역 분포에서 뺀다.
 * ⛔ 늘었다/줄었다로 판정하지 않는다 — 해마다 값을 그대로 보여 준다.
 *
 * 자가시험: node scripts/collect-100y-multicultural-marriage.mjs --selftest
 * 실행:     node scripts/collect-100y-multicultural-marriage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/multicultural-marriage.json');

/** 전국 rows(PRD_DE=연도, ITM_NM=항목)에서 연도별 3칸(전체혼인·다문화혼인·비중)을 뽑는다 */
export function 전국연도별뽑기(rows) {
  const 전국 = (rows ?? []).filter((r) => r.C1_NM === '전국');
  const 연도들 = [...new Set(전국.map((r) => r.PRD_DE))].sort();
  return 연도들.map((해) => {
    const 그해 = 전국.filter((r) => r.PRD_DE === 해);
    const 값 = (이름) => {
      const v = 그해.find((r) => r.ITM_NM === 이름)?.DT;
      return v != null ? Number(v) : null;
    };
    return {
      해,
      전체혼인건수: 값('전체 혼인 건수(건)'),
      다문화혼인건수: 값('다문화 혼인 건수(건)'),
      다문화혼인비중: 값('다문화 혼인 비중(%)'),
    };
  });
}

/** rows(어느 한 해)에서 시도 단위(C1 두 자리, 「국외」·「전국」 제외)만 뽑아 비중 내림차순 */
export function 시도분포뽑기(rows, 해) {
  return (rows ?? [])
    .filter((r) => r.PRD_DE === 해 && r.ITM_NM === '다문화 혼인 비중(%)')
    .filter((r) => r.C1?.length === 2 && r.C1 !== '00' && r.C1_NM !== '국외')
    .map((r) => ({ 시도: r.C1_NM, 비중: Number(r.DT) }))
    .sort((a, b) => b.비중 - a.비중);
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 표본 = [
    { C1: '00', C1_NM: '전국', PRD_DE: '2024', ITM_NM: '전체 혼인 건수(건)', DT: '222412' },
    { C1: '00', C1_NM: '전국', PRD_DE: '2024', ITM_NM: '다문화 혼인 건수(건)', DT: '21450' },
    { C1: '00', C1_NM: '전국', PRD_DE: '2024', ITM_NM: '다문화 혼인 비중(%)', DT: '9.6' },
    { C1: '11', C1_NM: '서울특별시', PRD_DE: '2024', ITM_NM: '다문화 혼인 비중(%)', DT: '9.5' },
    { C1: '99', C1_NM: '국외', PRD_DE: '2024', ITM_NM: '다문화 혼인 비중(%)', DT: '82.6' },
    { C1: '11010', C1_NM: '종로구', PRD_DE: '2024', ITM_NM: '다문화 혼인 비중(%)', DT: '16.4' },
  ];
  const 전국뽑음 = 전국연도별뽑기(표본);
  검('전국만 뽑는다', 전국뽑음.length === 1);
  검('숫자로 바꾼다', 전국뽑음[0].다문화혼인비중 === 9.6);
  검('⛔ 없는 항목은 null', 전국연도별뽑기([{ C1_NM: '전국', PRD_DE: '2000', ITM_NM: '전체 혼인 건수(건)', DT: '1' }])[0].다문화혼인비중 === null);

  const 분포뽑음 = 시도분포뽑기(표본, '2024');
  검('시도만 남는다(전국·국외·구 제외)', 분포뽑음.length === 1 && 분포뽑음[0].시도 === '서울특별시');
  검('⛔ 국외는 뺀다', !분포뽑음.some((r) => r.시도 === '국외'));
  검('⛔ 구 단위(5자리)는 뺀다', !분포뽑음.some((r) => r.시도 === '종로구'));

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-multicultural-marriage 자가시험 통과 (6)');
  process.exit(0);
}

const 키 = 키읽기();

const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&orgId=101&tblId=DT_1BB0002&prdSe=Y&startPrdDe=2008&endPrdDe=2025`;
const 원자료 = await (await fetch(url)).json();
if (!Array.isArray(원자료)) { console.error(`⛔ 못 받음 — ${JSON.stringify(원자료).slice(0, 200)}`); process.exit(1); }

const 전국연도별 = 전국연도별뽑기(원자료);
if (전국연도별.length < 15) {
  console.error(`⛔ 자가대조 실패 — 연도 수가 너무 적다(${전국연도별.length}). 2008~2024 17개년을 기대했다.`);
  process.exit(1);
}

const 최신 = 전국연도별[전국연도별.length - 1];
const 첫해 = 전국연도별[0];
const 고점 = 전국연도별.reduce((a, b) => (b.다문화혼인비중 ?? -1) > (a.다문화혼인비중 ?? -1) ? b : a, 전국연도별[0]);
const 저점 = 전국연도별.reduce((a, b) => (b.다문화혼인비중 ?? 101) < (a.다문화혼인비중 ?? 101) ? b : a, 전국연도별[0]);

const 시도분포 = 시도분포뽑기(원자료, 최신.해);
if (시도분포.length < 15) {
  console.error(`⛔ 자가대조 실패 — 시도 수가 너무 적다(${시도분포.length}). 17개 시도를 기대했다.`);
  process.exit(1);
}

const 출력 = {
  출처: {
    이름: '국가데이터처 KOSIS · 「인구동향조사」(신고 기반 행정통계 — 표본조사 아님)',
    표: '101/DT_1BB0002 (지역별 다문화 혼인)',
    주의: '이 표의 「다문화 혼인」은 부부 중 한쪽이 외국인이거나 귀화자인 혼인이다. 「국외」 행은 시도가 아니라 지역 분포에서 뺐다.',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-09',
  전국_연도별: 전국연도별,
  전국_최신: 최신,
  전국_첫해: 첫해,
  전국_고점: 고점,
  전국_저점: 저점,
  시도분포_최신: 시도분포,
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ 전국 ${전국연도별.length}개년(${첫해.해}~${최신.해}) · 시도 ${시도분포.length}곳(${최신.해}) → ${path.relative(뿌리, 낼길)}`);
