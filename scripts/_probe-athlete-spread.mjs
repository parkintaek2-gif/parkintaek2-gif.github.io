/** 🔴 선수 쏠림 100% 가 이스포츠 때문인가. ⛔ 눈으로 안 보고 갈라 센다 */
import fs from 'node:fs';
import { 쏠림, 무리고름, 문턱 } from './build-wikitip-spread.mjs';

const d = JSON.parse(fs.readFileSync('archive/raw/wikipedia/sea-athletes.json', 'utf8'));
const 선수 = d.people.filter((x) => (x.role ?? 'player') === 'player');
const 축구 = 선수.filter((x) => x.sports?.includes('football'));
const 이스포츠 = 선수.filter((x) => x.sports?.includes('esports'));
const 그밖 = 선수.filter((x) => !x.sports?.includes('football') && !x.sports?.includes('esports'));

for (const [이름, 줄들] of [['선수 전부', 선수], ['축구', 축구], ['이스포츠', 이스포츠], ['그 밖', 그밖]]) {
  const g = 무리고름(줄들);
  console.log(`${이름.padEnd(10)} 센 것 ${String(g.counted).padStart(4)}/${String(g.ofAll).padEnd(5)}`
    + ` 가운데 쏠림 ${String(g.medianTopSharePc ?? '—').padStart(6)}   40%아래 ${g.underForty}`);
}

console.log(`\n문턱 ${문턱} 을 넘은 선수가 어느 판에 문서를 갖나`);
const 넘은것 = 선수.filter((x) => (x.seaPerMillionTotal ?? 0) >= 문턱);
const 판셈 = {};
for (const x of 넘은것) {
  const 판 = ['id', 'vi', 'th', 'ms'].filter((p) => typeof x.perMillion?.[p] === 'number' && x.perMillion[p] > 0);
  판셈[판.join('+') || '없음'] = (판셈[판.join('+') || '없음'] ?? 0) + 1;
}
for (const [k, v] of Object.entries(판셈).sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(16)} ${v}`);

console.log('\n이스포츠 문턱 넘은 사람 — 실제로 몇 판에 있나');
for (const x of 이스포츠.filter((y) => (y.seaPerMillionTotal ?? 0) >= 문턱).slice(0, 8)) {
  const 판 = ['id', 'vi', 'th', 'ms'].filter((p) => typeof x.perMillion?.[p] === 'number');
  console.log(`   ${x.name.padEnd(20)} ${판.join(',')}  ${쏠림(x)?.topSharePc}%`);
}
