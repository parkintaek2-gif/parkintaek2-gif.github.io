#!/usr/bin/env node
/**
 * make-video-kcw-relay.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「베트남 1위 자리가 34주 연속 한국 작품이었다 — 열한 편이 이어받으며」
 *
 * ── 왜 이 편인가 (2026-08-30) ────────────────────────────────────
 * 사장님 지시 — 「영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해」.
 * 오늘 낸 기사에서 나온 수다. ⛔ 새 수를 만들지 않는다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **34주. 그런데 한 작품이 아니라 «열한 편»이 열세 번 손바꿈하며 지켰다.**
 * 🔴 긴 1위 기록은 늘 «한 작품의 무용담»으로 팔린다. 이건 그게 아니라 **줄서기**다.
 * ⭐ 그래서 이 편의 알맹이는 34 가 아니라 **34 옆에 선 11** 이다.
 *   두 수를 같이 안 보이면 손님이 「한 작품이 34주 1위」로 읽는다 — 그건 거짓이다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **한 작품이 오래 갔다고 말하지 않는다.** 자리가 안 넘어간 것이지 작품이 버틴 게 아니다.
 * ⛔ 순위를 시청자 수로 부르지 않는다. 그 한계를 **수보다 먼저** 띄운다.
 * ⛔ 수를 손으로 안 박는다 — `src/data/kcw-number-one-runs.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-relay.mjs --selftest
 *   node scripts/make-video-kcw-relay.mjs --그림 6.0
 *   node scripts/make-video-kcw-relay.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-number-one-runs.json', 'utf8'));

/**
 * 한국 «밖»에서 가장 긴 줄을 고른다.
 * ⛔ 한국 자기 차트가 한국 작품으로 1위인 것은 이야기가 아니다 — 당연한 일이다.
 *   그래도 «크기를 견주려고» 아래에서 한국 것도 따로 읽는다.
 */
export function 으뜸줄(자료 = d) {
  const 밖 = (자료?.목록 ?? []).filter((x) => x && x.iso !== 'KR');
  if (!밖.length) return null;
  return [...밖].sort((a, b) => b.주 - a.주)[0];
}

/** 견줄 다른 나라들 — 으뜸 빼고 다섯 */
export function 나머지(자료 = d, 몇 = 5) {
  const 밖 = (자료?.목록 ?? []).filter((x) => x && x.iso !== 'KR').sort((a, b) => b.주 - a.주);
  return 밖.slice(1, 1 + 몇);
}

export const 으뜸 = 으뜸줄();
if (!으뜸) throw new Error('⛔ 자료에서 으뜸 줄을 못 읽었다 — 지어내지 않고 멈춘다');
export const 표줄 = 나머지();
export const 주수 = 으뜸.주;
export const 편수 = 으뜸.작품수;
export const 손바뀜 = 으뜸.바뀜;

if (!Number.isFinite(주수) || !Number.isFinite(편수) || !Number.isFinite(손바뀜)) {
  throw new Error('⛔ 자료에서 수를 못 읽었다 — 지어내지 않고 멈춘다');
}
/* ⛔ 이야기가 성립하는지 자가 스스로 본다 —
   «여러 편이 이어받았다»가 이 편의 알맹이다. 한 편이었으면 다른 이야기를 짜야 한다. */
