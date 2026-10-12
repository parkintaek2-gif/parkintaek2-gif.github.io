/* 머리띠가 깨졌나 — 라이브에서 메뉴가 겹치거나 띠가 부풀었나
 *
 *   node scripts/잰다-머리띠가-깨졌나.mjs --자가시험
 *   node scripts/잰다-머리띠가-깨졌나.mjs            핵심 화면
 *   node scripts/잰다-머리띠가-깨졌나.mjs --전부     공개 화면 전부
 *
 * ── 🔴🔴 왜 이 자가 필요한가 (2026-10-12 23:5x · 5번) ────────────────────
 *
 * 사장님 — 「배포 후 눈으로 직접 다 확인해봐...안 보이는 게 없는 지」
 * 56화면을 그림으로 떠서 보다가 **개인정보처리방침** 한 장이 이상했다.
 *   · 로고가 없다
 *   · 메뉴 글자가 서로 겹친다 — 「궁합」위에 「한국어」, 「코칭」위에 「로그인」
 *   · 띠 높이가 271px — 성한 화면은 68px 이다
 * 이용약관도 같았다. **둘 다 결제 화면에서 손님이 누르는 법적 고지다.**
 *
 * ⛔ 이것을 **대비 재는 자는 영영 못 잡는다.** 글자색과 바탕색은 멀쩡했다.
 *   깨진 것은 «색»이 아니라 «자리»다. 재는 축이 다르면 그 축의 일은 안 보인다.
 *
 * ⚠ 테마 탓인지부터 가렸다 — 테마를 막고 재도 271px·겹침 7 로 똑같았다.
 *   **테마가 «만든» 것이 아니라 «보이게» 한 것이다.** 어두운 꼴에서는 띠가 바탕에 묻혔다.
 *
 * ⭐ 까닭은 `<body class="max-w-2xl mx-auto px-5 py-10">` 였다. 672px 이다.
 *   본문 폭을 재려던 묶음이 **머리띠까지 가뒀다.** 폭을 <main> 으로 옮겨 고쳤다.
 *
 * ⇒ 글로만 갖지 않는다. 이 자로 갖는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 터 = 'https://klifemap.ai';
/* 성한 띠의 높이. 68~69px 로 재 왔다. 두 줄로 접히면 120 을 넘는다. */
export const 띠높이선 = 110;

/**
 * 판정 — 겹침이 하나라도 있으면 깨진 것이다.
 * ⛔ 못 쟀으면 ⬜ 다. 「띠를 못 찾았다」를 「성하다」로 읽지 않는다.
 */
export function 판정(것, 탈 = null) {
  if (탈) return { 빛: '⬜', 말: `못 쟀다 — ${탈}` };
  if (!것 || 것.띠있나 === false) {
    return { 빛: '🔴', 말: '사이트 머리띠가 «없다» — 구글로 들어온 손님이 다른 지면으로 갈 길이 없다' };
  }
  const 흠 = [];
  if (것.겹친수 > 0) 흠.push(`메뉴가 ${것.겹친수}군데 겹친다`);
  if (것.띠높이 > 띠높이선) 흠.push(`띠가 ${것.띠높이}px 로 부풀었다 (성한 띠는 68px)`);
  if (것.로고있나 === false) 흠.push('로고가 없다');
  if (흠.length) return { 빛: '🔴', 말: 흠.join(' · ') };
  return { 빛: '✅', 말: `띠 ${것.띠높이}px · 칸 ${것.칸수} · 겹침 0 · 로고 있다` };
}

