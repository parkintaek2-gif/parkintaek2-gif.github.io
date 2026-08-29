const 머리 = { Accept: 'application/sparql-results+json', 'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)' };
const Q = `SELECT ?m ?mLabel WHERE { wd:Q25056945 wdt:P527 ?m .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . } }`;
const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(Q), { headers: 머리 });
const rows = (await r.json()).results.bindings;
console.log('위키데이터가 적은 BLACKPINK 멤버 ' + rows.length + '명:');
for (const b of rows) console.log('  ' + b.mLabel.value + '  ' + b.m.value.split('/').pop());
