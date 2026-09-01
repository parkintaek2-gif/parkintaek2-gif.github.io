#!/usr/bin/env node
/**
 * make-video-kcw-btsgroup.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「BTS 멤버 일곱 명 × 동남아 네 판 = 28칸. 그룹이 28칸 «전부» 이긴다」
 *
 * ── 왜 이 편인가 (2026-09-01) ────────────────────────────────────
 * 사장님 지시 — 「영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해」.
 * 오늘 낸 기사 `no-bts-member-outdraws-bts` 에서 나온 수다. ⛔ 새 수를 만들지 않는다.
 * 사장님 지시 — 「인기 검색어는 **스타 이름**·작품명·노래제목」. BTS·V·정국이 화면에 선다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **28칸 중 0칸.** 일곱 멤버 누구도, 네 나라 어디서도 그룹을 못 넘는다.
 * 🔴 그런데 이것이 「K팝은 원래 그렇다」가 아니다 — **여섯 팀은 정반대**다.
 * ⭐ 그래서 이 편의 알맹이는 0 이 아니라 **0 옆에 선 «Mark Lee 3/3»** 이다.
 *   한쪽만 보이면 「멤버는 그룹을 못 이긴다」는 틀린 일반화가 된다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **「BTS 가 멤버보다 인기 있다」고 말하지 않는다.** 잰 것은 «어느 문서를 열었나»다.
 * ⛔ 읽힘을 시청·인기·팬 수로 부르지 않는다. 그 한계를 **수보다 먼저** 띄운다.
 * ⛔ 수를 손으로 안 박는다 — `src/data/wikitip-member-vs-group.json` 에서 읽는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-btsgroup.mjs --selftest
 *   node scripts/make-video-kcw-btsgroup.mjs --그림 6.0
 *   node scripts/make-video-kcw-btsgroup.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/wikitip-member-vs-group.json', 'utf8'));

/** 이 그룹의 멤버 짝들 */
export function 그룹짝(자료 = d, 그룹 = 'BTS') {
  const p = (자료?.pairs ?? []).filter((x) => x && x.group === 그룹);
  return p.length ? p : null;
}

/** 잰 «칸» 수 — 멤버 × 그 멤버를 잰 판 */
export function 칸수(짝들) {
  if (!Array.isArray(짝들) || !짝들.length) return null;
  return 짝들.reduce((s, x) => s + (x.rows?.length ?? 0), 0);
}

/** 멤버가 이긴 칸 수 */
export function 이긴칸(짝들) {
  if (!Array.isArray(짝들) || !짝들.length) return null;
  return 짝들.reduce((s, x) => s + (x.memberHigherIn ?? 0), 0);
}

/**
 * 반대쪽 — 잰 나라 «전부»에서 멤버가 이긴 짝.
 * ⛔ 이것이 없으면 이 편은 「멤버는 그룹을 못 이긴다」는 틀린 말이 된다.
 */
export function 뒤집힌짝(자료 = d) {
  return (자료?.pairs ?? []).filter((x) => x && x.rows?.length && x.memberHigherIn === x.rows.length);
}

export const 짝들 = 그룹짝();
if (!짝들) throw new Error('⛔ 자료에서 BTS 짝을 못 읽었다 — 지어내지 않고 멈춘다');

export const 멤버수 = 짝들.length;
export const 전체칸 = 칸수(짝들);
export const 이김 = 이긴칸(짝들);
export const 그룹값 = 짝들[0].groupTotal;
export const 반대 = 뒤집힌짝();

if (!Number.isFinite(전체칸) || !Number.isFinite(이김) || !Number.isFinite(그룹값)) {
  throw new Error('⛔ 자료에서 수를 못 읽었다 — 지어내지 않고 멈춘다');
}
/* ⛔ 이야기가 성립하는지 자가 스스로 본다 — «한 칸도 못 이겼다»가 이 편의 알맹이다 */
if (이김 !== 0) throw new Error(`⛔ 멤버가 ${이김}칸을 이겼다 — 「28칸 전부」 이야기가 안 선다. 멈춘다.`);
if (!반대.length) throw new Error('⛔ 반대쪽 사례가 없다 — 한쪽만 보이면 틀린 일반화가 된다. 멈춘다.');

