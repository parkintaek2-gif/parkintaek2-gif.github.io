/**
 * K Culture Wire — **K팝 팀이 «가장 읽히던 달»을 지나고 나서 얼마나 남는가.**
 *
 * ── 왜 이 자인가 ───────────────────────────────────────────────
 * 오늘 이슈(2026-09-07 · 6.2시간 전): 「BigBang is back. Its Oakland concerts showed
 *   why the K-pop group still matters」 — 2006년에 데뷔한 팀이 돌아왔다는 기사다.
 * ⭐ 「still matters」는 «주장»이다. 우리는 그것을 **수로** 낼 수 있다 —
 *   그 팀이 가장 읽히던 달과 지금을 나란히 놓으면 된다.
 *
 * 그리고 이 축은 이슈가 식어도 남는다 — 어느 팀이 컴백하든 같은 표에 얹힌다.
 * 사장님 지시(2026-09-06): 「이슈+롱테일」 — 이슈로 데려오고, 축으로 남긴다.
 *
 * ── ⛔ 지키는 것 ───────────────────────────────────────────────
 * ⛔ 팀에 등수를 매겨 「한물갔다」고 안 쓴다. 나란히 놓고 수만 적는다
 * ⛔ 「위키백과를 덜 찾는다」를 「인기가 없다」로 바꿔 쓰지 않는다 — 찾아보는 것과 듣는 것은 다르다
 * ⛔ 문서가 없거나 자료가 모자란 팀은 «뺀다». 0 으로 안 채운다
 * ⛔ 최근 달은 아직 안 찼을 수 있다 — «끝난 달»까지만 센다
 * ⚠ 위키백과 문서는 팀이 유명해진 «뒤에» 자세해진다. 초기 달이 낮은 것은 그 탓도 있다
 *
 * 쓰는 법:  node scripts/collect-kcw-group-afterlife.mjs [--적는다] [--시험만]
 */
import fs from 'node:fs';
import path from 'node:path';

const UA = { 'User-Agent': 'KCultureWire/1.0 (https://www.kculturewire.com; u5@klifedesign.net)' };

/** 달 문자열 '2019-08' → 견줄 수 있는 수 */
export function 달수(달) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(달 ?? ''));
  return m ? Number(m[1]) * 12 + Number(m[2]) : null;
}

/** 두 달 사이 개월 */
export function 개월차(앞, 뒤) {
  const a = 달수(앞); const b = 달수(뒤);
  return (a == null || b == null) ? null : b - a;
}

/** 달 묶음에서 가장 높은 달 — ⛔ 같으면 «이른» 달을 고른다(뒤늦은 반등을 봉우리로 안 본다) */
export function 봉우리(달들) {
  let 맨 = null;
  for (const d of 달들) {
    if (!Number.isFinite(d.열람)) continue;
    if (!맨 || d.열람 > 맨.열람) 맨 = d;
  }
  return 맨;
}

/**
 * 봉우리를 지나고 «절반 아래»로 처음 내려간 달을 찾는다.
 * ⛔ 한 달 튄 것으로 판정하지 않는다 — 연속 3개월이 절반 아래여야 인정한다.
 */
export function 반토막달(달들, 봉, 이어야 = 3) {
  if (!봉) return null;
  const 뒤 = 달들.filter((d) => 달수(d.달) > 달수(봉.달) && Number.isFinite(d.열람));
  const 선 = 봉.열람 / 2;
  let 연속 = 0;
  for (const d of 뒤) {
    if (d.열람 < 선) { 연속++; if (연속 >= 이어야) return 뒤[뒤.indexOf(d) - (이어야 - 1)].달; }
    else 연속 = 0;
  }
  return null;
}

/** 봉우리 대비 지금 — ⛔ 봉우리가 0 이면 나누지 않는다 */
export function 남은몫(봉열람, 요즘열람) {
  if (!Number.isFinite(봉열람) || !Number.isFinite(요즘열람) || 봉열람 <= 0) return null;
  return +(요즘열람 / 봉열람 * 100).toFixed(1);
}

