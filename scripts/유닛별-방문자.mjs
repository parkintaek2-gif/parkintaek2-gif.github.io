#!/usr/bin/env node
/**
 * 📊 유닛별 하루 순방문자 — **업무보고에 넣는 한 표**
 *
 * 사장님 (2026-08-21): 「**업무보고 때 하루 순방문자수 보고해**」
 * 조직 지시: 「9월 목표는 **유닛당 하루 평균 방문자를 1,000명**으로 한다」
 *
 *   node scripts/유닛별-방문자.mjs            오늘
 *   node scripts/유닛별-방문자.mjs --days 7   이레
 *   node scripts/유닛별-방문자.mjs --시험     자를 먼저 시험한다
 *
 * ── ⛔ 이 자가 조심하는 것 ────────────────────────────────────────────
 * ① **www 와 안 붙은 것을 따로 세면 숫자가 낮게 보인다.**
 *    2026-08-21 실측: 100yearmap.com 618 + www.100yearmap.com 21 = **639**.
 *    따로 두면 618 로 보고하게 된다 — 21 명을 버리는 것이다. 그래서 합친다.
 * ② **못 잰 것을 0 으로 적지 않는다.** klifemap.ai 는 이 곳간에 안 들어온다
 *    (제 서버가 따로 세고, 그 자는 127.0.0.1:4415 를 봐야 한다 — 8/21 실측 ECONNREFUSED).
 *    0 이라고 쓰면 「손님이 없다」로 읽힌다. 실제로는 **「안 세서 모른다」**다.
 * ③ 사람과 봇을 가른 수를 쓴다. traffic-report 가 이미 갈라 준다.
 *
 * ⛔ 이 자는 «읽는 자»다. 수를 만들지 않는다 — scripts/traffic-report.mjs 가 낸 것을 옮긴다.
 *    그 자의 표 꼴이 바뀌면 **조용히 0 을 내지 말고 소리 내어 멈춘다**(아래 자가시험).
 */

import { execFileSync } from 'node:child_process';

/** 유닛 = 여러 주소를 한 자리로 묶는다 */
const 유닛 = [
  { 이름: '3번 백년지도',      주소: ['100yearmap.com', 'www.100yearmap.com'] },
  { 이름: '6번 SeoulMarkets',  주소: ['seoulmarkets.com', 'www.seoulmarkets.com'] },
  { 이름: '5번 K Culture Wire',주소: ['kculturewire.com', 'www.kculturewire.com'] },
];
/**
 * KLifeMap 은 이 곳간에 안 들어온다 — 제 서버가 따로 센다.
 * [2026-08-21 19:20] 4번이 밖에서 읽는 자를 냈다: klifemap/tools/klifemap-visitors.mjs
 *   실측 「klifemap.ai   **431명** (사람) · 봇 523」
 * ⛔ 그래도 규칙은 그대로다 — 못 읽으면 **0 이 아니라 「못 쟀음」**이다.
 *    ⚠ 이 수는 쿠키를 안 심어 «같은 사람이 여러 번»을 한 명으로 못 묶는다. 그 말을 같이 적는다.
 */
const 클라이프맵자 = 'C:/Users/USER/Documents/GitHub/klifemap';

