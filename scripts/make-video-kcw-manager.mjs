#!/usr/bin/env node
/**
 * make-video-kcw-manager.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「선수는 넷에 퍼지고, 감독은 자기를 부른 한 나라에서만 읽힌다」 (`/sea-athletes`)
 *
 * ── 왜 이 편이 마지막이었나 ───────────────────────────────────
 * 8/15 에 세어 보니 **카드뉴스 12벌에 영상 9편**이었다. `places`·`malaysia` 를 채우고
 * 이것이 마지막이었다. ⛔ 카드가 있는데 영상이 없으면 그 벌은 절반만 나간 것이다.
 *
 * 🔴🔴 그런데 이 편을 만들려고 자료를 열었다가 **중앙값이 두 가지 뜻으로 나가는 것**을
 *   찾았다. 이 자료의 빌더만 `v[v.length >> 1]` 로 짝수일 때 위쪽 값을 택하고 있었다.
 *   감독 82.4 → 81.35, 선수 50.6 → 50.55 로 고치고 기사에 정정을 냈다.
 *   ⭐ **영상을 만들기 전에 수부터 바로잡았다.** 틀린 수를 담은 영상은 안 만든다.
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-sea-athletes.json` 에서 읽는다.
 * ⛔⛔ **순위표로 줄세우지 않는다.** 감독을 한 줄로 세우는 것이 아니라, 사람마다
 *    **어느 나라에서 읽히나**를 보인다. 그것이 이 편의 말이다.
 * ⛔ **12명·14명이라는 표본을 화면에 둔다.** 그리고 하나 빼기 판정도 같이 낸다 —
 *    ⚠ 작은 표본의 중앙값을 그냥 실으면 안 된다는 것이 94편의 자다.
 * ⛔ **읽힘을 인기로 팔지 않는다.** 「this counts people looking someone up」.
 * ⛔ **역할을 안다고 하지 않는다.** 위키데이터는 선수도 감독도 같이 적는다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다(8/15). 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-manager.mjs --out public/wikitip/video/manager.mp4
 *   node scripts/make-video-kcw-manager.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-sea-athletes.json', 'utf8'));

export const 나라 = Object.fromEntries(d.editions.map((e) => [e.code, e.country]));
/** ⭐ 순위가 아니라 **어디서 읽히나**를 보이려고 넷만 든다 */
export const 감독넷 = d.footballManagers.slice(0, 4);
export const 감독수 = d.footballManagers.length;
export const 선수수 = d.playersListed;

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export const 툭 = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.70158 + 1;
  return 1 + c * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
};
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 1 * (초 >= 까지);
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /**
   * ① 0.0–2.2 — **두 중앙값이 같이 박힌다.**
   * ⛔ 81.35% 만 먼저 띄우면 견줄 것이 없어 그냥 큰 수다. 선수 쪽을 같이 올린다.
   */
  const 둘등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–7.0 — 감독 넷이 하나씩. 순위가 아니라 「어느 나라」다 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 표줄 = 감독넷.map((m, i) => {
    const 때 = 3.0 + i * 0.55;
    const o = 술술(끼(때, 때 + 0.4));
    return `<tr style="opacity:${o.toFixed(2)}">`
      + `<td class="ㄹ">${m.name}</td>`
      + `<td class="ㅂ">${나라[m.topEdition]}</td>`
      + `<td class="ㅅ 짚">${m.topSharePc}%</td></tr>`;
  }).join('');

  /* ③ 5.8–8.0 — ⛔ 표본과 하나빼기 판정을 여기서 말한다 */
  const 짚기 = 술술(끼(5.8, 6.4));

  /* ④ 8.2–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not which role a reader came for \u2014 Wikidata records both for anyone who played then managed',
    'Not popularity \u2014 this counts people looking someone up',
    'Not the Philippines \u2014 the Tagalog Wikipedia is too small to measure with',
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
    .둘 b{font-size:100px;font-weight:900;line-height:.9;letter-spacing:-.04em}
    .둘 .ㄴ{color:#e9e6dd}
    .둘 .ㅇ{color:#c9a6ff}
    .둘 i{font-style:normal;font-size:42px;font-weight:700;color:#6a6478}
    .큰 span{display:block;margin-top:18px;font-size:32px;font-weight:700;color:#c9a6ff;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:480px;font-size:34px;color:#a49bb8;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}

    .표{position:absolute;left:84px;right:84px;top:720px;opacity:${표나옴.toFixed(2)}}
    table{width:100%;border-collapse:collapse}
    th{font-size:24px;font-weight:700;color:#8f88a0;text-align:right;padding:0 0 12px}
    th:first-child{text-align:left}
    td{padding:16px 0;border-top:1px solid #241f31}
    .ㄹ{font-size:30px;font-weight:700;color:#cdc6dc}
    .ㅂ{font-size:29px;color:#8f88a0;text-align:right}
    .ㅅ{font-size:34px;font-weight:800;text-align:right}
    .짚{color:#c9a6ff}
    .짚말{position:absolute;left:84px;right:84px;top:1120px;font-size:30px;color:#a49bb8;
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
    .끝 b{display:block;font-size:41px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:33px;font-weight:800;color:#c9a6ff}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:24px;color:#6a6478}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <div class="둘"><b class="ㄴ">${d.medianTopSharePlayers}%</b><i>vs</i><b class="ㅇ">${d.medianTopShareManagers}%</b></div>
      <span>Median share of a person's reading sitting in one country \u2014 players, then managers</span>
    </div>
    <div class="밑">A Korean player is read across Southeast Asia. A Korean manager is read
      in the one country that hired him.</div>

    <div class="표">
      <table>
        <thead><tr><th>Manager</th><th>Read mostly in</th><th>Share</th></tr></thead>
        <tbody>${표줄}</tbody>
      </table>
    </div>
    <!--
      ⛔⛔ 표본과 하나 빼기 판정을 같이 말한다. 작은 표본의 중앙값을 그냥 실으면 안 된다(94편).
    -->
    <div class="짚말">Read evenly across the four lands, a person lands near 25%.
      From <b>${감독수}</b> managers and <b>${선수수}</b> players \u2014 small counts, so we
      removed each person in turn and the two figures held.</div>

    <div class="없">
      <h3>WHAT IS NOT IN HERE</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>Read where he was hired,<br>and almost nowhere else.</b>
      <span>kculturewire.com/sea-athletes</span>
      <i>Wikidata (CC0) \u00b7 Wikimedia Pageviews \u00b7 four Wikipedias, 12 months</i>
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

  /* ⛔ 감독 수만 뜨는 프레임은 견줄 것이 없어 그냥 큰 수다 */
  재본다('⛔ 첫 화면에 두 중앙값이 같이 있다', 글자만(칸HTML(0.6)),
    (s) => s.includes(`${d.medianTopSharePlayers}%`) && s.includes(`${d.medianTopShareManagers}%`));
  재본다('⛔ 한쪽만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(칸HTML(t));
      return x.includes(`${d.medianTopSharePlayers}%`) === x.includes(`${d.medianTopShareManagers}%`);
    }), (xs) => xs.every(Boolean));

  /**
   * 🔴🔴 8/15 — 이 자료의 빌더만 짝수일 때 **위쪽 값**을 중앙값으로 냈다(82.4 · 50.6).
   *   관례로 통일해 81.35 · 50.55 가 됐다. ⛔ 옛 수가 화면에 남아 있으면 안 된다.
   */
  /**
   * 🔴 처음에 이 시험을 `… || true` 로 써 놓았다. **늘 통과하는 시험**이다.
   *   ⛔ 자가시험이 하루 종일 안 돌던 것을 오늘 겪고서 그런 것을 쓰면 안 된다.
   * ⚠ 도망친 까닭은 82.4% 가 **표에 실제로 있기** 때문이다 — Park Hang-seo 개인의
   *   쏠림이고, 옛 중앙값과 우연히 같은 수다. 그래서 **첫 화면만** 본다. 거기가 중앙값 자리다.
   */
  /* ⚠ 「첫 화면」은 HTML 전체가 아니다 — 표도 글자로는 늘 들어 있고, 투명도가 보임을 정한다.
       ⭐ 중앙값이 앉는 자리는 `.큰` 블록이다. 거기만 본다. */
  /* 🔴 처음엔 `.큰` 을 잡으려 했는데 그 안에 div 가 겹쳐 있어 정규식이 뒤까지 먹었다.
       ⭐ 두 수가 실제로 앉는 곳은 `.둘` 이고, 그 안에는 `<b>`·`<i>` 뿐이라 정확히 잡힌다. */
  const 큰블록 = (t) => (칸HTML(t).match(/<div class="둘">[\s\S]*?<\/div>/) ?? [''])[0];
  재본다('⛔⛔ 중앙값 자리에 옛 수가 남아 있지 않다', 글자만(큰블록(0.6)),
    (s) => !/\b82\.4%/.test(s) && !/\b50\.6%/.test(s));
  재본다('⭐ 중앙값 자리에 지금 수가 있다', 글자만(큰블록(0.6)),
    (s) => s.includes(`${d.medianTopShareManagers}%`)
      && s.includes(`${d.medianTopSharePlayers}%`));
  재본다('⭐ 지금 자료의 수를 그대로 쓴다', 글자만(칸HTML(0.6)),
    (s) => s.includes(`${d.medianTopShareManagers}%`)
      && s.includes(`${d.medianTopSharePlayers}%`));
  /* ⚠ 표의 82.4% 는 사람 것이지 중앙값이 아니다 — 그 구분을 시험으로 남긴다 */
  재본다('⭐ 표의 같은 수는 사람 것이다', 글자만(칸HTML(7)),
    (s) => (감독넷.some((m) => m.topSharePc === 82.4) ? /82\.4%/.test(s) : true));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  const 표칸 = (t) => [...칸HTML(t).matchAll(/class="ㄹ[^"]*">([^<]*)</g)].map((m) => m[1]);
  재본다('표가 감독 넷이다', 표칸(7).length, 감독넷.length);
  재본다('⭐ 사람마다 이름·나라·몫이 있다', 글자만(칸HTML(7)),
    (s) => 감독넷.every((m) => s.includes(m.name) && s.includes(나라[m.topEdition])
      && s.includes(`${m.topSharePc}%`)));
  /* ⛔⛔ 순위표가 아니다 — 「어느 나라에서 읽히나」가 이 표의 뜻이다 */
  재본다('⛔⛔ 나라 칸이 표에 있다', 칸HTML(7), (h) => /Read mostly in/.test(h));
  재본다('⛔ 등수를 매기지 않는다', 글자만(칸HTML(7)),
    (s) => !/\b(1st|2nd|3rd|No\.\s*1|rank)\b/i.test(s));

  /**
   * ⛔⛔ 작은 표본의 중앙값을 그냥 싣지 않는다 — 94편의 자.
   */
  재본다('⛔⛔ 표본 수가 화면에 있다', 글자만(칸HTML(7)),
    (s) => s.includes(String(감독수)) && s.includes(String(선수수)));
  재본다('⛔⛔ 하나 빼기를 했다고 적는다', 글자만(칸HTML(7)),
    (s) => /removed each person in turn/.test(s.replace(/\s+/g, ' ')));
  /* ⚠ 자료가 「단단하다」일 때만 「held」라고 말할 수 있다 */
  재본다('⭐ 자료의 판정과 화면이 어긋나지 않는다', 글자만(칸HTML(7)),
    (s) => (d.stabilityManagers?.verdict?.steady && d.stabilityPlayers?.verdict?.steady
      ? /the two figures held/.test(s.replace(/\s+/g, ' '))
      : !/held/.test(s)));
  재본다('⭐ 고르면 25% 라는 잣대가 있다', 글자만(칸HTML(7)), (s) => /near 25%/.test(s));

  /* 🔴 카드뉴스가 조심한 것은 영상도 조심한다 */
  재본다('⛔ 역할을 안다고 하지 않는다', 글자만(칸HTML(10)),
    (s) => /played then managed/.test(s));
  재본다('⛔ 인기로 팔지 않는다', 글자만(칸HTML(10)),
    (s) => /looking someone up/.test(s));
  재본다('⛔ 필리핀을 뺀 까닭을 적는다', 글자만(칸HTML(10)), (s) => /Tagalog/.test(s));
  재본다('⭐ 끝에 세우는 것이 「부른 곳에서만」', 글자만(칸HTML(13)),
    (s) => /Read where he was hired, and almost nowhere else\./.test(s.replace(/\s+/g, ' ')));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/sea-athletes'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(7)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-manager.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwmanager');
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
