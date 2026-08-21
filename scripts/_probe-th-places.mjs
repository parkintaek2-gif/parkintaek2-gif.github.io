/** 🔴 태국판 한국 장소가 0개로 나왔다. ⛔ 「없다」로 단정하지 않고 실물에 물어본다 */
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
    req.on('error', (e) => 한번만({ code: 0, body: e.message }));
    req.end();
  });
}
async function 스파클(q) {
  for (let i = 0; i < 4; i += 1) {
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(q)}`);
    if (r.code === 200 && r.온전한가) { try { return JSON.parse(r.body).results.bindings; } catch { /* */ } }
    console.log(`   ⚠ ${i + 1}번째 — ${r.code}${r.온전한가 === false ? ' 잘림/시간넘음' : ''}`);
    await new Promise((s) => setTimeout(s, 3000 * (i + 1)));
  }
  return null;
}

console.log('① 태국판에 한국 장소가 몇이나 되나 — 세어만 본다(가볍다)');
for (const p of ['th', 'id', 'vi', 'ms']) {
  const 줄 = await 스파클(`SELECT (COUNT(DISTINCT ?p) AS ?n) WHERE {
    ?p wdt:P17 wd:Q884 ; wdt:P625 ?좌표 .
    ?a schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> .
  }`);
  console.log(`   ${p}  ${줄 ? 줄[0].n.value : '⛔ 못 받았다'}`);
}

console.log('\n② 태국판 한국 장소 몇 개만 실제로 본다');
const 줄 = await 스파클(`SELECT ?p ?pLabel ?a WHERE {
  ?p wdt:P17 wd:Q884 ; wdt:P625 ?좌표 .
  ?a schema:about ?p ; schema:isPartOf <https://th.wikipedia.org/> .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 8`);
if (!줄) console.log('   ⛔ 못 받았다');
else for (const r of 줄) console.log(`   ${(r.pLabel?.value ?? '').padEnd(28)} ${decodeURIComponent(r.a.value.split('/wiki/')[1] ?? '')}`);
