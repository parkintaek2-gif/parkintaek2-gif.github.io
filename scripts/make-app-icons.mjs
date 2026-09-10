/**
 * make-app-icons.mjs — 홈화면 아이콘(apple-touch-icon)을 만든다 (5번 · 2026-09-10)
 *
 * 🔴 왜 만들었나 — 사장님 폰 화면을 보고 알았다
 *   사장님 지시(2026-09-10 20:34, 스크린샷과 함께):
 *     「원드라이브. **케이라이프맵처럼 이미지가 뜨게** 좀 하라고 지시해라」
 *
 *   사장님 폰 「KLifeDesign」 폴더를 눈으로 보니 —
 *     KLifeMap  ✅ 금빛 K 아이콘이 뜬다        (apple-touch-icon → /favicon-180.png · 19,823바이트)
 *     백년지도   ⚠ 아이콘이 아니라 화면 조각이 떴다 (icon 선언이 아예 없다)
 *     KCW       🔴 회색 「K」 기본 아이콘       (선언은 있는데 파일이 **32x32** 였다 · 780바이트)
 *     SeoulMkts 🔴 회색 「K」 기본 아이콘       (apple-touch-icon 선언이 없다)
 *
 *   ⭐ 배운 것: iOS 는 apple-touch-icon 이 «너무 작으면 무시하고» 글자 아이콘을 만든다.
 *      그래서 「선언했으니 됐다」가 통하지 않는다. **크기를 재야 안다.**
 *      ⛔ 파비콘(16~32px)과 홈화면 아이콘(180px)은 다른 것이다. 같은 파일로 겸할 수 없다.
 *
 * 무엇을 하나
 *   각 사이트의 favicon.svg 를 «180x180 과 512x512 불투명 PNG» 로 굽는다.
 *   ⚠ 투명 배경을 두지 않는다 — iOS 가 검정으로 합성해 우리 빛깔이 죽는다.
 *   ⚠ 우리 쪽에서 둥근 모서리를 그리지 않는다 — iOS 가 자기 마스크로 깎는다. 두 번 깎이면 흉하다.
 *
 * 쓰는 법
 *   node scripts/make-app-icons.mjs --자가시험
 *   node scripts/make-app-icons.mjs --굽는다
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');

export const 크기들 = [180, 512];
export const 안쪽여백비율 = 0.12;   /* iOS 마스크가 가장자리를 깎으므로 마크를 조금 들여 놓는다 */

/* 🔴 [2026-09-10] 아이콘은 «눈»과 «화소» 둘 다로 재야 했다. 두 방향으로 다 틀렸다 —
   ① 0.82 로 굽고 사진을 열어 보니 「백」의 아래가 잘려 보였다. 눈이 잡은 것이다.
   ② 그래서 0.58 로 내렸는데 «또» 잘려 보였다. 이번엔 화소로 잉크 상자를 쟀다 —
      위 56 · 아래 50 · 왼 58 · 오른 58 로 **가장자리에 닿지도 않았다.** 내 눈이 틀렸다.
      「ㄱ」의 평평하고 긴 아래 획을 «잘린 자리»로 본 것이다.
   ⭐ 그래서 규율이 한 줄 늘었다 — 눈으로 애매하면 «화소로 잰다». 눈이 가리키고 수가 판정한다.
   ⇒ 잘림은 없으니 0.72 로 키운다(마크가 타일의 절반은 차지해야 폰에서 읽힌다).
      키운 뒤 반드시 잉크 상자를 다시 잰다 — scratchpad/아이콘-잉크재기.mjs */
export const 글자크기비율 = 0.72;

/**
 * 사이트마다 «어느 폴더»에 넣나 — server.mjs 가 호스트를 보고 경로 접두를 갈아 끼운다.
 * 그래서 파일을 그 접두 폴더에 두면 손님에게는 뿌리(/apple-touch-icon.png)로 보인다.
 */
export const 사이트들 = [
  {
    키: 'seoulmarkets',
    이름: 'SeoulMarkets',
    낼방: 'public',
    바탕: '#0f4c81',
    원본: 'public/favicon.svg',
    레이아웃: 'src/layouts/Base.astro',
  },
  {
    키: 'kculturewire',
    이름: 'K Culture Wire',
    낼방: 'public/wikitip',
    바탕: '#140f16',
    원본: 'public/wikitip/favicon.svg',
    레이아웃: 'src/layouts/WikiTip.astro',
  },
  {
    키: '100yearmap',
    이름: '백년지도',
    낼방: 'public/100y',
    바탕: '#6b5a1e',
    원본: null,                    /* 파비콘이 아예 없었다 — 아래 글자마크로 굽는다 */
    글자: '백',
    글자빛: '#f7f2e0',
    레이아웃: 'src/layouts/HundredYear.astro',
  },
];

