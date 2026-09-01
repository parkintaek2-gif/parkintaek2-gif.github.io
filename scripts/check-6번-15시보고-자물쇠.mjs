#!/usr/bin/env node
/**
 * check-6번-15시보고-자물쇠.mjs — **15시 업무보고가 실제로 15시대에 나갔는가.**
 *
 * ── 왜 (2026-09-01, 사장님 전체공지) ──────────────────────────────
 * 「매일 15시에 업무보고를 준비해 총괄에 넘겨야 한다. 이것도 자물쇠를 만들던지 해라.」
 * 5번(총괄대행): 「매뉴얼에 «15시에 낸다»고 적어 두는 것은 자물쇠가 아니다.
 *   무엇이 «잡아» 주는가를 적어라.」
 *
 * 이 자는 **크론이 도는지**가 아니라 **실제로 나갔는지**를 git 커밋 시각으로 잰다.
 * 크론(`5 * * * *`)이 매시 보고를 올리는데, 그 시각별 산출 «중 15시분»이 실제로
 * docs/세션간-메모.md 에 커밋됐는지 `git log`로 확인한다 — 크론이 있다는 말만으로
 * 통과시키지 않는다(강령④, 6번-업무매뉴얼: 검사로 둔다).
 *
 * ── 판정 ──────────────────────────────────────────────────────
 *   오늘 15:05 이전         ⏳ 기다리는 중 (빨간불 아님 — 「기다림」과 「깨진 것」을 가른다)
 *   그 뒤 커밋이 있다        ✅ 초록 — 커밋 시각(git log, 짐작 아님)을 그대로 보인다
 *   그 뒤 커밋이 없다        🔴 — 15시 보고가 «안 나갔다»
 *
 * 쓰는 법  node scripts/check-6번-15시보고-자물쇠.mjs
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
/** ⚠ execSync(문자열)은 Windows 에서 cmd.exe 를 거쳐 `|`·특수문자를 셸이 먼저 삼킨다.
 *  execFileSync(배열)로 셸을 아예 안 거치게 한다 — git log -S 값에 「·」·공백·`[]`가 있어도 안전하다. */
const git = (args) => { try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };

/** 오늘(KST) YYYY-MM-DD */
export function 오늘KST(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** 지금(KST)이 15:05 를 지났나 */
export function 마감지났나(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const hh = kst.getUTCHours(), mm = kst.getUTCMinutes();
  return hh > 15 || (hh === 15 && mm >= 5);
}

/**
 * 오늘 「[업무보고] 6번 SeoulMarkets · <오늘> (15시)」 줄을 담은 커밋을 찾는다.
 * ⛔ grep 으로 「있다/없다」만 보지 않는다 — 그 줄을 «담아 간 커밋»의 시각을 잰다(5번식).
 */
export function 십오시보고커밋(오늘 = 오늘KST()) {
  const 표식 = `[업무보고] 6번 SeoulMarkets · ${오늘} (15시)`;
  const 로그 = git(['log', `--since=${오늘} 00:00 +0900`, `-S${표식}`, '--format=%ad::%h', '--date=iso-local', '--', 'docs/세션간-메모.md']);
  if (로그 == null) return { 못잼: 'git 이력을 못 읽었다' };
  const 줄 = 로그.split('\n').filter(Boolean);
  if (!줄.length) return { 있음: false };
  const [ad, h] = 줄[줄.length - 1].split('::'); // -S 는 오래된순 → 마지막이 실제로 그 줄을 넣은 첫 커밋
  return { 있음: true, 시각: ad, 커밋: h };
}

function main() {
  if (process.argv.includes('--자가시험')) {
    let 통과 = 0, 실패 = 0;
    const 검 = (m, ok) => { if (ok) 통과++; else { 실패++; console.log('  ❌', m); } };
    검('15:00 은 안 지났다', 마감지났나(new Date('2026-09-01T05:59:00Z')) === false); // 14:59 KST
    검('15:05 은 지났다', 마감지났나(new Date('2026-09-01T06:05:00Z')) === true); // 15:05 KST
    검('15:04 은 안 지났다', 마감지났나(new Date('2026-09-01T06:04:00Z')) === false); // 15:04 KST
    검('16:00 은 지났다', 마감지났나(new Date('2026-09-01T07:00:00Z')) === true);
    검('날짜를 KST 로 뽑는다(자정 넘김 확인)', 오늘KST(new Date('2026-09-01T15:30:00Z')) === '2026-09-02');
    console.log(실패 === 0 ? `✅ 자가시험 — 통과 ${통과} · 실패 0` : `❌ 자가시험 — 통과 ${통과} · 실패 ${실패}`);
    process.exit(실패 === 0 ? 0 : 1);
  }

  const 오늘 = 오늘KST();
  console.log(`■ 6번 15시 업무보고 자물쇠 · 오늘 ${오늘}\n`);

  const r = 십오시보고커밋(오늘);
  if (r.못잼) { console.log(`⬜ 못 쟀다 — ${r.못잼}. 「통과」로 안 적는다.`); process.exit(0); }

  if (r.있음) {
    console.log(`✅ 초록 — 오늘 15시 보고 커밋 확인: ${r.커밋} (${r.시각})`);
    process.exit(0);
  }

  if (!마감지났나()) {
    console.log('⏳ 기다리는 중 — 아직 15:05 전이다. 아직 안 나온 것과 늦은 것을 가른다(빨간불 아님).');
    process.exit(0);
  }

  console.log('🔴 15시 보고가 안 나갔다 — 매시 :05 크론이 죽었거나 세션이 비어 있었을 수 있다. 지금 만들어 올린다.');
  process.exitCode = 1;
}

main();
