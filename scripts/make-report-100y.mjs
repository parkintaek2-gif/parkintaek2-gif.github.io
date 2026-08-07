#!/usr/bin/env node
/**
 * 백년지도 감수용 리포트 — **사장님이 종이로 보실 것**을 뽑는다.
 *
 * 사장님 지시(2026-08-07): 「백년지도 리포트 보게 바탕화면, 원드라이브에
 *   **감수용 리포트-백년지도** 폴더에 넣어줘」
 *
 * ── 무엇을 뽑나 ────────────────────────────────────────────────
 * 라이브 지면을 그대로 인쇄한다. **인쇄 화면 = PDF 저장 화면**이라,
 * 이 PDF 가 곧 고객이 「인쇄」를 눌렀을 때 받는 것이다. 따로 만든 예쁜 그림이 아니다.
 *
 * ⚠ 그래서 이 PDF 에서 이상한 것은 **지면이 이상한 것**이다. 여기서 고치지 말고 지면을 고친다.
 *
 * ── 어디에 두나 ────────────────────────────────────────────────
 *   C:\Users\USER\Desktop\감수용 리포트-백년지도
 *   C:\Users\USER\OneDrive\감수용 리포트-백년지도
 * 두 곳에 같은 것을 둔다. 사장님이 어느 쪽을 여시든 같은 것이 있어야 한다.
 *
 * 쓰는 법
 *   node scripts/make-report-100y.mjs            라이브에서 뽑는다
 *   node scripts/make-report-100y.mjs --selftest 이름 짓는 규칙만 검산한다
 */
import { mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 바탕 = 'C:/Users/USER/Desktop/감수용 리포트-백년지도';
const 원드 = 'C:/Users/USER/OneDrive/감수용 리포트-백년지도';

/** 주소를 파일 이름으로 — 한글 주소가 그대로 파일 이름이 되면 좋다 */
export function 파일이름(주소, 제목) {
  const 끝 = decodeURIComponent(주소.split('/').filter(Boolean).pop() ?? 'index');
  return `백년지도_${제목}_${끝}.pdf`.replace(/[\\/:*?"<>|]/g, '_');
}

if (process.argv.includes('--selftest')) {
  const 틀림 = [];
  if (파일이름('https://100yearmap.com/age/32', '나이') !== '백년지도_나이_32.pdf') 틀림.push('나이 이름이 다르다');
  if (!파일이름('https://100yearmap.com/college-major/%EA%B0%84%ED%98%B8%ED%95%99%EA%B3%BC', '학과').includes('간호학과')) 틀림.push('한글 주소를 못 푼다');
  if (/[\\/:*?"<>|]/.test(파일이름('https://x/a:b', '시험'))) 틀림.push('파일 이름에 못 쓰는 글자가 남는다');
  console.log(틀림.length ? `⛔ 자가시험 실패\n  ${틀림.join('\n  ')}` : '✅ 리포트 뽑기 자가시험 3건 통과');
  process.exit(틀림.length ? 1 : 0);
}

const 뽑을것 = [
  { 주소: 'https://100yearmap.com/age/32', 제목: '나이' },
  { 주소: 'https://100yearmap.com/age/55', 제목: '나이' },
  { 주소: 'https://100yearmap.com/age', 제목: '나이로보기' },
  { 주소: 'https://100yearmap.com/college-major/%EA%B0%84%ED%98%B8%ED%95%99%EA%B3%BC', 제목: '대학학과' },
  { 주소: 'https://100yearmap.com/college-major', 제목: '대학학과목록' },
  { 주소: 'https://100yearmap.com/region/%EA%B2%BD%EA%B8%B0', 제목: '지역' },
  { 주소: 'https://100yearmap.com/', 제목: '첫화면' },
];

const puppeteer = (await import(pathToFileURL('C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js').href)).default;

mkdirSync(바탕, { recursive: true });
mkdirSync(원드, { recursive: true });

const 브라우저 = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox'],
});

let 센것 = 0;
for (const { 주소, 제목 } of 뽑을것) {
  const 창 = await 브라우저.newPage();
  try {
    const 답 = await 창.goto(주소, { waitUntil: 'networkidle0', timeout: 60000 });
    if (!답 || 답.status() !== 200) { console.log(`⚠ ${주소} — ${답?.status() ?? '못 감'}. 건너뛴다`); await 창.close(); continue; }
    const 이름 = 파일이름(주소, 제목);
    const 낼길 = path.join(바탕, 이름);
    /* ⚠ **인쇄 CSS 를 그대로 쓴다.** 화면용으로 뽑으면 고객이 받는 것과 달라진다 */
    await 창.pdf({ path: 낼길, format: 'A4', printBackground: true,
                   margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
    copyFileSync(낼길, path.join(원드, 이름));
    console.log(`  ${이름}`);
    센것++;
  } catch (e) {
    console.log(`⚠ ${주소} — ${String(e.message).slice(0, 60)}`);
  }
  await 창.close();
}
await 브라우저.close();

console.log(`\n✅ 리포트 ${센것}장`);
console.log(`   바탕화면   ${바탕}`);
console.log(`   원드라이브 ${원드}`);
if (!센것) { console.error('⛔ 한 장도 못 뽑았다'); process.exit(1); }
