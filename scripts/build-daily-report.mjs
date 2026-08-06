#!/usr/bin/env node
/**
 * build-daily-report.mjs — **여섯 자리를 한 장씩** 담는 통합 업무보고 PDF
 *
 * 사장님 지시(2026-08-06): 「1~6번의 업무보고를 한 파일에 모아라. 하루에 두 개 문서만.
 *   한 세션 당 1페이지씩, 보고 항목에서 기타는 빼고 나머지는 유지」
 *
 * ⚠ klifemap 의 `build-report-deck.js` 를 안 쓰는 이유 — 그쪽은 **여섯 장 고정에 절 5개**다.
 *   자리가 여섯이라 5개로는 한 자리가 통째로 빠진다. 오늘 실제로 리스크 AI 절이 잘려 나갔다.
 *   그 도구는 1번 것이고 그쪽 지시(6장 고정)에 맞게 돌고 있으니 건드리지 않는다.
 *
 * 쓰는 법
 *   node scripts/build-daily-report.mjs <md> [--out <pdf>]
 *
 * 규칙
 *   · `## ` 하나가 한 장이다. 자리 수만큼 장이 나온다
 *   · `### ` 는 절. **넘치면 잘라내지 않고 글자를 줄인다** — 잘리면 그 자리가 없어진 줄 모른다
 *   · 잘라야만 할 때는 **화면에 남긴다**(「…이하 N줄 생략」). 조용히 자르지 않는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
const puppeteer = require('puppeteer-core');

const 입력 = process.argv[2];
if (!입력) { console.error('⛔ md 파일을 주십시오'); process.exit(1); }
const i = process.argv.indexOf('--out');
const 출력 = i >= 0 ? process.argv[i + 1] : 입력.replace(/\.md$/, '.pdf');

const 원문 = fs.readFileSync(입력, 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** **굵게** 와 `코드` 만 살린다. 보고에 링크는 안 쓴다 */
const 꾸밈 = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');

const 줄 = 원문.split('\n');
const 제목 = (줄.find((l) => l.startsWith('# ')) ?? '# 업무보고').slice(2).trim();

/** `## ` 로 자른다 — 한 덩어리가 한 장이다 */
const 장 = [];
let 지금 = null;
for (const l of 줄) {
  if (l.startsWith('## ')) { 지금 = { 이름: l.slice(3).trim(), 절: [] }; 장.push(지금); continue; }
  if (!지금) continue;
  if (l.startsWith('### ')) { 지금.절.push({ 제목: l.slice(4).trim(), 글: [] }); continue; }
  const t = l.trim();
  if (t && 지금.절.length) 지금.절[지금.절.length - 1].글.push(t);
}
if (!장.length) { console.error('⛔ `## ` 로 시작하는 자리가 없다'); process.exit(1); }

const 쪽 = 장.map((p, n) => `
  <section>
    <header><span class="no">${n + 1} / ${장.length}</span><h2>${꾸밈(p.이름)}</h2></header>
    ${p.절.map((s) => `
      <div class="sec">
        <h3>${꾸밈(s.제목)}</h3>
        <p>${s.글.map(꾸밈).join('<br>')}</p>
      </div>`).join('')}
    <footer>${esc(제목)}</footer>
  </section>`).join('');

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
  @page { size: 297mm 167mm; margin: 0; }   /* 16:9 */
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Noto Sans KR','Malgun Gothic',sans-serif; word-break:keep-all; }
  section { width:297mm; height:167mm; padding:16mm 18mm 12mm; page-break-after:always;
            background:#0f1115; color:#e9e6df; display:flex; flex-direction:column; }
  header { border-bottom:1px solid #22262e; padding-bottom:6mm; margin-bottom:7mm; position:relative; }
  h2 { font-family:'Noto Serif KR',serif; font-weight:900; font-size:26pt; color:#c8a44d; letter-spacing:-.5px; }
  .no { position:absolute; right:0; top:2mm; font-size:9pt; color:#5c6167; font-weight:700; }
  .sec { margin-bottom:6mm; }
  h3 { font-size:12pt; font-weight:700; color:#e9e6df; margin-bottom:2mm; }
  p { font-size:10.5pt; line-height:1.75; color:#9aa0a6; }
  b { color:#e9e6df; font-weight:700; }
  code { font-family:Consolas,monospace; font-size:9.5pt; color:#c8a44d; }
  footer { margin-top:auto; padding-top:5mm; border-top:1px solid #22262e; font-size:8.5pt; color:#5c6167; }
</style></head><body>${쪽}</body></html>`;

const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new', args: ['--no-sandbox'],
});
const p = await b.newPage();
await p.setContent(html, { waitUntil: 'load' });

/** 🔴 넘치는 쪽을 **찾아서 알린다.** 조용히 자르면 그 자리가 없어진 줄 모른다 */
const 넘침 = await p.evaluate(() =>
  [...document.querySelectorAll('section')]
    .map((s, i) => ({ 쪽: i + 1, 이름: s.querySelector('h2')?.textContent ?? '', 넘음: s.scrollHeight > s.clientHeight + 2 }))
    .filter((x) => x.넘음)
);

await p.pdf({ path: 출력, width: '297mm', height: '167mm', printBackground: true, pageRanges: `1-${장.length}` });
await b.close();

console.log(`저장 ${출력}  ·  ${장.length}장 (자리 ${장.map((x) => x.이름.split(' ')[0]).join('·')})`);
if (넘침.length) {
  console.log(`\n⚠ 넘치는 쪽 ${넘침.length}개 — 그 쪽 글을 줄이십시오. **조용히 자르지 않았습니다**`);
  for (const x of 넘침) console.log(`   ${x.쪽}쪽  ${x.이름}`);
  process.exit(2);
}
console.log('✅ 넘치는 쪽 없음 — 여섯 자리가 다 실렸습니다');
