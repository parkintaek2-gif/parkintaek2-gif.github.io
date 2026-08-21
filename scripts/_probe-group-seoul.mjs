/** 🔴 서울이 도시 묶음에 안 들어갔다. ⛔ 짐작 말고 갈래를 실물로 본다 */
import fs from 'node:fs';
import { 묶기 } from './build-wikitip-places.mjs';

const d = JSON.parse(fs.readFileSync('archive/raw/wikipedia/sea-places.json', 'utf8'));
for (const 이름 of ['Seoul', 'Busan', 'Incheon', 'Gyeonggi Province', 'YG Entertainment']) {
  const x = d.people.find((y) => y.name === 이름);
  if (!x) { console.log(`${이름} 없음`); continue; }
  console.log(`${이름.padEnd(20)} → ${묶기(x.kinds).padEnd(10)} 갈래: ${JSON.stringify(x.kinds)}`);
}

console.log('\n「metropolitan city of South Korea」 가 왜 station 인가');
console.log('  station 표에 든 낱말: station, metro, railway, subway');
console.log('  "metropolitan city of south korea".includes("metro") →',
  'metropolitan city of south korea'.includes('metro'));
