#!/usr/bin/env node
/**
 * measure-kcw-dwell.mjs — **사람이 몇 초 머무는지 잰다.** (5번, 2026-08-24)
 *
 * ── 왜 이 자가 생겼나 ────────────────────────────────────────
 * 사장님 지시(2026-08-24): 「무슨 일 하고 있지? **방문자, 체류시간 증대에 올인해라.**」
 *
 * 🔴 그 말을 듣기까지 나는 체류시간을 **한 번도 재 본 적이 없었다.** 그런데 문을 내고
 *   「체류를 했다」고 여러 번 적어 왔다. 문 개수는 체류가 아니다 — 사람이 머문 **초**가
 *   체류다. 못 재고 한 일을 했다고 적은 것이니, 자를 먼저 세운다.
 *
 * ── 무엇을 재고 무엇을 안 재나 ───────────────────────────────
 * ✅ 잰다   지면마다 「한 번 열렸을 때 사람이 붙어 있던 초」
 *          = userEngagementDuration / screenPageViews
 * ✅ 잰다   유닛마다 세션당 머문 초(averageSessionDuration), 붙어 있던 세션 몫
 * ⛔ 안 낸다 열린 적이 없는 지면의 「0초」. **열림이 0이면 초는 null 이다.**
 *          「안 머물렀다」와 「머물 사람이 없었다」는 다른 말이다.
 * ⛔ 안 낸다 표본이 너무 적은 지면의 평균을 발견처럼. 열림 수를 **항상 같이 적는다.**
 *
 * ⚠ GA4 의 engagement 는 사람이 창을 열어 둔 시간이 아니라 **구글이 「붙어 있다」고 본
 *   시간**이다. 탭을 숨기면 세지 않는다. 그래서 이것은 「읽은 시간」의 아래쪽 어림이다.
 *   이 문장을 지면에 옮겨 쓸 때 빼지 않는다.
 *
 * 쓰는 법
 *   node scripts/measure-kcw-dwell.mjs --selftest
 *   node scripts/measure-kcw-dwell.mjs --잰다                    28일, 내 유닛
 *   node scripts/measure-kcw-dwell.mjs --잰다 --전체유닛          여섯 자리 다
 *   node scripts/measure-kcw-dwell.mjs --잰다 --days 7
 *   node scripts/measure-kcw-dwell.mjs --잰다 --적는다=src/data/kcw-dwell.json
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 갈래, 유닛, 손님아님, 토큰받기, 무엇이막혔나, 우리속성 } from './ga4-report.mjs';

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/* ── 판단하는 함수들. 여기만 자가시험한다 ──────────────────── */

/**
 * 한 지면이 「한 번 열렸을 때 몇 초 붙어 있었나」.
 * ⛔ 열림이 0이면 **null** 이다. 0초라고 적으면 「사람이 와서 바로 나갔다」로 읽힌다.
 */
export function 열림당초(붙은초, 열림수) {
  if (!Number.isFinite(붙은초) || !Number.isFinite(열림수)) return null;
  if (열림수 <= 0) return null;
  if (붙은초 < 0) return null;
  return 붙은초 / 열림수;
}

/**
 * 이 지면의 평균을 **발견으로 말해도 되나**. 열림이 적으면 평균이 흔들린다.
 * ⚠ 「믿을 만하다/못하다」가 아니라 「이 수로 말해도 되나」다. 못 되면 그렇다고 적는다.
 */
export const 말해도되는열림 = 5;
export function 말해도되나(열림수) {
  return Number.isFinite(열림수) && 열림수 >= 말해도되는열림;
}

/**
 * 초를 사람이 읽는 말로. ⛔ null 을 「0초」로 바꾸지 않는다.
 */
export function 초읽기(초) {
  if (초 === null || 초 === undefined || !Number.isFinite(초)) return '못 잼';
  if (초 < 60) return `${초.toFixed(1)}초`;
  const 분 = Math.floor(초 / 60);
  return `${분}분 ${Math.round(초 - 분 * 60)}초`;
}