export const 훑기본문 = `(() => {
  /* 🔴🔴 [2026-10-13 00:0x · 5번] **처음엔 <header> 아무것이나 집어 거짓 빨간불 13개를 냈다.**
     ─────────────────────────────────────────────────────────────────────
     전에는 #klmHeader 가 없으면 'header' 로 떨어지게 두었다. 그런데 손 없는 날·토정비결·
     육십갑자 같은 «콘텐트 지면»은 header.js 를 아예 안 싣고, 그 <header> 는 **지면 제목**이다.
     그것을 머리띠로 재니 「129px 로 부풀었다 · 로고가 없다」가 열셋 쏟아졌다. 전부 거짓이다.
     ⛔ 「그 이름의 태그가 있나」가 아니라 **「그것이 사이트 머리띠인가」**를 봐야 한다.
     ⇒ #klmHeader 하나만 본다. 없으면 «깨진» 것이 아니라 «없는» 것이라고 따로 적는다.
     ⭐ 그런데 «없는» 것이 더 큰 흠이었다 — 구글로 그 지면에 들어온 손님이
       다른 지면으로 갈 길이 없다. 2026-07-31 에 개인정보처리방침에서 겪고 고친 그 일이다. */
  const 띠 = document.getElementById('klmHeader');
  if (!띠) return { 띠있나: false };
  const 칸 = [...띠.querySelectorAll('a,button')]
    .map((e) => ({ 글: (e.textContent || '').trim().slice(0, 12), r: e.getBoundingClientRect() }))
    .filter((x) => x.글 && x.r.width > 4 && x.r.height > 4);
  const 겹친것 = [];
  for (let i = 0; i < 칸.length; i++) {
    for (let j = i + 1; j < 칸.length; j++) {
      const a = 칸[i].r; const c = 칸[j].r;
      const w = Math.min(a.right, c.right) - Math.max(a.left, c.left);
      const h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      /* ⚠ 2px 넘게 맞물려야 겹친 것으로 센다 — 테두리가 스치는 것까지 세면 거짓이 난다 */
      if (w > 2 && h > 2) 겹친것.push(칸[i].글 + ' × ' + 칸[j].글);
    }
  }
  return {
    띠있나: true,
    띠높이: Math.round(띠.getBoundingClientRect().height),
    띠너비: Math.round(띠.getBoundingClientRect().width),
    칸수: 칸.length,
    겹친수: 겹친것.length,
    겹친것: 겹친것.slice(0, 8),
    로고있나: !!띠.querySelector('img, svg, .klm-logo, [class*=logo]'),
  };
})()`;