/** 멤버를 많이 읽힌 차례로 — 위 넷만 화면에 */
export const 표줄 = [...짝들].sort((a, b) => b.memberTotal - a.memberTotal).slice(0, 4);

/** 반대쪽 대표 — 배수가 가장 큰 것이 아니라 «잰 나라가 많은» 것을 고른다 */
export const 반대대표 = [...반대].sort((a, b) => b.rows.length - a.rows.length
  || (b.memberTotal / b.groupTotal) - (a.memberTotal / a.groupTotal))[0];

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 벗 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 한자리 = (n) => Number(n).toFixed(1);

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 큰수 = 술술(끼(초, 5.0, 6.0));
  const 표 = 술술(끼(초, 7.4, 8.4));
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

  const 줄들 = 표줄.map((o) => `<tr><td class="ㄹ">${벗(o.member)}</td>`
    + `<td class="ㄴ">${한자리(o.memberTotal)}</td>`
    + `<td class="ㄷ">0 / ${o.rows.length}</td></tr>`).join('');

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

    .견{position:absolute;left:84px;right:400px;top:900px;opacity:${ㄴ(큰수 * (1 - 끝))}}
    .견 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    .견 .두{display:flex;align-items:baseline;gap:22px}
    .견 .수{font-size:74px;font-weight:900;color:#e7edf0;line-height:1}
    .견 .화{font-size:34px;color:#5d707a}
    .견 .수2{font-size:74px;font-weight:900;color:#5fb3c4;line-height:1;
             transform:translateY(${ㄴ((1 - 큰수) * -26)}px)}
    .견 p{margin-top:14px;font-size:26px;color:#b9c6cc;line-height:1.35}
    .견 b{color:#e7edf0}

    /* ⚠ relay 편에서 표가 위 문단과 겹쳐 두 번 고쳤다. 여기서는 1330 에서 시작한다 */
    .표{position:absolute;left:84px;right:400px;top:1330px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 0;border-top:1px solid #1b2830}
    .ㄹ{font-size:25px;font-weight:800;color:#b9c6cc}
    .ㄴ{font-size:25px;font-weight:700;color:#b9c6cc;text-align:right;width:130px;white-space:nowrap}
    .ㄷ{font-size:25px;font-weight:700;color:#5fb3c4;text-align:right;width:120px;white-space:nowrap}

    .끝{position:absolute;left:84px;right:84px;top:1380px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:28px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>No BTS member outdraws BTS.</b>
      <em>${멤버수} members &times; 4 Wikipedias = ${전체칸} checks. The group wins all ${전체칸}.</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>This counts <b>encyclopaedia pages being opened</b> in Indonesian, Vietnamese, Thai and
        Malay &mdash; per million reads of each edition. It is not popularity, streams or fandom
        size, and Wikipedia records no reason a page was opened.</p>
    </div>

    <div class="견">
      <h3>CHECKS WHERE A MEMBER BEAT THE GROUP</h3>
      <div class="두">
        <span class="수">${이김}</span>
        <span class="화">out of</span>
        <span class="수2">${전체칸}</span>
      </div>
      <p><b>${벗(반대대표.member)} beats ${벗(반대대표.group)} in all ${반대대표.rows.length}.</b>
        ${반대.length} acts lose to their own member in every country we could measure. BTS is not
        the rule &mdash; it is one of the answers.</p>
    </div>

    <div class="표">
      <h3>MEMBER &middot; READS PER MILLION &middot; CHECKS WON</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>The group,<br>every time.</b>
      <span>kculturewire.com/articles</span>
      <i>Wikipedia &middot; 4 editions &middot; 12 months &middot; BTS group ${한자리(그룹값)} per million</i>
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
  재본다('BTS 멤버 일곱을 읽는다', 멤버수, 7);
  재본다('잰 칸이 28이다', 전체칸, 28);
  재본다('⭐⭐ 이야기의 알맹이 — 멤버가 이긴 칸이 0', 이김, 0);
  재본다('⛔ 자료가 비면 null', 그룹짝({ pairs: [] }) === null && 그룹짝({}) === null, true);
  재본다('⛔ 없는 그룹이면 null', 그룹짝(d, '없는그룹'), null);
  재본다('⛔ 칸수를 못 세면 null', 칸수([]) === null && 칸수(null) === null, true);
  재본다('⛔ 이긴칸을 못 세면 null', 이긴칸([]) === null && 이긴칸(null) === null, true);

  /* ── ⛔ 한쪽만 보이면 틀린 일반화가 된다 ── */
  재본다('⭐⭐ 반대쪽 사례가 있다 — 없으면 이 편은 거짓말이 된다', 반대.length >= 1, true);
  재본다('반대 대표가 잰 나라 «전부»에서 이긴다',
    반대대표.memberHigherIn === 반대대표.rows.length, true);
  재본다('반대 대표가 BTS 가 아니다', 반대대표.group !== 'BTS', true);

  /* ── 표 ── */
  재본다('표가 넷이다', 표줄.length, 4);
  재본다('표가 많이 읽힌 차례다', 표줄.every((x, i) => i === 0 || 표줄[i - 1].memberTotal >= x.memberTotal), true);
  재본다('표의 멤버가 전부 BTS 다', 표줄.every((x) => x.group === 'BTS'), true);
  재본다('⭐ 표의 «이긴 칸»이 전부 0 이다', 표줄.every((x) => x.memberHigherIn === 0), true);

  /* ── 화면 ── */
  const h = 칸HTML(9.0);
  const 글 = 글자만(h);
  재본다('⛔ 화면에 한국어가 없다', /[가-힣]/.test(글), false);
  재본다('스타 이름이 화면에 있다 — 사장님 「인기 검색어는 스타 이름」',
    글.includes('BTS') && 글.includes('V') && 글.includes('Jungkook'), true);
  재본다('사이트 입구가 화면에 있다', 글.includes('kculturewire.com'), true);
  재본다('띠에도 사이트 이름이 내내 있다', 칸HTML(3.0).includes('KCULTUREWIRE.COM'), true);
  재본다('28이 화면에 있다', 글.includes('28'), true);
  재본다('반대 사례가 화면에 있다', 글.includes(반대대표.member), true);

  /* ── ⛔⛔ 한계가 «수보다 먼저» 뜬다 ── */
  재본다('⭐⭐ 3.4초에 한계가 다 떴다', 투명도(3.4, '한') === 1, true);
  재본다('⭐⭐ 그때 큰 수는 아직 안 떴다', 투명도(3.4, '견') === 0, true);
  재본다('한계가 큰 수보다 먼저다', 투명도(4.0, '한') > 투명도(4.0, '견'), true);
  재본다('⛔ 「popularity」라고 안 쓴다', /popularity, streams or fandom/.test(글), true);

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

  console.log(`\n${실패 ? 'X' : 'OK'} btsgroup 자가시험 — 통과 ${통과} · 실패 ${실패}`);
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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/btsgroup-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  /* 🔴 기본 낼 자리가 «공개 폴더 밖»이다 — 소리 없는 판이 실수로 서지 않게 */
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/btsgroup.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwbtsgroup');
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.mkdirSync(임시, { recursive: true });

  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });

  const 칸수2 = Math.round(총초 * 초당);
  for (let n = 0; n < 칸수2; n += 1) {
    await p.setContent(칸HTML(n / 초당), { waitUntil: 'load' });
    await p.screenshot({ path: path.join(임시, `${String(n).padStart(4, '0')}.png`) });
    if (n % 90 === 0) console.log(`  ${n}/${칸수2}`);
  }
  await b.close();

  /* ⛔ anullsrc(빈 소리)를 «안» 붙인다 — 그것이 무음 트랙 결함의 뿌리였다. */
  const ff = require('ffmpeg-static');
  execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png'),
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-an', '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`OK ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
  console.log('🔴 이것은 «아직 콘텐트가 아니다» — 소리가 없다. 다음을 반드시 거친다:');
  console.log('   node scripts/make-kcw-sound.mjs --set btsgroup --목소리 en-US-AndrewNeural');
}
