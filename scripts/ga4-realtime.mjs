#!/usr/bin/env node
/**
 * ga4-realtime.mjs — **지금 이 순간 사람이 있나.** (5번, 2026-10-17)
 *
 * ── 왜 이 자가 생겼나 ────────────────────────────────────────
 * 사장님: 「구글애널리틱스 이상한데...오늘도 0, 어제는 14」 (2026-10-17)
 * 같은 날 네이버 애널리틱스는 klifemap 하나만 **58명**이라고 한다. 수가 둘로 갈린다.
 *
 * ⛔ 수가 낮게 나오면 「손님이 줄었다」로 읽기 전에 **자를 먼저 의심한다.**
 *   GA4 Data API 의 «날짜별 보고서»는 하루 늦게 찬다.
 *   «실시간 창구»(runRealtimeReport)는 그 지연을 **타지 않는다** —
 *   여기 사람이 보이면 태그는 살아 있고, 늦은 것은 보고서 쪽이다.
 *   보이지 않으면 **그때 비로소** 태그를 의심한다.
 *   순서를 바꾸면 멀쩡한 것을 뜯게 된다. 2026-10-16 에 하마터면 「방문자 급감」을 올릴 뻔했다.
 *
 * ⚠ 실시간 창구는 «지금 활동 중인 사람»만 센다. 하루 합계가 아니다.
 *   0 이 나와도 밤이면 정상이다 — 그래서 «분 단위»를 같이 찍어 태그가 쏘는지 본다.
 *
 * 쓰는 법
 *   node scripts/ga4-realtime.mjs                     네 사이트 전부
 *   node scripts/ga4-realtime.mjs --호스트=klifemap.ai  한 곳만, 날짜별까지
 *   node scripts/ga4-realtime.mjs --selftest
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
/* ⚠ 이 import 는 함수를 가져오는 것 말고도 하는 일이 있다 —
   ga4-report.mjs 의 맨 위가 .env 를 읽어 process.env 에 넣어 준다.
   ⛔ .env 읽는 코드를 여기에 «복사하지» 않는다. 두 곳에 두면 한쪽만 고쳐진다. */
import { 토큰받기 } from './ga4-report.mjs';

/**
 * 🔴 실시간이 0 인 것과 태그가 죽은 것은 **다른 일이다.**
 *   밤에는 0 이 정상이다. 가르는 것은 «지난 30분 안에 한 번이라도 쏘았나»다.
 *   @param 지금 현재 활동 중인 사람 수
 *   @param 분줄 [{ 분전, 수 }] — 지난 30분
 *   @returns 'tag-dead' | 'quiet' | 'alive'
 */
export function 태그살았나(지금, 분줄 = []) {
  const 쏜적 = (분줄 ?? []).some((x) => Number(x.수) > 0);
  if (Number(지금) > 0 || 쏜적) return 'alive';
  return 'quiet';   /* ⛔ 「죽었다」고 단정하지 않는다 — 30분은 밤에 흔히 비어 있다 */
}

/**
 * 두 자가 다른 수를 낼 때 **어느 쪽을 의심할지** 가른다.
 *   네이버 애널리틱스(wcslog)와 GA4 는 막히는 것이 다르다 —
 *   광고차단기와 인앱 브라우저는 googletagmanager 를 막지만 wcslog 는 덜 막는다.
 *   ⇒ GA4 가 «적게» 나오는 것은 정상 범위일 수 있고, «많이» 나오면 그건 이상하다.
 */