/** 팀 한 벌의 셈 — ⛔ 달이 모자라면 «못 잼»으로 남긴다 */
export function 팀재기({ 이름, 제목, q, 데뷔해, 달들, 최소달 = 24 }) {
  const 쓸것 = (달들 ?? []).filter((d) => Number.isFinite(d.열람));
  if (쓸것.length < 최소달) return { 이름, 제목, q, 데뷔해, 판정: '못 잼', 까닭: `쓸 만한 달이 ${쓸것.length}개뿐이다(${최소달}개 필요)` };
  const 봉 = 봉우리(쓸것);
  const 끝 = 쓸것[쓸것.length - 1];
  const 반 = 반토막달(쓸것, 봉);
  return {
    이름, 제목, q, 데뷔해,
    판정: '잼',
    잰달수: 쓸것.length,
    봉우리달: 봉.달, 봉우리열람: 봉.열람,
    요즘달: 끝.달, 요즘열람: 끝.열람,
    남은몫: 남은몫(봉.열람, 끝.열람),
    봉우리뒤개월: 개월차(봉.달, 끝.달),
    반토막달: 반,
    반토막까지개월: 반 ? 개월차(봉.달, 반) : null,
    반토막안됨: 반 === null,
  };
}

/**
 * JSON 문자열 «안»에 있는 날 제어문자를 씻는다.
 *
 * 🔴 [2026-09-07] 첫판은 탭·줄바꿈·복귀를 «봐 준다»고 적어 놓았다. 틀렸다 —
 *   JSON 문자열 «안»에서는 그 셋도 불법이라 파서가 똑같이 터진다.
 *   그런데 문자열 «밖»의 줄바꿈은 구조를 이루므로 지우면 안 된다.
 *   ⇒ 어느 쪽인지 «세면서» 지나가야 한다. 통째로 지우는 것으로는 못 고친다.
 * ⛔ 몇 자를 씻었는지 반드시 함께 낸다. 조용히 고치지 않는다.
 */
export function 제어문자씻기(글) {
  const 원 = String(글 ?? '');
  let 안인가 = false;
  let 앞이역슬래시 = false;
  let 씻은수 = 0;
  let 결과 = 
'';
  for (const c of 원) {
    const 코드 = c.codePointAt(0);
    if (안인가) {
      if (앞이역슬래시) { 결과 += c; 앞이역슬래시 = false; continue; }
      if (c === '\\') { 결과 += c; 앞이역슬래시 = true; continue; }
      if (c === '"') { 결과 += c; 안인가 = false; continue; }
      if (코드 < 0x20 || 코드 === 0x7f) { 결과 += ' '; 씻은수 += 1; continue; }
      결과 += c;
      continue;
    }
    if (c === '"') { 안인가 = true; 결과 += c; continue; }
    결과 += c;
  }
  return { 글: 결과, 씻은수 };
}

/**
 * ⭐ 우물이 «덜 길어 온 것»을 잡는다.
 * 자가시험은 함수만 시험한다. 받은 목록이 통째로 모자란 것은 못 잡는다 —
 * 2026-09-07 에 에스파·RIIZE 가 빠진 채 651팀이 그럴듯하게 나왔다.
 * 그래서 «반드시 있어야 할 이름»을 넣어 두고 대조한다. 없으면 멈춘다.
 */
export const 반드시있어야할이름 = [
  'Aespa', 'BTS', 'Blackpink', 'Twice', 'Stray Kids',
  'Tomorrow X Together', 'Riize', 'Itzy', 'NewJeans', 'Seventeen',
];

/**
 * 위키 제목의 «괄호 꼬리»를 뗀다 — 「Seventeen (South Korean band)」 → 「Seventeen」.
 * ⚠ 보여 줄 이름에만 쓴다. 열람을 물을 때 쓰는 제목은 «원래 그대로»여야 한다.
 */
