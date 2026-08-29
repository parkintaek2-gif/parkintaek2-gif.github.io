#!/usr/bin/env node
/**
 * make-video-kcw-onecountry.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「스물세 주를 버텼는데, 나라는 «하나»였다」 (`/wikitip/underrated`)
 *
 * ── 캐릭터가 나오는 «둘째» 편이다 ────────────────────────────────
 * 🔴 사장님(8/28): 「최소한 **영상은 있어야지. 바로 그래픽이 나오는 건 좀 아니지**」
 * 🔴 사장님(8/28): 「**캐릭터를 만들어서 활용하던지 방법을 찾아**」
 *
 * 첫 편(oneperson)에서 배운 것을 그대로 지킨다 —
 *   ⭐ 캐릭터가 **크게** 들어왔다가 글이 뜨면 물러난다(첫 화면이 비면 3초에 넘어간다)
 *   ⭐ 끝에 **풀려서 자료의 선**이 된다
 *   ⛔ 한계 문장이 **표보다 먼저** 뜬다
 *
 * ── ⭐ 왜 이 이야기인가 ──────────────────────────────────────────
 * 사장님: 「**인기검색어는 스타 이름·작품명·노래제목**이다」.
 * 이 편의 주인공은 **작품명**이다 — 자료에서 「오래 버텼는데 좁게 퍼진」 작품 중
 * 가장 오래 버틴 것을 골라 온다. ⛔ 내가 좋아하는 작품을 고르지 않는다.
 *
 * ── ⛔ 이 편에서 제일 조심한 자리 ────────────────────────────────
 * 자료 파일이 스스로 적어 두었다 —
 *   「차트에 오른 것과 «볼 수 있었던 것»은 다르고, 차트에 없는 것이 «안 봤다»는 뜻도 아니다.
 *    넷플릭스는 top 10 만 낸다 — 제 나라에서 큰 작품이 여기서는 아예 안 보일 수 있다」
 * ⛔ 그러니 「이 작품이 저평가됐다」로 읽히면 안 된다. 우리가 재는 것은 **차트 자리**이지
 *    작품의 값이 아니다. 그 문장을 **표보다 먼저** 띄운다.
 *
 * ⛔ 수를 손으로 안 박는다(자료에서 읽는다). ⛔ 화면에 한국어를 안 쓴다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-onecountry.mjs --out public/wikitip/video/onecountry.mp4
 *   node scripts/make-video-kcw-onecountry.mjs --selftest
 *   node scripts/make-video-kcw-onecountry.mjs --그림 6.0
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-quiet-hits.json', 'utf8'));

/** 모든 띠의 작품을 한 줄로 편다 — 띠는 「몇 주 버텼나」로 나눈 칸일 뿐이다 */
export function 작품들(자료 = d) {
  return (자료.bands ?? []).flatMap((b) => b.titles ?? []);
}

/**
 * ⭐ 이야기의 주인이 될 작품을 **자료에서 고른다.**
 *   ① 나라 수가 가장 적고(그것이 이 이야기다) ② 그중 가장 오래 버틴 것.
 * ⛔ 이름이 없는 줄은 안 고른다 — 지어내지 않는다.
 */
export function 주인공고르기(다 = 작품들()) {
  const 셈 = 다.filter((t) => t && t.title && Number.isFinite(t.weeks) && Number.isFinite(t.markets));
  if (!셈.length) return null;
  const 가장좁게 = Math.min(...셈.map((t) => t.markets));
  return 셈.filter((t) => t.markets === 가장좁게).sort((a, b) => b.weeks - a.weeks)[0] ?? null;
}

/**
 * 표에 실을 다섯 줄 — 오래 버틴 순.
 * ⛔⛔ **주인공이 표에 없으면 이야기가 끊긴다.** 첫 편에서 바로 이 자리에 빠졌다.
 *    그래서 위 넷에 주인공을 «반드시» 더한다.
 */
