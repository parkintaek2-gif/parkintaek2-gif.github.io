/**
 * collect-korean-groups.mjs — **한국 음악 그룹과 그 멤버를 위키데이터에서 캔다.**
 *
 * ── 🔴 왜 이 자료를 캐나 ───────────────────────────────────────
 * 2026-08-25 아침, 우리 검색 실측에서 **가장 노출이 큰 지면이 BTS 기사**였다(68노출).
 * 그래서 그 갈래 수요를 재 보니 —
 * ```
 *   bts members age        자동완성 1번째 · 그 말로 시작 10줄
 *   bts members birthday   자동완성 1번째 · 10줄
 *   blackpink members age  자동완성 1번째 · 10줄
 *   kpop idols age         자동완성 1번째 · 10줄
 * ```
 * ⭐ 손님이 묻는 낱알은 **「그룹 하나의 멤버들」**이다. 우리는 생년월일 9,249건을 갖고
 *   있었지만 **그룹과 멤버를 잇는 자료가 없었다.** 그래서 그 축으로는 한 장도 못 냈다.
 *
 * ── ⛔ 이 자료를 쓸 때 반드시 같이 말해야 하는 것 ───────────────
 * ⛔ **키(P2048)는 안 캔다.** `bts members height` 도 1번째·10줄이지만 위키데이터에
 *   키가 적힌 한국 연예인은 9,249명 중 320명(3.5%)뿐이다. 수요가 커도 자료가 못 답하면
 *   안 만든다 — 8/25 새벽에 학교 지면을 내면서 같은 이유로 키 지면을 안 만들었다.
 * ⛔ **멤버 수를 「현재 멤버」라고 말하지 않는다.** P527 은 «있었던» 멤버를 담는다 —
 *   탈퇴한 사람도 들어 있다. 우리는 그 둘을 못 가른다. 지면에 그렇게 적는다.
 * ⛔ 못 물으면 0 으로 적지 않고 멈춘다.
 *
 * 쓰는 법  node scripts/collect-korean-groups.mjs --자가시험
 *          node scripts/collect-korean-groups.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'archive/raw/wikidata/korean-groups.json');

const SPARQL = 'https://query.wikidata.org/sparql';
const 머리말 = {
  Accept: 'application/sparql-results+json',
  'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)',
};
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 물음글. **한국 그룹을 두 갈래로 잡는다** —
 *   ① 그룹 자체에 「한국」이 적힌 것(P495)
 *   ② 그룹에 적힌 «멤버»가 한국 국적인 것(P27)
 * ⛔ ①만 쓰면 BTS 처럼 P495 가 안 적힌 그룹을 놓친다. 실제로 처음엔 놓쳤다.
 *   ⭐ 자를 세울 때 «내가 아는 참인 것»(BTS·BLACKPINK)에 먼저 대 본다.
 */
export function 물음글(오프셋 = 0, 한번에 = 400) {
  return `SELECT ?g ?gLabel ?m ?mLabel ?birth ?pobLabel ?sitelinks WHERE {
  {
    SELECT DISTINCT ?g WHERE {
      ?g wdt:P31/wdt:P279* wd:Q215380 .
      { ?g wdt:P495 wd:Q884 } UNION { ?g wdt:P527 ?any . ?any wdt:P27 wd:Q884 }
    } ORDER BY ?g LIMIT ${한번에} OFFSET ${오프셋}
  }
  ?g wdt:P527 ?m .
  OPTIONAL { ?m wdt:P569 ?birth }
  OPTIONAL { ?m wdt:P19 ?pob }
  OPTIONAL { ?m wikibase:sitelinks ?sitelinks }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}`;
}

export function 큐번호(주소) {
  const m = String(주소 ?? '').match(/(Q\d+)$/);
  return m ? m[1] : null;
}

/** 영어로 읽히는 이름인가 — 영문 지면에 한글·Q번호를 이름으로 쓸 수 없다 */
export function 영문이름인가(이름) {
  const s = String(이름 ?? '').trim();
  if (!s || /^Q\d+$/.test(s)) return false;
  if (/[가-힣]/.test(s)) return false;
  return /[A-Za-z0-9]/.test(s);
}

