/**
 * 기본 OG 카드(1200×630 PNG)를 만든다.
 * SVG는 페이스북·슬랙 등 대부분의 스크래퍼가 렌더하지 않으므로 PNG로 굽는다.
 * 사이트명·도메인이 바뀌면 `node scripts/make-og.mjs` 를 다시 돌린다.
 *
 * sharp 는 Astro 가 이미 의존성으로 들고 있어서 따로 설치할 게 없다.
 */
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const NAME = 'SeoulMarkets';
const TAGLINE = 'Korean markets, explained with data.';
const DOMAIN = 'seoulmarkets.com';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f1b2a"/>
  <rect x="0" y="0" width="1200" height="8" fill="#0f4c81"/>

  <polyline points="80,470 200,430 320,455 440,360 560,395 680,300 800,330 920,225 1040,255 1120,180"
            fill="none" stroke="#2f6da8" stroke-width="4" stroke-linejoin="round" opacity="0.55"/>
  <polyline points="80,470 200,430 320,455 440,360 560,395 680,300 800,330 920,225 1040,255 1120,180"
            fill="none" stroke="#7ab3e6" stroke-width="2" stroke-linejoin="round" opacity="0.9"/>

  <text x="80" y="180" font-family="Georgia, 'Times New Roman', serif" font-size="46"
        fill="#7ab3e6" letter-spacing="6">DATA JOURNALISM</text>
  <text x="80" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="96"
        font-weight="bold" fill="#ffffff">${NAME}</text>
  <text x="80" y="352" font-family="Georgia, 'Times New Roman', serif" font-size="38"
        fill="#c2c9d3">${TAGLINE}</text>
  <text x="80" y="560" font-family="Georgia, 'Times New Roman', serif" font-size="30"
        fill="#8fa0b4" letter-spacing="2">${DOMAIN}</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(new URL('../public/og-default.png', import.meta.url), png);
console.log(`public/og-default.png written (${(png.length / 1024).toFixed(1)} kB)`);
