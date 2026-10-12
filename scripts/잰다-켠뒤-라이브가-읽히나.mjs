/* 테마를 «켠 뒤» 라이브가 읽히나 — 그림을 뜨고, 안 읽히는 자리를 센다
 *
 *   node scripts/잰다-켠뒤-라이브가-읽히나.mjs --자가시험
 *   node scripts/잰다-켠뒤-라이브가-읽히나.mjs            핵심 화면
 *   node scripts/잰다-켠뒤-라이브가-읽히나.mjs --전부     공개 화면 전부
 *
 * ── 🔴 왜 «새» 자가 필요한가 (2026-10-12 23:2x · 5번) ──────────────────
 *
 * 앞서 쓰던 `check-klifemap-테마가-화면을-깨나.mjs` 는 **테마를 손으로 얹어서** 쟀다.
 * 그런데 사장님 「컬러 켜」로 테마가 **라이브에 실렸다.**
 * ⛔ 그 자를 그대로 돌리면 **테마가 두 번 얹힌다.** 두 번 얹힌 화면은 손님이 보는 화면이 아니다.
 *   ⇒ 이제는 라이브를 «있는 그대로» 재야 한다. 자를 바꾸지 않고 돌리면 거짓이 난다.
 *
 * ⭐ 사장님 — 「배포 후 눈으로 직접 다 확인해봐...안 보이는 게 없는 지」
 *   그래서 이 자는 **수와 그림을 같이 낸다.** 수는 어디를 볼지 알려 줄 뿐이고,
 *   판단은 그림을 본 사람이 한다. 2026-10-12 에 수가 ⚠ 인 첫 화면이 눈으로는 🔴 였다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 터 = 'https://klifemap.ai';
export const 읽힘선 = 70;

/** 밝기 — 사람 눈이 느끼는 밝기에 가깝게 (ITU-R BT.601) */
export function 밝기(c) {
  const m = String(c ?? '').match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  return Math.round((+m[0] * 299 + +m[1] * 587 + +m[2] * 114) / 1000);
}

/**
 * 판정 — 켠 «뒤»의 라이브다. 견줄 「전」이 없으므로 **지금 상태만** 본다.
 * ⛔ 못 쟀으면 ⬜ 다. 0 을 성하다로 읽지 않는다.
 */
export function 판정(안읽힘, 탈 = null) {
  if (탈) return { 빛: '⬜', 말: `못 쟀다 — ${탈}` };
  if (안읽힘 == null) return { 빛: '⬜', 말: '못 쟀다' };
  if (안읽힘 === 0) return { 빛: '✅', 말: '안 읽히는 자리가 없다' };
  if (안읽힘 <= 3) return { 빛: '⚠', 말: `안 읽히는 자리 ${안읽힘}곳 — 그림을 본다` };
  return { 빛: '🔴', 말: `안 읽히는 자리 ${안읽힘}곳` };
}

export function 공개화면들(klifemap뿌리) {
  return fs.readdirSync(path.join(klifemap뿌리, 'public'))
    .filter((n) => n.endsWith('.html'))
    .filter((n) => !/^(404|google[0-9a-f]+|.*verification.*)\.html$/i.test(n))
    .map((n) => ({ 길: '/' + n, 이름: n.replace('.html', ''), 채움: n === 'saju.html' ? '사주' : null }))
    .sort((a, b) => a.길.localeCompare(b.길));
}

