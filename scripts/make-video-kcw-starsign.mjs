#!/usr/bin/env node
/**
 * make-video-kcw-starsign.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「한류 스타 281명의 별자리를 셌다. 쏠림처럼 보이지만 «우연»이다」
 *
 * ── 왜 이 편인가 (2026-09-01) ────────────────────────────────────
 * 🔴 사장님 지시(2번을 거쳐) — 「**1번이 만든 스타 사주·별자리 콘텐트를 5번이 갖다 쓰라**」.
 * ⭐ 그래서 이 편은 **1번 자료(`klifemap/public/stardb-data.json`)를 «읽어서»** 만든다.
 *   ⛔ 복사해 오지 않는다. 복사하면 두 벌이 갈라지고, 1번이 갱신해도 내 쪽이 안 따라온다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **물병자리 28명, 게자리 17명. 눈에는 쏠림이다. 재 보면 «우연»이다.**
 * 🔴 이 편은 우리 강령 그대로다 — 「**재 보고 안 된다고 적는 것도 결과다.**」
 * ⭐ 별자리 콘텐트는 거의 다 「어느 별자리가 많다」로 팔린다. 우리는 그 반대를 낸다 —
 *   무작위 281명에서도 **86.8%** 확률로 이만한 차이가 나온다. 그러니 이야기가 «아니다».
 * ⛔ 「별자리는 안 맞는다」고 말하는 것이 아니다. **이 표본으로는 아무 말도 못 한다**는 것이다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **어느 별자리가 «좋다/많다»고 말하지 않는다.** 우리는 판정하지 않는다.
 * ⛔ 「우연이다」를 «주장»으로 안 낸다 — 카이제곱과 무작위 견줌을 화면에 같이 낸다.
 * ⛔ 수를 손으로 안 박는다 — 1번 자료에서 세고, 무작위 견줌은 이 자가 돌린다.
 * ⚠ 무작위 견줌은 «돌릴 때마다 조금 달라진다». 그래서 자가시험이 «정확한 수»가 아니라
 *   «범위»를 잰다. 화면에도 반올림해서 낸다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-starsign.mjs --selftest
 *   node scripts/make-video-kcw-starsign.mjs --그림 9.0
 *   node scripts/make-video-kcw-starsign.mjs --out <소리 입히기 전 자리>.mp4
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

/**
 * 1번 자료를 «읽는다». ⛔ 복사하지 않는다.
 * ⚠ 못 읽으면 «지어내지 않고» 멈춘다 — 저장소가 다르므로 못 읽는 일이 실제로 생긴다.
 */
export const 별길 = 'C:/Users/USER/Documents/GitHub/klifemap/public/stardb-data.json';
let 원자료 = null;
try { 원자료 = JSON.parse(fs.readFileSync(별길, 'utf8')); } catch { 원자료 = null; }
if (!원자료) throw new Error(`⛔ 1번 자료를 못 읽었다(${별길}) — 지어내지 않고 멈춘다`);

export const 사람들 = Object.values(원자료).filter((x) => x && x.zodiac);
if (사람들.length < 100) throw new Error(`⛔ 사람이 ${사람들.length}명뿐이다 — 이 이야기를 하기엔 적다. 멈춘다.`);

/** 별자리별로 센다 */
export function 별자리세기(무리) {
  if (!Array.isArray(무리) || !무리.length) return null;
  const 셈 = {};
  for (const x of 무리) { if (x?.zodiac) 셈[x.zodiac] = (셈[x.zodiac] ?? 0) + 1; }
  return Object.entries(셈).sort((a, b) => b[1] - a[1]);
}

/**
 * 카이제곱 — 고르게 나왔다면 이만큼 어긋날 수 있나.
 * ⚠ 자유도 11에서 p=0.05 문턱이 19.68 이다. 그 수를 화면에 같이 낸다.
 */
