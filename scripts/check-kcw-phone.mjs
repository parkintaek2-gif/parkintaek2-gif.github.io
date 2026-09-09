#!/usr/bin/env node
/**
 * check-kcw-phone.mjs — **폰 너비(390px)에서 K Culture Wire 지면이 화면을 미나.**
 *
 *   node scripts/check-kcw-phone.mjs            빌드 산출물(dist)을 잰다
 *   node scripts/check-kcw-phone.mjs --라이브    나가 있는 지면을 잰다
 *   node scripts/check-kcw-phone.mjs --자가시험   자가 시험만
 *   node scripts/check-kcw-phone.mjs --전부      지면을 더 많이 잰다
 *
 * ## 🔴 왜 만들었나 (2026-09-09)
 *
 * 백년지도에는 `check-100y-phone.mjs` 가 있는데 **KCW 에는 없었다.** 그래서 오늘 결함이
 * 아무 검사에도 안 걸린 채 배포까지 나갔다. 실측 —
 *
 * ```
 * /read-in · 390px    화면폭 390 · scrollWidth 512   ⇒ 122px 밀렸다
 * 표 아홉 개가 모두 <div class="scroll-x"> 안에 있었는데 그 부모의 overflow-x 가 «visible» 이었다
 * ```
 *
 * 까닭은 아스트로 스타일 «범위»였다. 레이아웃(`WikiTip.astro`)의
 * `.scroll-x { overflow-x: auto }` 가 `.scroll-x[data-astro-cid-…]` 로 나가는데,
 * `.scroll-x` 를 다는 요소는 «지면» 쪽이라 그 속성이 없다. **한 번도 걸린 적이 없는 규칙**이었다.
 *
 * ⚠ 여덟 표가 350px 안쪽이라 390px 화면에 우연히 들어갔고, 그래서 오래 안 드러났다.
 *   일곱 칸짜리 표(492px)를 낸 오늘 처음 밀렸다.
 *
 * ## ⛔ 이 자가 지키는 것
 *
 * ⛔ **「표를 감쌌나」로 묻지 않는다.** 감싸 놓고도 안 스크롤되는 것이 바로 오늘의 결함이다.
 *   그래서 **부모의 «계산된» overflow-x** 를 잰다. 클래스가 붙었는지가 아니다.
 * ⛔ **표가 부모보다 넓은 것 자체는 흠이 아니다.** 부모가 스크롤되면 손님이 밀어서 본다.
 *   흠은 ① 지면이 밀리는 것 ② 넓은데 부모가 안 스크롤되는 것 둘이다.
 * ⛔ **못 쟀으면 「없다」가 아니라 「못 쟀다」로 적는다.** 크롬이 없으면 게이트를 세우지 않는다.
 * ⚠ 빌드와 라이브는 다른 값이다 — 어느 쪽을 쟀는지 첫 줄에 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 크롬 = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

/** 폰 너비 — 아이폰 14/15 의 CSS 폭이다 */
export const 폰폭 = 390;
/** 이만큼까지는 반올림·테두리로 생길 수 있어 봐 준다 */
export const 참는넘침 = 2;

/**
 * 잰 것에서 «울 것»을 고른다. 브라우저 없이도 시험할 수 있게 따로 뺐다.
 *
 * ⛔ 표가 넓다는 것만으로 울지 않는다 — 부모가 스크롤되면 손님이 볼 수 있다.
 */
export function 울것(잰것) {
  const 운다 = [];
  if (!잰것) return 운다;
  if (Number(잰것.가로넘침) > 참는넘침) {
    운다.push(`${잰것.주소} — 지면이 가로로 ${잰것.가로넘침}px 밀린다`);
  }
  for (const t of (잰것.표들 ?? [])) {
    const 넓다 = Number(t.너비) > Number(t.감싼) + 참는넘침;
    if (넓다 && t.부모넘김 !== 'auto' && t.부모넘김 !== 'scroll') {
      운다.push(`${잰것.주소} — 표(${t.열}칸 ${t.줄}줄)가 ${t.너비}px 인데 감싼 칸은 ${t.감싼}px 이고`
        + ` 그 칸의 overflow-x 가 «${t.부모넘김}» 다. 감싸 놓고 안 스크롤된다`);
    }
  }
  return 운다;
}

