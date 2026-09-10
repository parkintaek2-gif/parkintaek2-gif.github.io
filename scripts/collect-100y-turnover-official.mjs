#!/usr/bin/env node
/**
 * collect-100y-turnover-official.mjs — 공식 이직률(중소기업실태조사)을 받아
 * industry-life.json 에 대조 칸 하나를 더한다.
 *
 * ⭐ 왜 — docs/백년지도-남들은-어떻게.md 4절이 이미 짚어 뒀다: 「국민연금 42개 업종
 *   이직률(3번, 0.58~12.16%)을 142/DT_G26036 과 나란히 놓으면 우리 추정치를 공표치로
 *   검증할 수 있다」. industry-life.json 의 「월상실률」(그 달 그 사업장 자격을 잃는
 *   비율)을 annualize 해 견준다.
 *
 * ⛔ objL 단계를 짐작하지 않고 kosis-probe.mjs 로 먼저 쟀다 — 2단계였다
 *   (C1=산업분류및기업규모, C2=직종별). C1="전체"·C2 최상위 코드(16142T181)가
 *   전 업종·전 규모·전 직종을 합친 「이직률」 한 줄이다 — 8.1%(2024, 연간).
 *
 * ⚠ 모집단이 다르다 — 이 표는 «소상공인 제외 중소기업»만 잰다(대기업 없음).
 *   우리 자료는 국민연금 가입 2인 이상 사업장 전체(대기업 포함)다. 같은 모집단이 아니다.
 * ⚠ 단위가 다르다 — 공식표는 «연간»(그 해 이직 ÷ 전년 12월 현인원), 우리는 «월간»
 *   (그 달 이직 ÷ 그 달 가입자). 월 → 연 환산은 근사(단리 ×12, 복리 1-(1-r)^12) 둘 다 적는다.
 * ⚠ 업종 분류 체계가 다르다(KOSIS 세세분류 vs 우리 KECO 계열) — 업종별 1:1 대조는
 *   안 한다. «전체 대 전체» 한 점만 비교한다.
 *
 * 쓰는 법
 *   node scripts/collect-100y-turnover-official.mjs --자가시험
 *   node scripts/collect-100y-turnover-official.mjs           실제로 받아 industry-life.json 에 더한다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자료길 = path.join(뿌리, 'src/data/100yearmap/industry-life.json');

export function 키읽기() {
  const env = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
  const m = env.match(/^KOSIS_API_KEY\s*=\s*(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}

/** 전체×전체×직종합계 한 줄만 골라낸다. C1_NM==='전체' 이고 C2 코드가 최상위(가장 짧은) 것 */
export function 전체이직률줄찾기(행들) {
  const 전체행 = 행들.filter((r) => r.C1_NM === '전체' && r.C2_NM === '이직률');
  if (!전체행.length) return null;
  return [...전체행].sort((a, b) => a.C2.length - b.C2.length)[0];
}

export function 월상실가중평균(industryLife) {
  const 총인원 = industryLife.자료.reduce((s, r) => s + r.인원, 0);
  const 가중 = industryLife.자료.reduce((s, r) => s + r.월상실률 * r.인원, 0) / 총인원;
  return { 총인원, 가중월상실률: Math.round(가중 * 100) / 100 };
}

