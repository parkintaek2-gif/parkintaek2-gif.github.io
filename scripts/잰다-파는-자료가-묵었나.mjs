#!/usr/bin/env node
/**
 * 잰다-파는-자료가-묵었나.mjs
 *
 * 🔴🔴 [2026-10-15 · 5번] **왜 이 자가 필요한가.**
 * ─────────────────────────────────────────────────────────────────────
 * F7 을 감수하다 찾았다 — 우리가 «파는» API 가 **73일 묵은 자료**를 주고 있었다.
 *     /v1/research 의 가장 새 자료   2026-08-03   (그날은 2026-10-15)
 *
 * ⭐ 수집은 멀쩡했다. archive/raw/research/2026-10-15 까지 날마다 쌓였다.
 *   2번의 매시 보고 「한경컨센서스 수집 정상 유지 중」도 **맞는 말이었다.**
 *   멈춘 것은 그 사이에 있는 **인덱스 다시 만들기**였다(9/26 이후 안 돌았다).
 *   API 는 원본이 아니라 인덱스를 읽는다. 그래서 아무도 몰랐다.
 *
 * ⛔ 「수집이 돈다」와 「손님이 새 자료를 받는다」는 다른 일이다.
 *   오늘만 같은 병을 네 번 만났다 — 거두기 로그 · 제목 동기화 · 중부매일 문 · 이것.
 *
 * ⇒ 이 자는 **손님이 실제로 받는 것**을 본다. 중간 단계를 안 믿는다.
 *
 * ⛔ 이 자는 고치지 않는다. 며칠 묵었는지만 가져온다.
 * ⚠ 못 보는 것 — 「왜 묵었나」는 못 잰다. 수집인지 인덱스인지는 사람이 본다.
 *
 * 쓰기:  node scripts/잰다-파는-자료가-묵었나.mjs
 *       node scripts/잰다-파는-자료가-묵었나.mjs --자가시험
 */

/** 자료가 며칠 묵었나. ⛔ 날짜를 못 찾으면 null — 0 이 아니다 */
export function 며칠묵었나(가장새날, 오늘 = new Date()) {
  if (!가장새날) return null;
  const t = new Date(String(가장새날) + 'T00:00:00+09:00').getTime();
  if (!Number.isFinite(t)) return null;
  const 오늘0 = new Date(오늘.getFullYear(), 오늘.getMonth(), 오늘.getDate()).getTime();
  return Math.floor((오늘0 - t) / 86400000);
}

/** 답에서 가장 새 날짜를 뽑는다. ⛔ 못 찾으면 null */
export function 가장새날(글) {
  if (typeof 글 !== 'string' || !글) return null;
  const 것 = [...글.matchAll(/"(?:date|날짜|publishedAt|tradeDate)"\s*:\s*"?(\d{4})-?(\d{2})-?(\d{2})"?/g)]
    .map((m) => m[1] + '-' + m[2] + '-' + m[3]);
  if (!것.length) return null;
  것.sort();
  return 것[것.length - 1];
}

/** 며칠까지 봐주나 — 자료마다 다르다. 거래일 자료는 주말이 끼므로 넉넉히 */
export const 볼것 = [
  { 길: '/v1/research', 이름: '리서치(한경컨센서스)', 참는날: 5 },
  { 길: '/v1/index-tape', 이름: '지수 시세', 참는날: 5 },
];

export function 판정(묵은날, 참는날) {
  if (묵은날 === null) return { 빛: '⬜', 말: '날짜를 못 찾았다 — 「새 자료다」가 아니다' };
  if (묵은날 <= 참는날) return { 빛: '✅', 말: 묵은날 + '일 묵었다 (참는 날 ' + 참는날 + ')' };
  return { 빛: '🔴', 말: 묵은날 + '일 묵었다 — 손님이 옛 자료를 받고 있다 (참는 날 ' + 참는날 + ')' };
}

