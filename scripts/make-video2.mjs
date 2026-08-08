#!/usr/bin/env node
/**
 * make-video2.mjs — **쇼츠**. 슬라이드쇼가 아니다.
 *
 * 🔴 왜 다시 만드나 — 사장님(2026-08-08 16:3x): **「슬라이드쇼잖아. 이걸 누가 보냐」**
 *   맞다. 앞 것(`make-video.mjs`)은 장면 다섯을 3~5초씩 **세워 둔** 것이었다.
 *   쇼츠는 손가락이 늘 올라가 있다. **한 순간도 안 움직이면 넘긴다.**
 *
 * 그래서 바꾼 것 — 셋이다.
 *   ① **첫 0.4초에 제일 센 숫자가 나온다.** 제목·인사·설명 없음
 *   ② **매 프레임이 다르다.** 막대가 자라고, 숫자가 올라가고, 글자가 밀려 들어온다
 *   ③ **14초.** 21초는 길다. 쇼츠는 끝까지 본 비율이 전부다
 *
 * ⛔ 「멈춰 있는 화면 + 페이드」로 돌아가지 마십시오. 그게 슬라이드쇼입니다.
 *
 * 쓰는 법
 *   node scripts/make-video2.mjs --out <mp4>
 *   node scripts/make-video2.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { 곰곰이 } from './gomgomi.mjs';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

export const 초당 = 30;
export const 폭 = 1080, 높 = 1920;
export const 총초 = 14;

/* 강동구 — 진학률이 있는 12곳. 라이브 /report/area/서울특별시-강동구 에서 읽은 값 */
export const 학교 = [
  ['강동고', 93.2], ['강일고', 78.6], ['선사고', 73.4], ['성덕고', 70.4],
  ['명일여고', 67.6], ['둔촌고', 66.8], ['광문고', 65.9], ['동북고', 65.2],
  ['상일여고', 63.9], ['한영외고', 63.3], ['한영고', 58.3], ['배재고', 53.4],
];
export const 낮 = 53.4, 높값 = 93.2, 가운데 = 66.4, 벌어짐 = 39.8;

/* ── 움직임 ── */
/** 0→1. 뒤로 갈수록 느려진다 */
export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
/** 살짝 튀고 멎는다 — 숫자가 「탁」 박히는 느낌 */
export const 툭 = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.70158 + 1;
  return 1 + c * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
};
/** 구간 안에서의 진행도 0→1. 밖이면 0 또는 1 */
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}

/**
 * 한 프레임의 화면.
 * ⚠ **모든 값이 `초` 의 함수**다. 상수를 쓰면 그 자리가 멈춘다 — 그게 슬라이드쇼다.
 */
