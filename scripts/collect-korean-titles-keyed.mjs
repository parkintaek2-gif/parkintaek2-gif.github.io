/**
 * 넷플릭스 Top10 에 든 **한국 작품을 Q번호와 함께** 받는다.
 *
 * ── 왜 만드나 ─────────────────────────────────────────────────
 * `korean-titles.json` 은 **제목 문자열 1,005개**만 들고 있다. Q번호가 없다.
 * 그래서 출연진을 붙이려면 **영어 위키백과 문서 이름으로 다시 맞춰야** 하고,
 * 그렇게 했더니 **1,005편 중 317편(32%)에만** 출연진이 붙었다.
 * 나머지는 문서 이름이 다르거나(「Squid Game (TV series)」) 문서가 없다.
 *
 * 열쇠를 버리면 이렇게 된다. 2번 인계서 ⅩⅢ-3 —
 * 「**파는 것은 조인이다. 붙일 열쇠(작품 ID·인물 ID)를 처음부터 같이 저장하라**」.
 * 배우 쪽에서 같은 실수를 찾아 고치다 **작품 쪽에도 같은 구멍**이 있는 것을 봤다.
 *
 * ── 무엇을 저장하나 ───────────────────────────────────────────
 * 넷플릭스 표에 뜬 제목마다 — Q번호 · 위키데이터 이름표 · 영어 위키백과 문서명 · 갈래.
 * ⛔ 제목 문자열은 열쇠가 아니다. 같은 이름을 여러 나라가 쓴다(우리가 이미 겪었다).
 *    Q번호는 안 바뀌고 겹치지 않는다.
 *
 * ── ⚠ 못 맞춘 것을 세어서 남긴다 ──────────────────────────────
 * 「몇 편을 맞췄다」만 적으면 못 맞춘 쪽이 안 보인다. 못 맞춘 제목을 **파일에 적는다.**
 *
 * 결과 → archive/raw/netflix-top10/korean-titles-keyed.json
 */
import fs from 'node:fs';
import path from 'node:path';
/**
 * ⛔ 「이름이 같은 외국 작품」을 거르는 규칙은 **이미 한 곳에 있다.**
 *   `scripts/lib/korean-netflix-titles.mjs`. 2026-08-07 아침에 /watched 가 14% 틀린
 *   원인이 이 규칙이었고, 그때 한 곳으로 모았다.
 *   **그런데 이 수집기는 그 규칙을 안 썼다.** 그래서 The Perfect Couple(미국) ·
 *   Hunger(태국) · Teach You a Lesson(중국) · Friends(미국) 가 한국 작품으로 들어왔다.
 *   새 스크립트가 **기존 규칙을 물려받지 않는 것**이 오늘 세 번째다. 손 규칙은 여기서 가져다 쓴다.
 */
import { NOT_KOREAN , 열쇠못믿는것 } from './lib/korean-netflix-titles.mjs';

const DIR = path.resolve('archive/raw/netflix-top10');
const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) korean titles keyed';
const SPARQL = 'https://query.wikidata.org/sparql';

/** 넷플릭스 표에 실제로 뜬 제목들. 우리 목록이 아니라 **표가 준 것**이다. */
function 넷플릭스제목() {
  const 모음 = new Set();
  for (const f of ['global.ndjson', 'countries.ndjson']) {
    const p = path.join(DIR, f);
    if (!fs.existsSync(p)) continue;
    for (const 줄 of fs.readFileSync(p, 'utf8').split('\n')) {
      if (!줄.trim()) continue;
      try {
        const j = JSON.parse(줄);
        const t = j.show_title ?? j.title ?? j.제목;
        if (t) 모음.add(String(t).trim());
      } catch { /* 깨진 줄은 건너뛴다 — 세어서 아래에 적는다 */ }
    }
  }
  return 모음;
}