export function 표만들기(다 = 작품들(), 주인공 = 주인공고르기(다)) {
  const 순 = [...다].sort((a, b) => b.weeks - a.weeks);
  const 위 = 순.slice(0, 4);
  if (위.some((t) => t.slug === 주인공?.slug)) return 순.slice(0, 5);
  return [...위, 주인공].filter(Boolean);
}

export const 주 = 주인공고르기();
if (!주) throw new Error('⛔ 자료에서 주인공을 못 골랐다 — 지어내지 않고 멈춘다');
export const 표줄 = 표만들기();

/**
 * 표 머리에 쓸 «이 목록이 무엇인가».
 * ⛔ 손으로 「fewest countries」라고 적었더니 표 첫 줄이 4개국이라 말과 그림이 어긋났다.
 *   띠는 나라 수로 갈린다(1 · 2 · 3~6). 그러니 «몇 나라까지인가»를 자료에서 읽어 적는다.
 * ⚠ 몇 주 이상인가도 자료에 있다(thresholds.longRunWeeks).
 */
export function 목록말(자료 = d) {
  const 위 = Math.max(...(자료.bands ?? []).map((b) => Number(b.to)).filter(Number.isFinite));
  const 주수 = Number(자료.thresholds?.longRunWeeks);
  if (!Number.isFinite(위) || !Number.isFinite(주수)) return 'LONG RUNS IN FEW COUNTRIES';
  return `${주수}+ WEEKS IN ${위} COUNTRIES OR FEWER`;
}

