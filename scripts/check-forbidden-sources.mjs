#!/usr/bin/env node
/**
 * check-forbidden-sources.mjs — **못 쓰는 곳에서 자료를 가져오는 코드를 막는다.**
 *
 *   node scripts/check-forbidden-sources.mjs            검사
 *   node scripts/check-forbidden-sources.mjs --자가시험   자가시험만
 *
 * ── 🔴 왜 만드나 (2026-09-09 · 5번) ───────────────────────────────────────
 *
 * 사장님: 「쭉, 하면서 데이터 수집 장소를 정리해놔. 같은 데이터인데 가능한 곳,
 *        불가능한 곳으로 나눠서 **불가능한 곳의 자료를 가져 오지않도록 못박아야한다**」
 *
 * ⛔ 「못박는다」는 문서에 적는 것이 아니다. 문서는 잊힌다(강령 ④ — 규칙은 «검사»로 둔다).
 *   그래서 이 자가 docs/수집-금지경로.tsv 를 읽어 저장소를 훑고, 금지된 호스트를
 *   부르거나 금지된 아카이브를 읽는 코드가 있으면 **막는다**.
 *
 * ⭐ 이 자의 요점은 「금지」가 아니라 **「그러면 어디서 받나」**다.
 *   막을 때 대체 경로를 «같이 찍는다». 대체를 안 알려 주면 사람이 막힌 채로 남는다.
 *   ⚠ 2026-09-09 에 내가 고용24 줄의 대체를 «찾아보지도 않고» 「없다」로 적어
 *     3번이 반나절 걸려 뚫은 492건을 버리게 했다. 사장님: 「먼저 수집한 자료는
 *     함부로 버리지 말고 다른 루트를 찾는 걸 우선 순위로 둬」
 *
 * ── ⚠ 오탐을 줄이는 것이 이 자의 절반이다 ────────────────────────────────
 * ```
 * 오탐이 많은 검사는 «꺼진 검사»가 된다. 그래서 셋을 건너뛴다 —
 *   1. 주석 줄        금지를 «설명하는» 줄이다. 부르는 것이 아니다
 *   2. 자기 자신      이 검사는 금지 글자를 시험용으로 품고 있다
 *   3. 눈감이 표시     줄 끝에 「금지경로-눈감음: <까닭>」 이 있으면 넘어간다
 *      ⛔ 까닭 없이 눈감을 수 없다. 까닭이 비면 그것을 흠으로 잡는다
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 표길 = 'docs/수집-금지경로.tsv';
export const 눈감이 = /금지경로-눈감음\s*:\s*(.*)$/;

/** 표를 읽는다 — 탭 넷, # 은 주석 */
export function 표읽기(글) {
  const 것 = [];
  for (const 줄 of String(글 ?? '').split(/\r?\n/)) {
    if (!줄.trim() || 줄.trimStart().startsWith('#')) continue;
    const 칸 = 줄.split('\t').map((x) => (x ?? '').trim());
    const [무엇, 금지꼴, 가능한곳, 근거] = 칸;
    if (!무엇 || !금지꼴) continue;
    것.push({ 무엇, 금지꼴, 가능한곳: 가능한곳 || '', 근거: 근거 || '' });
  }
  return 것;
}

/** 이 줄은 «부르는» 줄인가, 금지를 «설명하는» 줄인가 */
export function 설명줄인가(줄) {
  const t = String(줄 ?? '').trimStart();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')
      || t.startsWith('#') || t.startsWith('<!--');
}

/** 줄 끝 눈감이 — 까닭이 있어야 유효하다 */
export function 눈감이읽기(줄) {
  const m = String(줄 ?? '').match(눈감이);
  if (!m) return null;
  const 까닭 = (m[1] ?? '').trim();
  return { 있다: true, 까닭, 유효: 까닭.length >= 4 };
}

/** 한 파일에서 금지꼴을 찾는다 */
export function 파일훑기(글, 금지목록) {
  const 흠 = [];
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  for (let i = 0; i < 줄들.length; i++) {
    const 줄 = 줄들[i];
    if (설명줄인가(줄)) continue;
    for (const g of 금지목록 ?? []) {
      if (!줄.includes(g.금지꼴)) continue;
      const 눈 = 눈감이읽기(줄);
      if (눈?.유효) continue;
      흠.push({
        줄번호: i + 1, 금지꼴: g.금지꼴, 무엇: g.무엇, 가능한곳: g.가능한곳,
        까닭없는눈감이: Boolean(눈?.있다 && !눈.유효),
      });
    }
  }
  return 흠;
}

