#!/usr/bin/env node
/**
 * measure-kcw-live-doors.mjs — **손님이 실제로 온 지면에서 어디로 갈 문이 있나.** (5번, 2026-08-24)
 *
 * ── 왜 이 자가 생겼나 ────────────────────────────────────────
 * 🔴 오늘 하루에 **같은 실수를 네 번** 했다. 전부 「엉뚱한 그릇을 본 것」이다 —
 * ```
 * 회사가 3곳이라고 셌다        실제 199곳   (자료의 배열을 짐작해 찾았다)
 * 지면 없는 작품이 4편이라 셌다  실제 417편   (같은 짓)
 * 카드뉴스가 0개라고 셌다       실제 105장   (남의 방 public/cardnews 를 봤다)
 * 집 지면에 커뮤니티 문이 없다   실제로 있다   (dist/wikitip/index.html 을 찾았다 — 그 이름이 아니다)
 * ```
 * 네 번째가 이 자를 만든 까닭이다. **`dist` 안의 파일 이름을 주소로부터 짐작하면 틀린다** —
 * `build.format: 'file'` · `public/` 복사 · 정적 빌더가 섞여 있어서 규칙이 하나가 아니다.
 *
 * ⭐ 그래서 **짐작하지 않고 라이브에 직접 묻는다.** 손님이 받는 것이 답이다.
 *   느리지만(지면마다 한 번씩 HTTP) 틀리지 않는다. 틀린 빠름보다 맞는 느림이 낫다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **지면 목록을 손으로 적지 않는다.** `src/data/kcw-dwell.json` 에서 **사람이 실제로
 *   열어 본 지면**을 열림 순으로 가져온다. 아무도 안 오는 지면의 문을 세는 것은 헛일이다.
 * ⛔ **못 받은 지면을 「문이 없다」로 세지 않는다.** 200 이 아니면 「못 쟀다」다.
 *   그 둘을 섞는 것이 오늘 네 번 한 실수의 뿌리다.
 * ⛔ 「문이 있으면 좋다」고 판정하지 않는다. **주제에 맞아야** 문이다 — 맞는지는 이 자가
 *   못 정한다. 세어서 보여 주고, 어디에 낼지는 사람이 지면마다 본다.
 *
 * 쓰는 법
 *   node scripts/measure-kcw-live-doors.mjs --selftest
 *   node scripts/measure-kcw-live-doors.mjs --잰다
 *   node scripts/measure-kcw-live-doors.mjs --잰다 --문=/community,/weeks --장수=20
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 밑주소 = 'https://www.kculturewire.com';
const 직접불렸나 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/* ── 판단하는 함수들. 여기만 자가시험한다 ────────────────────── */

/** 기본으로 세는 문들. ⛔ 손으로 적는 목록이지만 **무엇을 세는지**는 명시한다 */
export const 기본문 = ['/community', '/weeks', '/titles', '/articles', '/netflix-top10-data'];

/**
 * 지면에서 **본문만** 남긴다 — 머리말·꼬리말·둘러보기를 걷어 낸다.
 *
 * 🔴 처음에 `<main>` 안만 봤다. 그런데 우리 지면은 `<main>` 을 안 쓴다 —
 *   `<body>` → `<div class="site">`(머리말) + `<div class="wrap">`(본문) + `<footer>` 다.
 *   ⭐ 그때 이 자가 **거짓 0 을 내지 않고 「못 쟀다」로 멈췄다.** 만든 목적 그대로였다.
 *   ⛔ 그러니 「main 이 없으면 body 전체를 본다」로 눙치지 않는다. 걷어 낼 것을 걷어 낸다.
 * ⚠ 머리말·꼬리말 링크는 **모든 지면에 있다.** 그것을 세면 모든 지면이 「문이 있다」로
 *   나오고 세는 뜻이 사라진다. 오늘 그 함정을 실제로 밟았다.
 */
export function 본문만(html) {
  if (typeof html !== 'string' || !html) return null;
  const b = html.match(/<body[\s\S]*<\/body>/i);
  if (!b) return null;                       /* body 가 없다 — 못 쟀다 */
  return b[0]
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    /* 머리말이 `<div class="site">` 로 오는 지면이 있다 — 그 덩어리도 걷는다 */
    .replace(/<div class="site"[\s\S]*?<\/div>/i, ' ');
}

