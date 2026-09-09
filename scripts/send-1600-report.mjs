#!/usr/bin/env node
/**
 * send-1600-report.mjs — **16시 업무보고를 «만들고·확인하고·저장하고·보내고·기록»한다.**
 *   한 동작이다. 중간에서 멈추면 그것이 실패다.
 *
 *   node scripts/send-1600-report.mjs <보고.md>          미리보기만 (안 보낸다)
 *   node sconly… --보낸다                                 실제로 보낸다
 *   node scripts/send-1600-report.mjs --자가시험
 *
 * ── 🔴🔴 왜 이 자가 «없었나» (2026-09-09 16:2x · 5번) ───────────────────────
 *
 * 자물쇠가 매일 16:05 에 이렇게 적어 왔다 —
 *   「지금 할 것 — 만들기·저장·발송·기록이 한 동작인 자를 부르십시오:
 *     `node scripts/send-1600-report.mjs <보고.md>`」
 *
 * **그 자가 없다.** git 이력에도 한 번도 없었다(`git log --all -- scripts/send-1600-report.mjs`
 * 가 빈 값이다). `collect-1600-report.mjs` 의 주석도 「send-1600-report.mjs 는 이미 만들어진
 * md 파일을 보내기만 하고」라고 «있는 것처럼» 적어 두었다. 둘 다 없는 자를 가리켰다.
 *
 * ⛔ **그래서 자물쇠 불이 아무도 끌 수 없는 불이었다.** 시키는 대로 하면 파일이 없다고 죽고,
 *   그러면 사람이 제 나름대로(나는 `send-mail.mjs` 로) 보내고, 자물쇠는 그걸 못 봐서
 *   「안 보냈다」고 또 적는다. 실제로 오늘 15:38 에 보냈는데 16:05 에 「안 보냈다」가 떴다.
 *
 * ⭐ **없는 자를 가리키는 안내문은 안내문이 아니라 결함이다.** 그래서 만든다.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────
 * 🔴 **PDF 를 열어서 쪽수를 확인한 뒤에만 보낸다.** 2026-09-05·06 에 이틀 연속
 *   «표지 한 장»짜리 PDF 가 사장님께 갔다. 크기·종료코드로 판정하지 않는다
 * 🔴 **원드라이브 «업무보고» 폴더에 저장한다.** 다른 폴더를 새로 만들지 않는다 —
 *   오늘 내가 `OneDrive/보고/` 를 새로 만들어 그리로 넣었다. 보고가 두 곳에 흩어진다
 * 🔴 **보낸 뒤에 표식을 남긴다.** 자물쇠가 읽을 자리가 없으면 불이 안 꺼진다
 * ⛔ `--보낸다` 없이는 안 보낸다. 미리보기에서 쪽수와 첫 줄을 보고 결정한다
 * ⛔ 「.md 를 사장님께」 보내지 않는다 — 표가 깨진다(사장님 2026-09-05)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 업무폴더 = 'C:/Users/User/OneDrive/업무보고';
export const 받는곳 = 'parkintaek@naver.com';
export const 표식방 = path.join(뿌리, 'archive/보고표식');

/** 오늘 날짜 (KST) — ⚠ 이 PC 가 이미 KST 다. toISOString 을 쓰지 않는다 */
export function 오늘날(이제 = new Date()) {
  const 두 = (n) => String(n).padStart(2, '0');
  return `${이제.getFullYear()}-${두(이제.getMonth() + 1)}-${두(이제.getDate())}`;
}

/** 낼 PDF 이름 — ⛔ 누가 낸 보고인지 이름에 박는다. 파일이 섞이면 못 찾는다 */
export function 낼이름(유닛, 날) {
  return `${유닛}_총괄_업무보고_${String(날).replace(/-/g, '')}_16시.pdf`;
}

/** 표식 자리 — 자물쇠가 이 파일을 보고 불을 끈다 */
export function 표식길(날, 방 = 표식방) {
  return path.join(방, `1600-${날}.json`);
}

