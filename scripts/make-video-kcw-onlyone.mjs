#!/usr/bin/env node
/**
 * make-video-kcw-onlyone.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「안성기와 최지우를 적어 둔 판은 넷 중 하나뿐이다」 (`/only-one-wikipedia` · 107편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 * ⭐⭐ 사장님(8/16): 「**스타 이름**을 넣어라. 손님은 이름을 검색한다」
 *    → 첫 화면이 **이름 두 개**로 시작한다. 수부터 띄우면 아무도 안 멈춘다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔⛔ **이름과 「한 판뿐」이 같이 떠야 한다.** 이름만 띄우면 인물 소개가 되고,
 *    수만 띄우면 아무도 안 본다. 자가시험이 프레임 여덟을 재서 한쪽만 뜨는 순간을 막는다.
 * ⛔⛔ **「인기 없다」로 읽히면 안 된다.** 문서 유무는 편집자가 정한다 —
 *    그 문장을 화면에 넣는다. 이 편에서 제일 조심하는 자리다.
 * ⛔ **크기 반론을 화면에서 죽인다.** 베트남어판이 더 큰데 31개뿐이다.
 * ⛔ 수를 손으로 안 박는다. `src/data/wikitip-only-one-wikipedia.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-onlyone.mjs --out public/wikitip/video/onlyone.mp4
 *   node scripts/make-video-kcw-onlyone.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-only-one-wikipedia.json', 'utf8'));

export const 음 = d.groups.find((g) => g.key === 'music');
export const 배 = d.groups.find((g) => g.key === 'actors');
export const 크 = 음.size;
/** ⭐ 화면에 세울 이름 — 판마다 많이 읽힌 순으로 자료에서 온다 */
export const 보일이름 = [
  ...배.byEdition.id.names.slice(0, 3).map((x) => ({ ...x, ed: 'Indonesian' })),
  ...음.byEdition.id.names.slice(0, 2).map((x) => ({ ...x, ed: 'Indonesian' })),
  ...음.byEdition.th.names.slice(0, 1).map((x) => ({ ...x, ed: 'Thai' })),
  ...음.byEdition.ms.names.slice(0, 1).map((x) => ({ ...x, ed: 'Malay' })),
];
export const 앞두이름 = [배.byEdition.id.names[0].name, 음.byEdition.id.names.find((x) => x.name === 'Choi Jiwoo')?.name
  ?? 음.byEdition.id.names[0].name];

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
   * ① 0.0–2.2 — **이름 둘과 「한 판뿐」이 같이 박힌다.**
   * ⛔ 이름만 먼저 띄우면 인물 소개 화면이 된다. 이 편의 요점이 죽는다.
   */
  const 머리등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–6.4 — 이름이 한 줄씩 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 줄 = 보일이름.map((x, i) => {
    const 때 = 3.0 + i * 0.3;
    const o = 술술(끼(때, 때 + 0.32));
    return `<tr style="opacity:${o.toFixed(2)}"><td class="ㄹ">${x.name}</td>`
      + `<td class="ㅅ">${x.perMillion}</td><td class="ㅈ">${x.ed}</td></tr>`;
  }).join('');

  /* ③ 6.6–8.2 — 크기 반론을 죽인다 */
  const 크기 = 툭(끼(6.6, 7.2));

  /* ④ 8.4–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not popularity \u2014 whether an article exists is an editing decision',
    'Not "unknown there" \u2014 a star unwritten in Thai may be well known in Thailand',
    'Not everyone \u2014 the panel is built from titles that reached a Netflix chart',
  ].map((t, i) => {
    const o = 술술(끼(8.8 + i * 0.3, 9.4 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${t}</li>`;
  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0c1016;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#6f88ad;opacity:${머리띠.toFixed(2)}}
    .큰{position:absolute;left:84px;right:84px;top:176px;opacity:${머리등장.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 머리등장).toFixed(3)});transform-origin:left top}
    .큰 b{display:block;font-size:80px;font-weight:900;line-height:1.02;letter-spacing:-.03em;
          color:#e9e6dd}
    .큰 em{display:block;margin-top:20px;font-style:normal;font-size:44px;font-weight:900;
           color:#9ab8e8;letter-spacing:-.02em}
    .밑{position:absolute;left:84px;right:84px;top:540px;font-size:34px;color:#9aa6b8;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}
    .밑 b{color:#e9e6dd}

    .표{position:absolute;left:84px;right:84px;top:730px;opacity:${(표나옴 * (1 - 끝)).toFixed(2)}}
    .표 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#5f7085;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    td{padding:11px 0;border-top:1px solid #1c2530}
    .ㄹ{font-size:30px;font-weight:800;color:#e9e6dd}
    .ㅅ{font-size:28px;font-weight:700;color:#cdd5e0;text-align:right;width:150px}
    .ㅈ{font-size:26px;font-weight:700;color:#9ab8e8;text-align:right;white-space:nowrap}

    .크{position:absolute;left:84px;right:84px;top:1258px;opacity:${(크기 * (1 - 끝)).toFixed(2)}}
    .크 h3{font-size:27px;font-weight:800;letter-spacing:.08em;color:#b45309;margin-bottom:14px}
    .크 p{font-size:29px;color:#9aa6b8;line-height:1.36}
    .크 b{color:#e9e6dd}

    .없{position:absolute;left:84px;right:84px;top:1452px;opacity:${(1 - 끝).toFixed(2)}}
    .없 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#5f7085;margin-bottom:16px;
           opacity:${술술(끼(8.4, 8.8)).toFixed(2)}}
    .없 li{list-style:none;font-size:27px;color:#9aa6b8;line-height:1.3;margin-bottom:12px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#46586e}

    .끝{position:absolute;left:84px;right:84px;top:1584px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:32px;font-weight:800;color:#9ab8e8}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5f7085}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <b>${앞두이름[0]}<br>${앞두이름[1]}</b>
      <em>are on one of four Wikipedias</em>
    </div>
    <div class="밑">Ahn Sung-ki has more than 130 films. Choi Jiwoo was in
      <b>Winter Sonata</b>. Across the Indonesian, Vietnamese, Thai and Malay editions,
      <b>one</b> has written about either of them.</div>

    <div class="표">
      <h3>HELD BY ONE EDITION ONLY \u00b7 READS PER MILLION</h3>
      <table><tbody>${줄}</tbody></table>
    </div>

    <!-- ⛔ 크기 반론을 화면에서 죽인다 -->
    <div class="크">
      <h3>NOT BECAUSE IT IS THE BIGGEST</h3>
      <p>The <b>${d.editionNames[크.largest]}</b> edition has
        <b>${크.sizes[크.largest].articles.toLocaleString('en-US')}</b> articles against
        <b>${크.sizes[크.keepsMost].articles.toLocaleString('en-US')}</b>, and more editors \u2014
        and it holds <b>${(음.byEdition[크.largest].count + 배.byEdition[크.largest].count).toLocaleString('en-US')}</b> of
        these names to <b>${(음.byEdition[크.keepsMost].count + 배.byEdition[크.keepsMost].count).toLocaleString('en-US')}</b>.</p>
    </div>

    <div class="없">
      <h3>WHAT THIS IS NOT</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>An encyclopaedia is written<br>by people who chose to.</b>
      <span>kculturewire.com/only-one-wikipedia</span>
      <i>Wikidata + Wikimedia Pageviews \u00b7 ${d.window.split(',')[0]}</i>
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
   * ⛔⛔ 이름만 뜨는 프레임은 인물 소개 화면이다 — 이 편의 요점이 죽는다.
   */
  const 머리 = (t) => (칸HTML(t).match(/<div class="큰">[\s\S]*?<\/div>/) ?? [''])[0];
  재본다('⭐⭐ 첫 화면에 이름과 「한 판뿐」이 같이 있다', 글자만(머리(0.6)),
    (s) => s.includes(앞두이름[0]) && /one of four Wikipedias/.test(s));
  재본다('⛔ 한쪽만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(머리(t));
      return x.includes(앞두이름[0]) === /one of four Wikipedias/.test(x);
    }), (xs) => xs.every(Boolean));
  재본다('⭐⭐ 첫 화면에 이름이 둘 다 있다', 글자만(머리(0.6)),
    (s) => 앞두이름.every((n) => s.includes(n)));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  /* ⭐ 이름마다 수와 판이 붙는다 */
  const 표이름 = (t) => [...칸HTML(t).matchAll(/class="ㄹ">([^<]*)</g)].map((m) => m[1]);
  재본다('표에 이름이 일곱 줄이다', 표이름(8).length, 보일이름.length);
  재본다('⭐ 이름마다 수와 판이 붙는다', 글자만(칸HTML(8)),
    (s) => 보일이름.every((x) => s.includes(x.name) && s.includes(String(x.perMillion))));
  재본다('⭐ 인도네시아어판만 있는 화면이 아니다', 글자만(칸HTML(8)),
    (s) => /Thai/.test(s) && /Malay/.test(s));

  /* ⛔ 크기 반론 */
  재본다('⛔⛔ 크기 반론을 화면에서 죽인다', 글자만(칸HTML(10)),
    (s) => /NOT BECAUSE IT IS THE BIGGEST/.test(s)
      && s.includes(크.sizes[크.largest].articles.toLocaleString('en-US')));

  /* ⛔⛔ 「인기 없다」로 읽히면 안 된다 */
  재본다('⛔⛔ 「편집자가 정한다」를 화면에 넣는다', 글자만(칸HTML(10)),
    (s) => /editing decision/.test(s));
  재본다('⛔ 「안 알려졌다」가 아니라고 적는다', 글자만(칸HTML(10)),
    (s) => /may be well known in Thailand/.test(s));
  재본다('⛔ 표본 한계를 적는다', 글자만(칸HTML(10)), (s) => /Netflix chart/.test(s));
  재본다('⛔ 「인기」·「무시」 같은 말을 안 쓴다',
    글자만(칸HTML(2)) + 글자만(칸HTML(8)) + 글자만(칸HTML(13)),
    (s) => !/\b(popular|famous|ignored|forgotten|nobody cares)\b/i.test(s));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/only-one-wikipedia'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(8)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-onlyone.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwonlyone');
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
