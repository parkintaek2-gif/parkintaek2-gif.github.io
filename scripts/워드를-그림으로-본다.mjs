#!/usr/bin/env node
/**
 * 워드를-그림으로-본다.mjs — **보낼 워드 파일을 쪽마다 그림으로 뽑는다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 사장님 지침(2026-10-01) — 「**보낼 파일 그 자체를 열어 전부 본다**」.
 * PPT 는 `슬라이드를-그림으로-본다.mjs` 로 뽑아 보고 있었는데 **워드는 자가 없었다.**
 * 그래서 교재는 「몇 쪽이고 글자가 몇 자다」만 세고 보냈다 — 그것은 본 것이 아니다.
 *
 * ⛔ 이 PC 에는 LibreOffice 도 pdftoppm 도 없다. 막혔다고 멈추지 않는다 —
 *   ① Word 로 PDF 를 내고 ② 저장소가 이미 가진 pdfjs-dist + @napi-rs/canvas 로 쪽을 그린다.
 * ⛔ 이 자는 흠을 «판정하지 않는다». 사람이 보라고 뽑아 줄 뿐이다.
 *   뽑은 뒤 `장들을-바둑판으로-붙인다.mjs` 로 붙이면 100쪽도 한눈에 들어온다.
 *
 * 쓰는 법
 *   node scripts/워드를-그림으로-본다.mjs <파일.docx|파일.pdf> <낼폴더> [첫쪽] [끝쪽]
 *   node scripts/워드를-그림으로-본다.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const 기본배율 = 1.6;          /* 글자가 읽힐 만큼 — 더 키우면 파일만 커진다 */

/** 뽑을 쪽을 고른다. ⛔ 범위를 벗어나면 잘라 맞춘다. 0 이나 거꾸로면 전부 */
export function 뽑을쪽들(전체, 첫 = null, 끝 = null) {
  const n = Math.max(0, Number(전체) || 0);
  if (!n) return [];
  let a = Number(첫) || 1;
  let b = Number(끝) || n;
  if (a > b) [a, b] = [b, a];
  a = Math.max(1, Math.min(n, a));
  b = Math.max(1, Math.min(n, b));
  const 것 = [];
  for (let i = a; i <= b; i += 1) 것.push(i);
  return 것;
}

/** 쪽 번호를 파일 이름으로. ⭐ 자릿수를 맞춰야 번호 차례로 선다 */
export function 쪽이름(쪽, 전체) {
  const 자리 = String(Math.max(1, Number(전체) || 1)).length;
  return `page-${String(쪽).padStart(Math.max(3, 자리), '0')}.png`;
}

/** .docx 면 Word 로 PDF 를 낸다. ⛔ Word 가 없으면 그대로 멈춘다 — 지어내지 않는다 */
export function 피디에프로(길, 낼곳) {
  if (/\.pdf$/i.test(길)) return path.resolve(길);
  const 낸길 = path.resolve(낼곳);
  const 본길 = path.resolve(길);
  const 글 = [
    '$w = New-Object -ComObject Word.Application',
    '$w.Visible = $false',
    'try {',
    `  $d = $w.Documents.Open('${본길.replace(/'/g, "''")}', $false, $true)`,
    `  $d.ExportAsFixedFormat('${낸길.replace(/'/g, "''")}', 17)`,
    '  $d.Close(0)',
    '} finally { $w.Quit() }',
  ].join('; ');
  execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 글], { stdio: 'pipe' });
  return 낸길;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  본다('전부 고른다', 뽑을쪽들(5).join(',') === '1,2,3,4,5');
  본다('범위를 고른다', 뽑을쪽들(10, 3, 5).join(',') === '3,4,5');
  본다('⛔ 범위를 넘으면 잘라 맞춘다', 뽑을쪽들(4, 2, 99).join(',') === '2,3,4');
  본다('⛔ 거꾸로 줘도 바로 세운다', 뽑을쪽들(10, 5, 3).join(',') === '3,4,5');
  본다('⛔ 0쪽이면 빈 목록', 뽑을쪽들(0).length === 0);
  본다('⛔ 엉뚱한 값에도 안 터진다', 뽑을쪽들(null).length === 0 && 뽑을쪽들('가').length === 0);

  본다('자릿수를 맞춘다', 쪽이름(7, 119) === 'page-007.png');
  본다('세 자리 아래로는 안 줄인다', 쪽이름(7, 9) === 'page-007.png');
  본다('네 자리도 받는다', 쪽이름(7, 1200) === 'page-0007.png');

  본다('pdf 는 그대로 쓴다', /\.pdf$/i.test(피디에프로('가.pdf', '나.pdf')));

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 워드를 그림으로 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const [본길, 낼방, 첫0, 끝0] = process.argv.slice(2);
  if (!본길 || !낼방) {
    console.log('⛔ 쓰는 법: node scripts/워드를-그림으로-본다.mjs <파일.docx|.pdf> <낼폴더> [첫쪽] [끝쪽]');
    process.exit(1);
  }
  if (!fs.existsSync(본길)) { console.log(`⛔ 파일이 없다 — ${본길}`); process.exit(1); }
  fs.mkdirSync(낼방, { recursive: true });

  const 피디에프 = 피디에프로(본길, path.join(낼방, '_본다.pdf'));
  const { createCanvas } = await import('@napi-rs/canvas');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const 문서 = await pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(피디에프)), useSystemFonts: true,
  }).promise;

  const 쪽들 = 뽑을쪽들(문서.numPages, 첫0, 끝0);
  console.log(`■ ${path.basename(본길)} — ${문서.numPages}쪽 가운데 ${쪽들.length}쪽을 뽑는다`);
  for (const i of 쪽들) {
    const 쪽 = await 문서.getPage(i);
    const 보기 = 쪽.getViewport({ scale: 기본배율 });
    const 판 = createCanvas(Math.ceil(보기.width), Math.ceil(보기.height));
    const 붓 = 판.getContext('2d');
    붓.fillStyle = '#ffffff';
    붓.fillRect(0, 0, 판.width, 판.height);
    await 쪽.render({ canvasContext: 붓, viewport: 보기 }).promise;
    fs.writeFileSync(path.join(낼방, 쪽이름(i, 문서.numPages)), 판.toBuffer('image/png'));
  }
  console.log(`   → ${낼방}`);
  console.log('\n⚠ 뽑은 것으로 끝이 아니다 — **열어서 본다.** 수는 눈을 대신하지 못한다.');
  console.log('   쪽이 많으면 장들을-바둑판으로-붙인다.mjs 로 붙여서 한눈에 본다.');
}
