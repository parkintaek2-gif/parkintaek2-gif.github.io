#!/usr/bin/env node
/**
 * ga4-klifemap-channels.mjs — 케이라이프맵 손님이 «어디서 오나»를 잰다
 * ─────────────────────────────────────────────────────────────────────────────
 * 사장님 지시 (2026-09-24): 「케이라이프맵이 사람들에게 인기있는 사이트가 돼
 *   비즈니스가 활성화하긴 방안을 … 연구해서 스텝 바이 스텝으로 실행 로드맵을 만들어봐」
 *
 * [왜 이 자가 필요했나]
 *   28일 순방문 659명인데 **구글 검색 노출은 9회**였다(GSC 실측).
 *   그러면 659명은 검색으로 온 것이 아니다. 어디서 왔는지를 모르면 무엇을 늘릴지 모른다.
 *
 * 🔴 그리고 **우리 자신을 걷어낸다.** 감수·시험하느라 우리가 들어간 것을 손님으로 세면
 *   「손님이 늘었다」가 거짓이 된다 — 2026-09-22 에 사장님이 바로 그것을 짚으셨다.
 *
 * 쓰는 법
 *   node scripts/ga4-klifemap-channels.mjs
 *   node scripts/ga4-klifemap-channels.mjs --호스트 seoulmarkets.com
 */

import { 토큰받기 } from './ga4-report.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const 속성 = '549135289';

function 열쇠읽기() {
  for (const 이름 of ['gsc-sa.json', 'ga4-sa.json', 'search-console-sa.json']) {
    const p = path.join(뿌리, 'secrets', 이름);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const env = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (env && fs.existsSync(env)) return JSON.parse(fs.readFileSync(env, 'utf8'));
  throw new Error('서비스 계정 열쇠를 못 찾았다 (secrets/gsc-sa.json)');
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

/* ⚠ 인자 파싱을 조심한다 — 처음에 `argv[indexOf('--호스트')+1]` 로 썼더니 인자가 없을 때
   indexOf 가 -1 이라 argv[0](노드 실행 파일 경로)을 호스트로 집었다. 화면에
   「C:\Program Files\nodejs\node.exe — 손님이 어디서 오나」가 찍혔다. */
function 인자(이름, 기본) {
  const i = process.argv.indexOf(이름);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  const 붙은것 = process.argv.find((a) => a.startsWith(이름 + '='));
  return 붙은것 ? 붙은것.slice(이름.length + 1) : 기본;
}
const 호스트 = 인자('--호스트', 'klifemap.ai');

const 열쇠 = 열쇠읽기();
const 토큰 = await 토큰받기(열쇠, 'https://www.googleapis.com/auth/analytics.readonly');

const 걸러 = {
  filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 호스트 } },
};

console.log(`■ ${호스트} — 손님이 «어디서 오나» · 최근 28일`);

/* ① 채널별 */
const ch = await 물어보다(토큰, {
  dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
  dimensions: [{ name: 'sessionDefaultChannelGroup' }],
  metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
  dimensionFilter: 걸러,
  limit: 20,
});
const 줄 = (ch.rows || []).map((r) => ({
  채널: r.dimensionValues[0].value,
  사람: Number(r.metricValues[0].value),
  세션: Number(r.metricValues[1].value),
})).sort((a, b) => b.사람 - a.사람);
const 총 = 줄.reduce((a, x) => a + x.사람, 0) || 1;

console.log('\n   채널별');
for (const x of 줄) {
  console.log(`   ${x.채널.padEnd(22)} ${String(x.사람).padStart(5)}명  ${String(Math.round(x.사람 / 총 * 100)).padStart(3)}%  세션 ${x.세션}`);
}

/* ② 어디서 보내 주나 (referrer) */
const rf = await 물어보다(토큰, {
  dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
  dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
  metrics: [{ name: 'totalUsers' }],
  dimensionFilter: 걸러,
  limit: 15,
});
console.log('\n   보내 준 곳');
for (const r of (rf.rows || [])) {
  console.log(`   ${(r.dimensionValues[0].value + ' / ' + r.dimensionValues[1].value).padEnd(34)} ${String(r.metricValues[0].value).padStart(5)}명`);
}

/* ③ 🔴 우리를 걷어낸 수 — Direct·Unassigned 를 뺀다.
   ⚠ 이것이 「손님이 아니다」라는 뜻은 아니다. 다만 우리 감수 트래픽이 그리로 섞인다.
     사장님이 2026-09-22 에 짚어 주신 자리다. 위·아래를 다 내고 읽는 사람이 판단하게 한다. */
const 직접 = 줄.filter((x) => /^(Direct|Unassigned)$/i.test(x.채널)).reduce((a, x) => a + x.사람, 0);
console.log('\n   ⭐ 우리 트래픽이 섞이는 칸(Direct·Unassigned)  ' + 직접 + '명');
console.log('   ⭐ 그것을 뺀 나머지                          ' + (총 - 직접) + '명');
console.log('   ⚠ 「뺀 나머지」가 «확실한 손님»이라는 뜻은 아니다. 두 수를 함께 본다.');
