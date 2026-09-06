#!/usr/bin/env node
/**
 * backfill-archive-r2.mjs — **R2 에 «없는» archive 파일을 찾아 올린다.**
 * ────────────────────────────────────────────────────────────────────────────
 * [🔴 왜 만드나 — 2026-09-06]
 *   C드라이브가 100% 차서(673MB 남음) `archive/` 525MB 를 OneDrive 로 옮기려 했다.
 *   ⛔ 옮기기 «전»에 R2 와 대조해 보니 **124개가 R2 에 없었다.**
 *      `raw/community-desk/` · `raw/culture-portal/` · `raw/bigdata-culture/` · `raw/alimi/` …
 *   ⇒ **그 124개는 이 PC 가 «유일한 자리»다.** 옮기다 잘못되면 영영 없다.
 *
 * [왜 빠졌나]
 *   수집기마다 `store.put` 을 «거치는 것»과 «writeFileSync 만 하는 것»이 섞여 있었다.
 *   6번이 2026-09-04 에 이 결함을 잡아 두 수집기를 고쳤지만, **이미 받아 둔 옛 파일은
 *   그대로 로컬에만 남았다.** 고친 뒤의 것만 올라간다.
 *
 * [⛔ 이 자가 «하지 않는» 것]
 *   · 로컬 파일을 지우지 않는다. **올리기만 한다.** 지우는 것은 사람이 따로 판단한다
 *   · 이미 R2 에 있는 것을 덮어쓰지 않는다 — 먼 쪽이 더 온전할 수 있다
 *   · R2 가 꺼져 있으면 아무것도 하지 않고 멈춘다. 「올렸다」고 하지 않는다
 *
 * [쓰는 법]
 *   node scripts/backfill-archive-r2.mjs --자가시험
 *   node scripts/backfill-archive-r2.mjs            무엇이 빠졌는지만 센다(안 올린다)
 *   node scripts/backfill-archive-r2.mjs --올린다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 로컬 파일 경로를 R2 열쇠로 바꾼다 — ⛔ 윈도의 역슬래시를 그대로 두면 열쇠가 안 맞는다 */
export function 열쇠로(상대경로) {
  return 'raw/' + String(상대경로 ?? '').split(path.sep).join('/').replace(/^\/+/, '');
}

/** 무슨 종류인지 — 올릴 때 Content-Type 을 맞춘다 */
export function 갈래(이름) {
  const n = String(이름 ?? '').toLowerCase();
  if (n.endsWith('.json')) return 'application/json';
  if (n.endsWith('.csv')) return 'text/csv; charset=utf-8';
  if (n.endsWith('.xml')) return 'application/xml';
  if (n.endsWith('.txt') || n.endsWith('.md')) return 'text/plain; charset=utf-8';
  if (n.endsWith('.html')) return 'text/html; charset=utf-8';
  return 'application/octet-stream';
}

