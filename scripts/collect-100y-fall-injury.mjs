#!/usr/bin/env node
/**
 * collect-100y-fall-injury.mjs — 낙상으로 입원하는 사람, 몇 살부터 늘어나는가
 *
 * ── 왜 이 표를 쓰나 (2026-09-03) ──────────────────────────────
 * 사장님 지시("질병관리청·소방청 공개 데이터를 더 찾아라, 시킨 것만 하지 말고 스스로
 * 발전하라")를 따라 /cardiac-arrest(급성심장정지) 다음으로 직접 찾은 자료다.
 * 질병관리청 「퇴원손상심층조사」(국가승인통계 제2006042호) — 177/DT_11760NP32(추락·낙상
 * 손상환자 퇴원환자수, 성별·연령별)와 177/DT_11760NP62(65세 이상 손상기전별 퇴원율 추이,
 * 「추락·낙상」칸)를 쓴다.
 *
 * ⛔⛔ 이 표는 등록통계(전수)가 아니라 **표본조사를 전국 추정치로 환산한 값**이다
 *   (그래서 건수가 소수점이다 — 594629.9명 같은 값은 반올림 오차가 아니라 가중치 곱의
 *   결과다). statisticsExplData 원문: 「사례수가 5보다 작거나 상대표준오차가 25% 이상인
 *   경우는 만족할만한 신뢰수준에 이르지 못하는 통계이므로 사용에 주의」.
 * ⛔ 「퇴원환자수」는 그 해 「입원해서 퇴원한」 사람 수다 — 다치기만 하고 안 입원한 사람,
 *   입원했다가 그 해를 못 넘기고 아직 퇴원 안 한 사람은 안 잡힌다.
 * ⛔ DT_11760NP62는 65세 이상만 잰다 — 전 연령 낙상 퇴원율 추이가 아니다.
 * ⛔ 판정하지 않는다.
 *
 * 자가시험: node scripts/collect-100y-fall-injury.mjs --selftest
 * 실행:     node scripts/collect-100y-fall-injury.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/fall-injury.json');

export const 나이밴드 = ['0-14세', '15-24세', '25-34세', '35-44세', '45-54세', '55-64세', '65-74세', '75세이상'];

/** rows32(C1=성별, C2=연령별)에서 그 해 「전체」 성별의 나이별 표를 뽑는다 */
export function 연령별뽑기(rows32, 해) {
  return 나이밴드.map((칸) => ({
    칸,
    건수: Number(rows32.find((r) => r.C1_NM === '전체' && r.C2_NM === 칸 && r.ITM_NM === '퇴원환자수' && r.PRD_DE === 해)?.DT ?? NaN) || null,
    분율: Number(rows32.find((r) => r.C1_NM === '전체' && r.C2_NM === 칸 && r.ITM_NM === '분율' && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rows32에서 그 해 성별(전체 나이) 표를 뽑는다 */
export function 성별뽑기(rows32, 해) {
  return ['남자', '여자'].map((칸) => ({
    칸,
    건수: Number(rows32.find((r) => r.C1_NM === 칸 && r.C2_NM === '전체' && r.ITM_NM === '퇴원환자수' && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rows62(C1=손상기전, ITM=퇴원율)에서 「추락·낙상」 연도별 시계열(65세 이상)을 뽑는다 */
export function 노인추이뽑기(rows62) {
  const 해들 = [...new Set(rows62.filter((r) => r.C1_NM === '추락·낙상' && r.ITM_NM === '퇴원율').map((r) => r.PRD_DE))].sort();
  return 해들.map((해) => ({
    해,
    퇴원율: Number(rows62.find((r) => r.C1_NM === '추락·낙상' && r.ITM_NM === '퇴원율' && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rowsC2(C1=전체·성별, C2=장소 또는 활동, ITM=분율)에서 그 해 「전체」 분율을 「미상」 빼고 내림차순으로 뽑는다 */
export function 갈래뽑기(rowsC2, 해) {
  return rowsC2
    .filter((r) => r.C1_NM === '전체' && r.ITM_NM === '분율' && r.PRD_DE === 해 && r.C2_NM !== '전체' && r.C2_NM !== '미상')
    .map((r) => ({ 이름: r.C2_NM, 분율: Number(r.DT) }))
    .sort((a, b) => b.분율 - a.분율);
}

/** rowsC2에서 그 해 「미상」 분율을 뽑는다(정직하게 밝히려고 따로 둔다) */
export function 미상몫(rowsC2, 해) {
  return Number(rowsC2.find((r) => r.C1_NM === '전체' && r.ITM_NM === '분율' && r.PRD_DE === 해 && r.C2_NM === '미상')?.DT ?? NaN) || null;
}

/** rows(C1=손상기전, ITM=퇴원율)에서 「추락·낙상」 연도별 시계열을 뽑는다 — 생애주기 표(NP59·60·61) 공용 */
export function 연령대추이뽑기(rows) {
  const 해들 = [...new Set(rows.filter((r) => r.C1_NM === '추락·낙상' && r.ITM_NM === '퇴원율').map((r) => r.PRD_DE))].sort();
  return 해들.map((해) => ({
    해,
    퇴원율: Number(rows.find((r) => r.C1_NM === '추락·낙상' && r.ITM_NM === '퇴원율' && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** 생애주기 네 갈래(어린이·청소년·청장년·65세이상) 추이에서 첫해→최신해 증가율을 낸다 */
export function 생애주기증가율(추이) {
  const 첫 = 추이[0];
  const 끝 = 추이[추이.length - 1];
  if (!첫 || !끝 || 첫.퇴원율 == null || 끝.퇴원율 == null) return null;
  return Number((((끝.퇴원율 - 첫.퇴원율) / 첫.퇴원율) * 100).toFixed(1));
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const rows32 = [
    { C1_NM: '전체', C2_NM: '전체', ITM_NM: '퇴원환자수', PRD_DE: '2024', DT: '594629.9' },
    { C1_NM: '전체', C2_NM: '0-14세', ITM_NM: '퇴원환자수', PRD_DE: '2024', DT: '18358.0' },
    { C1_NM: '전체', C2_NM: '0-14세', ITM_NM: '분율', PRD_DE: '2024', DT: '3.1' },
    { C1_NM: '전체', C2_NM: '75세이상', ITM_NM: '퇴원환자수', PRD_DE: '2024', DT: '217438.8' },
    { C1_NM: '전체', C2_NM: '75세이상', ITM_NM: '분율', PRD_DE: '2024', DT: '36.6' },
    { C1_NM: '남자', C2_NM: '전체', ITM_NM: '퇴원환자수', PRD_DE: '2024', DT: '241206.6' },
    { C1_NM: '여자', C2_NM: '전체', ITM_NM: '퇴원환자수', PRD_DE: '2024', DT: '353423.3' },
    { C1_NM: '전체', C2_NM: '75세이상', ITM_NM: '퇴원환자수', PRD_DE: '2020', DT: '999' },
  ];
  const 연령별 = 연령별뽑기(rows32, '2024');
  검('나이밴드 8개를 다 뽑는다', 연령별.length === 8);
  검('75세이상 건수', 연령별.find((r) => r.칸 === '75세이상').건수 === 217438.8);
  검('75세이상 분율이 가장 크다', Math.max(...연령별.map((r) => r.분율 ?? 0)) === 연령별.find((r) => r.칸 === '75세이상').분율);
  검('⛔ 못 받은 나이칸(2024엔 없는)은 null', 연령별.find((r) => r.칸 === '65-74세').건수 === null);
  검('⛔ 다른 해(2020) 값과 안 섞인다', 연령별뽑기(rows32, '2020').find((r) => r.칸 === '75세이상').건수 === null || 연령별뽑기(rows32, '2020').find((r) => r.칸 === '75세이상').건수 === 999);

  const 성별 = 성별뽑기(rows32, '2024');
  검('성별 2칸', 성별.length === 2);
  검('여자가 남자보다 많다(낙상은 남녀 패턴이 심장정지와 반대)', 성별.find((r) => r.칸 === '여자').건수 > 성별.find((r) => r.칸 === '남자').건수);

  const rows62 = [
    { C1_NM: '추락·낙상', ITM_NM: '퇴원율', PRD_DE: '2015', DT: '2478' },
    { C1_NM: '추락·낙상', ITM_NM: '퇴원율', PRD_DE: '2024', DT: '3374' },
    { C1_NM: '전체', ITM_NM: '퇴원율', PRD_DE: '2024', DT: '9999' },
  ];
  const 추이 = 노인추이뽑기(rows62);
  검('연도 2개만 뽑는다(추락낙상만)', 추이.length === 2);
  검('연도 오름차순', 추이[0].해 === '2015' && 추이[1].해 === '2024');
  검('2024 퇴원율', 추이[1].퇴원율 === 3374);

  const rowsC2 = [
    { C1_NM: '전체', C2_NM: '전체', ITM_NM: '분율', PRD_DE: '2024', DT: '100' },
    { C1_NM: '전체', C2_NM: '미상', ITM_NM: '분율', PRD_DE: '2024', DT: '36' },
    { C1_NM: '전체', C2_NM: '주거지', ITM_NM: '분율', PRD_DE: '2024', DT: '28.3' },
    { C1_NM: '전체', C2_NM: '길 간선도로', ITM_NM: '분율', PRD_DE: '2024', DT: '13' },
    { C1_NM: '남자', C2_NM: '주거지', ITM_NM: '분율', PRD_DE: '2024', DT: '99' },
  ];
  const 갈래 = 갈래뽑기(rowsC2, '2024');
  검('⛔ 미상은 뺀다', 갈래.every((r) => r.이름 !== '미상'));
  검('⛔ 성별 칸은 안 섞는다(전체만)', 갈래.every((r) => r.이름 !== '전체'));
  검('내림차순 — 주거지가 1위', 갈래[0].이름 === '주거지');
  검('갈래 2개(전체·미상 뺀 나머지)', 갈래.length === 2);

  검('미상몫 — 36을 뽑는다', 미상몫(rowsC2, '2024') === 36);

  const rows59표본 = [
    { C1_NM: '추락·낙상', ITM_NM: '퇴원율', PRD_DE: '2015', DT: '286' },
    { C1_NM: '추락·낙상', ITM_NM: '퇴원율', PRD_DE: '2024', DT: '294' },
    { C1_NM: '전체', ITM_NM: '퇴원율', PRD_DE: '2024', DT: '9999' },
  ];
  const 추이59 = 연령대추이뽑기(rows59표본);
  검('연령대추이뽑기 — 추락낙상만, 2개 연도', 추이59.length === 2 && 추이59[0].해 === '2015' && 추이59[1].퇴원율 === 294);
  검('생애주기증가율 — (294-286)/286*100', 생애주기증가율(추이59) === Number((((294 - 286) / 286) * 100).toFixed(1)));
  검('생애주기증가율 — 빈 배열은 못 잰다(null)', 생애주기증가율([]) === null);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-fall-injury 자가시험 통과 (18)');
  process.exit(0);
}

const 키 = 키읽기();

async function 받기(tblId, objL1단계, 시작, 끝) {
  const objs = Array.from({ length: objL1단계 }, (_, i) => `&objL${i + 1}=ALL`).join('');
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
    `&itmId=ALL${objs}&format=json&jsonVD=Y&orgId=177&tblId=${tblId}&prdSe=Y&startPrdDe=${시작}&endPrdDe=${끝}`;
  const j = await (await fetch(u)).json();
  if (!Array.isArray(j)) { console.error(`⛔ ${tblId} 못 받음 — ${JSON.stringify(j).slice(0, 200)}`); process.exit(1); }
  return j;
}

const rows32 = await 받기('DT_11760NP32', 2, '2024', '2024');
const rows62 = await 받기('DT_11760NP62', 1, '2015', '2024');
const rows33 = await 받기('DT_11760NP33', 2, '2024', '2024');
const rows34 = await 받기('DT_11760NP34', 2, '2024', '2024');
const rows59 = await 받기('DT_11760NP59', 1, '2015', '2024');
const rows60 = await 받기('DT_11760NP60', 1, '2015', '2024');
const rows61 = await 받기('DT_11760NP61', 1, '2015', '2024');

const 연령별 = 연령별뽑기(rows32, '2024');
const 성별 = 성별뽑기(rows32, '2024');
const 추이65 = 노인추이뽑기(rows62);
const 전체건수 = Number(rows32.find((r) => r.C1_NM === '전체' && r.C2_NM === '전체' && r.ITM_NM === '퇴원환자수' && r.PRD_DE === '2024')?.DT ?? NaN);
const 장소별 = 갈래뽑기(rows33, '2024');
const 장소_미상몫 = 미상몫(rows33, '2024');
const 활동별 = 갈래뽑기(rows34, '2024');
const 활동_미상몫 = 미상몫(rows34, '2024');

/* ⭐ 스스로 발전 — 65세이상만 있던 낙상 퇴원율 추이를 0~100세 네 생애주기로 넓힌다 */
const 추이_어린이 = 연령대추이뽑기(rows59);
const 추이_청소년 = 연령대추이뽑기(rows60);
const 추이_청장년 = 연령대추이뽑기(rows61);
const 생애주기 = [
  { 이름: '어린이(0-12세)', 추이: 추이_어린이, 증가율: 생애주기증가율(추이_어린이) },
  { 이름: '청소년(13-18세)', 추이: 추이_청소년, 증가율: 생애주기증가율(추이_청소년) },
  { 이름: '청장년(19-64세)', 추이: 추이_청장년, 증가율: 생애주기증가율(추이_청장년) },
  { 이름: '65세 이상', 추이: 추이65, 증가율: 생애주기증가율(추이65) },
];
const 생애주기_가장많이늘어난것 = 생애주기.filter((r) => r.증가율 != null).reduce((a, b) => (b.증가율 > a.증가율 ? b : a));

if (연령별.some((r) => r.건수 == null)) {
  console.error('⛔ 자가대조 실패 — 나이칸 8개 중 못 받은 칸이 있다. 받은 값을 의심한다.');
  process.exit(1);
}
if (연령별.find((r) => r.칸 === '75세이상').분율 !== Math.max(...연령별.map((r) => r.분율))) {
  console.error('⛔ 자가대조 실패 — 알려진 사실(75세이상이 최대 분율)과 어긋난다.');
  process.exit(1);
}

const 출력 = {
  정의: '분율 = 그 갈래(나이·성별·장소·활동) 칸 퇴원환자수 ÷ 전체 퇴원환자수 합 × 100(장소·활동은 「미상」을 뺀 나머지 안에서의 몫이 아니라 전체 대비 몫 — 「미상몫」을 항상 같이 밝힌다). 퇴원율(65세 이상 추이) = 65세 이상 인구 중 그 해 추락·낙상으로 퇴원한 환자 수 ÷ 65세 이상 인구 × 100,000. 「퇴원환자수」는 표본조사를 전국 추정치로 가중 환산한 값이라 소수점이 있다(전수조사가 아니다).',
  출처: {
    이름: '질병관리청 「퇴원손상심층조사」(국가승인통계 제2006042호) — 병원 표본조사를 전국 추정치로 가중 환산',
    표: '177/DT_11760NP32(성별·연령별) · 177/DT_11760NP33(손상발생장소별) · 177/DT_11760NP34(손상시활동별) · 177/DT_11760NP59·60·61·62(생애주기별 손상기전별 퇴원율 추이 — 어린이·청소년·청장년·65세이상)',
    창구: 'KOSIS',
    주의: '표본조사 추정치라 사례수가 적은 칸은 오차가 크다(원자료 주석: 사례수 5 미만·상대표준오차 25% 이상인 통계는 사용에 주의, 2019년부터 그런 칸은 미제시). 「퇴원환자수」는 입원 후 그 해 퇴원한 사람만 센다 — 다치고 입원하지 않은 사람, 아직 퇴원 안 한 사람은 안 잡힌다. 장소·활동은 「미상」 몫이 커서(장소 36%·활동 30.9%) 확인된 나머지 안에서의 1위일 뿐 전체의 과반은 아니다.',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-03',
  최신연도: '2024',
  전체_퇴원환자수: 전체건수,
  연령별,
  성별,
  노인추이_추락낙상_퇴원율: 추이65,
  생애주기_추락낙상_퇴원율: 생애주기,
  생애주기_가장많이늘어난것,
  장소별,
  장소_미상몫,
  활동별,
  활동_미상몫,
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ 2024년 전체 ${전체건수}명 · 나이칸 ${연령별.length}개 · 65세이상 추이 ${추이65.length}개년 → ${path.relative(뿌리, 낼길)}`);
