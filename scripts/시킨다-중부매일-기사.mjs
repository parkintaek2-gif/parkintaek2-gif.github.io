#!/usr/bin/env node
/**
 * 시킨다-중부매일-기사.mjs — **사장님이 그때 주문하신 기사를 중부매일 계정에 시킨다.**
 *
 * ── 🔴 왜 (2026-09-29 · 5번) ─────────────────────────────────────────
 * 사장님 — 「**아시안게임 종합 기사(어제 경기) 빨리 쓰라고 지시해라**」
 * 회차 규칙의 맨 앞자리가 바로 이것이다 — 「⓿ 사장님이 그때 주문하신 기사(최우선)」.
 * ⛔ 내가 직접 쓰지 않는다. 사장님이 「네가 직접 쓰면 문제가 많다」고 못박으셨다.
 *
 * ⛔ **「지금 실행」을 누르지 않는다.** 그것은 회차의 «원래 프롬프트»를 먼저 돌려서,
 *   답글로 얹은 지시를 그 뒤로 밀어 묻는다. 2026-09-28 에 그래서 16시 회차에
 *   기획이 아니라 경기 기사가 나갔다. ⇒ 회차 «대화»에 들어가 그 자리에서 시킨다.
 *
 * 🔴 **줄바꿈은 «전송키»다.** 여러 줄짜리 지시를 그냥 치면 줄마다 따로 보내진다 —
 *   처음 이 길을 냈을 때 지시 하나가 «열 토막»으로 나갔고, 받는 쪽은 첫 토막에
 *   답을 시작해 뒤에 붙인 조건(정본 출처·팩트 규칙)을 못 본 채 쓸 뻔했다.
 *   ⇒ 줄은 Shift+Enter 로 넣고, 다 친 뒤 Enter 를 «한 번만» 누른다.
 *
 * ⛔ 사장님 크롬 창을 닫지 않는다 — disconnect() 만. 언제나 새 탭.
 *
 * 쓰는 법
 *   node scripts/시킨다-중부매일-기사.mjs --회차 09 --글 docs/지시문.txt
 *   node scripts/시킨다-중부매일-기사.mjs --회차 09 --글 ... --찍는다 그림.png
 *   node scripts/시킨다-중부매일-기사.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 회차 표는 «수집기 하나»에서만 읽는다 — 두 곳에 적으면 한 곳만 고쳐진다 */
export function 회차읽기(글) {
  const 덩이 = String(글 ?? '').match(/const (?:온회차|회차) = \[([\s\S]*?)\];/);
  if (!덩이) return [];
  return [...덩이[1].matchAll(/\['(\d{2})',\s*'(trig_[0-9A-Za-z]+)'\]/g)].map((m) => [m[1], m[2]]);
}

/**
 * 「기록」 목록에서 «한 회차 줄»인가.
 * ⛔ 「다음 실행: 오늘 오전 9:00」은 앞으로 할 일이지 한 일이 아니다 — 거른다.
 */
export function 회차줄인가(t) {
  const s = String(t || '').replace(/\s+/g, ' ').trim();
  if (!s || s.length > 60) return false;
  if (/다음 실행|예정/.test(s)) return false;
  return /(오늘|어제|\d+월 \d+일).*(오전|오후) \d+:\d+/.test(s);
}

