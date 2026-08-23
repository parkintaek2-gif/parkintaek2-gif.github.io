#!/usr/bin/env node
/**
 * check-kcw-orphan-pages.mjs — **들어오는 문이 하나도 없는 지면을 잡는다.** (npm test)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 「만들고 문을 안 냈다」를 이 자리에서 **여섯 번** 겪었다.
 *   8/07 기사 12편 중 7편이 아무 지면에도 안 걸림
 *   8/21 띠 방 열두 장이 전부 기사 0개
 *   8/22 새 지면 `/day-pillar` 로 들어오는 문이 기사 하나뿐(2장)
 *   8/22 일간 방 열 장 — 짓고 나서 손으로 문을 냈다
 * 그때마다 **사람이 알아채서** 고쳤다. 사람이 기억해서 지키는 구조는 다음에 또 새어 나간다.
 * 우리 규칙이 「규칙은 문장이 아니라 검사로 둔다」다. 그래서 센다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * 나간 것(`dist/wikitip/**.html`)에서 **서로 가리키는 링크**를 세어,
 * 들어오는 링크가 0인 지면을 찾는다. 사이트맵에만 있는 지면은 «있다»고 안 센다 —
 * 구글은 링크를 타고 오고, 사람도 링크를 타고 온다.
 *
 * ⛔ 첫 화면(`/`)은 뺀다 — 들어오는 문이 밖에서 온다.
 * ⛔ 법·안내 지면(privacy·terms·refund·contact·404 등)은 봐준다. 목록에 까닭을 적는다.
 * ⚠ 빌드가 없으면 **「못 쟀다」로 끝낸다.** 없는 것을 빨강으로 만들지 않는다.
 *
 * 쓰는 법  node scripts/check-kcw-orphan-pages.mjs
 *          node scripts/check-kcw-orphan-pages.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낸방 = path.join(뿌리, 'dist/wikitip');

/**
 * 봐주는 것 — **까닭이 있어야 들어온다.** 이 목록은 줄어들기만 한다.
 * ⛔ 새 지면을 여기 넣어 자를 통과시키지 않는다. 문을 내는 것이 맞다.
 */
export const 봐준다 = {
  '/': '첫 화면 — 들어오는 문이 밖에서 온다',
  '/404': '없는 주소로 갔을 때만 뜬다',
  '/privacy': '법 지면 — 꼬리말에서만 걸린다',
  '/terms': '법 지면',
  '/refund': '법 지면',
  '/contact': '안내 지면',
  '/subscribe': '받아보기 — 자리마다 단추로 걸린다',
};

/**
 * ⭐ **접은 주소는 「들어오는 문이 없는 것」이 옳다** (2026-08-23).
 *
 * 한 번 냈다가 자료가 바뀌어 사라진 주소에는 「이 주소는 접었다 + 까닭 + 갈 곳」 지면을
 * 놓아 둔다(`check-kcw-retired-pages.mjs`). 그 지면의 손님은 **구글 결과에서만** 온다 —
 * 우리 안에서 그리로 가는 링크를 다시 내면 접은 주소를 다시 쓰는 셈이다.
 *
 * ⛔ 그래서 봐주긴 하지만 **위 목록에 손으로 적지 않는다.** 접은 주소는 자료가 바뀔 때마다
 *   늘거나 줄고, 손 목록은 반드시 어긋난다. 한 곳(그 자)에서 읽어 온다.
 * ⛔ 그리고 「봐준 것」으로 뭉개지 않고 **접힌 것으로 갈라 세어 화면에 적는다.**
 */
export async function 접힌주소들() {
  try {
    const m = await import('./check-kcw-retired-pages.mjs');
    const 사이트맵길 = m.사이트맵길;
    const 대장길 = m.대장길;
    if (!fs.existsSync(사이트맵길) || !fs.existsSync(대장길)) return null;   // 못 쟀다
    return new Set(m.접힌것(JSON.parse(fs.readFileSync(대장길, 'utf8')),
      fs.readFileSync(사이트맵길, 'utf8')));
  } catch {
    return null;
  }
}

/** 나간 파일 이름 → 주소. `index.html` 은 그 폴더의 주소다 */
export const 주소로 = (상대길) => {
  const p = '/' + 상대길.replace(/\\/g, '/').replace(/\.html$/, '');
  return p.replace(/\/index$/, '') || '/';
};

/** 한 글에서 우리 쪽 주소만 뽑는다. 앵커·물음표는 떼고 본다 */
export const 링크뽑기 = (글) => {
  const 것 = new Set();
  for (const m of 글.matchAll(/href="([^"]+)"/g)) {
    let u = m[1];
    if (/^https?:\/\/www\.kculturewire\.com/.test(u)) u = u.replace(/^https?:\/\/www\.kculturewire\.com/, '');
    if (!u.startsWith('/')) continue;                 /* 밖으로 나가는 링크는 안 센다 */
    u = u.split('#')[0].split('?')[0].replace(/\.html$/, '');
    if (u.length > 1) u = u.replace(/\/$/, '');
    if (/\.(png|jpg|svg|xml|txt|json|csv|ico|webmanifest)$/i.test(u)) continue;
    것.add(u || '/');
  }
  return 것;
};

