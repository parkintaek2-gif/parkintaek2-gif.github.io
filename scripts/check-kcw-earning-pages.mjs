#!/usr/bin/env node
/**
 * check-kcw-earning-pages.mjs — **노출을 벌어 오는 지면이 살아 있나.** (막는 검사)
 *
 * ── 🔴 왜 (2026-08-24 07:3x) ─────────────────────────────────
 * 「이미 노출이 오는 자리를 지킨다」고 적고 나서, 무엇을 지키고 있는지 열어 봤다.
 * `check-kcw-live.mjs` 는 **손으로 적은 여덟 장**을 본다. 그 여덟은 8월 초에 새로 낸
 * 기사들이었다. 그런데 지금 노출을 벌어 오는 지면은 그것이 아니다 —
 * ```
 * /market/nicaragua                   175노출   ← 감시 목록에 **없다**
 * /article/korea-challenger-win-rate  150노출   ← 없다
 * /about                              102노출   ← 없다
 * /titles                              67노출   ← 없다
 * /webtoon  /workforce                 66·60    ← 없다
 * ```
 * ⛔ **가장 값나가는 지면이 하나도 안 지켜지고 있었다.** 아무도 안 오는 지면을 지키면서.
 * ⭐ 그래서 감시 목록을 **손으로 적지 않는다.** 실측(노출)에서 뽑는다 — 수요가 옮겨가면
 *   지키는 자리도 저절로 따라간다. 손 목록은 반드시 낡는다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **수를 박아 두지 않는다.** 「58.4 가 있어야 한다」식은 자료가 바뀌면 초록을 빨강으로
 *   만든다(오늘 여덟 자리에서 그 흠을 지웠다). 대신 **꼴**을 본다 —
 *   200 인가 · 제목이 있나 · 설명이 있나 · 깨진 값이 새나 · 한국어가 새나.
 * ⛔ **깨진 것의 무게를 노출로 적는다.** 「한 장 죽었다」가 아니라 「노출 175건이 위험하다」다.
 *   그래야 무엇을 먼저 고칠지 갈린다.
 * ⛔ 실측 자료가 없으면 **「못 쟀다」**로 적고 나간다. 손 목록으로 되돌아가지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-earning-pages.mjs
 *   node scripts/check-kcw-earning-pages.mjs --장수=25
 *   node scripts/check-kcw-earning-pages.mjs --selftest
 */
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
/* ⭐ 한국어 누출 판단은 **한 곳**에서 들여온다 — 베끼면 두 판단이 어긋난다 */
import { 맨몸한국어 } from './check-kcw-korean-leak.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 인자 = (이름, 기본) => process.argv.find((a) => a.startsWith(`--${이름}=`))
  ?.split('=').slice(1).join('=') ?? 기본;

export const 잰것길 = path.resolve(뿌리, 인자('잰것', 'src/data/kcw-search-pages.json'));
export const 호스트 = 인자('호스트', 'www.kculturewire.com');
/** 본문이 이보다 작으면 뭔가 잘못된 것이다. 우리 지면 중 가장 작은 것도 이보다 크다 */
export const 최소크기 = 2000;

/** ⛔ 손님 화면에 새면 안 되는 글자. 하나라도 있으면 빨강이다 */
export const 새면안되는것 = ['undefined', 'NaN', 'Infinity', '[object Object]', 'null,'];

export function 주소길(주소) {
  return String(주소 ?? '').replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '') || '/';
}

/** 노출 많은 순으로 뽑는다. ⛔ 노출 0인 지면은 「벌어 오는 지면」이 아니다 */
export function 버는지면(행들, 장수 = 15) {
  const 표 = new Map();
  for (const r of 행들 ?? []) {
    const k = 주소길(r.key);
    표.set(k, (표.get(k) ?? 0) + (Number(r.impressions) || 0));
  }
  return [...표.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 장수)
    .map(([길, 노출]) => ({ 길, 노출 }));
}

/**
 * 한 지면이 건강한가. ⛔ 수를 박아 보지 않는다 — **꼴**만 본다.
 *   「이 지면에 58.4 가 있어야 한다」는 자료가 바뀌면 거짓 빨강이 된다.
 */