/** 굽는 한 장의 HTML — 바탕을 «칠해» 둔다(투명을 남기지 않는다) */
export function 굽는판(사이트, 크기, svg본문) {
  const 여백 = Math.round(크기 * 안쪽여백비율);
  const 속 = 크기 - 여백 * 2;
  const 안 = svg본문
    ? `<div class="mark">${svg본문}</div>`
    : `<div class="glyph">${사이트.글자 ?? '?'}</div>`;
  return `<style>
  html,body{margin:0;padding:0;width:${크기}px;height:${크기}px;overflow:hidden}
  body{background:${사이트.바탕};display:flex;align-items:center;justify-content:center}
  .mark{width:${속}px;height:${속}px}
  .mark svg{width:100%;height:100%;display:block}
  .glyph{font-family:'Malgun Gothic','맑은 고딕',sans-serif;font-weight:800;
    font-size:${Math.round(속 * 글자크기비율)}px;line-height:1.25;color:${사이트.글자빛 ?? '#fff'};
    letter-spacing:-0.02em}
</style>${안}`;
}

/** 파일 이름 — 180 은 apple-touch-icon, 그 밖은 icon-<크기> */
export function 이름내기(크기) {
  return 크기 === 180 ? 'apple-touch-icon.png' : `icon-${크기}.png`;
}

/** PNG 의 실제 폭·높이를 «읽는다». PNG 가 아니면 null (짐작하지 않는다) */
export function png크기(바이트들) {
  const b = 바이트들;
  if (!b || b.length < 24) return null;
  if (b.slice(1, 4).toString('latin1') !== 'PNG') return null;
  return { 폭: b.readUInt32BE(16), 높이: b.readUInt32BE(20) };
}

/**
 * iOS 가 이 아이콘을 쓸까 — 크기로 판정한다.
 * ⛔ 「선언이 있다」로 판정하지 않는다. KCW 가 선언은 있는데 32px 이라 회색 K 가 떴다.
 */
export const 가장작은쓸크기 = 120;
export function iOS가쓸까(크기) {
  if (!크기 || typeof 크기.폭 !== 'number') return null;          /* 못 쟀다 */
  if (크기.폭 !== 크기.높이) return { 쓸까: false, 왜: '정사각형이 아니다' };
  if (크기.폭 < 가장작은쓸크기) return { 쓸까: false, 왜: `${크기.폭}px 은 너무 작다 (${가장작은쓸크기}px 미만이면 iOS 가 글자 아이콘을 만든다)` };
  return { 쓸까: true, 왜: `${크기.폭}x${크기.높이}` };
}

/** 웹 매니페스트 — 안드로이드 쪽이 이것을 본다 */
export function 매니페스트(사이트) {
  return JSON.stringify({
    name: 사이트.이름,
    short_name: 사이트.이름,
    display: 'standalone',
    background_color: 사이트.바탕,
    theme_color: 사이트.바탕,
    icons: 크기들.map((n) => ({ src: `/${이름내기(n)}`, sizes: `${n}x${n}`, type: 'image/png' })),
  }, null, 1);
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통과 = 0; const 막힘 = [];
  const 본다 = (이름, 참) => { if (참) 통과++; else 막힘.push(이름); };

  본다('180 은 apple-touch-icon 이다', 이름내기(180) === 'apple-touch-icon.png');
  본다('512 는 icon-512 다', 이름내기(512) === 'icon-512.png');

  /* PNG 크기 읽기 — 32x32 짜리 머리를 손으로 짜서 잰다 */
  const 머리 = Buffer.alloc(24);
  머리.write('\x89PNG', 0, 'latin1');
  머리.writeUInt32BE(32, 16); 머리.writeUInt32BE(32, 20);
  본다('PNG 크기를 읽는다', png크기(머리).폭 === 32);
  본다('PNG 가 아니면 null', png크기(Buffer.from('아무것도아니다')) === null);
  본다('짧으면 null', png크기(Buffer.alloc(4)) === null);
  본다('없으면 null', png크기(null) === null);

  본다('🔴 32px 은 iOS 가 안 쓴다', iOS가쓸까({ 폭: 32, 높이: 32 }).쓸까 === false);
  본다('그 까닭을 적는다', iOS가쓸까({ 폭: 32, 높이: 32 }).왜.includes('너무 작다'));
  본다('180px 은 쓴다', iOS가쓸까({ 폭: 180, 높이: 180 }).쓸까 === true);
  본다('120px 도 쓴다 (문턱이다)', iOS가쓸까({ 폭: 120, 높이: 120 }).쓸까 === true);
  본다('119px 은 안 쓴다', iOS가쓸까({ 폭: 119, 높이: 119 }).쓸까 === false);
  본다('정사각형이 아니면 안 쓴다', iOS가쓸까({ 폭: 180, 높이: 100 }).쓸까 === false);
  본다('⬜ 못 쟀으면 null — 통과로 세지 않는다', iOS가쓸까(null) === null);

  const 판 = 굽는판(사이트들[0], 180, '<svg></svg>');
  본다('바탕을 칠한다 (투명을 남기지 않는다)', 판.includes('#0f4c81'));
  본다('판 크기가 맞다', 판.includes('width:180px'));
  본다('여백을 둔다', 판.includes(`width:${180 - Math.round(180 * 안쪽여백비율) * 2}px`));
  const 글자판 = 굽는판(사이트들[2], 180, null);
  본다('원본이 없으면 글자로 굽는다', 글자판.includes('>백<'));
  본다('글자 빛깔을 쓴다', 글자판.includes('#f7f2e0'));
  /* 🔴 [2026-09-10] 0.82 로 굽자 「백」 아래 획이 잘렸다 — 눈으로 보고 잡았다. 그 문턱을 시험으로 못 박는다 */
  본다('글자 크기가 읽히는 범위에 있다 (0.6~0.8)', 글자크기비율 >= 0.6 && 글자크기비율 <= 0.8);
  본다('줄높이가 1보다 크다 (한글은 위아래 여유가 붙는다)', 글자판.includes('line-height:1.25'));

  const m = JSON.parse(매니페스트(사이트들[1]));
  본다('매니페스트에 이름이 있다', m.name === 'K Culture Wire');
  본다('매니페스트가 두 크기를 담는다', m.icons.length === 2);
  본다('매니페스트가 뿌리 경로로 가리킨다', m.icons[0].src === '/apple-touch-icon.png');

  본다('사이트가 셋이다', 사이트들.length === 3);
  본다('KLifeMap 은 여기 없다 (이미 뜬다)', !사이트들.some((s) => s.키 === 'klifemap'));
  본다('낼 방이 다 다르다', new Set(사이트들.map((s) => s.낼방)).size === 3);

  console.log('자가시험 — make-app-icons.mjs\n');
  막힘.forEach((m2) => console.log('  MAK ' + m2));
  console.log(`\n통과 ${통과} · 막힘 ${막힘.length}`);
  return 막힘.length === 0;
}

