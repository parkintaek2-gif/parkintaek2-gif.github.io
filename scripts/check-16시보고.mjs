#!/usr/bin/env node
/**
 * check-16시보고.mjs — **오늘 16시 업무보고가 실제로 나갔나.**
 *
 * ── 왜 만들었나 ───────────────────────────────────────────────────────────
 * 🔴 [2026-09-15] 16시 보고를 17시 37분에야 보냈다. 사장님이 먼저 물으셨다 —
 *   **「업무보고를 왜 안하지?」 · 「바빠도 할 건 해라」**
 *
 *   그날 새 지시가 빠르게 잇달았고(스크리너·신용등급·진열장·손금·PC·2번 자리),
 *   나는 그것을 처리하느라 정기 보고를 그대로 넘겼다.
 *   ⛔ 「새 지시가 많아서」는 까닭이 되지 않는다. 사장님은 그 보고로 사업을 보신다.
 *
 * 진짜 까닭은 **시각이 내 기억에만 걸려 있었던 것**이다.
 * 예약(CronCreate)은 세션 메모리에만 살고, 세션이 바쁘면 그 시각에 안 뜬다.
 * ⇒ 같은 날 아카이빙은 안 빠졌다. 그것은 «자»가 잡고 있었기 때문이다.
 *   잡히는 것은 지켜졌고 안 잡히는 것만 빠졌다. 그래서 이 자를 만든다.
 *
 * ── 어떻게 재나 ───────────────────────────────────────────────────────────
 * 「보냈다」는 말이 아니라 **보낸 기록**(docs/보낸메일.tsv)을 본다.
 * send-mail.mjs 가 보낼 때마다 거기에 한 줄을 적고 그 자리에서 커밋한다.
 *
 * ── 판정 ──────────────────────────────────────────────────────────────────
 *   16:05 이전       ⏳ 기다리는 중 — 빨간불이 아니다(「기다림」과 「깨진 것」을 가른다)
 *   그 뒤 보냄 있다   ✅ 보낸 시각을 그대로 보인다
 *   그 뒤 보냄 없다   🔴 안 나갔다
 *
 *   node scripts/check-16시보고.mjs
 *   node scripts/check-16시보고.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
export const 기록길 = path.join(뿌리, 'docs/보낸메일.tsv');

/** 보고 마감 — 16:05 를 지나면 재기 시작한다 */
export const 보고시 = 16;
export const 봐주는분 = 5;

