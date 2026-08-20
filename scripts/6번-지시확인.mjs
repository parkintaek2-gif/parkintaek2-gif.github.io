#!/usr/bin/env node
/**
 * 6번-지시확인.mjs — 6번에게 온 지시를 **메모 전체에서** 빠짐없이 뽑는다.
 *
 * 🔴 왜. 2026-08-21 새벽 — 2번이 6번에게 일곱을 걸었는데 하나만 실행됐다.
 *   까닭은 내 확인기가 **시간축(최근 N줄·tail)으로 좁혀** 앞선 지시를 삼켰기 때문이다.
 *   5번도 같은 병이었고 고치자마자 두 시간 만에 커뮤니티가 나왔다.
 *   → 그래서 이 확인기는 **시간창을 두지 않는다.** 파일 처음부터 끝까지 훑는다.
 *
 * 무엇을 잡나 — 머리글에 "6번"이 들어간 [2번 → …] 지시 전부.
 *   [2번 → 6번] · [2번 → 3·5·6번] · [2번 → 5번·3번·6번·4번] 같은 묶음도 잡는다.
 *
 * 쓰는 법
 *   node scripts/6번-지시확인.mjs            # 전체 목록
 *   node scripts/6번-지시확인.mjs --미완     # [진행] 6번 마지막 줄 이후로 온 것만(내가 답 안 한 것)
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const memo = readFileSync(path.join(ROOT, 'docs', '세션간-메모.md'), 'utf8').split('\n');

// 6번에게 온 지시 머리글: [2번 … 6번 …] 또는 「2번 → … 6번」. 6번이 대상에 들어야 한다.
const isDirectiveToMe = (line) => {
  if (!/6번/.test(line)) return false;
  // 지시 머리글 표식: [ … ] 대괄호 안에 2번(발신)과 6번(대상)이 함께, 또는 "→ 6번"
  const bracket = /\[[^\]]*2번[^\]]*6번[^\]]*\]/.test(line) || /\[[^\]]*→[^\]]*6번[^\]]*\]/.test(line);
  const arrow = /2번\s*[→-]+\s*[^\n]*6번/.test(line);
  // 내가 쓴 [진행] 6번 / [실적] 6번 / [6번→2번] 은 지시가 아니다
  const mine = /\[\s*(진행|실적|보고|요청)\s*\]\s*6번/.test(line) || /\[\s*6번\s*[→-]/.test(line);
  return (bracket || arrow) && !mine;
};

// 내가 마지막으로 [진행]/[실적]/[6번→…] 를 쓴 줄 — 그 뒤로 온 지시가 "미완" 후보.
const isMyPost = (line) =>
  /\[\s*(진행|실적|보고)\s*\]\s*6번/.test(line) || /\[\s*6번\s*[→-]/.test(line);

let lastMine = -1;
for (let i = 0; i < memo.length; i++) if (isMyPost(memo[i])) lastMine = i;

const onlyPending = process.argv.includes('--미완');
const hits = [];
for (let i = 0; i < memo.length; i++) {
  if (!isDirectiveToMe(memo[i])) continue;
  if (onlyPending && i <= lastMine) continue;
  // 머리글 다음 비어있지 않은 한 줄을 같이 보여준다(무엇을 시켰는지).
  let body = '';
  for (let j = i + 1; j < Math.min(i + 6, memo.length); j++) {
    if (memo[j].trim()) { body = memo[j].trim().slice(0, 100); break; }
  }
  hits.push({ line: i + 1, head: memo[i].trim().slice(0, 90), body });
}

console.log(`[6번 지시 확인] 메모 ${memo.length}줄 전체 훑음. 내 마지막 글 = ${lastMine + 1}줄.`);
console.log(`${onlyPending ? '미완(내 마지막 글 이후)' : '전체'} 지시 ${hits.length}건:\n`);
for (const h of hits) {
  console.log(`  L${h.line}  ${h.head}`);
  if (h.body) console.log(`         └ ${h.body}`);
}
if (!hits.length) console.log('  (없음)');
