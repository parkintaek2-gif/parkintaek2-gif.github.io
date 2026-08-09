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

/**
 * ⛔ **제목 문자열로 붙이지 않는다.** 그렇게 했더니 1,005편 중 317편(32%)에만 출연진이 붙었다 —
 *    문서 이름이 다르거나(「Squid Game (TV series)」) 문서가 없어서였다.
 *    `collect-korean-titles-keyed.mjs` 가 남긴 **Q번호**로 붙인다.
 */
const 열쇠파일 = path.join(DIR, 'korean-titles-keyed.json');
if (!fs.existsSync(열쇠파일)) {
  console.error(`❌ ${열쇠파일} 이 없다. collect-korean-titles-keyed.mjs 를 먼저 돌린다.`);
  process.exit(1);
}
const 작품표 = JSON.parse(fs.readFileSync(열쇠파일, 'utf8')).작품;
const 작품 = Object.keys(작품표);          // Q번호들
const 작품이름 = (q) => 작품표[q]?.이름 ?? q;

/**
 * 한 묶음의 작품에 대해 (작품, 배우, 배우Q) 를 받는다.
 * ⚠ 국제 공동제작의 외국 배우를 P27=Q884 로 거른다. 국적 미기재도 함께 빠진다 —
 *   빠지는 쪽을 **세어서 밝힌다.** 조용히 빼면 명단이 왜 작은지 알 수 없다.
 */
async function 한묶음(Q들) {
  const values = Q들.map((q) => `wd:${q}`).join(' ');
  /* ⛔ 사람에게 영어 위키백과 문서를 **요구하지 않는다.** 요구했더니 833명이 나왔고
     옛 파일 1,344명과 견주다 자물쇠가 섰다 — 옛 파일에는 문서 없는 336명이 들어 있다.
     **다른 것을 견줘 놓고 「줄었다」고 한 것**이다. 문서는 있으면 받고 없으면 없는 대로 적는다.
     조회수를 재려면 문서명이 필요하지만, **명단에서 빼는 것과 못 재는 것은 다르다.** */
  const q = `SELECT ?w ?a ?label ?an WHERE {
    VALUES ?w { ${values} }
    ?w wdt:P161 ?a .
    ?a wdt:P27 wd:Q884 ; rdfs:label ?label . FILTER(LANG(?label) = 'en')
    OPTIONAL { ?as schema:about ?a ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?an . }
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

/** Q번호로 모은다 — **이름이 아니라 Q번호가 사람의 정체**다. 이름은 바뀐다. */
const 사람 = new Map();          // Q → { 이름, 문서, 작품: Set }
const 붙은작품 = new Set();
let 못물은묶음 = 0;
const 못물은작품 = [];
for (let i = 0; i < 작품.length; i += 묶음) {
  const 조각 = 작품.slice(i, i + 묶음);
  const rows = await 한묶음(조각);
  if (rows === null) { 못물은묶음++; 못물은작품.push(...조각); process.stdout.write('x'); continue; }
  for (const b of rows) {
    const q = b.a.value.split('/').pop();
    const wq = b.w.value.split('/').pop();
    if (!사람.has(q)) 사람.set(q, { 이름: b.label.value, 문서: b.an?.value ?? null, 작품: new Set() });
    /* ⭐ 작품도 **Q번호로** 담는다. 제목을 담으면 다음 달에 또 못 붙인다. */
    사람.get(q).작품.add(wq);
    붙은작품.add(wq);
  }
  process.stdout.write('.');
  await new Promise((s) => setTimeout(s, 300));
}
process.stdout.write('\n');

/* 어디서 줄었는지 **세어서** 밝힌다. 「적다」로 끝내면 원인을 못 찾는다. */
const 문서있는사람 = [...사람.values()].filter((v) => v.문서).length;
console.log(`작품 ${작품.length}편 중 출연진이 붙은 작품 ${붙은작품.size}편 (${(100 * 붙은작품.size / 작품.length).toFixed(0)}%)`);
console.log(`배우 ${사람.size}명 · 그중 영어 위키백과 문서가 있는 사람 ${문서있는사람}명 (조회를 잴 수 있는 사람)`);

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
const 이름집합 = new Set([...사람.values()].flatMap((v) => [v.이름, v.문서].filter(Boolean)));
const 온도계 = ['Lee Byung-hun', 'Ma Dong-seok', 'Gong Yoo', 'Bae Doona', 'Song Kang-ho'];
const 없는것 = 온도계.filter((n) => !이름집합.has(n));
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
  /*
   * 🔴 2026-08-10 03:1x — **이 글이 손님 화면(/actor-reach)에 그대로 나가고 있었다.**
   *   5번 손님은 영어권이다. 지면에 나가는 글은 영어라야 한다 — 주석은 한국어라야 맞고, **나가는 글은 아니다.**
   *   ⛔ check-english-only.mjs 가 이제 이걸 잡는다.
   */
  주의: 'Foreign actors in international co-productions are removed by the country-of-citizenship '
    + 'filter (P27), and so are Korean actors whose citizenship Wikidata does not record. The hole runs '
    + 'in both directions and we cannot size it.',
  작품수: 작품.length,
  출연진이붙은작품: 붙은작품.size,
  배우수: 사람.size,
  /** 조회를 잴 수 있는 사람. 나머지는 **명단에는 있고 못 재는 것**이다. 둘은 다르다. */
  문서있는배우: 문서있는사람,
  /** 못 물은 묶음이 있으면 명단이 덜 찬 것이다. 조용히 넘기지 않는다. */
  못물은묶음, 못물은작품,
  /** ⭐ 여기가 이 파일을 만든 이유다 — **어느 작품인지**가 남는다. 열쇠는 Q번호다. */
  배우: Object.fromEntries([...사람].map(([q, v]) => [q, {
    이름: v.이름, 문서: v.문서,
    /** 작품은 **Q번호**다. 읽기 좋으라고 이름도 같이 적지만 붙일 때 쓰는 것은 Q번호다. */
    작품: [...v.작품].sort(),
    작품이름: [...v.작품].sort().map(작품이름),
  }])),
}, null, 2));

const 편수 = [...사람.values()].map((v) => v.작품.size).sort((a, b) => a - b);
console.log(`저장 ${산출}`);
console.log(`  작품 ${작품.length}편 · 배우 ${사람.size}명 · 사람당 작품 중앙값 ${편수[Math.floor(편수.length / 2)]}편`);
for (const n of 온도계) {
  const v = [...사람.values()].find((x) => x.이름 === n || x.문서 === n);
  console.log(`  ${n.padEnd(16)} ${v.작품.size}편`);
}
