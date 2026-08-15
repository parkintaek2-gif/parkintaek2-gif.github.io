#!/usr/bin/env node
/**
 * make-video-kcw-oneout.mjs — **K Culture Wire 쇼츠 11편.** 14초 · 1080×1920 · 영어.
 *   「하나를 빼 보면 어느 답이 답인지 알 수 있다」 (94편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 첫 0.4초에 제일 센 것, 매 프레임이 다름.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-one-out.json` 에서 읽는다.
 * ⛔⛔ **「우리가 틀렸다」로 팔지 않는다.** 흔들리는 답은 **아직 답이 아닌 것**이지 거짓이 아니다.
 *    그 말이 안 하는 말 첫 줄에 있어야 한다.
 * ⭐ 첫 화면에 **두 배수가 같이** 있어야 한다 — 0배와 0.89배. 하나만 뜨면 뜻이 없다.
 * ⛔ **사분위가 못 가른다는 것**을 표에 넣는다. 그것이 이 편의 값어치다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-oneout.mjs --out <mp4>
 *   node scripts/make-video-kcw-oneout.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-one-out.json', 'utf8'));
export const 단단 = d.findings.find((f) => f.atFirstPublication.verdict?.steady);
export const 흔들 = d.findings.find((f) => f.atFirstPublication.verdict?.steady === false);
export const 판 = d.findings;
/** ⛔ 부호를 손으로 안 박는다 */
export const 몫 = (v) => `${v > 0 ? '+' : '\u2212'}${Math.abs(v).toFixed(1)}%`;
/** 작품 제목에서 괄호 설명을 뗀다 — 화면이 좁다 */
export const 짧은제목 = (t) => t.replace(/\s*\(.*\)$/, '');

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

  /**
   * ① 0.0–2.2 — **파도 배수와 남은 것이 같이 박힌다.**
   * ⛔ 배수만 먼저 띄우면 그 사이 프레임이 「2.2배 올랐다」 단독 화면이 된다. 같이 올린다.
   */
  const 둘등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–7.0 — 다섯 줄이 하나씩 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  /* ⭐ 두 줄뿐이다 — 그것이 요점이다. 흔히 쓰는 자와 이 자를 나란히 놓는다 */
  const 표줄 = 판.map((f, i) => {
    const 때 = 3.0 + i * 0.6;
    const o = 술술(끼(때, 때 + 0.4));
    /* ⭐ 단단한 줄과 흔들리는 줄을 다르게 칠한다 */
    const 결 = f.atFirstPublication.verdict?.steady ? ' 올' : ' 내';
    return `<tr style="opacity:${o.toFixed(2)}">`
      + `<td class="ㄹ">${짧은제목(f.what)}</td>`
      + `<td class="ㅂ">${f.atFirstPublication.iqr?.overMedian ?? 0}×</td>`
      + `<td class="ㅅ${결}">${f.atFirstPublication.oneOut.swingOverMedian}×</td></tr>`;
  }).join('');
  /* ③ 5.4–8.0 */
  const 짚기 = 술술(끼(5.4, 6.0));

  /* ④ 8.2–11.0 — 안 하는 말 */
  const 없는것 = 끼(8.2, 8.6);
  const 없는줄 = [
    'Not that the corrected figure was false \u2014 it was a real median of five real values '
      + 'that happened not to be stable',
    'Not that a steady median is a true one \u2014 a biased sample can be very steady and wrong',
    'Not a study of findings \u2014 this is two of our own, on one day',
  ].map((t, i) => {
    const o = 술술(끼(8.6 + i * 0.3, 9.2 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${t}</li>`;  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0e0c14;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#8f7ab5;opacity:${머리띠.toFixed(2)}}
    .큰{position:absolute;left:84px;right:84px;top:180px;opacity:${둘등장.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 둘등장).toFixed(3)});transform-origin:left top}
    .둘{display:flex;align-items:baseline;gap:26px}
    .둘 b{font-size:126px;font-weight:900;line-height:.9;letter-spacing:-.04em}
    .둘 .ㄴ{color:#e9e6dd}
    .둘 .ㅇ{color:#c9a6ff}
    .둘 i{font-style:normal;font-size:48px;font-weight:700;color:#6a6478}
    .큰 span{display:block;margin-top:18px;font-size:34px;font-weight:700;color:#c9a6ff;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:470px;font-size:34px;color:#a49bb8;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}

    .표{position:absolute;left:84px;right:84px;top:690px;opacity:${표나옴.toFixed(2)}}
    table{width:100%;border-collapse:collapse}
    th{font-size:24px;font-weight:700;color:#8f88a0;text-align:right;padding:0 0 12px}
    th:first-child{text-align:left}
    td{padding:16px 0;border-top:1px solid #241f31}
    .ㄹ{font-size:30px;font-weight:700;color:#cdc6dc}
    .ㅂ{font-size:32px;color:#8f88a0;text-align:right}
    .ㅅ{font-size:38px;font-weight:900;text-align:right;letter-spacing:-.02em}
    .ㅅ.내{color:#e9e6dd}
    .ㅅ.올{color:#c9a6ff}
    .범{margin-top:16px;font-size:24px;color:#8f88a0;line-height:1.4}

    .짚{position:absolute;left:84px;right:84px;top:1200px;opacity:${짚기.toFixed(2)};
        transform:translateY(${((1 - 짚기) * 16).toFixed(1)}px)}
    .짚 em{font-style:normal;font-size:36px;font-weight:700;color:#e9e6dd;line-height:1.34}

    .없{position:absolute;left:84px;right:84px;top:1440px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:35px;font-weight:800;color:#c9a6ff;margin-bottom:14px}
    .없 li{list-style:none;font-size:26px;line-height:1.4;color:#cdc6dc;margin-bottom:9px}

    .끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:22px;opacity:${끝.toFixed(2)};
        background:radial-gradient(70% 50% at 50% 45%, rgba(14,12,20,.94), rgba(14,12,20,.99));
        transform:scale(${끝맥.toFixed(4)})}
    .끝 .ㅈ{font-size:46px;font-weight:800;color:#e9e6dd;text-align:center;line-height:1.3}
    .끝 .ㅅ2{font-size:52px;font-weight:900;color:#c9a6ff;letter-spacing:-.02em;text-align:center;line-height:1.2}
    .끝 .ㄱ{font-size:29px;color:#a49bb8;text-align:center;line-height:1.4}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE &middot; kculturewire.com</div>
    <div class="큰">
      <div class="둘">
        <b class="ㄴ">${단단.atFirstPublication.oneOut.swingOverMedian}×</b><i>vs</i><b class="ㅇ">${흔들.atFirstPublication.oneOut.swingOverMedian}×</b>
      </div>
      <span>How far each of two published medians moved when<br>any single title was removed from the sample.</span>
    </div>
    <div class="밑">We published both this morning.
      By evening we had corrected one of them.</div>

    <div class="표">
      <table>
        <thead><tr><th>Finding</th><th>IQR &divide; median</th><th>One-out &divide; median</th></tr></thead>
        <tbody>${표줄}</tbody>
      </table>
      <div class="범">The interquartile range rates them 1.5 against 1.8 &mdash; nearly the same.<br>Leave-one-out rates them 0 against 0.89.</div>
    </div>
    <div class="짚"><em>The IQR never has to look at the one<br>extreme value. This check does.</em></div>

    <div class="없">
      <h3>What we are not saying</h3>
      <ul>${없는줄}</ul>
    </div>
  </div>
  <div class="끝">
    <div class="ㅈ">It cost one line.<br>We ran it too late.</div>
    <div class="ㅅ2">kculturewire.com<br>/one-out</div>
    <div class="ㄱ">Wikimedia Pageviews &middot; our own two findings<br>Every figure has a table behind it</div>
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

  /**
   * 🔴 **첫 화면에 배수 하나만 뜨면 뜻이 없다.** 「0배」만 보면 자랑이고,
   *   「0.89배」만 보면 자책이다. 이 편은 **둘을 나란히 놓는 것**이 전부다.
   */
  재본다('⛔ 첫 화면에 두 배수가 같이 있다', 글자만(칸HTML(0.6)),
    (s) => s.includes(String(단단.atFirstPublication.oneOut.swingOverMedian))
      && s.includes(String(흔들.atFirstPublication.oneOut.swingOverMedian)));
  재본다('⛔ 한쪽만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(칸HTML(t));
      return x.includes(`${흔들.atFirstPublication.oneOut.swingOverMedian}×`)
        === x.includes(`${단단.atFirstPublication.oneOut.swingOverMedian}×`);
    }), (xs) => xs.every(Boolean));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  재본다('표가 두 줄이다', (칸HTML(7).match(/class="ㄹ"/g) ?? []).length, 판.length);
  /* ⭐ 사분위가 못 가른다는 것이 화면에 있어야 한다 */
  재본다('⭐ 사분위 값이 화면에 있다', 글자만(칸HTML(7)),
    (s) => 판.every((f) => s.includes(`${f.atFirstPublication.iqr?.overMedian}×`)));
  재본다('⭐ 사분위가 못 가른다고 적는다', 글자만(칸HTML(7)),
    (s) => /nearly the same/.test(s));
  재본다('⭐ 단단한 줄만 다른 빛이다', (칸HTML(7).match(/class="ㅅ 올"/g) ?? []).length,
    판.filter((f) => f.atFirstPublication.verdict?.steady).length);

  /* 🔴 기사가 조심한 것은 영상도 조심한다 */
  재본다('⛔ 「틀렸다」가 아니라고 적는다', 글자만(칸HTML(10)),
    (s) => /was false/.test(s) && /not to be stable/.test(s));
  재본다('⛔ 단단한 것이 참은 아니라고 적는다', 글자만(칸HTML(10)),
    (s) => /biased sample/.test(s));
  재본다('⭐ 끝에 세우는 것이 「한 줄이면 됐다」', 글자만(칸HTML(13)),
    (s) => /It cost one line\.\s*We ran it too late/.test(s.replace(/\s+/g, ' ')));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/one-out'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)), (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-oneout.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwoneout');
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
