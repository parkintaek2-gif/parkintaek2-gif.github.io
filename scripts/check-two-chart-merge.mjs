#!/usr/bin/env node
/**
 * check-two-chart-merge.mjs — **「두 차트 뭉개기」를 찾아내는 자.**
 *
 * ── 결함에 이름을 붙인다 ──────────────────────────────────────
 * **두 차트 뭉개기** — 넷플릭스는 주마다 목록을 «둘» 낸다(영화 · 시리즈).
 *   이름이 같은 «다른 작품»이 양쪽에 앉는 일이 있다. 원자료 줄을 «제목»만으로 모으면
 *   두 작품이 한 덩이가 되고, 우리 지면은 남의 작품 수를 우리 작품 이름으로 내보낸다.
 *
 * 🔴 [2026-08-29] 실제로 그러고 있었다.
 * ```
 *   원자료에 두 차트에 다 나온 이름   122개
 *   그중 우리 한국 명단에 든 것        31개
 *   그 수로 지면이 나가 있던 것        25장 · 갈래 딱지까지 틀렸던 것 19장
 *   보기 — Little Women: Films 63줄(2019 미국 영화) + TV 225줄(2022 tvN 드라마)이 한 덩이
 * ```
 * ⚠ 앞선 세션이 `check-title-ambiguity` 로 「이름이 겹치는 위험」을 이미 재 뒀었다.
 *   못 본 것은 «차트 칸(구분)이 그 둘을 가르는 지렛대»라는 점이다. 위험은 알았고 자는 못 썼다.
 *
 * ── 이 자가 하는 일 ───────────────────────────────────────────
 * 원자료를 읽는 짓는 자 가운데 **줄을 제목만으로 모으는 것**을 찾아 낸다.
 * ⛔ 「구분이라는 낱말이 파일에 있나」로 판정하지 않는다 — 주석에만 있어도 통과해 버린다.
 *   ⭐ **모으는 열쇠에 구분이 들어갔나**를 본다.
 *
 * ⛔ 이 자는 고치지 않는다. 어디가 남았는지만 낸다 — 고칠 때 무엇이 바뀌는지 사람이 봐야 한다.
 *
 * 쓰는 법
 *   node scripts/check-two-chart-merge.mjs --자가시험
 *   node scripts/check-two-chart-merge.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = 'archive/raw/netflix-top10/countries.ndjson';

/**
 * 줄을 모으는 «열쇠»를 찾는다 — `t.시장.set(...)` 같은 것 말고
 * 백틱 열쇠(`${...}|${...}`)와 Map.set(제목 …) 꼴을 본다.
 *
 * ⛔ 「구분」이 파일 아무 데나 있으면 통과, 로 하면 안 된다. 주석에도 있기 때문이다.
 */
