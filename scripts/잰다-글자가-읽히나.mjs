/**
 * 잰다-글자가-읽히나.mjs — **라이브 지면의 글자가 바탕 위에서 «읽히나»를 잰다.**
 *
 * ── 🔴 왜 지었나 (2026-10-13 14:3x · 5번) ─────────────────────────────
 * 사장님: 「**케이라이프맵 회색 글자가 잘 안보인단다. 검정색으로 바꿔라**」
 *
 * 재 보니 홈에만 대비 4.5 아래 글자 자리가 127개였다. 까닭은 하나였다 —
 * 아침에 「컬러 켜」로 **바탕만 밝게** 바꾸고, 테마가 글자를 어둡게 하는
 * 선(0.35)을 안 따라 올린 것이다. 어두운 바탕 시절 값이 그대로 살아 있었다.
 *
 * ⭐ 사람 눈이 먼저 찾았다. 그러면 안 된다 — **자가 먼저 찾아야 한다.**
 *   그래서 임시로 쓰던 자를 정식으로 들인다.
 *
 * ── ⛔ 이 자를 지으며 «세 번» 데었다. 그 셋이 이 자의 뼈대다 ──────────
 *
 * ① **body 가 투명이면 바탕을 못 찾는다.**
 *    새벽빛 테마는 바탕을 `html` 에 깐다. body 는 transparent 다.
 *    처음 자는 그것을 검정(0,0,0)으로 떨어뜨려 **진한 보라 제목까지 「안 보인다」**고 찍었다.
 *    ⇒ 투명을 뚫고 위로 올라가되, 마지막에 `documentElement` 를 본다.
 *
 * ② **그라데이션 배경을 「없다」로 읽는다.**
 *    `.klm-cta` 는 `background: linear-gradient(...)` 다. 그러면 `backgroundColor` 가
 *    transparent 로 나온다. 자가 그것을 「바탕이 없다」로 읽어 **거짓 빨강 7개**를 냈다.
 *    화면을 찍어 보니 그 버튼들은 보라 버튼으로 멀쩡히 보였다.
 *    ⇒ `backgroundImage` 에서 첫 색을 뽑는다. 못 뽑으면 «못 쟀다»로 둔다.
 *
 * ③ **선을 수로 박으면 바탕이 바뀔 때 바로 틀린다.**
 *    0.35 가 그렇게 틀렸고, 내가 고치며 넣은 0.18 도 같은 꼴로 하나를 놓쳤다.
 *    ⇒ 대비 식에서 바로 끌어낸다.
 *
 * ⛔ 이 자는 «고치지» 않는다. 어디가 안 읽히는지만 짚는다.
 * ⛔ 「대비가 좋아졌다」를 「화면이 나아졌다」로 읽지 않는다 — 색이 «뜻»을 가진 자리가 있다.
 *   (오행 색은 check-테마가-뜻을가진색을-뭉개나.mjs 가 따로 본다)
 *
 * 쓰는 법  node scripts/잰다-글자가-읽히나.mjs --자가시험
 *          node scripts/잰다-글자가-읽히나.mjs
 *          node scripts/잰다-글자가-읽히나.mjs https://klifemap.ai/saju.html
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

/** 기본으로 보는 지면 — 사장님이 짚으신 곳과 손님이 가장 많이 보는 곳 */
export const 기본지면 = [
  'https://klifemap.ai/',
  'https://klifemap.ai/saju.html',
  'https://klifemap.ai/mansecalendar.html',
];

/** WCAG AA 선 */
export const 읽히는선 = 4.5;

