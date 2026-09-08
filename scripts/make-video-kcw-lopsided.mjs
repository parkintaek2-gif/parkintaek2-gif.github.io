#!/usr/bin/env node
/**
 * make-video-kcw-lopsided.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「한국 팀 774개가 한 달에 267만 번 읽혔다. 그 절반을 «24팀»이 가진다」
 *
 * ── 왜 이 편인가 (2026-09-08) ────────────────────────────────────
 * 사장님 지시 — 「영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해」.
 * 오늘 낸 기사 `twenty-four-acts-hold-half-the-reading` 에서 나온 수다.
 * ⛔ 새 수를 만들지 않는다 — `src/data/kcw-attention-share.json` 에서 읽는다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **위 3.1% 와 아래 50% 가 «같은 몫»을 가진다.** 그리고 가운데 팀은 한 달에 519번 읽혔다.
 * ⭐ 알맹이는 「BTS 가 크다」가 아니라 **「가운데가 위보다 아래에 훨씬 가깝다」**는 것이다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ 🔴 **열람을 돈으로 바꿔 말하지 않는다.** 씨앗이 「행사마다 적자」였으니 여기서 미끄러진다.
 *   그래서 「이것은 돈이 아니다」를 «수보다 먼저» 띄운다.
 * ⛔ 열람을 「인기」로도 안 부른다 — 찾아본 횟수다.
 * ⛔ 아래쪽 팀을 「실패」로 안 쓴다. 잰 것은 전체의 «모양»이다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-lopsided.mjs --selftest
 *   node scripts/make-video-kcw-lopsided.mjs --그림 6.0
 *   node scripts/make-video-kcw-lopsided.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-attention-share.json', 'utf8'));

/** 이 편의 두 기둥 — 「절반을 가지는 팀 수」와 「아래 절반이 가지는 몫」 */
export function 두기둥(자료 = d) {
  const 본 = 자료?.본판;
  if (!본) return null;
  const 절반팀 = 본.절반가지는팀수;
  const 위몫 = 본.절반가지는비율;
  const 아래몫 = 본.아래절반몫;
  if (!Number.isInteger(절반팀) || 절반팀 < 1) return null;
  if (!Number.isFinite(위몫) || !Number.isFinite(아래몫)) return null;
  if (!Number.isFinite(본.가운데팀열람)) return null;
  return { 절반팀, 위몫, 아래몫, 팀수: 본.팀수, 합: 본.합, 가운데: 본.가운데팀열람 };
}

export const 기둥 = 두기둥();
if (!기둥) throw new Error('⛔ 자료에서 기둥을 못 뽑았다 — 지어내지 않고 멈춘다');

/* ⛔ 이야기가 성립하는지 자가 스스로 본다 — 「쏠렸다」가 참이어야 이 편이 선다 */
if (기둥.위몫 >= 0.2) {
  throw new Error(`⛔ 절반을 가지는 팀이 전체의 ${(기둥.위몫 * 100).toFixed(1)}% 다 — 쏠렸다고 못 한다. 멈춘다.`);
}
/* ⭐ 이 편의 알맹이는 «위 몫과 아래 몫이 비슷하다»는 것이다. 그게 깨지면 말이 달라진다 */
export const 두몫차 = Math.abs(기둥.위몫 - 기둥.아래몫);
export const 두몫이닮았나 = 두몫차 <= 0.01;

/** 표는 위쪽 다섯 — 한 팀이 얼마를 가지는지 눈에 보이게 */
export const 표줄 = (d.위쪽스물다섯 ?? []).slice(0, 5);
if (표줄.length < 5) throw new Error('⛔ 위쪽 다섯 줄이 없다 — 멈춘다');

