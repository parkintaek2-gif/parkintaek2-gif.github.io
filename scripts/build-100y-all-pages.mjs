#!/usr/bin/env node
/**
 * build-100y-all-pages.mjs — **백년지도의 지면 전체 목록**을 한 장으로 짓는다.
 *
 * ── 왜 만들었나 (2026-10-04 08:0x · 5번) ──────────────────────────────
 *   `check-홈에서-몇홉인가.mjs` 로 재니 백년지도 지면 **54장이 홈에서 한 번도 안 닿았다.**
 *   ```
 *   /100y/csat-subject-choice · /100y/elderly-money-gap · /100y/labor-market-2072
 *   /100y/property-tax · /100y/lifecycle-deficit · /100y/military-age-men …
 *   ```
 *   백년지도 홈이 거는 것은 **27개뿐**이고, 지면 묶음은 180개다. 「지금 열려 있는 것」에
 *   안 올라간 것들이 통째로 묻혀 있었다.
 *
 *   같은 날 잰 것 — 홈에서 안 닿던 `/taiwan/company`(1,057장)·`/uae/company`(104장)에
 *   구글이 표본 네 장씩 **전부** 「한 번도 안 왔다」였다. 길이 있던 일본은 4/4 색인됐다.
 *   ⭐ **구글은 사이트맵으로 「알고」, 링크를 타고 「온다」.** 사이트맵에 있어도 안 온다.
 *
 * ── ⛔ 홈에 54줄을 붙이지 않는다 ─────────────────────────────────────
 *   홈은 감수 대상 다섯 장 가운데 하나다. 거기에 쉰네 줄을 붙이면 홈이 목록이 되고,
 *   지면이 늘 때마다 홈을 고쳐야 한다. **문 한 장을 내고 홈에는 한 줄만 건다.**
 *   `/japan/companies` 가 업종 없는 회사 27장에 길을 낸 것과 같은 꼴이다.
 *
 * ── ⚠ 왜 dist 를 읽나 ───────────────────────────────────────────────
 *   백년지도 지면의 제목은 **자료로 계산되어** 들어간다 —
 *   `title={`재산세 — ${정점.정점연도}년 ${정점.정점세액조원}조원 정점…`}`
 *   그래서 소스를 정규식으로 읽어서는 제목을 못 모은다. 지어내지도 않는다.
 *   ⇒ **직전 빌드의 dist 를 읽어** 그 지면이 스스로 내건 제목과 설명을 그대로 쓴다.
 *
 *   ⚠ 그래서 이 목록은 **한 판 늦는다.** 오늘 새로 난 지면은 다음 빌드에 붙는다.
 *     하루에 여러 번 빌드하므로 금방 따라잡지만, 늦는다는 것은 늦는다고 적어 둔다.
 *     ⛔ 「거의 맞으니 괜찮다」로 넘기지 않는다. 못 잰 것은 못 쟀다고 적는다.
 *
 * ── 🔴 처음에 정적 html 로 지었다가 되돌렸다 (08:1x) ─────────────────
 *   `public/100y/all.html` 로 내고 띄워 보니 **GA 가 한 줄도 없었다.** 백년지도의
 *   머리글·바닥글·광고도 없어 혼자 다른 사이트처럼 보였다.
 *   ⚠ 2026-10-03 밤에 `contents.html`·`horoscope-week.html` 두 손님 지면에 GA 가
 *     «아예 없었던» 것을 찾아낸 바로 그 꼴이다. **정적 지면은 레이아웃을 안 탄다.**
 *   ⇒ 이 자는 이제 **html 이 아니라 자료를 짓는다.** 그리는 것은 Astro 지면
 *     `src/pages/100y/all/index.astro` 가 하고, 거기서 레이아웃이 GA·메뉴·바닥글을
 *     전부 달아 준다. ⛔ GA 조각을 복사하지 않는다 — 복사하면 두 곳이 어긋난다.
 *
 * 쓰는 법
 *   node scripts/build-100y-all-pages.mjs
 *   node scripts/build-100y-all-pages.mjs --selftest
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 읽을곳 = path.join(뿌리, 'dist/100y');
const 쓸곳 = path.join(뿌리, 'src/data/100yearmap/지면목록.json');

/**
 * 목록에 **안 싣는 지면** — 까닭을 같이 적는다.
 * ⚠ `check-홈에서-몇홉인가.mjs` 의 `걸지않는길` 과 같은 생각이다. 거기 것은 「홈」 기준
 *   주소(`/100y/404`)이고 여기 것은 백년지도 안쪽 주소(`/404`)라 꼴이 다르다.
 *   ⛔ 한쪽만 고치지 않는다 — 고치면 양쪽을 같이 본다(강령 ⑤).
 */