/** 이 PC 는 이미 한국시간이다. ⛔ toISOString() 을 쓰지 않는다 */
export function 오늘글(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

export function 마감지났나(d = new Date()) {
  return d.getHours() > 보고시 || (d.getHours() === 보고시 && d.getMinutes() >= 봐주는분);
}

/** 업무보고로 보이는 줄인가. ⛔ 아무 메일이나 보고로 세지 않는다 */
export function 업무보고인가(줄) {
  const s = String(줄 ?? '');
  return /업무보고|업무 보고/.test(s);
}

/** 오늘 나간 업무보고 줄들 */
export function 오늘보고들(글, 오늘 = 오늘글()) {
  return String(글 ?? '').split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .filter((l) => l.includes(오늘) && 업무보고인가(l));
}

/** 낸다 — { 상태: 'waiting'|'ok'|'missing', 말 } */
export function 잰다(글, 이제 = new Date()) {
  const 오늘 = 오늘글(이제);
  const 것 = 오늘보고들(글, 오늘);
  if (것.length) {
    const 때 = (것[것.length - 1].match(/\d{2}:\d{2}/) || [''])[0];
    const 늦었나 = 때 && (Number(때.slice(0, 2)) > 보고시
      || (Number(때.slice(0, 2)) === 보고시 && Number(때.slice(3)) > 30));
    return {
      상태: 'ok',
      말: '오늘 업무보고가 나갔다' + (때 ? ' (' + 때 + ')' : '')
        + (늦었나 ? ' ⚠ 16시를 넘겨서 나갔다' : ''),
    };
  }
  if (!마감지났나(이제)) {
    return { 상태: 'waiting', 말: '아직 ' + 보고시 + '시 전이다 — 기다리는 중' };
  }
  return {
    상태: 'missing',
    말: '🔴 오늘 ' + 보고시 + '시 업무보고가 «안 나갔다» — 바빠도 이것부터 보낸다'
      + ' (node scripts/send-mail.mjs --받는곳=parkintaek@naver.com --제목="[5번] … 업무보고" --글=<파일> --보낸다)',
  };
}

/** 일일 점검이 부르는 공통 입구 */
export function 일일점검(사이트코드, 이제 = new Date()) {
  /* 보고는 사이트마다 따로 하는 것이 아니라 «하루에 한 번»이다.
     그래서 어느 사이트로 불리든 같은 답을 낸다. ⛔ 사이트 수만큼 빨간불을 내지 않는다. */
  if (사이트코드 && 사이트코드 !== 'seoulmarkets') return { 됐나: null, 말: '하루 한 번 — SeoulMarkets 칸에서만 잽니다' };
  const 글 = fs.existsSync(기록길) ? fs.readFileSync(기록길, 'utf8') : '';
  const r = 잰다(글, 이제);
  if (r.상태 === 'waiting') return { 됐나: null, 말: r.말 };
  return { 됐나: r.상태 === 'ok', 말: r.말 };
}

function 본일() {
  const 글 = fs.existsSync(기록길) ? fs.readFileSync(기록길, 'utf8') : '';
  const r = 잰다(글);
  const 표 = r.상태 === 'ok' ? '✅' : (r.상태 === 'waiting' ? '⏳' : '🔴');
  console.log('■ 오늘 16시 업무보고 — ' + new Date().toLocaleString('ko-KR'));
  console.log('  ' + 표 + ' ' + r.말);
  if (r.상태 === 'missing') {
    console.log('  사장님(2026-09-15): 「업무보고를 왜 안하지?」 · 「바빠도 할 건 해라」');
    process.exit(1);
  }
}

/* ── 자가시험 ──────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const 오전 = new Date(2026, 8, 15, 11, 0);
  const 오후 = new Date(2026, 8, 15, 17, 30);

  재다('오늘글: 한국시간 그대로', 오늘글(오후) === '2026-09-15');
  재다('마감: 16:05 전은 안 지났다', 마감지났나(new Date(2026, 8, 15, 16, 4)) === false);
  재다('마감: 16:05 은 지났다', 마감지났나(new Date(2026, 8, 15, 16, 5)) === true);
  재다('마감: 오전은 안 지났다', 마감지났나(오전) === false);

  재다('업무보고인가: 제목에 들면 참', 업무보고인가('2026-09-15 17:38\t…\t[5번] 9월 15일 업무보고') === true);
  재다('⛔ 업무보고인가: 아무 메일이나 아니다',
    업무보고인가('2026-09-15 12:12\t…\t[5번] 신용등급 — 인도가 열려 있습니다') === false);

  const 있는날 = '2026-09-15 17:38\tparkintaek@naver.com\t[5번] 9월 15일 업무보고 (늦었습니다)';
  const 딴날 = '2026-09-14 16:01\tparkintaek@naver.com\t[5번] 9월 14일 업무보고';
  const 딴메일 = '2026-09-15 12:12\tparkintaek@naver.com\t[5번] 신용등급 건';

  재다('✅ 오늘 보고가 있으면 ok', 잰다([딴날, 있는날].join('\n'), 오후).상태 === 'ok');
  재다('⚠ 늦게 나간 것은 늦었다고 적는다', /넘겨서 나갔다/.test(잰다(있는날, 오후).말));
  재다('🔴 오늘 보고가 없고 마감이 지났으면 missing',
    잰다([딴날, 딴메일].join('\n'), 오후).상태 === 'missing');
  재다('⏳ 마감 전이면 «기다림»이지 빨간불이 아니다',
    잰다([딴날].join('\n'), 오전).상태 === 'waiting');
  재다('🔴 어제 보고를 오늘 것으로 세지 않는다', 잰다(딴날, 오후).상태 === 'missing');
  재다('⛔ 빈 기록도 견딘다', 잰다('', 오후).상태 === 'missing' && 잰다(null, 오전).상태 === 'waiting');

  재다('16시에 딱 맞춰 보낸 것은 늦음 표시가 없다',
    !/넘겨서/.test(잰다('2026-09-15 16:02\t…\t[5번] 업무보고', 오후).말));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (process.argv[1] && process.argv[1].endsWith('check-16시보고.mjs')) 본일();