if (편수 < 2) throw new Error('⛔ 한 편이 계속 1위였다 — 「줄서기」 이야기가 안 선다. 멈춘다.');
if (편수 > 주수) throw new Error('⛔ 편수가 주수보다 크다 — 셈이 틀렸다. 멈춘다.');

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
    + `<td class="ㄴ">${o.주}w &middot; ${o.작품수} titles</td></tr>`).join('');

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
      <b>Vietnam's number one series was Korean for ${주수} weeks straight.</b>
      <em>Not one show. ${편수} of them, taking turns.</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>This counts <b>the top place</b>, week by week &mdash; not one title's own run.
        A rank is an ordering, and Netflix publishes no viewers or hours by country, so
        ${주수} weeks at number one is ${주수} orderings.</p>
    </div>

    <div class="견">
      <h3>WEEKS AT NUMBER ONE / TITLES THAT HELD IT</h3>
      <div class="두">
        <span class="수">${셈(주수)}</span>
        <span class="화">held by</span>
        <span class="수2">${셈(편수)}</span>
      </div>
      <p><b>The place changed hands ${손바뀜} times without once leaving Korean television.</b>
        As each series finished, another was already there. That is a queue, not one long run.</p>
    </div>

    <div class="표">
      <h3>LONGEST RUNS ELSEWHERE &middot; WEEKS &middot; TITLES</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>A queue,<br>not a juggernaut.</b>
      <span>kculturewire.com/articles</span>
      <i>Netflix Top 10 &middot; ${셈(주수)} weeks &middot; Vietnam &middot; measured ${String(d.잰날).slice(0, 10)}</i>
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
  재본다('한국 «밖»에서 가장 긴 줄을 고른다 — 한국 자기 차트는 이야기가 아니다',
    으뜸.iso !== 'KR' && 으뜸.country === 'Vietnam', true);
  재본다('⛔ 자료가 비면 null', 으뜸줄({ 목록: [] }) === null && 으뜸줄({}) === null, true);
  재본다('⛔ 한국 것만 있으면 null', 으뜸줄({ 목록: [{ iso: 'KR', 주: 87 }] }), null);
  재본다('⭐⭐ 이야기의 알맹이 — 여러 편이 이어받았다', 편수 >= 2, true);
  재본다('⛔ 편수가 주수를 넘지 않는다 — 넘으면 셈이 틀린 것이다', 편수 <= 주수, true);
  재본다('손바뀜이 편수보다 적지 않다 — 한 번 이상씩 넘어갔다', 손바뀜 >= 편수 - 1, true);
  재본다('견줄 다른 나라를 다섯 고른다', 표줄.length, 5);
  재본다('⛔ 으뜸을 표에 다시 안 넣는다', 표줄.every((x) => x.country !== 으뜸.country), true);
  재본다('표가 긴 것부터다', 표줄.every((x, i) => i === 0 || 표줄[i - 1].주 >= x.주), true);
  재본다('⭐ 말레이시아와 싱가포르가 «같은 날 시작, 같은 날 끝»이다', (() => {
    const m = d.목록.find((x) => x.country === 'Malaysia' && x.cat === 'TV');
    const g = d.목록.find((x) => x.country === 'Singapore' && x.cat === 'TV');
    return !!m && !!g && m.시작 === g.시작 && m.끝 === g.끝;
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
  재본다('⭐ 첫 화면에 주수와 편수가 «둘 다» 나온다', 글자만(칸HTML(1.5)),
    (t) => t.includes(String(주수)) && t.includes(String(편수)) && /Vietnam/.test(t));
  재본다('⭐⭐ 「한 작품이 아니다」를 첫 화면에 못박는다', 글자만(칸HTML(1.5)),
    (t) => /Not one show/i.test(t) && /taking turns/i.test(t));
  재본다('⭐⭐ 「자리를 센 것이지 한 작품의 기록이 아니다」를 수보다 먼저 적는다', 글자만(칸HTML(4)),
    (t) => /the top place/i.test(t) && /not one title/i.test(t));
  재본다('⛔ 순위를 시청자로 안 부른다는 것을 밝힌다', 글자만(칸HTML(4)),
    (t) => /no viewers or hours by country/i.test(t));
  재본다('⭐ 손바뀜 수가 화면에 나온다', 글자만(칸HTML(9)),
    (t) => t.includes(String(손바뀜)) && /changed hands/i.test(t));
  재본다('⭐ 「줄서기이지 한 번의 긴 기록이 아니다」를 적는다', 글자만(칸HTML(9)),
    (t) => /a queue, not one long run/i.test(t));
  재본다('표에 다섯 줄이다', (칸HTML(7).match(/class="ㄹ/g) ?? []).length, 표줄.length);
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (t) => t.includes('kculturewire.com/articles'));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (t) => t.includes('Netflix Top 10') && t.includes(String(d.잰날).slice(0, 10)));
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (t) => !/[가-힣]/.test(t));
  /*
   * 🔴🔴 이 편에서 «가장 중요한» 검사다.
   *   34주는 「한 작품이 34주 1위」로 읽히기 가장 쉬운 수다. 그렇게 읽히면 거짓이다.
   *   ⛔ 한 작품을 주인공으로 세우는 말을 안 쓴다.
   */
  const 글모음 = [1.5, 4, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('')
    .replace(/kculturewire\.com\/\S+/g, '');
  재본다('⛔⛔ 한 작품의 무용담으로 안 쓴다', 글모음,
    (t) => !/\b(juggernaut|phenomenon|smash|blockbuster|unstoppable|reign\w*|dominat\w*)\b/i.test(t)
      || /A queue,\s*not a juggernaut/i.test(t));
  재본다('⛔ 판정하는 말을 안 쓴다', 글모음,
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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/relay-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  /* 🔴 기본 낼 자리가 «공개 폴더 밖»이다 — 소리 없는 판이 실수로 서지 않게 */
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/relay.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwrelay');
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
  console.log('   node scripts/make-kcw-sound.mjs --set relay --목소리 en-US-AndrewNeural');
}
