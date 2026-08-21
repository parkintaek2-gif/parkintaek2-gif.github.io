/** 🔴 서울·부산이 태국판에서 빈칸이다. ⛔ 「없다」로 안 넘기고 실물에 물어본다 */
import fs from 'node:fs';

const d = JSON.parse(fs.readFileSync('archive/raw/wikipedia/sea-places.json', 'utf8'));
const t = JSON.parse(fs.readFileSync('archive/raw/wikipedia/sea-places.titles.json', 'utf8'));

console.log('① 자료에서 — 서울·부산의 판별 제목과 조회수');
for (const 이름 of ['Seoul', 'Busan', 'South Korea', 'Jeju Island']) {
  const x = d.people.find((y) => y.name === 이름);
  if (!x) { console.log(`   ${이름} 없음`); continue; }
  console.log(`   ${이름.padEnd(14)} 제목 ${JSON.stringify(x.titles)}`);
  console.log(`   ${''.padEnd(14)} 조회 ${JSON.stringify(x.views)}`);
}

console.log('\n② 제목 저장에 태국 제목이 몇이나 있나');
const th있는것 = Object.entries(t.제목).filter(([, v]) => v.th);
console.log(`   ${th있는것.length}곳`);
console.log(`   보기: ${th있는것.slice(0, 5).map(([q, v]) => `${t.이름[q] ?? q}→${v.th}`).join(' · ')}`);

console.log('\n③ 서울의 Q번호가 제목 저장에 있나');
const 서울q = Object.entries(t.이름).filter(([, n]) => n === 'Seoul' || n === 'Busan');
for (const [q, n] of 서울q) console.log(`   ${n} ${q} → ${JSON.stringify(t.제목[q])}`);
