#!/usr/bin/env node
/**
 * measure-100y-title-audit.mjs — **기존 지면 전체 제목-검색어 정합 감사**
 *
 * 사장님(2026-08-22/23) — 「당분간 방문+체류 집중」·「기획한 걸 구현할 때도 항상 염두에 둬」.
 * 4-4절 방식(자동완성 흔적 실측 후에만 제목을 바꾼다)을 아직 안 잰 나머지 지면들에도
 * 그대로 적용한다 — 짐작으로 제목을 고치지 않는다.
 *
 * 쓰는 법  node scripts/measure-100y-title-audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 자동완성, 자리재기 } from './measure-100y-keyword-demand.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/100yearmap-title-audit.json');

/** 지면마다 후보 문구 — 지면의 실제 내용(제목·H1)에서 자연스럽게 나올 만한 말만 짓는다 */
export const 지면별후보 = {
  afterschool: ['초등학교 방과후 참여율', '방과후학교 참여율', '초등 돌봄교실'],
  breakfast: ['아침 결식률', '청소년 아침 안 먹는 비율', '아침 거르는 이유'],
  care: ['노인 돌봄 필요 나이', '몇 살부터 돌봄이 필요할까', '고령자 돌봄 비율'],
  'healthy-years': ['건강수명', '건강 기대수명', '건강하게 사는 나이'],
  home: ['내 집 마련 나이', '주택 소유 나이대', '몇 살에 집 사나', '집 사는 평균 나이'],
  'keep-working': ['은퇴 후 계속 일하고 싶은 이유', '정년 후 재취업', '은퇴 후에도 일하고 싶은 비율'],
  kindergarten: ['우리 동네 유치원 개수', '유치원 없는 지역'],
  'longest-job': ['평균 퇴직 나이', '몇 살에 퇴직하나', '정년 나이'],
  nursery: ['어린이집 없는 지역', '보육 사각지대'],
  pediatrics: ['소아과 오픈런', '소아과 없는 지역', '소아과 대란'],
  spending: ['나이대별 소비지출', '40대 평균 지출', '월평균 소비지출 나이대'],
  'years-left': ['기대수명', '평균 수명', '몇 살까지 사나'],
};

const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

const 결과 = {};
for (const [지면, 후보들] of Object.entries(지면별후보)) {
  결과[지면] = [];
  for (const 말 of 후보들) {
    const r = 자리재기(말, await 자동완성(말));
    결과[지면].push({ 말, ...r });
    const 표 = r.물음실패 ? '못 물었다'
      : `${r.그대로있나 ? `있다(${r.몇번째}번째)` : '없다'} · 그 말로 시작 ${r.그말로시작}줄`;
    console.log(`  [${지면}] ${말.padEnd(20)} ${표}`);
    await 쉼(400);
  }
}

fs.writeFileSync(낼곳, JSON.stringify({
  generated: new Date().toISOString(),
  왜: '기존 지면 전체를 사장님 「방문+체류」 지시에 맞춰 실측 감사',
  whatThisIs: 'Korean Google Suggest autocomplete presence (client=firefox&hl=ko, EUC-KR decoded).',
  whatThisIsNot: '월간 검색량이 아니다.',
  지면별: 결과,
}, null, 1));
console.log(`\n냈다 — ${path.relative(뿌리, 낼곳)}`);
