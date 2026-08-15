#!/usr/bin/env node
/**
 * make-video-kcw-places.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「한국의 한 음반사가 서울보다 많이 읽힌다」 (`/places`)
 *
 * ── 왜 이 편이 없었나 ─────────────────────────────────────────
 * 8/15 에 세어 보니 **카드뉴스는 12벌인데 영상은 9편**이었다. `places`·`malaysia`·`manager`
 * 세 벌이 소리 없이 비어 있었다. ⛔ 카드가 있는데 영상이 없으면 그 벌은 절반만 나간 것이다.
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-places.json` 에서 읽는다.
 * ⛔⛔ **순위표로 줄세우지 않는다.** 열다섯 자리를 늘어놓지 않는다 — 갈래 넷의 **성질**만 낸다.
 *    ⚠ 「1등 YG」가 아니라 「회사 하나가 도시 520개보다 위」가 이 편의 말이다.
 * ⛔ **읽음을 방문으로 팔지 않는다.** 「a read is curiosity, not a trip」이 안 하는 말에 있다.
 * ⛔ 네 나라가 **안 맞는다**는 것을 끝에 남긴다. 하나로 뭉뚱그리면 거짓이 된다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다(8/15). 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-places.mjs --out public/wikitip/video/places.mp4
 *   node scripts/make-video-kcw-places.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-places.json', 'utf8'));

/**
 * 갈래 하나를 꺼낸다. ⛔ 없으면 지어내지 않고 멈춘다.
 * 🔴 처음에 `x.key` 로 찾다가 멈췄다 — 자료의 칸 이름은 `group` 이다.
 *   ⭐ 멈춰 준 것이 옳다. 못 찾은 채로 지나갔으면 빈 화면이 나갔을 것이다.
 */
export function 무리(key) {
  const g = d.groups.find((x) => x.group === key);
  if (!g) throw new Error(`groups 에 ${key} 가 없다 — 자료가 바뀌었다`);
  return g;
}
export const 회사 = 무리('company');
export const 도시 = 무리('admin');
export const 역 = 무리('station');
export const 유산 = 무리('heritage');

