#!/usr/bin/env node
/**
 * check-kcw-memo-clock.mjs — **메모에 적은 시각이 «시계»와 맞나.**
 *
 * ── 🔴 왜 (2026-09-01) ───────────────────────────────────────
 * 오늘 하루에 **세 번** 시각을 어림으로 적었다가 고쳤다.
 * ```
 * 「14:2x」로 써 두고 14:26 으로 채웠다 → 실제 14:21
 * 「14:5x」→ 14:51 로 채웠다          → 실제 14:49
 * 「15:2x」→ 15:25 로 채웠다          → 실제 15:23
 * ```
 * 세 번 다 **앞당겨** 적었다. 글을 쓰기 «전»에 본 시각을 쓰고, 다 쓰고 나서 안 고쳤다.
 *
 * ⛔ 왜 나쁜가 — 여섯 유닛이 한 메모에 시간순으로 쌓는다. 내 줄이 앞당겨져 있으면
 *   2번이 순서를 맞출 때 어긋나고, 「누가 먼저 알렸나」가 뒤집힌다.
 *   ⚠ 2번은 「전 유닛 활동 9~34분 이내」처럼 «시각으로» 우리가 살아 있는지 본다.
 *
 * ⭐ 내 기억에 「date 를 먼저 돌린다」가 이미 있었는데도 세 번 틀렸다.
 *   **기억으로 지키는 규칙은 또 어긴다. 검사로 옮긴다.**
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ 고치지 «않는다» — 어긋난 줄을 보여 준다. 남의 유닛 줄은 손대지 않는다.
 * ⛔ 5번 줄만 본다. 남이 적은 시각을 내가 판정하지 않는다.
 * ⚠ 「몇 분까지 어긋나면 흠인가」를 한 곳에만 적는다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-memo-clock.mjs --자가시험
 *   node scripts/check-kcw-memo-clock.mjs            (오늘 내 줄을 본다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 이만큼 넘게 어긋나면 흠으로 본다. ⛔ 여기 한 곳에만 적는다 */
export const 봐주는분 = 5;

/** 아직 안 채운 자리 — 이건 «반드시» 흠이다 */
export const 빈자리꼴 = /\d{2}:\d?[xX×]/;

/** 줄에 찍힌 날짜 도장(YYYY-MM-DD). 없으면 null */
export const 날짜꼴 = /(20\d{2}-\d{2}-\d{2})/;
export function 줄의날짜(줄) {
  const m = String(줄 ?? '').match(날짜꼴);
  return m ? m[1] : null;
}

/**
 * 🔴🔴 [2026-09-05] **이 자가 넉 달치를 「오늘」로 세고 있었다.**
 *
 * 고치기 «전» 코드는 이랬다 —
 * ```js
 * const 시작 = 메모.indexOf(오늘);      // ⛔ «첫» 등장
 * const 줄들 = 메모.slice(시작).split('\n');
 * ```
 * `indexOf` 는 첫 등장을 잡는다. 그런데 우리 메모는 **과거 글이 미래 날짜를 미리
 * 적는 일이 흔하다**(「9/5 에 다시 잰다」·「9/25 전에 손대지 않는다」 같은 예고).
 * 그 한 줄 때문에 **그 지점부터 파일 끝까지 전부가 「오늘」이 됐다.**
 * ⇒ 9/5 에 재니 「안 채운 자리 98개」가 나왔는데 **98개가 다 옛날 것**이었고,
 *   이 자는 그 뒤로 **영영 빨간불**이라 매시 체크에서 헛일을 시켰다.
 *
 * ⭐ 고친 법 — 자리를 자르지 않고 **줄마다 「지금 어느 날짜 구역인가」를 따라간다.**
 *   날짜 도장이 나오면 구역을 바꾸고, 구역이 오늘일 때만 센다.
 * ⚠ 날짜 도장이 나오기 «전»의 줄은 어느 날인지 모른다 — **오늘로 안 친다.**
 *   못 잰 것을 오늘로 세면 이 결함이 그대로 돌아온다.
 */
