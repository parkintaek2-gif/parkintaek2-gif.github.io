#!/usr/bin/env node
/**
 * check-licence-register.mjs — **모으는 것은 전부 라이선스 대장에 있어야 한다.**
 *
 *   node scripts/check-licence-register.mjs            검사
 *   node scripts/check-licence-register.mjs --자가시험   자가시험만
 *
 * ── 🔴 왜 만드나 (2026-09-09 21:0x · 5번) ──────────────────────────────────
 *
 * 사장님: 「재배포 조건이 없으면 배포해도 되겠지. 더구나 증권거래소는 준공공기관이니까」
 * ⇒ 재 보니 KRX OPEN API 약관은 **「비상업적인 목적으로만」**(제6조②)이고
 *   **「제3자에게 제공할 수 없다」**(제11조)였다. 조건이 없는 것이 아니었다.
 *   ⚠ 「재배포」라는 낱말이 한 번도 안 나온다 — 낱말로 찾으면 「조건 없음」으로 보인다.
 *
 * ⛔ 그런데 그 값이 **팔 상품(People Panel · $149 예정)에 들어가 있었다.**
 *   까닭은 하나다 — **KRX 가 `docs/데이터-라이선스-대장.md` 에 아예 없었다.**
 *   대장의 판정 기준은 튼튼한데, 새 출처가 «등재 없이» 수집기만 생겼다.
 *   ⇒ 대장은 사람이 기억해서 채우는 것이 되어 있었고, 그래서 채워지지 않았다.
 *
 * ⭐ 이미 같은 사고가 두 번 있었다(대장 md 0절·51줄) —
 *   3번이 고용24 492건을 반나절 걸려 뚫고 «뚫고 나서» 공공누리 4유형인 걸 알아 통째로 버렸고,
 *   주식발행정보는 152,396행을 받고 나서야 2유형인 걸 알았다.
 *   ⇒ 「일단 모으고 나중에 확인」이 우리 저장소의 되풀이되는 사고다. 그것을 검사로 막는다.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────────
 * ```
 * 🔴 자료가 «있는» 폴더가 대장에 없으면 막는다 — 오늘의 KRX 가 그 경우다
 * ⚠ ⬜(미확인)은 «세어서 보여 준다». 막지는 않는다 —
 *   늘 빨간 검사는 아무도 안 본다(강령 ④). 대신 수가 줄어드는지를 본다
 * 🔴 🔴(못 쓴다) 판정인데 아직 모으고 있으면 «왜»가 근거에 적혀 있어야 한다.
 *   없으면 막는다. 「모으고는 있는데 까닭을 아무도 모르는 것」을 남기지 않는다
 * ⛔ 빈 폴더는 안 센다 — 폴더만 만들어 둔 것에 라이선스를 물을 수 없다
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장길 = 'docs/라이선스-대장.tsv';
export const 자료방 = 'archive/raw';
export const 판정들 = ['🟢', '🟡', '🔴', '⬜'];

/** 대장 한 줄을 읽는다. 주석·빈 줄은 null */
export function 줄읽기(줄) {
  const t = String(줄 ?? '').replace(/\r$/, '');
  if (!t.trim() || t.trimStart().startsWith('#')) return null;
  const [폴더, 출처, 판정, ...근거] = t.split('\t').map((s) => (s ?? '').trim());
  if (!폴더 || !판정) return null;
  if (!판정들.includes(판정)) return null;
  return { 폴더, 출처: 출처 || '', 판정, 근거: 근거.join(' ').trim() };
}

/** 대장 전체 → 폴더로 찾는 지도 */
export function 대장읽기(글) {
  const m = new Map();
  for (const 줄 of String(글 ?? '').split(/\r?\n/)) {
    const r = 줄읽기(줄);
    if (r) m.set(r.폴더, r);
  }
  return m;
}

/**
 * 판정한다. ⛔ 세 갈래를 «따로» 낸다 — 합치면 무엇을 고칠지 모른다.
 *   등재안됨  : 자료가 있는데 대장에 줄이 없다        → 막는다
 *   까닭없는빨강: 🔴 인데 왜 모으는지 안 적혀 있다      → 막는다
 *   미확인    : ⬜ 다                                → 세어서 보여만 준다
 */