/** 잴 지면 — 표가 넓을 만한 것부터. ⚠ 여기 없는 지면은 «안 잰» 것이다 */
export const 볼지면 = [
  '/read-in', '/group-mix', '/service-years', '/kpop-birthdays',
  '/actors', '/attention-share', '/esports-nations', '/firms',
];
export const 볼지면넓게 = [
  ...볼지면, '/by-country', '/generations', '/exports', '/titles',
  '/read-in', '/day-pillar', '/debut-age', '/group-afterlife',
];

async function 재기(주소들, { 라이브 }) {
  const require = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');
  let puppeteer;
  try { puppeteer = require('puppeteer-core'); } catch { return { 못쟀다: 'puppeteer-core 가 없다' }; }
  if (!fs.existsSync(크롬)) return { 못쟀다: '크롬을 못 찾았다' };
  const b = await puppeteer.launch({ executablePath: 크롬, args: ['--no-sandbox'] });
  const 잰것들 = [];
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 폰폭, height: 844, deviceScaleFactor: 1 });
    for (const 주소 of 주소들) {
      let 열림 = null;
      if (라이브) {
        열림 = `https://www.kculturewire.com${주소}`;
      } else {
        const 후보 = [
          path.join(뿌리, 'dist/wikitip', `${주소.replace(/^\//, '')}.html`),
          path.join(뿌리, 'dist/wikitip', 주소.replace(/^\//, ''), 'index.html'),
        ].find((x) => fs.existsSync(x));
        if (!후보) { 잰것들.push({ 주소, 못쟀다: '빌드 산출물에 없다' }); continue; }
        열림 = `file:///${후보.replace(/\\/g, '/')}`;
      }
      try {
        await p.goto(열림, { waitUntil: 라이브 ? 'networkidle2' : 'load', timeout: 90000 });
      } catch (e) {
        잰것들.push({ 주소, 못쟀다: `열지 못했다 — ${String(e.message).slice(0, 60)}` });
        continue;
      }
      /* eslint-disable no-undef */
      const 값 = await p.evaluate(() => {
        const 폭 = document.documentElement.clientWidth;
        const 표들 = [...document.querySelectorAll('table')].map((t) => {
          const r = t.getBoundingClientRect();
          const 부모 = t.parentElement;
          const pr = 부모 ? 부모.getBoundingClientRect() : r;
          return {
            열: t.querySelectorAll('thead th').length,
            줄: t.querySelectorAll('tbody tr').length,
            너비: Math.round(r.width),
            감싼: Math.round(pr.width),
            부모반: 부모 ? String(부모.className || '') : '',
            부모넘김: 부모 ? getComputedStyle(부모).overflowX : 'none',
          };
        });
        /* 🔴 [2026-09-09 · 5번] 스타일이 «실제로 붙었나»를 함께 낸다.
         *   file:// 로 dist 를 열면 `/_astro/*.css` 같은 «절대경로» 스타일시트가
         *   조용히 안 붙는다. 그런데도 수는 멀쩡하게 나온다 — flex 가 안 걸려
         *   항해줄이 안 감기니 「74px 밀린다」는 «가짜 결함»이 나왔다.
         *   실측(09-09): dist/data/*.html 을 file:// 로 열면 .nav 가 display:block,
         *   같은 지면을 라이브로 열면 display:flex 이고 밀림은 0 이다. */
        const 못붙은시트 = [...document.querySelectorAll('link[rel~="stylesheet"]')]
          .filter((l) => !l.sheet).map((l) => l.getAttribute('href')).slice(0, 3);
        return {
          폭, 가로넘침: Math.max(0, document.documentElement.scrollWidth - 폭), 표들,
          못붙은시트, 시트수: document.styleSheets.length,
        };
      });
      /* eslint-enable no-undef */
      // ⛔ 스타일이 안 붙었으면 그 수는 «못 쟀다»다. 0 으로도, 결함으로도 옮기지 않는다.
      const 스타일흠 = 스타일못붙음(값);
      if (스타일흠) { 잰것들.push({ 주소, 못쟀다: 스타일흠 }); continue; }
      잰것들.push({ 주소, ...값 });
    }
  } finally {
    await b.close();
  }
  return { 잰것들 };
}

