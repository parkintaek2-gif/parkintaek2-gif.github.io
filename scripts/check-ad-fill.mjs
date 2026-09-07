#!/usr/bin/env node
/**
 * check-ad-fill.mjs — 광고가 «실제로 채워지나»를 재고, 막힌 자리를 이름으로 가른다
 * ─────────────────────────────────────────────────────────────────────────────
 * [왜 있나 · 2026-09-07 5번]
 *   사장님 상시 지시: 「백년지도, 케이컬쳐와이어: **광고 수입도 있게 해라**」
 *
 *   오늘 klifemap 에서 «광고가 CSP 로 막혀 노출 0» 이던 것을 잡았다. 화면에는 아무
 *   오류도 안 뜨고 그냥 비어 있었다. 그래서 우리 세 사이트도 같은 자로 재 봤다 —
 *
 *     로더 O · sdk O · 칸 1개 · **채워짐 0 · 안채워짐 1 · 높이 0** (네 지면 모두)
 *
 *   ⭐ 까닭은 «두 겹»이었다. 하나만 보고 결론내면 틀린다 —
 *     1. src/consts.ts 의 slots 가 **빈 문자열**이다 → data-ad-slot="" 로 나간다
 *     2. 애드센스 계정(pub-3547185342873229)이 **아직 심사 중**이다
 *        (「사이트의 광고 게재 가능 여부 검토 중 · 모든 단계를 완료했습니다」)
 *        ⇒ 승인 전에는 광고 «단위»를 만들 수 없어 1번을 고칠 방법이 없다
 *
 *   ⚠ 네 사이트는 다 등록돼 있다 — 100yearmap.com · seoulmarkets.com ·
 *     kculturewire.com · klifemap.ai (2026-09-07 계정 화면에서 눈으로 확인).
 *     ads.txt 도 셋 다 200 이다. 즉 «우리가 할 일은 다 해 둔 상태»다.
 *
 *   ⛔ 그러니 지금의 「안채워짐」은 **결함이 아니다.** 재지 않고 「광고가 안 나온다,
 *      고쳐야 한다」로 적으면 다음 세션이 없는 결함을 파게 된다.
 *   ✅ 승인이 나면 이 자가 «단위없음»으로 바뀐다. 그때 단위를 만들어 slots 를 채운다.
 *
 * [쓰는 법]
 *   node scripts/check-ad-fill.mjs --시험만      판정 논리만 잰다 (브라우저 없이)
 *   node scripts/check-ad-fill.mjs               라이브 세 사이트를 브라우저로 잰다
 *
 * ⚠ 라이브 모드는 사장님 크롬(9222)에 붙는다. «새 탭»을 쓰고 disconnect 로 뗀다 —
 *   close() 를 부르면 사장님이 쓰시던 창이 통째로 닫힌다.
 */

/** 애드센스 계정 심사 상태를 화면 글에서 읽는다. 못 읽으면 null — 0 으로 안 채운다 */
export function 심사중인가(화면글) {
  if (typeof 화면글 !== 'string' || !화면글.trim()) return null;
  return /광고 게재 가능 여부 검토 중|검토 중|under review|being reviewed/i.test(화면글);
}

/**
 * 한 지면의 광고 상태를 «이름 붙은 등급»으로 가른다.
 * ⭐ 순서가 중요하다 — 바깥 원인(태그·막힘)부터 보고, 그다음 우리 설정, 마지막이 계정이다.
 */
export function 판정({ 로더, sdk, 칸수, 채워짐, 안채워짐, 슬롯비었나, 심사중 }) {
  if (!로더) return { 등급: '태그없음', 까닭: '지면이 애드센스 스크립트를 아예 안 부른다' };
  if (sdk !== 'object') {
    return { 등급: '막힘', 까닭: '스크립트 태그는 있는데 sdk 가 안 떴다 — CSP·차단기·네트워크를 본다' };
  }
  if (채워짐 > 0) return { 등급: '벌고있다', 까닭: `${채워짐}칸이 실제로 채워졌다` };
  if (슬롯비었나) {
    if (심사중 === true) {
      return { 등급: '심사중', 까닭: '단위 id 가 비었지만 계정이 심사 중이라 «만들 수도 없다» — 기다린다' };
    }
    if (심사중 === false) {
      return { 등급: '단위없음', 까닭: '승인은 났는데 단위 id 가 비었다 — 지금 단위를 만들어 slots 를 채운다' };
    }
    return { 등급: '못쟀다', 까닭: '단위 id 는 비었는데 계정 심사 상태를 못 읽었다' };
  }
  if (칸수 === 0) return { 등급: '칸없음', 까닭: 'sdk 는 떴는데 지면에 광고 칸이 하나도 없다' };
  if (심사중 === true) return { 등급: '심사중', 까닭: '단위는 있으나 계정이 심사 중이라 안 채워진다' };
  if (안채워짐 > 0) {
    return { 등급: '안채워짐', 까닭: '단위도 있고 승인도 났는데 구글이 광고를 안 준다 — 며칠 본다' };
  }
  return { 등급: '못쟀다', 까닭: '어느 갈래에도 안 맞는다 — 잰 값을 그대로 남긴다' };
}

