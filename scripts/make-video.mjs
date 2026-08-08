#!/usr/bin/env node
/**
 * 짧은 세로 영상을 만든다 — 사장님 지시(2026-08-08 09:2x).
 *
 *   *「영상도 한번 만들어서 나한테 보여줘. 샘플로 쓸 수 있나 보게」*
 *
 * ## 어떻게 만드나
 *
 *   크롬으로 **한 칸씩 찍어** 이어 붙인다. 영상 편집기를 쓰지 않는다 —
 *   그러면 사람 손이 들어가고, 사람 손이 들어가면 **매번 다르게 나온다.**
 *   ⭐ 카드뉴스와 같은 짜임을 쓰므로 **글자·색·말투가 저절로 같아진다.**
 *
 * ## ⚠ 규격
 *
 *   1080×1920 (세로 9:16) · 30fps · 20초 안팎.
 *   ⛔ 쇼츠·릴스·스레드가 다 이 크기다. 가로로 만들면 세 곳 다 잘린다.
 *   ⚠ **소리를 안 넣는다.** 대부분 소리를 끄고 본다 — 글자로 다 읽히게 만든다.
 *
 * ## ⛔ 겁주지 않는다
 *
 *   카드뉴스와 같은 규칙이다. 「지금 바로」·「모르면 손해」를 쓰지 않는다.
 *   숫자는 **라이브 지면에서 읽어 온 것**만 쓴다.
 *
 * 쓰는 법
 *   node scripts/make-video.mjs --out <폴더>
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const 몫 = (이름) => { const i = process.argv.indexOf(이름); return i >= 0 ? process.argv[i + 1] : null; };

const 초당 = 30;
const 폭 = 1080, 높 = 1920;

/* 강동구 열네 곳 — 라이브 /report/area/서울특별시-강동구 에서 읽은 값 */
const 학교 = [
  ['강동고', 93.2], ['강일고', 78.6], ['광문고', 65.9], ['동북고', 65.2],
  ['둔촌고', 66.8], ['명일여고', 67.6], ['배재고', 53.4], ['상일여고', 63.9],
  ['선사고', 73.4], ['성덕고', 70.4], ['한영고', 58.3], ['한영외고', 63.3],
];
const 낮 = 53.4, 높값 = 93.2, 가운데 = 66.4;

/** 장면 — [시작초, 끝초, 그리는 법] */
const 장면 = [
  { 부터: 0.0, 까지: 3.2, 꼴: '제목' },
  { 부터: 3.2, 까지: 8.0, 꼴: '퍼짐' },
  { 부터: 8.0, 까지: 12.0, 꼴: '등수없다' },
  { 부터: 12.0, 까지: 17.0, 꼴: '못잰다' },
  { 부터: 17.0, 까지: 21.0, 꼴: '끝' },
];
const 총초 = 장면[장면.length - 1].까지;

/** 부드럽게 — 0→1 */
const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));

