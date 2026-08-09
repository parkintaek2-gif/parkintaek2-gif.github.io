#!/usr/bin/env node
/**
 * 🛒 **데려온 다음이 먼가** — 짧은 주소로 들어온 사람이 「살 수 있는 데」까지 **몇 번 누르나**.
 *
 * ## 🔴 왜 (2026-08-10 06:25 · 2번 지시)
 *
 *   *「주소를 만든 것은 사람을 **데려오는** 데까지입니다. 데려온 다음이 멀면
 *     227명이 0명이 된 것과 똑같은 일이 한 칸 뒤에서 또 납니다」*
 *
 * ## ⚠ 「살 수 있는 데」를 이렇게 못 박는다 — **재기 전에 정한다**
 *
 *   ```
 *   도착점 = 「9,900」과 「지역 한 벌」이 **한 지면에** 있는 곳
 *   ```
 *   ⛔ `/terms`·`/refund` 도 9,900 을 적지만 **파는 자리가 아니다.** 그래서 낱말 하나로 안 가른다.
 *   ⚠ 지금은 그 지면에 「곧 엽니다」가 떠 있다. **살 수 있는 화면은 아직 없다**(개봉날-3번.md).
 *     그래서 이 자가 재는 것은 **「값을 보는 데까지」**다. 그 이상을 재는 척하지 않는다.
 *
 * ## ⛔ 눈으로 세지 않는다 — 두 걸음으로 잰다
 *
 *   ```
 *   ① 찾기   진짜 크롬 390px 에서 **눈에 보이는** 링크만 따라 너비 우선으로 훑는다
 *            (숨은 링크·화면 밖 링크는 손님이 못 누른다 → 안 센다)
 *   ② 밟기   찾은 길을 **실제로 눌러서** 다시 간다. 못 누르면 그 길은 없는 길이다
 *   ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { 짧은주소들, 물음표뗀곳 } = await import('../src/lib/short-links.ts');

const 크롬 = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
/* ⚠ 윈도 절대경로를 그대로 import 하면 「protocol 'c:'」로 거부한다. `file:///` 를 붙인다 */
const 퍼펫 = 'file:///C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

/**
 * 도착점인가 — **파는 칸(`.pricebox`)이 서 있고 그 안에 값이 있나.**
 *
 * 🔴 처음엔 「`9,900` 과 `지역 한 벌` 이 한 지면에」로 잡았다. **틀렸다.**
 *   ```
 *   /price          「지역 한 벌」 · 9,900원        ✅ 잡혔다
 *   /report/area/…  「이 한 벌은 9,900원입니다」    🔴 못 잡았다 — 「지역」이 안 적혀 있다
 *   ```
 *   그래서 넷 다 「3칸 안에 없음」이 나왔다. **길이 먼 게 아니라 자가 눈이 나빴다.**
 * ⛔ 낱말로 가르지 않는다. **파는 칸이라는 구조**로 가른다 —
 *   `/terms`·`/refund` 도 9,900 을 적지만 파는 칸이 없다(실측: pricebox 0개).
 *
 * @param {{글:string, 파는칸:string|null}} 본것
 */
export function 살수있는데냐(본것, 목표 = '파는칸') {
  const 칸 = 본것?.파는칸;
  if (typeof 칸 !== 'string' || !/9,900/.test(칸)) return false;
  /* ⚠ **두 가지를 가른다.** 값을 보는 데와, 살 물건이 놓인 데는 다르다 —
   *   `/price` 는 「9,900원입니다」까지고, 손님이 살 **그 지역 한 벌**은 아직 고르지 않았다 */
  if (목표 === '한벌') return /^\/report\/area\//.test(본것?.길 ?? '');
  return true;
}