/** 훑을 파일을 모은다 — scripts/ 와 src/ 만. docs/ 는 «적는 곳»이라 뺀다 */
export function 훑을파일들(뿌리, 폴더읽기 = fs.readdirSync) {
  const 나 = 'check-forbidden-sources.mjs';
  const 것 = [];
  const 걷기 = (d) => {
    let 목록; try { 목록 = 폴더읽기(d, { withFileTypes: true }); } catch { return; }
    for (const e of 목록) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') 걷기(p); continue; }
      if (e.name === 나) continue;                       // 자기 자신은 안 훑는다
      if (/\.(mjs|js|ts|astro|json)$/.test(e.name)) 것.push(p);
    }
  };
  for (const 방 of ['scripts', 'src']) 걷기(path.join(뿌리, 방));
  return 것;
}

export function 재기(파일들, 금지목록, 읽기 = (p) => fs.readFileSync(p, 'utf8'), 뿌리 = '') {
  const 걸린것 = [];
  for (const f of 파일들) {
    let 글; try { 글 = 읽기(f); } catch { continue; }
    const 흠 = 파일훑기(글, 금지목록);
    if (흠.length) 걸린것.push({ 파일: 뿌리 ? path.relative(뿌리, f).replace(/\\/g, '/') : f, 흠 });
  }
  const 눈감이흠 = 걸린것.flatMap((c) => c.흠.filter((h) => h.까닭없는눈감이).map((h) => ({ ...h, 파일: c.파일 })));
  return { 걸린것, 눈감이흠, 된다: 걸린것.length === 0 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const T = '\t';

  const 표 = 표읽기([
    '# 주석이다',
    ['시세', 'data-dbg.krx.co.kr', '포털 15094808', '제6조2항'].join(T),
    '',
    ['아카이브', 'archive/raw/krx', 'archive/raw/stocks', '같다'].join(T),
    ['칸이 모자란 줄', ''].join(T),
  ].join('\n'));
  재다('표읽기: 주석·빈줄·칸모자람을 걸러 둘만 남긴다', 표.length === 2);
  재다('표읽기: 가능한곳을 읽는다', 표[0].가능한곳 === '포털 15094808');
  재다('표읽기: 금지꼴이 빈 줄은 버린다', !표.some((r) => !r.금지꼴));
  재다('표읽기: 빈 글도 안 죽는다', 표읽기('').length === 0);
  재다('표읽기: null 도 안 죽는다', 표읽기(null).length === 0);

  재다('설명줄: 두겹빗금', 설명줄인가('  // data-dbg.krx.co.kr 는 쓰지 않는다'));
  재다('설명줄: 별표', 설명줄인가(' * archive/raw/krx'));
  재다('설명줄: 우물정', 설명줄인가('# archive/raw/krx'));
  재다('설명줄: 코드는 아니다', 설명줄인가('const u = "https://data-dbg.krx.co.kr/x";') === false);

  재다('눈감이: 없으면 null', 눈감이읽기('const a=1;') === null);
  재다('눈감이: 까닭이 있으면 유효', 눈감이읽기('x // 금지경로-눈감음: 옛 파일 지우기 전용').유효 === true);
  재다('눈감이: 까닭이 비면 무효', 눈감이읽기('x // 금지경로-눈감음:').유효 === false);
  재다('눈감이: 까닭이 너무 짧으면 무효', 눈감이읽기('x // 금지경로-눈감음: ok').유효 === false);

  const g = [{ 무엇: '시세', 금지꼴: 'archive/raw/krx', 가능한곳: 'archive/raw/stocks' }];
  재다('파일훑기: 코드에서 잡는다', 파일훑기('fs.readdirSync("archive/raw/krx")', g).length === 1);
  재다('파일훑기: 주석은 안 잡는다', 파일훑기('// archive/raw/krx 는 안 쓴다', g).length === 0);
  재다('파일훑기: 유효한 눈감이는 넘어간다',
    파일훑기('rm("archive/raw/krx") // 금지경로-눈감음: 옛 파일 청소기다', g).length === 0);
  재다('파일훑기: 까닭 없는 눈감이는 흠으로 잡는다', (() => {
    const h = 파일훑기('rm("archive/raw/krx") // 금지경로-눈감음:', g);
    return h.length === 1 && h[0].까닭없는눈감이 === true;
  })());
  재다('파일훑기: 줄번호를 1부터 센다', 파일훑기('a\nb\nread("archive/raw/krx")', g)[0].줄번호 === 3);
  재다('파일훑기: 한 줄에 둘이면 둘 다 잡는다', 파일훑기(
    'x("archive/raw/krx","data-dbg.krx.co.kr")',
    [...g, { 무엇: '호스트', 금지꼴: 'data-dbg.krx.co.kr', 가능한곳: '포털' }]).length === 2);
  재다('파일훑기: 빈 글은 흠 0', 파일훑기('', g).length === 0);
  재다('파일훑기: null 도 안 죽는다', 파일훑기(null, g).length === 0);
  재다('파일훑기: 금지목록이 비면 흠 0', 파일훑기('read("archive/raw/krx")', []).length === 0);
  재다('파일훑기: 금지목록이 null 이어도 안 죽는다', 파일훑기('read("archive/raw/krx")', null).length === 0);

  const r = 재기(['a.mjs', 'b.mjs'], g, (p) => (p === 'a.mjs' ? 'read("archive/raw/krx")' : 'const x=1;'));
  재다('재기: 걸린 파일만 센다', r.걸린것.length === 1 && r.걸린것[0].파일 === 'a.mjs');
  재다('재기: 흠이 없으면 된다=true', 재기(['b.mjs'], g, () => 'const x=1;').된다 === true);
  재다('재기: 못 읽는 파일은 건너뛴다', 재기(['x.mjs'], g, () => { throw new Error('없다'); }).된다 === true);
  재다('재기: 대체 경로를 같이 물고 온다', r.걸린것[0].흠[0].가능한곳 === 'archive/raw/stocks');
  재다('재기: 파일이 없으면 된다=true', 재기([], g, () => '').된다 === true);

  const 가짜 = (d) => {
    const 방 = {
      scripts: [{ name: 'a.mjs', isDirectory: () => false },
                { name: 'check-forbidden-sources.mjs', isDirectory: () => false },
                { name: 'x.md', isDirectory: () => false }],
      src: [{ name: 'p.astro', isDirectory: () => false }],
    };
    const 이름 = path.basename(d);
    if (방[이름]) return 방[이름];
    throw new Error('없다');
  };
  const ff = 훑을파일들('/뿌리', 가짜).map((p) => path.basename(p));
  재다('훑을파일들: mjs·astro 를 모은다', ff.includes('a.mjs') && ff.includes('p.astro'));
  재다('훑을파일들: 자기 자신은 뺀다', !ff.includes('check-forbidden-sources.mjs'));
  재다('훑을파일들: md 는 안 훑는다', !ff.includes('x.md'));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`\n■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ───────────────────────────────────────────────────────────── */
const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

if (!자가시험()) process.exit(1);
if (process.argv.includes('--자가시험')) process.exit(0);

let 표글 = '';
try { 표글 = fs.readFileSync(path.join(뿌리, 표길), 'utf8'); }
catch { console.log(`\n🔴 ${표길} 이 없다 — 무엇이 금지인지 알 수 없다`); process.exit(1); }
const 금지목록 = 표읽기(표글);
if (!금지목록.length) { console.log(`\n🔴 ${표길} 에 줄이 없다`); process.exit(1); }

const 파일들 = 훑을파일들(뿌리);
const r = 재기(파일들, 금지목록, (p) => fs.readFileSync(p, 'utf8'), 뿌리);

console.log(`\n■ 금지 경로 — 금지 ${금지목록.length}가지 · 훑은 파일 ${파일들.length}개\n`);
if (r.된다) {
  console.log('✅ 못 쓰는 곳에서 자료를 가져오는 코드 0개');
  process.exit(0);
}
const 흠수 = r.걸린것.reduce((a, c) => a + c.흠.length, 0);
console.log(`🔴 못 쓰는 곳을 부르는 자리 ${흠수}개 (파일 ${r.걸린것.length}개)\n`);
for (const c of r.걸린것) {
  console.log(`  · ${c.파일}`);
  for (const h of c.흠) {
    console.log(`      ${h.줄번호}줄  「${h.금지꼴}」  — ${h.무엇}`);
    console.log(`      ✅ 대신 여기서 받는다: ${h.가능한곳 || '(대체가 안 적혔다 — 표를 채운다)'}`);
    if (h.까닭없는눈감이) console.log('      ⛔ 눈감이에 «까닭»이 없다. 까닭 없이 넘어갈 수 없다');
  }
}
console.log('\n⛔ 「고쳤다」를 말로 남기지 않는다 — 이 검사가 0 이 되어야 고친 것이다');
console.log(`   금지와 대체는 ${표길} 이 정본이다`);
process.exit(1);