/**
 * 지면마다 들어오는 링크 수. **자기 자신은 안 센다** — 자기를 가리키는 것은 문이 아니다.
 * @param {Map<string,string>} 글들 주소 → 글
 */
export function 들어오는수(글들) {
  const 수 = new Map([...글들.keys()].map((k) => [k, 0]));
  for (const [주소, 글] of 글들) {
    for (const u of 링크뽑기(글)) {
      if (u === 주소) continue;
      if (수.has(u)) 수.set(u, 수.get(u) + 1);
    }
  }
  return 수;
}

/* ⚠ 2026-08-23 — `--selftest` 로 불렀더니 **자가시험이 안 돌고 본 검사가 돌았다.**
   내 다른 자들은 다 `--selftest` 다. 조용히 다른 일을 하는 것이 가장 나쁘다 — 둘 다 받는다. */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  const 실패 = [];
  /* ⛔ 통과 수를 손으로 적어 두면 시험을 더할 때마다 거짓이 된다 — 부를 때마다 센다.
     2026-08-23 까지 「(11)」이 박혀 있었다. */
  let 잰것 = 0;
  const 검 = (이름, 참) => { 잰것 += 1; if (!참) 실패.push(이름); };

  검('index.html 은 폴더 주소가 된다', 주소로('index.html') === '/' && 주소로('room/index.html') === '/room');
  검('.html 을 뗀다', 주소로('day-pillar.html') === '/day-pillar');
  검('우리 쪽 절대주소도 센다', 링크뽑기('<a href="https://www.kculturewire.com/x">').has('/x'));
  검('밖으로 나가는 링크는 안 센다', 링크뽑기('<a href="https://www.wikidata.org/">').size === 0);
  검('앵커·물음표를 뗀다', 링크뽑기('<a href="/a#b?c=1">').has('/a'));
  검('그림·사이트맵은 안 센다', 링크뽑기('<a href="/og/x.png"><a href="/sitemap.xml">').size === 0);

  const 글들 = new Map([
    ['/', '<a href="/a">'],
    ['/a', '<a href="/">'],
    ['/orphan', '<a href="/a">'],
    ['/self', '<a href="/self">'],
  ]);
  const 수 = 들어오는수(글들);
  검('가리켜지는 지면을 센다', 수.get('/a') === 2);
  검('문 없는 지면은 0', 수.get('/orphan') === 0);
  검('⛔ 자기를 가리키는 것은 문이 아니다', 수.get('/self') === 0);
  검('봐준다에 첫 화면이 있다', 봐준다['/'] !== undefined);
  /* 🔴 첫 화면 파일이 폴더 밖에 있어 한 번도 안 세어졌다(2026-08-22) — 그 링크가 세어져야 한다 */
  검('첫 화면에서 나가는 링크도 센다', 들어오는수(new Map([['/', '<a href="/x">'], ['/x', '']])).get('/x') === 1);
  /* ⚠ 남이 dist 를 다시 짓는 사이에 읽으면 파일이 사라진다 — 그때는 «못 쟀다»여야 한다 */
  검('사라진 파일을 문 없는 지면으로 안 센다', 들어오는수(new Map([['/a', '<a href="/b">']])).get('/a') === 0);

  /* ── 접은 주소 (2026-08-23) ────────────────────────────────
     🔴 접은 주소 두 장(`/title/the-uninvited`·`/firm/lotte-entertainment`)이 이 자를 빨강으로
       세웠다. 그 지면은 **문이 없는 것이 옳다** — 손님은 검색 결과에서만 온다.
     ⛔ 그렇다고 봐준다에 손으로 적으면 안 된다. 접은 주소는 자료가 바뀔 때마다 늘고 줄어
       손 목록이 반드시 어긋난다. 그러니 **손 목록에 없는 것**을 여기서 재 둔다. */
  검('⛔ 접은 주소를 봐준다에 손으로 적지 않았다',
    봐준다['/title/the-uninvited'] === undefined
    && 봐준다['/firm/lotte-entertainment'] === undefined);
  const 접힘시험 = await 접힌주소들();
  검('접은 주소 목록은 집합이거나 「못 쟀다」(null)다',
    접힘시험 === null || 접힘시험 instanceof Set);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log(`✅ check-kcw-orphan-pages 자가시험 통과 (${잰것})`);
  process.exit(0);
}

if (!fs.existsSync(낸방)) {
  console.log('⚠ dist/wikitip 이 없다 — 빌드가 없으면 잴 것이 없다(빨강 아님)');
  process.exit(0);
}

/**
 * ⚠ 2026-08-22 — 자리 여섯이 `dist` 를 같이 쓴다. 남이 빌드하는 사이에 읽으면
 *   **읽던 파일이 사라진다**(ENOENT). 그때 나오는 수는 흠이 아니라 **못 잰 것**이다.
 *   ⛔ 사라진 파일을 「문 없는 지면」으로 세지 않는다. 몇 장이 사라졌는지 세어서 밝히고,
 *     많이 사라졌으면 판정을 **아예 안 한다.**
 */
