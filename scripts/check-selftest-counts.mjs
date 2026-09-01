#!/usr/bin/env node
/**
 * check-selftest-counts.mjs — **자가시험 «수»가 손으로 적혀 있나.**
 *
 * ── 🔴 왜 (2026-09-01) ───────────────────────────────────────
 * 오늘 하루에 «같은 결함»을 세 자에서 잡았다.
 * ```
 * build-kcw-asked.mjs   검사 23개인데 화면은 「21 통과」
 * check-2h.mjs          검사 24개인데 화면은 「19 통과」  (오늘 다섯을 더했는데 안 움직였다)
 * ```
 * ⛔ 수를 손으로 적으면 **검사가 조용히 빠져도 수가 안 움직인다.**
 *   자가시험은 「내가 나를 못 믿을 때 기대는 것」인데, 그 수 자체가 거짓이면
 *   ①검사를 지워도 모르고 ②더해도 모른다. 자를 재는 자가 없는 셈이다.
 *
 * ⭐ 우리 규칙 — **하나를 고치면 그 결함에 «이름»을 붙이고 그 이름으로 저장소를 훑는다.**
 *   이 자가 그 훑는 일을 한다. 세 곳을 손으로 고치고 끝내면 나머지가 그대로 남는다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ 고치지 «않는다» — 세어서 보여 준다. 자동으로 고치면 뜻이 다른 곳까지 건드린다.
 * ⛔ 「검사 개수」를 셀 때 주석 안의 `검(` 을 세지 않는다.
 * ⚠ 자를 «돌려 보지» 않고 글자만 센다. 그러니 「이것은 어림」이라고 적는다 —
 *   조건문 안에 든 검사는 실제로 안 돌 수도 있다.
 *
 * 쓰는 법
 *   node scripts/check-selftest-counts.mjs --자가시험
 *   node scripts/check-selftest-counts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 화면에 손으로 박힌 수를 찾는다. 없으면 null */
export function 박힌수(글) {
  const s = String(글 ?? '');
  if (!s) return null;
  /* `자가시험 21 통과` · `자가시험 통과 (13)` 두 꼴을 다 본다 */
  const a = s.match(/자가시험\s+(\d+)\s*통과/);
  if (a) return Number(a[1]);
  const b = s.match(/자가시험\s*통과\s*\((\d+)\)/);
  if (b) return Number(b[1]);
  return null;
}

/** 「수를 재서 적는가」 — 템플릿 안에 변수가 들어 있으면 참 */
export function 재서적나(글) {
  const s = String(글 ?? '');
  if (!s) return false;
  return /자가시험[^`'"\n]*\$\{[^}]+\}/.test(s) || /통과\s*\(\$\{[^}]+\}\)/.test(s);
}

/**
 * 실제 검사 개수를 어림한다.
 * ⛔ 주석 줄(`*`·`//` 로 시작)은 안 센다 — 설명 속의 `검(` 을 세면 수가 부풀어 오른다.
 */
export function 검사개수(글) {
  const s = String(글 ?? '');
  if (!s) return 0;
  let n = 0;
  for (const 줄 of s.split('\n')) {
    const t = 줄.trim();
    if (!t || t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) continue;
    n += (t.match(/(^|[^가-힣\w])검\(/g) ?? []).length;
  }
  return n;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  검('「자가시험 21 통과」를 잡는다', 박힌수("console.log('✅ x 자가시험 21 통과');") === 21);
  검('「자가시험 통과 (13)」도 잡는다', 박힌수("console.log('✅ x 자가시험 통과 (13)');") === 13);
  검('⛔ 재서 적는 것은 박힌 수가 아니다', 박힌수('console.log(`✅ 통과 (${센것})`)') === null);
  검('⛔ 상관없는 글은 null', 박힌수('const a = 1;') === null);
  검('⛔ 빈 값은 null', 박힌수('') === null && 박힌수(null) === null);

  검('재서 적는 것을 알아본다', 재서적나('console.log(`자가시험 ${센것} 통과`)') === true);
  검('괄호 꼴도 알아본다', 재서적나('console.log(`통과 (${n})`)') === true);
  검('⛔ 손으로 적은 것은 false', 재서적나("console.log('자가시험 21 통과')") === false);

  검('검사 개수를 센다', 검사개수('  검(1);\n  검(2);\n  검(3);') === 3);
  검('⛔ 주석 속 검( 은 안 센다', 검사개수(' * 검(x) 를 쓴다\n  검(1);') === 1);
  검('⛔ 슬래시 주석도 안 센다', 검사개수('  // 검(x)\n  검(1);') === 1);
  검('⛔ 빈 글은 0', 검사개수('') === 0 && 검사개수(null) === 0);

  return { 실패, 센것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const { 실패, 센것 } = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ check-selftest-counts 자가시험 ${센것} 통과`);
  process.exit(0);
}

if (내가실행됐다) {
  const 방 = path.join(뿌리, 'scripts');
  const 것들 = fs.readdirSync(방).filter((f) => f.endsWith('.mjs') && f !== 'check-selftest-counts.mjs');

  const 손으로 = []; const 재서 = []; const 어긋남 = [];
  for (const f of 것들) {
    let 글;
    try { 글 = fs.readFileSync(path.join(방, f), 'utf8'); } catch { continue; }
    if (!/자가시험/.test(글)) continue;
    const 수 = 박힌수(글);
    const 셈 = 검사개수(글);
    if (재서적나(글)) { 재서.push(f); continue; }
    if (수 === null) continue;
    손으로.push({ f, 적힌: 수, 센것: 셈 });
    if (셈 > 0 && 셈 !== 수) 어긋남.push({ f, 적힌: 수, 센것: 셈 });
  }

  console.log('■ 자가시험 수가 손으로 적혀 있나 — 자 ' + 것들.length + '개를 훑었다\n');
  console.log(`   ✅ 재서 적는 자 ${재서.length}개`);
  console.log(`   ⚠ 손으로 적은 자 ${손으로.length}개 — 검사가 빠져도 수가 안 움직인다`);

  if (어긋남.length) {
    console.log(`\n🔴 **적힌 수와 실제 검사 수가 어긋난 자 ${어긋남.length}개**`);
    어긋남.sort((a, b) => Math.abs(b.센것 - b.적힌) - Math.abs(a.센것 - a.적힌));
    for (const x of 어긋남) {
      console.log(`     적힘 ${String(x.적힌).padStart(3)} · 실제 ${String(x.센것).padStart(3)} · 차이 ${String(x.센것 - x.적힌).padStart(4)}   ${x.f}`);
    }
  } else console.log('\n   ✅ 어긋난 것 0개');

  console.log('\n⚠ **이것은 어림이다.** 자를 돌려 보지 않고 글자만 셌다 —');
  console.log('   조건문 안에 든 검사는 실제로 안 돌 수도 있다. 그래서 「틀렸다」가 아니라 「어긋났다」로 적는다.');
  console.log('⛔ 이 자는 고치지 않는다. 고칠 때는 그 자를 열어 «왜» 어긋났는지 보고 고친다.');
  console.log('\n⭐ 고치는 꼴 —  let 센것 = 0;  const 검 = (이름, 참) => { 센것 += 1; … };');
  console.log('   그리고 통과 문구를 `자가시험 ${센것} 통과` 로 바꾼다.');
}