/** 글자 하나 몫의 상대휘도 (0~1). 못 재면 null — 0 으로 읽지 않는다 */
export function 밝기(v) {
  if (!Array.isArray(v) || v.length < 3) return null;
  if (v.slice(0, 3).some((x) => !Number.isFinite(x))) return null;
  const [r, g, b] = v.slice(0, 3).map((x) => {
    const y = x / 255;
    return y <= 0.03928 ? y / 12.92 : ((y + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 두 색의 대비. 못 재면 null — ⛔ 1 이나 21 로 채우지 않는다.
 *
 * ⭐ 바탕이 «여러 색»(그라데이션)이면 그 가운데 **가장 나쁜 대비**를 쓴다.
 *   보라 버튼(#8b4fe6→#5b2bb5)의 밝은 쪽만 재면 3.83 이 나오는데,
 *   그것은 한쪽 끝일 뿐이다. 가장 나쁜 쪽을 보면 거짓 초록이 안 난다.
 *   ⛔ 가장 «좋은» 쪽을 쓰면 자가 사람을 속인다.
 */
export function 대비(글색, 바탕색) {
  const a = 밝기(글색);
  if (a === null) return null;
  const 바탕들 = Array.isArray(바탕색) && Array.isArray(바탕색[0]) ? 바탕색 : [바탕색];
  let 가장나쁨 = null;
  for (const bg of 바탕들) {
    const b = 밝기(bg);
    if (b === null) continue;
    const v = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (가장나쁨 === null || v < 가장나쁨) 가장나쁨 = v;
  }
  return 가장나쁨;
}

/**
 * 대비 4.5 를 넘기려면 글자 밝기가 얼마 아래여야 하나.
 * ⭐ 선을 수로 박지 않는다 — 바탕이 바뀌면 자가 스스로 맞춘다.
 */
export function 넘는밝기(바탕밝기, 선 = 읽히는선) {
  if (바탕밝기 === null || !Number.isFinite(바탕밝기)) return null;
  return (바탕밝기 + 0.05) / 선 - 0.05;
}

/** 판정. ⛔ 「못 쟀다」를 「읽힌다」로 적지 않는다 */
export function 판정(값) {
  if (값 === null || !Number.isFinite(값)) {
    return { 빛: '⬜', 말: '못 쟀다 — 바탕을 못 집었다(그라데이션·그림일 수 있다)' };
  }
  if (값 < 3) return { 빛: '🔴🔴', 말: '거의 안 보인다' };
  if (값 < 읽히는선) return { 빛: '🔴', 말: '안 읽힌다 (선 ' + 읽히는선 + ')' };
  if (값 < 7) return { 빛: '⚠', 말: '작은 글씨에는 모자라다' };
  return { 빛: '✅', 말: '읽힌다' };
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0;
  let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };
  const 가깝나 = (a, b) => a !== null && Math.abs(a - b) < 0.01;

  본다('검정 밝기는 0', 가깝나(밝기([0, 0, 0]), 0));
  본다('흰 밝기는 1', 가깝나(밝기([255, 255, 255]), 1));
  본다('🔴 사장님이 짚으신 회색(#9aa0ac)의 밝기를 잰다', 가깝나(밝기([154, 160, 172]), 0.35));
  본다('⛔ 색이 아니면 null — 0 으로 읽지 않는다', 밝기(null) === null && 밝기([1, 2]) === null);
  본다('⛔ NaN 이 끼면 null — 오늘 sed 가 정규식을 망가뜨려 NaN 이 들어왔다',
    밝기([NaN, 236, 255]) === null);

  본다('흰 바탕 검정 글자는 21', 가깝나(대비([0, 0, 0], [255, 255, 255]), 21));
  본다('같은 색끼리는 1', 가깝나(대비([17, 17, 17], [17, 17, 17]), 1));
  /* ⚠ [2026-10-13] 이 시험을 처음에 「2.6」으로 적었다가 떨어졌다.
     2.6 은 «흰 카드» 위 값이고 새벽빛 바탕에서는 2.32 다. 실측에서 둘을 섞어 적었던 것이다.
     ⛔ 시험을 통과하게 고치지 않고 «사실»에 맞게 고쳤다. 둘 다 적어 둔다. */
  본다('🔴 회색이 새벽빛 바탕에서 2.32 — 사장님이 「안 보인다」고 하신 자리다',
    Math.abs(대비([154, 160, 172], [246, 238, 252]) - 2.32) < 0.05);
  본다('🔴 같은 회색이 흰 카드 위에서는 2.63 — 실측에서 본 수다',
    Math.abs(대비([154, 160, 172], [255, 255, 255]) - 2.63) < 0.05);
  본다('✅ 검정/새벽빛 바탕은 16 을 넘는다 — 고친 뒤의 수다',
    대비([17, 17, 17], [246, 238, 252]) > 16);
  본다('⛔ 한쪽을 못 재면 null — ⛔ 1 이나 21 로 채우지 않는다',
    대비(null, [255, 255, 255]) === null);

  /* ⭐ [2026-10-13] 그라데이션 바탕 — «가장 나쁜» 쪽을 쓴다 */
  본다('🔴 바탕이 여러 색이면 «가장 나쁜» 대비를 쓴다 — 좋은 쪽을 쓰면 자가 사람을 속인다',
    Math.abs(대비([255, 255, 255], [[139, 79, 230], [91, 43, 181]])
      - 대비([255, 255, 255], [139, 79, 230])) < 0.001);
  본다('   그 값이 «좋은 쪽»보다 작다',
    대비([255, 255, 255], [[139, 79, 230], [91, 43, 181]])
      < 대비([255, 255, 255], [91, 43, 181]));
  본다('⛔ 여러 색 가운데 못 재는 것이 섞여도 성한 것으로 센다',
    대비([0, 0, 0], [[NaN, 1, 2], [255, 255, 255]]) > 20);
  본다('⛔ 다 못 재면 null', 대비([0, 0, 0], [[NaN, 1, 2]]) === null);

  /* ③ 선을 바탕에서 «계산»한다 */
  const 새벽빛 = 밝기([246, 238, 252]);
  본다('🔴 새벽빛 바탕에서 넘는 선이 0.157 쯤이다 — 0.18 로 박았다가 하나를 놓쳤다',
    Math.abs(넘는밝기(새벽빛) - 0.157) < 0.01);
  본다('🔴 꼬리말 회색(#6e737d)은 그 선을 «넘는다» — 그래서 검정으로 바꿔야 한다',
    밝기([110, 115, 125]) > 넘는밝기(새벽빛));
  본다('⭐ 바탕이 바뀌면 선도 바뀐다 — 수로 박지 않는다',
    넘는밝기(밝기([255, 255, 255])) > 넘는밝기(밝기([200, 200, 200])));
  본다('⛔ 바탕을 못 재면 선도 null', 넘는밝기(null) === null);

  본다('✅ 21 은 읽힌다', 판정(21).빛 === '✅');
  본다('⚠ 5 는 작은 글씨에 모자라다', 판정(5).빛 === '⚠');
  본다('🔴 4.21 은 안 읽힌다 — 「함께 운영하는 곳」이 그 수였다', 판정(4.21).빛 === '🔴');
  본다('🔴🔴 1.04 는 거의 안 보인다 — 검은 상자 안 제목이 그 수였다', 판정(1.04).빛 === '🔴🔴');
  본다('⬜ 못 쟀으면 ⬜ — ⛔ 「읽힌다」가 아니다', 판정(null).빛 === '⬜');
  본다('   그 말에 «그라데이션»을 짚는다 — 오늘 거짓 빨강 7개가 그것이었다',
    /그라데이션/.test(판정(null).말));

  console.log(String.fromCharCode(10) + '자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
async function 잰다(주소들) {
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  let 나쁨 = 0;
  try {
    for (const 주소 of 주소들) {
      await page.goto(주소, { waitUntil: 'networkidle2', timeout: 90000 });
      await new Promise((r) => setTimeout(r, 3000));
      const 잰것 = await page.evaluate(() => {
        const 숫자 = (s) => (String(s).match(/[\d.]+/g) || []).map(Number);
        /**
         * 투명을 뚫고 위로 올라가 «진짜» 바탕을 찾는다.
         *
         * 🔴🔴 [2026-10-13 14:5x] **그라데이션에서 «멈추면» 아래 바탕을 못 본다.**
         *   「오늘의 사주」 기둥 「庚申」이 금색 그라데이션 테두리 안에 있는데,
         *   자가 거기서 멈춰 금색을 바탕으로 집고 **대비 2.57 · 「거의 안 보인다」**고 찍었다.
         *   화면을 찍어 보니 흰 카드 위 금색 글자로 **아주 잘 보였다.**
         *   ⭐ 네 번째 거짓 빨강이다. 그라데이션이 반투명이면 «아래»와 섞인다.
         * ⇒ 멈추지 않고 색을 모으며 계속 올라간다. 그리고 그라데이션이 끼었으면
         *   빨강으로 «단정하지 않고» ⬜ 못 쟀다로 낸다 — 겹침 합성은 밖에서 못 잰다.
         */
        const 바탕찾기 = (el) => {
          let n = el;
          const 모은것 = [];
          let 그라있었나 = false;
          while (n && n.nodeType === 1) {
            const cs = getComputedStyle(n);
            const gi = cs.backgroundImage;
            if (gi && gi !== 'none') {
              그라있었나 = true;
              const gc = [...gi.matchAll(/rgba?\(([^)]+)\)/g)]
                .map((m) => m[1].split(String.fromCharCode(44)).map(Number))
                .filter((v) => v.length >= 3 && v.slice(0, 3).every(Number.isFinite));
              모은것.push(...gc);
              n = n.parentElement;
              continue;     /* ⭐ 멈추지 않는다 — 아래 바탕도 후보다 */
            }
            const v = 숫자(cs.backgroundColor);
            if (v.length >= 3 && (v[3] === undefined || v[3] > 0.35)) {
              모은것.push(v);
              return { 색들: 모은것, 그라: 그라있었나 };
            }
            n = n.parentElement;
          }
          const h = 숫자(getComputedStyle(document.documentElement).backgroundColor);
          if (h.length >= 3) 모은것.push(h); else 모은것.push([255, 255, 255]);
          return { 색들: 모은것, 그라: 그라있었나 };
        };
        const 나온다 = [];
        for (const el of document.querySelectorAll('*')) {
          const 글 = (el.textContent || '').trim();
          if (!글 || 글.length < 2) continue;
          if (el.children.length
            && !Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.1) continue;
          const rc = el.getBoundingClientRect();
          if (rc.width < 2 || rc.height < 2) continue;
          const bg = 바탕찾기(el);
          나온다.push({
            글색: 숫자(cs.color), 바탕색: bg.색들, 그라: bg.그라,
            태그: el.tagName, 크기: cs.fontSize,
            보기: 글.slice(0, 32),
          });
        }
        return 나온다;
      });

      const 셈 = { '🔴🔴': 0, '🔴': 0, '⚠': 0, '✅': 0, '⬜': 0 };
      const 나쁜것 = [];
      for (const x of 잰것) {
        const v = 대비(x.글색, x.바탕색);
        /* ⭐ 그라데이션이 끼었으면 빨강으로 «단정하지 않는다» —
           겹친 반투명 층의 합성은 밖에서 못 잰다. ⬜ 못 쟀다로 낸다.
           ⛔ 그렇다고 ✅ 로도 적지 않는다. 모르는 것은 모른다고 적는다. */
        const r = (x.그라 && v !== null && v < 읽히는선) ? 판정(null) : 판정(v);
        셈[r.빛] += 1;
        if (r.빛 === '🔴' || r.빛 === '🔴🔴') 나쁜것.push({ ...x, 대비: v, 빛: r.빛 });
      }
      나쁜것.sort((a, c) => a.대비 - c.대비);
      console.log('■ ' + 주소);
      console.log('   🔴🔴 ' + 셈['🔴🔴'] + ' · 🔴 ' + 셈['🔴'] + ' · ⚠ ' + 셈['⚠']
        + ' · ✅ ' + 셈['✅'] + ' · ⬜ 못 쟀다 ' + 셈['⬜']);
      for (const x of 나쁜것.slice(0, 8)) {
        console.log('     ' + x.빛 + ' ' + x.대비.toFixed(2).padStart(5) + '  '
          + x.태그.padEnd(7) + String(x.크기).padStart(7) + '  ' + x.보기);
      }
      if (셈['🔴'] + 셈['🔴🔴']) 나쁨 += 1;
      console.log('');
    }
  } finally { await page.close(); b.disconnect(); }
  console.log('  ⛔ ⬜ 「못 쟀다」를 「읽힌다」로 세지 않았다 — 그라데이션·그림 바탕이다.');
  console.log('  ⛔ 이 자는 고치지 않는다. 색이 «뜻»을 가진 자리는 따로 본다');
  console.log('     (check-테마가-뜻을가진색을-뭉개나.mjs)');
  return 나쁨 ? 1 : 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else {
    const 준것 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
    process.exit(await 잰다(준것.length ? 준것 : 기본지면));
  }
}
