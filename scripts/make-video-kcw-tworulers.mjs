#!/usr/bin/env node
/**
 * make-video-kcw-tworulers.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「자가 둘인데, 서로 «다른 사람»을 가리킨다」 (`/person`)
 *
 * ── 캐릭터가 나오는 «셋째» 편이다 ────────────────────────────────
 * 🔴 사장님(8/28): 「최소한 **영상은 있어야지**」·「**캐릭터를 만들어서 활용하던지**」
 * 🔴 사장님 상시: 「**인기검색어는 스타 이름·작품명·노래제목**이다」
 *   → 이 편은 첫 화면이 **사람 이름 둘**로 시작한다.
 *
 * ── ⭐ 왜 이 이야기인가 ──────────────────────────────────────────
 * 사람을 재는 자가 우리에게 둘 있다 —
 *   ① **읽힘**   위키백과에서 30일 동안 몇 번 열렸나
 *   ② **넓이**   그 사람 작품이 넷플릭스 주간 top 10 에 든 나라가 몇이나 되나
 * 둘 다 잰 사람이 마흔인데, **위 여섯에 둘 다 든 사람이 «하나도 없다».**
 *
 * ⭐ 이것이 우리 집 이야기다 — 「누가 제일인가」를 우리가 정하지 않고,
 *   **자를 둘 내주고 답이 갈린다는 것을 보여 준다.** 모토와-철학의 「분포를 준다」가 이것이다.
 *
 * ── ⛔ 이 편에서 제일 조심한 자리 ────────────────────────────────
 * ⛔ **「읽힘 = 인기」가 아니다.** 위키백과가 열린 횟수이고, 검색량도 아니다.
 *    지금 방영 중인 작품이 있으면 그 사람만 확 올라간다 — 그것을 「더 인기 있다」로
 *    읽으면 우리가 사람을 밀어붙이는 것이다.
 * ⛔ **「넓이 = 좋음」도 아니다.** 차트에 올랐다는 것이지 볼 수 있었다는 뜻이 아니다.
 * ⚠ 표본이 마흔이다. 그 수를 화면에 적는다 — 분모를 숨기지 않는다.
 *
 * ── ⚠ 이 수를 «따로» 확인했다 ────────────────────────────────────
 * 첫 사람의 읽힘이 325,050 으로 튀어서, 자를 먼저 의심하고 위키미디어 API 로 직접 셌다.
 * 30일 창이 조금 달랐는데도 297,379 가 나왔고, 견줌으로 잰 Gong Yoo 는 38,785 대 39,133 이었다.
 * ⭐ **자가 아니라 사실이었다.** 튀는 수를 그냥 싣지 않는다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-tworulers.mjs --out public/wikitip/video/tworulers.mp4
 *   node scripts/make-video-kcw-tworulers.mjs --selftest
 *   node scripts/make-video-kcw-tworulers.mjs --그림 6.0
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
export const 보일줄 = 5;

const d = JSON.parse(fs.readFileSync('src/data/wikitip-people.json', 'utf8'));

/** 두 자로 «다» 잰 사람만. ⛔ 한쪽만 잰 사람을 끼우면 두 줄이 서로 다른 무리가 된다 */
export function 둘다잰사람(자료 = d) {
  return (자료.people ?? []).filter((p) => Number.isFinite(p.reads30d) && Number.isFinite(p.countries));
}

export function 읽힘순(사람들 = 둘다잰사람()) {
  return [...사람들].sort((a, b) => b.reads30d - a.reads30d);
}
export function 넓이순(사람들 = 둘다잰사람()) {
  /* ⚠ 나라 수가 같으면 편수로 가른다 — 어느 쪽이든 «자료가» 정하게 둔다 */
  return [...사람들].sort((a, b) => b.countries - a.countries || b.titleCount - a.titleCount);
}

/**
 * 두 목록의 위 N 에 «둘 다» 든 사람.
 * ⭐ 이 편의 이야기가 통째로 이 수 하나에 달려 있다. 손으로 안 적고 여기서 센다.
 */
export function 둘다든사람(N = 보일줄, 사람들 = 둘다잰사람()) {
  const a = new Set(읽힘순(사람들).slice(0, N).map((p) => p.slug));
  return 넓이순(사람들).slice(0, N).filter((p) => a.has(p.slug));
}

