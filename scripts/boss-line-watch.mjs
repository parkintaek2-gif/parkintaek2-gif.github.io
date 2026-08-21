#!/usr/bin/env node
/**
 * 📱 사장님 한 줄 지킴이 — `docs/사장님-휴대폰.md` 에 새 줄이 오면 **2번을 깨운다**
 *
 * ── 왜 만들었나 (2026-08-21) ──────────────────────────────────────────
 * 사장님: 「난 휴대폰에서 어떻게 해야 너희랑 소통 가능?」 → 「**이게 중요하지**」
 *
 * 휴대폰에서 GitHub 앱으로 한 줄 쓰시면 저희가 «매시 걷기»에 봅니다.
 * 그런데 걷기는 한 시간에 한 번입니다 — **최악 60분**을 기다리시게 됩니다.
 * ⛔ 급한 말씀이 한 시간 묵히는 것은 소통이 아닙니다.
 *
 * 지킴이는 이미 **15분마다** 돕니다. 거기에 얹으면 60분 → **15분**이 됩니다.
 * 새 장치를 안 만듭니다 — 이미 도는 것에 한 칸을 더합니다.
 *
 * ── 어떻게 ────────────────────────────────────────────────────────────
 * ① git pull 로 저장소를 당긴다(휴대폰에서 쓰신 것은 GitHub 에 있다)
 * ② 사장님 줄(`- [`)의 개수를 센다. 지난번보다 늘었으면 «새 말씀»이다
 * ③ 2번을 깨워 그 줄을 그대로 넘긴다. 일을 시키지 않는다 — 2번이 읽고 가른다
 *
 * ⛔ 답을 달았는지로 판정하지 않는다. **줄 수**로만 센다.
 *   「내가 답했나」는 2번이 판단할 몫이고, 이 자는 «왔다»만 알린다.
 * ⛔ 세는 자리를 시각으로 자르지 않는다 — 8/21 에 5번이 여섯 번 놓친 병이 그것이다.
 *
 * 쓰기:  node scripts/boss-line-watch.mjs [--dry]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, appendFileSync, mkdirSync } from 'node:fs';
import { execFile, execFileSync } from 'node:child_process';
import path from 'node:path';

const 저장소 = 'C:/Users/USER/Documents/GitHub/dataeconomics';
const 말씀파일 = path.join(저장소, 'docs/사장님-휴대폰.md');
const 입구 = 'C:/Users/USER/Desktop/00_세션입구';
const 현재 = path.join(입구, '_현재');
const 표 = path.join(현재, '사장님말씀.state');
const 로그 = path.join(현재, '사장님말씀.log');

/** 대화록이 어느 폴더에 있는지 모르니 자리 폴더를 다 뒤진다 — 그리고 «제일 새것»을 쓴다 */
const 대화록뿌리들 = [
  'C:/Users/USER/.claude/projects',
  ...[1, 2, 3, 4, 5, 6].map((n) => `C:/Users/USER/.claude-u${n}/projects`),
];

const 마른실행 = process.argv.includes('--dry');
const 찍기 = (s) => {
  console.log(s);
  try { mkdirSync(현재, { recursive: true }); appendFileSync(로그, `${new Date().toLocaleString('sv-SE')}  ${s}\n`, 'utf8'); } catch {}
};

