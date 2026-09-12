#!/usr/bin/env node
/**
 * make-nasdaq-deck-pdf.mjs — docs/nasdaq-deck/deck.html 을 슬라이드 PDF 로 굽는다.
 *
 * make-report-pdf.mjs·build-daily-report.mjs 와 같은 길(puppeteer-core, klifemap 것 빌려 쓴다,
 * 헤드리스 크롬을 «새로» 띄운다 — 9222 확장 프로그램 미연결 문제를 아예 안 겪는다).
 * 다만 그 둘은 A4 문서·6장 고정 보고서 꼴이라 이 파일이 쓰는 «1280x720 슬라이드» 형식과
 * 안 맞아 따로 만든다.
 *
 * 쓰는 법
 *   node scripts/make-nasdaq-deck-pdf.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
const puppeteer = require('puppeteer-core');

const 뿌리 = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const 입력 = path.join(뿌리, 'docs/nasdaq-deck/deck.html');
const 출력 = path.join(뿌리, 'docs/nasdaq-deck/SeoulMarkets-Korea-Market-Data.pdf');

const html = fs.readFileSync(입력, 'utf8');

const 브라우저 = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new', args: ['--no-sandbox'],
});
const 장 = await 브라우저.newPage();
await 장.setViewport({ width: 1280, height: 720 });
await 장.setContent(html, { waitUntil: 'load' });
await 장.pdf({
  path: 출력,
  width: '1280px',
  height: '720px',
  printBackground: true,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
});
await 브라우저.close();

const 크기 = fs.statSync(출력).size;
console.log(`✅ ${출력}  (${(크기 / 1024).toFixed(0)}KB)`);
