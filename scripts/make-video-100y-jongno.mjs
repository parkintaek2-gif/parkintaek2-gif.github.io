#!/usr/bin/env node
/**
 * `@100yearmap` 첫 영상 — **종로구, 문 연 지 100년이 넘은 고등학교 여덟 곳** (14초 쇼츠).
 *
 *   node scripts/make-video-100y-jongno.mjs --out 종로.mp4
 *   node scripts/make-video-100y-jongno.mjs --자가시험
 *
 * ## 🔴 왜 이 꼴로 만드나
 *
 *   2번 규칙 — *「영상에 나오는 **숫자마다 그 수가 있는 지면 주소**를 적으십시오.
 *   ⛔ 못 대는 숫자는 영상에서 빼십시오」*.
 *
 *   ⛔ 오늘 그 규칙이 없어서 사고가 났다 — 2번이 영상 속을 안 보고 파일 이름만 보고
 *     **「강동구에 100년 넘은 가게가 14곳」**이라는 **없는 사실**을 공개했다.
 *     우리 자료에 「가게」는 없다. 국민연금 사업장이고 구·군 축도 없다.
 *
 * ## ⛔ 그래서 **수를 손으로 안 박는다**
 *
 *   화면에 뜨는 여덟 줄과 큰 수는 전부 `pages-school.json` 에서 **세서** 만든다.
 *   자가시험이 **화면 글자와 자료 값을 맞대 본다.** 손으로 박으면 거기서 선다.
 *   (5번이 `make-video-kcw.mjs` 에서 먼저 한 방식이다. 그대로 가져왔다.)
 *
 * ## ⚠ 말에서 지키는 것
 *
 *   ```
 *   ⛔ 「명문」·「전통」·「1등」   오래된 것은 **햇수**이지 좋고 나쁨이 아니다
 *   ⛔ 「141년째」               설립일은 NEIS 값이라 학교 개교기념일과 다를 수 있다.
 *                              **「1885년 설립」**으로 적는다
 *   ✅ 화면에 「여기에 없는 것」  말로만 조심하면 30초 뒤엔 숫자만 남는다
 *   ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { 곰곰이 } from './gomgomi.mjs';
import { 지역가르기 } from '../src/lib/school-area.ts';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);

export const 초당 = 30;
export const 폭 = 1080, 높 = 1920;
export const 총초 = 14;

/* ── 수는 자료에서 센다. ⛔ 손으로 안 적는다 ───────────────────── */
const 학교자료 = JSON.parse(
  fs.readFileSync(path.join(여기, 'src/data/100yearmap/pages-school.json'), 'utf8'),
);
export const 시도 = '서울특별시';
export const 구 = '종로구';
export const 올해 = 2026; // ⚠ 붙박이다 — 해가 바뀌면 「100년」의 뜻도 바뀐다. 그때 다시 센다

const 설립연 = (x) => (/^\d{8}$/.test(String(x.설립일 ?? '')) ? Number(String(x.설립일).slice(0, 4)) : null);
export const 이구 = 학교자료.filter((x) => {
  const g = 지역가르기(x.주소);
  return g && g.시도 === 시도 && g.이름 === 구;
});
/** 오래된 순 — ⛔ 등수가 아니라 **햇수 순**이다. 화면에도 그렇게 적는다 */
export const 백년넘은곳 = 이구
  .filter((x) => { const y = 설립연(x); return y != null && 올해 - y >= 100; })
  .sort((a, b) => 설립연(a) - 설립연(b))
  .map((x) => ({ 이름: x.title.replace(/고등학교$/, '고').replace(/여자고$/, '여고'), 해: 설립연(x), code: x.code }));

export const 전체곳수 = 이구.length;
export const 백년곳수 = 백년넘은곳.length;
export const 가장오래된 = 백년넘은곳[0];

/* ── 움직임 (make-video2 와 같은 것) ─────────────────────────── */
export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export const 툭 = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.70158 + 1;
  return 1 + c * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
};
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}

/** 막대 길이 — **연도 눈금**이다. 1880 부터 1930 까지를 폭 전체로 편다 */
export const 눈금낮 = 1880, 눈금높 = 1930;
/**
 * 🔴 **70%까지만 편다.** 100%로 폈더니 1923·1925 줄의 **연도 값이 화면 밖으로 나갔다**
 *   (2026-08-09 01:4x · 뽑은 프레임을 눈으로 보고 알았다. 자가시험 17개는 다 초록이었다).
 * ⚠ 자가시험은 「글자가 있나」를 보지 「화면 안에 있나」를 못 본다. 그건 눈이 본다.
 */
