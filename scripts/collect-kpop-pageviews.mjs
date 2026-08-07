/**
 * K Culture Wire — 한국 **음악** 쪽 관심도(영문 위키백과 조회수)를 모은다.
 *
 * ── 왜 이 자료인가 ─────────────────────────────────────────────
 * 사장님 지시(2026-08-05): 「k팝 등에 관심이 많은 **해외 대상**이다」.
 * 그런데 우리 지면 열다섯 장 중 음악은 `/exports` **한 장뿐**이고 그것도 수출 금액이다.
 * 사람이 K팝을 검색해 들어올 자리가 없다. 이 수집이 그 자리를 만든다.
 *
 * ── 명단을 사람이 고르지 않는다 ────────────────────────────────
 * 배우 쪽에서 쓴 규칙 그대로다 — 우리가 고르면 우리 취향이 순위가 된다.
 *   Wikidata: 한국 국적(P27=Q884)이고 직업이 가수·래퍼·작곡가·음악가인 사람
 *           + 한국(P495=Q884)이 만든 음악 그룹(P31=Q215380)
 *   영문 위키 문서가 있는 것만 — 조회수를 잴 수 없으면 셀 수도 없다
 *
 * ⚠ 조회수는 **인기가 아니라 관심**이다. 좋은 일로도 나쁜 일로도 오른다.
 *   지면에 「인기 순위」라고 쓰지 않는다. **「관심도」**라고 쓴다.
 * ⚠ 404 는 「문서가 없다」이지 「0회」가 아니다. 0 으로 세면 순위가 통째로 틀린다.
 *
 * 결과 → archive/raw/star-pageviews/kpop-YYYYMMDD.json (원자료)
 * 키·로그인 필요 없음. 2015년부터 소급된다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { 날짜, 한명 } from './collect-star-pageviews.mjs';

const OUT = path.resolve('archive/raw/star-pageviews');
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) k-pop attention';
const SPARQL = 'https://query.wikidata.org/sparql';
const 간격ms = 250;
const 창 = 30;

/** 직업 코드 — 가수 · 래퍼 · 작곡가 · 음악가. 배우는 일부러 뺀다(그쪽은 /actors 다). */
const 직업 = ['wd:Q177220', 'wd:Q2252262', 'wd:Q639669', 'wd:Q753110'];

/**
 * ⚠ 한 번에 다 물으면 **504** 가 난다. 실제로 그랬다.
 *   그룹 하나, 직업 하나씩 — 좁은 질의 다섯 번으로 나눠 묻고 합친다.
 *   느린 대신 답이 온다. 답이 안 오는 빠른 질의는 아무 값이 없다.
 */
