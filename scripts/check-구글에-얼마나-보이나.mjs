/**
 * check-구글에-얼마나-보이나.mjs — **구글 검색에서 우리가 몇 번 보이고 몇 번 눌리나.**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 사장님: 「구글검색이 제일 중요. 한국어 뿐만 아니라 다국어 서비스하니.
 *            **유입량을 지금의 천배, 만배로**」
 *
 * 🔴🔴 2026-10-05 실측 (30일 · 서치콘솔이 직접 준 답) —
 *
 *     seoulmarkets   노출 1,120 · 클릭 8
 *     100yearmap     노출   839 · 클릭 **0**   ← 보이기는 하는데 «아무도 안 누른다»
 *     kculturewire   노출   508 · 클릭 3
 *     klifemap       노출     7 · 클릭 1       ← 지면 3,004장을 가진 사이트다
 *     ─────────────────────────────────
 *     네 사이트 합                 클릭 **12**
 *
 *   🔴 **질의별로 쪼개면 진짜 모습이 나온다** (같은 30일) —
 *
 *     사이트          질의 수   평균 자리   1쪽(10위 안) 노출
 *     seoulmarkets      152       54위         18%
 *     kculturewire        7       33위         33%
 *     100yearmap         41       61위        **0%**
 *     klifemap            0        —           —     ← 질의가 하나도 안 나온다
 *
 *   ⇒ **둘 다 「순위」의 병이다.** 평균 54~61위면 아무도 안 본다 — 6~7쪽이다.
 *     클릭이 0 인 것은 제목·설명이 나빠서가 아니라 **거기까지 안 내려가기 때문**이다.
 *   ⛔ 내가 처음에 「100yearmap 은 제목이 안 눌리는 병」이라고 적었다. **틀렸다.**
 *     평균 자리를 재 보기 «전»에 단정한 것이다. 제목을 고쳐도 61위면 그대로 0 이다.
 *   ⭐ 고칠 데는 하나다 — **순위를 올리는 것**, 곧 밖에서 들어오는 링크다.
 *
 * 🔴 **처음 쟀을 때 노출이 10·14·679 로 나왔다. 그것은 틀린 수였다.**
 *   줄 수 제한(rowLimit)을 5 로 두어 **나라별 줄 다섯 개만 더하고 있었다.**
 *   100 으로 올리니 508·839·1120 이었다. ⛔ 자가 받아 온 것을 다 더하는지 본다.
 *
 * ⚠ 이 수는 서치콘솔이 직접 준 것이라 **우리 자를 안 거친다.** 그래서 믿을 수 있다.
 *   (같은 날 내가 만든 다른 자는 다섯 번 틀렸다. 이 수는 그 갈래가 아니다)
 *
 * ⭐ 왜 이것을 날마다 재나 — 「글을 몇 편 썼다」는 한 일이고,
 *   **노출과 클릭은 밖에서 난 결과**다. 사장님이 요구하신 것은 뒤쪽이다.
 *
 * 쓰는 법
 *   node scripts/check-구글에-얼마나-보이나.mjs            (30일)
 *   node scripts/check-구글에-얼마나-보이나.mjs --날수 7
 *   node scripts/check-구글에-얼마나-보이나.mjs --자가시험
 */
import process from 'node:process';

/** 🔴 못 박은 수 — 이보다 «줄면» 빨간불. 늘면 올려 적는다 */
export const 못박은_클릭 = { seoulmarkets: 8, kcw: 3, '100y': 0, klifemap: 1 };
/* 2026-10-05 실측 (30일). ⛔ 「0 이니 더 떨어질 데가 없다」로 두지 않는다 —
   0 이 1 이 되는 것이 우리가 재야 할 첫 걸음이다. */

/**
 * 날짜를 YYYY-MM-DD 로 — ⛔ `toISOString()` 을 쓰지 않는다. 이 PC 는 한국시간이다.
 *   그것을 쓰면 아침 9시 전에는 «어제»가 찍힌다.
 */
