#!/usr/bin/env node
/**
 * make-video-kcw.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *
 * 🔴 사장님(2026-08-08 16:3x): 「슬라이드쇼잖아. 이걸 누가 보냐」
 *   그래서 3번의 `make-video2.mjs` 뼈대를 그대로 따른다 —
 *   ① 첫 0.4초에 제일 센 숫자 ② 매 프레임이 다르다 ③ 14초.
 *
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-catalogue-depth.json` 에서 읽는다.
 *    오늘 라이브 날짜가 하루 일렀던 까닭이 손으로 박은 값이었다.
 * ⛔ **줄세우지 않는다.** 93개국을 1위부터 늘어놓는 그림을 만들지 않는다 —
 *    양 끝만 보이고 「가운데 83곳은 순서로 안 놓았다」를 화면에 적는다.
 * ⛔ **못 대는 수를 넣지 않는다.** 여기 나오는 모든 수는 /catalogue-depth 에 있다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw.mjs --out <mp4>
 *   node scripts/make-video-kcw.mjs --selftest
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

/* ── 수는 자료에서 온다 ────────────────────────────────────────── */
const d = JSON.parse(fs.readFileSync('src/data/wikitip-catalogue-depth.json', 'utf8'));
const 찾기 = (이름) => d.countries.find((c) => c.name === 이름);
export const 미국 = 찾기('United States');
export const 베트남 = 찾기('Vietnam');
export const 우크라 = 찾기('Ukraine');
export const 아시아중앙 = d.groups[0].medianDistinctTitles;
export const 그밖중앙 = d.groups[1].medianDistinctTitles;
export const 나라수 = d.countryCount;

/** 화면에 낼 다섯 — **순위가 아니라 폭**을 보이려는 것이다. 그렇게 화면에도 적는다 */
export const 보일것 = [
  { name: 'South Korea', v: 찾기('South Korea').halfTakes, 끝: true },
  /* ⚠ 큰 것부터 놓는다. 안 그러면 막대가 들쭉날쭉해 **틀린 그림처럼** 보인다.
     ⛔ 그래도 순위표가 아니다 — 화면에 「Not a ranking」을 같이 띄운다 */
  { name: 'Indonesia', v: 찾기('Indonesia').halfTakes },
  { name: 'Vietnam', v: 베트남.halfTakes, 끝: true },
  { name: 'United States', v: 미국.halfTakes, 끝: true },
  { name: 'Ukraine', v: 우크라.halfTakes, 끝: true },
];

