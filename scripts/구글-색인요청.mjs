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
 * ── 🔴🔴 [2026-10-09 · 5번] 속성을 못 박아 둔 탓에 하루 몫 열 개를 통째로 버렸다 ──
 * 이 자는 **속성을 `sc-domain:klifemap.ai` 로 못 박아** 두고 있었다(아래 24줄 경고 그대로).
 * 그런데 나는 2026-10-08 에 `날마다-색인요청.mjs` 를 고쳐 **seoulmarkets 주소를 맨 앞으로**
 * 당겼다. 두 가지가 겹치자 — klifemap 속성에서 seoulmarkets 주소를 검사하게 되어
 * **단추가 아예 안 나왔다.** 10-09 아침 열 건이 전부 「못찾음」이다.
 *   ⛔ 「한쪽을 고치면 인용한 곳까지 따라간다」를 내가 어겼다. 경고가 주석에 **적혀 있었는데도**
 *     말로만 있는 규칙이라 안 걸렸다.
 *   ⭐ 그래서 속성을 «주소에서 끌어낸다». 사람이 기억해서 맞추는 구조를 없앤다.
 *
 * 쓰는 법
 *   node scripts/구글-색인요청.mjs <주소> [주소...]
 *   node scripts/구글-색인요청.mjs --자가시험
 */
import puppeteer from 'puppeteer-core';

/**
 * 주소 → 서치콘솔 속성. **도메인 속성(sc-domain)** 으로 본다.
 * ⛔ `www.` 는 뗀다 — 도메인 속성은 www 를 따로 두지 않는다.
 * ⛔ 못 읽는 주소에 기본값을 몰래 넣지 않는다. null 을 내고 부르는 쪽이 「못 쟀다」로 적는다.
 */
export function 속성구하기(주소) {
  let 호스트;
  try { 호스트 = new URL(String(주소)).hostname.toLowerCase(); } catch { return null; }
  if (!호스트) return null;
  const 벗긴것 = 호스트.replace(/^www\./, '');
  if (!벗긴것.includes('.')) return null;
  return 'sc-domain:' + 벗긴것;
}

/** 속성이 같은 것끼리 묶는다. 속성을 못 구한 것은 따로 낸다 */
export function 속성별묶기(주소들) {
  const 묶음 = new Map();
  const 못구함 = [];
  for (const u of 주소들 ?? []) {
    const s = 속성구하기(u);
    if (!s) { 못구함.push(u); continue; }
    if (!묶음.has(s)) 묶음.set(s, []);
    묶음.get(s).push(u);
  }
  return { 묶음, 못구함 };
}

export const 속성주소 = (속성) =>
  'https://search.google.com/search-console?resource_id=' + encodeURIComponent(속성);

if (process.argv.includes('--자가시험')) {
  const 것 = []; const 다 = (이름, 참) => 것.push({ 이름, 참: !!참 });
  다('klifemap 주소 → klifemap 속성', 속성구하기('https://klifemap.ai/all') === 'sc-domain:klifemap.ai');
  다('🔴 seoulmarkets 주소 → seoulmarkets 속성', 속성구하기('https://seoulmarkets.com/data') === 'sc-domain:seoulmarkets.com');
  다('www 는 뗀다', 속성구하기('https://www.kculturewire.com/x') === 'sc-domain:kculturewire.com');
  다('주소가 아니면 null — 기본값을 몰래 안 쓴다', 속성구하기('그냥글') === null);
  다('빈 것도 null', 속성구하기(null) === null);
  다('속성별로 묶는다', (() => {
    const { 묶음 } = 속성별묶기(['https://klifemap.ai/a', 'https://seoulmarkets.com/b', 'https://klifemap.ai/c']);
    return 묶음.size === 2 && 묶음.get('sc-domain:klifemap.ai').length === 2;
  })());
  다('못 구한 것은 따로 낸다', 속성별묶기(['아무거나']).못구함.length === 1);
  다('속성 주소를 제대로 만든다', 속성주소('sc-domain:klifemap.ai').endsWith('sc-domain%3Aklifemap.ai'));
  const 진 = 것.filter((x) => !x.참);
  console.log(`구글 색인요청 — 자체 점검 ${것.length - 진.length}/${것.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

const 것들 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!것들.length) {
  console.log('⛔ 쓰는 법: node scripts/구글-색인요청.mjs <주소> [주소...]');
  process.exit(1);
}
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const p = await b.newPage();
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
const { 묶음, 못구함 } = 속성별묶기(것들);
for (const u of 못구함) console.log(`■ ${u}\n   ⬜ 주소에서 속성을 못 구했다 — 안 넣는다`);
try {
 for (const [속성, 주소들] of 묶음) {
  /* 🔴 속성마다 한 번씩 연다 — 한 속성 화면에서 다른 사이트 주소를 검사하면
     「색인 생성 요청」 단추가 아예 안 나온다. 그것이 10-09 의 열 건이다. */
  console.log(`\n── 속성 ${속성} — ${주소들.length}개`);
  await p.goto(속성주소(속성), { waitUntil: 'networkidle2', timeout: 90000 });
  await 잠깐(4000);
  for (const u of 주소들) {
    const 칸 = await p.$('input[aria-label*="검사"], input[placeholder*="검사"], input[type="text"]');
    if (!칸) { console.log(`🔴 ${속성} — 검사 입력칸을 못 찾았다. 이 속성은 건너뛴다`); break; }
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
 }
} finally { await p.close(); b.disconnect(); }
