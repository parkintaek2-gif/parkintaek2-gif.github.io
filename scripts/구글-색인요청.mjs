#!/usr/bin/env node
/**
 * 구글-색인요청.mjs — **서치콘솔에서 「색인 생성 요청」을 눌러 준다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 사장님 — 「**케이라리프맵 방문자가 0명이라고? … 방문자를 빨리 만들고 늘려**」
 *
 * klifemap.ai 는 구글 검색에서 **28일 노출 0 · 클릭 0** 이었다. 사이트맵 2,918장은
 * 구글이 읽었고(오류 0) robots 도 열려 있는데 **홈 한 장만** 색인돼 있었다.
 * 구글은 IndexNow 를 안 쓰고, Indexing API 는 채용·라이브스트림만 받는다 —
 * 남은 길은 **서치콘솔 화면의 「색인 생성 요청」 단추**뿐이고 그것은 사람 손이다.
 *
 * ⛔ 그 손을 사장님께 빌리지 않는다. 공용 크롬(9222)에 붙어 내가 누른다.
 * ⚠ 처음에 검사 주소를 «유추해서» 넣었다가 404 를 받았다 —
 *   사장님 (수십 번) 「**주소를 지어내지 말고 화면의 링크를 눌러라**」. 그대로 한다:
 *   서치콘솔을 열고 → 화면이 주는 검사 입력칸에 주소를 치고 → 나온 단추를 누른다.
 *
 * ⚠ 구글은 하루 요청 수를 제한한다. 「한도 초과」가 뜨면 그대로 적고 멈춘다 —
 *   눌렀다고 색인되는 것도 아니다. 「대기열에 추가」까지가 우리가 할 수 있는 전부다.
 * ⛔ 사장님 창을 닫지 않는다 — disconnect() 만. 내가 연 탭만 닫는다.
 *
 * 쓰는 법
 *   node scripts/구글-색인요청.mjs <주소> [주소...]
 *   ⚠ 지금은 klifemap.ai 속성에 걸려 있다. 다른 사이트는 속성 주소를 바꿔야 한다.
 */
const 것들 = process.argv.slice(2);
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const p = await b.newPage();
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await p.goto('https://search.google.com/search-console?resource_id=sc-domain%3Aklifemap.ai',
    { waitUntil: 'networkidle2', timeout: 90000 });
  await 잠깐(4000);
  for (const u of 것들) {
    const 칸 = await p.$('input[aria-label*="검사"], input[placeholder*="검사"], input[type="text"]');
    if (!칸) { console.log('🔴 검사 입력칸을 못 찾았다'); break; }
    await 칸.click({ clickCount: 3 });
    await 칸.type(u, { delay: 15 });
    await p.keyboard.press('Enter');
    await 잠깐(12000);
    /* 「색인 생성 요청」이라고 쓰인 것을 눌러 본다 */
    const 눌렀나 = await p.evaluate(() => {
      const 것 = [...document.querySelectorAll('span,div,button')]
        .filter((e) => /^색인 생성 요청$/.test((e.textContent || '').trim()));
      if (!것.length) return false;
      것[0].click();
      return true;
    });
    if (!눌렀나) { console.log(`■ ${u}\n   ⬜ 「색인 생성 요청」 단추를 못 찾았다`); continue; }
    await 잠깐(25000);
    const 글 = await p.evaluate(() => document.body.innerText);
    const 줄 = 글.split('\n').map((s) => s.trim()).filter(Boolean)
      .filter((l) => /요청|대기열|추가|한도|초과|오류/.test(l)).slice(0, 4);
    console.log(`■ ${u}\n   ${줄.join(' / ') || '눌렀는데 알림을 못 읽었다'}`);
    await 잠깐(3000);
  }
} finally { await p.close(); b.disconnect(); }
