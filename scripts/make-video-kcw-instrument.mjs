#!/usr/bin/env node
/**
 * make-video-kcw-instrument.mjs — **K Culture Wire 쇼츠 3편.** 14초 · 1080×1920 · 영어.
 *   「어제 못 읽은 것을 자를 바꿔 읽었다」 (87편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」
 *   → 첫 0.4초에 제일 센 숫자, 매 프레임이 다름, 14초.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」
 *   → 주소를 1.6초부터 **내내** 붙인다. 끝에만 두면 끊고 나간 사람이 못 찾는다.
 *
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-titles-to-name.json` 에서 읽는다.
 * ⛔ **인과로 안 보이게 한다.** 「작품이 이름을 만든다」로 읽히면 거짓이다.
 *    화면에 「Which way the arrow points, we cannot say」를 넣는다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-instrument.mjs --out <mp4>
 *   node scripts/make-video-kcw-instrument.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

export const 초당 = 30;
export const 폭 = 1080;
export const 높 = 1920;
export const 총초 = 14;

const d = JSON.parse(fs.readFileSync('src/data/wikitip-titles-to-name.json', 'utf8'));
export const 띠 = d.bands;
export const 배수 = d.multiple;
export const 사람수 = d.actorsCounted;

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

  /* ① 0.0–2.4 — 「9.9×」가 박힌다 */
  const 큰수등장 = 툭(끼(0.0, 0.5));
  const 밑말 = 술술(끼(0.8, 1.4));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 1.9–7.0 — 막대 넷이 자란다 */
  const 표나옴 = 술술(끼(1.9, 2.4));
  const 최대 = Math.max(...띠.map((b) => b.medianRead ?? 0));
  const 막대들 = 띠.map((b, i) => {
    const 시작 = 2.2 + i * 0.32;
    const 자람 = 술술(끼(시작, 시작 + 0.6));
    const 길이 = ((b.medianRead ?? 0) / 최대) * 58 * 자람;
    const 켜짐 = 초 > 5.4 ? 1 : 0;
    return `<div class="줄${켜짐 ? ' 켬' : ''}">
      <span class="이름">${b.band}<em>${b.actors} actors</em></span>
      <span class="막대" style="width:${길이.toFixed(2)}%"></span>
      <span class="값" style="opacity:${Math.max(0, 자람 * 2 - 1).toFixed(2)}">${((b.medianRead ?? 0) * 자람).toFixed(2)}</span>
    </div>`;
  }).join('');

  /* ③ 5.4–8.0 — 어제는 안 나왔다 */
  const 짚기 = 술술(끼(5.4, 6.0));

  /* ④ 8.2–11.0 — 못 하는 말 */
  const 없는것 = 끼(8.2, 8.6);
  const 없는줄 = [
    'Which way the arrow points, we cannot say',
    'Not the ceiling — the top one-title actor beats this median',
    'Not affection — this counts people opening a page',
  ].map((s, i) => {
    const o = 술술(끼(8.6 + i * 0.3, 9.2 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${s}</li>`;
  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0e0c14;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#8f7ab5;opacity:${머리띠.toFixed(2)}}
    .큰수{position:absolute;left:84px;top:190px;opacity:${큰수등장.toFixed(2)};
          transform:scale(${(0.86 + 0.14 * 큰수등장).toFixed(3)});transform-origin:left top}
    .큰수 b{display:block;font-size:250px;font-weight:900;color:#e9e6dd;line-height:.9;letter-spacing:-.04em}
    .큰수 .밑{margin-top:22px;font-size:44px;font-weight:700;color:#c9a6ff;line-height:1.24;
              opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}
    .큰수 .잔{margin-top:14px;font-size:29px;color:#a49bb8;opacity:${밑말.toFixed(2)}}

    .표{position:absolute;left:84px;right:84px;top:790px;opacity:${표나옴.toFixed(2)}}
    .줄{display:flex;align-items:center;gap:16px;margin-bottom:26px;height:62px}
    .줄 .이름{width:270px;flex:none;font-size:33px;font-weight:700;color:#8f88a0;line-height:1.05}
    .줄 .이름 em{display:block;font-style:normal;font-size:22px;font-weight:600;color:#6a6478;margin-top:3px}
    .줄 .막대{height:34px;border-radius:6px;background:#3a3350}
    .줄 .값{font-size:34px;font-weight:800;color:#8f88a0}
    .줄.켬 .이름{color:#e9e6dd}
    .줄.켬 .막대{background:linear-gradient(90deg,#7c5cc4,#c9a6ff)}
    .줄.켬 .값{color:#c9a6ff}

    .짚{position:absolute;left:84px;right:84px;top:1310px;opacity:${짚기.toFixed(2)};
        transform:translateY(${((1 - 짚기) * 16).toFixed(1)}px)}
    .짚 em{font-style:normal;font-size:37px;font-weight:700;color:#e9e6dd;line-height:1.34}

    .없{position:absolute;left:84px;right:84px;top:1500px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:38px;font-weight:800;color:#c9a6ff;margin-bottom:16px}
    .없 li{list-style:none;font-size:30px;line-height:1.42;color:#cdc6dc;margin-bottom:9px}

    .끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:22px;opacity:${끝.toFixed(2)};
        background:radial-gradient(70% 50% at 50% 45%, rgba(14,12,20,.94), rgba(14,12,20,.99));
        transform:scale(${끝맥.toFixed(4)})}
    .끝 .ㅈ{font-size:46px;font-weight:800;color:#e9e6dd;text-align:center;line-height:1.3}
    .끝 .ㅅ{font-size:54px;font-weight:900;color:#c9a6ff;letter-spacing:-.02em;text-align:center;line-height:1.2}
    .끝 .ㄱ{font-size:29px;color:#a49bb8;text-align:center;line-height:1.4}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE · kculturewire.com</div>
    <div class="큰수">
      <b>${배수}&times;</b>
      <div class="밑">more reads for a Korean actor<br>with five charting titles</div>
      <div class="잔">than for one with a single title · ${사람수.toLocaleString('en-US')} actors · 12 months</div>
    </div>

    <div class="표">${막대들}</div>
    <div class="짚"><em>Yesterday the same actors gave us 19, 11, 18, 7 &mdash; nothing.<br>We were measuring the show, not the name.</em></div>

    <div class="없">
      <h3>What this is not</h3>
      <ul>${없는줄}</ul>
    </div>
  </div>
  <div class="끝">
    <div class="ㅈ">The question was fine.<br>The instrument was not.</div>
    <div class="ㅅ">kculturewire.com<br>/titles-to-name</div>
    <div class="ㄱ">Netflix Tudum &middot; Wikidata &middot; Wikimedia Pageviews<br>Every figure has a table behind it</div>
  </div>`;
}

/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 160)}`); }
  };
  const 글자만 = (s) => s.replace(/<style>[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  재본다('첫 프레임에 이미 숫자가 있다', 글자만(칸HTML(0.5)), (s) => /\d/.test(s));
  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.2, 3, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  재본다('배수가 자료에서 왔다', 글자만(칸HTML(1)), (s) => s.includes(String(배수)));
  재본다('사람 수가 자료에서 왔다', 글자만(칸HTML(1.5)),
    (s) => s.includes(사람수.toLocaleString('en-US')));
  재본다('띠 값이 자료에서 왔다', 글자만(칸HTML(7)),
    (s) => 띠.every((b) => b.medianRead === null || s.includes(String(b.medianRead))));
  재본다('막대 수가 띠 수와 같다', (칸HTML(6).match(/class="줄/g) ?? []).length, 띠.length);
  /* 🔴 인과로 읽히면 거짓이다 */
  재본다('⛔ 화살표 방향을 모른다고 적혀 있다', 글자만(칸HTML(10)),
    (s) => s.includes('Which way the arrow points'));
  재본다('⛔ 천장 이야기가 아니라고 적혀 있다', 글자만(칸HTML(10)), (s) => s.includes('Not the ceiling'));
  /* 🔴 외부유입용 — 주소가 가운데에도 보인다 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 숫자가 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('kculturewire.com'));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-instrument.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwinst');
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
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
    if (n % 90 === 0) console.log(`  ${n}/${칸수}`);
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
}
