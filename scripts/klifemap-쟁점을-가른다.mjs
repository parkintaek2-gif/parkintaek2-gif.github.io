#!/usr/bin/env node
/**
 * klifemap-쟁점을-가른다.mjs — 토론에서 «갈린 주장»을 수로 가린다
 * ─────────────────────────────────────────────────────────────────────────────
 * 사장님 (2026-09-24): 「**토론을 하라니까 취합을 하지말고**」
 *
 * ⭐ 토론은 주장을 나란히 적는 것이 아니다. **부딪히게 하고 가리는 것**이다.
 *   그래서 이 자는 「누가 맞나」를 재는 «한 판»을 만든다.
 *
 * ── 쟁점 1 ────────────────────────────────────────────────────────────────
 *   2번  「사주 무료 분석 205명 중 결제 0명 — 살 이유가 안 보이는 것이다」(전환 문제)
 *   5번  「그 205명 중 상당수가 우리 자신이다 — 진짜 손님이 애초에 없다」(유입 문제)
 *
 *   ⚖ 가리는 법 — **사주 지면에 온 사람을 채널별로 가른다.**
 *      Direct 가 압도적이면 5번 쪽, Organic·Referral 이 꽤 되면 2번 쪽이다.
 *      ⛔ 「Direct = 우리」가 아니다. 북마크·주소 직접 입력도 Direct 다.
 *        그래서 «둘 다» 내고, 어느 쪽으로도 단정하지 않는다.
 *
 * ── 쟁점 2 ────────────────────────────────────────────────────────────────
 *   5번  「내부 링크가 JS 에만 있어 색인이 4장이다」
 *   반박  백년지도는 첫 화면 링크 53개인데 1,479장이 색인됐다. 27 vs 53 의 차이가
 *        4장 vs 1,479장을 설명하기엔 너무 작다.
 *   ⚖ 가리는 법 — 지면이 «언제부터» 있었나를 본다. 색인은 시간이 든다.
 */

import { 토큰받기 } from './ga4-report.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const 속성 = '549135289';

function 열쇠읽기() {
  for (const 줄 of fs.readFileSync(path.join(뿌리, '.env'), 'utf8').split('\n')) {
    const m = 줄.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  const k = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!k || !fs.existsSync(k)) throw new Error('열쇠를 못 찾았다');
  return JSON.parse(fs.readFileSync(k, 'utf8'));
}