export const 위쪽몫줄 = (d.본판?.위쪽몫 ?? []).filter((x) => [1, 10, 20].includes(x.n));
if (위쪽몫줄.length !== 3) throw new Error('⛔ 위쪽 1·10·20 을 못 찾았다 — 멈춘다');

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 벗 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 쉼표 = (n) => Number(n).toLocaleString('en-US');
const 한자리 = (n) => Number(n).toFixed(1);
const 몫 = (v) => `${(Number(v) * 100).toFixed(1)}%`;

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

  const 줄들 = 표줄.map((o) => `<tr><td class="ㄹ">${벗(o.이름)}</td>`
    + `<td class="ㄴ">${쉼표(o.열람)}</td>`
    + `<td class="ㄷ">${한자리(o.몫 * 100)}%</td></tr>`).join('');

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
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:34px;font-weight:900;
           color:#5fb3c4;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 수보다 «먼저» 뜬다 — 이 편에서는 「돈이 아니다」가 그 자리다 */
    .한{position:absolute;left:84px;right:84px;top:610px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:30px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    .견{position:absolute;left:84px;right:400px;top:930px;opacity:${ㄴ(큰수 * (1 - 끝))}}
    .견 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    .견 .두{display:flex;align-items:baseline;gap:22px}
    .견 .수{font-size:70px;font-weight:900;color:#e7edf0;line-height:1}
    .견 .화{font-size:32px;color:#5d707a}
    .견 .수2{font-size:70px;font-weight:900;color:#5fb3c4;line-height:1;
             transform:translateY(${ㄴ((1 - 큰수) * -26)}px)}
    .견 p{margin-top:14px;font-size:26px;color:#b9c6cc;line-height:1.35}
    .견 b{color:#e7edf0}

    .표{position:absolute;left:84px;right:400px;top:1310px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 0;border-top:1px solid #1b2830}
    .ㄹ{font-size:24px;font-weight:800;color:#b9c6cc}
    .ㄴ{font-size:24px;font-weight:700;color:#b9c6cc;text-align:right;width:150px;white-space:nowrap}
    .ㄷ{font-size:24px;font-weight:700;color:#5fb3c4;text-align:right;width:100px;white-space:nowrap}

    .끝{position:absolute;left:84px;right:84px;top:1380px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:28px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${쉼표(기둥.팀수)} Korean acts.<br>${기둥.절반팀} of them hold half.</b>
      <em>${쉼표(기둥.합)} reads in one month &middot; English Wikipedia</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>These are <b>encyclopaedia pages being opened</b> &mdash; not tickets, not streams,
        not money. We hold no revenue data for any act here, and an act low on this list
        is <b>not being called unsuccessful</b>.</p>
    </div>

    <div class="견">
      <h3>SHARE OF ONE MONTH&rsquo;S READING</h3>
      <div class="두">
        <span class="수">${몫(기둥.위몫)}</span>
        <span class="화">=</span>
        <span class="수2">${몫(기둥.아래몫)}</span>
      </div>
      <p>The <b>top ${기둥.절반팀} acts</b> are ${몫(기둥.위몫)} of the list and hold half of all
        reading. The <b>bottom ${Math.ceil(기둥.팀수 / 2)} acts</b> hold ${몫(기둥.아래몫)}
        &mdash; the same share. The act in the middle was read
        <b>${쉼표(기둥.가운데)} times</b> in the month.</p>
    </div>

    <div class="표">
      <h3>ACT &middot; READS IN THE MONTH &middot; SHARE OF ALL</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>The middle is closer<br>to the bottom than the top.</b>
      <span>kculturewire.com/attention-share</span>
      <i>${쉼표(d.앞자료.본판못잰팀)} acts were dropped, not counted as zero &mdash; we say which</i>
    </div>

    <div class="누">${캐}</div>
  </div>`;
}

const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 글자만 = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  const 재본다 = (무엇, 받은, 바란) => {
    const ok = JSON.stringify(받은) === JSON.stringify(바란);
    if (ok) 통과++; else { 실패++; console.error(`  X ${무엇}\n    받은 것: ${JSON.stringify(받은)}`); }
  };

  /* ── 자료를 지어내지 않는가 ── */
  재본다('자료가 없으면 기둥이 null', 두기둥({}), null);
  재본다('절반팀이 수가 아니면 null', 두기둥({ 본판: { 절반가지는팀수: null } }), null);
  재본다('가운데 열람이 없으면 null',
    두기둥({ 본판: { 절반가지는팀수: 3, 절반가지는비율: 0.1, 아래절반몫: 0.1, 가운데팀열람: null } }), null);
  재본다('제대로 있으면 기둥이 선다',
    두기둥({ 본판: { 절반가지는팀수: 3, 절반가지는비율: 0.1, 아래절반몫: 0.1, 가운데팀열람: 5, 팀수: 30, 합: 100 } })?.절반팀, 3);

  /* ── 이야기가 참인가 ── */
  재본다('쏠렸다 — 절반을 가지는 팀이 20% 안쪽', 기둥.위몫 < 0.2, true);
  재본다('위 몫과 아래 몫이 1점 안쪽으로 닮았다', 두몫이닮았나, true);
  재본다('가운데 팀 열람이 위쪽 첫 팀보다 훨씬 작다', 기둥.가운데 < 표줄[0].열람 / 100, true);

  /* ── 화면이 지켜야 할 말 ── */
  const 글 = 글자만(칸HTML(6.0));
  재본다('🔴 「돈이 아니다」를 화면에 적는다', /not money/.test(글), true);
  재본다('🔴 「실패라 안 부른다」를 적는다', /not being called unsuccessful/.test(글), true);
  재본다('「뷰어가 아니라 지면 열림」을 적는다', /pages being opened/.test(글), true);
  재본다('못 잰 팀을 0 으로 안 센다고 적는다', /not counted as zero/.test(글), true);
  재본다('⛔ 한국어를 안 쓴다', /[가-힣]/.test(글자만(칸HTML(6.0)).replace(/[^\x00-\x7F가-힣]/g, '')), false);
  재본다('⛔ 「popular」로 안 바꿔 쓴다', /popular/i.test(글), false);
  재본다('⛔ 「fans」로 단정하지 않는다', /\bfans\b/i.test(글), false);

  /* ── 수가 자료에서 오는가 ── */
  재본다('팀수가 화면에 있다', 글.includes(쉼표(기둥.팀수)), true);
  재본다('절반팀이 화면에 있다', 글.includes(String(기둥.절반팀)), true);
  재본다('가운데 열람이 화면에 있다', 글.includes(쉼표(기둥.가운데)), true);
  재본다('첫 팀 이름이 화면에 있다', 글.includes(표줄[0].이름), true);

  /* ── 움직임 ── */
  재본다('첫 칸은 거의 비어 있다', 끼(0.2, 0.9, 1.8) < 0.15, true);
  재본다('🔴 한계가 수보다 «먼저» 뜬다', 끼(3.5, 2.6, 3.4) === 1 && 끼(3.5, 5.0, 6.0) === 0, true);
  재본다('끝 칸에 마무리가 떴다', 술술(끼(13.5, 11.6, 12.4)) === 1, true);
  재본다('끝에서 표가 사라진다', 술술(끼(13.5, 7.4, 8.4)) * (1 - 술술(끼(13.5, 11.6, 12.4))) === 0, true);
  재본다('캐릭터가 있다', 칸HTML(6.0).includes('<svg'), true);
  재본다('캐릭터가 오른쪽 아래로 물러난다', (() => {
    const a = 칸HTML(1.0).match(/\.누\{position:absolute;left:([0-9.]+)px/);
    const b = 칸HTML(6.0).match(/\.누\{position:absolute;left:([0-9.]+)px/);
    return !!a && !!b && Number(b[1]) > Number(a[1]);
  })(), true);

  console.log(`\n${실패 ? 'X' : 'OK'} lopsided 자가시험 — 통과 ${통과} · 실패 ${실패}`);
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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/lopsided-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`그림 → ${낼길}`);
}

if (내가돌려졌다 && process.argv.includes('--out')) {
  const 낼길 = process.argv[process.argv.indexOf('--out') + 1];
  if (!낼길) throw new Error('⛔ --out 뒤에 낼 자리를 적으십시오');
  /* 🔴 소리 없는 판을 public/ 에 «두지 않는다». */
  if (/^public[\\/]/.test(낼길) || 낼길.includes('/public/')) {
    throw new Error('⛔ 소리 없는 판을 public/ 에 두면 안 된다 (사장님 「무성 콘텐트 다신 만들지 말 것」)');
  }
  const puppeteer = require('puppeteer-core');
  const ffmpeg = require('ffmpeg-static');
  const 칸수 = 초당 * 총초;
  const 칸방 = 'C:/Users/User/AppData/Local/Temp/claude/lopsided-frames';
  fs.rmSync(칸방, { recursive: true, force: true });
  fs.mkdirSync(칸방, { recursive: true });
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
  for (let i = 0; i < 칸수; i += 1) {
    await p.setContent(칸HTML(i / 초당), { waitUntil: 'load' });
    await p.screenshot({ path: `${칸방}/${String(i).padStart(4, '0')}.png` });
    if (i % 60 === 0) console.log(`  ${i}/${칸수}`);
  }
  await b.close();
  /* ⛔ -an — 소리 트랙을 «만들지 않는다» */
  execFileSync(ffmpeg, [
    '-y', '-framerate', String(초당), '-i', `${칸방}/%04d.png`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
    '-an', 낼길,
  ], { stdio: 'inherit' });
  console.log(`\n소리 입히기 «전» 판 → ${낼길}`);
  console.log('⛔ 이대로 내지 않는다. 다음에 소리를 입히십시오.');
}
