/**
 * 큰 한국 작품이 들어오면 그 시장의 **다른 한국 작품**이 밀려나나, 늘어나나?
 * ⛔ 결론을 정해 두지 않는다. 대조군(남의 작품이 들어온 주)을 같이 잰다.
 * 🔴 출발점이 다르면(1.92 대 0.56) 높은 쪽이 그냥 내려온다 — **출발점을 맞춰** 다시 본다.
 */
import fs from 'node:fs';

const 표 = 'archive/raw/netflix-top10/countries.ndjson';

const 판 = JSON.parse(fs.readFileSync('src/data/wikitip-title-ambiguity.json', 'utf8'));
const 한국제목 = new Set(판.perTitle.map((x) => x.title));

const 칸 = new Map();
for (const 줄 of fs.readFileSync(표, 'utf8').split('\n')) {
  if (!줄.trim()) continue;
  let j; try { j = JSON.parse(줄); } catch { continue; }
  if (j.국가 === 'Russia') continue;
  const k = `${j.국가}|${j.구분}|${j.주}`;
  if (!칸.has(k)) 칸.set(k, []);
  칸.get(k).push({ 제목: j.제목, 순위: j.순위, 한국: 한국제목.has(j.제목) });
}

const 줄기 = new Map();
for (const k of 칸.keys()) {
  const [국, 구, 주] = k.split('|');
  const g = `${국}|${구}`;
  if (!줄기.has(g)) 줄기.set(g, []);
  줄기.get(g).push(주);
}
for (const v of 줄기.values()) v.sort();

const 있나 = (국, 구, 주, 제목) => (칸.get(`${국}|${구}|${주}`) ?? []).some((r) => r.제목 === 제목);

function 재기(한국쪽) {
  const 짝 = [];
  for (const [g, 주들] of 줄기) {
    const [국, 구] = g.split('|');
    for (let i = 4; i < 주들.length - 3; i += 1) {
      const 주 = 주들[i]; const 전주 = 주들[i - 1];
      const 들어온것 = (칸.get(`${국}|${구}|${주}`) ?? [])
        .filter((r) => r.순위 <= 3 && r.한국 === 한국쪽 && !있나(국, 구, 전주, r.제목));
      if (!들어온것.length) continue;
      const 그편 = new Set(들어온것.map((r) => r.제목));
      const 나머지 = (w) => (칸.get(`${국}|${구}|${w}`) ?? [])
        .filter((r) => r.한국 && !그편.has(r.제목)).length;
      const 앞 = [1, 2, 3, 4].map((n) => 나머지(주들[i - n])).reduce((a, b) => a + b, 0) / 4;
      const 뒤 = [0, 1, 2, 3].map((n) => 나머지(주들[i + n])).reduce((a, b) => a + b, 0) / 4;
      짝.push([앞, 뒤]);
    }
  }
  return 짝;
}

const 한 = 재기(true);
const 남 = 재기(false);
const 평 = (p) => (p.length ? p.reduce((s, [a, b]) => s + (b - a), 0) / p.length : null);
const 앞평 = (p) => (p.length ? p.reduce((s, [a]) => s + a, 0) / p.length : null);

console.log(`한국 작품이 1~3위로 새로 들어온 주 : ${한.length}건  앞 ${앞평(한).toFixed(3)}  변화 ${평(한).toFixed(3)}`);
console.log(`남의 작품이 1~3위로 새로 들어온 주 : ${남.length}건  앞 ${앞평(남).toFixed(3)}  변화 ${평(남).toFixed(3)}`);

/* 🔴 교란 죽이기 — 출발점(앞)이 같은 것끼리만 견준다 */
const 띠 = [[0, 0.5], [0.5, 1.5], [1.5, 2.5], [2.5, 4], [4, 99]];
const 이름 = ['0', '1', '2', '3', '4 이상'];
console.log('\n출발점이 같은 것끼리 — 다른 한국 작품 수의 변화');
console.log('출발점    한국 작품이 들어온 주          남의 작품이 들어온 주');
for (let i = 0; i < 띠.length; i += 1) {
  const [lo, hi] = 띠[i];
  const 고 = (p) => p.filter(([앞]) => 앞 >= lo && 앞 < hi);
  const 꼴 = (p) => (p.length
    ? `${String(p.length).padStart(6)}건 ${평(p) >= 0 ? '+' : ''}${평(p).toFixed(3)}`
    : '         —');
  console.log(이름[i].padEnd(9) + 꼴(고(한)).padEnd(31) + 꼴(고(남)));
}

/* ⭐ 출발점 분포를 한국 쪽에 맞춘 대조군 값 — 「같은 자리에서 시작했으면 얼마나 내려갔을까」 */
let 기대 = 0;
for (const [lo, hi] of 띠) {
  const A = 한.filter(([앞]) => 앞 >= lo && 앞 < hi);
  const B = 남.filter(([앞]) => 앞 >= lo && 앞 < hi);
  if (!A.length || !B.length) continue;
  기대 += (A.length * 평(B));
}
기대 /= 한.length;
const 실제 = 평(한);
console.log('\n출발점을 맞춘 뒤');
console.log(`  실제로 내려간 것          ${실제.toFixed(3)}`);
console.log(`  같은 자리에서 시작했으면   ${기대.toFixed(3)}   ← 남의 작품이 들어왔어도 이만큼 내려간다`);
console.log(`  🔴 남는 몫                ${(실제 - 기대).toFixed(3)}`);
console.log(`  안 맞췄을 때의 차이        ${(실제 - 평(남)).toFixed(3)}`);
console.log(`  ⭐ 겉보기의 ${(100 * (1 - (실제 - 기대) / (실제 - 평(남)))).toFixed(0)}% 는 출발점이었다`);