/** 주인공이 차트에 오른 나라 이름 — 하나면 그 이름을 쓴다. ⛔ 모르면 안 적는다 */
export const 어디 = Array.isArray(주.where) && 주.where.length === 1 ? 주.where[0] : null;

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 나라말 = (n) => (n === 1 ? '1 country' : `${n} countries`);

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 표 = 술술(끼(초, 5.0, 6.0));
  const 견줌 = 술술(끼(초, 7.6, 8.6));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  /* ⭐ 캐릭터가 크게 들어왔다가 오른쪽 아래로 물러난다 — 첫 편에서 배운 자리다 */
  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[1.9, 3.2], [5.2, 6.4]],
    가리킴: [[4.6, 7.2]],
    풀림: 11.4,
  });

  const 줄들 = 표줄.map((t) => {
    const 이 = t.slug === 주.slug;
    return `<tr><td class="ㄹ${이 ? ' 짚' : ''}">${t.title}</td>`
      + `<td class="ㄴ${이 ? ' 짚' : ''}">${t.weeks}</td>`
      + `<td class="ㄴ${이 ? ' 짚' : ''}">${t.markets}</td></tr>`;
  }).join('');

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
    .큰 b{display:block;font-size:62px;font-weight:900;line-height:1.06;letter-spacing:-.03em;
          color:#e7edf0}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:38px;font-weight:900;
           color:#5fb3c4;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 표보다 «먼저» 뜬다 */
    .한{position:absolute;left:84px;right:84px;top:520px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:31px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    .표{position:absolute;left:84px;right:400px;top:850px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:10px 0;border-top:1px solid #1b2830}
    .ㄹ{font-size:25px;font-weight:800;color:#b9c6cc}
    .ㄴ{font-size:25px;font-weight:700;color:#b9c6cc;text-align:right;width:130px}
    .짚{color:#5fb3c4;font-weight:900}

    /* ⭐ 이 편의 핵심 — 「오래」와 「넓게」는 다른 말이다 */
    .견{position:absolute;left:84px;right:400px;top:1310px;opacity:${ㄴ(견줌 * (1 - 끝))}}
    .견 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    .견 .두{display:flex;align-items:baseline;gap:22px}
    .견 .수{font-size:74px;font-weight:900;color:#e7edf0;line-height:1}
    .견 .화{font-size:38px;color:#5d707a}
    .견 .수2{font-size:74px;font-weight:900;color:#5fb3c4;line-height:1;
             transform:translateY(${ㄴ((1 - 견줌) * -26)}px)}
    .견 p{margin-top:16px;font-size:28px;color:#b9c6cc;line-height:1.35}
    .견 b{color:#e7edf0}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:32px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${주.title} held a Netflix top 10 for ${주.weeks} weeks.</b>
      <em>In ${나라말(주.markets)}${어디 ? ` \u2014 ${어디}` : ''}</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>Charting is <b>not</b> the same as being available, and not charting is not the same
        as not being watched. Netflix publishes <b>only the top 10</b>, so a title huge at home
        can be missing here entirely.</p>
    </div>

    <div class="표">
      <h3>${\ubaa9\ub85d\ub9d0()} \u00b7 WEEKS \u00b7 COUNTRIES</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="견">
      <h3>COUNTRIES \u00b7 MEDIAN TITLE VS THIS ONE</h3>
      <div class="두">
        <span class="수">${d.medianCountries}</span>
        <span class="화">\u2192</span>
        <span class="수2">${주.markets}</span>
      </div>
      <p>The middle title we publish charted in ${나라말(d.medianCountries)}.
        This one stayed <b>${주.weeks} weeks</b> and never left ${나라말(주.markets)}.
        <b>Long is not wide.</b></p>
    </div>

    <div class="끝">
      <b>Long is not wide.<br>We counted both.</b>
      <span>kculturewire.com/underrated</span>
      <i>Netflix Top 10 \u00b7 ${d.weekCount} weeks \u00b7 ${d.marketCount} countries \u00b7 measured ${d.generated}</i>
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

  // ── 캐릭터 ───────────────────────────────────────────
  재본다('⭐ 캐릭터가 «첫 1초»에 이미 그려지고 있다',
    /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 숫자보다 «먼저» 나온다 - 0.5초엔 표가 없다', 투명도(0.5, '표'), 0);
  재본다('⭐ 캐릭터에 얼굴이 있다 (다 그려진 뒤)', /class="we"/.test(칸HTML(2.5)), true);
  재본다('⭐ 끝에 캐릭터가 «풀려서» 선이 된다', (() => {
    const 관 = 칸HTML(12.6);
    return /class="ww"/.test(관) && !/class="we"/.test(관);
  })(), true);

  /* ⛔⛔ 첫 편에서 제일 값이 나간 검사다 — 첫 화면이 비면 3초에 넘어간다 */
  const 캐크기 = (t) => Number(칸HTML(t).match(/.누{[^}]*width:([0-9.]+)px/)?.[1] ?? 0);
  재본다('⭐⭐ 첫 화면에서 캐릭터가 «크다» - 화면 폭의 절반이 넘는다', 캐크기(0.8) > 폭 * 0.5, true);
  재본다('⭐ 글이 뜬 뒤에는 «물러나» 작아진다', 캐크기(3.5) < 캐크기(0.8) * 0.65, true);
  재본다('물러나는 것이 툭 튀지 않는다', (() => {
    const xs = [1.7, 1.9, 2.1, 2.3, 2.5].map(캐크기);
    return xs.every((v, i) => i === 0 || v < xs[i - 1]);
  })(), true);

  재본다('⛔ 슬라이드쇼가 아니다 - 아무 두 시각이 다르다',
    (() => { const xs = [1, 2.5, 3.5, 5, 7, 9, 12].map(칸HTML); return new Set(xs).size === xs.length; })(), true);
  재본다('⛔ 마지막도 움직인다', 칸HTML(13.0) !== 칸HTML(13.1), true);

  // ── 이야기 ───────────────────────────────────────────
  재본다('⭐ 첫 화면에 «작품 이름»이 있다 - 사장님: 인기검색어는 작품명이다',
    글자만(칸HTML(1.5)), (s) => s.includes(주.title));
  재본다('⛔⛔ 한계가 «표보다 먼저» 뜬다', [투명도(3.6, '한'), 투명도(3.6, '표')],
    (v) => v[0] > 0.9 && v[1] < 0.05);
  재본다('⛔ 3초에 넘겨도 한계를 본다', 글자만(칸HTML(3.2)),
    (s) => /Charting is\s+not\s+the same as being available/.test(s.replace(/\s+/g, ' ')));
  재본다('⛔ 「넷플릭스는 top 10 만 낸다」를 적는다', 글자만(칸HTML(4)),
    (s) => /only the top 10/i.test(s.replace(/\s+/g, ' ')));
  재본다('⭐ 오래 버틴 주 수가 나온다', 글자만(칸HTML(1.5)), (s) => s.includes(String(주.weeks)));
  재본다('⭐ 가운데 작품과 견주는 수가 나온다', 글자만(칸HTML(9)),
    (s) => s.includes(String(d.medianCountries)) && s.includes(String(주.markets)));
  재본다('⭐ 「오래」와 「넓게」가 다른 말이라고 끝에 적는다', 글자만(칸HTML(13)),
    (s) => /Long is not wide/.test(s));

  // ── 수를 손으로 안 박는다 ────────────────────────────
  재본다('⛔ 주인공을 «자료에서» 골라 왔다', 주.title.length > 1 && 주.weeks > 0, true);
  재본다('⛔ 나라 수가 가장 적은 것 중에서 골랐다', (() => {
    const 다 = 작품들().filter((t) => Number.isFinite(t.markets));
    return 주.markets === Math.min(...다.map((t) => t.markets));
  })(), true);
  재본다('⛔ 그중 가장 오래 버틴 것을 골랐다', (() => {
    const 같은것 = 작품들().filter((t) => t.markets === 주.markets);
    return 주.weeks === Math.max(...같은것.map((t) => t.weeks));
  })(), true);
  재본다('표에 작품이 다섯 줄이다', (칸HTML(7).match(/class="ㄹ/g) ?? []).length, 표줄.length);
  /**
   * ⛔ 표 머리와 표 안의 수가 어긋나면 안 된다. 처음에 손으로 「FEWEST COUNTRIES」라고
   *   적었더니 표 첫 줄이 «4개국»이라 말과 그림이 서로 어긋났다. 그려서 보고 찾았다.
   */
  재본다('⭐ 표 머리를 자료에서 읽는다', 목록말(),
    (t) => /^\d+\+ WEEKS IN \d+ COUNTRIES OR FEWER$/.test(t));
  재본다('⛔ 표에 실린 작품이 다 그 머리 안에 든다', (() => {
    const 위 = Math.max(...d.bands.map((x) => x.to));
    const 주수 = d.thresholds.longRunWeeks;
    return 표줄.every((t) => t.markets <= 위 && t.weeks >= 주수);
  })(), true);
  재본다('⭐⭐ 주인공이 표에 «있다» - 첫 편에서 여기에 빠졌다',
    표줄.some((t) => t.slug === 주.slug), true);
  재본다('⭐ 주인공 줄이 다른 빛이다', (칸HTML(7).match(/짚"/g) ?? []).length, 3);
  재본다('나라 수 말이 하나면 단수다', [나라말(1), 나라말(7)], ['1 country', '7 countries']);

  // ── 주소 ────────────────────────────────────────────
  재본다('⭐ 주소가 1.6초부터 내내 보인다', [2.5, 5, 8, 11].map((t) => 투명도(t, '띠')),
    (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 주소가 없다 - 이름이 먼저다', 투명도(0.5, '띠'), 0);
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('kculturewire.com/underrated'));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (s) => /Netflix Top 10/.test(s) && s.includes(d.generated));

  // ── ⛔ 화면에 한국어가 없다 ─────────────────────────
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));
  /**
   * ⚠ 우리 «지면 주소»에는 underrated 가 들어 있다(kculturewire.com/underrated).
   *   그건 손님이 실제로 검색하는 말이라 주소로 쓴 것이고, 글에서 «작품을 판정하는 말»로
   *   쓰는 것과 다르다. 그래서 주소를 뺀 나머지 글만 본다.
   *   ⛔ 검사를 지우지 않는다 — 지우면 본문에 판정하는 말이 들어와도 아무 자도 안 걸린다.
   */
  재본다('⛔ 판정하는 말을 안 쓴다 - 작품의 값을 우리가 매기지 않는다',
    [1.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (s) => !/\b(best|greatest|masterpiece|underrated|overlooked|hidden gem)\b/i.test(s));

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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/onecountry-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-onecountry.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwonecountry');
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
  console.log(`OK ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
}