export function 재기(자료있는폴더들, 대장) {
  const 등재안됨 = []; const 까닭없는빨강 = []; const 미확인 = []; const 판정별 = {};
  for (const 폴더 of (자료있는폴더들 ?? [])) {
    const r = 대장?.get?.(폴더);
    if (!r) { 등재안됨.push(폴더); continue; }
    판정별[r.판정] = (판정별[r.판정] ?? 0) + 1;
    if (r.판정 === '⬜') 미확인.push(폴더);
    if (r.판정 === '🔴' && !r.근거.trim()) 까닭없는빨강.push(폴더);
  }
  return {
    등재안됨, 까닭없는빨강, 미확인, 판정별,
    된다: 등재안됨.length === 0 && 까닭없는빨강.length === 0,
  };
}

/** 자료가 «있는» 폴더만. ⛔ 빈 폴더는 안 센다 */
export function 자료있는폴더(방, 폴더읽기 = fs.readdirSync) {
  let 것 = [];
  try { 것 = 폴더읽기(방, { withFileTypes: true }); } catch { return null; }
  const 낼것 = [];
  for (const e of 것) {
    if (!e.isDirectory?.()) continue;
    let 안 = [];
    try { 안 = 폴더읽기(path.join(방, e.name)); } catch { continue; }
    if (안.length > 0) 낼것.push(e.name);
  }
  return 낼것.sort();
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
function 자가시험() {
  let 흠 = 0;
  const 검 = (말, 참) => { if (!참) { 흠 += 1; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };

  검('탭으로 가른 줄을 읽는다', (() => {
    const r = 줄읽기('krx\tKRX OPEN API\t🔴\t제6조② 비상업 전용');
    return r.폴더 === 'krx' && r.판정 === '🔴' && /제6조/.test(r.근거);
  })());
  검('# 주석과 빈 줄은 안 읽는다', 줄읽기('# 설명') === null && 줄읽기('') === null);
  검('⛔ 판정이 아는 기호가 아니면 안 읽는다 — 오타로 통과되지 않게',
    줄읽기('x\t출처\tOK\t근거') === null);
  검('근거에 탭이 더 있어도 잃지 않는다',
    /가\tab/.test('가\tab') && 줄읽기('x\t출처\t🟢\t가\tab').근거.includes('ab'));
  검('⛔ 빈 것도 견딘다', 줄읽기(null) === null);

  const 대장 = 대장읽기([
    '# 주석',
    'stocks\t공공데이터포털 주식시세\t🟢\t제한 없음 · 08-05',
    'krx\tKRX OPEN API\t🔴\t제6조② 비상업 전용 — 내부 검산용',
    'kosis\tKOSIS\t⬜\t아직 안 봤다',
    'bad\t까닭 없는 빨강\t🔴\t',
  ].join('\n'));
  검('대장을 폴더로 찾는다', 대장.get('krx').판정 === '🔴' && 대장.size === 4);

  /* 🔴 오늘의 사고 — 자료가 있는데 대장에 없는 폴더 */
  const r = 재기(['stocks', 'krx', 'kosis', '새폴더'], 대장);
  검('🔴 대장에 없는 폴더를 잡는다 (오늘 KRX 가 그랬다)',
    r.등재안됨.length === 1 && r.등재안됨[0] === '새폴더');
  검('🔴 그것이 있으면 «막는다»', r.된다 === false);
  검('⬜ 미확인은 세어서 보여만 준다 — 막지 않는다', (() => {
    const g = 재기(['stocks', 'kosis'], 대장);
    return g.미확인.length === 1 && g.된다 === true;
  })());
  검('🔴 「못 쓴다」인데 까닭이 없으면 막는다', (() => {
    const g = 재기(['bad'], 대장);
    return g.까닭없는빨강.length === 1 && g.된다 === false;
  })());
  검('🔴 「못 쓴다」인데 까닭이 «있으면» 통과한다 (내부 검산용 KRX)', (() => {
    const g = 재기(['krx'], 대장);
    return g.까닭없는빨강.length === 0 && g.된다 === true;
  })());
  검('판정별로 센다', (() => {
    const g = 재기(['stocks', 'krx', 'kosis'], 대장);
    return g.판정별['🟢'] === 1 && g.판정별['🔴'] === 1 && g.판정별['⬜'] === 1;
  })());
  검('세 갈래를 «따로» 낸다 — 합치면 무엇을 고칠지 모른다', (() => {
    const g = 재기(['새폴더', 'bad', 'kosis'], 대장);
    return g.등재안됨.length === 1 && g.까닭없는빨강.length === 1 && g.미확인.length === 1;
  })());
  검('⛔ 빈 것도 견딘다 (재기)', 재기(null, 대장).된다 === true && 재기([], null).된다 === true);

  검('⛔ 빈 폴더는 안 센다', (() => {
    const 가짜 = (p, o) => {
      if (o?.withFileTypes) return [{ name: '찬것', isDirectory: () => true }, { name: '빈것', isDirectory: () => true }];
      return String(p).endsWith('찬것') ? ['a.json'] : [];
    };
    const 것 = 자료있는폴더('/x', 가짜);
    return 것.length === 1 && 것[0] === '찬것';
  })());
  검('⬜ 자료방이 없으면 null — 「0개」로 만들지 않는다',
    자료있는폴더('/없는곳', () => { throw new Error('x'); }) === null);

  console.log(`\n라이선스 대장 검사 — 자가시험 ${흠 ? '🔴 흠 ' + 흠 + '개' : '전부 통과'}`);
  return 흠;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
if (자가시험()) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

const 폴더들 = 자료있는폴더(path.join(뿌리, 자료방));
if (폴더들 === null) {
  console.log(`\n⬜ 못 쟀다 — ${자료방} 폴더가 없다 (이 PC 에 아카이브가 없는 것이다)`);
  process.exit(0);
}
let 대장글 = '';
try { 대장글 = fs.readFileSync(path.join(뿌리, 대장길), 'utf8'); }
catch { console.log(`\n🔴 ${대장길} 이 없다 — 대장이 없으면 무엇을 파는지 알 수 없다`); process.exit(1); }
const 대장 = 대장읽기(대장글);
const r = 재기(폴더들, 대장);

console.log(`\n■ 라이선스 대장 — 자료가 있는 폴더 ${폴더들.length}개 · 대장 ${대장.size}줄\n`);
console.log(`  판정  🟢 ${r.판정별['🟢'] ?? 0}  ·  🟡 ${r.판정별['🟡'] ?? 0}  ·  🔴 ${r.판정별['🔴'] ?? 0}  ·  ⬜ ${r.판정별['⬜'] ?? 0}`);

if (r.미확인.length) {
  console.log(`\n⚠ ⬜ 미확인 ${r.미확인.length}개 — 막지 않는다. 다만 «줄어드는지» 본다`);
  console.log(`   ${r.미확인.join(' · ')}`);
  console.log('   ⛔ 「일단 모으고 나중에 확인」이 우리 저장소의 되풀이되는 사고다 —');
  console.log('     3번이 고용24 492건을 뚫고 나서 4유형인 걸 알아 통째로 버렸고,');
  console.log('     주식발행정보는 152,396행을 받고 나서야 2유형인 걸 알았다.');
}
if (r.등재안됨.length) {
  console.log(`\n🔴 대장에 «없는» 폴더 ${r.등재안됨.length}개 — 무엇을 파는지 알 수 없다`);
  for (const f of r.등재안됨) console.log(`   · archive/raw/${f}`);
  console.log(`   ✅ 고치는 법: ${대장길} 에 한 줄 넣는다 — 폴더<TAB>출처<TAB>판정<TAB>근거`);
  console.log('   ⛔ 판정을 «지어내지 않는다». 약관을 읽고 적거나 ⬜ 로 둔다');
}
if (r.까닭없는빨강.length) {
  console.log(`\n🔴 「못 쓴다」인데 «왜 모으는지» 안 적힌 것 ${r.까닭없는빨강.length}개`);
  for (const f of r.까닭없는빨강) console.log(`   · archive/raw/${f}`);
  console.log('   ⚠ 모으고는 있는데 까닭을 아무도 모르는 것을 남기지 않는다');
}
if (r.된다) console.log('\n✅ 대장에 빠진 폴더 0개 · 까닭 없는 「못 쓴다」 0개');
process.exit(r.된다 ? 0 : 1);
