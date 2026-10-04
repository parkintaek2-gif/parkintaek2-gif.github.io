#!/usr/bin/env node
/**
 * 슬라이드를-그림으로-본다.mjs — **PPT 한 장을 그림으로 뽑아 눈으로 본다.**
 *
 * ── 왜 만들었나 (2026-10-04 09:0x · 5번) ──────────────────────────────
 *   「검사가 통과해도 한 번은 실물을 본다」를 지키려는데 **길이 없었다.**
 *   강의 슬라이드를 고치고 수로는 재 봤지만(명반 31장 → 39장), 그 장이 실제로
 *   어떻게 보이는지는 못 봤다. LibreOffice 가 안 깔려 있어 pptx 를 그림으로 못 바꿨다.
 *   ⇒ 이 PC 에 PowerPoint 가 있다. 그것으로 뽑는다.
 *
 *   ⚠ 오늘만 다섯 번 「수는 초록인데 실물이 달랐다」를 겪었다 —
 *     title 만 고치고 H1 을 잊은 것 · 캐시 때문에 묵은 지면을 찍은 것 ·
 *     어제 날짜가 박힌 검사 · 낱말이 갈려 13일 멈춘 것이 초록이던 것.
 *   **수는 눈을 대신하지 못한다.**
 *
 * ── ⛔ 사장님 PowerPoint 창을 건드리지 않는다 ────────────────────────
 *   새 Application 을 띄우고, 읽기 전용·창 없이 열고, **내가 연 것만** 닫는다.
 *   크롬 9222 에서 `b.close()` 가 사장님 창을 닫은 것과 같은 자리다.
 *
 * ── ⚠ 왜 짝이 되는 .ps1 은 ASCII 인가 ────────────────────────────────
 *   `scripts/export-slides.ps1` 에는 한글이 한 글자도 없다. **일부러다.**
 *   Windows PowerShell 5.1 은 BOM 없는 파일을 시스템 ANSI 로 읽는다. 한글 주석을
 *   넣었더니 글자가 깨지면서 **스크립트가 파싱조차 안 됐다** — 처음에 그렇게 짰다가
 *   `slide-.png` 라는 이름 없는 파일이 나오고서야 알았다.
 *   ⇒ 내력은 여기(.mjs)에 한글로 적고, .ps1 은 ASCII 로 짧게 둔다.
 *   ⛔ .ps1 에 한글을 다시 넣지 않는다. 넣으려면 BOM 을 붙여야 하는데, 그러면
 *     다른 도구가 그 파일을 읽을 때 또 걸린다.
 *
 * 쓰는 법
 *   node scripts/슬라이드를-그림으로-본다.mjs <pptx> <낼폴더> [첫장] [끝장]
 *   node scripts/슬라이드를-그림으로-본다.mjs --자가시험
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 뽑는자 = path.join(뿌리, 'scripts', 'export-slides.ps1');

/** 뽑은 결과 줄을 읽는다 — `TOTAL 171 EXPORT 141..141` */
export function 결과읽기(글) {
  const s = String(글 ?? '');
  const m = /TOTAL\s+(\d+)\s+EXPORT\s+(\d+)\.\.(\d+)/.exec(s);
  const 됐나 = /\bOK\b/.test(s);
  const 흠 = /\bERR\s+(.*)/.exec(s);
  return {
    됐나,
    모두: m ? Number(m[1]) : null,
    첫장: m ? Number(m[2]) : null,
    끝장: m ? Number(m[3]) : null,
    흠: 흠 ? 흠[1].trim() : null,
  };
}

export function 뽑기(pptx, 낼곳, 첫장 = 0, 끝장 = 0) {
  if (!fs.existsSync(pptx)) return { 됐나: false, 흠: `파일이 없다 — ${pptx}` };
  fs.mkdirSync(낼곳, { recursive: true });
  let 글 = '';
  try {
    글 = execFileSync('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 뽑는자,
      '-Pptx', path.resolve(pptx), '-Out', path.resolve(낼곳),
      '-From', String(첫장), '-To', String(끝장),
    ], { encoding: 'utf8', timeout: 180000 });
  } catch (e) {
    글 = String(e.stdout ?? '') + String(e.stderr ?? '');
  }
  const 것 = 결과읽기(글);
  /* ⛔ 「됐다」를 말 한 줄로 믿지 않는다 — 파일이 실제로 생겼는지 센다.
     처음에 이름이 빈 `slide-.png` 하나가 나왔는데 스크립트는 끝났다고 했다. */
  const 생긴것 = fs.existsSync(낼곳)
    ? fs.readdirSync(낼곳).filter((n) => /^slide-\d{3}\.png$/.test(n)).sort()
    : [];
  return { ...것, 생긴것, 날것: 글 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참, 덧 = '') => 결과.push({ 이름, 참: !!참, 덧 });

  const a = 결과읽기('TOTAL 171 EXPORT 141..141\nOK C:\\x');
  본다('모두 몇 장인지 읽는다', a.모두 === 171);
  본다('어디부터 어디까지인지 읽는다', a.첫장 === 141 && a.끝장 === 141);
  본다('됐다고 읽는다', a.됐나 === true && a.흠 === null);

  const b = 결과읽기('ERR no such file: x.pptx');
  본다('⛔ 흠을 흠으로 읽는다', b.됐나 === false && /no such file/.test(b.흠));
  본다('⛔ 못 읽으면 null — 0 으로 적지 않는다', b.모두 === null);

  const c = 결과읽기('');
  본다('⛔ 빈 글도 안 죽는다', c.됐나 === false && c.모두 === null);

  본다('⛔ 뽑는 자가 ASCII 다 — 5.1 이 BOM 없는 한글을 못 읽는다',
    !/[가-힣]/.test(fs.readFileSync(뽑는자, 'utf8')));
  본다('뽑는 자가 제 창만 닫는다', /\$pres\.Close\(\)/.test(fs.readFileSync(뽑는자, 'utf8')));
  본다('⛔ 파일이 없으면 뽑지 않는다', 뽑기('__없는것__.pptx', '.').됐나 === false);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 슬라이드를 그림으로 본다 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}${r.덧 ? `  (${r.덧})` : ''}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const [pptx, 낼곳, 첫장, 끝장] = process.argv.slice(2);
  if (!pptx || !낼곳) {
    console.log('⛔ 쓰는 법: node scripts/슬라이드를-그림으로-본다.mjs <pptx> <낼폴더> [첫장] [끝장]');
    process.exit(1);
  }
  const 것 = 뽑기(pptx, 낼곳, Number(첫장) || 0, Number(끝장) || 0);
  if (!것.됐나 || !것.생긴것.length) {
    console.log(`⛔ 못 뽑았다 — ${것.흠 ?? '까닭을 모른다'}`);
    console.log(것.날것.split('\n').slice(0, 6).join('\n'));
    process.exit(1);
  }
  console.log(`✅ 슬라이드 ${것.모두}장 가운데 ${것.첫장}~${것.끝장} — 그림 ${것.생긴것.length}장`);
  for (const n of 것.생긴것.slice(0, 10)) console.log(`   ${path.join(낼곳, n)}`);
  console.log('');
  console.log('⚠ 뽑은 것으로 끝이 아니다 — **열어서 본다.** 수는 눈을 대신하지 못한다.');
}
