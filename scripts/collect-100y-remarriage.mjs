#!/usr/bin/env node
/**
 * collect-100y-remarriage.mjs — 「재혼은 얼마나 흔한가, 사별 후냐 이혼 후냐」를 받는다.
 *
 * ── 왜 이 표를 쓰나 (2026-09-09) ──────────────────────────────
 * /marriage-age(결혼 나이)·/divorce-age(이혼)의 다음 칸이다. 인생나침반은 초혼만 다루지
 * 않는다 — 「집은? 결혼은? …」에 재혼도 들어간다. 101/DT_1B83A11(시도/부부의 혼인종류별
 * 혼인, 1990~2025)로 전국 합계만 뽑는다(시도별은 남편 주소지 기준이라 전국만 쓴다).
 *
 * ⛔ 이 표는 아내의 혼인종류(C3)와 남편의 혼인종류(C2)를 따로 센다 — 부부 중 한쪽만
 *   미상이어도 다른 쪽 집계에는 안 들어간다. 그래서 「아내 재혼 건수」와 「남편 재혼 건수」가
 *   서로 다르다. 이것을 하나로 합치거나 평균 내지 않는다 — 각각 그대로 낸다.
 * ⛔ 「재혼이 늘었다/줄었다」로 판정하지 않는다 — 해마다 값을 그대로 보여 준다.
 *
 * 자가시험: node scripts/collect-100y-remarriage.mjs --selftest
 * 실행:     node scripts/collect-100y-remarriage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/remarriage.json');

/** rows(C1_NM=전국, PRD_DE=연도, 종류이름 필드=NM필드)에서 연도별 5칸(총계·초혼·재혼·사별후 재혼·이혼후 재혼·미상)을 뽑는다 */
export function 연도별뽑기(rows, NM필드) {
  const 전국 = (rows ?? []).filter((r) => r.C1_NM === '전국');
  const 연도들 = [...new Set(전국.map((r) => r.PRD_DE))].sort();
  return 연도들.map((해) => {
    const 그해 = 전국.filter((r) => r.PRD_DE === 해);
    const 값 = (이름) => {
      const v = 그해.find((r) => r[NM필드] === 이름)?.DT;
      return v != null ? Number(v) : null;
    };
    return {
      해,
      총계: 값('총계'),
      초혼: 값('초혼'),
      재혼: 값('재혼'),
      사별후재혼: 값('사별후 재혼'),
      이혼후재혼: 값('이혼후 재혼'),
      미상: 값('미상'),
    };
  });
}

/** 재혼비중(%) = 재혼 ÷ 총계 × 100. 분모 없으면 null */
export function 재혼비중(줄) {
  if (!줄 || !줄.총계 || 줄.재혼 == null) return null;
  return Math.round((줄.재혼 / 줄.총계) * 1000) / 10;
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 표본 = [
    { C1_NM: '전국', PRD_DE: '2025', C3_NM: '총계', DT: '240326' },
    { C1_NM: '전국', PRD_DE: '2025', C3_NM: '초혼', DT: '206443' },
    { C1_NM: '전국', PRD_DE: '2025', C3_NM: '재혼', DT: '32785' },
    { C1_NM: '전국', PRD_DE: '2025', C3_NM: '사별후 재혼', DT: '1848' },
    { C1_NM: '전국', PRD_DE: '2025', C3_NM: '이혼후 재혼', DT: '30937' },
    { C1_NM: '전국', PRD_DE: '2025', C3_NM: '미상', DT: '1098' },
    { C1_NM: '서울특별시', PRD_DE: '2025', C3_NM: '총계', DT: '99' },
  ];
  const 뽑음 = 연도별뽑기(표본, 'C3_NM');
  검('전국만 뽑는다(서울 제외)', 뽑음.length === 1);
  검('숫자로 바꾼다', 뽑음[0].총계 === 240326);
  검('사별후재혼·이혼후재혼을 따로 낸다', 뽑음[0].사별후재혼 === 1848 && 뽑음[0].이혼후재혼 === 30937);
  검('⛔ 없는 칸은 null', 연도별뽑기([{ C1_NM: '전국', PRD_DE: '2000', C3_NM: '총계', DT: '10' }], 'C3_NM')[0].재혼 === null);
  검('재혼비중 계산', 재혼비중(뽑음[0]) === 13.6);
  검('⛔ 분모 0이면 null', 재혼비중({ 총계: 0, 재혼: 5 }) === null);
  검('⛔ 줄이 없으면 null', 재혼비중(null) === null);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-remarriage 자가시험 통과 (7)');
  process.exit(0);
}

const 키 = 키읽기();

const 아내url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=ALL&objL1=00&objL2=00&objL3=ALL&format=json&jsonVD=Y&orgId=101&tblId=DT_1B83A11&prdSe=Y&startPrdDe=1995&endPrdDe=2025`;
const 아내원 = await (await fetch(아내url)).json();
if (!Array.isArray(아내원)) { console.error(`⛔ 아내표 못 받음 — ${JSON.stringify(아내원).slice(0, 200)}`); process.exit(1); }
const 아내연도별 = 연도별뽑기(아내원, 'C3_NM');

const 남편url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=ALL&objL1=00&objL2=ALL&objL3=00&format=json&jsonVD=Y&orgId=101&tblId=DT_1B83A11&prdSe=Y&startPrdDe=1995&endPrdDe=2025`;
const 남편원 = await (await fetch(남편url)).json();
if (!Array.isArray(남편원)) { console.error(`⛔ 남편표 못 받음 — ${JSON.stringify(남편원).slice(0, 200)}`); process.exit(1); }
const 남편연도별 = 연도별뽑기(남편원, 'C2_NM');

if (아내연도별.length < 20 || 남편연도별.length < 20) {
  console.error(`⛔ 자가대조 실패 — 연도 수가 너무 적다(아내 ${아내연도별.length}·남편 ${남편연도별.length}). 1995~2025 31개년을 기대했다.`);
  process.exit(1);
}

const 최신아내 = 아내연도별[아내연도별.length - 1];
const 최신남편 = 남편연도별[남편연도별.length - 1];
const 첫아내 = 아내연도별.find((r) => r.해 === '1995');
const 정점아내 = 아내연도별.reduce((a, b) => (재혼비중(b) ?? -1) > (재혼비중(a) ?? -1) ? b : a, 아내연도별[0]);

if (!(최신남편.사별후재혼 < 최신아내.사별후재혼)) {
  console.error('⛔ 자가대조 실패 — 최신년도에 남편 사별후재혼이 아내보다 적어야 한다(직접 확인한 사실). 받은 값을 의심한다.');
  process.exit(1);
}

const 출력 = {
  출처: {
    이름: '국가데이터처 KOSIS · 「인구동향조사」(신고 기반 행정통계 — 표본조사 아님)',
    표: '101/DT_1B83A11 (시도/부부의 혼인종류별 혼인)',
    주의: '시도별 표는 남편 주소지 기준이라 전국 합계만 쓴다. 아내의 혼인종류(C3)와 남편의 혼인종류(C2)는 서로 다른 집계라 하나로 합치지 않는다.',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-09',
  아내_연도별: 아내연도별,
  남편_연도별: 남편연도별,
  아내_최신: 최신아내,
  남편_최신: 최신남편,
  아내_1995: 첫아내,
  아내_재혼비중_정점: { 해: 정점아내.해, 재혼비중: 재혼비중(정점아내) },
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ 아내 ${아내연도별.length}개년 · 남편 ${남편연도별.length}개년(1995~${최신아내.해}) → ${path.relative(뿌리, 낼길)}`);
