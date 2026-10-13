#!/usr/bin/env node
/**
 * 다음카페-로그인한다.mjs — **다음(카카오)에 로그인한다.**
 *
 * ── 🔴 왜 (2026-10-06 00:3x · 5번) ───────────────────────────────────
 *   사장님: 「**언제까지 검색에 우리 것이 잘 노출되는 걸 기다려야 하냐?**」
 *
 *   실측으로 가른 것 —
 *   ```
 *   KLifeMap 28일 진짜 손님 60명
 *     다음 카페   37명 (62%)  ← 그중 36명이 /mansecalendar.html 한 장으로 들어온다
 *     네이버      12명
 *     구글         1명
 *   도구 지면 /mansecalendar.html 423명 가운데 385명은 «우리가 누른 것»이다.
 *   오늘 고친 /ilzin.html 은 28일에 «0명»이다.
 *   ```
 *   ⇒ 우리 사이트에 날마다 오는 진짜 손님은 두 명 남짓이고, 그 가운데 한 명이
 *     **카페에서 만세력을 보러 온다.** 그 카페가 지금 유일하게 도는 문이다.
 *
 * ── ⚠ 네이버는 접었다 ───────────────────────────────────────────────
 *   그림 문제 둘을 풀어 넘겼지만 **두 번 연속 떴다** — 자동화를 감지했다는 신호다.
 *   더 두드리면 계정이 잠기고 그것은 사업 피해다. 내 판단으로 거기서 멈췄다.
 *   ⛔ 「뚫을 수 있다」와 「뚫어도 된다」는 다르다.
 *
 * ── 걸음 ────────────────────────────────────────────────────────────
 *   `--본다`   지금 로그인돼 있나 (아무것도 안 누른다)
 *   `--연다`   로그인 화면을 열고 저장된 자격으로 단추를 누른다
 *
 * ⛔ 비밀번호 값을 읽지도 찍지도 않는다. 크롬에 저장된 것이 채워진다.
 * ⛔ 주소를 지어내지 않는다 — 화면의 「로그인」을 눌러서 간다.
 * ⛔ b.close() 금지 · 새 탭만 · 「연다」는 탭을 안 닫는다.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

/** 카카오 로그인 화면인가 */
export function 로그인화면인가(글) {
  return /Kakao 계정 정보 입력|간편로그인|카카오계정으로 로그인/.test(String(글 ?? ''));
}

/** 내 카페 목록이 보이나 */
export function 들어갔나(글) {
  const t = String(글 ?? '');
  if (로그인화면인가(t)) return false;
  return /내가 가입한 카페|가입한 카페|내 카페 목록|즐겨찾는 카페/.test(t);
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통과 = 0; let 깨짐 = 0;
  const 본다 = (말, 참) => { if (참) { 통과++; console.log(`  ✅ ${말}`); } else { 깨짐++; console.log(`  🔴 ${말}`); } };

  console.log('\n■ 다음 카페 로그인 — 자가시험\n');
  /* 🔴 실제로 긁은 글 그대로 */
  본다('🔴 카카오 로그인 화면을 알아본다',
    로그인화면인가('Kakao 계정 정보 입력 비밀번호 입력 간편로그인 정보 저장 도움말 보기'));
  본다('   그 화면이면 «안 들어간 것»이다',
    !들어갔나('Kakao 계정 정보 입력 비밀번호 입력 간편로그인'));
  본다('내 카페 목록이 보이면 들어간 것이다', 들어갔나('내가 가입한 카페 전체보기'));
  본다('⛔ 빈 글에도 안 터진다', !들어갔나(null) && !로그인화면인가(null));
  본다('⛔ 첫 화면 글자에 안 속는다 — 「내카페」는 로그아웃에도 있다',
    !들어갔나('메뉴 바로가기 내카페 바로가기 인기글 바로가기 로그인'));

  console.log(`\n  통과 ${통과} · 깨짐 ${깨짐}\n`);
  return 깨짐 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────── */
const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
}

if (내가실행됐다) {
  const puppeteer = createRequire(import.meta.url)('puppeteer-core');
  const 걸음 = process.argv.includes('--연다') ? '연다' : '본다';

  let b = null;
  try {
    b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  } catch (e) {
    console.log('⚠ 크롬(9222)에 못 붙었다 — ' + String(e.message).slice(0, 60));
    process.exit(0);
  }

  const 닫을탭 = [];
  try {
    const p = await b.newPage();
    if (걸음 === '본다') 닫을탭.push(p);          /* ⛔ 「연다」는 탭을 둔다 */
    await p.setViewport({ width: 1200, height: 900 });

    /* ⛔ 주소를 지어내지 않는다 — 첫 화면에서 「내카페」를 눌러서 간다 */
    await p.goto('https://cafe.daum.net/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));

    const 내카페 = await p.evaluate(() => {
      const a = [...document.querySelectorAll('a')]
        .find((x) => /^내\s?카페$/.test((x.innerText || '').trim()) && x.href);
      return a ? a.href : null;
    });
    if (!내카페) { console.log('🔴 「내카페」 링크를 못 찾았다'); process.exit(1); }

    await p.goto(내카페, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3500));
    const 글 = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 500));

    if (들어갔나(글)) {
      console.log('✅ 다음 카페에 로그인돼 있다');
      console.log('   ' + 글.slice(0, 160));
      process.exit(0);
    }
    if (!로그인화면인가(글)) {
      console.log('⚠ 아는 화면이 아니다 — 사람이 한 번 본다');
      console.log('   ' + 글.slice(0, 200));
      process.exit(0);
    }

    console.log('🔴 로그인 안 돼 있다 — 카카오 로그인 화면이다');
    if (걸음 === '본다') { console.log('   ⇒ --연다 로 돌리면 저장된 자격으로 단추를 누른다'); process.exit(0); }

    /* 저장된 자격이 채워져 있나 */
    const 채워졌나 = await p.evaluate(() => {
      const id = document.querySelector('input[name="loginId"], input[type="email"], input[type="text"]');
      const pw = document.querySelector('input[type="password"]');
      return Boolean(id && id.value) && Boolean(pw && pw.value);
    });
    console.log('■ 저장된 자격 — ' + (채워졌나 ? '채워져 있다' : '🔴 안 채워졌다'));
    if (!채워졌나) {
      console.log('   ⛔ 비밀번호를 내가 넣지 않는다. 여기서 멈춘다');
      await p.screenshot({ path: 'tmp/_다음로그인.png', fullPage: false });
      console.log('   그림 — tmp/_다음로그인.png (탭은 열어 둔다)');
      process.exit(0);
    }

    const 눌렀나 = await p.evaluate(() => {
      const 단추 = [...document.querySelectorAll('button, input[type="submit"]')]
        .find((e) => /^로그인$/.test((e.innerText || e.value || '').trim()) && e.offsetParent !== null);
      if (!단추) return false;
      단추.click();
      return true;
    });
    console.log('■ 로그인 단추 — ' + (눌렀나 ? '눌렀다' : '🔴 못 찾았다'));
    await new Promise((r) => setTimeout(r, 9000));

    const 뒤 = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
    console.log('■ 간 곳 — ' + p.url().slice(0, 80));
    console.log('■ 화면 — ' + 뒤.slice(0, 180));
    await p.screenshot({ path: 'tmp/_다음로그인.png', fullPage: false });
    console.log('   그림 — tmp/_다음로그인.png');
  } finally {
    for (const p of 닫을탭) { try { await p.close(); } catch { /* 내가 연 것만 */ } }
    await b.disconnect();                     /* ⛔ close() 가 아니다 */
  }
}