/** 한국 작품 전체를 Q번호와 함께 받는다. 한 번에 다 받으면 502 가 난다 — 나눠 받는다. */
async function 한국작품() {
  const 모음 = new Map();          // 소문자 이름 → { q, 이름, 문서, 갈래 }
  /* 🔴 2026-08-23 — 별칭은 열쇠로만 들어가 값에 안 담겼다. 판정 규칙이 읽는 이름 목록에서
     빠지므로, **대소문자 그대로의 이름**을 따로 모은다. 규칙은 글자를 그대로 맞춘다. */
  const 쓰인이름 = new Set();
  let 같은근거로부딪침 = 0;   // ⚠ 같은 근거 둘이 한 이름을 다툰 횟수 — 못 가린 자리다
  const 갈래 = [['film', 'wd:Q11424'], ['series', 'wd:Q5398426']];
  for (const [이름, cls] of 갈래) {
    for (let off = 0; ; off += 5000) {
      const q = `SELECT ?w ?label ?an ?alt WHERE {
        ?w wdt:P31/wdt:P279* ${cls} ; wdt:P495 wd:Q884 ; rdfs:label ?label .
        FILTER(LANG(?label) = 'en')
        OPTIONAL { ?s schema:about ?w ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?an . }
        OPTIONAL { ?w skos:altLabel ?alt . FILTER(LANG(?alt) = 'en') }
      } ORDER BY ?w LIMIT 5000 OFFSET ${off}`;
      const rows = await 물기(q);
      if (rows === null) throw new Error(`${이름} off=${off} 를 못 받았다 — 반쯤 받은 명단을 쓰지 않는다`);
      for (const b of rows) {
        /*
         * 이름표 · 문서명 · 별칭 셋 다 열쇠로 쓴다 — 넷플릭스가 어느 것을 쓸지 모른다.
         *
         * ── 🔴 2026-08-23 · 먼저 온 것이 이기게 두면 안 된다 ──────────
         * 앞서는 `if (!모음.has(k))` 로 **먼저 온 것**이 열쇠를 차지했다. 그런데 오는 차례는
         * Q번호 순이지 맞음새 순이 아니다. 그래서 남의 작품의 **별칭**이 진짜 작품의
         * **이름표**보다 먼저 와서 자리를 뺏었다 —
         * ```
         *   차트 'Voice'    → 「On the Line (2021)」    (별칭이 먼저 왔다)
         *   차트 'Stranger' → 「The Stranger (1984)」   (별칭이 먼저 왔다)
         * ```
         * 둘 다 한국 작품이라 나라 거르개에는 안 걸린다. **이름만 맞고 작품은 남의 것**이다.
         * 그 열쇠로 출연진·회사를 붙이면 지면이 남의 배우를 이 작품 이름으로 보여 준다.
         * ⭐ 그래서 **근거에 차례를 매긴다** — 이름표 > 문서명 > 별칭. 별칭은 이름표를 못 이긴다.
         * ⚠ 같은 근거끼리 부딪치면 먼저 온 것을 둔다. 그건 여전히 못 가리는 자리다 — 세어 둔다.
         */
        const 근거순위 = { label: 3, article: 2, alias: 1 };
        const 이름들 = [[b.label.value, 'label'], [b.an?.value, 'article'], [b.alt?.value, 'alias']];
        for (const [n, 근거] of 이름들) {
          if (!n) continue;
          쓰인이름.add(n);
          const k = n.toLowerCase();
          const 앞 = 모음.get(k);
          if (앞 && 근거순위[앞.근거] >= 근거순위[근거]) { if (근거순위[앞.근거] === 근거순위[근거]) 같은근거로부딪침 += 1; continue; }
          모음.set(k, { q: b.w.value.split('/').pop(), 이름: b.label.value, 문서: b.an?.value ?? null, 갈래: 이름, 근거 });
        }
        }
      process.stdout.write('.');
      if (rows.length < 5000) break;
      await new Promise((s) => setTimeout(s, 400));
    }
  }
  process.stdout.write('\n');
  모음.쓰인이름 = 쓰인이름;   // ⚠ Map 에 얹는다 — 부르는 쪽 셋을 안 바꾸려고 그렇게 한다
  모음.같은근거로부딪침 = 같은근거로부딪침;
  console.log(`이름 열쇠 ${모음.size}개 · ⚠ 같은 근거끼리 한 이름을 다툰 자리 ${같은근거로부딪침}건 — 먼저 온 것을 뒀다`);
  return 모음;
}

