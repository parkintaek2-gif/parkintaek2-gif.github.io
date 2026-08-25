#!/usr/bin/env node
/**
 * compare-kcw-indexed.mjs — **같은 지면이 지난번과 견주어 어떻게 옮겨 갔나**
 *
 * ── 왜 있나 ──────────────────────────────────────────────────────────────
 * 2026-08-25 에 사람 지면 636장을 냈다. 그날 표본 40장은
 * 「들어갔다 21 · 발견만 18 · 구글이모른다 1」이었다.
 * 8/28 에 말하고 싶은 것은 **「그 열여덟 장 중 몇 장이 들어갔나」**다.
 *
 * ⛔ 그런데 표본을 «새로 뽑아» 놓고 「발견만이 18에서 6으로 줄었다」라고 적으면
 *   그것은 견준 것이 아니다. 다른 지면을 재고 숫자만 나란히 놓은 것이다.
 *   그래서 이 자는 **두 회차에 «둘 다 있는 주소»만** 견준다.
 *   한쪽에만 있는 주소는 「견줄 수 없다」로 따로 세고, 표에서 뺀다.
 *
 * 🔴 **구글의 답은 흔들린다.** 이 저장소의 `check-kcw-indexed.mjs` 머리글에 적혀 있다 —
 *   같은 열한 장을 «몇 분 사이에» 두 번 물었더니 갈림이 달라졌다.
 *   ⛔ 그러니 여기 나오는 옮겨감을 전부 「우리가 만든 변화」로 읽지 않는다.
 *   ⭐ 이 자는 그것을 숨기지 않는다 — **되돌아간 것(들어갔다 → 발견만)**을 따로 세어
 *     같이 보여 준다. 되돌아간 것이 있으면 그만큼이 흔들림의 크기다.
 *     앞으로 간 것에서 되돌아간 것을 뺀 **순이동**까지만 말한다.
 *
 * ── 쓰는 법 ──────────────────────────────────────────────────────────────
 *   ① 8/25 것을 지켜 둔다        cp src/data/wikitip-indexed.json src/data/색인-2026-08-25.json
 *   ② 같은 지면을 다시 묻는다     node scripts/check-kcw-indexed.mjs --잰다 \
 *                                  --같은것=src/data/색인-2026-08-25.json --쓴다
 *   ③ 견준다                     node scripts/compare-kcw-indexed.mjs \
 *                                  src/data/색인-2026-08-25.json src/data/wikitip-indexed.json
 *
 *   자가시험                     node scripts/compare-kcw-indexed.mjs --자가시험
 *
 * ⛔ 이 파일은 «불러도» 아무 일이 없어야 한다 — scripts/check-import-safety.mjs 가 잰다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 좋아지는 쪽으로 갈수록 큰 수. 「앞으로 갔나 되돌아갔나」를 이것으로 가른다. */
export const 층 = {
  구글이모른다: 0,
  못물었다: 0,
  발견만: 1,
  크롤됐는데안넣음: 2,
  들어간듯: 3,
  들어갔다: 4,
};

/**
 * 두 회차를 견준다. **둘 다에 있는 주소만** 본다.
 * @returns {{짝:number, 앞으로:number, 되돌아감:number, 그대로:number, 순이동:number,
 *            옮김:Array, 지난쪽만:string[], 이번쪽만:string[], 지난갈림:object, 이번갈림:object}}
 */
export function 견주기(지난rows, 이번rows) {
  const 지난 = new Map();
  for (const r of 지난rows ?? []) if (r?.주소) 지난.set(r.주소, r.꼴 ?? '못물었다');
  const 이번 = new Map();
  for (const r of 이번rows ?? []) if (r?.주소) 이번.set(r.주소, r.꼴 ?? '못물었다');

  const 옮김 = [];
  let 앞으로 = 0, 되돌아감 = 0, 그대로 = 0;
  for (const [주소, 옛] of 지난) {
    if (!이번.has(주소)) continue;
    const 새 = 이번.get(주소);
    /* ⚠ 모르는 이름이 오면 «조용히 0» 으로 삼지 않는다 — 그러면 되돌아간 것처럼 보인다 */
    const a = 층[옛], b = 층[새];
    if (a === undefined || b === undefined) {
      옮김.push({ 주소, 옛, 새, 방향: '모르는꼴' });
      continue;
    }
    if (b > a) { 앞으로++; 옮김.push({ 주소, 옛, 새, 방향: '앞으로' }); }
    else if (b < a) { 되돌아감++; 옮김.push({ 주소, 옛, 새, 방향: '되돌아감' }); }
    else 그대로++;
  }

  const 세기 = (m) => {
    const o = {};
    for (const v of m.values()) o[v] = (o[v] ?? 0) + 1;
    return o;
  };

  return {
    짝: 앞으로 + 되돌아감 + 그대로 + 옮김.filter((x) => x.방향 === '모르는꼴').length,
    앞으로, 되돌아감, 그대로,
    순이동: 앞으로 - 되돌아감,
    옮김,
    지난쪽만: [...지난.keys()].filter((u) => !이번.has(u)),
    이번쪽만: [...이번.keys()].filter((u) => !지난.has(u)),
    지난갈림: 세기(지난), 이번갈림: 세기(이번),
  };
}

