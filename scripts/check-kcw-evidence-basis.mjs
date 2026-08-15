/**
 * **내 결론이 무엇으로 서 있나 — 셋 중 하나를 못 대면 결론이 아니다.**
 *
 * ── 사장님 지시(2026-08-15) ───────────────────────────────────
 * ```
 *   스스로 발전해야 한다. 판단 장치는 추측이 아니라
 *   <데이터, 검증된 과학기술, 학술적 근거> 임을 명심해라.
 * ```
 * 3번이 이 지시를 먼저 자로 바꿨다 — 문서에 **「근거 칸」**을 만들고 결론마다 셋 중
 * 무엇으로 서 있는지 적었다. 그리고 **② 검증된 과학기술로 선 결론이 아직 없다**고
 * 솔직히 적어 뒀다.
 *
 * ⭐ 나는 같은 틀을 쓰되 **손이 아니라 자료에서 잰다.** 내 지면이 800장이라 손으로는 못 한다.
 *
 * ── 세 칸 ──────────────────────────────────────────────────────
 * ```
 *   ① 잰 데이터        source · 어디서 어떻게 받았는지가 자료에 적혀 있나
 *   ② 검증된 과학기술   method  · 쓴 방법의 **이름**이 적혀 있나
 *   ③ 학술적 근거      limitation · 그 방법의 **알려진 한계**가 적혀 있나
 * ```
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **통계를 쓰는 자료만 ②③을 묻는다.** 단순 셈(개수·합계)에는 방법 이름이 필요 없다.
 *    ⚠ 아무데나 물으면 빨강이 넘쳐 아무도 안 본다. 8/15 에 그 실수를 이미 했다.
 * ⛔ **③은 「인용이 있나」가 아니라 「한계가 적혀 있나」다.** 학술적 근거를 쓴다는 것은
 *    권위를 빌리는 것이 아니라 **한계를 물려받는 것**이다. 오늘 jackknife 에서 배웠다.
 * ⛔ **빨강으로 세우지 않는다.** 세어서 보여 준다 — 채우는 것은 사람이 자리마다 한다.
 * ⛔ 남의 자료(100y · seoulmarkets)는 안 본다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-evidence-basis.mjs
 *   node scripts/check-kcw-evidence-basis.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자료방 = path.join(뿌리, 'src', 'data');

/**
 * ⭐ 통계 처리를 쓴 자료인가 — 그때만 ②③을 묻는다.
 * ⚠ 개수를 세거나 합을 낸 것에는 방법 이름을 요구하지 않는다. 그건 셈이지 방법이 아니다.
 */
export const 통계표 = [/median/i, /percentile/i, /quartile/i, /stdev/i, /correlat/i,
  /regress/i, /stability/i, /oneOut/i, /jackknife/i, /bootstrap/i];

export function 통계쓰나(자료) {
  const 글 = JSON.stringify(자료 ?? {});
  return 통계표.some((r) => r.test(글));
}

/** 어느 칸이든 깊은 곳에서 찾는다 — 자료마다 자리가 다르다 */
export function 어딘가에있나(o, 키정규식) {
  let 있다 = false;
  (function 파고들기(x) {
    if (있다 || !x || typeof x !== 'object') return;
    for (const [k, v] of Object.entries(x)) {
      if (키정규식.test(k) && typeof v === 'string' && v.length > 8) { 있다 = true; return; }
      파고들기(v);
    }
  }(o));
  return 있다;
}

/**
 * ⭐⭐ 한 자료의 근거 칸 셋.
 * ⛔ 통계를 안 쓰면 ②③은 **묻지 않는다**(`null`) — 「빈 칸」과 「해당 없음」은 다르다.
 */
export function 근거칸(자료) {
  const 통계 = 통계쓰나(자료);
  return {
    /* ① 잰 데이터 — 어디서 어떻게 받았는지 */
    data: 어딘가에있나(자료, /^source$|^sources$|^api$/i),
    /* ② 검증된 과학기술 — 방법의 이름 */
    method: 통계 ? 어딘가에있나(자료, /^method$|^methodName$/i) : null,
    /* ③ 학술적 근거 — 그 방법의 알려진 한계 */
    limits: 통계 ? 어딘가에있나(자료, /^limitation$|^limitations$|^caveat$/i) : null,
    usesStatistics: 통계,
  };
}

