#!/usr/bin/env node
/**
 * check-결제막힘-오래됐나.mjs
 *   — **결제 길이 막힌 채로 두 시간을 넘기면 사장님께 «요청»한다.**
 *
 * ── 🔴🔴 왜 지었나 (2026-10-19 20:2x · 5번) ──────────────────────────
 * 사장님 —
 * ```
 *   「어떻게 이렇게 일을 하지? **네 힘으로 안될 때는 요청을 해야지.**
 *     더구나 결제 관련 페이지인데. **절대 이런 일이 반복하면 안됨.**」
 * ```
 * 2026-10-18 에 결제 입구가 없는 지면 아홉을 찾아 고쳤다. 그런데 배포가
 * 권한(`[Production Deploy]`)에 막혀 **25시간 동안 라이브에 안 올라갔다.**
 * 그 25시간 동안 손님은 그 아홉 지면에서 **돈을 낼 수 없었다.**
 * 그리고 나는 그 사실을 사장님께 **한 번도 말씀드리지 않았다.** 화면에만 찍었다.
 *
 * ⭐ **내 힘으로 못 푸는 것을 혼자 쥐고 있는 것은 일하는 것이 아니다.**
 *   ⛔ 「곧 풀릴 것 같다」로 미루지 않는다. 시계가 정한다.
 *   ⛔ 결제는 «돈이 오가는 길»이다. 막힌 시간이 곧 못 판 시간이다.
 *
 * ── 어떻게 ────────────────────────────────────────────
 * ```
 * ① 결제 길을 잰다 (check-세징검다리.mjs 를 그대로 부른다 — 두 벌로 재지 않는다)
 * ② 막힌 곳이 있으면 «처음 막힌 때»를 자국에 적는다. 이미 있으면 덮지 않는다
 * ③ 그 때로부터 두 시간이 지났으면 사장님께 메일한다 (한 번 알리면 다시 안 보챈다)
 * ④ 막힌 곳이 없어지면 자국을 지운다 — 다음에 막히면 시계가 다시 0 부터 간다
 * ```
 *
 * 쓰는 법
 *   node scripts/check-결제막힘-오래됐나.mjs              재기만 한다
 *   node scripts/check-결제막힘-오래됐나.mjs --알린다      두 시간 넘었으면 메일
 *   node scripts/check-결제막힘-오래됐나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 사장님 = 'parkintaek2@gmail.com';
export const 참는시간 = 2 * 60 * 60 * 1000;          /* 두 시간 */
const 자국 = path.join(뿌리, 'docs/고정업무-마커/.결제막힘-처음.json');

/** 검사 화면에서 「막힌 곳 N」을 읽는다. 「막힌 곳 없음」이면 0 */
export function 막힌수(화면) {
  const t = String(화면 ?? '');
  if (/막힌 곳 없음/.test(t)) return 0;
  const m = t.match(/🔴 막힌 곳 (\d+)/);
  return m ? Number(m[1]) : null;                    /* null = 못 쟀다 */
}

/**
 * 무엇을 할 때인가.
 * ⛔ 「못 쟀다」를 「막힌 곳 없다」로 읽지 않는다 — 그러면 진짜 고장을 침묵시킨다.
 */
export function 할것(막힌수값, 자국값, 이제, 참는 = 참는시간) {
  if (막힌수값 === null) return { 무엇: '못쟀다' };
  if (막힌수값 === 0) return { 무엇: 자국값 ? '풀렸다' : '멀쩡하다' };
  if (!자국값) return { 무엇: '막히기시작했다', 처음: 이제 };
  if (자국값.알렸나) return { 무엇: '이미알렸다', 지난분: Math.round((이제 - 자국값.처음) / 60000) };
  if (이제 - 자국값.처음 < 참는) {
    return { 무엇: '아직참는다', 지난분: Math.round((이제 - 자국값.처음) / 60000) };
  }
  return { 무엇: '알린다', 지난분: Math.round((이제 - 자국값.처음) / 60000) };
}

