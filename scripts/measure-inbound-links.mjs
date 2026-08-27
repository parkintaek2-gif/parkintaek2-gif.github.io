/**
 * 색인에 «안» 들어간 지면과 «들어간» 지면의 안쪽 인입 링크 수를 견준다.
 * ⛔ 자기 지면이 자기를 거는 것은 안 센다.
 * ⚠ dist 를 통째로 읽는다 — 라이브가 아니라 «낸 것»을 재는 것이다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 발견만 = ['/group/dia', '/group/nct-dream', '/group/f-x', '/group/ourbirthday',
  '/person/park-bo-young', '/title/love-to-hate-you', '/title/new-world',
  '/title/revelations', '/title/yesterday'];
const 들어간것 = ['/born-on/01-10', '/spread', '/by-country', '/for-industry'];

const 뿌리 = 'dist/wikitip';
const 지면 = [];
(function 훑(d, 앞) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) 훑(path.join(d, e.name), `${앞}/${e.name}`);
    else if (e.name.endsWith('.html')) {
      지면.push({
        길: path.join(d, e.name),
        주소: (`${앞}/${e.name}`).replace(/\/index\.html$/, '').replace(/\.html$/, '') || '/',
      });
    }
  }
})(뿌리, '');

const 셈 = new Map([...발견만, ...들어간것].map((p) => [p, new Set()]));
const 자 = new Map([...셈.keys()].map((p) => [p, new RegExp(`href=["']${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=["'/#?])`)]));

for (const g of 지면) {
  const h = fs.readFileSync(g.길, 'utf8');
  for (const [p, re] of 자) {
    if (g.주소 === p) continue;
    if (re.test(h)) 셈.get(p).add(g.주소);
  }
}

const 줄 = (p) => `   ${p.padEnd(30)}${String(셈.get(p).size).padStart(5)}장`;
console.log(`훑은 지면 ${지면.length}장`);
console.log('\n■ 색인에 «안» 들어간 9장 — 안쪽에서 걸어 주는 지면 수');
발견만.forEach((p) => console.log(줄(p)));
console.log('\n■ 견줌 — 색인에 «들어간» 지면');
들어간것.forEach((p) => console.log(줄(p)));

const 평균 = (목록) => (목록.reduce((a, p) => a + 셈.get(p).size, 0) / 목록.length).toFixed(1);
console.log(`\n안 들어간 것 평균 ${평균(발견만)}장 · 들어간 것 평균 ${평균(들어간것)}장`);
