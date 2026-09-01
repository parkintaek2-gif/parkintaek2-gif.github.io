#!/usr/bin/env node
/**
 * make-video-kcw-alchemy.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「시청시간 위 10편 중 아홉이 1위를 찍었다. 예외 하나가 가장 오래 올랐다」
 *
 * ── 왜 이 편인가 (2026-09-01) ────────────────────────────────────
 * 사장님 지시 — 「영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해」.
 * 오늘 낸 기사 `alchemy-of-souls-ran-longest-without-number-one` 에서 나온 수다.
 * ⛔ 새 수를 만들지 않는다. 사장님 「인기 검색어는 작품명」 — 작품 이름이 화면에 선다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **오래 오른 것과 1위를 찍은 것은 «다른 작품»이다.**
 * 🔴 「가장 큰 한국 드라마」라는 말이 두 가지를 가리키는데 아무도 어느 쪽인지 안 밝힌다.
 * ⭐ 그래서 알맹이는 27 이 아니라 **27 옆에 선 3위**, 그리고 **11주 60백만 vs 27주 16백만**이다.
 *   한 수만 보이면 손님이 「오래 갔으니 더 컸다」로 읽는다 — 그건 자료가 말하는 것이 아니다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **「어느 쪽이 더 큰 작품이다」라고 말하지 않는다.** 두 자를 나란히 놓고 끝낸다.
 * ⛔ 시청시간을 「인기」로 부르지 않는다. 넷플릭스가 «톱10에 든 주»만 내놓는 값이다.
 *   그 한계를 **수보다 먼저** 띄운다.
 * ⛔ 수를 손으로 안 박는다 — `src/data/wikitip-global.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-alchemy.mjs --selftest
 *   node scripts/make-video-kcw-alchemy.mjs --그림 9.0
 *   node scripts/make-video-kcw-alchemy.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-global.json', 'utf8'));

/** 시청시간 위 몇 편 */
export function 위편(자료 = d, 몇 = 10) {
  const r = 자료?.rows;
  if (!Array.isArray(r) || !r.length) return null;
  return r.slice(0, 몇);
}

/**
 * 그 안에서 «1위를 못 찍은» 것들.
 * ⛔ 이것이 하나가 아니면 이 편의 이야기가 달라진다 — 자가 스스로 본다.
 */
export function 예외들(자료 = d, 몇 = 10) {
  const 위 = 위편(자료, 몇);
  if (!위) return null;
  return 위.filter((x) => x.peak !== 1);
}

/** 오래 오른 차례 */
export function 오래순(자료 = d, 몇 = 5) {
  const r = 자료?.rows;
  if (!Array.isArray(r) || !r.length) return null;
  return [...r].sort((a, b) => b.weeks - a.weeks).slice(0, 몇);
}

export const 위10 = 위편();
if (!위10) throw new Error('⛔ 자료에서 위 10편을 못 읽었다 — 지어내지 않고 멈춘다');
export const 예외 = 예외들();
if (!예외 || 예외.length !== 1) {
  throw new Error(`⛔ 위 10편에서 1위 못 찍은 것이 ${예외?.length ?? '?'}편이다 — 「예외 하나」 이야기가 안 선다. 멈춘다.`);
}
export const 그것 = 예외[0];
/** 견줄 짝 — 시간이 비슷한데 주수가 훨씬 짧은 것 */
export const 짝 = [...위10].filter((x) => x.title !== 그것.title)
  .sort((a, b) => Math.abs(a.hours - 그것.hours) - Math.abs(b.hours - 그것.hours))
  .find((x) => x.weeks < 그것.weeks * 0.6);
if (!짝) throw new Error('⛔ 견줄 짝을 못 찾았다 — 한 수만 보이면 「오래 갔으니 더 컸다」로 읽힌다. 멈춘다.');

export const 표줄 = 오래순();
export const 주당그것 = Math.round(그것.hours / 그것.weeks / 1e6);
export const 주당짝 = Math.round(짝.hours / 짝.weeks / 1e6);