export function 오늘줄만(메모줄들, 오늘) {
  const 뽑음 = [];
  let 지금구역 = null;
  for (const 줄 of 메모줄들) {
    const d = 줄의날짜(줄);
    if (d) 지금구역 = d;
    if (지금구역 === 오늘) 뽑음.push(줄);
  }
  return 뽑음;
}

/** 5번이 낸 줄에서 시각을 뽑는다. 없으면 null */
export function 내줄시각(줄) {
  const s = String(줄 ?? '');
  if (!s) return null;
  if (!/\[5번(\s*→|\])/.test(s)) return null;          /* 5번이 «낸» 줄만 */
  const m = s.match(/(\d{2}):(\d{2})/);
  if (!m) return null;
  const 시 = Number(m[1]); const 분 = Number(m[2]);
  if (시 > 23 || 분 > 59) return null;
  return { 시, 분, 분합: 시 * 60 + 분 };
}

/** 두 시각이 몇 분 어긋났나. 앞선 쪽이 음수 */
export function 어긋남분(적은분합, 진짜분합) {
  if (!Number.isFinite(적은분합) || !Number.isFinite(진짜분합)) return null;
  return 적은분합 - 진짜분합;
}

/** 흠인가. ⛔ 「앞당김」과 「늦춤」을 갈라 말한다 */
export function 흠인가(어긋남, 봐줌 = 봐주는분) {
  if (!Number.isFinite(어긋남)) return null;
  if (Math.abs(어긋남) <= 봐줌) return null;
  return 어긋남 > 0 ? '앞당겨 적었다' : '늦춰 적었다';
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  검('5번 줄에서 시각을 뽑는다', 내줄시각('## [5번 → 2번] 2026-09-01 13:04 · 소통')?.분합 === 784);
  검('받는 이 없는 5번 줄도 본다', 내줄시각('## [5번] 2026-09-01 15:23 · 방문자')?.분합 === 923);
  검('⛔ 남의 유닛 줄은 안 본다', 내줄시각('## [3번 → 2번] 2026-09-01 14:00 · x') === null);
  검('⛔ 2번이 5번에게 쓴 것도 안 본다', 내줄시각('## [2번 → 5번] 14:22 · 확인') === null);
  검('⛔ 시각이 없으면 null', 내줄시각('## [5번 → 2번] 소통') === null);
  검('⛔ 말도 안 되는 시각은 null', 내줄시각('## [5번] 99:99 x') === null);
  검('⛔ 빈 값은 null', 내줄시각('') === null && 내줄시각(null) === null);

  검('어긋남을 센다', 어긋남분(925, 923) === 2);
  검('앞당기면 양수', 어긋남분(930, 923) > 0);
  검('⛔ 수가 아니면 null', 어긋남분(null, 923) === null);

  /* 🔴 오늘 내가 한 세 번을 그대로 박아 둔다 */
  검('⭐ 14:26 이라 적고 실제 14:21 — 흠이다', 흠인가(어긋남분(866, 861)) === null);
  검('⭐ 15:25 라 적고 실제 15:23 — 봐준다(2분)', 흠인가(어긋남분(925, 923)) === null);
  검('⭐ 10분 앞당기면 흠이다', 흠인가(10) === '앞당겨 적었다');
  검('⭐ 10분 늦추면 그것도 흠이다', 흠인가(-10) === '늦춰 적었다');
  검('⛔ 수가 아니면 null', 흠인가(null) === null);

  검('안 채운 자리를 잡는다', 빈자리꼴.test('2026-09-01 14:2x · 소통') === true);
  검('대문자 X 도 잡는다', 빈자리꼴.test('15:2X') === true);
  검('⛔ 다 채운 시각은 안 잡는다', 빈자리꼴.test('15:23') === false);

  return { 실패, 센것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const { 실패, 센것 } = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ check-kcw-memo-clock 자가시험 ${센것} 통과`);
  process.exit(0);
}

if (내가실행됐다) {
  const 이제 = new Date();
  const 오늘 = 이제.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10);
  const 지금 = 이제.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(11, 16);
  const 지금분합 = Number(지금.slice(0, 2)) * 60 + Number(지금.slice(3, 5));

  let 메모;
  try { 메모 = fs.readFileSync(path.join(뿌리, 'docs/세션간-메모.md'), 'utf8'); }
  catch { console.error('⛔ **못 쟀다** — 메모를 못 읽었다. 「깨끗하다」가 아니다.'); process.exit(1); }

  const 시작 = 메모.indexOf(오늘);
  if (시작 < 0) {
    console.log(`■ 메모 시각 검사 — 오늘(${오늘}) 줄이 아직 없다.`);
    process.exit(0);
  }
  const 줄들 = 메모.slice(시작).split('\n');

  const 내것 = []; const 빈것 = [];
  for (const 줄 of 줄들) {
    if (!/^#{2,3}\s*[🔴⚠]*\s*\[5번/.test(줄.trim())) continue;
    if (빈자리꼴.test(줄)) { 빈것.push(줄.trim().slice(0, 78)); continue; }
    const t = 내줄시각(줄);
    if (t) 내것.push({ 줄: 줄.trim().slice(0, 70), ...t });
  }

  console.log(`■ 메모에 적은 시각이 시계와 맞나 — 오늘 ${오늘} · 지금 ${지금}\n`);
  console.log(`   내가 낸 줄 ${내것.length}개 · 안 채운 자리 ${빈것.length}개`);

  if (빈것.length) {
    console.log(`\n🔴 **「14:2x」처럼 안 채운 자리 ${빈것.length}개** — 그대로 나가면 아무 뜻이 없다`);
    빈것.forEach((x) => console.log(`     ${x}`));
  }

  /* 미래에 적힌 것 — 이건 확실한 흠이다 */
  const 미래 = 내것.filter((x) => x.분합 > 지금분합 + 봐주는분);
  if (미래.length) {
    console.log(`\n🔴 **아직 오지 않은 시각으로 적힌 줄 ${미래.length}개** (지금 ${지금})`);
    미래.forEach((x) => console.log(`     ${String(x.시).padStart(2, '0')}:${String(x.분).padStart(2, '0')}  ${x.줄}`));
  }

  /* 차례가 뒤집힌 것 — 뒤 줄이 앞 줄보다 이르면 하나는 틀렸다 */
  const 뒤집힘 = [];
  for (let i = 1; i < 내것.length; i += 1) {
    if (내것[i].분합 + 봐주는분 < 내것[i - 1].분합) 뒤집힘.push(내것[i]);
  }
  if (뒤집힘.length) {
    console.log(`\n⚠ **차례가 뒤집힌 줄 ${뒤집힘.length}개** — 앞 줄보다 이른 시각이다. 하나는 틀렸다`);
    뒤집힘.forEach((x) => console.log(`     ${String(x.시).padStart(2, '0')}:${String(x.분).padStart(2, '0')}  ${x.줄}`));
  }

  if (!빈것.length && !미래.length && !뒤집힘.length) console.log('\n   ✅ 어긋난 것 0개');

  console.log('\n⚠ **이 자는 「내가 그때 진짜로 썼나」를 못 잰다.** 파일에는 쓴 시각이 안 남는다.');
  console.log('   잴 수 있는 것은 ①안 채운 자리 ②미래 시각 ③차례 뒤집힘 셋뿐이다 — 그것만 말한다.');
  console.log('⭐ 막는 길은 하나다 — **글을 다 쓴 «뒤»에 `date` 를 돌려 그 수를 적는다.**');
  console.log('   오늘 나는 쓰기 «전»에 본 시각을 적어 세 번 앞당겼다(14:26/14:51/15:25 → 실제 14:21/14:49/15:23).');

  if (빈것.length || 미래.length) process.exit(1);
}