/** 올릴 목록 — 로컬에 있고 R2 에 없는 것 */
export function 빠진것(로컬열쇠들, 먼열쇠들) {
  const 먼것 =먼열쇠들 instanceof Set ? 먼열쇠들 : new Set(먼열쇠들 ?? []);
  return [...(로컬열쇠들 ?? [])].filter((k) => !먼것.has(k));
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
const 내가직접돌았나 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (내가직접돌았나 && process.argv.includes('--자가시험')) {
  let 통과 = 0; let 실패 = 0;
  const 참 = (이름, 값) => { if (값) 통과++; else { 실패++; console.log('  🔴', 이름); } };

  /* 🔴 윈도에서 역슬래시가 섞이면 열쇠가 안 맞아 «전부 빠진 것»으로 보인다 */
  참('역슬래시를 슬래시로 바꾼다', 열쇠로('krx\\a.json') === 'raw/krx/a.json');
  참('이미 슬래시면 그대로', 열쇠로('krx/a.json') === 'raw/krx/a.json');
  참('앞의 슬래시를 걷어낸다', 열쇠로('/krx/a.json') === 'raw/krx/a.json');
  참('빈 값을 견딘다', 열쇠로('') === 'raw/');
  참('null 을 견딘다', 열쇠로(null) === 'raw/');

  참('json 갈래', 갈래('a.JSON') === 'application/json');
  참('csv 갈래', 갈래('a.csv').startsWith('text/csv'));
  참('모르는 것은 octet-stream', 갈래('a.bin') === 'application/octet-stream');
  참('빈 값을 견딘다', 갈래('') === 'application/octet-stream');

  참('빠진 것을 고른다', 빠진것(['a', 'b'], ['a']).join() === 'b');
  참('다 있으면 빈 목록', 빠진것(['a'], ['a', 'b']).length === 0);
  참('Set 도 받는다', 빠진것(['a', 'b'], new Set(['b'])).join() === 'a');
  참('먼 쪽이 비면 전부 빠진 것', 빠진것(['a', 'b'], []).length === 2);
  참('로컬이 비면 빈 목록', 빠진것([], ['a']).length === 0);
  참('null 을 견딘다', 빠진것(null, null).length === 0);

  console.log(`\nR2 메우기 — 자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가직접돌았나) {
  const { remoteEnabled, list, put, storeStatus } = await import('../src/lib/store.mjs');
  if (!remoteEnabled) {
    console.log('🔴 R2 가 꺼져 있다 — **아무것도 안 했다.**');
    console.log('   ' + JSON.stringify(storeStatus()));
    console.log('⛔ 이 상태에서 archive 를 옮기거나 지우면 사본이 어디에도 없다.');
    process.exit(1);
  }

  const 방 = path.join(뿌리, 'archive', 'raw');
  const 로컬 = new Map();   /* 열쇠 → 실제 파일 경로 */
  const 훑기 = (d, 앞 = '') => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) 훑기(p, 앞 ? `${앞}/${f.name}` : f.name);
      else 로컬.set(열쇠로(앞 ? `${앞}/${f.name}` : f.name), p);
    }
  };
  훑기(방);

  const 먼것 = new Set(await list('raw/', { max: 200000, timeout: 180000 }));
  const 빠진 = 빠진것([...로컬.keys()], 먼것);

  console.log(`■ 로컬 ${로컬.size}개 · R2 ${먼것.size.toLocaleString()}개 · **R2 에 없는 것 ${빠진.length}개**\n`);
  if (!빠진.length) {
    console.log('✅ 빠진 것이 없다. archive/raw 는 R2 에 사본이 다 있다.');
    process.exit(0);
  }

  /* 무엇이 빠졌나 — 폴더별로 묶어 보여 준다 */
  const 묶음 = {};
  for (const k of 빠진) { const g = k.split('/')[1] || '(뿌리)'; 묶음[g] = (묶음[g] || 0) + 1; }
  for (const [g, n] of Object.entries(묶음).sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(4)}개  raw/${g}/`);

  if (!process.argv.includes('--올린다')) {
    console.log('\n⬜ 세기만 했다. 올리려면 --올린다 를 붙인다.');
    process.exit(0);
  }

  let 됐다 = 0; let 흠 = 0;
  for (const k of 빠진) {
    const p = 로컬.get(k);
    try {
      const 몸 = fs.readFileSync(p);
      const r = await put(k, 몸, 갈래(k));
      /* ⛔ 「예외가 안 났다」로 성공을 판정하지 않는다 — 돌려준 것을 본다 */
      if (r && (r.remote || r.ok !== false)) 됐다++; else { 흠++; console.log(`   🔴 ${k} — 올렸다는 표시가 없다: ${JSON.stringify(r).slice(0, 90)}`); }
    } catch (e) { 흠++; console.log(`   🔴 ${k} — ${String(e.message).slice(0, 80)}`); }
    if ((됐다 + 흠) % 20 === 0) console.log(`   … ${됐다 + 흠}/${빠진.length}`);
  }
  console.log(`\n✅ 올린 것 ${됐다}개 · 🔴 못 올린 것 ${흠}개`);

  /* ⭐ 올린 뒤 «다시 재서» 확인한다. 「올렸다」는 말로 끝내지 않는다 */
  const 다시 = new Set(await list('raw/', { max: 200000, timeout: 180000 }));
  const 남은것 = 빠진것([...로컬.keys()], 다시);
  console.log(`${남은것.length === 0 ? '✅' : '🔴'} 다시 재니 R2 에 없는 것 ${남은것.length}개`);
  for (const k of 남은것.slice(0, 10)) console.log('   ' + k);
  if (남은것.length) {
    console.log('\n⛔ 하나라도 남으면 archive 를 옮기거나 지우지 않는다. 그 파일은 이 PC 가 유일한 자리다.');
    process.exit(1);
  }
  console.log('\n⭐ 이제 archive/raw 는 R2 에 사본이 다 있다. 다만 «옮기는 것»은 사람이 따로 판단한다.');
}