export function 이름다듬기(제목) {
  return String(제목 ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim() || String(제목 ?? '');
}

export function 덜길어왔나(받은이름들, 반드시 = 반드시있어야할이름) {
  const 있 = new Set((받은이름들 ?? []).flatMap((n) => [
    String(n).toLowerCase(), 이름다듬기(n).toLowerCase(),
  ]));
  const 빠진 = 반드시.filter((n) => !있.has(n.toLowerCase()));
  return { 덜왔다: 빠진.length > 0, 빠진 };
}

/* ── 자가시험 ─────────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 실 = 0;
  const 봐 = (말, 참) => { if (참) { 통++; console.log('  ✅ ' + 말); } else { 실++; console.log('  🔴 ' + 말); } };

  봐('달을 수로 바꾼다', 달수('2019-08') === 2019 * 12 + 8);
  봐('⛔ 꼴이 아니면 0 이 아니라 null', 달수('2019') === null && 달수(null) === null);
  봐('개월 차를 낸다', 개월차('2019-08', '2020-02') === 6);
  봐('⛔ 한쪽이 없으면 null', 개월차('2019-08', 'x') === null);

  const 달들 = [
    { 달: '2019-01', 열람: 100 }, { 달: '2019-02', 열람: 900 }, { 달: '2019-03', 열람: 400 },
    { 달: '2019-04', 열람: 300 }, { 달: '2019-05', 열람: 200 }, { 달: '2019-06', 열람: 150 },
  ];
  봐('가장 높은 달을 찾는다', 봉우리(달들).달 === '2019-02');
  봐('⛔ 수가 없는 달은 봉우리가 못 된다', 봉우리([{ 달: '2019-01', 열람: null }, { 달: '2019-02', 열람: 5 }]).달 === '2019-02');
  봐('빈 묶음이면 봉우리가 없다', 봉우리([]) === null);

  봐('연속 세 달 절반 아래면 반토막', 반토막달(달들, 봉우리(달들)) === '2019-03');
  봐('⛔ 한 달만 꺼지면 반토막이 아니다',
    반토막달([{ 달: '2019-01', 열람: 900 }, { 달: '2019-02', 열람: 100 }, { 달: '2019-03', 열람: 800 }, { 달: '2019-04', 열람: 850 }],
      { 달: '2019-01', 열람: 900 }) === null);
  봐('끝까지 안 꺼지면 null', 반토막달([{ 달: '2019-01', 열람: 100 }, { 달: '2019-02', 열람: 99 }], { 달: '2019-01', 열람: 100 }) === null);

  봐('남은 몫을 백분율로', 남은몫(1000, 250) === 25);
  봐('⛔ 봉우리가 0 이면 나누지 않는다', 남은몫(0, 5) === null);
  봐('⛔ 수가 아니면 null', 남은몫(1000, null) === null);

  const 짧 = 팀재기({ 이름: 'A', 제목: 'A', 달들: 달들, 최소달: 24 });
  봐('⛔ 달이 모자라면 «못 잼»으로 남긴다 — 0 으로 안 채운다', 짧.판정 === '못 잼' && 짧.남은몫 === undefined);
  봐('못 잰 까닭을 적는다', /쓸 만한 달이 6개뿐/.test(짧.까닭));

  const 긴달 = Array.from({ length: 30 }, (_, i) => ({ 달: `2020-${String((i % 12) + 1).padStart(2, '0')}`.replace(/^2020/, String(2020 + Math.floor(i / 12))), 열람: i === 2 ? 1000 : 100 }));
  const 잰 = 팀재기({ 이름: 'B', 제목: 'B', 달들: 긴달, 최소달: 24 });
  봐('달이 넉넉하면 잰다', 잰.판정 === '잼');
  봐('봉우리와 요즘을 함께 낸다', 잰.봉우리열람 === 1000 && 잰.요즘열람 === 100);
  봐('남은 몫이 10%', 잰.남은몫 === 10);
  봐('반토막 달을 찾아낸다', typeof 잰.반토막달 === 'string');
  봐('봉우리 뒤 개월을 낸다', Number.isFinite(잰.봉우리뒤개월) && 잰.봉우리뒤개월 > 0);

  봐('문자열 안의 날 제어문자를 씻는다',
    제어문자씻기(String.fromCharCode(34) + 'a' + String.fromCharCode(1) + 'b' + String.fromCharCode(34)).글
      === String.fromCharCode(34) + 'a b' + String.fromCharCode(34));
  봐('몇 자를 씻었는지 센다',
    제어문자씻기(String.fromCharCode(34, 1, 2, 34)).씻은수 === 2);
  봐('⛔ 문자열 «밖»의 제어문자는 안 건드린다 — 거기선 파서가 안 터진다',
    제어문자씻기(String.fromCharCode(1, 2)).씻은수 === 0);
  봐('🔴 문자열 «안»의 탭·줄바꿈도 씻는다 — 거기서는 그것도 불법이다',
    제어문자씻기('{"a":"x\ty"}').씻은수 === 1);
  봐('⛔ 문자열 «밖»의 줄바꿈은 그대로 둔다 — 구조를 이룬다',
    제어문자씻기('{\n "a": 1\n}').씻은수 === 0);
  봐('역슬래시로 «이미 이스케이프된» 것은 안 건드린다',
    제어문자씻기('{"a":"x\\ny"}').씻은수 === 0);
  봐('문자열 안의 따옴표를 이스케이프한 것을 끝으로 안 본다',
    제어문자씻기('{"a":"x\\"' + String.fromCharCode(9) + 'y"}').씻은수 === 1);
  봐('씻은 뒤에는 파싱된다', (() => {
    const 나쁜 = '{"a":"x' + String.fromCharCode(9) + 'y"}';
    try { JSON.parse(나쁜); return false; } catch (e) { /* 터져야 맞다 */ }
    return JSON.parse(제어문자씻기(나쁜).글).a === 'x y';
  })());
  봐('멀쩡한 글은 그대로', 제어문자씻기('Aespa').글 === 'Aespa');
  봐('괄호 꼬리를 뗀다', 이름다듬기('Seventeen (South Korean band)') === 'Seventeen');
  봐('괄호가 없으면 그대로', 이름다듬기('BTS') === 'BTS');
  봐('⛔ 가운데 괄호는 안 건드린다', 이름다듬기('(G)I-DLE') === '(G)I-DLE');
  봐('괄호를 떼면 빈 이름이 될 때는 원래 것을 쓴다', 이름다듬기('(Hi)') === '(Hi)');
  봐('괄호 붙은 제목도 검산에서 같은 이름으로 본다',
    덜길어왔나(['Seventeen (South Korean band)'], ['Seventeen']).덜왔다 === false);
  봐('🔴 아는 이름이 빠지면 «덜 왔다»고 한다', 덜길어왔나(['BTS'], ['BTS', 'Aespa']).덜왔다 === true);
  봐('빠진 이름을 적어 준다', 덜길어왔나(['BTS'], ['BTS', 'Aespa']).빠진[0] === 'Aespa');
  봐('다 있으면 덜 온 것이 아니다', 덜길어왔나(['BTS', 'Aespa'], ['BTS', 'Aespa']).덜왔다 === false);
  봐('대소문자가 달라도 같은 이름으로 본다', 덜길어왔나(['aespa'], ['Aespa']).덜왔다 === false);
  봐('⛔ 빈 목록이면 다 빠진 것이다', 덜길어왔나([], ['BTS']).빠진.length === 1);

  console.log(`\n팀의 «봉우리 뒤»를 재는 자 — 자가시험 ${통}가지 통과 · ${실}가지 실패`);
  if (실) process.exit(1);
  return 통;
}