/** 등급이 «지금 손을 대야 하는 것»인가 */
export function 손대야하나(등급) {
  return ['태그없음', '막힘', '단위없음', '칸없음'].includes(등급);
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
function 시험() {
  const 것 = [];
  const 재본다 = (이름, 실제, 기대) => 것.push([이름, JSON.stringify(실제), JSON.stringify(기대)]);
  const 기본 = { 로더: true, sdk: 'object', 칸수: 1, 채워짐: 0, 안채워짐: 1, 슬롯비었나: false, 심사중: false };

  재본다('태그가 없으면 태그없음', 판정({ ...기본, 로더: false }).등급, '태그없음');
  재본다('sdk 가 안 뜨면 막힘', 판정({ ...기본, sdk: 'undefined' }).등급, '막힘');
  재본다('채워졌으면 벌고있다', 판정({ ...기본, 채워짐: 2 }).등급, '벌고있다');
  재본다('⭐ 막힘이 채워짐보다 «앞»이다 — sdk 가 없는데 채워질 수 없다',
    판정({ ...기본, sdk: 'undefined', 채워짐: 2 }).등급, '막힘');
  재본다('슬롯 비고 심사중이면 심사중', 판정({ ...기본, 슬롯비었나: true, 심사중: true }).등급, '심사중');
  재본다('슬롯 비고 승인났으면 단위없음', 판정({ ...기본, 슬롯비었나: true, 심사중: false }).등급, '단위없음');
  재본다('⭐ 슬롯 비고 심사 상태를 «못 읽으면» 못쟀다 — 0 으로 안 채운다',
    판정({ ...기본, 슬롯비었나: true, 심사중: null }).등급, '못쟀다');
  재본다('칸이 0이면 칸없음', 판정({ ...기본, 칸수: 0, 안채워짐: 0 }).등급, '칸없음');
  재본다('단위 있고 심사중이면 심사중', 판정({ ...기본, 심사중: true }).등급, '심사중');
  재본다('단위 있고 승인났고 안채워짐이면 안채워짐', 판정(기본).등급, '안채워짐');
  재본다('⭐ 2026-09-07 에 실측한 우리 상태 = 심사중',
    판정({ 로더: true, sdk: 'object', 칸수: 1, 채워짐: 0, 안채워짐: 1, 슬롯비었나: true, 심사중: true }).등급,
    '심사중');
  재본다('⭐ 승인이 나는 날 같은 값이 «단위없음»으로 바뀐다',
    판정({ 로더: true, sdk: 'object', 칸수: 1, 채워짐: 0, 안채워짐: 1, 슬롯비었나: true, 심사중: false }).등급,
    '단위없음');
  재본다('⛔ 심사중은 손댈 것이 아니다', 손대야하나('심사중'), false);
  재본다('단위없음은 손댈 것이다', 손대야하나('단위없음'), true);
  재본다('막힘은 손댈 것이다', 손대야하나('막힘'), true);
  재본다('칸없음은 손댈 것이다', 손대야하나('칸없음'), true);
  재본다('벌고있다는 손댈 것이 아니다', 손대야하나('벌고있다'), false);
  재본다('⭐ 못쟀다는 손댈 것이 아니다 — 먼저 다시 잰다', 손대야하나('못쟀다'), false);
  재본다('안채워짐도 손댈 것이 아니다 — 우리가 할 것이 없다', 손대야하나('안채워짐'), false);

  재본다('심사중 글을 읽는다', 심사중인가('사이트의 광고 게재 가능 여부 검토 중'), true);
  재본다('영문도 읽는다', 심사중인가('Your site is being reviewed'), true);
  재본다('승인 화면은 false', 심사중인가('사이트 승인됨 · 광고 게재 중'), false);
  재본다('⭐ 빈 글은 null 이다 — 「심사 안 중」으로 읽지 않는다', 심사중인가(''), null);
  재본다('공백만 있어도 null', 심사중인가('   '), null);
  재본다('글이 아니면 null', 심사중인가(undefined), null);

  let 흠 = 0;
  for (const [이름, 실제, 기대] of 것) {
    if (실제 !== 기대) { 흠++; console.log(`  ⛔ ${이름} — 나온 것 ${실제} · 기대 ${기대}`); }
  }
  console.log(흠 ? `⛔ 자가시험 ${것.length}개 중 ${흠}개 실패` : `✅ 자가시험 ${것.length}개 통과`);
  return 흠;
}

/* ── 라이브로 재기 ────────────────────────────────────────────────────── */
const 볼곳 = [
  ['KCW 홈', 'https://www.kculturewire.com/'],
  ['백년지도 홈', 'https://100yearmap.com/'],
  ['서울마켓 홈', 'https://seoulmarkets.com/'],
];

async function 라이브() {
  const { createRequire } = await import('node:module');
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const fs = await import('node:fs');

  /* 슬롯이 비었나는 «우리 저장소»에서 읽는다 — 화면을 안 믿는다 */
  const 소스 = fs.readFileSync(new URL('../src/consts.ts', import.meta.url), 'utf8');
  const 슬롯줄 = (소스.match(/slots:\s*\{[^}]*\}/) || [''])[0];
  const 슬롯비었나 = /banner:\s*''/.test(슬롯줄) || /inArticle:\s*''/.test(슬롯줄);
  console.log(`우리 설정 — ${슬롯줄.replace(/\s+/g, ' ')}  ⇒ 슬롯비었나=${슬롯비었나}`);

  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  let 심사중 = null;
  try {
    const c = await page.target().createCDPSession();
    await c.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.setViewport({ width: 1280, height: 1000 });

    /* 계정 심사 상태를 먼저 읽는다 — 화면만 보고 «자료»만 다룬다 */
    try {
      await page.goto('https://adsense.google.com/adsense/u/0/pub-3547185342873229/onboarding',
        { waitUntil: 'networkidle2', timeout: 90000 });
      await new Promise((r) => setTimeout(r, 6000));
      심사중 = 심사중인가(await page.evaluate(() => document.body.innerText || ''));
    } catch (e) { console.log('⚠ 계정 화면을 못 읽었다 —', String(e).slice(0, 70)); }
    console.log(`애드센스 계정 — 심사중=${심사중 === null ? '못 읽음' : 심사중}`);

    let 손댈것 = 0;
    for (const [이름, 주소] of 볼곳) {
      try {
        await page.goto(주소, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise((r) => setTimeout(r, 7000));
        const 잰것 = await page.evaluate(() => {
          const 칸 = [...document.querySelectorAll('ins.adsbygoogle')];
          return {
            로더: !!document.querySelector('script[src*="googlesyndication"]'),
            sdk: typeof window.adsbygoogle,
            칸수: 칸.length,
            채워짐: 칸.filter((e) => e.getAttribute('data-ad-status') === 'filled').length,
            안채워짐: 칸.filter((e) => e.getAttribute('data-ad-status') === 'unfilled').length,
          };
        });
        const p = 판정({ ...잰것, 슬롯비었나, 심사중 });
        const 표 = 손대야하나(p.등급) ? '🔴' : (p.등급 === '벌고있다' ? '✅' : '⬜');
        console.log(`${표} ${이름.padEnd(12)} ${p.등급.padEnd(6)} — ${p.까닭}`);
        console.log(`     잰 것: 로더=${잰것.로더 ? 'O' : 'X'} sdk=${잰것.sdk} 칸=${잰것.칸수} 채워짐=${잰것.채워짐} 안채워짐=${잰것.안채워짐}`);
        if (손대야하나(p.등급)) 손댈것++;
      } catch (e) { console.log(`⛔ ${이름} — ${String(e).slice(0, 70)}`); }
    }
    console.log(손댈것
      ? `\n🔴 지금 손대야 하는 자리 ${손댈것}곳`
      : `\n⬜ 지금 손댈 것 없다. ${심사중 === true
          ? '애드센스 승인을 기다린다 — 승인되면 이 자가 «단위없음»으로 바뀐다'
          : '위 등급을 그대로 읽는다'}`);
    return 손댈것;
  } finally {
    await page.close().catch(() => {});
    b.disconnect();
  }
}

const 시험만 = process.argv.includes('--시험만');
if (시험()) process.exit(1);
if (!시험만) {
  const n = await 라이브();
  process.exit(n ? 1 : 0);
}
