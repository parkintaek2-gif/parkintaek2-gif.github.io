#!/usr/bin/env node
/**
 * make-video-kcw-season.mjs — **K Culture Wire 쇼츠 7편.** 14초 · 1080×1920 · 영어.
 *   「두 자가 만나는 자리는 봉우리가 아니라 바닥이다」 (90편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 첫 0.4초에 제일 센 것, 매 프레임이 다름.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-look-vs-fly.json` 에서 읽는다.
 * ⛔ **「12월에 알아보고 1월에 간다」로 읽히면 거짓이다.**
 *    기사가 본문 한가운데서 그 읽기를 부정했다. 영상도 화면에 그 말을 넣는다 —
 *    카드도 영상도 **기사보다 앞서면 안 된다.**
 * ⭐ 그래서 마지막에 세우는 것은 봉우리가 아니라 **바닥이 같은 달**이다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-season.mjs --out <mp4>
 *   node scripts/make-video-kcw-season.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-look-vs-fly.json', 'utf8'));
export const 달이름 = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
export const 달말 = (mm) => 달이름[Number(mm) - 1] ?? mm;
export const 짧은달 = (mm) => (달이름[Number(mm) - 1] ?? mm).slice(0, 3);
export const 달들 = Object.keys(d.lookFolded).sort();
export const 읽봉 = d.lookPeak;
export const 비봉 = d.flyPeak;

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

  /* ① 0.0–2.2 — 바닥 달 이름이 먼저 박힌다. 그것이 이 편의 요점이다 */
  const 바닥등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.2–7.0 — 열두 달 막대 둘이 나란히 자란다 */
  const 표나옴 = 술술(끼(2.2, 2.7));
  const 읽최대 = Math.max(...달들.map((m) => d.lookFolded[m]));
  const 비최대 = Math.max(...달들.map((m) => d.flyFolded[m]));
  const 막대 = 달들.map((m, i) => {
    const 시작 = 2.5 + i * 0.13;
    const 자람 = 술술(끼(시작, 시작 + 0.4));
    const ㅇ = (d.lookFolded[m] / 읽최대) * 100 * 자람;
    const ㅂ = (d.flyFolded[m] / 비최대) * 100 * 자람;
    /* 바닥 달을 켠다 — 눈이 6월로 간다 */
    const 켬 = m === 읽봉.trough && 초 > 5.2 ? ' 켬' : '';
    return `<div class="달${켬}"><span class="쌍">`
      + `<i class="ㅇ" style="height:${ㅇ.toFixed(1)}%"></i>`
      + `<i class="ㅂ" style="height:${ㅂ.toFixed(1)}%"></i></span>`
      + `<b>${짧은달(m)}</b></div>`;
  }).join('');

  /* ③ 5.2–8.0 — 무엇을 보라는 말 */
  const 짚기 = 술술(끼(5.2, 5.8));

  /* ④ 8.2–11.0 — 안 하는 말 */
  const 없는것 = 끼(8.2, 8.6);
  const 없는줄 = [
    `Not that ${달말(읽봉.peak)} looking causes ${달말(비봉.peak)} flying`,
    'Not a correlation — 23 months and one shared season would make one look certain',
    'Not Southeast Asia in the air figures — that row holds India and Central Asia too',
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
    .큰{position:absolute;left:84px;right:84px;top:180px;opacity:${바닥등장.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 바닥등장).toFixed(3)});transform-origin:left top}
    .큰 b{display:block;font-size:186px;font-weight:900;color:#e9e6dd;line-height:.9;letter-spacing:-.04em}
    .큰 span{display:block;margin-top:16px;font-size:38px;font-weight:700;color:#c9a6ff;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:452px;font-size:34px;color:#a49bb8;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}

    .표{position:absolute;left:84px;right:84px;top:640px;opacity:${표나옴.toFixed(2)}}
    .칸들{display:flex;gap:12px;align-items:flex-end;height:330px}
    .달{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}
    .쌍{display:flex;gap:4px;align-items:flex-end;width:100%;height:100%}
    .쌍 i{flex:1;display:block;border-radius:5px 5px 0 0}
    .ㅇ{background:#7c5cc4}
    .ㅂ{background:#3a3350}
    .달 b{font-size:21px;font-weight:700;color:#6a6478;margin-top:9px}
    .달.켬 .ㅇ{background:linear-gradient(180deg,#c9a6ff,#7c5cc4)}
    .달.켬 .ㅂ{background:#8f7ab5}
    .달.켬 b{color:#c9a6ff}
    .범{margin-top:16px;font-size:25px;color:#8f88a0}
    .범 em{font-style:normal;color:#c9a6ff}

    .짚{position:absolute;left:84px;right:84px;top:1090px;opacity:${짚기.toFixed(2)};
        transform:translateY(${((1 - 짚기) * 16).toFixed(1)}px)}
    .짚 em{font-style:normal;font-size:37px;font-weight:700;color:#e9e6dd;line-height:1.34}

    .없{position:absolute;left:84px;right:84px;top:1500px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:36px;font-weight:800;color:#c9a6ff;margin-bottom:14px}
    .없 li{list-style:none;font-size:28px;line-height:1.4;color:#cdc6dc;margin-bottom:8px}

    .끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:22px;opacity:${끝.toFixed(2)};
        background:radial-gradient(70% 50% at 50% 45%, rgba(14,12,20,.94), rgba(14,12,20,.99));
        transform:scale(${끝맥.toFixed(4)})}
    .끝 .ㅈ{font-size:46px;font-weight:800;color:#e9e6dd;text-align:center;line-height:1.3}
    .끝 .ㅅ{font-size:54px;font-weight:900;color:#c9a6ff;letter-spacing:-.02em;text-align:center;line-height:1.2}
    .끝 .ㄱ{font-size:29px;color:#a49bb8;text-align:center;line-height:1.4}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE &middot; kculturewire.com</div>
    <div class="큰">
      <b>${달말(읽봉.trough)}</b>
      <span>the month both the looking and the flying<br>fall to their lowest</span>
    </div>
    <div class="밑">Looking peaks in ${달말(읽봉.peak)}. Flying peaks in ${달말(비봉.peak)}.
      That gap is the easy thing to notice &mdash; and the weakest.</div>

    <div class="표">
      <div class="칸들">${막대}</div>
      <div class="범"><em>&#9646; looking</em> (per million) &nbsp; &#9646; flying (passengers)</div>
    </div>
    <div class="짚"><em>Reading swings ${읽봉.ratio}&times; across the year.<br>Seats swing ${비봉.ratio}&times;.</em></div>

    <div class="없">
      <h3>What we are not saying</h3>
      <ul>${없는줄}</ul>
    </div>
  </div>
  <div class="끝">
    <div class="ㅈ">The two rulers meet<br>where nothing happens.</div>
    <div class="ㅅ">kculturewire.com<br>/look-vs-fly</div>
    <div class="ㄱ">Wikimedia Pageviews &middot; KOSIS<br>Every figure has a table behind it</div>
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
  재본다('첫 프레임에 이미 요점이 있다', 글자만(칸HTML(0.6)), (s) => s.includes(달말(읽봉.trough)));
  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  재본다('막대가 열두 달만큼', (칸HTML(7).match(/class="달[^"]*"/g) ?? []).length, 12);
  재본다('진폭이 자료에서 왔다', 글자만(칸HTML(6)),
    (s) => s.includes(String(읽봉.ratio)) && s.includes(String(비봉.ratio)));
  재본다('두 봉우리 달이 자료에서 왔다', 글자만(칸HTML(2)),
    (s) => s.includes(달말(읽봉.peak)) && s.includes(달말(비봉.peak)));
  /* 🔴 이 편에서 제일 조심하는 자리 */
  재본다('⛔ 앞선 봉우리를 원인으로 안 읽게 적는다', 글자만(칸HTML(10)),
    (s) => s.includes(`Not that ${달말(읽봉.peak)} looking causes`));
  재본다('⛔ 상관을 안 낸다고 적는다', 글자만(칸HTML(10)), (s) => /Not a correlation/.test(s));
  재본다('⛔ 아시아가 동남아가 아니라고 적는다', 글자만(칸HTML(10)),
    (s) => /India and Central Asia/.test(s));
  재본다('⭐ 끝에 세우는 것이 바닥이다', 글자만(칸HTML(13)),
    (s) => /meet\s+where nothing happens/.test(s.replace(/\s+/g, ' ')));
  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('kculturewire.com'));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-season.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwseason');
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
