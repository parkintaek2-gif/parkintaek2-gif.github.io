import fs from 'node:fs';
import path from 'node:path';
import { 원고방, 원고가르기, 슬라이드나누기, 잘린곳찾기 } from './scripts/build-selfsaju-lecture-deck.mjs';
const 파일들 = fs.readdirSync(원고방).filter((f) => /^2권-원고-\d\d-/.test(f)).sort();
let 모두 = 0; let 장수 = 1;
for (const f of 파일들) {
  const 장들 = 슬라이드나누기(원고가르기(fs.readFileSync(path.join(원고방, f), 'utf8')));
  const 걸린 = 잘린곳찾기(장들);
  모두 += 걸린.length;
  for (const g of 걸린) console.log('  ' + String(장수 + g.번호) + '장  [' + (g.제목 || '').slice(0, 20) + ']  ' + g.글.slice(-44));
  장수 += 장들.length;
}
console.log('\n■ 잘린 줄 ' + 모두 + '개');
