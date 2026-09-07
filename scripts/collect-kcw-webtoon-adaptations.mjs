#!/usr/bin/env node
/**
 * collect-kcw-webtoon-adaptations.mjs — **웹툰이 드라마·영화가 되면 얼마나 읽히나.**
 * ────────────────────────────────────────────────────────────────────────────
 * [사장님 지시 — 2026-09-07]
 *   > 「**웹툰 등도 관심이 많은 케이컬쳐를 조사해봐**」
 *   > 「**영어 키워드 어떤게 의미있는 검색량을 보이면 그에 대한 콘텐트를 만들어**」
 *   > 「**우린 데이터저널리즘이니 만큼 사람들의 관심을 끌게 가공한 데이터를 포함하고**」
 *   > 「**다른 분야 케이컬쳐 콘텐트에도 관심가게 할 수 있는 데이터를 꼭 포함해**」
 *
 * [⭐ 왜 이 축인가 — 마지막 지시가 축을 정했다]
 *   웹툰만 세면 웹툰 지면에서 끝난다. **웹툰이 «드라마·영화»가 된 것**을 세면
 *   한 편의 글이 두 분야를 잇는다 — 웹툰 독자가 드라마를 보고, 드라마 독자가 원작을 찾는다.
 *   그 다리를 «수»로 놓는 것이 이 자다.
 *
 * [무엇을 세나 — 남이 안 센 것]
 *   위키데이터에서 «웹툰을 원작으로 한» 한국 드라마·영화를 뽑고,
 *   그 작품과 «원작 웹툰» 양쪽의 영어 위키백과 열람수를 나란히 잰다.
 *   ⇒ 「원작이 더 읽히나, 각색이 더 읽히나」를 처음으로 수로 말할 수 있다.
 *
 * [⛔ 지키는 것]
 *   · 남의 «완성된 순위표»를 옮기지 않는다. 원자료(위키데이터·열람수)에서 우리가 센다
 *   · 열람수는 **사람 트래픽만**(agent=user). 봇을 섞으면 수가 부풀어 거짓이 된다
 *   · 못 찾은 것은 «0» 이 아니라 **null** 로 둔다. 「위키 문서가 없다」와 「0회 읽혔다」는 다르다
 *
 * [쓰는 법]
 *   node scripts/collect-kcw-webtoon-adaptations.mjs --자가시험
 *   node scripts/collect-kcw-webtoon-adaptations.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 🔴 손님이 읽는 시각이다 — toLocaleString('ko-KR') 은 「오전」을 낸다.
 *  KST 를 영어로 적는다. ⛔ toISOString() 은 UTC 라 새벽에 하루가 어긋난다. */