/**
 * 한 지면에서 그 문이 **본문 안에** 있나.
 * ⛔ 본문을 못 가리면 0 이 아니라 `null`(못 쟀다)이다.
 */
export function 본문안문(html, 문) {
  const 안 = 본문만(html);
  if (안 === null) return null;
  return (안.match(new RegExp(`href="${문.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) ?? []).length;
}

/**
 * 결과 한 줄. 200 이 아니면 문 수를 내지 않는다.
 * ⛔ 「못 받았다」와 「문이 없다」를 갈라 적는다 — 이 자가 생긴 까닭이 그것이다.
 */
export function 한줄판정(상태, html, 문들) {
  if (상태 !== 200) return { 꼴: '못쟀다', 왜: `HTTP ${상태}` };
  const 셈 = {};
  let main없음 = false;
  for (const 문 of 문들) {
    const n = 본문안문(html, 문);
    if (n === null) { main없음 = true; 셈[문] = null; } else 셈[문] = n;
  }
  if (main없음) return { 꼴: '못쟀다', 왜: 'main 을 못 찾았다', 셈 };
  return { 꼴: '쟀다', 셈 };
}

/** 접는다. ⛔ 「못 쟀다」를 「문 0」에 더하지 않는다 */
export function 모아세기(줄들, 문들) {
  const 표 = {};
  for (const 문 of 문들) 표[문] = { 있음: 0, 없음: 0, 못쟀다: 0 };
  for (const r of 줄들 ?? []) {
    for (const 문 of 문들) {
      if (r.꼴 !== '쟀다' || r.셈?.[문] === null || r.셈?.[문] === undefined) 표[문].못쟀다 += 1;
      else if (r.셈[문] > 0) 표[문].있음 += 1;
      else 표[문].없음 += 1;
    }
  }
  return 표;
}

/**
 * MSYS 경로 변환에 망가진 `--문` 값을 골라낸다.
 * 🔴 이 자가 실제로 이것에 물렸다 — `--문=/community` 가 `C:/Program Files/Git/community`
 *   로 바뀌어 「문 있음 0 · 없음 14」라는 **거짓 수**를 냈다. 거짓 수를 막으려고 만든 자가
 *   거짓 수를 낸 것이다. 그래서 판단을 함수로 빼고 자가시험으로 굳힌다.
 */
export function 망가진문(문들) {
  return (문들 ?? []).filter((f) => typeof f !== 'string'
    || !f.startsWith('/') || /^[A-Za-z]:/.test(f) || f.includes('Program Files'));
}

/** 사람이 실제로 열어 본 지면을 열림 순으로. ⛔ 목록을 손으로 적지 않는다 */
export function 온지면(dwell, 장수) {
  const 줄 = (dwell?.pages ?? []).filter((r) => (r.views ?? 0) > 0);
  return 줄.sort((a, b) => b.views - a.views).slice(0, 장수).map((r) => ({ 길: r.path, 열림: r.views }));
}

if (직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  const 좋은 = '<html><body><header><a href="/community">h</a></header>'
    + '<main><p><a href="/weeks">w</a><a href="/weeks">w2</a></p></main>'
    + '<footer><a href="/community">f</a></footer></body></html>';
  /* 🔴 머리말·꼬리말 링크를 세면 모든 지면이 「문이 있다」로 나온다 — 뜻이 없어진다 */
  참('본문 안만 센다', 본문안문(좋은, '/weeks') === 2);
  참('머리말 링크는 안 센다', 본문안문(좋은, '/community') === 0);
  참('빈 글은 못 쟀다', 본문안문('', '/weeks') === null);
  참('글이 아니면 못 쟀다', 본문안문(null, '/weeks') === null);
  참('body 가 없으면 못 쟀다', 본문안문('<div><a href="/weeks">w</a></div>', '/weeks') === null);

  /* 🔴 우리 지면의 실제 꼴 — main 이 없고 div.site + div.wrap + footer 다 */
  const 우리꼴 = '<body><div class="site"><a href="/community">masthead</a></div>'
    + '<div class="wrap"><p><a href="/community">in the body</a></p></div>'
    + '<footer><a href="/community">foot</a></footer></body>';
  참('main 이 없어도 본문을 가린다', 본문안문(우리꼴, '/community') === 1);
  참('머리말 div.site 링크는 안 센다', !본문만(우리꼴).includes('masthead'));
  참('꼬리말 링크는 안 센다', !본문만(우리꼴).includes('foot'));
  참('본문 링크는 남는다', 본문만(우리꼴).includes('in the body'));
  참('nav 도 걷는다', 본문안문('<body><nav><a href="/weeks">n</a></nav><p>x</p></body>', '/weeks') === 0);
  /* ⛔ 비슷한 주소에 속지 않는다. ⚠ 이 시험은 처음에 `<body>` 를 안 넣어서
       「못 쟀다(null)」가 나왔고, 그걸 0 으로 기대해 실패했다 — 시험이 틀렸던 것이다. */
  참('/weeks 와 /weeks-x 를 안 섞는다',
    본문안문('<body><a href="/weeks-x">x</a></body>', '/weeks') === 0);

  참('200 이 아니면 못 쟀다', 한줄판정(404, 좋은, ['/weeks']).꼴 === '못쟀다');
  참('못 쟀으면 까닭을 적는다', 한줄판정(500, 좋은, ['/weeks']).왜 === 'HTTP 500');
  참('200 이면 센다', 한줄판정(200, 좋은, ['/weeks']).셈['/weeks'] === 2);
  /* ⚠ 뜻이 바뀐 자리다 — 예전엔 `<main>` 이 없으면 못 쟀다였다. 이제는 `<body>` 를
       가리면 재고, 문이 없으면 «있는데 0» 이다. body 자체가 없을 때만 못 쟀다다. */
  참('body 를 가리면 재고, 문이 없으면 0 이다',
    한줄판정(200, '<body>x</body>', ['/weeks']).셈['/weeks'] === 0);
  참('body 가 없으면 못 쟀다로 낸다',
    한줄판정(200, '<div>x</div>', ['/weeks']).꼴 === '못쟀다');

  /* 🔴 이것이 이 자의 핵 — 못 쟀다를 문 0 에 더하면 오늘의 실수를 되풀이한다 */
  const 줄들 = [
    { 꼴: '쟀다', 셈: { '/weeks': 1 } },
    { 꼴: '쟀다', 셈: { '/weeks': 0 } },
    { 꼴: '못쟀다', 왜: 'HTTP 404' },
  ];
  const 표 = 모아세기(줄들, ['/weeks']);
  참('있음을 센다', 표['/weeks'].있음 === 1);
  참('없음을 센다', 표['/weeks'].없음 === 1);
  참('못쟀다를 따로 센다', 표['/weeks'].못쟀다 === 1);
  참('셋을 더하면 전체다', 표['/weeks'].있음 + 표['/weeks'].없음 + 표['/weeks'].못쟀다 === 3);
  참('빈 목록도 안 죽는다', 모아세기(null, ['/weeks'])['/weeks'].있음 === 0);

  const d = { pages: [{ path: '/a', views: 5 }, { path: '/b', views: 50 }, { path: '/c', views: 0 }] };
  참('열림 많은 순으로 뽑는다', 온지면(d, 2)[0].길 === '/b');
  참('열림이 0 인 지면은 안 뽑는다', !온지면(d, 9).some((x) => x.길 === '/c'));
  참('장수를 지킨다', 온지면(d, 1).length === 1);
  참('빈 값도 안 죽는다', 온지면(null, 5).length === 0);

  참('기본문에 커뮤니티가 있다', 기본문.includes('/community'));

  /* 🔴 MSYS 경로 변환 — 이 자가 실제로 이것에 물려 거짓 수를 냈다. 검사로 굳힌다 */
  참('윈도 경로를 망가진 것으로 본다', 망가진문(['C:/Program Files/Git/community']).length === 1);
  참('드라이브 글자를 잡는다', 망가진문(['D:/x']).length === 1);
  참('슬래시로 시작하지 않으면 잡는다', 망가진문(['community']).length === 1);
  참('제대로 된 주소는 통과', 망가진문(['/community', '/weeks']).length === 0);
  참('빈 목록도 안 죽는다', 망가진문(null).length === 0);

  console.log(`라이브 문을 재는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (직접불렸나 && process.argv.includes('--잰다')) {
  const 장수 = Number(process.argv.find((a) => a.startsWith('--장수='))?.split('=')[1]) || 25;
  const 문들 = (process.argv.find((a) => a.startsWith('--문='))?.split('=')[1] ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  /**
   * 🔴 2026-08-24 — `--문=/community` 를 주었더니 Git Bash 의 MSYS 경로 변환이 그것을
   *   `C:/Program Files/Git/community` 로 바꿨고, 이 자가 **「문 있음 0 · 없음 14」라는
   *   거짓 수를 냈다.** 배포는 실제로 나갔는데 안 나간 것처럼 보였다.
   * ⛔ 거짓 수를 내지 않으려고 만든 자가 거짓 수를 냈다. 다른 자에는 이미 있던 방어인데
   *   새 자에 안 넣었다 — 「하나를 고치면 인용한 곳까지 따라간다」를 새 자에도 적용한다.
   * ⛔ 되돌려 고쳐 주지 않는다. **멈춘다.** 잘못 되돌리면 남의 주소를 재게 된다.
   */
  const 망가진것 = 망가진문(문들);
  if (망가진것.length) {
    console.log('⛔ --문 값이 윈도 경로로 바뀌었다 — MSYS 경로 변환이다:');
    for (const f of 망가진것) console.log(`   ${f}`);
    console.log('   앞에 MSYS_NO_PATHCONV=1 을 붙이거나 PowerShell 에서 돌린다.');
    console.log('   ⛔ 되돌려 고쳐 주지 않는다 — 잘못 되돌리면 남의 주소를 재게 된다.');
    process.exit(1);
  }
  const 볼문 = 문들.length ? 문들 : 기본문;

  const dwellp = path.join(ROOT, 'src', 'data', 'kcw-dwell.json');
  if (!fs.existsSync(dwellp)) {
    console.log('⚠ src/data/kcw-dwell.json 이 없다 — **못 쟀다.**');
    console.log('   먼저: node scripts/measure-kcw-dwell.mjs --잰다 --적는다=src/data/kcw-dwell.json');
    process.exit(1);
  }
  const 볼것 = 온지면(JSON.parse(fs.readFileSync(dwellp, 'utf8')), 장수);
  if (!볼것.length) { console.log('⚠ 열린 지면이 없다 — **못 쟀다**'); process.exit(1); }

  console.log(`사람이 실제로 열어 본 지면 ${볼것.length}장에 **라이브로 직접 물어** 문을 센다`);
  console.log(`⛔ dist 파일 이름을 짐작하지 않는다 — 오늘 그것으로 네 번 틀렸다`);
  console.log(`세는 문: ${볼문.join(' · ')}\n`);

  const 줄들 = [];
  for (const { 길, 열림 } of 볼것) {
    let 상태 = 0; let html = '';
    try {
      const r = await fetch(`${밑주소}${길}`, { redirect: 'follow' });
      상태 = r.status;
      html = await r.text();
    } catch (e) { 상태 = 0; }
    const r = 한줄판정(상태, html, 볼문);
    줄들.push(r);
    const 칸 = 볼문.map((문) => {
      const n = r.꼴 === '쟀다' ? r.셈[문] : null;
      return (n === null || n === undefined ? '못잼' : (n > 0 ? `✅${n}` : '·')).padStart(5);
    }).join('');
    console.log(`${길.slice(0, 40).padEnd(40)} ${String(열림).padStart(5)}${칸}`
      + (r.꼴 === '못쟀다' ? `   ⚠ ${r.왜}` : ''));
  }

  const 표 = 모아세기(줄들, 볼문);
  console.log(`\n## 접은 것 — ⛔ 「못 쟀다」를 「문 0」에 더하지 않았다`);
  console.log(`${'문'.padEnd(24)} ${'있음'.padStart(5)} ${'없음'.padStart(5)} ${'못쟀다'.padStart(7)}`);
  for (const 문 of 볼문) {
    const v = 표[문];
    console.log(`${문.padEnd(24)} ${String(v.있음).padStart(5)} ${String(v.없음).padStart(5)} ${String(v.못쟀다).padStart(7)}`);
  }
  console.log('\n⚠ 이 자는 **세기만 한다.** 문이 있으면 좋다고 판정하지 않는다 —');
  console.log('   주제에 맞아야 문이다. 어디에 낼지는 사람이 지면마다 본다.');
  console.log('   맞지 않는 자리에 문을 뿌리면 홍보가 아니라 스팸이다.');
}

if (직접불렸나 && !process.argv.includes('--잰다') && !process.argv.includes('--selftest')) {
  console.log('⛔ --잰다 나 --selftest 을 준다');
}
