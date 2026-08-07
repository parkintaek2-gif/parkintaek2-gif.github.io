/**
 * K팝 그룹의 **멤버 명단**을 위키데이터에서 받는다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 「그룹 문서와 멤버 문서 중 사람들은 어느 쪽을 보나」를 세려다,
 * 멤버 이름을 **내가 손으로 적고 있었다.** 르세라핌은 다섯 중 0명을 맞혔다.
 * 손으로 적은 명단으로 낸 숫자는 내 기억력을 잰 것이지 관심을 잰 것이 아니다.
 *
 * 그래서 규칙으로 받는다 — 위키데이터 `P527`(has part / 구성원).
 *
 * ⚠ 전부 한 번에 물으면 **502** 가 난다. 실제로 그랬다. 스무 팀씩 나눠 묻는다.
 * ⚠ 멤버가 안 적힌 팀이 많다. **그건 「멤버가 없다」가 아니라 「위키데이터에 안 적혀 있다」**다.
 *   세어서 밝히고, 그런 팀은 견주기에서 뺀다 — 0 으로 세면 그룹이 이겨 버린다.
 *
 * 결과 → archive/raw/star-pageviews/kpop-members-YYYYMMDD.json
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('archive/raw/star-pageviews');
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) k-pop members';
const SPARQL = 'https://query.wikidata.org/sparql';
const 묶음 = 20;

const files = fs.readdirSync(OUT).filter((f) => /^kpop-\d+\.json$/.test(f)).sort();
if (!files.length) { console.error('❌ kpop-*.json 이 없다'); process.exit(1); }
const 파일 = files[files.length - 1];
const k = JSON.parse(fs.readFileSync(path.join(OUT, 파일), 'utf8'));
const 그룹 = k.사람.filter((p) => p.갈래 === 'group').map((p) => p.이름);

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function 한묶음(names) {
  const values = names.map((n) => `'${esc(n)}'@en`).join(' ');
  const q = `SELECT ?gn ?mn WHERE {
    VALUES ?gn { ${values} }
    ?gs schema:about ?g ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?gn .
    ?g wdt:P527 ?m .
    ?ms schema:about ?m ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?mn .
  }`;
  for (let 시도 = 0; 시도 < 3; 시도++) {
    try {
      const r = await fetch(SPARQL, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          Accept: 'application/sparql-results+json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ query: q }),
        signal: AbortSignal.timeout(90000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).results.bindings;
    } catch (e) {
      if (시도 === 2) return null;
      await new Promise((s) => setTimeout(s, 4000));
    }
  }
  return null;
}

const 멤버 = new Map();
let 못물은묶음 = 0;
for (let i = 0; i < 그룹.length; i += 묶음) {
  const rows = await 한묶음(그룹.slice(i, i + 묶음));
  if (rows === null) { 못물은묶음++; process.stdout.write('x'); continue; }
  for (const b of rows) {
    const g = b.gn.value;
    if (!멤버.has(g)) 멤버.set(g, new Set());
    멤버.get(g).add(b.mn.value);
  }
  process.stdout.write('.');
  await new Promise((s) => setTimeout(s, 300));
}
process.stdout.write('\n');

const 날 = 파일.match(/(\d{8})/)[1];
const 산출 = path.join(OUT, `kpop-members-${날}.json`);
fs.writeFileSync(산출, JSON.stringify({
  갱신: new Date().toLocaleString('ko-KR'),
  출처: 'Wikidata P527 (has part), English Wikipedia article required for both group and member',
  그룹수: 그룹.length,
  멤버적힌그룹: 멤버.size,
  /** 못 물은 묶음이 있으면 명단이 덜 찬 것이다. 조용히 넘기지 않는다. */
  못물은묶음,
  그룹: [...멤버].map(([g, s]) => ({ 그룹: g, 멤버: [...s] })),
}, null, 2));

console.log(`그룹 ${그룹.length}팀 중 멤버가 적힌 팀 ${멤버.size} · 못 물은 묶음 ${못물은묶음}`);
for (const g of ['BTS', 'Blackpink', 'NewJeans', 'Twice', 'Le Sserafim', 'Stray Kids']) {
  console.log(`  ${g.padEnd(12)} ${멤버.has(g) ? `${멤버.get(g).size}명` : '위키데이터에 멤버가 안 적혀 있다'}`);
}
console.log(`저장 ${산출}`);
