#!/usr/bin/env node
/**
 * make-video-kcw-samename.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「Netflix 차트 한 줄로는 그것이 한국 작품인지 «못 가른다»」 (`/is-it-korean`)
 *
 * ── 왜 이 편인가 (2026-08-29) ────────────────────────────────────
 * 오늘 낸 `/is-it-korean` 에서 나온 수다. ⛔ 새 수를 만들지 않는다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **974편 중 423편은 이름만으로 한국 작품인지 못 가린다.**
 * 넷플릭스가 내는 것은 «제목·나라·주·순위»뿐이다 — 제작년도도 감독도 제작국도 없다.
 * 그래서 The Glory · Little Women 같은 이름이 뜨면 그 줄만으로는 어느 작품인지 알 수 없다.
 *
 * ── ⭐⭐ 이 편이 남과 다른 자리 ─────────────────────────────────
 * **우리 수가 틀렸을 수 있는 자리를 «우리 손으로» 내놓는다.**
 * Wikidata 에 한국이 아예 없는 것이 41편이고, That Night 은 차트 자리를 115개 차지했다.
 * ⛔ 조용히 빼면 우리 숫자가 실제보다 «깨끗해» 보인다. 그것이 더 나쁘다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ 「겹친다」를 「틀렸다」로 쓰지 않는다 — **못 가른다**는 뜻이다. 다른 말이다.
 * ⛔ 어느 나라를 탓하지 않는다. 영어 제목이 짧아 다들 겹치는 것뿐이다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 내지 않는다** — 이 자는 그림만 만들고 공개 폴더에 못 쓴다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-samename.mjs --selftest
 *   node scripts/make-video-kcw-samename.mjs --그림 9.0
 *   node scripts/make-video-kcw-samename.mjs --out archive/silent-source/samename.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-is-it-korean.json', 'utf8'));

/** 몫을 정수로. ⛔ 못 재면 null — 0 이 아니다 */
export function 몫(위, 아래) {
  if (!Number.isFinite(위) || !Number.isFinite(아래) || 아래 === 0) return null;
  return Math.round((위 / 아래) * 100);
}

/**
 * 표에 실을 줄 — 이름이 겹치는 것 중 차트 자리가 큰 것.
 * ⛔ 한국 말고 겹치는 나라를 «못 읽으면» 그 줄을 안 쓴다. 빈칸으로 놓지 않는다.
 */
export function 겹침줄(자료 = d, n = 5) {
  return (자료.sharedBiggest ?? [])
    .map((x) => ({ ...x, others: (x.countries ?? []).filter((c) => c !== 'South Korea') }))
    .filter((x) => x.title && x.others.length)
    .slice(0, n);
}

export const 전체 = d.titleCount;
export const 겹침 = d.counts?.shared;
export const 확실 = d.counts?.koreaOnly;
export const 겹침몫 = 몫(겹침, 전체);
export const 한국없음 = d.notKoreaListedTotal;
export const 가장큰것 = (d.notKoreaListed ?? [])[0] ?? null;
export const 줄들자료 = 겹침줄();

