#!/usr/bin/env node
/**
 * make-video-kcw-allten.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「한 나라 톱10 열 자리가 전부 한국 작품이었던 네 주」
 *
 * ── 왜 이 편인가 (2026-08-30) ────────────────────────────────────
 * 사장님 지시 — 「**영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해**」.
 * 오늘 낸 기사에서 나온 수다. ⛔ 새 수를 만들지 않는다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **한국 밖에서 네 번, 한 나라 넷플릭스 TV 톱10 «열 자리 전부»가 한국 작품이었다.**
 *   베트남 두 번(2021-08) · 인도네시아와 말레이시아가 «같은 주»(2022-07-31).
 *
 * 🔴 그런데 이 수는 **추세가 아니다.** 20,667 나라-주 칸 중 넷은 0.02% 이고,
 *   **11,594 칸은 한국 작품이 «딱 한 편»**이었다. 하나가 보통이고 열이 희귀하다.
 * ⭐ 이것이 리스크관리의 자리다 — 「한류가 다 먹었다」로 읽히기 가장 쉬운 수다.
 *   우리 일은 그 수를 보이면서 **그 옆에 «보통»을 같이 세우는 것**이다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **「점령했다·휩쓸었다」로 안 쓴다** — dominate·sweep·take over 는 우리 말이 아니다.
 * ⛔ 톱10을 «인구조사»로 부르지 않는다. 열한 번째는 안 보이고 그 차이는 공개되지 않는다.
 * ⛔ 수를 손으로 안 박는다 — `src/data/kcw-all-ten.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-allten.mjs --selftest
 *   node scripts/make-video-kcw-allten.mjs --그림 6.0
 *   node scripts/make-video-kcw-allten.mjs --out <소리 입히기 전 자리>.mp4
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { 캐릭터SVG, 사이, 술술 } from './kcw-character.mjs';

const require = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');

export const 초당 = 30;
export const 폭 = 1080;
export const 높 = 1920;
export const 총초 = 14;

const d = JSON.parse(fs.readFileSync('src/data/kcw-all-ten.json', 'utf8'));

/**
 * 한국 «밖»의 것만 고른다.
 * ⛔ 한국 차트가 한국 작품으로 찬 것은 이야기가 아니다 — 그것은 당연한 일이다.
 *   여덟 칸 중 넷이 한국이다. 그 넷을 빼고 말한다.
 */
export function 한국밖(자료 = d) {
  return (자료?.주 ?? []).filter((x) => x && x.iso !== 'KR');
}

/** 「딱 한 편이었던 칸」 — 견줌의 반대편. ⛔ 못 읽으면 null, 0 이 아니다 */
export function 한편뿐인칸(자료 = d) {
  const v = 자료?.분포?.['1'] ?? 자료?.분포?.[1];
  return Number.isFinite(v) ? v : null;
}

export const 밖 = 한국밖();
export const 한편칸 = 한편뿐인칸();
export const 칸수 = d.칸수;
export const 표줄 = 밖;

if (!밖.length || !Number.isFinite(한편칸) || !Number.isFinite(칸수)) {
  throw new Error('⛔ 자료에서 수를 못 읽었다 — 지어내지 않고 멈춘다');
}
/* ⛔ 견줄 두 수가 «같은 단위»다 — 둘 다 «나라-주-갈래 칸»이다.
   🔴 오늘 다른 편에서 나라-주와 편수를 나란히 놓았다가 「274 of 232」를 냈다. 같은 잘못을 안 한다. */
