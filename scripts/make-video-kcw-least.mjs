#!/usr/bin/env node
/**
 * make-video-kcw-least.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「1등은 바뀌는데 꼴찌는 안 바뀐다」 (`/who-reads-least` · 108편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「**외부유입용**이다」 → 주소를 1.6초부터 내내 붙인다.
 * ⭐⭐ 사장님(8/16): 「스타 이름을 넣어라」 → 첫 화면이 이름 둘로 시작한다.
 *
 * ── ⛔ 이 편에서 제일 조심한 자리 — **반론의 «때»** ─────────────
 * 카드뉴스에서는 반론을 넷째 장에서 **둘째 장으로** 옮겼다. 영상은 더하다 —
 * 손님이 3초에 넘기면 그 3초에 본 것이 전부다.
 * ```
 *   ⛔ 「말레이시아가 관심 없다」로 읽히면 안 된다.
 *      말레이어와 인도네시아어는 서로 통해서 말레이시아 손님이 인도네시아어판을 읽을 수 있다.
 *   ⭐ 그래서 그 문장을 **2.4초에** 띄운다. 표(4.2초)보다 먼저다.
 *      자가시험이 「표가 뜨는 순간에 반론이 이미 화면에 있나」를 잰다.
 * ```
 * ⛔ 「판이 작아서」가 아니다 — 백만분율이라 판 크기는 이미 나눠져 있다고 적는다.
 * ⛔ 수를 손으로 안 박는다. ⛔ 화면에 한국어를 안 쓴다. ⛔ 광고 자리를 만들지 않는다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-least.mjs --out public/wikitip/video/least.mp4
 *   node scripts/make-video-kcw-least.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');

export const 초당 = 30;
export const 폭 = 1080;
export const 높 = 1920;
export const 총초 = 14;

const d = JSON.parse(fs.readFileSync('src/data/wikitip-last-place.json', 'utf8'));

export const 꼴 = d.mostOftenLast;
export const 위 = d.topOfList.people.slice(0, 6);
/** ⭐ 첫 화면에 세울 두 사람 — **서로 다른 나라에서 1등**인 사람을 자료에서 고른다 */
export const 앞두명 = (() => {
  const 첫 = d.topOfList.people[0];
  const 다른 = d.topOfList.people.find((p) => p.most !== 첫.most);
  return [첫, 다른 ?? d.topOfList.people[1]];
})();

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

  /* ① 0.0–2.0 — 이름 둘과 「다 같은 데서 끝난다」 */
  const 머리 = 툭(끼(0.0, 0.6));
  /** ② 2.4 — ⛔⛔ **반론이 표보다 먼저 뜬다.** 3초에 넘기는 손님도 이것을 본다 */
  const 반론 = 술술(끼(2.4, 3.0));
  /* ③ 4.2 — 표 */
  const 표나옴 = 술술(끼(4.2, 4.7));
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  const 줄 = 위.map((p, i) => {
    const 때 = 4.9 + i * 0.28;
    const o = 술술(끼(때, 때 + 0.3));
    return `<tr style="opacity:${o.toFixed(2)}"><td class="ㄹ">${p.name}</td>`
      + d.editions.map((e) => `<td class="${e === 꼴 ? 'ㄴ 꼴' : 'ㄴ'}">${p.byEdition[e]}</td>`).join('')
      + '</tr>';
  }).join('');

  const 없는줄 = [
    'Per million reads of that edition \u2014 size is already divided out',
    `${d.last[꼴]} of ${d.peopleInAllFour} stars, and all ${d.topOfList.looked} of the most-read`,
    'The six commonest orders all end the same way',
  ].map((t, i) => {
    const o = 술술(끼(9.0 + i * 0.3, 9.6 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${t}</li>`;
  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#14100a;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#a9873f;opacity:${머리띠.toFixed(2)}}
    .큰{position:absolute;left:84px;right:84px;top:172px;opacity:${머리.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 머리).toFixed(3)});transform-origin:left top}
    .큰 b{display:block;font-size:62px;font-weight:900;line-height:1.06;letter-spacing:-.03em;
          color:#e9e6dd}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:40px;font-weight:900;
           color:#e0b25b;letter-spacing:-.02em}

    /* ⛔⛔ 이 상자가 표보다 먼저 뜬다. 3초에 넘기는 손님도 이것을 본다 */
    .반{position:absolute;left:84px;right:84px;top:490px;opacity:${반론.toFixed(2)};
        transform:translateY(${((1 - 반론) * 18).toFixed(1)}px);
        border-left:6px solid #a9873f;padding-left:28px}
    .반 h3{font-size:25px;font-weight:800;letter-spacing:.08em;color:#a9873f;margin-bottom:12px}
    .반 p{font-size:31px;color:#cfc6b8;line-height:1.34}
    .반 b{color:#e9e6dd}

    .표{position:absolute;left:84px;right:84px;top:830px;opacity:${(표나옴 * (1 - 끝)).toFixed(2)}}
    .표 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#7a6a4f;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:10px 0;border-top:1px solid #2a2216}
    .ㄹ{font-size:29px;font-weight:800;color:#e9e6dd}
    .ㄴ{font-size:27px;font-weight:700;color:#cfc6b8;text-align:right}
    .꼴{color:#e0b25b;font-weight:900}

    .없{position:absolute;left:84px;right:84px;top:1330px;opacity:${(1 - 끝).toFixed(2)}}
    .없 h3{font-size:25px;font-weight:800;letter-spacing:.1em;color:#7a6a4f;margin-bottom:14px;
           opacity:${술술(끼(8.6, 9.0)).toFixed(2)}}
    .없 li{list-style:none;font-size:27px;color:#cfc6b8;line-height:1.3;margin-bottom:12px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#5d4d2f}

    .끝{position:absolute;left:84px;right:84px;top:1560px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:32px;font-weight:800;color:#e0b25b}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#7a6a4f}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <b>${앞두명[0].name} peaks in ${d.countryNames[앞두명[0].most]}.<br>${앞두명[1].name} in ${d.countryNames[앞두명[1].most]}.</b>
      <em>All ${d.topOfList.looked} end in the same place</em>
    </div>

    <!-- ⛔⛔ 반론이 표보다 먼저. 3초에 넘기는 손님도 본다 -->
    <div class="반">
      <h3>BEFORE THE TABLE</h3>
      <p>Malay and Indonesian <b>read across</b>. A reader in Kuala Lumpur can open the Indonesian
        article \u2014 and then the reading lands in the Indonesian column. We cannot separate that
        from <b>not looking</b>.</p>
    </div>

    <div class="표">
      <h3>READS PER MILLION \u00b7 ${d.editions.map((e) => d.countryNames[e].toUpperCase()).join(' \u00b7 ')}</h3>
      <table><tbody>${줄}</tbody></table>
    </div>

    <div class="없">
      <h3>WHAT THE NUMBER IS AND IS NOT</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>The argument is only ever<br>about first place.</b>
      <span>kculturewire.com/who-reads-least</span>
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
  const 투명도 = (t, 이름) => {
    const m = 칸HTML(t).match(new RegExp(`\\.${이름}\\{[^}]*opacity:([0-9.]+)`));
    return m ? Number(m[1]) : null;
  };

  재본다('첫 화면에 이름 둘이 있다', 글자만(칸HTML(0.6)),
    (s) => 앞두명.every((p) => s.includes(p.name)));
  재본다('⭐ 두 사람이 서로 다른 나라에서 1등이다', 앞두명[0].most !== 앞두명[1].most, true);
  재본다('⭐ 「다 같은 데서 끝난다」가 같이 뜬다', 글자만(칸HTML(0.6)),
    (s) => /end in the same place/.test(s));

  /**
   * ⛔⛔ 이 시험이 이 편의 전부다 — **표가 뜨는 순간에 반론이 이미 화면에 있어야 한다.**
   */
  재본다('⛔⛔ 반론이 표보다 먼저 뜬다', [투명도(4.2, '반'), 투명도(4.2, '표')],
    (v) => v[0] > 0.9 && v[1] < 0.2);
  재본다('⛔⛔ 표가 다 뜬 뒤에도 반론이 화면에 있다', 글자만(칸HTML(7)),
    (s) => /read across/.test(s) && /not looking/.test(s));
  재본다('⛔ 3초에 넘겨도 반론을 본다', 글자만(칸HTML(3.0)), (s) => /read across/.test(s));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  const 표이름 = (t) => [...칸HTML(t).matchAll(/class="ㄹ">([^<]*)</g)].map((m) => m[1]);
  재본다('표에 이름이 여섯 줄이다', 표이름(8).length, 위.length);
  재본다('⭐ 네 나라 수가 다 있다', 글자만(칸HTML(8)),
    (s) => 위.every((p) => d.editions.every((e) => s.includes(String(p.byEdition[e])))));
  재본다('⭐ 꼴찌 칸이 다른 빛이다', (칸HTML(8).match(/class="ㄴ 꼴"/g) ?? []).length, 위.length);

  재본다('⛔ 「판이 작아서」가 아니라고 적는다', 글자만(칸HTML(10)),
    (s) => /size is already divided out/.test(s));
  재본다('⛔ 「인기」·「무시」 같은 말을 안 쓴다',
    글자만(칸HTML(2)) + 글자만(칸HTML(8)) + 글자만(칸HTML(13)),
    (s) => !/\b(popular|famous|ignored|uninterested|nobody cares)\b/i.test(s));

  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map((t) => 투명도(t, '띠')),
    (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다', 투명도(0.6, '띠'), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/who-reads-least'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(8)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-least.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwleast');
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.mkdirSync(임시, { recursive: true });

  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
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