/* ── 움직임 ── */
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

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /* ① 0.0–2.6  「6」이 박히고 밑말이 밀려 들어온다 */
  const 큰수등장 = 툭(끼(0.0, 0.55));
  const 큰수값 = Math.round(미국.halfTakes * 술술(끼(0.15, 1.0)));
  const 밑말 = 술술(끼(0.85, 1.5));

  /* ② 1.9–7.2  막대 다섯이 차례로 자란다 */
  const 표나옴 = 술술(끼(1.9, 2.4));
  const 최대 = Math.max(...보일것.map((r) => r.v));
  const 막대들 = 보일것.map((r, i) => {
    const 시작 = 2.2 + i * 0.28;
    const 자람 = 술술(끼(시작, 시작 + 0.6));
    /* ⚠ width 의 % 는 **줄 전체**를 기준으로 잡힌다. 이름 칸(290px)+틈을 빼고 남는 폭이
       대략 62% 라, 그만큼으로 눌러야 제일 긴 막대가 화면 밖으로 안 나간다.
       처음 판은 100% 로 그려 한국 줄이 오른쪽으로 잘려 나갔다. */
    const 길이 = (r.v / 최대) * 62 * 자람;
    const 켜짐 = 초 > 5.4 && r.끝 ? 1 : 0;
    return `<div class="줄${켜짐 ? ' 켬' : ''}">
      <span class="이름">${r.name}</span>
      <span class="막대" style="width:${길이.toFixed(2)}%"></span>
      <span class="값" style="opacity:${Math.max(0, 자람 * 2 - 1).toFixed(2)}">${Math.round(r.v * 자람)}</span>
    </div>`;
  }).join('');

  /* ③ 5.6–8.2  베트남 49 를 짚는다 */
  const 짚기 = 술술(끼(5.6, 6.2));

  /* ④ 8.4–11.2  없는 것 — 한 줄씩 밀려 들어온다 */
  const 없는것 = 끼(8.4, 8.8);
  const 없는줄 = [
    'Not viewing — chart places only',
    'Not taste. A title can be watched and never chart',
    `Not a ranking. ${나라수} markets; these are the two ends`,
  ].map((t, i) => `<li style="opacity:${술술(끼(8.7 + i * 0.3, 9.1 + i * 0.3)).toFixed(2)};
      transform:translateX(${(1 - 술술(끼(8.7 + i * 0.3, 9.15 + i * 0.3))) * 40}px)">${t}</li>`).join('');

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
    if (초 < 5.5) {
      /* ⚠ 처음엔 x=905·y=780~1200 에 뒀더니 **나라 이름 글자를 덮었다.**
         표 오른쪽 아래(아직 아무것도 안 나온 자리)로 내린다 */
      const 감 = 술술(끼(2.1, 5.2));
      return 놓기(880, 1500 + 감 * 120, 곰곰이(초, { 크기: 0.9, 기분: '셈' }));
    }
    if (초 < 8.2) return 놓기(880, 1620, 곰곰이(초, { 크기: 0.9, 기분: '가리킴' }));
    /* ⚠ 처음엔 y=1660 이라 **「What this is not」 글자를 덮었다.** 그 세 줄은
       이 영상에서 제일 중요한 자리다. 곰을 위로 올린다 */
    if (초 < 11.3) return 놓기(990, 1400, 곰곰이(초, { 크기: 0.75, 기분: '멀뚱' }));
    return '';
  })();
  const 끝곰 = 초 >= 11.3 ? 곰곰이(초, { 크기: 1.6 * 술술(끼(11.4, 12.0)), 기분: '인사' }) : '';

  return `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;overflow:hidden;position:relative;
         background:radial-gradient(120% 80% at 50% 12%, hsl(268 30% ${밝기 + 6}%), hsl(258 24% ${밝기}%) 70%);
         font-family:'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif;color:#f3f1ea}
    .판{position:absolute;inset:0;padding:130px 84px}

    .큰수{position:absolute;left:84px;right:84px;top:200px;text-align:center;
          transform:scale(${(0.72 + 0.28 * 큰수등장).toFixed(3)});opacity:${큰수등장.toFixed(2)}}
    .큰수 b{font-size:280px;font-weight:900;letter-spacing:-.05em;line-height:.9;
            color:#c9a6ff;text-shadow:0 10px 60px rgba(201,166,255,.3);display:block}
    .큰수 .밑{margin-top:26px;font-size:50px;font-weight:700;color:#e9e6dd;line-height:1.25;
             opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 26).toFixed(1)}px)}
    .큰수 .잔{margin-top:14px;font-size:32px;color:#a49bb8;opacity:${밑말.toFixed(2)}}

    .표{position:absolute;left:84px;right:84px;top:760px;opacity:${표나옴.toFixed(2)};
        transform:translateY(${((1 - 표나옴) * 40).toFixed(1)}px)}
    .줄{display:flex;align-items:center;gap:20px;height:104px}
    .이름{width:290px;font-size:36px;color:#a49bb8;text-align:right;white-space:nowrap}
    .막대{height:38px;border-radius:19px;background:linear-gradient(90deg,#4b3f73,#7a68b8);flex:0 0 auto}
    .줄.켬 .막대{background:linear-gradient(90deg,#8f6fd6,#c9a6ff)}
    .줄.켬 .이름{color:#c9a6ff;font-weight:800}
    .줄.켬 .값{color:#c9a6ff;font-weight:900}
    .값{font-size:38px;color:#d5cfe2;font-variant-numeric:tabular-nums;width:96px}

    .짚{position:absolute;left:84px;right:84px;top:1290px;text-align:center;
        opacity:${짚기.toFixed(2)};transform:translateY(${((1 - 짚기) * 20).toFixed(1)}px)}
    .짚 em{font-style:normal;font-size:40px;color:#e9e6dd;font-weight:700}

    .없{position:absolute;left:84px;right:84px;top:1490px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:40px;font-weight:800;color:#c9a6ff;margin-bottom:18px}
    .없 li{list-style:none;font-size:33px;line-height:1.45;color:#cdc6dc;margin-bottom:10px}

    .곰{position:absolute;pointer-events:none;transform:translate(-50%,-50%);
         filter:drop-shadow(0 16px 36px rgba(0,0,0,.42))}
    .곰 svg{display:block}
    .끝 svg{filter:drop-shadow(0 18px 42px rgba(0,0,0,.5));margin-bottom:6px}
    .끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:24px;opacity:${끝.toFixed(2)};
        background:radial-gradient(70% 50% at 50% 45%, rgba(14,12,20,.94), rgba(14,12,20,.99));
        transform:scale(${끝맥.toFixed(4)})}
    .끝 .ㅈ{font-size:52px;font-weight:800;color:#e9e6dd}
    .끝 .ㅅ{font-size:60px;font-weight:900;color:#c9a6ff;letter-spacing:-.02em;text-align:center}
    .끝 .ㄱ{font-size:31px;color:#a49bb8;text-align:center;line-height:1.4}
  </style>
  <div class="판">
    <div class="큰수">
      <b>${큰수값}</b>
      <div class="밑">Korean titles fill half of<br>America's Korean chart places</div>
      <div class="잔">Netflix top 10, ${나라수} markets, ${d.weekCount} weeks</div>
    </div>

    <div class="표">${막대들}</div>
    <div class="짚"><em>In Vietnam it takes ${베트남.halfTakes}. In Ukraine, ${우크라.halfTakes}.</em></div>

    <div class="없">
      <h3>What this is not</h3>
      <ul>${없는줄}</ul>
    </div>
    ${곰}
  </div>
  <div class="끝">
    ${끝곰}
    <div class="ㅈ">Find your country</div>
    <div class="ㅅ">kculturewire.com<br>/catalogue-depth</div>
    <div class="ㄱ">Netflix Tudum weekly top 10 · Wikidata P495<br>Every figure has a table behind it</div>
  </div>`;
}

