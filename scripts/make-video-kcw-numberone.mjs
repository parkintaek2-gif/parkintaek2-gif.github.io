#!/usr/bin/env node
/**
 * make-video-kcw-numberone.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「‘넷플릭스 1위’는 드물지 않다」 (`/hit-or-flop`)
 *
 * ── 왜 이 편인가 (2026-08-29) ────────────────────────────────────
 * 사장님 지시 — 「**영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해**」.
 * 오늘 낸 텍스트 여섯 편 중 하나(`/hit-or-flop`)에서 나온 수다. ⛔ 새 수를 만들지 않는다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **974편 중 304편이 어딘가에서 1위를 했다. 50개국을 넘긴 것은 67편뿐이다 —
 *   1위 한 편수가 «넓게 간» 편수보다 많다.**
 * 🔴 더 센 것: **1위 중 65편은 그 나라가 «유일»했다.** 다섯 중 하나꼴이다.
 *   「넷플릭스 1위」가 「차트에 오른 나라가 하나뿐」과 같은 자리에 있을 수 있다.
 *
 * ⭐ 이것이 리스크관리의 자리다. 「1위 했다」는 말이 사람에게 주는 확신과,
 *   그 말이 실제로 가르는 양이 다르다. 우리가 할 일은 그 차이를 보이는 것이다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **판정하는 말을 안 쓴다** — hit·flop·best·failure 는 우리 말이 아니다.
 *   ⚠ 주소(kculturewire.com/hit-or-flop)에는 그 말이 들어간다. 손님이 «검색하는» 말이라
 *     주소로 쓴 것이고, 본문에서 작품을 «판정»하는 것과 다르다. 검사도 주소를 빼고 본다.
 * ⛔ 차트 자리를 시청시간·매출로 부르지 않는다. 그 한계를 **수보다 먼저** 띄운다.
 * ⛔ 수를 손으로 안 박는다 — `src/data/kcw-hit-or-flop.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *   이 자는 그림만 만든다. 낸 파일은 반드시 make-kcw-sound.mjs 를 거쳐야 «콘텐트»가 된다.
 *   그래서 기본 낼 자리를 **공개 폴더 밖**으로 둔다 — 실수로 무성판이 서지 않게.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-numberone.mjs --selftest
 *   node scripts/make-video-kcw-numberone.mjs --그림 6.0
 *   node scripts/make-video-kcw-numberone.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-hit-or-flop.json', 'utf8'));

/** 몫을 정수로. ⛔ 못 재면 null — 0 이 아니다 */
export function 몫(위, 아래) {
  if (!Number.isFinite(위) || !Number.isFinite(아래) || 아래 === 0) return null;
  return Math.round((위 / 아래) * 100);
}

/**
 * 🔴🔴 [2026-08-29] **처음 쓴 이야기가 그려 보니 무너졌다.**
 *   나는 「1위는 흔하고(31%) 넓게 가는 것은 드물다」로 쓰려 했는데, 그림을 열어 보니
 *   **31% → 32%** 였다. 다섯 나라 넘긴 것이 316편이라 «같은 크기»다. 견줌이 안 된다.
 *   ⛔ 자가시험 25개가 다 통과했다. 검사는 「두 수가 나온다」만 봤지 「두 수가 이야기가
 *     되나」는 못 본다. ⭐ 「검사가 통과해도 한 번은 실물을 본다」가 이걸 잡았다.
 *
 * ✅ 재서 나온 «진짜» 견줌은 이것이다 — **1위 한 편수(304)가 넓게 간 편수(67)보다 많다.**
 *   그리고 더 센 것이 하나 있다: **1위 중 65편은 그 나라가 «유일»했다**(다섯 중 하나).
 */
export function 넓게간편수(자료 = d) {
  const v = 자료?.reached50;
  return Number.isFinite(v) ? v : null;
}