if (!Number.isFinite(주당그것) || !Number.isFinite(주당짝)) {
  throw new Error('⛔ 주당 시간을 못 셌다 — 지어내지 않고 멈춘다');
}
/* ⛔ 이야기가 성립하나 — 짝이 «주당» 더 많아야 이 편이 뜻을 가진다 */
if (주당짝 <= 주당그것) throw new Error('⛔ 짝의 주당 시간이 더 크지 않다 — 이야기가 안 선다. 멈춘다.');

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 벗 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 십억 = (h) => (h / 1e9).toFixed(2);

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

  const 줄들 = 표줄.map((o) => `<tr><td class="ㄹ">${벗(o.title)}</td>`
    + `<td class="ㄴ">${o.weeks}w</td>`
    + `<td class="${o.peak === 1 ? 'ㄷ' : 'ㅁ'}">#${o.peak}</td></tr>`).join('');

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
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:35px;font-weight:900;
           color:#5fb3c4;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 수보다 «먼저» 뜬다 */
    .한{position:absolute;left:84px;right:84px;top:610px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:31px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    .견{position:absolute;left:84px;right:400px;top:920px;opacity:${ㄴ(큰수 * (1 - 끝))}}
    .견 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    .견 .두{display:flex;align-items:baseline;gap:20px}
    .견 .수{font-size:70px;font-weight:900;color:#e7edf0;line-height:1}
    .견 .화{font-size:30px;color:#5d707a}
    .견 .수2{font-size:70px;font-weight:900;color:#5fb3c4;line-height:1;
             transform:translateY(${ㄴ((1 - 큰수) * -26)}px)}
    .견 p{margin-top:14px;font-size:26px;color:#b9c6cc;line-height:1.35}
    .견 b{color:#e7edf0}

    .표{position:absolute;left:84px;right:400px;top:1330px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 0;border-top:1px solid #1b2830}
    /* ⚠ 작품 이름이 길다(When Life Gives You Tangerines). 접히면 표가 무너진다 —
       그래서 «자르지 않고» 글자를 줄이고 줄바꿈을 막는다. 그려서 확인했다 */
    .ㄹ{font-size:23px;font-weight:800;color:#b9c6cc;white-space:nowrap;overflow:hidden;
        text-overflow:ellipsis;max-width:330px}
    .ㄴ{font-size:23px;font-weight:700;color:#b9c6cc;text-align:right;width:80px;white-space:nowrap}
    .ㄷ{font-size:23px;font-weight:800;color:#5d707a;text-align:right;width:70px}
    .ㅁ{font-size:23px;font-weight:900;color:#5fb3c4;text-align:right;width:70px}

    .끝{position:absolute;left:84px;right:84px;top:1380px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:28px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${벗(그것.title)} ran ${그것.weeks} weeks and never hit number one.</b>
      <em>Nine of the ten most watched did. It charted longer than eight of them.</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>Netflix publishes hours <b>only for the weeks a title was inside the global top 10</b>.
        Everything watched before it entered, or after it fell out, is not published anywhere.
        Every figure here is a floor.</p>
    </div>

    <div class="견">
      <h3>HOURS PER WEEK ON THE CHART (MILLIONS)</h3>
      <div class="두">
        <span class="수">${주당짝}</span>
        <span class="화">vs</span>
        <span class="수2">${주당그것}</span>
      </div>
      <p><b>${벗(짝.title)} drew ${십억(짝.hours)}bn in ${짝.weeks} weeks.
        ${벗(그것.title)} drew ${십억(그것.hours)}bn in ${그것.weeks}.</b>
        Neither number is wrong. "Biggest Korean drama" means two different things.</p>
    </div>

    <div class="표">
      <h3>LONGEST RUNS &middot; WEEKS &middot; PEAK</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>Longest run,<br>and never first.</b>
      <span>kculturewire.com/articles</span>
      <i>Netflix Top 10 &middot; ${d.weekCount} weeks &middot; ${d.titleCount} Korean titles</i>
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
  재본다('위 10편을 읽는다', 위10.length, 10);
  재본다('⛔ 자료가 비면 null', 위편({ rows: [] }) === null && 위편({}) === null, true);
  재본다('⭐⭐ 1위 못 찍은 것이 «하나»다', 예외.length, 1);
  재본다('그것이 Alchemy of Souls 다', 그것.title, 'Alchemy of Souls');
  재본다('27주 · 3위', 그것.weeks === 27 && 그것.peak === 3, true);
  재본다('⛔ 예외를 못 세면 null', 예외들({ rows: [] }) === null, true);

  /* ── ⛔ 한 수만 보이면 「오래 갔으니 더 컸다」로 읽힌다 ── */
  재본다('⭐⭐ 견줄 짝을 찾았다', !!짝, true);
  재본다('짝이 훨씬 짧게 올랐다', 짝.weeks < 그것.weeks * 0.6, true);
  재본다('⭐ 짝의 «주당» 시간이 더 크다 — 이 편의 알맹이', 주당짝 > 주당그것, true);
  /**
   * ⚠ [2026-09-01] 여기서 내가 60(All of Us Are Dead)을 적었다가 틀렸다.
   *   자는 «시간이 가장 가까운» 짝을 고르므로 King the Land(0.45bn, 11주, 주당 41)가 나온다.
   *   ⭐ 자가 옳고 내 기댓값이 틀렸다. **기사에 쓴 수를 그대로 옮겨 적으려다 그랬다** —
   *     기사는 내가 «손으로» 고른 짝이고, 이 자는 규칙으로 고른다. 둘은 다를 수 있다.
   *   ⛔ 자를 기댓값에 맞추지 않는다. 기댓값을 자에 맞춘다.
   */
  재본다('주당 수 — 그것 16', 주당그것, 16);
  재본다('주당 수 — 짝이 더 크다', 주당짝 > 주당그것 && 주당짝 === 41, true);

  /* ── 표 ── */
  재본다('표가 다섯이다', 표줄.length, 5);
  재본다('표가 오래 오른 차례다', 표줄.every((x, i) => i === 0 || 표줄[i - 1].weeks >= x.weeks), true);
  재본다('⭐ 표에 그것이 들어 있다', 표줄.some((x) => x.title === 그것.title), true);
  재본다('표에 1위 아닌 것이 색으로 갈린다', 칸HTML(9).includes('class="ㅁ"'), true);

  /* ── 화면 ── */
  const h = 칸HTML(9.0);
  const 글 = 글자만(h);
  재본다('⛔ 화면에 한국어가 없다', /[가-힣]/.test(글), false);
  재본다('작품 이름이 화면에 있다 — 사장님 「인기 검색어는 작품명」',
    글.includes('Alchemy of Souls') && 글.includes('Squid Game'), true);
  재본다('사이트 입구가 화면에 있다', 글.includes('kculturewire.com'), true);
  재본다('띠에도 사이트 이름이 내내 있다', 칸HTML(3.0).includes('KCULTUREWIRE.COM'), true);
  재본다('27 이 화면에 있다', 글.includes('27'), true);
  재본다('두 주당 수가 «같이» 있다 — 하나만 있으면 오해가 된다',
    글.includes(String(주당짝)) && 글.includes(String(주당그것)), true);
  재본다('짝의 이름이 화면에 있다', 글.includes(짝.title), true);

  /* ── ⛔⛔ 한계가 «수보다 먼저» 뜬다 ── */
  재본다('⭐⭐ 3.4초에 한계가 다 떴다', 투명도(3.4, '한') === 1, true);
  재본다('⭐⭐ 그때 큰 수는 아직 안 떴다', 투명도(3.4, '견') === 0, true);
  재본다('⛔ 「floor」라고 못박는다', /Every figure here is a floor/.test(글), true);
  재본다('⛔ 어느 쪽이 더 크다고 말하지 않는다', /Neither number is wrong/.test(글), true);

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

  console.log(`\n${실패 ? 'X' : 'OK'} alchemy 자가시험 — 통과 ${통과} · 실패 ${실패}`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--그림');
  const 때 = Number(process.argv[i + 1] ?? 9);
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
  await p.setContent(칸HTML(때), { waitUntil: 'load' });
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/alchemy-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/alchemy.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwalchemy');
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
  console.log('   node scripts/make-kcw-sound.mjs --set alchemy --원본 archive/silent-source/alchemy.mp4 --목소리 en-US-AndrewNeural');
}
