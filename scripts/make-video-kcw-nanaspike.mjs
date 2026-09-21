#!/usr/bin/env node
/**
 * make-video-kcw-nanaspike.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「무대에서 떨어졌다. 위키백과 열람은 20배 뛰었다」 (`/article/nana-stage-fall-...`)
 *
 * ── 왜 이 편인가 (2026-09-21) ────────────────────────────────────
 * 오늘 낸 KCW 기사(나나·애프터스쿨)에서 나온 수다. ⛔ 새 수를 만들지 않는다 —
 * src/data/kcw-nanaspike.json. 이 시리즈의 다른 「튄 이름」편(make-video-kcw-spike.mjs)과
 * 다른 점 — 그 자는 **왜 튀었는지 모른다**는 것이 이야기의 핵이지만, 이 편은 **원인이
 * 확인됐다**(무대 추락·입원)는 것이 다르다. 그래서 새 자를 짓는다 — 「모른다」자를
 * 「원인이 있다」이야기에 억지로 끼워 넣지 않는다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ 판정하는 말을 안 쓴다 — 「인기」·「역주행」을 안 쓴다. 배수만 보인다.
 * ⛔ 수를 손으로 안 박는다 — src/data/kcw-nanaspike.json 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * ⛔ 부상의 심각성을 부풀리거나 가볍게 말하지 않는다 — 기사에 있는 사실(추락·입원)만.
 * 🔴 소리 없는 판을 «내지» 않는다 — 이 자는 그림만 만든다. make-kcw-sound.mjs 를 거친다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-nanaspike.mjs --selftest
 *   node scripts/make-video-kcw-nanaspike.mjs --그림 6.0
 *   node scripts/make-video-kcw-nanaspike.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-nanaspike.json', 'utf8'));

export const 이름 = d.name;
export const 그룹 = d.group;
export const 사건 = d.event;
export const 기준 = d.baseline;
export const 정점 = d.peak;
export const 배수 = d.ratio;
export const 정점날 = d.peakDate;
export const 주소 = d.articleSlug;

if (![이름, 그룹, 사건, 정점날, 주소].every((x) => typeof x === 'string' && x))
  throw new Error('⛔ 자료에서 글자를 못 읽었다 — 지어내지 않고 멈춘다');
if (![기준, 정점, 배수].every((x) => Number.isFinite(x) && x > 0))
  throw new Error('⛔ 자료에서 수를 못 읽었다 — 지어내지 않고 멈춘다');
if (!(정점 > 기준))
  throw new Error(`⛔ 정점이 기준보다 커야 이야기가 선다 — 기준 ${기준}, 정점 ${정점}`);

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 셈 = (n) => Number(n).toLocaleString('en-US');
const 소수 = (v) => Number(v).toFixed(1);

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 왜 = 술술(끼(초, 2.6, 3.4));
  const 수 = 술술(끼(초, 5.0, 6.0));
  const 배수판 = 술술(끼(초, 8.0, 8.9));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1, 그리는초: 1.0,
    말함: [[1.9, 3.2], [5.2, 6.4]],
    가리킴: [[4.8, 7.2]],
    풀림: 11.4,
  });

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#12100c;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}

    .누{position:absolute;left:${자리(232, 700)}px;top:${자리(470, 1400)}px;
        width:${자리(616, 320)}px;height:${자리(806, 418)}px;color:#c9955f}
    .누 svg{width:100%;height:100%}

    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#7d5f3d;opacity:${ㄴ(띠)}}
    .큰{position:absolute;left:84px;right:84px;top:170px;opacity:${ㄴ(머리)};
        transform:scale(${ㄴ(0.88 + 0.12 * 머리)});transform-origin:left top}
    .큰 b{display:block;font-size:60px;font-weight:900;line-height:1.1;letter-spacing:-.03em;
          color:#f0e9e0}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:34px;font-weight:900;
           color:#c9955f;letter-spacing:-.02em}

    .왜{position:absolute;left:84px;right:84px;top:540px;opacity:${ㄴ(왜)};
        transform:translateY(${ㄴ((1 - 왜) * 18)}px);
        border-left:6px solid #7d5f3d;padding-left:28px}
    .왜 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#7d5f3d;margin-bottom:12px}
    .왜 p{font-size:30px;color:#ccbfae;line-height:1.34}
    .왜 b{color:#f0e9e0}

    .수{position:absolute;left:84px;right:400px;top:900px;opacity:${ㄴ(수 * (1 - 끝))}}
    .수 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#7a6c58;margin-bottom:16px}
    .수 .두{display:flex;align-items:baseline;gap:24px}
    .수 .a{font-size:70px;font-weight:900;color:#f0e9e0;line-height:1}
    .수 .화{font-size:40px;color:#7a6c58}
    .수 .b{font-size:70px;font-weight:900;color:#c9955f;line-height:1;
           transform:translateY(${ㄴ((1 - 수) * -26)}px)}
    .수 p{margin-top:16px;font-size:28px;color:#ccbfae;line-height:1.35}

    .배{position:absolute;left:84px;right:400px;top:1330px;opacity:${ㄴ(배수판 * (1 - 끝))}}
    .배 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#7a6c58;margin-bottom:12px}
    .배 p{font-size:44px;color:#f0e9e0;font-weight:900}
    .배 p b{color:#c9955f}

    .끝{position:absolute;left:84px;right:400px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#f0e9e0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:32px;font-weight:800;color:#c9955f}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#7a6c58}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${이름}, of ${그룹}, was read ${소수(배수)} times more the day after this happened.</b>
      <em>On the English Wikipedia</em>
    </div>

    <div class="왜">
      <h3>WHAT HAPPENED</h3>
      <p><b>${사건}.</b> Reported the same window her reading spiked &mdash; we checked the
        dates line up.</p>
    </div>

    <div class="수">
      <h3>DAILY READS &middot; BASELINE VS PEAK DAY</h3>
      <div class="두">
        <span class="a">${셈(기준)}</span>
        <span class="화">\u2192</span>
        <span class="b">${셈(정점)}</span>
      </div>
      <p>Measured ${정점날}. English Wikipedia, daily opens by people.</p>
    </div>

    <div class="배">
      <h3>THE MULTIPLE</h3>
      <p><b>${소수(배수)}\u00d7</b> her baseline</p>
    </div>

    <div class="끝">
      <b>One reported event.<br>One clean before-and-after.</b>
      <span>kculturewire.com/article/${주소}</span>
      <i>Wikimedia Pageviews, human traffic \u00b7 measured ${d.generated}</i>
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
  const 재본다 = (이름2, 값, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(값) : JSON.stringify(값) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.log(`  X ${이름2}  ->  ${JSON.stringify(값)}`); }
  };
  const 투명도 = (t, 클래스) => {
    const m = 칸HTML(t).match(new RegExp(`\\.${클래스}\\{[^}]*opacity:([0-9.]+)`));
    return m ? Number(m[1]) : null;
  };

  /* ── 자료 검사 ── */
  재본다('정점이 기준보다 크다', 정점 > 기준, true);
  재본다('배수가 1보다 크다', 배수 > 1, true);

  /* ── 캐릭터 ── */
  재본다('⭐ 캐릭터가 첫 1초에 이미 그려진다', /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 왜(사건)보다 먼저는 안 뜬다 - 0.5초엔 왜가 없다', 투명도(0.5, '왜'), 0);
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
  재본다('⛔⛔ 왜가 수보다 먼저 뜬다', [투명도(3.6, '왜'), 투명도(3.6, '수')],
    (v) => v[0] > 0.9 && v[1] < 0.05);

  /* ── 글 ── */
  재본다('⭐ 사건(원인)이 화면에 그대로 나온다', 글자만(칸HTML(3)), (s) => s.includes(사건));
  재본다('⭐ 두 수가 다 나온다', 글자만(칸HTML(7)),
    (s) => s.includes(셈(기준)) && s.includes(셈(정점)));
  재본다('⭐ 잰 날을 적는다', 글자만(칸HTML(7)), (s) => s.includes(정점날));
  재본다('⭐ 배수가 나온다', 글자만(칸HTML(9)), (s) => s.includes(`${소수(배수)}\u00d7`));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (s) => s.includes(`kculturewire.com/article/${주소}`));
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));
  재본다('⛔ 판정·과장하는 말을 안 쓴다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (s) => !/\b(viral|surge|surged|explode|skyrocket|hottest|trending|most popular|comeback|craze)\b/i.test(s));

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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/nanaspike-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/nanaspike.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwnanaspike');
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
  console.log('   node scripts/make-kcw-sound.mjs --set nanaspike --목소리 en-US-AndrewNeural');
}
