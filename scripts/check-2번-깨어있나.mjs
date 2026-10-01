#!/usr/bin/env node
/**
 * check-2번-깨어있나.mjs — **2번이 한도에 걸려 멈춰 있지 않은가.**
 *
 * 🔴🔴 사장님 지시 (2026-10-02, 원문)
 *   > 「**2번 상황(You've hit your weekly limit · resets 12am (Asia/Seoul) 이때 깨워서 일 시라켜**」
 *
 * 2번이 주간 한도에 걸렸다. 리셋은 자정(Asia/Seoul)이다.
 * ⛔ 「자정에 깨워야지」를 내 기억에 맡기지 않는다 — 기억은 창이 바뀌면 사라진다.
 *
 * 🔴 사장님이 바로잡아 주신 것 — 나는 「어느 요일에 풀리는지 모른다」고 적었는데,
 *   사장님 말씀: 「**오늘 자정이겠지**」 · 「**요일이나 날짜가 안써있잖아**」
 *   ⇒ 리셋 안내에 날짜·요일이 없다는 것은 **오늘 자정**이라는 뜻이다.
 *     모르는 것이 아니라 읽을 줄 몰랐던 것이다. 그래서 깨울 때를 아래에 박아 둔다.
 *
 * ⚠ 자정을 지나고도 조용하면 날마다 다시 켜진다 — 한 번 놓쳐도 다음 날 또 잡는다.
 *
 * 2번이 멈춰 있는 동안 내가 할 일
 *   ① 소급이 안 되는 2번 몫은 **내가 대신 돌린다** (한경컨센서스 등)
 *   ② 세션간 메모에 2번 앞으로 남겨 둔다 — 복귀하면 읽는다
 *   ③ 이 자를 두 시간 자물쇠에 걸어 둔다
 *
 * 쓰는 법
 *   node scripts/check-2번-깨어있나.mjs
 *   node scripts/check-2번-깨어있나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 소통길 = path.join(뿌리, 'docs', '매시소통.tsv');
export const 참는시간 = 20;   /* 스무 시간 넘게 조용하면 멈춘 것으로 본다 */

/* 🔴 사장님이 못 박아 주신 깨울 때 — 「오늘 자정」 (2026-10-02 에 받은 지시) */
export const 깨울때 = '2026-10-03 00:00';

/** 깨울 때가 됐나 */
export function 깨울때됐나(지금 = new Date()) {
  const t = 때읽기(깨울때);
  return t ? 지금 >= t : false;
}

/** 매시소통.tsv 에서 그 유닛이 마지막으로 적은 때 (KST 글자 그대로) */
export function 마지막적은때(글, 누구 = '2번') {
  const 줄들 = String(글 ?? '').split('\n').filter(Boolean);
  for (let i = 줄들.length - 1; i >= 0; i -= 1) {
    const 칸 = 줄들[i].split('\t');
    if (칸.length >= 2 && 칸[1].trim() === 누구) return 칸[0].trim();
  }
  return null;
}

