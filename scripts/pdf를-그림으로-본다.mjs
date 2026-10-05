/**
 * pdf를-그림으로-본다.mjs — **PDF 를 쪽마다 그림으로 떠서 눈으로 보게 한다.**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 사장님 2026-10-01: 「보내기 전에 «보낼 파일 그 자체»를 열어 눈으로 보고 보내라」
 *   — 「중요 지침으로 못박을 것」이라 하셨다.
 *
 * ⚠ [2026-10-05 16:2x · 5번] `send-1600-report.mjs` 가 막으면서
 *   「`node scratchpad/pdf본다.mjs` 로 크롬에 띄워 본다」고 일러 준다.
 *   **그 파일이 없다.** 자물쇠가 없는 도구를 가리키고 있었다 — 그래서 만든다.
 *   ⛔ 「시키는 자리」와 「할 수 있는 자리」가 어긋나면 그 자물쇠는 꺼지게 된다.
 *
 * ⚠ 이 PC 에는 `pdftoppm`(poppler)이 없다. 그래서 **크롬의 PDF 보기**로 그린다.
 *
 * ⛔ 사장님 창을 건드리지 않는다 — 새 크롬을 띄우고, 내가 연 것만 닫는다.
 *
 * 쓰는 법
 *   node scripts/pdf를-그림으로-본다.mjs <pdf> <낼폴더> [쪽수]
 *   node scripts/pdf를-그림으로-본다.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/** 쪽 그림 파일 이름 — ⛔ 자리를 0 으로 채운다. 안 그러면 10쪽이 2쪽 앞에 선다 */
export function 그림이름(뿌리, 쪽, 모두) {
  const 자리 = String(모두).length;
  return path.join(뿌리, `쪽-${String(쪽).padStart(자리, '0')}.png`);
}

/** 파일을 크롬이 읽을 주소로 — ⛔ 한글 경로가 깨지지 않게 감싼다 */
export function 파일주소(길) {
  const p = path.resolve(String(길 ?? '')).replace(/\\/g, '/');
  return `file:///${p.split('/').map((t, i) => (i === 0 ? t : encodeURIComponent(t))).join('/')}`;
}

/* ─────────────────────────── 자가시험 ─────────────────────────── */
function 자가시험() {
  let 흠 = 0;
  const 본다 = (이름, 맞나) => { console.log(`  ${맞나 ? '✅' : '🔴'} ${이름}`); if (!맞나) 흠 += 1; };

  본다('🔴 자리를 0 으로 채운다 — 10쪽이 2쪽 앞에 안 선다',
    path.basename(그림이름('/t', 2, 12)) === '쪽-02.png');
  본다('한 자리면 안 채운다', path.basename(그림이름('/t', 2, 9)) === '쪽-2.png');

  const u = 파일주소('C:/가 나/보고.pdf');
  본다('🔴 한글 경로를 감싼다', u.includes('%EA%B0%80') && u.endsWith('.pdf'));
  본다('빈칸도 감싼다', !/ /.test(u));
  본다('드라이브 글자는 안 감싼다', u.startsWith('file:///C:/'));

  console.log(흠 ? `\n🔴 흠 ${흠}` : '\n✅ 자가시험 전부 통과');
  process.exit(흠 ? 1 : 0);
}

