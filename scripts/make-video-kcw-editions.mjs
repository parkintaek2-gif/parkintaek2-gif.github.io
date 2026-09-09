#!/usr/bin/env node
/**
 * make-video-kcw-editions.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「한국 스타 478명 중 306명은 중국어판이 1위다. BTS 일곱은 한 명도 아니다」
 *
 * ── 왜 이 편인가 (2026-09-09) ────────────────────────────────────
 * 사장님 지시 — 「영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해」.
 * 오늘 낸 기사 `spanish-leads-for-six-of-seven-bts-members` 에서 나온 수다.
 * ⛔ 새 수를 만들지 않는다 — `src/data/kcw-language-reads.json` 에서 읽는다.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * 명부 전체에서는 **중국어판이 306명(64%)의 1위**인데, **BTS 일곱은 한 명도 중국어가 아니다.**
 * 스페인어가 여섯을 가져가고, **지민만 일본어**다 — 그리고 그 차가 4,669 밖에 안 된다.
 * ⭐ 알맹이는 「BTS 가 크다」가 아니라 **「같은 자로 재도 이 일곱은 명부와 반대로 나온다」**다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ 🔴 **언어판을 나라로 바꿔 말하지 않는다.** 중국어판은 중국 본토에서 막혀 있다.
 *   그래서 「이것은 나라가 아니다」를 «수보다 먼저» 띄운다. 이 한 줄을 빼면 편이 거짓이 된다.
 * ⛔ 열람을 「인기」로 부르지 않는다 — 찾아본 횟수다. 좋은 일로도 나쁜 일로도 는다.
 * ⛔ 「팬이 몇 명」으로 바꿔 말하지 않는다. 우리는 사람 수를 안 쟀다.
 * ⛔ **왜 그런지 말하지 않는다.** 화교 인구인지 편집 습관인지 우리 자료로 못 가른다.
 * ⛔ 🔴 **1위만 내고 «차»를 감추지 않는다.** 지민의 차는 4,669 다 — 뒤집힐 수 있는 크기다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 «내지» 않는다** (사장님 「무성 콘텐트 다신 만들지 말 것」).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-editions.mjs --selftest
 *   node scripts/make-video-kcw-editions.mjs --그림 6.0
 *   node scripts/make-video-kcw-editions.mjs --out <소리 입히기 전 자리>.mp4
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

const d = JSON.parse(fs.readFileSync('src/data/kcw-language-reads.json', 'utf8'));

/** 이 편이 말하려는 일곱 사람 — 이름은 «자료에 있는 그대로» 찾는다 */
export const 일곱 = ['Jungkook', 'V', 'Jimin', 'Kim Seok-jin', 'RM', 'Suga', 'J-Hope'];

/**
 * 이 편의 기둥 — 「명부 1위 판」과 「그 일곱의 1위 판」이 어긋나는가.
 * ⛔ 한 사람이라도 자료에 없으면 «멈춘다». 여섯만 그리고 일곱이라 말하지 않는다.
 */
export function 기둥뽑기(자료 = d, 이름들 = 일곱) {
  const 줄들 = 자료?.allRows;
  if (!Array.isArray(줄들) || !줄들.length) return null;
  const 뽑은 = 이름들.map((n) => 줄들.find((r) => r.name === n));
  if (뽑은.some((r) => !r || !r.topCode)) return null;
  const 판셈 = {};
  for (const r of 뽑은) 판셈[r.topCode] = (판셈[r.topCode] ?? 0) + 1;
  const 정 = Object.entries(판셈).sort((a, b) => b[1] - a[1]);
  const 명부으뜸 = (자료.leadTable ?? [])[0];
  if (!명부으뜸) return null;
  return {
    사람들: 뽑은,
    많은판: 정[0][0],
    많은판수: 정[0][1],
    명부판: 명부으뜸.code,
    명부이름: 명부으뜸.name,
    명부수: 명부으뜸.leads,
    명부몫: 명부으뜸.share,
    명부사람수: 자료.people,
    /* 명부 1위 판이 이 일곱 가운데 «몇 명»의 1위인가 — 0 이면 그것이 이 편의 알맹이다 */
    명부판이이긴수: 판셈[명부으뜸.code] ?? 0,
    창: 자료.window,
  };
}

export const 기 = 기둥뽑기();
if (!기) throw new Error('⛔ 자료에서 기둥을 못 뽑았다 — 지어내지 않고 멈춘다');

