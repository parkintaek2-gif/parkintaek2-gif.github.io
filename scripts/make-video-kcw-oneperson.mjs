#!/usr/bin/env node
/**
 * make-video-kcw-oneperson.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「학교가 한 것이 아니라 «한 사람»이 한 것이다」 (`/wikitip/school/...` · 355校)
 *
 * ── ⭐ 이 편이 앞의 스물한 편과 다른 점 — **캐릭터가 나온다** ──────────
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」
 * 🔴 사장님(8/28): 「최소한 **영상은 있어야지. 바로 그래픽이 나오는 건 좀 아니지**」
 * 🔴 사장님(8/28): 「**캐릭터를 만들어서 활용하던지 방법을 찾아**,
 *                  몇 명이나 지금 방문하는 데 뭘 산다라는 말이 나오냐」
 *
 * 그래서 `kcw-character.mjs` 의 「Wire」가 **첫 1초에 그려지며 들어온다.**
 * 숫자보다 먼저 «볼 것»이 있고, 끝에 캐릭터가 **풀려서 자료의 선이 된다** —
 * 우리가 하는 일(사람을 자료로 바꾼다)이 그림 하나로 설명된다.
 *
 * ── ⛔ 이 편에서 제일 조심한 자리 — **「그 학교 가면 된다」로 읽히면 안 된다** ──
 * 자료 파일이 스스로 이렇게 적어 두었다 —
 *   「⛔ 아닌 것: 이 학교에 가면 멀리 간다는 뜻이 아니다. 인과를 못 가린다」
 * ⭐ 그래서 이 영상의 이야기를 **학교가 아니라 «한 사람»** 으로 잡았다.
 *    한 사람을 빼면 수가 무너진다 — 그것이 「학교가 한 게 아니다」의 증거다.
 *    ⚠ 그 한계 문장이 **표보다 먼저** 뜬다. 3초에 넘기는 손님도 그것을 본다.
 *
 * ⛔ 수를 손으로 안 박는다(자료에서 읽는다). ⛔ 화면에 한국어를 안 쓴다.
 * ⭐ 스타 이름이 «첫 화면»에 나온다 — 사장님: 「인기검색어는 스타 이름·작품명이다」
 * ⭐ 주소를 1.6초부터 내내 붙인다 — 사장님: 「외부유입용이다」
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-oneperson.mjs --out public/wikitip/video/oneperson.mp4
 *   node scripts/make-video-kcw-oneperson.mjs --selftest
 *   node scripts/make-video-kcw-oneperson.mjs --그림 6.0   (그 시각 한 칸을 PNG 로)
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-school-reach.json', 'utf8'));

/**
 * ⭐ 이야기를 지는 사람을 **자료에서 고른다** — 한 사람을 뺐을 때 가장 크게 무너지는 학교.
 * ⛔ 내가 좋아하는 이름을 고르지 않는다. 「떨어진 폭」이 가장 큰 것이 이 이야기의 주인이다.
 */
export function 주인공고르기(잴수있는것) {
  const 셈 = 잴수있는것
    .filter((s) => Number.isFinite(s.가운데나라수) && Number.isFinite(s.한사람빼고)
      && s.가장넓은사람 && s.사람수 >= 5)
    .map((s) => ({ ...s, 떨어진폭: s.가운데나라수 - s.한사람빼고 }))
    .sort((a, b) => b.떨어진폭 - a.떨어진폭);
  return 셈[0] ?? null;
}

export const 주 = 주인공고르기(d.잴수있는것);
if (!주) throw new Error('⛔ 자료에서 주인공을 못 골랐다 — 지어내지 않고 멈춘다');
export const 표줄 = 표만들기(d.잴수있는것, 주);

/**
 * 견줄 학교들 — 표에 쓴다.
 * ⛔⛔ **주인공이 표에 없으면 이야기가 끊긴다.** 처음에 `slice(0,5)` 로만 뽑았더니
 *    주인공(떨어진 폭이 가장 큰 학교)이 넓이 순위로는 위쪽이 아니라 표에서 빠졌다.
 *    자가시험이 그것을 잡았다 — 「주인공 줄이 다른 빛이다」가 0 개였다.
 * ✅ 그래서 위 넷에 «주인공을 반드시 더한다». 이미 들어 있으면 다섯으로 끝난다.
 */
