/* 새벽빛 테마가 KLifeMap «모든» 화면을 깨나 — 전부 훑어서 잰다
 *
 * ── 왜 이 자인가 (2026-10-12 20:4x · 5번) ─────────────────────────
 *   사장님 — 「궁합·택일·성명학, 점성학 다 봐야지...일을 대충하지마...완벽하게 해」
 *   저는 **사주 화면 하나만 재고** 「나머지는 안 봤습니다」로 넘겼습니다. 그것이 대충입니다.
 *
 * ── 무엇을 재나 ───────────────────────────────────────────────────
 *   화면마다 테마를 «켜기 전»과 «켠 뒤»의 **안 읽히는 자리 수**를 센다.
 *   안 읽힘 = 글자와 «실제로 보이는» 바탕의 밝기 차가 선(70) 아래.
 *
 * ── ⛔ 이 자가 빠질 뻔한 함정 (겪고 적는다) ──────────────────────
 * ⛔ 바탕이 rgba(0,0,0,0)(투명)이면 밝기를 0 으로 읽어 흰 글자에 「차 255」가 나온다.
 *   ⇒ 조상을 타고 올라가며 **불투명한 바탕**을 찾는다.
 * ⛔ 그 길을 documentElement «앞»에서 멈추면 86곳이 거짓으로 걸린다 —
 *   테마는 body 를 투명으로 만들고 **html 에** 밝은 바탕을 깐다. ⇒ html 까지 본다.
 * ⛔ 테마가 그린 장식(#klm-dawn 안)은 본문이 아니다. 세지 않는다.
 * ⛔ 라이브를 안 건드린다 — 내 브라우저 안에서만 넣어 본다.
 * ⛔ b.close() 금지(사장님 창이 닫힌다). disconnect() 만. 언제나 새 탭.
 *
 * 돌리기
 *   node scripts/check-klifemap-테마가-화면을-깨나.mjs --자가시험
 *   node scripts/check-klifemap-테마가-화면을-깨나.mjs            핵심 화면만
 *   node scripts/check-klifemap-테마가-화면을-깨나.mjs --전부      공개 화면 전부
 *   node scripts/check-klifemap-테마가-화면을-깨나.mjs --그림      그림도 뜬다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
export const 테마길 = 'C:/Users/User/OneDrive/Desktop/klm-새벽빛-미리보기/klm-dawn.js';
export const 터 = 'https://klifemap.ai';

/** 안 읽힘으로 보는 선 — 글자와 바탕의 밝기 차 */
export const 읽힘선 = 70;

/**
 * 🔴🔴 [2026-10-12 18:5x · 5번] **글자 대비만 재면 디자인을 못 잡는다.**
 * ─────────────────────────────────────────────────────────────────────
 * 사장님 — 「직접 눈으로 봐. 디자인 상 어떤지를. 너 포함 모두」
 * 그림을 떠서 보니 첫 화면이 심각했다. 그런데 이 자는 **0곳 → 0곳 ⚠ 그대로**라고 했다.
 * ⛔ 까닭 — 글자와 바탕의 «밝기 차»만 쟀다. **장식이 글 위를 덮는 것**은 안 봤다.
 *   테마가 그리는 명반(한자 바퀴)과 해가 오른쪽 본문을 덮어
 *   첫 화면에서는 가격표가, 궁합에서는 결제 단추 옆이 먹혔다.
 *   **돈을 보여 주는 자리가 가장 많이 먹혔다.**
 * ⇒ 겹침을 따로 센다. ⛔ 「안 읽히는 자리 0곳」을 「괜찮다」로 읽지 않는다.
 *
 * ⚠ 이 수도 «눈»을 대신하지 못한다 — 겹쳐도 옅으면 괜찮고, 안 겹쳐도 답답할 수 있다.
 *   그래서 이 자는 그림도 함께 뜬다(--그림). 수는 어디를 볼지 알려 줄 뿐이다.
 */
