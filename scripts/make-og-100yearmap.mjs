#!/usr/bin/env node
/**
 * 백년지도 기본 OG 카드(1200×630 PNG) — `public/100y/og.png`
 *
 *   node scripts/make-og-100yearmap.mjs
 *
 * ⚠ 왜 `public/100y/` 인가 — `server.mjs` 가 `100yearmap.com` 을 `dist/100y/` 로 보낸다.
 *   Astro 는 `public/*` 를 `dist/*` 로 그대로 복사하므로,
 *   `public/100y/og.png` → `dist/100y/og.png` → `https://100yearmap.com/og.png` 가 된다.
 *   ⛔ `public/og.png` 에 두면 서울마켓 자리로 가서 백년지도에서 404 다.
 *
 * ⚠ 2번의 `make-og.mjs` 는 서울마켓 것이다. **건드리지 않는다.** 이건 따로다.
 *
 * ⭐ 왜 만드나 — 레이아웃에 「og:image 는 카카오톡 유통 경로다. 빈 카드가 나가면 안 퍼진다」고
 *   적어 놓고 백년지도에는 한 장도 안 걸어 놨었다(2026-08-05 실측). 서울마켓은 있었다.
 *
 * ⚠ **로고 밑줄(「백년MAP」)은 넣지 않는다.** 그건 사장님이 아직 안 정하셨다.
 *   대신 「백년지도」와 「百年之圖」만 쓴다 — 이 둘은 이미 확정된 것이다.
 *   덕분에 브랜드 결정을 기다리지 않고 지금 만들 수 있다.
 *
 * ⚠ 한글이 네모(두부)로 나오면 글꼴을 못 찾은 것이다. **눈으로 확인하고 커밋한다.**
 *   sharp 는 시스템 글꼴로 그린다 — 윈도우는 맑은 고딕·바탕이 있다.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const OUT = path.join(ROOT, 'public', '100y', 'og.png');

/** 지면과 같은 값이다. `HundredYear.astro` 의 토큰을 옮겨 적었다 */
const 색 = {
  바탕: '#0b0d12',
  금: '#c9a84c',
  금흐림: '#bf9d45',
  글: '#e9e9ee',
  흐림: '#9aa0ac',
  선: '#262b36',
};

/** ⚠ 한글 글꼴을 먼저 적는다. Georgia 를 앞에 두면 한글이 대체글꼴로 떨어진다 */
const 명조 = "'Batang','바탕','Nanum Myeongjo','Noto Serif KR',Georgia,serif";
const 고딕 = "'Malgun Gothic','맑은 고딕','Noto Sans KR',sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${색.바탕}"/>
  <rect x="0" y="0" width="1200" height="6" fill="${색.금}"/>

  <!-- 브랜드 -->
  <text x="80" y="200" font-family="${명조}" font-size="104" font-weight="bold"
        fill="${색.금}" letter-spacing="4">백년지도</text>
  <text x="80" y="258" font-family="${명조}" font-size="34"
        fill="${색.금흐림}" letter-spacing="14">百年之圖</text>

  <line x1="80" y1="310" x2="1120" y2="310" stroke="${색.선}" stroke-width="1"/>

  <!-- 사장님이 정하신 첫 문장 -->
  <text x="80" y="392" font-family="${고딕}" font-size="46" font-weight="bold"
        fill="${색.글}">대학은 100년 중 한 점일뿐 입니다.</text>

  <text x="80" y="462" font-family="${고딕}" font-size="30" fill="${색.흐림}">
    그 길로 간 사람들이 졸업 뒤에 어떻게 됐는지, 공공데이터로 봅니다.</text>

  <!-- 우리가 팔지 않는 것 — 이게 차별점이다 -->
  <text x="80" y="540" font-family="${고딕}" font-size="27" fill="${색.흐림}">
    무료 · 가입 없음 · 학원을 팔지 않습니다</text>

  <text x="80" y="590" font-family="${고딕}" font-size="26" fill="${색.금흐림}"
        letter-spacing="2">100yearmap.com</text>
</svg>`;

await mkdir(path.dirname(OUT), { recursive: true });
const png = await sharp(Buffer.from(svg)).png().toBuffer();
await writeFile(OUT, png);

const { width, height, size } = await sharp(png).metadata();
console.log(`백년지도 OG 카드 — ${width}×${height} · ${(size / 1024).toFixed(0)}KB`);
console.log(`→ ${path.relative(ROOT, OUT)}`);
console.log('⚠ 한글이 네모로 나오지 않았는지 **눈으로 보고** 커밋한다.');
