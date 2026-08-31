#!/usr/bin/env node
/**
 * make-kcw-favicon.mjs — **SVG 파비콘 하나에서 PNG 와 ICO 를 뽑는다.**
 *
 * ── 🔴 왜 만드나 (2026-08-31 · 5번) ──────────────────────────
 * 공용 크롬으로 우리 홈을 열어 보니 콘솔에 `/favicon.ico` **404** 가 찍혔다.
 * `.ico`·`.svg`·`.png` **셋 다 404** — K Culture Wire 에는 파비콘이 «아예 없었다».
 *   ⇒ 탭에도, 구글 검색 결과 줄에도 우리 얼굴이 안 나온다. 손님이 우리를 못 알아본다.
 * ⚠ 저장소에 `public/favicon.svg` 가 있긴 한데 **파란 차트선**이라 SeoulMarkets 결이고,
 *   KCW 호스트는 `dist/wikitip/` 을 뿌리로 삼으므로 그 파일은 우리 주소로 안 나간다.
 *
 * ── 어떻게 ─────────────────────────────────────────────────
 * 크롬으로 SVG 를 그려 32·16 픽셀 PNG 를 찍고, 그 PNG «그대로» ICO 에 담는다.
 * ⭐ ICO 는 비트맵만 담는 게 아니다 — 헤더 뒤에 PNG 바이트를 그대로 넣는 것이
 *   표준으로 허용되고(Vista 이후) 요즘 브라우저는 다 읽는다. 그래서 변환이 필요 없다.
 * ⛔ 크기를 짐작하지 않는다 — 찍은 PNG 의 실제 폭·높이를 IHDR 에서 읽어 ICO 에 적는다.
 *
 * 쓰는 법
 *   node scripts/make-kcw-favicon.mjs --자가시험
 *   node scripts/make-kcw-favicon.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 방 = path.join(뿌리, 'public/wikitip');

/** PNG 의 IHDR 에서 폭·높이를 읽는다. ⛔ 짐작하지 않는다 */
export function png크기(바이트) {
  const b = 바이트;
  if (!b || b.length < 24) return null;
  /* PNG 매직 8바이트 + 길이 4 + 'IHDR' 4 = 16 부터 폭·높이 */
  const 매직 = [0x89, 0x50, 0x4e, 0x47];
  for (let i = 0; i < 4; i += 1) if (b[i] !== 매직[i]) return null;
  const 읽기 = (o) => (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3];
  const w = 읽기(16); const h = 읽기(20);
  if (w <= 0 || h <= 0) return null;
  return { 폭: w, 높이: h };
}

/**
 * PNG 여러 장을 ICO 하나로 묶는다.
 * ⚠ ICO 는 256을 «0» 으로 적는다 — 한 칸이 1바이트라 256이 안 들어간다.
 * ⛔ 크기를 못 읽은 장은 «빼고» 만든다. 0으로 채워 넣지 않는다.
 */
