#!/usr/bin/env node
/**
 * bupum-check.mjs — **②「새로 만들고 예전 것 안 쓰기」를 막는다.**
 * 🔴 사장님 8/15: 네 기둥이 「강제적으로 시행되게」 되어야 한다.
 * ⭐ 이 자는 새 부품이 늘었는데 **부품 장부에 안 적혔으면** 빨간불을 켠다.
 */
import fs from 'node:fs';

export function 안적힌것(새파일들, 장부글) {
  if (!Array.isArray(새파일들)) return [];
  return 새파일들.filter((f) => f && !(장부글 || '').includes(f));
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [안적힌것(['a.mjs'], 'a.mjs 는 이런 일을 한다'), [], '장부에 있으면 통과'],
    [안적힌것(['b.mjs'], 'a.mjs 만 있다'), ['b.mjs'], '⛔ 장부에 없으면 잡는다'],
    [안적힌것([], '아무거나'), [], '새 부품이 없으면 0'],
    [안적힌것(['a.mjs', 'b.mjs'], 'a.mjs'), ['b.mjs'], '여럿 중 빠진 것만 잡는다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험)
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) { console.error(`❌ ${이름}`); 틀림++; }
  if (틀림) process.exit(1);
  console.log(`✅ 부품 장부 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

const 장부 = (() => { try { return fs.readFileSync('docs/부품장부.md', 'utf8'); } catch { return ''; } })();
const 새것 = fs.readdirSync('scripts').filter((f) => f.endsWith('.mjs'));
const 빠진것 = 안적힌것(새것, 장부);
console.log(`\n부품 ${새것.length}개 · 장부에 안 적힌 것 ${빠진것.length}개`);
for (const f of 빠진것) console.log(`  🔴 ${f}`);
if (빠진것.length) {
  console.log('\n⛔ docs/부품장부.md 에 한 줄씩 적으십시오 — 무엇을 하나 · 어떻게 부르나');
  console.log('⭐ 장부가 있어야 다음 사람이 **다시 만들지 않습니다**');
}
process.exit(빠진것.length ? 2 : 0);
