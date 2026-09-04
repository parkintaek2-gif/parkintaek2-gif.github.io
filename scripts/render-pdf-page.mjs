/**
 * PDF 쪽을 PNG 로 그린다. **read-pdf.mjs 의 짝**이다.
 *
 * 왜 — read-pdf.mjs 는 글자만 뽑는다. 그런데 **인포그래픽형 PDF는 글자가 전부
 *   그림(벡터 패스)이라 뽑을 글자가 거의 없다** — 2026-09-04, 하나금융연구소
 *   보고서 43쪽 중 «☞ 화살표와 쪽번호뿐인» 쪽이 대부분이었다. 그런 PDF는
 *   «눈으로 보는 것 말고는 방법이 없다.» 이 PC 엔 pdftoppm(poppler)도 없어
 *   Read 도구가 PDF를 못 연다 — 그래서 pdfjs-dist + @napi-rs/canvas 로 직접 그린다.
 *
 * 쓰는 법
 *   node scripts/render-pdf-page.mjs "<파일.pdf>" <쪽> [<날_PNG_길>] [배율]
 *   예) node scripts/render-pdf-page.mjs report.pdf 9 out.png 2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

const 파일 = process.argv[2];
const 쪽번호 = Number(process.argv[3]);
if (!파일 || !쪽번호) {
  console.error('쓰는 법: node scripts/render-pdf-page.mjs "<파일.pdf>" <쪽번호> [날파일.png] [배율]');
  process.exit(1);
}
const 날길 = process.argv[4] ?? path.join(path.dirname(파일), `${path.basename(파일, '.pdf')}-p${쪽번호}.png`);
const 배율 = Number(process.argv[5]) || 2.0;

const pdfjs = await import(
  pathToFileURL(path.join(뿌리, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs')).href
);

const 자료 = new Uint8Array(fs.readFileSync(파일));
const 문서 = await pdfjs.getDocument({ data: 자료, useSystemFonts: true }).promise;
if (쪽번호 < 1 || 쪽번호 > 문서.numPages) {
  console.error(`⛔ ${path.basename(파일)} 은 ${문서.numPages}쪽뿐이다 — ${쪽번호}쪽은 없다`);
  process.exit(1);
}
const 쪽 = await 문서.getPage(쪽번호);
const 시야 = 쪽.getViewport({ scale: 배율 });
const 캔버스 = createCanvas(Math.ceil(시야.width), Math.ceil(시야.height));
const ctx = 캔버스.getContext('2d');

await 쪽.render({ canvasContext: ctx, viewport: 시야 }).promise;

fs.mkdirSync(path.dirname(날길), { recursive: true });
fs.writeFileSync(날길, 캔버스.toBuffer('image/png'));
console.log(`✅ ${path.basename(파일)} ${쪽번호}쪽 → ${날길} (${Math.ceil(시야.width)}×${Math.ceil(시야.height)}, 배율 ${배율})`);
