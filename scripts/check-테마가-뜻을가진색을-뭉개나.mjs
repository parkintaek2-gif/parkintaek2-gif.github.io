/* 테마가 «뜻을 가진 색»을 뭉개나 — 사주 원국표의 오행(목 화 토 금 수)
 *
 *   node scripts/check-테마가-뜻을가진색을-뭉개나.mjs --자가시험
 *   node scripts/check-테마가-뜻을가진색을-뭉개나.mjs            라이브에 켜서 잰다
 *
 * ── 🔴🔴 왜 이 자가 필요한가 (2026-10-12 · 5번) ──────────────────────────
 *
 * 색을 재는 자는 이미 있었다. 그러나 그 자는 **「읽히나」만** 봤다.
 * 그래서 새벽빛을 켠 뒤 「안 읽히는 자리 80 → 13」이라는 좋은 수가 나왔다.
 *
 * ⛔ 그런데 **읽히는데 뜻을 잃는** 자리가 있었다 —
 *      己 밝은 노랑(토)  →  rgb(147,86,10)
 *      巳 밝은 빨강(화)  →  rgb(147,86,10)   ← 같은 색
 *      卯 밝은 초록(목)  →  rgb(147,86,10)   ← 같은 색
 *    세 오행이 한 색이 됐다. **또렷하게 읽히지만 무엇인지는 알 수 없다.**
 *
 * ⭐ 사주 원국표에서 색은 장식이 아니라 **판정 자료**다. 손님이 돈을 내고 보는 것이다.
 *   「대비가 좋아졌다」가 「화면이 나아졌다」가 아니다. 자가 안 보는 축이 있으면
 *   그 축에서 벌어진 일은 영영 안 보인다.
 *
 * ── ⛔ 이 자를 지으며 세 번 틀렸다. 그대로 적어 둔다 ────────────────────
 *
 *  ① **입력칸 id 를 «기억으로» 적었다** — birthYear 라고 썼는데 실제는 msSolarY 였다.
 *     한 자리도 못 찾았다. ⇒ 되는 자에서 **베껴 온다**. 기억으로 적지 않는다.
 *
 *  ② **하나도 못 찾고서 「✅ 가짓수가 그대로다」를 냈다** — 0 → 0 이니 «그대로»라고.
 *     ⛔ 못 찾은 것은 **못 쟀다**다. 0 을 성하다로 읽지 않는다.
 *
 *  ③ **테마가 그리는 명반 바퀴를 본문으로 셌다** — 그 바퀴에도 천간지지가 있고
 *     전부 한 색이다. 그래서 「9가지가 1가지로 뭉개졌다」는 **거짓 빨간불**이 났다.
 *     하마터면 사장님께 그대로 올릴 뻔했다. ⇒ #klm-dawn 과 svg 를 뺀다.
 *
 * ⚠ 이 자가 **못 보는 것** — 가짓수가 같아도 «어느 색이 어느 오행인가»가
 *   뒤바뀌었는지는 모른다. 빛깔(hue)이 지켜지는지까지만 본다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 천간지지 = '甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥';
export const 테마길 = 'C:/Users/User/OneDrive/Desktop/klm-새벽빛-미리보기/klm-dawn.js';

/** rgb 문자열에서 빛깔(hue)을 뽑는다. 못 읽으면 null. */
export function 빛깔(c) {
  const m = String(c ?? '').match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  const r = +m[0] / 255; const g = +m[1] / 255; const b = +m[2] / 255;
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b);
  if (mx === mn) return 0;
  const d = mx - mn;
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round(h * 60);
}

/**
 * 잰 것을 판정한다.
 * ⛔ 「못 쟀다」와 「안 바뀐다」를 가른다 — 이 자를 지을 때 그 둘을 섞어 거짓 초록을 냈다.
 * @param 전 [[글, 색], …] 켜기전
 * @param 후 [[글, 색], …] 켠뒤
 */
