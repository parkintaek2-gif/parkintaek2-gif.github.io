#!/usr/bin/env node
/**
 * build-100y-onet-riasec.mjs — O*NET Interest Profiler(RIASEC) 자료를 지면용으로 다듬는다
 *
 * ## 왜 만드나
 *
 *   `archive/raw/work24/riasec-by-job.json`(고용24, 40건)은 검사 도구 자체(문항·채점·규준)가
 *   미국 PAR 사의 홀랜드 SDS 라이선스물이라 상업 이용이 안 된다(docs/라이선스-대장.tsv
 *   work24 행). 5번이 2026-09-09 찾은 무료 대체가 O*NET Interest Profiler(CC BY 4.0)다.
 *
 * ## 자료
 *
 *   O*NET 31.0 Database "Career Interest Types" — onetcenter.org/database.html 에서
 *   직접 CSV 다운로드(계정 불필요). 923개 직업 × RIASEC 6유형 점수(1~7점) + 1~3순위
 *   유형(숫자 코드 1=Realistic·2=Investigative·3=Artistic·4=Social·5=Enterprising·
 *   6=Conventional·0=뚜렷한 순위 없음).
 *
 * ## ⛔ 이 자료로 말할 수 없는 것
 *
 *   ⛔ 미국 노동시장 기준이다 — 한국 직업 명칭·구조와 다르다. 「한국에서도 이렇다」로
 *      읽으면 안 된다.
 *   ⛔ 값의 6%(52/923곳)는 「Machine Learning」(모델 추정)만 있고 전문가 검증이 없다.
 *      「Machine Learning/Expert」(871곳, 94%)와 갈라 적는다.
 *   ⛔ RIASEC 은 «분류»이지 «순위»가 아니다. 유형이 많은 직업이 «더 좋다»가 아니다.
 *
 * 쓰는 법
 *   node scripts/build-100y-onet-riasec.mjs [--자가시험]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원본길 = path.join(ROOT, 'archive/raw/onet/career-interest-types-31.0.csv');
const 낼길 = path.join(ROOT, 'src/data/100yearmap/onet-riasec.json');

const 유형이름 = { 1: 'Realistic', 2: 'Investigative', 3: 'Artistic', 4: 'Social', 5: 'Enterprising', 6: 'Conventional' };
export const 유형정의 = {
  Realistic: { 한글: '현실형', 뜻: '도구·기계·몸을 쓰는 일 — 만들고 고치고 다루는 쪽' },
  Investigative: { 한글: '탐구형', 뜻: '관찰하고 분석하고 답을 찾는 일 — 연구·조사 쪽' },
  Artistic: { 한글: '예술형', 뜻: '형식에 매이지 않고 만들어내는 일 — 표현·창작 쪽' },
  Social: { 한글: '사회형', 뜻: '사람을 돕고 가르치고 돌보는 일' },
  Enterprising: { 한글: '진취형', 뜻: '설득하고 이끌고 사업을 벌이는 일' },
  Conventional: { 한글: '관습형', 뜻: '자료를 정리하고 규칙대로 처리하는 일 — 사무·회계 쪽' },
};

/** CSV 한 줄을 따옴표까지 지켜 가른다 (직업명에 쉼표가 섞여 있다) */
export function CSV파싱(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function 직업들모으기(rows) {
  const 헤더 = rows[0];
  const idx = Object.fromEntries(헤더.map((h, i) => [h, i]));
  const 직업맵 = new Map();
  for (const r of rows.slice(1)) {
    if (!r[0]) continue;
    const 코드 = r[idx['O*NET-SOC Code']];
    const 이름 = r[idx.Title];
    const 요소 = r[idx['Element Name']];
    const 값 = Number(r[idx['Data Value']]);
    const 출처 = r[idx['Domain Source']];
    if (!직업맵.has(코드)) 직업맵.set(코드, { 코드, 이름, 유형점수: {}, 순위: [], 출처: 출처 });
    const 항목 = 직업맵.get(코드);
    if (요소 in 유형정의) 항목.유형점수[요소] = 값;
    else if (요소.includes('High-Point')) 항목.순위.push(값);
    if (출처.includes('Expert')) 항목.출처 = 'Machine Learning/Expert';
  }
  return [...직업맵.values()];
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 견본CSV = 'O*NET-SOC Code,Title,Element ID,Element Name,Scale ID,Scale Name,Data Value,Date,Domain Source\n'
    + '11-1011.00,"Chief Executives, Big",1.B.1.a,Realistic,OI,Occupational Interests,1.26,02/2026,Machine Learning/Expert\n'
    + '11-1011.00,"Chief Executives, Big",1.B.1.e,Enterprising,OI,Occupational Interests,6.96,02/2026,Machine Learning/Expert\n'
    + '11-1011.00,"Chief Executives, Big",1.B.1.h,First Interest High-Point,IH,Occupational Interest High-Point,5.00,02/2026,Machine Learning/Expert\n';
  const 파싱됨 = CSV파싱(견본CSV);
  검('CSV파싱 — 따옴표 안 쉼표를 한 칸으로 지킨다', 파싱됨.length === 4 && 파싱됨[1][1] === 'Chief Executives, Big');

  const 직업들 = 직업들모으기(파싱됨);
  검('직업들모으기 — 한 코드로 합친다', 직업들.length === 1);
  검('직업들모으기 — Realistic 점수를 잡는다', 직업들[0].유형점수.Realistic === 1.26);
  검('직업들모으기 — Enterprising 점수를 잡는다', 직업들[0].유형점수.Enterprising === 6.96);
  검('직업들모으기 — 순위 코드를 모은다', 직업들[0].순위[0] === 5);
  검('유형이름 — 5는 Enterprising', 유형이름[5] === 'Enterprising');
  검('유형정의 — 여섯 개다', Object.keys(유형정의).length === 6);

  console.log(실패.length ? `⛔ ${실패.length}개 실패 — ${실패.join(' · ')}` : `✅ build-100y-onet-riasec 자가시험 통과 (6)`);
  process.exit(실패.length ? 1 : 0);
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-onet-riasec.mjs';
if (내가직접불렸나 && !process.argv.includes('--자가시험')) {
  if (!fs.existsSync(원본길)) {
    console.error(`⛔ 원본이 없다 — ${원본길}`);
    process.exit(1);
  }
  const rows = CSV파싱(fs.readFileSync(원본길, 'utf8'));
  const 직업들 = 직업들모으기(rows);

  const 전문가검증수 = 직업들.filter((j) => j.출처 === 'Machine Learning/Expert').length;
  const 모델추정수 = 직업들.length - 전문가검증수;

  const 유형분포 = Object.fromEntries(Object.keys(유형정의).map((k) => [k, 0]));
  for (const j of 직업들) {
    const 일순위 = 유형이름[j.순위[0]];
    if (일순위) 유형분포[일순위] += 1;
  }

  const 유형별대표직업 = {};
  for (const 유형 of Object.keys(유형정의)) {
    유형별대표직업[유형] = 직업들
      .filter((j) => 유형이름[j.순위[0]] === 유형 && j.출처 === 'Machine Learning/Expert')
      .sort((a, b) => b.유형점수[유형] - a.유형점수[유형])
      .slice(0, 8)
      .map((j) => ({ 이름: j.이름, 점수: j.유형점수[유형] }));
  }

  const 자료 = {
    무엇: 'O*NET(미국 노동부)가 923개 직업을 홀랜드 흥미유형(RIASEC)으로 분류한 것',
    만든날: 오늘(),
    출처: {
      이름: 'O*NET 31.0 Database — Career Interest Types',
      기관: 'U.S. Department of Labor, Employment and Training Administration · O*NET Center',
      url: 'https://www.onetcenter.org/database.html',
      이용허락범위: 'CC BY 4.0 (출처표시 조건) — onetcenter.org/IP.html·database.html 원문 확인(2026-09-10)',
      받은때: 오늘(),
      대체한것: '고용24 RIASEC 40건(archive/raw/work24/riasec-by-job.json) — 검사도구 자체가 미국 PAR사 홀랜드 SDS 라이선스물이라 상업이용 불가. RIASEC 여섯 유형이라는 «이론»은 학설이라 권리가 없지만, «검사 도구»(문항·채점·규준)는 PAR 것이었다',
    },
    유형정의,
    직업수: 직업들.length,
    전문가검증_직업수: 전문가검증수,
    모델추정만_직업수: 모델추정수,
    유형분포_1순위기준: 유형분포,
    유형별대표직업: 유형별대표직업,
    덮는범위: `미국 노동시장 기준 923개 직업이다 — 한국 직업 명칭·구조와 다르며, "한국에서도 이렇다"로 읽지 않는다. ${모델추정수}개(${Math.round((모델추정수 / 직업들.length) * 1000) / 10}%) 직업은 전문가 검증 없이 모델 추정값만 있어 대표직업 목록에서 뺐다. RIASEC은 여섯 갈래로 나누는 분류다 — 유형 점수가 높다고 그 일을 "더 잘한다"는 뜻이 아니다.`,
    대조: '못 맞췄다 — 이 파일이 O*NET 공식 배포 CSV 원본과 항목 수(923개 직업 × 9행)가 일치하는지만 확인했고, O*NET이 별도로 발표한 요약 통계와 대조해 본 적은 없다.',
  };

  fs.writeFileSync(낼길, JSON.stringify(자료, null, 1));
  console.log(`저장했다 — ${낼길} (직업 ${직업들.length}개, 전문가검증 ${전문가검증수}개)`);
}
