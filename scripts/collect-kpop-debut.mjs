/**
 * K팝 그룹의 **결성 연도**를 위키데이터에서 받는다 (P571 inception).
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 「그룹 문서와 멤버 문서 중 어느 쪽을 보나」를 재 보니 팀마다 크게 달랐고,
 * 눈으로 보니 **새 팀은 그룹 쪽 · 옛 팀은 멤버 쪽**으로 갈리는 것처럼 보였다.
 * 「보였다」는 근거가 아니다. 연도를 받아 **재서** 말한다.
 *
 * ⚠ 이 축에는 함정이 하나 있다. 새 팀은 멤버에게 **영어 위키백과 문서가 아직 없다.**
 *   그러면 멤버 조회가 낮은 것이 「관심이 없다」가 아니라 「볼 문서가 없다」가 된다.
 *   연도만으로는 그 둘을 못 가른다 — 쓰는 쪽에서 반드시 같이 밝힌다.
 *
 * 결과 → archive/raw/star-pageviews/kpop-debut-YYYYMMDD.json
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('archive/raw/star-pageviews');
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) k-pop inception';
const SPARQL = 'https://query.wikidata.org/sparql';
const 묶음 = 20;

const files = fs.readdirSync(OUT).filter((f) => /^kpop-\d+\.json$/.test(f)).sort();
const 파일 = files[files.length - 1];
const 날 = 파일.match(/(\d{8})/)[1];
const k = JSON.parse(fs.readFileSync(path.join(OUT, 파일), 'utf8'));
const 그룹 = k.사람.filter((p) => p.갈래 === 'group').map((p) => p.이름);

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function 한묶음(names) {
  const values = names.map((n) => `'${esc(n)}'@en`).join(' ');
  const q = `SELECT ?gn (MIN(?d) AS ?dt) WHERE {
    VALUES ?gn { ${values} }
    ?gs schema:about ?g ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?gn .
    ?g wdt:P571 ?d .
  } GROUP BY ?gn`;
  for (let 시도 = 0; 시도 < 3; 시도++) {
    try {
      const r = await fetch(SPARQL, {
        method: 'POST',
        headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json',
          'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ query: q }),
        signal: AbortSignal.timeout(90000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).results.bindings;
    } catch { if (시도 === 2) return null; await new Promise((s) => setTimeout(s, 4000)); }
  }
  return null;
}

const 해 = {};
let 못물은묶음 = 0;
for (let i = 0; i < 그룹.length; i += 묶음) {
  const rows = await 한묶음(그룹.slice(i, i + 묶음));
  if (rows === null) { 못물은묶음++; process.stdout.write('x'); continue; }
  for (const b of rows) 해[b.gn.value] = +b.dt.value.slice(0, 4);
  process.stdout.write('.');
  await new Promise((s) => setTimeout(s, 300));
}
process.stdout.write('\n');

const 산출 = path.join(OUT, `kpop-debut-${날}.json`);
fs.writeFileSync(산출, JSON.stringify({
  갱신: new Date().toLocaleString('ko-KR'),
  출처: 'Wikidata P571 (inception), earliest value where several are recorded',
  그룹수: 그룹.length, 연도적힌그룹: Object.keys(해).length, 못물은묶음, 연도: 해,
}, null, 2));

console.log(`그룹 ${그룹.length}팀 중 연도가 적힌 팀 ${Object.keys(해).length} · 못 물은 묶음 ${못물은묶음}`);
console.log(`저장 ${산출}`);
