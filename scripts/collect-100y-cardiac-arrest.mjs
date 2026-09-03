#!/usr/bin/env node
/**
 * collect-100y-cardiac-arrest.mjs — 급성심장정지, 몇 살부터 늘어나는가
 *
 * ── 왜 이 표를 쓰나 (2026-09-03) ──────────────────────────────
 * 사장님이 전달한 언론 보도("30대 3.5%, 40대까지 합치면 10% 넘어…50세 미만만 하루 13명꼴",
 * "인구 10만 명당 64.7명")의 원 통계를 KOSIS에서 직접 확인한다. 질병관리청·소방청이
 * 함께 내는 「급성심장정지조사」(국가승인통계 제2011030호) — 177/DT_117088_001(발생,
 * 건수·분율)·177/DT_117088_002(발생률, 인구 10만 명당)·177/DT_117088_003(표준화발생률,
 * 인구 고령화를 뺀 값)을 쓴다. 세 표 다 objL 1단계.
 *
 * ⛔⛔ 분모를 헷갈리지 않는다 — 언론 인용 두 숫자는 서로 다른 계산이다.
 *   ① 「분율」 = 그 나이 건수 ÷ 전체 건수 합 × 100 (환자 중 그 나이가 차지하는 몫)
 *   ② 「발생률」 = 그 나이 건수 ÷ 그 나이 인구 × 100,000 (그 나이 사람이 걸릴 위험)
 *   30대는 ①(분율)이 3.5%로 작아 보이지만 ②(발생률)로 보면 60대의 5분의 1 수준이지
 *   "안전"은 아니다 — 이 자는 둘을 절대 같은 자리에서 섞어 말하지 않는다.
 * ⛔ 「50세 미만만 하루 13명꼴」은 0~49세 건수 합÷365로 검산한다(자가시험에 있음).
 * ⛔ 판정하지 않는다 — "위험하다/안전하다" 대신 숫자만 놓는다.
 *
 * 자가시험: node scripts/collect-100y-cardiac-arrest.mjs --selftest
 * 실행:     node scripts/collect-100y-cardiac-arrest.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/cardiac-arrest.json');

export const 나이밴드 = ['0-9세', '10-19세', '20-29세', '30-39세', '40-49세', '50-59세', '60-69세', '70-79세', '80세 이상'];

/** rows001(건수·분율)·rows002(발생률)에서 그 해(해) 나이별 표를 뽑는다 — 해를 안 주면 못 잰다(다른 해와 섞이면 안 되니까) */
export function 연령별뽑기(rows001, rows002, 해) {
  return 나이밴드.map((칸) => ({
    칸,
    건수: Number(rows001.find((r) => r.C1_NM === 칸 && r.ITM_NM === '건수' && r.PRD_DE === 해)?.DT ?? NaN) || null,
    분율: Number(rows001.find((r) => r.C1_NM === 칸 && r.ITM_NM === '분율' && r.PRD_DE === 해)?.DT ?? NaN) || null,
    발생률: Number(rows002.find((r) => r.C1_NM === 칸 && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rows001·rows002·rows003 에서 C1_NM==='전체'인 연도별 시계열을 뽑는다 */
export function 연도별뽑기(rows001, rows002, rows003) {
  const 해들 = [...new Set(rows001.filter((r) => r.C1_NM === '전체' && r.ITM_NM === '건수').map((r) => r.PRD_DE))].sort();
  return 해들.map((해) => ({
    해,
    건수: Number(rows001.find((r) => r.C1_NM === '전체' && r.ITM_NM === '건수' && r.PRD_DE === 해)?.DT ?? NaN) || null,
    발생률: Number(rows002.find((r) => r.C1_NM === '전체' && r.PRD_DE === 해)?.DT ?? NaN) || null,
    표준화발생률: Number(rows003.find((r) => r.C1_NM === '전체' && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rows001·rows002 에서 그 해 성별 표를 뽑는다 */
export function 성별뽑기(rows001, rows002, 해) {
  return ['남자', '여자'].map((칸) => ({
    칸,
    건수: Number(rows001.find((r) => r.C1_NM === 칸 && r.ITM_NM === '건수' && r.PRD_DE === 해)?.DT ?? NaN) || null,
    분율: Number(rows001.find((r) => r.C1_NM === 칸 && r.ITM_NM === '분율' && r.PRD_DE === 해)?.DT ?? NaN) || null,
    발생률: Number(rows002.find((r) => r.C1_NM === 칸 && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** 나이별 배열에서 상한(포함) 미만 나이칸들의 건수 합을 낸다. 예: 50 → 0~49세 합 */
export function 나이미만합(나이별, 상한나이) {
  return 나이별
    .filter((r) => Number(r.칸.split(/[-세]/)[0]) < 상한나이)
    .reduce((합, r) => 합 + (r.건수 ?? 0), 0);
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const rows001 = [
    { C1_NM: '전체', ITM_NM: '건수', PRD_DE: '2024', DT: '33034' },
    { C1_NM: '전체', ITM_NM: '분율', PRD_DE: '2024', DT: '100' },
    { C1_NM: '0-9세', ITM_NM: '건수', PRD_DE: '2024', DT: '299' },
    { C1_NM: '0-9세', ITM_NM: '분율', PRD_DE: '2024', DT: '0.9' },
    { C1_NM: '30-39세', ITM_NM: '건수', PRD_DE: '2024', DT: '1149' },
    { C1_NM: '30-39세', ITM_NM: '분율', PRD_DE: '2024', DT: '3.5' },
    { C1_NM: '40-49세', ITM_NM: '건수', PRD_DE: '2024', DT: '2225' },
    { C1_NM: '40-49세', ITM_NM: '분율', PRD_DE: '2024', DT: '6.7' },
    { C1_NM: '남자', ITM_NM: '건수', PRD_DE: '2024', DT: '21237' },
    { C1_NM: '남자', ITM_NM: '분율', PRD_DE: '2024', DT: '64.3' },
    { C1_NM: '여자', ITM_NM: '건수', PRD_DE: '2024', DT: '11766' },
    { C1_NM: '여자', ITM_NM: '분율', PRD_DE: '2024', DT: '35.6' },
    { C1_NM: '전체', ITM_NM: '건수', PRD_DE: '2020', DT: '31652' },
  ];
  const rows002 = [
    { C1_NM: '전체', PRD_DE: '2024', DT: '64.7' },
    { C1_NM: '0-9세', PRD_DE: '2024', DT: '9.2' },
    { C1_NM: '30-39세', PRD_DE: '2024', DT: '17.5' },
    { C1_NM: '40-49세', PRD_DE: '2024', DT: '28.6' },
    { C1_NM: '남자', PRD_DE: '2024', DT: '83.6' },
    { C1_NM: '여자', PRD_DE: '2024', DT: '45.9' },
    { C1_NM: '전체', PRD_DE: '2020', DT: '61.6' },
  ];
  const rows003 = [
    { C1_NM: '전체', PRD_DE: '2024', DT: '37' },
    { C1_NM: '전체', PRD_DE: '2020', DT: '38.9' },
  ];

  const 연령별 = 연령별뽑기(rows001, rows002, '2024');
  검('나이밴드 9개를 다 뽑는다', 연령별.length === 9);
  검('30대 건수', 연령별.find((r) => r.칸 === '30-39세').건수 === 1149);
  검('30대 분율', 연령별.find((r) => r.칸 === '30-39세').분율 === 3.5);
  검('30대 발생률(분율과 다른 값)', 연령별.find((r) => r.칸 === '30-39세').발생률 === 17.5);
  검('⛔ 못 받은 나이칸은 null', 연령별.find((r) => r.칸 === '60-69세').건수 === null);
  검('⛔ 다른 해(2020) 값과 안 섞인다', 연령별뽑기(rows001, rows002, '2020').every((r) => r.건수 == null));

  const 연도별 = 연도별뽑기(rows001, rows002, rows003);
  검('연도 2개(2020·2024)를 뽑는다', 연도별.length === 2);
  검('연도 오름차순', 연도별[0].해 === '2020' && 연도별[1].해 === '2024');
  검('2024 건수', 연도별[1].건수 === 33034);
  검('2024 발생률', 연도별[1].발생률 === 64.7);
  검('2024 표준화발생률', 연도별[1].표준화발생률 === 37);

  const 성별 = 성별뽑기(rows001, rows002, '2024');
  검('성별 2칸', 성별.length === 2);
  검('남자 발생률이 여자보다 높다', 성별[0].발생률 > 성별[1].발생률);

  const 미만50 = 나이미만합(연령별, 50);
  검('50세미만 합 = 0-9+30-39+40-49(표본엔 이 셋만 있음)', 미만50 === 299 + 1149 + 2225);
  검('30대+40대 분율 합이 10 넘는다', 연령별.find((r) => r.칸 === '30-39세').분율 + 연령별.find((r) => r.칸 === '40-49세').분율 > 10);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-cardiac-arrest 자가시험 통과 (15)');
  process.exit(0);
}

const 키 = 키읽기();

async function 받기(tblId) {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
    `&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&orgId=177&tblId=${tblId}&prdSe=Y&startPrdDe=2020&endPrdDe=2024`;
  const j = await (await fetch(u)).json();
  if (!Array.isArray(j)) { console.error(`⛔ ${tblId} 못 받음 — ${JSON.stringify(j).slice(0, 200)}`); process.exit(1); }
  return j;
}

const rows001 = await 받기('DT_117088_001');
const rows002 = await 받기('DT_117088_002');
const rows003 = await 받기('DT_117088_003');

const 연도별 = 연도별뽑기(rows001, rows002, rows003);
const 최신 = 연도별[연도별.length - 1];
const 연령별 = 연령별뽑기(rows001, rows002, 최신.해);
const 성별 = 성별뽑기(rows001, rows002, 최신.해);
const 미만50합 = 나이미만합(연령별, 50);

if (연령별.some((r) => r.건수 == null)) {
  console.error('⛔ 자가대조 실패 — 나이칸 9개 중 못 받은 칸이 있다. 받은 값을 의심한다.');
  process.exit(1);
}
if (성별[0].발생률 <= 성별[1].발생률) {
  console.error('⛔ 자가대조 실패 — 알려진 사실(남자 발생률이 여자보다 높다)과 어긋난다.');
  process.exit(1);
}

const 출력 = {
  정의: '분율 = 그 칸(나이·성별) 건수 ÷ 전체 건수 합 × 100(환자 중 그 칸이 차지하는 몫). 발생률 = 그 칸 건수 ÷ 그 칸 인구 × 100,000(그 칸 인구가 걸릴 위험 — 분율과 분모가 다르다). 표준화발생률은 인구 고령화 효과를 뺀 발생률.',
  출처: {
    이름: '질병관리청·소방청 「급성심장정지조사」(국가승인통계 제2011030호)',
    표: '177/DT_117088_001(발생 건수·분율) · 177/DT_117088_002(발생률) · 177/DT_117088_003(표준화발생률)',
    창구: 'KOSIS',
    주의: '119구급대가 병원으로 이송한 환자만 센다(이송 전 사망·미신고는 안 잡힌다). 성·연령·시도는 구급활동일지 기준이라 확인 불가한 경우 「미상」으로 빠진다.',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-03',
  최신연도: 최신.해,
  전체_건수: 최신.건수,
  전체_발생률: 최신.발생률,
  전체_표준화발생률: 최신.표준화발생률,
  연도별,
  연령별,
  성별,
  '50세미만_건수합': 미만50합,
  '50세미만_하루평균': Math.round((미만50합 / 365) * 10) / 10,
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ ${최신.해}년 전체 ${최신.건수}건(10만명당 ${최신.발생률}명) · 나이칸 ${연령별.length}개 · 연도 ${연도별.length}개년 → ${path.relative(뿌리, 낼길)}`);
