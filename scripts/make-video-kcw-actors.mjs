#!/usr/bin/env node
/**
 * make-video-kcw-actors.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「네 나라, 세 개의 다른 1등」 (`/actors-first` · 100편)
 *
 * 🔴 사장님(8/16): 「스타의 이름을 넣는다. 사람들은 이름을 검색한다」
 *   → 첫 화면이 **이름 셋**이다. 수가 아니다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔⛔ **한 이름만 뜨는 프레임을 만들지 않는다.** 이 편의 요점은 1등이 **셋**이라는 것이다.
 *    하나만 크게 띄우면 「이 사람이 동남아 1등」이 되어 뜻이 뒤집힌다.
 *    자가시험이 0.1~2.0초 프레임 여덟을 재서 막는다.
 * ⛔⛔ **넷 다에 든 셋이 어디서도 1등이 아니라는 것**을 같은 화면에 둔다.
 *    안 넣으면 「이 셋이 제일 인기」로 읽힌다. 그 문장은 8/20 에 카드에서 한 번 틀렸던 자리다 —
 *    그때는 손으로 적었고, 지금은 **교집합을 구해** 만든다.
 * ⛔ **가수와 배우를 갈랐다고 말하지 않는다.** 명단이 출연진이라 IU·T.O.P 가 섞여 있다.
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-actors-first.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-actors.mjs --out public/wikitip/video/actors.mp4
 *   node scripts/make-video-kcw-actors.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-actors-first.json', 'utf8'));

export const 판 = d.editions;
export const 첫 = (p) => d.firstByEdition[p];
export const 나라 = (p) => d.countryNames[p];
/** ⭐ 1등 이름들 — 중복 없이, 자료가 정한 차례로 */
export const 일등들 = [...new Set(판.map((p) => 첫(p).name))];
/** ⭐⭐ 넷 다에 든 이름 중 어디선가 1등인 사람. 8/20 에 손으로 적었다 틀린 자리다 */
export const 둘다인이름 = d.inAllFour.filter((n) => 일등들.includes(n));

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
   * ① 0.0–2.2 — **이름 셋이 한꺼번에 박힌다.**
   * ⛔ 하나씩 차례로 띄우면 첫 프레임이 「1등은 이 사람」이 된다.
   */
  const 셋등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–6.2 — 나라별 1등 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 줄 = 판.map((p, i) => {
    const 때 = 3.0 + i * 0.34;
    const o = 술술(끼(때, 때 + 0.36));
    return `<tr style="opacity:${o.toFixed(2)}"><td class="ㄴ">${나라(p)}</td>`
      + `<td class="ㄹ">${첫(p).name}</td><td class="ㅅ">${첫(p).perMillion}</td></tr>`;
  }).join('');

  /* ③ 6.4–8.2 — 넷 다에 든 셋. 이 편에서 제일 조심하는 자리 */
  const 셋남 = 술술(끼(6.4, 7.0));

  /* ④ 8.4–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not popularity \u2014 this counts people opening an encyclopaedia article',
    'Not a singer/actor split \u2014 the panel is a cast list, so IU and T.O.P are on it',
    'Not why \u2014 the music lists have one leader and these have three, unmeasured',
  ].map((t, i) => {
    const o = 술술(끼(8.8 + i * 0.3, 9.4 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${t}</li>`;
  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  /* ⛔ 손으로 안 적는다 — 교집합을 구해 문장을 만든다 */
  const 겹말 = 둘다인이름.length
    ? `${둘다인이름.join(', ')} manages both.`
    : `<b>None of these ${d.inAllFour.length} is first anywhere.</b> The names at the top are `
      + 'different names again.';

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#140f16;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#b07a92;opacity:${머리띠.toFixed(2)}}
    .큰{position:absolute;left:84px;right:84px;top:176px;opacity:${셋등장.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 셋등장).toFixed(3)});transform-origin:left top}
    .큰 b{display:block;font-size:70px;font-weight:900;line-height:1.06;letter-spacing:-.03em;
          color:#e9e6dd}
    .큰 span{display:block;margin-top:20px;font-size:31px;font-weight:700;color:#f0b6c8;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:560px;font-size:34px;color:#a89aa4;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}
    .밑 b{color:#e9e6dd}

    .표{position:absolute;left:84px;right:84px;top:760px;opacity:${표나옴.toFixed(2)}}
    .표 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#7a6472;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    td{padding:13px 0;border-top:1px solid #2b2130}
    .ㄴ{font-size:28px;color:#a89aa4;width:270px}
    .ㄹ{font-size:31px;font-weight:800;color:#e9e6dd}
    .ㅅ{font-size:29px;font-weight:700;color:#f0b6c8;text-align:right;white-space:nowrap}

    .셋{position:absolute;left:84px;right:84px;top:1180px;opacity:${셋남.toFixed(2)}}
    .셋 h3{font-size:27px;font-weight:800;letter-spacing:.08em;color:#b45309;margin-bottom:14px}
    .셋 p{font-size:30px;color:#a89aa4;line-height:1.36}
    .셋 p b{color:#e9e6dd}

    .없{position:absolute;left:84px;right:84px;top:1416px}
    .없 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#7a6472;margin-bottom:16px;
           opacity:${술술(끼(8.4, 8.8)).toFixed(2)}}
    .없 li{list-style:none;font-size:27px;color:#a89aa4;line-height:1.3;margin-bottom:12px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#5c4a56}

    .끝{position:absolute;left:84px;right:84px;top:1584px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:32px;font-weight:800;color:#f0b6c8}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#7a6472}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <!-- ⛔⛔ 셋이 한꺼번에 뜬다. 하나씩 띄우면 「1등은 이 사람」 화면이 된다 -->
    <div class="큰">
      <b>${일등들.join('<br>')}</b>
      <span>Four Southeast Asian Wikipedias, ${d.firsts.distinct} different Korean actors at the top</span>
    </div>
    <div class="밑">Measured the same way, the music lists have
      <b>${d.versusMusic.musicDistinctFirsts}</b> names at the top and one shared name.
      The actor lists have <b>${d.firsts.distinct}</b>.</div>

    <div class="표">
      <h3>MOST-READ KOREAN ACTOR, BY EDITION</h3>
      <table><tbody>${줄}</tbody></table>
    </div>

    <!-- ⛔⛔ 이 자리를 8/20 에 손으로 적었다가 틀렸다. 지금은 교집합이 만든다 -->
    <div class="셋">
      <h3>ON ALL FOUR LISTS</h3>
      <p>${d.inAllFour.join(', ')}. ${겹말}</p>
    </div>

    <div class="없">
      <h3>WHAT IS NOT IN HERE</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>Travelling everywhere and<br>topping a list are not<br>the same thing.</b>
      <span>kculturewire.com/actors-first</span>
      <i>Wikimedia Pageviews \u00b7 human traffic only \u00b7 ${String(d.window).split(',')[0]}</i>
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

  /** ⛔⛔ 한 이름만 뜨는 프레임은 「이 사람이 동남아 1등」 화면이다 — 뜻이 뒤집힌다 */
  const 머리 = (t) => (칸HTML(t).match(/<div class="큰">[\s\S]*?<\/div>/) ?? [''])[0];
  재본다('⛔⛔ 첫 화면에 1등 이름이 다 있다', 글자만(머리(0.6)),
    (s) => 일등들.every((n) => s.includes(n)));
  재본다('⛔ 하나만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(머리(t));
      const 든것 = 일등들.filter((n) => x.includes(n)).length;
      return 든것 === 0 || 든것 === 일등들.length;
    }), (xs) => xs.every(Boolean));
  재본다('⭐ 1등이 셋이다', 일등들.length, d.firsts.distinct);

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  const 표줄 = (t) => [...칸HTML(t).matchAll(/class="ㄹ">([^<]*)</g)].map((m) => m[1]);
  재본다('나라 넷을 다 보인다', 표줄(8).length, 판.length);
  재본다('⭐ 나라마다 이름과 수가 붙는다', 글자만(칸HTML(8)),
    (s) => 판.every((p) => s.includes(나라(p)) && s.includes(첫(p).name)
      && s.includes(String(첫(p).perMillion))));

  /* ⛔⛔ 8/20 에 손으로 적었다가 틀린 자리 */
  재본다('⛔⛔ 넷 다에 든 이름을 화면에 넣는다', 글자만(칸HTML(8)),
    (s) => d.inAllFour.every((n) => s.includes(n)));
  재본다('⛔⛔ 겹침을 세어서 말한다 — 손으로 안 적는다', 글자만(칸HTML(8)),
    (s) => (둘다인이름.length
      ? s.includes(`${둘다인이름.join(', ')} manages both`)
      : /None of these \d+ is first anywhere/.test(s)));
  재본다('⭐ 지금 자료에서는 겹치는 이름이 없다', 둘다인이름.length, 0);

  재본다('⛔ 원인을 말하지 않는다고 적는다', 글자만(칸HTML(10)),
    (s) => /Not why/.test(s) && /unmeasured/.test(s));
  재본다('⛔ 가수·배우를 갈랐다고 안 한다', 글자만(칸HTML(10)),
    (s) => /Not a singer\/actor split/.test(s));
  재본다('⛔ 인기로 안 판다', 글자만(칸HTML(10)), (s) => /Not popularity/.test(s));
  재본다('⭐ 끝맺음이 이 편의 교훈이다', 글자만(칸HTML(13)).replace(/\s+/g, ' '),
    (s) => /Travelling everywhere and topping a list are not the same thing/.test(s));

  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/actors-first'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(8)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-actors.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwactors');
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