export function 날짜글(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

/** 재는 구간 — 구글은 최근 2~3일치를 늦게 채운다. 그래서 어제까지로 끊는다 */
export function 구간(오늘 = new Date(), 날수 = 30) {
  const 끝 = new Date(오늘); 끝.setDate(끝.getDate() - 1);
  const 시작 = new Date(끝); 시작.setDate(시작.getDate() - (날수 - 1));
  return { 시작: 날짜글(시작), 끝: 날짜글(끝) };
}

/** 줄들을 더한다. ⛔ 못 받았으면 null 이다 — 0 이 아니다 */
export function 더하기(줄들) {
  if (!Array.isArray(줄들)) return null;
  return {
    노출: 줄들.reduce((s, x) => s + (x.impressions ?? 0), 0),
    클릭: 줄들.reduce((s, x) => s + (x.clicks ?? 0), 0),
  };
}

/** 줄었나 — 못 박은 수보다 적으면 빨간불 */
export function 줄었나(지금, 못박은) {
  if (typeof 지금 !== 'number' || !Number.isFinite(지금)) return null;
  return 지금 < 못박은;
}

/* ─────────────────────────── 자가시험 ─────────────────────────── */
function 자가시험() {
  let 흠 = 0;
  const 본다 = (이름, 맞나) => { console.log(`  ${맞나 ? '✅' : '🔴'} ${이름}`); if (!맞나) 흠 += 1; };

  본다('날짜를 두 자리로 적는다', 날짜글(new Date(2026, 0, 5)) === '2026-01-05');
  /* 🔴 toISOString() 이면 한국 아침에 어제가 찍힌다 */
  본다('🔴 한국시간 그대로 적는다 — 하루가 안 밀린다',
    날짜글(new Date(2026, 9, 5, 1, 0)) === '2026-10-05');

  const c = 구간(new Date(2026, 9, 5), 30);
  본다('어제까지로 끊는다 — 구글이 오늘치를 아직 안 채운다', c.끝 === '2026-10-04');
  본다('30일이면 시작이 9월 5일', c.시작 === '2026-09-05');
  본다('7일도 맞다', 구간(new Date(2026, 9, 5), 7).시작 === '2026-09-28');

  본다('더한다', JSON.stringify(더하기([{ impressions: 3, clicks: 1 }, { impressions: 4, clicks: 0 }]))
    === JSON.stringify({ 노출: 7, 클릭: 1 }));
  본다('⛔ 줄이 없으면 0 이다 — 그것은 「못 쟀다」가 아니라 「없다」다',
    더하기([]).노출 === 0);
  본다('⛔ 못 받았으면 null 이다', 더하기(null) === null && 더하기(undefined) === null);

  본다('줄면 빨간불', 줄었나(0, 1) === true);
  본다('같으면 안 켠다', 줄었나(1, 1) === false);
  본다('늘면 안 켠다', 줄었나(5, 1) === false);
  본다('⛔ 못 쟀으면 null — 0 으로 세지 않는다', 줄었나(null, 1) === null);

  console.log(흠 ? `\n🔴 흠 ${흠}` : '\n✅ 자가시험 전부 통과');
  process.exit(흠 ? 1 : 0);
}

/* ─────────────────────────── 손으로 쓰기 ─────────────────────────── */
const 내가진입점 = process.argv[1]
  && decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\//, '')
    .toLowerCase().replace(/\\/g, '/')
    .endsWith(process.argv[1].toLowerCase().replace(/\\/g, '/').replace(/^[a-z]:\//, ''));

if (!내가진입점) { /* 들여다 쓰는 자리 — 아무것도 안 한다 */ }
else if (process.argv.includes('--자가시험')) { 자가시험(); }
else {
  const i = process.argv.indexOf('--날수');
  const 날수 = i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 30;
  const { 시작, 끝 } = 구간(new Date(), 날수);

  const { 토큰받기, 사이트들 } = await import('./fetch-gsc.mjs');
  const { 토큰 } = await 토큰받기();

  console.log(`■ 구글 검색에 우리가 얼마나 보이나 — ${시작} ~ ${끝} (${날수}일)\n`);
  const 잰것 = {};
  let 합노출 = 0; let 합클릭 = 0;
  for (const [딱지, v] of Object.entries(사이트들)) {
    try {
      const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(v.속성)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: 시작, endDate: 끝, dimensions: ['country'], rowLimit: 100 }),
      });
      if (!r.ok) { console.log(`   ⬜ ${딱지.padEnd(14)} 못 물었다 HTTP ${r.status}`); continue; }
      const 수 = 더하기((await r.json()).rows ?? []);
      잰것[딱지] = 수;
      합노출 += 수.노출; 합클릭 += 수.클릭;
      const 못박 = 못박은_클릭[딱지];
      const 표 = 못박 === undefined ? '  ' : (줄었나(수.클릭, 못박) ? '🔴' : '✅');
      console.log(`   ${표} ${딱지.padEnd(14)} 노출 ${String(수.노출).padStart(6)} · 클릭 ${String(수.클릭).padStart(4)}${못박 === undefined ? '' : `  (못 박은 수 ${못박})`}`);
    } catch (e) { console.log(`   ⬜ ${딱지.padEnd(14)} 못 쟀다 — ${String(e.message).slice(0, 50)}`); }
  }

  console.log(`\n   ───────────────────────────────────────`);
  console.log(`   네 사이트 합      노출 ${String(합노출).padStart(6)} · 클릭 ${String(합클릭).padStart(4)}`);
  console.log(`\n⚠ 이 수는 서치콘솔이 직접 준 것이다 — 우리 자를 안 거친다.`);
  console.log('⛔ 「글을 몇 편 썼다」는 한 일이다. 이 수가 **밖에서 난 결과**다.');

  const 줄어든것 = Object.entries(잰것).filter(([k, v]) => 줄었나(v.클릭, 못박은_클릭[k] ?? 0));
  if (줄어든것.length) {
    console.log(`\n🔴 클릭이 줄어든 곳 ${줄어든것.length} — ${줄어든것.map(([k]) => k).join(' · ')}`);
    process.exit(1);
  }
  console.log('\n✅ 안 줄었다. ⚠ 「안 줄었다」와 「늘었다」는 다르다.');
}
