/**
 * 넷플릭스 Top10 에 든 한국 작품의 **출연진을 작품과 함께** 받는다.
 *
 * ── 왜 다시 만드나 ─────────────────────────────────────────────
 * `archive/raw/netflix-top10/korean-cast.json` 은 **이름 → 편수**만 들고 있다.
 * **어느 작품인지가 버려져 있다.** 그래서 「이 작품이 출연진 관심을 올렸나」를
 * 물을 수가 없다. 붙일 수 없는 자료는 팔 수 없다 —
 * 2번 인계서 ⅩⅢ-3: 「**파는 것은 조인이다.** 붙일 열쇠를 처음부터 같이 저장하라」.
 *
 * 그리고 그 파일을 **만든 스크립트가 없다.** 손으로 만든 자료는 규칙이 바뀌어도
 * 따라오지 않는다 — 8/7 오전에 손으로 만든 자료 일곱 개가 같은 이유로 틀려 있었다.
 *
 * ── 무엇을 더 저장하나 ─────────────────────────────────────────
 * ⭐ 사람마다 **작품 목록**과 **위키데이터 Q번호**를 같이 적는다.
 *   이름은 바뀐다(동명이인 구분자가 붙거나 표기가 바뀐다). Q번호는 안 바뀐다.
 *   ⛔ 이름만 저장하면 다음 달에 같은 사람인지 알 수 없다.
 *
 * ── ⚠ 옛 파일과 견줘 보고 나서 바꾼다 ──────────────────────────
 * 새로 받은 명단이 옛것보다 **훨씬 적으면 쓰지 않는다.** 질의가 조용히 덜 돌 수 있다.
 * 옛 파일은 `실패묶음: 1` 이라고 적혀 있다 — **한 묶음이 빠진 채로 쓰이고 있었다.**
 *
 * 결과 → archive/raw/netflix-top10/korean-cast-joined.json
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('archive/raw/netflix-top10');
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) korean cast join';
const SPARQL = 'https://query.wikidata.org/sparql';
const 묶음 = 25;

const 작품 = JSON.parse(fs.readFileSync(path.join(DIR, 'korean-titles.json'), 'utf8')).제목;
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * 한 묶음의 작품에 대해 (작품, 배우, 배우Q) 를 받는다.
 * ⚠ 국제 공동제작의 외국 배우를 P27=Q884 로 거른다. 국적 미기재도 함께 빠진다 —
 *   빠지는 쪽을 **세어서 밝힌다.** 조용히 빼면 명단이 왜 작은지 알 수 없다.
 */
async function 한묶음(제목들) {
  const values = 제목들.map((t) => `'${esc(t)}'@en`).join(' ');
  const q = `SELECT ?wn ?an ?a WHERE {
    VALUES ?wn { ${values} }
    ?ws schema:about ?w ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?wn .
    ?w wdt:P161 ?a .
    ?a wdt:P27 wd:Q884 .
    ?as schema:about ?a ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?an .
  }`;
  for (let 시도 = 0; 시도 < 3; 시도++) {
    try {
      const r = await fetch(SPARQL, {
        method: 'POST',
        headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json',
          'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ query: q }),
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).results.bindings;
    } catch { if (시도 === 2) return null; await new Promise((s) => setTimeout(s, 5000)); }
  }
  return null;
}

const 사람 = new Map();          // 이름 → { q, 작품: Set }
let 못물은묶음 = 0;
const 못물은작품 = [];
for (let i = 0; i < 작품.length; i += 묶음) {
  const 조각 = 작품.slice(i, i + 묶음);
  const rows = await 한묶음(조각);
  if (rows === null) { 못물은묶음++; 못물은작품.push(...조각); process.stdout.write('x'); continue; }
  for (const b of rows) {
    const n = b.an.value;
    if (!사람.has(n)) 사람.set(n, { q: b.a.value.split('/').pop(), 작품: new Set() });
    사람.get(n).작품.add(b.wn.value);
  }
  process.stdout.write('.');
  await new Promise((s) => setTimeout(s, 300));
}
process.stdout.write('\n');

/* ── 옛 파일과 견준다. 훨씬 적으면 쓰지 않는다 ── */
const 옛길 = path.join(DIR, 'korean-cast.json');
const 옛 = fs.existsSync(옛길) ? JSON.parse(fs.readFileSync(옛길, 'utf8')) : null;
const 옛수 = 옛 ? Object.keys(옛.배우).length : 0;
console.log(`받은 배우 ${사람.size}명 · 옛 파일 ${옛수}명 · 못 물은 묶음 ${못물은묶음}(작품 ${못물은작품.length}편)`);

if (옛수 && 사람.size < 옛수 * 0.8) {
  console.error(`❌ 새 명단이 옛것의 80% 미만이다 (${사람.size} < ${Math.round(옛수 * 0.8)}). 파일을 쓰지 않는다.`);
  console.error('   질의가 조용히 덜 돈 것일 수 있다. 원인을 보고 다시 돌린다.');
  process.exit(1);
}

/* ⛔ 있어야 할 이름을 **눈으로** 찾아본다. 수치가 멀쩡해도 빠질 수 있다 —
   8/7 에 K팝 명단이 「1,958명·실패 0」인 채로 블랙핑크가 없었다. */
const 온도계 = ['Lee Byung-hun', 'Ma Dong-seok', 'Gong Yoo', 'Bae Doona', 'Song Kang-ho'];
const 없는것 = 온도계.filter((n) => !사람.has(n));
if (없는것.length) {
  console.error(`❌ 있어야 할 이름이 없다: ${없는것.join(' · ')}`);
  console.error('   명단 규칙이 깨졌다. 파일을 쓰지 않는다.');
  process.exit(1);
}

const 산출 = path.join(DIR, 'korean-cast-joined.json');
fs.writeFileSync(산출, JSON.stringify({
  갱신: new Date().toLocaleString('ko-KR'),
  출처: 'Wikidata P161 (cast member) × P27=Q884 (Korean citizenship), on Korean titles that appeared in a Netflix Top 10. '
    + 'English Wikipedia article required for both the title and the person.',
  주의: '⚠ 국제 공동제작의 외국 배우는 P27 로 걸러진다. 국적이 안 적힌 한국 배우도 함께 빠진다.',
  작품수: 작품.length,
  배우수: 사람.size,
  /** 못 물은 묶음이 있으면 명단이 덜 찬 것이다. 조용히 넘기지 않는다. */
  못물은묶음, 못물은작품,
  /** ⭐ 여기가 이 파일을 만든 이유다 — **어느 작품인지**가 남는다. */
  배우: Object.fromEntries([...사람].map(([n, v]) => [n, { q: v.q, 작품: [...v.작품].sort() }])),
}, null, 2));

const 편수 = [...사람.values()].map((v) => v.작품.size);
console.log(`저장 ${산출}`);
console.log(`  작품 ${작품.length}편 · 배우 ${사람.size}명 · 이름당 작품 중앙값 ${편수.sort((a, b) => a - b)[Math.floor(편수.length / 2)]}편`);
for (const n of 온도계) console.log(`  ${n.padEnd(16)} ${사람.get(n).작품.size}편`);