const 글들 = new Map();
let 사라진수 = 0;
const 걷기 = (디렉, 앞 = '') => {
  let 목록;
  try { 목록 = fs.readdirSync(디렉, { withFileTypes: true }); } catch { 사라진수++; return; }
  for (const e of 목록) {
    const 다음 = path.join(디렉, e.name);
    const 상대 = 앞 ? `${앞}/${e.name}` : e.name;
    if (e.isDirectory()) { 걷기(다음, 상대); continue; }
    if (!e.name.endsWith('.html')) continue;
    try { 글들.set(주소로(상대), fs.readFileSync(다음, 'utf8')); } catch { 사라진수++; }
  }
};
걷기(낸방);

/**
 * 🔴 2026-08-22 14:2x — 이 자가 **거짓 빨강**을 냈다. `/most-read` 를 첫 화면에 걸어 놓고도
 *   「문이 0개」라고 울었다. 까닭 — **첫 화면 파일은 `dist/wikitip.html` 이고,
 *   이 자는 `dist/wikitip/` «폴더»만 걸었다.** 첫 화면에서 나가는 링크를 한 번도 안 세고 있었다.
 *   첫 화면에서만 걸린 지면은 전부 고아로 나왔던 것이다. 자가 틀리면 잰 수가 다 틀린다.
 */
const 첫화면길 = path.join(뿌리, 'dist/wikitip.html');
if (fs.existsSync(첫화면길)) {
  try { 글들.set('/', fs.readFileSync(첫화면길, 'utf8')); } catch { 사라진수++; }
}

if (사라진수 > 0) {
  console.log(`⚠ 읽는 사이에 사라진 파일 ${사라진수}개 — 남이 지금 빌드하고 있다. **못 쟀다**로 끝낸다(빨강 아님)`);
  process.exit(0);
}

/**
 * 🔴 사라지는 것만 막았더니 **아직 안 만들어진 것**에 걸렸다(2026-08-22 14:1x).
 *   남이 `dist` 를 다시 짓는 중이면 지면이 스물아홉 장만 있고, 그 상태로 세면
 *   멀쩡한 지면이 전부 「문 없는 지면」으로 나온다. **거짓 빨강**이다.
 * ⇒ 사이트맵이 몇 장을 싣고 있는지와 견줘, 너무 적으면 **판정을 안 한다.**
 */
const 사이트맵길 = path.join(낸방, 'sitemap.xml');
if (fs.existsSync(사이트맵길)) {
  const 실린수 = (fs.readFileSync(사이트맵길, 'utf8').match(/<loc>/g) ?? []).length;
  if (실린수 > 0 && 글들.size < 실린수 * 0.8) {
    console.log(`⚠ 나간 지면 ${글들.size}장인데 사이트맵은 ${실린수}장이다 — 지금 다시 짓는 중이다. **못 쟀다**로 끝낸다(빨강 아님)`);
    process.exit(0);
  }
}

const 수 = 들어오는수(글들);
/* ⭐ 접은 주소는 갈라 센다 — 못 읽으면 null 이고, 그때는 「못 쟀다」로 적는다 */
const 접힘 = await 접힌주소들();
const 문없는것 = [...수.entries()]
  .filter(([주소, n]) => n === 0 && 봐준다[주소] === undefined)
  .map(([주소]) => 주소)
  .sort();
const 접힌고아 = 접힘 ? 문없는것.filter((p) => 접힘.has(p)) : [];
const 고아 = 접힘 ? 문없는것.filter((p) => !접힘.has(p)) : 문없는것;

console.log(`나간 지면 ${글들.size}장 · 봐준 것 ${Object.keys(봐준다).length}개 · 들어오는 문이 0인 지면 ${문없는것.length}장`);
if (접힘 === null) {
  console.log('⚠ 접은 주소 목록을 **못 쟀다**(사이트맵이나 IndexNow 대장이 없다) —'
    + ' 아래 셈에 접은 주소가 섞여 있을 수 있다');
} else if (접힌고아.length) {
  console.log(`   그중 ${접힌고아.length}장은 **접은 주소**다 — 문이 없는 것이 옳다.`
    + ' 손님은 검색 결과에서만 온다');
  for (const p of 접힌고아) console.log(`   · ${p}`);
}
if (고아.length) {
  console.error('❌ 만들고 문을 안 냈다 — 링크를 타고 못 닿는 지면이 있다');
  for (const p of 고아.slice(0, 20)) console.error(`   · ${p}`);
  if (고아.length > 20) console.error(`   … 그리고 ${고아.length - 20}장 더`);
  console.error('   ⛔ 봐준다에 넣어 통과시키지 않는다. 어디서 들어올지를 정하고 그 지면에 길을 낸다.');
  process.exit(1);
}
console.log('✅ 모든 지면에 들어오는 문이 있다');