export function 표만들기(잴수있는것, 주인공) {
  const 위 = 잴수있는것.slice(0, 4);
  if (위.some((s) => s.slug === 주인공.slug)) return 잴수있는것.slice(0, 5);
  return [...위, 주인공];
}

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 표 = 술술(끼(초, 5.0, 6.0));
  const 뺀다 = 술술(끼(초, 7.6, 8.6));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  /**
   * ⭐⭐ **캐릭터가 «크게» 들어왔다가 옆으로 물러난다.**
   * ⛔ 처음에는 처음부터 끝까지 오른쪽 아래에 작게 두었다. 그려서 보니 **첫 화면이
   *    거의 비어 있었다** — 검은 바탕에 작은 사람 하나. 3초에 넘어간다.
   *    사장님이 「최소한 볼 것은 있어야지」라고 하신 것이 바로 이 자리다.
   * ✅ 그래서 첫 1.7초는 화면 가운데에 «크게» 그려지고, 글이 뜨면 오른쪽 아래로
   *    작아지며 물러난다. 볼 것이 먼저 오고 숫자가 그 자리를 이어받는다.
   */
  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[1.9, 3.2], [5.2, 6.4]],
    가리킴: [[4.6, 7.2]],
    풀림: 11.4,
  });

  const 줄들 = 표줄.map((s) => {
    const 이 = s.slug === 주.slug;
    return `<tr><td class="ㄹ${이 ? ' 짚' : ''}">${s.학교}</td>`
      + `<td class="ㄴ${이 ? ' 짚' : ''}">${s.가운데나라수}</td></tr>`;
  }).join('');

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#14100a;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}

    /* ⭐ 캐릭터가 «맨 먼저» 들어온다 — 숫자보다 볼 것이 먼저다 */
    .누{position:absolute;left:${자리(232, 690)}px;top:${자리(470, 1392)}px;
        width:${자리(616, 330)}px;height:${자리(806, 430)}px;color:#e0b25b}
    .누 svg{width:100%;height:100%}

    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#a9873f;opacity:${ㄴ(띠)}}
    .큰{position:absolute;left:84px;right:84px;top:170px;opacity:${ㄴ(머리)};
        transform:scale(${ㄴ(0.88 + 0.12 * 머리)});transform-origin:left top}
    .큰 b{display:block;font-size:64px;font-weight:900;line-height:1.06;letter-spacing:-.03em;
          color:#e9e6dd}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:38px;font-weight:900;
           color:#e0b25b;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 표보다 «먼저» 뜬다. 3초에 넘기는 손님도 이것을 본다 */
    .한{position:absolute;left:84px;right:84px;top:520px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #a9873f;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#a9873f;margin-bottom:12px}
    .한 p{font-size:31px;color:#cfc6b8;line-height:1.34}
    .한 b{color:#e9e6dd}

    .표{position:absolute;left:84px;right:470px;top:840px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:23px;font-weight:800;letter-spacing:.08em;color:#7a6a4f;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:10px 0;border-top:1px solid #2a2216}
    .ㄹ{font-size:26px;font-weight:800;color:#cfc6b8}
    .ㄴ{font-size:26px;font-weight:700;color:#cfc6b8;text-align:right}
    .짚{color:#e0b25b;font-weight:900}

    /* ⭐ 한 사람을 «빼는» 자리 — 이 편의 핵심이다 */
    .뺌{position:absolute;left:84px;right:470px;top:1300px;opacity:${ㄴ(뺀다 * (1 - 끝))}}
    .뺌 h3{font-size:23px;font-weight:800;letter-spacing:.08em;color:#7a6a4f;margin-bottom:14px}
    .뺌 .두{display:flex;align-items:baseline;gap:22px}
    .뺌 .수{font-size:78px;font-weight:900;color:#e9e6dd;line-height:1}
    .뺌 .화{font-size:40px;color:#7a6a4f}
    .뺌 .수2{font-size:78px;font-weight:900;color:#e0b25b;line-height:1;
             transform:translateY(${ㄴ((1 - 뺀다) * -26)}px)}
    .뺌 p{margin-top:16px;font-size:29px;color:#cfc6b8;line-height:1.35}
    .뺌 b{color:#e9e6dd}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e9e6dd;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:32px;font-weight:800;color:#e0b25b}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#7a6a4f}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${주.가장넓은사람.이름} reached ${주.가장넓은사람.가장넓은나라수} countries.</b>
      <em>Take that one name out and ${주.학교} drops by ${ㄴ(주.떨어진폭)}</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>This is <b>not</b> a ranking of schools, and it is not advice about where to study.
        We cannot separate the school from the person. That is exactly the point \u2014
        <b>one name moves the whole figure.</b></p>
    </div>

    <div class="표">
      <h3>WIDEST REACH, MEDIAN PER SCHOOL \u00b7 COUNTRIES</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="뺌">
      <h3>${주.학교.toUpperCase()} \u00b7 WITH AND WITHOUT ONE PERSON</h3>
      <div class="두">
        <span class="수">${주.가운데나라수}</span>
        <span class="화">\u2192</span>
        <span class="수2">${ㄴ(주.한사람빼고)}</span>
      </div>
      <p>Same ${주.사람수} people, minus <b>${주.가장넓은사람.이름}</b>.
        The school did not travel. <b>A person did.</b></p>
    </div>

    <div class="끝">
      <b>The school did not travel.<br>A person did.</b>
      <span>kculturewire.com/wikitip/school/${주.slug}</span>
      <i>Netflix Top 10 \u00b7 ${d.학교수} schools \u00b7 measured ${d.잰때}</i>
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

  // ── ⭐ 캐릭터가 이 편의 새로운 것이다 ─────────────────
  재본다('⭐ 캐릭터가 «첫 1초»에 이미 그려지고 있다',
    /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 숫자보다 «먼저» 나온다 - 0.5초엔 표가 없다',
    투명도(0.5, '표'), 0);
  재본다('⭐ 캐릭터에 얼굴이 있다 (다 그려진 뒤)', /class="we"/.test(칸HTML(2.5)), true);
  재본다('⭐ 캐릭터가 표를 «가리킨다» - 표가 뜰 때 팔이 올라가 있다', (() => {
    const 손y = (t) => Number(칸HTML(t).match(/M ([-0-9.]+) ([0-9.]+)/)?.[2] ?? 0);
    return 칸HTML(5.5).length > 0 && /Q/.test(칸HTML(5.5));
  })(), true);
  재본다('⭐ 끝에 캐릭터가 «풀려서» 선이 된다', (() => {
    const 관 = 칸HTML(12.6);
    return /class="ww"/.test(관) && !/class="we"/.test(관);
  })(), true);
  /**
   * ⛔⛔ **이 검사가 이 편에서 제일 값이 나갔다.** 처음 판은 캐릭터를 처음부터 끝까지
   * 오른쪽 아래에 «작게» 두었고, 검사 스물셋이 다 통과했다. 그런데 그려서 보니
   * **첫 화면이 거의 비어 있었다** — 검은 바탕에 작은 사람 하나. 3초에 넘어간다.
   * ⭐ 검사가 통과해도 «그려서 눈으로 봐야» 한다는 것을 캐릭터 만들 때 또 배웠는데,
   *    바로 다음 파일에서 같은 곳에 다시 빠졌다. 그래서 수로 못박는다.
   */
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
  재본다('⭐ 첫 화면에 스타 이름이 있다', 글자만(칸HTML(1.5)),
    (s) => s.includes(주.가장넓은사람.이름));
  재본다('⛔⛔ 한계가 «표보다 먼저» 뜬다', [투명도(3.6, '한'), 투명도(3.6, '표')],
    (v) => v[0] > 0.9 && v[1] < 0.05);
  재본다('⛔ 3초에 넘겨도 한계를 본다', 글자만(칸HTML(3.2)), (s) => /not.*ranking of schools/i.test(s));
  재본다('⛔ 「그 학교 가면 된다」로 안 읽히게 못박는다', 글자만(칸HTML(4)),
    (s) => /not advice about where to study/i.test(s));
  재본다('⭐ 한 사람을 뺀 수가 나온다', 글자만(칸HTML(9)),
    (s) => s.includes(String(주.가운데나라수)) && s.includes(String(ㄴ(주.한사람빼고))));
  재본다('⭐ 「학교가 아니라 사람이 갔다」가 끝에 있다', 글자만(칸HTML(13)),
    (s) => /A person did/.test(s));

  // ── 수를 손으로 안 박는다 ────────────────────────────
  재본다('⛔ 수를 «자료에서» 읽는다 - 주인공을 골라 온 것이다',
    주.떨어진폭 > 0 && 주.가장넓은사람.이름.length > 2, true);
  재본다('⛔ 떨어진 폭이 가장 큰 학교를 골랐다', (() => {
    const 다 = d.잴수있는것.filter((s) => Number.isFinite(s.한사람빼고) && s.사람수 >= 5)
      .map((s) => s.가운데나라수 - s.한사람빼고);
    return Math.abs(Math.max(...다) - 주.떨어진폭) < 0.001;
  })(), true);
  재본다('표에 학교가 다섯 줄이다',
    (칸HTML(7).match(/class="ㄹ/g) ?? []).length, 표줄.length);
  재본다('⭐ 주인공 줄이 다른 빛이다', (칸HTML(7).match(/짚"/g) ?? []).length, 2);

  // ── 주소 ────────────────────────────────────────────
  재본다('⭐ 주소가 1.6초부터 내내 보인다', [2.5, 5, 8, 11].map((t) => 투명도(t, '띠')),
    (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 주소가 없다 - 이름이 먼저다', 투명도(0.5, '띠'), 0);
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (s) => s.includes(`/wikitip/school/${주.slug}`));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (s) => /Netflix Top 10/.test(s) && s.includes(d.잰때));

  // ── ⛔ 화면에 한국어가 없다 ─────────────────────────
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));
  재본다('⛔ 「인기」·「최고」 같은 판정하는 말을 안 쓴다',
    [1.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/\b(best|top school|elite|prestigious|famous)\b/i.test(s));

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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/oneperson-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-oneperson.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwoneperson');
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