export const 겹침선 = 0.12;   /* 장식이 글자 넓이의 12% 넘게 덮으면 센다 */

/* 사장님이 짚으신 다섯 + 자주 보는 것. ⚠ 「핵심」은 사람이 정한 것이다 */
export const 핵심화면 = [
  { 길: '/saju.html', 이름: '사주', 채움: '사주' },
  { 길: '/mingli-gunghap.html', 이름: '궁합', 채움: null },
  { 길: '/mingli-taekil.html', 이름: '택일', 채움: null },
  { 길: '/mingli-sungmyung.html', 이름: '성명학', 채움: null },
  { 길: '/astro.html', 이름: '점성학', 채움: null },
  { 길: '/', 이름: '첫 화면', 채움: null },
  { 길: '/gwansang.html', 이름: '관상', 채움: null },
  { 길: '/tarot.html', 이름: '타로', 채움: null },
  { 길: '/liuyao.html', 이름: '육효', 채움: null },
  { 길: '/pricing.html', 이름: '요금', 채움: null },
  { 길: '/checkout.html', 이름: '결제', 채움: null },
];

/** 공개 화면 목록 — klifemap 저장소의 public/*.html 에서 뽑는다 */
export function 공개화면들(klifemap뿌리) {
  const 방 = path.join(klifemap뿌리, 'public');
  let 이름들;
  try { 이름들 = fs.readdirSync(방); } catch { return null; }   /* ⬜ 못 읽으면 null */
  return 이름들
    .filter((n) => n.endsWith('.html'))
    /* ⛔ 살림·검증 파일은 손님 화면이 아니다 */
    .filter((n) => !/^(404|google[0-9a-f]+|.*verification.*)\.html$/i.test(n))
    .map((n) => ({ 길: '/' + n, 이름: n.replace('.html', ''), 채움: n === 'saju.html' ? '사주' : null }))
    .sort((a, b) => a.길.localeCompare(b.길));
}

/* ── 판정 ───────────────────────────────────────────────────────── */

/**
 * 켜기 전과 켠 뒤를 견준다 — ⛔ 「좋다/나쁘다」가 아니라 «얼마나»다
 * @param 겹침 켠 뒤 장식에 덮인 글자 수 (안 쟀으면 null — ⛔ 0 과 다르다)
 */
export function 판정(전, 후, 겹침 = null) {
  if (전 == null || 후 == null) return { 빛: '⬜', 말: '못 쟀다' };
  /* 🔴🔴 [2026-10-12 19:0x] **겹침 수를 빨간불로 쓰려다 그만뒀다 — 그 수가 거짓이었다.**
     ───────────────────────────────────────────────────────────────────
     처음에는 「겹침 5곳 넘으면 🔴」로 두었다. 그랬더니 열한 화면이 전부 🔴 이 되고
     **눈으로는 멀쩡한 결제 화면이 18곳**, 맨 위 메뉴가 「덮임 100%」로 나왔다.
     ⛔ 까닭 둘 —
       ① 명반은 **원**인데 나는 **사각형**(getBoundingClientRect)으로 쟀다.
          원의 가운데는 비어 있는데 사각형은 거기까지 덮은 것으로 센다.
       ② 장식은 z-index -1 이라 글자 **뒤**에 있다. 덮는 것이 아니라 «뒤에 비치는» 것이다.
     ⇒ 이 수로 빨간불을 켜면 **또 하나의 거짓 자**가 된다. 오늘 그것을 여러 번 겪었다.
     ⇒ **빛을 올리지 않는다.** 「살펴볼 곳」으로만 적고, 판단은 그림을 본 사람이 한다.
     ⛔ 틀린 수를 내놓느니 안 내놓는 쪽이 낫다. */
  const 겹침말 = 겹침
    ? ` · ⚠ 장식과 겹친 글자 ${겹침}곳 (사각형으로 쟀다 — 명반은 원이라 과장된다. 그림을 본다)`
    : '';
  if (후 > 전) return { 빛: '🔴', 말: `안 읽히는 자리가 ${전} → ${후} 로 **늘었다**${겹침말}` };
  if (후 === 전) return { 빛: '⚠', 말: `${전} → ${후} · 그대로다${겹침말}` };
  return { 빛: '✅', 말: `${전} → ${후} 로 줄었다${겹침말}` };
}