export function 연율화(월률) {
  return {
    단리: Math.round(월률 * 12 * 10) / 10,
    복리: Math.round((1 - (1 - 월률 / 100) ** 12) * 100 * 10) / 10,
  };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 표본행들 = [
    { C1_NM: '전체', C2_NM: '이직률', C2: '16142T181', DT: '8.1' },
    { C1_NM: '전체', C2_NM: '이직률', C2: '16142T181010', DT: '6.6' },
    { C1_NM: '소기업', C2_NM: '이직률', C2: '16142T181', DT: '9.0' },
  ];
  const 골라짐 = 전체이직률줄찾기(표본행들);
  검('전체이직률줄찾기 — C1=전체 중 C2 코드가 제일 짧은 줄을 고른다', 골라짐?.DT === '8.1');
  검('전체이직률줄찾기 — 다른 C1(소기업)은 안 고른다', 골라짐?.C1_NM === '전체');

  const 가짜자료 = { 자료: [{ 인원: 100, 월상실률: 2 }, { 인원: 300, 월상실률: 4 }] };
  const 가중 = 월상실가중평균(가짜자료);
  검('월상실가중평균 — 인원 가중 (100*2+300*4)/400=3.5', 가중.가중월상실률 === 3.5);

  const 연 = 연율화(3.5);
  검('연율화 단리 — 3.5*12=42.0', 연.단리 === 42);
  검('연율화 복리 — 1-(0.965)^12 ≈ 35.2%', Math.abs(연.복리 - 35.2) < 0.5);

  console.log(실패.length ? `⛔ ${실패.length}개 실패 — ${실패.join(' · ')}` : `✅ collect-100y-turnover-official 자가시험 통과 (${4})`);
  process.exit(실패.length ? 1 : 0);
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-turnover-official.mjs';
if (내가직접불렸나 && !process.argv.includes('--자가시험')) {
  const KEY = 키읽기();
  const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList'
    + `&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y`
    + '&prdSe=Y&newEstPrdCnt=2&orgId=142&tblId=DT_G26036';
  const res = await fetch(u);
  const j = JSON.parse(await res.text());
  if (!Array.isArray(j)) { console.error('⛔ 표를 못 받았다 —', JSON.stringify(j).slice(0, 200)); process.exit(1); }

  fs.mkdirSync(path.join(뿌리, 'archive/raw/kosis-turnover'), { recursive: true });
  fs.writeFileSync(path.join(뿌리, 'archive/raw/kosis-turnover', `${j[0]?.PRD_DE ?? 'unknown'}.json`), JSON.stringify(j));

  const 줄 = 전체이직률줄찾기(j);
  if (!줄) { console.error('⛔ 「전체」 이직률 줄을 못 찾았다'); process.exit(1); }

  const industryLife = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 우리 = 월상실가중평균(industryLife);
  const 연율 = 연율화(우리.가중월상실률);

  industryLife['이직률 공식통계 대조'] = {
    '무엇': '우리 월상실률(가중평균)을 연율화해 공식 이직률(중소기업실태조사)과 나란히 놓는다',
    '공식': {
      '이름': `${줄.TBL_NM} (${줄.ORG_ID} ${줄.TBL_ID})`,
      '기관': 'KOSIS · 중소벤처기업부 중소기업실태조사',
      '기준연도': 줄.PRD_DE,
      '최근갱신': 줄.LST_CHN_DE,
      '값': `${줄.DT}%`,
      '단위기간': '연간(그 해 이직 인원 ÷ 전년도 12월 현인원)',
      '모집단': '중소기업(소상공인 제외) — 대기업 없음. 2024년부터 표본틀이 바뀌어 이전 연도와 직접 비교 안 함(원자료 각주)',
      '이용허락범위': 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
      '받은때': 오늘(),
    },
    '우리': {
      '이름': '국민연금 가입 사업장 내역 — 업종 40개 가중평균 월상실률',
      '가중월상실률(%)': 우리.가중월상실률,
      '분모_총인원': 우리.총인원,
      '연율화_단리(×12)': 연율.단리,
      '연율화_복리(1-(1-r)^12)': 연율.복리,
      '단위기간': '월간(그 달 그 사업장 자격을 잃는 사람 ÷ 그 달 가입자)',
      '모집단': '국민연금 가입 2인 이상 사업장 — 대기업 포함, 1인 사업장 없음',
    },
    '어긋남': `공식 ${줄.DT}% 대 우리 연율화 ${연율.복리}%(복리)~${연율.단리}%(단리) — 우리 쪽이 몇 배 높다`,
    '⛔ 못 맞춘 것': [
      '모집단이 다르다 — 공식은 중소기업만(대기업 없음), 우리는 대기업 포함 전체',
      '업종 분류 체계가 달라 업종별 1:1 대조는 하지 않았다 — 전체 대 전체 한 점만 견줬다',
      '월→연 환산은 근사다. 실제 연간 자료가 아니라 12번 반복 가정이다',
    ],
    '⚠ 왜 어긋나는지': '우리가 밝히지 못했다 — 월상실률이 «그 일터를 떠나는 속도»(다른 곳으로 옮겨도 잡힘)라 industry-life.json 자체가 이미 한 번 이런 어긋남(공표 근속 분포 대비 약 50배)을 기록해 뒀다. 이번 것도 같은 무늬로 보이지만 확정하지 않는다',
    '잰이': '3번 · ' + 오늘(),
  };
  fs.writeFileSync(자료길, JSON.stringify(industryLife, null, 1));
  console.log(`✅ 공식 이직률 ${줄.DT}% (${줄.PRD_DE}) · 우리 가중월상실률 ${우리.가중월상실률}% → 연율화 ${연율.복리}%(복리)/${연율.단리}%(단리)`);
  console.log(`저장했다 — ${자료길}`);
}