export function 아픈데(코드, 글) {
  const 아픔 = [];
  if (코드 !== 200) { 아픔.push(`HTTP ${코드}`); return 아픔; }
  const 몸 = String(글 ?? '');
  if (몸.length < 최소크기) 아픔.push(`본문이 ${몸.length}자뿐 (${최소크기}자 미만)`);
  if (!/<title>[^<]*[^\s<][^<]*<\/title>/.test(몸)) 아픔.push('제목이 비었다');
  if (!/<meta[^>]+name="description"[^>]+content="[^"]{20,}/.test(몸)) 아픔.push('설명이 비었거나 너무 짧다');
  for (const w of 새면안되는것) if (몸.includes(w)) 아픔.push(`깨진 값이 샌다: ${w}`);
  /**
   * 🔴 2026-08-24 07:4x — 이 자를 처음 돌렸을 때 **제 자가 틀렸다.**
   *   `[가-힣]{2,}` 로 한국어를 다 잡아서, 세 지면(노출 164건)을 빨강으로 세웠다.
   *   그런데 잡힌 것이 이런 것들이었다 —
   * ```
   * First broadcast (첫방송)   ·  Distribution (배급)
   * KOSIS (국가데이터처)  ·  Webtoon Industry Survey (한국콘텐츠진흥원 「웹툰산업실태조사」)
   * ```
   *   ⛔ **다 정당한 원문 병기다.** 출처를 밝히는 것이고, 오히려 옳은 글이다.
   *     `check-kcw-korean-leak.mjs` 는 그것을 이미 알고 통과시키는데(그 자는 초록이었다),
   *     내가 더 거친 자를 새로 만들어 **옳은 지면을 고치게 만들 뻔했다.** 그것도 exit 1 로.
   * ⭐ 그래서 판단을 **베끼지 않고 들여온다.** 집안 규칙이 이것이다 —
   *   하나를 고치면 인용한 곳까지 따라간다. 두 자리에 두 판단을 두면 반드시 어긋난다.
   */
  const 맨몸 = 맨몸한국어(몸);
  if (맨몸.length) 아픔.push(`뜻 없는 한국어가 샌다: ${맨몸.slice(0, 3).join(' · ')}`);
  return 아픔;
}

/**
 * 🔴 [2026-09-05] **일부러 옮긴 주소를 「아프다」고 세우고 있었다.**
 *
 * 사장님이 Riot 을 걷어내라 하셔서 그 기사 두 편과 `/esports` 를 «살아 있는 지면»으로 301 로
 * 옮겼다. 링크 값을 지키고 손님을 대체 지면에 내려놓는, 옳은 처리다. 그런데 이 자는 리다이렉트를
 * 안 따라가서 셋을 다 빨강으로 세우고 **exit 1 로 배포를 막았다.** 노출 305건(전체의 13%)이
 * 「아픈 지면」으로 보고되고 있었다.
 *
 * ⛔ 이것은 «예외를 박는 것»이 아니다. 규칙을 넓힌다 —
 *   **우리 집 안에서 200 으로 끝나는 옮김은 건강한 것**이고, 집을 나가거나 200 이 아닌 데서
 *   끝나면 여전히 아픈 것이다. 아래 자가시험이 그 경계를 지킨다.
 * ⚠ 다만 «조용히 통과»시키지 않는다 — 몇 번 옮겨 어디에 닿았는지 화면에 적는다.
 *   옮긴 주소가 노출을 벌고 있다는 사실 자체가 알 값어치가 있다.
 */
export function 옮김판정(코드, 위치, 우리집) {
  if (코드 !== 301 && 코드 !== 302 && 코드 !== 307 && 코드 !== 308) return { 옮김: false };
  const 곳 = String(위치 ?? '').trim();
  if (!곳) return { 옮김: true, 우리집인가: false, 길: null };
  if (곳.startsWith('/')) return { 옮김: true, 우리집인가: true, 길: 곳 };
  let u; try { u = new URL(곳); } catch { return { 옮김: true, 우리집인가: false, 길: null }; }
  if (u.host !== 우리집) return { 옮김: true, 우리집인가: false, 길: null };
  return { 옮김: true, 우리집인가: true, 길: u.pathname + u.search };
}

function 한번받기(길) {
  return new Promise((resolve) => {
    const req = https.request({
      host: 호스트, path: 길, method: 'GET',
      headers: { Host: 호스트, 'User-Agent': 'KCultureWire-selfcheck/1.0' },
    }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; });
      res.on('end', () => resolve({ 코드: res.statusCode, 글: b, 위치: res.headers.location }));
    });
    req.on('error', (e) => resolve({ 코드: 0, 글: e.message }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ 코드: 0, 글: 'timeout' }); });
    req.end();
  });
}

