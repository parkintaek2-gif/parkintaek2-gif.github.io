#!/usr/bin/env node
/**
 * make-video-kcw-shelf.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「한글이 무엇인지 찾아보는 사람이 줄었다 — 가나도 마찬가지다」 (`/what-kind-fell`)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 매 프레임이 다르다.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ── ⛔ 이 편이 지키는 것 ──────────────────────────────────────
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-what-kind-fell.json` 에서 읽는다.
 * ⛔⛔ **「일본에 졌다」로 팔지 않는다.** 일본은 대조군이지 경쟁자가 아니다 —
 *    **둘 다 떨어졌다**는 것이 이 편의 전부다. 그래서 두 수가 **같이** 뜬다.
 * ⛔⛔ **못 쓴 두 갈래를 넣는다.** 빼면 「한국만 떨어졌다」로 읽힌다. 기사·카드에서
 *    가장 조심한 자리라 영상에서도 조심한다.
 * ⛔ **읽음을 배움으로 팔지 않는다.** 「Korean language」 조회는 배우는 사람이 아니다.
 * ⛔ 화면에 한국어를 안 쓴다 — 영문 지면이다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-shelf.mjs --out public/wikitip/video/shelf.mp4
 *   node scripts/make-video-kcw-shelf.mjs --selftest
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-what-kind-fell.json', 'utf8'));

export const 쓸것 = d.usable[0];
/** ⭐ 낙폭이 큰 것부터 — 표가 무엇을 보이려는지 분명해진다 */
export const 한국줄 = [...쓸것.korea.articles].sort((a, b) => a.changePc - b.changePc);
export const 일본줄 = [...쓸것.japan.articles].sort((a, b) => a.changePc - b.changePc).slice(0, 3);
export const 몫 = (v) => `${v > 0 ? '+' : '\u2212'}${Math.abs(v).toFixed(1)}%`;

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
   * ① 0.0–2.2 — **두 중앙값이 같이 박힌다.**
   * ⛔ 한국 수만 먼저 띄우면 「한국이 떨어졌다」 단독 화면이 된다. 이 편의 요점이 죽는다.
   */
  const 둘등장 = 툭(끼(0.0, 0.6));
  const 밑말 = 술술(끼(0.9, 1.5));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.4–6.6 — 한국 넷, 그다음 대조군 셋 */
  const 표나옴 = 술술(끼(2.4, 2.9));
  const 줄그리기 = (줄, 때시작, 결) => 줄.map((a, i) => {
    const 때 = 때시작 + i * 0.32;
    const o = 술술(끼(때, 때 + 0.34));
    return `<tr style="opacity:${o.toFixed(2)}"><td class="ㄹ${결}">${a.title}</td>`
      + `<td class="ㅅ${결}">${몫(a.changePc)}</td></tr>`;
  }).join('');
  const 대조띠 = 술술(끼(4.3, 4.6));

  /* ③ 6.6–8.0 — 못 쓴 둘 */
  const 못쓴것 = 술술(끼(6.6, 7.1));

  /* ④ 8.4–11.0 — 안 하는 말 */
  const 없는줄 = [
    'Not a contest \u2014 Japan is a control group, not a competitor',
    'Not learning \u2014 reads of "Korean language" are not people studying it',
    'Not why \u2014 a control removes an explanation, it does not supply one',
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
    .둘{display:flex;align-items:baseline;gap:26px;flex-wrap:wrap}
    .둘 b{font-size:108px;font-weight:900;line-height:.9;letter-spacing:-.04em}
    .둘 .ㄴ{color:#e9e6dd}
    .둘 .ㅇ{color:#c9a6ff}
    .둘 i{font-style:normal;font-size:40px;font-weight:700;color:#6a6478}
    .큰 span{display:block;margin-top:18px;font-size:31px;font-weight:700;color:#c9a6ff;line-height:1.24}
    .밑{position:absolute;left:84px;right:84px;top:462px;font-size:34px;color:#a49bb8;line-height:1.36;
        opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}

    .표{position:absolute;left:84px;right:84px;top:672px;opacity:${표나옴.toFixed(2)}}
    table{width:100%;border-collapse:collapse}
    td{padding:11px 0;border-top:1px solid #241f31}
    .ㄹ{font-size:30px;font-weight:700;color:#cdc6dc}
    .ㅅ{font-size:32px;font-weight:800;color:#e9e6dd;text-align:right}
    .대{color:#8f88a0}
    .대띠{font-size:24px;font-weight:800;letter-spacing:.12em;color:#6a5b86;
          padding:16px 0 6px;opacity:${대조띠.toFixed(2)}}

    .못{position:absolute;left:84px;right:84px;top:1150px;opacity:${못쓴것.toFixed(2)}}
    .못 h3{font-size:27px;font-weight:800;letter-spacing:.08em;color:#b45309;margin-bottom:14px}
    .못 p{font-size:29px;color:#a49bb8;line-height:1.36}
    .못 b{color:#e9e6dd}

    .없{position:absolute;left:84px;right:84px;top:1352px}
    .없 h3{font-size:26px;font-weight:800;letter-spacing:.1em;color:#8f88a0;margin-bottom:18px;
           opacity:${술술(끼(8.4, 8.8)).toFixed(2)}}
    .없 li{list-style:none;font-size:28px;color:#a49bb8;line-height:1.32;margin-bottom:14px;
           padding-left:26px;position:relative}
    .없 li::before{content:'\u2014';position:absolute;left:0;color:#6a5b86}

    .끝{position:absolute;left:84px;right:84px;top:1584px;opacity:${끝.toFixed(2)};
        transform:scale(${끝맥.toFixed(4)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:14px;font-size:32px;font-weight:800;color:#c9a6ff}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#6a6478}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>
    <div class="큰">
      <div class="둘"><b class="ㄴ">${몫(쓸것.korea.medianChangePc)}</b><i>and</i><b class="ㅇ">${몫(쓸것.japan.medianChangePc)}</b></div>
      <span>Korean language, hangul, hanbok, taekwondo \u2014 and the Japanese articles beside them</span>
    </div>
    <div class="밑">Fewer people are looking up what hangul is.
      The same is true of kana. <b>Both fell.</b></div>

    <div class="표">
      <table><tbody>
        ${줄그리기(한국줄, 3.0, '')}
        <tr><td colspan="2" class="대띠">CONTROL \u2014 THE SAME KIND OF ARTICLE ABOUT JAPAN</td></tr>
        ${줄그리기(일본줄, 4.7, ' 대')}
      </tbody></table>
    </div>

    <!-- ⛔⛔ 못 쓴 두 갈래를 뺀 영상은 「한국만 떨어졌다」가 된다 -->
    <div class="못">
      <h3>TWO GENRES WE COULD NOT USE</h3>
      <p>Korean music <b>${몫(d.notUsable[0].korea.medianChangePc)}</b> against Japanese music
        <b>${몫(d.notUsable[0].japan.medianChangePc)}</b> writes its own headline. It rests on
        four articles and three \u2014 remove one and it reverses.</p>
    </div>

    <div class="없">
      <h3>WHAT IS NOT IN HERE</h3>
      <ul>${없는줄}</ul>
    </div>

    <div class="끝">
      <b>We looked, and our sample<br>is not good enough to say.</b>
      <span>kculturewire.com/what-kind-fell</span>
      <i>Wikimedia Pageviews \u00b7 human traffic only \u00b7 ${d.window}</i>
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
   * ⛔⛔ 한국 수만 뜨는 프레임은 「한국이 떨어졌다」 단독 화면이다 — 이 편의 요점이 죽는다.
   */
  const 둘블록 = (t) => (칸HTML(t).match(/<div class="둘">[\s\S]*?<\/div>/) ?? [''])[0];
  재본다('⛔⛔ 첫 화면에 두 수가 같이 있다', 글자만(둘블록(0.6)),
    (s) => s.includes(몫(쓸것.korea.medianChangePc)) && s.includes(몫(쓸것.japan.medianChangePc)));
  재본다('⛔ 한쪽만 뜨는 프레임이 없다',
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.2, 2.0].map((t) => {
      const x = 글자만(둘블록(t));
      return x.includes(몫(쓸것.korea.medianChangePc)) === x.includes(몫(쓸것.japan.medianChangePc));
    }), (xs) => xs.every(Boolean));

  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);

  const 표칸 = (t) => [...칸HTML(t).matchAll(/class="ㄹ[^"]*">([^<]*)</g)].map((m) => m[1]);
  재본다('표가 한국 넷 + 일본 셋이다', 표칸(8).length, 한국줄.length + 일본줄.length);
  재본다('⭐ 대조군 줄이 다른 빛이다', (칸HTML(8).match(/class="ㅅ 대"/g) ?? []).length, 일본줄.length);
  재본다('⭐ 문서마다 이름과 변화가 있다', 글자만(칸HTML(8)),
    (s) => [...한국줄, ...일본줄].every((a) => s.includes(a.title) && s.includes(몫(a.changePc))));

  /* ⛔⛔ 못 쓴 둘을 빼면 「한국만 떨어졌다」가 된다 */
  재본다('⛔⛔ 못 쓴 갈래를 화면에 넣는다', 글자만(칸HTML(8)),
    (s) => s.includes(몫(d.notUsable[0].korea.medianChangePc))
      && s.includes(몫(d.notUsable[0].japan.medianChangePc)));
  재본다('⛔ 왜 못 쓰는지 적는다', 글자만(칸HTML(8)),
    (s) => /remove one and it reverses/.test(s.replace(/\s+/g, ' ')));
  재본다('⛔ 표본 크기를 적는다', 글자만(칸HTML(8)),
    (s) => /four articles and three/.test(s.replace(/\s+/g, ' ')));

  /* ⛔ 「일본에 졌다」로 팔지 않는다 */
  재본다('⛔⛔ 대조군이라고 적는다', 글자만(칸HTML(10)),
    (s) => /control group, not a competitor/.test(s));
  재본다('⛔ 「졌다」는 말을 안 쓴다', 글자만(칸HTML(10)) + 글자만(칸HTML(8)),
    (s) => !/\b(beat|beats|lost|loses|behind|worse|wins?)\b/i.test(s));
  재본다('⛔ 읽음을 배움으로 팔지 않는다', 글자만(칸HTML(10)),
    (s) => /not people studying it/.test(s));
  재본다('⭐ 둘 다 떨어졌다고 말한다', 글자만(칸HTML(2)),
    (s) => /Both fell/.test(s));

  /* 🔴 외부유입용 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 요점이 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('/what-kind-fell'));
  재본다('⛔ 화면에 한국어가 없다', 글자만(칸HTML(10)) + 글자만(칸HTML(8)) + 글자만(칸HTML(13)),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-shelf.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwshelf');
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
