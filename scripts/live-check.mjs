#!/usr/bin/env node
/**
 * live-check.mjs — **살아 있는 지면을 사람 눈으로 보이는 대로 잰다.**
 *
 * 🔴 사장님(2026-08-15 21:0x): 「**2번 네가 라이브 잴 수 있게 조치해**」
 *
 * ⛔ 왜 만드는가 — 오늘 제가 **헛경보를 네 번** 냈습니다. 넷 다 뿌리가 같습니다.
 *    ① 「대표 메일이 0곳」      curl 로 쟀다. 푸터는 JS 가 그린다
 *    ② 「푸터가 깨졌다」        같은 까닭
 *    ③ 「다국어 셋이 다 958」   i18n 은 JS 가 갈아 끼운다
 *    ④ 「인쇄 고침이 0곳」      주석으로 쟀다. 주석은 빌드가 지운다
 *
 *    ⭐ 그러니 규칙은 하나입니다 —
 *       **`fetch`·`curl` 로 잰 것은 「없다」의 증거가 되지 못한다.**
 *       그것은 「HTML 첫 덩어리에 없다」일 뿐입니다.
 *       진짜 화면은 브라우저가 JS 를 돌린 **뒤**에 생깁니다.
 *
 * ⭐ 이 자는 진짜 크롬을 띄워 JS 를 다 돌린 **뒤**의 글자를 셉니다.
 *    사람이 보는 것과 같은 것을 셉니다.
 *
 * ⛔ 램 조심 — 이 기계는 15.8GB 중 1.3GB 만 남습니다(claude 가 8.7GB).
 *    그래서 **한 번에 한 창**만 띄우고, 다 재면 **반드시 닫습니다**.
 *    여러 주소를 한꺼번에 열지 않습니다. 줄 세워 잽니다.
 *
 * 쓰는 법
 *   node scripts/live-check.mjs <주소>                        화면 글자 길이·제목만
 *   node scripts/live-check.mjs <주소> "9월 1일" "선착순"        마커마다 몇 개인지
 *   node scripts/live-check.mjs <주소> --글                     화면 글자를 다 뱉는다
 *   node scripts/live-check.mjs --selftest
 *
 * 다른 자에서 부를 때
 *   import { 재기 } from './live-check.mjs';
 *   const r = await 재기('https://…', ['9월 1일']);   // { 제목, 글, 셈: {…} }
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/** 크롬이 어디 있나 — 이 기계에 실제로 있는 것만 적는다 */
export const 크롬자리들 = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.CHROME_PATH || '',
];

export function 크롬찾기(있나 = (p) => p && fs.existsSync(p)) {
  for (const p of 크롬자리들) if (있나(p)) return p;
  return null;
}

/**
 * 겹치지 않게 센다.
 * ⛔ `split().length-1` 은 빈 마커에서 글자 수만큼 나온다 — 그래서 직접 센다.
 */
export function 세기(글, 표식) {
  if (!글 || !표식) return 0;
  let n = 0, i = 0;
  for (;;) {
    const j = 글.indexOf(표식, i);
    if (j === -1) return n;
    n++; i = j + 표식.length;
  }
}

/**
 * 🔴 이것이 이 자의 핵심입니다 — **재는 법이 무엇이었나**를 같이 답니다.
 *
 * ⛔ 오늘 헛경보의 진짜 죄는 「0곳」이라고 말한 것이 아니라,
 *    **어떻게 쟀는지를 안 밝힌 것**입니다. 밝혔으면 사장님이 바로 잡으셨을 것입니다.
 *
 * ⭐ 그래서 「0」을 말할 자격은 **화면으로 잰 것**에만 줍니다.
 */
export function 말할수있나(잰법) {
  if (잰법 === '화면') return { 된다: true, 까닭: '' };
  return {
    된다: false,
    까닭: `⛔ ${잰법} 으로 잰 것으로는 「없다」고 말하지 않습니다 — JS 가 그리는 것을 못 봅니다`,
  };
}

/** 소스로 잰 0 과 화면으로 잰 0 은 다르다 — 헷갈리지 않게 말을 만들어 준다 */
export function 셈말(표식, 센것, 잰법) {
  if (센것 > 0) return `✅ ${표식} — ${센것}곳 (${잰법})`;
  const { 된다 } = 말할수있나(잰법);
  if (된다) return `🔴 ${표식} — 화면에 **없습니다** (0곳)`;
  return `⚠ ${표식} — ${잰법}에는 0곳. **없다고 단정하지 않습니다.** 화면으로 다시 재십시오`;
}

/**
 * 살아 있는 주소를 열어 **JS 를 다 돌린 뒤**의 글자를 가져온다.
 * @param 주소   재려는 지면
 * @param 표식들 셀 낱말들
 * @param 기다림 JS 가 그릴 틈. 기본 2.5초 — 우리 지면은 그 안에 다 그린다
 */
