#!/usr/bin/env node
/**
 * check-홈에서-몇홉인가.mjs — **첫 화면에서 각 묶음까지 몇 번 눌러야 닿나.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 06:0x · 5번) ───────────────────────────
 *   밤새 색인이 막힌 까닭을 찾아 가설 넷을 세웠고 **넷 다 틀렸다** —
 *   겹침도 아니고, 들어오는 링크 «수»도 아니고, 문이 아예 없는 것도 아니고,
 *   구글의 제재도 아니었다(서치콘솔에 수동 조치·보안 문제 없음).
 *
 *   다섯째로 **홈에서의 «거리»**를 재 보니 수가 갈렸다 —
 *   ```
 *   시장    홈에서 링크     회사 지면 색인(표본 4장)
 *   일본      (길 있음)        4/4   ✅
 *   한국      (길 있음)        2/4
 *   대만        0개            0/4   🔴 구글이 한 번도 안 왔다 (1,057장)
 *   걸프        0개            0/4   🔴 구글이 한 번도 안 왔다 (  104장)
 *   ```
 *   **홈에서 안 닿는 묶음은 통째로 안 온다.** 사이트맵에는 넷 다 들어 있었다.
 *   ⭐ 구글은 사이트맵으로 «알고», 링크를 타고 «온다». 둘은 다른 일이다.
 *
 * ── ⛔ 이 자가 안 하는 것 ─────────────────────────────────────────────
 * ⛔ **링크 «수»를 세지 않는다.** 그것은 `check-inbound-links.mjs` 가 한다. 그리고
 *   2026-10-04 에 재 보니 링크 수는 색인을 가르는 축이 «아니었다»
 *   (`/about` 은 3,016개가 들어오는데 색인 안 됐고, 링크 3개짜리는 색인됐다).
 *   여기서 보는 것은 **거리**다 — 0개와 1개의 차이는 크고, 3개와 3,000개의 차이는 작다.
 * ⛔ 「몇 홉이면 좋다」를 말하지 않는다. 수를 내고 멈춘다. 판정은 사람이 한다.
 * ⚠ **dist 안의 파일만 읽는다.** 서버가 그때그때 그려 내는 지면(예: klifemap `/content`)은
 *   파일이 아니므로 이 자가 못 본다 — 그 사이트에 쓰면 「안 닿는다」가 거짓이 된다.
 *   2026-10-04 에 그 흠으로 사장님께 틀린 보고를 올렸다. SeoulMarkets 은 정적이라 괜찮다.
 *
 * 쓰는 법
 *   node scripts/check-홈에서-몇홉인가.mjs
 *   node scripts/check-홈에서-몇홉인가.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 🔴🔴 [2026-10-04 06:0x] **한 dist 에 «사이트 셋»이 들어 있다 — 홈도 셋이다.**
 *
 *   처음에 `dist/index.html` 하나에서 재었더니 「홈에서 한 번도 안 닿는 묶음」으로
 *   `/100y/school` 2,526장 · `/wikitip/person` 637장 … 7,500장이 넘게 나왔다.
 *   **거짓이다.** `/100y` 는 100yearmap.com 이 내고 `/wikitip` 은 kculturewire.com 이 낸다.
 *   seoulmarkets 의 홈에서 안 닿는 것이 당연하다 — 손님이 거기로 들어오지 않는다.
 *   ⇒ 메모리 「자를-먼저-의심한다-0이-나오면」 자리다. 같은 밤에 네 번째다.
 *
 * ⚠ `/japan`·`/taiwan`·`/uae` 는 **seoulmarkets 의 하위 구역**이다(자기 홈이 없다).
 *   그래서 사이트가 아니라 접두사로만 다룬다.
 * ⚠ 그리고 지면 «안»의 링크는 접두사 없이 적힌다 — `/100y/school/x` 안에서 `/school/y` 로 간다.
 *   서버가 호스트를 보고 접두사를 붙인다. 그래서 걸을 때 «그 지면의 접두사»를 붙여 찾는다.
 */