/** 한 나라뿐인 편수와 몫 */
export function 한나라뿐(자료 = d) {
  const 첫 = 자료?.distribution?.countries?.bands?.[0];
  return 첫 && 첫.from === 1 && 첫.to === 1 ? { titles: 첫.titles, pct: 첫.pct } : null;
}

export const 일위 = d.everNumberOne;
export const 전체 = d.titleCount;
export const 일위몫 = 몫(일위, 전체);
export const 넓편수 = 넓게간편수();
export const 유일 = d.numberOneInItsOnlyCountry;
export const 유일몫 = d.shareOfNumberOnes;
export const 좁 = 한나라뿐();

if (!Number.isFinite(일위) || !Number.isFinite(전체) || 일위몫 == null || 넓편수 == null
  || !Number.isFinite(유일) || !Number.isFinite(유일몫) || !좁) {
  throw new Error('⛔ 자료에서 수를 못 읽었다 — 지어내지 않고 멈춘다');
}
/* ⛔ 견줌이 «성립하는지»를 자가 스스로 본다. 무너진 견줌을 다시 내보내지 않는다 */
if (넓편수 >= 일위) {
  throw new Error(`⛔ 견줌이 성립하지 않는다 — 1위 ${일위}편, 넓게 간 것 ${넓편수}편. `
    + '「1위가 더 많다」로 못 쓴다. 자료가 바뀌었으면 이야기를 다시 짠다.');
}