export async function 재기(주소, 표식들 = [], { 기다림 = 2500, 크롬 = null } = {}) {
  const 길 = 크롬 || 크롬찾기();
  if (!길) throw new Error('⛔ 크롬을 못 찾았습니다. CHROME_PATH 를 주십시오');

  const { default: puppeteer } = await import('puppeteer-core');
  let 창 = null;
  try {
    창 = await puppeteer.launch({
      executablePath: 길,
      headless: true,
      // ⛔ 램이 1.3GB 밖에 없다. 그림·소리를 끄고 최소로 띄운다
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--mute-audio'],
    });
    const 쪽 = await 창.newPage();
    await 쪽.setViewport({ width: 390, height: 844 }); // ⭐ 손님 대부분이 손전화다
    await 쪽.goto(주소, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 기다림)); // JS 가 갈아 끼울 틈

    const 제목 = await 쪽.title();
    const 글 = await 쪽.evaluate(() => document.body.innerText);
    const 판 = await 쪽.evaluate(() => document.documentElement.outerHTML);

    const 셈 = {};
    for (const 표식 of 표식들) {
      // ⭐ 보이는 글자에서 먼저 세고, 없으면 그려진 판에서 센다(단추 이름·alt 따위)
      const 보임 = 세기(글, 표식);
      셈[표식] = { 보이는곳: 보임, 판에: 세기(판, 표식) };
    }
    return { 주소, 제목, 글, 판길이: 판.length, 글길이: 글.length, 셈, 잰법: '화면' };
  } finally {
    if (창) await 창.close(); // ⛔ 반드시 닫는다. 램이 없다
  }
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [세기('가나가나가', '가'), 3, '겹치지 않게 센다'],
    [세기('aaaa', 'aa'), 2, '⛔ 겹치는 것을 두 번 세지 않는다'],
    [세기('', '가'), 0, '빈 글은 0'],
    [세기('가나다', ''), 0, '⛔ 빈 표식은 0 — split 로 세면 글자 수가 나온다'],
    [세기(null, '가'), 0, '못 가져온 것도 0'],
    [말할수있나('화면').된다, true, '⭐ 화면으로 잰 것은 「없다」고 말할 수 있다'],
    [말할수있나('소스').된다, false, '⛔ 소스로 잰 0 은 「없다」가 아니다'],
    [말할수있나('curl').된다, false, '⛔ curl 로 잰 0 은 「없다」가 아니다 — 오늘 헛경보 셋의 까닭'],
    [셈말('9월 1일', 2, '화면'), '✅ 9월 1일 — 2곳 (화면)', '있으면 초록'],
    [셈말('9월 1일', 0, '화면'), '🔴 9월 1일 — 화면에 **없습니다** (0곳)', '화면에서 0이면 빨강'],
    [셈말('9월 1일', 0, 'curl').startsWith('⚠'), true, '⛔ curl 0 은 경고까지만 — 단정하지 않는다'],
    [크롬자리들.length >= 2, true, '크롬 자리를 여럿 둔다'],
    [typeof 재기, 'function', '재기를 밖에서 부를 수 있다'],
    [크롬찾기(() => false), null, '크롬이 없으면 null 을 준다'],
    [크롬찾기((p) => p === 크롬자리들[1]), 크롬자리들[1], '앞의 것이 없으면 뒤엣것을 찾는다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) {
      console.error(`❌ ${이름}  — 잰 것 ${JSON.stringify(잰것)}`);
      틀림++;
    }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 라이브 재기 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

/**
 * ⛔ 여기부터는 **직접 불렀을 때만** 돕니다.
 *    이 빗장이 없으면 다른 자가 `import` 만 해도 명령줄 부분이 돌아
 *    「쓰는 법…」을 뱉고 그 자를 죽입니다 — 방금 필수품 자가 그렇게 끊겼습니다.
 */
// ⛔ `node -e` 로 부르면 argv[1] 이 아예 없다. 없는 것을 만지면 죽는다
const 나를직접불렀나 = !!process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!나를직접불렀나) {
  // 가져다 쓰는 것이다. 아무것도 하지 않는다.
} else {

const 인자 = process.argv.slice(2);
const 주소 = 인자.find((a) => /^https?:\/\//.test(a));
if (!주소) {
  console.error('쓰는 법:  node scripts/live-check.mjs <주소> ["표식" …] [--글]');
  process.exit(1);
}
const 표식들 = 인자.filter((a) => a !== 주소 && !a.startsWith('--'));

try {
  const r = await 재기(주소, 표식들);
  console.log(`\n● 화면으로 쟀습니다 — ${r.주소}`);
  console.log(`  제목  ${r.제목}`);
  console.log(`  보이는 글자 ${r.글길이}자 · 그려진 판 ${r.판길이}자\n`);
  for (const [표식, v] of Object.entries(r.셈)) {
    console.log(`  ${셈말(표식, v.보이는곳, '화면')}`);
    if (v.보이는곳 === 0 && v.판에 > 0) {
      console.log(`     ⚠ 판에는 ${v.판에}곳 있으나 **눈에 안 보입니다** — 숨었거나 접혀 있습니다`);
    }
  }
  if (인자.includes('--글')) console.log(`\n──── 화면 글자 ────\n${r.글}`);
  const 빨강 = Object.values(r.셈).filter((v) => v.보이는곳 === 0).length;
  console.log(`\n표식 ${표식들.length}개 중 **화면에 없는 것 ${빨강}개**`);
  process.exit(빨강 ? 2 : 0);
} catch (e) {
  console.error(`\n⛔ 못 쟀습니다 — ${e.message}`);
  console.error('⭐ 못 쟀을 때는 「없다」가 아니라 **「못 쟀다」**입니다. 그렇게 보고하십시오.');
  process.exit(1);
}

}