/** ⭐ 빈 칸만 추린다. `null` 은 빈 칸이 아니다 — 물을 일이 아닌 것이다 */
export function 빈칸(칸) {
  const 빈 = [];
  if (칸.data === false) 빈.push('① 잰 데이터');
  if (칸.method === false) 빈.push('② 검증된 과학기술');
  if (칸.limits === false) 빈.push('③ 학술적 근거');
  return 빈;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  참('중앙값을 쓰면 통계다', 통계쓰나({ medianX: 3 }));
  참('하나빼기를 쓰면 통계다', 통계쓰나({ a: { stability: { swing: 1 } } }));
  참('⛔ 개수만 세면 통계가 아니다', 통계쓰나({ count: 30, total: 5 }) === false);
  참('⛔ 빈 자료도 통계가 아니다', 통계쓰나(null) === false);

  참('깊은 곳의 칸도 찾는다', 어딘가에있나({ a: { b: { source: 'Wikimedia API' } } }, /^source$/));
  참('⛔ 너무 짧으면 안 친다', 어딘가에있나({ source: 'x' }, /^source$/) === false);
  참('⛔ 없으면 없다', 어딘가에있나({ a: 1 }, /^source$/) === false);
  참('⛔ 수는 안 친다', 어딘가에있나({ source: 12345678 }, /^source$/) === false);

  /* ⭐⭐ 오늘 one-out 에 넣은 그 모양이 기준이다 */
  const 갖춘것 = 근거칸({
    source: 'Wikimedia Pageviews API, human traffic only',
    answer: { median: 8, verdict: { method: 'jackknife (Quenouille 1949)', limitation: 'understates variability for the median (Miller 1974)' } },
  });
  참('⭐⭐ 셋 다 갖춘 것을 알아본다',
    갖춘것.data && 갖춘것.method && 갖춘것.limits && 빈칸(갖춘것).length === 0);

  const 방법없음 = 근거칸({ source: 'Wikimedia Pageviews API', answer: { medianX: 8 } });
  참('⛔ 방법 이름이 없으면 짚는다', 방법없음.method === false);
  참('⛔ 한계가 없으면 짚는다', 방법없음.limits === false);
  참('빈 칸을 이름으로 낸다',
    빈칸(방법없음).join() === '② 검증된 과학기술,③ 학술적 근거');

  /* ⛔ 통계를 안 쓰는 자료에 방법 이름을 요구하지 않는다 — 아무데나 물으면 빨강이 넘친다 */
  const 셈만 = 근거칸({ source: 'Wikidata (CC0) query on Q-numbers', count: 520 });
  참('⛔⛔ 셈만 하는 자료엔 ②③을 안 묻는다',
    셈만.method === null && 셈만.limits === null);
  참('⭐ 그때 빈 칸은 없다', 빈칸(셈만).length === 0);
  참('⭐ 그래도 ①은 묻는다', 셈만.data === true);
  참('⛔ ① 이 없으면 셈만 해도 짚는다',
    빈칸(근거칸({ count: 5 })).join() === '① 잰 데이터');

  참('⭐ 통계를 쓰는지 자료에 남긴다', 근거칸({ medianX: 1 }).usesStatistics === true);

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 파일들 = fs.readdirSync(자료방)
    .filter((f) => f.startsWith('wikitip-') && f.endsWith('.json'));
  const 표 = [];
  let 통계쓰는것 = 0;

  for (const f of 파일들) {
    let 자료;
    try { 자료 = JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8')); } catch { continue; }
    const 칸 = 근거칸(자료);
    if (칸.usesStatistics) 통계쓰는것 += 1;
    const 빈 = 빈칸(칸);
    if (빈.length) 표.push({ f, 빈, 칸 });
  }

  console.log('# 근거 칸 — 사장님 지시(8/15)를 자로 바꾼다\n');
  console.log('「판단 장치는 추측이 아니라 **<데이터, 검증된 과학기술, 학술적 근거>**」');
  console.log(`내 자료 ${파일들.length}개 · 그중 통계를 쓰는 것 ${통계쓰는것}개\n`);

  const 셋다 = 파일들.length - 표.length;
  console.log(`✅ 셋 다 선 자료 ${셋다}개`);
  console.log(`⚠ 빈 칸이 있는 자료 ${표.length}개\n`);

  /* ⛔ ② ③ 이 빈 것을 먼저 보인다 — 통계를 쓰면서 방법을 안 밝힌 자리다 */
  const 방법빔 = 표.filter((x) => x.칸.usesStatistics && (x.칸.method === false || x.칸.limits === false));
  if (방법빔.length) {
    console.log(`── 통계를 쓰면서 방법을 안 밝힌 자료 ${방법빔.length}개 ──`);
    for (const { f, 빈 } of 방법빔.slice(0, 12)) {
      console.log(`   ⚠ ${f.replace('wikitip-', '').replace('.json', '').padEnd(26)} ${빈.join(' · ')}`);
    }
    if (방법빔.length > 12) console.log(`   … 그리고 ${방법빔.length - 12}개 더`);
    console.log('');
  }

  const 자료빔 = 표.filter((x) => x.칸.data === false);
  if (자료빔.length) {
    console.log(`── ① 잰 데이터가 **자료 파일에** 안 적힌 것 ${자료빔.length}개 ──`);
    for (const { f } of 자료빔.slice(0, 8)) {
      console.log(`   🔴 ${f.replace('wikitip-', '').replace('.json', '')}`);
    }
    /* ⛔ 이 자는 자료만 본다. 지면에 손으로 적힌 출처는 못 본다 — 그 말을 먼저 한다 */
    console.log('   ⚠ 이 자는 **자료 파일만** 본다. 지면(.astro)에 손으로 적은 출처는 못 본다.');
    console.log('      그래도 자료에 있어야 한다 — 지면이 바뀌면 손으로 적은 출처가 같이 안 따라온다.');
    console.log('');
  }

  console.log('⛔ 「보통 이렇다」·「그럴 것이다」는 이 표에 못 들어온다.');
  console.log('⭐ ③은 「인용이 있나」가 아니라 **「그 방법의 알려진 한계가 적혀 있나」**다 —');
  console.log('   학술적 근거를 쓴다는 것은 권위를 빌리는 것이 아니라 **한계를 물려받는 것**이다.');
  console.log('⚠ 이 자는 세기만 한다. 채우는 것은 사람이 자리마다 한다.');
}
