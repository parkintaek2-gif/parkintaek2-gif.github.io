#!/usr/bin/env node
/**
 * 영문 위키백과 열람의 «요일 효과»를 재고, 어떤 날의 배수에서 그것을 걷어 낸다.
 *
 *   node scripts/measure-kcw-weekday-effect.mjs --자가시험
 *   node scripts/measure-kcw-weekday-effect.mjs "Jin (singer)" --날 20260907
 *   node scripts/measure-kcw-weekday-effect.mjs --패널          여덟 사람 한 판
 *
 * ## 🔴 왜 만들었나 (2026-09-18 · 5번)
 *
 * K Culture Wire 기사 221편은 「그 소식이 영어권 관심을 움직였나」를 **하루 열람수가
 * 30일 평균의 몇 배인가**로 판정해 왔다. 그런데 그 배수 안에 «요일»이 섞여 있었다.
 *
 * ```
 * 여덟 사람 78일(2026-07-01~09-16) 실측 — 각자 평균을 1 로 놓았을 때
 *   일 1.16 · 월 1.07 · 화 0.97 · 수 0.94 · 목 0.92 · 금 0.94 · 토 1.01
 *   ⇒ 사건이 하나도 없어도 요일만으로 27% 가 벌어진다
 * ```
 *
 * 사람마다 폭이 다르다 — 이것이 더 중요하다.
 * ```
 *   Jin (singer)   일 1.41 · 금 0.84   ⇒ 68% 폭
 *   Jimin          일 1.29 · 금 0.88   ⇒ 47% 폭
 *   Kim Ji-won     일 1.07 · 수 0.97   ⇒ 10% 폭
 * ```
 * 곧 **같은 「1.3x」가 어떤 사람에게는 사건이고 어떤 사람에게는 그냥 일요일이다.**
 *
 * ## 이미 나간 기사를 다시 재 보았다 — 결론은 다 맞았다
 *
 * ```
 * Jin 9/7 「did not move his page」        요일 걷으면 1.02x  ⇒ 맞다(오히려 더 강해진다)
 * Le Sserafim 9/14 「a real spike」         요일 걷으면 2.36x  ⇒ 맞다
 * Stray Kids 9/12 「rose at Rock in Rio」   요일 효과 없음(토 1.00) ⇒ 맞다
 * ```
 * ⛔ 그러니 이것은 「우리가 틀린 기사를 냈다」가 아니다. **경계에 선 판정이 운으로
 *   맞았다**는 것이다. 다음번에 1.15x 를 만나면 요일 없이는 가를 수 없다.
 *
 * ## 이 자가 못 보는 것
 *
 * · 요일 말고 다른 주기(월초·월말, 시상식 철)는 안 본다
 * · 기준선 창(며칠)을 바꾸면 배수 자체가 달라진다 — 이 자는 78일로 고정해 «요일 몫»만 낸다
 * · 열람수가 하루 몇백 회뿐인 문서는 요일 평균이 흔들린다. 그때는 못 쟀다고 적는다
 */
const 요일이름 = ['일', '월', '화', '수', '목', '금', '토'];
const 패널 = ['Jimin', 'Kim Ji-won', 'Park Bo-gum', 'Jung Hae-in',
  'Jin (singer)', 'Lisa (rapper)', 'Karina (singer)', 'Cha Eun-woo'];
const 창시작 = '20260701', 창끝 = '20260916';
/** 요일 평균이 흔들리지 않으려면 요일마다 표본이 이만큼은 있어야 한다 */
const 최소일수 = 56;
/** 이만큼 낮으면 열람 자체가 적어 요일 평균을 믿기 어렵다 */
const 최소열람 = 200;

/** 날짜 여덟 자리(YYYYMMDD)의 요일. 0=일 */
export function 요일번호(날) {
  return new Date(`${String(날).slice(0, 4)}-${String(날).slice(4, 6)}-${String(날).slice(6, 8)}T00:00:00Z`).getUTCDay();
}

/** 하루 열람 배열에서 요일별 평균 배수를 낸다. 값이 모자라면 null 을 돌려준다 — 짐작하지 않는다. */
export function 요일배수내기(행) {
  if (!Array.isArray(행) || 행.length < 최소일수) return null;
  const 평균 = 행.reduce((s, x) => s + x.수, 0) / 행.length;
  if (!(평균 > 0)) return null;
  const 칸 = Array.from({ length: 7 }, () => []);
  for (const x of 행) 칸[요일번호(x.날)].push(x.수 / 평균);
  if (칸.some((a) => a.length === 0)) return null;
  return { 평균, 요일: 칸.map((a) => a.reduce((s, v) => s + v, 0) / a.length) };
}

/** 어떤 날의 「그냥 배수」에서 요일 몫을 걷어 낸다. */
export function 요일걷기(그냥배수, 요일배수, 날) {
  const w = 요일배수[요일번호(날)];
  if (!(w > 0)) return null;
  return 그냥배수 / w;
}

