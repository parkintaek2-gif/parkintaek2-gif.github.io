#!/usr/bin/env node
/**
 * measure-100y-care-retry.mjs — care·kindergarten·nursery 재실험 (비교형 문구)
 *
 * measure-100y-title-audit.mjs 에서 이 세 지면 후보 문구가 전부 흔적 0이었다.
 * 문화 재실험과 같은 방식 — 통계형 대신 비교형/구체형 문구로 다시 잰다.
 *
 * 쓰는 법  node scripts/measure-100y-care-retry.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 자동완성, 자리재기 } from './measure-100y-keyword-demand.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/100yearmap-care-retry.json');

export const 지면별후보 = {
  care: ['몇 살부터 돌봄이 필요한가', '노인 요양 시작 나이', '부모님 돌봄 언제부터', '치매 돌봄 나이'],
  kindergarten: ['유치원 없는 동네', '우리 동네 유치원 몇 개', '유치원 부족 지역'],
  nursery: ['어린이집 대기', '어린이집 못 들어가는 이유', '어린이집 부족 지역'],
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
fs.writeFileSync(낼곳, JSON.stringify({ generated: new Date().toISOString(), 지면별: 결과 }, null, 1));
console.log(`\n냈다 — ${path.relative(뿌리, 낼곳)}`);