/** 우리 지면 안의 길인가 — 밖으로 나가는 것·닻·내려받기는 안 센다 */
export function 우리길이냐(주소, 여기) {
  if (!주소) return false;
  if (/^(mailto:|tel:|javascript:|#)/i.test(주소)) return false;
  try {
    const u = new URL(주소, 여기);
    return u.origin === new URL(여기).origin && !/\.(pdf|csv|json|xml|png|jpg|webp)$/i.test(u.pathname);
  } catch { return false; }
}

/* ── 자가시험 ── */
if (process.argv.includes('--자가시험')) {
  const 결과 = [];
  const 잰다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });
  잰다('① 파는 칸에 값이 있으면 도착점이다', 살수있는데냐({ 글: 'x', 파는칸: '이 한 벌은 9,900원입니다' }));
  잰다('② 「지역」이라 안 적혀도 도착점이다 — 지역 한 벌 지면이 그렇다',
    살수있는데냐({ 글: 'x', 파는칸: '이 한 벌은 9,900원입니다' }));
  잰다('③ 파는 칸이 없으면 본문에 값이 있어도 도착점이 아니다',
    !살수있는데냐({ 글: '환불 규정 · 9,900원', 파는칸: null }));
  잰다('④ 파는 칸이 있어도 값이 없으면 도착점이 아니다', !살수있는데냐({ 글: 'x', 파는칸: '곧 엽니다' }));
  잰다('⑤ 우리 길을 통과시킨다', 우리길이냐('/price', 'http://x/100y/a'));
  잰다('⑥ 밖으로 나가는 길은 안 센다', !우리길이냐('https://klifemap.ai/x', 'http://x/100y/a'));
  잰다('⑦ 닻은 안 센다', !우리길이냐('#top', 'http://x/100y/a'));
  잰다('⑧ 내려받기는 안 센다', !우리길이냐('/data/x.csv', 'http://x/100y/a'));
  잰다('⑨ 빈 주소는 안 센다', !우리길이냐('', 'http://x/100y/a'));
  잰다('⑩ 짧은 주소 넷을 다 잰다', 짧은주소들.length >= 4);
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  const 진 = 결과.filter((r) => !r.참).length;
  console.log(`\n자가시험 ${결과.length - 진}/${결과.length}`);
  process.exitCode = 진 ? 1 : 0;
} else {
  const 인자 = process.argv.slice(2);
  /* 🔴 `indexOf` 는 없으면 **-1** 이다. 그대로 +1 하면 **맨 앞 인자**를 값으로 집는다 —
   *   `--너비 390` 만 주었더니 여기가 「--너비」가 됐다. 없으면 없다고 해야 한다 */
  const 값 = (이름, 기본) => {
    const i = 인자.indexOf(이름);
    return i === -1 || i + 1 >= 인자.length ? 기본 : 인자[i + 1];
  };
  /* ⚠ 기본이 **도메인 이름**이다. 접두사(`/100y`)를 손으로 붙이지 않는다 — 아래 까닭을 본다 */
  const 여기 = String(값('--여기', 'http://100yearmap.com:4399')).replace(/\/$/, '');
  const 너비 = Number(값('--너비', 390));
  const 깊이 = Number(값('--깊이', 4));
  /* `파는칸` = 9,900 을 **보는** 데까지 · `한벌` = 그 지역 한 벌이 **놓인** 데까지 */
  const 목표 = String(값('--목표', '파는칸'));

  let 못잰다 = false;

  const { default: puppeteer } = await import(퍼펫);
  /**
   * 🔴 **여기서도 자가 거짓말을 했다** — 「셋 다 3칸 안에 없음」이 나왔는데 거짓이었다.
   *
   *   ```
   *   /100y  는 **한 인스턴스가 세 사이트를 서비스하려고 안에서만 쓰는 접두사**다.
   *   지면 안의 링크는 `/price` 라고만 적혀 있다 (라이브에서 그게 맞다).
   *   그런데 로컬을 `127.0.0.1:4399/100y` 로 열면
   *   `/price` 가 `127.0.0.1:4399/price` 로 풀린다 → **404**. 길이 거기서 끊긴다.
   *   ```
   * ⭐ 그래서 **크롬한테 도메인 이름을 그대로 쓰게 하고**, 그 이름만 127.0.0.1 로 보낸다.
   *   서버가 Host 를 보고 접두사를 붙이므로 **라이브와 똑같이** 걷게 된다.
   * ⛔ 링크를 우리가 손으로 고쳐 재지 않는다 — 고쳐 재면 손님이 겪는 것과 달라진다.
   */
  const 이름 = new URL(여기).hostname;
  const 브라우저 = await puppeteer.launch({
    executablePath: 크롬,
    headless: 'new',
    args: ['--no-sandbox', `--host-resolver-rules=MAP ${이름} 127.0.0.1`],
  });

  {
    /* 재기 전에 「잴 것이 있나」부터 본다.
     * 여섯 세션이 `dist` 를 같이 쓴다 — 남이 다시 짓는 사이에 재면 지면이 반쯤만 있다.
     * ⛔ 실제로 넷 다 「3칸 안에 없음」이 나왔고, 까닭은 길이 먼 게 아니라 지면이 20장뿐이어서였다 */
    const 볼장 = await 브라우저.newPage();
    const 막힌것 = [];
    for (const 것 of 짧은주소들) {
      let 상태 = 0;
      try { 상태 = (await 볼장.goto(`${여기}${물음표뗀곳(것.가는곳)}`, { waitUntil: 'domcontentloaded' }))?.status() ?? 0; }
      catch { 상태 = 0; }
      if (상태 !== 200) 막힌것.push(`${상태} ${decodeURIComponent(물음표뗀곳(것.가는곳))}`);
    }
    await 볼장.close();
    if (막힌것.length) {
      console.error('\n⛔ **아직 못 잰다** — 도착지가 200 이 아니다. 남이 다시 짓는 중일 수 있다.');
      for (const s of 막힌것) console.error(`   · ${s}`);
      console.error('   ⚠ 「누름이 멀다」로 적지 않는다. 다 지어진 뒤에 다시 잰다.');
      process.exitCode = 2;
      못잰다 = true;
    }
  }

  if (!못잰다) {

  /** 그 지면에서 **눈에 보이는** 링크만 걷어 온다 */
  async function 보이는링크(장, 주소) {
    await 장.goto(주소, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const 글 = await 장.evaluate(() => document.body.innerText);
    /* ⛔ 낱말이 아니라 **파는 칸**을 본다. 없으면 null 이다 */
    const 파는칸 = await 장.evaluate(() => document.querySelector('.pricebox')?.innerText ?? null);
    const 길 = await 장.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .filter((a) => {
          const r = a.getBoundingClientRect();
          const s = getComputedStyle(a);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
        })
        .map((a) => ({ href: a.getAttribute('href'), 말: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 40) })),
    );
    return { 글, 파는칸, 길, 길이름: new URL(주소).pathname };
  }

  const 장 = await 브라우저.newPage();
  await 장.setViewport({ width: 너비, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  const 표 = [];
  for (const 것 of 짧은주소들) {
    const 시작 = `${여기}${물음표뗀곳(것.가는곳).replace(/^\/$/, '/')}`;
    const 본것 = new Set();
    let 답 = null;

    /* ① 찾기 — 너비 우선 */
    const 줄 = [{ 주소: 시작, 길: [] }];
    본것.add(new URL(시작).pathname);
    while (줄.length && !답) {
      const 이번 = 줄.shift();
      if (이번.길.length > 깊이) break;
      let 본 = null;
      try { 본 = await 보이는링크(장, 이번.주소); } catch { continue; }
      if (살수있는데냐({ ...본, 길: 본.길이름 }, 목표)) { 답 = 이번; break; }
      for (const l of 본.길) {
        if (!우리길이냐(l.href, 이번.주소)) continue;
        const u = new URL(l.href, 이번.주소);
        if (본것.has(u.pathname)) continue;
        본것.add(u.pathname);
        줄.push({ 주소: u.href, 길: [...이번.길, { 말: l.말, 곳: u.pathname }] });
      }
    }

    /* ② 밟기 — 찾은 길을 **실제로 눌러서** 다시 간다 */
    let 밟음 = '못 밟음';
    if (답) {
      if (답.길.length === 0) 밟음 = '누를 것 없음(도착지가 곧 그곳)';
      else {
        try {
          await 장.goto(시작, { waitUntil: 'domcontentloaded' });
          for (const 칸 of 답.길) {
            const 잡 = await 장.evaluateHandle((곳) =>
              [...document.querySelectorAll('a[href]')].find((a) => new URL(a.href, location.href).pathname === 곳), 칸.곳);
            const el = 잡.asElement();
            if (!el) throw new Error(`못 찾음 ${칸.곳}`);
            await Promise.all([장.waitForNavigation({ waitUntil: 'domcontentloaded' }), el.click()]);
          }
          const 끝 = { 파는칸: await 장.evaluate(() => document.querySelector('.pricebox')?.innerText ?? null), 길: new URL(장.url()).pathname };
          밟음 = 살수있는데냐(끝, 목표) ? '✅ 눌러서 도착' : '🔴 눌렀는데 딴 곳';
        } catch (e) { 밟음 = `🔴 ${String(e?.message ?? e).slice(0, 60)}`; }
      }
    }

    표.push({ 키: 것.키, 도착지: 물음표뗀곳(것.가는곳), 누름: 답 ? 답.길.length : null, 길: 답?.길 ?? [], 밟음 });
  }

  await 브라우저.close();

  console.log(`\n🛒 짧은 주소 → 「9,900원 지역 한 벌」까지  (너비 ${너비}px · 최대 ${깊이}칸)\n`);
  for (const r of 표) {
    console.log(`${r.누름 === null ? '🔴' : '✅'} /y/${r.키}`);
    console.log(`     도착지  ${decodeURIComponent(r.도착지)}`);
    console.log(`     누름    ${r.누름 === null ? `**${깊이}칸 안에 없음**` : `**${r.누름}번**`}`);
    for (const [i, c] of r.길.entries()) console.log(`       ${i + 1}. 「${c.말}」 → ${decodeURIComponent(c.곳)}`);
    console.log(`     밟아 봄 ${r.밟음}\n`);
  }
  fs.writeFileSync(path.join(뿌리, 'out', `100y-누름-${목표}-${너비}.json`), JSON.stringify(표, null, 1), 'utf8');
  console.log(`out/100y-누름-${목표}-${너비}.json 에 적어 뒀다`);
  }
  /* ⛔ 못 재고 끝날 때도 크롬을 닫는다. 안 닫으면 크롬이 살아 남아 다음 창까지 쌓인다 */
  if (브라우저.connected ?? true) await 브라우저.close().catch(() => {});
}