export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /* ① 0.0–2.6  숫자가 박히고, 밑에 말이 밀려 들어온다 */
  const 큰수등장 = 툭(끼(0.0, 0.55));
  const 큰수값 = (벌어짐 * 술술(끼(0.15, 1.1))).toFixed(1);
  const 밑말 = 술술(끼(0.85, 1.5));

  /* ② 1.9–7.0  막대 열둘이 차례로 자란다 */
  const 표나옴 = 술술(끼(1.9, 2.4));
  const 막대들 = 학교.map(([이름, 값], i) => {
    const 시작 = 2.15 + i * 0.075;
    const 자람 = 술술(끼(시작, 시작 + 0.5));
    const 길이 = ((값 - 45) / (100 - 45)) * 100 * 자람;
    const 맨위 = i === 0, 맨아래 = i === 학교.length - 1;
    const 켜짐 = 초 > 4.6 && (맨위 || 맨아래) ? 1 : 0;
    return `<div class="줄${켜짐 ? ' 켬' : ''}">
      <span class="이름">${이름}</span>
      <span class="막대" style="width:${길이.toFixed(2)}%"></span>
      <span class="값" style="opacity:${Math.max(0, 자람 * 2 - 1).toFixed(2)}">${(값 * 자람).toFixed(1)}</span>
    </div>`;
  }).join('');

  /* ③ 5.0–8.6  가운데 선이 미끄러져 들어온다 */
  const 선진행 = 술술(끼(5.0, 5.8));
  const 선왼쪽 = ((가운데 - 45) / (100 - 45)) * 100;

  /* ④ 8.4–11.2  없는 것 — 글자가 한 줄씩 */
  const 없는것 = 끼(8.4, 8.8);
  const 없는줄 = ['등수를 매기지 않습니다', '학교를 재는 것이지 아이가 아닙니다', '진학률이 없는 곳도 자리에 둡니다']
    .map((t, i) => `<li style="opacity:${술술(끼(8.7 + i * 0.28, 9.1 + i * 0.28)).toFixed(2)};
      transform:translateX(${(1 - 술술(끼(8.7 + i * 0.28, 9.15 + i * 0.28))) * 40}px)">${t}</li>`).join('');

  /* ⑤ 11.4–14  끝 */
  const 끝 = 술술(끼(11.4, 11.9));
  const 끝맥 = 1 + Math.sin(초 * 5) * 0.012 * 끝;   // 숨 쉬듯 — 완전히 멈추지 않게

  /* 배경이 아주 천천히 밝아진다 — 화면 전체가 늘 조금씩 변한다 */
  const 밝기 = 6 + 초 * 0.5;

  /* ⭐ 곰곰이가 장면을 끌고 간다 — 어디에 서서 무슨 표정인지가 초마다 바뀐다.
   *   ⚠ 곰곰이는 **자기 자리를 모른다**(정본이라 어디서든 쓰이려고 그렇게 뒀다).
   *     자리는 여기서 감싸서 준다 */
  const 놓기 = (x, y, 속) => `<div class="곰" style="left:${x}px;top:${y}px">${속}</div>`;

  const 곰 = (() => {
    if (초 < 1.8) {                     /* 숫자 옆에서 놀란다 */
      const 뜸 = 툭(끼(0.25, 0.8));
      return 놓기(838, 340 + (1 - 뜸) * 140, 곰곰이(초, { 크기: 1.05 * 뜸, 기분: '놀람' }));
    }
    if (초 < 5.0) {                     /* 막대를 따라 내려오며 센다 */
      const 감 = 술술(끼(2.0, 4.8));
      return 놓기(905, 720 + 감 * 620, 곰곰이(초, { 크기: 0.85, 기분: '셈' }));
    }
    if (초 < 8.2) {                     /* 가운데 선을 가리킨다 */
      return 놓기(190, 640, 곰곰이(초, { 크기: 0.9, 기분: '가리킴' }));
    }
    if (초 < 11.3) {                    /* 「없는 것」 옆에서 멀뚱 */
      return 놓기(872, 1660, 곰곰이(초, { 크기: 0.85, 기분: '멀뚱' }));
    }
    return '';                           /* 끝 화면 것은 아래에서 따로 크게 */
  })();

  const 끝곰 = 초 >= 11.3
    ? 곰곰이(초, { 크기: 1.6 * 술술(끼(11.4, 12.0)), 기분: '인사' })
    : '';

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
    .큰수 .밑{margin-top:26px;font-size:52px;font-weight:700;color:#e9e6dd;
             opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 26).toFixed(1)}px)}
    .큰수 .잔{margin-top:12px;font-size:34px;color:#9aa3b2;opacity:${밑말.toFixed(2)}}

    .표{position:absolute;left:84px;right:84px;top:640px;opacity:${표나옴.toFixed(2)};
        transform:translateY(${((1 - 표나옴) * 40).toFixed(1)}px)}
    .줄{display:flex;align-items:center;gap:20px;height:74px}
    .이름{width:210px;font-size:33px;color:#98a1b0;text-align:right;white-space:nowrap}
    .막대{height:30px;border-radius:15px;background:linear-gradient(90deg,#3f5c8a,#6d8fc4);flex:0 0 auto}
    .줄.켬 .막대{background:linear-gradient(90deg,#c9973a,#f0c85a)}
    .줄.켬 .이름{color:#f0c85a;font-weight:800}
    .줄.켬 .값{color:#f0c85a;font-weight:900}
    .값{font-size:33px;color:#c9cfd9;font-variant-numeric:tabular-nums;width:104px}

    .선{position:absolute;left:calc(84px + 230px);right:84px;top:640px;height:${학교.length * 74}px;
        pointer-events:none;opacity:${선진행.toFixed(2)}}
    .선 i{position:absolute;top:0;bottom:0;width:3px;background:#e9e6dd;opacity:.55;
          left:${선왼쪽.toFixed(2)}%;box-shadow:0 0 24px rgba(233,230,221,.5)}
    .선 em{position:absolute;left:${선왼쪽.toFixed(2)}%;top:-58px;transform:translateX(-50%);
           font-style:normal;font-size:31px;color:#e9e6dd;white-space:nowrap;font-weight:700}

    .없{position:absolute;left:84px;right:84px;top:1560px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:40px;font-weight:800;color:#f0c85a;margin-bottom:18px}
    .없 li{list-style:none;font-size:34px;line-height:1.5;color:#cdd4de;margin-bottom:8px}

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
    .끝 .ㄱ{font-size:34px;color:#9aa3b2}
  </style>
  <div class="판">
    <div class="큰수">
      <b>${큰수값}<span class="단위">%p</span></b>
      <div class="밑">같은 구 안에서도 이만큼 다릅니다</div>
      <div class="잔">서울 강동구 고등학교 12곳 · 대학 진학률</div>
    </div>

    <div class="표">${막대들}</div>
    <div class="선"><i></i><em>한가운데 ${가운데}%</em></div>

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
    <div class="ㄱ">학교알리미 2024 공시 · 공공누리 제1유형</div>
  </div>`;
}

/* ── 검사 ── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('사이 — 앞', 사이(0, 1, 2), 0);
  재본다('사이 — 뒤', 사이(3, 1, 2), 1);
  재본다('사이 — 가운데', 사이(1.5, 1, 2), 0.5);
  재본다('사이 — 길이 0 이어도 안 죽는다', 사이(5, 2, 2), 1);
  재본다('술술 0/1', [술술(0), 술술(1)], (x) => x[0] === 0 && x[1] === 1);
  재본다('툭도 1 에서 끝난다', 툭(1), 1);
  /* ⚠ 숫자와 %p 사이에 <span> 이 낀다. 화면 글자만 뽑아 놓고 잰다 —
   *   마크업째로 재다가 「숫자가 없다」고 잘못 걸렸다 */
  const 글자만 = (s) => s.replace(/<[^>]+>/g, '');
  재본다('첫 프레임에 이미 숫자가 있다', 글자만(칸HTML(0.5)), (s) => /\d+\.\d%p/.test(s));
  재본다('0.5초에 곰곰이가 이미 있다', 칸HTML(0.5), (s) => s.includes('class="곰곰이"'));
  재본다('곰곰이가 장면마다 달라진다',
    [칸HTML(1.0), 칸HTML(3.5), 칸HTML(6.5), 칸HTML(13)]
      .map((s) => (s.match(/<svg class="곰"[\s\S]*?<\/svg>/) ?? [''])[0]),
    (xs) => new Set(xs).size === xs.length);
  재본다('⛔ 슬라이드쇼가 아니다 — 이웃 프레임이 다르다',
    [2.0, 2.1, 3.0, 5.0, 7.0, 9.0, 12.0].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('막대가 자란다', [칸HTML(2.3), 칸HTML(3.5)], (x) => x[0] !== x[1]);
  재본다('끝 화면에 주소가 있다', 칸HTML(13), (s) => s.includes('100yearmap.com'));
  재본다('출처가 들어 있다', 칸HTML(13), (s) => s.includes('공공누리'));
  재본다('「여기에 없는 것」이 있다', 칸HTML(10), (s) => s.includes('여기에 없는 것'));
  재본다('학교 수와 막대 수가 같다', (칸HTML(6).match(/class="줄/g) ?? []).length, 학교.length);
  재본다('마지막 프레임도 움직인다(숨)', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 뽑기 ── */
const i = process.argv.indexOf('--out');
const 낼길 = i >= 0 ? process.argv[i + 1] : 'shorts.mp4';
const 임시 = path.join(path.dirname(낼길), '_칸');
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