export function 카이제곱(센것, 갈래 = 12) {
  if (!Array.isArray(센것) || !센것.length) return null;
  const 합 = 센것.reduce((s, x) => s + x[1], 0);
  const 기대 = 합 / 갈래;
  if (기대 <= 0) return null;
  /* ⛔ 나온 갈래만 세면 «0명인 갈래»를 빠뜨린다. 갈래 수로 채운다 */
  const 값 = 센것.map((x) => x[1]);
  while (값.length < 갈래) 값.push(0);
  return 값.reduce((s, o) => s + ((o - 기대) ** 2) / 기대, 0);
}

/**
 * 무작위로 같은 인원을 12갈래에 뿌렸을 때 «이만한 차이»가 얼마나 흔한가.
 * ⛔ 이것을 안 보이면 손님이 「28 대 17」을 쏠림으로 읽는다.
 * ⚠ 돌릴 때마다 조금 달라진다 — 그래서 화면에는 반올림해서 낸다.
 */
export function 흔한가(인원, 배수, 횟수 = 4000, 갈래 = 12) {
  if (!Number.isFinite(인원) || !Number.isFinite(배수) || 인원 <= 0) return null;
  let 넘음 = 0;
  for (let t = 0; t < 횟수; t += 1) {
    const c = new Array(갈래).fill(0);
    for (let i = 0; i < 인원; i += 1) c[Math.floor(Math.random() * 갈래)] += 1;
    const 작 = Math.min(...c);
    if (작 > 0 && Math.max(...c) / 작 >= 배수) 넘음 += 1;
  }
  return 넘음 / 횟수;
}

export const 센것 = 별자리세기(사람들);
if (!센것) throw new Error('⛔ 별자리를 못 셌다 — 멈춘다');
export const 최다 = 센것[0];
export const 최소 = 센것[센것.length - 1];
export const 배수 = +(최다[1] / 최소[1]).toFixed(2);
export const 카이 = 카이제곱(센것);
export const 문턱 = 19.68;              /* 자유도 11 · p=0.05 */
export const 흔함 = 흔한가(사람들.length, 배수);
export const 경계 = 사람들.filter((x) => x.zodiacBoundary).length;

if (!Number.isFinite(카이) || !Number.isFinite(흔함)) {
  throw new Error('⛔ 견줌을 못 셌다 — 지어내지 않고 멈춘다');
}
/* ⛔ 이야기가 성립하나 — «우연으로 설명된다»가 이 편의 알맹이다.
   만약 카이제곱이 문턱을 넘으면 다른 이야기를 짜야 한다. 자가 스스로 본다. */
