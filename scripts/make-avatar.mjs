#!/usr/bin/env node
/**
 * 파트너 플랫폼 프로필 이미지를 만든다. `npm run avatar`
 *
 * 소스는 `scripts/brand/avatar.svg` 다. **`public/` 에 두지 않는다** —
 * public/ 아래는 전부 그대로 서비스되므로, 주석에 적은 한글이 공개 산출물로
 * 나간다. 실제로 그렇게 샜다(빌드 검사에서 잡았다).
 * 소스는 여기, 결과물만 public/brand/ 로 나간다.
 *
 * MSN Partner Hub 요건: 448×448 이상, JPG/JPEG/PNG.
 */
import sharp from 'sharp';
import { readFileSync, statSync, mkdirSync } from 'node:fs';

const SRC = 'scripts/brand/avatar.svg';
const OUT = 'public/brand';
const BG = '#0f4c81';

mkdirSync(OUT, { recursive: true });
const svg = readFileSync(SRC);

for (const size of [448, 512]) {
  await sharp(svg, { density: 900 })
    .resize(size, size, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/avatar-${size}.png`);
}
await sharp(svg, { density: 900 })
  .resize(448, 448, { fit: 'fill' })
  .flatten({ background: BG })
  .jpeg({ quality: 92 })
  .toFile(`${OUT}/avatar-448.jpg`);

// 원형 크롭에서 잘리는 픽셀이 있으면 알린다. 플랫폼이 원형으로 자르는 일이 많다.
const { data, info } = await sharp(`${OUT}/avatar-448.png`)
  .raw()
  .toBuffer({ resolveWithObject: true });
let clipped = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
      if (Math.hypot(x - 223.5, y - 223.5) > 224) clipped++;
    }
  }
}

for (const f of ['avatar-448.png', 'avatar-512.png', 'avatar-448.jpg']) {
  const m = await sharp(`${OUT}/${f}`).metadata();
  console.log(`  ${f}  ${m.width}x${m.height}  ${statSync(`${OUT}/${f}`).size}B`);
}
console.log(clipped ? `  ⚠ 원형 크롭에서 ${clipped}px 잘림` : '  원형 크롭 안전 (잘림 0)');