export const 자리 = (해) => ((해 - 눈금낮) / (눈금높 - 눈금낮)) * 70;

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /* ① 0.0–2.6  「8」이 박히고 밑에 말이 밀려 들어온다 */
  const 큰수등장 = 툭(끼(0.0, 0.55));
  const 큰수값 = Math.round(백년곳수 * 술술(끼(0.15, 1.0)));
  const 밑말 = 술술(끼(0.85, 1.5));

  /* ② 1.9–6.6  여덟 줄이 오래된 순으로 자란다 */
  const 표나옴 = 술술(끼(1.9, 2.4));
  const 막대들 = 백년넘은곳.map((x, i) => {
    const 시작 = 2.15 + i * 0.12;
    const 자람 = 술술(끼(시작, 시작 + 0.55));
    const 길이 = 자리(x.해) * 자람;
    const 맨위 = i === 0;
    const 켜짐 = 초 > 6.9 && 맨위 ? 1 : 0;
    const 보일해 = Math.round(눈금낮 + (x.해 - 눈금낮) * 자람);
    return `<div class="줄${켜짐 ? ' 켬' : ''}">
      <span class="이름">${x.이름}</span>
      <span class="막대" style="width:${길이.toFixed(2)}%"></span>
      <span class="값" style="opacity:${Math.max(0, 자람 * 2 - 1).toFixed(2)}">${보일해}</span>
    </div>`;
  }).join('');

  /* ③ 6.9–8.4  제일 오래된 곳을 짚는다 */
  const 짚음 = 술술(끼(6.9, 7.5));

  /* ④ 8.4–11.2  없는 것 */
  const 없는것 = 끼(8.4, 8.8);
  const 없는줄 = [
    '등수를 매기지 않습니다',
    '오래된 것은 햇수이지 좋고 나쁨이 아닙니다',
    '설립일은 NEIS 값 — 개교기념일과 다를 수 있습니다',
  ].map((t, i) => `<li style="opacity:${술술(끼(8.7 + i * 0.28, 9.1 + i * 0.28)).toFixed(2)};
      transform:translateX(${(1 - 술술(끼(8.7 + i * 0.28, 9.15 + i * 0.28))) * 40}px)">${t}</li>`).join('');

  /* ⑤ 11.4–14  끝 */
  const 끝 = 술술(끼(11.4, 11.9));
  const 끝맥 = 1 + Math.sin(초 * 5) * 0.012 * 끝;
  const 밝기 = 6 + 초 * 0.5;

  const 놓기 = (x, y, 속) => `<div class="곰" style="left:${x}px;top:${y}px">${속}</div>`;
  const 곰 = (() => {
    if (초 < 1.8) {
      const 뜸 = 툭(끼(0.25, 0.8));
      return 놓기(838, 340 + (1 - 뜸) * 140, 곰곰이(초, { 크기: 1.05 * 뜸, 기분: '놀람' }));
    }
    /* 🔴 곰곰이가 **학교 이름 넷을 가리고 있었다.** 표 밖(아래)으로 내린다 */
    if (초 < 6.8) {
      const 감 = 술술(끼(2.0, 6.4));
      return 놓기(880, 1400 + 감 * 90, 곰곰이(초, { 크기: 0.8, 기분: '셈' }));
    }
    if (초 < 8.2) return 놓기(150, 1400, 곰곰이(초, { 크기: 0.85, 기분: '가리킴' }));
    if (초 < 11.3) return 놓기(872, 1660, 곰곰이(초, { 크기: 0.85, 기분: '멀뚱' }));
    return '';
  })();
  const 끝곰 = 초 >= 11.3 ? 곰곰이(초, { 크기: 1.6 * 술술(끼(11.4, 12.0)), 기분: '인사' }) : '';

  return `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;overflow:hidden;position:relative;
         background:radial-gradient(120% 80% at 50% 12%, hsl(42 38% ${밝기 + 5}%), hsl(220 22% ${밝기}%) 70%);
         font-family:'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif;color:#f3f1ea}
    .판{position:absolute;inset:0;padding:130px 84px}
    .큰수{position:absolute;left:84px;right:84px;top:190px;text-align:center;
          transform:scale(${(0.72 + 0.28 * 큰수등장).toFixed(3)});opacity:${큰수등장.toFixed(2)}}
    .큰수 b{font-size:250px;font-weight:900;letter-spacing:-.05em;line-height:.9;
            color:#f0c85a;text-shadow:0 10px 60px rgba(240,200,90,.28);display:block}
    .큰수 .단위{font-size:96px;font-weight:800;color:#f0c85a;opacity:.85}
    .큰수 .밑{margin-top:26px;font-size:48px;white-space:nowrap;font-weight:700;color:#e9e6dd;
             opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 26).toFixed(1)}px)}
    .큰수 .잔{margin-top:12px;font-size:34px;color:#9aa3b2;opacity:${밑말.toFixed(2)}}
    .표{position:absolute;left:84px;right:84px;top:640px;opacity:${표나옴.toFixed(2)};
        transform:translateY(${((1 - 표나옴) * 40).toFixed(1)}px)}
    .줄{display:flex;align-items:center;gap:20px;height:74px}
    .이름{width:230px;font-size:33px;color:#98a1b0;text-align:right;white-space:nowrap}
    .막대{height:30px;border-radius:15px;background:linear-gradient(90deg,#3f5c8a,#6d8fc4);flex:0 0 auto}
    .줄.켬 .막대{background:linear-gradient(90deg,#c9973a,#f0c85a)}
    .줄.켬 .이름{color:#f0c85a;font-weight:800}
    .줄.켬 .값{color:#f0c85a;font-weight:900}
    .값{font-size:33px;color:#c9cfd9;font-variant-numeric:tabular-nums;width:110px}
    .짚{position:absolute;left:84px;right:84px;top:1258px;text-align:center;
        opacity:${짚음.toFixed(2)};font-size:40px;font-weight:800;color:#f0c85a}
    .없{position:absolute;left:84px;right:84px;top:1520px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:40px;font-weight:800;color:#f0c85a;margin-bottom:18px}
    .없 li{list-style:none;font-size:32px;line-height:1.5;color:#cdd4de;margin-bottom:8px}
    .곰{position:absolute;pointer-events:none;transform:translate(-50%,-50%);
         filter:drop-shadow(0 16px 36px rgba(0,0,0,.42))}
    .곰 svg{display:block}
    .끝 svg{filter:drop-shadow(0 18px 42px rgba(0,0,0,.5));margin-bottom:6px}
    .끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:26px;opacity:${끝.toFixed(2)};
        background:radial-gradient(70% 50% at 50% 45%, rgba(12,14,20,.94), rgba(12,14,20,.99));
        transform:scale(${끝맥.toFixed(4)})}
    .끝 .ㅈ{font-size:60px;font-weight:800;color:#e9e6dd}
    .끝 .ㅅ{font-size:78px;font-weight:900;color:#f0c85a;letter-spacing:-.02em}
    .끝 .ㄱ{font-size:32px;color:#9aa3b2;text-align:center;line-height:1.5}
  </style>
  <div class="판">
    <div class="큰수">
      <b>${큰수값}<span class="단위">곳</span></b>
      <div class="밑">${구}, 100년이 넘은 고등학교</div>
      <div class="잔">${시도} ${구} 고등학교 ${전체곳수}곳 가운데</div>
    </div>
    <div class="표">${막대들}</div>
    <div class="짚">가장 이른 곳 — ${가장오래된.이름} ${가장오래된.해}년 설립</div>
    <div class="없">
      <h3>여기에 없는 것</h3>
      <ul>${없는줄}</ul>
    </div>
    ${곰}
  </div>
  <div class="끝">
    ${끝곰}
    <div class="ㅈ">우리 동네 고등학교를</div>
    <div class="ㅅ">100yearmap.com</div>
    <div class="ㄱ">설립일 — 교육부 NEIS 교육정보 개방 포털<br>백년지도 · 대학 다음까지</div>
  </div>`;
}