/* ══════════════════════ 자가시험 ══════════════════════ */
function 자가시험() {
  let 통과 = 0, 실패 = 0;
  const 검 = (이름, 조건, 덧 = '') => {
    if (조건) { 통과++; } else { 실패++; console.log(`  ⛔ ${이름}${덧 ? ' — ' + 덧 : ''}`); }
  };

  const A = [
    { 주소: 'a', 꼴: '발견만' },
    { 주소: 'b', 꼴: '발견만' },
    { 주소: 'c', 꼴: '들어갔다' },
    { 주소: 'd', 꼴: '들어갔다' },
    { 주소: 'e', 꼴: '발견만' },      // 이번에 없다 — 견줄 수 없다
  ];
  const B = [
    { 주소: 'a', 꼴: '들어갔다' },     // 앞으로
    { 주소: 'b', 꼴: '발견만' },       // 그대로
    { 주소: 'c', 꼴: '발견만' },       // 되돌아감 ← 흔들림
    { 주소: 'd', 꼴: '들어갔다' },     // 그대로
    { 주소: 'f', 꼴: '들어갔다' },     // 지난번에 없다 — 견줄 수 없다
  ];
  const r = 견주기(A, B);

  검('둘 다 있는 것만 견준다', r.짝 === 4, `짝 ${r.짝}`);
  검('앞으로 간 것을 센다', r.앞으로 === 1);
  검('⭐ 되돌아간 것을 «숨기지 않는다»', r.되돌아감 === 1);
  검('그대로인 것을 센다', r.그대로 === 2);
  검('순이동 = 앞으로 − 되돌아감', r.순이동 === 0);
  검('지난쪽에만 있는 것을 따로 센다', r.지난쪽만.length === 1 && r.지난쪽만[0] === 'e');
  검('이번쪽에만 있는 것을 따로 센다', r.이번쪽만.length === 1 && r.이번쪽만[0] === 'f');

  /* ⛔ 모르는 이름을 0 으로 삼으면 「되돌아갔다」가 거짓으로 늘어난다 */
  const r2 = 견주기([{ 주소: 'x', 꼴: '들어갔다' }], [{ 주소: 'x', 꼴: '처음보는꼴' }]);
  검('모르는 꼴을 0 으로 삼지 않는다', r2.되돌아감 === 0 && r2.앞으로 === 0);
  검('모르는 꼴을 따로 적는다', r2.옮김[0]?.방향 === '모르는꼴');

  /* 빈 것 · 없는 것에도 안 죽는다 */
  const r3 = 견주기(null, undefined);
  검('빈 것에도 안 죽는다', r3.짝 === 0 && r3.순이동 === 0);

  /* 주소가 없는 줄은 버린다 — 조용히 짝으로 세면 안 된다 */
  const r4 = 견주기([{ 꼴: '발견만' }], [{ 꼴: '들어갔다' }]);
  검('주소 없는 줄은 안 센다', r4.짝 === 0);

  /* 갈림 세기 */
  검('지난 갈림을 센다', r.지난갈림.발견만 === 3 && r.지난갈림.들어갔다 === 2);
  /* ⚠ 이번쪽은 다섯 줄이다 — a·d·f 가 「들어갔다」(셋), b·c 가 「발견만」(둘).
       처음에 f 를 빼고 2 로 적었다가 이 시험이 잡았다. 시험이 자기 몫을 했다. */
  검('이번 갈림을 센다', r.이번갈림.들어갔다 === 3 && r.이번갈림.발견만 === 2,
    JSON.stringify(r.이번갈림));

  /* 층 사다리가 뒤집혀 있지 않은가 — 이것이 뒤집히면 앞뒤가 통째로 거짓이 된다 */
  검('사다리가 바르다', 층.들어갔다 > 층.크롤됐는데안넣음 && 층.크롤됐는데안넣음 > 층.발견만
    && 층.발견만 > 층.구글이모른다);

  console.log(`\n${실패 ? '⛔' : '✅'} compare-kcw-indexed 자가시험 ${실패 ? '실패 ' + 실패 + '개' : '통과'} (${통과}개)`);
  return 실패;
}

