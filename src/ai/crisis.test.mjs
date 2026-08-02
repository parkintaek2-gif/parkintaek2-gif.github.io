/**
 * crisis.test.mjs — 위기 감지 시험
 *
 * 이 모듈은 **놓치면 사람이 다친다.** 그래서 시험을 붙여 둔다.
 * 특히 **관용구 오탐**을 확인한다 — 오탐이 많으면 아무도 이 모듈을 안 켠다.
 *
 * 실행: node src/ai/crisis.test.mjs
 */
import { detect, screen } from './crisis.mjs';

let pass = 0;
let fail = 0;

function t(label, text, want) {
  const got = detect(text).level;
  if (got === want) {
    pass++;
  } else {
    fail++;
    console.log(`  ✗ ${label}\n     "${text}"\n     기대 ${want} · 실제 ${got}`);
  }
}

console.log('\n[ 걸려야 하는 것 — 직접 표현 ]');
t('한국어 자살', '요즘 자살 생각이 자꾸 들어요', 'acute');
t('한국어 사라지고 싶다', '그냥 사라지고 싶어요', 'acute');
t('한국어 자해', '손목을 그었어요', 'acute');
t('일본어', 'もう死にたい', 'acute');
t('중국어 번체', '我不想活了', 'acute');
t('중국어 간체', '想死', 'acute');
t('영어', "I want to kill myself", 'acute');

console.log('\n[ 걸려야 하는 것 — 약한 신호 둘 이상 ]');
t('둘 겹침', '더는 버틸 수 없어요. 아무도 모르고요.', 'acute');
t('하나만', '요즘 아무 의미 없는 것 같아요', 'watch');

console.log('\n[ 걸리면 안 되는 것 — 관용구 ]');
t('배고파 죽겠다', '아 배고파 죽겠다', 'none');
t('피곤해 죽겠다', '오늘 피곤해 죽겠어요', 'none');
t('웃겨 죽겠다', '진짜 웃겨 죽겠네', 'none');

console.log('\n[ 걸리면 안 되는 것 — 평범한 상담 ]');
t('진로 고민', '수학이 너무 어려워서 이과를 못 가겠어요', 'none');
t('성적 이야기', '이번 시험 망해서 속상해요', 'none');
t('빈 입력', '', 'none');

console.log('\n[ 안내문 ]');
const g = screen('사라지고 싶어요', { locale: 'ko', region: 'KR', withGuardian: true });
const ok =
  g && g.stopConversation === true && /109/.test(g.text) && /1388/.test(g.text) && /보호자께/.test(g.text);
if (ok) pass++;
else {
  fail++;
  console.log('  ✗ 한국어 안내문에 109·1388·보호자 안내가 다 들어가야 한다\n' + (g?.text ?? '(없음)'));
}

// 확인 안 된 지역에 한국 번호를 주면 안 된다
const tw = screen('想死', { locale: 'zh', region: 'TW' });
if (tw && !/109|1388/.test(tw.text)) pass++;
else {
  fail++;
  console.log('  ✗ 대만 지역에 한국 번호가 나갔다 — 확인 안 된 지역엔 응급실 안내만 한다');
}

// 위로로 넘기지 않는다
const soothing = /괜찮아질|괜찮을 거|시간이 해결/;
if (g && !soothing.test(g.text)) pass++;
else {
  fail++;
  console.log('  ✗ 안내문에 위로 문구가 들어갔다 — 위로는 안내를 늦춘다');
}

console.log(`\n통과 ${pass} · 실패 ${fail}`);
process.exit(fail ? 1 : 0);