/** 4번 자의 글에서 사람 수를 뽑는다. 못 뽑으면 null — 0 이 아니다 */
export function 클라이프맵뽑기(글) {
  const m = /klifemap\.ai\s+\*\*([\d,]+)\s*명\*\*/.exec(String(글 || ''));
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

/* 🔴 [2026-08-22 · 4번] **다른 세 유닛과 셈법이 달랐다.** 3·5·6번은 traffic-report 에서
   지정한 일수만큼(기본 2일=오늘+어제) 평균을 낸다. 그런데 klifemap 은 늘 **오늘 하루치만**
   읽고 있었다 — 이른 아침에 돌리면 오늘치가 얼마 안 쌓여 다른 유닛과 견줄 수 없는 낮은 수가
   나온다(실측: 이 자를 08시경 돌리니 klifemap 만 "10%"로 나왔는데, 어제 하루치는 50%였다).
   같은 일수만큼 klifemap-visitors 를 여러 날로 불러 평균 낸다 — 셈법을 맞춘다. */
function 클라이프맵읽기(일수) {
  const 날들 = [];
  for (let i = 0; i < 일수; i++) {
    const d = new Date(Date.now() + 9 * 3600 * 1000); d.setUTCDate(d.getUTCDate() - i);
    날들.push(d.toISOString().slice(0, 10));
  }
  const 값들 = [];
  for (const 날 of 날들) {
    try {
      const 글 = execFileSync('node', ['tools/klifemap-visitors.mjs', '--날', 날],
        { cwd: 클라이프맵자, encoding: 'utf8', timeout: 120000 });
      const v = 클라이프맵뽑기(글);
      if (v !== null) 값들.push(v);
    } catch { /* 그 날은 건너뛴다 — 못 잰 날 하나가 전체를 죽이지 않는다 */ }
  }
  if (!값들.length) return null; // 하루도 못 읽었으면 못쟀다
  const 합 = 값들.reduce((a, b) => a + b, 0);
  return { 평균: Math.round(합 / 값들.length), 잰날수: 값들.length, 요청날수: 일수 };
}
const 목표 = 1000;

/** traffic-report 의 「■ 사이트별 (사람)」 토막에서 «주소 → 사람 수»를 뽑는다 */
export function 사이트별뽑기(글) {
  const 줄들 = String(글 || '').split('\n');
  const 시작 = 줄들.findIndex((l) => l.includes('사이트별'));
  if (시작 < 0) return null;                       // ⛔ 못 찾으면 null — 0 이 아니다
  const 표 = new Map();
  for (const l of 줄들.slice(시작 + 1)) {
    if (l.trim().startsWith('■')) break;           // 다음 토막
    const m = /^\s*([\d,]+)\s+(\S+)\s*$/.exec(l);
    if (m) 표.set(m[2], Number(m[1].replace(/,/g, '')));
  }
  return 표.size ? 표 : null;
}

/* ── 자가시험 — 자를 먼저 시험한다 ─────────────────────────────────── */
if (process.argv.includes('--시험')) {
  const 본 = [
    '날 20260821',
    '사람 1,360 · 봇 2,937',
    '',
    '■ 사이트별 (사람)',
    '      618  100yearmap.com',
    '       21  www.100yearmap.com',
    '      565  seoulmarkets.com',
    '',
    '■ 유입 경로 (사람)',
    '     1268  (직접)',
  ].join('\n');
  const t = 사이트별뽑기(본);
  const 합 = (t?.get('100yearmap.com') ?? 0) + (t?.get('www.100yearmap.com') ?? 0);
  const 빈것 = 사이트별뽑기("아무 표도 없는 글");
  const 맵본 = 클라이프맵뽑기("  klifemap.ai   **431명** (사람) · 봇 523");
  const 맵빈 = 클라이프맵뽑기("아무 것도 없는 글");
  const 맞나 = t && t.size === 3 && 합 === 639 && 빈것 === null && 맵본 === 431 && 맵빈 === null;
  console.log(맞나
    ? '✅ 자가시험 통과 — www 를 합쳐 639, 표가 없으면 null(0 이 아니다)'
    : `🔴 자가시험 실패: size=${t?.size} 합=${합} 빈것=${빈것}`);
  process.exit(맞나 ? 0 : 1);
}

/* ── 잰다 ──────────────────────────────────────────────────────────── */
const i = process.argv.indexOf('--days');
/* 🔴 [2026-08-22 · 4번] 예전 기본값(1일)이 「오늘 이르면 아직 안 올라온 것」을
   「표 꼴이 바뀌었다」는 자 고장으로 잘못 읽고 있었다 — 오전에 이 자를 돌리면 매번 걸렸다.
   traffic-report.mjs 자체 기본값(2일=오늘+어제)과 맞춘다 — 어제치는 자정이 지나면 반드시 있다. */
const 일수 = i > -1 ? Number(process.argv[i + 1]) || 2 : 2;

let 글;
try {
  글 = execFileSync('node', ['scripts/traffic-report.mjs', '--days', String(일수)],
    { cwd: 'C:/Users/USER/Documents/GitHub/dataeconomics', encoding: 'utf8', timeout: 240000 });
} catch (e) {
  console.log('🔴 traffic-report 를 못 돌렸습니다 — **0 이 아니라 「못 쟀다」입니다**');
  console.log('   ' + (e.message || '').split('\n')[0]);
  process.exit(1);
}

const 표 = 사이트별뽑기(글);
if (!표) {
  /* ⛔ 「쌓인 것이 없다」는 traffic-report.mjs 가 그 기간에 R2 파일이 하나도 없을 때 내는
     정상 문구다(예: --days 1 로 이른 아침에 돌리면 오늘치가 아직 안 올라온 게 정상).
     이것과 "표 형식 자체가 바뀌어 못 찾는 것"은 다른 사고이니 갈라서 말한다. */
  if (/쌓인 것이 없다/.test(글)) {
    console.log(`⚠ 이 ${일수}일 안에는 아직 쌓인 자료가 없습니다 — 자 고장이 아니라 **이른 시각**일 수 있습니다.`);
    console.log('   서버가 10분마다 R2 로 올립니다. --days 를 늘리거나(예: 2 이상) 나중에 다시 돌리십시오.');
  } else {
    console.log('🔴 traffic-report 의 「사이트별」 표를 못 찾았습니다 — 표 꼴이 바뀐 것으로 봅니다.');
    console.log('⛔ 0 을 내지 않고 멈춥니다. 자를 고쳐야 합니다(scripts/유닛별-방문자.mjs).');
  }
  process.exit(1);
}

const 날 = (/^날 (.+)$/m.exec(글) || [, '?'])[1];
console.log(`\n📊 유닛별 하루 순방문자 (사람) — ${날}${일수 > 1 ? ` · ${일수}일 합` : ''}`);
console.log(`   목표: 유닛당 하루 ${목표.toLocaleString()}명 (9월)\n`);

for (const u of 유닛) {
  const 합 = u.주소.reduce((a, d) => a + (표.get(d) ?? 0), 0);
  const 쪽 = 일수 > 1 ? Math.round(합 / 일수) : 합;
  const 몫 = Math.round((쪽 / 목표) * 100);
  const 낱 = u.주소.map((d) => `${d} ${(표.get(d) ?? 0).toLocaleString()}`).join(' + ');
  console.log(`  ${u.이름.padEnd(20)} ${String(쪽.toLocaleString()).padStart(7)}명  목표의 ${String(몫).padStart(3)}%   (${낱})`);
}
const 맵 = 클라이프맵읽기(일수);
if (맵 === null) {
  console.log(`  ${'1번/4번 KLifeMap'.padEnd(20)} ${'못 쟀음'.padStart(7)}      ⛔ klifemap/tools/klifemap-visitors.mjs 가 안 돌았다`);
} else {
  const 몫 = Math.round((맵.평균 / 목표) * 100);
  const 날치 = 맵.잰날수 < 맵.요청날수 ? ` (요청 ${맵.요청날수}일 중 ${맵.잰날수}일만 잼)` : '';
  console.log(`  ${'1번/4번 KLifeMap'.padEnd(20)} ${String(맵.평균.toLocaleString()).padStart(7)}명  목표의 ${String(몫).padStart(3)}%   (klifemap.ai · ${맵.잰날수}일 평균${날치})`);
  console.log(`  ${''.padEnd(20)} ${''.padStart(7)}      ⚠ 쿠키를 안 심어 같은 사람 여러 번을 한 명으로 못 묶습니다`);
}
console.log('\n⛔ 「못 쟀음」을 0 으로 옮겨 적지 마십시오 — 「손님이 없다」와 「안 세서 모른다」는 다릅니다.');