export const 사이트들 = [
  { 이름: 'seoulmarkets', 접두사: '', 홈: '/' },
  { 이름: '100yearmap', 접두사: '/100y', 홈: '/100y' },
  { 이름: 'kculturewire', 접두사: '/wikitip', 홈: '/wikitip' },
];

/** 묶음 이름을 지을 때 한 칸 더 보는 접두사 (seoulmarkets 안의 구역도 포함) */
export const 사이트접두사 = ['/wikitip', '/100y', '/japan', '/taiwan', '/uae'];

/** 그 길이 어느 사이트 것인가 — 가장 긴 접두사가 이긴다 */
export function 어느사이트(길) {
  const s = String(길 ?? '');
  for (const x of 사이트들) {
    if (x.접두사 && (s === x.접두사 || s.startsWith(x.접두사 + '/'))) return x;
  }
  return 사이트들[0];
}

/**
 * 🔴 [2026-10-04 06:1x] **퍼센트 인코딩 주소를 파일 이름과 못 맞추고 있었다.**
 *
 *   `/100y/college-major` 가 「837장 가운데 400장만 닿는다(48%)」로 나왔다. 파 보니
 *   목록은 **837개 전부**에 링크를 걸고 있었다. 꼴이 이랬다 —
 *   ```
 *   목록의 링크   /college-major/%EA%B0%80%EC%A0%95%EA%B5%90%EC%9C%A1%EA%B3%BC
 *   파일 이름     /100y/college-major/가정교육과
 *   ```
 *   같은 지면인데 글자가 달라 못 찾은 것이다. **437장이 거짓으로 「안 닿는다」였다.**
 *   ⚠ 이 흠은 내 메모에 이미 적혀 있었다 — 「100yearmap 의 /major 는 퍼센트
 *     인코딩이라 아예 못 쟀다」. 적어 두고도 새 자에 그대로 되풀이했다.
 *
 * ⛔ 디코딩이 터지면(깨진 인코딩) 날것을 그대로 쓴다 — 지면 하나 때문에 자가 죽지 않는다.
 */
export function 길풀기(길) {
  const s = String(길 ?? '');
  if (!s.includes('%')) return s;
  try { return decodeURIComponent(s); } catch { return s; }
}

