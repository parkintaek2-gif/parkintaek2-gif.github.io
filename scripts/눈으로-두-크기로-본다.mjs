#!/usr/bin/env node
/**
 * 눈으로-두-크기로-본다.mjs — 지면을 **폰과 데스크톱 두 크기로 띄워 찍고 재는** 자.
 *
 * ── 왜 만들었나 (2026-10-04 08:1x · 5번) ──────────────────────────────
 *   감수 도장 자(`check-감수도장.mjs`)가 「눈으로 잰 자취」를 요구한다 —
 *   **600px 이하 한 번 · 1000px 이상 한 번 · 어느 화면을 봤는지.** 2026-09-16 에 정해진 규칙이다.
 *   그런데 그 자취를 남기려면 띄우고, 창 크기를 바꾸고, 다시 보는 품이 든다.
 *   오늘 2번이 curl 200 으로 확인하고 떠나셨고, 배포가 36분 뒤에 막혔다.
 *   **품이 들면 안 하게 된다.** 품을 없애는 쪽으로 고친다.
 *
 *   ⛔ 이 자가 「통과」를 판정하지 않는다. 사람이 그림을 봐야 한다.
 *     가로 넘침·글자 겹침·칸이 비는 것은 수로 다 못 잡는다.
 *     이 자가 하는 일은 **그림을 내놓고, 수로 잡히는 것 몇 가지를 같이 재 주는 것**뿐이다.
 *
 * ── ⛔ 사장님 창을 건드리지 않는다 ───────────────────────────────────
 *   `b.close()` 를 부르면 **사장님이 보고 계신 창이 닫힌다.** `disconnect()` 만 쓴다.
 *   언제나 새 탭을 열고, 그 탭만 닫는다.
 *
 * 쓰는 법
 *   node scripts/눈으로-두-크기로-본다.mjs <주소> [찍을곳]
 *   node scripts/눈으로-두-크기로-본다.mjs --selftest
 *
 *   먼저 띄워 둔다 —  npx --yes http-server dist -p 4399 --silent &
 *   그다음      —  node scripts/눈으로-두-크기로-본다.mjs http://127.0.0.1:4399/index.html
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

/**
 * 감수 도장 자가 받아 주는 **자취 한 줄**을 지어 준다.
 * ⚠ 「/ 를」처럼 빗금 뒤에 공백이 오면 화면 이름으로 안 잡힌다 — 붙여 적는다.
 *   내 시험 문장이 바로 그래서 한 번 떨어졌다.
 */
export function 자취글(경로, 잰것들) {
  const 말 = 잰것들
    .map((x) => `${x.너비}px 에서 가로 넘침 ${x.가로넘침}px · 고리 ${x.고리수}개`)
    .join(' / ');
  return `${경로} 를 390px·1400px 로 띄워 봤다. ${말}.`;
}

/** 주소에서 «화면 경로»만 뽑는다 — 자취에는 호스트가 아니라 경로가 들어가야 한다 */
export function 경로뽑기(주소) {
  try {
    return new URL(주소).pathname || '/';
  } catch {
    return String(주소 ?? '');
  }
}

export const 볼크기 = [
  { 이름: '폰', 너비: 390, 높이: 844 },        /* 600px 이하 */
  { 이름: '데스크톱', 너비: 1400, 높이: 900 },  /* 1000px 이상 */
];

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참, 덧 = '') => 결과.push({ 이름, 참: !!참, 덧 });

  본다('경로를 뽑는다', 경로뽑기('http://127.0.0.1:4399/100y/all.html') === '/100y/all.html');
  본다('뿌리는 빗금이다', 경로뽑기('http://127.0.0.1:4399/') === '/');
  본다('⛔ 주소가 깨져도 안 죽는다', 경로뽑기('어쩌구') === '어쩌구');

  const 글 = 자취글('/index.html', [
    { 너비: 390, 가로넘침: 0, 고리수: 40 },
    { 너비: 1400, 가로넘침: 0, 고리수: 40 },
  ]);
  본다('자취에 화면 경로가 든다', /\/index\.html/.test(글));
  본다('자취에 폰 크기가 든다', /390px/.test(글));
  본다('자취에 데스크톱 크기가 든다', /1400px/.test(글));
  본다('⛔ 빗금 뒤에 공백을 안 둔다', !/\/\s/.test(글.split(' 를 ')[0]));

  본다('폰은 600px 이하다', 볼크기[0].너비 <= 600);
  본다('데스크톱은 1000px 이상다', 볼크기[1].너비 >= 1000);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 눈으로 두 크기로 본다 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}${r.덧 ? `  (${r.덧})` : ''}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const 주소 = process.argv[2];
  if (!주소) {
    console.log('⛔ 볼 주소가 없다.  node scripts/눈으로-두-크기로-본다.mjs <주소> [찍을곳]');
    process.exit(1);
  }
  const 찍을곳 = process.argv[3] || path.join(os.tmpdir(), '눈으로잰것');
  fs.mkdirSync(찍을곳, { recursive: true });

  const { default: puppeteer } = await import('puppeteer-core');
  let b;
  try {
    b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  } catch (e) {
    console.log('⛔ 크롬에 못 붙었다 — 9222 로 열린 크롬이 있어야 한다. 못 쟀다');
    console.log(`   ${e.message}`);
    process.exit(1);
  }

  const 잰것들 = [];
  try {
    for (const k of 볼크기) {
      const p = await b.newPage();                /* ⛔ 언제나 새 탭이다 */
      try {
        /* 🔴 [08:1x] 고친 지면을 다시 찍었는데 **고리 수도 키도 한 픽셀 안 달랐다.**
           브라우저가 캐시에서 꺼내 준 것이었다 — http-server 가 한 시간짜리 캐시 머리를
           붙인다. ⛔ 감수 자가 묵은 것을 보여 주면 **가짜 감수**다. 캐시를 끈다.
           ⚠ 「수가 안 바뀌면 자를 먼저 의심한다」를 오늘만 네 번째 밟았다. */
        await p.setCacheEnabled(false);
        await p.setViewport({ width: k.너비, height: k.높이 });
        await p.goto(주소, { waitUntil: 'networkidle0', timeout: 30000 });
        const 잰 = await p.evaluate(() => ({
          가로넘침: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          고리수: document.querySelectorAll('a[href]').length,
          제목: (document.querySelector('h1') || {}).textContent || null,
          키: document.documentElement.scrollHeight,
        }));
        const 찍은곳 = path.join(찍을곳, `${k.이름}.png`);
        await p.screenshot({ path: 찍은곳, fullPage: false });
        잰것들.push({ ...k, ...잰, 찍은곳 });
        const 빛 = 잰.가로넘침 > 0 ? '🔴' : '✅';
        console.log(`${빛} ${k.이름} ${k.너비}px — 가로 넘침 ${잰.가로넘침}px · 고리 ${잰.고리수}개 · 키 ${잰.키}px`);
        console.log(`   ${찍은곳}`);
      } finally {
        await p.close();                          /* 내가 연 탭만 닫는다 */
      }
    }
  } finally {
    b.disconnect();                               /* ⛔ close() 가 아니다 */
  }

  if (잰것들.length === 볼크기.length) {
    console.log('');
    console.log('⚠ 수가 초록이어도 «그림을 봐야» 감수입니다. 두 장을 열어 보십시오.');
    console.log('   — 글자가 겹치나 · 칸이 비나 · 눌러야 할 것이 안 보이나');
    console.log('');
    console.log('그림을 보신 뒤 도장 자취로 쓰실 줄:');
    console.log(`  ${자취글(경로뽑기(주소), 잰것들)}`);
  }
}