function 잰때영어(때 = new Date()) {
  const 날 = 때.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const 시 = 때.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${날}, ${시} KST`;
}


const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPARQL = 'https://query.wikidata.org/sparql';
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) webtoon adaptations';
const 창 = 30;

/** 위키백과 열람수 주소 — 사람 트래픽만 */
export function 열람주소(제목, 처음, 끝) {
  const t = encodeURIComponent(String(제목 ?? '').split(' ').join('_'));
  return `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${t}/daily/${처음}/${끝}`;
}

/** YYYYMMDD — ⛔ toISOString() 은 UTC 라 새벽에 하루가 어긋난다 */
export function 날짜꼴(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

/**
 * 원작과 각색 중 어느 쪽이 더 읽혔나.
 * ⭐ 못 잰 쪽이 있으면 «비교하지 않는다» — 0 으로 채우면 늘 한쪽이 이긴다.
 */
export function 어느쪽이(원작, 각색) {
  if (원작 == null || 각색 == null) return { 판정: '못 잼', 까닭: '한쪽 이상이 위키 문서가 없거나 못 쟀다' };
  if (원작 === 0 && 각색 === 0) return { 판정: '둘 다 0', 까닭: '둘 다 읽힌 기록이 없다' };
  if (각색 > 원작) return { 판정: '각색', 배수: 원작 ? +(각색 / 원작).toFixed(1) : null };
  if (원작 > 각색) return { 판정: '원작', 배수: 각색 ? +(원작 / 각색).toFixed(1) : null };
  return { 판정: '같다' };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
const 내가직접돌았나 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (내가직접돌았나 && process.argv.includes('--자가시험')) {
  let 통과 = 0; let 실패 = 0;
  const 참 = (이름, 값) => { if (값) 통과++; else { 실패++; console.log('  🔴', 이름); } };

  참('빈칸을 밑줄로', 열람주소('Sweet Home', '20260101', '20260131').includes('Sweet_Home'));
  참('사람 트래픽만 부른다', 열람주소('x', '20260101', '20260131').includes('/user/'));
  참('봇을 안 섞는다', !열람주소('x', '20260101', '20260131').includes('all-agents'));
  참('영문 위키를 부른다', 열람주소('x', '20260101', '20260131').includes('en.wikipedia'));
  참('빈 제목을 견딘다', typeof 열람주소('', '20260101', '20260131') === 'string');

  참('날짜 꼴', 날짜꼴(new Date(2026, 0, 3)) === '20260103');
  참('두 자리로 채운다', 날짜꼴(new Date(2026, 8, 7)) === '20260907');
  /* ⛔ UTC 로 찍으면 새벽에 하루가 밀린다 — KST 그대로 쓴다 */
  참('새벽에도 그날이다', 날짜꼴(new Date(2026, 8, 7, 0, 30)) === '20260907');

  참('각색이 더 읽히면 각색', 어느쪽이(100, 500).판정 === '각색');
  참('그 배수를 낸다', 어느쪽이(100, 500).배수 === 5);
  참('원작이 더 읽히면 원작', 어느쪽이(500, 100).판정 === '원작');
  참('같으면 같다', 어느쪽이(100, 100).판정 === '같다');
  /* ⭐ 「못 잰 것」을 0 으로 채우지 않는다 — 강령③ */
  참('한쪽이 null 이면 못 잼', 어느쪽이(null, 500).판정 === '못 잼');
  참('둘 다 null 이면 못 잼', 어느쪽이(null, null).판정 === '못 잼');
  참('둘 다 0 은 «못 잼»과 다르다', 어느쪽이(0, 0).판정 === '둘 다 0');
  참('0 을 못 잼으로 읽지 않는다', 어느쪽이(0, 5).판정 === '각색');

  console.log(`\n웹툰 각색 수집 — 자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가직접돌았나) {
  const 물음 = async (q) => {
    for (let 시도 = 0; 시도 < 3; 시도++) {
      try {
        const r = await fetch(SPARQL, {
          method: 'POST',
          headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ query: q }),
          signal: AbortSignal.timeout(120000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()).results.bindings;
      } catch (e) {
        if (시도 === 2) { console.log(`  ⚠ 못 물었다: ${String(e.message).slice(0, 60)}`); return null; }
        await new Promise((s) => setTimeout(s, 5000));
      }
    }
    return null;
  };

  /* ⚠ 한 번에 넓게 물으면 504 가 난다(같은 저장소의 kpop 수집기가 겪었다).
     그래서 «웹툰 원작» 하나로 좁혀 묻는다. */
  const q = `SELECT DISTINCT ?work ?workLabel ?src ?srcLabel ?enWork ?enSrc ?date WHERE {
    ?work wdt:P144 ?src .                      # 원작(based on)
    ?src wdt:P31/wdt:P279* wd:Q1004 .          # 원작이 만화(comic) 갈래
    { ?src wdt:P495 wd:Q884 } UNION { ?work wdt:P495 wd:Q884 }   # 한국 것
    OPTIONAL { ?work wdt:P577 ?date }
    OPTIONAL { ?lw schema:about ?work ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enWork }
    OPTIONAL { ?ls schema:about ?src  ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enSrc }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,ko". }
  } LIMIT 600`;

  console.log('■ 위키데이터에 묻는다 — 한국 만화·웹툰을 원작으로 한 작품\n');
  const 줄 = await 물음(q);
  if (!줄) { console.log('🔴 못 물었다 — **아무것도 안 냈다.**'); process.exit(1); }

  /* 영문 위키 문서가 «양쪽 다» 있는 것만 견줄 수 있다 */
  const 것들 = [];
  const 본것 = new Set();
  for (const b of 줄) {
    const 열쇠 = (b.work?.value || '') + '|' + (b.src?.value || '');
    if (본것.has(열쇠)) continue; 본것.add(열쇠);
    것들.push({
      각색: b.workLabel?.value ?? null, 각색en: b.enWork?.value ?? null,
      원작: b.srcLabel?.value ?? null, 원작en: b.enSrc?.value ?? null,
      나온날: b.date?.value ? b.date.value.slice(0, 10) : null,
    });
  }
  const 잴수있는것 = 것들.filter((x) => x.각색en && x.원작en);
  console.log(`   받은 짝 ${것들.length}쌍 · 그중 «영문 위키가 양쪽 다» 있는 것 ${잴수있는것.length}쌍`);
  console.log(`   ⬜ 한쪽이라도 영문 문서가 없어 못 재는 것 ${것들.length - 잴수있는것.length}쌍 — 0 으로 채우지 않는다\n`);

  /* 열람수 — 사람 트래픽만, 지난 30일 */
  const 끝날 = new Date(); 끝날.setDate(끝날.getDate() - 1);
  const 첫날 = new Date(끝날); 첫날.setDate(첫날.getDate() - (창 - 1));
  const 처음 = 날짜꼴(첫날); const 끝 = 날짜꼴(끝날);

  const 열람 = async (제목) => {
    try {
      const r = await fetch(열람주소(제목, 처음, 끝), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (r.status === 404) return null;          /* 문서가 없다 — 0 이 아니다 */
      if (!r.ok) return null;
      const j = await r.json();
      return (j.items || []).reduce((a, x) => a + (x.views || 0), 0);
    } catch (e) { return null; }
  };

  const 결과 = [];
  for (let i = 0; i < 잴수있는것.length; i++) {
    const x = 잴수있는것[i];
    const 각색수 = await 열람(x.각색en);
    await new Promise((s) => setTimeout(s, 200));
    const 원작수 = await 열람(x.원작en);
    await new Promise((s) => setTimeout(s, 200));
    결과.push({ ...x, 각색열람: 각색수, 원작열람: 원작수, ...어느쪽이(원작수, 각색수) });
    if ((i + 1) % 20 === 0) console.log(`   … ${i + 1}/${잴수있는것.length}`);
  }

  결과.sort((a, b) => (b.각색열람 ?? -1) - (a.각색열람 ?? -1));
  const 잰것 = 결과.filter((x) => x.판정 !== '못 잼');
  const 각색이김 = 잰것.filter((x) => x.판정 === '각색').length;
  const 원작이김 = 잰것.filter((x) => x.판정 === '원작').length;

  console.log(`\n■ 잰 것 ${잰것.length}쌍 · 못 잰 것 ${결과.length - 잰것.length}쌍`);
  console.log(`   각색이 더 읽힌 것 ${각색이김}쌍 · 원작이 더 읽힌 것 ${원작이김}쌍`);
  console.log('\n■ 각색이 가장 많이 읽힌 열 편 (지난 30일 · 사람 트래픽)');
  for (const x of 결과.filter((y) => y.각색열람 != null).slice(0, 10)) {
    console.log(`   ${String(x.각색열람).padStart(8)}  ${String(x.각색en).slice(0, 34).padEnd(35)} ← ${String(x.원작en).slice(0, 26)} (${x.원작열람 ?? '못 잼'})`);
  }

  const 낼것 = {
    잰때: 잰때영어(),
    창: `${처음}~${끝} (30일 · 영문 위키 · 사람 트래픽만)`,
    우물: 'Wikidata SPARQL (P144 based on · P31/P279* Q1004 comic · P495 Q884 South Korea) + Wikimedia Pageviews',
    받은짝: 것들.length, 잴수있는것: 잴수있는것.length, 잰것: 잰것.length,
    각색이김, 원작이김,
    못잰것: 결과.length - 잰것.length,
    rows: 결과,
  };
  const 낼곳 = path.join(뿌리, 'src', 'data', 'kcw-webtoon-adaptations.json');
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n');
  console.log(`\n✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
  console.log('⛔ 「못 잼」은 0 이 아니다 — 영문 위키 문서가 없거나 열람 기록이 없는 것이다.');
}
