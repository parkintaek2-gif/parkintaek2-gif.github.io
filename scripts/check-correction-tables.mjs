#!/usr/bin/env node
/**
 * check-correction-tables.mjs — **「고친 내역」 표가 참말인가.**
 *
 * ── 왜 만들었나 (2026-09-03) ────────────────────────────────
 * 자료를 다시 지어 기사 열일곱 편의 수를 고쳤고, 편마다 「What changed on …」 표를 붙였다.
 * 그 표는 **손님에게 우리가 무엇을 틀렸는지 알리는 자리**다. 그런데 그 표를 내가
 * «기억으로» 적었다. 기억으로 적은 정정표는 정정을 한 번 더 하는 일이다.
 *
 * 🔴 실제로 처음 판에서 일곱 줄이 어긋났다 —
 * ```
 *   전·후가 같은 줄 셋        「40.5% → 40.5%」 처럼 안 움직인 것을 움직인 것처럼 뒀다
 *   diff 에 없는 「전」값 하나  내가 지어낸 수였다
 * ```
 * ⛔ 우리 강령이 「못 잰 것은 못 쟀다고 적는다」인데, 정정표에 안 잰 수를 적으면
 *   그 강령을 정반대로 어긴다. 그래서 이 자를 둔다.
 *
 * ── 무엇을 잰다 ─────────────────────────────────────────────
 * 「What changed on <날짜>」 절의 `| 이름 | 전 | 후 |` 줄마다 —
 * ```
 *   ① 「전」값이 그 날 이전 판에 «실제로 있었나»   git diff 의 뺀 줄에서 찾는다
 *   ② 「후」값이 지금 본문에 «있나»                정정 절 밖의 본문에서 찾는다
 *   ③ 전·후가 같으면 라벨에 (unchanged) 가 있나   안 움직인 것을 움직인 것처럼 안 쓴다
 * ```
 * ⚠ 「전」값은 지운 값이라 지금 본문에 없는 것이 «정상»이다. 그래서 본문이 아니라 diff 를 본다.
 * ⛔ 이 자는 고치지 않는다. 어긋난 줄만 낸다.
 *
 * 쓰는 법
 *   node scripts/check-correction-tables.mjs --자가시험
 *   node scripts/check-correction-tables.mjs [--기준 <커밋>]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사방 = path.join(뿌리, 'content/kculturewire');

/**
 * 칸에서 수만 뽑는다.
 * ⚠ 천 단위 쉼표는 «수의 일부»(39,139)지만 목록 쉼표는 아니다(「58, 34.1%」).
 *   그래서 쉼표 뒤에 숫자 셋이 오는 것만 수의 일부로 받는다.
 *   🔴 이 한 줄이 없어 첫 판이 「58,」을 찾다가 세 줄을 거짓으로 울렸다.
 */
export function 수뽑기(칸) {
  return (String(칸 ?? '').match(/-?\d+(?:,\d{3})*(?:\.\d+)?/g) ?? []);
}

/** 「| 이름 | 전 | 후 |」 줄인가 — 머리줄과 가름줄은 뺀다 */
export function 표줄인가(줄) {
  const s = String(줄 ?? '').trim();
  if (!s.startsWith('|')) return false;
  if (/^\|\s*-{2,}/.test(s)) return false;
  if (/\|\s*Was\s*\|\s*Now\s*\|/i.test(s)) return false;
  return s.split('|').length >= 5;
}

/** 안 움직였다고 «밝힌» 줄인가 */
export function 안움직였다고밝혔나(이름) {
  return /unchanged|no change|did not move/i.test(String(이름 ?? ''));
}

/** 한 줄을 판정한다. 옛글·본문을 넣으면 흠을 배열로 낸다 */
export function 줄판정(줄, 옛글, 본문) {
  const 칸 = String(줄).split('|').map((x) => x.trim());
  const [, 이름, 전, 후] = 칸;
  const 흠 = [];
  if (!이름 || !전 || !후) return 흠;
  if (전 === 후 && !안움직였다고밝혔나(이름)) 흠.push('전·후가 같은데 라벨에 unchanged 가 없다');
  for (const x of 수뽑기(전)) if (!String(옛글).includes(x)) 흠.push(`전값 ${x} 가 그 날 이전 판에 없다`);
  for (const x of 수뽑기(후)) if (!String(본문).includes(x)) 흠.push(`후값 ${x} 가 지금 본문에 없다`);
  return 흠;
}