export function 판정(전, 후) {
  if (!전?.length) {
    return { 빛: '⬜', 말: '못 쟀다 — 천간지지 글자를 하나도 못 찾았다. ⛔ 「안 바뀐다」가 아니다' };
  }
  const 전색 = new Set(전.map((x) => x[1]));
  const 후색 = new Set(후.map((x) => x[1]));
  if (후색.size < 전색.size) {
    return {
      빛: '🔴',
      말: `색이 ${전색.size - 후색.size}가지 «뭉개졌다» — 오행이 서로 구별이 안 된다.`
        + ' ⛔ 이것은 읽힘이 아니라 «뜻»을 잃는 것이다',
      전가짓수: 전색.size, 후가짓수: 후색.size,
    };
  }
  /* 가짓수가 같아도 빛깔이 통째로 돌아갔으면 뜻이 바뀐 것이다 */
  const 후맵 = new Map(후);
  let 빛깔바뀐수 = 0;
  for (const [글, c] of 전) {
    /* 🔴 [2026-10-12] 거의 회색인 글자는 «지킬 빛깔»이 없다. 처음에 이것을 안 가려
       庚·辰(연회색 → 먹보라)을 「빛깔이 돌았다」로 세고 거짓 ⚠ 를 냈다.
       ⛔ 색이 «없는» 것과 색이 «바뀐» 것은 다르다. */
    if ((채도(c) ?? 0) < 0.4) continue;
    const h1 = 빛깔(c); const h2 = 빛깔(후맵.get(글));
    if (h1 == null || h2 == null) continue;
    const 벌어짐 = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
    if (벌어짐 > 40) 빛깔바뀐수 += 1;
  }
  if (빛깔바뀐수 > 0) {
    return {
      빛: '⚠',
      말: `가짓수는 ${전색.size}로 그대로인데 «빛깔»이 돌아간 글자가 ${빛깔바뀐수}개다`
        + ' — 색이 서로 다르기는 한데 오행과 짝이 맞는지는 사람이 본다',
      전가짓수: 전색.size, 후가짓수: 후색.size,
    };
  }
  return {
    빛: '✅',
    말: `가짓수 ${전색.size} 그대로 · 빛깔도 지켜졌다 — 오행이 서로 구별된다`,
    전가짓수: 전색.size, 후가짓수: 후색.size,
  };
}

/** 채도. 거의 회색이면 0 에 가깝다 — 회색은 «지킬 빛깔»이 없다. */
export function 채도(c) {
  const m = String(c ?? '').match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  const r = +m[0] / 255; const g = +m[1] / 255; const b = +m[2] / 255;
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b);
  if (mx === mn) return 0;
  const l = (mx + mn) / 2; const d = mx - mn;
  return l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
}