export function 공개화면들(klifemap뿌리) {
  return fs.readdirSync(path.join(klifemap뿌리, 'public'))
    .filter((n) => n.endsWith('.html'))
    .filter((n) => !/^(404|google[0-9a-f]+|.*verification.*)\.html$/i.test(n))
    .map((n) => ({ 길: '/' + n, 이름: n.replace('.html', '') }))
    .sort((a, b) => a.길.localeCompare(b.길));
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };

  const 성한것 = { 띠있나: true, 띠높이: 68, 띠너비: 1351, 칸수: 13, 겹친수: 0, 겹친것: [], 로고있나: true };
  본다('✅ 겹침 0 · 68px · 로고 있으면 초록불', 판정(성한것).빛 === '✅');

  /* 🔴 오늘 실제로 난 꼴 — privacy·terms */
  const 깨진것 = { 띠있나: true, 띠높이: 271, 띠너비: 632, 칸수: 12, 겹친수: 7, 겹친것: ['궁합 × 🌐'], 로고있나: false };
  본다('🔴 오늘 난 꼴(271px · 겹침 7 · 로고 없음)을 잡는다', 판정(깨진것).빛 === '🔴');
  본다('   겹친 수를 적는다', /7군데/.test(판정(깨진것).말));
  본다('   띠가 부푼 것도 적는다', /271px/.test(판정(깨진것).말));
  본다('   로고가 없는 것도 적는다', /로고가 없다/.test(판정(깨진것).말));

  본다('🔴 겹침이 «하나»만 있어도 깨진 것이다',
    판정({ ...성한것, 겹친수: 1 }).빛 === '🔴');
  본다('✅ 띠가 조금 높은 것은 봐준다 — 두 줄로 접히기 전이다',
    판정({ ...성한것, 띠높이: 100 }).빛 === '✅');
  본다('🔴 두 줄로 접히면 잡는다',
    판정({ ...성한것, 띠높이: 140 }).빛 === '🔴');

  /* 🔴 [2026-10-13] 처음엔 <header> 아무것이나 집어 거짓 빨간불 열셋을 냈다.
     콘텐트 지면의 <header> 는 «지면 제목»이지 사이트 머리띠가 아니다. */
  본다('⛔ #klmHeader 하나만 본다 — 아무 <header> 나 집으면 거짓 빨간불이 난다',
    훑기본문.includes("getElementById('klmHeader')")
      && !/querySelector\('header/.test(훑기본문));
  본다('🔴 사이트 머리띠가 «없는» 것도 흠이다 — 들어온 손님이 나갈 길이 없다',
    판정({ 띠있나: false }).빛 === '🔴');
  본다('   「깨졌다」가 아니라 「없다」라고 적는다 — 고칠 자리가 다르다',
    /없다/.test(판정({ 띠있나: false }).말));
  본다('   왜 흠인지도 적는다 — 구글로 들어온 손님',
    /구글로 들어온 손님/.test(판정({ 띠있나: false }).말));
  본다('⬜ 탈이 나면 ⬜ 이고 까닭을 적는다', 판정(성한것, '못 받았다').빛 === '⬜');
  본다('   탈이 있으면 성한 수여도 초록이 아니다', 판정(성한것, '못 받았다').빛 !== '✅');

  본다('⚠ 2px 넘게 맞물려야 겹친 것으로 센다 — 스치는 것까지 세면 거짓이 난다',
    훑기본문.includes('w > 2 && h > 2'));
  본다('⛔ 겹친 «짝»을 그대로 낸다 — 수만 내면 어디를 볼지 모른다',
    훑기본문.includes('겹친것'));
  본다('로고를 따로 본다 — 겹침 0 이어도 로고가 빠질 수 있다',
    훑기본문.includes('로고있나'));

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
async function 잰다() {
  const 전부 = process.argv.includes('--전부');
  const klifemap = 'C:/Users/User/Documents/GitHub/klifemap';
  const 모두 = 공개화면들(klifemap);
  const 핵심 = ['index', 'saju', 'mingli-gunghap', 'mingli-sungmyung', 'privacy', 'terms',
    'refund', 'pricing', 'tarot', 'liuyao'];
  const 화면들 = 전부 ? 모두 : 모두.filter((h) => 핵심.includes(h.이름));

  const puppeteer = await import('puppeteer-core');
  const b = await puppeteer.default.connect({
    browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 5 * 60_000,
  });
  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  const 줄들 = [];
  try {
    console.log('■ 머리띠가 깨졌나 — 화면 ' + 화면들.length + '개\n');
    for (const 화 of 화면들) {
      let 것 = null; let 탈 = null;
      try {
        const page = await b.newPage();
        await page.setViewport({ width: 1366, height: 900 });
        await page.goto(터 + 화.길, { waitUntil: 'networkidle2', timeout: 60000 });
        await 잠깐(2600);
        것 = await page.evaluate(훑기본문);
        await page.close().catch(() => {});
      } catch (e) { 탈 = String(e?.message ?? e).slice(0, 60); }
      const p = 판정(것, 탈);
      줄들.push({ ...화, ...것, 빛: p.빛, 말: p.말, 탈 });
      console.log('  ' + p.빛 + ' ' + 화.이름.padEnd(24) + p.말);
      for (const x of (것?.겹친것 ?? [])) console.log('        겹침  ' + x);
    }
  } finally {
    await b.disconnect();   /* ⛔ close() 가 아니다 */
  }

  const 깨진것 = 줄들.filter((r) => r.빛 === '🔴');
  const 못잼 = 줄들.filter((r) => r.빛 === '⬜');
  console.log('');
  console.log('■ ✅ 성하다 ' + 줄들.filter((r) => r.빛 === '✅').length
    + ' · 🔴 깨졌다 ' + 깨진것.length + ' · ⬜ 못 쟀다 ' + 못잼.length);
  if (깨진것.length) {
    console.log('   🔴 ' + 깨진것.map((r) => r.이름).join(' · '));
    console.log('   ⭐ 먼저 볼 곳 — <body> 에 폭 묶음(max-w-*, mx-auto)이 붙었나.');
    console.log('      본문 폭을 재려던 묶음이 머리띠까지 가둔 적이 있다(2026-10-12 privacy·terms)');
  }
  console.log('   ⛔ 이 흠은 «대비» 재는 자로는 영영 안 잡힌다 — 깨진 것이 색이 아니라 자리다');

  const 대장 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..',
    'docs', '머리띠가-깨졌나.tsv');
  const 때 = new Date().toLocaleString('sv-SE').replace('T', ' ');
  const 줄 = 줄들.map((r) => [때, r.이름, r.띠높이 ?? '', r.띠너비 ?? '', r.칸수 ?? '',
    r.겹친수 ?? '', r.로고있나 === false ? '로고없음' : '', r.빛, r.탈 ?? ''].join('\t')).join('\n');
  fs.appendFileSync(대장,
    (fs.existsSync(대장) ? '' : '잰때\t이름\t띠높이\t띠너비\t칸수\t겹침\t비고\t빛\t탈\n') + 줄 + '\n', 'utf8');
  console.log('   ✔ 대장에 적었다 — docs/머리띠가-깨졌나.tsv');
  return 깨진것.length ? 1 : 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else process.exit(await 잰다());
}
