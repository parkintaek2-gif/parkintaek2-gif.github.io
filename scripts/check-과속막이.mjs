#!/usr/bin/env node
/**
 * check-과속막이.mjs — **API 창구에 과속 막이가 도는가.**
 *
 * 🔴 사장님 (2026-10-03): 「비정상적인 반복 호출이나 대량 조회를 실시간으로 잡아낼 수 있는
 *    감시 체계를 갖춰야 한다」
 *
 * 2026-10-03 실측으로 이 서버의 API 창구에는 호출 횟수 제한이 하나도 없었다.
 * server.mjs 에 분당 한도를 넣었고, 이 점검 도구가 그것이 실제로 도는지 본다.
 *
 * ⛔ 지면(HTML·이미지)에는 막이를 걸지 않는다 — 한 화면이 수십 번 받아 가므로
 *    막으면 손님과 검색엔진이 먼저 막힌다. 그 사실도 여기서 함께 확인한다.
 * ⛔ 라이브에서 결제·메일 창구는 두드리지 않는다. 읽기만 하는 창구로 잰다.
 *
 * 쓰는 법
 *   node scripts/check-과속막이.mjs --자가시험
 *   node scripts/check-과속막이.mjs                 (라이브에서 잰다)
 */
import { 분당한도, 과속인가 } from '../src/lib/과속막이.mjs';

/** 한 창구를 잇달아 두드려 본다. 429 가 나오면 그 자리에서 멈춘다 */
export async function 두드리기(주소, 횟수 = 40) {
  const 답들 = [];
  for (let i = 0; i < 횟수; i += 1) {
    try {
      const r = await fetch(주소 + (주소.includes('?') ? '&' : '?') + 'n=' + i, {
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });
      답들.push(r.status);
      if (r.status === 429) break;
    } catch { 답들.push(0); }
  }
  return 답들;
}

/** 두드린 결과를 읽는다 */
export function 판정(답들, 막혀야하나) {
  if (!답들.length) return '⚠ 못 쟀다';
  const 막혔나 = 답들.includes(429);
  if (막혀야하나) {
    return 막혔나 ? `✅ ${답들.length}번째에 막는다(429)` : `🔴 ${답들.length}번을 두드려도 안 막는다`;
  }
  return 막혔나 ? `🔴 지면이 막혔다(${답들.length}번째) — 손님이 먼저 막힌다` : `✅ 지면은 안 막는다(${답들.length}번)`;
}

/* ── 자가시험 ────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 짝 = [];
  const 본다 = (이름, 실제, 바람) => 짝.push([이름, JSON.stringify(실제) === JSON.stringify(바람), 실제, 바람]);

  본다('지면에는 한도가 없다', 분당한도('/data/largest-companies'), 0);
  본다('지면에는 한도가 없다 — 뿌리', 분당한도('/'), 0);
  본다('API 창구에는 한도가 있다', 분당한도('/api/comments') > 0, true);
  본다('v1 창구에도 한도가 있다', 분당한도('/v1/research') > 0, true);
  본다('로그인은 더 좁다', 분당한도('/api/account/login') < 분당한도('/api/comments'), true);
  본다('결제는 넉넉하다', 분당한도('/api/pay/order') >= 60, true);

  /* 과속인가 — 표를 따로 주어 다른 검사와 섞이지 않게 한다 */
  const 표 = new Map();
  let 넘었나 = false;
  for (let i = 0; i < 5; i += 1) 넘었나 = 과속인가('ㄱ /api/x', 3, 1000 + i, 표);
  본다('한도를 넘으면 참을 낸다', 넘었나, true);
  본다('한도 안이면 거짓을 낸다', 과속인가('ㄴ /api/x', 3, 1000, new Map()), false);
  본다('한도가 0 이면 안 막는다', 과속인가('ㄷ /x', 0, 1000, new Map()), false);
  /* ⚠ 창 '끝'에 딱 맞추면 앞서 찍힌 것이 몇 개 살아남아 헷갈린다. 넉넉히 지난 때로 잰다 */
  본다('창이 지나면 다시 센다', 과속인가('ㄱ /api/x', 3, 1000 + 60 * 1000 + 10000, 표), false);
  /* 🔴 [2026-10-03] 스테이지 하나가 세 사이트를 같이 낸다 — 열쇠에 호스트가 빠지면
     한 사이트에서 쓴 횟수가 다른 사이트의 몫까지 깎는다. 실제로 그렇게 났다. */
  const 표2 = new Map();
  for (let i = 0; i < 4; i += 1) 과속인가('ㄱ seoulmarkets.com /api/comments', 3, 2000 + i, 표2);
  본다('사이트가 다르면 셈이 따로 돈다', 과속인가('ㄱ 100yearmap.com /api/comments', 3, 2000, 표2), false);

  본다('안 막혔는데 막혀야 하면 빨간불', 판정([200, 200], true).startsWith('🔴'), true);
  본다('막혔는데 막혀야 하면 초록불', 판정([200, 429], true).startsWith('✅'), true);
  본다('지면이 막히면 빨간불', 판정([200, 429], false).startsWith('🔴'), true);
  본다('못 쟀으면 못 쟀다고 적는다', 판정([], true), '⚠ 못 쟀다');

  let 깨짐 = 0;
  for (const [이름, 맞나, 실제, 바람] of 짝) {
    console.log((맞나 ? '✅' : '🔴') + ' ' + 이름 + (맞나 ? '' : ` — 나온 값 ${JSON.stringify(실제)} / 바란 값 ${JSON.stringify(바람)}`));
    if (!맞나) 깨짐 += 1;
  }
  console.log(`\n자가시험 ${짝.length}개 · 깨진 것 ${깨짐}개`);
  process.exit(깨짐 ? 1 : 0);
}

/* ── 라이브에서 재기 ─────────────────────────────────────── */
const 볼것 = [
  { 이름: 'SeoulMarkets API', 주소: 'https://seoulmarkets.com/api/comments?slug=check-rate-limit', 막혀야하나: true },
  { 이름: 'SeoulMarkets 지면', 주소: 'https://seoulmarkets.com/', 막혀야하나: false },
  { 이름: '백년지도 API', 주소: 'https://100yearmap.com/api/comments?slug=check-rate-limit', 막혀야하나: true },
  { 이름: 'KCultureWire API', 주소: 'https://www.kculturewire.com/api/comments?slug=check-rate-limit', 막혀야하나: true },
];

let 흠 = 0;
for (const v of 볼것) {
  const 답들 = await 두드리기(v.주소, v.막혀야하나 ? 80 : 40);
  const 말 = 판정(답들, v.막혀야하나);
  console.log(`  ${v.이름.padEnd(20)} ${말}`);
  if (말.startsWith('🔴')) 흠 += 1;
}
console.log(`\n■ 흠 ${흠}개`);
if (!흠) console.log('✅ API 창구는 막고 지면은 안 막는다');
process.exitCode = 흠 ? 1 : 0;
