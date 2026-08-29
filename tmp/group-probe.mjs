/* 한국 음악 그룹과 그 멤버가 위키데이터에 얼마나 있나 — 지면을 짓기 «전»에 재 본다 */
const 머리 = { Accept: 'application/sparql-results+json', 'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)' };
const 물어 = async (Q) => {
  const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(Q), { headers: 머리 });
  if (!r.ok) return null;
  return (await r.json()).results.bindings;
};
/* ① 한국 음악 그룹 수 */
const a = await 물어(`SELECT (COUNT(DISTINCT ?g) AS ?n) WHERE {
  ?g wdt:P31/wdt:P279* wd:Q215380 . ?g wdt:P495 wd:Q884 . }`);
console.log('한국 음악 그룹(P495=한국):', a ? a[0].n.value : '못 쟀다');
await new Promise(s => setTimeout(s, 1500));
/* ② 그중 멤버(P527)가 적힌 그룹 */
const b = await 물어(`SELECT (COUNT(DISTINCT ?g) AS ?n) WHERE {
  ?g wdt:P31/wdt:P279* wd:Q215380 . ?g wdt:P495 wd:Q884 . ?g wdt:P527 ?m . }`);
console.log('그중 멤버가 «적힌» 그룹:', b ? b[0].n.value : '못 쟀다');
await new Promise(s => setTimeout(s, 1500));
/* ③ 멤버 중 생일이 적힌 사람 */
const c = await 물어(`SELECT (COUNT(DISTINCT ?m) AS ?n) WHERE {
  ?g wdt:P31/wdt:P279* wd:Q215380 . ?g wdt:P495 wd:Q884 . ?g wdt:P527 ?m . ?m wdt:P569 ?d . }`);
console.log('멤버 중 생일이 적힌 사람:', c ? c[0].n.value : '못 쟀다');
await new Promise(s => setTimeout(s, 1500));
/* ④ 큰 그룹 몇 개 — 멤버 수와 생일 있는 수 */
const d = await 물어(`SELECT ?gLabel (COUNT(DISTINCT ?m) AS ?members) (COUNT(DISTINCT ?bd) AS ?withBirth) WHERE {
  ?g wdt:P31/wdt:P279* wd:Q215380 . ?g wdt:P495 wd:Q884 . ?g wdt:P527 ?m .
  OPTIONAL { ?m wdt:P569 ?birth . BIND(?m AS ?bd) }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
} GROUP BY ?gLabel ORDER BY DESC(?members) LIMIT 20`);
if (d) { console.log('\n멤버 많은 그룹 —'); for (const r of d) console.log(`  ${String(r.members.value).padStart(3)}명 (생일 ${r.withBirth.value})  ${r.gLabel.value}`); }