/* ── 브라우저 안에서 도는 것 ────────────────────────────────────────── */
export const 훑기본문 = `(() => {
  const 천간지지 = '${천간지지}';
  const 모음 = new Map();
  for (const e of document.querySelectorAll('body *')) {
    const 글 = (e.textContent || '').trim();
    if (글.length !== 1 || !천간지지.includes(글) || e.children.length > 0) continue;
    /* 🔴 테마가 그리는 명반 바퀴에도 천간지지가 있다. 그것을 세면 «본문이 뭉개졌다»는
       거짓 빨간불이 난다. 이 한 줄이 없어서 「9가지가 1가지로」를 낼 뻔했다. */
    if (e.closest('#klm-dawn') || e.closest('svg')) continue;
    if (!모음.has(글)) 모음.set(글, getComputedStyle(e).color);
  }
  return [...모음.entries()];
})()`;

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 같나 = (무엇, 잰것, 바라는것) => {
    const 맞나 = JSON.stringify(잰것) === JSON.stringify(바라는것);
    if (맞나) { 통과 += 1; console.log('  ✅ ' + 무엇); } else {
      실패 += 1;
      console.log('  🔴 ' + 무엇 + '  잰것 ' + JSON.stringify(잰것)
        + ' / 바란것 ' + JSON.stringify(바라는것));
    }
  };

  /* ── 빛깔 뽑기 ── */
  같나('빨강의 빛깔은 0 쯤', 빛깔('rgb(154, 58, 34)') < 20, true);
  같나('초록의 빛깔은 100~160 쯤', 빛깔('rgb(63, 107, 58)') > 100 && 빛깔('rgb(63, 107, 58)') < 160, true);
  같나('파랑의 빛깔은 190~250 쯤', 빛깔('rgb(79, 127, 174)') > 190 && 빛깔('rgb(79, 127, 174)') < 250, true);
  같나('회색은 빛깔이 0', 빛깔('rgb(100, 100, 100)'), 0);
  같나('⬜ 못 읽는 것은 null — 0 이 아니다', 빛깔('없음'), null);

  /* ── 🔴 못 쟀다 vs 안 바뀐다 — 이 자를 지을 때 섞어서 거짓 초록을 냈다 ── */
  같나('🔴 하나도 못 찾으면 ⬜ 다 (⛔ ✅ 가 아니다)', 판정([], []).빛, '⬜');
  같나('   그 말에 «못 쟀다»가 든다', /못 쟀다/.test(판정([], []).말), true);
  같나('   그 말이 «안 바뀐다»가 아님을 못박는다',
    /안 바뀐다»가 아니다|「안 바뀐다」가 아니다/.test(판정([], []).말), true);

  /* ── 뭉개짐 ── */
  const 전3 = [['己', 'rgb(253,224,71)'], ['巳', 'rgb(252,165,165)'], ['卯', 'rgb(134,239,172)']];
  const 뭉갠것 = [['己', 'rgb(147,86,10)'], ['巳', 'rgb(147,86,10)'], ['卯', 'rgb(147,86,10)']];
  같나('🔴 셋이 한 색이 되면 빨간불', 판정(전3, 뭉갠것).빛, '🔴');
  같나('   몇 가지가 뭉개졌는지 적는다', /2가지/.test(판정(전3, 뭉갠것).말), true);
  같나('   «뜻»을 잃는 것이라고 적는다 — 읽힘과 다르다', /뜻/.test(판정(전3, 뭉갠것).말), true);

  /* ── 빛깔을 지키며 어둡게 — 고친 뒤의 꼴 ── */
  const 지킨것 = [['己', 'rgb(137,117,11)'], ['巳', 'rgb(137,11,11)'], ['卯', 'rgb(17,131,58)']];
  같나('✅ 빛깔을 지키고 밝기만 낮추면 초록불', 판정(전3, 지킨것).빛, '✅');
  같나('   가짓수를 적는다', 판정(전3, 지킨것).전가짓수, 3);

  /* ── ⚠ 가짓수는 같은데 빛깔이 돌아간 것 ── */
  const 돌아간것 = [['己', 'rgb(11,137,137)'], ['巳', 'rgb(11,11,137)'], ['卯', 'rgb(137,11,137)']];
  같나('⚠ 가짓수가 같아도 빛깔이 돌면 ⚠ 다', 판정(전3, 돌아간것).빛, '⚠');
  같나('   사람이 봐야 한다고 적는다', /사람이 본다/.test(판정(전3, 돌아간것).말), true);

  /* ── 🔴 장식을 세지 않는다 ── */
  같나('⛔ 명반 바퀴(#klm-dawn)를 뺀다 — 안 빼면 거짓 빨간불이 난다',
    훑기본문.includes("e.closest('#klm-dawn')"), true);
  같나('⛔ svg 도 뺀다', 훑기본문.includes("e.closest('svg')"), true);
  같나('천간지지 스물둘을 다 본다', 천간지지.length, 22);

  /* ── 🔴 회색은 지킬 빛깔이 없다 — 이것을 안 가려 거짓 ⚠ 를 냈다 ── */
  같나('빨강은 채도가 높다', 채도('rgb(252,165,165)') > 0.6, true);
  같나('연회색은 채도가 낮다', 채도('rgb(226,232,240)') < 0.4, true);
  같나('완전한 회색은 채도 0', 채도('rgb(100,100,100)'), 0);
  const 회색전 = [['庚', 'rgb(226,232,240)'], ['辰', 'rgb(226,232,240)'], ['乙', 'rgb(63,107,58)']];
  const 회색후 = [['庚', 'rgb(30,15,69)'], ['辰', 'rgb(30,15,69)'], ['乙', 'rgb(63,107,58)']];
  같나('✅ 회색이 먹색이 되는 것은 «빛깔이 돌았다»가 아니다', 판정(회색전, 회색후).빛, '✅');
  같나('🔴 채도 있는 색이 돌면 그건 잡는다',
    판정([['巳', 'rgb(252,165,165)'], ['卯', 'rgb(134,239,172)']],
        [['巳', 'rgb(11,11,137)'], ['卯', 'rgb(137,11,137)']]).빛, '⚠');

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
async function 잰다() {
  if (!fs.existsSync(테마길)) {
    console.log('⬜ 테마 파일이 없다 — ' + 테마길);
    return 2;
  }
  const 테마글 = fs.readFileSync(테마길, 'utf8');
  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  const puppeteer = await import('puppeteer-core');
  const b = await puppeteer.default.connect({
    browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 5 * 60_000,
  });
  try {
    const page = await b.newPage();
    await page.setViewport({ width: 1366, height: 1100 });
    await page.goto('https://klifemap.ai/saju.html', { waitUntil: 'networkidle2', timeout: 90000 });
    await 잠깐(1800);

    /* ⛔ 입력칸 id 를 기억으로 적지 않는다 — check-klifemap-테마가-화면을-깨나.mjs 에서 베꼈다 */
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
    await 잠깐(2200);

    const 전 = await page.evaluate(훑기본문);
    await page.addScriptTag({ content: 테마글 });
    await 잠깐(3500);
    const 후 = await page.evaluate(훑기본문);
    await page.close().catch(() => {});

    const 후맵 = new Map(후);
    console.log('■ 사주 원국표 — 천간지지 색이 테마로 «뜻»을 잃나');
    console.log('   글자  켜기전                    켠뒤');
    for (const [글, c] of 전) {
      const c2 = 후맵.get(글) ?? '(사라짐)';
      console.log('   ' + 글 + '     ' + String(c).padEnd(24) + (c !== c2 ? '🔄 ' : '   ') + c2);
    }
    const p = 판정(전, 후);
    console.log('');
    console.log('   ' + p.빛 + ' ' + p.말);
    console.log('   ⚠ 이 자가 못 보는 것 — «어느 색이 어느 오행인가»가 뒤바뀌었는지는 모른다');

    const 대장 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..',
      'docs', '테마가-뜻을가진색을-뭉개나.tsv');
    const 때 = new Date().toLocaleString('sv-SE').replace('T', ' ');
    const 줄 = 전.map(([글, c]) => [때, 글, c, 후맵.get(글) ?? '', p.빛].join('\t')).join('\n');
    fs.appendFileSync(대장,
      (fs.existsSync(대장) ? '' : '잰때\t글자\t켜기전\t켠뒤\t빛\n') + 줄 + '\n', 'utf8');
    console.log('   ✔ 대장에 적었다 — docs/테마가-뜻을가진색을-뭉개나.tsv');
    return p.빛 === '🔴' ? 1 : 0;
  } finally {
    await b.disconnect();   /* ⛔ close() 가 아니다 — 사장님 창이 닫힌다 */
  }
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  } else {
    process.exit(await 잰다());
  }
}