/* ── 받아오기 ─────────────────────────────────────────────────── */
async function 받기(주소, 꼴 = 'json') {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(주소, { headers: UA });
      if (r.ok) return 꼴 === 'json' ? await r.json() : await r.text();
      if (r.status === 404) return null;
      /* 🔴 [2026-09-07] 위키데이터 질의서비스는 504·503 을 자주 낸다.
         한 쪽이 504 로 죽으면 그 쪽 팀이 통째로 빠진다 — 429 만 다시 물으면 모자란다. */
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 3000 * (i + 1)));
        continue;
      }
      return { 못받음: r.status };
    } catch (e) {
      if (i === 4) return { 못받음: e.message };
      await new Promise((s) => setTimeout(s, 900));
    }
  }
  return { 못받음: '다섯 번 다 실패' };
}

async function 주된일() {
  const 통 = 자가시험();
  const 적나 = process.argv.includes('--적는다');

  /* 1. 한국 음악 팀을 위키데이터에서 받는다 — 영문 문서가 «있는» 것만 */
  /* 🔴 [2026-09-07] 처음 쓴 질의가 «에스파·TXT·RIIZE·보이넥스트도어»를 통째로 빠뜨렸다.
     까닭이 둘이었다 —
     ① 분류를 Q215380(음악 그룹) 하나로 좁혔다. 걸그룹(Q641066)은 그 아래가 아니다.
     ② ⭐⭐ `SERVICE wikibase:label` 이 «말없이 줄을 버렸다».
        같은 조건으로 라벨 서비스만 빼자 191 → 318 로 늘었고 에스파가 들어왔다.
        오류도 경고도 없다. 조용히 성공한 척하는 것이 제일 나쁘다 — 그래서 안 쓴다.
     ⇒ 이름은 라벨이 아니라 «영문 위키 제목»에서 얻는다. 그것이 우리가 열람을 세는 열쇠이기도 하다.
     ⚠ 그래도 (G)I-DLE 은 안 잡힌다 — 위키데이터 항목에 나라 속성이 없다. 못 잡았다고 적는다. */
  /* 🔴 [2026-09-07] 한 번에 받으면 답이 «정확히 196,608자(192KB)에서 잘려» 온다.
     상태는 200 이고 content-length 는 안 온다(청크 전송). 그래서 오류가 아니라
     「Bad control character」·「Expected ':'」 같은 «파싱 오류»로 나타난다.
     ⛔ 그걸 제어문자 탓으로 보고 씻어 봐야 안 고쳐진다 — 잘린 것이다.
     ✅ ORDER BY 를 두고 LIMIT/OFFSET 으로 «쪽을 나눠» 받는다. 쪽마다 온전히 파싱된다. */
  const 질의몸 = `SELECT DISTINCT ?g ?en ?inception WHERE {
    VALUES ?kind { wd:Q215380 wd:Q2088357 wd:Q641066 wd:Q5741069 }
    ?g wdt:P31/wdt:P279* ?kind .
    { ?g wdt:P495 wd:Q884 } UNION { ?g wdt:P17 wd:Q884 } UNION { ?g wdt:P740/wdt:P17 wd:Q884 }
    ?en schema:about ?g ; schema:isPartOf <https://en.wikipedia.org/> .
    OPTIONAL { ?g wdt:P571 ?inception }
  } ORDER BY ?g`;

  const 한쪽 = 400;
  const 받은 = [];
  let 씻은합 = 0;
  for (let 건너 = 0; 건너 < 20000; 건너 += 한쪽) {
    const q = `${질의몸} LIMIT ${한쪽} OFFSET ${건너}`;
    const su = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q);
    const 날글 = await 받기(su, 'text');
    if (!날글 || 날글.못받음) throw new Error(`위키데이터를 못 받았다(OFFSET ${건너}): ` + JSON.stringify(날글));
    const 씻김 = 제어문자씻기(String(날글));
    씻은합 += 씻김.씻은수;
    let 쪽;
    try { 쪽 = JSON.parse(씻김.글); }
    catch (e) { throw new Error(`위키데이터 답을 못 읽었다(OFFSET ${건너}, ${String(날글).length}자): ` + e.message); }
    const 줄 = 쪽.results.bindings;
    받은.push(...줄);
    if (줄.length < 한쪽) break;
  }
  if (씻은합) console.log(`  ⚠ 제어문자 ${씻은합}자를 씻어 냈다 (위키데이터가 보낸 것)`);

  const 팀들 = [];
  const 본것 = new Set();
  for (const b of 받은) {
    const 제목 = decodeURIComponent(b.en.value.split('/wiki/')[1] || '').replace(/_/g, ' ');
    if (!제목 || 본것.has(제목)) continue;
    본것.add(제목);
    팀들.push({
      이름: 이름다듬기(제목),   /* ⛔ 라벨 서비스를 안 쓴다 · 괄호 꼬리만 뗀다 */
      제목,
      q: b.g.value.split('/').pop(),
      데뷔해: b.inception ? Number(String(b.inception.value).slice(0, 4)) : null,
    });
  }
  console.log(`\n■ 위키데이터에서 한국 음악 팀 ${팀들.length}팀 (영문 문서가 있는 것만)`);
  /* ⭐ 겉수가 그럴듯해도 «아는 이름»이 빠졌으면 멈춘다 */
  const 검산 = 덜길어왔나(팀들.map((t) => t.이름));
  if (검산.덜왔다) throw new Error('우물이 덜 길어 왔다 — 반드시 있어야 할 이름이 빠졌다: ' + 검산.빠진.join(', '));
  console.log(`  ✅ 검산 — 반드시 있어야 할 ${반드시있어야할이름.length}팀이 다 들어 있다\n`);

  /* 2. 팀마다 달별 열람 — 2015-07 부터 «끝난 달»까지 */
  const 이제 = new Date();
  const 끝달 = new Date(이제.getFullYear(), 이제.getMonth(), 1); // 이번 달 1일 → 지난달까지만 찬다
  const 끝문자 = `${끝달.getFullYear()}${String(끝달.getMonth() + 1).padStart(2, '0')}0100`;
  const 잰것 = []; const 못잰것 = [];

  let n = 0;
  for (const t of 팀들) {
    n++;
    const u = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/'
      + encodeURIComponent(t.제목.replace(/ /g, '_')) + `/monthly/2015070100/${끝문자}`;
    const j = await 받기(u);
    if (!j || j.못받음) { 못잰것.push({ ...t, 까닭: j?.못받음 ? '받기 실패 ' + j.못받음 : '자료 없음(404)' }); continue; }
    const 달들 = (j.items ?? []).map((x) => ({
      달: `${String(x.timestamp).slice(0, 4)}-${String(x.timestamp).slice(4, 6)}`,
      열람: Number(x.views),
    })).filter((d) => d.달 < `${끝달.getFullYear()}-${String(끝달.getMonth() + 1).padStart(2, '0')}`);
    const r = 팀재기({ ...t, 달들 });
    if (r.판정 === '잼') 잰것.push(r); else 못잰것.push({ ...t, 까닭: r.까닭 });
    if (n % 50 === 0) console.log(`  ${n}/${팀들.length} …`);
  }

  /* 3. 셈 */
  const 반토막된것 = 잰것.filter((x) => x.반토막달);
  const 개월들 = 반토막된것.map((x) => x.반토막까지개월).filter(Number.isFinite).sort((a, b) => a - b);
  const 중앙 = 개월들.length ? (개월들.length % 2 ? 개월들[(개월들.length - 1) / 2]
    : Math.round((개월들[개월들.length / 2 - 1] + 개월들[개월들.length / 2]) / 2)) : null;
  const 안꺼진것 = 잰것.filter((x) => x.반토막안됨);

  잰것.sort((a, b) => (b.남은몫 ?? -1) - (a.남은몫 ?? -1));

  console.log(`\n■ 잰 팀 ${잰것.length}팀 · 못 잰 팀 ${못잰것.length}팀`);
  console.log(`   봉우리에서 «절반 아래»로 내려간 팀 ${반토막된것.length}팀 — 걸린 개월 중앙값 ${중앙 ?? '못 잼'}개월`);
  console.log(`   아직 절반 아래로 안 내려간 팀 ${안꺼진것.length}팀`);
  console.log('\n   봉우리 대비 지금이 높은 쪽 8팀');
  for (const x of 잰것.slice(0, 8)) console.log(`     ${String(x.남은몫).padStart(6)}%  ${x.이름}  (봉우리 ${x.봉우리달} ${x.봉우리열람.toLocaleString('en-US')})`);
  console.log('\n   봉우리 대비 지금이 낮은 쪽 8팀');
  for (const x of 잰것.slice(-8)) console.log(`     ${String(x.남은몫).padStart(6)}%  ${x.이름}  (봉우리 ${x.봉우리달} ${x.봉우리열람.toLocaleString('en-US')})`);

