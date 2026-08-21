/* 4번 몫 세 줄을 필수품 표에 박는다. 사장님 지시 8/17 「자기 지면을 자기가 박는다」.
   ⭐ 표식은 지어내지 않았다 — 라이브 지면을 떠서 script·style 을 걷어낸 뒤 센 값이다.
      https://klifemap.ai/mingli-sungmyung.html (200) · 손님 눈에 닿는 9,367자 기준
        성명학 5회 · 생년월일 1회 · 용신 3회   → 셋 다 지금 통과한다(막지 않는다)
   ⛔ 「잰 자리」는 나 아닌 1번으로 적는다. 자기가 자기를 재면 안 막힌다. */
import fs from 'node:fs';

const 길 = 'C:\\Users\\USER\\Documents\\GitHub\\dataeconomics\\docs\\필수품-표.tsv';
const 전 = fs.readFileSync(길, 'utf8');

const 주소 = 'https://klifemap.ai/mingli-sungmyung.html';
const 줄들 = [
  ['4번', '성명학 감정 지면이 살아 있다', 주소, '성명학', '1', '4번', '1번', '보여야'],
  ['4번', '이름을 넣을 자리가 있다', 주소, '생년월일', '1', '4번', '1번', '보여야'],
  ['4번', '사주에서 뽑은 용신을 싣는다', 주소, '용신', '1', '4번', '1번', '보여야'],
];

let 새것 = 전.endsWith('\n') ? 전 : 전 + '\n';
let 더한수 = 0;
for (const r of 줄들) {
  const 줄 = r.join('\t');
  if (새것.includes(줄)) { console.log('   이미 있음 — ' + r[1]); continue; }
  새것 += 줄 + '\n';
  더한수++;
  console.log('   박음  ' + r[1] + '  · 표식 「' + r[3] + '」 · 최소 ' + r[4] + ' · ' + r[7]);
}
fs.writeFileSync(길, 새것, 'utf8');

const 셈 = 새것.trimEnd().split('\n');
console.log('\n더한 줄 ' + 더한수 + '개 · 표 모두 ' + (셈.length - 1) + '줄(머리글 뺀 것)');
const 내줄 = 셈.filter((l) => l.startsWith('4번\t')).length;
console.log('4번 줄 ' + 내줄 + '개');