if (카이 > 문턱) throw new Error(`⛔ 카이제곱 ${카이.toFixed(2)} 이 문턱 ${문턱} 을 넘는다 — 「우연이다」 이야기가 안 선다. 멈춘다.`);

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 벗 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 큰수 = 술술(끼(초, 5.0, 6.0));
  const 표 = 술술(끼(초, 7.4, 8.4));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[1.9, 3.2], [5.2, 6.4]],
    가리킴: [[4.6, 7.2]],
    풀림: 11.4,
  });

  /* 위 셋과 아래 셋 — ⛔ 「많은 쪽」만 보이면 쏠림으로 읽힌다 */
  const 보일것 = [...센것.slice(0, 3), ...센것.slice(-3)];
  const 줄들 = 보일것.map((o, i) => `<tr${i === 3 ? ' class="갈"' : ''}>`
    + `<td class="ㄹ">${벗(o[0])}</td>`
    + `<td class="ㄴ">${o[1]}</td>`
    + `<td class="ㄷ">${(o[1] / 사람들.length * 100).toFixed(1)}%</td></tr>`).join('');

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
    .큰 b{display:block;font-size:54px;font-weight:900;line-height:1.08;letter-spacing:-.03em;
          color:#e7edf0}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:35px;font-weight:900;
           color:#5fb3c4;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 수보다 «먼저» 뜬다 */
    .한{position:absolute;left:84px;right:84px;top:600px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:31px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    .견{position:absolute;left:84px;right:400px;top:900px;opacity:${ㄴ(큰수 * (1 - 끝))}}
    .견 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    .견 .두{display:flex;align-items:baseline;gap:20px}
    .견 .수{font-size:70px;font-weight:900;color:#e7edf0;line-height:1}
    .견 .화{font-size:30px;color:#5d707a}
    .견 .수2{font-size:70px;font-weight:900;color:#5fb3c4;line-height:1;
             transform:translateY(${ㄴ((1 - 큰수) * -26)}px)}
    .견 p{margin-top:14px;font-size:26px;color:#b9c6cc;line-height:1.35}
    .견 b{color:#e7edf0}

    .표{position:absolute;left:84px;right:400px;top:1330px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:7px 0;border-top:1px solid #1b2830}
    /* ⚠ 위 셋과 아래 셋 사이에 «금»을 긋는다 — 안 그으면 여섯이 한 줄로 읽힌다 */
    tr.갈 td{border-top:2px solid #3d7d8c}
    .ㄹ{font-size:23px;font-weight:800;color:#b9c6cc}
    .ㄴ{font-size:23px;font-weight:700;color:#b9c6cc;text-align:right;width:70px}
    .ㄷ{font-size:23px;font-weight:700;color:#5d707a;text-align:right;width:90px}

    .끝{position:absolute;left:84px;right:84px;top:1380px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:28px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${사람들.length} K-pop and K-drama stars, counted by star sign.</b>
      <em>${벗(최다[0])} ${최다[1]}, ${벗(최소[0])} ${최소[1]}. That looks like something. It is not.</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>Birth dates come from <b>Wikidata</b>, and a sign is arithmetic on a date &mdash; nothing
        is interpreted here. ${경계} of the ${사람들.length} fall within a day of a sign boundary,
        where a birth time we do not have would change the answer.</p>
    </div>

    <div class="견">
      <h3>HOW OFTEN CHANCE ALONE DOES THIS</h3>
      <div class="두">
        <span class="수">${Math.round(흔함 * 100)}%</span>
        <span class="화">of the time</span>
      </div>
      <p><b>Deal ${사람들.length} people into twelve signs at random and the biggest group is
        ${배수}&times; the smallest about ${Math.round(흔함 * 100)}% of the time.</b>
        Chi-squared is ${카이.toFixed(1)}; the 0.05 threshold is ${문턱}. There is nothing here to explain.</p>
    </div>

    <div class="표">
      <h3>TOP THREE / BOTTOM THREE &middot; STARS &middot; SHARE</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>We measured it,<br>and there is no pattern.</b>
      <span>kculturewire.com/star-signs</span>
      <i>Wikidata &middot; ${사람들.length} Korean stars &middot; this is statistics, not you</i>
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

  /* ── 1번 자료를 제대로 읽나 ── */
  재본다('1번 자료에서 281명을 읽는다', 사람들.length, 281);
  재본다('전원 별자리가 있다', 사람들.every((x) => x.zodiac), true);
  재본다('⛔ 자료가 비면 null', 별자리세기([]) === null && 별자리세기(null) === null, true);
  재본다('갈래가 열둘이다', 센것.length, 12);
  재본다('최다가 처음, 최소가 끝', 최다[1] >= 센것[1][1] && 최소[1] <= 센것[10][1], true);

  /* ── ⭐⭐ 이 편의 알맹이 — 「우연이다」 ── */
  재본다('⭐⭐ 카이제곱이 문턱보다 «작다» — 우연으로 설명된다', 카이 < 문턱, true);
  재본다('카이제곱이 그럴듯한 범위다', 카이 > 0 && 카이 < 30, true);
  재본다('⛔ 0명 갈래를 빠뜨리지 않는다',
    카이제곱([['a', 10]], 12) > 카이제곱([['a', 10], ['b', 10]], 12), true);
  재본다('⛔ 못 세면 null', 카이제곱([]) === null && 카이제곱(null) === null, true);
  /* ⚠ 무작위라 돌릴 때마다 다르다 — «정확한 수»가 아니라 «범위»를 잰다 */
  재본다('⭐⭐ 무작위에서도 흔하다 — 절반은 넘는다', 흔함 > 0.5, true);
  재본다('흔함이 0~1 사이다', 흔함 >= 0 && 흔함 <= 1, true);
  재본다('⛔ 인원이 이상하면 null', 흔한가(0, 1.65) === null && 흔한가(281, null) === null, true);
  재본다('⚠ 배수가 아주 크면 드물어진다 — 자가 방향을 안다',
    흔한가(281, 3.0, 800) < 흔함, true);

  /* ── 표 ── */
  재본다('표가 여섯 줄이다', (칸HTML(9).match(/<tr/g) ?? []).length, 6);
  재본다('⭐ 위 셋과 «아래 셋»을 같이 낸다 — 많은 쪽만 보이면 쏠림으로 읽힌다',
    칸HTML(9).includes(최소[0]), true);
  재본다('가운데 금이 있다', 칸HTML(9).includes('class="갈"'), true);

  /* ── 화면 ── */
  const 글 = 글자만(칸HTML(9.0));
  재본다('⛔ 화면에 한국어가 없다', /[가-힣]/.test(글), false);
  재본다('사이트 입구가 화면에 있다', 글.includes('kculturewire.com'), true);
  재본다('띠에도 사이트 이름이 내내 있다', 칸HTML(3.0).includes('KCULTUREWIRE.COM'), true);
  재본다('⭐ 「이것은 통계이지 당신이 아니다」를 낸다', /this is statistics, not you/i.test(글), true);
  재본다('⭐ 경계에 걸린 사람 수를 밝힌다', 글.includes(String(경계)), true);
  재본다('⭐ 카이제곱과 문턱을 «같이» 낸다',
    글.includes(카이.toFixed(1)) && 글.includes(String(문턱)), true);
  재본다('⛔ 어느 별자리가 좋다고 안 쓴다', /lucky|best sign|luckiest/i.test(글), false);
  재본다('⛔ 「별자리는 틀렸다」고도 안 쓴다', /astrology is|not real|debunk/i.test(글), false);
  재본다('⭐ 「설명할 것이 없다」로 맺는다', /nothing here to explain/i.test(글), true);

  /* ── ⛔⛔ 한계가 «수보다 먼저» 뜬다 ── */
  재본다('⭐⭐ 3.4초에 한계가 다 떴다', 투명도(3.4, '한') === 1, true);
  재본다('⭐⭐ 그때 큰 수는 아직 안 떴다', 투명도(3.4, '견') === 0, true);

  /* ── 움직임 ── */
  재본다('첫 칸은 거의 비어 있다', 투명도(0.2, '큰') < 0.15, true);
  재본다('끝 칸에 마무리가 떴다', 투명도(13.5, '끝') === 1, true);
  재본다('끝에서 표가 사라진다', 투명도(13.5, '표') === 0, true);
  재본다('캐릭터가 있다', 칸HTML(6.0).includes('<svg'), true);
  재본다('캐릭터가 오른쪽 아래로 물러난다', (() => {
    const a = 칸HTML(1.0).match(/\.누\{position:absolute;left:([0-9.]+)px/);
    const b = 칸HTML(6.0).match(/\.누\{position:absolute;left:([0-9.]+)px/);
    return !!a && !!b && Number(b[1]) > Number(a[1]);
  })(), true);

  console.log(`\n${실패 ? 'X' : 'OK'} starsign 자가시험 — 통과 ${통과} · 실패 ${실패}`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--그림');
  const 때 = Number(process.argv[i + 1] ?? 9);
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
  await p.setContent(칸HTML(때), { waitUntil: 'load' });
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/starsign-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/starsign.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwstarsign');
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.mkdirSync(임시, { recursive: true });

  /* ⚠ 무작위 견줌이 «칸마다» 달라지면 화면의 수가 떨린다. 한 번 잰 값을 위에서 굳혀 쓴다 */
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
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-an', '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`OK ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
  console.log('🔴 이것은 «아직 콘텐트가 아니다» — 소리가 없다. 다음을 반드시 거친다:');
  console.log('   node scripts/make-kcw-sound.mjs --set starsign --원본 archive/silent-source/starsign.mp4 --목소리 en-US-AndrewNeural');
}
