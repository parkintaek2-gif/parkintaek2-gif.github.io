#!/usr/bin/env node
/**
 * make-video-kcw-malaysia.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「사람 넷은 좁은 띠 안에 있고, 물건 하나만 그 밖에 있다」 (`/malaysia`)
 *
 * ── 왜 이 편이 없었나 ─────────────────────────────────────────
 * 8/15 에 세어 보니 **카드뉴스는 12벌인데 영상은 9편**이었다. `places`(냈다)·`malaysia`·
 * `manager` 가 비어 있었다. ⛔ 카드가 있는데 영상이 없으면 그 벌은 절반만 나간 것이다.
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-malaysia.json` 에서 읽는다.
 * ⛔⛔ **브랜드가 스물둘뿐이라는 것을 화면에 둔다.** 23% 는 스물둘로 잰 몫이다.
 *    ⚠ 표본을 감추고 배수만 보이면 그건 자랑이지 셈이 아니다.
 * ⛔ **까닭을 지어내지 않는다.** 「Four agree, one does not」이 이 편의 전부다.
 *    ⚠ 몫은 까닭이 아니다. 우리는 까닭을 안 쟀다.
 * ⛔ **읽힘을 인기로 팔지 않는다.** 「it counts people looking something up」이 안 하는 말에 있다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다(8/15). 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-malaysia.mjs --out public/wikitip/video/malaysia.mp4
 *   node scripts/make-video-kcw-malaysia.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-malaysia.json', 'utf8'));

/** ⛔ 없으면 지어내지 않고 멈춘다 */
export function 무리(key) {
  const g = d.sharesByGroup.find((x) => x.group === key);
  if (!g) throw new Error(`sharesByGroup 에 ${key} 가 없다 — 자료가 바뀌었다`);
  return g;
}
export const 브랜드 = 무리('brands');
/** ⭐ 사람 넷 — 화면에 나오는 차례 그대로. 순위가 아니라 **갈래**다 */
export const 사람무리 = d.sharesByGroup.filter((g) => g.group !== 'brands');
export const 다섯줄 = [...사람무리, 브랜드];
export const [낮, 높음] = d.peopleShareRangePc;

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
   * ① 0.0–2.2 — **띠와 그 밖의 수가 같이 박힌다.**
   * ⛔ 23% 만 먼저 띄우면 견줄 것이 없어 그저 큰 수가 된다. 띠를 같이 올린다.
   */
  const 둘등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–7.0 — 다섯 줄이 하나씩. 넷이 붙고 하나가 떨어진다 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 표줄 = 다섯줄.map((g, i) => {
    const 때 = 3.0 + i * 0.5;
    const o = 술술(끼(때, 때 + 0.4));
    /* ⭐ 브랜드 줄만 다른 빛 — 띠 밖에 있는 하나다 */
    const 결 = g.group === 'brands' ? ' 짚' : '';
    return `<tr style="opacity:${o.toFixed(2)}">`
      + `<td class="ㄹ${결}">${g.label}</td>`
      + `<td class="ㅂ">${g.people.toLocaleString('en-US')}</td>`
      + `<td class="ㅅ${결}">${g.malaysiaSharePc}%</td></tr>`;
  }).join('');

  /* ③ 5.8–8.0 — ⛔ 스물둘이라는 표본을 여기서 말한다 */
  const 짚기 = 술술(끼(5.8, 6.4));

  /* ④ 8.2–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not why \u2014 a share is not a reason, and we did not measure one',
    'Not population \u2014 we divide by the size of each Wikipedia, not by who lives there',
    'Not Malaysia alone \u2014 Malay is read elsewhere, and many Malaysians read in English',
  ].map((t, i) => {
    const o = 술술(끼(8.6 + i * 0.3, 9.2 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${t}</li>`;
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
    .둘{display:flex;align-items:baseline;gap:24px;flex-wrap:wrap}
    .둘 b{font-size:104px;font-weight:900;line-height:.9;letter-spacing:-.04em}
    .둘 .ㄴ{color:#e9e6dd}
    .둘 .ㅇ{color:#c9a6ff}
    .둘 i{font-style:normal;font-size:42px;font-weight:700;color:#6a6478}
    .큰 span{display:block;margin-top:18px;font-size:32px;font-weight:700;color:#c9a6ff;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:480px;font-size:34px;color:#a49bb8;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}

    .표{position:absolute;left:84px;right:84px;top:700px;opacity:${표나옴.toFixed(2)}}
    table{width:100%;border-collapse:collapse}
    th{font-size:24px;font-weight:700;color:#8f88a0;text-align:right;padding:0 0 12px}
    th:first-child{text-align:left}
    td{padding:14px 0;border-top:1px solid #241f31}
    .ㄹ{font-size:29px;font-weight:700;color:#cdc6dc}
    .ㅂ{font-size:30px;color:#8f88a0;text-align:right}
    .ㅅ{font-size:34px;font-weight:800;color:#cdc6dc;text-align:right}
    .짚{color:#c9a6ff}
    .짚말{position:absolute;left:84px;right:84px;top:1120px;font-size:31px;color:#a49bb8;
          line-height:1.4;opacity:${짚기.toFixed(2)}}
    .짚말 b{color:#e9e6dd}

    .없{position:absolute;left:84px;right:84px;top:1300px}
    .없 h3{font-size:27px;font-weight:800;letter-spacing:.1em;color:#8f88a0;margin-bottom:20px;
           opacity:${술술(끼(8.2, 8.6)).toFixed(2)}}
    .없 li{list-style:none;font-size:29px;color:#a49bb8;line-height:1.34;margin-bottom:15px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#6a5b86}

    .끝{position:absolute;left:84px;right:84px;top:1560px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:42px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:33px;font-weight:800;color:#c9a6ff}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:24px;color:#6a6478}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <div class="둘"><b class="ㄴ">${낮}\u2013${높음}%</b><i>vs</i><b class="ㅇ">${d.brandSharePc}%</b></div>
      <span>Malaysia's share of all four-country reading, by group</span>
    </div>
    <div class="밑">Four kinds of people sit inside a
      ${(높음 - 낮).toFixed(1)}-point band. One kind of thing sits well outside it.</div>

    <div class="표">
      <table>
        <thead><tr><th>Group</th><th>Counted</th><th>Malaysia's share</th></tr></thead>
        <tbody>${표줄}</tbody>
      </table>
    </div>
    <!--
      ⛔⛔ 스물둘이라는 표본을 여기서 말한다. 표본을 감추고 배수만 보이면 자랑이지 셈이 아니다.
    -->
    <div class="짚말">That last row is <b>${브랜드.people}</b> brands, not thousands \u2014
      a small count, and we say so before we say ${d.brandOverPeopleRatio}\u00d7.</div>

    <div class="없">
      <h3>WHAT IS NOT IN HERE</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>Four agree. One does not.<br>We leave the reason open.</b>
      <span>kculturewire.com/malaysia</span>
      <i>Wikidata (CC0) \u00b7 Wikimedia Pageviews \u00b7 Malay Wikipedia, 12 months</i>
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

  /* ⛔ 23% 만 뜨는 프레임은 견줄 것이 없어 그저 큰 수다 */
  재본다('⛔ 첫 화면에 띠와 그 밖이 같이 있다', 글자만(칸HTML(0.6)),
    (s) => s.includes(`${낮}\u2013${높음}%`) && s.includes(`${d.brandSharePc}%`));
  재본다('⛔ 한쪽만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(칸HTML(t));
      return x.includes(`${낮}\u2013${높음}%`) === x.includes(`${d.brandSharePc}%`);
    }), (xs) => xs.every(Boolean));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  const 표칸 = (t) => [...칸HTML(t).matchAll(/class="ㄹ[^"]*">([^<]*)</g)].map((m) => m[1]);
  재본다('표가 다섯 줄이다', 표칸(7).length, 다섯줄.length);
  재본다('⭐ 브랜드 줄만 다른 빛이다', (칸HTML(7).match(/class="ㅅ 짚"/g) ?? []).length, 1);
  재본다('⭐ 갈래마다 이름·개수·몫이 있다', 글자만(칸HTML(7)),
    (s) => 다섯줄.every((g) => s.includes(g.label)
      && s.includes(g.people.toLocaleString('en-US')) && s.includes(`${g.malaysiaSharePc}%`)));

  /**
   * ⛔⛔ **표본을 감추지 않는다.** 23% 는 스물둘로 잰 몫이다.
   *   ⚠ 배수(2.8×)를 말하기 **전에** 스물둘을 말해야 한다 — 순서가 정직함이다.
   */
  재본다('⛔⛔ 브랜드가 스물둘뿐이라고 화면에 적는다', 글자만(칸HTML(7)),
    (s) => new RegExp(`${브랜드.people}\\s+brands`).test(s.replace(/\s+/g, ' ')));
  재본다('⛔ 배수보다 표본을 먼저 말한다', 글자만(칸HTML(7)).replace(/\s+/g, ' '),
    (s) => s.indexOf(`${브랜드.people} brands`) < s.indexOf(`${d.brandOverPeopleRatio}×`));
  재본다('⭐ 띠 폭이 화면에 있다', 글자만(칸HTML(7)),
    (s) => s.includes(`${(높음 - 낮).toFixed(1)}-point band`));

  /* 🔴 카드뉴스가 조심한 것은 영상도 조심한다 */
  재본다('⛔ 까닭을 지어내지 않는다', 글자만(칸HTML(10)),
    (s) => /a share is not a reason/.test(s));
  재본다('⛔ 인구로 나눈 것이 아니라고 적는다', 글자만(칸HTML(10)),
    (s) => /size of each Wikipedia/.test(s));
  재본다('⛔ 말레이어가 말레이시아만의 것이 아니라고 적는다', 글자만(칸HTML(10)),
    (s) => /read in English/.test(s));
  재본다('⭐ 끝에 세우는 것이 「까닭은 열어 둔다」', 글자만(칸HTML(13)),
    (s) => /Four agree\. One does not\.\s*We leave the reason open\./.test(s.replace(/\s+/g, ' ')));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/malaysia'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(7)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-malaysia.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwmalaysia');
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