export function 열쇠줄들(글) {
  const 줄 = String(글 ?? '').split('\n');
  const 것 = [];
  for (let i = 0; i < 줄.length; i += 1) {
    const l = 줄[i];
    if (/^\s*\*/.test(l) || /^\s*\/\//.test(l)) continue;      /* 주석은 열쇠가 아니다 */
    if (!/\.set\(|\bconst\s+\S*열쇠\s*=|\bconst\s+k\s*=/.test(l)) continue;
    if (!/제목|title/.test(l)) continue;
    것.push({ 줄번호: i + 1, 글: l.trim() });
  }
  return 것;
}

/** 그 열쇠에 차트 칸이 들어가 있나 */
export function 구분들었나(열쇠글) {
  return /구분|category|r\.갈래|chart/.test(String(열쇠글 ?? ''));
}

/**
 * 파일이 «줄을 걸러서» 다른 차트를 아예 안 담고 있나.
 * ⭐ 열쇠에 구분을 안 넣어도, 앞에서 남의 차트 줄을 걸러 냈으면 뭉개지 않는다.
 *   deepen 이 그 꼴이다 — 열쇠는 그대로 두고 continue 로 걸렀다.
 * ⛔ 주석에 「구분」이라 적어 둔 것을 걸렀다고 세지 않는다. 주석은 아무것도 안 거른다.
 */
export function 걸러내나(글) {
  return String(글 ?? '').split(/\r?\n/).some((l) => {
    if (/^\s*\*/.test(l) || /^\s*\/\//.test(l)) return false;
    return /구분|category/.test(l) && /continue|!==|===|filter\(/.test(l);
  });
}

/**
 * 한 파일을 본다.
 * ⛔ 원자료를 안 읽는 파일은 «해당 없음»이다 — 「통과」로 세면 통과 수가 부풀어 거짓 초록이 된다.
 */
export function 파일판정(글, 원자료길 = 원자료) {
  const s = String(글 ?? '');
  if (!s.includes(원자료길)) return { 갈래: '해당없음', 열쇠: [] };
  if (걸러내나(s)) return { 갈래: '갈라본다', 열쇠: [] };  /* 앞에서 남의 차트를 걸러 냈다 */
  const 열쇠 = 열쇠줄들(s);
  if (!열쇠.length) return { 갈래: '못쟀다', 열쇠: [] };   /* 열쇠를 못 찾았다 ≠ 괜찮다 */
  const 맨열쇠 = 열쇠.filter((k) => !구분들었나(k.글));
  return { 갈래: 맨열쇠.length ? '뭉갠다' : '갈라본다', 열쇠: 맨열쇠 };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('주석 줄은 열쇠가 아니다',
    열쇠줄들('   * 제목.set(r.제목, 1)').length === 0);
  검('// 주석도 아니다',
    열쇠줄들('  // T.set(r.제목, x)').length === 0);
  검('제목으로 모으는 줄을 잡는다',
    열쇠줄들('    T.set(r.제목, {});').length === 1);
  검('제목이 안 든 set 은 안 잡는다',
    열쇠줄들('    나라주.set(r.iso2, new Set());').length === 0);

  검('구분이 든 열쇠는 갈라본 것이다',
    구분들었나('const 구간열쇠 = `${r.iso2}|${r.구분}|${r.시즌 ?? \'\'}`;'));
  검('⛔ 구분이 없으면 뭉갠 것이다',
    !구분들었나('const k = `${s}|${iso2}`;'));
  검('category 라고 써도 센다', 구분들었나('keepRow(r.제목, r.category)'));

  검('⛔ 원자료를 안 읽으면 «해당없음» — 통과가 아니다',
    파일판정('const x = 1;').갈래 === '해당없음');
  검('열쇠를 못 찾으면 «못쟀다» — 괜찮다가 아니다',
    파일판정(`읽기('${원자료}')`).갈래 === '못쟀다');
  검('제목만으로 모으면 뭉갠다',
    파일판정(`읽기('${원자료}')\n  T.set(r.제목, {});`).갈래 === '뭉갠다');
  검('구분까지 넣으면 갈라본다',
    파일판정(`읽기('${원자료}')\n  const k = \`\${r.제목}|\${r.구분}\`;\n  T.set(k, {});`).갈래 === '갈라본다');
  검('뭉갠 줄의 줄번호를 알려 준다',
    파일판정(`읽기('${원자료}')\n  T.set(r.제목, {});`).열쇠[0].줄번호 === 2);
  검('걸러 낸 줄이 있으면 갈라본 것이다',
    걸러내나('    if (r.구분 !== 제목차트.get(r.제목)) continue;'));
  검('⛔ 주석의 「구분」은 거른 것이 아니다',
    !걸러내나('   * 구분을 넣어야 한다 — continue'));
  검('앞에서 걸렀으면 열쇠가 맨몸이어도 갈라본다',
    파일판정([`읽기('${원자료}')`, '  if (r.구분 !== c) continue;', '  T.set(r.제목, {});'].join(String.fromCharCode(10))).갈래 === '갈라본다');
  검('⛔ 빈 것도 안 터진다',
    파일판정(undefined).갈래 === '해당없음' && 열쇠줄들(null).length === 0 && !구분들었나(null));

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ check-two-chart-merge 자가시험 통과 (16)');
  process.exit(0);
}

/* ── 실제로 훑는다 ── */
const 방 = path.join(뿌리, 'scripts');
const 결과 = { 뭉갠다: [], 갈라본다: [], 못쟀다: [] };
/* ⛔ 자기 자신은 뺀다 — 자가시험 글월에 든 보기가 걸려 자꾸 스스로를 고발한다 */
const 나 = path.basename(fileURLToPath(import.meta.url));
for (const f of fs.readdirSync(방).filter((x) => x.endsWith('.mjs') && x !== 나)) {
  const 글 = fs.readFileSync(path.join(방, f), 'utf8');
  const p = 파일판정(글);
  if (p.갈래 === '해당없음') continue;
  결과[p.갈래].push({ f, 열쇠: p.열쇠 });
}

/* 지금 실제로 몇 편이 걸려 있나 — 자가 무엇을 막고 있는지 수로 말한다 */
let 걸린편수 = null;
try {
  const t = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-title-pages.json'), 'utf8')).titles;
  걸린편수 = t.filter((x) => x.sameNameOtherChart
    || (x.noPageReason || '').includes('both the Films chart')).length;
} catch { 걸린편수 = null; }

console.log('■ 두 차트 뭉개기 — 원자료를 읽는 자 훑기\n');
console.log(`   ✅ 갈라본다 ${결과.갈라본다.length}개 · ⛔ 뭉갠다 ${결과.뭉갠다.length}개 · ⬜ 못 쟀다 ${결과.못쟀다.length}개`);
console.log(걸린편수 == null
  ? '   ⬜ 이름이 겹치는 편수를 못 읽었다 — src/data/wikitip-title-pages.json'
  : `   ⚠ 한국 명단에서 두 차트에 다 앉은 이름 ${걸린편수}편 — 이 자들이 그만큼을 잘못 셀 수 있다`);

if (결과.뭉갠다.length) {
  console.log('\n■ ⛔ 제목만으로 줄을 모은다 — 이름이 겹치면 남의 작품 수가 섞인다');
  for (const x of 결과.뭉갠다) {
    console.log(`   ${x.f}`);
    for (const k of x.열쇠.slice(0, 2)) console.log(`      ${k.줄번호}줄  ${k.글.slice(0, 92)}`);
  }
}
if (결과.못쟀다.length) {
  console.log('\n■ ⬜ 원자료는 읽는데 «모으는 열쇠»를 못 찾았다 — 눈으로 봐야 한다');
  for (const x of 결과.못쟀다) console.log(`   ${x.f}`);
}
console.log('\n⛔ 「뭉갠다」가 곧 「그 지면이 틀렸다」는 아니다 — 그 자가 이름 겹친 편을');
console.log('   하나도 안 다루면 수는 그대로다. 어느 쪽인지는 산출물을 열어 봐야 안다.');
console.log('⛔ 고치는 법은 하나다 — 열쇠에 «구분»을 넣고, 어느 차트가 우리 작품인지는');
console.log('   build-wikitip-title-pages 가 정해 둔 `type` 을 따른다. 자마다 다시 정하지 않는다.');