/* ══════════════════════ 화면에 내기 ══════════════════════ */
function 내기(지난길, 이번길) {
  const 읽기 = (p) => {
    const 길 = path.resolve(뿌리, p);
    if (!fs.existsSync(길)) { console.error(`⛔ 파일이 없다: ${길}`); process.exit(1); }
    return JSON.parse(fs.readFileSync(길, 'utf8'));
  };
  const A = 읽기(지난길), B = 읽기(이번길);
  const r = 견주기(A.rows, B.rows);

  console.log(`# 색인 견주기 — ${A.generated ?? '?'} → ${B.generated ?? '?'}`);
  console.log(`\n둘 다에 있는 지면 ${r.짝}장만 견줍니다.`);
  if (r.지난쪽만.length || r.이번쪽만.length) {
    console.log(`⚠ 견줄 수 없는 것 — 지난쪽에만 ${r.지난쪽만.length}장 · 이번쪽에만 ${r.이번쪽만.length}장`);
    console.log('   ⛔ 이것을 「줄었다/늘었다」로 세지 않았습니다. 표본이 달랐던 몫입니다.');
  }

  console.log('\n## 어떻게 옮겨 갔나');
  console.log(`  ▲ 앞으로 간 것    ${r.앞으로}장`);
  console.log(`  ▼ 되돌아간 것    ${r.되돌아감}장`);
  console.log(`  = 그대로          ${r.그대로}장`);
  console.log(`  ────────────────────────`);
  console.log(`  순이동            ${r.순이동 >= 0 ? '+' : ''}${r.순이동}장`);

  if (r.되돌아감) {
    console.log('\n🔴 **되돌아간 것이 있습니다.** 구글의 답은 몇 분 사이에도 흔들립니다 —');
    console.log('   되돌아간 수만큼이 «흔들림의 크기»입니다. 앞으로 간 수를 그대로 성과로 읽지 마십시오.');
    console.log(`   말할 수 있는 것은 «순이동 ${r.순이동 >= 0 ? '+' : ''}${r.순이동}장»까지입니다.`);
  }

  const 모르는 = r.옮김.filter((x) => x.방향 === '모르는꼴');
  if (모르는.length) {
    console.log(`\n⚠ 처음 보는 꼴 ${모르는.length}장 — 앞뒤를 못 가렸습니다(0 으로 삼지 않았습니다)`);
    모르는.slice(0, 5).forEach((x) => console.log(`   ${x.주소} : ${x.옛} → ${x.새}`));
  }

  const 앞 = r.옮김.filter((x) => x.방향 === '앞으로');
  if (앞.length) {
    console.log('\n## 앞으로 간 지면 (최대 15장)');
    앞.slice(0, 15).forEach((x) => console.log(`  ▲ ${x.옛.padEnd(10)} → ${x.새.padEnd(10)} ${x.주소}`));
  }
  const 뒤 = r.옮김.filter((x) => x.방향 === '되돌아감');
  if (뒤.length) {
    console.log('\n## 되돌아간 지면 (최대 15장)');
    뒤.slice(0, 15).forEach((x) => console.log(`  ▼ ${x.옛.padEnd(10)} → ${x.새.padEnd(10)} ${x.주소}`));
  }

  console.log('\n⛔ 이것은 표본입니다. 「사이트 전체가 이렇다」로 말하지 않습니다.');
  console.log('⛔ 색인에 들어간 것과 «누가 찾아온 것»은 다른 말입니다 — 방문자는 따로 잽니다.');
}

const 내가불렸나 = path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
if (내가불렸나) {
  if (process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 1 : 0);
  }
  const 길들 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (길들.length !== 2) {
    console.error('쓰는 법: node scripts/compare-kcw-indexed.mjs <지난.json> <이번.json>');
    console.error('        node scripts/compare-kcw-indexed.mjs --자가시험');
    process.exit(1);
  }
  내기(길들[0], 길들[1]);
}