export function 수가갈린다(ga4수, 다른자수) {
  const a = Number(ga4수); const b = Number(다른자수);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
  const 비 = a / b;
  if (비 >= 0.7) return { 말: '비슷하다', 비 };
  if (비 >= 0.3) return { 말: 'GA4 가 덜 센다 — 광고차단·인앱브라우저 범위', 비 };
  return { 말: '🔴 너무 벌어진다 — 집계 지연이거나 태그가 그 길에서 안 쏜다', 비 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (말, 값) => { if (값) { 통 += 1; console.log('  ✅ ' + 말); } else { 실 += 1; console.log('  ❌ ' + 말); } };

  참('지금 사람이 있으면 산 것이다', 태그살았나(3, []) === 'alive');
  참('지금은 없어도 30분 안에 쏘았으면 산 것이다',
    태그살았나(0, [{ 분전: 12, 수: 2 }, { 분전: 13, 수: 0 }]) === 'alive');
  참('⛔ 30분이 비었다고 «죽었다»고 단정하지 않는다 — 밤이면 정상이다',
    태그살았나(0, [{ 분전: 1, 수: 0 }]) === 'quiet');
  참('⛔ 빈 것에 안 터진다', 태그살았나(0) === 'quiet');

  참('🔴 58명인데 11명이면 너무 벌어진다', 수가갈린다(11, 58).말.startsWith('🔴'));
  참('⬜ 대조군 — 58 대 45 는 비슷하다', 수가갈린다(45, 58).말 === '비슷하다');
  참('⬜ 대조군 — 58 대 25 는 광고차단 범위다', 수가갈린다(25, 58).비 < 0.7);
  참('⛔ 견줄 수가 없으면 아무 말 안 한다', 수가갈린다(10, 0) === null);
  참('⛔ 빈 것에 안 터진다', 수가갈린다(null, null) === null);

  console.log('실시간을 보는 자 — 자가시험 ' + 통 + ' 통과 · ' + 실 + ' 실패');
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일 || !existsSync(키파일)) {
    console.log('⚠ 서비스 계정 키파일이 없다 — **못 쟀다.** (.env 의 GOOGLE_APPLICATION_CREDENTIALS)');
    process.exit(0);
  }
  /* ⛔ 열쇠를 화면에 안 찍는다. 계정 주소(공개 식별자)까지만 적는다 */
  const 키 = JSON.parse(readFileSync(키파일, 'utf8'));
  const 토큰 = await 토큰받기(키);
  const 속성 = process.env.GA4_PROPERTY_ID ?? '549135289';
  const 호스트 = process.argv.find((a) => a.startsWith('--호스트='))?.split('=')[1] ?? null;

  const 부른다 = async (끝, 몸) => {
    const r = await fetch(
      'https://analyticsdata.googleapis.com/v1beta/properties/' + 속성 + ':' + 끝,
      { method: 'POST',
        headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' },
        body: JSON.stringify(몸) },
    );
    const j = await r.json();
    if (j.error) { console.log('   🔴 못 쟀다 — ' + String(j.error.message).slice(0, 200)); return null; }
    return j.rows ?? [];
  };

  const 호스트필터 = 호스트
    ? { filter: { fieldName: 'hostName', stringFilter: { value: 호스트 } } }
    : undefined;

  console.log('■ 지금 이 순간 — 사이트별  ⭐ 이 창구는 Data API 의 하루 지연을 «안 탄다»');
  const 지금줄 = await 부른다('runRealtimeReport', {
    dimensions: [{ name: 'hostName' }], metrics: [{ name: 'activeUsers' }],
  }) ?? [];
  let 지금합 = 0;
  for (const r of 지금줄) {
    const n = Number(r.metricValues[0].value);
    지금합 += n;
    console.log('   ' + r.dimensionValues[0].value.padEnd(26) + n + '명');
  }
  if (!지금줄.length) console.log('   (지금 활동 중인 사람이 없다)');
  console.log('   합 ' + 지금합 + '명');

  console.log('\n■ 지난 30분 — 분 단위  ⭐ 태그가 «쏘고 있나»를 보는 자리다');
  const 분줄 = (await 부른다('runRealtimeReport', {
    dimensions: [{ name: 'minutesAgo' }], metrics: [{ name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'minutesAgo' } }],
  }) ?? []).map((r) => ({ 분전: Number(r.dimensionValues[0].value), 수: Number(r.metricValues[0].value) }));
  const 쏜것 = 분줄.filter((x) => x.수 > 0);
  console.log('   ' + (쏜것.length
    ? 쏜것.map((x) => x.분전 + '분전:' + x.수).join(' · ')
    : '(30분 동안 아무도 없었다)'));

  const 판정 = 태그살았나(지금합, 분줄);
  console.log('\n⭐ ' + (판정 === 'alive'
    ? '**태그는 살아 있다.** 날짜별 보고서가 낮게 나오면 그것은 «집계 지연»이지 손님이 준 것이 아니다.'
    : '⚠ 30분 동안 아무도 없었다 — **이것만으로 「태그가 죽었다」고 적지 않는다.** 밤이면 정상이다.\n   가르려면: 우리 손으로 지면을 열고(⛔ 자동화 브라우저는 /ga.js 가 걸러 낸다) 다시 이 자를 돌린다.'));

  /* ── 날짜별 — 오늘을 포함해서 본다 ───────────────────────── */
  const 이름 = 호스트 ?? '네 사이트 합계';
  console.log('\n■ 날짜별 ' + 이름 + ' — 오늘까지 (Data API · 뒤 이틀은 덜 차 있다)');
  const 날줄 = await 부른다('runReport', {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
      { name: 'averageSessionDuration' }],
    ...(호스트필터 ? { dimensionFilter: 호스트필터 } : {}),
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  }) ?? [];
  for (const r of 날줄) {
    const d = r.dimensionValues[0].value;
    const 초 = Number(r.metricValues[3].value);
    console.log('   ' + d.slice(4, 6) + '-' + d.slice(6)
      + '   순방문 ' + String(r.metricValues[0].value).padStart(4)
      + '  세션 ' + String(r.metricValues[1].value).padStart(4)
      + '  지면 ' + String(r.metricValues[2].value).padStart(5)
      + '  머문 시간 ' + Math.floor(초 / 60) + '분 ' + String(Math.round(초 % 60)).padStart(2) + '초');
  }
  if (!날줄.length) console.log('   ⬜ 줄이 없다 — **0명이 아니라 못 쟀다**');

  /* ── 어디서 왔나 ─────────────────────────────────────────── */
  console.log('\n■ 어디서 왔나 — 뒤 이레 ' + 이름);
  const 길줄 = await 부른다('runReport', {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }, { name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }],
    ...(호스트필터 ? { dimensionFilter: 호스트필터 } : {}),
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 15,
  }) ?? [];
  for (const r of 길줄) {
    console.log('   ' + r.dimensionValues[0].value.padEnd(18)
      + r.dimensionValues[1].value.padEnd(24) + r.metricValues[0].value + '세션');
  }
  if (!길줄.length) console.log('   ⬜ 줄이 없다 — 못 쟀다');

  console.log('\n⛔ GA4 와 네이버 애널리틱스가 다른 수를 내는 것은 흔한 일이다 —');
  console.log('   광고차단기와 인앱 브라우저는 googletagmanager 를 막지만 네이버 wcslog 는 덜 막는다.');
  console.log('   ⇒ **GA4 는 바닥값이다.** 「이보다 적을 수는 없다」까지가 우리가 말할 수 있는 것이다.');
  console.log('   네이버로 들어오는 손님이 많을수록 GA4 만 보면 «적게» 보인다.');
}
