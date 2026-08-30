#!/usr/bin/env node
// 투자AI — 신호 저장소 (①판독층이 만든 신호를 «되돌릴 수 없는 자산»으로 쌓는다. 설계 §2)
// append 전용. 날짜별 파일(signals-YYYYMMDD.jsonl). 같은 sourceId는 두 번 안 쌓는다(멱등).
// 판독 주체 = «이 Claude Code 세션»(무인 크론이 깨우면 세션이 읽어 이 함수로 쓴다). 별도 API 키 아님.
import fs from 'node:fs';
import path from 'node:path';
import { 신호검증 } from './lib-signal.mjs';

const 루트 = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const 저장소디렉 = path.join(루트, 'src/data/invest-ai');

function 파일경로(asOfDay) { return path.join(저장소디렉, `signals-${asOfDay}.jsonl`); }

function 이미있는sourceId(p) {
  if (!fs.existsSync(p)) return new Set();
  const s = new Set();
  for (const l of fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').split('\n')) {
    if (!l) continue; try { const o = JSON.parse(l); if (o.sourceId) s.add(o.sourceId); } catch {}
  }
  return s;
}

// 신호 배열을 검증해 통과분만 그날 저장소에 append. 반환 { 저장, 중복, 탈락[] }.
// asOfDay: 저장 대상 날짜(YYYYMMDD 정수). 호출자가 넘긴다 — Date.now 안 쓴다(재현성).
export function 신호쌓기(신호들, asOfDay) {
  fs.mkdirSync(저장소디렉, { recursive: true });
  const p = 파일경로(asOfDay);
  const 본 = 이미있는sourceId(p);
  let 저장 = 0, 중복 = 0; const 탈락 = [];
  for (const s of 신호들) {
    const 흠 = 신호검증(s);
    if (흠.length) { 탈락.push({ sourceId: s?.sourceId ?? '(없음)', 흠 }); continue; }
    if (본.has(s.sourceId)) { 중복++; continue; }        // 멱등: 같은 원문 두 번 안 쌓음
    fs.appendFileSync(p, JSON.stringify(s) + '\n');
    본.add(s.sourceId); 저장++;
  }
  return { 저장, 중복, 탈락, 파일: p };
}

// CLI: node signal-store.mjs <asOfDay> '<신호 JSON 배열>'  (세션이 읽은 신호를 넘겨 쌓는다)
if (process.argv[1] && process.argv[1].endsWith('signal-store.mjs')) {
  const asOfDay = parseInt(process.argv[2], 10);
  if (!asOfDay) { console.error('사용법: node signal-store.mjs <YYYYMMDD> \'[{신호}...]\''); process.exit(2); }
  const 신호들 = JSON.parse(process.argv[3] || '[]');
  const r = 신호쌓기(신호들, asOfDay);
  console.log(`신호 저장소 — ${r.파일}`);
  console.log(`  ✔ 저장 ${r.저장} · 중복건너뜀 ${r.중복} · 탈락 ${r.탈락.length}`);
  if (r.탈락.length) console.log('  ✘', JSON.stringify(r.탈락));
}