/* ── 검사 ── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 글자만 = (s) => s.replace(/<[^>]+>/g, ' ');
  재본다('사이 — 앞/뒤/가운데', [사이(0, 1, 2), 사이(3, 1, 2), 사이(1.5, 1, 2)], (x) => x[0] === 0 && x[1] === 1 && x[2] === 0.5);
  재본다('술술 0/1', [술술(0), 술술(1)], (x) => x[0] === 0 && x[1] === 1);
  재본다('첫 프레임에 이미 숫자가 있다', 글자만(칸HTML(0.5)), (s) => /\d/.test(s));
  재본다('0.5초에 곰곰이가 있다', 칸HTML(0.5), (s) => s.includes('class="곰곰이"'));
  재본다('⛔ 슬라이드쇼가 아니다', [1.0, 2.2, 3.0, 5.0, 7.0, 9.0, 12.0].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  /* ⛔ 화면에 나온 수가 **자료의 수와 같아야** 한다. 손으로 박으면 여기서 걸린다 */
  /* 🔴 2026-08-09 02:4x — **이 세 줄이 아무것도 안 재고 있었다.**
   *   전에는 `글자만(칸HTML(7)).includes(String(값))` 이었다. 값이 6·49·2 인데
   *   같은 화면에 247·38·20 이 함께 있어서 **아무 수나 걸렸다.**
   *   ⛔ 일부러 미국 값을 6 → 7 로 틀리게 박아도 「247」의 7 에 걸려 **안 울었다.**
   *   ⭐ 그래서 **이름과 값을 묶어** 잰다. 줄 하나를 집어서 그 줄의 값을 본다.
   *
   * ⚠ 이 자가 그동안 한 번도 안 돌았다(gomgomi 가 process.exit 로 먼저 죽었다).
   *   돌게 만들자마자 **약한 시험 셋이 드러났다.** 안 돌던 검사를 켜면 이런 것이 나온다. */
  const 줄값 = (html, 이름) => {
    const m = new RegExp(`<span class="이름">${이름}</span>[\\s\\S]*?<span class="값"[^>]*>(\\d+)</span>`).exec(html);
    return m ? Number(m[1]) : null;
  };
  재본다('막대 줄에서 미국 값이 자료와 같다', 줄값(칸HTML(7), 'United States'), 미국.halfTakes);
  재본다('막대 줄에서 베트남 값이 자료와 같다', 줄값(칸HTML(7), 'Vietnam'), 베트남.halfTakes);
  재본다('막대 줄에서 우크라이나 값이 자료와 같다', 줄값(칸HTML(7), 'Ukraine'), 우크라.halfTakes);
  /* 짚는 문장도 이름과 붙여서 본다 — 문장만 고치고 표를 안 고치는 어긋남을 잡는다 */
  재본다('짚는 문장의 두 수가 자료와 같다', 글자만(칸HTML(7)),
    (s) => s.includes(`In Vietnam it takes ${베트남.halfTakes}.`)
      && s.includes(`In Ukraine, ${우크라.halfTakes}.`));
  재본다('나라 수가 자료와 같다', 글자만(칸HTML(10)), (s) => s.includes(String(나라수)));
  재본다('⛔ 줄세우기가 아니라고 화면에 적혀 있다', 글자만(칸HTML(10)), (s) => s.includes('Not a ranking'));
  재본다('⛔ 시청량이 아니라고 적혀 있다', 글자만(칸HTML(10)), (s) => s.includes('Not viewing'));
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('kculturewire.com'));
  재본다('끝에 출처가 있다', 글자만(칸HTML(13)), (s) => s.includes('Netflix Tudum'));
  재본다('막대 수가 보일것 수와 같다', (칸HTML(6).match(/class="줄/g) ?? []).length, 보일것.length);
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 뽑기 ── */
const i = process.argv.indexOf('--out');
const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts.mp4';
const 임시 = path.join(path.dirname(낼길), '_칸kcw');
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