async function 받기(이름) {
  const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(이름)}/daily/${창시작}/${창끝}`;
  const r = await fetch(u, { headers: { 'User-Agent': 'KCultureWire/1.0 (https://www.kculturewire.com)' } });
  if (!r.ok) return null;
  const j = await r.json();
  return (j.items || []).map((x) => ({ 날: x.timestamp.slice(0, 8), 수: x.views }));
}

if (process.argv.includes('--자가시험')) {
  const { strict: assert } = await import('node:assert');
  let 셈 = 0;
  const 봄 = (말, 참) => { 셈++; console.log((참 ? '✅ ' : '🔴 ') + 말); if (!참) process.exitCode = 1; };

  봄('① 2026-09-07 은 월요일이다', 요일번호('20260907') === 1);
  봄('② 2026-09-13 은 일요일이다', 요일번호('20260913') === 0);

  /* 사건이 하나도 없는 자료 — 요일 효과는 전부 1.00 이어야 한다 */
  const 평평 = Array.from({ length: 70 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 6, 1 + i));
    return { 날: d.toISOString().slice(0, 10).replace(/-/g, ''), 수: 1000 };
  });
  const r1 = 요일배수내기(평평);
  봄('③ 흔들림이 없으면 요일 배수가 다 1 이다', r1 && r1.요일.every((v) => Math.abs(v - 1) < 1e-9));

  /* 일요일에만 두 배인 자료 — 일요일 배수만 커야 한다 */
  const 일요일두배 = 평평.map((x) => ({ ...x, 수: 요일번호(x.날) === 0 ? 2000 : 1000 }));
  const r2 = 요일배수내기(일요일두배);
  봄('④ 일요일만 두 배면 일요일 배수가 가장 크다', r2 && r2.요일[0] === Math.max(...r2.요일));
  봄('⑤ 그 자료에서 어떤 일요일의 배수를 걷으면 1 에 가깝다',
    r2 && Math.abs(요일걷기(2000 / r2.평균, r2.요일, '20260705') - 1) < 1e-9);

  /* ⛔ 모자란 자료로 짐작하지 않는다 — 이것이 이 자의 핵심이다 */
  봄('⑥ 자료가 모자라면 null 을 돌려준다(짐작하지 않는다)', 요일배수내기(평평.slice(0, 20)) === null);
  봄('⑦ 빈 요일이 있으면 null 을 돌려준다',
    요일배수내기(평평.filter((x) => 요일번호(x.날) !== 3)) === null);
  봄('⑧ 아예 안 넘겨도 죽지 않는다', 요일배수내기(null) === null);

  console.log(`\n${process.exitCode ? '🔴 깨짐' : '✅ 자가시험 ' + 셈 + '개 다 통과'}`);
  process.exit();
}

const 이름자리 = process.argv.slice(2).find((a) => !a.startsWith('--'));
const 날자리 = process.argv.indexOf('--날');
const 볼날 = 날자리 >= 0 ? (process.argv[날자리 + 1] || '').split(',').filter(Boolean) : [];

if (process.argv.includes('--패널') || !이름자리) {
  const 모음 = {};
  for (const 이름 of 패널) {
    const 행 = await 받기(이름);
    const r = 행 && 요일배수내기(행);
    if (!r) { console.log(`${이름} — 못 쟀다(자료 모자람)`); continue; }
    if (r.평균 < 최소열람) { console.log(`${이름} — 못 쟀다(하루 평균 ${Math.round(r.평균)}회, 요일 평균이 흔들린다)`); continue; }
    모음[이름] = r.요일;
  }
  console.log(`\n${창시작}~${창끝} · 각자 평균을 1 로 놓았을 때 요일별 평균 배수\n`);
  console.log('이름'.padEnd(18) + 요일이름.map((d) => d.padStart(6)).join(''));
  for (const [이름, 값] of Object.entries(모음)) {
    console.log(이름.padEnd(18) + 값.map((v) => v.toFixed(2).padStart(6)).join(''));
  }
  const n = Object.keys(모음).length;
  if (n) {
    const 전체 = Array.from({ length: 7 }, (_, i) => Object.values(모음).reduce((s, v) => s + v[i], 0) / n);
    console.log('─'.repeat(18 + 42));
    console.log(`${n}명 평균`.padEnd(18) + 전체.map((v) => v.toFixed(2).padStart(6)).join(''));
    const 높은 = Math.max(...전체), 낮은 = Math.min(...전체);
    console.log(`\n가장 높은 요일 ${요일이름[전체.indexOf(높은)]}(${높은.toFixed(2)}x) · 가장 낮은 요일 ${요일이름[전체.indexOf(낮은)]}(${낮은.toFixed(2)}x)`);
    console.log(`⇒ 사건이 없어도 요일만으로 ${((높은 / 낮은 - 1) * 100).toFixed(0)}% 가 벌어진다`);
  }
  process.exit(0);
}

const 행 = await 받기(이름자리);
const r = 행 && 요일배수내기(행);
if (!r) { console.log(`${이름자리} — 못 쟀다. 자료가 모자라 요일 평균을 낼 수 없다`); process.exit(1); }
console.log(`${이름자리} — ${행.length}일 · 하루 평균 ${Math.round(r.평균).toLocaleString()}`);
if (r.평균 < 최소열람) console.log(`  ⚠ 하루 평균이 ${Math.round(r.평균)}회뿐이라 요일 평균이 흔들린다. 아래 수를 단정에 쓰지 않는다`);
console.log('  요일 효과: ' + r.요일.map((v, i) => `${요일이름[i]} ${v.toFixed(2)}`).join(' · '));
for (const 날 of 볼날) {
  const x = 행.find((y) => y.날 === 날);
  if (!x) { console.log(`  ${날} — 자료 없음`); continue; }
  const 그냥 = x.수 / r.평균;
  console.log(`  ${날}(${요일이름[요일번호(날)]})  ${x.수.toLocaleString()}회  그냥 ${그냥.toFixed(2)}x  →  요일 걷으면 ${요일걷기(그냥, r.요일, 날).toFixed(2)}x`);
}
