/**
 * check-kcw-canonical.mjs — **canonical 태그가 «빠진 채로» 나가는 것을 잡는다.** (5번, 2026-09-07)
 *
 * ── 🔴 왜 이 자가 생겼나 ─────────────────────────────────────
 * 오늘 낸 지면 셋(`/webtoon-adaptations` · `/group-afterlife` · `/what-countries-read`)이
 * **canonical 없이 라이브로 나갔다.** 까닭은 한 글자다 —
 *
 * ```
 * <WikiTip title={T} description={D} page="/webtoon-adaptations">      ← 내가 쓴 것
 * <WikiTip title={T} description={D} canonical="https://…/by-country"> ← 나머지 121장이 쓰던 것
 * ```
 *
 * 레이아웃이 `page` 라는 이름을 **받지 않았다.** 넘기는 쪽만 있고 받는 쪽이 없으면
 * Astro 는 오류를 내지 않고 **조용히 버린다.** 빌드도 통과하고 지면도 200 이다.
 * ⛔ 그리고 canonical 이 없으면 **구글이 그 지면을 색인에서 뺀다 — 그것도 조용히.**
 * 사장님이 지메일로 「검색 색인 안 됐다」를 받으신 그 갈래의 결함이다.
 *
 * ⭐ 레이아웃은 고쳤다(`page` 도 받는다). 이 자는 «다음에 또 다른 이름으로 틀릴 때»를 막는다.
 *   조용한 결함은 문장으로 막을 수 없다. 검사로 굳힌다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ 「빌드가 통과했다」·「200 이 온다」로 판정하지 않는다. **나간 HTML 을 열어 본다.**
 * ⛔ canonical 이 «있다»로 끝내지 않는다. **주소가 그 지면 자신을 가리키는지** 본다.
 *   남을 가리키는 canonical 은 없는 것보다 나쁘다 — 구글에 「나를 빼라」고 말하는 것이다.
 * ⚠ 404 지면은 예외다. 없는 지면에 정본을 세우면 안 된다.
 * ⚠ noindex 지면도 예외로 둔다 — 색인에 안 넣기로 «일부러» 정한 것이다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-canonical.mjs            dist 를 훑는다
 *   node scripts/check-kcw-canonical.mjs --시험만
 */
import fs from 'node:fs';
import path from 'node:path';

export const 바탕 = 'https://www.kculturewire.com';

/** ⚠ 일부러 canonical 을 안 두는 지면. 늘리려면 «까닭»을 함께 적는다 */
export const 봐줌 = [
  { 이름: '404', 까닭: '없는 지면에 정본을 세우면 안 된다' },
];

export function 봐주나(이름) {
  return 봐줌.some((x) => x.이름 === String(이름));
}

export function canonical뽑기(html) {
  const h = String(html ?? '');
  const a = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(h);
  if (a) return a[1];
  const b = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i.exec(h);
  return b ? b[1] : null;
}

export function noindex인가(html) {
  const m = /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i.exec(String(html ?? ''));
  return m ? /noindex/i.test(m[1]) : false;
}

/** 지면 이름 → 그 지면이 가리켜야 하는 주소. ⚠ 끝 슬래시는 없는 꼴로 맞춘다 */
export function 있어야할주소(이름) {
  const n = String(이름 ?? '').replace(/\\/g, '/');
  if (n === 'index') return 바탕 + '/';
  return `${바탕}/${n.replace(/\/index$/, '')}`;
}

export function 같은주소인가(a, b) {
  const 씻 = (x) => String(x ?? '').trim().replace(/\/+$/, '').toLowerCase();
  if (씻(a) === 씻(b)) return true;
  /* 뿌리 지면은 「/」 하나만 남는다 */
  return 씻(a) === 씻(바탕) && 씻(b) === 씻(바탕);
}

