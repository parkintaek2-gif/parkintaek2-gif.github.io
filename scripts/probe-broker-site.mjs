#!/usr/bin/env node
/**
 * probe-broker-site.mjs — **증권사 리서치 화면의 «실제» 주소 구조를 잰다.**
 *
 *   node scripts/probe-broker-site.mjs https://www.kiwoom.com/ --누른다 "투자정보,기업/산업분석,기업분석"
 *   node scripts/probe-broker-site.mjs https://www.kiwoom.com/            그냥 열어서 본다
 *   node scripts/probe-broker-site.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-09 19:2x · 5번) ──────────────────────────────────
 * 수집기(`collect-broker-direct.mjs`)에 어댑터가 «두 곳»뿐이다 — 미래에셋·한양.
 * 우리 아카이브에 리포트가 있는 곳은 13곳이고, **애널리스트 이름은 직접수집에서만 온다.**
 * 「누가 맞혔나」 상품이 이름을 필요로 하니 어댑터를 늘리는 것이 임계 자리다.
 *
 * ⛔ 그런데 `docs/증권사-홈페이지-확인표.md` 머리에 벽이 적혀 있다 —
 *   「홈페이지가 전부 JS 로 그리는 구조라 받아 보면 빈 껍데기가 온다」. 사실이다.
 *   WebFetch 로 키움 리서치를 열면 메뉴가 전부 `javascript:void(0)` 다.
 * ⭐ **사장님 크롬(9222)으로 붙으면 넘어간다.** 확인표를 쓸 때는 없던 길이다.
 *   사장님이 「내 창 건드려도 됨」이라 하셨고, 실제 브라우저라 JS 가 다 돈다.
 *
 * ── ⛔ 이 자가 지키는 것 — 어기면 사고다 ───────────────────────────────────
 * ```
 * ⛔ b.close() 를 부르지 않는다 — 사장님이 쓰시던 창이 통째로 닫힌다. disconnect() 로 떨어진다
 * ⛔ 언제나 «새 탭»에서 본다. 사장님 탭을 빼앗지 않는다
 * ⛔ 비밀번호·토큰을 읽거나 어디로 보내지 않는다. 화면과 그 화면의 «자료»만 본다
 * ⛔ 주소를 «유추»하지 않는다 — 화면에 보이는 것을 눌러서 간다(사장님 지시)
 * 🔴 **호스트가 바뀌면 robots 를 다시 잰다.** 오늘 키움 하나가 세 호스트였다:
 *    www.kiwoom.com → www3.kiwoom.com → bbn.kiwoom.com
 * ⛔ robots 를 «못 읽으면» 손대지 않는다 (대신증권은 robots.txt 가 400 이다)
 * ```
 *
 * ⚠ 이 자는 «재는» 자다. 자료를 모으지 않는다. 모으는 것은 collect-broker-direct.mjs 몫이고,
 *   그 파일 주석이 못박아 둔 것을 지킨다 — 「실제로 받아 보고 확인한 곳만 넣는다」.
 */
import { createRequire } from 'node:module';

/** 사장님 크롬 붙는 주소 — ⛔ 새로 띄우지 않는다. 이미 켜진 창에 «붙는다» */
export const 붙는곳 = 'http://127.0.0.1:9222';

/** 리서치와 관련 있어 보이는 주소·글자만 고른다 */
export function 리서치같나(글) {
  return /research|리서치|리포트|report|Anal|기업분석|산업분석/i.test(String(글 ?? ''));
}

