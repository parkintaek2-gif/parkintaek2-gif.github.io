#!/usr/bin/env node
/**
 * check-seats-alive.mjs — **자리가 도는가**를 잰다.
 *
 * ── 왜 만들었나 ───────────────────────────────────────────────────────────
 * 🔴 [2026-09-15 13:4x] 일일 점검(낮)이 「깨진 것 0개」라고 했다. 그런데 그날
 *   **1번은 사흘째, 2번은 하루 가까이 아무것도 안 하고 있었다.**
 *   K Culture Wire 는 지면 날짜가 09-03 에 멈춰 있었다 — 하루 텍스트 6·영상 1·기타 1 이 몫인데.
 *
 *   점검표가 못 잡은 까닭은 단순하다 — **「사이트가 200 인가」만 재고 있었다.**
 *   멈춘 자리의 사이트도 200 이다. 아무도 일하지 않아도 초록불이 켜진다.
 *
 * ⇒ 사람이 「오늘 누가 일했지?」를 기억해서 챙기는 구조를 없앤다. 자가 잰다.
 *
 * ⚠ 커밋이 «일»의 전부는 아니다. 조사·통화·화면 확인은 커밋이 안 남는다.
 *   그래서 이 자는 「일 안 했다」고 말하지 않는다 — **「자취가 안 보인다」**고 말한다.
 *   그 차이를 화면 글에도 그대로 둔다(강령 3 — 못 잰 것은 못 쟀다고 적는다).
 *
 * ⛔ ListAgents 로 재지 않는다 — 여섯 자리가 같은 PC 에 있어도 서로 안 보인다(실측).
 *   누가 도는지는 «git log» 로 판정한다.
 *
 *   node scripts/check-seats-alive.mjs
 *   node scripts/check-seats-alive.mjs --자가시험
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const 뿌리 = path.resolve(import.meta.dirname, '..');
/* 🔴 형제 저장소는 «바로 옆»이다. 위로 셋을 올라가면 엉뚱한 곳을 짚는다 —
   처음 판이 그래서 2번의 마지막 커밋을 나흘 전으로 잘못 읽었다(실제로는 09-14 19:46).
   ⛔ 폴더가 없으면 조용히 0 건으로 세지 않는다. 아래 저장소에서마지막() 이 null 을 낸다. */
const 형제 = path.resolve(뿌리, '../klifemap');

/** 자리와 그 자리가 맡은 것 — 업무분장(docs/업무분장-2026-09-12.md) 을 따른다 */
export const 자리들 = [
  { 번호: '1번', 맡은것: 'K Culture Wire', 참는시간: 24 },
  { 번호: '2번', 맡은것: 'KLifeMap', 참는시간: 24 },
  { 번호: '3번', 맡은것: '백년지도', 참는시간: 24 },
  { 번호: '5번', 맡은것: '총괄 · SeoulMarkets', 참는시간: 12 },
  { 번호: '6번', 맡은것: 'SeoulMarkets', 참는시간: 24 },
];