/**
 * 지면 주소 → 갈래. `/week/2024-11-03` → `/week`, `/` → `(집)`.
 * ⚠ ga4-report 의 유닛 가르기와 달리 이건 **내 사이트 안의 갈래**다.
 */
export function 갈래이름(주소) {
  if (!주소 || 주소 === '/') return '(집)';
  const 첫 = String(주소).split('?')[0].split('/').filter(Boolean)[0];
  return 첫 ? `/${첫}` : '(집)';
}

/**
 * 갈래마다 모은다. **초는 갈래 전체의 붙은초 합 ÷ 열림 합**으로 다시 낸다 —
 * ⛔ 지면별 평균의 평균을 내지 않는다. 열림 1회 지면과 100회 지면이 같은 무게를 가지면
 *   숫자가 거짓이 된다. 8/23 에 다른 자에서 겪은 것과 같은 함정이다.
 */
export function 갈래로모아(줄들) {
  const 통 = new Map();
  for (const r of 줄들 ?? []) {
    const k = 갈래이름(r.path);
    const v = 통.get(k) ?? { 갈래: k, 장: 0, 열림: 0, 붙은초: 0, 사람: 0 };
    v.장 += 1;
    v.열림 += Number(r.views) || 0;
    v.붙은초 += Number(r.engagedSeconds) || 0;
    v.사람 += Number(r.users) || 0;
    통.set(k, v);
  }
  return [...통.values()]
    .map((v) => ({ ...v, 열림당초: 열림당초(v.붙은초, v.열림) }))
    .sort((a, b) => b.열림 - a.열림);
}

/**
 * **가장 값이 큰 일감**을 고른다 — 「열림은 많은데 짧게 머무는 지면」.
 * 사장님이 올인하라 하신 둘이 곱해지는 자리다: 사람이 이미 오고 있고(열림), 머물지
 * 않는다(초). 열림이 적은 지면은 여기 안 넣는다 — 고쳐도 곱할 것이 없다.
 */
export function 고칠지면(줄들, 기준초) {
  const 쓸것 = (줄들 ?? []).filter((r) => 말해도나(r) && Number.isFinite(r.열림당초));
  return 쓸것.filter((r) => r.열림당초 < 기준초)
    .sort((a, b) => b.열림 * (기준초 - b.열림당초) - a.열림 * (기준초 - a.열림당초));
}
/* ⚠ 위에서 부르는 이름을 하나로 둔다 — 오타가 조용히 통과하지 않게 */
function 말해도나(r) { return 말해도되나(Number(r.열림)); }

/**
 * 🔴 2026-08-24 첫 측정에서 «/» 가 **두 줄로 갈렸다**(열림 69 · 19). www 붙은 호스트와
 *   안 붙은 호스트가 같은 지면인데 따로 세어진 것이다. ga4-report 는 유닛을 셀 때 이미
 *   이것을 합치고 있었는데, **지면을 셀 때는 안 합치고 있었다.** 같은 함정을 두 번 밟았다.
 * ⛔ 갈라 놓으면 어느 쪽도 그 지면의 값이 아니다 — 6.3초와 14.8초로 갈리면 둘 다 거짓이다.
 */
export function 주소로합쳐(줄들) {
  const 통 = new Map();
  for (const r of 줄들 ?? []) {
    const k = String(r.path ?? '').split('?')[0] || '/';
    const v = 통.get(k) ?? { path: k, views: 0, engagedSeconds: 0, users: 0, sessions: 0 };
    v.views += Number(r.views) || 0;
    v.engagedSeconds += Number(r.engagedSeconds) || 0;
    v.users += Number(r.users) || 0;
    v.sessions += Number(r.sessions) || 0;
    통.set(k, v);
  }
  return [...통.values()].sort((a, b) => b.views - a.views);
}

/** 전체 기준선. ⛔ 지면 평균의 평균이 아니라 합÷합이다 */
export function 전체열림당초(줄들) {
  let 초 = 0; let 열림 = 0;
  for (const r of 줄들 ?? []) { 초 += Number(r.engagedSeconds) || 0; 열림 += Number(r.views) || 0; }
  return 열림당초(초, 열림);
}