/** 눌러 볼 글자 목록을 인자에서 읽는다. 쉼표로 가른다 */
export function 누를것들(인자들) {
  const i = (인자들 ?? []).indexOf('--누른다');
  if (i < 0) return [];
  return String(인자들[i + 1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

/** 자료 문일 만한 응답인가 — 화면이 «뒤에서» 부르는 것이 진짜 문일 때가 많다 */
export function 자료문같나(주소) {
  const u = String(주소 ?? '');
  if (!u) return false;
  if (/\.(js|css|png|jpe?g|gif|svg|woff2?|ico)(\?|$)/i.test(u)) return false; // 껍데기 자원
  return /(json|ajax|Ajax|AJAX|List|list|Anal|report|Report)/.test(u);
}

/** 호스트만 뽑는다 — 호스트가 바뀌면 robots 를 다시 재야 하므로 */
export function 호스트(주소) {
  try { return new URL(String(주소)).host; } catch { return null; }
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
function 자가시험() {
  let 흠 = 0;
  const 검 = (말, 참) => { if (!참) { 흠 += 1; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };

  검('9222 에 «붙는» 주소다 (새로 띄우지 않는다)', 붙는곳 === 'http://127.0.0.1:9222');
  검('리서치 글자를 알아본다', 리서치같나('기업분석') && 리서치같나('/research/list'));
  검('⛔ 아무 글자나 리서치로 보지 않는다', !리서치같나('고객센터'));
  검('⛔ 빈 것도 견딘다', !리서치같나(null) && !리서치같나(''));

  검('누를 것을 쉼표로 가른다', (() => {
    const r = 누를것들(['x', '--누른다', '투자정보, 기업분석']);
    return r.length === 2 && r[1] === '기업분석';
  })());
  검('--누른다 가 없으면 빈 목록', 누를것들(['x']).length === 0 && 누를것들(null).length === 0);

  검('🔴 AJAX 문을 알아본다 (오늘 키움에서 이걸로 찾았다)',
    자료문같나('https://bbn.kiwoom.com/SHomeFrontListAjax'));
  검('⛔ 껍데기 자원(js·png)을 자료 문으로 세지 않는다',
    !자료문같나('https://x/app/library/json3.min.js?2023') && !자료문같나('https://x/a.png'));
  검('⛔ 빈 것도 견딘다 (자료문)', !자료문같나(null) && !자료문같나(''));

  검('호스트를 뽑는다 — 바뀌면 robots 를 다시 잰다',
    호스트('https://www3.kiwoom.com/h/main') === 'www3.kiwoom.com');
  검('⛔ 주소가 아니면 null (0 이나 빈 글자로 안 만든다)',
    호스트('그냥글자') === null && 호스트(null) === null);

  console.log(`\n증권사 화면 탐침 — 자가시험 ${흠 ? '🔴 흠 ' + 흠 + '개' : '전부 통과'}`);
  return 흠;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

const 열주소 = process.argv[2];
if (!열주소 || !/^https?:\/\//.test(열주소)) {
  console.error('⛔ 열 주소를 주십시오 — node scripts/probe-broker-site.mjs https://www.kiwoom.com/');
  console.error('   ⚠ 그 호스트의 robots.txt 를 «먼저» 재십시오. 못 읽으면 손대지 않습니다.');
  process.exit(1);
}
if (자가시험()) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');

const b = await puppeteer.connect({ browserURL: 붙는곳, defaultViewport: null });
const page = await b.newPage();   // ⭐ 언제나 새 탭
const 거쳐간호스트 = new Set();
const 자료문 = new Set();
page.on('framenavigated', (f) => { if (f === page.mainFrame()) { const h = 호스트(f.url()); if (h) 거쳐간호스트.add(h); } });
page.on('response', (r) => { if (자료문같나(r.url())) 자료문.add(`${r.status()} ${r.url().slice(0, 160)}`); });

try {
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(열주소, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));

  for (const 말 of 누를것들(process.argv)) {
    const 눌렀나 = await page.evaluate((m) => {
      const 같나 = (e) => (e.textContent || '').trim().replace(/\s+/g, '') === m.replace(/\s+/g, '');
      const 것 = [...document.querySelectorAll('a,button,span,li')].filter(같나);
      const e = 것.find((x) => x.offsetParent !== null) || 것[0];
      if (!e) return false;
      e.click(); return true;
    }, 말);
    console.log(`클릭 「${말}」 → ${눌렀나 ? '눌렀다' : '⚠ 못 찾았다'}`);
    await new Promise((r) => setTimeout(r, 2200));
  }
  await new Promise((r) => setTimeout(r, 2500));

  console.log(`\n■ 지금 주소  ${page.url()}`);
  console.log(`■ 거쳐 간 호스트 ${거쳐간호스트.size}개 — 🔴 각각 robots 를 다시 재십시오`);
  for (const h of 거쳐간호스트) console.log(`   · ${h}`);
  console.log(`\n■ 화면이 뒤에서 부른 것 ${자료문.size}개 — 목록이 여기서 올 수 있습니다`);
  for (const u of [...자료문].slice(0, 15)) console.log(`   · ${u}`);

  const 링크 = await page.evaluate(() => {
    const 것 = [];
    for (const a of document.querySelectorAll('a[href], tr[onclick], td[onclick]')) {
      const h = a.getAttribute('href') || a.getAttribute('onclick') || '';
      if (!h || h === '#' || /^javascript:void/i.test(h)) continue;
      const t = (a.textContent || '').trim().replace(/\s+/g, ' ');
      if (t.length > 4 && t.length < 100) 것.push({ t: t.slice(0, 60), h: h.slice(0, 130) });
    }
    return 것.slice(0, 20);
  });
  console.log(`\n■ 화면에 «실제로» 있는 링크 ${링크.length}개 (javascript:void 는 뺐다)`);
  for (const x of 링크) console.log(`   「${x.t}」  ${x.h}`);
  console.log('\n⛔ 여기서 주소를 «유추해» 어댑터에 넣지 않습니다. 위 자료 문을 눌러서 확인하십시오.');
} finally {
  await page.close();
  b.disconnect();   // ⛔ b.close() 가 아니다 — 사장님 창이 닫힌다
}
