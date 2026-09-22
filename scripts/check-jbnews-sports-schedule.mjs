/**
 * check-jbnews-sports-schedule.mjs — **거두기 예약이 오후 5시를 넘지 않나** (2026-09-22 신설)
 *
 * 🔴 사장님 지시 (2026-09-22 17:2x, 원문 그대로)
 *   「**기사 보내지마**」 · 「**5시가 마지막**」
 *
 * [왜 이 검사가 있나]
 *   이 지시를 세 겹으로 박았는데, 그 가운데 «한 겹이 git 밖»에 있다.
 *     ① 수집기 회차 표에서 17시를 뺐다            → 저장소에 있다. 검사가 본다
 *     ② 수집기가 17시부터 안 보낸다(보낼때인가)     → 저장소에 있다. 자가시험이 본다
 *     ③ 윈도 작업 스케줄러 창을 09:23~16:23 로 줄였다 → **이 PC 안에만 있다**
 *   ③ 은 저장소에 없으므로 누가 옛 명령(/du 0008:10)으로 다시 걸면 조용히 되살아난다.
 *   PC 를 갈아도, 작업을 다시 걸어도 그 자리를 «기억»에 맡기지 않으려고 자를 둔다.
 *
 * [무엇을 재나]
 *   schtasks 로 실제 등록된 값을 읽어 «마지막으로 도는 시각»을 셈해 17:00 전인지 본다.
 *   ⛔ 「걸어 놨다」를 「맞게 걸려 있다」로 읽지 않는다 — 기계로 센다.
 *
 * [실행]
 *   node scripts/check-jbnews-sports-schedule.mjs            잰다
 *   node scripts/check-jbnews-sports-schedule.mjs --자가시험   셈하는 자를 잰다
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(fileURLToPath(import.meta.url), '..', '..');
export const 예약이름 = 'SeoulMarkets-중부매일스포츠-거두기';
export const 마지막보내는시 = 17;   /* ⚠ 수집기의 같은 이름과 짝이다. 아래 자가시험이 둘을 맞대어 본다 */

/**
 * 「2026-09-22T09:23:00」·「오전 9:23:00」·「9:23:00 AM」·「09:23」을 분으로 읽는다.
 *
 * ⚠ [2026-09-22 실측] `schtasks /query` 는 이 PC 에서 **cp949 로 나온다.**
 *   node 가 utf8 로 읽으면 글자가 깨져 「Start Time」 줄을 아예 못 찾는다.
 *   그래서 실제로 재는 쪽은 schtasks 가 아니라 PowerShell 의 Get-ScheduledTask 를 쓴다 —
 *   ISO8601(`2026-09-22T09:23:00` · `PT7H10M`)이라 **말과 지역에 안 흔들린다.**
 *   ⛔ 사람 말로 찍힌 화면을 파싱하지 않는다. 한 번 물렸다.
 */
export function 시각을분으로(글) {
  const t = String(글 ?? '').trim();
  const iso = t.match(/T(\d{2}):(\d{2})/);            /* ISO8601 을 먼저 본다 */
  if (iso) return Number(iso[1]) * 60 + Number(iso[2]);
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let 시 = Number(m[1]);
  const 분 = Number(m[2]);
  if (시 > 23 || 분 > 59) return null;
  if (/오후|PM/i.test(t) && 시 < 12) 시 += 12;
  if (/오전|AM/i.test(t) && 시 === 12) 시 = 0;
  return 시 * 60 + 분;
}

/** 「PT7H10M」·「7 Hour(s), 10 Minute(s)」·「0007:10」을 분으로 읽는다 */
export function 길이를분으로(글) {
  const t = String(글 ?? '').trim();
  const iso = t.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?$/i);   /* ISO8601 기간 */
  if (iso && (iso[1] || iso[2] || iso[3])) {
    return Number(iso[1] ?? 0) * 1440 + Number(iso[2] ?? 0) * 60 + Number(iso[3] ?? 0);
  }
  const h = t.match(/(\d+)\s*Hour/i);
  const m = t.match(/(\d+)\s*Minute/i);
  if (h || m) return Number(h?.[1] ?? 0) * 60 + Number(m?.[1] ?? 0);
  const 짝 = t.match(/^(\d{1,4}):(\d{2})$/);
  if (짝) return Number(짝[1]) * 60 + Number(짝[2]);
  return null;
}