/** 스타일이 «실제로 붙었나» — 안 붙었으면 못 쟀다고 말할 까닭을 낸다. 붙었으면 null.
 *
 * 🔴 [2026-09-09 · 5번] 이것이 없어서 «가짜 결함»을 하나 만들었다.
 *   `dist/data/mezzanine.html` 을 file:// 로 열어 재니 「밀림 74px」이 나왔고, 나는
 *   서울마켓츠 전 지면이 폰에서 밀린다고 판정했다. 라이브로 재니 **밀림 0** 이었다.
 *   까닭: file:// 에서는 `/_astro/*.css` 같은 «절대경로» 스타일시트가 안 붙는다.
 *   그러면 .nav 가 display:block 이 되어 flex 감김이 사라지고, 붙어 있던 링크들이
 *   한 줄로 삐져나간다. 수는 멀쩡히 나오지만 그 수는 «우리 지면의 수가 아니다».
 *   ⛔ 「못 쟀는데 수가 나오는 것」이 제일 나쁘다 — 없는 결함을 쫓게 만든다.
 */
export function 스타일못붙음(값) {
  if (!값) return null;
  const 못붙은 = 값.못붙은시트 ?? [];
  if (못붙은.length) {
    return `스타일시트가 안 붙었다(${못붙은.join(' · ')}) — file:// 로는 절대경로 CSS 가 안 온다. --라이브 로 재십시오`;
  }
  if (값.시트수 === 0) return '스타일시트가 한 장도 없다 — 이 수는 우리 지면의 수가 아니다. --라이브 로 재십시오';
  return null;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 목 = [
    ['멀쩡한 지면은 조용하다', () => 울것({
      주소: '/a', 가로넘침: 0, 표들: [{ 열: 3, 줄: 5, 너비: 350, 감싼: 350, 부모넘김: 'auto' }],
    }).length === 0],
    ['🔴 지면이 밀리면 운다', () => 울것({ 주소: '/a', 가로넘침: 122, 표들: [] }).length === 1],
    ['1~2px 은 봐 준다', () => 울것({ 주소: '/a', 가로넘침: 2, 표들: [] }).length === 0],
    ['🔴 감싸 놓고 안 스크롤되면 운다 (오늘의 결함)', () => 울것({
      주소: '/read-in', 가로넘침: 0,
      표들: [{ 열: 7, 줄: 478, 너비: 492, 감싼: 350, 부모넘김: 'visible' }],
    }).length === 1],
    ['⛔ 넓어도 부모가 스크롤되면 안 운다', () => 울것({
      주소: '/a', 가로넘침: 0,
      표들: [{ 열: 7, 줄: 478, 너비: 492, 감싼: 350, 부모넘김: 'auto' }],
    }).length === 0],
    ['scroll 도 스크롤로 본다', () => 울것({
      주소: '/a', 가로넘침: 0,
      표들: [{ 열: 7, 줄: 9, 너비: 492, 감싼: 350, 부모넘김: 'scroll' }],
    }).length === 0],
    ['hidden 은 스크롤이 아니다 — 칸이 잘려 안 보인다', () => 울것({
      주소: '/a', 가로넘침: 0,
      표들: [{ 열: 7, 줄: 9, 너비: 492, 감싼: 350, 부모넘김: 'hidden' }],
    }).length === 1],
    ['표가 여럿이면 여럿 운다', () => 울것({
      주소: '/a', 가로넘침: 0,
      표들: [
        { 열: 7, 줄: 9, 너비: 492, 감싼: 350, 부모넘김: 'visible' },
        { 열: 5, 줄: 9, 너비: 460, 감싼: 350, 부모넘김: 'visible' },
      ],
    }).length === 2],
    ['⛔ 빈 것도 견딘다', () => 울것(null).length === 0 && 울것({ 주소: '/a' }).length === 0],
    ['폰 폭을 390 으로 잰다', () => 폰폭 === 390],
    ['볼 지면에 오늘 낸 셋이 들어 있다', () => ['/read-in', '/group-mix', '/service-years'].every((x) => 볼지면.includes(x))],
    ['넓게 보기가 기본보다 많다', () => 볼지면넓게.length > 볼지면.length],
    /* 🔴 스타일이 안 붙은 채로 낸 수를 결함으로 옮기지 않는다 (09-09 가짜 결함 74px) */
    ['🔴 스타일시트가 안 붙으면 못 쟀다고 한다', () => /안 붙었다/.test(
      스타일못붙음({ 못붙은시트: ['/_astro/x.css'], 시트수: 0 }) ?? '')],
    ['🔴 시트가 한 장도 없으면 못 쟀다고 한다', () => /한 장도 없다/.test(
      스타일못붙음({ 못붙은시트: [], 시트수: 0 }) ?? '')],
    ['스타일이 붙었으면 조용하다', () => 스타일못붙음({ 못붙은시트: [], 시트수: 3 }) === null],
    ['⛔ 빈 것도 견딘다 (스타일 검사)', () => 스타일못붙음(null) === null && 스타일못붙음({}) === null],
    ['까닭에 «--라이브» 로 재라는 길을 적는다', () => /--라이브/.test(
      스타일못붙음({ 못붙은시트: ['/_astro/x.css'], 시트수: 0 }) ?? '')],
  ];
  let 통 = 0; const 실 = [];
  for (const [이름, 재본다] of 목) {
    let ok = false;
    try { ok = !!재본다(); } catch { ok = false; }
    if (ok) 통 += 1; else 실.push(이름);
  }
  console.log(`폰 너비 검사 — 자가시험 ${통}/${목.length}`);
  if (실.length) { 실.forEach((x) => console.log(`   X ${x}`)); }
  return 실.length;
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나) {
  const 흠 = 자가시험();
  if (process.argv.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

  const 라이브 = process.argv.includes('--라이브');
  const 주소들 = process.argv.includes('--전부') ? [...new Set(볼지면넓게)] : 볼지면;
  console.log(`\n■ 폰 너비 ${폰폭}px — ${라이브 ? '**라이브**' : '빌드 산출물(dist)'} 을 잰다 · 지면 ${주소들.length}장\n`);

  const r = await 재기(주소들, { 라이브 });
  if (r.못쟀다) {
    console.log(`⬜ 못 쟀다 — ${r.못쟀다}`);
    console.log('⛔ 「못 쟀다」로 게이트를 세우지 않는다. 통과로 둔다.');
    process.exit(0);
  }

  const 운다 = [];
  let 잰장수 = 0; const 못잰것 = [];
  for (const 잰것 of r.잰것들) {
    if (잰것.못쟀다) { 못잰것.push(`${잰것.주소} — ${잰것.못쟀다}`); continue; }
    잰장수 += 1;
    const 이것 = 울것(잰것);
    const 표수 = (잰것.표들 ?? []).length;
    const 넓은표 = (잰것.표들 ?? []).filter((t) => t.너비 > t.감싼 + 참는넘침).length;
    console.log(`  ${이것.length ? '🔴' : '✅'} ${잰것.주소.padEnd(20)} 밀림 ${String(잰것.가로넘침).padStart(3)}px`
      + ` · 표 ${표수}개(넓은 것 ${넓은표})`);
    운다.push(...이것);
  }

  for (const m of 못잰것) console.log(`  ⬜ ${m}`);

  if (운다.length) {
    console.log(`\n⛔ 폰에서 밀리는 것 ${운다.length}건`);
    운다.forEach((x) => console.log(`   · ${x}`));
    console.log('\n🔴 손님은 폰으로 온다. 가로로 밀리면 그 표는 «안 읽힌 것»이다.');
    console.log('   ⚠ 감싼 칸의 overflow-x 를 보십시오 — 아스트로 스타일 «범위»에 걸려');
    console.log('     레이아웃의 .scroll-x 가 지면 요소에 안 붙은 적이 있습니다(2026-09-09).');
    process.exit(1);
  }
  console.log(`\n✅ 폰 ${폰폭}px 에서 밀리는 지면 없다 — 잰 것 ${잰장수}장${못잰것.length ? ` · 못 잰 것 ${못잰것.length}장` : ''}`);
}
