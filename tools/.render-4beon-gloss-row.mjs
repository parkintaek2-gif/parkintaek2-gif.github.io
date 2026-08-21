/* 🔴 필수품 표의 한 줄이 **영원히 빨강**이다 — 자가 주석을 겨누고 있다.
     줄  「1번 · 전문용어해설이 살아 있다 · saju.html · 표식 **전문용어** · 1 · 보여야」
     ● 실측 — 저장소 saju.html 의 「전문용어」 6곳이 **전부 주석 안**이다.
             서버가 주석을 걷어 내보내므로 라이브 원문에 **0곳**. 곧 이 칸은 통과할 수 없다.
     ⭐ 그리고 바로 옆에 이미 통과하는 줄이 있다 — 「전문용어 부록 — saju · termAppendix · 1/1 ✅」
        곧 이 줄은 **못 통과하는 중복**이다.
   ⛔ 지우지 않는다(끄는 것은 내 판단 자리가 아니다). 대신 **아직 아무도 안 지키는 칸**으로 바꾼다 —
      「saju.html 이 term-glossary.js 를 실제로 불러오는가」.
      이 script 한 줄이 빠지면 부록이 **조용히** 죽는다. 사장님이 보신 그 고장이 정확히 그것이다.
   ⬜ 못 잰 것 — 부록이 화면에 **그려지는지**는 판이 도는 뒤라 내 창(크롬 안 붙음)으로 못 잰다. */
import fs from 'node:fs';

const 길 = 'C:\\Users\\USER\\Documents\\GitHub\\dataeconomics\\docs\\필수품-표.tsv';
const 전 = fs.readFileSync(길, 'utf8');

const 옛 = '1번\t전문용어해설이 살아 있다\thttps://klifemap.ai/saju.html\t전문용어\t1\t1번\t4번\t보여야';
const 새 = '4번\t부록 부품을 지면이 실제로 불러온다\thttps://klifemap.ai/saju.html\tterm-glossary.js\t1\t4번\t7번\t';

if (!전.includes(옛)) {
  console.log('🔴 그 줄을 못 찾았다 — 손대지 않는다');
  for (const l of 전.split(/\r?\n/)) if (l.includes('전문용어')) console.log('   지금 있는 줄: ' + l);
  process.exit(1);
}
fs.writeFileSync(길, 전.replace(옛, 새), 'utf8');
console.log('바꿈');
console.log('  전 ▸ ' + 옛.split('\t').slice(1, 5).join(' · '));
console.log('  후 ▸ ' + 새.split('\t').slice(1, 5).join(' · '));

/* 새 칸이 지금 통과하는지 **바로 잰다** — 통과 못 하는 자를 또 박으면 같은 잘못이다 */
const 지우개 = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
const t = await (await fetch('https://klifemap.ai/saju.html?t=2')).text();
const 원문셈 = t.split('term-glossary.js').length - 1;
console.log('\n● 라이브 saju.html 원문에서 「term-glossary.js」 ' + 원문셈 + '곳  → ' + (원문셈 >= 1 ? '✅ 지금 통과한다' : '🔴 지금도 빨강이다'));
console.log('⬜ 다만 이 칸은 「부품이 지면에 닿는다」까지다. **부록이 그려지는지는 못 쟀다**(크롬 필요).');