async function 받기(길) {
  const 걸음 = [];
  let 지금 = 길;
  for (let i = 0; i < 3; i += 1) {
    const r = await 한번받기(지금);
    const 옮 = 옮김판정(r.코드, r.위치, 호스트);
    if (!옮.옮김) return { ...r, 걸음, 마지막길: 지금 };
    걸음.push(`${r.코드} → ${옮.길 ?? '집 밖'}`);
    if (!옮.우리집인가) return { 코드: r.코드, 글: '', 걸음, 마지막길: 지금 };   /* 집을 나가면 아픈 것으로 둔다 */
    지금 = 옮.길;
  }
  return { 코드: 0, 글: '옮김이 세 번을 넘는다', 걸음, 마지막길: 지금 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (n, v) => { if (v) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}`); } };

  참('온 주소에서 길만 뽑는다', 주소길('https://www.kculturewire.com/titles?x=1') === '/titles');
  참('첫 화면은 슬래시', 주소길('https://www.kculturewire.com') === '/');

  const 행 = [
    { key: 'https://x/a', impressions: 10 }, { key: 'https://x/a?b=1', impressions: 5 },
    { key: 'https://x/b', impressions: 20 }, { key: 'https://x/c', impressions: 0 },
  ];
  const 뽑 = 버는지면(행, 10);
  참('노출 많은 순으로 뽑는다', 뽑[0].길 === '/b' && 뽑[1].길 === '/a');
  참('같은 지면을 더해 센다', 뽑.find((x) => x.길 === '/a').노출 === 15);
  /* ⛔ 노출 0 은 「벌어 오는 지면」이 아니다 — 섞으면 지킬 자리가 흐려진다 */
  참('노출 0 은 안 뽑는다', !뽑.some((x) => x.길 === '/c'));
  참('장수를 지킨다', 버는지면(행, 1).length === 1);
  참('행이 없으면 빈 목록', 버는지면(null).length === 0);

  const 좋은글 = `<title>Good page</title><meta name="description" content="${'x'.repeat(40)}">`
    + `<p>${'body '.repeat(500)}</p>`;
  참('건강한 지면은 아픈 데가 없다', 아픈데(200, 좋은글).length === 0);
  참('200 이 아니면 그것만 적고 끝낸다',
    아픈데(404, 좋은글).length === 1 && 아픈데(404, 좋은글)[0] === 'HTTP 404');
  참('본문이 작으면 잡는다', 아픈데(200, '<title>t</title>').some((s) => /본문이/.test(s)));
  참('제목이 비면 잡는다', 아픈데(200, 좋은글.replace('Good page', '')).some((s) => /제목이 비었다/.test(s)));
  참('설명이 없으면 잡는다',
    아픈데(200, 좋은글.replace(/<meta[^>]*>/, '')).some((s) => /설명이/.test(s)));
  /* 🔴 이 넷이 손님 화면에 새면 그 지면은 우리 신뢰를 깎는다 */
  참('undefined 가 새면 잡는다', 아픈데(200, `${좋은글}undefined`).some((s) => /undefined/.test(s)));
  참('NaN 이 새면 잡는다', 아픈데(200, `${좋은글}NaN`).some((s) => /NaN/.test(s)));
  참('[object Object] 가 새면 잡는다',
    아픈데(200, `${좋은글}[object Object]`).some((s) => /object Object/.test(s)));
  /* 🔴 여기가 이 자의 흠이었다 — 원문 병기를 빨강으로 셌다(노출 164건이 걸렸다) */
  참('뜻 없는 한국어는 잡는다', 아픈데(200, `${좋은글}<td>배급</td>`).some((x) => /뜻 없는 한국어/.test(x)));
  참('⛔ 영문 뒤 괄호 원문 병기는 통과', 아픈데(200, `${좋은글}<td>Distribution (배급)</td>`)
    .every((x) => !/한국어/.test(x)));
  참('⛔ 출처 이름 병기도 통과', 아픈데(200, `${좋은글}<b>KOSIS (국가데이터처)</b>`)
    .every((x) => !/한국어/.test(x)));
  참('⛔ 낫표 병기도 통과',
    아픈데(200, `${좋은글}<b>Webtoon Industry Survey (한국콘텐츠진흥원 「웹툰산업실태조사」)</b>`)
    .every((x) => !/한국어/.test(x)));
  /* ⚠ 스크립트 안의 한국어는 손님이 안 본다 — 그것으로 빨강을 내면 옳은 지면을 고치게 된다 */
  참('스크립트 안 한국어는 안 센다',
    아픈데(200, `${좋은글}<script>/* 배급 */</script>`).every((s) => !/한국어/.test(s)));
  /* ⛔ 수를 박아 보지 않는다 — 자료가 바뀌어도 초록이어야 한다 */
  참('수를 박아 보지 않는다', 아픈데(200, 좋은글.replace(/body/g, 'other')).length === 0);

  /* 🔴 [2026-09-05] 일부러 옮긴 주소를 세우던 것을 시험으로 굳힌다 */
  참('200 은 옮김이 아니다', 옮김판정(200, undefined, 'a.com').옮김 === false);
  참('301 은 옮김이다', 옮김판정(301, '/b', 'a.com').옮김 === true);
  참('308 도 옮김이다', 옮김판정(308, '/b', 'a.com').옮김 === true);
  참('상대 주소는 우리 집이다', 옮김판정(301, '/esports-nations', 'a.com').우리집인가 === true);
  참('상대 주소의 길을 읽는다', 옮김판정(301, '/esports-nations', 'a.com').길 === '/esports-nations');
  참('같은 집 절대주소도 우리 집이다',
    옮김판정(301, 'https://a.com/x', 'a.com').우리집인가 === true);
  참('같은 집 절대주소의 길을 읽는다',
    옮김판정(301, 'https://a.com/x?y=1', 'a.com').길 === '/x?y=1');
  참('⛔ 남의 집으로 가면 우리 집이 아니다',
    옮김판정(301, 'https://other.com/x', 'a.com').우리집인가 === false);
  참('⛔ Location 이 비면 우리 집이 아니다', 옮김판정(301, '', 'a.com').우리집인가 === false);
  참('⛔ 망가진 주소도 우리 집이 아니다', 옮김판정(301, 'http://', 'a.com').우리집인가 === false);
  참('⛔ 옮겨 간 곳이 404 면 여전히 아프다', 아픈데(404, 좋은글).length === 1);

  console.log(`노출을 벌어 오는 지면을 지키는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(잰것길)) {
    console.log('⚠ 검색 실측이 없다 — **못 쟀다.** 무엇이 값나가는 지면인지 모른다.');
    console.log('   먼저: node scripts/search-console-report.mjs sc-domain:kculturewire.com'
      + ' --days 28 --축=page --행수=500 --적는다=src/data/kcw-search-pages.json');
    console.log('   ⛔ 손으로 적은 목록으로 되돌아가지 않는다 — 그 목록은 반드시 낡는다.');
    process.exit(0);
  }
  const 잰것 = JSON.parse(fs.readFileSync(잰것길, 'utf8'));
  const 장수 = Number(인자('장수', '15'));
  const 볼것 = 버는지면(잰것.rows, 장수);
  if (!볼것.length) {
    console.log('⚠ 노출이 있는 지면이 하나도 없다 — **못 쟀다**(0장이 아니다).');
    process.exit(0);
  }
  const 전체노출 = (잰것.rows ?? []).reduce((s, r) => s + (Number(r.impressions) || 0), 0);
  const 볼것노출 = 볼것.reduce((s, x) => s + x.노출, 0);

  console.log(`노출을 벌어 오는 지면 ${볼것.length}장을 실물로 잰다 — ${호스트}`);
  console.log(`   창: ${잰것.window?.from} ~ ${잰것.window?.to}`);
  console.log(`   이 ${볼것.length}장이 전체 노출 ${전체노출} 가운데 ${볼것노출}건`
    + ` (${((100 * 볼것노출) / (전체노출 || 1)).toFixed(0)}%) 을 벌어 온다\n`);

  const 아픈것 = [];
  for (const x of 볼것) {
    const r = await 받기(x.길);
    const 아픔 = 아픈데(r.코드, r.글);
    const 표 = 아픔.length ? '🔴' : '✅';
    /* ⚠ 옮긴 주소는 «통과시키되 적는다» — 노출을 버는 주소가 옮겨져 있다는 사실 자체를 알려야 한다 */
    const 옮김글 = r.걸음?.length ? `  [옮김 ${r.걸음.join(' ')}]` : '';
    console.log(`   ${표} 노출 ${String(x.노출).padStart(4)}  ${x.길.padEnd(44)}`
      + `${아픔.length ? aptText(아픔) : `${(r.글.length / 1024).toFixed(0)}KB`}${옮김글}`);
    if (아픔.length) 아픈것.push({ ...x, 아픔 });
  }
  function aptText(아픔) { return 아픔.join(' · '); }

  const 위험노출 = 아픈것.reduce((s, x) => s + x.노출, 0);
  console.log(`\n── 셈 ────────────────────────────────────`);
  console.log(`   아픈 지면 ${아픈것.length}장 · **위험한 노출 ${위험노출}건**`
    + ` (전체 ${전체노출} 의 ${((100 * 위험노출) / (전체노출 || 1)).toFixed(1)}%)`);
  if (아픈것.length) {
    console.log('\n   고칠 순서 — 노출이 큰 것부터다:');
    for (const x of 아픈것.sort((a, b) => b.노출 - a.노출)) {
      console.log(`   · 노출 ${String(x.노출).padStart(4)}  ${x.길}  — ${x.아픔.join(' · ')}`);
    }
    console.log('\n⛔ 이 자는 세운다. 노출을 벌어 오는 지면이 아프면 그것이 먼저다.');
    process.exit(1);
  }
  console.log('\n✅ 벌어 오는 지면이 다 건강하다');
}
