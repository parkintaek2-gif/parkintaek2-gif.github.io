#!/usr/bin/env node
/**
 * collect-100y-birth-sex-ratio.mjs — 「태어날 때 성비는 얼마나 기울었었나」를 받는다.
 *
 * ── 왜 이 표를 쓰나 (2026-09-09) ──────────────────────────────
 * 101/DT_1B81A19(시도/몇째아이별 출생성비, 1990~2025)로 전국 연도별 추세
 * (총출생성비·첫째아·둘째아·셋째아이상)와 2024년 시도별 분포를 함께 뽑는다.
 *
 * ⛔ 출생성비 = 그해 태어난 여아 100명당 남아 수. 자연 상태에서 보통 103~107
 *   사이로 알려져 있다는 것은 표 밖의 상식이지, 우리가 매기는 「정상」이 아니다.
 *   지면에는 표에 있는 숫자만 놓는다.
 * ⛔ 이 표는 시군구가 아니라 시도 단위(C1 두 자리)까지다. 「전국」(C1=00)은
 *   지역 분포에서 뺀다.
 *
 * 자가시험: node scripts/collect-100y-birth-sex-ratio.mjs --selftest
 * 실행:     node scripts/collect-100y-birth-sex-ratio.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/birth-sex-ratio.json');

/** 전국 rows(PRD_DE=연도, ITM_NM=몇째아이)에서 연도별 4칸을 뽑는다 */
export function 전국연도별뽑기(rows) {
  const 전국 = (rows ?? []).filter((r) => r.C1_NM === '전국');
  const 연도들 = [...new Set(전국.map((r) => r.PRD_DE))].sort();
  return 연도들.map((해) => {
    const 그해 = 전국.filter((r) => r.PRD_DE === 해);
    const 값 = (이름) => {
      const v = 그해.find((r) => r.ITM_NM === 이름)?.DT;
      return v != null && v !== '-' ? Number(v) : null;
    };
    return {
      해,
      총출생성비: 값('총출생성비'),
      첫째아: 값('첫째아'),
      둘째아: 값('둘째아'),
      셋째아이상: 값('셋째아이상'),
    };
  });
}

/** rows(어느 한 해)에서 시도 단위(「전국」 제외) 총출생성비만 뽑아 내림차순 */
export function 시도분포뽑기(rows, 해) {
  return (rows ?? [])
    .filter((r) => r.PRD_DE === 해 && r.ITM_NM === '총출생성비')
    .filter((r) => r.C1_NM !== '전국')
    .map((r) => ({ 시도: r.C1_NM, 성비: Number(r.DT) }))
    .sort((a, b) => b.성비 - a.성비);
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 표본 = [
    { C1_NM: '전국', PRD_DE: '2024', ITM_NM: '총출생성비', DT: '105' },
    { C1_NM: '전국', PRD_DE: '2024', ITM_NM: '첫째아', DT: '103.5' },
    { C1_NM: '전국', PRD_DE: '2024', ITM_NM: '둘째아', DT: '104.2' },
    { C1_NM: '전국', PRD_DE: '2024', ITM_NM: '셋째아이상', DT: '102.5' },
    { C1_NM: '서울특별시', PRD_DE: '2024', ITM_NM: '총출생성비', DT: '104' },
    { C1_NM: '제주특별자치도', PRD_DE: '2024', ITM_NM: '총출생성비', DT: '101.5' },
  ];
  const 전국뽑음 = 전국연도별뽑기(표본);
  검('전국만 뽑는다', 전국뽑음.length === 1);
  검('숫자로 바꾼다', 전국뽑음[0].총출생성비 === 105);
  검('셋째아이상도 뽑는다', 전국뽑음[0].셋째아이상 === 102.5);
  검('⛔ 없는 항목은 null', 전국연도별뽑기([{ C1_NM: '전국', PRD_DE: '2000', ITM_NM: '첫째아', DT: '1' }])[0].총출생성비 === null);
  검('⛔ 「-」는 null', 전국연도별뽑기([{ C1_NM: '전국', PRD_DE: '2000', ITM_NM: '총출생성비', DT: '-' }])[0].총출생성비 === null);

  const 분포뽑음 = 시도분포뽑기(표본, '2024');
  검('시도만 남는다(전국 제외)', 분포뽑음.length === 2 && !분포뽑음.some((r) => r.시도 === '전국'));
  검('내림차순', 분포뽑음[0].시도 === '서울특별시');

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-birth-sex-ratio 자가시험 통과 (7)');
  process.exit(0);
}

const 키 = 키읽기();

const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&orgId=101&tblId=DT_1B81A19&prdSe=Y&startPrdDe=1990&endPrdDe=2025`;
const 원자료 = await (await fetch(url)).json();
if (!Array.isArray(원자료)) { console.error(`⛔ 못 받음 — ${JSON.stringify(원자료).slice(0, 200)}`); process.exit(1); }

const 전국연도별 = 전국연도별뽑기(원자료);
if (전국연도별.length < 30) {
  console.error(`⛔ 자가대조 실패 — 연도 수가 너무 적다(${전국연도별.length}). 1990~2025 36개년을 기대했다.`);
  process.exit(1);
}

const 최신 = 전국연도별[전국연도별.length - 1];
const 첫해 = 전국연도별[0];
const 고점 = 전국연도별.reduce((a, b) => (b.총출생성비 ?? -1) > (a.총출생성비 ?? -1) ? b : a, 전국연도별[0]);
const 저점 = 전국연도별.reduce((a, b) => (b.총출생성비 ?? 999) < (a.총출생성비 ?? 999) ? b : a, 전국연도별[0]);
const 셋째고점 = 전국연도별.reduce((a, b) => (b.셋째아이상 ?? -1) > (a.셋째아이상 ?? -1) ? b : a, 전국연도별[0]);

const 시도분포 = 시도분포뽑기(원자료, 최신.해);
if (시도분포.length < 15) {
  console.error(`⛔ 자가대조 실패 — 시도 수가 너무 적다(${시도분포.length}). 17개 시도를 기대했다.`);
  process.exit(1);
}

const 출력 = {
  출처: {
    이름: '국가데이터처 KOSIS · 「인구동향조사」(신고 기반 행정통계 — 표본조사 아님)',
    표: '101/DT_1B81A19 (시도/몇째아이별 출생성비)',
    주의: '출생성비는 그해 태어난 여아 100명당 남아 수다. 「전국」 행은 지역 분포에서 뺐다.',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-09',
  전국_연도별: 전국연도별,
  전국_최신: 최신,
  전국_첫해: 첫해,
  전국_고점: 고점,
  전국_저점: 저점,
  전국_셋째아이상_고점: 셋째고점,
  시도분포_최신: 시도분포,
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ 전국 ${전국연도별.length}개년(${첫해.해}~${최신.해}) · 시도 ${시도분포.length}곳(${최신.해}) → ${path.relative(뿌리, 낼길)}`);