async function 물기(q) {
  for (let 시도 = 0; 시도 < 3; 시도++) {
    try {
      const r = await fetch(SPARQL, {
        method: 'POST',
        headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json',
          'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ query: q }),
        signal: AbortSignal.timeout(180000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).results.bindings;
    } catch { if (시도 === 2) return null; await new Promise((s) => setTimeout(s, 6000)); }
  }
  return null;
}

const 표제목 = 넷플릭스제목();
if (!표제목.size) { console.error('❌ 넷플릭스 표에서 제목을 하나도 못 읽었다'); process.exit(1); }
console.log(`넷플릭스 표에 뜬 제목 ${표제목.size.toLocaleString()}개`);

const 위키 = await 한국작품();
console.log(`위키데이터 한국 작품 이름 ${위키.size.toLocaleString()}개(이름표·문서명 둘 다 셈)`);

/**
 * 넷플릭스가 붙인 **언어 딱지**를 제목마다 만든다.
 * 넷플릭스는 작품의 주 언어로 English / Non-English 차트를 가른다.
 * 한국 작품이 영어 차트에 오르는 일은 사실상 없다 → **영어 차트로 확인된 제목은 뺀다.**
 * ⚠ 한 제목이 양쪽에 다 나오면 **이름만 같은 두 작품**이다. 'both' 로 두고 세어서 남긴다.
 */
const 언어 = new Map();
{
  const tsv = fs.readdirSync(DIR).filter((f) => /^global-.*\.tsv$/.test(f)).sort().pop();
  if (!tsv) { console.error('❌ 글로벌 TSV 가 없다 — 언어 딱지를 만들 수 없다'); process.exit(1); }
  const 줄들 = fs.readFileSync(path.join(DIR, tsv), 'utf8').trim().split(/\r?\n/);
  const 머리 = 줄들[0].split('\t');
  const iT = 머리.indexOf('show_title'); const iC = 머리.indexOf('category');
  for (const 줄 of 줄들.slice(1)) {
    const c = 줄.split('\t');
    const l = /Non-English/i.test(c[iC]) ? 'ne' : 'en';
    const 전 = 언어.get(c[iT]);
    언어.set(c[iT], 전 && 전 !== l ? 'both' : l);
  }
}

const 맞춘것 = new Map();          // Q → 정보
const 못맞춘것 = [];
const 뺀것 = { 영어차트: [], 손으로: [], 이름겹침: [], 딱지없음: [], 못믿을열쇠: [] };
for (const t of 표제목) {
  const v = 위키.get(t.toLowerCase());
  if (!v) { 못맞춘것.push(t); continue; }
  if (NOT_KOREAN.has(t)) { 뺀것.손으로.push(t); continue; }
  const l = 언어.get(t);
  if (l === 'en') { 뺀것.영어차트.push(t); continue; }
  /* ⛔ 'both' 는 **못 가른 것**이다. 남기되 세어서 파일에 적는다 — 지면이 그 수를 밝힌다. */
  if (l === 'both') 뺀것.이름겹침.push(t);
  if (l === undefined) 뺀것.딱지없음.push(t);
  /* ⛔ 별칭으로 붙었지만 남의 작품임을 눈으로 확인한 것은 안 담는다.
     담으면 출연진·회사가 남의 것으로 붙어 지면이 틀린 말을 한다. */
  if (열쇠못믿는것.has(t)) { 뺀것.못믿을열쇠.push(`${t} — ${열쇠못믿는것.get(t)}`); continue; }
  맞춘것.set(v.q, { ...v, 넷플릭스제목: t, 언어딱지: l ?? null });
}
console.log(`영어 차트로 확인돼 뺀 제목 ${뺀것.영어차트.length}개 · 손으로 뺀 것 ${뺀것.손으로.length}개`);
console.log(`남겼지만 못 가른 것 — 이름 겹침 ${뺀것.이름겹침.length}개 · 언어 딱지 없음 ${뺀것.딱지없음.length}개`);

/* 지난번에 «맞춘 작품 수»와 견준다. ⛔ 후보 이름 수와 견주지 않는다 — 뜻이 다른 두 수다 */
const 옛열쇠길 = path.join(DIR, 'korean-titles-keyed.json');
let 옛수 = 0;
try {
  옛수 = JSON.parse(fs.readFileSync(옛열쇠길, 'utf8')).맞춘작품수 ?? 0;
} catch { 옛수 = 0; }   // 첫 실행이면 견줄 것이 없다. 세우지 않는다
console.log(`맞춘 한국 작품 ${맞춘것.size}편 · 옛 파일 ${옛수}편 · 못 맞춘 제목 ${못맞춘것.length}개(대부분 한국 작품이 아니다)`);

if (옛수 && 맞춘것.size < 옛수 * 0.8) {
  console.error(`❌ 새 명단이 옛것의 80% 미만이다 (${맞춘것.size} < ${Math.round(옛수 * 0.8)}). 파일을 쓰지 않는다.`);
  process.exit(1);
}

/* ⛔ 있어야 할 작품을 눈으로 찾는다. 수치가 멀쩡해도 빠질 수 있다. */
const 온도계 = ['Squid Game', 'Kingdom', 'The Glory', 'Extraordinary Attorney Woo', 'Sweet Home'];
const 있는이름 = new Set([...맞춘것.values()].flatMap((v) => [v.이름, v.문서, v.넷플릭스제목].filter(Boolean)));
const 없는것 = 온도계.filter((n) => !있는이름.has(n));
if (없는것.length) {
  console.error(`❌ 있어야 할 작품이 없다: ${없는것.join(' · ')}. 파일을 쓰지 않는다.`);
  process.exit(1);
}

const 산출 = path.join(DIR, 'korean-titles-keyed.json');
fs.writeFileSync(산출, JSON.stringify({
  갱신: new Date().toLocaleString('ko-KR'),
  출처: 'Netflix Top 10 (Tudum) weekly lists matched to Wikidata items with country of origin P495=Q884, '
    + 'by English label or English Wikipedia article name (case-insensitive).',
  주의: '⚠ 제목 문자열은 열쇠가 아니다. 같은 이름을 여러 나라가 쓴다. 열쇠는 Q번호다.',
  넷플릭스제목수: 표제목.size,
  맞춘작품수: 맞춘것.size,
  못맞춘제목수: 못맞춘것.length,
  /** 뺀 것과 **못 가른 것**을 나눠 적는다. 뭉치면 「거른 줄 알았다」가 된다. */
  뺀것: {
    영어차트: 뺀것.영어차트.sort(), 손으로: 뺀것.손으로.sort(),
  },
  못가른것: {
    이름겹침: 뺀것.이름겹침.sort(), 언어딱지없음수: 뺀것.딱지없음.length,
  },
  /** 못 맞춘 제목 전부. 대부분 한국 작품이 아니지만, **세어 보라고 남긴다.** */
  못맞춘제목: 못맞춘것.sort(),
  작품: Object.fromEntries([...맞춘것].map(([q, v]) => [q, v])),
}, null, 2));
console.log(`저장 ${산출}`);

/**
 * 🔴 2026-08-23 — 이름 목록도 같이 낸다.
 *   `scripts/lib/korean-netflix-titles.mjs`(한국 작품 판정 규칙)가 이 파일을 읽는데,
 *   **그것을 만드는 자가 저장소에 없었다.** 자료를 새로 캐면 규칙이 못 돌고 지면 528장이 멈춘다.
 * ⭐ 이 자가 이미 같은 질의로 그 이름들을 다 받고 있다 — 받아 놓고 안 적고 있었을 뿐이다.
 *   따로 수집기를 만들지 않는다. 두 파일이 다른 날의 위키데이터를 보면 언젠가 조용히 갈라진다.
 * ⚠ 여기 담기는 것은 «후보»다 — 이름이 같은 남의 나라 작품도 들어 있다.
 *   거르는 일은 규칙(영어 차트 딱지·손으로 뺀 목록)이 한다. 이 파일은 거르지 않는다.
 */
const 이름산출 = path.join(DIR, 'korean-titles.json');
const 이름들 = [...(위키.쓰인이름 ?? new Set())].sort();
fs.writeFileSync(이름산출, JSON.stringify({
  받은날: new Date().toISOString().slice(0, 10),
  출처: 'Wikidata: works with country of origin (P495) = South Korea (Q884), English labels and English Wikipedia article names.',
  주의: '⚠ 후보 목록이다. 이름이 같은 남의 나라 작품이 섞여 있다 — 거르는 일은 판정 규칙이 한다.',
  제목수: 이름들.length,
  제목: 이름들,
}, null, 1) + String.fromCharCode(10));
console.log(`저장 ${이름산출} — 이름 ${이름들.length}개`);
for (const n of 온도계) {
  const v = [...맞춘것.values()].find((x) => [x.이름, x.문서, x.넷플릭스제목].includes(n));
  console.log(`  ${n.padEnd(28)} ${v.q} · ${v.갈래}`);
}