/** 표에 실을 다섯 줄 — 가장 넓게 간 것. ⛔ 내가 좋아하는 작품을 고르지 않는다 */
export const 표줄 = (d.widest ?? []).slice(0, 5);
if (표줄.length < 3) throw new Error('⛔ 표에 실을 줄이 모자라다 — 멈춘다');

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 셈 = (n) => Number(n).toLocaleString('en-US');

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

  const 줄들 = 표줄.map((t) => `<tr><td class="ㄹ">${t.title}</td>`
    + `<td class="ㄴ">${t.markets}</td><td class="ㄴ">${t.weeks}</td></tr>`).join('');

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
    .큰 b{display:block;font-size:60px;font-weight:900;line-height:1.06;letter-spacing:-.03em;
          color:#e7edf0}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:38px;font-weight:900;
           color:#5fb3c4;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 수보다 «먼저» 뜬다 */
    .한{position:absolute;left:84px;right:84px;top:540px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:31px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    .견{position:absolute;left:84px;right:400px;top:860px;opacity:${ㄴ(견줌 * (1 - 끝))}}
    .견 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    .견 .두{display:flex;align-items:baseline;gap:22px}
    .견 .수{font-size:74px;font-weight:900;color:#e7edf0;line-height:1}
    .견 .화{font-size:38px;color:#5d707a}
    .견 .수2{font-size:74px;font-weight:900;color:#5fb3c4;line-height:1;
             transform:translateY(${ㄴ((1 - 견줌) * -26)}px)}
    .견 p{margin-top:16px;font-size:28px;color:#b9c6cc;line-height:1.35}
    .견 b{color:#e7edf0}

    .표{position:absolute;left:84px;right:400px;top:1250px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 0;border-top:1px solid #1b2830}
    .ㄹ{font-size:25px;font-weight:800;color:#b9c6cc}
    .ㄴ{font-size:25px;font-weight:700;color:#b9c6cc;text-align:right;width:120px}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:32px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${셈(일위)} of ${셈(전체)} Korean titles have been number one on Netflix.</b>
      <em>That is ${일위몫}% of them</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>A chart place is a <b>rank</b> in one country in one week. It is not viewers, not hours
        and not money &mdash; Netflix publishes none of those. So none of this says what anything
        earned.</p>
    </div>

    <div class="견">
      <h3>NUMBER ONE SOMEWHERE &middot; VS REACHING 50 COUNTRIES</h3>
      <div class="두">
        <span class="수">${셈(일위)}</span>
        <span class="화">&rarr;</span>
        <span class="수2">${셈(넓편수)}</span>
      </div>
      <p><b>More titles have been number one than have reached fifty countries.</b>
        And ${셈(유일)} of the ${셈(일위)} &mdash; <b>one in ${Math.round(100 / 유일몫)}</b> &mdash;
        were number one in the <b>only country that ever charted them</b>.</p>
    </div>

    <div class="표">
      <h3>WIDEST OF THE ${셈(전체)} &middot; COUNTRIES &middot; WEEKS</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>&ldquo;Number one&rdquo; sorts<br>almost nothing.</b>
      <span>kculturewire.com/hit-or-flop</span>
      <i>Netflix Top 10 &middot; ${d.weekCount} weeks &middot; ${d.marketCount} countries &middot; measured ${d.generated}</i>
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
  재본다('몫을 센다', 몫(304, 974), 31);
  재본다('⛔ 0 으로 안 나눈다', 몫(1, 0), null);
  재본다('⛔ 못 재면 null 이지 0 이 아니다', 몫(null, 10), null);
  재본다('넓게 간 편수를 자료에서 읽는다', Number.isFinite(넓편수), true);
  재본다('🔴 견줌이 성립한다 — 1위 편수가 넓게 간 편수보다 많다', 일위 > 넓편수, true);
  재본다('🔴 1위인데 그 나라가 유일한 편수를 읽는다', Number.isFinite(유일) && 유일 > 0, true);
  재본다('⛔ 그 편수가 1위 편수를 넘지 않는다', 유일 <= 일위, true);
  재본다('한 나라뿐 띠를 알아본다', 좁 !== null && 좁.titles > 0, true);
  재본다('⛔ 띠가 1-1 이 아니면 안 쓴다',
    한나라뿐({ distribution: { countries: { bands: [{ from: 1, to: 4, titles: 9, pct: 3 }] } } }), null);

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
  재본다('⭐ 첫 화면에 1위 편수가 나온다', 글자만(칸HTML(1.5)),
    (s) => s.includes(셈(일위)) && s.includes(셈(전체)));
  재본다('⭐ 견줌에 두 편수가 다 나온다', 글자만(칸HTML(9)),
    (s) => s.includes(셈(일위)) && s.includes(셈(넓편수)));
  재본다('⭐⭐ 「그 나라가 유일했다」가 화면에 나온다', 글자만(칸HTML(9)),
    (s) => s.includes(셈(유일)) && /only country that ever charted them/i.test(s));
  재본다('⛔ 「시청시간이 아니다」를 수보다 먼저 적는다', 글자만(칸HTML(4)),
    (s) => /not viewers/i.test(s) && /not money/i.test(s));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (s) => s.includes('kculturewire.com/hit-or-flop'));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (s) => s.includes('Netflix Top 10') && s.includes(String(d.generated)));
  재본다('표에 작품이 다섯 줄이다', (칸HTML(7).match(/class="ㄹ/g) ?? []).length, 표줄.length);
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));
  /**
   * ⚠ 우리 지면 주소에 hit-or-flop 이 들어 있다. 손님이 «검색하는» 말이라 주소로 쓴 것이고,
   *   본문에서 작품을 «판정»하는 말로 쓰는 것과 다르다. 그래서 주소를 뺀 나머지만 본다.
   *   ⛔ 검사를 지우지 않는다 — 지우면 본문에 판정하는 말이 들어와도 아무 자도 안 걸린다.
   */
  재본다('⛔ 판정하는 말을 안 쓴다 - 작품의 값을 우리가 매기지 않는다',
    [1.5, 4, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (s) => !/\b(hit|flop|best|greatest|masterpiece|failure|underrated|overlooked|hidden gem)\b/i.test(s));

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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/numberone-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  /* 🔴 기본 낼 자리가 «공개 폴더 밖»이다 — 소리 없는 판이 실수로 서지 않게 */
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/numberone.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwnumberone');
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
  console.log('   node scripts/make-kcw-sound.mjs --set numberone --목소리 en-US-AndrewNeural');
}