/** 사장님이 쓰신 줄만 센다. 머리글·주석·자리들이 단 답(↳)은 안 센다 */
export function 사장님줄들(글) {
  return (글 || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- [') && !l.startsWith('- [↳'));
}

/* ── 자가시험: 자를 먼저 시험한다 ───────────────────────────────────── */
if (process.argv.includes('--시험')) {
  const 본 = [
    '# 머리글',
    '<!-- 주석 - [속지 마라] -->',
    '- [2026-08-21 · 2번] 자리를 만들었습니다',
    '  ↳ [3번 14:20] 봤습니다',
    '- [사장님] 카드 먼저 내라',
  ].join('\n');
  const r = 사장님줄들(본);
  const 맞나 = r.length === 2 && r[1].includes('카드 먼저');
  console.log(맞나 ? '✅ 자가시험 통과 (2줄)' : `🔴 자가시험 실패: ${JSON.stringify(r)}`);
  process.exit(맞나 ? 0 : 1);
}

/* ── ① 당긴다 ─────────────────────────────────────────────────────── */
try {
  execFileSync('git', ['pull', '-q'], { cwd: 저장소, timeout: 60000, shell: true });
} catch {
  찍기('⚠ git pull 이 안 됐다 — 있는 파일로 잰다');
}

if (!existsSync(말씀파일)) { 찍기(`⛔ 말씀 파일이 없다: ${말씀파일}`); process.exit(0); }

/* ── ② 센다 ───────────────────────────────────────────────────────── */
const 줄들 = 사장님줄들(readFileSync(말씀파일, 'utf8'));
const 지난번 = existsSync(표) ? Number(readFileSync(표, 'utf8').trim()) || 0 : 0;

if (줄들.length <= 지난번) {
  찍기(`조용하다 (${줄들.length}줄, 지난번 ${지난번})`);
  process.exit(0);
}

const 새줄 = 줄들.slice(지난번);
찍기(`🔔 새 말씀 ${새줄.length}줄 (${지난번} → ${줄들.length})`);

/* ── ③ 2번을 깨운다 ───────────────────────────────────────────────── */
function 자리ID(번호) {
  const p = path.join(현재, `${번호}.id`);
  return existsSync(p) ? readFileSync(p, 'utf8').trim() : null;
}
function 대화록있는곳(id) {
  let 새것 = null, 곳 = null;
  for (const 뿌리 of 대화록뿌리들) {
    if (!existsSync(뿌리)) continue;
    for (const d of readdirSync(뿌리, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const p = path.join(뿌리, d.name, `${id}.jsonl`);
      if (!existsSync(p)) continue;
      const t = statSync(p).mtimeMs;
      // ⛔ dirname 을 두 번 하면 C:/Users/USER 가 나온다(8/21 실측). 뿌리는 «…/.claude-uN/projects» 다
      if (새것 === null || t > 새것) { 새것 = t; 곳 = path.dirname(뿌리); }
    }
  }
  return 곳; // 예: C:/Users/USER/.claude-u2
}

const id2 = 자리ID(2);
if (!id2) { 찍기('⛔ 2번 id 를 못 찾았다 — 표만 올린다'); }
else {
  const 설정폴더 = 대화록있는곳(id2);
  const 말 =
    '[📱 사장님 한 줄] 휴대폰에서 새 말씀이 왔습니다. **docs/사장님-휴대폰.md 를 전체 읽으십시오.**\n\n' +
    새줄.map((l) => '  ' + l).join('\n') + '\n\n' +
    '1) 나에게 온 것이면 그 줄 «밑에» ↳ 로 한 줄 답을 답니다.\n' +
    '2) 다른 자리 몫이면 [2번 → N번] 으로 갈라 겁니다. ⛔ 답을 모아 두지 않습니다.\n' +
    '3) ⛔ 사장님 줄은 고치거나 지우지 않습니다.';

  if (마른실행) { 찍기(`(마른실행) 2번을 깨울 참이었다 · 설정폴더=${설정폴더 || '기본'}`); }
  else {
    /* ⛔ 자식 표식을 지운다 — 안 지우면 깨어난 창이 대화를 기록하지 않는다(8/21 유령 사고) */
    const env = { ...process.env, CLAUDE_SEAT: '2' };
    delete env.CLAUDE_CODE_CHILD_SESSION;
    delete env.CLAUDE_CODE_ENTRYPOINT;
    if (설정폴더) env.CLAUDE_CONFIG_DIR = 설정폴더.replace(/\//g, '\\');
    execFile('claude', ['-p', '--resume', id2, 말, '<', 'NUL'],
      { env, cwd: 'C:/Users/USER/Desktop', shell: true, windowsHide: true }, () => {});
    찍기(`2번을 깨웠다 (설정폴더=${설정폴더 || '기본'})`);
  }
}

/* ── 표를 올린다. ⛔ 깨운 뒤에 올린다 — 먼저 올리면 못 깨웠을 때 영영 묻힌다 ── */
if (!마른실행) writeFileSync(표, String(줄들.length), 'utf8');
