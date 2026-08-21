#!/usr/bin/env node
/**
 * check-kcw-three-clicks.mjs — **첫 화면에서 세 번 눌러 어디까지 닿나.** (세는 검사)
 *
 * 🔴 2번 지시(2026-08-21 22:5x):
 *   「첫 화면(/)에서 세 번 눌러 109편 전부에 닿는지 재고, 못 닿는 편을 이어 준다.
 *    기사가 109편인데 손님이 그 109편을 «찾을 길»이 없으면 편 수를 늘려도 숫자가 안 움직인다」
 *
 * ⛔ **사이트맵으로 세지 않는다.** 사이트맵은 검색엔진이 보는 것이고, 이 검사가 묻는 것은
 *   **손님의 손가락**이다. 사이트맵에 있어도 눌러서 못 가면 손님은 그 편을 못 본다.
 * ⛔ **빌드된 HTML 을 본다.** 소스의 `<a>` 가 아니라 나간 글자다 — 조건부로 안 그려진 링크는
 *   소스엔 있고 지면엔 없다.
 * ⛔ 못 닿는 것을 0 으로 적지 않는다. 세어서 이름을 적는다.
 *
 * ── ⚠ 이 자를 지으며 조심한 것 ────────────────────────────────
 * ① 첫 화면은 `dist/wikitip.html` 한 층 위에 있다(빌드 꼴이 `file` 이다). `/` → 그 파일이다
 * ② 자기 자신으로 가는 링크·닻(`#`)·바깥 주소·`mailto:` 는 클릭 수에 안 넣는다
 * ③ 404 는 세지 않는다 — 손님이 닿아선 안 되는 지면이다
 * ④ ⭐ 「세 번」은 **첫 화면을 0 번으로 본다.** 첫 화면 → A → B → C 가 세 번이다
 * ⑤ 🔴🔴 **처음 돌렸을 때 「/community 가 못 닿는다」고 나왔다. 그런 지면은 없었다.**
 *    `dist/wikitip/community.html` 은 13:20 자 **옛 빌드가 남긴 껍데기**였다(소스가 없다).
 *    ⛔ dist 를 「있어야 할 것의 목록」으로 쓰면 지운 지면이 되살아나 검사를 속인다.
 *    ⭐ 그래서 **이번 빌드가 쓴 것만** 센다 — 제일 새 파일의 시각으로 갈라 놓고,
 *       뒤처진 것은 「지난 빌드가 남긴 것」으로 따로 적는다. 지우는 것은 사람이 본다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-three-clicks.mjs             (먼저 npx astro build)
 *   node scripts/check-kcw-three-clicks.mjs --깊이 2
 *   node scripts/check-kcw-three-clicks.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 낸방 = path.join(뿌리, 'dist', 'wikitip');
export const 첫화면 = path.join(뿌리, 'dist', 'wikitip.html');

/** 손님 주소 → 빌드된 파일. `/` 만 한 층 위다 */
export function 파일길(주소, 방 = 낸방, 첫 = 첫화면) {
  if (주소 === '/' ||주소 === '') return 첫;
  return path.join(방, `${주소.replace(/^\//, '')}.html`);
}

