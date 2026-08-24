#!/usr/bin/env node
/**
 * check-no-ads-where-forbidden.mjs — **광고가 있으면 안 되는 지면에 광고가 없는지 본다.**
 * (5번, 2026-08-24)
 *
 * ── 왜 이 검사가 생겼나 ──────────────────────────────────────
 * 🔴 2026-08-24 — 사장님 지시로 네 사이트에 애드센스 로더를 심었는데, 그 로더가
 *   **`/esports` 지면에 그대로 들어갔다.** 그 지면에 광고가 뜨면
 *   **Riot Production 승인(App 866800)이 영구 취소**된다. 배포 전에 눈으로 잡았다.
 *   눈으로 잡은 것은 다음에 못 잡는다. 그래서 검사로 굳힌다.
 *
 * 까닭이 둘이었고 둘 다 **조용했다** —
 *   ① `build.format: 'file'` 에서 `Astro.url.pathname` 은 `/wikitip/esports` 다.
 *      손님이 보는 `/esports` 로 조건을 적었더니 아무 소리 없이 통과했다.
 *   ② 그 지면은 이미 `noAds` 를 넘기고 있었는데 **레이아웃이 그 값을 안 받고 있었다.**
 *      넘기는 쪽만 있고 받는 쪽이 없으면 오류가 아니라 침묵이다.
 *
 * ⛔ **「광고 자리를 안 만들었으니 괜찮다」가 아니다.** Auto Ads 는 슬롯이 없어도
 *   로더 스크립트만 보고 광고를 꽂는다. 그러니 **로더 자체가 없어야** 한다.
 *   이 검사는 슬롯이 아니라 **로더**를 찾는다.
 *
 * ⛔ 이 검사는 **지어진 결과물(dist)** 을 본다. 소스가 아니라 손님이 받는 것을 본다.
 *   소스만 보면 「조건은 맞게 적혀 있는데 결과물엔 들어가 있는」 오늘 같은 경우를 놓친다.
 *
 * 쓰는 법
 *   node scripts/check-no-ads-where-forbidden.mjs
 *   node scripts/check-no-ads-where-forbidden.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 직접불렸나 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/**
 * 광고가 있으면 **안 되는** 지면과 그 까닭.
 * ⚠ 까닭을 같이 적는다 — 까닭 없는 금지는 다음 사람이 지운다.
 */
export const 광고금지 = [
  {
    글: 'dist/wikitip/esports.html',
    왜: 'Riot Production 승인(App 866800) 전에 광고가 뜨면 API 가 영구 취소된다',
    누구: '5번',
  },
];

/** 애드센스 **로더**를 부르고 있나. 슬롯이 아니라 로더를 본다 */
export function 로더가있나(글) {
  if (typeof 글 !== 'string') return false;
  return 글.includes('adsbygoogle.js?client=')
    || 글.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle');
}

