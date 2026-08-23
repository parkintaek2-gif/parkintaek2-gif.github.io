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

function 받기(길) {
  return new Promise((resolve) => {
    const req = https.request({
      host: 호스트, path: 길, method: 'GET',
      headers: { Host: 호스트, 'User-Agent': 'KCultureWire-selfcheck/1.0' },
    }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; });
      res.on('end', () => resolve({ 코드: res.statusCode, 글: b }));
    });
    req.on('error', (e) => resolve({ 코드: 0, 글: e.message }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ 코드: 0, 글: 'timeout' }); });
    req.end();
  });
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
    console.log(`   ${표} 노출 ${String(x.노출).padStart(4)}  ${x.길.padEnd(44)}`
      + `${아픔.length ? aptText(아픔) : `${(r.글.length / 1024).toFixed(0)}KB`}`);
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
