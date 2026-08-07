/**
 * PDF 에서 글자를 뽑는다. **감수는 눈으로 보는 것**이라, 그 앞에 글로 훑기 위한 도구다.
 *
 * 왜 — 이 PC 에는 pdftotext(poppler)가 없고 Read 도구도 PDF 를 못 편다.
 *   1번이 낸 감수용 리포트 33종을 2번이 봐야 하는데, 33종을 다 눈으로만 보면 하루가 간다.
 *   ⚠ **글로 훑는 것은 눈으로 보는 것을 대신하지 못한다.** 잘림·공백·가운데 맞춤은 글에 안 나온다.
 *   글로 먼저 걸러 내고, 걸린 곳만 눈으로 본다.
 *
 * ⛔ **이 도구가 만드는 헛것 하나를 적어 둔다 — 글자가 두 번 나온다.**
 *   테두리를 두른 글자(`stroke` + `paint-order`)는 뽑을 때 **같은 말이 두 번** 찍힌다.
 *   실제 화면에는 한 번만 보인다. 2026-08-07 에 내가 이걸 「라벨이 겹쳐 찍힌다」는
 *   디자인 결함으로 올릴 뻔했다. **글에서 겹쳐 보이면 눈으로 먼저 확인한다.**
 *   (예: `조후용신 丙(병)조후용신 丙(병) · ▲ 강해질수록 좋음` ← 화면에는 한 번뿐이다)
 *
 * 쓰는 법
 *   node scripts/read-pdf.mjs "<파일.pdf>"            전체를 쪽마다 뽑는다
 *   node scripts/read-pdf.mjs "<파일.pdf>" 7          그 쪽만
 *   node scripts/read-pdf.mjs "<파일.pdf>" 5 9        그 사이
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

const 파일 = process.argv[2];
if (!파일) {
  console.error('쓰는 법: node scripts/read-pdf.mjs "<파일.pdf>" [시작쪽] [끝쪽]');
  process.exit(1);
}
const 시작 = Number(process.argv[3]) || 1;
const 끝 = Number(process.argv[4]) || Number(process.argv[3]) || 0;

const pdfjs = await import(
  pathToFileURL(path.join(뿌리, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs')).href
);

const 자료 = new Uint8Array(fs.readFileSync(파일));
const 문서 = await pdfjs.getDocument({ data: 자료, useSystemFonts: true }).promise;
const 마지막 = 끝 || 문서.numPages;

console.log(`${path.basename(파일)} — 모두 ${문서.numPages}쪽 · ${시작}~${마지막}쪽을 뽑는다\n`);

for (let n = 시작; n <= Math.min(마지막, 문서.numPages); n++) {
  const 쪽 = await 문서.getPage(n);
  const t = await 쪽.getTextContent();
  // 같은 줄에 있는 조각을 붙인다. y 가 비슷하면 한 줄로 본다
  const 줄 = new Map();
  for (const it of t.items) {
    if (!it.str) continue;
    const y = Math.round(it.transform[5]);
    const 키 = [...줄.keys()].find((k) => Math.abs(k - y) <= 3) ?? y;
    줄.set(키, (줄.get(키) ?? '') + it.str);
  }
  const 글 = [...줄.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, s]) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  console.log(`──────── ${n}쪽 (${글.length}줄) ────────`);
  console.log(글.join('\n'));
  console.log('');
}