/** 광고 **자리**가 있나. 로더가 없어도 자리가 있으면 그것도 적어 둔다 */
export function 자리가있나(글) {
  if (typeof 글 !== 'string') return false;
  return /class\s*=\s*["'][^"']*\badsbygoogle\b/.test(글);
}

/**
 * 지면 하나를 판정한다.
 * ⛔ **파일이 없으면 「통과」가 아니다.** 「볼 것이 없었다」와 「봤는데 없었다」는 다른 말이다.
 *   빌드가 덜 됐을 때 초록을 내는 검사를 여러 번 겪었다.
 */
export function 판정(있나, 글) {
  if (!있나) return { 꼴: '못봤다', 왜: '파일이 없다 — 빌드가 덜 됐거나 지면 이름이 바뀌었다' };
  if (로더가있나(글)) return { 꼴: '빨강', 왜: '애드센스 로더가 들어 있다' };
  if (자리가있나(글)) return { 꼴: '빨강', 왜: '광고 자리(ins.adsbygoogle)가 들어 있다' };
  return { 꼴: '통과', 왜: '로더도 자리도 없다' };
}

/** 결과 여러 개를 한 줄 판정으로 접는다. ⛔ 「못봤다」를 통과로 접지 않는다 */
export function 모아판정(결과들) {
  const 빨강 = (결과들 ?? []).filter((r) => r.꼴 === '빨강');
  const 못봤다 = (결과들 ?? []).filter((r) => r.꼴 === '못봤다');
  if (빨강.length) return { 꼴: '빨강', 빨강: 빨강.length, 못봤다: 못봤다.length };
  if (못봤다.length) return { 꼴: '못봤다', 빨강: 0, 못봤다: 못봤다.length };
  if (!결과들?.length) return { 꼴: '못봤다', 빨강: 0, 못봤다: 0 };
  return { 꼴: '통과', 빨강: 0, 못봤다: 0 };
}

if (직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  참('로더 주소를 잡는다',
    로더가있나('<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1"></script>'));
  참('client 없는 로더도 잡는다',
    로더가있나('<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>'));
  참('로더가 없으면 없다고 한다', 로더가있나('<p>no ads here</p>') === false);
  참('글이 아니면 없다고 한다', 로더가있나(null) === false);

  참('광고 자리를 잡는다', 자리가있나('<ins class="adsbygoogle" style="display:block"></ins>'));
  참('비슷한 말은 안 잡는다', 자리가있나('<p>we do not use adsbygoogle here</p>') === false);

  /* 🔴 오늘 겪은 것 — 로더만 있고 자리는 없었다. 그래도 빨강이어야 한다 */
  참('자리가 없고 로더만 있어도 빨강이다',
    판정(true, '<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=x"></script>').꼴 === '빨강');
  참('자리만 있어도 빨강이다',
    판정(true, '<ins class="adsbygoogle"></ins>').꼴 === '빨강');
  참('둘 다 없으면 통과', 판정(true, '<p>clean</p>').꼴 === '통과');

  /* 🔴 파일이 없을 때 초록을 내면 안 된다 */
  참('파일이 없으면 통과가 아니다', 판정(false, null).꼴 === '못봤다');

  참('빨강이 하나라도 있으면 빨강', 모아판정([{ 꼴: '통과' }, { 꼴: '빨강' }]).꼴 === '빨강');
  참('못봤다가 있으면 통과가 아니다', 모아판정([{ 꼴: '통과' }, { 꼴: '못봤다' }]).꼴 === '못봤다');
  참('아무것도 안 봤으면 통과가 아니다', 모아판정([]).꼴 === '못봤다');
  참('전부 통과면 통과', 모아판정([{ 꼴: '통과' }, { 꼴: '통과' }]).꼴 === '통과');

  참('금지 목록에 까닭이 다 적혀 있다', 광고금지.every((x) => x.왜 && x.왜.length > 10));
  참('금지 목록이 비어 있지 않다', 광고금지.length >= 1);

  console.log(`광고 금지 지면을 보는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (직접불렸나 && !process.argv.includes('--selftest')) {
  console.log('광고가 있으면 안 되는 지면을 본다 — 지어진 결과물(dist)을 본다');
  const 결과 = [];
  for (const x of 광고금지) {
    const p = path.join(뿌리, x.글);
    const 있나 = fs.existsSync(p);
    const r = 판정(있나, 있나 ? fs.readFileSync(p, 'utf8') : null);
    결과.push(r);
    const 표 = r.꼴 === '통과' ? '✅' : (r.꼴 === '빨강' ? '🔴' : '⚠');
    console.log(`  ${표} ${x.글}`);
    console.log(`     ${r.왜}`);
    if (r.꼴 !== '통과') console.log(`     왜 금지인가: ${x.왜} (${x.누구})`);
  }
  const 접은것 = 모아판정(결과);
  if (접은것.꼴 === '통과') { console.log('\n✅ 금지 지면에 광고 없다'); process.exit(0); }
  if (접은것.꼴 === '못봤다') {
    console.log(`\n⚠ **못 쟀다** — ${접은것.못봤다}장을 못 봤다. 먼저 빌드한다.`);
    console.log('⛔ 이것은 통과가 아니다. 아무것도 안 보고 초록을 내지 않는다.');
    process.exit(1);
  }
  console.log(`\n🔴 빨강 ${접은것.빨강}장 — **배포하지 않는다.**`);
  process.exit(1);
}