/**
 * 착지 지면 한 줄의 **걸음 수** — 세션 하나가 평균 몇 장을 열었나.
 * ⛔ 세션이 0이면 null 이다. 0장이라고 적으면 「와서 아무것도 안 봤다」로 읽힌다.
 * ⚠ 최솟값은 1이다(착지 지면 자체가 한 장이다). 1.00 이면 **두 번째 클릭이 없었다**는 뜻이다.
 */
export function 걸음수(열림, 세션) {
  if (!Number.isFinite(열림) || !Number.isFinite(세션)) return null;
  if (세션 <= 0) return null;
  return 열림 / 세션;
}

/**
 * **두 번째 걸음을 잃은 세션 수.** 착지해서 한 장만 보고 나간 세션이 몇인가.
 * 이것이 체류시간 올인의 과녁이다 — 재 보니 세션당 지면 수가 세션당 초를 그대로 따라갔다
 * (KLifeMap 3.33장 430초 / 나 1.28장 39초). 그러니 늘릴 것은 초가 아니라 **걸음**이다.
 */
export function 못걸은세션(열림, 세션) {
  const g = 걸음수(열림, 세션);
  if (g === null) return null;
  /* 열림이 세션보다 적을 수는 없다 — 표본이 어긋난 것이니 못 잰 것으로 낸다 */
  if (열림 < 세션) return null;
  return Math.max(0, Math.round(세션 * (2 - Math.min(2, g))));
}
/* ── 자가시험 ─────────────────────────────────────────────── */
if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  참('붙은초를 열림으로 나눈다', 열림당초(100, 4) === 25);
  참('열림이 0이면 0초가 아니라 못 잼', 열림당초(100, 0) === null);
  참('열림이 음수면 못 잼', 열림당초(100, -3) === null);
  참('붙은초가 없으면 못 잼', 열림당초(NaN, 5) === null);
  참('붙은초 0 · 열림 4 는 0초가 맞다', 열림당초(0, 4) === 0);

  참('열림 5회면 말해도 된다', 말해도되나(5) === true);
  참('열림 4회면 말하지 않는다', 말해도되나(4) === false);
  참('열림이 없으면 말하지 않는다', 말해도되나(null) === false);

  참('못 잰 것을 0초로 안 쓴다', 초읽기(null) === '못 잼');
  참('1분 미만은 초로', 초읽기(42.34) === '42.3초');
  참('1분 넘으면 분·초로', 초읽기(95) === '1분 35초');

  참('집은 (집)', 갈래이름('/') === '(집)');
  참('첫 칸이 갈래', 갈래이름('/week/2024-11-03') === '/week');
  참('물음표는 떼고 본다', 갈래이름('/titles?x=1') === '/titles');
  참('빈 값도 안 죽는다', 갈래이름(null) === '(집)');

  /* 🔴 이 셋이 이 자의 핵이다 — 평균의 평균을 내면 여기서 걸린다 */
  const 표본 = [
    { path: '/week/a', views: 1, engagedSeconds: 300, users: 1 },   /* 300초 · 1회 */
    { path: '/week/b', views: 99, engagedSeconds: 990, users: 50 }, /* 10초 · 99회 */
  ];
  const 모음 = 갈래로모아(표본);
  참('갈래는 하나로 모인다', 모음.length === 1 && 모음[0].갈래 === '/week');
  참('열림 합이 맞다', 모음[0].열림 === 100);
  참('평균의 평균(155초)이 아니라 합÷합(12.9초)이다',
    Math.abs(모음[0].열림당초 - 12.9) < 0.01);
  참('전체 기준선도 합÷합이다', Math.abs(전체열림당초(표본) - 12.9) < 0.01);
  참('빈 목록이면 기준선은 못 잼', 전체열림당초([]) === null);

  /* 고칠 지면 — 열림이 많고 짧은 것이 앞에 온다. 열림 적은 것은 아예 안 든다 */
  const 후보 = [
    { path: '/a', 열림: 100, 열림당초: 5 },   /* 많이 열리고 아주 짧다 → 1등 */
    { path: '/b', 열림: 10, 열림당초: 5 },    /* 짧지만 열림이 적다 */
    { path: '/c', 열림: 500, 열림당초: 40 },  /* 이미 기준 위 → 안 든다 */
    { path: '/d', 열림: 2, 열림당초: 1 },     /* 표본이 모자라 말할 수 없다 → 안 든다 */
  ];
  const 일감 = 고칠지면(후보, 30);
  참('기준 위 지면은 일감이 아니다', !일감.some((r) => r.path === '/c'));
  참('표본 모자란 지면은 일감이 아니다', !일감.some((r) => r.path === '/d'));
  참('열림이 많은 쪽이 먼저다', 일감[0]?.path === '/a');
  참('일감은 둘이다', 일감.length === 2);

  /* 🔴 www 갈림 — 첫 측정에서 «/» 가 두 줄로 나왔다. 합치는지 검사로 굳힌다 */
  const 갈린것 = [
    { path: '/', views: 69, engagedSeconds: 435, users: 60, sessions: 60 },
    { path: '/', views: 19, engagedSeconds: 281, users: 10, sessions: 10 },
    { path: '/titles?x=1', views: 3, engagedSeconds: 30, users: 3, sessions: 3 },
    { path: '/titles', views: 2, engagedSeconds: 20, users: 2, sessions: 2 },
  ];
  const 합친것 = 주소로합쳐(갈린것);
  참('같은 주소는 한 줄이 된다', 합친것.length === 2);
  참('열림을 더한다', 합친것.find((r) => r.path === '/').views === 88);
  참('붙은초도 더한다', 합친것.find((r) => r.path === '/').engagedSeconds === 716);
  참('물음표 뒤는 같은 지면으로 본다', 합친것.find((r) => r.path === '/titles').views === 5);
  참('합친 뒤 열림당초는 8.1초가 아니라 8.1보다 크다',
    열림당초(716, 88) > 8.1 && Math.abs(열림당초(716, 88) - 8.136) < 0.01);
  참('빈 목록도 안 죽는다', 주소로합쳐(null).length === 0);

  /* 🔴 착지 지면 — 「들어온 것」과 「나가는 길에 들른 것」을 가르는 자리 */
  참('열림을 세션으로 나눈다', 걸음수(200, 100) === 2);
  참('세션이 0이면 못 잼', 걸음수(50, 0) === null);
  참('한 장만 보면 1.00', 걸음수(40, 40) === 1);
  참('두 번째 걸음이 아예 없으면 세션 전부가 잃은 것', 못걸은세션(40, 40) === 40);
  참('두 장씩 걸었으면 잃은 것 0', 못걸은세션(80, 40) === 0);
  참('두 장을 넘겨도 음수가 안 된다', 못걸은세션(400, 40) === 0);
  참('열림이 세션보다 적으면 못 잼', 못걸은세션(10, 40) === null);
  참('세션이 없으면 못 잼', 못걸은세션(10, 0) === null);
  참('읽기 갈래만 청한다', 갈래.endsWith('analytics.readonly'));
  참('유닛 목록에 내 자리가 있다', 유닛.some((u) => u.이름.includes('K Culture Wire')));
  참('손님 아닌 것을 가른다', 손님아님.test('localhost') === true);

  console.log(`체류시간을 재는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/* ── 실제로 잰다 ─────────────────────────────────────────── */
if (내가실행됐다 && process.argv.includes('--잰다')) {
  const 날수 = Number(process.argv.find((a) => a === '--days'
    ? true : false) ? process.argv[process.argv.indexOf('--days') + 1] : 28) || 28;
  const 전체유닛 = process.argv.includes('--전체유닛');
  const 적을곳 = process.argv.find((a) => a.startsWith('--적는다='))?.split('=')[1] ?? null;

  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일 || !existsSync(키파일)) {
    console.log('⚠ 서비스 계정 키파일이 없다 — **못 쟀다.** (.env 의 GOOGLE_APPLICATION_CREDENTIALS)');
    process.exit(0);
  }
  const 키 = JSON.parse(readFileSync(키파일, 'utf8'));
  console.log(`체류시간을 잰다 — ${날수}일 · 서비스 계정 ${키.client_email}`);
  console.log('⚠ GA4 의 engagement 는 「구글이 붙어 있다고 본 시간」이다. 탭을 숨기면 안 센다.');
  console.log('   그래서 이것은 읽은 시간의 **아래쪽 어림**이다.\n');

  const 막혔다 = (제목, 글) => {
    const m = 무엇이막혔나(글);
    console.log(`🔴 ${제목} — **못 쟀다.**`);
    console.log(`   막힌 것: ${m.무엇}`);
    console.log(`   할 것  : ${m.할것}`);
    if (m.주소) console.log(`   주소   : ${m.주소}`);
    console.log(`   구글이 준 말: ${String(글).slice(0, 300)}`);
    console.log('\n⛔ 이것은 「0초」가 아니다. **재지 못한 것**이다.');
  };

  let 토큰;
  try { 토큰 = await 토큰받기(키); } catch (e) { 막혔다('토큰을 못 받았다', e.message); process.exit(0); }

  let 속성 = process.argv.find((a) => a.startsWith('--속성='))?.split('=')[1]
    ?? process.env.GA4_PROPERTY_ID ?? null;
  if (!속성) {
    try {
      const r = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
        { headers: { Authorization: `Bearer ${토큰}` } });
      const j = await r.json();
      if (j.error) throw new Error(JSON.stringify(j.error));
      const 고름 = 우리속성(j.accountSummaries);
      속성 = 고름.고른것?.속성 ?? 고름.전부[0]?.속성 ?? null;
    } catch (e) { 막혔다('속성을 못 찾았다', e.message); process.exit(0); }
  }
  if (!속성) { console.log('🔴 속성을 못 찾았다 — **못 쟀다**'); process.exit(0); }
  console.log(`속성 ${속성}\n`);

  const 물어본다 = async (몸) => {
    const r = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRanges: [{ startDate: `${날수}daysAgo`, endDate: 'yesterday' }], ...몸 }),
      });
    const j = await r.json();
    if (j.error) throw new Error(JSON.stringify(j.error));
    return j;
  };

  /* ── ① 유닛마다 세션당 머문 초 ───────────────────────────── */
  let 유닛줄 = [];
  try {
    const j = await 물어본다({
      dimensions: [{ name: 'hostName' }],
      metrics: [{ name: 'sessions' }, { name: 'averageSessionDuration' },
        { name: 'engagedSessions' }, { name: 'userEngagementDuration' },
        { name: 'screenPageViews' }, { name: 'totalUsers' }],
      limit: 200,
    });
    유닛줄 = (j.rows ?? []).map((r) => ({
      host: r.dimensionValues[0].value,
      sessions: Number(r.metricValues[0].value),
      avgSessionSec: Number(r.metricValues[1].value),
      engagedSessions: Number(r.metricValues[2].value),
      engagedSeconds: Number(r.metricValues[3].value),
      views: Number(r.metricValues[4].value),
      users: Number(r.metricValues[5].value),
    })).filter((r) => !손님아님.test(r.host));
  } catch (e) { 막혔다('유닛별 체류시간', e.message); process.exit(0); }

  console.log('## 유닛마다 — 세션당 머문 시간');
  console.log(`${'유닛'.padEnd(22)} ${'세션'.padStart(6)} ${'세션당'.padStart(9)} ${'붙은세션'.padStart(9)} ${'열림당'.padStart(9)}`);
  const 유닛합 = new Map();
  for (const r of 유닛줄) {
    const u = 유닛.find((x) => x.자.test(r.host))?.이름 ?? `(모름) ${r.host}`;
    const v = 유닛합.get(u) ?? { 세션: 0, 초합: 0, 붙은세션: 0, 붙은초: 0, 열림: 0, 사람: 0 };
    v.세션 += r.sessions; v.초합 += r.avgSessionSec * r.sessions;
    v.붙은세션 += r.engagedSessions; v.붙은초 += r.engagedSeconds;
    v.열림 += r.views; v.사람 += r.users;
    유닛합.set(u, v);
  }
  for (const [u, v] of [...유닛합.entries()].sort((a, b) => b[1].세션 - a[1].세션)) {
    const 세션당 = v.세션 > 0 ? v.초합 / v.세션 : null;
    const 붙은몫 = v.세션 > 0 ? (100 * v.붙은세션) / v.세션 : null;
    console.log(`${u.padEnd(22)} ${String(v.세션).padStart(6)} ${초읽기(세션당).padStart(9)} `
      + `${(붙은몫 === null ? '못 잼' : `${붙은몫.toFixed(0)}%`).padStart(9)} `
      + `${초읽기(열림당초(v.붙은초, v.열림)).padStart(9)}`);
  }

  /* ── ② 내 지면마다 ──────────────────────────────────────── */
  const 볼호스트 = 전체유닛 ? null : /(^|\.)kculturewire\.com$/i;
  let 지면줄 = [];
  try {
    const j = await 물어본다({
      dimensions: [{ name: 'pagePath' }, { name: 'hostName' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' },
        { name: 'totalUsers' }, { name: 'sessions' }],
      limit: 2000,
    });
    지면줄 = (j.rows ?? []).map((r) => ({
      path: r.dimensionValues[0].value,
      host: r.dimensionValues[1].value,
      views: Number(r.metricValues[0].value),
      engagedSeconds: Number(r.metricValues[1].value),
      users: Number(r.metricValues[2].value),
      sessions: Number(r.metricValues[3].value),
    })).filter((r) => !손님아님.test(r.host))
      .filter((r) => (볼호스트 ? 볼호스트.test(r.host) : true));
  } catch (e) { 막혔다('지면별 체류시간', e.message); process.exit(0); }

  지면줄 = 주소로합쳐(지면줄);          /* ⛔ www 갈림을 합친 뒤에 센다 */
  const 기준 = 전체열림당초(지면줄);
  console.log(`\n## 내 지면 — 열린 지면 ${지면줄.length}장 · 전체 열림당 ${초읽기(기준)}`);
  if (기준 === null) {
    console.log('⛔ 열림이 없다 — **못 쟀다.** 0초라고 적지 않는다');
  } else {
    console.log(`\n### 갈래마다 (초는 갈래 전체 합÷합이다. 지면 평균의 평균이 아니다)`);
    console.log(`${'갈래'.padEnd(18)} ${'장'.padStart(4)} ${'열림'.padStart(6)} ${'사람'.padStart(6)} ${'열림당'.padStart(9)}`);
    for (const v of 갈래로모아(지면줄)) {
      console.log(`${v.갈래.padEnd(18)} ${String(v.장).padStart(4)} ${String(v.열림).padStart(6)} `
        + `${String(v.사람).padStart(6)} ${초읽기(v.열림당초).padStart(9)}`);
    }

    /* 🔴 올인하라 하신 둘이 곱해지는 자리 — 이미 오고 있는데 안 머무는 지면 */
    const 재료 = 지면줄.map((r) => ({ ...r, 열림: r.views, 열림당초: 열림당초(r.engagedSeconds, r.views) }));
    const 일감 = 고칠지면(재료, 기준);
    console.log(`\n### 🔴 고칠 자리 — 사람은 오는데 안 머무는 지면 (기준 ${초읽기(기준)} 아래, 열림 ${말해도되는열림}회 이상)`);
    if (!일감.length) {
      console.log('   없다 — 기준 아래인데 표본이 되는 지면이 없다');
    } else {
      console.log(`${'지면'.padEnd(40)} ${'열림'.padStart(6)} ${'열림당'.padStart(9)} ${'잃는초'.padStart(9)}`);
      for (const r of 일감.slice(0, 20)) {
        console.log(`${r.path.slice(0, 40).padEnd(40)} ${String(r.열림).padStart(6)} `
          + `${초읽기(r.열림당초).padStart(9)} ${Math.round(r.열림 * (기준 - r.열림당초)).toString().padStart(9)}`);
      }
      if (일감.length > 20) console.log(`   … 그리고 ${일감.length - 20}장 더`);
      console.log(`\n「잃는초」 = 이 지면이 기준만큼만 머물게 해도 더 벌 수 있는 초다.`);
      console.log(`합계 ${Math.round(일감.reduce((s, r) => s + r.열림 * (기준 - r.열림당초), 0))}초`);
    }

    /* 잘 머무는 지면 — 무엇이 통했는지 보려면 이쪽도 봐야 한다 */
    const 잘 = 재료.filter((r) => 말해도되나(r.열림) && Number.isFinite(r.열림당초))
      /**
       * 🔴 첫 측정에서 이 칸에 **기준 아래 지면이 섞여 나왔다**(8.4초·1.1초가
       *   「오래 머무는」 칸에). 표본이 되는 지면이 넷뿐인데 상위 10장을 뽑으라
       *   했으니 전부가 올라온 것이다. ⛔ 이름이 「오래 머문다」인 칸에 기준 아래를
       *   넣으면 그 이름이 거짓이 된다. 기준 위인 것만 넣고, 없으면 없다고 적는다.
       */
      .filter((r) => r.열림당초 >= 기준)
      .sort((a, b) => b.열림당초 - a.열림당초).slice(0, 10);
    console.log(`\n### ✅ 오래 머무는 지면 — 무엇이 통했나를 여기서 배운다`);
    if (!잘.length) console.log('   없다 — 기준 위이면서 표본이 되는 지면이 하나도 없다');
    for (const r of 잘) {
      console.log(`${r.path.slice(0, 40).padEnd(40)} ${String(r.열림).padStart(6)} ${초읽기(r.열림당초).padStart(9)}`);
    }
  }

  /* ── ③ 착지 지면 — 세션이 «시작된» 지면. 두 번째 클릭이 걸린 자리다 ── */
  let 착지 = [];
  try {
    const j = await 물어본다({
      dimensions: [{ name: 'landingPage' }, { name: 'hostName' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' },
        { name: 'userEngagementDuration' }, { name: 'totalUsers' },
        { name: 'engagedSessions' }],
      limit: 500,
    });
    착지 = (j.rows ?? []).map((r) => ({
      path: r.dimensionValues[0].value,
      host: r.dimensionValues[1].value,
      sessions: Number(r.metricValues[0].value),
      views: Number(r.metricValues[1].value),
      engagedSeconds: Number(r.metricValues[2].value),
      users: Number(r.metricValues[3].value),
      engagedSessions: Number(r.metricValues[4].value),
    })).filter((r) => !손님아님.test(r.host))
      .filter((r) => (볼호스트 ? 볼호스트.test(r.host) : true));
  } catch (e) { console.log(`⚠ 착지 지면은 못 쟀다 — ${String(e.message).slice(0, 120)}`); }

  if (착지.length) {
    /* www 갈림을 합친다. 주소가 같으면 한 줄이다 */
    const 통 = new Map();
    for (const r of 착지) {
      const k = String(r.path ?? '').split('?')[0] || '/';
      const v = 통.get(k) ?? { path: k, sessions: 0, views: 0, engagedSeconds: 0, users: 0, engagedSessions: 0 };
      for (const f of ['sessions', 'views', 'engagedSeconds', 'users', 'engagedSessions']) v[f] += r[f];
      통.set(k, v);
    }
    착지 = [...통.values()].sort((a, b) => b.sessions - a.sessions);

    const 세션합 = 착지.reduce((s2, r) => s2 + r.sessions, 0);
    const 열림합 = 착지.reduce((s2, r) => s2 + r.views, 0);
    console.log(`\n## 착지 지면 — 세션이 «시작된» 자리 ${착지.length}장 · 세션 ${세션합}`);
    console.log(`전체 걸음수 ${걸음수(열림합, 세션합)?.toFixed(2) ?? '못 잼'}장/세션`
      + ` · 두 번째 걸음을 잃은 세션 ${못걸은세션(열림합, 세션합) ?? '못 잼'}`);
    console.log('⭐ 걸음수가 세션당 초를 그대로 따라간다 — 늘릴 것은 초가 아니라 걸음이다');
    console.log(`\n${'착지 지면'.padEnd(40)} ${'세션'.padStart(5)} ${'걸음'.padStart(6)} ${'붙은몫'.padStart(7)} ${'잃은세션'.padStart(8)}`);
    for (const r of 착지.slice(0, 18)) {
      const g = 걸음수(r.views, r.sessions);
      const 몫 = r.sessions > 0 ? (100 * r.engagedSessions) / r.sessions : null;
      console.log(`${r.path.slice(0, 40).padEnd(40)} ${String(r.sessions).padStart(5)}`
        + ` ${(g === null ? '못잼' : g.toFixed(2)).padStart(6)}`
        + ` ${(몫 === null ? '못잼' : `${몫.toFixed(0)}%`).padStart(7)}`
        + ` ${String(못걸은세션(r.views, r.sessions) ?? '못잼').padStart(8)}`);
    }
    if (착지.length > 18) console.log(`   … 그리고 ${착지.length - 18}장 더`);
    console.log('\n「걸음」 = 이 지면으로 들어온 세션이 평균 몇 장을 열었나. 1.00 이면 두 번째 클릭이 없었다.');
    console.log('⛔ 세션이 적은 줄은 흔들린다 — 세션 수를 같이 보고 읽는다.');
  }

  if (적을곳) {
    const 몸 = {
      generated: new Date().toISOString().slice(0, 10),
      days: 날수,
      property: 속성,
      whatThisIs: 'GA4 userEngagementDuration divided by screenPageViews, per page. '
        + 'Engagement time is what Google counts as engaged, not wall-clock time with the tab open; '
        + 'a hidden tab is not counted. Treat it as a lower bound on reading time.',
      whatThisIsNot: 'Not a count of seconds a person read. Not comparable across sites with '
        + 'different tagging. Pages with fewer than ' + 말해도되는열림
        + ' opens are kept in the rows but must not be quoted as an average.',
      baselineSecondsPerOpen: 기준,
      minimumOpensToQuote: 말해도되는열림,
      units: [...유닛합.entries()].map(([이름, v]) => ({
        unit: 이름, sessions: v.세션, users: v.사람, views: v.열림,
        secondsPerSession: v.세션 > 0 ? v.초합 / v.세션 : null,
        engagedSessionShare: v.세션 > 0 ? (100 * v.붙은세션) / v.세션 : null,
        secondsPerOpen: 열림당초(v.붙은초, v.열림),
      })),
      byKind: 갈래로모아(지면줄),
      landing: 착지.map((r) => ({
        path: r.path, sessions: r.sessions, views: r.views, users: r.users,
        stepsPerSession: 걸음수(r.views, r.sessions),
        sessionsThatDidNotWalk: 못걸은세션(r.views, r.sessions),
        engagedSessionShare: r.sessions > 0 ? (100 * r.engagedSessions) / r.sessions : null,
      })),
      pages: 지면줄.map((r) => ({
        path: r.path, views: r.views, users: r.users, sessions: r.sessions,
        engagedSeconds: r.engagedSeconds, secondsPerOpen: 열림당초(r.engagedSeconds, r.views),
        quotable: 말해도되나(r.views),
      })).sort((a, b) => b.views - a.views),
    };
    writeFileSync(적을곳, `${JSON.stringify(몸, null, 2)}\n`);
    console.log(`\n적었다 — ${적을곳} (지면 ${몸.pages.length}줄)`);
  } else {
    console.log('\n⚠ 아직 안 적었다. 적으려면 --적는다=src/data/kcw-dwell.json');
  }
}

if (내가실행됐다 && !process.argv.includes('--잰다') && !process.argv.includes('--selftest')) {
  console.log('⛔ --잰다 나 --selftest 을 준다');
}
