#!/usr/bin/env node
/**
 * make-video-kcw-works.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「일곱 배는 무리의 수다. 한 사람에 대해서는 82%밖에 말하지 못한다」 (`/works-and-readers`)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔⛔ **「7.1배」만 뜨는 프레임을 만들지 않는다.** 첫 화면에서부터 82% 를 같이 박는다.
 *    사다리는 무리의 성질이고, 넘기다 만 사람이 그것만 들고 가면 이 편의 요점이 죽는다.
 *    ⭐ 자가시험이 프레임 여덟을 재서 한쪽만 뜨는 순간이 없는지 확인한다.
 * ⛔⛔ **겹침을 뺄 수 없다.** 43/390 이 없으면 사다리가 규칙으로 읽힌다.
 * ⛔ **방향을 말하지 않는다.** 「많이 나와서 읽힌다」로 쓰지 않는다 — 못 가른다.
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-works-and-readers.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-works.mjs --out public/wikitip/video/works.mp4
 *   node scripts/make-video-kcw-works.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-works-and-readers.json', 'utf8'));

export const 띠줄 = d.bands;
export const 겹 = d.overlap.oneEdition;
export const 배수 = `${d.ladder.oneEdition.fromTo}\u00d7`;
export const 확률 = `${(100 * d.personLevel.oneEdition).toFixed(1)}%`;

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
   * ① 0.0–2.2 — **두 수가 같이 박힌다.**
   * ⛔ 배수만 먼저 띄우면 「일곱 배」 단독 화면이 된다. 이 편의 요점이 죽는다.
   */
  const 둘등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–6.4 — 사다리 네 칸이 자란다 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 가장큼 = Math.max(...띠줄.map((b) => b.oneEdition.median));
  const 막대 = 띠줄.map((b, i) => {
    const 때 = 3.0 + i * 0.34;
    const o = 술술(끼(때, 때 + 0.36));
    const 길이 = (100 * (b.oneEdition.median / 가장큼) * o).toFixed(1);
    return `<div class="칸" style="opacity:${o.toFixed(2)}">`
      + `<div class="ㄹ">${b.label}</div>`
      + `<div class="막"><i style="width:${길이}%"></i></div>`
      + `<div class="ㅅ">${b.oneEdition.median}</div></div>`;
  }).join('');

  /* ③ 6.6–8.2 — 겹침. ⛔ 이 자리가 이 편의 정직이다 */
  const 겹침남 = 술술(끼(6.6, 7.1));

  /* ④ 8.4–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not cause \u2014 more shows may bring readers, or readers may bring more shows',
    'Not every Korean actor \u2014 only casts of titles that reached a Netflix chart',
    'Not the size of the gap \u2014 the 82% counts who wins, never by how much',
  ].map((t, i) => {
    const o = 술술(끼(8.8 + i * 0.3, 9.4 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${t}</li>`;
  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0b1210;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#5f9a90;opacity:${머리띠.toFixed(2)}}
    .큰{position:absolute;left:84px;right:84px;top:176px;opacity:${둘등장.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 둘등장).toFixed(3)});transform-origin:left top}
    .둘{display:flex;align-items:baseline;gap:26px;flex-wrap:wrap}
    .둘 b{font-size:104px;font-weight:900;line-height:.9;letter-spacing:-.04em}
    .둘 .ㄴ{color:#e9e6dd}
    .둘 .ㅇ{color:#7fd1c4}
    .둘 i{font-style:normal;font-size:38px;font-weight:700;color:#5c6b68}
    .큰 span{display:block;margin-top:18px;font-size:31px;font-weight:700;color:#7fd1c4;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:470px;font-size:34px;color:#9aa8a4;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}
    .밑 b{color:#e9e6dd}

    .표{position:absolute;left:84px;right:84px;top:690px;opacity:${표나옴.toFixed(2)}}
    .표 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#5c6b68;margin-bottom:22px}
    .칸{display:flex;align-items:center;gap:20px;margin-bottom:20px}
    .ㄹ{width:250px;font-size:29px;font-weight:700;color:#cdd8d5}
    .막{flex:1;height:26px;background:#141f1c;border-radius:4px;overflow:hidden}
    .막 i{display:block;height:100%;background:#7fd1c4;border-radius:4px}
    .ㅅ{width:110px;font-size:31px;font-weight:800;color:#e9e6dd;text-align:right}

    .겹{position:absolute;left:84px;right:84px;top:1114px;opacity:${겹침남.toFixed(2)}}
    .겹 h3{font-size:27px;font-weight:800;letter-spacing:.08em;color:#b45309;margin-bottom:14px}
    .겹 p{font-size:29px;color:#9aa8a4;line-height:1.36}
    .겹 b{color:#e9e6dd}

    .없{position:absolute;left:84px;right:84px;top:1330px}
    .없 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#5c6b68;margin-bottom:18px;
           opacity:${술술(끼(8.4, 8.8)).toFixed(2)}}
    .없 li{list-style:none;font-size:28px;color:#9aa8a4;line-height:1.32;margin-bottom:14px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#4a5b57}

    .끝{position:absolute;left:84px;right:84px;top:1584px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:32px;font-weight:800;color:#7fd1c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5c6b68}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <div class="둘"><b class="ㄴ">${배수}</b><i>but only</i><b class="ㅇ">${확률}</b></div>
      <span>Five charting shows against one \u2014 the group gap, and what it says about one actor</span>
    </div>
    <div class="밑">Actors with five or more charting titles are read ${배수} as often.
      Pick one from each group and the busier one wins <b>${확률}</b> of the time.</div>

    <div class="표">
      <h3>READS PER MILLION, ONE WIKIPEDIA EDITION</h3>
      ${막대}
    </div>

    <!-- ⛔⛔ 겹침을 빼면 사다리가 규칙으로 읽힌다 -->
    <div class="겹">
      <h3>WHERE THE OVERLAP LIVES</h3>
      <p>Of the <b>${겹.lowBandN}</b> actors with a single charting title, <b>${겹.lowBandAboveHighMedian}</b>
        are read more than the median actor with five or more. Going the other way,
        <b>${겹.highBandBelowLowMedian}</b> of ${겹.highBandN} fall below.</p>
    </div>

    <div class="없">
      <h3>WHAT IS NOT IN HERE</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>A group average is not<br>a fact about a person.</b>
      <span>kculturewire.com/works-and-readers</span>
      <!-- \u26a0 d.window \uc548\uc5d0 \u300chuman traffic only\u300d\uac00 \uc774\ubbf8 \ub4e4\uc5b4 \uc788\uc5b4 \ub450 \ubc88 \ub098\uc654\ub2e4. \uc55e\uba38\ub9ac\ub9cc \uc4f4\ub2e4 -->
      <i>Wikimedia Pageviews \u00b7 human traffic only \u00b7 ${d.window.split(',')[0]}</i>
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

  /**
   * ⛔⛔ 배수만 뜨는 프레임은 「일곱 배」 단독 화면이다 — 이 편의 요점이 죽는다.
   */
  const 둘블록 = (t) => (칸HTML(t).match(/<div class="둘">[\s\S]*?<\/div>\s*<\/div>/) ?? [''])[0];
  재본다('⛔⛔ 첫 화면에 두 수가 같이 있다', 글자만(둘블록(0.6)),
    (s) => s.includes(배수) && s.includes(확률));
  재본다('⛔ 한쪽만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(둘블록(t));
      return x.includes(배수) === x.includes(확률);
    }), (xs) => xs.every(Boolean));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  /* ⭐ 사다리 네 칸이 다 있고, 이름과 수가 짝지어 있다 */
  const 칸이름 = (t) => [...칸HTML(t).matchAll(/class="ㄹ">([^<]*)</g)].map((m) => m[1]);
  재본다('사다리가 네 칸이다', 칸이름(8).length, 띠줄.length);
  재본다('⭐ 칸마다 이름과 수가 있다', 글자만(칸HTML(8)),
    (s) => 띠줄.every((b) => s.includes(b.label) && s.includes(String(b.oneEdition.median))));
  재본다('⭐ 막대가 수에 비례한다', (() => {
    const 폭들 = [...칸HTML(8).matchAll(/<i style="width:([0-9.]+)%"/g)].map((m) => Number(m[1]));
    const 값들 = 띠줄.map((b) => b.oneEdition.median);
    const 가장 = Math.max(...값들);
    return 폭들.map((w, i) => Math.abs(w - (100 * 값들[i]) / 가장) < 0.2);
  })(), (xs) => xs.length === 띠줄.length && xs.every(Boolean));

  /* ⛔⛔ 겹침을 빼면 사다리가 규칙으로 읽힌다 */
  재본다('⛔⛔ 겹침을 화면에 넣는다', 글자만(칸HTML(8)),
    (s) => s.includes(String(겹.lowBandAboveHighMedian)) && s.includes(String(겹.lowBandN)));
  재본다('⛔ 반대 방향도 넣는다', 글자만(칸HTML(8)),
    (s) => s.includes(String(겹.highBandBelowLowMedian)) && /the other way/.test(s));

  /* ⛔ 방향을 말하지 않는다 */
  재본다('⛔⛔ 원인을 말하지 않는다고 적는다', 글자만(칸HTML(10)),
    (s) => /Not cause/.test(s) && /may bring/.test(s));
  /**
   * ⚠ 「안 하는 말」 목록에는 **Not cause** 라고 적혀 있다. 금칙어를 화면 전체에 걸면
   *   그 정직한 문장이 스스로 걸린다(처음에 그렇게 걸렸다). 그래서 **주장하는 자리만** 본다.
   */
  const 주장만 = (t) => 글자만(칸HTML(t).replace(/<ul>[\s\S]*?<\/ul>/g, ' '));
  재본다('⛔ 「덕분에·때문에」로 쓰지 않는다', 주장만(10) + 주장만(2),
    (s) => !/\b(because of|thanks to|leads? to|causes?|drives?)\b/i.test(s));
  재본다('⛔ 표본의 한계를 적는다', 글자만(칸HTML(10)),
    (s) => /reached a Netflix chart/.test(s));
  재본다('⭐ 무리의 수와 사람의 수를 가른다', 글자만(칸HTML(13)),
    (s) => /not\s+a fact about a person/.test(s.replace(/\s+/g, ' ')));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/works-and-readers'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(8)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-works.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwworks');
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