/* ⛔ 이야기가 성립하는지 자가 스스로 본다 — 「명부와 어긋난다」가 참이어야 이 편이 선다 */
if (기.명부판이이긴수 !== 0) {
  throw new Error(`⛔ 명부 1위 판(${기.명부판})이 이 일곱 중 ${기.명부판이이긴수}명의 1위다 — 「한 명도 없다」가 거짓이다. 멈춘다.`);
}
if (기.많은판수 < 5) {
  throw new Error(`⛔ 한 판이 ${기.많은판수}명만 이긴다 — 「여섯이 한 판」이라는 이야기가 안 선다. 멈춘다.`);
}

/** 예외가 되는 사람 — 많은판이 아닌 사람. 이 편은 그 사람의 «차»를 반드시 낸다 */
export const 예외 = 기.사람들.filter((r) => r.topCode !== 기.많은판);
if (예외.length !== 1) {
  throw new Error(`⛔ 예외가 ${예외.length}명이다 — 「하나만 다르다」가 아니다. 화면 글을 다시 써야 한다. 멈춘다.`);
}

/* ⛔ 판 이름을 손으로 박지 않는다 — 「Spanish」를 박아 두었다가 자료가 바뀌면 거짓이 된다.
 *   많은판의 «영문 이름»은 그 판을 1위로 가진 사람의 줄에서 읽는다. */