export function 안쪽길들(html) {
  const 것 = [];
  for (const m of String(html ?? '').matchAll(/href\s*=\s*"(\/[^"]*)"/g)) {
    const 날것 = m[1];
    if (날것.startsWith('//')) continue;                 /* //evil.com 은 바깥이다 */
    const 길 = 길풀기(날것.split(/[?#]/)[0]).replace(/\/+$/, '') || '/';
    것.push(길);
  }
  return [...new Set(것)];
}

/** 손님이 여는 주소 — `a/index.html` 은 `/a` 이고 `a.html` 도 `/a` 다 */
export function 손님길(파일, 밑) {
  const r = path.relative(밑, 파일).replace(/\\/g, '/');
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'/index.html'.length);
  if (r.endsWith('.html')) return '/' + r.slice(0, -'.html'.length);
  return '/' + r;
}

/** 묶음 이름 — `/japan/company/ukai` → `/japan/company` */
export function 묶음(길) {
  const 조각 = String(길 ?? '').split('/').filter(Boolean);
  if (!조각.length) return '/';
  /* 사이트 접두사가 앞에 붙으면 한 칸 더 본다 — /japan 과 /japan/company 는 다른 묶음이다 */
  const 접두사붙음 = 사이트접두사.includes('/' + 조각[0]);
  const 깊이 = 접두사붙음 ? 2 : 1;
  return '/' + 조각.slice(0, 깊이).join('/');
}

/**
 * 홈에서 너비우선으로 걸어 각 지면까지의 홉수를 낸다.
 * ⛔ 못 닿은 지면을 0 으로 적지 않는다 — 목록에 «없다»로 둔다. 그것이 사실이다.
 */
export function 홉재기(지면들, { 시작 = '/', 최대홉 = 6, 접두사 = '' } = {}) {
  const 사전 = new Map(지면들.map((p) => [p.길, p.링크 ?? []]));
  const 홉 = new Map();
  if (!사전.has(시작)) return 홉;                        /* 홈이 없으면 잴 수 없다 */
  홉.set(시작, 0);
  let 테두리 = [시작];
  for (let d = 1; d <= 최대홉 && 테두리.length; d++) {
    const 다음 = [];
    for (const 여기 of 테두리) {
      for (const 날것 of 사전.get(여기) ?? []) {
        /* 🔴 지면 안 링크는 접두사 없이 적힌다 — 내 접두사를 붙여서도 찾아본다.
           ⛔ 붙인 쪽을 «먼저» 본다. /100y 안에서 /school 은 /100y/school 이지
             seoulmarkets 의 /school 이 아니다. */
        const 후보 = 접두사 && !날것.startsWith(접두사 + '/') && 날것 !== 접두사
          ? [접두사 + 날것, 날것] : [날것];
        const 그리로 = 후보.find((c) => 사전.has(c));
        if (!그리로) continue;                           /* 지면이 없는 링크는 안 센다 */
        if (홉.has(그리로)) continue;
        홉.set(그리로, d);
        다음.push(그리로);
      }
    }
    테두리 = 다음;
  }
  return 홉;
}

/** 묶음마다 «가장 가까운 지면»의 홉수. 못 닿으면 null — 0 으로 적지 않는다 */
export function 묶음별가장가까운홉(지면들, 홉) {
  const 것 = new Map();
  for (const p of 지면들) {
    const g = 묶음(p.길);
    const d = 홉.has(p.길) ? 홉.get(p.길) : null;
    const 이제 = 것.get(g) ?? { 묶음: g, 장수: 0, 가장가까운: null, 닿은장수: 0 };
    이제.장수 += 1;
    if (d != null) {
      이제.닿은장수 += 1;
      if (이제.가장가까운 == null || d < 이제.가장가까운) 이제.가장가까운 = d;
    }
    것.set(g, 이제);
  }
  return [...것.values()];
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참, 덧 = '') => 결과.push({ 이름, 참: !!참, 덧 });

  본다('안쪽 링크를 뽑는다', 안쪽길들('<a href="/a">x</a><a href="/b/">y</a>').join(',') === '/a,/b');
  본다('⛔ 바깥 주소를 안 센다', 안쪽길들('<a href="https://x.com/a">x</a>').length === 0);
  본다('⛔ //evil 을 안쪽으로 안 읽는다', 안쪽길들('<a href="//evil.com/a">x</a>').length === 0);
  본다('⛔ 물음표·우물정은 자른다', 안쪽길들('<a href="/a?x=1#y">z</a>')[0] === '/a');
  본다('⛔ 같은 길을 한 번만 센다', 안쪽길들('<a href="/a">1</a><a href="/a/">2</a>').length === 1);
  본다('⛔ 빈 것에 안 터진다', 안쪽길들(null).length === 0);
  /* 🔴 [2026-10-04] 퍼센트 인코딩 때문에 437장을 거짓으로 「안 닿는다」고 하던 자리 */
  본다('🔴 퍼센트 인코딩 주소를 파일 이름과 맞춘다',
    안쪽길들('<a href="/college-major/%EA%B0%80%EC%A0%95%EA%B5%90%EC%9C%A1%EA%B3%BC">x</a>')[0]
    === '/college-major/가정교육과');
  본다('⛔ 깨진 인코딩에 안 터진다 — 날것을 그대로 쓴다', 길풀기('/a%ZZ') === '/a%ZZ');
  본다('⛔ 퍼센트가 없으면 그대로다', 길풀기('/a/b') === '/a/b');
  본다('⛔ 빈 것·null 에 안 터진다', 길풀기(null) === '' && 길풀기('') === '');
  본다('⛔ 풀어도 같은 길은 한 번만 센다',
    안쪽길들('<a href="/a/%EA%B0%80">1</a><a href="/a/가">2</a>').length === 1);

  본다('index.html 은 홈이다', 손님길('d/index.html', 'd') === '/');
  본다('a/index.html 은 /a 다', 손님길('d/a/index.html', 'd') === '/a');
  본다('a.html 도 /a 다', 손님길('d/a.html', 'd') === '/a');

  본다('묶음을 가른다', 묶음('/company/abc') === '/company');
  본다('🔴 사이트 접두사가 붙으면 한 칸 더 본다', 묶음('/japan/company/ukai') === '/japan/company');
  본다('⛔ 접두사만 있으면 그대로다', 묶음('/japan') === '/japan');
  본다('⛔ 홈은 홈이다', 묶음('/') === '/');

  /* 홈 → /a → /a/x · /b 는 아무도 안 건다 */
  const 지면 = [
    { 길: '/', 링크: ['/a'] },
    { 길: '/a', 링크: ['/a/x'] },
    { 길: '/a/x', 링크: [] },
    { 길: '/b', 링크: [] },
    { 길: '/b/y', 링크: [] },
  ];
  const 홉 = 홉재기(지면);
  본다('홈은 0홉', 홉.get('/') === 0);
  본다('한 번 눌러 닿으면 1홉', 홉.get('/a') === 1);
  본다('두 번이면 2홉', 홉.get('/a/x') === 2);
  본다('🔴 아무도 안 거는 지면은 «목록에 없다» — 0 으로 적지 않는다', !홉.has('/b'));
  본다('⛔ 지면이 없는 링크는 안 센다', 홉재기([{ 길: '/', 링크: ['/없다'] }]).size === 1);
  본다('⛔ 홈이 없으면 빈 결과다', 홉재기([{ 길: '/a', 링크: [] }]).size === 0);
  본다('⛔ 고리가 있어도 안 돈다', 홉재기([
    { 길: '/', 링크: ['/a'] }, { 길: '/a', 링크: ['/'] },
  ]).get('/a') === 1);

  /* 🔴 [2026-10-04] 사이트 셋을 한 홈에서 재어 7,500장을 거짓으로 「묻혔다」고 하던 자리 */
  본다('🔴 /100y 는 100yearmap 것이다', 어느사이트('/100y/school/x').이름 === '100yearmap');
  본다('🔴 /wikitip 은 kculturewire 것이다', 어느사이트('/wikitip/person/x').이름 === 'kculturewire');
  본다('⛔ /japan 은 seoulmarkets 의 구역이다 — 따로 사이트가 아니다',
    어느사이트('/japan/company/x').이름 === 'seoulmarkets');
  본다('⛔ 접두사 없는 길은 seoulmarkets 다', 어느사이트('/company/x').이름 === 'seoulmarkets');
  본다('⛔ 비슷한 이름에 안 속는다 — /100yearbook 은 100yearmap 이 아니다',
    어느사이트('/100yearbook').이름 === 'seoulmarkets');

  /* 접두사 사이트: 지면 안 링크는 접두사 없이 적힌다 */
  const 백년 = [
    { 길: '/100y', 링크: ['/school'] },
    { 길: '/100y/school', 링크: ['/school/7531382'] },
    { 길: '/100y/school/7531382', 링크: [] },
    { 길: '/school', 링크: [] },                       /* seoulmarkets 의 같은 이름 — 헷갈리면 안 된다 */
  ];
  const 백년홉 = 홉재기(백년, { 시작: '/100y', 접두사: '/100y' });
  본다('🔴 접두사 없이 적힌 안쪽 링크를 내 접두사로 찾는다', 백년홉.get('/100y/school') === 1);
  본다('🔴 두 홉까지 따라간다', 백년홉.get('/100y/school/7531382') === 2);
  본다('⛔ 남의 사이트의 같은 이름으로 새지 않는다', !백년홉.has('/school'));

  const 묶 = 묶음별가장가까운홉(지면, 홉);
  const b = 묶.find((x) => x.묶음 === '/b');
  본다('🔴 못 닿은 묶음은 가장가까운이 null 이다', b && b.가장가까운 === null);
  본다('🔴 그래도 장수는 센다 — 몇 장이 묻혀 있는지가 요점이다', b && b.장수 === 2);
  const a = 묶.find((x) => x.묶음 === '/a');
  본다('닿은 묶음은 가장 가까운 홉을 낸다', a && a.가장가까운 === 1 && a.닿은장수 === 2);

  return 결과;
}

