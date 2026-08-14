#!/usr/bin/env node
/**
 * **폰으로 넘겨 본다** — 사장님 지시(2026-08-14).
 *
 * 🔴 사장님: 「자 대지 말고 **손님이 되십시오**」·「**폰으로 보십시오**. 사장님이 폰으로 찾으셨습니다」
 *   8/14 에 폰으로 리포트를 넘기시다 흠 아홉을 찾으셨다. 검사기 셋이 못 찾은 것이다.
 *
 * ⛔ 검사기 통과로 끝내지 않는다. **그림을 뽑아 사람이 본다.**
 * ⚠ 라이브를 찍는다. dist 가 아니다 — 손님이 보는 것은 라이브다.
 *
 * 쓰는 법
 *   node scripts/shoot-kcw-phone.mjs --out <폴더> [--지면 /malaysia,/fame-compare]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

/** 폰 — 사장님이 보시는 크기. ⛔ 데스크톱으로 찍으면 못 찾는다 */
export const 폰 = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

/**
 * 손님이 실제로 밟는 길. ⛔ 「모든 지면」이 아니다 —
 * 사장님이 넘기실 만한 차례로 놓는다. 첫 화면에서 시작해 기사로 들어간다.
 */
export const 손님길 = [
  '/', '/articles', '/about', '/data', '/for-industry', '/contact', '/subscribe',
  '/section/stars', '/section/titles', '/section/industry', '/section/tradition',
  '/fame-compare', '/malaysia', '/sea-athletes', '/one-title', '/esports',
  '/article/one-act-clears-the-footballer',
  '/article/malaysia-reads-the-label',
  '/article/the-manager-is-read-where-he-was-hired',
  '/corrections',
];

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('🔴 폰 너비다 — 데스크톱으로 찍으면 못 찾는다', 폰.width, (w) => w <= 430);
  재본다('폰으로 표시한다', 폰.isMobile, true);
  재본다('첫 화면이 첫 걸음이다', 손님길[0], '/');
  재본다('길에 기사가 들어 있다', 손님길.some((p) => p.startsWith('/article/')), true);
  재본다('길에 About·Contact 가 있다',
    ['/about', '/contact'].every((p) => 손님길.includes(p)), true);
  재본다('길이 안 겹친다', 손님길.length, new Set(손님길).size);
  console.log(`폰으로 찍는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 값 = (깃발, 기본) => {
    const i = process.argv.indexOf(깃발);
    return i >= 0 ? process.argv[i + 1] : 기본;
  };
  const 낼방 = 값('--out', 'archive/shot/phone');
  const 지면 = 값('--지면', null);
  const 길들 = 지면 ? 지면.split(',').map((s) => s.trim()) : 손님길;
  fs.mkdirSync(낼방, { recursive: true });

  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport(폰);

  const 낸것 = [];
  for (const 길 of 길들) {
    const 주소 = `https://www.kculturewire.com${길}`;
    const 이름 = (길 === '/' ? 'home' : 길.replace(/^\//, '').replace(/\//g, '-')) + '.png';
    const 낼길 = path.join(낼방, 이름);
    try {
      const r = await p.goto(주소, { waitUntil: 'networkidle2', timeout: 45000 });
      /* ⚠ 첫 화면만 찍지 않는다 — 사장님은 **넘겨 보신다** */
      await p.screenshot({ path: 낼길, fullPage: true });
      const 높이 = await p.evaluate(() => document.body.scrollHeight);
      낸것.push({ 길, code: r?.status() ?? 0, 높이, 낼길 });
      console.log(`   ${String(r?.status() ?? 0)} ${길.padEnd(46)} 높이 ${높이}px  ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
    } catch (e) {
      낸것.push({ 길, code: 0, 오류: e.message.slice(0, 80) });
      console.log(`   🔴 ${길.padEnd(50)} ${e.message.slice(0, 60)}`);
    }
  }
  await b.close();

  fs.writeFileSync(path.join(낼방, 'shots.json'), `${JSON.stringify({
    generated: new Date().toISOString(),
    viewport: 폰,
    note: 'Full-page phone screenshots of the live site. A checker cannot read these — a person must.',
    shots: 낸것,
  }, null, 2)}\n`);

  const 나쁨 = 낸것.filter((x) => x.code !== 200);
  console.log(`\n${나쁨.length ? '🔴' : '✅'} ${낸것.length}장 찍음 · 200 아닌 것 ${나쁨.length}`);
  console.log(`⛔ **이제 사람이 봐야 한다.** 그림은 ${낼방} 에 있다.`);
}
