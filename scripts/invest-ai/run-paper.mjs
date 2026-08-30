#!/usr/bin/env node
// 투자AI — 페이퍼 실행 (①→②→③를 잇고 감사 원장을 남긴다)
// 「첫 주문부터 남긴다」(설계 §1). 실제 매매·시세 없음 — 결정론 층의 재현 가능한 발주 기록.
// ①애널리스트(LLM)는 여기서 «픽스처»로 대신한다(신호는 파일에서 읽는다). ②③는 진짜 규칙 코드.
// ⛔ 실제 증권 추천이 아니다. 픽스처는 market:TEST·코드 T* 로 실제와 무관하다.
import fs from 'node:fs';
import path from 'node:path';
import { 신호거르기 } from './lib-signal.mjs';
import { 포지션정하기 } from './fund-manager.mjs';
import { 심사, 기본한도 } from './risk-manager.mjs';

const 루트 = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const 신호경로 = process.argv[2] || path.join(루트, 'src/data/invest-ai/signals-fixture.jsonl');
const 원장경로 = path.join(루트, 'src/data/invest-ai/paper-ledger.jsonl');

function 신호읽기(p) {
  const 줄 = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').split('\n').filter(Boolean);
  const 신호 = [], 머리 = [];
  for (const l of 줄) { const o = JSON.parse(l); (o._fixture || o._manifest) ? 머리.push(o) : 신호.push(o); }
  const asOfDay = 머리.find((h) => h.asOfDay)?.asOfDay ?? 20260830;
  return { 신호, asOfDay };
}

export function 페이퍼실행(신호경로, 상태 = {}) {
  const { 신호, asOfDay } = 신호읽기(신호경로);
  const { 통과, 탈락 } = 신호거르기(신호);              // ① 판독층 출력 검증
  const { 목표, 원점수 } = 포지션정하기(통과, asOfDay);   // ② 펀드매니저(결정론)
  const 판정 = 심사(목표, 상태, 기본한도);               // ③ 리스크 관리자(결정론, ②를 멈출 수 있다)
  return {
    asOfDay, 신호수: 신호.length, 통과수: 통과.length, 탈락, 원점수,
    목표비중: 목표, 승인비중: 판정.승인비중, 위반: 판정.위반,
    발주중단: 판정.발주중단, 낙폭잠금: 판정.낙폭잠금,
  };
}

// 직접 실행 시: 원장 한 줄을 append (ts 는 신호의 asOfDay 를 쓴다 — Date.now 안 씀, 재현성)
if (process.argv[1] && process.argv[1].endsWith('run-paper.mjs')) {
  const 결과 = 페이퍼실행(신호경로);
  const 원장줄 = JSON.stringify({ asOf: 결과.asOfDay, 승인비중: 결과.승인비중, 위반수: 결과.위반.length, 발주중단: 결과.발주중단 });
  fs.appendFileSync(원장경로, 원장줄 + '\n');
  console.log('투자AI 페이퍼 실행 — 결정론 ①→②→③');
  console.log(`  신호 ${결과.신호수}건 · 검증통과 ${결과.통과수} · 탈락 ${결과.탈락.length}`);
  console.log(`  ② 목표비중  :`, 결과.목표비중);
  console.log(`  ③ 승인비중  :`, 결과.승인비중, 결과.발주중단 ? '(발주중단)' : '');
  if (결과.위반.length) console.log(`  ③ 한도위반  :`, JSON.stringify(결과.위반));
  console.log(`  → 감사 원장에 1줄 append: ${원장경로}`);
}