/** 지면 한 장의 판정 — ⛔ 「없다」와 「남을 가리킨다」를 다른 말로 낸다 */
export function 지면재기({ 이름, html }) {
  if (봐주나(이름)) return { 이름, 판정: '봐줌', 까닭: 봐줌.find((x) => x.이름 === 이름).까닭 };
  const c = canonical뽑기(html);
  if (noindex인가(html)) return { 이름, 판정: '봐줌', 까닭: 'noindex — 색인에 안 넣기로 일부러 정한 지면이다' };
  if (c === null) return { 이름, 판정: '없다', 까닭: 'canonical 태그가 아예 없다 — 구글이 조용히 색인에서 뺀다' };
  const 있어야 = 있어야할주소(이름);
  if (!같은주소인가(c, 있어야)) {
    return { 이름, 판정: '남을가리킨다', canonical: c, 있어야, 까닭: '구글에 「나를 빼고 저것을 써라」고 말하는 것이다 — 없는 것보다 나쁘다' };
  }
  return { 이름, 판정: '맞다', canonical: c };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 실 = 0;
  const 봐 = (말, 참) => { if (참) { 통++; console.log('  ✅ ' + 말); } else { 실++; console.log('  🔴 ' + 말); } };

  봐('rel 이 앞에 있어도 뽑는다',
    canonical뽑기('<link rel="canonical" href="https://x/y">') === 'https://x/y');
  봐('href 가 앞에 있어도 뽑는다',
    canonical뽑기('<link href="https://x/y" rel="canonical">') === 'https://x/y');
  봐('홑따옴표도 뽑는다', canonical뽑기("<link rel='canonical' href='https://x/y'>") === 'https://x/y');
  봐('⛔ 없으면 빈 글자가 아니라 null', canonical뽑기('<html></html>') === null);
  봐('⛔ 다른 link 를 canonical 로 안 본다', canonical뽑기('<link rel="stylesheet" href="/a.css">') === null);

  봐('noindex 를 읽는다', noindex인가('<meta name="robots" content="noindex, nofollow">') === true);
  봐('index 는 noindex 가 아니다', noindex인가('<meta name="robots" content="index, follow">') === false);
  봐('robots 가 없으면 noindex 가 아니다', noindex인가('<html></html>') === false);

  봐('뿌리 지면의 주소는 슬래시로 끝난다', 있어야할주소('index') === 바탕 + '/');
  봐('보통 지면 주소', 있어야할주소('by-country') === 바탕 + '/by-country');
  봐('폴더 꼴 index 는 폴더 주소가 된다', 있어야할주소('firm/index') === 바탕 + '/firm');

  봐('끝 슬래시 차이는 같은 주소로 본다',
    같은주소인가(바탕 + '/a/', 바탕 + '/a') === true);
  봐('대소문자 차이도 같은 주소로 본다',
    같은주소인가(바탕 + '/A', 바탕 + '/a') === true);
  봐('⛔ 다른 지면은 같은 주소가 아니다',
    같은주소인가(바탕 + '/a', 바탕 + '/b') === false);

  const 맞 = 지면재기({ 이름: 'by-country', html: `<link rel="canonical" href="${바탕}/by-country">` });
  봐('제 주소를 가리키면 맞다', 맞.판정 === '맞다');

  const 없 = 지면재기({ 이름: 'webtoon-adaptations', html: '<html><head><title>x</title></head></html>' });
  봐('🔴 canonical 이 없으면 «없다»로 잡는다', 없.판정 === '없다');
  봐('없을 때 까닭에 «조용히»가 들어간다', /조용히/.test(없.까닭));

  const 남 = 지면재기({ 이름: 'a', html: `<link rel="canonical" href="${바탕}/b">` });
  봐('🔴 남을 가리키면 «없다»와 다른 판정으로 낸다', 남.판정 === '남을가리킨다');
  봐('남을 가리킬 때 있어야 할 주소를 함께 낸다', 남.있어야 === 바탕 + '/a');
  봐('⛔ 남을 가리키는 것이 없는 것보다 나쁘다고 적는다', /없는 것보다 나쁘다/.test(남.까닭));

  봐('404 는 봐준다', 지면재기({ 이름: '404', html: '<html></html>' }).판정 === '봐줌');
  봐('404 를 봐주는 까닭이 적혀 있다', /없는 지면/.test(지면재기({ 이름: '404', html: '' }).까닭));
  봐('noindex 지면은 canonical 이 없어도 봐준다',
    지면재기({ 이름: 'x', html: '<meta name="robots" content="noindex">' }).판정 === '봐줌');

  console.log(`\ncanonical 검사 — 자가시험 ${통}가지 통과 · ${실}가지 실패`);
  if (실) process.exit(1);
  return 통;
}

/* ── 주된 일 ─────────────────────────────────────────────── */
function 훑기() {
  const 통 = 자가시험();
  const 방 = path.join('dist', 'wikitip');
  if (!fs.existsSync(방)) {
    console.log(`\n⬜ ${방} 이 없다 — 먼저 빌드한다(npm run build). 「없다」와 「못 쟀다」는 다른 말이다.`);
    return;
  }

  const 장 = [];
  const 걷기 = (곳, 앞 = '') => {
    for (const f of fs.readdirSync(곳, { withFileTypes: true })) {
      const 길 = path.join(곳, f.name);
      if (f.isDirectory()) { 걷기(길, 앞 + f.name + '/'); continue; }
      if (!f.name.endsWith('.html')) continue;
      장.push({ 이름: 앞 + f.name.replace(/\.html$/, ''), 길 });
    }
  };
  걷기(방);

  const 셈 = { 맞다: 0, 없다: 0, 남을가리킨다: 0, 봐줌: 0 };
  const 흠 = [];
  for (const { 이름, 길 } of 장) {
    const r = 지면재기({ 이름, html: fs.readFileSync(길, 'utf8') });
    셈[r.판정] = (셈[r.판정] ?? 0) + 1;
    if (r.판정 === '없다' || r.판정 === '남을가리킨다') 흠.push(r);
  }

  console.log(`\n■ dist/wikitip 지면 ${장.length}장`);
  console.log(`   ✅ 제 주소를 가리킨다      ${셈.맞다}장`);
  console.log(`   ⬜ 일부러 봐준 것          ${셈.봐줌}장`);
  console.log(`   ${셈.없다 ? '🔴' : '✅'} canonical 이 없다        ${셈.없다}장`);
  console.log(`   ${셈.남을가리킨다 ? '🔴' : '✅'} 남을 가리킨다            ${셈.남을가리킨다}장`);

  if (흠.length) {
    console.log('\n🔴 고쳐야 하는 지면');
    for (const r of 흠.slice(0, 40)) {
      console.log(`   · ${r.이름} — ${r.판정}`);
      console.log(`     ${r.까닭}`);
      if (r.canonical) console.log(`     지금: ${r.canonical}  ⇒  있어야: ${r.있어야}`);
    }
    console.log('\n⛔ 고치는 법 — WikiTip 에 둘 중 하나를 넘긴다:');
    console.log('     <WikiTip … page="/그-지면" >                       (레이아웃이 주소를 짓는다)');
    console.log('     <WikiTip … canonical="https://www.kculturewire.com/그-지면" >');
    console.log(`\n자가시험 ${통}가지 통과.`);
    process.exit(1);
  }
  console.log(`\n✅ canonical 이 빠지거나 엉뚱한 곳을 가리키는 지면이 없다.\n자가시험 ${통}가지 통과.`);
}

if (process.argv.includes('--시험만')) 자가시험();
else 훑기();