/* ── 굽는다 ───────────────────────────────────────────────── */
async function 굽는다() {
  const require_ = createRequire('file:///C:/Users/USER/Documents/GitHub/klifemap/package.json');
  const puppeteer = require_('puppeteer-core');
  const 크롬 = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
  if (!크롬) { console.error('⛔ 크롬을 못 찾았다 — 못 구웠다'); return false; }

  const b = await puppeteer.launch({ executablePath: 크롬, headless: 'new', args: ['--no-sandbox'] });
  let 구운것 = 0, 못한것 = 0;
  try {
    const page = await b.newPage();
    for (const 사이트 of 사이트들) {
      let svg본문 = null;
      if (사이트.원본) {
        try { svg본문 = fs.readFileSync(path.join(뿌리, 사이트.원본), 'utf8'); }
        catch (e) { svg본문 = null; }
      }
      if (사이트.원본 && !svg본문) { console.log(`  ⬜ ${사이트.이름} — 원본 ${사이트.원본} 을 못 읽었다`); 못한것++; continue; }

      for (const 크기 of 크기들) {
        const 낼것 = path.join(뿌리, 사이트.낼방, 이름내기(크기));
        try {
          await page.setViewport({ width: 크기, height: 크기, deviceScaleFactor: 1 });
          await page.setContent(굽는판(사이트, 크기, svg본문), { waitUntil: 'load' });
          await page.screenshot({ path: 낼것, omitBackground: false });
          const 잰것 = png크기(fs.readFileSync(낼것));
          const 판정 = iOS가쓸까(잰것);
          console.log(`  ${판정 && 판정.쓸까 ? '✅' : '🔴'} ${사이트.이름} ${이름내기(크기)} — ${판정 ? 판정.왜 : '못 쟀다'} · ${fs.statSync(낼것).size}바이트`);
          if (!판정 || !판정.쓸까) 못한것++; else 구운것++;
        } catch (e) { console.log(`  🔴 ${사이트.이름} ${크기} — ${e.message}`); 못한것++; }
      }
      const 매니 = path.join(뿌리, 사이트.낼방, 'manifest.webmanifest');
      fs.writeFileSync(매니, 매니페스트(사이트), 'utf8');
    }
    await page.close();
  } finally { await b.close().catch(() => {}); }

  console.log(`\n구운 것 ${구운것} · 🔴 못한 것 ${못한것}`);
  return 못한것 === 0;
}

const 나 = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(나)) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  const 됐나 = 자가시험();
  console.log('');
  if (!process.argv.includes('--굽는다')) {
    console.log('(--굽는다 를 주면 실제로 굽는다)');
    process.exit(됐나 ? 0 : 1);
  }
  굽는다().then((ok) => process.exit(됐나 && ok ? 0 : 1))
    .catch((e) => { console.error('⛔ ' + e.message); process.exit(1); });
}