export const 읽힘1 = 읽힘순()[0];
export const 넓이1 = 넓이순()[0];
if (!읽힘1 || !넓이1) throw new Error('⛔ 자료에서 사람을 못 골랐다 — 지어내지 않고 멈춘다');
export const 겹친것 = 둘다든사람();

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 셈 = (n) => Number(n).toLocaleString('en-US');

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 왼 = 술술(끼(초, 5.0, 5.9));
  const 오 = 술술(끼(초, 5.9, 6.8));
  const 결 = 술술(끼(초, 8.2, 9.1));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  /* ⭐ 캐릭터가 크게 들어왔다 물러난다 — 첫 편에서 배운 자리다 */
  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[1.9, 3.2], [5.2, 6.6]],
    가리킴: [[4.8, 7.4]],
    풀림: 11.4,
  });

  const 줄 = (사람들, 값뽑기) => 사람들.slice(0, 보일줄).map((p) => `<tr>`
    + `<td class="ㄹ">${p.name}</td><td class="ㄴ">${값뽑기(p)}</td></tr>`).join('');

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0d0b12;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}

    .누{position:absolute;left:${자리(232, 700)}px;top:${자리(470, 1400)}px;
        width:${자리(616, 320)}px;height:${자리(806, 418)}px;color:#a98be0}
    .누 svg{width:100%;height:100%}

    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#6b5a90;opacity:${ㄴ(띠)}}
    .큰{position:absolute;left:84px;right:84px;top:170px;opacity:${ㄴ(머리)};
        transform:scale(${ㄴ(0.88 + 0.12 * 머리)});transform-origin:left top}
    .큰 b{display:block;font-size:60px;font-weight:900;line-height:1.07;letter-spacing:-.03em;
          color:#eceaf2}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:36px;font-weight:900;
           color:#a98be0;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 표보다 «먼저» 뜬다 */
    .한{position:absolute;left:84px;right:84px;top:530px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #6b5a90;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#6b5a90;margin-bottom:12px}
    .한 p{font-size:31px;color:#c2bcd0;line-height:1.34}
    .한 b{color:#eceaf2}

    .둘{position:absolute;left:84px;right:84px;top:860px;display:flex;gap:34px}
    .칸{flex:1}
    .칸 h3{font-size:21px;font-weight:800;letter-spacing:.06em;color:#6b5a90;margin-bottom:6px}
    .칸 .잰것{font-size:17px;color:#5a4e78;margin-bottom:14px;letter-spacing:.04em}
    .왼{opacity:${ㄴ(왼 * (1 - 끝))}}
    .오{opacity:${ㄴ(오 * (1 - 끝))}}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 0;border-top:1px solid #241f31}
    .ㄹ{font-size:23px;font-weight:800;color:#c2bcd0}
    .ㄴ{font-size:23px;font-weight:700;color:#a98be0;text-align:right}

    /**
     * ⭐ 이 편의 핵심 한 줄.
     * 🔴 처음에 right:84px 로 두었더니 **캐릭터가 이 글자를 가렸다.** 검사 30개가 다 통과했는데
     *   그려서 보니 「not one is in the top 5」의 절반이 사람 뒤에 있었다.
     *   ⛔ 「글자가 있다」와 「글자가 보인다」는 다른 말이다 — 오늘 이 자리에서만 세 번째다.
     * ⭐ 캐릭터가 물러나 앉는 자리(left ${자리(232, 700)}px)를 피해서 오른쪽을 비운다.
     *   아래 자가시험이 이 둘을 «수로» 견준다. 눈으로만 맞추면 다음에 또 겹친다.
     */
    .결{position:absolute;left:84px;right:400px;top:1440px;opacity:${ㄴ(결 * (1 - 끝))}}
    .결 .수{font-size:88px;font-weight:900;color:#eceaf2;line-height:1}
    .결 p{margin-top:14px;font-size:30px;color:#c2bcd0;line-height:1.35}
    .결 b{color:#eceaf2}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#eceaf2;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:32px;font-weight:800;color:#a98be0}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#6b5a90}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${읽힘1.name} was looked up ${셈(읽힘1.reads30d)} times.<br>${넓이1.name} reached ${넓이1.countries} countries.</b>
      <em>Two rulers. They do not agree.</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>Wikipedia opens are <b>not</b> searches and not popularity &mdash; someone in a show
        airing right now climbs on their own. Charting is not availability. Neither column
        is a ranking of people.</p>
    </div>

    <div class="둘">
      <div class="칸 왼">
        <h3>MOST LOOKED UP</h3>
        <div class="잰것">WIKIPEDIA OPENS, 30 DAYS</div>
        <table><tbody>${줄(읽힘순(), (p) => 셈(p.reads30d))}</tbody></table>
      </div>
      <div class="칸 오">
        <h3>WIDEST REACH</h3>
        <div class="잰것">COUNTRIES ON A NETFLIX TOP 10</div>
        <table><tbody>${줄(넓이순(), (p) => p.countries)}</tbody></table>
      </div>
    </div>

    <div class="결">
      <div class="수">${겹친것.length}</div>
      <p>Of the <b>${둘다잰사람().length} people</b> we can measure both ways,
        <b>${겹친것.length === 0 ? 'not one' : `only ${겹친것.length}`}</b>
        is in the top ${보일줄} of both lists.</p>
    </div>

    <div class="끝">
      <b>Two rulers.<br>Different people. We hand you both.</b>
      <span>kculturewire.com/person</span>
      <i>Wikimedia Pageviews (human traffic) &middot; Netflix Top 10 &middot; as of ${d.asOf}</i>
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
  재본다('⭐ 캐릭터가 «첫 1초»에 이미 그려지고 있다', /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 숫자보다 «먼저» 나온다', 투명도(0.5, '왼'), 0);
  재본다('⭐ 캐릭터에 얼굴이 있다', /class="we"/.test(칸HTML(2.5)), true);
  재본다('⭐ 끝에 캐릭터가 «풀려서» 선이 된다', (() => {
    const 관 = 칸HTML(12.6);
    return /class="ww"/.test(관) && !/class="we"/.test(관);
  })(), true);
  const 캐크기 = (t) => Number(칸HTML(t).match(/.누{[^}]*width:([0-9.]+)px/)?.[1] ?? 0);
  재본다('⭐⭐ 첫 화면에서 캐릭터가 «크다»', 캐크기(0.8) > 폭 * 0.5, true);
  재본다('⭐ 글이 뜨면 물러나 작아진다', 캐크기(3.5) < 캐크기(0.8) * 0.65, true);
  재본다('물러나는 것이 툭 튀지 않는다', (() => {
    const xs = [1.7, 1.9, 2.1, 2.3, 2.5].map(캐크기);
    return xs.every((v, i) => i === 0 || v < xs[i - 1]);
  })(), true);
  재본다('⛔ 슬라이드쇼가 아니다', (() => {
    const xs = [1, 2.5, 3.5, 5, 6.4, 9, 12].map(칸HTML); return new Set(xs).size === xs.length;
  })(), true);
  재본다('⛔ 마지막도 움직인다', 칸HTML(13.0) !== 칸HTML(13.1), true);

  // ── 이야기 ───────────────────────────────────────────
  재본다('⭐ 첫 화면에 «사람 이름»이 둘 있다 - 사장님: 인기검색어는 스타 이름이다',
    글자만(칸HTML(1.5)), (s) => s.includes(읽힘1.name) && s.includes(넓이1.name));
  재본다('⛔⛔ 한계가 표보다 «먼저» 뜬다', [투명도(3.6, '한'), 투명도(3.6, '왼')],
    (v) => v[0] > 0.9 && v[1] < 0.05);
  재본다('⛔ 「읽힘은 검색이 아니다」를 적는다', 글자만(칸HTML(3.5)),
    (s) => /Wikipedia opens are\s+not\s+searches/.test(s.replace(/\s+/g, ' ')));
  재본다('⛔ 「지금 방영 중이면 혼자 올라간다」를 적는다', 글자만(칸HTML(4)),
    (s) => /airing right now climbs on their own/.test(s.replace(/\s+/g, ' ')));
  재본다('⛔ 「어느 줄도 사람의 순위가 아니다」를 적는다', 글자만(칸HTML(4)),
    (s) => /Neither column\s+is a ranking of people/.test(s.replace(/\s+/g, ' ')));
  /* ⭐⭐ 왼쪽이 먼저, 오른쪽이 나중 — 두 자를 «견주는» 것이 이 편의 짜임이다 */
  재본다('⭐ 왼쪽 줄이 오른쪽보다 먼저 뜬다', [투명도(5.6, '왼'), 투명도(5.6, '오')],
    (v) => v[0] > 0.5 && v[1] < 0.05);
  재본다('⭐ 결론 수가 나온다', 글자만(칸HTML(9.5)),
    (s) => s.includes(String(겹친것.length)) && s.includes(String(둘다잰사람().length)));
  재본다('⭐ 끝에 「자가 둘」이 있다', 글자만(칸HTML(13)), (s) => /Two rulers/.test(s));

  /**
   * 🔴🔴 **캐릭터가 결론 글자를 가리고 있었다.** 검사 30개가 다 통과했는데 그려서 보니
   *   「not one is in the top 5」의 절반이 사람 뒤에 있었다.
   * ⛔ 「글자가 있다」와 「글자가 보인다」는 다른 말이다. 그러니 «자리를 수로» 잰다 —
   *   결론 글상자의 오른쪽 끝이 캐릭터 왼쪽 끝보다 왼쪽에 있어야 한다.
   */
  const 결오른끝 = (t) => 폭 - Number(칸HTML(t).match(/\.결\{[^}]*right:([0-9.]+)px/)?.[1] ?? 0);
  const 캐왼끝 = (t) => Number(칸HTML(t).match(/\.누\{[^}]*left:([0-9.]+)px/)?.[1] ?? 폭);
  재본다('⭐⭐ 결론 글자가 캐릭터에 안 가린다 - 그려서 찾은 자리다',
    [8.5, 9.5, 10.5, 11.4].every((t) => 결오른끝(t) <= 캐왼끝(t)), true);
  재본다('그때 캐릭터는 이미 오른쪽 아래에 물러나 있다', 캐왼끝(9.5) > 폭 * 0.55, true);

  // ── 수를 손으로 안 박는다 ────────────────────────────
  재본다('⛔ 두 자로 «다» 잰 사람만 쓴다',
    둘다잰사람().every((p) => Number.isFinite(p.reads30d) && Number.isFinite(p.countries)), true);
  재본다('⛔ 읽힘 첫째가 정말 첫째다',
    읽힘1.reads30d === Math.max(...둘다잰사람().map((p) => p.reads30d)), true);
  재본다('⛔ 넓이 첫째가 정말 첫째다',
    넓이1.countries === Math.max(...둘다잰사람().map((p) => p.countries)), true);
  재본다('⭐ 겹친 사람을 «세어서» 낸다 - 손으로 안 적는다', 둘다든사람(보일줄).length, 겹친것.length);
  재본다('겹침 세는 자가 맞다 - 위 40이면 다 겹친다', 둘다든사람(40).length, 둘다잰사람().length);
  재본다('두 표가 각각 다섯 줄이다',
    (칸HTML(7).match(/class="ㄹ"/g) ?? []).length, 보일줄 * 2);
  재본다('⛔ 분모를 화면에 적는다 - 표본을 숨기지 않는다', 글자만(칸HTML(9.5)),
    (s) => s.includes(`${둘다잰사람().length} people`));

  // ── 주소 ────────────────────────────────────────────
  재본다('⭐ 주소가 1.6초부터 내내 보인다', [2.5, 5, 8, 11].map((t) => 투명도(t, '띠')),
    (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 주소가 없다 - 이름이 먼저다', 투명도(0.5, '띠'), 0);
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('kculturewire.com/person'));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (s) => /Wikimedia Pageviews/.test(s) && /Netflix Top 10/.test(s) && s.includes(d.asOf));

  // ── ⛔ 화면에 한국어가 없다 ─────────────────────────
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9.5, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));
  재본다('⛔ 판정하는 말을 안 쓴다 - 「인기」·「최고」는 우리 말이 아니다',
    [1.5, 7, 9.5, 13].map((t) => 글자만(칸HTML(t))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (s) => !/\b(most popular|best|biggest star|top star|famous|hottest)\b/i.test(s));

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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/tworulers-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-tworulers.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwtworulers');
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