/** ⭐ 갈래 넷을 화면 순서대로. 순위가 아니라 **갈래**다 */
export const 갈래들 = [도시, 회사, 유산, 역];

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
   * ⛔ 회사 수만 먼저 띄우면 그 사이 프레임이 「111.47」 단독 화면이 된다. 견줄 것이 없으면 뜻이 없다.
   */
  const 둘등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–7.0 — 갈래 넷이 하나씩 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 표줄 = 갈래들.map((g, i) => {
    const 때 = 3.0 + i * 0.55;
    const o = 술술(끼(때, 때 + 0.4));
    /* ⭐ 회사 줄만 다른 빛 — 중앙값이 가장 높은 갈래다. 🔴 칸 이름은 `key` 가 아니라 `group` */
    const 결 = g.group === 'company' ? ' 짚' : '';
    return `<tr style="opacity:${o.toFixed(2)}">`
      + `<td class="ㄹ${결}">${g.label}</td>`
      + `<td class="ㅂ">${g.places}</td>`
      + `<td class="ㅅ${결}">${g.medianPlace}</td></tr>`;
  }).join('');

  /* ③ 5.6–8.0 */
  const 짚기 = 술술(끼(5.6, 6.2));

  /* ④ 8.2–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not visits \u2014 a read is curiosity, not a trip',
    'Not venues \u2014 Wikipedia has no article for a single restaurant or cafe',
    'Not the Philippines \u2014 the Tagalog edition is too small to measure with',
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
    .둘{display:flex;align-items:baseline;gap:26px}
    .둘 b{font-size:112px;font-weight:900;line-height:.9;letter-spacing:-.04em}
    .둘 .ㄴ{color:#c9a6ff}
    .둘 .ㅇ{color:#e9e6dd}
    .둘 i{font-style:normal;font-size:44px;font-weight:700;color:#6a6478}
    .큰 span{display:block;margin-top:18px;font-size:32px;font-weight:700;color:#c9a6ff;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:470px;font-size:34px;color:#a49bb8;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}

    .표{position:absolute;left:84px;right:84px;top:700px;opacity:${표나옴.toFixed(2)}}
    table{width:100%;border-collapse:collapse}
    th{font-size:24px;font-weight:700;color:#8f88a0;text-align:right;padding:0 0 12px}
    th:first-child{text-align:left}
    td{padding:15px 0;border-top:1px solid #241f31}
    .ㄹ{font-size:30px;font-weight:700;color:#cdc6dc}
    .ㅂ{font-size:32px;color:#8f88a0;text-align:right}
    .ㅅ{font-size:34px;font-weight:800;color:#cdc6dc;text-align:right}
    .짚{color:#c9a6ff}
    .짚말{position:absolute;left:84px;right:84px;top:1090px;font-size:31px;color:#a49bb8;
          line-height:1.4;opacity:${짚기.toFixed(2)}}
    .짚말 b{color:#e9e6dd}

    .없{position:absolute;left:84px;right:84px;top:1290px}
    .없 h3{font-size:27px;font-weight:800;letter-spacing:.1em;color:#8f88a0;margin-bottom:20px;
           opacity:${술술(끼(8.2, 8.6)).toFixed(2)}}
    .없 li{list-style:none;font-size:30px;color:#a49bb8;line-height:1.34;margin-bottom:16px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#6a5b86}

    .끝{position:absolute;left:84px;right:84px;top:1560px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:33px;font-weight:800;color:#c9a6ff}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:24px;color:#6a6478}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <div class="둘"><b class="ㄴ">${d.topCompany.total}</b><i>vs</i><b class="ㅇ">${d.topCity.total}</b></div>
      <span>${d.topCompany.name} against ${d.topCity.name}, reads per million</span>
    </div>
    <div class="밑">One Korean record label is looked up more than the capital is,
      across four Southeast Asian Wikipedias.</div>

    <div class="표">
      <table>
        <thead><tr><th>Kind of place</th><th>Places</th><th>Median</th></tr></thead>
        <tbody>${표줄}</tbody>
      </table>
    </div>
    <!--
      🔴🔴 8/15 — 여기 처음엔 「520 of the 520」이 나왔다. 두 수가 **같다.**
        잰 도시 가운데 그 회사보다 위인 곳이 **하나도 없다**는 뜻이다.
      ⛔ 「520 of 520」은 어색하기만 한 게 아니라 **말을 약하게 한다.** 전부라고 말한다.
      ⚠ 그러나 두 수가 갈리는 날이 오면 그때는 갈라서 말해야 한다 — 그래서 셈으로 가른다.
    -->
    <div class="짚말">${d.citiesBelowTopCompany === d.citiesCounted
    ? `<b>Every one</b> of the ${d.citiesCounted} Korean cities and districts we measured
       sits below that one company.`
    : `<b>${d.citiesBelowTopCompany}</b> of the ${d.citiesCounted} Korean cities and districts
       we measured sit below that one company.`}</div>

    <div class="없">
      <h3>WHAT THIS CANNOT SEE</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>The four countries do not agree.<br>Read across, not down.</b>
      <span>kculturewire.com/places</span>
      <i>Wikidata (CC0) \u00b7 Wikimedia Pageviews \u00b7 ${d.placesMeasured.toLocaleString('en-US')} places</i>
    </div>
  </div>`;
}

const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 글자만 = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  const 재본다 = (이름, 값, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(값) : JSON.stringify(값) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.log(`  ⛔ ${이름}  →  ${JSON.stringify(값)}`); }
  };

  /**
   * ⛔ **첫 화면에 두 수가 같이 있다.** 회사 수만 뜨는 프레임은 견줄 것이 없어 뜻이 없다.
   */
  재본다('⛔ 첫 화면에 두 수가 같이 있다', 글자만(칸HTML(0.6)),
    (s) => s.includes(String(d.topCompany.total)) && s.includes(String(d.topCity.total)));
  재본다('⛔ 한쪽만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(칸HTML(t));
      return x.includes(String(d.topCompany.total)) === x.includes(String(d.topCity.total));
    }), (xs) => xs.every(Boolean));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  재본다('표가 갈래 넷이다', (칸HTML(7).match(/class="ㅂ"/g) ?? []).length, 갈래들.length);
  재본다('⭐ 회사 줄만 다른 빛이다', (칸HTML(7).match(/class="ㅅ 짚"/g) ?? []).length, 1);
  재본다('⭐ 갈래마다 이름·개수·중앙값이 있다', 글자만(칸HTML(7)),
    (s) => 갈래들.every((g) => s.includes(g.label) && s.includes(String(g.places))
      && s.includes(String(g.medianPlace))));

  /**
   * ⛔⛔ 순위표로 줄세우지 않는다 — 열다섯 자리를 늘어놓지 않는다.
   * ⚠ 맨 위 둘(회사·서울)은 **견주려고** 이름을 쓴다. 그것은 순위표가 아니라 대비다.
   *
   * 🔴 8/15 — 처음엔 「topOverall 이름이 화면 글자에 있나」로 쟀고 걸렸다.
   *   걸린 것은 `"Korean"` 이었다 — 화면의 「One **Korean** record label」에 부분 일치한 것이다.
   *   ⛔ 그건 자리 이름이 아니라 그냥 낱말이다. **표에 늘어섰나**를 봐야 옳다.
   */
  /* ⚠ `match` 는 그룹을 안 준다 — `matchAll` 로 받아야 끝의 `<` 가 안 남는다 */
  const 표칸 = (t) => [...칸HTML(t).matchAll(/class="ㄹ[^"]*">([^<]*)</g)].map((m) => m[1]);
  재본다('⛔⛔ 표에 자리 이름이 늘어서지 않는다', 표칸(7),
    (칸들) => 칸들.every((c) => 갈래들.some((g) => g.label === c)));
  재본다('⛔ 표에 든 것은 갈래뿐이다', 표칸(7).length, 갈래들.length);
  재본다('⭐ 맨 위 둘은 이름으로 견준다', 글자만(칸HTML(7)),
    (s) => s.includes(d.topCompany.name) && s.includes(d.topCity.name));

  /**
   * 🔴 8/15 — 처음 화면에 「520 of the 520」이 나왔다. **두 수가 같다.**
   *   잰 도시 가운데 그 회사보다 위인 곳이 하나도 없다는 뜻이다.
   * ⛔ 「520 of 520」은 어색하기만 한 게 아니라 **말을 약하게 한다.** 전부라고 말한다.
   * ⚠ 두 수가 갈리는 날엔 갈라서 말해야 하니 셈으로 가른다.
   */
  재본다('⭐ 잰 도시 수가 화면에 있다', 글자만(칸HTML(7)),
    (s) => s.includes(String(d.citiesCounted)));
  재본다('⛔⛔ 전부일 땐 「N of N」이라 하지 않는다', 글자만(칸HTML(7)),
    (s) => (d.citiesBelowTopCompany === d.citiesCounted
      ? /Every one/.test(s) && !new RegExp(`${d.citiesCounted}\\s+of the ${d.citiesCounted}`).test(s)
      : s.includes(String(d.citiesBelowTopCompany))));

  /* 🔴 카드뉴스가 조심한 것은 영상도 조심한다 */
  재본다('⛔ 읽음을 방문으로 팔지 않는다', 글자만(칸HTML(10)),
    (s) => /curiosity, not a trip/.test(s));
  재본다('⛔ 없는 것을 적는다 — 가게·필리핀', 글자만(칸HTML(10)),
    (s) => /restaurant or cafe/.test(s) && /Tagalog/.test(s));
  재본다('⛔ 네 나라가 안 맞는다고 끝맺는다', 글자만(칸HTML(13)),
    (s) => /do not agree/.test(s.replace(/\s+/g, ' ')));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/places'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(7)),
    (s) => !/[가-힣]/.test(s));

  /* ⛔ 수를 손으로 안 박는다 — 자료가 바뀌면 화면도 바뀐다 */
  재본다('⭐ 잰 곳 수가 화면에 있다', 글자만(칸HTML(13)),
    (s) => s.includes(d.placesMeasured.toLocaleString('en-US')));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-places.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwplaces');
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