export const 많은판이름 = 기.사람들.find((r) => r.topCode === 기.많은판)?.top;
if (!많은판이름) throw new Error('⛔ 많은판의 영문 이름을 못 찾았다 — 손으로 적지 않고 멈춘다');

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 벗 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 쉼표 = (n) => Number(n).toLocaleString('en-US');

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

  /* 표는 일곱 사람 전부 — 여섯만 보이고 일곱이라 말하지 않는다.
     ⭐ 큰 수부터 세운다. 멤버 차례로 두면 수가 오르내려서 «틀린 표»처럼 보인다(눈으로 보고 고쳤다). */
  const 줄들 = [...기.사람들].sort((a, b) => b.topReads - a.topReads).map((r) => {
    const 다름 = r.topCode !== 기.많은판;
    return `<tr class="${다름 ? 'ㅍ' : ''}"><td class="ㄹ">${벗(r.name)}</td>`
      + `<td class="ㅁ">${벗(r.top)}</td>`
      + `<td class="ㄴ">${쉼표(r.topReads)}</td></tr>`;
  }).join('');

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

    /* ⛔⛔ 한계가 수보다 «먼저» 뜬다 — 이 편에서는 「나라가 아니다」가 그 자리다 */
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

    .표{position:absolute;left:84px;right:400px;top:1290px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:8px 0;border-top:1px solid #1b2830}
    .ㄹ{font-size:24px;font-weight:800;color:#b9c6cc}
    .ㅁ{font-size:23px;font-weight:700;color:#5d707a;text-align:right;width:150px}
    .ㄴ{font-size:24px;font-weight:700;color:#b9c6cc;text-align:right;width:130px;white-space:nowrap}
    .ㅍ .ㅁ{color:#5fb3c4}
    .ㅍ .ㄹ{color:#e7edf0}

    .끝{position:absolute;left:84px;right:84px;top:1360px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:28px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${쉼표(기.명부사람수)} Korean stars.<br>${기.명부이름} leads for ${쉼표(기.명부수)}.</b>
      <em>For BTS&rsquo;s seven, it leads for ${기.명부판이이긴수} &middot; ${벗(기.창)}</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBERS</h3>
      <p>These are <b>language editions, not countries</b>. Chinese Wikipedia is
        <b>blocked in mainland China</b>, so its readers are in Taiwan, Hong Kong, Singapore,
        Malaysia and the wider diaspora. We count reads and never say why.</p>
    </div>

    <div class="견">
      <h3>WHICH EDITION READS THEM MOST, ENGLISH SET ASIDE</h3>
      <div class="두">
        <span class="수">${기.많은판수} of 7</span>
        <span class="화">&rarr;</span>
        <span class="수2">${벗(많은판이름)}</span>
      </div>
      <p>Across all ${쉼표(기.명부사람수)} people, ${벗(기.명부이름)} is the most-read edition for
        <b>${쉼표(기.명부수)}</b> of them &mdash; ${기.명부몫}%. For the seven BTS members it is the most-read
        edition for <b>${기.명부판이이긴수}</b>.</p>
    </div>

    <div class="표">
      <h3>PERSON &middot; EDITION THAT READS THEM MOST &middot; READS</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>${벗(예외[0].name)} is the exception<br>&mdash; by ${쉼표(예외[0].margin)} reads.</b>
      <span>kculturewire.com/read-in</span>
      <i>A lead that small could flip on a different window &mdash; so we print the margin, not just the winner</i>
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
  재본다('자료가 없으면 기둥이 null', 기둥뽑기({}), null);
  재본다('줄이 비었으면 null', 기둥뽑기({ allRows: [] }), null);
  재본다('⛔ 한 사람이라도 없으면 null (여섯만 그리고 일곱이라 하지 않는다)',
    기둥뽑기({ allRows: [{ name: 'Jungkook', topCode: 'es' }], leadTable: [{ code: 'zh', name: 'Chinese', leads: 1, share: 1 }] }), null);
  재본다('leadTable 이 없으면 null', 기둥뽑기({
    allRows: 일곱.map((n) => ({ name: n, topCode: 'es', topReads: 1, margin: 1 })),
  }), null);
  재본다('제대로 있으면 기둥이 선다', 기둥뽑기({
    allRows: 일곱.map((n) => ({ name: n, topCode: 'es', top: 'Spanish', topReads: 1, margin: 1 })),
    leadTable: [{ code: 'zh', name: 'Chinese', leads: 300, share: 64 }], people: 478, window: 'w',
  })?.많은판수, 7);

  /* ── 이야기가 참인가 ── */
  재본다('🔴 명부 1위 판이 이 일곱 중 한 명도 못 이긴다', 기.명부판이이긴수, 0);
  재본다('한 판이 다섯 이상을 이긴다', 기.많은판수 >= 5, true);
  재본다('예외가 딱 한 명이다', 예외.length, 1);
  재본다('예외의 차가 수로 있다', Number.isFinite(예외[0].margin), true);
  재본다('일곱 사람이 다 있다', 기.사람들.length, 7);
  재본다('⛔ 판 이름을 손으로 박지 않았다 — 자료에서 읽는다', 많은판이름, 'Spanish');
  재본다('많은판 이름이 화면에 그 이름으로 뜬다', 글자만(칸HTML(6.0)).includes(많은판이름), true);
  재본다('표가 큰 수부터 내려간다', (() => {
    const 수들 = [...칸HTML(9.0).matchAll(/class="ㄴ">([\d,]+)</g)].map((m) => Number(m[1].replace(/,/g, '')));
    return 수들.length === 7 && 수들.every((v, i) => i === 0 || 수들[i - 1] >= v);
  })(), true);

  /* ── 화면이 지켜야 할 말 ── */
  const 글 = 글자만(칸HTML(6.0));
  const 끝글 = 글자만(칸HTML(13.5));
  재본다('🔴 「나라가 아니다」를 화면에 적는다', /language editions, not countries/.test(글), true);
  재본다('🔴 「중국 본토에서 막혀 있다」를 적는다', /blocked in mainland China/.test(글), true);
  재본다('🔴 「왜인지 말하지 않는다」를 적는다', /never say why/.test(글), true);
  재본다('🔴 예외의 «차»를 끝 화면에 적는다', 끝글.includes(쉼표(예외[0].margin)), true);
  재본다('🔴 「차를 낸다」고 적는다', /print the margin, not just the winner/.test(끝글), true);
  재본다('⛔ 한국어를 안 쓴다', /[가-힣]/.test(글 + 끝글), false);
  재본다('⛔ 「popular」로 안 바꿔 쓴다', /popular/i.test(글 + 끝글), false);
  재본다('⛔ 「fans」로 단정하지 않는다', /\bfans\b/i.test(글 + 끝글), false);
  재본다('⛔ 「China watches」류로 안 쓴다', /China (watches|loves|reads Korean)/i.test(글 + 끝글), false);

  /* ── 수가 자료에서 오는가 ── */
  재본다('명부 사람수가 화면에 있다', 글.includes(쉼표(기.명부사람수)), true);
  재본다('명부 1위 수가 화면에 있다', 글.includes(쉼표(기.명부수)), true);
  재본다('일곱 사람 이름이 표에 다 있다', 기.사람들.every((r) => 글.includes(r.name)), true);
  재본다('예외 이름이 표에도 끝 화면에도 있다',
    글.includes(예외[0].name) && 끝글.includes(예외[0].name), true);

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

  console.log(`\n${실패 ? 'X' : 'OK'} editions 자가시험 — 통과 ${통과} · 실패 ${실패}`);
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
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/editions-${String(때).replace('.', '_')}.png`;
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
  const 칸방 = 'C:/Users/User/AppData/Local/Temp/claude/editions-frames';
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