export const 안싣는길 = new Set([
  '/404',          /* 오류 지면 */
  '/about', '/contact', '/privacy', '/terms',   /* 회사 안내. 이미 바닥글에 있다 */
  '/price', '/refund',                          /* 값·환불. 이미 바닥글에 있다 */
  '/all',                                       /* 이 지면 자신 */
]);

/** 네이버·구글이 주인 확인에 쓰는 파일 — 사람이 볼 것이 아니다 */
export const 주인확인꼴 = /^\/(naver[0-9a-f]{20,}|google[0-9a-f]{12,})$/i;

export function 안싣나(길) {
  const g = String(길 ?? '');
  return 안싣는길.has(g) || 주인확인꼴.test(g);
}

/** `dist/100y/a/index.html` → `/a` · `dist/100y/a.html` → `/a` */
export function 안쪽길(파일, 밑) {
  const r = path.relative(밑, 파일).replace(/\\/g, '/');
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'/index.html'.length);
  if (r.endsWith('.html')) return '/' + r.slice(0, -'.html'.length);
  return '/' + r;
}

/** `<title>` 에서 꼬리표를 떼어 낸다 — 「… — 백년지도」 */
export function 제목뽑기(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(String(html ?? ''));
  if (!m) return null;
  const t = 글자풀기(m[1]).trim().replace(/\s*[—–-]\s*백년지도\s*$/, '').trim();
  /* ⚠ 첫 화면처럼 제목이 꼬리표뿐인 지면이 있다 — 그것을 제목으로 삼으면 목록에
     「백년지도」라고만 적힌 줄이 선다. 이름이 없는 것은 안 싣는다 */
  return !t || t === '백년지도' ? null : t;
}

export function 설명뽑기(html) {
  const m = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(String(html ?? ''));
  if (!m) return null;
  const d = 글자풀기(m[1]).trim();
  return d || null;
}

/** ⚠ `&amp;` 를 그대로 두면 목록에 「&amp;」가 찍힌다 — 한 번만 푼다 */
export function 글자풀기(s) {
  return String(s ?? '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');     /* 맨 나중이다 — 먼저 풀면 &amp;lt; 가 <로 둔갑한다 */
}

/* ⛔ 다시 묶는 자(글자묶기)를 두지 않는다 — 그리는 것은 Astro 이고, Astro 가 알아서
   묶는다. 여기서 한 번 더 묶으면 화면에 「&amp;」가 찍힌다. */

/**
 * **단일 지면만 싣는다.**
 * `/school`·`/major` 처럼 아래에 수백 장이 달린 묶음은 홈이 이미 걸고 있고, 여기에
 * 2,500장을 늘어놓을 수도 없다. ⇒ **아래에 다른 지면이 없는 것**만 모은다.
 */
export function 단일지면만(길들) {
  const 묶음있음 = new Set();
  for (const g of 길들) {
    const 조각 = g.split('/').filter(Boolean);
    if (조각.length > 1) 묶음있음.add('/' + 조각[0]);
  }
  return 길들.filter((g) => {
    const 조각 = g.split('/').filter(Boolean);
    return 조각.length === 1 && !묶음있음.has(g);
  });
}