/* ── 브라우저 안에서 도는 것 ────────────────────────────────────── */
const 훑기본문 = `(() => {
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
    /* 🔴 [2026-10-13 14:2x] body 가 «투명»이면 여기서 rgba(0,0,0,0) 이 돌아오고,
       그것을 검정 바탕으로 읽어 **멀쩡한 글자를 「안 보인다」로 찍는다.**
       새벽빛 테마는 바탕을 html 에 깐다 — 오늘 내 임시 자가 실제로 그렇게 틀렸다. */
    const b1 = String(getComputedStyle(document.body).backgroundColor);
    const bm = b1.match(/[\d.]+/g);
    if (bm && (bm.length < 4 || Number(bm[3]) > 0.5)) return b1;
    return getComputedStyle(document.documentElement).backgroundColor;
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
    if (e.closest('#klm-dawn')) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const s = getComputedStyle(e);
    if (s.visibility === 'hidden' || s.opacity === '0' || s.display === 'none') continue;
    const g = 밝기(s.color); const bg = 보이는바탕(e); const bb = 밝기(bg);
    if (g == null || bb == null) continue;
    const 차 = Math.abs(g - bb);
    if (차 < __읽힘선__) {
      걸린것.push({ 글: 글.slice(0, 28), 글자: s.color, 바탕: bg, 차,
        클래스: (e.className || '').toString().slice(0, 50) });
    }
  }
  걸린것.sort((a, b) => a.차 - b.차);

  /* 🔴 장식이 본문 글자를 덮나 — 글자 대비로는 안 잡히는 자리다 */
  const 겹친것 = [];
  const 장식들 = [...document.querySelectorAll('#klm-dawn .kd-wheel, #klm-dawn .kd-sun, #klm-dawn .kd-halo')]
    .map((e) => ({ 네모: e.getBoundingClientRect(), 진하기: Number(getComputedStyle(e).opacity) || 1 }))
    .filter((x) => x.네모.width > 10 && x.네모.height > 10);
  if (장식들.length) {
    for (const e of document.querySelectorAll('span,div,p,td,th,b,strong,a,h1,h2,h3')) {
      const 글 = (e.textContent || '').trim();
      if (!글 || e.children.length > 0) continue;
      if (e.closest('#klm-dawn')) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      if (r.bottom < 0 || r.top > window.innerHeight * 3) continue;   /* 화면 한참 밖은 뺀다 */
      const 넓이 = r.width * r.height;
      let 덮인넓이 = 0;
      for (const 장 of 장식들) {
        const w = Math.max(0, Math.min(r.right, 장.네모.right) - Math.max(r.left, 장.네모.left));
        const h = Math.max(0, Math.min(r.bottom, 장.네모.bottom) - Math.max(r.top, 장.네모.top));
        덮인넓이 = Math.max(덮인넓이, w * h * 장.진하기);
      }
      const 몫 = 넓이 ? 덮인넓이 / 넓이 : 0;
      if (몫 > __겹침선__) 겹친것.push({ 글: 글.slice(0, 26), 몫: Math.round(몫 * 100) });
    }
  }
  겹친것.sort((a, b) => b.몫 - a.몫);

  return {
    수: 걸린것.length,
    보기: 걸린것,          /* ⛔ 자르지 않는다 — 사장님 「80곳 다 보이게 해」(2026-10-12) */
    겹침수: 겹친것.length,
    겹침보기: 겹친것,
    글자수: (document.body.innerText || '').length,
    요소수: document.querySelectorAll('*').length,
  };
})()`;

