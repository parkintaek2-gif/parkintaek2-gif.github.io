const 머리 = { Accept: 'application/sparql-results+json', 'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)' };
const Q = `SELECT ?gLabel ?mLabel ?birth ?pobLabel WHERE {
  VALUES ?g { wd:Q20716678 wd:Q22101966 }
  ?g wdt:P527 ?m .
  OPTIONAL { ?m wdt:P569 ?birth }
  OPTIONAL { ?m wdt:P19 ?pob }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
} ORDER BY ?gLabel ?birth`;
const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(Q), { headers: 머리 });
if (!r.ok) { console.log('못 쟀다 HTTP ' + r.status); process.exit(1); }
const rows = (await r.json()).results.bindings;
if (!rows.length) { console.log('⛔ 0건 — Q번호가 틀렸을 수 있다'); process.exit(0); }
for (const b of rows) {
  console.log(`${(b.gLabel?.value ?? '?').padEnd(12)} ${(b.mLabel?.value ?? '?').padEnd(18)} ${(b.birth?.value ?? '생일없음').slice(0,10)}  ${b.pobLabel?.value ?? '태어난곳없음'}`);
}