function 칸HTML(초) {
  const s = 장면.find((x) => 초 >= x.부터 && 초 < x.까지) ?? 장면[장면.length - 1];
  const 안에서 = (초 - s.부터) / (s.까지 - s.부터);
  const 나타남 = 술술(Math.min(1, (초 - s.부터) / 0.5));
  const 사라짐 = 술술(Math.min(1, (s.까지 - 초) / 0.4));
  const 투명 = Math.min(나타남, 사라짐);

  let 속 = '';
  if (s.꼴 === '제목') {
    속 = `<div class="wrap" style="opacity:${투명}">
      <div class="eyebrow">서울 강동구</div>
      <h1>고등학교 14곳,<br>한 장에</h1>
      <p class="sub">학교를 하나씩 검색해<br>종이에 옮기지 않아도 되게</p>
    </div>`;
  } else if (s.꼴 === '퍼짐') {
    /* 점이 하나씩 놓인다 */
    const 놓인수 = Math.floor(술술(Math.min(1, 안에서 / 0.7)) * 학교.length);
    const 점 = 학교.slice(0, 놓인수).map(([n, v]) => {
      const x = ((v - 낮) / (높값 - 낮)) * 100;
      return `<div class="dot" style="left:${x}%"></div>`;
    }).join('');
    const 셈 = (낮 + (높값 - 낮) * 술술(Math.min(1, 안에서 / 0.55))).toFixed(1);
    속 = `<div class="wrap" style="opacity:${투명}">
      <h2>이 구는 이렇게<br>퍼져 있습니다</h2>
      <div class="range"><span>${낮}%</span><span class="big">~</span><span>${셈}%</span></div>
      <div class="band"><div class="line"></div>${점}</div>
      <div class="ends"><span>가장 낮은 곳</span><span>가장 높은 곳</span></div>
      <div class="note">퍼진 폭 39.8%p · 가운데값 ${가운데}% · 잰 곳 12곳</div>
    </div>`;
  } else if (s.꼴 === '등수없다') {
    속 = `<div class="wrap" style="opacity:${투명}">
      <h2>저희는 등수를<br>매기지 않습니다</h2>
      <p class="body">점 하나가 학교 한 곳입니다.<br><b>어디쯤인지는 읽는 분이 보십시오.</b></p>
      <div class="band small"><div class="line"></div>${학교.map(([n, v]) => `<div class="dot" style="left:${((v - 낮) / (높값 - 낮)) * 100}%"></div>`).join('')}</div>
      <p class="body dim">표도 가나다순이지<br>잘한 순서가 아닙니다.</p>
    </div>`;
  } else if (s.꼴 === '못잰다') {
    속 = `<div class="wrap" style="opacity:${투명}">
      <h2>못 잰 것은<br>못 잰 것입니다</h2>
      <p class="body">이 구에서 가장 낮은 곳은 배재고(자율고)입니다.<br>
      자율고는 「그 밖」 칸이 원래 큽니다.</p>
      <div class="cmp"><div><span class="l">배재고</span><span class="v">46.6%</span></div>
        <div><span class="l">전국 자율고 가운데값</span><span class="v dim2">26.2%</span></div></div>
      <p class="body"><b>왜 그런지는 저희 자료로 못 잽니다.</b><br>
      못 잰 것을 「재수 때문」으로 메우지 않겠습니다.</p>
    </div>`;
  } else {
    속 = `<div class="wrap" style="opacity:${투명}">
      <h1 class="end">그다음은<br>저희가 답을<br>못 드립니다</h1>
      <p class="body">저희가 재는 것은 <b>학교</b>이지 아이가 아닙니다.<br>
      그 차이는 이 표에 없습니다.</p>
      <div class="cta">100yearmap.com</div>
      <div class="src">학교알리미 2024 공시 · 공공누리 제1유형</div>
    </div>`;
  }

  return `<!doctype html><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#0b0d12;color:#e9e9ee;
       font-family:'Noto Sans KR','Malgun Gothic',sans-serif;padding:150px 86px;
       display:flex;align-items:center;position:relative;overflow:hidden}
  body::before{content:'';position:absolute;top:0;left:0;right:0;height:10px;background:#c9a84c}
  .wrap{width:100%}
  .eyebrow{font-size:38px;color:#c9a84c;font-weight:700;margin-bottom:30px}
  h1{font-family:'Noto Serif KR',serif;font-weight:900;font-size:104px;line-height:1.26;letter-spacing:-2px}
  h1.end{font-size:88px}
  h2{font-family:'Noto Serif KR',serif;font-weight:900;font-size:76px;line-height:1.3;
     letter-spacing:-2px;margin-bottom:56px}
  .sub{font-size:38px;color:#9aa0ac;margin-top:44px;line-height:1.6}
  .body{font-size:40px;line-height:1.7;color:#cfd4dd;margin:34px 0}
  .body b{color:#e9e9ee} .body.dim{color:#8e95a1;font-size:34px}
  .range{display:flex;align-items:baseline;gap:22px;font-family:'Noto Serif KR',serif;
         font-weight:900;font-size:88px;color:#c9a84c;letter-spacing:-2px}
  .range .big{font-size:60px;color:#5c636f}
  .band{position:relative;height:66px;margin:44px 0 12px}
  .band.small{height:48px;margin:36px 0 20px}
  .line{position:absolute;top:50%;left:0;right:0;height:2px;background:#262b36}
  .dot{position:absolute;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;
       border-radius:50%;background:#c9a84c}
  .band.small .dot{width:16px;height:16px;margin:-8px 0 0 -8px}
  .ends{display:flex;justify-content:space-between;font-size:28px;color:#5c636f}
  .note{font-size:32px;color:#9aa0ac;margin-top:40px}
  .cmp{margin:44px 0}
  .cmp div{display:flex;justify-content:space-between;align-items:baseline;
           border-top:1px solid #262b36;padding:26px 0}
  .cmp .l{font-size:34px;color:#cfd4dd} .cmp .v{font-size:52px;font-weight:900;color:#c9a84c}
  .cmp .v.dim2{color:#8e95a1}
  .cta{margin-top:60px;font-size:46px;font-weight:900;color:#c9a84c}
  .src{margin-top:20px;font-size:26px;color:#5c636f}
</style>${속}`;
}

/* ── 찍고 이어 붙이기 ── */
const 낼폴더 = 몫('--out') ?? '.';
fs.mkdirSync(낼폴더, { recursive: true });
const 칸폴더 = path.join(낼폴더, '_칸');
fs.rmSync(칸폴더, { recursive: true, force: true });
fs.mkdirSync(칸폴더, { recursive: true });

const puppeteer = require('puppeteer-core');
const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});
const p = await b.newPage();
await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });

const 칸수 = Math.round(총초 * 초당);
for (let i = 0; i < 칸수; i++) {
  await p.setContent(칸HTML(i / 초당), { waitUntil: 'load' });
  await p.screenshot({ path: path.join(칸폴더, `${String(i).padStart(4, '0')}.png`) });
  if (i % 60 === 0) console.log(`  ${i}/${칸수} 칸`);
}
await b.close();

const ffmpeg = require('ffmpeg-static');
const 낼길 = path.join(낼폴더, '영상샘플_강동구-14곳.mp4');
execFileSync(ffmpeg, [
  '-y', '-framerate', String(초당), '-i', path.join(칸폴더, '%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
  '-movflags', '+faststart', 낼길,
], { stdio: 'ignore' });

fs.rmSync(칸폴더, { recursive: true, force: true });
console.log(`\n✅ ${path.basename(낼길)}  ${(fs.statSync(낼길).size / 1048576).toFixed(1)} MB · ${폭}×${높} · ${총초}초 · 소리 없음`);