/** ⛔ 안쪽 주소만 남긴다. 닻·바깥·mailto·tel·자기자신은 클릭이 아니다 */
export function 안쪽링크(html, 여기) {
  const 밖 = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    let h = m[1].trim();
    if (!h.startsWith('/')) continue;              /* http · mailto · # · 상대주소 */
    h = h.replace(/[?#].*$/, '').replace(/\/$/, '') || '/';
    if (h === 여기) continue;                      /* 자기 자신 */
    if (h === '/404') continue;
    밖.add(h);
  }
  return [...밖];
}

/** 첫 화면에서 너비우선으로 걸어 «몇 번에 닿았나»를 적는다 */
export function 걸어보기(읽기, 깊이 = 3, 시작 = '/') {
  const 닿음 = new Map([[시작, 0]]);
  let 이번 = [시작];
  for (let 걸음 = 1; 걸음 <= 깊이; 걸음 += 1) {
    const 다음 = [];
    for (const 여기 of 이번) {
      const html = 읽기(여기);
      if (html == null) continue;
      for (const 저기 of 안쪽링크(html, 여기)) {
        if (닿음.has(저기)) continue;
        닿음.set(저기, 걸음);
        다음.push(저기);
      }
    }
    이번 = 다음;
    if (!이번.length) break;
  }
  return 닿음;
}

/**
 * ⭐ **이번 빌드가 쓴 것**과 **지난 빌드가 남긴 것**을 가른다.
 *   제일 새 파일의 시각에서 `늦춤분` 보다 더 뒤처진 것은 이번 빌드가 안 쓴 것이다.
 * ⛔ 「없으면 0」으로 넘기지 않는다 — 남은 것은 세어서 이름을 적는다.
 */
export function 이번빌드만(파일들, 시각, 늦춤분 = 30) {
  const 잰것 = 파일들.map((f) => 시각(f)).filter((t) => typeof t === "number" && t > 0);
  if (!잰것.length) return { 이번: 파일들, 남은것: [] };
  const 금 = Math.max(...잰것) - 늦춤분 * 60 * 1000;
  const 이번 = []; const 남은것 = [];
  for (const f of 파일들) ((시각(f) ?? 0) >= 금 ? 이번 : 남은것).push(f);
  return { 이번, 남은것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };

  재본다('⭐ 첫 화면은 한 층 위 파일이다', 파일길('/', 'D', 'C/첫.html'), 'C/첫.html');
  재본다('⭐ 지면은 방 안이다', 파일길('/titles', 'D', 'C/첫.html'), path.join('D', 'titles.html'));

  const H = '<a href="/a">A</a><a href="https://x/b">밖</a><a href="#c">닻</a>'
    + '<a href="mailto:x@y">멜</a><a href="/a?q=1#z">같은 A</a><a href="/here">나</a>'
    + '<a href="/404">사백사</a><a href="/d/">뒤빗금</a>';
  const 본 = 안쪽링크(H, '/here');
  재본다('⛔ 바깥·닻·메일은 클릭이 아니다', 본.includes('/a') && !본.some((x) => /^http|^#|mailto/.test(x)), true);
  재본다('⛔ 물음표·닻을 떼고 같은 주소로 본다', 본.filter((x) => x === '/a').length, 1);
  재본다('⛔ 자기 자신은 안 센다', 본.includes('/here'), false);
  재본다('⛔ 404 는 안 센다', 본.includes('/404'), false);
  재본다('⭐ 뒤 빗금을 떼서 한 주소로 본다', 본.includes('/d'), true);

  /* 첫 → 가 → 나 → 다 → 라 : 라는 네 번이라 세 번 안에 못 닿는다 */
  const 사슬 = { '/': '<a href="/가">', '/가': '<a href="/나">', '/나': '<a href="/다">', '/다': '<a href="/라">' };
  const 셋 = 걸어보기((u) => 사슬[u] ?? '', 3);
  재본다('⭐ 첫 화면은 0 번이다', 셋.get('/'), 0);
  재본다('⭐ 세 번째가 3 으로 적힌다', 셋.get('/다'), 3);
  재본다('⛔⛔ 네 번째는 못 닿은 것이다', 셋.has('/라'), false);
  재본다('⭐ 깊이를 넓히면 닿는다', 걸어보기((u) => 사슬[u] ?? '', 4).get('/라'), 4);

  /* 고리가 있어도 안 돈다 */
  const 고리 = { '/': '<a href="/가">', '/가': '<a href="/">' };
  재본다('⛔ 고리에서 안 맴돈다', 걸어보기((u) => 고리[u] ?? '', 3).size, 2);

  /* ⑤ 옛 빌드가 남긴 것에 속지 않는다 */
  const 때 = { '/새1': 1000000, '/새2': 999000, '/옛': 1000000 - 60 * 60 * 1000 };
  const 갈 = 이번빌드만(Object.keys(때), (f) => 때[f], 30);
  재본다('⛔⛔ 옛 빌드가 남긴 것을 셈에서 뺀다', 갈.이번.sort(), ['/새1', '/새2']);
  재본다('⛔ 뺀 것을 감추지 않고 이름을 남긴다', 갈.남은것, ['/옛']);
  재본다('⛔ 시각을 못 재면 통째로 센다 — 조용히 0 으로 안 만든다',
    이번빌드만(['/가', '/나'], () => null).이번.length, 2);

  재본다('⭐ 빌드된 첫 화면이 있다', fs.existsSync(첫화면), true);

  console.log(`세 클릭 검사 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(첫화면)) {
    console.log('⚠ dist 가 없다 — 먼저 `npx astro build`. **못 쟀다**고 적는다.');
    process.exit(0);
  }
  const i = process.argv.indexOf('--깊이');
  const 깊이 = i > -1 ? Number(process.argv[i + 1]) : 3;

  const 읽기 = (주소) => {
    const p = 파일길(주소);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  };
  const 닿음 = 걸어보기(읽기, 깊이);

  /* 있어야 할 것 — 빌드된 기사와 지면 전부 */
  const 기사 = fs.readdirSync(path.join(낸방, 'article')).filter((f) => f.endsWith('.html'))
    .map((f) => `/article/${f.replace('.html', '')}`);
  const 지면 = fs.readdirSync(낸방).filter((f) => f.endsWith('.html') && f !== '404.html')
    .map((f) => `/${f.replace('.html', '')}`);

  /** 파일이 쓰인 때 */
  const 쓴때 = (주소) => {
    try { return fs.statSync(파일길(주소)).mtimeMs; } catch { return null; }
  };

  const 재기 = (이름, 다것들) => {
    const { 이번: 것들, 남은것 } = 이번빌드만(다것들, 쓴때);
    if (남은것.length) {
      console.log('');
      console.log('⚠ ' + 이름 + ' — **지난 빌드가 남긴 껍데기 ' + 남은것.length
        + '개**를 셈에서 뺐다(소스가 없을 수 있다)');
      for (const x of 남은것) console.log('   · ' + x);
    }
    const 못 = 것들.filter((x) => !닿음.has(x));
    console.log(`\n■ ${이름} ${것들.length}개 — 세 클릭 안에 닿는 것 ${것들.length - 못.length}개 · **못 닿는 것 ${못.length}개**`);
    const 걸음별 = new Map();
    for (const x of 것들) { const d = 닿음.get(x); if (d != null) 걸음별.set(d, (걸음별.get(d) ?? 0) + 1); }
    console.log(`   걸음별: ${[...걸음별].sort().map(([k, v]) => `${k}번 ${v}개`).join(' · ') || '없음'}`);
    if (못.length) for (const x of 못.slice(0, 40)) console.log(`   ⛔ ${x}`);
    if (못.length > 40) console.log(`   … 그리고 ${못.length - 40}개 더`);
    return 못;
  };

  console.log(`첫 화면에서 ${깊이} 번 눌러 닿는 곳 — 2번 지시(22:5x)`);
  console.log(`(첫 화면은 0 번이다. 빌드된 HTML 의 <a> 만 본다)`);
  const 못기사 = 재기('기사', 기사);
  const 못지면 = 재기('지면', 지면);

  console.log(`\n합 — 못 닿는 것 ${못기사.length + 못지면.length}개. **0 이면 끝이다.**`);
  console.log('⛔ 사이트맵에 있는 것과 다르다 — 이 검사는 손님의 손가락을 잰다.');
}