const 내가 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, ok) => { if (ok) 통 += 1; else 실.push(이름); };

  검('천 단위 쉼표는 수의 일부', JSON.stringify(수뽑기('39,139')) === JSON.stringify(['39,139']));
  검('⛔ 목록 쉼표는 수에 안 붙는다', JSON.stringify(수뽑기('58, 34.1%')) === JSON.stringify(['58', '34.1']));
  검('소수를 읽는다', JSON.stringify(수뽑기('2.1 points')) === JSON.stringify(['2.1']));
  검('수가 없으면 빈 배열', 수뽑기('none').length === 0);
  검('⛔ 빈 것도 안 터진다', 수뽑기(undefined).length === 0);

  검('표 줄을 집는다', 표줄인가('| Korean runs | 7,414 | 7,288 |'));
  검('머리줄은 뺀다', !표줄인가('| | Was | Now |'));
  검('가름줄은 뺀다', !표줄인가('|---|---|---|'));
  검('표가 아닌 줄은 뺀다', !표줄인가('그냥 문장'));

  검('전값이 옛글에 있고 후값이 본문에 있으면 흠 없다',
    줄판정('| a | 7,414 | 7,288 |', '-| a | 7,414 |', '지금 본문에 7,288 이 있다').length === 0);
  검('전값이 옛글에 없으면 잡는다',
    줄판정('| a | 9,999 | 7,288 |', '-| a | 7,414 |', '7,288').some((x) => x.includes('9,999')));
  검('후값이 본문에 없으면 잡는다',
    줄판정('| a | 7,414 | 7,288 |', '-| a | 7,414 |', '딴 소리').some((x) => x.includes('7,288')));
  검('전·후가 같으면 잡는다',
    줄판정('| a | 40.5% | 40.5% |', '-40.5%', '40.5%').some((x) => x.includes('unchanged')));
  검('안 움직였다고 밝히면 통과',
    줄판정('| a (unchanged) | 40.5% | 40.5% |', '-40.5%', '40.5%').length === 0);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ 고친내역 표 검사 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가) {
  const 기준 = (() => {
    const i = process.argv.indexOf('--기준');
    return i > 0 ? process.argv[i + 1] : 'cb270de6';
  })();
  let 흠 = 0; let 본줄 = 0; let 본편 = 0;
  for (const f of fs.readdirSync(기사방).filter((x) => x.endsWith('.md'))) {
    const p = path.join(기사방, f);
    const 글 = fs.readFileSync(p, 'utf8');
    const i = 글.search(/^## What changed on /m);
    if (i < 0) continue;
    const 표줄들 = 글.slice(i).split('\n').filter(표줄인가);
    if (!표줄들.length) continue;
    본편 += 1;
    const rel = path.relative(뿌리, p).split(path.sep).join('/');
    let 옛글 = '';
    try {
      const d = execFileSync('git', ['diff', '--unified=0', 기준, '--', rel], { encoding: 'utf8', cwd: 뿌리 });
      옛글 = d.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).join('\n');
    } catch { 옛글 = ''; }
    if (!옛글) { console.log(`   ⬜ ${f} — 그 날 이전 판을 못 읽었다(기준 ${기준}). 이 편은 «못 쟀다»`); continue; }
    const 본문 = 글.slice(0, i);
    for (const l of 표줄들) {
      본줄 += 1;
      for (const x of 줄판정(l, 옛글, 본문)) { 흠 += 1; console.log(`   🔴 ${f} — ${x}\n      ${l.trim()}`); }
    }
  }
  console.log(`\n고친내역 표 — 기사 ${본편}편 · 줄 ${본줄}개를 봤다 (기준 ${기준})`);
  console.log(흠 ? `⛔ 어긋난 것 ${흠}개 — 정정표를 기억으로 적지 않는다` : '✅ 정정표의 전·후가 다 확인된다');
  process.exit(흠 ? 1 : 0);
}
