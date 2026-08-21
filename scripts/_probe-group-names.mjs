/** 🔴 무리 이름이 수상하다(Lngshot·I-dle·Kard). ⛔ 짐작 말고 제목과 이름표를 나란히 본다 */
import fs from 'node:fs';

const d = JSON.parse(fs.readFileSync('archive/raw/wikipedia/sea-musicians.json', 'utf8'));
for (const 이름 of ['Lngshot', 'I-dle', 'Kard', 'Exo', 'Babymonster', 'Riize', 'Tempest']) {
  const x = d.people.find((y) => y.name === 이름);
  if (!x) { console.log(`${이름} 없음`); continue; }
  console.log(`${이름.padEnd(14)} 이름표 ${JSON.stringify(x.wikidataLabel)}`);
  console.log(`${''.padEnd(14)} 제목  ${JSON.stringify(x.titles)}`);
}
