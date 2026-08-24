#!/usr/bin/env node
/**
 * 백년지도 — 주제 지면(등산·어린이집 채움률 등) 전용 공유 카드.
 *
 * 🔴 왜 (5번 총괄 지적, 2026-08-25) — 「공유 카드(OG)를 세어 보십시오. 그 상태로는
 *   카카오톡·X·페이스북에 공유해도 그림이 안 뜹니다」. /hiking·/nursery-fill 둘 다
 *   지면 전용 카드 없이 홈 화면 og.png로 떨어지고 있었다.
 *
 * ⛔ `make-og-100y-pages.mjs`(학교·지역 전용)를 안 고친다 — 그 자는 이미 2,600여 장을
 *   찍어 내는 자리다. 대신 그 자가 이미 내보낸 `카드SVG()`를 그대로 불러 쓴다.
 *
 * 쓰는 법  node scripts/make-og-100y-topics.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 카드SVG } from './make-og-100y-pages.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼방 = path.join(뿌리, 'public/100y/og');

const 카드들 = [
  {
    이름파일: 'hiking',
    딱지: '나이대별 등산 참여율',
    이름: '등산은 몇 살이 가장 많이 갈까요?',
    수: '50대 28.4%',
    수말: '2025년 · 최근 1년 참여 경험(복수응답)',
    밑: '문화체육관광부 국민생활체육조사 · KOSIS',
  },
  {
    이름파일: 'golf',
    딱지: '나이대별 골프 참여율',
    이름: '골프는 몇 살이 가장 많이 할까요?',
    수: '50대 10.7%',
    수말: '2025년 · 최근 1년 참여 경험(복수응답)',
    밑: '문화체육관광부 국민생활체육조사 · KOSIS',
  },
  {
    이름파일: 'nursery-fill',
    딱지: '어린이집 정원 대비 현원',
    이름: '어린이집 채움률',
    수: '69.1%',
    수말: '2025년 전국(2006년 81.3%에서 낮아짐)',
    밑: '보건복지부 「전국 어린이집 정현원 현황」 · KOSIS',
  },
];

fs.mkdirSync(낼방, { recursive: true });
let 만듦 = 0;
for (const x of 카드들) {
  const png = await sharp(Buffer.from(카드SVG(x))).png({ palette: true, colors: 32, compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(낼방, `${x.이름파일}.png`), png);
  만듦++;
  console.log(`✅ og/${x.이름파일}.png (${(png.length / 1024).toFixed(1)}KB)`);
}
console.log(`\n${만듦}장 완료 — ${path.relative(뿌리, 낼방)}`);
