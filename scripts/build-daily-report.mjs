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

const 자가시험인가 = process.argv.includes("--자가시험");
const 입력 = process.argv[2];
if (!자가시험인가 && !입력) { console.error('⛔ md 파일을 주십시오'); process.exit(1); }
const i = process.argv.indexOf('--out');
const 출력 = i >= 0 ? process.argv[i + 1] : 입력.replace(/\.md$/, '.pdf');

const 원문 = 자가시험인가 ? "" : fs.readFileSync(입력, 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** **굵게** 와 `코드` 만 살린다. 보고에 링크는 안 쓴다 */
const 꾸밈 = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');

const 줄 = 원문.split('\n');
const 제목 = (줄.find((l) => l.startsWith('# ')) ?? '# 업무보고').slice(2).trim();

/**
 * `## ` 로 자른다 — 한 덩어리가 한 장이다.
 *
 * 🔴 2026-08-09 13:3x — **사장님이 「PDF 업무보고 안 보임」이라 하셨다.**
 *   제목만 나오고 **본문이 통째로 비어 있었다.**
 * ```
 * 옛 코드   if (t && 지금.절.length) …            ← `### ` 가 **아직 없으면 글을 버렸다**
 * 내 보고   `## ` 아래에 바로 글을 썼다(### 없이)  → **한 장도 안 실렸다**
 * ⛔ 그런데 자는 「✅ 여섯 자리가 다 실렸습니다」라고 했다. **빈 장을 세고 있었다**
 * ```
 * ⭐ 고친 것 — ① `###` 없이 쓴 글도 **이름 없는 절**로 받는다
 *              ② 표(`|`)와 덩어리글(```)을 제 모양으로 그린다
 *              ③ **글자 수가 0인 장이 있으면 죽는다** (아래 자가시험)
 */
export function 갈라내기(줄들) {
  const 장 = [];
  let 지금 = null;
  let 덩어리 = null;          // ``` 안쪽
  const 절넣기 = () => {
    if (!지금.절.length) 지금.절.push({ 제목: '', 글: [] });
    return 지금.절[지금.절.length - 1];
  };
  for (const l of 줄들) {
    if (l.startsWith('## ')) { 지금 = { 이름: l.slice(3).trim(), 절: [] }; 장.push(지금); 덩어리 = null; continue; }
    if (!지금) continue;
    if (l.trimStart().startsWith('```')) {
      if (덩어리) { 절넣기().글.push({ 꼴: '덩어리', 줄: 덩어리 }); 덩어리 = null; }
      else 덩어리 = [];
      continue;
    }
    if (덩어리) { 덩어리.push(l); continue; }
    if (l.startsWith('### ')) { 지금.절.push({ 제목: l.slice(4).trim(), 글: [] }); continue; }
    const t = l.trim();
    if (!t) continue;
    if (/^\|.*\|$/.test(t)) {                       // 표 한 줄
      const 앞 = 절넣기().글[절넣기().글.length - 1];
      if (앞 && 앞.꼴 === '표') 앞.줄.push(t);
      else 절넣기().글.push({ 꼴: '표', 줄: [t] });
      continue;
    }
    절넣기().글.push({ 꼴: '글', 줄: [t] });
  }
  // ⛔ 덩어리가 안 닫혔으면 버리지 않는다
  if (지금 && 덩어리 && 덩어리.length) 절넣기().글.push({ 꼴: '덩어리', 줄: 덩어리 });
  return 장;
}

/** 한 장에 실린 글자 수 — ⛔ 0이면 그 장은 **빈 장**이다 */
export const 글자수 = (p) =>
  p.절.reduce((a, s) => a + s.제목.length + s.글.reduce((b, g) => b + g.줄.join('').length, 0), 0);

const 장 = 갈라내기(줄);
if (!자가시험인가 && !장.length) { console.error('⛔ `## ` 로 시작하는 자리가 없다'); process.exit(1); }

/** 표 한 덩어리를 그린다. `|---|` 가름줄은 버린다 */
const 표그리기 = (줄들) => {
  const 칸 = 줄들
    .filter((l) => !/^\|[\s:\-|]+\|$/.test(l))
    .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  if (!칸.length) return '';
  const [머리, ...몸] = 칸;
  return `<table><thead><tr>${머리.map((c) => `<th>${꾸밈(c)}</th>`).join('')}</tr></thead>`
    + `<tbody>${몸.map((r) => `<tr>${r.map((c) => `<td>${꾸밈(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
};

const 글그리기 = (g) => {
  if (g.꼴 === '표') return 표그리기(g.줄);
  if (g.꼴 === '덩어리') return `<pre>${g.줄.map(esc).join('\n')}</pre>`;
  return `<p>${g.줄.map(꾸밈).join('<br>')}</p>`;
};

/* ── 자가시험 — ⛔ 깃발이 `--자가시험` (남의 것을 가로채지 않으려고) ── */
if (process.argv[1] && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 120)}`); }
  };
  const 갈 = (s) => 갈라내기(s.split('\n'));

  /* 🔴 사장님이 잡으신 것 — 「### 없이 쓴 글」이 통째로 사라지던 자리 */
  재본다('### 없이 쓴 글도 살아남는다', (() => {
    const p = 갈('## 3번 백년지도\n오늘 간판 4,055장을 달았습니다')[0];
    return 글자수(p) > 0;
  })(), true);
  재본다('그 글이 이름 없는 절에 들어간다',
    갈('## 3번\n한 줄')[0].절[0].제목, '');
  재본다('### 가 있으면 그 절에 들어간다',
    갈('## 3번\n### 절 이름\n한 줄')[0].절[0].제목, '절 이름');
  재본다('### 앞뒤 글이 둘 다 산다', (() => {
    const p = 갈('## 3번\n앞글\n### 절\n뒷글')[0];
    return p.절.length === 2 && 글자수(p) > 0;
  })(), true);

  /* 표 */
  재본다('표를 표로 받는다',
    갈('## 3번\n| 갈래 | 오늘 |\n|---|---|\n| 텍스트 | 3 |')[0].절[0].글[0].꼴, '표');
  재본다('표가 한 덩어리로 묶인다',
    갈('## 3번\n| a | b |\n|---|---|\n| 1 | 2 |')[0].절[0].글[0].줄.length, 3);
  재본다('가름줄은 그릴 때 빠진다', (() => {
    const h = 표그리기(['| a | b |', '|---|---|', '| 1 | 2 |']);
    return h.includes('<th>a</th>') && h.includes('<td>1</td>') && !h.includes('---');
  })(), true);

  /* 덩어리글 */
  재본다('``` 덩어리를 받는다',
    갈('## 3번\n```\n한 줄\n```')[0].절[0].글[0].꼴, '덩어리');
  재본다('덩어리 안 줄이 남는다',
    갈('## 3번\n```\nㄱ\nㄴ\n```')[0].절[0].글[0].줄, ['ㄱ', 'ㄴ']);
  재본다('덩어리가 안 닫혀도 안 버린다',
    글자수(갈('## 3번\n```\nㄱ')[0]) > 0, true);

  /* ⛔ 제일 중요한 것 — **빈 장이 있으면 잡는다** */
  재본다('빈 장을 빈 것으로 센다', 글자수(갈('## 3번\n')[0]), 0);
  재본다('진짜 보고 꼴에서 글자가 나온다', (() => {
    const p = 갈('## 3번 백년지도 — 결론 한 줄\n⭐ 간판 4,055장\n```\n노원구 40개\n```\n| a | b |\n|---|---|\n| 1 | 2 |')[0];
    return 글자수(p) > 20;
  })(), true);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 자가시험 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}



const 쪽 = 장.map((p, n) => `
  <section>
    <header><span class="no">${n + 1} / ${장.length}</span><h2>${꾸밈(p.이름)}</h2></header>
    ${p.절.map((s) => `
      <div class="sec">
        ${s.제목 ? `<h3>${꾸밈(s.제목)}</h3>` : ''}
        ${s.글.map(글그리기).join('')}
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
  pre { font-family:Consolas,monospace; font-size:9pt; line-height:1.55; color:#b9c0c7;
        background:#161a20; border-left:2px solid #c8a44d; padding:2.5mm 3mm; margin:2mm 0;
        white-space:pre-wrap; word-break:break-word; }
  table { border-collapse:collapse; width:100%; margin:2mm 0; font-size:9.5pt; }
  th { text-align:left; color:#c8a44d; font-weight:700; border-bottom:1px solid #3a4049; padding:1.4mm 2mm; }
  td { color:#c3c8ce; border-bottom:1px solid #22262e; padding:1.4mm 2mm; }
  tr td:first-child { color:#e9e6df; font-weight:700; }
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
