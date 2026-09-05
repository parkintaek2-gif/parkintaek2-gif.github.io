#!/usr/bin/env node
/**
 * check-seat-resume-id.mjs — 각 자리의 `_현재/N.id`(재개용 대화 번호)가
 * 그 자리 «자기 폴더»(.claude-uN)에 실제로 있는지 잰다.
 *
 * ── 왜 만드는가 (2026-09-05 · 2번) ──────────────────────────────────
 * 사장님이 1번 창을 열었더니 "대화가 없다"고 하셔서 5번이 원인을 찾았다 —
 * seat-watchdog.mjs 의 낡은 예외 하나가 1번만 .claude(사장님 계정)로 글을 쌓게 했다.
 * 사장님이 「다른 세션들은 문제 없는지 2번 시켜서 확인해」라고 하셔서 재 봤다.
 *
 * 결과 — **6번이 같은 병에 걸려 있었다(원인은 다르다).**
 * `_현재/6.id` 가 가리키는 대화 번호가 `.claude-u6` 어디에도 없다 — 이 기기
 * 전체를 뒤져도 없다. 지금 열려 있는 6번 창은 멀쩡히 일하고 있지만, **그 창이
 * 닫히고 다시 열리는 순간** `claude --resume <그 번호>` 가 실패해 1번과 같은
 * 증상("대화가 없다")이 날 것이다. 조용히 잠들어 있는 병이다.
 *
 * ⛔ 이 자는 고치지 않는다 — 무엇이 진짜 대화인지 짐작해 id 파일을 덮어쓰면
 *    더 큰 사고가 난다. **짚기만 한다.**
 *
 * 쓰는 법
 *   node scripts/check-seat-resume-id.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const 홈 = 'C:/Users/User';
const 입구id폴더 = 'C:/Users/USER/Desktop/00_세션입구/_현재';

function 재귀찾기(뿌리, 이름) {
  if (!existsSync(뿌리)) return null;
  const 큐 = [뿌리];
  while (큐.length) {
    const 자리 = 큐.pop();
    let 목록;
    try { 목록 = readdirSync(자리, { withFileTypes: true }); } catch { continue; }
    for (const it of 목록) {
      const 다음 = path.join(자리, it.name);
      if (it.isDirectory()) 큐.push(다음);
      else if (it.name === `${이름}.jsonl`) return 다음;
    }
  }
  return null;
}

console.log(`■ 자리별 재개-번호 정합성 — ${new Date().toLocaleString('ko-KR')}`);
console.log('  ⛔ 살아 있는 창을 건드리지 않는다. 파일만 읽는다.\n');

let 흠 = 0;
for (let n = 1; n <= 6; n++) {
  const idPath = path.join(입구id폴더, `${n}.id`);
  if (!existsSync(idPath)) { console.log(`── ${n}번  «_현재/${n}.id» 없음 — 아직 등록 전이거나 새 대화만 썼다`); continue; }
  const id = readFileSync(idPath, 'utf8').trim();
  if (!id) { console.log(`── ${n}번  id 파일이 비어 있다`); continue; }
  const 자기뿌리 = path.join(홈, `.claude-u${n}`, 'projects');
  const 자기안 = 재귀찾기(자기뿌리, id);
  if (자기안) {
    console.log(`── ${n}번  ✅ ${id.slice(0, 8)}… → 자기 폴더(.claude-u${n})에 있다`);
  } else {
    const 다른뿌리들 = ['', 1, 2, 3, 4, 5, 6].map((s) => path.join(홈, s === '' ? '.claude' : `.claude-u${s}`, 'projects'));
    let 다른곳 = null;
    for (const r of 다른뿌리들) { const f = 재귀찾기(r, id); if (f) { 다른곳 = f; break; } }
    흠++;
    if (다른곳) {
      console.log(`── ${n}번  🔴 ${id.slice(0, 8)}… 자기 폴더에 없다 — 다른 곳에 있다: ${다른곳}`);
    } else {
      console.log(`── ${n}번  🔴🔴 ${id.slice(0, 8)}… 이 기기 어디에도 없다 — 창을 다시 열면 "대화가 없다"가 뜬다`);
    }
  }
}

console.log(`\n══ 흠 ${흠}개 ══  ${흠 === 0 ? '✅ 여섯 자리 다 자기 번호가 자기 폴더에 있다' : '🔴 사람 손이 필요할 수 있다 — 위 자리를 직접 확인하십시오'}`);