/**
 * 보내도 되나 — ⛔ 쪽수를 «확인한 뒤에만» 참이다.
 *
 * 🔴 2026-09-05·06 에 표지 한 장짜리가 이틀 연속 갔다. 그래서 쪽수 문턱을 둔다.
 *   ⚠ 문턱을 2쪽으로 둔 까닭 — 한 장짜리가 그때의 사고였다. 「많으면 좋다」가 아니라
 *     「한 장은 사고였다」는 사실에서 온 수다.
 */
export function 보낼만한가({ 쪽수, 글자수, 첨부있나 }) {
  const 흠 = [];
  if (!첨부있나) 흠.push('PDF 가 없다');
  if (!Number.isFinite(쪽수)) 흠.push('쪽수를 못 쟀다');
  else if (쪽수 < 2) 흠.push(`쪽수가 ${쪽수}쪽이다 — 표지 한 장짜리가 두 번 갔다`);
  if (!Number.isFinite(글자수) || 글자수 < 400) 흠.push(`본문 글자가 ${글자수}자다 — 너무 적다`);
  return { 된다: 흠.length === 0, 흠 };
}

function 돌린다(자, 인자) {
  return execFileSync(process.execPath, [path.join(뿌리, 'scripts', 자), ...인자],
    { cwd: 뿌리, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
export function 자가시험() {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('오늘날 — KST 를 그대로 쓴다', 오늘날(new Date(2026, 8, 9, 16, 20)) === '2026-09-09');
  검('오늘날 — 한 자리 달·날에 0 을 붙인다', 오늘날(new Date(2026, 0, 5)) === '2026-01-05');

  검('낼이름 — 유닛과 날짜가 이름에 박힌다', 낼이름('5번', '2026-09-09') === '5번_총괄_업무보고_20260909_16시.pdf');
  검('⛔ 낼이름 — .md 가 아니다', !낼이름('5번', '2026-09-09').endsWith('.md'));

  검('표식길 — 날짜별로 하나', 표식길('2026-09-09', '방').endsWith(path.join('방', '1600-2026-09-09.json')));

  검('🔴 보낼만한가 — 한 장짜리는 막는다', (() => {
    const r = 보낼만한가({ 쪽수: 1, 글자수: 5000, 첨부있나: true });
    return r.된다 === false && r.흠.some((x) => /한 장/.test(x));
  })());
  검('보낼만한가 — 두 쪽 넘고 글자 있으면 된다', 보낼만한가({ 쪽수: 4, 글자수: 5000, 첨부있나: true }).된다 === true);
  검('⛔ 보낼만한가 — PDF 가 없으면 막는다', 보낼만한가({ 쪽수: 4, 글자수: 5000, 첨부있나: false }).된다 === false);
  검('⛔ 보낼만한가 — 쪽수를 못 쟀으면 막는다 (모르면 안 보낸다)',
    보낼만한가({ 쪽수: null, 글자수: 5000, 첨부있나: true }).된다 === false);
  검('⛔ 보낼만한가 — 본문이 너무 적으면 막는다', 보낼만한가({ 쪽수: 3, 글자수: 50, 첨부있나: true }).된다 === false);
  검('보낼만한가 — 흠을 «여럿» 모아 낸다 (하나만 알려 주면 두 번 돈다)',
    보낼만한가({ 쪽수: 1, 글자수: 10, 첨부있나: false }).흠.length === 3);

  검('업무폴더가 원드라이브 «업무보고» 다', /OneDrive\/업무보고$/.test(업무폴더));
  검('⛔ 받는곳이 사장님 주소다', 받는곳 === 'parkintaek@naver.com');

  console.log(`16시 보고 발송 — 자가시험 ${통}/${통 + 실.length}`);
  실.forEach((x) => console.log(`   X ${x}`));
  return 실.length;
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (나) {
  const 흠 = 자가시험();
  if (process.argv.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

  const 인자 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const md = 인자[0];
  if (!md || !fs.existsSync(md)) {
    console.error('⛔ 쓰는 법: node scripts/send-1600-report.mjs <보고.md> [--보낸다]');
    console.error('   ⚠ 보고 md 는 손으로 씁니다. collect-1600-report.mjs 로 «모은 것»은');
    console.error('     옛 내용을 물어 온 적이 있으니 반드시 열어 보고 씁니다(2026-09-09 실측).');
    process.exit(1);
  }
  const 날 = 오늘날();
  const 유닛 = process.env.UNIT || '5번';
  fs.mkdirSync(업무폴더, { recursive: true });
  const pdf = path.join(업무폴더, 낼이름(유닛, 날));

  console.log(`■ 16시 업무보고 — ${날} · ${유닛}\n`);
  console.log('1) PDF 를 만든다');
  돌린다('md-to-pdf.mjs', [md, '--out', pdf, '--제목', `16시 업무보고 · ${날}`]);
  if (!fs.existsSync(pdf)) { console.error('⛔ PDF 가 안 만들어졌다 — 멈춘다'); process.exit(1); }

  console.log('2) 🔴 PDF 를 «열어서» 쪽수와 본문을 확인한다');
  let 뽑은 = '';
  try { 뽑은 = 돌린다('read-pdf.mjs', [pdf]); } catch (e) { 뽑은 = ''; }
  const m = 뽑은.match(/모두\s*(\d+)\s*쪽/);
  const 쪽수 = m ? Number(m[1]) : null;
  const 글자수 = 뽑은.replace(/─+/g, '').trim().length;
  console.log(`   쪽수 ${쪽수 ?? '못 쟀다'} · 뽑은 글자 ${글자수}자`);

  const 판정 = 보낼만한가({ 쪽수, 글자수, 첨부있나: fs.existsSync(pdf) });
  if (!판정.된다) {
    console.error(`\n⛔ 안 보낸다 — ${판정.흠.join(' · ')}`);
    console.error('   ⚠ 파일은 원드라이브에 있습니다. 고쳐서 다시 부르십시오.');
    process.exit(1);
  }
  console.log('   ✅ 보낼 만하다');

  if (!process.argv.includes('--보낸다')) {
    console.log(`\n⚠ 아직 «안 보냈다». 보내려면 --보낸다 를 붙인다.`);
    console.log(`   저장은 됐다 — ${pdf}`);
    process.exit(0);
  }

  console.log('\n3) 메일을 보낸다');
  const 글길 = path.join(뿌리, 'archive/보고표식', `mail-${날}.txt`);
  fs.mkdirSync(path.dirname(글길), { recursive: true });
  if (!fs.existsSync(글길)) {
    fs.writeFileSync(글길, `사장님,\n\n16시 업무보고입니다. 첨부 ${쪽수}쪽에 전문이 있습니다.\n\n${유닛}\n`, 'utf8');
  }
  const 결과 = 돌린다('send-mail.mjs', [
    `--받는곳=${받는곳}`,
    `--제목=[16시 업무보고] ${날} · ${유닛}`,
    `--글=${글길}`,
    `--첨부=${pdf}`,
    '--보낸다',
  ]);
  console.log(결과.split('\n').slice(-4).join('\n'));
  const 아이디 = (결과.match(/메시지 id ([0-9a-f]+)/) || [])[1] ?? null;

  console.log('4) 표식을 남긴다 — 자물쇠가 이것을 보고 불을 끈다');
  fs.mkdirSync(표식방, { recursive: true });
  fs.writeFileSync(표식길(날), `${JSON.stringify({
    날, 유닛, 보낸때: new Date().toLocaleString('ko-KR'),
    pdf, 쪽수, 메시지id: 아이디, 받는곳,
    '⚠': '이 파일이 있으면 그날 16시 보고가 «실제로 나갔다»는 뜻이다. 손으로 만들지 않는다',
  }, null, 1)}\n`, 'utf8');

  console.log(`\n✅ 다 끝났다 — 만들기·확인·저장·발송·기록`);
  console.log(`   PDF   ${pdf}`);
  console.log(`   표식  ${표식길(날)}`);
}