async function 돈다() {
  const 집 = 'https://seoulmarkets.com';
  console.log('■ 우리가 «파는» 자료가 며칠 묵었나 — 손님이 실제로 받는 것을 본다');
  console.log('  ⛔ 「수집이 돈다」와 「손님이 새 자료를 받는다」는 다른 일이다.');
  console.log('');
  let 막는다 = false, 못쟀다 = 0;
  for (const v of 볼것) {
    let 글 = null;
    try {
      const r = await fetch(집 + v.길 + '?limit=50');
      글 = r.ok ? await r.text() : null;
    } catch { 글 = null; }
    if (글 === null) { 못쟀다++; console.log('  ⬜ ' + v.이름.padEnd(22) + ' 못 받았다 — 「묵었다」가 아니다'); continue; }
    const 날 = 가장새날(글);
    const 묵 = 며칠묵었나(날);
    const p = 판정(묵, v.참는날);
    if (p.빛 === '🔴') 막는다 = true;
    if (p.빛 === '⬜') 못쟀다++;
    console.log('  ' + p.빛 + ' ' + v.이름.padEnd(22) + (날 ?? '(날짜 없음)').padEnd(12) + p.말);
  }
  console.log('');
  if (막는다) {
    console.log('🔴 손님이 옛 자료를 받고 있다. 볼 곳 둘 —');
    console.log('   ① 수집이 도나   ls archive/raw/research | tail -3');
    console.log('   ② 인덱스를 다시 만들었나   node scripts/build-research-index.mjs --upload');
    console.log('   ⭐ 2026-10-15 에는 ②가 19일째 멈춰 있었다. ①은 멀쩡했다.');
    process.exit(1);
  }
  if (못쟀다 === 볼것.length) { console.log('⬜ 하나도 못 쟀다 — 「새 자료다」가 아니다'); process.exit(0); }
  console.log('✅ 파는 자료가 새것이다.');
  process.exit(0);
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0, 탈 = 0;
  const T = (뜻, 참) => { if (참) { 통++; console.log('  ✅ ' + 뜻); } else { 탈++; console.log('  🔴 ' + 뜻); } };
  const 오늘 = new Date(2026, 9, 15);   /* 2026-10-15 */

  console.log('■ 자가시험');
  T('며칠 묵었는지 센다', 며칠묵었나('2026-10-13', 오늘) === 2);
  T('🔴 오늘 자료는 0 일이다', 며칠묵었나('2026-10-15', 오늘) === 0);
  T('🔴 73일도 센다 — 실제로 그랬다', 며칠묵었나('2026-08-03', 오늘) === 73);
  T('⛔ 날짜가 없으면 null — 0 으로 적지 않는다', 며칠묵었나(null, 오늘) === null);
  T('⛔ 엉뚱한 글자도 null', 며칠묵었나('어제', 오늘) === null);

  T('답에서 가장 새 날짜를 뽑는다',
    가장새날('{"date": "2026-08-03"},{"date": "2026-10-14"}') === '2026-10-14');
  T('빗금 없는 꼴도 읽는다 — 지수 시세가 그 꼴이다',
    가장새날('{"date": "20261012"}') === '2026-10-12');
  T('⛔ 날짜가 없으면 null', 가장새날('{"a":1}') === null);
  T('⛔ 빈 것에 안 터진다', 가장새날('') === null && 가장새날(null) === null);

  T('참는 날 안이면 ✅', 판정(2, 5).빛 === '✅');
  T('🔴 참는 날을 넘으면 🔴 이고 «손님이 옛 자료를 받는다»고 말한다',
    판정(73, 5).빛 === '🔴' && 판정(73, 5).말.includes('옛 자료'));
  T('⛔ 못 쟀으면 ⬜ 이고 「새 자료다」로 읽히지 않는다',
    판정(null, 5).빛 === '⬜' && 판정(null, 5).말.includes('아니다'));

  T('⛔ 볼 것마다 참는 날이 있다', 볼것.every((v) => Number.isFinite(v.참는날)));

  console.log('\n자가시험 — 통과 ' + 통 + ' · 실패 ' + 탈);
  process.exit(탈 ? 1 : 0);
}

const 곧바로부른것 = (() => {
  const 나 = decodeURIComponent(new URL(import.meta.url).pathname).split('/').pop();
  const 부른것 = String(process.argv[1] || '').split('/').pop().split(String.fromCharCode(92)).pop();
  return 나 !== '' && 나 === 부른것;
})();

if (!곧바로부른것) { /* 불러 쓰는 중이다 */ }
else if (process.argv.includes('--자가시험')) 자가시험();
else 돈다().catch((e) => { console.error('⬜ 못 쟀다 —', e.message); process.exit(0); });
