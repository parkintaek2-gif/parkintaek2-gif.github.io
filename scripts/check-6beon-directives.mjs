#!/usr/bin/env node
/**
 * check-6beon-directives.mjs — **6번에게 온 지시를 삼키지 않는 확인기.**
 *
 * ── 왜 (2번 지시 2026-08-21) ────────────────────────────────────
 * 5번이 밤새 지시 다섯을 못 받았다. 게을러서가 아니라 **자가 틀려서**였다 —
 * 확인기가 「내 마지막 진행 줄 **뒤**」만 읽어, 한 줄 쓸 때마다 앞의 지시가
 * 「본 것」으로 넘어갔다. 6번도 같은 병이었다(tail·awk NR> 로 잘라 읽었다).
 *
 * ⭐ 고침: 「본 것」의 뜻을 **「내가 마지막에 쓴 줄 뒤」 → 「내가 지웠다고 표시한 데까지」**
 *   로 바꾼다. 진행 줄을 써도 워터마크는 안 움직인다. 내가 명시로 지울 때만 움직인다.
 *   그래서 답하지 않은 지시는 **계속 뜬다.** 조용히 지나가는 것이 없다.
 *
 * 쓰는 법
 *   node scripts/check-6beon-directives.mjs           안 지운 6번 지시를 모두 본다
 *   node scripts/check-6beon-directives.mjs --clear N  N번째 줄까지 「답했다」로 지운다
 *   node scripts/check-6beon-directives.mjs --selftest
 *
 * 워터마크는 저장소 밖(세션 로컬)에 둔다 — 자리마다 다르므로 커밋하지 않는다.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 메모 = 'docs/세션간-메모.md';
const 워터마크 = path.join(os.homedir(), '.claude', '6beon-directive-watermark.txt');

/** 6번에게 온 지시 머리글인가. 「→ 6번」이 든 [ ] 머리글, 또는 사장님 전사 지시. */
export function 지시머리글인가(줄) {
  if (!/^#{0,3}\s*(\*\*)?\[/.test(줄) && !/^#{0,3}\s*🔴/.test(줄)) return false;
  // ⛔ 내가 **보내는** 글([6번 → …])은 지시가 아니다. 6번이 화살표 **왼쪽**이면 뺀다.
  if (/\[\s*(\*\*)?6번\b/.test(줄) || /(?<![0-9])6번\s*(?:b78d5fbe\s*)?→/.test(줄)) return false;
  // 6번이 화살표 **오른쪽**(받는 쪽)일 때만 지시다. → … 6번
  // ⚠ \b6번\b 는 못 쓴다 — 한글 「번」 뒤에서 ASCII 경계가 안 걸린다. 앞 숫자만 룩비하인드로 막는다.
  if (/→[^\]]*(?<![0-9])6번/.test(줄)) return true;
  if (/\[2번 → (전 자리|전자리|모두|각 자리)/.test(줄)) return true;
  if (/사장님/.test(줄) && /→/.test(줄) && /6번|전 자리|각 자리/.test(줄)) return true;
  return false;
}

export function 지시찾기(본문) {
  const 줄들 = 본문.split(/\r?\n/);
  const 것 = [];
  for (let i = 0; i < 줄들.length; i++) {
    if (지시머리글인가(줄들[i])) 것.push({ 줄번호: i + 1, 글: 줄들[i].trim() });
  }
  return 것;
}

function 워터마크읽기() {
  try {
    const n = parseInt(fs.readFileSync(워터마크, 'utf8').trim(), 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0, 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (실제 === 바람) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름} — 받은 것 ${JSON.stringify(실제)}`); }
  };
  재본다('콕 집은 것을 잡는다', 지시머리글인가('## [2번 → 6번] 먼저 자를 보라'), true);
  재본다('여럿 중 6번을 잡는다', 지시머리글인가('**[2번 → 3번·5번·6번] 어제 몇 명 재라**'), true);
  재본다('전 자리를 잡는다', 지시머리글인가('## 🔴 [2번 → 전 자리] 사장님 어제 지시 넷'), true);
  재본다('딴 자리만이면 안 잡는다', 지시머리글인가('## [2번 → 5번] 커뮤니티 순서'), false);
  재본다('그냥 진행 줄은 안 잡는다', 지시머리글인가('[진행] 6번 04:2x 했다: …'), false);
  console.log(`6번 지시 확인기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const clearIdx = process.argv.indexOf('--clear');
  if (clearIdx >= 0) {
    const n = parseInt(process.argv[clearIdx + 1], 10);
    if (!Number.isFinite(n)) { console.error('쓰는 법 — --clear <줄번호>'); process.exit(2); }
    fs.mkdirSync(path.dirname(워터마크), { recursive: true });
    fs.writeFileSync(워터마크, String(n));
    console.log(`✅ ${n}번째 줄까지 「답했다」로 지웠다. 이 아래로만 뜬다.`);
    process.exit(0);
  }
  if (!fs.existsSync(메모)) { console.error(`⛔ 없다 — ${메모}`); process.exit(1); }
  const wm = 워터마크읽기();
  const 지시 = 지시찾기(fs.readFileSync(메모, 'utf8')).filter((d) => d.줄번호 > wm);
  if (!지시.length) {
    console.log(`✅ 워터마크(${wm}줄) 뒤로 안 답한 6번 지시 없음.`);
    process.exit(0);
  }
  console.log(`🔴 안 답한 6번 지시 ${지시.length}건 (워터마크 ${wm}줄 뒤):\n`);
  for (const d of 지시) console.log(`  ${String(d.줄번호).padStart(6)}  ${d.글.slice(0, 140)}`);
  console.log(`\n다 처리했으면: node scripts/check-6beon-directives.mjs --clear ${지시.at(-1).줄번호}`);
}