async function 물어보다(토큰, 몸) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(몸),
  });
  if (!r.ok) throw new Error(`GA4 ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

const 토큰 = await 토큰받기(열쇠읽기(), 'https://www.googleapis.com/auth/analytics.readonly');

console.log('■ 토론 — 갈린 주장을 수로 가른다');
console.log('  사장님: 「토론을 하라니까 취합을 하지말고」\n');

console.log('── 쟁점 1 ──────────────────────────────────────────────');
console.log('  2번  「205명 중 0명 결제 — 살 이유가 안 보인다」   (전환 문제)');
console.log('  5번  「그 205명 중 상당수가 우리다」                (유입 문제)');
console.log('  ⚖  사주 지면에 온 사람을 «채널별»로 가른다\n');

const r1 = await 물어보다(토큰, {
  dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
  dimensions: [{ name: 'sessionDefaultChannelGroup' }],
  metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
  dimensionFilter: {
    andGroup: {
      expressions: [
        { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'klifemap.ai' } } },
        { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: '/saju' } } },
      ],
    },
  },
  limit: 20,
});
const 줄1 = (r1.rows || []).map((x) => ({
  채널: x.dimensionValues[0].value,
  사람: Number(x.metricValues[0].value),
  열림: Number(x.metricValues[1].value),
})).sort((a, b) => b.사람 - a.사람);
const 총1 = 줄1.reduce((a, x) => a + x.사람, 0) || 1;
for (const x of 줄1) {
  console.log(`  ${x.채널.padEnd(20)} ${String(x.사람).padStart(5)}명  ${String(Math.round(x.사람 / 총1 * 100)).padStart(3)}%  지면열림 ${x.열림}`);
}
const 직접1 = 줄1.filter((x) => /^(Direct|Unassigned)$/i.test(x.채널)).reduce((a, x) => a + x.사람, 0);
const 밖에서1 = 총1 - 직접1;
console.log(`\n  ⚖ 판정 — 사주 지면 ${총1}명 가운데`);
console.log(`     Direct·Unassigned  ${직접1}명 (${Math.round(직접1 / 총1 * 100)}%)   ← 우리가 섞이는 칸`);
console.log(`     밖에서 온 것        ${밖에서1}명 (${Math.round(밖에서1 / 총1 * 100)}%)`);
/* 🔴 [2026-09-24] 처음에 「20명 미만이면 5번, 넘으면 2번」으로 갈랐다. **그 20에 근거가 없었다.**
   26명이 나오자 자가 「2번 쪽이 맞다」고 단정했는데, 26명 중 0명은 이상한 수가 아니다 —
   전환율이 4%여도 26명이면 기댓값이 1명이다. 0명과 1명은 구별되지 않는다.
   ⛔ 판정할 수 없는 수에 판정을 붙이면 그것이 바로 «틀린 숫자로 만든 확신»이다.
   ⇒ 표본이 모자라면 **「못 가린다」고 말한다.** 그것도 결과다. */
const 가릴수있는최소 = 100;   /* 전환율 1%를 논하려면 최소 이만큼은 있어야 한다 */
console.log('');
if (밖에서1 < 가릴수있는최소) {
  console.log(`  ⇒ ⬜ **지금은 못 가린다.** 밖에서 온 사람이 ${밖에서1}명뿐이다.`);
  console.log(`     ${밖에서1}명 중 0명은 이상한 수가 아니다 — 전환율 4%여도 기댓값이 1명이다.`);
  console.log('     ⛔ 「살 이유가 없다」도 「손님이 없다」도 이 수로는 증명되지 않는다.');
  console.log('     ⭐ 그러나 **순서는 정해진다** — 밖에서 오는 사람을 먼저 늘려야');
  console.log('        「왜 안 사는가」를 물을 수 있다. 그 전에는 물어도 답이 안 나온다.');
  console.log(`     ⇒ 표본이 ${가릴수있는최소}명을 넘으면 이 자를 다시 돌려 가른다.`);
} else if (직접1 / 총1 > 0.8) {
  console.log('  ⇒ **5번 쪽이 가깝다.** 밖에서 온 손님이 충분한데도 Direct 가 압도적이다.');
} else {
  console.log('  ⇒ **2번 쪽이 가깝다.** 밖에서 온 손님이 충분한데 안 산다 — 전환을 판다.');
}

/* ── 쟁점 2 — 지면이 언제부터 있었나 ─────────────────────────────────── */
console.log('\n── 쟁점 2 ──────────────────────────────────────────────');
console.log('  5번   「내부 링크가 JS 에만 있어 색인이 4장이다」');
console.log('  반박   백년지도는 첫 화면 링크 53개인데 1,479장이 색인됐다.');
console.log('         27 vs 53 이 4장 vs 1,479장을 설명하기엔 너무 작다.');
console.log('  ⚖  지면이 «언제부터» 있었나를 본다 — 색인은 시간이 든다\n');

const r2 = await 물어보다(토큰, {
  dateRanges: [{ startDate: '365daysAgo', endDate: 'yesterday' }],
  dimensions: [{ name: 'hostName' }],
  metrics: [{ name: 'totalUsers' }],
  limit: 30,
});
/* 첫 방문이 언제인지는 GA4 로 정확히 못 본다 — 대신 «우리 저장소»가 안다 */
console.log('  ⬜ GA4 로는 「지면이 언제 생겼나」를 못 잰다. 저장소로 잰다 —');
console.log('     (아래는 이 자가 아니라 git 이 답할 몫이다)');
console.log('     git log --diff-filter=A --format=%ad -- public/index.html   ← klifemap');
console.log('  ⚠ 못 잰 것을 「이것 때문이다」로 적지 않는다.');
