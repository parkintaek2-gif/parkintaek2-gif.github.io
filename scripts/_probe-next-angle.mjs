/**
 * 아직 안 쓴 각도가 있나. ⛔ 기사를 만들려고 억지로 각도를 짜지 않는다 —
 *   **자료가 말하는 것이 있으면** 쓰고, 없으면 안 쓴다.
 */
import fs from 'node:fs';

const 읽 = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const 사람 = 읽('archive/raw/wikipedia/sea-musicians.json');
const 배우 = 읽('archive/raw/wikipedia/sea-actors.json');
const 장소 = 읽('archive/raw/wikipedia/sea-places.json');
const P = ['id', 'vi', 'th', 'ms'];

console.log('① 배우 자료엔 **차트 작품 수**가 있다 — 작품이 많으면 더 읽히나');
const 있는것 = 배우.people.filter((x) => typeof x.chartingTitles === 'number' && x.chartingTitles > 0);
console.log(`   작품 수를 아는 배우 ${있는것.length}/${배우.people.length}`);
const 가운데 = (a) => { const s = [...a].filter((v) => typeof v === 'number').sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
const 띠 = [[1, 2, '1편'], [2, 3, '2편'], [3, 5, '3–4편'], [5, 99, '5편 이상']];
console.log('   작품 수    배우   가운데 읽힘   맨 위');
for (const [a, b, 이름] of 띠) {
  const g = 있는것.filter((x) => x.chartingTitles >= a && x.chartingTitles < b);
  if (g.length < 15) { console.log(`   ${이름.padEnd(10)}${String(g.length).padStart(5)}   ⛔ 열다섯이 안 된다`); continue; }
  const 맨위 = g.reduce((p, c) => (c.seaPerMillionTotal > p.seaPerMillionTotal ? c : p));
  console.log(`   ${이름.padEnd(10)}${String(g.length).padStart(5)}${String(가운데(g.map((x) => x.seaPerMillionTotal))).padStart(13)}   ${맨위.name} ${맨위.seaPerMillionTotal}`);
}

console.log('\n② 장소 — 역이 887곳인데 거의 안 읽힌다. **어떤 역이 읽히나**');
const 역 = 장소.people.filter((x) => (x.kinds ?? []).some((k) => /station/i.test(k)));
const 읽히는역 = 역.filter((x) => x.seaPerMillionTotal >= 1);
console.log(`   역 ${역.length}곳 중 백만분율 1 넘는 곳 ${읽히는역.length}곳 (${(100 * 읽히는역.length / 역.length).toFixed(1)}%)`);
for (const x of 읽히는역.sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal).slice(0, 8)) {
  console.log(`   ${x.name.padEnd(28)} ${x.seaPerMillionTotal}`);
}

console.log('\n③ 무리 대 솔로 — 같은 사람이 무리에도 솔로에도 있나');
const 무리 = 사람.people.filter((x) => x.isGroup);
const 솔로 = 사람.people.filter((x) => !x.isGroup);
console.log(`   무리 ${무리.length} · 솔로 ${솔로.length}`);
const 무리합 = 무리.reduce((a, x) => a + (x.seaPerMillionTotal ?? 0), 0);
const 솔로합 = 솔로.reduce((a, x) => a + (x.seaPerMillionTotal ?? 0), 0);
console.log(`   읽힘 합 — 무리 ${무리합.toFixed(0)} · 솔로 ${솔로합.toFixed(0)}`);
console.log(`   한 이름당 — 무리 ${(무리합 / 무리.length).toFixed(2)} · 솔로 ${(솔로합 / 솔로.length).toFixed(2)}`);
