#!/usr/bin/env node
/**
 * 발행된 기사의 숫자를 **다시 계산한다.**
 *
 *   node scripts/recheck-articles.mjs
 *
 * ── 왜 만드나 ────────────────────────────────────────────────────
 * 2026-08-05 에 `합치기` 버그를 고쳤다 — 부문별로 신고한 회사의 직원 수가
 * **첫 부문만** 세어지고 있었다(삼성전자 50,817 vs 실제 128,881).
 *
 * 그 숫자로 **기사 두 편을 이미 발행했다.**
 *   · korea-tenure-gender-gap             1,066개사 · 1,181,531명 · 2.32년
 *   · korea-listed-pay-holding-company-trap  1,560개사 · 1,452,844명
 *
 * 기사에 박힌 숫자를 **눈대중으로 고치지 않는다.** 같은 정의로 다시 계산해
 * 옛 값과 나란히 놓고, 바뀐 것만 고친다.
 *
 * ⚠ 정의는 기사의 methodology 를 그대로 옮긴 것이다. 마음대로 바꾸지 않는다 —
 *   정의를 바꾸면 「고친 것」이 아니라 「다른 것」이 된다.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 파일 = path.resolve('archive/raw/dart-employment/employment-2025.ndjson');

/** 기사 methodology 그대로 — 최소 100명, 범위 밖 값은 제외(고치지 않는다) */
const 최소인원 = 100;
const 근속상한 = 35;            // 년
const 급여상한 = 1_000_000_000; // 원
const 급여하한 = 10_000_000;    // 원

const 범위밖 = (r) =>
  (r.근속 != null && r.근속 > 근속상한) ||
  (r.근속남 != null && r.근속남 > 근속상한) ||
  (r.근속여 != null && r.근속여 > 근속상한) ||
  [r.급여남, r.급여여].some((v) => v != null && (v > 급여상한 || v < 급여하한));

const 수치 = (n) => (n == null ? '—' : n.toLocaleString('en-US'));

function main() {
  const 전체 = readFileSync(파일, 'utf8').split('\n').filter((x) => x.trim()).map((l) => JSON.parse(l));
  const 정상 = 전체.filter((r) => !범위밖(r));
  console.log(`원자료 ${수치(전체.length)}개사 · 범위 검사 통과 ${수치(정상.length)} (제외 ${전체.length - 정상.length})\n`);

  /* ── ① 성별 근속 격차 기사 ─────────────────────────────────── */
  const 격차대상 = 정상.filter((r) =>
    r.인원 != null && r.인원 >= 최소인원 && r.근속남 != null && r.근속여 != null);
  const 남길다 = 격차대상.filter((r) => r.근속남 > r.근속여).length;
  const 여길다 = 격차대상.filter((r) => r.근속남 < r.근속여).length;
  const 같다 = 격차대상.filter((r) => r.근속남 === r.근속여).length;
  const 총인원 = 격차대상.reduce((s, r) => s + r.인원, 0);
  const 가중격차 = 격차대상.reduce((s, r) => s + (r.근속남 - r.근속여) * r.인원, 0) / 총인원;
  const 단순격차 = 격차대상.reduce((s, r) => s + (r.근속남 - r.근속여), 0) / 격차대상.length;
  const 정렬 = 격차대상.map((r) => r.근속남 - r.근속여).sort((a, b) => a - b);
  const 중앙격차 = 정렬[Math.floor(정렬.length / 2)];

  console.log('■ ① korea-tenure-gender-gap');
  const 줄 = (설명, 옛, 새) => {
    const 같은가 = String(옛) === String(새);
    console.log(`   ${같은가 ? ' ' : '⚠'} ${설명.padEnd(28)} 옛 ${String(옛).padStart(12)}  →  새 ${String(새).padStart(12)}`);
  };
  줄('표본 회사 수', '1,066', 수치(격차대상.length));
  줄('표본 직원 수', '1,181,531', 수치(총인원));
  줄('남 > 여 회사', '832', 수치(남길다));
  줄('여 > 남 회사', '212', 수치(여길다));
  줄('같음', '22', 수치(같다));
  줄('남 > 여 비율(%)', '78.0', (남길다 / 격차대상.length * 100).toFixed(1));
  줄('인원가중 격차(년)', '2.32', 가중격차.toFixed(2));
  줄('단순평균 격차(년)', '1.87', 단순격차.toFixed(2));
  줄('중앙값 격차(년)', '1.4', 중앙격차.toFixed(1));

  /* ── ② 급여·지주회사 기사 ──────────────────────────────────── */
  const 급여평균 = (r) => {
    const 남 = r.급여남, 여 = r.급여여, ㄴ = r.남, ㅇ = r.여;
    if (남 != null && 여 != null && ㄴ && ㅇ) return (남 * ㄴ + 여 * ㅇ) / (ㄴ + ㅇ);
    return 남 ?? 여 ?? null;
  };
  const 급여대상 = 정상.filter((r) => r.인원 != null && r.인원 >= 최소인원 && 급여평균(r) != null);
  const 급여총인원 = 급여대상.reduce((s, r) => s + r.인원, 0);
  const 상위 = [...급여대상].sort((a, b) => 급여평균(b) - 급여평균(a)).slice(0, 20);

  console.log('\n■ ② korea-listed-pay-holding-company-trap');
  줄('표본 회사 수', '1,560', 수치(급여대상.length));
  줄('표본 직원 수', '1,452,844', 수치(급여총인원));
  줄('상위10 중 200명 미만', '4', String(상위.slice(0, 10).filter((r) => r.인원 < 200).length));
  줄('상위20 중 200명 미만', '9', String(상위.filter((r) => r.인원 < 200).length));

  console.log('\n   상위 10 (급여 순) — 기사 표와 대조한다');
  상위.slice(0, 10).forEach((r, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. ${String(r.영문 ?? r.이름).slice(0, 38).padEnd(38)} ` +
      `${(급여평균(r) / 1e6).toFixed(0).padStart(4)}백만원  ${수치(r.인원).padStart(8)}명`);
  });

  /* 기사가 이름을 대고 쓴 회사들 — 그 문장이 아직 맞는지 본다 */
  console.log('\n   기사가 이름을 댄 회사');
  for (const 찾을 of ['KB', 'Lingseo', 'Alchera', 'SJG', 'Hanon', 'Daewoo E&C']) {
    const r = 정상.find((x) => new RegExp(찾을.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(String(x.영문 ?? '')));
    if (!r) { console.log(`   ${찾을.padEnd(12)} (못 찾음)`); continue; }
    console.log(`   ${찾을.padEnd(12)} ${String(r.영문).slice(0, 32).padEnd(32)} 인원 ${수치(r.인원).padStart(8)} · 근속 남 ${r.근속남 ?? '—'} / 여 ${r.근속여 ?? '—'}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