/* ── 실제로 잰다 ───────────────────────────────────────────────── */
const 이파일이진입점 =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점) {
  if (process.argv.includes('--자가시험')) {
    const 결과 = 자가시험();
    let 빨강 = 0;
    console.log('■ 홈에서 몇 홉인가 — 자가시험');
    for (const r of 결과) {
      if (!r.참) 빨강++;
      console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}${r.덧 ? `  (${r.덧})` : ''}`);
    }
    console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
    process.exit(빨강 ? 1 : 0);
  }

  const 밑 = path.join(뿌리, 'dist');
  if (!fs.existsSync(밑)) {
    console.log('⬜ dist 가 없다 — node scripts/build-once.mjs 를 먼저 돌린다');
    process.exit(0);
  }
  const 지면들 = [];
  (function 걷(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) 걷(p);
      else if (e.name.endsWith('.html')) {
        지면들.push({ 길: 손님길(p, 밑), 링크: 안쪽길들(fs.readFileSync(p, 'utf8')) });
      }
    }
  }(밑));

  console.log(`■ 홈에서 몇 홉이면 닿나 — 지면 ${지면들.length}장\n`);
  console.log('   ⛔ 이 자는 수를 낼 뿐이다. 「몇 홉이면 좋다」를 말하지 않는다.');
  console.log('   ⚠ 한 dist 에 사이트가 셋이다 — 각자 «자기 홈»에서 잰다.\n');

  let 못닿음전부 = 0;
  for (const s of 사이트들) {
    /* 그 사이트의 지면만 모은다 — 남의 사이트 지면을 섞으면 거짓 빨강이 난다 */
    const 내것 = 지면들.filter((p) => 어느사이트(p.길).이름 === s.이름);
    if (!내것.length) continue;
    const 홉 = 홉재기(내것, { 시작: s.홈, 접두사: s.접두사 });
    const 묶 = 묶음별가장가까운홉(내것, 홉)
      .filter((x) => x.장수 >= 20)                       /* 작은 묶음은 잡음이다 */
      .sort((a, b) => b.장수 - a.장수);

    console.log(`── ${s.이름}  (홈 ${s.홈} · 지면 ${내것.length}장 · 묶음 ${묶.length}개)`);
    if (!홉.size) { console.log('   ⬜ 홈 지면을 못 찾았다 — 못 쟀다\n'); continue; }
    const 못닿음 = [];
    for (const x of 묶) {
      if (x.가장가까운 == null) { 못닿음.push(x); continue; }
      const 몫 = Math.round((x.닿은장수 / x.장수) * 100);
      console.log(`   ${String(x.가장가까운)}홉  ${x.묶음.padEnd(22)} ${String(x.장수).padStart(5)}장 · 닿는 것 ${몫}%`);
    }
    if (못닿음.length) {
      못닿음전부 += 못닿음.length;
      console.log('   🔴 홈에서 «한 번도» 안 닿는 묶음');
      for (const x of 못닿음) console.log(`        ${x.묶음.padEnd(22)} ${String(x.장수).padStart(5)}장이 통째로 묻혀 있다`);
    } else {
      console.log('   ✅ 20장 넘는 묶음은 모두 홈에서 닿는다');
    }
    console.log('');
  }

  if (못닿음전부) {
    console.log('⭐ 2026-10-04 실측 — 홈에서 안 닿던 /taiwan/company(1,057장)·/uae/company(104장)은');
    console.log('  구글에 물으니 표본 네 장이 «다» 「한 번도 안 왔다」였다. 일본은 길이 있었고 4/4 색인됐다.');
    console.log('  ⛔ 사이트맵에 넣는 것으로는 안 온다. 첫 화면이나 가까운 목록에서 닿게 한다.');
  }
}