export const 훑기본문 = `(() => {
  const 보이는바탕 = (el) => {
    let e = el;
    while (e) {
      const s = getComputedStyle(e);
      const 그림 = s.backgroundImage;
      if (그림 && 그림 !== 'none') {
        const m = 그림.match(/rgba?\\(([^)]+)\\)/);
        if (m) return 'rgb(' + m[1].split(',').slice(0, 3).join(',') + ')';
      }
      const m2 = String(s.backgroundColor).match(/[\\d.]+/g);
      if (m2 && (m2.length < 4 || Number(m2[3]) > 0.5)) return s.backgroundColor;
      e = e.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const 밝기 = (c) => {
    const m = String(c || '').match(/[\\d.]+/g);
    if (!m || m.length < 3) return null;
    return Math.round((+m[0] * 299 + +m[1] * 587 + +m[2] * 114) / 1000);
  };
  const 걸린것 = [];
  for (const e of document.querySelectorAll('button,a,span,div,p,td,th,h1,h2,h3,h4,label,b,strong,li,option')) {
    const 글 = (e.textContent || '').trim();
    if (!글 || e.children.length > 0) continue;
    /* ⛔ 테마가 그린 장식은 본문이 아니다 */
    if (e.closest('#klm-dawn')) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const s = getComputedStyle(e);
    if (s.visibility === 'hidden' || s.opacity === '0' || s.display === 'none') continue;
    const g = 밝기(s.color); const bg = 보이는바탕(e); const bb = 밝기(bg);
    if (g == null || bb == null) continue;
    const 차 = Math.abs(g - bb);
    if (차 < __읽힘선__) {
      걸린것.push({ 글: 글.slice(0, 30), 글자: s.color, 바탕: bg, 차,
        클래스: (e.className || '').toString().slice(0, 50) });
    }
  }
  걸린것.sort((a, b) => a.차 - b.차);
  return {
    수: 걸린것.length,
    보기: 걸린것,                 /* ⛔ 자르지 않는다 — 80곳을 세고 5곳만 보여 준 적이 있다 */
    테마실렸나: !!document.getElementById('klm-dawn'),
    바탕: getComputedStyle(document.body).backgroundColor,
    글자수: (document.body.innerText || '').length,
  };
})()`;

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };

  본다('흰색은 밝기가 높다', 밝기('rgb(255,255,255)') === 255);
  본다('검정은 0', 밝기('rgb(0,0,0)') === 0);
  본다('⬜ 못 읽으면 null — 0 이 아니다', 밝기('없음') === null);

  본다('✅ 0 곳이면 초록불', 판정(0).빛 === '✅');
  본다('⚠ 서너 곳은 그림을 보라고 한다', 판정(2).빛 === '⚠');
  본다('   그 말에 «그림을 본다»가 든다', /그림을 본다/.test(판정(2).말));
  본다('🔴 네 곳 넘으면 빨간불', 판정(9).빛 === '🔴');
  본다('⬜ 못 쟀으면 ⬜ — ⛔ 0 과 다르다', 판정(null).빛 === '⬜');
  본다('⬜ 탈이 나면 ⬜ 이고 까닭을 적는다', 판정(0, '못 받았다').빛 === '⬜');
  본다('   탈이 있으면 0 곳이어도 초록이 아니다', 판정(0, '못 받았다').빛 !== '✅');

  본다('⛔ 보기를 자르지 않는다 — 80곳을 세고 5곳만 보여 준 적이 있다',
    !/걸린것\.slice/.test(훑기본문));
  본다('⛔ 테마 장식(#klm-dawn)은 본문으로 안 센다',
    훑기본문.includes("e.closest('#klm-dawn')"));
  본다('테마가 실렸는지도 함께 낸다 — 안 실린 화면의 0 곳은 뜻이 다르다',
    훑기본문.includes('테마실렸나'));
  본다('⛔ 테마를 손으로 얹지 않는다 — 라이브에 이미 실렸다',
    !/addScriptTag/.test(훑기본문));

  {
    const 가짜 = { readdirSync: () => ['saju.html', '404.html', 'google25daae95a00ba72f.html', 'tarot.html'] };
    const 것 = 가짜.readdirSync().filter((n) => n.endsWith('.html'))
      .filter((n) => !/^(404|google[0-9a-f]+|.*verification.*)\.html$/i.test(n));
    본다('404 와 구글 확인 파일은 안 센다', 것.length === 2);
  }

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
async function 잰다() {
  const 전부 = process.argv.includes('--전부');
  const klifemap = 'C:/Users/User/Documents/GitHub/klifemap';
  const 모두 = 공개화면들(klifemap);
  const 핵심 = ['index', 'saju', 'mingli-gunghap', 'mingli-taekil', 'mingli-sungmyung',
    'horoscope', 'tarot', 'liuyao', 'gwansang', 'pricing'];
  const 화면들 = 전부 ? 모두 : 모두.filter((h) => 핵심.includes(h.이름));
  const 낼곳 = 'C:/Users/User/OneDrive/Desktop/klm-켠뒤-그림/';
  fs.mkdirSync(낼곳, { recursive: true });

  const 훑기 = 훑기본문.replace('__읽힘선__', String(읽힘선));
  const puppeteer = await import('puppeteer-core');
  const b = await puppeteer.default.connect({
    browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 5 * 60_000,
  });
  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  const 줄들 = [];
  try {
    console.log('■ 테마를 «켠 뒤» 라이브 — 화면 ' + 화면들.length + '개\n');
    for (const 화 of 화면들) {
      let 것 = null; let 탈 = null;
      try {
        const page = await b.newPage();
        await page.setViewport({ width: 1366, height: 1000 });
        await page.goto(터 + 화.길, { waitUntil: 'networkidle2', timeout: 60000 });
        await 잠깐(3200);          /* 테마가 색을 바꾸는 것을 기다린다 */
        if (화.채움 === '사주') {
          await page.evaluate(() => {
            const 넣기 = (id, v) => {
              const e = document.getElementById(id);
              if (!e) return;
              e.value = String(v);
              e.dispatchEvent(new Event('input', { bubbles: true }));
              e.dispatchEvent(new Event('change', { bubbles: true }));
            };
            [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === '남성')?.click();
            넣기('msSolarY', 1990); 넣기('msSolarM', 3); 넣기('msSolarD', 15);
            넣기('msHour', 10); 넣기('msMinute', 30);
          });
          await 잠깐(800);
          await page.evaluate(() => document.getElementById('analyzeBtn')?.click());
          await page.waitForFunction(
            () => /[甲乙丙丁戊己庚辛壬癸]/.test(document.getElementById('palaceSection')?.innerText || ''),
            { timeout: 60000, polling: 800 },
          ).catch(() => {});
          await 잠깐(2500);
        }
        것 = await page.evaluate(훑기);
        await page.screenshot({ path: 낼곳 + 화.이름 + '.png' });
        await page.close().catch(() => {});
      } catch (e) {
        탈 = String(e?.message ?? e).slice(0, 60);
      }
      const p = 판정(것?.수 ?? null, 탈);
      줄들.push({ ...화, ...것, 빛: p.빛, 말: p.말, 탈 });
      console.log('  ' + p.빛 + ' ' + 화.이름.padEnd(20)
        + (것?.테마실렸나 === false ? '⬜ 테마가 안 실렸다  ' : '')
        + p.말);
      for (const x of (것?.보기 ?? []).slice(0, 4)) {
        console.log('        차' + String(x.차).padStart(3) + ' "' + x.글 + '"  '
          + x.글자 + ' / ' + x.바탕);
      }
    }
  } finally {
    await b.disconnect();   /* ⛔ close() 가 아니다 */
  }

  const 안실림 = 줄들.filter((r) => r.테마실렸나 === false);
  const 빨강 = 줄들.filter((r) => r.빛 === '🔴');
  const 못잼 = 줄들.filter((r) => r.빛 === '⬜');
  console.log('');
  console.log('■ ✅ 성하다 ' + 줄들.filter((r) => r.빛 === '✅').length
    + ' · ⚠ 살펴볼 곳 ' + 줄들.filter((r) => r.빛 === '⚠').length
    + ' · 🔴 ' + 빨강.length + ' · ⬜ 못 쟀다 ' + 못잼.length);
  console.log('   안 읽히는 자리 합  ' + 줄들.reduce((s, r) => s + (r.수 ?? 0), 0) + '곳');
  if (안실림.length) {
    console.log('   ⬜ 테마가 «안 실린» 화면 ' + 안실림.length + '개 — '
      + 안실림.map((r) => r.이름).join(' · '));
    console.log('      ⛔ 그 화면의 「0곳」은 성한 것이 아니라 «테마가 없는» 것이다');
  }
  console.log('   ⛔ 수가 ✅ 라고 화면이 성한 것이 아니다 — 그림을 본다');
  console.log('   🖼 그림 → ' + 낼곳);

  const 대장 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..',
    'docs', '켠뒤-라이브가-읽히나.tsv');
  const 때 = new Date().toLocaleString('sv-SE').replace('T', ' ');
  const 줄 = 줄들.map((r) => [때, r.이름, r.길, r.수 ?? '', r.빛,
    r.테마실렸나 === false ? '테마없음' : '', r.탈 ?? ''].join('\t')).join('\n');
  fs.appendFileSync(대장,
    (fs.existsSync(대장) ? '' : '잰때\t이름\t길\t안읽힘\t빛\t비고\t탈\n') + 줄 + '\n', 'utf8');
  console.log('   ✔ 대장에 적었다 — docs/켠뒤-라이브가-읽히나.tsv');
  return 빨강.length || 안실림.length ? 1 : 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else process.exit(await 잰다());
}