/** 「09-12 22:11」 꼴을 시각으로. ⚠ 해가 안 적혀 있어 «올해»로 본다 */
export function 때읽기(글, 이제 = new Date()) {
  const m = String(글 || '').match(/^(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const 해 = 이제.getFullYear();
  const d = new Date(해, Number(m[1]) - 1, Number(m[2]), Number(m[3]), Number(m[4]));
  /* 앞으로 간 날짜면 지난해 것이다 */
  if (d.getTime() > 이제.getTime() + 36e5) d.setFullYear(해 - 1);
  return d;
}

/** 몇 시간 지났나. ⛔ 못 읽으면 0 이 아니라 null */
export function 지난시간(마지막, 이제 = new Date()) {
  if (!(마지막 instanceof Date) || !Number.isFinite(마지막.getTime())) return null;
  return (이제.getTime() - 마지막.getTime()) / 36e5;
}

/**
 * 판정한다. 'ok' · 'quiet'(자취가 안 보인다) · 'unknown'(못 쟀다)
 * ⛔ 못 쟀을 때 「멈췄다」로 몰지 않는다.
 */
export function 판정(지남, 참는시간) {
  if (지남 === null || 지남 === undefined) return 'unknown';
  return 지남 <= 참는시간 ? 'ok' : 'quiet';
}

function 저장소에서마지막(폴더, 번호) {
  if (!fs.existsSync(폴더)) return null;
  try {
    const 글 = execSync(
      'git log --pretty="%ad|%s" --date=format:"%m-%d %H:%M" --all',
      { cwd: 폴더, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    );
    for (const 줄 of 글.split('\n')) {
      const i = 줄.indexOf('|');
      if (i < 0) continue;
      if (줄.slice(i + 1).trim().startsWith(번호)) return 줄.slice(0, i).trim();
    }
  } catch { return null; }
  return null;
}

export function 잰다(이제 = new Date()) {
  return 자리들.map((자) => {
    const 둘 = [저장소에서마지막(뿌리, 자.번호), 저장소에서마지막(형제, 자.번호)]
      .map((x) => 때읽기(x, 이제))
      .filter(Boolean);
    const 마지막 = 둘.length ? new Date(Math.max(...둘.map((d) => d.getTime()))) : null;
    const 지남 = 지난시간(마지막, 이제);
    return { ...자, 마지막, 지남시간: 지남 === null ? null : Math.round(지남 * 10) / 10, 상태: 판정(지남, 자.참는시간) };
  });
}

function 본일() {
  const 이제 = new Date();
  const 것 = 잰다(이제);
  console.log('■ 자리가 도는가 — ' + 이제.toLocaleString('ko-KR'));
  console.log('  ⚠ 커밋 자취로 잽니다. 커밋이 안 남는 일(조사·화면 확인)도 있으니');
  console.log('    「일 안 했다」가 아니라 «자취가 안 보인다»로 읽으십시오.\n');
  let 조용함 = 0;
  for (const x of 것) {
    const 표 = x.상태 === 'ok' ? '✅' : (x.상태 === 'quiet' ? '🔴' : '⬜');
    const 언제 = x.마지막
      ? x.마지막.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '(자취 없음)';
    const 지남 = x.지남시간 === null ? '못 쟀다'
      : (x.지남시간 >= 24 ? Math.floor(x.지남시간 / 24) + '일 ' + Math.round(x.지남시간 % 24) + '시간' : x.지남시간 + '시간');
    console.log('  ' + 표 + ' ' + x.번호.padEnd(4) + x.맡은것.padEnd(22)
      + '마지막 ' + 언제.padEnd(18) + '(' + 지남 + ' 전 · 참는 선 ' + x.참는시간 + '시간)');
    if (x.상태 === 'quiet') 조용함 += 1;
  }
  console.log('\n잰 자리 ' + 것.length + ' · 자취가 안 보이는 자리 ' + 조용함);
  if (조용함) {
    console.log('🔴 조용한 자리는 «깨우거나 그 몫을 누가 대신할지» 총괄이 정합니다.');
    console.log('   ⛔ 그냥 두지 않습니다 — 그 자리의 하루 몫이 그대로 0 이 됩니다.');
  }
  return 조용함;
}

/* ── 자가시험 ──────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const 이제 = new Date(2026, 8, 15, 13, 40);           /* 2026-09-15 13:40 */

  const d = 때읽기('09-12 22:11', 이제);
  재다('때읽기: 월-일 시:분을 읽는다', d && d.getMonth() === 8 && d.getDate() === 12 && d.getHours() === 22);
  재다('⛔ 때읽기: 못 읽으면 null', 때읽기('아무거나', 이제) === null && 때읽기(null, 이제) === null);
  재다('때읽기: 앞으로 간 날짜는 지난해로 본다',
    때읽기('12-31 23:00', 이제).getFullYear() === 2025);

  재다('지난시간: 사흘쯤 지났다', Math.round(지난시간(d, 이제)) === 63);
  재다('⛔ 지난시간: 못 읽으면 0 이 아니라 null', 지난시간(null, 이제) === null);

  재다('판정: 참는 선 안이면 ok', 판정(5, 24) === 'ok');
  재다('판정: 참는 선을 넘으면 quiet', 판정(63, 24) === 'quiet');
  재다('🔴 판정: 못 쟀으면 «멈췄다»가 아니라 unknown', 판정(null, 24) === 'unknown');
  재다('판정: 딱 선이면 ok (선을 넘어야 조용한 것이다)', 판정(24, 24) === 'ok');

  재다('자리 다섯 · 4번은 없다(구독 만료)', 자리들.length === 5 && !자리들.some((x) => x.번호 === '4번'));
  재다('총괄은 참는 선이 더 짧다', 자리들.find((x) => x.번호 === '5번').참는시간 === 12);
  재다('⛔ 자리 이름에 사람 이름이 없다', 자리들.every((x) => /^\d번$/.test(x.번호)));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/**
 * 일일 점검이 부르는 «공통 입구». 사이트 코드를 받아 그 사이트를 맡은 자리를 본다.
 * 낸다 — { 됐나, 말 }
 * ⛔ 「일 안 했다」로 적지 않는다. 커밋이 안 남는 일도 있으니 «자취»로 말한다.
 */
export const 사이트자리 = {
  seoulmarkets: '6번', klifemap: '2번', kculturewire: '1번', '100yearmap': '3번',
};

export function 일일점검(사이트코드, 이제 = new Date()) {
  const 번호 = 사이트자리[사이트코드];
  if (!번호) return { 됐나: null, 말: '이 사이트를 맡은 자리를 모른다' };
  const x = 잰다(이제).find((y) => y.번호 === 번호);
  if (!x) return { 됐나: null, 말: 번호 + ' 를 자리 목록에서 못 찾았다' };
  if (x.상태 === 'unknown') return { 됐나: null, 말: 번호 + ' — 자취를 못 쟀다' };
  const 지남 = x.지남시간 >= 24
    ? Math.floor(x.지남시간 / 24) + '일 ' + Math.round(x.지남시간 % 24) + '시간'
    : x.지남시간 + '시간';
  if (x.상태 === 'ok') return { 됐나: true, 말: 번호 + ' 자취 ' + 지남 + ' 전' };
  return {
    됐나: false,
    말: '🔴 ' + 번호 + ' 자취가 ' + 지남 + ' 동안 안 보인다 (참는 선 '
      + x.참는시간 + '시간) — 깨우거나 그 몫을 누가 대신할지 정한다',
  };
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (process.argv[1] && process.argv[1].endsWith('check-seats-alive.mjs')) 본일();