async function 한질의(where, kind) {
  const q = `SELECT DISTINCT ?enwiki WHERE {
    ${where}
    ?sitelink schema:about ?item ;
              schema:isPartOf <https://en.wikipedia.org/> ;
              schema:name ?enwiki .
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
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      return j.results.bindings.map((b) => ({ name: b.enwiki.value, kind }));
    } catch (e) {
      if (시도 === 2) { console.log(`  ⚠ 이 갈래는 못 물었다 (${kind}): ${e.message}`); return null; }
      await new Promise((s) => setTimeout(s, 5000));
    }
  }
  return null;
}

async function 명단() {
  /**
   * ⚠ `wdt:P31 wd:Q215380`(음악 그룹) **하나만** 쓰면 K팝의 대부분이 빠진다.
   *   블랙핑크는 위키데이터에 **girl group 으로만** 달려 있고 musical group 이 없다.
   *   처음에 그렇게 뽑았더니 412팀이 나왔고 그 안에
   *   **Twice · Blackpink · 소녀시대 · aespa · NewJeans · IVE 가 전부 없었다.**
   *   K팝 지면에 블랙핑크가 없으면 그 지면은 틀린 것이다.
   *
   *   `P31/P279*` 로 **하위 유형까지** 훑는다 — girl group · boy band 가 그렇게 들어온다.
   *   412 → 816팀. 위 여섯이 전부 잡히는 것을 눈으로 확인했다.
   *   질의는 2.9초로 여전히 빠르다.
   */
  const 조각 = [
    ['?item wdt:P31/wdt:P279* wd:Q215380 ; wdt:P495 wd:Q884 .', 'group'],
    ...직업.map((o) => [`?item wdt:P31 wd:Q5 ; wdt:P27 wd:Q884 ; wdt:P106 ${o} .`, 'person']),
  ];
  /* 같은 이름이 두 갈래로 오면 사람 쪽을 남긴다 — 그룹 판정이 더 헐겁다. */
  const m = new Map();
  let 못물음 = 0;
  for (const [where, kind] of 조각) {
    const rows = await 한질의(where, kind);
    if (rows === null) { 못물음++; continue; }
    for (const r of rows) if (!m.has(r.name) || r.kind === 'person') m.set(r.name, r.kind);
    process.stdout.write(`${rows.length} `);
  }
  process.stdout.write('\n');
  /* 못 물은 갈래가 있으면 **명단이 덜 찬 것**이다. 조용히 넘기지 않는다. */
  if (못물음) console.log(`  ⚠ ${조각.length}개 갈래 중 ${못물음}개를 못 물었다 — 명단이 덜 찼다`);
  return { roster: [...m].map(([name, kind]) => ({ name, kind })), 못물음, 갈래수: 조각.length };
}

const 오늘 = new Date();
const 끝 = new Date(오늘); 끝.setDate(끝.getDate() - 1);
const 시작 = new Date(끝); 시작.setDate(시작.getDate() - (창 - 1));

console.log('명단을 위키데이터에 묻는다…');
const { roster, 못물음, 갈래수 } = await 명단();
console.log(`명단 ${roster.length}명·팀 (그룹 ${roster.filter((x) => x.kind === 'group').length})`);

const 결과 = [];
let 잡힘 = 0, 문서없음 = 0, 실패 = 0;
const 실패이유 = new Map();

/**
 * ⚠ 「문서가 없다(404)」와 「부르다 실패했다(예외)」를 **절대 한 칸에 담지 않는다.**
 *   처음에 둘을 「못 찾음」 하나로 세었더니 **1,958건 전부가 실패한 것이 「문서가 없다」로 보였다.**
 *   수치가 그럴듯해서 잘못을 못 볼 뻔했다. 갈라 세면 0/1958 이 즉시 이상해 보인다.
 *
 * ⚠ 그리고 실패가 절반을 넘으면 **파일을 안 쓴다.** 반쯤 빈 자료를 남기면
 *   다음 사람이 그것을 「그 정도밖에 없다」로 읽는다.
 */
/**
 * 한 줄씩 물으면 1,958명에 10분 넘게 걸리고, 그 사이에 한 번이라도 끊기면 처음부터다.
 * 실제로 두 번 끊겼다. **동시에 여섯 줄**로 묻는다 — 2분이면 끝난다.
 *
 * ⛔ 더 늘리지 않는다. 위키미디어는 우리에게 키도 안 받고 열어 준 곳이다.
 *    빨리 받겠다고 남의 서버를 두드리지 않는다. 여섯이면 초당 스물 남짓이다.
 */
/**
 * ⚠ 여섯 줄로 두드렸더니 **2,362건 중 2,164건이 429(속도 제한)** 로 튕겼다.
 *   빨리 받으려다 남의 서버에 무례했다. **두 줄로 줄이고 간격을 늘린다.**
 *   초당 여덟 번쯤이다. 5분이면 끝나고, 그 정도면 서로 편하다.
 *
 * ⚠ 429 는 **실패가 아니라 「천천히 하라」**다. 실패로 세면 남의 말을 우리 잘못으로 적는 것이다.
 *   기다렸다 다시 부른다. 세 번까지 기다리고, 그래도 안 되면 그때 실패로 센다.
 */
const 동시 = 2;
const 뜸들이기 = [2000, 6000, 15000];
let 다음 = 0;
let 참은횟수 = 0;

async function 참고부르기(name) {
  for (let 시도 = 0; ; 시도++) {
    try {
      /* 한명() 은 이미 합·하루평균·최고·상승배수까지 낸 **객체**를 돌려준다.
         일별 배열이 아니다. 여기서 다시 계산하지 않는다 — 두 곳에서 세면 언젠가 갈라진다. */
      return await 한명(name, 날짜(시작), 날짜(끝));
    } catch (e) {
      const 속도제한 = /429/.test(String(e.message));
      if (!속도제한 || 시도 >= 뜸들이기.length) throw e;
      참은횟수++;
      await new Promise((s) => setTimeout(s, 뜸들이기[시도]));
    }
  }
}

async function 한줄() {
  while (다음 < roster.length) {
    const i = 다음++;
    const p = roster[i];
    try {
      const v = await 참고부르기(p.name);
      if (v === null) { 문서없음++; }
      else { 결과.push({ ...v, 갈래: p.kind }); 잡힘++; }
    } catch (e) {
      실패++;
      const 이유 = String(e.message).slice(0, 40);
      실패이유.set(이유, (실패이유.get(이유) || 0) + 1);
    }
    if (i % 200 === 0) process.stdout.write('.');
    await new Promise((s) => setTimeout(s, 간격ms));
  }
}
await Promise.all(Array.from({ length: 동시 }, () => 한줄()));
process.stdout.write('\n');
if (참은횟수) console.log(`⏳ 429 로 기다렸다 다시 부른 횟수 ${참은횟수} — 실패가 아니라 예의다`);

if (실패) {
  console.log(`⚠ 부르다 실패 ${실패}건 — ${[...실패이유].map(([k, n]) => `${k}×${n}`).join(' · ')}`);
}
if (잡힘 === 0) {
  console.error('🔴 하나도 못 잡았다. 파일을 쓰지 않는다 — 빈 자료는 「그만큼밖에 없다」로 읽힌다.');
  process.exit(1);
}
if (실패 > roster.length / 2) {
  console.error(`🔴 절반 넘게(${실패}/${roster.length}) 실패했다. 파일을 쓰지 않는다.`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
const 파일 = path.join(OUT, `kpop-${날짜(끝)}.json`);
fs.writeFileSync(파일, JSON.stringify({
  갱신: new Date().toLocaleString('ko-KR'),
  출처: 'Wikimedia Pageviews API (en.wikipedia, all-access, user)',
  명단출처: 'Wikidata — P27=Q884 with occupation singer/rapper/composer/musician, plus P31=Q215380 musical groups with P495=Q884. English Wikipedia article required.',
  기간: `${날짜(시작)}~${날짜(끝)}`,
  일수: 창,
  대상: roster.length,
  명단못물은갈래: 못물음,
  명단갈래수: 갈래수,
  잡힘,
  문서없음,
  부르기실패: 실패,
  사람: 결과,
}, null, 2));

console.log(`저장 ${파일}`);
console.log(`대상 ${roster.length} · 잡힘 ${잡힘} · 문서없음 ${문서없음} · 부르기실패 ${실패}`);
console.log('관심 상위 8:', [...결과].sort((a, b) => b.합 - a.합).slice(0, 8)
  .map((r) => `${r.이름}(${r.합.toLocaleString()})`).join(' · '));
