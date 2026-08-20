#!/usr/bin/env node
/**
 * make-video-kcw-outside.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「가장 많이 읽힌 한국 장소가 베트남의 전투였다」 (`/places` 정정 · 98편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔⛔ **정정을 자랑으로 팔지 않는다.** 「우리는 정직합니다」가 아니라 **무엇이 틀렸나**를 띄운다.
 *    첫 화면이 「Battle of Khe Sanh」과 「fought in Vietnam」을 같이 보인다 —
 *    이름만 띄우면 「이게 1등이래」로 읽힌다. 자가시험이 프레임 여덟을 재서 막는다.
 * ⛔⛔ **뺀 것을 이름으로 보인다.** 「열아홉을 뺐다」만 쓰면 조용한 제외와 같다.
 * ⛔⛔ **내 첫 검사가 못 잡았다는 것을 넣는다.** 그게 이 편의 알맹이다 — 큰 글자가 0 이다.
 * ⛔ **부풀리지 않는다.** 지면의 머리 결론은 안 움직였다고 적는다.
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-places-outside.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-outside.mjs --out public/wikitip/video/outside.mp4
 *   node scripts/make-video-kcw-outside.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-places-outside.json', 'utf8'));

export const 으뜸 = d.outside[0];
export const 보일줄 = d.outside.slice(0, 7);

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
   * ① 0.0–2.2 — **이름과 「베트남에서 싸웠다」가 같이 뜬다.**
   * ⛔ 이름만 먼저 띄우면 「한국 장소 1등 소개」 화면이 된다. 이 편의 요점이 뒤집힌다.
   */
  const 둘등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–6.4 — 뺀 것들이 한 줄씩 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 줄 = 보일줄.map((x, i) => {
    const 때 = 3.0 + i * 0.3;
    const o = 술술(끼(때, 때 + 0.32));
    return `<tr style="opacity:${o.toFixed(2)}"><td class="ㄹ">${x.name}</td>`
      + `<td class="ㅈ">${x.lat.toFixed(1)}, ${x.lon.toFixed(1)}</td></tr>`;
  }).join('');

  /* ③ 6.6–8.2 — 내 검사가 낸 0. 이 편의 알맹이 */
  const 영 = 툭(끼(6.6, 7.2));

  /* ④ 8.4–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not a big correction \u2014 the page\u2019s headline finding did not move',
    'Not a clean boundary \u2014 the box around Korea is ours, and we drew it wide',
    'Not measured is not outside \u2014 a place with no coordinate is left alone',
  ].map((t, i) => {
    const o = 술술(끼(8.8 + i * 0.3, 9.4 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${t}</li>`;
  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#140f0c;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#a1704e;opacity:${머리띠.toFixed(2)}}
    .큰{position:absolute;left:84px;right:84px;top:176px;opacity:${둘등장.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 둘등장).toFixed(3)});transform-origin:left top}
    .큰 b{display:block;font-size:74px;font-weight:900;line-height:1.0;letter-spacing:-.03em;
          color:#e9e6dd}
    .큰 em{display:block;margin-top:20px;font-style:normal;font-size:46px;font-weight:900;
           color:#e08a5b;letter-spacing:-.02em}
    .큰 span{display:block;margin-top:18px;font-size:30px;font-weight:700;color:#a1704e;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:530px;font-size:34px;color:#a89c92;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}
    .밑 b{color:#e9e6dd}

    .표{position:absolute;left:84px;right:84px;top:722px;opacity:${표나옴.toFixed(2)}}
    .표 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#7a6a5f;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    td{padding:11px 0;border-top:1px solid #2b211b}
    .ㄹ{font-size:29px;font-weight:700;color:#ded4cb}
    .ㅈ{font-size:28px;font-weight:800;color:#e08a5b;text-align:right;white-space:nowrap}

    .영{position:absolute;left:84px;right:84px;top:1180px;opacity:${영.toFixed(2)};
        transform:scale(${(0.9 + 0.1 * 영).toFixed(3)});transform-origin:left top}
    .영 b{font-size:118px;font-weight:900;color:#e08a5b;line-height:.9;display:block}
    .영 span{display:block;margin-top:12px;font-size:27px;font-weight:800;letter-spacing:.06em;
             color:#7a6a5f}
    .영 p{margin-top:14px;font-size:29px;color:#a89c92;line-height:1.36}
    .영 p b{font-size:29px;color:#e9e6dd;display:inline}

    .없{position:absolute;left:84px;right:84px;top:1466px}
    .없 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#7a6a5f;margin-bottom:16px;
           opacity:${술술(끼(8.4, 8.8)).toFixed(2)}}
    .없 li{list-style:none;font-size:27px;color:#a89c92;line-height:1.3;margin-bottom:12px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#5c4d43}

    .끝{position:absolute;left:84px;right:84px;top:1584px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:32px;font-weight:800;color:#e08a5b}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#7a6a5f}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <b>${으뜸.name}</b>
      <em>was fought in Vietnam</em>
      <span>and we published it as the most-read Korean place in Vietnamese</span>
    </div>
    <div class="밑">We listed <b>${d.checked.toLocaleString('en-US')}</b> Korean places.
      <b>${d.outsideCount}</b> of them are not in Korea \u2014 <b>${d.shareOfReads}%</b>
      of every read on the page.</div>

    <!-- ⛔⛔ 「열아홉을 뺐다」만 쓰면 조용한 제외와 같다. 이름으로 보인다 -->
    <div class="표">
      <h3>REMOVED \u2014 AND WHERE THEY ACTUALLY ARE</h3>
      <table><tbody>${줄}</tbody></table>
    </div>

    <!-- ⛔⛔ 이 편의 알맹이. 내가 쓴 검사가 낸 수가 0 이었다 -->
    <div class="영">
      <b>0</b>
      <span>PROBLEMS FOUND BY THE FIRST CHECK WE WROTE FOR THIS</span>
      <p>We asked Wikidata for the <b>country</b> of all ${d.checked.toLocaleString('en-US')}
        places \u2014 the same field the list was built from. It agreed with the list, because it
        was the same question asked twice.</p>
    </div>

    <div class="없">
      <h3>WHAT WE WILL NOT CLAIM</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>A check that cannot fail<br>is not evidence.</b>
      <span>kculturewire.com/places</span>
      <i>Wikidata coordinates \u00b7 re-tested ${d.checkedOn} \u00b7 ${d.outsideCount} removed</i>
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
   * ⛔⛔ 이름만 뜨는 프레임은 「한국 장소 1등 소개」다 — 이 편이 말하려는 것의 반대다.
   */
  const 머리 = (t) => (칸HTML(t).match(/<div class="큰">[\s\S]*?<\/div>/) ?? [''])[0];
  재본다('⛔⛔ 첫 화면에 이름과 「베트남에서 싸웠다」가 같이 있다', 글자만(머리(0.6)),
    (s) => s.includes(으뜸.name) && /fought in Vietnam/.test(s));
  재본다('⛔ 이름만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(머리(t));
      return x.includes(으뜸.name) === /fought in Vietnam/.test(x);
    }), (xs) => xs.every(Boolean));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  /* ⛔⛔ 뺀 것을 이름과 자리로 보인다 */
  const 표줄 = (t) => [...칸HTML(t).matchAll(/class="ㄹ">([^<]*)</g)].map((m) => m[1]);
  재본다('뺀 것이 일곱 줄이다', 표줄(8).length, 보일줄.length);
  재본다('⭐ 이름마다 실제 자리가 붙는다', 글자만(칸HTML(8)),
    (s) => 보일줄.every((x) => s.includes(x.name) && s.includes(x.lat.toFixed(1))));
  재본다('⛔ 「열아홉을 뺐다」로만 끝내지 않는다', 표줄(8).length, (n) => n >= 5);

  /* ⛔⛔ 내 검사가 못 잡았다는 것 */
  재본다('⛔⛔ 첫 검사가 낸 0 이 화면에 있다', 글자만(칸HTML(10)),
    (s) => /PROBLEMS FOUND BY THE FIRST CHECK/.test(s) && /\b0\b/.test(s));
  재본다('⛔ 왜 못 잡았는지 적는다', 글자만(칸HTML(10)).replace(/\s+/g, ' '),
    (s) => /same question asked twice/.test(s));
  재본다('⭐ 끝맺음이 그 교훈이다', 글자만(칸HTML(13)).replace(/\s+/g, ' '),
    (s) => /check that cannot fail is not evidence/.test(s));

  /* ⛔ 부풀리지 않는다 · 자랑하지 않는다 */
  재본다('⛔ 머리 결론이 안 움직였다고 적는다', 글자만(칸HTML(10)),
    (s) => /headline finding did not move/.test(s));
  재본다('⛔ 상자가 우리 것이라고 적는다', 글자만(칸HTML(10)),
    (s) => /the box around Korea is ours/.test(s));
  재본다('⛔ 못 잰 것을 밖으로 안 센다고 적는다', 글자만(칸HTML(10)),
    (s) => /Not measured is not outside/.test(s));
  재본다('⛔⛔ 「우리는 정직하다」로 팔지 않는다',
    글자만(칸HTML(2)) + 글자만(칸HTML(8)) + 글자만(칸HTML(10)) + 글자만(칸HTML(13)),
    (s) => !/\b(transparen\w*|honest\w*|integrity|we own our mistakes)\b/i.test(s));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/places'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(8)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-outside.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwoutside');
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
