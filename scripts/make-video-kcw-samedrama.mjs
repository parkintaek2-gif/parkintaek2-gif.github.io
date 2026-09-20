#!/usr/bin/env node
/**
 * make-video-kcw-samedrama.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「같은 드라마, 두 주연, 다른 배수」 (`/article/we-found-the-cause-...`)
 *
 * ── 왜 이 편인가 (2026-09-20) ────────────────────────────────────
 * 사장님 지시 — 「영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해」.
 * 오늘 낸 KCW 후속기사(서강준·안은진, 같은 드라마 프리미어 뒤 위키백과 열람이
 * 같이 튀었다)에서 나온 수다. ⛔ 새 수를 만들지 않는다 — src/data/kcw-samedrama.json.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **두 공동주연이 같은 드라마 프리미어 뒤 같이 튀었다 — 그런데 배수는 달랐다
 *   (서강준 6.24배, 안은진 4.27배).** 같은 사건에 노출돼도 사람마다 다르게
 *   움직인다는 것이 발견이다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ 판정하는 말을 안 쓴다 — 누가 "더 인기"라고 말하지 않는다. 배수만 보인다.
 * ⛔ 수를 손으로 안 박는다 — src/data/kcw-samedrama.json 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 소리 없는 판을 «내지» 않는다 — 이 자는 그림만 만든다. make-kcw-sound.mjs 를 거친다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-samedrama.mjs --selftest
 *   node scripts/make-video-kcw-samedrama.mjs --그림 6.0
 *   node scripts/make-video-kcw-samedrama.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-samedrama.json', 'utf8'));

export const A이름 = d.leadA;
export const A배수 = d.leadARatio;
export const B이름 = d.leadB;
export const B배수 = d.leadBRatio;
export const 드라마 = d.drama;
export const 프리미어 = d.premiereDate;
export const 주소 = d.articleSlug;

if (![A이름, B이름, 드라마, 프리미어, 주소].every((x) => typeof x === 'string' && x))
  throw new Error('⛔ 자료에서 글자를 못 읽었다 — 지어내지 않고 멈춘다');
if (![A배수, B배수].every((x) => Number.isFinite(x) && x > 1))
  throw new Error('⛔ 자료에서 배수를 못 읽었다 — 지어내지 않고 멈춘다');
/* ⛔ 견줌이 «성립하는지»를 자가 스스로 본다 — A가 B보다 커야 이야기가 선다 */
if (!(A배수 > B배수))
  throw new Error(`⛔ 견줌이 성립하지 않는다 — A ${A배수}x, B ${B배수}x. 자료가 바뀌었으면 이야기를 다시 짠다.`);

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 소수 = (v) => Number(v).toFixed(2);

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 견줌 = 술술(끼(초, 5.0, 6.0));
  const 막대 = 술술(끼(초, 6.4, 7.8));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[1.9, 3.2], [5.4, 6.6]],
    가리킴: [[6.2, 8.0]],
    풀림: 11.4,
  });

  /* 견줌 막대 — A가 B보다 길다. 값 자체는 자료에서 온다 */
  const 최대배수 = Math.max(A배수, B배수);
  const A폭 = ㄴ(596 * (A배수 / 최대배수) * 막대);
  const B폭 = ㄴ(596 * (B배수 / 최대배수) * 막대);

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
    .큰 b{display:block;font-size:52px;font-weight:900;line-height:1.14;letter-spacing:-.03em;
          color:#e7edf0}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:34px;font-weight:900;
           color:#5fb3c4;letter-spacing:-.02em}

    .한{position:absolute;left:84px;right:84px;top:560px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:29px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    .견{position:absolute;left:84px;right:84px;top:880px;opacity:${ㄴ(견줌)}}
    .견 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:22px}
    .줄{display:flex;align-items:center;gap:20px;margin-bottom:26px}
    .줄 .이름{width:280px;font-size:27px;font-weight:800;color:#b9c6cc}
    .줄 .막대칸{flex:1;height:44px;background:#161f26;border-radius:6px;overflow:hidden}
    .줄 .막대{display:block;height:100%;border-radius:6px}
    .줄.a .막대{background:#5fb3c4;width:${A폭}px}
    .줄.b .막대{background:#3d7d8c;width:${B폭}px}
    .줄 .수{width:110px;text-align:right;font-size:30px;font-weight:900;color:#e7edf0}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:40px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:30px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>Two co-stars in the same new drama. Their English Wikipedia reading moved after the same premiere.</b>
      <em>But not by the same amount.</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>"${드라마}" premiered <b>${프리미어}</b>. Both actors are credited leads &mdash;
        we compared each one's own reading against their own baseline, not against each other's fame.</p>
    </div>

    <div class="견">
      <h3>READING RISE SINCE THE PREMIERE</h3>
      <div class="줄 a"><span class="이름">${A이름}</span><span class="막대칸"><span class="막대"></span></span><span class="수">${소수(A배수)}x</span></div>
      <div class="줄 b"><span class="이름">${B이름}</span><span class="막대칸"><span class="막대"></span></span><span class="수">${소수(B배수)}x</span></div>
    </div>

    <div class="끝">
      <b>Same premiere.<br>Different rise.</b>
      <span>kculturewire.com/article/${주소}</span>
      <i>English Wikipedia pageviews &middot; 30-day window &middot; measured ${d.generated}</i>
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
  재본다('A 배수가 B보다 크다', A배수 > B배수, true);
  재본다('두 배수 다 1보다 크다', A배수 > 1 && B배수 > 1, true);

  /* ── 캐릭터 ── */
  재본다('⭐ 캐릭터가 첫 1초에 이미 그려진다', /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 견줌 막대보다 먼저 나온다 - 0.5초엔 견줌이 없다', 투명도(0.5, '견'), 0);
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
    (() => { const xs = [1, 2.5, 3.5, 5.5, 7, 9, 12].map(칸HTML); return new Set(xs).size === xs.length; })(), true);
  재본다('⛔ 마지막도 움직인다', 칸HTML(13.0) !== 칸HTML(13.1), true);

  /* ── 차례 ── */
  재본다('⛔⛔ 한계가 견줌보다 먼저 뜬다', 투명도(3.6, '견'), 0);
  재본다('3.6초에 한계는 이미 다 떴다', 투명도(3.6, '한'), 1);

  /* ── 글 ── */
  재본다('⭐ 견줌 막대에 두 이름과 배수가 다 나온다', 글자만(칸HTML(9)),
    (s) => s.includes(A이름) && s.includes(B이름) && s.includes(소수(A배수) + 'x') && s.includes(소수(B배수) + 'x'));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (s) => s.includes('kculturewire.com/article/' + 주소));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (s) => /Wikipedia/.test(s) && s.includes(String(d.generated)));
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));
  재본다('⛔ 판정하는 말을 안 쓴다 - 누가 더 인기인지 판정하지 않는다',
    [1.5, 4, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (s) => !/\b(more popular|better|winner|beats|loses|superior|inferior)\b/i.test(s));

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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/samedrama-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/samedrama.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwsamedrama');
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
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-an', '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`OK ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
  console.log('🔴 이것은 «아직 콘텐트가 아니다» — 소리가 없다. 다음을 반드시 거친다:');
  console.log('   node scripts/make-kcw-sound.mjs --set samedrama --목소리 en-US-AndrewNeural');
}
