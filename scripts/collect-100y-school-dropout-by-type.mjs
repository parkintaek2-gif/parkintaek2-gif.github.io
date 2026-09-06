#!/usr/bin/env node
/**
 * collect-100y-school-dropout-by-type.mjs — 학업중단률, 고교유형별로 보면 다른가
 *
 * ⭐ 왜 만드나 — /school/[code] 지면은 이미 학교 하나하나의 학업중단 수치를 보여 준다
 *   (school-dropout.json, 2,371개교). 그런데 그 숫자를 「고교유형」(일반고·특성화고·
 *   자율고·특목고)으로 묶어 견주는 지면은 아직 없다. 학교 이름으로 줄 세우지 않고,
 *   유형이라는 «규모의 사실»로만 견준다 — 개별 학교를 공개적으로 순위 매기지 않는다.
 *
 * ⛔ 이 지면은 학교 이름을 하나도 안 낸다. school-dropout.json 을 pages-school.json 의
 *   고교유형과 code 로 이어(join) 유형별 합계만 낸다.
 *
 * 쓰는 법
 *   node scripts/collect-100y-school-dropout-by-type.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function 유형별합계(중단자료, 학교목록) {
  const 유형맵 = new Map(학교목록.map((s) => [s.code, s.고교유형]));
  const 집계 = {};
  let 유형없음 = 0;
  for (const r of 중단자료) {
    const 유형 = 유형맵.get(r.code);
    if (!유형) { 유형없음 += 1; continue; }
    if (!집계[유형]) 집계[유형] = { 학교수: 0, 재학생합: 0, 중단합: 0 };
    집계[유형].학교수 += 1;
    집계[유형].재학생합 += r.재학생 ?? 0;
    집계[유형].중단합 += r.학업중단 ?? 0;
  }
  return { 집계, 유형없음 };
}

export function 학업중단률(중단합, 재학생합) {
  if (!재학생합 || 재학생합 <= 0) return null;
  return Math.round((중단합 / 재학생합) * 1000) / 10;
}

const 내가직접불렸나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  const 가짜중단 = [
    { code: 'a', 재학생: 100, 학업중단: 2 },
    { code: 'b', 재학생: 200, 학업중단: 4 },
    { code: 'c', 재학생: 50, 학업중단: 1 },
    { code: 'd', 재학생: 100, 학업중단: 3 },
  ];
  const 가짜학교 = [
    { code: 'a', 고교유형: '일반고' },
    { code: 'b', 고교유형: '일반고' },
    { code: 'c', 고교유형: '특성화고' },
    { code: 'e', 고교유형: '자율고' },
  ];
  const { 집계, 유형없음 } = 유형별합계(가짜중단, 가짜학교);
  검('일반고 두 곳이 묶인다', 집계['일반고'].학교수 === 2);
  검('일반고 재학생 합', 집계['일반고'].재학생합 === 300);
  검('일반고 중단 합', 집계['일반고'].중단합 === 6);
  검('특성화고 한 곳', 집계['특성화고'].학교수 === 1);
  검('학교 목록에 없는 code(d) 는 유형없음으로 센다', 유형없음 === 1);
  검('가짜학교에만 있고 중단자료엔 없는 코드(e)는 집계에 안 끼어든다', 집계['자율고'] === undefined);

  검('학업중단률 — 정상 계산', 학업중단률(6, 300) === 2.0);
  검('학업중단률 — 재학생 0이면 null(나눗셈 금지)', 학업중단률(1, 0) === null);
  검('학업중단률 — 재학생 없으면 null', 학업중단률(1, null) === null);
  검('학업중단률 — 소수 첫째자리까지', 학업중단률(11910, 965729) === 1.2);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ collect-100y-school-dropout-by-type 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가직접불렸나 && !process.argv.includes('--selftest')) {
  const 중단자료파일 = path.join(뿌리, 'src/data/100yearmap/school-dropout.json');
  const 학교파일 = path.join(뿌리, 'src/data/100yearmap/pages-school.json');
  if (!fs.existsSync(중단자료파일) || !fs.existsSync(학교파일)) {
    console.error('⛔ 원자료가 없다 — school-dropout.json 또는 pages-school.json 을 먼저 만든다');
    process.exit(1);
  }
  const 중단원본 = JSON.parse(fs.readFileSync(중단자료파일, 'utf8'));
  const 학교목록 = JSON.parse(fs.readFileSync(학교파일, 'utf8'));
  const { 집계, 유형없음 } = 유형별합계(중단원본.자료, 학교목록);

  const 유형별 = Object.entries(집계)
    .map(([유형, v]) => ({
      유형,
      학교수: v.학교수,
      재학생합: v.재학생합,
      학업중단합: v.중단합,
      학업중단률: 학업중단률(v.중단합, v.재학생합),
    }))
    .sort((a, b) => (a.학업중단률 ?? 0) - (b.학업중단률 ?? 0));

  const 낸다 = {
    무엇: '고등학교 학업중단률, 고교유형(일반고·특성화고·자율고·특목고)별로 다른가',
    만든날: 오늘(),
    출처: {
      기관: '학교알리미(한국교육학술정보원) 공개용데이터 · 교육부 NEIS 교육정보 개방 포털',
      표: '전·출입 및 학업중단 학생 수(학교알리미) × 학교기본정보(NEIS)',
      공시연도: 중단원본.출처.공시연도,
      이용허락범위: 중단원본.출처.이용허락범위,
    },
    덮는범위:
      '학업중단률이 공시된 학교 2,371곳 가운데 NEIS 고교유형(일반고·특성화고·자율고·특목고)이 ' +
      `확인되는 ${중단원본.자료.length - 유형없음}곳만 묶었다(유형 미상 ${유형없음}곳 제외). ` +
      '학교 이름은 하나도 싣지 않는다 — 유형 넷으로만 견준다.',
    대조:
      '못 맞췄다 — 학교알리미·언론이 발표한 학업중단률 전국 평균(교육부 공식 발표치)과 ' +
      '이 계산을 대조해 본 적이 없다. 여기 수치는 학업중단이 공시된 2,371개교만의 자체 계산이다.',
    유형별,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/school-dropout-by-type.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   유형 미상 ${유형없음}곳 제외`);
  for (const 행 of 유형별) console.log(`   ${행.유형} — ${행.학교수}개교 · 학업중단률 ${행.학업중단률}%`);
}
