/* 🔴 빨강 넷 중 둘은 **표식이 주석에서 뽑혔다.**
     「궁으로 본」  저장소 4곳 — 주석 밖 **0곳** · 라이브 0곳
     「전문용어」   저장소 6곳 — 주석 밖 **0곳** · 라이브 0곳
   손님 글자에 없는 말로 세니 무엇을 고쳐도 통과가 안 된다. **못 낼 수밖에 없는 검사**다.
   ⛔ 자를 무르게 고치는 것이 아니다. **손님이 실제로 읽는 글자**로 바꾼다 —
      가족운   saju.html:2786~2789 이 그리는 「조상궁·부모궁·배우자궁·자식궁」
      용어해설 saju.html:4749~4751 이 그리는 「일원(日元)·격국(格局)·상신(相神)」
   ⛔ 최소 개수는 안 낮춘다. 1 그대로다. */
import fs from 'node:fs';

const 길 = 'C:\\Users\\USER\\Documents\\GitHub\\dataeconomics\\docs\\필수품-표.tsv';
const 전 = fs.readFileSync(길, 'utf8');
const 줄 = 전.split(/\r?\n/);
const 머리 = 줄[0].split('\t');
const i표식 = 머리.indexOf('세는 표식');
const i무엇 = 머리.indexOf('무엇');

const 바꿀것 = [
  ['궁으로 본 가족운 — 일반에서도', '배우자궁'],
  ['전문용어해설이 살아 있다', '상신(相神)'],
];

let 고침 = 0;
const 새줄 = 줄.map((l) => {
  if (!l.trim() || l.startsWith('#')) return l;
  const c = l.split('\t');
  for (const [무엇, 새표식] of 바꿀것) {
    if (c[i무엇] !== 무엇) continue;
    console.log('  ' + 무엇);
    console.log('     표식  「' + c[i표식] + '」  →  「' + 새표식 + '」');
    c[i표식] = 새표식; 고침++;
    return c.join('\t');
  }
  return l;
});
if (고침) fs.writeFileSync(길, 새줄.join('\n'), 'utf8');
console.log('\n고친 줄 ' + 고침 + '개');
