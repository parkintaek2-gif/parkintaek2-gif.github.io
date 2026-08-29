#!/usr/bin/env node
// [2026-08-29 지시] "터미널(SessionStart/statusLine) — 사장님 지시 이력 상시 고정. 똑같이 만들어"
// 1번(klifemap)의 session-boss-pin 과 같은 자. 웹 관리자 화면만으론 부족 — 터미널을 열 때마다 바로 보여야 한다.
// SessionStart 훅으로 docs/사장님-지시-대장.md 원문을 매 세션 시작마다 컨텍스트에 박아 넣는다.
// ⛔ 요약하지 않는다 — 절 제목 + 본문 원문 그대로. 전체는 파일을 직접 연다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 대장길 = path.join(__dirname, '..', 'docs', '사장님-지시-대장.md');

function 절나누기(md) {
  const lines = String(md || '').split('\n');
  const entries = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (cur) entries.push(cur);
      cur = { title: line.slice(3).trim(), body: [] };
    } else if (cur && line.trim() !== '---') {
      cur.body.push(line);
    }
  }
  if (cur) entries.push(cur);
  return entries.reverse(); // 최신이 파일 뒤쪽에 쌓이므로 뒤집는다
}

let content = '📌 **사장님 지시 내역** (docs/사장님-지시-대장.md 를 못 읽었습니다)';
try {
  const raw = fs.readFileSync(대장길, 'utf8');
  const entries = 절나누기(raw);
  const 최근 = entries.slice(0, 5); // 최근 5절만 — 매 세션마다 전체를 넣으면 컨텍스트만 먹는다
  const 몸통 = 최근.map(e => `### ${e.title}\n${e.body.join('\n').trim()}`).join('\n\n---\n\n');
  content =
    `📌 **사장님 지시 내역 — 고정 (docs/사장님-지시-대장.md, 최근 ${최근.length}/${entries.length}절)**\n` +
    `⛔ 전체는 파일을 직접 열어 본다. 여기는 최근 것만 — 매 세션 시작마다 자동으로 보인다.\n\n` +
    몸통;
} catch (e) {
  content += `\n(${e.message})`;
}

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: content }
}));