/** 인자 하나 — ⛔ 값이 없으면 argv[0](노드 경로)를 집지 않게 -1 을 그대로 본다 */
export function 인자(이름, argv = process.argv) {
  const i = argv.indexOf(`--${이름}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 참, 덧 = '') => 것.push({ 이름, 참: !!참, 덧 });

  본다('🔴 「다음 실행」 줄은 회차가 아니다', !회차줄인가('다음 실행: 오늘 오전 9:00'));
  본다('오늘 회차 줄은 잡는다', 회차줄인가('오늘 오전 9:03'));
  본다('어제 회차 줄도 잡는다', 회차줄인가('어제 오후 4:42'));
  본다('⛔ 긴 글은 회차 줄이 아니다', !회차줄인가('x'.repeat(80)));
  본다('⛔ 빈 것에 안 터진다', !회차줄인가(null) && !회차줄인가(''));

  본다('회차 표를 읽는다', 회차읽기("const 온회차 = [['09','trig_abc'],['10','trig_def']];").length === 2);
  본다('⛔ 표가 없으면 빈 것을 낸다', 회차읽기('아무 글').length === 0);

  본다('🔴 값 없는 인자에 노드 경로를 집지 않는다', 인자('글', ['node', '자.mjs', '--글']) === null);
  본다('인자 값을 제대로 집는다', 인자('회차', ['node', '자.mjs', '--회차', '09']) === '09');

  const 진짜 = 회차읽기(fs.readFileSync(path.join(뿌리, 'scripts', 'collect-jbnews-sports-articles.mjs'), 'utf8'));
  본다('🔴 진짜 회차 표가 비어 있지 않다', 진짜.length > 0, `${진짜.length}회차`);

  const 빨강 = 것.filter((x) => !x.참);
  console.log(`■ 시킨다-중부매일-기사 자가시험 ${것.length - 빨강.length}/${것.length}`);
  for (const x of 것) console.log(`  ${x.참 ? '✅' : '🔴'} ${x.이름}${x.덧 ? `  (${x.덧})` : ''}`);
  return 빨강.length === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  const 회차번호 = 인자('회차');
  const 글길 = 인자('글');
  const 찍을곳 = 인자('찍는다');
  if (!회차번호 || !글길) {
    console.error('쓰는 법: node scripts/시킨다-중부매일-기사.mjs --회차 09 --글 <지시문.txt>');
    process.exit(1);
  }
  if (!fs.existsSync(글길)) { console.error(`🔴 지시문 파일이 없다 — ${글길}`); process.exit(1); }
  const 시킬글 = fs.readFileSync(글길, 'utf8').trim();
  if (시킬글.length < 30) { console.error(`🔴 지시문이 너무 짧다 (${시킬글.length}자) — 안 보낸다`); process.exit(1); }

  const 표 = 회차읽기(fs.readFileSync(path.join(뿌리, 'scripts', 'collect-jbnews-sports-articles.mjs'), 'utf8'));
  const 짝 = 표.find(([시]) => 시 === 회차번호);
  if (!짝) { console.error(`🔴 ${회차번호}시 회차가 표에 없다 — 있는 것: ${표.map((x) => x[0]).join(' ')}`); process.exit(1); }
  const TRIG = 짝[1];

  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  let 끝값 = 1;
  try {
    await page.setViewport({ width: 1400, height: 950 });
    await page.goto(`https://claude.ai/scheduled-task/${TRIG}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    for (let i = 0; i < 20; i++) { await 잠깐(2000); if (await page.evaluate(() => /지금 실행/.test(document.body.innerText))) break; }
    await 잠깐(2000);

    const 자리 = await page.evaluate((판정글) => {
      const 꼴 = (0, eval)('(' + 판정글 + ')');
      const 다 = [...document.querySelectorAll('*')].filter((e) => 꼴(e.textContent || ''));
      const 안쪽 = 다.filter((e) => ![...e.children].some((c) => 꼴(c.textContent || '')));
      if (!안쪽.length) return null;
      const e = 안쪽.map((x) => ({ x, r: x.getBoundingClientRect() })).filter((s) => s.r.width > 0)
        .sort((a, z) => a.r.y - z.r.y)[0];
      if (!e) return null;
      e.x.scrollIntoView({ block: 'center' });
      const r = e.x.getBoundingClientRect();
      return { 글: e.x.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, 회차줄인가.toString());
    /* ⛔ 오늘 그 회차가 «아직» 안 돌았으면 시킬 대화가 없다. 고장이 아니다 */
    if (!자리) { console.log(`⬜ ${회차번호}시 회차 기록이 없다 — 그 회차가 아직 안 돌았다. 시키지 못했다`); process.exit(1); }
    console.log(`회차 줄  ${자리.글}`);

    const 앞 = page.url();
    await page.mouse.click(자리.x, 자리.y);
    await 잠깐(9000);
    if (page.url() === 앞) { console.log('🔴 회차 대화가 안 열렸다'); process.exit(1); }
    console.log(`대화     ${page.url()}`);

    /* 리치텍스트 입력칸 — value 를 넣으면 안 먹는다. 눌러서 «친다» */
    const 칸 = await page.$('div[contenteditable="true"]');
    if (!칸) { console.log('🔴 입력칸을 못 찾았다'); process.exit(1); }
    await 칸.click();
    await 잠깐(700);

    /* 🔴 줄바꿈은 전송키다 — Shift+Enter 로 «넣고» 마지막에 Enter 를 한 번만 (위 머리글) */
    const 줄들 = 시킬글.split('\n');
    for (let i = 0; i < 줄들.length; i++) {
      if (i) { await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift'); }
      if (줄들[i]) await page.keyboard.type(줄들[i], { delay: 4 });
    }
    await 잠깐(1200);

    /* ⛔ 「쳤다」를 「들어갔다」로 읽지 않는다 — 칸에 실제로 얼마나 들어갔나를 센다 */
    const 친것 = await page.evaluate(() => document.querySelector('div[contenteditable="true"]')?.innerText ?? '');
    const 들어간비율 = 친것.replace(/\s/g, '').length / 시킬글.replace(/\s/g, '').length;
    if (들어간비율 < 0.9) {
      console.log(`🔴 글이 덜 들어갔다 (${Math.round(들어간비율 * 100)}%) — 보내지 않는다. 토막으로 나가느니 서는 것이 낫다`);
      process.exit(1);
    }
    console.log(`친 글    ${친것.length}자 (${Math.round(들어간비율 * 100)}%)`);

    await page.keyboard.press('Enter');
    await 잠깐(6000);

    /* 눈으로 확인한다 — 내 말이 «한 덩이로» 올라갔나 */
    const 올랐나 = await page.evaluate(() => {
      const n = [...document.querySelectorAll('[data-testid="user-message"]')];
      return n.length ? n[n.length - 1].innerText.replace(/\s+/g, ' ').trim() : null;
    });
    if (!올랐나) { console.log('🔴 내 말이 대화에 안 보인다'); process.exit(1); }
    console.log(`✅ 시켰다 — 한 덩이 ${올랐나.length}자`);
    끝값 = 0;
    if (찍을곳) await page.screenshot({ path: 찍을곳 });
  } finally { await page.close(); b.disconnect(); }
  process.exit(끝값);
}
