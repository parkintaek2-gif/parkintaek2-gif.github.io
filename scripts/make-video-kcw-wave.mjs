#!/usr/bin/env node
/**
 * make-video-kcw-wave.mjs — **K Culture Wire 쇼츠 9편.** 14초 · 1080×1920 · 영어.
 *   「파도는 크고, 자국은 없다」 (92편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 첫 0.4초에 제일 센 것, 매 프레임이 다름.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-wave-floor.json` 에서 읽는다.
 * ⛔ **오징어게임 35배를 화면에 크게 띄우지 않는다.** 그 편은 표에서 **뺀** 것이다 —
 *    뒤바닥에 시즌 3 이 들어앉아 있었다. 영상이 기사보다 앞서면 안 된다.
 *    ⭐ 대신 「가장 큰 파도인데 쓸 수 없었다」를 **안 하는 말**에 넣는다.
 * ⛔ **평균을 쓰지 않는다.** 다섯 편에서 평균은 +0.8% 로 「그대로다」가 된다.
 * ⛔ **다섯이라는 수를 감추지 않는다.** 첫 화면부터 몇 편인지 보인다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-wave.mjs --out <mp4>
 *   node scripts/make-video-kcw-wave.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-wave-floor.json', 'utf8'));
export const 답 = d.answer;
export const 잰것 = d.titlesMeasured;
export const 큰파도 = 답.biggestWave;
export const 못잰수 = d.titlesNotMeasured.length;
/** ⭐ 이 편의 요점 — 신작에는 「전」이 없다. 문서가 작품과 함께 생긴다 */
export const 태어난것 = d.titlesNotMeasured.filter((t) => /did not exist/.test(t.why));

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
  const 표줄 = 잰것.map((t, i) => {
    const 때 = 3.0 + i * 0.45;
    const o = 술술(끼(때, 때 + 0.35));
    /* ⭐ 내려간 줄과 올라간 줄을 다르게 칠한다 — 넷이 내려갔다는 것이 한눈에 보여야 한다 */
    const 결 = t.floorChangePc > 0 ? ' 올' : ' 내';
    return `<tr style="opacity:${o.toFixed(2)}"><td class="ㄹ">${짧은제목(t.title)}</td>`
      + `<td class="ㅂ">${t.peakOverFloor}×</td>`
      + `<td class="ㅅ${결}">${몫(t.floorChangePc)}</td></tr>`;
  }).join('');

  /* ③ 5.4–8.0 */
  const 짚기 = 술술(끼(5.4, 6.0));

  /* ④ 8.2–11.0 — 안 하는 말 */
  const 없는것 = 끼(8.2, 8.6);
  const 없는줄 = [
    큰파도
      ? `Not ${짧은제목(큰파도.title)} \u2014 the biggest ratio here at ${큰파도.peakOverFloor}×, `
        + 'and unusable because its floor before the wave was almost nobody'
      : 'Not the biggest wave \u2014 it could not be measured',
    `Not a survey \u2014 ${못잰수} of the ${답.measured + 못잰수} titles could not be measured at all`,
    'Not new hits \u2014 the measured titles are back catalogue rising again, the only kind '
      + 'with a floor to compare against',
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
        <b class="ㄴ">${답.measured}</b><i>of</i><b class="ㅇ">${답.measured + 못잰수}</b>
      </div>
      <span>Korean titles with a floor on both sides of their peak.<br>${태어난것.length} have no floor because the article is born with the show.</span>
    </div>
    <div class="밑">A percentage change from nothing is not a small number.
      It is not a number.</div>

    <div class="표">
      <table>
        <thead><tr><th>Title</th><th>Peak &divide; floor</th><th>Floor after</th></tr></thead>
        <tbody>${표줄}</tbody>
      </table>
      <div class="범">Reads per million reads of that Wikipedia, four editions.<br>Median, not mean &mdash; with five titles one moves the mean alone.</div>
    </div>
    <div class="짚"><em>Median floor afterwards ${몫(답.floorChangeMedianPc)}.<br>${답.floorsThatRose} of ${답.measured} ended higher.</em></div>

    <div class="없">
      <h3>What we are not saying</h3>
      <ul>${없는줄}</ul>
    </div>
  </div>
  <div class="끝">
    <div class="ㅈ">Only back catalogue<br>can answer this.</div>
    <div class="ㅅ2">kculturewire.com<br>/wave-and-floor</div>
    <div class="ㄱ">Wikimedia Pageviews &middot; human traffic only<br>Every figure has a table behind it</div>
  </div>`;
}

if (process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 160)}`); }
  };
  const 글자만 = (s) => s.replace(/<style>[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');

  /**
   * 🔴 **이 편에서 제일 조심하는 자리.** 첫 화면에 「2.2배」만 뜨면 「파도가 컸다」로만 읽힌다.
   *   요점은 그 뒤에 남은 것이 없다는 쪽이다. 두 수가 **어느 프레임에서도 같이** 있어야 한다.
   */
  /**
   * 🔴 첫 화면이 「몇 편만 물을 수 있나」다. 잰 수만 크게 뜨면 「여섯 편을 쟀다」로 읽히고,
   *   **왜 여섯뿐인지**가 요점인데 그것이 빠진다. 둘이 늘 같이 있어야 한다.
   */
  재본다('⛔ 첫 화면에 잰 수와 전체가 같이 있다', 글자만(칸HTML(0.6)),
    (s) => s.includes(String(답.measured)) && s.includes(String(답.measured + 못잰수)));
  재본다('⭐ 첫 화면에 왜 못 재는지가 있다', 글자만(칸HTML(1.6)),
    (s) => /born with the show/.test(s) && s.includes(String(태어난것.length)));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  재본다('표가 잰 작품 수만큼이다', (칸HTML(7).match(/class="ㄹ"/g) ?? []).length, 잰것.length);
  재본다('작품마다 두 수가 다 있다', 글자만(칸HTML(7)),
    (s) => 잰것.every((t) => s.includes(몫(t.floorChangePc)) && s.includes(`${t.peakOverFloor}×`)));
  /* ⭐ 내려간 줄과 올라간 줄을 다르게 칠한다 */
  재본다('⭐ 올라간 줄만 다른 빛이다', (칸HTML(7).match(/class="ㅅ 올"/g) ?? []).length,
    잰것.filter((t) => t.floorChangePc > 0).length);

  /**
   * 🔴 기사가 뺀 것은 영상도 뺀다.
   * ⚠ 처음엔 화면 전체에서 「Squid」를 찾았는데, **안 하는 말** 절이 그 이름을 일부러 말하므로
   *   걸렸다. 검사가 옳고 내 범위가 틀렸다 — **표 안**에만 없으면 된다.
   */
  const 표만 = (s) => (s.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0] ?? '');
  재본다('⛔ 표에 오징어게임이 없다', 표만(칸HTML(7)), (s) => !/Squid/.test(s));
  재본다('⭐ 표에는 잰 작품만 있다', 표만(칸HTML(7)),
    (s) => 잰것.every((t) => s.includes(짧은제목(t.title))));
  재본다('⛔ 가장 큰 파도를 왜 못 쓰는지 적는다', 글자만(칸HTML(10)),
    (s) => /almost nobody/.test(s));
  재본다('⛔ 못 잰 편수를 적는다', 글자만(칸HTML(10)), (s) => s.includes(String(못잰수)));
  /* ⭐ 몰림은 창을 넓혀 풀렸다. 이제 적어야 할 유보는 **신작은 잴 수 없다**는 쪽이다 */
  재본다('⛔ 신작은 못 잰다고 적는다', 글자만(칸HTML(10)), (s) => /back catalogue/.test(s));
  /* ⛔ 평균을 쓰지 않는다 — 평균은 +0.8% 라 「그대로다」가 된다 */
  재본다('⛔ 평균값이 화면에 없다', 글자만(칸HTML(7)),
    (s) => !s.includes(몫(답.floorChangeMeanPc)));
  재본다('⭐ 끝에 세우는 것이 「옛 작품만 답할 수 있다」', 글자만(칸HTML(13)),
    (s) => /Only back catalogue\s*can answer this/.test(s.replace(/\s+/g, ' ')));
  재본다('⭐ 중앙값이라고 화면에 적는다', 글자만(칸HTML(7)), (s) => /Median, not mean/.test(s));


  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('kculturewire.com'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)), (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-wave.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwwave');
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