/* ─────────────────────────── 손으로 쓰기 ─────────────────────────── */
const 내가진입점 = process.argv[1]
  && decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\//, '')
    .toLowerCase().replace(/\\/g, '/')
    .endsWith(process.argv[1].toLowerCase().replace(/\\/g, '/').replace(/^[a-z]:\//, ''));

if (!내가진입점) { /* 들여다 쓰는 자리 */ }
else if (process.argv.includes('--자가시험')) { 자가시험(); }
else {
  const [, , pdf길, 낼폴더, 쪽수글] = process.argv;
  if (!pdf길 || !낼폴더) {
    console.log('⛔ 쓰는 법: node scripts/pdf를-그림으로-본다.mjs <pdf> <낼폴더> [쪽수]');
    process.exit(1);
  }
  if (!fs.existsSync(pdf길)) { console.log(`🔴 ${pdf길} 이 없다`); process.exit(1); }
  fs.mkdirSync(낼폴더, { recursive: true });
  const 쪽수 = Number(쪽수글) || 0;

  /**
   * ⚠ 이 저장소는 `puppeteer-core` 를 쓴다 — 크롬을 따로 받아 오지 않는다.
   *   그래서 크롬 자리를 직접 일러 준다. `build-daily-report.mjs` 와 같은 자리다.
   * ⛔ 자리가 바뀌면 여기와 그 파일 «둘 다» 고친다. 한쪽만 고치면 조용히 갈린다.
   */
  const 크롬자리 = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const { createRequire } = await import('node:module');
  const puppeteer = createRequire(import.meta.url)('puppeteer-core');
  /* ⛔ 사장님 창에 안 붙는다 — 내 크롬을 따로 띄우고, 내가 띄운 것만 닫는다 */
  const 브 = await puppeteer.launch({
    executablePath: 크롬자리,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const p = await 브.newPage();
    await p.setViewport({ width: 1400, height: 1000 });
    await p.goto(파일주소(pdf길), { waitUntil: 'networkidle2', timeout: 60000 });
    /* 크롬의 PDF 보기가 그릴 틈을 준다 */
    await new Promise((r) => setTimeout(r, 2500));

    /* 쪽수를 모르면 통째로 한 장 뜬다 — 「몇 장인지 모른다」를 숨기지 않는다 */
    if (!쪽수) {
      const 낼것 = path.join(낼폴더, '통째.png');
      await p.screenshot({ path: 낼것, fullPage: true });
      console.log(`✅ 통째로 떴다 — ${낼것}`);
      console.log('   ⚠ 쪽수를 안 주면 한 장이다. 쪽마다 보려면 쪽수를 준다');
    } else {
      /**
       * 🔴🔴 [2026-10-05 16:3x · 5번] **처음에 `window.scrollTo()` 로 쪽을 넘겼더니
       *   세 쪽이 다 «같은 그림»이었다. 그런데 자는 「3쪽을 떴다」고 적었다.**
       *   크롬의 PDF 보기는 창이 아니라 속 플러그인이 그린다 — 창을 굴려도 안 넘어간다.
       *   ⛔ 거짓말하는 자다. 눈으로 보려고 만든 자가 거짓을 내면 안 보는 것만 못하다.
       * ⇒ 쪽마다 `#page=N` 으로 **새로 연다.** 그리고 **그림이 서로 다른지 센다.**
       */
      const 자국 = new Set();
      const 같은것 = [];
      const crypto = await import('node:crypto');
      /* ⚠ `#page=N` 으로도 안 넘어갔다(크롬이 이미 연 보기를 그대로 둔다).
         ⇒ 쪽마다 **새로 열고 자판으로** 내려간다. 느리지만 이것은 듣는다. */
      for (let i = 1; i <= 쪽수; i += 1) {
        await p.goto(파일주소(pdf길), { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise((r) => setTimeout(r, 1800));
        await p.mouse.click(700, 500);             /* 보기 안을 집어야 자판이 듣는다 */
        for (let k = 1; k < i; k += 1) {
          await p.keyboard.press('PageDown');
          await new Promise((r) => setTimeout(r, 500));
        }
        await new Promise((r) => setTimeout(r, 800));
        const 낼것 = 그림이름(낼폴더, i, 쪽수);
        await p.screenshot({ path: 낼것 });
        const 해시 = crypto.createHash('sha1').update(fs.readFileSync(낼것)).digest('hex');
        if (자국.has(해시)) 같은것.push(i);
        자국.add(해시);
        console.log(`   ${i}쪽 → ${낼것}`);
      }
      if (같은것.length) {
        console.log(`\n🔴 **앞쪽과 똑같은 그림이 ${같은것.length}장이다** — ${같은것.join('·')}쪽`);
        console.log('   ⛔ 쪽이 안 넘어갔다는 뜻이다. 「떴다」고 적지 않는다.');
        process.exit(1);
      }
      console.log(`✅ ${쪽수}쪽을 떴다 — 서로 다른 그림 ${자국.size}장`);
    }
    await p.close();
  } finally {
    await 브.close();   /* 내가 띄운 크롬이다 — 닫아도 된다 */
  }
}
