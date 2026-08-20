#!/usr/bin/env node
/**
 * make-video-kcw-signs.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「같은 띠에 누가 있나 — 그리고 그게 아무것도 예언하지 않는다」 (`/star-signs`)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 * ⭐⭐ 사장님(8/16·8/20): **첫 화면에 스타의 이름이 떠야 한다.**
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔⛔ **점을 치지 않는다.** 우리는 이미 재서 발행했다 — 카이제곱 7.77(문턱 19.68),
 *    우연과 구분되지 않는다. 그래서 「7.77 vs 19.68」이 **6.4초에** 뜬다.
 *    ⛔ 이름 표(2.4~6.4초)보다 **뒤로 더 밀지 않는다.** 밀면 앞부분만 보고 넘긴 사람이
 *      이름표만 들고 간다. 자가시험이 그 자리를 지킨다.
 * ⛔⛔ **띠끼리 줄세우지 않는다.** 화면에 「이 띠가 세다」로 읽힐 말을 안 쓴다.
 * ⛔ **못 이은 사람을 0 으로 안 쓴다** — 1,047명 중 818명만 이었다고 화면에 적는다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-signs.mjs --out public/wikitip/video/signs.mp4
 *   node scripts/make-video-kcw-signs.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-star-signs.json', 'utf8'));

/** ⚠ 열둘을 다 못 싣는다. **자료가 정한 차례**(읽힘 으뜸)로 여섯 */
export const 여섯 = [...d.signs]
  .sort((a, b) => (b.top[0]?.perMillion ?? 0) - (a.top[0]?.perMillion ?? 0)).slice(0, 6);
