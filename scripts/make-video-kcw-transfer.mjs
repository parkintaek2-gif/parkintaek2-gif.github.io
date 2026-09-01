#!/usr/bin/env node
/**
 * make-video-kcw-transfer.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「기생충은 최고일에 269만이 읽혔는데 송강호에게 간 것은 3.9%. 사랑의 불시착은 13만인데 현빈이 34.2%」
 *
 * ── 왜 이 편인가 (2026-09-01) ────────────────────────────────────
 * 사장님 지시 — 「영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해」.
 * 오늘 낸 기사 `bigger-title-smaller-share` 에서 나온 수다. ⛔ 새 수를 만들지 않는다.
 * 사장님 지시 — 「인기 검색어는 **스타 이름**」. 현빈·송강호·류준열이 화면에 선다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **작품이 클수록 배우에게 덜 간다.** r = -0.678 · n = 12 · p ≈ 0.016.
 * ⭐ 알맹이는 「크면 좋다」가 아니라 **「크면 사람에게 덜 남는다」**는 뒤집힘이다.
 * 🔴 그런데 12편은 «우리가 고른» 급등작이다 — 그 말을 수보다 «먼저» 띄운다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **「배우가 유명해졌다」고 말하지 않는다.** 잰 것은 «어느 문서를 열었나»다.
 * ⛔ 「주연」을 우리가 고르지 않았다는 말을 화면에 적는다 — 손으로 고르면 12편 중 2편이 틀렸다.
 * ⛔ 수를 손으로 안 박는다 — `src/data/kcw-breakout-transfer.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-transfer.mjs --selftest
 *   node scripts/make-video-kcw-transfer.mjs --그림 6.0
 *   node scripts/make-video-kcw-transfer.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-breakout-transfer.json', 'utf8'));

/** 가장 큰 작품 · 가장 몫이 큰 작품 — 이 둘이 이 편의 두 기둥이다 */
export function 두기둥(자료 = d) {
  const 줄 = 자료?.줄;
  if (!Array.isArray(줄) || 줄.length < 3) return null;
  const 가장큰 = [...줄].sort((a, b) => b.작품최고 - a.작품최고)[0];
  const 몫최고 = [...줄].sort((a, b) => b.몫 - a.몫)[0];
  if (가장큰.슬러그 === 몫최고.슬러그) return null;   // ⛔ 같으면 「뒤집힘」 이야기가 안 선다
  return { 가장큰, 몫최고 };
}

export const 기둥 = 두기둥();
if (!기둥) throw new Error('⛔ 자료에서 두 기둥을 못 뽑았다 — 지어내지 않고 멈춘다');

export const 상 = d.상관;
if (!상 || !Number.isFinite(상.r)) throw new Error('⛔ 자료에 상관이 없다 — 멈춘다');

/* ⛔ 이야기가 성립하는지 자가 스스로 본다 — «클수록 덜 간다»는 «음수» 상관이어야 한다 */
if (상.r >= 0) throw new Error(`⛔ 상관이 ${상.r} 로 양수다 — 「클수록 덜 간다」 이야기가 안 선다. 멈춘다.`);
/* 자유도 10 · 양쪽 0.05 의 t 문턱은 2.228 이다 */
export const t문턱 = 2.228;
if (Math.abs(상.t) <= t문턱) throw new Error(`⛔ |t| ${Math.abs(상.t).toFixed(2)} 가 문턱 ${t문턱} 안이다 — 우연과 못 가른다. 멈춘다.`);

/** 표는 «작품이 큰» 차례로 넷 — 커질수록 몫이 줄는 것이 눈에 보이게 */
export const 표줄 = [...d.줄].sort((a, b) => b.작품최고 - a.작품최고).slice(0, 4);

