#!/usr/bin/env node
/**
 * build-100y-ranking-university-founding.mjs — 「순위+문제제기」 시리즈 3편
 * **대학 순위 — 설립별(국립·공립·사립)**
 *
 * 사장님 지시(2026-08-31, `docs/3번-순위콘텐트-지침.md` 원문 10) —
 * 「전국 순위, 각 지역순위...국립대, 공립대 순위 다 나눠서 공격적으로 제목을 달아」
 *
 * ⛔ 이 지면은 대학 «개별»을 새로 평가·순위매김하지 않는다(그건 이미 1편이 했다) —
 *   여기서는 **설립유형별(국립/공립/사립) 평균**만 낸다. 이미 공개된 개별 대학알리미
 *   공시치를 저희가 «묶어서» 보여줄 뿐, 새 평가가 아니다.
 * ⛔ 표본이 작은 갈래(국립대법인 2곳·특별법법인 5곳·특별법국립 2곳)는 따로 적고,
 *   국립·공립·사립(36·7·277곳) 셋만 주된 비교로 쓴다 — 작은 표본을 큰 것과 나란히
 *   순위표에 올리면 우연이 «차이»로 읽힌다.
 *
 * 쓰는 법  node scripts/build-100y-ranking-university-founding.mjs [--selftest]
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

export function 설립별집계(대학목록) {
  const 갈래 = {};
  for (const u of 대학목록) {
    if (u.취업률?.값 == null) continue;
    const g = u.설립;
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
  본다('① 평균은 밑이 0이면 null', 평균(10, 0) === null);
  본다('② 평균은 소수 한 자리', 평균(10, 3) === 3.3);
  const 가짜 = [
    { 설립: 'A', 취업률: { 값: 60 }, 중도탈락률: { 값: 5 }, 재학생충원율: { 값: 100 } },
    { 설립: 'A', 취업률: { 값: 80 }, 중도탈락률: null, 재학생충원율: { 값: 110 } },
    { 설립: 'B', 취업률: { 값: 50 }, 중도탈락률: { 값: 10 }, 재학생충원율: null },
    { 설립: 'C', 취업률: null },
  ];
  const 집계 = 설립별집계(가짜);
  본다('③ 취업률 없는 대학은 뺀다', 집계.C === undefined);
  본다('④ 학교수를 정확히 센다', 집계.A.학교수 === 2 && 집계.B.학교수 === 1);
  본다('⑤ 취업률 평균이 맞다', 집계.A.평균취업률 === 70);
  본다('⑥ 못 낸 항목은 null(0으로 안 채운다)', 집계.A.평균중도탈락률 === 5 && 집계.B.평균재학생충원율 === null);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-ranking-university-founding.mjs';
if (내가직접불렸나) {
  const 설립별 = 설립별집계(universities);
  const 총계 = Object.values(설립별).reduce((a, v) => a + v.학교수, 0);
  const 취업률있는대학수 = universities.filter((u) => u.취업률?.값 != null).length;

  const 자료 = {
    무엇: '대학 순위 — 설립별(국립·공립·사립) 취업률·중도탈락률·재학생충원율 평균',
    만든날: new Date().toLocaleString('sv-SE').slice(0, 10),
    출처: {
      기관: '한국대학교육협의회',
      표: '대학정보공시(대학알리미)',
      창구: 'pages-university.json (100yearmap 기존 실측 자료, DT 아님)',
      공시연도: universities.find((u) => u.공시연도)?.공시연도 ?? '미확인',
    },
    '⛔ 이것은 새 평가가 아니다': '이미 공시된 개별 대학 값을 설립유형별로 묶어 평균 낸 것입니다. 대학 하나하나를 저희가 새로 평가하지 않았습니다.',
    설립별,
    주요세갈래: ['국립', '공립', '사립'],
    '⚠ 표본이 작은 갈래': Object.entries(설립별)
      .filter(([g]) => !['국립', '공립', '사립'].includes(g))
      .map(([g, v]) => ({ 갈래: g, 학교수: v.학교수 })),
    자가대조: {
      '설립별 학교수 합 == 취업률 있는 대학수': 총계 === 취업률있는대학수,
      합: 총계,
      취업률있는대학수,
    },
  };

  fs.writeFileSync(
    path.join(뿌리, 'src', 'data', '100yearmap', 'ranking-university-founding.json'),
    JSON.stringify(자료, null, 1) + '\n',
    'utf8',
  );
  console.log(`✅ 국립 ${설립별.국립.평균취업률}% · 공립 ${설립별.공립.평균취업률}% · 사립 ${설립별.사립.평균취업률}% (자가대조: ${자료.자가대조['설립별 학교수 합 == 취업률 있는 대학수']})`);
}