export function ico만들기(png들) {
  const 쓸것 = (png들 ?? []).map((b) => ({ b, 크기: png크기(b) })).filter((x) => x.크기);
  if (!쓸것.length) return null;
  const 머리 = Buffer.alloc(6);
  머리.writeUInt16LE(0, 0);            /* 예약 */
  머리.writeUInt16LE(1, 2);            /* 1 = ICO */
  머리.writeUInt16LE(쓸것.length, 4);
  let 자리 = 6 + 16 * 쓸것.length;
  const 목차 = [];
  for (const { b, 크기 } of 쓸것) {
    const e = Buffer.alloc(16);
    e.writeUInt8(크기.폭 >= 256 ? 0 : 크기.폭, 0);
    e.writeUInt8(크기.높이 >= 256 ? 0 : 크기.높이, 1);
    e.writeUInt8(0, 2);                /* 색 수 — 트루컬러라 0 */
    e.writeUInt8(0, 3);                /* 예약 */
    e.writeUInt16LE(1, 4);             /* 색 평면 */
    e.writeUInt16LE(32, 6);            /* 비트/픽셀 */
    e.writeUInt32LE(b.length, 8);
    e.writeUInt32LE(자리, 12);
    목차.push(e);
    자리 += b.length;
  }
  return Buffer.concat([머리, ...목차, ...쓸것.map((x) => x.b)]);
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  /* 32×16 짜리 가짜 PNG 머리 — IHDR 까지만 있으면 크기를 읽을 수 있다 */
  const 가짜 = (w, h) => {
    const b = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
    Buffer.from('IHDR').copy(b, 12);
    b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
    return b;
  };

  검('PNG 크기를 읽는다', JSON.stringify(png크기(가짜(32, 32))) === JSON.stringify({ 폭: 32, 높이: 32 }));
  검('가로세로가 달라도 읽는다', png크기(가짜(16, 8)).높이 === 8);
  검('⛔ PNG 가 아니면 null', png크기(Buffer.from('not a png at all......')) === null);
  검('⛔ 너무 짧으면 null', png크기(Buffer.alloc(10)) === null);
  검('⛔ 빈 값도 null', png크기(null) === null);

  const ico = ico만들기([가짜(32, 32), 가짜(16, 16)]);
  검('ICO 를 만든다', Buffer.isBuffer(ico));
  검('ICO 머리가 1(=ICO) 이다', ico.readUInt16LE(2) === 1);
  검('그림 수가 맞다', ico.readUInt16LE(4) === 2);
  검('첫 칸 폭이 32', ico.readUInt8(6) === 32);
  검('둘째 칸 폭이 16', ico.readUInt8(6 + 16) === 16);
  검('첫 그림 자리가 머리+목차 뒤다', ico.readUInt32LE(6 + 12) === 6 + 32);
  검('전체 길이가 맞다', ico.length === 6 + 32 + 24 + 24);

  검('⚠ 256 은 0 으로 적는다', ico만들기([가짜(256, 256)]).readUInt8(6) === 0);
  검('⛔ 크기를 못 읽은 장은 빼고 만든다',
    ico만들기([가짜(32, 32), Buffer.from('쓰레기')]).readUInt16LE(4) === 1);
  검('⛔ 쓸 게 하나도 없으면 null', ico만들기([Buffer.from('x')]) === null && ico만들기([]) === null);

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ 파비콘 만드는 자 — 자가시험 14 통과');
  process.exit(0);
}

if (내가실행됐다) {
  const svg길 = path.join(방, 'favicon.svg');
  if (!fs.existsSync(svg길)) { console.error(`⛔ 없다 — ${svg길}`); process.exit(1); }
  const svg = fs.readFileSync(svg길, 'utf8');

  const puppeteer = require('puppeteer-core');
  const 브라우저 = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--force-device-scale-factor=1'],
  });
  try {
    const png들 = [];
    for (const 크기 of [32, 16]) {
      const 쪽 = await 브라우저.newPage();
      await 쪽.setViewport({ width: 크기, height: 크기, deviceScaleFactor: 1 });
      /* ⛔ 배경을 흰색으로 두지 않는다 — 파비콘 모서리가 둥글어 밖이 비쳐야 한다 */
      await 쪽.setContent(
        `<style>*{margin:0;padding:0}html,body{width:${크기}px;height:${크기}px;background:transparent}`
        + `svg{width:${크기}px;height:${크기}px;display:block}</style>${svg}`,
        { waitUntil: 'load' },
      );
      const b = await 쪽.screenshot({ type: 'png', omitBackground: true });
      const 잰것 = png크기(b);
      if (!잰것) { console.error(`⛔ ${크기}px PNG 를 못 읽었다`); process.exit(1); }
      console.log(`  ✔ ${크기}px — 실제로 ${잰것.폭}×${잰것.높이} · ${b.length}바이트`);
      png들.push(b);
      if (크기 === 32) fs.writeFileSync(path.join(방, 'favicon.png'), b);
      await 쪽.close();
    }
    const ico = ico만들기(png들);
    if (!ico) { console.error('⛔ ICO 를 못 만들었다'); process.exit(1); }
    fs.writeFileSync(path.join(방, 'favicon.ico'), ico);
    console.log(`  ✔ favicon.ico — 그림 ${png들.length}장 · ${ico.length}바이트`);
    console.log('\n⭐ 이제 «지면 머리»에도 걸어야 한다 — 구글은 <link rel="icon"> 을 먼저 본다.');
  } finally {
    await 브라우저.close();
  }
}