/** 「2026-09-30 01:53」 → Date. ⛔ toISOString 쓰지 않는다 (이 PC 가 이미 KST) */
export function 때읽기(글자) {
  const m = String(글자 ?? '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}

/** 몇 시간째 조용한가 */
export function 조용한시간(마지막, 지금 = new Date()) {
  const t = 때읽기(마지막);
  if (!t) return null;
  return Math.floor((지금 - t) / 3600000);
}

/** 마지막으로 적은 뒤 «자정»을 몇 번 지났나 — 한도가 풀릴 기회가 몇 번 있었나 */
export function 지난자정수(마지막, 지금 = new Date()) {
  const t = 때읽기(마지막);
  if (!t) return null;
  const 날만 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((날만(지금) - 날만(t)) / 86400000);
}

export function 판정(마지막, 지금 = new Date()) {
  if (!마지막) return { 빛: '⬜', 말: '2번이 적은 줄을 못 찾았다 — 자를 먼저 본다', 깨울까: false };
  const 시간 = 조용한시간(마지막, 지금);
  const 자정 = 지난자정수(마지막, 지금);
  if (시간 == null) return { 빛: '⬜', 말: `때를 못 읽었다 (${마지막})`, 깨울까: false };
  if (시간 < 참는시간) return { 빛: '✅', 말: `${시간}시간 전에 적었다 — 깨어 있다`, 깨울까: false };
  return {
    빛: '🔴',
    말: `${시간}시간째 조용하다 (마지막 ${마지막}) · 그 뒤 자정을 ${자정}번 지났다`,
    깨울까: 자정 >= 1,
  };
}

/* ── 자가시험 ──────────────────────────────────────────────── */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패 += 1; console.log('🔴 ' + 이름); } };

  const 표 = '2026-09-29 21:39\t2번\t가\n2026-09-30 01:53\t2번\t나\n2026-10-01 10:00\t5번\t다\n';
  검('2번이 마지막으로 적은 때를 찾는다', 마지막적은때(표) === '2026-09-30 01:53');
  검('⛔ 남의 줄을 2번 것으로 읽지 않는다', 마지막적은때(표, '5번') === '2026-10-01 10:00');
  검('⛔ 없으면 null — 0 으로 메우지 않는다', 마지막적은때(표, '9번') === null && 마지막적은때(null) === null);

  const 지금 = new Date(2026, 9, 2, 8, 56);   /* 2026-10-02 08:56 */
  검('몇 시간째 조용한지 센다', 조용한시간('2026-10-02 00:56', 지금) === 8);
  검('⛔ 못 읽는 때는 null', 조용한시간('말도안됨', 지금) === null);

  검('지난 자정 수를 센다', 지난자정수('2026-09-30 01:53', 지금) === 2);
  검('같은 날이면 0번', 지난자정수('2026-10-02 01:00', 지금) === 0);

  검('✅ 금방 적었으면 깨어 있다', 판정('2026-10-02 06:00', 지금).빛 === '✅');
  검('🔴 스무 시간 넘게 조용하면 빨강', 판정('2026-09-30 01:53', 지금).빛 === '🔴');
  검('🔴 자정을 지났으면 «깨울 때»라고 말한다', 판정('2026-09-30 01:53', 지금).깨울까 === true);
  검('⛔ 같은 날 안이면 아직 깨울 때가 아니다', 판정('2026-10-01 10:00', new Date(2026, 9, 1, 23, 0)).깨울까 === false);
  검('⛔ 못 찾으면 자를 보라고 말한다', 판정(null).빛 === '⬜');

  /* 🔴 사장님 「오늘 자정이겠지」 — 깨울 때를 박아 두었다 */
  검('깨울 때 전에는 아직이다', 깨울때됐나(new Date(2026, 9, 2, 23, 59)) === false);
  검('🔴 오늘 자정이 지나면 깨울 때다', 깨울때됐나(new Date(2026, 9, 3, 0, 0)) === true);
  검('그 뒤로도 계속 깨울 때다', 깨울때됐나(new Date(2026, 9, 5, 9, 0)) === true);

  console.log(`\n${실패 === 0 ? '✅' : '🔴'} 자가시험 ${통과 + 실패}개 중 통과 ${통과}개`);
  process.exit(실패 === 0 ? 0 : 1);
}

/* ── 실제로 잰다 ───────────────────────────────────────────── */
const 글 = fs.existsSync(소통길) ? fs.readFileSync(소통길, 'utf8') : '';
const 마지막 = 마지막적은때(글);
const 것 = 판정(마지막);

console.log('■ 2번이 깨어 있나 — 주간 한도(resets 12am Asia/Seoul) 때문에 본다\n');
console.log(`   ${것.빛} ${것.말}`);
console.log(`   깨울 때 — ${깨울때} (사장님: 「오늘 자정이겠지」)`
  + `  ${깨울때됐나() ? '→ 🔴 지났다' : '→ 아직'}`);

if (것.깨울까 || (깨울때됐나() && 것.빛 === '🔴')) {
  console.log('\n🔴 **깨울 때다.** 자정이 지났으니 한도가 풀렸을 수 있다.');
  console.log('   ① 2번 창이 떠 있으면 그리로 부른다 (ListAgents → SendMessage)');
  console.log('   ② 꺼져 있으면 세션간 메모에 남긴다 — 복귀하면 읽는다');
  console.log('   ③ 소급이 안 되는 2번 몫은 «내가 대신» 돌린다 (한경컨센서스 등)');
  console.log('      node scripts/check-archive-freshness.mjs 로 빠진 것을 먼저 본다');
  process.exitCode = 1;
}
