#!/usr/bin/env node
/**
 * check-domains.mjs — **손님 주소가 우리 앱에 붙어 있나**를 잰다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 왜 만들었나 (2026-09-14 · 5번)
 *
 *   배포가 멈춰 있어 `ctype remove` → `apply` 를 쳤다. 앱은 잘 떴는데
 *   **손님 주소로는 셋 다 404 였다.** `remove` 가 «커스텀 도메인 연결»까지
 *   가져간 것이다. 도메인은 app.yaml 에 없고 콘솔에서 붙이는 것이라
 *   apply 로 되살아나지 않는다. 세 사이트가 한 시간 내려가 있었다.
 *
 *   ⛔ 더 나쁜 것은 «아무도 몰랐다»는 점이다. 앱은 Running 이고 로그도 조용했다.
 *      기본 주소(port-0-….cloudtype.app)는 200 이었다. 손님 주소만 죽어 있었다.
 *
 *   ⇒ 강령 ④ — 규칙은 문장이 아니라 «검사»로 둔다. 그래서 이 자를 만든다.
 *
 * 쓰는 법
 *   node scripts/check-domains.mjs              잰다 (하나라도 깨지면 종료코드 1)
 *   node scripts/check-domains.mjs --자가시험
 *
 * ⚠ 이 자는 «도메인이 붙어 있나»만 본다. 결제·로그인은 check-daily.mjs 가 본다.
 */

/** 손님이 실제로 치는 주소들. 하나라도 죽으면 그 사이트는 없는 것이다. */
export const 손님주소 = [
  { 주소: 'https://seoulmarkets.com/', 사이트: 'SeoulMarkets', 자리: '6번' },
  { 주소: 'https://kculturewire.com/', 사이트: 'K Culture Wire', 자리: '1번' },
  { 주소: 'https://www.kculturewire.com/', 사이트: 'K Culture Wire (www)', 자리: '1번' },
  { 주소: 'https://100yearmap.com/', 사이트: '백년지도', 자리: '3번' },
  { 주소: 'https://klifemap.ai/', 사이트: 'KLifeMap', 자리: '2번' },
];

/**
 * 답 하나를 판정한다. 순수함수라 시험할 수 있다.
 * ⚠ 301·302 는 «괜찮다» — kculturewire.com 은 www 로 넘긴다. 따라간 끝이 200 이면 산 것이다.
 * ⛔ 000(=붙지도 못함)과 404 를 가른다. 404 는 도메인이 «떨어진» 꼴이고,
 *    000 은 인증서가 아직 안 나왔거나 DNS 가 안 잡힌 꼴이다. 처방이 다르다.
 */
export function 판정(코드) {
  const n = Number(코드);
  if (n === 200) return { 산다: true, 등급: 'ok', 왜: '200' };
  if (n === 0 || Number.isNaN(n)) {
    return { 산다: false, 등급: 'tls', 왜: '붙지 못함 — 인증서가 아직 없거나 DNS 가 안 잡혔다' };
  }
  if (n === 404) {
    return { 산다: false, 등급: 'unbound', 왜: '404 — 도메인이 앱에 «안 붙어» 있을 수 있다 (ctype routes 로 본다)' };
  }
  if (n >= 500) return { 산다: false, 등급: 'server', 왜: n + ' — 앱이 아프다' };
  return { 산다: false, 등급: 'other', 왜: String(n) };
}

/* ── 자가시험 ────────────────────────────────────────────── */
export function 자가시험() {
  const 흠 = [];
  let 잰수 = 0;
  const 재다 = (n, t) => { 잰수 += 1; if (!t) 흠.push(n); };

  재다('200 은 산 것이다', 판정(200).산다 === true);
  재다('🔴 404 는 도메인이 떨어진 꼴이다', 판정(404).등급 === 'unbound');
  재다('🔴 000 은 인증서·DNS 꼴이다', 판정(0).등급 === 'tls');
  재다('빈 값도 견딘다', 판정('').등급 === 'ok' ? false : true);
  재다('500 은 앱이 아픈 것이다', 판정(503).등급 === 'server');
  재다('403 은 그 밖이다', 판정(403).등급 === 'other');
  재다('404 는 산 것이 아니다', 판정(404).산다 === false);
  재다('주소 목록이 다섯이다', 손님주소.length === 5);
  재다('주소마다 담당 자리가 있다', 손님주소.every((x) => x.자리 && x.사이트));
  재다('주소는 다 https 다', 손님주소.every((x) => x.주소.startsWith('https://')));
  /* 🔴 오늘 실제로 겪은 꼴 — 기본주소는 200 인데 손님주소가 404 였다 */
  재다('🔴 기본주소가 살아 있어도 손님주소 404 면 깨진 것이다',
    판정(200).산다 === true && 판정(404).산다 === false);

  return { 흠, 잰수 };
}

async function 재기(주소) {
  try {
    const r = await fetch(주소, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return r.status;
  } catch (e) { return 0; }
}

async function 본일() {
  const { 흠, 잰수 } = 자가시험();
  console.log(흠.length ? '🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ') : '✅ 자가시험 ' + (잰수 - 흠.length) + '/' + 잰수);
  if (흠.length) process.exit(1);
  if (process.argv.includes('--자가시험')) return;

  console.log('\n■ 손님 주소가 살아 있나 — ' + new Date().toLocaleString('ko-KR'));
  const 깨진것 = [];
  for (const x of 손님주소) {
    const 코드 = await 재기(x.주소);
    const p = 판정(코드);
    console.log('  ' + (p.산다 ? '✅' : '🔴') + ' ' + x.사이트.padEnd(22, ' ') + ' ' + x.주소.padEnd(34, ' ') + p.왜);
    if (!p.산다) 깨진것.push({ ...x, ...p });
  }

  if (!깨진것.length) { console.log('\n✅ 다섯 주소 다 살아 있다.'); return; }

  console.log('\n🔴🔴 손님이 못 들어오는 주소가 ' + 깨진것.length + '개다 — **다른 일을 하기 전에 이것부터 고친다**');
  for (const x of 깨진것) console.log('   · ' + x.사이트 + ' (' + x.자리 + ') — ' + x.왜);
  if (깨진것.some((x) => x.등급 === 'unbound')) {
    console.log('\n⭐ 404 가 있으면 «도메인이 떨어진» 것부터 의심한다 (2026-09-14 에 겪었다):');
    console.log('   ctype routes -t @parkintaek2/seoulmarkets:main     ← 붙은 주소를 본다');
    console.log('   없으면 콘솔에서 되붙인다 — CLAUDE.md 「ctype remove 는 도메인까지 가져간다」 절');
  }
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-domains.mjs')) 본일();