export const 못한것수 = (d.못한것 ?? []).length;
export const 잰편수 = d.줄.length;

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 벗 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 쉼표 = (n) => Number(n).toLocaleString('en-US');
const 한자리 = (n) => Number(n).toFixed(1);

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

  const 줄들 = 표줄.map((o) => `<tr><td class="ㄹ">${벗(o.작품)}</td>`
    + `<td class="ㄴ">${쉼표(o.작품최고)}</td>`
    + `<td class="ㄷ">${한자리(o.몫)}%</td></tr>`).join('');

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

    /* ⛔⛔ 한계가 수보다 «먼저» 뜬다 */
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

    .표{position:absolute;left:84px;right:400px;top:1330px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 0;border-top:1px solid #1b2830}
    .ㄹ{font-size:24px;font-weight:800;color:#b9c6cc}
    .ㄴ{font-size:24px;font-weight:700;color:#b9c6cc;text-align:right;width:170px;white-space:nowrap}
    .ㄷ{font-size:24px;font-weight:700;color:#5fb3c4;text-align:right;width:110px;white-space:nowrap}

    .끝{position:absolute;left:84px;right:84px;top:1380px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:28px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>The bigger the Korean hit,<br>the less reaches its star.</b>
      <em>${잰편수} breakouts measured &middot; r = ${상.r.toFixed(3)} &middot; p &asymp; 0.016</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>These are <b>encyclopaedia pages being opened</b> on English Wikipedia &mdash; not viewers,
        not fame. And these ${잰편수} titles are ones <b>we picked</b> because we knew they broke out,
        so this is a pattern inside a list of winners, not a law.</p>
    </div>

    <div class="견">
      <h3>SHARE THAT REACHED THE MOST-READ CAST MEMBER</h3>
      <div class="두">
        <span class="수">${한자리(기둥.가장큰.몫)}%</span>
        <span class="화">vs</span>
        <span class="수2">${한자리(기둥.몫최고.몫)}%</span>
      </div>
      <p><b>${벗(기둥.가장큰.작품)}</b> peaked at ${쉼표(기둥.가장큰.작품최고)} and gave
        ${벗(기둥.가장큰.으뜸)} ${한자리(기둥.가장큰.몫)}%.
        <b>${벗(기둥.몫최고.작품)}</b> peaked at ${쉼표(기둥.몫최고.작품최고)} &mdash; a twentieth
        of the size &mdash; and gave ${벗(기둥.몫최고.으뜸)} ${한자리(기둥.몫최고.몫)}%.</p>
    </div>

    <div class="표">
      <h3>TITLE &middot; ITS BIGGEST DAY &middot; SHARE TO ITS STAR</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>A wider audience<br>is a shallower one.</b>
      <span>kculturewire.com/articles</span>
      <i>We did not choose the star &mdash; we measured every cast member and took the most-read</i>
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

  /* ── 자료를 제대로 읽나 ── */
  재본다('12편을 읽는다', 잰편수, 12);
  재본다('⬜ 못 한 편이 0 이다', 못한것수, 0);
  재본다('⭐⭐ 이야기의 알맹이 — 상관이 음수다', 상.r < 0, true);
  재본다('⭐⭐ |t| 가 문턱 2.228 을 넘는다', Math.abs(상.t) > t문턱, true);
  재본다('자유도가 n-2 다', 상.자유도, 상.n - 2);
  재본다('⛔ 자료가 비면 null', 두기둥({ 줄: [] }) === null && 두기둥({}) === null, true);
  재본다('⛔ 셋 미만이면 null', 두기둥({ 줄: [{ 작품최고: 1, 몫: 1 }, { 작품최고: 2, 몫: 2 }] }), null);
  재본다('⛔ 두 기둥이 같은 작품이면 null',
    두기둥({ 줄: [{ 슬러그: 'A', 작품최고: 9, 몫: 9 }, { 슬러그: 'B', 작품최고: 2, 몫: 2 }, { 슬러그: 'C', 작품최고: 1, 몫: 1 }] }), null);

  /* ── ⭐ 뒤집힘이 실제로 뒤집혀 있나 ── */
  재본다('⭐ 가장 큰 작품의 몫이 최고 몫보다 «작다»', 기둥.가장큰.몫 < 기둥.몫최고.몫, true);
  재본다('⭐ 가장 큰 작품이 몫 최고 작품보다 «크다»', 기둥.가장큰.작품최고 > 기둥.몫최고.작품최고, true);

  /* ── 표 ── */
  재본다('표가 넷이다', 표줄.length, 4);
  재본다('표가 작품 큰 차례다', 표줄.every((x, i) => i === 0 || 표줄[i - 1].작품최고 >= x.작품최고), true);
  재본다('표의 몫이 다 0~100 안이다', 표줄.every((x) => x.몫 > 0 && x.몫 <= 100), true);

  /* ── 화면 ── */
  const h = 칸HTML(9.0);
  const 글 = 글자만(h);
  재본다('⛔ 화면에 한국어가 없다', /[가-힣]/.test(글), false);
  재본다('스타 이름이 화면에 있다 — 사장님 「인기 검색어는 스타 이름」',
    글.includes(기둥.가장큰.으뜸) && 글.includes(기둥.몫최고.으뜸), true);
  재본다('작품 이름이 화면에 있다', 글.includes(기둥.가장큰.작품) && 글.includes(기둥.몫최고.작품), true);
  재본다('사이트 입구가 화면에 있다', 글.includes('kculturewire.com'), true);
  재본다('띠에도 사이트 이름이 내내 있다', 칸HTML(3.0).includes('KCULTUREWIRE.COM'), true);
  재본다('상관값이 화면에 있다', 글.includes(상.r.toFixed(3)), true);

  /* ── ⛔⛔ 한계가 «수보다 먼저» 뜬다 ── */
  재본다('⭐⭐ 3.4초에 한계가 다 떴다', 투명도(3.4, '한') === 1, true);
  재본다('⭐⭐ 그때 큰 수는 아직 안 떴다', 투명도(3.4, '견') === 0, true);
  재본다('한계가 큰 수보다 먼저다', 투명도(4.0, '한') > 투명도(4.0, '견'), true);
  재본다('⛔ 「우리가 골랐다」를 화면에 적었다', /we picked/i.test(글), true);
  재본다('⛔ 「주연을 우리가 안 골랐다」를 화면에 적었다', /did not choose the star/i.test(칸HTML(13.0)), true);
  재본다('⛔ 「fame」이라고 단정하지 않는다', /not viewers,\s*not fame/i.test(글), true);

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

  console.log(`\n${실패 ? 'X' : 'OK'} transfer 자가시험 — 통과 ${통과} · 실패 ${실패}`);
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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/transfer-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`그림 → ${낼길}`);
}

if (내가돌려졌다 && process.argv.includes('--out')) {
  const 낼길 = process.argv[process.argv.indexOf('--out') + 1];
  if (!낼길) throw new Error('⛔ --out 뒤에 낼 자리를 적으십시오');
  /* 🔴 소리 없는 판을 public/ 에 «두지 않는다». 여기서 내는 것은 «소리 입히기 전» 임시 파일이다. */
  if (/^public[\\/]/.test(낼길) || 낼길.includes('/public/')) {
    throw new Error('⛔ 소리 없는 판을 public/ 에 두면 안 된다 (사장님 「무성 콘텐트 다신 만들지 말 것」)');
  }
  const puppeteer = require('puppeteer-core');
  const ffmpeg = require('ffmpeg-static');
  const 칸수 = 초당 * 총초;
  const 칸방 = 'C:/Users/User/AppData/Local/Temp/claude/transfer-frames';
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
  /* ⛔ -an — 소리 트랙을 «만들지 않는다». anullsrc 로 빈 트랙을 붙였다가 한 번 당했다 */
  execFileSync(ffmpeg, [
    '-y', '-framerate', String(초당), '-i', `${칸방}/%04d.png`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
    '-an', 낼길,
  ], { stdio: 'inherit' });
  console.log(`\n소리 입히기 «전» 판 → ${낼길}`);
  console.log('⛔ 이대로 내지 않는다. 다음에 소리를 입히십시오.');
}
