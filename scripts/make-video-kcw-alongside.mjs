#!/usr/bin/env node
/**
 * make-video-kcw-alongside.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「이거 다음에 뭐 봐?」 (`/what-to-watch-after`)
 *
 * ── 왜 이 편인가 (2026-08-30) ────────────────────────────────────
 * 사장님 지시 — 「**영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해**」.
 * 오늘 낸 텍스트(`/what-to-watch-after`)에서 나온 수다. ⛔ 새 수를 만들지 않는다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **오징어 게임과 마이 네임은 «같은 나라 같은 주» 넷플릭스 톱10 목록에 274번 나란히 있었다.**
 * 🔴 그런데 그것은 **추천이 아니다.** 같은 목록에 있었다는 것뿐이다 —
 *   같은 사람이 둘 다 봤다는 뜻도, 두 작품이 비슷하다는 뜻도 아니다.
 *
 * ⭐ 이것이 리스크관리의 자리다. 「이거 본 사람이 저것도 봤대」로 읽히기 «가장 쉬운» 수다.
 *   우리 일은 그 수를 보이면서 **그 수가 못 하는 말**을 같이 못박는 것이다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **추천하는 말을 안 쓴다** — recommend·similar·you should·watch next 는 우리 말이 아니다.
 * ⛔ 「함께 있었다」를 「같이 봤다」로 부르지 않는다. 그 한계를 **수보다 먼저** 띄운다.
 * ⛔ 수를 손으로 안 박는다 — `src/data/kcw-alongside.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *   이 자는 그림만 만든다. 낸 파일은 반드시 make-kcw-sound.mjs 를 거쳐야 «콘텐트»가 된다.
 *   그래서 기본 낼 자리를 **공개 폴더 밖**으로 둔다 — 실수로 무성판이 서지 않게.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-alongside.mjs --selftest
 *   node scripts/make-video-kcw-alongside.mjs --그림 6.0
 *   node scripts/make-video-kcw-alongside.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-alongside.json', 'utf8'));

/**
 * 이야기의 주인공을 «고르지» 않는다 — 자료가 정한다.
 * ⭐ 함께 있었던 나라-주가 가장 많은 작품이 맨 앞이다(build-kcw-alongside.mjs 가 그렇게 낸다).
 * ⛔ 내가 좋아하는 작품을 고르면 그 순간 이 편은 우리 것이 아니라 «내 취향»이 된다.
 */
export function 주인공(자료 = d) {
  const 첫 = (자료?.작품 ?? [])[0];
  if (!첫 || !Array.isArray(첫.함께) || !첫.함께.length) return null;
  return 첫;
}

/** 화면 표에 실을 다섯 줄 */
export function 표줄만들기(t, 몇 = 5) {
  return (t?.함께 ?? []).slice(0, 몇);
}

export const 주 = 주인공();
if (!주) throw new Error('⛔ 자료에서 주인공을 못 읽었다 — 지어내지 않고 멈춘다');

export const 짝 = 주.함께[0];
export const 나라주 = 짝.나라주;
export const 함께편수 = 주.함께있던편수;
/*
 * 🔴🔴 [2026-08-30] **처음 만든 판이 그려 보니 무너져 있었다.**
 *   화면에 「**274 of 232**」가 떴다. 274 는 «나라-주»이고 232 는 «편수»다 —
 *   **단위가 다른 두 수를 나란히 놓았다.** 손님 눈에는 232 중 274 로 읽혀 말이 안 된다.
 *   ⛔ 자가시험 28개가 다 통과했다. 검사는 「두 수가 나온다」만 봤지
 *     **「두 수를 견줄 수 있나」는 못 본다.**
 *   ⭐ 「검사가 통과해도 한 번은 실물을 본다」가 두 번째로 이걸 잡았다.
 *
 * ✅ 고친 견줌 — **같은 단위**끼리 본다.
 *   으뜸 짝과 나눈 나라-주(274) ÷ 이 작품이 «누구와든» 나눈 나라-주 전부(2,659).
 *   ⇒ 「가장 많이 겹친 한 편도 전체의 십분의 일뿐」이라는 말이 선다.
 */