if (밖.length > 한편칸 || 밖.length > 칸수 || 한편칸 > 칸수) {
  throw new Error('⛔ 부분이 전체보다 크다 — 견줄 수 없는 두 수다. 멈춘다.');
}
export const 몫 = Math.round((밖.length / 칸수) * 10000) / 100;

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 셈 = (n) => Number(n).toLocaleString('en-US');
const 벗 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 표 = 술술(끼(초, 5.0, 6.0));
  const 견줌 = 술술(끼(초, 7.6, 8.6));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  /* ⭐ 캐릭터가 크게 들어왔다가 오른쪽 아래로 물러난다 */
  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[1.9, 3.2], [5.2, 6.4]],
    가리킴: [[4.6, 7.2]],
    풀림: 11.4,
  });

  const 줄들 = 표줄.map((o) => `<tr><td class="ㄹ">${벗(o.country)}</td>`
    + `<td class="ㄴ">${o.week}</td></tr>`).join('');

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0b1014;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}

    .누{position:absolute;left:${자리(232, 690)}px;top:${자리(470, 1392)}px;
        width:${자리(616, 330)}px;height:${자리(806, 430)}px;color:#5fb3c4}
    .누 svg{width:100%;height:100%}

    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#3d7d8c;opacity:${ㄴ(띠)}}
    .큰{position:absolute;left:84px;right:84px;top:170px;opacity:${ㄴ(머리)};
        transform:scale(${ㄴ(0.88 + 0.12 * 머리)});transform-origin:left top}
    .큰 b{display:block;font-size:56px;font-weight:900;line-height:1.08;letter-spacing:-.03em;
          color:#e7edf0}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:36px;font-weight:900;
           color:#5fb3c4;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 수보다 «먼저» 뜬다 */
    .한{position:absolute;left:84px;right:84px;top:600px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:31px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    .견{position:absolute;left:84px;right:400px;top:920px;opacity:${ㄴ(견줌 * (1 - 끝))}}
    .견 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    .견 .두{display:flex;align-items:baseline;gap:22px}
    .견 .수{font-size:74px;font-weight:900;color:#e7edf0;line-height:1}
    .견 .화{font-size:34px;color:#5d707a}
    .견 .수2{font-size:74px;font-weight:900;color:#5fb3c4;line-height:1;
             transform:translateY(${ㄴ((1 - 견줌) * -26)}px)}
    .견 p{margin-top:14px;font-size:26px;color:#b9c6cc;line-height:1.35}
    .견 b{color:#e7edf0}

    /* ⚠ [2026-08-30] 1260 이었는데 견줌 문단 끝줄과 «겹쳤다». 그려 보고 잡았다.
       ⛔ 글자가 겹치면 둘 다 못 읽는다 — 자가시험은 겹침을 못 본다. */
    .표{position:absolute;left:84px;right:400px;top:1380px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 0;border-top:1px solid #1b2830}
    .ㄹ{font-size:25px;font-weight:800;color:#b9c6cc}
    /* ⚠ [2026-08-30] 130px 이라 날짜가 «2021-08- / 15» 로 깨졌다. 그려 보고 잡았다.
       ⛔ 자가시험 30개는 글자가 «있는지»만 보지 «어떻게 접히는지»는 못 본다. */
    .ㄴ{font-size:25px;font-weight:700;color:#b9c6cc;text-align:right;width:200px;white-space:nowrap}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:28px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>Four times outside Korea, every one of a country's ten Netflix TV places
        was Korean.</b>
      <em>Vietnam twice. Then Indonesia and Malaysia, the same week.</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>A top 10 is a <b>ranking of what was watched most</b>, not a census. Eleventh place
        is invisible here and the gap is never published. Netflix releases no viewer numbers
        by country at all.</p>
    </div>

    <div class="견">
      <h3>COUNTRY-WEEKS &middot; ALL TEN / EXACTLY ONE</h3>
      <div class="두">
        <span class="수">${셈(밖.length)}</span>
        <span class="화">vs</span>
        <span class="수2">${셈(한편칸)}</span>
      </div>
      <p><b>Four is ${몫}% of the ${셈(칸수)} country-weeks we checked.</b>
        In <b>${셈(한편칸)}</b> of them a country's top 10 held <b>exactly one</b> Korean title.
        One is the ordinary week. Ten has happened four times.</p>
    </div>

    <div class="표">
      <h3>THE FOUR &middot; COUNTRY &middot; WEEK</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>One is the week.<br>Ten happened four times.</b>
      <span>kculturewire.com/articles</span>
      <i>Netflix Top 10 &middot; ${셈(칸수)} country-weeks &middot; measured ${String(d.잰날).slice(0, 10)}</i>
    </div>

    <div class="누">${캐}</div>
  </div>`;
}

const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 글자만 = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
  const 재본다 = (이름, 값, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(값) : JSON.stringify(값) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.log(`  X ${이름}  ->  ${JSON.stringify(값)}`); }
  };
  const 투명도 = (t, 이름) => {
    const m = 칸HTML(t).match(new RegExp(`\\.${이름}\\{[^}]*opacity:([0-9.]+)`));
    return m ? Number(m[1]) : null;
  };

  /* ── 자 ── */
  재본다('한국 «밖»의 것만 고른다 — 한국 차트가 한국으로 차는 건 이야기가 아니다',
    밖.every((x) => x.iso !== 'KR') && 밖.length === d.한국밖, true);
  재본다('⛔ 여덟 칸 중 넷이 한국이다 — 그 넷은 뺐다', d.열편전부 - 밖.length, 4);
  재본다('⛔ 빈 자료를 주면 빈 배열', 한국밖({ 주: [] }).length === 0 && 한국밖({}).length === 0, true);
  재본다('「딱 한 편이었던 칸」을 자료에서 읽는다', 한편칸 === d.분포['1'], true);
  재본다('⛔ 못 읽으면 null 이지 0 이 아니다', 한편뿐인칸({ 분포: {} }), null);
  재본다('⛔⛔ 견주는 두 수가 «같은 단위»다 — 둘 다 나라-주-갈래 칸이다',
    밖.length <= 한편칸 && 한편칸 <= 칸수, true);
  재본다('몫이 아주 작다 — 「추세」로 못 쓴다', 몫 > 0 && 몫 < 1, true);
  재본다('네 칸이 전부 TV 다 — 영화 톱10 이 전부 한국인 적은 없다',
    밖.every((x) => x.cat === 'TV'), true);
  재본다('인도네시아와 말레이시아가 «같은 주»다', (() => {
    const id = 밖.find((x) => x.iso === 'ID'); const my = 밖.find((x) => x.iso === 'MY');
    return !!id && !!my && id.week === my.week;
  })(), true);

  /* ── 캐릭터 ── */
  재본다('⭐ 캐릭터가 첫 1초에 이미 그려진다', /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 숫자보다 먼저 나온다 - 0.5초엔 표가 없다', 투명도(0.5, '표'), 0);
  재본다('⭐ 캐릭터에 얼굴이 있다', /class="we"/.test(칸HTML(2.5)), true);
  재본다('⭐ 끝에 캐릭터가 풀려 선이 된다', (() => {
    const 관 = 칸HTML(12.6);
    return /class="ww"/.test(관) && !/class="we"/.test(관);
  })(), true);
  const 캐크기 = (t) => Number(칸HTML(t).match(/\.누\{[^}]*width:([0-9.]+)px/)?.[1] ?? 0);
  재본다('⭐⭐ 첫 화면에서 캐릭터가 크다', 캐크기(0.8) > 폭 * 0.5, true);
  재본다('⭐ 나중에는 물러나 작아진다', 캐크기(9) < 캐크기(0.8), true);

  /* ── 움직임 ── */
  재본다('⛔ 칸마다 다르다 — 슬라이드쇼가 아니다',
    (() => { const xs = [1, 2.5, 3.5, 5, 7, 9, 12].map(칸HTML); return new Set(xs).size === xs.length; })(), true);
  재본다('⛔ 마지막도 움직인다', 칸HTML(13.0) !== 칸HTML(13.1), true);

  /* ── 차례 ── */
  재본다('⛔⛔ 한계가 견줌보다 먼저 뜬다', 투명도(3.6, '견'), 0);
  재본다('3.6초에 한계는 이미 다 떴다', 투명도(3.6, '한'), 1);

  /* ── 글 ── */
  재본다('⭐ 첫 화면에 「네 번」과 「열 자리 전부」가 나온다', 글자만(칸HTML(1.5)),
    (t) => /Four times outside Korea/i.test(t) && /every one of a country/i.test(t));
  재본다('⭐ 나라 이름을 첫 화면에 말한다', 글자만(칸HTML(1.5)),
    (t) => /Vietnam/.test(t) && /Indonesia/.test(t) && /Malaysia/.test(t));
  재본다('⭐⭐ 「인구조사가 아니다」를 수보다 먼저 적는다', 글자만(칸HTML(4)),
    (t) => /not a census/i.test(t) && /no viewer numbers/i.test(t));
  /* ⚠ 화면 글에는 줄바꿈이 들어간다 — 「Eleventh place ⏎ is invisible」.
     ⛔ 빈칸을 너그럽게 안 보면 «멀쩡한 글»이 검사에 걸린다. 실제로 걸렸다. */
  재본다('⭐ 열한 번째가 안 보인다는 것을 밝힌다', 글자만(칸HTML(4)),
    (t) => /Eleventh place\s+is invisible/i.test(t));
  재본다('⭐⭐ 「하나가 보통」을 «같이» 세운다 — 이것이 없으면 한류 자랑이 된다', 글자만(칸HTML(9)),
    (t) => t.includes(셈(한편칸)) && /exactly one/i.test(t) && /ordinary week/i.test(t));
  재본다('표에 네 줄이다', (칸HTML(7).match(/class="ㄹ/g) ?? []).length, 표줄.length);
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (t) => t.includes('kculturewire.com/articles'));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (t) => t.includes('Netflix Top 10') && t.includes(String(d.잰날).slice(0, 10)));
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (t) => !/[가-힣]/.test(t));
  /*
   * 🔴🔴 이 편에서 «가장 중요한» 검사다.
   *   「열 자리 전부」는 「한류가 다 먹었다」로 읽히기 가장 쉬운 수다.
   *   우리가 그 말을 쓰면 그 순간 사실이 자랑이 된다. ⛔ 이 검사를 지우지 않는다.
   */
  /* ⚠ 우리 주소에 낱말이 들어갈 수 있으니 주소는 «빼고» 본다 */
  const 글모음 = [1.5, 4, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('')
    .replace(/kculturewire\.com\/\S+/g, '');
  재본다('⛔⛔ 점령하는 말을 안 쓴다 - 우리가 바늘을 세우지 않는다', 글모음,
    (t) => !/\b(dominat\w*|sweep|swept|take over|took over|conquer\w*|invasion|craze|fever)\b/i.test(t));
  재본다('⛔ 판정하는 말도 안 쓴다', 글모음,
    (t) => !/\b(hit|flop|best|greatest|masterpiece|failure)\b/i.test(t));

  console.log(실패 ? `\nX ${실패}개 틀렸다 (통과 ${통과})` : `OK 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--그림');
  const 때 = Number(process.argv[i + 1] ?? 6);
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
  await p.setContent(칸HTML(때), { waitUntil: 'load' });
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/allten-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  /* 🔴 기본 낼 자리가 «공개 폴더 밖»이다 — 소리 없는 판이 실수로 서지 않게 */
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/allten.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwallten');
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

  /* ⛔ anullsrc(빈 소리)를 «안» 붙인다 — 그것이 무음 트랙 결함의 뿌리였다.
     소리 트랙이 아예 없어야 make-kcw-sound 가 붙일 때 헷갈리지 않는다. */
  const ff = require('ffmpeg-static');
  execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png'),
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-an', '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`OK ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
  console.log('🔴 이것은 «아직 콘텐트가 아니다» — 소리가 없다. 다음을 반드시 거친다:');
  console.log('   node scripts/make-kcw-sound.mjs --set allten --목소리 en-US-AndrewNeural');
}
