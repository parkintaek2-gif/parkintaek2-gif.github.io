#!/usr/bin/env node
/**
 * build-100y-ranking-university-region.mjs — 「순위+문제제기」 시리즈 4편
 * **대학 순위 — 권역별(수도권·영남·호남·충청·강원제주)**
 *
 * 사장님 지시(2026-08-31 원문 10) — 「전국 순위, 각 지역순위...다 나눠서 공격적으로」
 * 2026-08-31 19:25 KST, 3번이 사장님께 「지역별→설립별→학제별」 순서로 만들겠다고
 * 약속한 그 첫 번째 편이다(다른 판단으로 설립별을 먼저 냈지만, 이제 순서를 채운다).
 *
 * ⛔ 17개 시·도를 낱개로 다 쪼개지 않는다 — 표본이 3~4곳뿐인 시도(세종3·제주4·울산4)가
 *   섞여 우연이 «지역 차이»로 읽힌다. 대신 관행적인 5개 권역(수도권·영남·호남·충청·
 *   강원제주)으로 묶는다 — `docs/3번-순위콘텐트-지침.md`가 예시로 든 갈래 그대로다.
 * ⛔ 대학 개별을 새로 평가하지 않는다 — 3편(설립별)과 같은 방식, 이미 공시된 값의
 *   권역별 평균만 낸다.
 *
 * 쓰는 법  node scripts/build-100y-ranking-university-region.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import universities from '../src/data/100yearmap/pages-university.json' with { type: 'json' };

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 17개 시·도 → 5개 권역. ⛔ 짐작이 아니라 통상적으로 쓰는 갈래(수도권/영남/호남/충청/강원·제주) */
export const 권역표 = {
  서울: '수도권', 경기: '수도권', 인천: '수도권',
  부산: '영남', 대구: '영남', 울산: '영남', 경북: '영남', 경남: '영남',
  광주: '호남', 전북: '호남', 전남: '호남',
  대전: '충청', 세종: '충청', 충북: '충청', 충남: '충청',
  강원: '강원·제주', 제주: '강원·제주',
};

export function 평균(합, 수) {
  if (!수) return null;
  return Math.round((합 / 수) * 10) / 10;
}

export function 권역별집계(대학목록) {
  const 갈래 = {};
  const 못가른것 = [];
  for (const u of 대학목록) {
    if (u.취업률?.값 == null) continue;
    const g = 권역표[u.지역];
    if (!g) { 못가른것.push(u.지역); continue; }
    if (!갈래[g]) 갈래[g] = { 학교수: 0, 취업률합: 0, 중도탈락률합: 0, 중도탈락N: 0 };
    갈래[g].학교수++;
    갈래[g].취업률합 += u.취업률.값;
    if (u.중도탈락률?.값 != null) { 갈래[g].중도탈락률합 += u.중도탈락률.값; 갈래[g].중도탈락N++; }
  }
  const 결과 = {};
  for (const [g, v] of Object.entries(갈래)) {
    결과[g] = {
      학교수: v.학교수,
      평균취업률: 평균(v.취업률합, v.학교수),
      평균중도탈락률: 평균(v.중도탈락률합, v.중도탈락N),
    };
  }
  return { 결과, 못가른것 };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 17개 시도가 다 권역표에 있다', Object.keys(권역표).length === 17);
  본다('② 5개 권역뿐이다', new Set(Object.values(권역표)).size === 5);
  const 가짜 = [
    { 지역: '서울', 취업률: { 값: 60 }, 중도탈락률: { 값: 5 } },
    { 지역: '경기', 취업률: { 값: 80 }, 중도탈락률: null },
    { 지역: '부산', 취업률: { 값: 50 }, 중도탈락률: { 값: 10 } },
    { 지역: '알수없는곳', 취업률: { 값: 90 } },
    { 지역: '대구', 취업률: null },
  ];
  const { 결과, 못가른것 } = 권역별집계(가짜);
  본다('③ 서울+경기가 수도권으로 묶인다', 결과.수도권.학교수 === 2 && 결과.수도권.평균취업률 === 70);
  본다('④ 취업률 없는 대학은 뺀다', 결과.영남.학교수 === 1);
  본다('⑤ 모르는 지역은 따로 담는다(짐작 안 함)', 못가른것.includes('알수없는곳'));
  본다('⑥ 못 낸 항목은 null', 결과.영남.평균중도탈락률 === 10);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-ranking-university-region.mjs';
if (내가직접불렸나) {
  const { 결과: 권역별, 못가른것 } = 권역별집계(universities);
  if (못가른것.length) throw new Error(`권역표에 없는 지역이 있다: ${[...new Set(못가른것)].join(', ')}`);

  const 총계 = Object.values(권역별).reduce((a, v) => a + v.학교수, 0);
  const 취업률있는대학수 = universities.filter((u) => u.취업률?.값 != null).length;

  const 자료 = {
    무엇: '대학 순위 — 권역별(수도권·영남·호남·충청·강원제주) 취업률 평균',
    만든날: new Date().toLocaleString('sv-SE').slice(0, 10),
    출처: {
      기관: '한국대학교육협의회',
      표: '대학정보공시(대학알리미)',
      창구: 'pages-university.json (100yearmap 기존 실측 자료)',
      공시연도: universities.find((u) => u.공시연도)?.공시연도 ?? '미확인',
    },
    '⛔ 이것은 새 평가가 아니다': '이미 공시된 개별 대학 값을 권역별로 묶어 평균 낸 것입니다. 대학 하나하나를 저희가 새로 평가하지 않았습니다.',
    '⛔ 17개 시도를 그대로 안 쓴 이유': '세종(3곳)·제주(4곳)·울산(4곳)처럼 학교 수가 적은 시도가 섞이면 우연이 지역 차이로 읽힙니다. 통상적으로 쓰는 5개 권역으로 묶었습니다.',
    권역표,
    권역별,
    자가대조: {
      '권역별 학교수 합 == 취업률 있는 대학수': 총계 === 취업률있는대학수,
      합: 총계,
      취업률있는대학수,
    },
  };

  fs.writeFileSync(
    path.join(뿌리, 'src', 'data', '100yearmap', 'ranking-university-region.json'),
    JSON.stringify(자료, null, 1) + '\n',
    'utf8',
  );
  const 정렬 = Object.entries(권역별).sort((a, b) => b[1].평균취업률 - a[1].평균취업률);
  console.log(`✅ ${정렬.map(([g, v]) => `${g} ${v.평균취업률}%`).join(' · ')} (자가대조: ${자료.자가대조['권역별 학교수 합 == 취업률 있는 대학수']})`);
}
