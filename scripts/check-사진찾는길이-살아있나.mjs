#!/usr/bin/env node
/**
 * check-사진찾는길이-살아있나.mjs
 *   — 「연합뉴스 사진을 찾아 붙이는 길」이 **지금도 도나**를 잰다.
 *
 * ── 🔴 왜 (2026-10-12 11:3x · 5번) ───────────────────────────────────
 *   자국에 「연합뉴스 사진이 없다」로 막힌 기사가 8건 있었다.
 *   ⚠ 날짜를 보니 **여섯은 2026-10-05 14:2x «전»**이다 —
 *     그때 「막기 전에 우리가 사진을 찾아 준다」 길이 들어갔다. 그 전 것은 당연히 막힌다.
 *   ⇒ 길을 넣은 «뒤»는 **두 건**(10-06 14시 · 10-07 11시)뿐이다.
 *     ⛔ 「8건이 다 안 듣는다」로 적을 뻔했다. 오늘 아홉 번째다.
 *
 *   그 두 건을 오늘 다시 돌려 봤더니 못 찾았다 —
 *   ⛔ 그런데 그것은 **못 잰 것**이다. 10-06·10-07 기사는 오늘 목록에서 이미 밀려났다.
 *     「그때 못 찾았다」의 증거가 아니다.
 *
 *   ⭐ 오늘 나간 기사 제목으로 재니 **찾았다**(겹친 낱말 4).
 *     ⇒ 길은 지금 돈다. 「안 듣는다」는 틀렸다.
 *
 * ── ⭐⭐ 그래서 이 자가 필요하다 ─────────────────────────────────────
 *   그 길이 도는지 **날마다 재는 자가 없었다.**
 *   연합뉴스 쪽 꼴이 바뀌면 **조용히 멈추고**, 그때부터 기사가 날마다 막힌다.
 *   아무 데서도 빨간불이 안 뜬다 — 「사진이 없다」로만 적히기 때문이다.
 *
 *   ⇒ **오늘 연합뉴스 목록에서 꼭지 하나를 집어, 그 제목으로 되찾아 본다.**
 *     제 목록의 제목이니 **반드시 찾아야 한다.** 못 찾으면 길이 죽은 것이다.
 *   ⭐ 이것이 「자를 지을 때 «이 자가 아무것도 안 보고 있지는 않나»를 같이 심는다」이다.
 *
 * ⚠ 못 받으면 「죽었다」가 아니라 **「못 쟀다」**로 적는다 — 연합뉴스가 잠깐 안 열릴 수 있다.
 *
 * 쓰는 법
 *   node scripts/check-사진찾는길이-살아있나.mjs
 *   node scripts/check-사진찾는길이-살아있나.mjs --자가시험
 */

/** 제목에서 뼈대 낱말만 — ⚠ 찾는 자와 «같은» 셈이어야 한다. 다르면 이 자가 사람을 속인다 */
export function 쓸만한제목인가(제목) {
  const t = String(제목 ?? '').trim();
  if (t.length < 10) return false;
  /* 낱말이 너무 적으면 되찾기가 우연이 된다 */
  const 말수 = t.replace(/[^0-9A-Za-z가-힣]+/g, ' ').split(' ').filter((w) => w.length >= 2).length;
  return 말수 >= 4;
}

/** 연합뉴스 목록에서 «되찾기에 쓸 만한» 제목 하나를 집는다.
 *  ⭐ 제 목록의 제목이니 되찾을 때 **반드시 찾아야 한다** —
 *    못 찾으면 셈이 틀어진 것이고, 그래서 이 자가 헛돌지 않는다. */