export const 나라주전부 = 주.함께있던나라주합;
export const 칸수전체 = d.한국작품이든칸;
export const 표줄 = 표줄만들기(주);

if (!Number.isFinite(나라주) || !Number.isFinite(함께편수)
  || !Number.isFinite(나라주전부) || !Number.isFinite(칸수전체)) {
  throw new Error('⛔ 자료에서 수를 못 읽었다 — 지어내지 않고 멈춘다');
}
/* ⛔ 견줄 두 수가 «같은 쪽»에 있어야 한다. 부분이 전체보다 크면 그건 다른 것을 센 수다 */
if (나라주 > 나라주전부) {
  throw new Error(`⛔ 으뜸 짝(${나라주})이 전체(${나라주전부})보다 크다 — 견줄 수 없는 두 수다. 멈춘다.`);
}
export const 으뜸몫 = Math.round((나라주 / 나라주전부) * 100);
if (표줄.length < 3) throw new Error('⛔ 표에 실을 줄이 모자라다 — 멈춘다');
/*
 * ⛔ 이야기가 «성립하는지»를 자가 스스로 본다.
 * 🔴 2026-08-29 에 다른 편에서 겪었다 — 자가시험 25개가 다 통과했는데 그려 보니
 *   견줌이 무너져 있었다(31% 대 32%). 검사는 「수가 나온다」만 보지 「이야기가 되나」는 못 본다.
 * ⭐ 이 편의 이야기는 「한 짝이 유난히 많이 겹쳤다」이다.
 *   으뜸 짝이 둘째보다 «작으면» 그 말이 안 선다. 그때는 멈추고 이야기를 다시 짠다.
 */
