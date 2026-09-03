#!/usr/bin/env node
/**
 * collect-100y-volunteer.mjs — 자원봉사, 몇 살에 가장 많이 할까
 *
 * ── 왜 이 표를 쓰나 (2026-09-03) ──────────────────────────────
 * 사장님 지시(질병청·소방청만 찾지 말고 생활 전반 공공기관 데이터를 스스로 찾아라)에
 * 따라 국가데이터처 「사회조사」(2년 주기, 13세 이상 인구, 국가승인통계 제1977013호)
 * 101/DT_1SSSP179R을 확인했다.
 *
 * ⛔⛔ 표 자체 검색은 objL1=ALL(전체 시도)로 부르면 40,000셀 한도를 넘는다 — 전국만
 *   보려면 objL1=00(전국 코드)으로 좁혀야 한다(2026-09-03 실측, DT_1PL1502와 같은 함정).
 * ⛔⛔ 이 표는 prdSe=Y(연간)가 아니라 prdSe=F(비정기/사회조사 특유 주기)로만 응답한다.
 *   objL단계찾기(kosis-probe.mjs)는 prdSe=Y를 고정해 부르므로 이 표에서는 못 쓴다 —
 *   이 표를 새로 확인할 때는 prdSe를 바꿔 가며 다시 확인해야 한다.
 * ⛔⛔ 13∼19세 칸이 2021년 23.3% → 2023년 27.2% → 2025년 67.1%로 튀었다. 사례수가
 *   작은 하위집단(청소년만 따로)이라 표본 변동일 수도, 조사방법이 바뀌었을 수도 있다 —
 *   **원인을 모른다고 그대로 적는다.** 지어내지 않는다.
 * ⛔ 판정하지 않는다.
 *
 * 자가시험: node scripts/collect-100y-volunteer.mjs --selftest
 * 실행:     node scripts/collect-100y-volunteer.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/volunteer.json');

export const 나이칸들 = ['13∼19세', '20∼29세', '30∼39세', '40∼49세', '50∼59세', '60∼69세', '70∼79세', '80세 이상'];
export const 항목 = '자원봉사활동 경험 있음';

/** rows(C1=전국만, C2=특성, ITM=항목)에서 그 해 나이별 참여율을 뽑는다 */
export function 연령별뽑기(rows, 해) {
  return 나이칸들.map((칸) => ({
    칸,
    참여율: Number(rows.find((r) => r.C2_NM === 칸 && r.ITM_NM === 항목 && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rows에서 「계」(전체) 참여율의 연도별 시계열을 뽑는다 */
export function 전체추이뽑기(rows) {
  const 해들 = [...new Set(rows.filter((r) => r.C2_NM === '계' && r.ITM_NM === 항목).map((r) => r.PRD_DE))].sort();
  return 해들.map((해) => ({
    해,
    참여율: Number(rows.find((r) => r.C2_NM === '계' && r.ITM_NM === 항목 && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rows에서 그 해 성별 참여율을 뽑는다 */
export function 성별뽑기(rows, 해) {
  return ['남자', '여자'].map((칸) => ({
    칸,
    참여율: Number(rows.find((r) => r.C2_NM === 칸 && r.ITM_NM === 항목 && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rows에서 그 해 학력별 참여율을 뽑는다 */
export function 학력별뽑기(rows, 해) {
  const 칸들 = ['초졸이하', '중 졸', '고 졸', '대졸이상'];
  return 칸들.map((칸) => ({
    칸: 칸.replace(/\s+/g, ''),
    참여율: Number(rows.find((r) => r.C2_NM === 칸 && r.ITM_NM === 항목 && r.PRD_DE === 해)?.DT ?? NaN) || null,
  }));
}

/** rows에서 그 해 자원봉사 이유(계 기준) 분율을 내림차순으로 뽑는다 — 「계」·경험 유무 칸은 뺀다 */
export function 이유뽑기(rows, 해) {
  const 뺄것 = new Set(['계', '자원봉사활동 경험 있음', '자원봉사활동 경험 없음']);
  return rows
    .filter((r) => r.C2_NM === '계' && r.PRD_DE === 해 && !뺄것.has(r.ITM_NM))
    .map((r) => ({ 이유: r.ITM_NM.replace(/^-\s*/, ''), 분율: Number(r.DT) }))
    .filter((r) => Number.isFinite(r.분율))
    .sort((a, b) => b.분율 - a.분율);
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const rows = [
    { C2_NM: '계', ITM_NM: 항목, PRD_DE: '2025', DT: '14.368' },
    { C2_NM: '계', ITM_NM: 항목, PRD_DE: '2021', DT: '8.36' },
    { C2_NM: '13∼19세', ITM_NM: 항목, PRD_DE: '2025', DT: '67.065' },
    { C2_NM: '20∼29세', ITM_NM: 항목, PRD_DE: '2025', DT: '10.979' },
    { C2_NM: '남자', ITM_NM: 항목, PRD_DE: '2025', DT: '13.719' },
    { C2_NM: '여자', ITM_NM: 항목, PRD_DE: '2025', DT: '15.005' },
    { C2_NM: '고 졸', ITM_NM: 항목, PRD_DE: '2025', DT: '10.75' },
    { C2_NM: '대졸이상', ITM_NM: 항목, PRD_DE: '2025', DT: '12.388' },
    { C2_NM: '계', ITM_NM: '계', PRD_DE: '2025', DT: '100' },
    { C2_NM: '계', ITM_NM: '자원봉사활동 경험 없음', PRD_DE: '2025', DT: '85.632' },
    { C2_NM: '계', ITM_NM: '- 남을 돕는 것이 행복하므로', PRD_DE: '2025', DT: '21.2' },
    { C2_NM: '계', ITM_NM: '- 시민의 책임이므로', PRD_DE: '2025', DT: '5.1' },
  ];

  const 연령별 = 연령별뽑기(rows, '2025');
  검('나이밴드 8개를 다 뽑는다', 연령별.length === 8);
  검('13-19세가 압도적으로 높다', 연령별.find((r) => r.칸 === '13∼19세').참여율 === 67.065);
  검('⛔ 못 받은 나이칸은 null', 연령별.find((r) => r.칸 === '30∼39세').참여율 === null);

  const 추이 = 전체추이뽑기(rows);
  검('연도 2개를 뽑는다', 추이.length === 2);
  검('연도 오름차순', 추이[0].해 === '2021' && 추이[1].해 === '2025');

  const 성별 = 성별뽑기(rows, '2025');
  검('성별 2칸, 여자가 조금 높다', 성별.length === 2 && 성별.find((r) => r.칸 === '여자').참여율 > 성별.find((r) => r.칸 === '남자').참여율);

  const 학력별 = 학력별뽑기(rows, '2025');
  검('학력 4칸', 학력별.length === 4 && 학력별.find((r) => r.칸 === '고졸').참여율 === 10.75);

  const 이유 = 이유뽑기(rows, '2025');
  검('⛔ 「계」·경험유무 칸을 이유 목록에서 뺀다', 이유.every((r) => r.이유 !== '계' && !r.이유.includes('경험')));
  검('이유 2개, 내림차순', 이유.length === 2 && 이유[0].이유 === '남을 돕는 것이 행복하므로');

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-volunteer 자가시험 통과 (10)');
  process.exit(0);
}

const 키 = 키읽기();

async function 받기() {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
    `&itmId=ALL&objL1=00&objL2=ALL&format=json&jsonVD=Y&orgId=101&tblId=DT_1SSSP179R&prdSe=F&startPrdDe=2019&endPrdDe=2025`;
  const j = await (await fetch(u)).json();
  if (!Array.isArray(j)) { console.error(`⛔ 못 받음 — ${JSON.stringify(j).slice(0, 200)}`); process.exit(1); }
  return j;
}

const rows = await 받기();
const 추이 = 전체추이뽑기(rows);
const 최신 = 추이[추이.length - 1].해;
const 연령별 = 연령별뽑기(rows, 최신);
const 성별 = 성별뽑기(rows, 최신);
const 학력별 = 학력별뽑기(rows, 최신);
const 이유 = 이유뽑기(rows, 최신);
const 최신전체 = 추이[추이.length - 1].참여율;

if (연령별.some((r) => r.참여율 == null)) {
  console.error('⛔ 자가대조 실패 — 나이칸 8개 중 못 받은 칸이 있다. 받은 값을 의심한다.');
  process.exit(1);
}
if (연령별.find((r) => r.칸 === '13∼19세').참여율 !== Math.max(...연령별.map((r) => r.참여율))) {
  console.error('⛔ 자가대조 실패 — 알려진 사실(13~19세가 최고)과 어긋난다.');
  process.exit(1);
}

const 출력 = {
  정의: '참여율 = 그 갈래(나이·성별·학력) 응답자 중 지난 1년간 자원봉사활동을 한 적이 있다고 답한 사람의 몫 ÷ 그 갈래 전체 응답자 수 × 100(자기응답 조사, 실제 활동기록 대조 아님).',
  출처: {
    이름: '국가데이터처 「사회조사」(국가승인통계 제1977013호) — 13세 이상 인구 대상 2년 주기 표본조사',
    표: '101/DT_1SSSP179R (자원봉사활동 여부 및 참여 이유)',
    창구: 'KOSIS',
    주의: '자기응답 표본조사입니다(전수조사 아님) — 사례수가 적은 하위집단은 오차가 큽니다. 13∼19세 참여율이 2021년 23.3%→2023년 27.2%→2025년 67.1%로 크게 뛰었는데, 표본 변동인지 조사방법이 바뀐 것인지 저희가 확인하지 못했습니다 — 원인을 지어내지 않고 그대로 밝힙니다.',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-03',
  정책배경_13to19급등_팩트체크: {
    확인한날: '2026-09-03',
    사장님가설: '대입 수시전형이나 내신 수행평가에 봉사 점수가 반영돼서 학생들이 많이 한다',
    확인된사실1: '2024학년도 대입부터 「개인 봉사활동실적」은 학생부종합전형에 반영되지 않는다(교육부 「대입제도 공정성 강화 방안」, 2019). 수상실적·자율동아리·독서활동과 함께 폐지됐다 — 개인 봉사를 대입에 쓰려는 유인은 오히려 최근 몇 년 사이 줄어드는 방향이었다.',
    확인된사실2: '2025학년도 고1부터 2022 개정 교육과정이 시행되며, 「창의적 체험활동」에서 봉사활동이 독립 영역이 아니라 자율·자치활동·동아리활동·진로활동 전 영역에 연계·통합해 운영하는 방식으로 바뀌었다(경기도교육청 등 2025학년도 학생부 기재요령). 시행 시점이 이 조사의 급등 시점(2025년)과 겹친다.',
    결론: '사장님 가설 중 「대입 점수 반영」은 최근 정책 방향과 어긋난다(오히려 축소됨) — 이 부분은 그대로 못 박지 않는다. 다만 「학교 관련 활동이 이유일 것」이라는 방향 자체는 이 표의 다른 조사 결과(참여 이유 1위가 「학교·직장 단체활동 동참」, 학력별로 중졸이 고졸보다 높음)와도, 2025년 교육과정 개편 시점과도 들어맞는다 — 다만 이것이 급등의 «원인»이라고 확정할 근거(인과 검증)는 없다. 정황으로만 놓는다.',
  },
  최신연도: 최신,
  전체_참여율: 최신전체,
  연도별_전체참여율: 추이,
  연령별,
  성별,
  학력별,
  이유,
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ ${최신}년 전체 참여율 ${최신전체}% · 13~19세 ${연령별[0].참여율}% · 나이칸 ${연령별.length}개 → ${path.relative(뿌리, 낼길)}`);
