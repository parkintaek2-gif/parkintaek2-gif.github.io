#!/usr/bin/env node
/**
 * hoegwi-check.mjs — **한 번 만들어 컨펌받은 것이 사라지는 것을 막는다.**
 *
 * 🔴 사장님(2026-08-14):
 *   *「전문용어 해석처럼 **힘들게 만들고 내가 컨펌까지 했는데 그걸 빼먹고 후퇴하는 게 비일비재하다.**
 *     그러지 않도록 **강력한 조치**를 취해」*
 *
 * ⛔ 왜 사라지나 — **아무도 「아직 있나」를 묻지 않기 때문이다.**
 *    만들 때는 검사를 붙인다. 그런데 그 검사는 「잘 만들었나」만 본다.
 *    화면을 갈아엎거나 자리를 옮기면 부품이 조용히 빠지는데, 그때 빨간불이 되는 자가 없었다.
 *    실제로 용어 부록이 그렇게 사라졌고, 아무도 몇 주 동안 몰랐다.
 *
 * ⭐ 그래서 이 자는 **「잘 만들었나」를 안 본다. 「아직 있나」만 본다.**
 *    확정목록(docs/확정목록.tsv)에 적힌 것이 하나라도 없어지면 **멈춘다**(종료코드 2).
 *
 * ⛔ **배포 전에 반드시 돌린다.** 빨간불이면 배포하지 않는다.
 *
 * 쓰는 법  node scripts/hoegwi-check.mjs        /  --selftest
 */
import fs from 'node:fs';

/** 한 줄이 아직 살아 있나 — 파일이 있고, 그 안에 있어야 할 글자가 있나 */
export function 살아있나(읽기, 줄) {
  const 글 = 읽기(줄['어디서 확인하나']);
  if (글 == null) return { 산다: false, 까닭: '파일이 없다' };
  if (!글.includes(줄['있어야 할 글자'])) return { 산다: false, 까닭: '글자가 사라졌다' };
  return { 산다: true, 까닭: '' };
}

export function 세기(결과들) {
  return { 모두: 결과들.length, 죽은것: 결과들.filter((r) => !r.산다).length };
}

if (process.argv.includes('--selftest')) {
  const 가짜 = (있는것) => (곳) => (곳 in 있는것 ? 있는것[곳] : null);
  const 시험 = [
    [살아있나(가짜({ 'a.js': 'hello world' }), { '어디서 확인하나': 'a.js', '있어야 할 글자': 'hello' }).산다,
      true, '파일에 그 글자가 있으면 산 것이다'],
    [살아있나(가짜({ 'a.js': 'hello world' }), { '어디서 확인하나': 'a.js', '있어야 할 글자': 'zzz' }),
      { 산다: false, 까닭: '글자가 사라졌다' }, '⛔ 글자가 빠지면 죽은 것이다'],
    [살아있나(가짜({}), { '어디서 확인하나': 'a.js', '있어야 할 글자': 'hello' }),
      { 산다: false, 까닭: '파일이 없다' }, '⛔ 파일째 없어져도 잡는다'],
    [세기([{ 산다: true }, { 산다: false }]).죽은것, 1, '죽은 것을 센다'],
    [세기([]).모두, 0, '빈 것도 센다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) {
      console.error(`❌ ${이름}  — 잰 것 ${JSON.stringify(잰것)}`);
      틀림++;
    }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 후퇴 막는 자 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

const 읽기 = (곳) => { try { return fs.readFileSync(곳, 'utf8'); } catch { return null; } };
const 글 = fs.readFileSync('docs/확정목록.tsv', 'utf8').trim().split('\n');
const 머리 = 글[0].split('\t');
const 줄들 = 글.slice(1).map((l) => Object.fromEntries(l.split('\t').map((v, i) => [머리[i], v])));

console.log(`\n사장님이 컨펌하신 것 ${줄들.length}가지 — 아직 살아 있나\n`);
const 결과들 = [];
for (const 줄 of 줄들) {
  const r = 살아있나(읽기, 줄);
  결과들.push(r);
  console.log(`  ${r.산다 ? '✅' : '🔴'} ${String(줄.번호).padStart(2)} ${줄.무엇}${r.산다 ? '' : `   ⛔ ${r.까닭}`}`);
}
const s = 세기(결과들);
if (s.죽은것) {
  console.log(`\n🔴🔴 **${s.죽은것}가지가 사라졌습니다.**`);
  console.log('⛔ 배포하지 마십시오. 되살리고 다시 돌리십시오.');
  console.log('⛔ 「이번엔 안 쓰니까 뺐다」는 까닭이 되지 않습니다 — 사장님이 컨펌하신 것입니다.');
} else {
  console.log(`\n✅ ${s.모두}가지 모두 살아 있습니다.`);
}
process.exit(s.죽은것 ? 2 : 0);
