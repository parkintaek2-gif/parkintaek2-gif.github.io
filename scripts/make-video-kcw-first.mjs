#!/usr/bin/env node
/**
 * make-video-kcw-first.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「한 위키피디아가 먼저 적는다 — 그런데 가장 큰 곳이 아니다」 (`/written-down-first`)
 *
 * ── 왜 이 편이 비어 있었나 ───────────────────────────────────
 * 8/16 — 카드뉴스 14벌인데 영상이 13편이었다. 95편 벌만 영상이 없었다.
 * ⛔ 카드가 있는데 영상이 없으면 그 벌은 절반만 나간 것이다.
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-written-down-first.json` 에서 읽는다.
 * ⛔⛔ **순위표로 줄세우지 않는다.** 「먼저 적은 횟수」와 **「마지막인 횟수」**를 나란히 낸다 —
 *    ⭐ 이 편에서 제일 센 칸은 「먼저 24」가 아니라 **「마지막 0」**이다.
 * ⛔⛔ **크기 표를 반드시 넣는다.** 가장 흔한 설명을 죽이는 것이 이 기사의 값어치다.
 *    베트남어판이 문서 수에서 앞서는데도 먼저 적는 것은 인도네시아어판이다.
 * ⛔ **「왜」를 말하지 않는다.** 크기가 아니라는 것까지만.
 * ⛔ **적힌 때를 읽힌 때로 팔지 않는다.** 독자는 문서보다 먼저 올 수도 있다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-first.mjs --out public/wikitip/video/first.mp4
 *   node scripts/make-video-kcw-first.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-written-down-first.json', 'utf8'));

export const 셈 = d.arrivedFirst;
export const 자리 = d.places;
export const 크 = d.sizeControl;
/** ⭐ 먼저 적은 편수가 많은 차례 — 등수가 아니라 자료가 정한 차례다 */
export const 판차례 = [...d.editions].sort((a, b) => 셈.counts[b] - 셈.counts[a]);

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
   * ① 0.0–2.2 — **「먼저 24」와 「마지막 0」이 같이 박힌다.**
   * ⛔ 「24」만 띄우면 순위표가 된다. 「0」이 붙어야 「줄을 선다」가 된다.
   */
  const 둘등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–6.4 — 네 판. 먼저·마지막·자리를 한 줄에 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 표줄 = 판차례.map((p, i) => {
    const 때 = 3.0 + i * 0.45;
    const o = 술술(끼(때, 때 + 0.4));
    const 결 = p === 크.writesFirstMost ? ' 짚' : '';
    return `<tr style="opacity:${o.toFixed(2)}">`
      + `<td class="ㄹ${결}">${d.editionNames[p]}</td>`
      + `<td class="ㅂ${결}">${셈.counts[p]}</td>`
      + `<td class="ㅂ${결}">${자리.lastCount[p]}</td>`
      + `<td class="ㅅ${결}">${자리.medianPlace[p]}</td></tr>`;
  }).join('');

  /* ③ 6.6–8.2 — ⛔ 크기로 설명 안 된다 */
  const 크기말 = 술술(끼(6.6, 7.2));

  /* ④ 8.6–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not why \u2014 we ruled out one explanation, we did not find one',
    'Not readers \u2014 this counts when an article was written, not when anyone read it',
    'Not the Korean Wikipedia \u2014 its dates fail our check, so it is not on the page',
  ].map((t, i) => {
    const o = 술술(끼(8.8 + i * 0.3, 9.4 + i * 0.3));
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
    .큰{position:absolute;left:84px;right:84px;top:176px;opacity:${둘등장.toFixed(2)};
        transform:scale(${(0.86 + 0.14 * 둘등장).toFixed(3)});transform-origin:left top}
    .둘{display:flex;align-items:baseline;gap:22px;flex-wrap:wrap}
    .둘 b{font-size:104px;font-weight:900;line-height:.9;letter-spacing:-.04em}
    .둘 .ㄴ{color:#c9a6ff}
    .둘 .ㅇ{color:#e9e6dd}
    .둘 i{font-style:normal;font-size:36px;font-weight:700;color:#6a6478}
    .큰 span{display:block;margin-top:18px;font-size:31px;font-weight:700;color:#c9a6ff;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:472px;font-size:34px;color:#a49bb8;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}

    .표{position:absolute;left:84px;right:84px;top:700px;opacity:${표나옴.toFixed(2)}}
    table{width:100%;border-collapse:collapse}
    th{font-size:23px;font-weight:700;color:#8f88a0;text-align:right;padding:0 0 12px}
    th:first-child{text-align:left}
    td{padding:15px 0;border-top:1px solid #241f31}
    .ㄹ{font-size:30px;font-weight:700;color:#cdc6dc}
    .ㅂ{font-size:31px;color:#8f88a0;text-align:right}
    .ㅅ{font-size:33px;font-weight:800;color:#cdc6dc;text-align:right}
    .짚{color:#c9a6ff}
    .크말{position:absolute;left:84px;right:84px;top:1110px;font-size:30px;color:#a49bb8;
          line-height:1.4;opacity:${크기말.toFixed(2)}}
    .크말 b{color:#e9e6dd}

    .없{position:absolute;left:84px;right:84px;top:1330px}
    .없 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#8f88a0;margin-bottom:18px;
           opacity:${술술(끼(8.6, 8.9)).toFixed(2)}}
    .없 li{list-style:none;font-size:28px;color:#a49bb8;line-height:1.32;margin-bottom:14px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#6a5b86}

    .끝{position:absolute;left:84px;right:84px;top:1576px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:32px;font-weight:800;color:#c9a6ff}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#6a6478}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <div class="둘">
        <b class="ㄴ">${셈.counts[크.writesFirstMost]}</b><i>first</i>
        <b class="ㅇ">${자리.lastCount[크.writesFirstMost]}</b><i>last</i>
      </div>
      <span>${d.editionNames[크.writesFirstMost]} Wikipedia, across ${셈.outOf} Korean titles</span>
    </div>
    <div class="밑">One Wikipedia writes down Korean titles first and is
      <b>never last</b> \u2014 and it is not the biggest one.</div>

    <div class="표">
      <table>
        <thead><tr><th>Wikipedia</th><th>First</th><th>Last</th><th>Median place</th></tr></thead>
        <tbody>${표줄}</tbody>
      </table>
    </div>

    <!-- ⛔⛔ 크기 표를 빼면 「인도네시아가 한국을 좋아한다」로 읽힌다 -->
    <div class="크말">The ${d.editionNames[크.largestBy.articles]} Wikipedia has
      <b>${크.sizes[크.largestBy.articles].articles.toLocaleString('en-US')}</b> articles against
      <b>${크.sizes[크.writesFirstMost].articles.toLocaleString('en-US')}</b>, and more editors \u2014
      and writes first ${셈.counts[크.largestBy.articles]} times out of ${셈.outOf}.
      <b>Size does not explain the order.</b></div>

    <div class="없">
      <h3>WHAT IS NOT IN HERE</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>The last edition arrives<br>a median ${d.spreadMedianMonths} months later.</b>
      <span>kculturewire.com/written-down-first</span>
      <i>Wikipedia first revisions \u00b7 Wikimedia Pageviews \u00b7 ${셈.outOf} titles on all four</i>
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
   * ⭐⭐ 이 편에서 제일 센 칸은 「먼저 24」가 아니라 **「마지막 0」**이다.
   *   ⛔ 24 만 띄우면 순위표가 된다. 0 이 붙어야 「줄을 선다」가 된다.
   */
  const 둘블록 = (t) => (칸HTML(t).match(/<div class="둘">[\s\S]*?<\/div>/) ?? [''])[0];
  재본다('⛔⛔ 첫 화면에 「먼저」와 「마지막」이 같이 있다', 글자만(둘블록(0.6)),
    (s) => s.includes(String(셈.counts[크.writesFirstMost]))
      && /\b0\b/.test(s) && /first/.test(s) && /last/.test(s));
  재본다('⛔ 한쪽만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(둘블록(t));
      return x.includes('first') === x.includes('last');
    }), (xs) => xs.every(Boolean));
  재본다('⭐ 「한 번도 마지막이 아니다」를 말한다', 글자만(칸HTML(2)),
    (s) => /never last/.test(s));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  const 표칸 = (t) => [...칸HTML(t).matchAll(/class="ㄹ[^"]*">([^<]*)</g)].map((m) => m[1]);
  재본다('표가 네 판이다', 표칸(7).length, d.editions.length);
  재본다('⭐ 먼저 적는 판만 다른 빛이다', (칸HTML(7).match(/class="ㅅ 짚"/g) ?? []).length, 1);
  재본다('⭐ 판마다 먼저·마지막·자리가 있다', 글자만(칸HTML(7)),
    (s) => d.editions.every((p) => s.includes(d.editionNames[p])
      && s.includes(String(자리.medianPlace[p]))));
  /* ⛔ 「마지막」 칸이 없으면 순위표다 */
  재본다('⛔⛔ 마지막 칸이 표에 있다', 칸HTML(7), (h) => /<th>Last<\/th>/.test(h));

  /* ⛔⛔ 크기 표를 빼면 「인도네시아가 한국을 좋아한다」로 읽힌다 */
  재본다('⛔⛔ 크기로 설명 안 된다고 적는다', 글자만(칸HTML(8)),
    (s) => /Size does not explain the order/.test(s));
  재본다('⭐ 두 판의 문서 수를 나란히 보인다', 글자만(칸HTML(8)),
    (s) => s.includes(크.sizes[크.largestBy.articles].articles.toLocaleString('en-US'))
      && s.includes(크.sizes[크.writesFirstMost].articles.toLocaleString('en-US')));

  /* ⛔ 「왜」를 말하지 않는다 */
  재본다('⛔ 까닭을 지어내지 않는다', 글자만(칸HTML(10)),
    (s) => /we ruled out one explanation, we did not find one/.test(s));
  재본다('⛔ 적힌 때를 읽힌 때로 안 판다', 글자만(칸HTML(10)),
    (s) => /not when anyone read it/.test(s));
  재본다('⛔ 한국어판을 왜 뺐는지 적는다', 글자만(칸HTML(10)),
    (s) => /dates fail our check/.test(s));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/written-down-first'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(7)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-first.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwfirst');
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
