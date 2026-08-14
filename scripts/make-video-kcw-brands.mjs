#!/usr/bin/env node
/**
 * make-video-kcw-brands.mjs — **K Culture Wire 쇼츠 5편.** 14초 · 1080×1920 · 영어.
 *   「같은 나라가 갈래마다 자리를 바꾼다」 (88편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」
 *   → 첫 0.4초에 제일 센 대비, 매 프레임이 다름, 14초.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」
 *   → 주소를 1.6초부터 **내내** 붙인다. 끝에만 두면 끊고 나간 사람이 못 찾는다.
 *
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-brand-kinds.json` 에서 읽는다.
 * ⛔ **「어느 나라가 관심이 많다」로 읽히면 거짓이다.** 두 수를 나란히 놓고
 *    화면에 「Not that one country cares more」를 넣는다.
 * ⛔ 한국 차 배수를 **화면에 안 넣는다.** 기사가 안 낸 수다 — 영상이 기사보다 앞서면 안 된다.
 * ⚠ 얇은 갈래는 막대로 안 그린다. 무늬로 읽힌다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-brands.mjs --out <mp4>
 *   node scripts/make-video-kcw-brands.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-brand-kinds.json', 'utf8'));
export const 나라 = d.countryNames;
export const 흔든나라 = d.positionSwing.제일;
/* ⚠ 얇은 갈래는 뺀다 — 브랜드 하나짜리 줄을 막대로 그리면 무늬로 읽힌다 */
export const 두꺼운 = d.kinds.filter((k) => !k.얇은가);
export const 차갈래 = d.kinds.find((k) => k.key === 'car');
export const 명갈래 = d.kinds.find((k) => k.key === 'luxury');
export const 차값 = 차갈래.판별[흔든나라];
export const 명값 = 명갈래.판별[흔든나라];

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

  /* ① 0.0–2.4 — 두 수가 나란히 박힌다. 대비가 이 영상의 전부다 */
  const 왼등장 = 툭(끼(0.0, 0.5));
  const 오등장 = 툭(끼(0.35, 0.9));
  const 밑말 = 술술(끼(1.0, 1.6));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.2–7.0 — 갈래마다 네 나라 막대가 자란다 */
  const 표나옴 = 술술(끼(2.2, 2.7));
  const 줄들 = 두꺼운.map((k, i) => {
    const 최대 = Math.max(...d.editionsSea.map((p) => k.판별[p]));
    const 시작 = 2.5 + i * 0.42;
    const 자람 = 술술(끼(시작, 시작 + 0.7));
    const 칸 = d.editionsSea.map((p) => {
      const 값 = k.판별[p];
      const 높이 = (값 / 최대) * 100 * 자람;
      /* 흔들리는 나라를 켠다 — 눈이 그 열을 따라가게 */
      const 켬 = p === 흔든나라 && 초 > 5.2 ? ' 켬' : '';
      return `<span class="칸${켬}"><i style="height:${높이.toFixed(1)}%"></i>`
        + `<u style="opacity:${Math.max(0, 자람 * 2 - 1).toFixed(2)}">${(값 * 자람).toFixed(1)}</u>`
        + `<b>${나라[p].slice(0, 3)}</b></span>`;
    }).join('');
    return `<div class="갈래"><span class="이름">${k.label.replace(' car makers', ' cars')
      .replace(' and watchmakers', '')}</span><div class="칸들">${칸}</div></div>`;
  }).join('');

  /* ③ 5.2–8.0 — 무엇을 보라는 말 */
  const 짚기 = 술술(끼(5.2, 5.8));

  /* ④ 8.2–11.0 — 못 하는 말 */
  const 없는것 = 끼(8.2, 8.6);
  const 없는줄 = [
    'Not that one country cares more — they care about different things',
    'Not sales — this counts encyclopaedia reads',
    'No Korean-vs-German multiple — one Korean marque has all four articles',
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
    .맞{position:absolute;left:84px;right:84px;top:186px;display:flex;align-items:flex-end;gap:34px}
    .맞 .쪽{flex:1}
    .맞 .왼{opacity:${왼등장.toFixed(2)};transform:scale(${(0.86 + 0.14 * 왼등장).toFixed(3)});transform-origin:left bottom}
    .맞 .오{opacity:${오등장.toFixed(2)};transform:scale(${(0.86 + 0.14 * 오등장).toFixed(3)});transform-origin:left bottom}
    .맞 b{display:block;font-size:158px;font-weight:900;color:#e9e6dd;line-height:.9;letter-spacing:-.04em}
    .맞 .오 b{color:#8f88a0}
    .맞 span{display:block;margin-top:12px;font-size:31px;font-weight:700;color:#c9a6ff;line-height:1.2}
    .맞 .오 span{color:#8f88a0}
    .밑{position:absolute;left:84px;right:84px;top:430px;font-size:41px;font-weight:700;
        color:#e9e6dd;line-height:1.26;opacity:${밑말.toFixed(2)};
        transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}
    .잔{position:absolute;left:84px;right:84px;top:560px;font-size:28px;color:#a49bb8;
        opacity:${밑말.toFixed(2)}}

    .표{position:absolute;left:84px;right:84px;top:680px;opacity:${표나옴.toFixed(2)}}
    .갈래{margin-bottom:34px}
    .갈래 .이름{display:block;font-size:31px;font-weight:700;color:#8f88a0;margin-bottom:12px}
    .칸들{display:flex;gap:20px;align-items:flex-end;height:190px}
    .칸{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}
    .칸 i{display:block;width:100%;background:#3a3350;border-radius:6px 6px 0 0}
    .칸 u{font-size:25px;font-weight:800;color:#8f88a0;text-decoration:none;order:-1;margin-bottom:6px}
    .칸 b{font-size:23px;font-weight:700;color:#6a6478;margin-top:7px}
    .칸.켬 i{background:linear-gradient(180deg,#c9a6ff,#7c5cc4)}
    .칸.켬 u,.칸.켬 b{color:#c9a6ff}

    .짚{position:absolute;left:84px;right:84px;top:1420px;opacity:${짚기.toFixed(2)};
        transform:translateY(${((1 - 짚기) * 16).toFixed(1)}px)}
    .짚 em{font-style:normal;font-size:36px;font-weight:700;color:#e9e6dd;line-height:1.34}

    .없{position:absolute;left:84px;right:84px;top:1560px;opacity:${없는것.toFixed(2)}}
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
    <div class="맞">
      <div class="쪽 왼"><b>${차값}</b><span>German cars</span></div>
      <div class="쪽 오"><b>${명값}</b><span>Luxury houses</span></div>
    </div>
    <div class="밑">${나라[흔든나라]} reads one the most<br>of these four countries &mdash; and the other the least</div>
    <div class="잔">Reads per million reads of that edition &middot; ${d.brandsMeasured} brands &middot; 12 months</div>

    <div class="표">${줄들}</div>
    <div class="짚"><em>The order of the four countries changes from row to row.<br>That is the finding.</em></div>

    <div class="없">
      <h3>What this is not</h3>
      <ul>${없는줄}</ul>
    </div>
  </div>
  <div class="끝">
    <div class="ㅈ">Rank them together<br>and this disappears.</div>
    <div class="ㅅ">kculturewire.com<br>/brand-kinds</div>
    <div class="ㄱ">Wikidata &middot; Wikimedia Pageviews<br>Every figure has a table behind it</div>
  </div>`;
}

if (process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 160)}`); }
  };
  const 글자만 = (s) => s.replace(/<style>[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  재본다('첫 프레임에 이미 숫자가 있다', 글자만(칸HTML(0.5)), (s) => /\d/.test(s));
  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  재본다('두 수가 자료에서 왔다', 글자만(칸HTML(1)),
    (s) => s.includes(String(차값)) && s.includes(String(명값)));
  재본다('브랜드 수가 자료에서 왔다', 글자만(칸HTML(2)), (s) => s.includes(String(d.brandsMeasured)));
  재본다('갈래 수가 두꺼운 것과 같다', (칸HTML(7).match(/class="갈래"/g) ?? []).length, 두꺼운.length);
  /* ⚠ `칸[^"]*` 로 세면 감싸는 `칸들` 까지 걸려 12 가 15 로 나온다. 낱말 끝을 못 박는다 */
  재본다('막대가 나라 수만큼', (칸HTML(7).match(/class="칸(?: 켬)?"/g) ?? []).length,
    두꺼운.length * d.editionsSea.length);
  재본다('갈래 값이 자료에서 왔다', 글자만(칸HTML(7)),
    (s) => 두꺼운.every((k) => d.editionsSea.every((p) => s.includes(k.판별[p].toFixed(1)))));
  /* 🔴 「관심이 많다」로 읽히면 거짓이다 */
  재본다('⛔ 한 나라가 더 관심 많은 게 아니라고 적혀 있다', 글자만(칸HTML(10)),
    (s) => s.includes('Not that one country cares more'));
  재본다('⛔ 팔림이 아니라고 적혀 있다', 글자만(칸HTML(10)), (s) => s.includes('Not sales'));
  /* 🔴 기사가 안 낸 수를 영상이 내면 안 된다 */
  재본다('⛔ 한국 차 배수가 화면에 없다', [1, 5, 9, 13].map((t) => 글자만(칸HTML(t))).join(' '),
    (s) => !/7\.1|7,1/.test(s));
  재본다('⚠ 얇은 갈래는 안 그린다', 글자만(칸HTML(7)),
    (s) => d.kinds.filter((k) => k.얇은가).every((k) => !s.includes(k.label)));
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
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-brands.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwbrand');
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
