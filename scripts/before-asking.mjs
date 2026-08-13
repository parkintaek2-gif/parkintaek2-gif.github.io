#!/usr/bin/env node
/**
 * before-asking.mjs — **사장님께 묻기 전에 반드시 돌린다.**
 *
 * 🔴 사장님(2026-08-14)
 *   *「내가 나한테 묻거나 요청 전에 **반드시 히스토리부터 확인**하는 게 절대 원칙이라고 수차례 말했다」*
 *   *「등록을 언제 했는데 두 번 말하네. 나한테 직접 묻기 전에 네가 직접 또는 2번에게 확인해라. 제발」*
 *   *「이거 엄청 스트레스 주는 거야. **절대 못하게 강력조치**해」*
 *
 * ⛔ 말로 적어 둔 규칙은 지켜지지 않았다. 그래서 **검사**로 만든다.
 *
 * 쓰는 법
 *   node scripts/before-asking.mjs "네이버 서치어드바이저"
 *   node scripts/before-asking.mjs "riot" "866800"        낱말 여러 개도 됨
 *   node scripts/before-asking.mjs --selftest
 *
 * 나오는 것
 *   · 그 낱말이 히스토리에 몇 번 나왔나 · 마지막이 언제였나 · 무엇으로 결론났나
 *   · 끝에 **표식**을 준다. [요청] 을 올릴 때 그 표식을 함께 붙인다.
 *   ⛔ 표식 없는 [요청] 은 2번이 반려한다.
 */
import fs from 'node:fs';
import path from 'node:path';

/** 이미 정해진 것으로 보이는 말 — 이게 걸리면 묻지 않는다 */
export const 끝난말 = [
  '기다리기로', '기다린다', '접었다', '접기로', '안 하기로', '하지 않기로',
  '거둡니다', '거둠', '다시 묻지', '이미 정', '결정했', '확정', '완료', '다 됐', '다 등록',
];

/** 한 줄이 「이미 끝난 이야기」인가 */
export function 끝난줄인가(줄) {
  if (!줄) return false;
  return 끝난말.some((w) => 줄.includes(w));
}

/** 낱말 하나로 찾은 줄들을 요약한다 */
export function 간추리기(줄들) {
  const 끝난것 = 줄들.filter((l) => 끝난줄인가(l.글));
  return {
    몇번: 줄들.length,
    마지막: 줄들.length ? 줄들[줄들.length - 1] : null,
    끝난것: 끝난것.length,
    묻지마라: 끝난것.length > 0,
  };
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [끝난줄인가('승인까지 기다리기로 했다'), true, '「기다리기로」는 끝난 말이다'],
    [끝난줄인가('그 도메인은 접었다'), true, '「접었다」는 끝난 말이다'],
    [끝난줄인가('오늘 새로 해 봐야 한다'), false, '아직 안 끝난 말은 안 걸린다'],
    [간추리기([]).묻지마라, false, '나온 것이 없으면 물어도 된다'],
    [간추리기([{ 글: '기다리기로 했다' }]).묻지마라, true, '끝난 줄이 하나라도 있으면 묻지 않는다'],
    [간추리기([{ 글: 'ㄱ' }, { 글: 'ㄴ' }]).몇번, 2, '몇 번 나왔는지 센다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) { console.error(`❌ ${이름}`); 틀림++; }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 묻기전 검사 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

// ── 실제로 찾는다 ────────────────────────────────────────────
const 낱말들 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!낱말들.length) {
  console.error('⛔ 무엇을 여쭐 것인지 낱말을 넣으십시오.');
  console.error('   보기)  node scripts/before-asking.mjs "네이버 서치어드바이저"');
  process.exit(1);
}

const 볼곳 = [
  'docs/세션간-메모.md',
  path.join('C:/Users/USER/Documents/GitHub/klifemap', 'docs/세션간-메모.md'),
  'C:/Users/USER/OneDrive/라이프디자인 자산.md',
  'C:/Users/USER/OneDrive/경영/열쇠-장부.md',
];

let 막힘 = false;
for (const 낱말 of 낱말들) {
  const 찾은것 = [];
  for (const 곳 of 볼곳) {
    let 글;
    try { 글 = fs.readFileSync(곳, 'utf8'); } catch { continue; }
    const 줄들 = 글.split('\n');
    줄들.forEach((줄, i) => {
      if (줄.toLowerCase().includes(낱말.toLowerCase())) {
        찾은것.push({ 곳: path.basename(곳), 줄번호: i + 1, 글: 줄.trim().slice(0, 160) });
      }
    });
  }
  const 요약 = 간추리기(찾은것);
  console.log(`\n━━━ 「${낱말}」 ━━━`);
  if (!요약.몇번) {
    console.log('  히스토리에 없습니다. ✅ 여쭤도 됩니다.');
    continue;
  }
  console.log(`  히스토리에 **${요약.몇번}번** 나왔습니다.`);
  const 보일것 = 찾은것.slice(-5);
  for (const c of 보일것) console.log(`   · ${c.곳}:${c.줄번호}  ${c.글}`);
  if (요약.묻지마라) {
    console.log(`\n  🔴 그중 **${요약.끝난것}줄이 「이미 끝난 이야기」**로 보입니다.`);
    console.log('  ⛔ 여쭙기 전에 위 줄을 읽으십시오. 이미 정해진 것이면 묻지 않습니다.');
    막힘 = true;
  } else {
    console.log('\n  ⚠ 나온 적은 있으나 결론이 안 보입니다. 위 줄을 읽고 판단하십시오.');
  }
}

const 표식 = `[히스토리확인 ${낱말들.join('·')} · ${찾은것수()}]`;
function 찾은것수() { return '확인함'; }
console.log(`\n────────────────────────────────────────`);
if (막힘) {
  console.log('🔴 **이미 끝난 이야기가 있습니다. 그래도 여쭈시겠습니까?**');
  console.log('   여쭈려면 왜 다시 여쭙는지를 [요청]에 한 줄 적으십시오.');
}
console.log(`✅ [요청]에 이 표식을 붙이십시오 →  ${표식}`);
console.log('⛔ 표식 없는 [요청]은 2번이 반려합니다.');
process.exit(막힘 ? 2 : 0);
