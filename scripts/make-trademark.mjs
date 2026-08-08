#!/usr/bin/env node
/**
 * make-trademark.mjs — **상표 출원에 낼 그림**을 뽑는다.
 *
 * 🔴 사장님(2026-08-08 18:0x): **「상표권 출원 준비해라」**
 *
 * ⚠ 출원용 그림은 영상·카드와 다르다 —
 *   · **정지**해야 한다(통통 끔). 출원 서류에 움직이는 것은 못 낸다
 *   · **흰 바탕**이어야 한다. 그림자·배경을 넣지 않는다
 *   · 도형만 낸 것과 글자를 붙인 것을 **따로** 낸다. 둘은 다른 상표다
 *
 * 쓰는 법  node scripts/make-trademark.mjs --out <폴더>
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { 곰곰이 } from './gomgomi.mjs';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
const puppeteer = require('puppeteer-core');

const i = process.argv.indexOf('--out');
const 낼폴더 = path.resolve(i >= 0 ? process.argv[i + 1] : '.');
fs.mkdirSync(낼폴더, { recursive: true });

const 글꼴 = `'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif`;
const 정지곰 = 곰곰이(0, { 기분: '멀뚱', 통통: false });

/** 낼 것 — [파일이름, 너비, 높이, 속] */
const 낼것 = [
  ['도형상표_곰곰이', 1200, 1200,
    `<style>svg{width:880px}</style>${정지곰}`],

  ['결합상표_곰곰이', 1600, 900,
    `<style>.줄{display:flex;align-items:center;gap:74px}
      svg{width:430px}
      .글{font-size:150px;font-weight:900;letter-spacing:-.04em;color:#3A2A10;line-height:1}
      .영{font-size:56px;font-weight:800;color:#D9A93C;letter-spacing:.08em;margin-top:14px}</style>
     <div class="줄">${정지곰}<div><div class="글">곰곰이</div><div class="영">GOMGOMI</div></div></div>`],

  ['문자상표_백년지도', 1600, 700,
    `<style>.글{font-size:190px;font-weight:900;letter-spacing:-.045em;color:#3A2A10}</style>
     <div class="글">백년지도</div>`],

  ['문자상표_KLifeMap', 1600, 700,
    `<style>.글{font-size:170px;font-weight:900;letter-spacing:-.03em;color:#3A2A10}
      .글 i{font-style:normal;color:#D9A93C}</style>
     <div class="글">KLifeMap<i>.AI</i></div>`],

  ['문자상표_SeoulMarkets', 1600, 700,
    `<style>.글{font-size:150px;font-weight:900;letter-spacing:-.02em;color:#3A2A10}</style>
     <div class="글">SeoulMarkets</div>`],

  ['문자상표_KCultureWire', 1600, 700,
    `<style>.글{font-size:132px;font-weight:900;letter-spacing:-.02em;color:#3A2A10}</style>
     <div class="글">K Culture Wire</div>`],
];

const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});
const p = await b.newPage();

for (const [이름, w, h, 속] of 낼것) {
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await p.setContent(`<!doctype html><meta charset="utf-8">
    <style>*{margin:0;padding:0;box-sizing:border-box}
      body{width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;
           background:#fff;font-family:${글꼴}}</style>${속}`, { waitUntil: 'load' });
  const 낼길 = path.join(낼폴더, `${이름}.png`);
  await p.screenshot({ path: 낼길 });
  console.log(`  ${이름}.png  ${w}×${h}`);
}
await b.close();
console.log(`✅ ${낼것.length}장 — ${낼폴더}`);
