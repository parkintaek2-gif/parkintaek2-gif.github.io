/**
 * 무리의 **데뷔 연차**와 읽힘. ⛔ 결론을 정해 두지 않는다.
 *   BTS(2013)가 맨 위인데 Babymonster(2023)가 둘째다. 한 방향인가 아닌가.
 * 🔴 데뷔 연도는 Wikidata 에서 받아야 한다 — 내 자료엔 없다.
 */
import fs from 'node:fs';
import https from 'node:https';

const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
function 받기(host, 길) {
  return new Promise((resolve) => {
    let 끝 = false;
    const 한번만 = (v) => { if (!끝) { 끝 = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만({ code: 0, body: '' }); }, 60000);
    const req = https.request({ host, path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } }, (res) => {
      const 조각 = []; res.on('data', (c) => 조각.push(c));
      res.on('end', () => 한번만({ code: res.statusCode, body: Buffer.concat(조각).toString('utf8'), 온전한가: res.complete }));
    });
    req.on('error', () => 한번만({ code: 0, body: '' }));
    req.end();
  });
}
async function 스파클(q) {
  for (let i = 0; i < 4; i += 1) {
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(q)}`);
    if (r.code === 200 && r.온전한가) { try { return JSON.parse(r.body).results.bindings; } catch { /* */ } }
    await new Promise((s) => setTimeout(s, 3000 * (i + 1)));
  }
  return null;
}

const d = JSON.parse(fs.readFileSync('archive/raw/wikipedia/sea-musicians.json', 'utf8'));
const 무리 = d.people.filter((x) => x.isGroup && x.seaPerMillionTotal >= 10);
console.log(`문턱 10 넘은 무리 ${무리.length}\n`);

/* P571 = 언제 생겼나 */
const 해 = new Map();
for (let i = 0; i < 무리.length; i += 60) {
  const 덩이 = 무리.slice(i, i + 60);
  const 줄들 = await 스파클(`SELECT ?p ?start WHERE {
    VALUES ?p { ${덩이.map((x) => `wd:${x.q}`).join(' ')} }
    ?p wdt:P571 ?start .
  }`);
  if (!줄들) { console.log('   ⛔ 못 받았다'); continue; }
  for (const r of 줄들) 해.set(r.p.value.split('/').pop(), Number(r.start.value.slice(0, 4)));
}

const 있는것 = 무리.filter((x) => 해.has(x.q));
console.log(`데뷔 연도를 아는 무리 ${있는것.length}/${무리.length}\n`);

const 띠 = [[2020, 2027, '2020s'], [2015, 2020, '2015–19'], [2010, 2015, '2010–14'], [1990, 2010, 'before 2010']];
const 가운데 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
console.log('데뷔 띠        무리   가운데 읽힘   맨 위');
for (const [a, b, 이름] of 띠) {
  const g = 있는것.filter((x) => 해.get(x.q) >= a && 해.get(x.q) < b);
  if (!g.length) continue;
  const 맨위 = g.reduce((p, c) => (c.seaPerMillionTotal > p.seaPerMillionTotal ? c : p));
  console.log(`${이름.padEnd(14)}${String(g.length).padStart(5)}`
    + `${String(가운데(g.map((x) => x.seaPerMillionTotal))).padStart(13)}   ${맨위.name} ${맨위.seaPerMillionTotal}`);
}

console.log('\n맨 위 열둘의 데뷔 연도');
for (const x of 있는것.slice(0, 12)) console.log(`   ${x.name.padEnd(22)} ${해.get(x.q)}  ${x.seaPerMillionTotal}`);
