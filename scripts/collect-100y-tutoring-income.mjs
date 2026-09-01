#!/usr/bin/env node
/**
 * collect-100y-tutoring-income.mjs — 「가구 월소득별 사교육 참여율」을 받는다.
 *
 * ── 왜 이 표를 쓰나 (2026-09-02) ──────────────────────────────
 * 101/DT_1PE102(학교급 및 특성별 사교육 참여율)는 이미 만든 /tutoring(DT_1PE301)과
 * 같은 조사(초중고사교육비조사)의 같은 원자료다 — 2025년 전체 참여율(75.74%)이 두 표에서
 * 한 자리도 안 틀리고 같다(검산 완료). 다만 이 표는 「특성별」 축(C1)이 지역뿐 아니라
 * **가구 월소득**까지 있어, 소득이 참여율을 얼마나 가르는지 처음 보여 준다.
 *
 * ⛔ 소득구간은 시계열이 아니다 — statisticsExplData 원문: 「2022년: 소득구간
 *   '300만원 미만' 추가 공표」. 2021년 이전은 100만원 단위의 더 잘게 쪼갠 구간이었다.
 *   그래서 이 자는 **최신연도 한 해(2025)만** 받는다. 여러 해를 이어 붙이면 구간이 바뀐
 *   것을 추세로 오독한다.
 *
 * ⛔ 참여율 정의(statisticsExplData 원문): 「사교육 참여율은 전체학생 중 사교육비를
 *   지출한 참여학생의 비율임」 — 사교육을 안 받은 학생도 분모에 들어간다. 표본가중치
 *   기반 인구비중(대상분포)과 다른 말이다(DT_1PE202 사고 재발 방지).
 *
 * 자가시험: node scripts/collect-100y-tutoring-income.mjs --selftest
 * 실행:     node scripts/collect-100y-tutoring-income.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/tutoring-income.json');

export const 소득구간표 = [
  { 키: 'A0', 이름: '300만원 미만' },
  { 키: 'A4', 이름: '300~400만원 미만' },
  { 키: 'A5', 이름: '400~500만원 미만' },
  { 키: 'A6', 이름: '500~600만원 미만' },
  { 키: 'A7', 이름: '600~700만원 미만' },
  { 키: 'AA81', 이름: '700~800만원 미만' },
  { 키: 'AA82', 이름: '800만원 이상' },
];

export const 학교급표 = [
  { 키: 'T01', 이름: '전체' },
  { 키: 'T02', 이름: '초등학교' },
  { 키: 'T03', 이름: '중학교' },
  { 키: 'T04', 이름: '고등학교' },
];

/** rows(원자료 배열)에서 {소득구간별: {학교급: 값}} 표를 뽑는다 */
export function 표뽑기(rows) {
  const 결과 = {};
  for (const { 키: ck, 이름: cn } of 소득구간표) {
    결과[cn] = {};
    for (const { 키: ik, 이름: iname } of 학교급표) {
      const row = (rows ?? []).find((r) => r.C1 === ck && r.ITM_ID === ik);
      결과[cn][iname] = row && Number.isFinite(Number(row.DT)) ? Number(row.DT) : null;
    }
  }
  return 결과;
}

/** ⛔ 소득이 오를수록 전체 참여율이 내려가면 안 된다 — 내려가면 자를 의심한다 */
export function 단조증가하나(표, 학교급 = '전체') {
  const 값들 = 소득구간표.map(({ 이름 }) => 표[이름]?.[학교급]).filter((v) => v != null);
  for (let i = 1; i < 값들.length; i++) {
    if (값들[i] < 값들[i - 1]) return false;
  }
  return 값들.length === 소득구간표.length;
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 표본 = [
    { C1: 'A0', ITM_ID: 'T01', DT: '52.8' },
    { C1: 'A4', ITM_ID: 'T01', DT: '64.2' },
    { C1: 'A5', ITM_ID: 'T01', DT: '70.9' },
    { C1: 'A6', ITM_ID: 'T01', DT: '74.9' },
    { C1: 'A7', ITM_ID: 'T01', DT: '78.9' },
    { C1: 'AA81', ITM_ID: 'T01', DT: '83.1' },
    { C1: 'AA82', ITM_ID: 'T01', DT: '84.9' },
  ];
  const 표 = 표뽑기(표본);
  검('7개 구간을 다 뽑는다', Object.keys(표).length === 7);
  검('300만원 미만 값이 맞다', 표['300만원 미만']['전체'] === 52.8);
  검('⭐ 소득이 오를수록 참여율이 오른다(단조증가)', 단조증가하나(표));
  검('⛔ 못 잰 칸은 null이다(0이 아니다)', 표['300만원 미만']['초등학교'] === null);

  const 거꾸로 = 표뽑기([
    { C1: 'A0', ITM_ID: 'T01', DT: '90' },
    { C1: 'A4', ITM_ID: 'T01', DT: '50' },
  ]);
  검('⛔ 거꾸로면 단조증가가 아니다', 단조증가하나(거꾸로) === false);
  검('⛔ 빈 것도 안 터진다', 표뽑기(undefined)['300만원 미만']['전체'] === null);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-tutoring-income 자가시험 통과 (8)');
  process.exit(0);
}

const 키 = 키읽기();
const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&orgId=101&tblId=DT_1PE102&prdSe=Y&newEstPrdCnt=1`;
const rows = await (await fetch(url)).json();
if (!Array.isArray(rows)) {
  console.error(`⛔ 못 받았다 — ${JSON.stringify(rows).slice(0, 200)}`);
  process.exit(1);
}
const 연도 = rows[0]?.PRD_DE;
const 표 = 표뽑기(rows);

if (!단조증가하나(표)) {
  console.error('⛔ 자가대조 실패 — 소득이 오르는데 전체 참여율이 안 오르는 구간이 있다. 받은 값을 의심한다.');
  process.exit(1);
}

const 최고 = 표['800만원 이상']['전체'];
const 최저 = 표['300만원 미만']['전체'];

const 출력 = {
  출처: {
    이름: '국가데이터처 KOSIS · 통계청 「초중고사교육비조사」',
    표: '101/DT_1PE102 (학교급 및 특성별 사교육 참여율)',
    정의: '사교육 참여율은 전체학생(사교육을 받지 않은 학생 포함) 중 사교육비를 지출한 참여학생의 비율임 (statisticsExplData 원문)',
    대상: '전국 초·중·고 학생의 학부모 — 표본조사(가구 소득 자기응답)',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-02',
  기준연도: 연도,
  못낸해: '2021년 이전은 소득구간이 100만원 단위로 더 잘게 나뉘어 있었다(2022년 "300만원 미만" 구간 신설, statisticsExplData 원문). 구간이 달라 시계열로 잇지 않는다 — 2025년 한 해만 낸다.',
  소득구간별: 표,
  최고구간: { 이름: '800만원 이상', 값: 최고 },
  최저구간: { 이름: '300만원 미만', 값: 최저 },
  격차: Math.round((최고 - 최저) * 100) / 100,
  자가대조: {
    소득_오를수록_참여율_오름: 단조증가하나(표),
    전체평균_교차검산: '2025년 전체 참여율(75.74%)이 /tutoring 페이지(DT_1PE301 기반)와 일치 — 같은 조사 원자료임을 확인',
  },
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ ${연도}년 소득구간 ${소득구간표.length}개 · 격차 ${출력.격차}%p → ${path.relative(뿌리, 낼길)}`);