export function 모으기(밑 = 읽을곳) {
  if (!fs.existsSync(밑)) return null;        /* ⛔ 빈 목록을 내지 않는다 — 못 쟀다 */
  const 것 = new Map();
  (function 걷(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) 걷(p);
      else if (e.name.endsWith('.html')) 것.set(안쪽길(p, 밑), p);
    }
  }(밑));

  const 뽑힌 = [];
  for (const 길 of 단일지면만([...것.keys()])) {
    if (안싣나(길)) continue;
    const html = fs.readFileSync(것.get(길), 'utf8');
    const 제목 = 제목뽑기(html);
    if (!제목) continue;            /* 제목을 못 읽으면 지어내지 않는다 — 뺀다 */
    뽑힌.push({ 길, 제목, 설명: 설명뽑기(html) });
  }
  return 뽑힌.sort((a, b) => a.제목.localeCompare(b.제목, 'ko'));
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참, 덧 = '') => 결과.push({ 이름, 참: !!참, 덧 });

  본다('제목에서 꼬리표를 뗀다', 제목뽑기('<title>재산세 — 22.91조원 — 백년지도</title>') === '재산세 — 22.91조원');
  본다('⛔ 꼬리표만 있으면 비운다', 제목뽑기('<title>백년지도</title>') === null);
  본다('⛔ 제목이 없으면 null 이다', 제목뽑기('<p>x</p>') === null);
  본다('설명을 뽑는다', 설명뽑기('<meta name="description" content="가나다">') === '가나다');
  본다('⛔ 설명이 없으면 null 이다', 설명뽑기('<title>x</title>') === null);

  본다('글자를 한 번만 푼다', 글자풀기('A &amp;amp; B') === 'A &amp; B');
  본다('⛔ 거꾸로 풀지 않는다', 글자풀기('&amp;lt;') === '&lt;');
  본다('⛔ 풀기만 한다 — 다시 묶지 않는다', 글자풀기('a &amp; b') === 'a & b');

  본다('안쪽 길을 낸다', 안쪽길('dist/100y/a/index.html', 'dist/100y') === '/a');
  본다('안쪽 길을 낸다 (평평한 것)', 안쪽길('dist/100y/b.html', 'dist/100y') === '/b');
  본다('첫 화면은 빗금이다', 안쪽길('dist/100y/index.html', 'dist/100y') === '/');

  본다('오류 지면을 안 싣는다', 안싣나('/404'));
  본다('주인 확인 파일을 안 싣는다', 안싣나('/naver86609d6dca43d138516eb4f3d8ffdc73'));
  본다('⛔ 손님 지면을 안 가린다', !안싣나('/csat-subject-choice'));
  본다('⛔ naver 로 시작해도 짧으면 안 가린다', !안싣나('/naver-trends'));

  {
    const 길들 = ['/', '/property-tax', '/school', '/school/seoul-1', '/school/seoul-2', '/age'];
    const 남 = 단일지면만(길들);
    본다('묶음이 달린 것은 뺀다', !남.includes('/school'), 남.join(' '));
    본다('단일 지면은 남긴다', 남.includes('/property-tax') && 남.includes('/age'));
    본다('⛔ 묶음 아래 지면을 안 싣는다', !남.includes('/school/seoul-1'));
    본다('⛔ 첫 화면을 안 싣는다', !남.includes('/'));
  }

  {
    /* ⛔ 자료는 자료다 — html 조각을 넣지 않는다. 그리는 것은 Astro 가 한다 */
    const 것 = { 길: '/a', 제목: '가 & 나', 설명: '다' };
    const 되읽음 = JSON.parse(JSON.stringify({ 잰때: '2026-10-04 08:00', 것들: [것] }));
    본다('자료가 그대로 오간다', 되읽음.것들[0].제목 === '가 & 나');
    본다('⛔ 자료에 html 을 안 넣는다', !/[<>]/.test(되읽음.것들[0].제목 + 되읽음.것들[0].길));
    본다('잰 때를 같이 담는다', 되읽음.잰때 === '2026-10-04 08:00');
  }

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 백년지도 지면 전체 목록 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}${r.덧 ? `  (${r.덧})` : ''}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const 것들 = 모으기();
  if (것들 === null) {
    console.log('⬜ dist/100y 가 없다 — node scripts/build-once.mjs 를 먼저 돌린다. 못 쟀다');
    process.exit(0);
  }
  if (!것들.length) {
    console.log('🔴 한 장도 못 뽑았다 — 자를 먼저 의심한다. 빈 목록을 내지 않는다');
    process.exit(1);
  }
  const 지금 = new Date();   /* ⛔ toISOString 금지 — 이 PC 가 이미 한국시간이다 */
  const 잰때 = `${지금.getFullYear()}-${String(지금.getMonth() + 1).padStart(2, '0')}-`
    + `${String(지금.getDate()).padStart(2, '0')} ${String(지금.getHours()).padStart(2, '0')}:`
    + `${String(지금.getMinutes()).padStart(2, '0')}`;

  fs.mkdirSync(path.dirname(쓸곳), { recursive: true });
  fs.writeFileSync(쓸곳, JSON.stringify({ 잰때, 것들 }, null, 2) + '\n', 'utf8');
  console.log(`✅ 백년지도 지면 ${것들.length}장 — src/data/100yearmap/지면목록.json`);
  console.log('   ▶ 그리는 것은 src/pages/100y/all/index.astro 다. 빌드해야 화면에 붙는다');
  console.log('   ⚠ 직전 빌드의 dist 를 읽었다. 오늘 새로 난 지면은 다음 빌드에 붙는다');
}