export function 슬러그(이름) {
  return String(이름 ?? '').toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** 생일에서 날짜만 — 위키데이터는 시각까지 준다. 못 읽으면 null 이다(0 이 아니다) */
export function 생일(v) {
  const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * 물어 온 줄을 그룹별로 접는다.
 * ⚠ 한 멤버가 여러 줄로 올 수 있다(태어난 곳이 둘 적힌 경우 등) — 큐번호로 하나만 남긴다.
 */
export function 접는다(줄들) {
  const 그룹 = new Map();
  let 이름못읽는그룹 = 0;
  let 이름못읽는멤버 = 0;
  for (const b of 줄들 ?? []) {
    const gq = 큐번호(b?.g?.value);
    const mq = 큐번호(b?.m?.value);
    if (!gq || !mq) continue;
    const g이름 = b?.gLabel?.value ?? '';
    const m이름 = b?.mLabel?.value ?? '';
    if (!영문이름인가(g이름)) { 이름못읽는그룹++; continue; }
    if (!그룹.has(gq)) {
      그룹.set(gq, { q: gq, name: g이름, slug: 슬러그(g이름), members: new Map(), 이름없는멤버: new Set() });
    }
    const G = 그룹.get(gq);
    /*
     * 🔴 이름을 못 읽는 멤버를 «그룹마다» 센다. 전체로만 세다가 틀릴 뻔했다 —
     * 위키데이터는 BLACKPINK 를 4명으로 적는데 로제에게 영문 이름이 없어 우리가 3명으로
     * 냈다. 「멤버 3명」은 «틀린 수»다. 이름을 못 쓰는 것과 사람이 없는 것은 다르다.
     * ⭐ 학교 지면에서 쓴 것과 같은 규칙이다 — «세되 이름은 안 쓴다».
     */
    if (!영문이름인가(m이름)) { 이름못읽는멤버++; G.이름없는멤버.add(mq); continue; }
    if (!G.members.has(mq)) {
      G.members.set(mq, {
        q: mq,
        name: m이름,
        born: 생일(b?.birth?.value),
        birthplace: 영문이름인가(b?.pobLabel?.value) ? b.pobLabel.value : null,
        languages: b?.sitelinks?.value ? Number(b.sitelinks.value) : null,
      });
    }
  }
  return { 그룹, 이름못읽는그룹, 이름못읽는멤버 };
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('큐번호 — 주소에서 뽑는다', 큐번호('http://www.wikidata.org/entity/Q13580495') === 'Q13580495');
  T('큐번호 — 아니면 null', 큐번호('그냥') === null);

  T('영문이름 — 보통 이름 통과', 영문이름인가('Stray Kids'));
  T('영문이름 — Q번호는 이름이 아니다', !영문이름인가('Q123'));
  T('영문이름 — 한글은 영문 지면에 못 쓴다', !영문이름인가('방탄소년단'));

  T('슬러그 — 빈칸은 이음표', 슬러그('Stray Kids') === 'stray-kids');
  T('슬러그 — 별표·점은 지운다', 슬러그('Iz*One') === 'iz-one');

  T('생일 — 시각을 떼고 날짜만', 생일('1997-09-01T00:00:00Z') === '1997-09-01');
  T('생일 — 못 읽으면 null(0 이 아니다)', 생일('모름') === null);
  T('생일 — 빈 값도 null', 생일(undefined) === null);

  /* 🔴 물음글이 «두 갈래»로 잡아야 한다. 한 갈래(P495)만 쓰면 BTS 를 놓친다 —
     실제로 처음에 놓쳤고, 아는 참인 것(BTS·BLACKPINK)에 대 보고서야 알았다 */
  T('물음글 — 그룹 자체의 한국(P495)을 본다', 물음글().includes('wdt:P495 wd:Q884'));
  T('물음글 — «멤버»의 한국 국적(P27)도 본다', 물음글().includes('wdt:P27 wd:Q884'));
  T('물음글 — 두 갈래를 UNION 으로 잇는다', 물음글().includes('UNION'));
  T('물음글 — 멤버(P527)를 묻는다', 물음글().includes('wdt:P527'));
  T('물음글 — 생일(P569)을 묻는다', 물음글().includes('wdt:P569'));
  T('물음글 — 키(P2048)는 «안» 묻는다(3.5%뿐이라 답할 수 없다)', !물음글().includes('P2048'));
  T('물음글 — 오프셋이 반영된다', 물음글(400).includes('OFFSET 400'));

  const 줄 = [
    { g: { value: 'http://www.wikidata.org/entity/Q1' }, gLabel: { value: 'Alpha' }, m: { value: 'http://www.wikidata.org/entity/Q10' }, mLabel: { value: 'One' }, birth: { value: '1997-09-01T00:00:00Z' }, pobLabel: { value: 'Busan' }, sitelinks: { value: '30' } },
    { g: { value: 'http://www.wikidata.org/entity/Q1' }, gLabel: { value: 'Alpha' }, m: { value: 'http://www.wikidata.org/entity/Q10' }, mLabel: { value: 'One' }, birth: { value: '1997-09-01T00:00:00Z' }, pobLabel: { value: 'Seoul' }, sitelinks: { value: '30' } },
    { g: { value: 'http://www.wikidata.org/entity/Q1' }, gLabel: { value: 'Alpha' }, m: { value: 'http://www.wikidata.org/entity/Q11' }, mLabel: { value: 'Two' }, pobLabel: { value: '부산' } },
    { g: { value: 'http://www.wikidata.org/entity/Q2' }, gLabel: { value: '한글그룹' }, m: { value: 'http://www.wikidata.org/entity/Q12' }, mLabel: { value: 'Three' } },
    { g: { value: 'http://www.wikidata.org/entity/Q3' }, gLabel: { value: 'Beta' }, m: { value: 'http://www.wikidata.org/entity/Q13' }, mLabel: { value: '한글이름' } },
  ];
  const r = 접는다(줄);
  T('접기 — 같은 멤버가 두 줄로 와도 한 번만', r.그룹.get('Q1').members.size === 2);
  T('접기 — 생일을 날짜로 담는다', r.그룹.get('Q1').members.get('Q10').born === '1997-09-01');
  T('접기 — 생일이 없으면 null', r.그룹.get('Q1').members.get('Q11').born === null);
  T('접기 — 한글 태어난 곳은 이름으로 안 쓴다', r.그룹.get('Q1').members.get('Q11').birthplace === null);
  T('접기 — 한글 그룹 이름은 «세고» 안 담는다', !r.그룹.has('Q2') && r.이름못읽는그룹 === 1);
  T('접기 — 한글 멤버 이름은 «세고» 안 담는다', r.이름못읽는멤버 === 1);
  /*
   * 🔴 이 셋이 «내가 틀릴 뻔한» 자리다. 위키데이터는 BLACKPINK 를 4명으로 적는데
   * 로제에게 영문 이름이 없어 우리가 3명으로 냈다. 「멤버 3명」은 틀린 수다.
   * ⭐ 아는 참인 것(BLACKPINK 4명)에 대 보고서야 알았다. 그룹마다 따로 세게 고쳤다.
   */
  T('접기 — 이름 못 읽는 멤버를 «그 그룹에» 센다', r.그룹.get('Q3').이름없는멤버.size === 1);
  T('접기 — 그래서 적힌 멤버 수는 이름 있는 수보다 클 수 있다',
    r.그룹.get('Q3').members.size + r.그룹.get('Q3').이름없는멤버.size === 1);
  T('접기 — 이름 있는 멤버만 있는 그룹은 둘이 같다',
    r.그룹.get('Q1').이름없는멤버.size === 0);
  T('접기 — 빈 입력에 안 터진다', 접는다(undefined).그룹.size === 0);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ collect-korean-groups 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ collect-korean-groups 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  const 모두 = new Map();
  let 그룹못읽음 = 0;
  let 멤버못읽음 = 0;
  const 한번에 = 400;
  for (let off = 0; off < 4000; off += 한번에) {
    let 줄들;
    for (let i = 0; i < 4 && !줄들; i++) {
      try {
        const r = await fetch(`${SPARQL}?query=${encodeURIComponent(물음글(off, 한번에))}`, { headers: 머리말 });
        if (r.ok)줄들 = (await r.json())?.results?.bindings ?? [];
        else if (r.status !== 429 && r.status < 500) { console.error(`⛔ 못 물었다 — HTTP ${r.status}`); process.exit(1); }
      } catch { /* 되묻는다 */ }
      if (!줄들) await 쉼(2500 * (i + 1));
    }
    if (줄들 === undefined) { console.error('⛔ 못 물었다 — 0 으로 적지 않고 멈춘다'); process.exit(1); }
    if (!줄들.length) break;
    const { 그룹, 이름못읽는그룹, 이름못읽는멤버 } = 접는다(줄들);
    그룹못읽음 += 이름못읽는그룹;
    멤버못읽음 += 이름못읽는멤버;
    for (const [q, g] of 그룹) {
      if (!모두.has(q)) 모두.set(q, g);
      else {
        for (const [mq, m] of g.members) if (!모두.get(q).members.has(mq)) 모두.get(q).members.set(mq, m);
        for (const mq of g.이름없는멤버) 모두.get(q).이름없는멤버.add(mq);
      }
    }
    console.log(`  … ${off + 한번에} 까지 — 그룹 ${모두.size}개`);
    await 쉼(1200);
  }

  const 냄 = [...모두.values()].map((g) => ({
    q: g.q,
    name: g.name,
    slug: g.slug,
    /* 위키데이터가 «적은» 멤버 수 — 이름을 못 쓰는 사람까지 포함한다 */
    membersRecorded: g.members.size + g.이름없는멤버.size,
    /* 그중 «이름을 적을 수 있는» 사람 — 지면에 이름이 나오는 수다 */
    membersNamed: g.members.size,
    members: [...g.members.values()].sort((a, b) => String(a.born ?? '9999').localeCompare(String(b.born ?? '9999'))),
  }));
  const 멤버수 = 냄.reduce((s, g) => s + g.members.length, 0);
  const 생일있는멤버 = 냄.reduce((s, g) => s + g.members.filter((m) => m.born).length, 0);

  mkdirSync(path.dirname(낼길), { recursive: true });
  writeFileSync(낼길, `${JSON.stringify({
    잰때: new Date().toISOString(),
    그룹수: 냄.length,
    멤버수,
    생일있는멤버,
    생일없는멤버: 멤버수 - 생일있는멤버,
    버린것: { 영문이름없는그룹: 그룹못읽음, 영문이름없는멤버: 멤버못읽음 },
    못하는말: '멤버는 «있었던» 사람이다(P527). 탈퇴한 사람도 들어 있고 우리는 그 둘을 못 가른다',
    그룹: 냄,
  }, null, 1)}\n`);

  console.log(`\n그룹 ${냄.length}개 · 멤버 ${멤버수}명 · 그중 생일이 «적힌» 사람 ${생일있는멤버}명`);
  console.log(`  생일이 «안 적힌» 멤버 ${멤버수 - 생일있는멤버}명  ⛔ 0 이 아니라 «모른다»다`);
  console.log(`  버린 것 — 영문 이름 없는 그룹 ${그룹못읽음}줄 · 멤버 ${멤버못읽음}줄`);
  for (const n of ['BTS', 'Blackpink', 'Stray Kids']) {
    const g = 냄.find((x) => x.name === n);
    console.log(`  ${n.padEnd(12)} ${g ? `${g.members.length}명 · 생일 있는 ${g.members.filter((m) => m.born).length}명` : '⛔ 없다 — 물음글을 다시 본다'}`);
  }
  console.log(`냈다 — ${path.relative(뿌리, 낼길)}`);
}
