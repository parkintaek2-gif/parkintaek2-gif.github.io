const 머리 = { Accept: 'application/sparql-results+json', 'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)' };
for (const 이름 of ['BTS', 'Blackpink', 'Stray Kids', 'Seventeen']) {
  const Q = `SELECT ?g ?gLabel (COUNT(DISTINCT ?m) AS ?members) WHERE {
    ?g rdfs:label "${이름}"@en . ?g wdt:P31/wdt:P279* wd:Q215380 .
    OPTIONAL { ?g wdt:P527 ?m }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
  } GROUP BY ?g ?gLabel LIMIT 5`;
  const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(Q), { headers: 머리 });
  if (!r.ok) { console.log(`${이름}: 못 쟀다 HTTP ${r.status}`); await new Promise(s=>setTimeout(s,2000)); continue; }
  const rows = (await r.json()).results.bindings;
  if (!rows.length) console.log(`${이름}: 그룹으로 «안» 잡힘`);
  else for (const b of rows) console.log(`${이름}: ${b.g.value.split('/').pop()} · 멤버 ${b.members.value}명`);
  await new Promise(s=>setTimeout(s,2000));
}
