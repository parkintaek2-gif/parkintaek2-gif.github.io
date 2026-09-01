#!/usr/bin/env node
/**
 * build-100y-ranking-university-level.mjs — 「순위+문제제기」 시리즈 5편
 * **대학 순위 — 학제별(4년제 대학 vs 전문대학)**
 *
 * 사장님 지시(2026-08-31 원문 10) — 「4년제, 3년제, 2년제...다 나눠서 공격적으로」.
 * 2026-08-31 19:25 KST 3번이 사장님께 약속한 「지역별→설립별→학제별」의 마지막 편.
 *
 * ⛔ 대학 개별을 새로 평가하지 않는다 — 4·5편과 같은 방식, 공시된 값의 학제별 평균만.
 * ⭐ 「전문대학이 4년제 대학보다 평균 취업률이 높다」— 통념과 반대되는 실측이라
 *   `docs/3번-순위콘텐트-지침.md`의 "문제제기" 취지에 정확히 맞는 편이다.
 *
 * 쓰는 법  node scripts/build-100y-ranking-university-level.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import universities from '../src/data/100yearmap/pages-university.json' with { type: 'json' };

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function 평균(합, 수) {
  if (!수) return null;
  return Math.round((합 / 수) * 10) / 10;
}

/** ⚠ `구분` 필드다 — `종류`(대학교/교육대학/전문대학, 셋)와 다른 축이다. 헷갈리지 않는다 */
export function 학제별집계(대학목록) {
  const 갈래 = {};
  for (const u of 대학목록) {
    if (u.취업률?.값 == null) continue;
    const g = u.구분;
    if (!갈래[g]) 갈래[g] = { 학교수: 0, 취업률합: 0, 중도탈락률합: 0, 중도탈락N: 0, 재학생충원율합: 0, 재학생충원N: 0 };
    갈래[g].학교수++;
    갈래[g].취업률합 += u.취업률.값;
    if (u.중도탈락률?.값 != null) { 갈래[g].중도탈락률합 += u.중도탈락률.값; 갈래[g].중도탈락N++; }
    if (u.재학생충원율?.값 != null) { 갈래[g].재학생충원율합 += u.재학생충원율.값; 갈래[g].재학생충원N++; }
  }
  const 결과 = {};
  for (const [g, v] of Object.entries(갈래)) {
    결과[g] = {
      학교수: v.학교수,
      평균취업률: 평균(v.취업률합, v.학교수),
      평균중도탈락률: 평균(v.중도탈락률합, v.중도탈락N),
      평균재학생충원율: 평균(v.재학생충원율합, v.재학생충원N),
    };
  }
  return 결과;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 가짜 = [
    { 구분: '대학', 취업률: { 값: 60 }, 중도탈락률: { 값: 5 }, 재학생충원율: { 값: 100 } },
    { 구분: '대학', 취업률: { 값: 80 }, 중도탈락률: null, 재학생충원율: { 값: 110 } },
    { 구분: '전문대학', 취업률: { 값: 90 }, 중도탈락률: { 값: 10 }, 재학생충원율: null },
    { 구분: '대학', 취업률: null },
  ];
  const 집계 = 학제별집계(가짜);
  본다('① 취업률 없는 대학은 뺀다', 집계.대학.학교수 === 2);
  본다('② 학교수를 정확히 센다', 집계.전문대학.학교수 === 1);
  본다('③ 취업률 평균이 맞다', 집계.대학.평균취업률 === 70);
  본다('④ 못 낸 항목은 null(0으로 안 채운다)', 집계.대학.평균중도탈락률 === 5 && 집계.전문대학.평균재학생충원율 === null);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-ranking-university-level.mjs';
if (내가직접불렸나) {
  const 학제별 = 학제별집계(universities);
  const 총계 = Object.values(학제별).reduce((a, v) => a + v.학교수, 0);
  const 취업률있는대학수 = universities.filter((u) => u.취업률?.값 != null).length;

  const 자료 = {
    무엇: '대학 순위 — 학제별(4년제 대학 vs 전문대학) 취업률 평균',
    만든날: new Date().toLocaleString('sv-SE').slice(0, 10),
    출처: {
      기관: '한국대학교육협의회',
      표: '대학정보공시(대학알리미)',
      창구: 'pages-university.json (100yearmap 기존 실측 자료)',
      공시연도: universities.find((u) => u.공시연도)?.공시연도 ?? '미확인',
    },
    '⛔ 이것은 새 평가가 아니다': '이미 공시된 개별 대학 값을 학제별로 묶어 평균 낸 것입니다. 대학 하나하나를 저희가 새로 평가하지 않았습니다.',
    학제별,
    자가대조: {
      '학제별 학교수 합 == 취업률 있는 대학수': 총계 === 취업률있는대학수,
      합: 총계,
      취업률있는대학수,
    },
  };

  fs.writeFileSync(
    path.join(뿌리, 'src', 'data', '100yearmap', 'ranking-university-level.json'),
    JSON.stringify(자료, null, 1) + '\n',
    'utf8',
  );
  console.log(`✅ 대학(4년제) ${학제별.대학.평균취업률}% · 전문대학 ${학제별.전문대학.평균취업률}% (자가대조: ${자료.자가대조['학제별 학교수 합 == 취업률 있는 대학수']})`);
}
