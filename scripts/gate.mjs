#!/usr/bin/env node
/**
 * gate.mjs — **하나의 관문.** 오늘 만든 자물쇠들을 여기서 다 부른다.
 *
 * 🔴 사장님(2026-08-15): 강제 조치에 넣을 것 —
 *    「① **해놓고선 누락**  ② **새로 만들고 예전 것 쓰기**
 *     ③ **히스토리부터 확인**  ④ **스스로 발전하기**」
 *
 * ⛔ 왜 묶는가 — 자물쇠를 여럿 만들어 놓고 **아무도 다 돌리지 않았습니다.**
 *    그것이 오늘 여덟 건의 뿌리이기도 합니다. 하나만 기억하면 되게 만듭니다.
 *
 * ⭐ 이 자는 **새 검사를 만들지 않습니다.** 있는 것을 부르기만 합니다 —
 *    새로 만드는 것이 곧 사장님이 지적하신 ②(새로 만들고 예전 것 안 쓰기)입니다.
 *
 * 쓰는 법
 *   node scripts/gate.mjs              다 돌린다
 *   node scripts/gate.mjs --배포전       하나라도 빨강이면 종료코드 2
 *   node scripts/gate.mjs --selftest
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

/** 관문 하나하나 — 새 검사를 만들지 않는다. 있는 것을 부른다 */
export const 관문들 = [
  // ⛔ 안 해야 할 둘
  { 이름: '⛔① 해놓고선 누락 — 컨펌한 것이 아직 있나', 자: 'scripts/hoegwi-check.mjs', 막나: true },
  { 이름: '⛔① 해놓고선 누락 — 결과물에 실렸나',       자: 'scripts/pilsupum-check.mjs', 막나: true },
  { 이름: '⛔② 새로 만들고 예전 것 안 쓰기 — 부품 장부', 자: 'scripts/bupum-check.mjs', 막나: false },
  // ✅ 해야 할 둘
  { 이름: '✅③ 히스토리부터 확인 — 묻기 전 검사',        자: 'scripts/before-asking.mjs', 막나: false },
  { 이름: '✅④ 스스로 발전 — 보고했나·메모 읽었나·낸것 0 아닌가', 자: 'scripts/bogo-gate.mjs', 막나: false },
];

/** 종료코드를 신호등으로 옮긴다 */
export function 불빛(코드, 막나) {
  if (코드 === 0) return { 빛: '✅', 막힘: false };
  if (막나) return { 빛: '🔴', 막힘: true };
  return { 빛: '🟡', 막힘: false };
}

export function 세기(결과들) {
  return {
    모두: 결과들.length,
    빨강: 결과들.filter((r) => r.빛 === '🔴').length,
    노랑: 결과들.filter((r) => r.빛 === '🟡').length,
  };
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [불빛(0, true), { 빛: '✅', 막힘: false }, '통과하면 초록'],
    [불빛(2, true), { 빛: '🔴', 막힘: true }, '⛔ 막는 자가 실패하면 빨강 — 배포를 세운다'],
    [불빛(2, false), { 빛: '🟡', 막힘: false }, '안 막는 자가 실패하면 노랑 — 알리되 안 세운다'],
    [세기([{ 빛: '🔴' }, { 빛: '🟡' }, { 빛: '✅' }]), { 모두: 3, 빨강: 1, 노랑: 1 }, '신호등을 센다'],
    [세기([]), { 모두: 0, 빨강: 0, 노랑: 0 }, '빈 것도 센다'],
    [관문들.every((g) => g.자 === null || typeof g.자 === 'string'), true, '관문 표가 성하다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) {
      console.error(`❌ ${이름}  — 잰 것 ${JSON.stringify(잰것)}`);
      틀림++;
    }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 관문 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

console.log('\n━━━ 관문 ━━━\n');
const 결과들 = [];
for (const g of 관문들) {
  if (!g.자) continue;
  if (!fs.existsSync(g.자)) {
    console.log(`  ⚠ ${g.이름}\n     자가 없습니다 — ${g.자}`);
    결과들.push({ 빛: '🟡' });
    continue;
  }
  const r = spawnSync(process.execPath, [g.자], { encoding: 'utf8' });
  const { 빛 } = 불빛(r.status ?? 1, g.막나);
  결과들.push({ 빛 });
  console.log(`  ${빛} ${g.이름}`);
  if (빛 !== '✅') {
    const 줄들 = (r.stdout || '').split('\n').filter((l) => /🔴|⛔|🟡/.test(l)).slice(0, 4);
    for (const l of 줄들) console.log(`       ${l.trim()}`);
  }
}

const s = 세기(결과들);
console.log(`\n빨강 ${s.빨강} · 노랑 ${s.노랑} · 모두 ${s.모두}`);
if (s.빨강) {
  console.log('⛔ **배포하지 마십시오.** 빨강을 끄고 다시 돌리십시오.');
} else if (s.노랑) {
  console.log('🟡 배포는 됩니다. 다만 노랑을 오늘 안에 끄십시오.');
} else {
  console.log('✅ 다 통과했습니다.');
}
console.log('\n⭐ 잊지 마십시오 — 사장님께 여쭙기 전에는  node scripts/before-asking.mjs "<낱말>"');
process.exit((process.argv.includes('--배포전') && s.빨강) ? 2 : 0);