/* ── 자가시험 ───────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 같나 = (무엇, 잰것, 바라는것) => {
    const a = JSON.stringify(잰것); const b = JSON.stringify(바라는것);
    if (a === b) { 통과 += 1; return; }
    실패 += 1;
    console.log('  🔴 ' + 무엇 + '  잰것 ' + a + ' / 바란것 ' + b);
  };

  같나('줄면 ✅', 판정(21, 1).빛, '✅');
  같나('늘면 🔴', 판정(1, 21).빛, '🔴');
  같나('그대로면 ⚠ — ⛔ ✅ 가 아니다', 판정(5, 5).빛, '⚠');
  같나('⬜ 못 쟀으면 못 쟀다 — ⛔ 0 으로 안 센다', 판정(null, 3).빛, '⬜');
  같나('   한쪽만 못 쟀어도 못 쟀다', 판정(3, null).빛, '⬜');
  같나('0 → 0 도 그대로다 — ⛔ null 과 다르다', 판정(0, 0).빛, '⚠');
  같나('늘었다는 말에 두 수가 다 든다', /21 → 30/.test(판정(21, 30).말), true);
  /* ── 🔴 겹침 — «빛을 올리지 않는다» ─────────────────────────────
     [2026-10-12 19:0x] 처음엔 「겹침 5곳 넘으면 🔴」로 뒀다. 그랬더니 눈으로는
     멀쩡한 결제 화면이 18곳, 맨 위 메뉴가 「덮임 100%」로 나왔다.
       ① 명반은 «원»인데 사각형(getBoundingClientRect)으로 쟀다
       ② 장식은 z-index -1 이라 글자 «뒤»에 비치는 것이지 덮는 것이 아니다
     ⇒ 틀린 수로 불을 켜느니 안 켠다. 시험도 그 뜻으로 다시 적었다. */
  같나('⛔ 많이 겹쳐도 빛을 올리지 않는다 — 그 수는 과장된 수다',
    판정(0, 0, 12).빛, '⚠');
  같나('   그래도 «살펴볼 곳»으로 적어는 둔다',
    /겹친 글자 12곳/.test(판정(0, 0, 12).말), true);
  같나('   왜 과장되는지를 같이 적는다 (사각형 / 원)',
    /사각형으로 쟀다/.test(판정(0, 0, 12).말), true);
  같나('   판단은 «그림을 본 사람»이 한다고 적는다',
    /그림을 본다/.test(판정(0, 0, 12).말), true);
  같나('🔴 빛은 «안 읽히는 자리»가 늘 때만 켜진다', 판정(2, 5, 0).빛, '🔴');
  같나('✅ 줄었으면 ✅', 판정(21, 2, 0).빛, '✅');
  같나('⬜ 겹침을 안 쟀으면(null) 겹침 말이 안 붙는다 — ⛔ 0 과 다르다',
    /겹친 글자/.test(판정(5, 5, null).말), false);
  같나('   0 곳이어도 겹침 말이 안 붙는다 (0 은 «없다»다)',
    /겹친 글자/.test(판정(5, 5, 0).말), false);
  같나('⬜ 못 잰 화면은 겹침과 상관없이 ⬜ 다', 판정(null, null, 30).빛, '⬜');

  /* 공개 화면 고르기 — 살림 파일을 손님 화면으로 세지 않는다 */
  const 가짜fs = {
    readdirSync: () => ['saju.html', '404.html', 'google25daae95a00ba72f.html',
      'mingli-gunghap.html', 'style.css'],
  };
  const 원래 = fs.readdirSync;
  const 것 = (() => {
    const 방 = (p) => 가짜fs.readdirSync(p);
    return ['saju.html', '404.html', 'google25daae95a00ba72f.html', 'mingli-gunghap.html', 'style.css']
      .filter((n) => n.endsWith('.html'))
      .filter((n) => !/^(404|google[0-9a-f]+|.*verification.*)\.html$/i.test(n));
  })();
  같나('⛔ 404 와 구글 확인 파일은 손님 화면이 아니다', 것, ['saju.html', 'mingli-gunghap.html']);
  같나('⛔ css 는 화면이 아니다', 것.includes('style.css'), false);

  같나('핵심 화면에 사장님이 짚으신 넷이 다 있다',
    ['궁합', '택일', '성명학', '점성학'].every((x) => 핵심화면.some((h) => h.이름 === x)), true);
  같나('사주 화면은 입력을 채운다',
    핵심화면.find((h) => h.이름 === '사주').채움, '사주');

  /* 🔴 [2026-10-12] 센 것과 보여 준 것이 어긋나면 그 자는 사람을 속인다.
     보기를 다섯 개로 자르는 바람에 「합 80곳」이라 세 놓고 5개만 보여 줬다. */
  같나('⛔ 걸린 자리를 자르지 않는다 (센 것 == 보여 준 것)',
    /걸린것\.slice/.test(훑기본문), false);
  같나('⛔ 겹친 자리도 자르지 않는다',
    /겹친것\.slice/.test(훑기본문), false);
  같나('걸린 자리에 «무엇이 안 읽히나»를 적는다',
    ['글', '글자', '바탕', '클래스'].every((k) => 훑기본문.includes(k + ':')) && 훑기본문.includes('차,'), true);

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ───────────────────────────────────────────────────────── */
async function 잰다() {
  const 전부 = process.argv.includes('--전부');
  const 그림낼까 = process.argv.includes('--그림');
  const 테마글 = fs.readFileSync(테마길, 'utf8');
  const 훑기 = 훑기본문.replace('__읽힘선__', String(읽힘선)).replace('__겹침선__', String(겹침선));

  let 화면들 = 핵심화면;
  if (전부) {
    const 것 = 공개화면들(path.resolve(뿌리, '..', 'klifemap'));
    if (!것) {
      console.log('⬜ klifemap/public 을 못 읽었다 — **못 쟀다**. 핵심 화면만 본다');
    } else {
      화면들 = 것;
    }
  }

  const puppeteer = await import('puppeteer-core');
  const b = await puppeteer.default.connect({
    browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 5 * 60_000,
  });
  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  const 낼곳 = 'C:/Users/User/OneDrive/Desktop/klm-새벽빛-미리보기/화면들/';
  if (그림낼까) fs.mkdirSync(낼곳, { recursive: true });

  const 줄들 = [];
  try {
    for (const 화 of 화면들) {
      let 전 = null; let 후 = null; let 탈 = null; let 자세히 = null;
      let 겹침 = null; let 겹침보기 = null; let 전자세히 = null;
      try {
        const page = await b.newPage();
        await page.setViewport({ width: 1366, height: 1000 });
        await page.goto(터 + 화.길, { waitUntil: 'networkidle2', timeout: 60000 });
        await 잠깐(1800);

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
          await 잠깐(2000);
        }

        const a = await page.evaluate(훑기);
        전 = a.수; 전자세히 = a.보기;
        if (그림낼까) await page.screenshot({ path: 낼곳 + 화.이름 + '-1-지금.png' });

        await page.addScriptTag({ content: 테마글 });
        await 잠깐(3200);
        const c = await page.evaluate(훑기);
        후 = c.수;
        자세히 = c.보기;
        겹침 = c.겹침수;
        겹침보기 = c.겹침보기;
        if (그림낼까) await page.screenshot({ path: 낼곳 + 화.이름 + '-2-새벽빛.png' });
        await page.close().catch(() => {});
      } catch (e) {
        탈 = String(e?.message ?? e).slice(0, 60);
      }
      const p = 판정(전, 후, 겹침);
      줄들.push({ ...화, 전, 후, 겹침, 빛: p.빛, 말: p.말, 탈, 자세히, 전자세히, 겹침보기 });
      console.log('  ' + p.빛 + ' ' + 화.이름.padEnd(14) + (탈 ? '⬜ ' + 탈 : p.말));
      if (p.빛 === '🔴' && 자세히?.length) {
        for (const x of 자세히.slice(0, 3)) {
          console.log('        차' + String(x.차).padStart(3) + ' "' + x.글 + '"  '
            + x.글자 + ' / ' + x.바탕);
        }
      }
      if (겹침보기?.length) {
        for (const x of 겹침보기.slice(0, 3)) {
          console.log('        덮임 ' + String(x.몫).padStart(3) + '%  "' + x.글 + '"');
        }
      }
    }
  } finally {
    await b.disconnect();   /* ⛔ close() 가 아니다 */
  }

  const 늘어난곳 = 줄들.filter((r) => r.빛 === '🔴');
  const 못잰곳 = 줄들.filter((r) => r.빛 === '⬜');
  console.log('');
  console.log('■ 화면 ' + 줄들.length + '개 — ✅ 줄었다 ' + 줄들.filter((r) => r.빛 === '✅').length
    + ' · ⚠ 그대로 ' + 줄들.filter((r) => r.빛 === '⚠').length
    + ' · 🔴 늘었다 ' + 늘어난곳.length + ' · ⬜ 못 쟀다 ' + 못잰곳.length);
  const 잰것 = 줄들.filter((r) => r.전 != null && r.후 != null);
  if (잰것.length) {
    console.log('   안 읽히는 자리 합  ' + 잰것.reduce((s, r) => s + r.전, 0)
      + ' → ' + 잰것.reduce((s, r) => s + r.후, 0));
  }
  console.log('⛔ 못 쟀다를 「성하다」로 읽지 않는다.');

  const 대장 = path.join(뿌리, 'docs', '테마가-화면을-깨나.tsv');
  const 때 = new Date().toLocaleString('sv-SE').replace('T', ' ');
  const 줄 = 줄들.map((r) => [때, r.이름, r.길, r.전 ?? '', r.후 ?? '', r.빛, r.탈 ?? ''].join('\t')).join('\n');
  fs.appendFileSync(대장, (fs.existsSync(대장) ? '' : '잰때\t이름\t길\t켜기전\t켠뒤\t빛\t탈\n') + 줄 + '\n', 'utf8');
  console.log('   ✔ 대장에 적었다 — docs/테마가-화면을-깨나.tsv');

  /* 🔴 [2026-10-12 · 사장님 「80곳 다 보이게 해」] 자리 하나하나를 적는다.
     ⛔ 전에는 화면마다 «다섯 개만» 남기고 잘랐다(걸린것.slice(0, 5)).
        그래서 「합 80곳」이라 세 놓고 보여 준 것은 5개뿐이었다. 사장님이
        「5곳이 뭐지」라고 물으신 그 5다.
     ⭐ «센 것»과 «보여 준 것»이 다르면 그 자는 사람을 속인다. */
  const 자리대장 = path.join(뿌리, 'docs', '테마-안읽히는자리-전부.tsv');
  const 자리줄 = [];
  for (const r of 줄들) {
    for (const x of (r.전자세히 ?? [])) {
      자리줄.push([때, r.이름, r.길, '켜기전', x.차, x.글, x.글자, x.바탕, x.클래스].join('\t'));
    }
    for (const x of (r.자세히 ?? [])) {
      자리줄.push([때, r.이름, r.길, '켠뒤', x.차, x.글, x.글자, x.바탕, x.클래스].join('\t'));
    }
    for (const x of (r.겹침보기 ?? [])) {
      자리줄.push([때, r.이름, r.길, '덮임', x.몫 + '%', x.글, '', '', ''].join('\t'));
    }
  }
  fs.writeFileSync(자리대장,
    '잰때\t화면\t길\t언제\t차\t글\t글자색\t바탕색\t클래스\n' + 자리줄.join('\n') + '\n', 'utf8');
  console.log('   ✔ 자리 ' + 자리줄.length + '줄 — 하나도 안 자르고 적었다');
  console.log('     docs/테마-안읽히는자리-전부.tsv');
  return 늘어난곳.length ? 1 : 0;
}

/* ── 들머리 ─────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점 && process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
}
if (내가진입점) {
  process.exit(await 잰다());
}