if (!Number.isFinite(전체) || !Number.isFinite(겹침) || !Number.isFinite(확실)
  || 겹침몫 == null || !Number.isFinite(한국없음) || !가장큰것 || 줄들자료.length < 3) {
  throw new Error('⛔ 자료에서 수를 못 읽었다 — 지어내지 않고 멈춘다');
}
/* ⛔ 「못 가르는 것이 많다」가 성립해야 이 이야기다 */
if (겹침몫 < 20) {
  throw new Error(`⛔ 겹치는 것이 ${겹침몫}% 뿐이다 — 이 이야기가 성립하지 않는다. 다시 짠다.`);
}

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 셈 = (n) => Number(n).toLocaleString('en-US');

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 표 = 술술(끼(초, 5.0, 6.0));
  const 스스로 = 술술(끼(초, 7.8, 8.8));
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

  const 줄들 = 줄들자료.map((x) => `<tr><td class="ㄹ">${x.title}</td>`
    + `<td class="ㅁ">${x.others.slice(0, 2).join(', ')}</td></tr>`).join('');

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

    /* ⛔⛔ 한계가 표보다 «먼저» 뜬다 */
    .한{position:absolute;left:84px;right:84px;top:520px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:31px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    .표{position:absolute;left:84px;right:400px;top:840px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 0;border-top:1px solid #1b2830;vertical-align:baseline}
    .ㄹ{font-size:25px;font-weight:900;color:#5fb3c4;width:250px}
    .ㅁ{font-size:23px;font-weight:700;color:#b9c6cc}

    /* ⭐ 이 편의 핵심 — 우리 수가 틀렸을 수 있는 자리를 «우리가» 내놓는다 */
    .스{position:absolute;left:84px;right:400px;top:1230px;opacity:${ㄴ(스스로 * (1 - 끝))}}
    .스 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    .스 .수{font-size:74px;font-weight:900;color:#e7edf0;line-height:1}
    .스 p{margin-top:14px;font-size:28px;color:#b9c6cc;line-height:1.35}
    .스 b{color:#e7edf0}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:32px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>Is it actually Korean?</b>
      <em>For ${셈(겹침)} of ${셈(전체)}, the name alone cannot tell you</em>
    </div>

    <div class="한">
      <h3>WHAT A CHART ROW CONTAINS</h3>
      <p>A title, a country, a week and a rank. <b>No year, no director, no country of
        production.</b> So when a chart says a name that two countries both use, the row
        cannot say which work it is.</p>
    </div>

    <div class="표">
      <h3>NAMES ALSO CARRIED ELSEWHERE</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="스">
      <h3>AND WHERE OUR OWN FIGURES MAY BE WRONG</h3>
      <div class="수">${셈(한국없음)}</div>
      <p>For ${셈(한국없음)} titles, Wikidata lists <b>no Korean work at all</b> under the name.
        &ldquo;${가장큰것.title}&rdquo; alone took ${셈(가장큰것.places)} chart places.
        <b>We publish the list rather than drop the rows.</b></p>
    </div>

    <div class="끝">
      <b>Shared does not mean wrong.<br>It means we cannot prove it.</b>
      <span>kculturewire.com/is-it-korean</span>
      <i>Netflix Top 10 &middot; Wikidata &middot; measured ${d.generated}</i>
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
  재본다('몫을 센다', 몫(423, 974), 43);
  재본다('⛔ 0 으로 안 나눈다', 몫(1, 0), null);
  재본다('⛔ 못 재면 null 이지 0 이 아니다', 몫(undefined, 10), null);
  재본다('⛔ 한국 말고 겹치는 나라가 없으면 줄에서 뺀다',
    겹침줄({ sharedBiggest: [{ title: 'A', countries: ['South Korea'] }] }, 5).length, 0);
  재본다('겹치는 나라를 남긴다',
    겹침줄({ sharedBiggest: [{ title: 'A', countries: ['South Korea', 'Japan'] }] }, 5)[0].others,
    ['Japan']);
  재본다('⛔ 빈 것도 안 터진다', 겹침줄({}, 5).length, 0);
  재본다('줄 길이를 자른다', 겹침줄(d, 2).length, 2);

  /* ── 자료 ── */
  재본다('겹침과 확실을 더하면 전체를 안 넘는다', 겹침 + 확실 <= 전체, true);
  재본다('겹치는 몫이 20% 를 넘는다 — 이야기가 성립한다', 겹침몫 >= 20, true);
  재본다('한국이 없는 것이 하나 이상 있다', 한국없음 > 0, true);
  재본다('가장 큰 것에 이름과 자리 수가 있다',
    Boolean(가장큰것.title) && Number.isFinite(가장큰것.places), true);
  재본다('⛔ 표에 겹치는 나라가 빈 줄이 없다', 줄들자료.every((x) => x.others.length > 0), true);

  /* ── 캐릭터 ── */
  재본다('⭐ 캐릭터가 첫 1초에 이미 그려진다', /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 표보다 먼저 나온다', 투명도(0.5, '표'), 0);
  재본다('⭐ 캐릭터에 얼굴이 있다', /class="we"/.test(칸HTML(2.5)), true);
  재본다('⭐ 끝에 캐릭터가 풀려 선이 된다', (() => {
    const 관 = 칸HTML(12.6);
    return /class="ww"/.test(관) && !/class="we"/.test(관);
  })(), true);
  const 캐크기 = (t) => Number(칸HTML(t).match(/\.누\{[^}]*width:([0-9.]+)px/)?.[1] ?? 0);
  재본다('⭐⭐ 첫 화면에서 캐릭터가 크다', 캐크기(0.8) > 폭 * 0.5, true);

  /* ── 움직임과 차례 ── */
  재본다('⛔ 칸마다 다르다 — 슬라이드쇼가 아니다',
    (() => { const xs = [1, 2.5, 3.5, 5, 7, 9, 12].map(칸HTML); return new Set(xs).size === xs.length; })(), true);
  재본다('⛔ 마지막도 움직인다', 칸HTML(13.0) !== 칸HTML(13.1), true);
  재본다('⛔⛔ 한계가 표보다 먼저 뜬다', 투명도(3.6, '표'), 0);
  재본다('3.6초에 한계는 다 떴다', 투명도(3.6, '한'), 1);

  /* ── 글 ── */
  재본다('⭐ 첫 화면에 겹치는 편수와 전체가 나온다', 글자만(칸HTML(1.5)),
    (s) => s.includes(셈(겹침)) && s.includes(셈(전체)));
  재본다('⛔ 「차트 줄에 제작국이 없다」를 표보다 먼저 적는다', 글자만(칸HTML(4)),
    (s) => /no country of\s+production/i.test(s) && /no year/i.test(s));
  재본다('⭐⭐ 우리 수가 틀렸을 수 있는 자리를 화면에 낸다', 글자만(칸HTML(10)),
    (s) => s.includes(셈(한국없음)) && /no Korean work at all/i.test(s));
  재본다('⭐ 그 자리에 실제 이름과 자리 수를 적는다', 글자만(칸HTML(10)),
    (s) => s.includes(가장큰것.title) && s.includes(셈(가장큰것.places)));
  재본다('⛔⛔ 「겹친다」를 「틀렸다」로 쓰지 않는다', 글자만(칸HTML(13)),
    (s) => /Shared does not mean wrong/i.test(s));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (s) => s.includes('kculturewire.com/is-it-korean'));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (s) => /Netflix Top 10/.test(s) && /Wikidata/.test(s) && s.includes(String(d.generated)));
  재본다('표에 이름이 다섯 줄이다', (칸HTML(7).match(/class="ㄹ/g) ?? []).length, 줄들자료.length);
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 10, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));
  재본다('⛔ 어느 나라를 탓하는 말을 안 쓴다',
    [1.5, 4, 7, 10, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/\b(steal|stole|copy|copied|fake|pretend|claim(ing)? to be)\b/i.test(s));

  console.log(실패 ? `\nX ${실패}개 틀렸다 (통과 ${통과})` : `OK 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--그림');
  const 때 = Number(process.argv[i + 1] ?? 10);
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
  await p.setContent(칸HTML(때), { waitUntil: 'load' });
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/samename-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/samename.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwsamename');
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

  /* ⛔ anullsrc 를 «안» 붙인다 — 무음 트랙 결함의 뿌리였다 */
  const ff = require('ffmpeg-static');
  execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png'),
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-an', '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`OK ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
  console.log('🔴 아직 콘텐트가 아니다 — 소리가 없다:');
  console.log('   node scripts/make-kcw-sound.mjs --set samename --원본 <이 파일> --목소리 en-US-AndrewNeural');
}
