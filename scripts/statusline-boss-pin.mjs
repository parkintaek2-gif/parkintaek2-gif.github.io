#!/usr/bin/env node
// [2026-08-29 지시] "터미널(SessionStart/statusLine) — 사장님 지시 이력 상시 고정. 똑같이 만들어"
// 1번(klifemap)이 만든 것과 같은 자를 6번(dataeconomics)에도 둔다.
// 터미널 맨 아래 상태줄에 항상 뜬다 — 상태줄은 매 턴 다시 그려지므로 "바로 확인"에 맞다.
// SessionStart 훅(scripts/session-boss-pin.mjs)은 세션 시작 때 한 번뿐이라 스크롤에 묻힌다.
// 목록은 docs/고정-지시-목록.md 한 곳 — 사장님이 "N번 고정해제"라 하면 그 줄을 지운다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 목록길 = path.join(__dirname, '..', 'docs', '고정-지시-목록.md');

function 읽기() {
  try {
    const raw = fs.readFileSync(목록길, 'utf8');
    return raw.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));
  } catch {
    return null;
  }
}

const 줄들 = 읽기();
if (!줄들) {
  console.log('📌 고정 지시 없음 (docs/고정-지시-목록.md 없음)');
} else if (줄들.length === 0) {
  console.log('📌 고정 지시 없음');
} else {
  console.log(`📌 고정 지시 ${줄들.length}건 — "N번 고정해제"로 뗀다`);
  for (const l of 줄들) console.log('   ' + l);
}