/* ── 검사 — 🔴 **화면 글자와 자료 값을 맞대 본다** ───────────── */
/**
 * 🔴 깃발이 `--selftest` 가 아니라 **`--자가시험`** 이다.
 *
 *   `gomgomi.mjs` 가 **import 되는 순간** 자기 `--selftest` 를 돌고 `process.exit` 한다.
 *   불러오는 쪽이 먼저 평가되므로, 내가 `--selftest` 를 쓰면
 *   **내 시험 17개가 한 번도 안 돌고** 곰곰이의 12개만 돌고 끝난다.
 *   ⛔ 실제로 그렇게 「✅ 검사 12개 통과」를 보고 다 된 줄 알았다(2026-08-09 01:3x).
 *     그 상태로 영상을 올렸으면 **아무것도 안 재고 올린 것**이 된다.
 *   ⚠ 곰곰이는 사장님 정본이라 손대지 않는다. **내 깃발을 바꾼다.**
 */
if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)?.slice(0, 160)}`); }
  };
  const 끝판 = 칸HTML(13.0);
  const 중간 = 칸HTML(7.6);

  재본다('자료에서 센 곳 수가 0이 아니다', 백년곳수, (n) => n > 0);
  재본다('큰 수가 화면에 그대로 뜬다', 중간, (h) => h.includes(`<b>${백년곳수}<span class="단위">곳</span>`));
  재본다('구 전체 곳수도 자료에서 온다', 중간, (h) => h.includes(`고등학교 ${전체곳수}곳 가운데`));
  재본다('여덟 줄이 다 있다', (중간.match(/class="줄/g) ?? []).length, 백년곳수);
  재본다('가장 이른 해가 화면에 있다', 중간, (h) => h.includes(`${가장오래된.해}년 설립`));
  재본다('가장 이른 곳이 진짜 제일 이르다', 백년넘은곳.every((x) => x.해 >= 가장오래된.해), true);
  재본다('오래된 순으로 놓았다', 백년넘은곳.map((x) => x.해), (a) => a.every((v, i) => i === 0 || a[i - 1] <= v));
  재본다('100년이 안 된 곳은 없다', 백년넘은곳.every((x) => 올해 - x.해 >= 100), true);
  /* ⛔ 안 쓰기로 한 말이 화면에 없나 */
  재본다('⛔ 「명문」이 없다', 끝판 + 중간, (h) => !/명문/.test(h));
  재본다('⛔ 「전통」이 없다', 끝판 + 중간, (h) => !/전통/.test(h));
  재본다('⛔ 「1등·최고·정답」이 없다', 끝판 + 중간, (h) => !/1등|최고|정답/.test(h));
  재본다('⛔ 「몇 년째」로 안 쓴다', 끝판 + 중간, (h) => !/년째/.test(h));
  재본다('⛔ 「가게」가 없다 — 우리 자료에 없는 것이다', 끝판 + 중간, (h) => !/가게/.test(h));
  재본다('⚠ 「여기에 없는 것」을 화면에 띄운다', 칸HTML(10.0), (h) => h.includes('여기에 없는 것'));
  재본다('출처가 끝 화면에 있다', 끝판, (h) => h.includes('NEIS'));
  재본다('멈춘 화면이 아니다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  재본다('첫 0.4초에 수가 이미 있다', 칸HTML(0.4), (h) => /class="큰수"/.test(h));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  console.log(`   ${시도} ${구} — 고등학교 ${전체곳수}곳 · 100년 넘은 곳 ${백년곳수}곳 · 가장 이른 곳 ${가장오래된.이름} ${가장오래된.해}`);
  process.exit(실패 ? 1 : 0);
}

/* ── 뽑기 ── */
const i = process.argv.indexOf('--out');
const 낼길 = i >= 0 ? process.argv[i + 1] : '종로.mp4';
const 임시 = path.join(path.dirname(낼길), '_칸100y');
fs.mkdirSync(임시, { recursive: true });

const puppeteer = require('puppeteer-core');
const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});
const p = await b.newPage();
await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });

const 칸수 = Math.round(총초 * 초당);
for (let n = 0; n < 칸수; n += 1) {
  await p.setContent(칸HTML(n / 초당), { waitUntil: 'load' });
  await p.screenshot({ path: path.join(임시, `${String(n).padStart(4, '0')}.png`) });
  if (n % 60 === 0) console.log(`  ${n}/${칸수}`);
}
await b.close();

const ff = require('ffmpeg-static');
execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png'),
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
  '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
  '-crf', '20', '-c:a', 'aac', '-b:a', '64k', '-shortest',
  '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

fs.rmSync(임시, { recursive: true, force: true });
console.log(`✅ ${낼길}  ${총초}초 · ${폭}×${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