/* ── 자가시험 ───────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 깨짐 = 0;
  const 본다 = (이름, 한것, 바란것) => {
    const a = JSON.stringify(한것), b = JSON.stringify(바란것);
    if (a === b) { 통과++; console.log('  ✅ ' + 이름); }
    else { 깨짐++; console.log('  🔴 ' + 이름 + '\n     한 것  ' + a + '\n     바란 것 ' + b); }
  };

  본다('막힌 곳 없음은 0', 막힌수('어쩌고\n✅ 막힌 곳 없음 · 못 잰 곳 1\n'), 0);
  본다('막힌 곳 2 를 읽는다', 막힌수('\n🔴 막힌 곳 2 · 못 잰 곳 0\n'), 2);
  본다('아무것도 없으면 못 쟀다', 막힌수('그냥 글'), null);
  본다('빈 화면도 못 쟀다', 막힌수(''), null);

  const 열시 = new Date('2026-10-19T10:00:00').getTime();
  const 열한시 = new Date('2026-10-19T11:00:00').getTime();
  const 한시 = new Date('2026-10-19T13:00:00').getTime();

  본다('못 쟀으면 아무것도 안 한다', 할것(null, null, 열시).무엇, '못쟀다');
  본다('🔴 못 쟀는데 자국이 있어도 풀렸다고 하지 않는다', 할것(null, { 처음: 열시 }, 한시).무엇, '못쟀다');
  본다('멀쩡하면 멀쩡하다', 할것(0, null, 열시).무엇, '멀쩡하다');
  본다('막혔다가 풀리면 풀렸다', 할것(0, { 처음: 열시 }, 한시).무엇, '풀렸다');
  본다('처음 막히면 자국을 남긴다', 할것(2, null, 열시), { 무엇: '막히기시작했다', 처음: 열시 });
  본다('한 시간은 참는다', 할것(2, { 처음: 열시 }, 열한시).무엇, '아직참는다');
  본다('세 시간이면 알린다', 할것(2, { 처음: 열시 }, 한시).무엇, '알린다');
  본다('두 시간 «정각»에 알린다', 할것(2, { 처음: 열시 }, 열시 + 참는시간).무엇, '알린다');
  본다('한 번 알렸으면 다시 안 보챈다', 할것(2, { 처음: 열시, 알렸나: true }, 한시).무엇, '이미알렸다');
  본다('지난 분을 센다', 할것(2, { 처음: 열시 }, 한시).지난분, 180);

  console.log(`\n  ${깨짐 ? '🔴' : '✅'} ${통과}/${통과 + 깨짐}`);
  process.exit(깨짐 ? 1 : 0);
}

/* ── 잰다 ──────────────────────────────────────────── */
let 화면 = '';
try {
  화면 = execFileSync(process.execPath, [path.join(뿌리, 'scripts/check-세징검다리.mjs')],
    { cwd: 뿌리, encoding: 'utf8', timeout: 180000 });
} catch (e) {
  /* 막힌 곳이 있으면 0 이 아닌 코드로 끝난다 — 그래도 화면은 읽는다 */
  화면 = String(e?.stdout ?? '') + String(e?.stderr ?? '');
}

const 수 = 막힌수(화면);
let 옛자국 = null;
try { 옛자국 = JSON.parse(fs.readFileSync(자국, 'utf8')); } catch { /* 없으면 null */ }
const 이제 = Date.now();
const 할 = 할것(수, 옛자국, 이제);

console.log('■ 결제 길이 막힌 채로 오래됐나 — ' + new Date(이제).toLocaleString('ko-KR'));
console.log('  막힌 곳 ' + (수 === null ? '못 쟀다' : 수) + ' · ' + 할.무엇
  + (할.지난분 !== undefined ? ' (' + 할.지난분 + '분째)' : ''));

if (할.무엇 === '못쟀다') {
  console.log('\n🔴 결제 길을 «재지 못했다». 이것은 「멀쩡하다」가 아니다.');
  process.exit(1);
}
if (할.무엇 === '풀렸다') {
  fs.rmSync(자국, { force: true });
  console.log('\n✅ 풀렸다 — 시계를 0 으로 돌린다');
  process.exit(0);
}
if (할.무엇 === '멀쩡하다') { console.log('\n✅ 막힌 곳 없다'); process.exit(0); }
if (할.무엇 === '막히기시작했다') {
  fs.mkdirSync(path.dirname(자국), { recursive: true });
  fs.writeFileSync(자국, JSON.stringify({ 처음: 할.처음, 막힌수: 수 }, null, 2), 'utf8');
  console.log('\n⬜ 지금 막혔다. 두 시간 안에 내가 푼다. 못 풀면 사장님께 알린다');
  process.exit(1);
}
if (할.무엇 === '아직참는다') {
  console.log('\n⬜ ' + 할.지난분 + '분째 막혀 있다. '
    + Math.round((참는시간 - (이제 - 옛자국.처음)) / 60000) + '분 뒤에 사장님께 알린다');
  process.exit(1);
}
if (할.무엇 === '이미알렸다') {
  console.log('\n🔴 ' + 할.지난분 + '분째 막혀 있다. 이미 알려 드렸다 — 푸는 데 집중한다');
  process.exit(1);
}

/* ── 알린다 ─────────────────────────────────────────── */
console.log('\n🔴 ' + 할.지난분 + '분째 막혀 있다 — 사장님께 알릴 때다');
if (!process.argv.includes('--알린다')) {
  console.log('   (--알린다 를 붙이면 메일한다)');
  process.exit(1);
}

const 요약 = 화면.split(/\r?\n/).filter((l) => /🔴/.test(l)).slice(0, 12).join('\n');
const 글 = `사장님,

결제 길이 ${Math.floor(할.지난분 / 60)}시간 ${할.지난분 % 60}분째 막혀 있고, 제 힘으로 못 풀고 있습니다.

막힌 곳 ${수}군데
${요약}

손님이 지금 그 길로는 돈을 낼 수 없습니다.
제가 계속 풀어 보겠습니다. 풀리면 바로 알려 드리겠습니다.

— 5번
`;
const 쪽지 = path.join(뿌리, 'archive/tmp-결제막힘.txt');
fs.mkdirSync(path.dirname(쪽지), { recursive: true });
fs.writeFileSync(쪽지, 글, 'utf8');
try {
  execFileSync(process.execPath, [path.join(뿌리, 'scripts/send-mail.mjs'),
    `--받는곳=${사장님}`, `--제목=[결제 막힘] ${할.지난분}분째 — 막힌 곳 ${수}군데`,
    `--글=${쪽지}`, '--흐르게', '--보낸다'], { cwd: 뿌리, stdio: 'inherit' });
  fs.writeFileSync(자국, JSON.stringify({ ...옛자국, 알렸나: true, 알린때: 이제 }, null, 2), 'utf8');
  console.log('✅ 사장님께 알렸다');
} catch (e) {
  console.log('🔴 메일을 못 보냈다 — ' + String(e?.message ?? e).slice(0, 200));
}
process.exitCode = 1;