export const 카이 = d.notAPrediction.chiSquare;
export const 문턱 = d.notAPrediction.threshold;

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

  /* ① 0.0–2.2 — ⭐ 첫 화면이 **이름**이다. 사장님 지시가 여기다 */
  const 이름등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–6.2 — 띠 여섯이 한 줄씩 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 줄 = 여섯.map((s, i) => {
    const 때 = 3.0 + i * 0.3;
    const o = 술술(끼(때, 때 + 0.32));
    return `<tr style="opacity:${o.toFixed(2)}"><td class="ㄸ">${s.sign}</td>`
      + `<td class="ㅇ">${s.top.slice(0, 3).map((p) => p.name).join(', ')}</td></tr>`;
  }).join('');

  /**
   * ③ 6.4–8.6 — 🔴🔴 경고. **이름 표 바로 뒤**다. 더 밀지 않는다.
   */
  const 경고 = 툭(끼(6.4, 7.0));

  /* ④ 8.8–11.0 — 안 하는 말 */
  const 없는줄 = [
    'No reading \u2014 a full chart needs the hour of birth, which profiles do not carry',
    'No ranking of signs \u2014 the largest holds 103 people and the smallest 76',
    `No zeros \u2014 ${d.peopleWithSign - d.withReads} stars keep their name with an empty figure`,
  ].map((t, i) => {
    const o = 술술(끼(9.0 + i * 0.3, 9.6 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${t}</li>`;
  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#12100b;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#9a7f4a;opacity:${머리띠.toFixed(2)}}
    .큰{position:absolute;left:84px;right:84px;top:176px;opacity:${이름등장.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 이름등장).toFixed(3)});transform-origin:left top}
    .큰 b{display:block;font-size:78px;font-weight:900;line-height:1.02;letter-spacing:-.03em;
          color:#e9e6dd}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:40px;font-weight:900;
           color:#d8a657}
    .밑{position:absolute;left:84px;right:84px;top:498px;font-size:34px;color:#a89c8a;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}
    .밑 b{color:#e9e6dd}

    .표{position:absolute;left:84px;right:84px;top:690px;opacity:${표나옴.toFixed(2)}}
    .표 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#7a6a52;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:12px 0;border-top:1px solid #2b2418;vertical-align:top}
    .ㄸ{width:190px;font-size:30px;font-weight:800;color:#d8a657}
    .ㅇ{font-size:28px;font-weight:600;color:#ded4c4;line-height:1.3}

    .경{position:absolute;left:84px;right:84px;top:1210px;opacity:${경고.toFixed(2)};
        transform:scale(${(0.92 + 0.08 * 경고).toFixed(3)});transform-origin:left top;
        border-left:4px solid #b45309;padding-left:24px}
    .경 b{display:block;font-size:82px;font-weight:900;color:#e08a5b;line-height:.95}
    .경 span{display:block;margin-top:12px;font-size:26px;font-weight:800;letter-spacing:.05em;
             color:#7a6a52}
    .경 p{margin-top:14px;font-size:30px;color:#a89c8a;line-height:1.34}
    .경 p b{display:inline;font-size:30px;color:#e9e6dd}

    .없{position:absolute;left:84px;right:84px;top:1500px}
    .없 h3{font-size:25px;font-weight:800;letter-spacing:.1em;color:#7a6a52;margin-bottom:14px;
           opacity:${술술(끼(8.8, 9.2)).toFixed(2)}}
    .없 li{list-style:none;font-size:26px;color:#a89c8a;line-height:1.3;margin-bottom:11px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#5c4f3a}

    .끝{position:absolute;left:84px;right:84px;top:1584px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:32px;font-weight:800;color:#d8a657}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#7a6a52}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <b>IU. Cha Eun-woo.<br>Byeon Woo-seok.</b>
      <em>Which Korean stars share your sign?</em>
    </div>
    <div class="밑"><b>${d.peopleWithSign.toLocaleString('en-US')}</b> Korean actors and singers,
      sorted into the twelve zodiac signs by the year they were born.</div>

    <div class="표">
      <h3>SIX SIGNS, AND THE NAMES IN THEM</h3>
      <table><tbody>${줄}</tbody></table>
    </div>

    <!-- 🔴🔴 이름 표 바로 뒤. 더 밀면 앞부분만 보고 넘긴 사람이 이름표만 들고 간다 -->
    <div class="경">
      <b>${카이} vs ${문턱}</b>
      <span>CHI-SQUARE FOR HOW 1,047 STARS SPREAD ACROSS THE TWELVE SIGNS</span>
      <p>Below the threshold means the spread is <b>indistinguishable from chance</b>.
        We measured that ourselves. This is a list of names, not a prediction.</p>
    </div>

    <div class="없">
      <h3>WHAT IS NOT IN HERE</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>Same sign. That is<br>the whole claim.</b>
      <span>kculturewire.com/star-signs</span>
      <i>Wikidata dates of birth \u00b7 Wikimedia Pageviews \u00b7 12 months to 2026-07</i>
    </div>
  </div>`;
}

const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 글자만 = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
  const 재본다 = (이름, 값, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(값) : JSON.stringify(값) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.log(`  ⛔ ${이름}  →  ${JSON.stringify(값)}`); }
  };

  /* ⭐⭐ 사장님 지시 — 첫 화면에 스타의 이름이 떠야 한다 */
  재본다('⭐⭐ 첫 화면에 스타 이름이 있다', 글자만(칸HTML(0.6)),
    (s) => /IU/.test(s) && /Cha Eun-woo/.test(s) && /Byeon Woo-seok/.test(s));

  /**
   * 🔴🔴 이 자의 핵심 — 경고가 **이름 표 바로 뒤**에 온다.
   *   더 뒤로 밀면 앞부분만 보고 넘긴 사람이 이름표만 들고 간다.
   */
  const 경도 = (t) => {
    const m = 칸HTML(t).match(/\.경\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⛔⛔ 경고가 7초 안에 뜬다', 경도(7.0), (v) => v > 0.9);
  재본다('⛔⛔ 경고가 마지막 장보다 먼저 온다', [경도(7.5), 술술(사이(7.5, 8.8, 9.2))],
    (v) => v[0] > 0.9 && v[1] === 0);
  재본다('⛔ 경고 문구가 있다', 글자만(칸HTML(7.5)).replace(/\s+/g, ' '),
    (s) => s.includes(`${카이} vs ${문턱}`) && /indistinguishable from chance/.test(s));
  재본다('⛔ 「예언이 아니다」를 적는다', 글자만(칸HTML(7.5)),
    (s) => /not a prediction/.test(s));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  const 띠칸 = (t) => [...칸HTML(t).matchAll(/class="ㄸ">([^<]*)</g)].map((m) => m[1]);
  재본다('띠가 여섯 줄이다', 띠칸(6).length, 여섯.length);
  재본다('⭐ 띠마다 이름이 셋 붙는다', 글자만(칸HTML(6)),
    (s) => 여섯.every((x) => s.includes(x.sign) && x.top.slice(0, 3).every((p) => s.includes(p.name))));

  /* ⛔⛔ 띠끼리 줄세우지 않는다 · 점치지 않는다 */
  const 다 = [2, 6, 7.5, 10, 13].map((t) => 글자만(칸HTML(t))).join(' ');
  재본다('⛔⛔ 점치는 말을 안 쓴다', 다, (s) => !/lucky|fortune|destined|predicts\b|best sign/i.test(s));
  재본다('⛔ 「어느 띠가 세다」로 안 쓴다', 다, (s) => !/\b(strongest|top sign|wins|beats)\b/i.test(s));
  재본다('⛔ 못 이은 사람을 0 으로 안 쓴다', 글자만(칸HTML(10)),
    (s) => /No zeros/.test(s) && s.includes(String(d.peopleWithSign - d.withReads)));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 이름이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/star-signs'));
  재본다('⛔ 화면에 한국어가 없다', 다, (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-signs.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwsigns');
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
