#!/usr/bin/env node
/**
 * 「부문별 신고」 기사의 숫자를 **원본에서 다시 뽑아** 대조한다.
 *
 *   node scripts/verify-headcount-article.mjs
 *
 * ⚠ 판정 규칙(`합계행인가`)은 **정본을 import 한다.** 여기서 다시 적지 않는다 —
 *   2026-08-05 에 같은 실수를 세 번 했다(합치기·이상점검·이것).
 *   규칙이 두 벌이면 어느 쪽이 맞는지 아무도 모른다.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { 합계행인가 } from './collect-tenure.mjs';

const 파일 = 'archive/raw/dart-employment/employment-2025.ndjson';
/** 저장한 원행 → DART 응답 모양. `합계행인가` 는 `fo_bbm` 을 본다 */
const 되돌리기 = (x) => ({ fo_bbm: x.부문, sexdstn: x.성별, sm: x.합 });
const 수 = (x) => { const v = Number(String(x?.sm ?? '').replace(/[^0-9]/g, '')); return Number.isFinite(v) ? v : 0; };

function main() {
  const 행 = readFileSync(파일, 'utf8').split('\n').filter((x) => x.trim()).map((l) => JSON.parse(l));
  const 있음 = 행.filter((r) => Array.isArray(r.원행));

  const 부문여럿 = 있음.filter((r) => new Set(r.원행.map((x) => String(x.부문 ?? ''))).size > 1);
  const 합계있음 = 부문여럿.filter((r) => r.원행.map(되돌리기).some(합계행인가));

  let 첫줄합 = 0, 실제합 = 0, n = 0;
  for (const r of 부문여럿) {
    const 원 = r.원행.map(되돌리기);
    const 합계행 = 원.filter(합계행인가);
    const 쓸것 = 합계행.length ? 합계행 : 원;
    const 남 = (a) => a.filter((x) => /남/.test(String(x.sexdstn ?? '')));
    const 여 = (a) => a.filter((x) => /여/.test(String(x.sexdstn ?? '')));
    const 맞는값 = 남(쓸것).reduce((s, x) => s + 수(x), 0) + 여(쓸것).reduce((s, x) => s + 수(x), 0);
    const 첫줄값 = 수(남(원)[0]) + 수(여(원)[0]);
    if (맞는값 > 0 && 첫줄값 > 0 && 맞는값 !== 첫줄값) { 첫줄합 += 첫줄값; 실제합 += 맞는값; n++; }
  }

  console.log('■ 기사에 쓸 숫자 (원본에서 다시 뽑음)');
  console.log(`   신고한 회사              ${행.length.toLocaleString()}`);
  console.log(`   부문이 여럿인 회사         ${부문여럿.length.toLocaleString()}`);
  console.log(`     그중 합계 줄 있는 곳     ${합계있음.length.toLocaleString()}`);
  console.log(`     합계 없이 부문만         ${(부문여럿.length - 합계있음.length).toLocaleString()}`);
  console.log(`   차이가 나는 회사           ${n.toLocaleString()}`);
  console.log(`   첫 줄만 읽은 총계          ${첫줄합.toLocaleString()}`);
  console.log(`   실제 총계                ${실제합.toLocaleString()}`);
  console.log(`   빠뜨린 사람               ${(실제합 - 첫줄합).toLocaleString()}  (${((실제합 - 첫줄합) / 실제합 * 100).toFixed(1)}%)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