/**
 * 마지막으로 도는 시각(분). 되풀이 간격이 없으면 시작 시각 그대로다.
 * ⚠ 창(창길이)이 간격의 배수가 아니면 마지막 회차는 «창 안»에서 끝난다 — 내림으로 센다.
 */
export function 마지막도는분(시작분, 간격분, 창길이분) {
  if (!Number.isFinite(시작분)) return null;
  if (!Number.isFinite(간격분) || 간격분 <= 0) return 시작분;
  if (!Number.isFinite(창길이분) || 창길이분 <= 0) return 시작분;
  return 시작분 + Math.floor(창길이분 / 간격분) * 간격분;
}

/** 그 창이 「5시가 마지막」을 지키나 */
export function 창이지키나(마지막분) {
  if (!Number.isFinite(마지막분)) return false;   /* 못 재면 통과시키지 않는다 */
  return 마지막분 < 마지막보내는시 * 60;
}

export function 분을글로(분) {
  if (!Number.isFinite(분)) return '(못 쟀다)';
  return `${String(Math.floor(분 / 60)).padStart(2, '0')}:${String(분 % 60).padStart(2, '0')}`;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다('한국어 오전을 읽는다', 시각을분으로('오전 9:23:00') === 9 * 60 + 23);
  본다('한국어 오후를 읽는다', 시각을분으로('오후 5:23:00') === 17 * 60 + 23);
  본다('영어 AM/PM 을 읽는다', 시각을분으로('9:23:00 AM') === 563 && 시각을분으로('5:23:00 PM') === 1043);
  본다('24시꼴도 읽는다', 시각을분으로('16:23') === 983);
  본다('오후 12시는 12시다', 시각을분으로('오후 12:05') === 725);
  본다('오전 12시는 0시다', 시각을분으로('오전 12:05') === 5);
  본다('⛔ 못 읽으면 null', 시각을분으로('') === null && 시각을분으로(null) === null && 시각을분으로('없음') === null);
  본다('⛔ 말이 안 되는 시각은 안 받는다', 시각을분으로('99:99') === null);

  본다('ISO8601 시각을 읽는다', 시각을분으로('2026-09-22T09:23:00') === 563);
  본다('ISO8601 기간을 읽는다', 길이를분으로('PT7H10M') === 430);
  본다('시간만 있는 ISO 기간도 읽는다', 길이를분으로('PT1H') === 60);
  본다('분만 있는 ISO 기간도 읽는다', 길이를분으로('PT30M') === 30);
  본다('⛔ 빈 ISO 기간은 안 받는다', 길이를분으로('PT') === null);
  본다('영어 길이를 읽는다', 길이를분으로('7 Hour(s), 10 Minute(s)') === 430);
  본다('시간만 있어도 읽는다', 길이를분으로('8 Hour(s), 0 Minute(s)') === 480);
  본다('schtasks 인자꼴도 읽는다', 길이를분으로('0007:10') === 430);
  본다('⛔ 못 읽으면 null', 길이를분으로('') === null && 길이를분으로(null) === null);

  const 아홉 = 마지막도는분(563, 60, 480);   /* 옛 판 — 09:23 부터 8시간 10분 */
  const 여덟 = 마지막도는분(563, 60, 430);   /* 지금 판 — 09:23 부터 7시간 10분 */
  본다('🔴 옛 창은 17:23 에 끝났다 — 사장님이 멈추신 바로 그 회차', 분을글로(아홉) === '17:23');
  본다('🔴 옛 창은 「5시가 마지막」을 어긴다', 창이지키나(아홉) === false);
  본다('✅ 지금 창은 16:23 에 끝난다', 분을글로(여덟) === '16:23');
  본다('✅ 지금 창은 지킨다', 창이지키나(여덟) === true);
  본다('16:59 까지는 지킨다', 창이지키나(16 * 60 + 59) === true);
  본다('🔴 17:00 정각은 어긴다', 창이지키나(17 * 60) === false);
  본다('되풀이가 없으면 시작 시각 하나뿐이다', 마지막도는분(563, 0, 480) === 563);
  본다('창이 간격보다 짧으면 한 번만 돈다', 마지막도는분(563, 60, 30) === 563);
  본다('⛔ 못 재면 통과시키지 않는다 — 모르는 것을 좋게 적지 않는다',
    창이지키나(null) === false && 창이지키나(NaN) === false);
  본다('⛔ 시작을 못 읽으면 null', 마지막도는분(null, 60, 430) === null);

  /* ⭐ 두 자가 같은 선을 본다 — 한쪽만 고쳐지면 여기서 걸린다 */
  const 수집기 = fs.readFileSync(path.join(뿌리, 'scripts', 'collect-jbnews-sports-articles.mjs'), 'utf8');
  본다('⭐ 수집기와 같은 선(17시)을 본다', new RegExp('마지막보내는시 = ' + 마지막보내는시).test(수집기));
  본다('⭐ 수집기 회차 표에 17시가 없다', !/\['17',\s*'trig_/.test(수집기.match(/const 회차 = \[[\s\S]*?\];/)?.[0] ?? ''));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 잰다 ──────────────────────────────────────────── */
/* ⭐ ISO8601 세 줄만 받는다 — 지역·말에 안 흔들린다 (위 시각을분으로 주석 참조) */
const 파워셸 = `$ErrorActionPreference='Stop'
$t = (Get-ScheduledTask -TaskName '${예약이름}').Triggers[0]
$t.StartBoundary
$t.Repetition.Interval
$t.Repetition.Duration`;

let 줄 = [];
try {
  const 글 = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 파워셸],
    { encoding: 'utf8', windowsHide: true });
  줄 = 글.split(/\r?\n/).map((l) => l.trim());
} catch {
  console.log(`⬜ 예약 「${예약이름}」을 못 읽었다 — 이 PC 가 아니거나 안 걸려 있다.`);
  console.log('   거는 법은 scripts/run-jbnews-sports-collect.cmd 머리글에 있다.');
  process.exit(0);   /* 다른 PC 에서 도는 검사를 빨갛게 만들지 않는다 */
}

const 시작분 = 시각을분으로(줄.find((l) => /^\d{4}-\d{2}-\d{2}T/.test(l)));
const 기간들 = 줄.filter((l) => /^P(?:\d+D)?T/i.test(l));
const 간격분 = 길이를분으로(기간들[0]);
const 창길이분 = 길이를분으로(기간들[1]);
const 마지막 = 마지막도는분(시작분, 간격분, 창길이분);

console.log(`■ 예약      ${예약이름}`);
console.log(`■ 시작      ${분을글로(시작분)}   되풀이 ${Number.isFinite(간격분) ? 간격분 + '분' : '(없음)'}   창 ${Number.isFinite(창길이분) ? 분을글로(창길이분) : '(없음)'}`);
console.log(`■ 마지막    ${분을글로(마지막)}`);

if (창이지키나(마지막)) {
  console.log(`✅ 「5시가 마지막」을 지킨다 — 마지막 회차 ${분을글로(마지막)} < 17:00`);
  process.exit(0);
}
console.log(`🔴 「5시가 마지막」을 어긴다 — 마지막 회차 ${분을글로(마지막)}`);
console.log('   사장님 2026-09-22 — 「기사 보내지마」·「5시가 마지막」');
console.log('   고치는 법 (창을 09:23~16:23 으로 줄인다) —');
console.log(`   schtasks /create /tn "${예약이름}" /tr "\\"${path.join(뿌리, 'scripts', 'run-jbnews-sports-collect.cmd')}\\"" /sc daily /st 09:23 /ri 60 /du 0007:10 /f`);
process.exit(1);