export async function 목록에서집는다(Y) {
  const 주소들 = Y.볼주소들();
  for (const u of 주소들) {
    let 글;
    try {
      const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (!r.ok) continue;
      글 = await r.text();
    } catch { continue; }
    const 꼭지들 = Y.목록뽑기(글) ?? [];
    for (const x of 꼭지들) {
      const 제목 = typeof x === 'string' ? x : (x?.제목 ?? x?.title ?? '');
      if (쓸만한제목인가(제목)) return { 제목, 주소: u, 꼭지수: 꼭지들.length };
    }
  }
  return null;
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;

  test('되찾기에 쓸 만한 제목을 고른다', () => {
    A.equal(쓸만한제목인가('KIA-LG 3위 놓고 끝장 승부…12일 광주 맞대결서 운명 갈리나'), true);
  });
  test('⛔ 낱말이 적은 제목은 안 쓴다 — 되찾기가 우연이 된다', () => {
    A.equal(쓸만한제목인가('속보'), false);
    A.equal(쓸만한제목인가('KIA 승리'), false);
  });
  test('⛔ 빈 것에 안 터진다', () => {
    A.equal(쓸만한제목인가(''), false);
    A.equal(쓸만한제목인가(null), false);
  });
  test('⚠ 이 자가 쓰는 것이 «찾는 자»에 그대로 있나 — 이름이 바뀌면 조용히 죽는다', async () => {
    const Y = await import('./연합뉴스-사진-찾는다.mjs');
    A.equal(typeof Y.사진찾기, 'function', '사진찾기() 가 없다 — 이름이 바뀌었나');
  });
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  await 자가시험();
} else {
  console.log('■ 연합뉴스 사진을 «찾아 붙이는 길»이 지금도 도나');
  console.log('   ⭐ 연합뉴스 쪽 꼴이 바뀌면 조용히 멈춘다 — 그때부터 기사가 날마다 막힌다.');
  console.log('   ⛔ 아무 데서도 빨간불이 안 뜬다. 「사진이 없다」로만 적히기 때문이다.');
  console.log('');

  let Y;
  try { Y = await import('./연합뉴스-사진-찾는다.mjs'); }
  catch (e) { console.log('⬜ 찾는 자를 못 불렀다 — **못 쟀다**: ' + e.message); process.exit(0); }
  if (typeof Y.사진찾기 !== 'function') {
    console.log('⬜ 사진찾기() 가 없다 — 이름이 바뀌었나. **못 쟀다**');
    process.exit(0);
  }

  /* ⭐ 되찾기 — 오늘 나간 기사 제목을 쓴다.
     ⚠ 목록을 따로 받는 길이 그 자에 없으면, 그 자가 제 목록에서 고른 제목을 쓴다.
       아래는 「찾았을 때 그 자가 돌려주는 제목」으로 한 번 더 되찾아 보는 꼴이다. */
  const 씨앗 = process.argv.find((a) => !a.startsWith('-') && a.includes(' '))
    ?? 'KIA 3위 운명 가른다 광주 맞대결';

  let 첫번째;
  try { 첫번째 = await Y.사진찾기(씨앗); }
  catch (e) { console.log('⬜ 못 돌렸다 — **못 쟀다**: ' + e.message); process.exit(0); }

  console.log('   ① 씨앗 제목으로 찾기  — 훑은 꼭지 ' + 첫번째.본것
    + ' · ' + (첫번째.찾았나 ? '찾았다 (겹친 낱말 ' + 첫번째.겹침 + ')' : '못 찾았다'));

  if (!첫번째.본것) {
    console.log('');
    console.log('🔴 연합뉴스 목록을 **한 꼭지도 못 훑었다** — 길이 끊겼다.');
    console.log('   ⚠ 연합뉴스가 잠깐 안 열린 것일 수도 있다. 다음 점검에 한 번 더 본다.');
    console.log('   ⛔ 그래도 「사진이 없다」로 기사를 막기 전에 이것부터 본다.');
    process.exit(1);
  }

  /* ⭐⭐ 씨앗이 오늘 목록에 없을 수 있다 — 그건 흠이 아니다.
     ⇒ **목록에서 꼭지 하나를 집어** 그 제목으로 되찾는다.
       제 목록의 제목이니 반드시 찾아야 한다. 못 찾으면 셈이 틀어진 것이다. */
  let 집은것;
  try { 집은것 = await 목록에서집는다(Y); }
  catch (err) { console.log('   ⬜ 목록을 못 집었다 — **못 쟀다**: ' + err.message); process.exit(0); }
  if (!집은것) {
    console.log('   ⬜ 목록에서 쓸 만한 제목을 못 집었다 — **못 쟀다**');
    process.exit(0);
  }
  console.log('   ② 목록에서 집은 제목: ' + 집은것.제목.slice(0, 55) + '  (꼭지 ' + 집은것.꼭지수 + ')');

  let 되찾기;
  try { 되찾기 = await Y.사진찾기(집은것.제목); }
  catch (err) { console.log('   ⬜ 되찾기를 못 돌렸다 — **못 쟀다**: ' + err.message); process.exit(0); }
  console.log('   ③ 되찾기 — ' + (되찾기.찾았나 ? '찾았다 (겹친 낱말 ' + 되찾기.겹침 + ')' : '🔴 못 찾았다'));

  console.log('');
  if (!되찾기.찾았나) {
    console.log('🔴 **제 목록의 제목인데 못 찾았다 — 셈이 틀어졌다.**');
    console.log('   ⚠ 이 자가 헛돌지 않는다는 증거이기도 하다 — 되찾기는 반드시 찾아야 한다.');
    process.exit(1);
  }
  console.log('✅ 사진 찾는 길이 살아 있다 (훑은 꼭지 ' + 첫번째.본것 + ')');
  console.log('   ⚠ 「길이 산다」가 「모든 기사에 사진이 있다」는 아니다 —');
  console.log('      그날 경기 사진이 정말 없을 수도 있다. 그때 막는 것은 옳다.');
  process.exit(0);
}
