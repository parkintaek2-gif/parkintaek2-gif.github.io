#!/usr/bin/env node
/**
 * check-analytics-fires.mjs — **GA 가 라이브에서 실제로 쏘는가**를 잰다.
 *
 * 🔴 왜 — 2026-08-08 22:2x. 네 사이트에 태그가 **붙어 있는데 하루 종일 안 쏘고 있었다.**
 *   구글이 「사이트에서 Google 태그를 못 찾았다」는 메일을 보내와서야 알았다.
 *   ⛔ 까닭은 `define:vars` 에 한글 이름을 넘긴 것이었다 — 번들러가 이름을 뭉개
 *   `const  = [...]` 가 되었고, 그 문법 오류가 `function gtag()` 정의까지 죽였다.
 *
 * ⛔ 그러니 **HTML 에 태그가 있나**로 재지 않는다. 그건 그날도 ✅ 였다.
 *   ⭐ **크롬으로 띄워 `google-analytics.com/g/collect` 로 나가는 요청**을 센다.
 *
 * ⚠ 크롬과 인터넷이 있어야 돈다 → npm test 에 안 물린다.
 *   `봐준다` 에 까닭과 함께 들어 있다.  쓰는 법:  npm run check:ga
 */
import { createRequire } from 'node:module';

const 크롬 = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

/** 재는 곳 — ⛔ www 붙은 것도 같이 본다. 한쪽만 죽는 일이 있다 */
export const 잴곳 = [
  'https://100yearmap.com/',
  'https://www.100yearmap.com/',
  'https://seoulmarkets.com/',
  'https://www.kculturewire.com/',
  'https://klifemap.ai/',
];

/** 쏜 것으로 세는 주소인가 */
export const 쏜것인가 = (url) =>
  /(google-analytics|analytics\.google)\.com\/g\/collect/.test(String(url ?? ''));

/** 응답에서 측정 ID 를 뽑는다. 없으면 null */
export const 측정ID뽑기 = (url) => {
  try { return new URL(url).searchParams.get('tid'); } catch { return null; }
};

/* ── 검사 ── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('collect 는 쏜 것이다', 쏜것인가('https://www.google-analytics.com/g/collect?v=2&tid=G-X'), true);
  재본다('analytics.google 도 센다', 쏜것인가('https://analytics.google.com/g/collect?tid=G-X'), true);
  재본다('gtag/js 는 쏜 것이 아니다', 쏜것인가('https://www.googletagmanager.com/gtag/js?id=G-X'), false);
  재본다('빈 값에 안 죽는다', 쏜것인가(null), false);
  재본다('tid 를 뽑는다', 측정ID뽑기('https://www.google-analytics.com/g/collect?v=2&tid=G-B06MWDY5K8'), 'G-B06MWDY5K8');
  재본다('tid 가 없으면 null', 측정ID뽑기('https://www.google-analytics.com/g/collect?v=2'), null);
  재본다('주소가 아니면 null', 측정ID뽑기('그냥 글'), null);
  재본다('잴 곳에 www 도 있다', 잴곳.some((u) => u.includes('www.100yearmap.com')), true);
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
const require = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');

const b = await puppeteer.launch({ executablePath: 크롬, args: ['--no-sandbox'] });
let 죽은곳 = 0;

for (const u of 잴곳) {
  const p = await b.newPage();
  const 쏨 = [];
  const 오류 = [];
  p.on('request', (r) => { if (쏜것인가(r.url())) 쏨.push(측정ID뽑기(r.url())); });
  p.on('pageerror', (e) => 오류.push(String(e.message).slice(0, 80)));
  try {
    await p.goto(u, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3000));   // 늦게 쏘는 것까지 기다린다
  } catch (e) { 오류.push('못 열었다: ' + String(e.message).slice(0, 60)); }

  const 이름 = u.replace('https://', '').padEnd(26);
  if (쏨.length) {
    console.log(`  ✅ ${이름} 쏨 ${쏨.length}회 · tid ${[...new Set(쏨)].join(',')}`);
  } else {
    죽은곳 += 1;
    console.error(`  ⛔ ${이름} **안 쏨**${오류.length ? ' — ' + 오류[0] : ''}`);
  }
  await p.close();
}
await b.close();

if (죽은곳) {
  console.error(`\n⛔ ${죽은곳}곳이 안 쏜다. 태그가 붙어 있어도 안 쏘면 **재는 것이 0** 이다.`);
  console.error('   지면을 크롬으로 열어 콘솔 오류부터 보라 — 2026-08-08 에는 문법 오류 하나가 gtag 를 죽였다.');
  process.exit(1);
}
console.log(`\n✅ ${잴곳.length}곳 모두 쏜다.`);