/** 🔴 손님이 읽는 시각이다 — `toLocaleString('ko-KR')` 은 「오전」을 낸다.
 *  KST 를 영어로 적는다. ⛔ toISOString() 은 UTC 라 새벽에 하루가 어긋난다. */
function 잰때영어(때 = new Date()) {
  const 날 = 때.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const 시 = 때.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${날}, ${시} KST`;
}
  const 낼것 = {
    잰때: 잰때영어(),
    창: `2015-07 ~ ${끝달.getFullYear()}-${String(끝달.getMonth()).padStart(2, '0')}`,
    우물: 'Wikidata SPARQL (P31/P279* 음악그룹·음악앙상블·걸그룹·보이밴드 · 나라는 P495/P17/P740 어느 하나가 한국) + Wikimedia Pageviews per-article, en.wikipedia, all-access, agent=user, monthly',
    이것이무엇인가: '한국 음악 팀마다 영문 위키백과에서 가장 많이 읽힌 달을 찾고, 그 뒤로 얼마나 남았는지를 잰 것이다.',
    /* 🔴 이 줄들은 «지면에 그대로 찍힌다». 영어로 적는다 — 한국어를 내면 손님이 거기서 나간다 */
    이것이아닌것: [
      'This is not a popularity ranking. It counts what people looked up, not what they listened to.',
      'Acts we could not measure are counted separately, never filled in as zero.',
      'A Wikipedia article grows more detailed after an act becomes known, so early months read low partly for that reason.',
      'The current month is excluded because it is not finished.',
      '(G)I-DLE has no country property on its Wikidata item and so is absent from this table. That is a miss on our side, not a zero.',
    ],
    셈: {
      받은팀: 팀들.length,
      잰팀: 잰것.length,
      못잰팀: 못잰것.length,
      반토막된팀: 반토막된것.length,
      반토막까지중앙값개월: 중앙,
      아직안꺼진팀: 안꺼진것.length,
    },
    못잰것: 못잰것.slice(0, 60),
    팀: 잰것,
  };

  if (적나) {
    const 어디 = path.join('src', 'data', 'kcw-group-afterlife.json');
    fs.writeFileSync(어디, JSON.stringify(낼것, null, 1), 'utf8');
    console.log(`\n📁 적었다 — ${어디}`);
  } else console.log('\n⬜ --적는다 를 안 줘서 파일로 안 적었다.');
  console.log(`자가시험 ${통}가지 통과.`);
}

if (process.argv.includes('--시험만')) 자가시험();
else 주된일().catch((e) => { console.error('🔴', e); process.exit(1); });