if (주.함께.length >= 2 && 나라주 < 주.함께[1].나라주) {
  throw new Error('⛔ 으뜸 짝이 둘째보다 작다 — 자료가 뒤집혔다. 멈춘다.');
}

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

  const 줄들 = 표줄.map((o) => `<tr><td class="ㄹ">${벗(o.제목)}</td>`
    + `<td class="ㄴ">${셈(o.나라주)}</td></tr>`).join('');

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
    .ㄴ{font-size:25px;font-weight:700;color:#b9c6cc;text-align:right;width:130px}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:28px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${벗(주.title)} and ${벗(짝.제목)} were on the same Netflix top 10, in the same week,
        ${셈(나라주)} times.</b>
      <em>Same country. Same week. Same list.</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>This counts <b>one published list</b>, country by country, week by week. It is
        <b>not a count of people</b> &mdash; Netflix releases no viewer data at all, so nobody
        can tell you the same person watched both.</p>
    </div>

    <div class="견">
      <h3>COUNTRY-WEEKS SHARED &middot; TOP PAIR / ALL PAIRS</h3>
      <div class="두">
        <span class="수">${셈(나라주)}</span>
        <span class="화">of</span>
        <span class="수2">${셈(나라주전부)}</span>
      </div>
      <p><b>Even its closest neighbour is only ${으뜸몫}% of it.</b>
        ${벗(주.title)} shared a list with <b>${셈(함께편수)} different Korean titles</b>. A big number here
        mostly means <b>the title lasted</b>, not that two shows belong together.</p>
    </div>

    <div class="표">
      <h3>ON THE SAME LIST MOST OFTEN &middot; COUNTRY-WEEKS</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>Sitting beside<br>is not being alike.</b>
      <span>kculturewire.com/what-to-watch-after</span>
      <i>Netflix Top 10 &middot; ${셈(칸수전체)} country-weeks &middot; measured ${String(d.잰날).slice(0, 10)}</i>
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
  재본다('주인공을 «고르지» 않고 자료에서 읽는다', 주.title === d.작품[0].title, true);
  재본다('⛔ 자료가 비면 주인공이 없다', 주인공({ 작품: [] }), null);
  재본다('⛔ 함께 있던 것이 없는 작품은 주인공이 아니다',
    주인공({ 작품: [{ title: 'A', 함께: [] }] }), null);
  재본다('표줄을 다섯 줄로 자른다', 표줄만들기({ 함께: [1, 2, 3, 4, 5, 6, 7] }).length, 5);
  재본다('⛔ 없는 것을 주면 빈 배열', 표줄만들기(null).length, 0);
  재본다('수를 자료에서 읽는다',
    Number.isFinite(나라주) && Number.isFinite(함께편수) && Number.isFinite(칸수전체), true);
  재본다('🔴 으뜸 짝이 둘째보다 크거나 같다 — 이야기가 성립한다',
    주.함께.length < 2 || 나라주 >= 주.함께[1].나라주, true);
  재본다('표줄이 내림차순이다',
    표줄.every((r, i) => i === 0 || 표줄[i - 1].나라주 >= r.나라주), true);
  /*
   * 🔴🔴 [2026-08-30] **이 검사가 없어서 「274 of 232」를 냈다.**
   *   274 는 나라-주, 232 는 편수 — 단위가 다른 두 수를 나란히 놓았고,
   *   검사 28개가 다 통과했다. ⛔ 「두 수가 나온다」는 「견줄 수 있다」가 아니다.
   */
  재본다('⛔⛔ 견주는 두 수가 «같은 단위»다 — 나라-주끼리 본다', (() => {
    const s = 글자만(칸HTML(9));
    const 견 = s.slice(s.indexOf('COUNTRY-WEEKS SHARED'), s.indexOf('COUNTRY-WEEKS SHARED') + 200);
    return 견.includes(셈(나라주)) && 견.includes(셈(나라주전부)) && !견.includes(` of ${셈(함께편수)}`);
  })(), true);
  재본다('⛔ 부분이 전체보다 크지 않다', 나라주 <= 나라주전부, true);
  재본다('으뜸 몫이 100% 를 안 넘는다', 으뜸몫 > 0 && 으뜸몫 <= 100, true);

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
  재본다('⭐ 첫 화면에 두 작품과 그 수가 나온다', 글자만(칸HTML(1.5)),
    (s) => s.includes(주.title) && s.includes(짝.제목) && s.includes(셈(나라주)));
  재본다('⭐⭐ 「사람 수가 아니다」를 수보다 먼저 적는다', 글자만(칸HTML(4)),
    (s) => /not a count of people/i.test(s) && /no viewer data/i.test(s));
  재본다('⭐⭐ 「같은 사람이 둘 다 봤다는 말이 아니다」를 화면에 적는다', 글자만(칸HTML(4)),
    (s) => /same person watched both/i.test(s));
  재본다('⭐ 「큰 수는 오래 버틴 것」이라고 밝힌다', 글자만(칸HTML(9)),
    (s) => /the title lasted/i.test(s));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (s) => s.includes('kculturewire.com/what-to-watch-after'));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (s) => s.includes('Netflix Top 10') && s.includes(String(d.잰날).slice(0, 10)));
  재본다('표에 작품이 다섯 줄이다', (칸HTML(7).match(/class="ㄹ/g) ?? []).length, 표줄.length);
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));
  /**
   * 🔴🔴 이 편에서 «가장 중요한» 검사다.
   *   이 수는 「이거 본 사람이 저것도 봤대」로 읽히기 가장 쉬운 수다. 우리가 그 말을 쓰면
   *   그 순간 사실이 추천이 된다. ⛔ 이 검사를 지우지 않는다.
   */
  재본다('⛔⛔ 추천하는 말을 안 쓴다 - 우리가 바늘을 세우지 않는다',
    [1.5, 4, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (s) => !/\b(recommend\w*|similar|you should|watch next|if you liked|fans of|perfect for|must[- ]watch)\b/i.test(s));
  재본다('⛔ 판정하는 말도 안 쓴다',
    [1.5, 4, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (s) => !/\b(hit|flop|best|greatest|masterpiece|failure|hidden gem)\b/i.test(s));

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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/alongside-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  /* 🔴 기본 낼 자리가 «공개 폴더 밖»이다 — 소리 없는 판이 실수로 서지 않게 */
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/alongside.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwalongside');
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
  console.log('   node scripts/make-kcw-sound.mjs --set alongside --목소리 en-US-AndrewNeural');
}
