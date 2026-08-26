#!/usr/bin/env node
/**
 * check-kcw-row-pages.mjs — **목록 지면 하나에 갇힌 행을 찾는다.** (2026-08-26 · 5번)
 *
 * ## 무엇을 재나
 *
 * 우리 자료는 거의 다 「행이 여러 개인 표」다. 그런데 지면은 두 꼴로 난다 —
 *
 * ```
 * ㉮ 목록 지면 하나        /hometowns   37개 도시를 «한 장»에 담는다
 * ㉯ 행별 지면 여러 장     /from/busan  도시 하나가 «한 장»이 된다
 * ```
 *
 * 손님은 ㉯를 검색한다. 「which bts member is from busan」은 **도시 하나**에 대한
 * 물음이고, 「어느 도시가 몇 명이냐」를 묻는 사람은 거의 없다.
 *
 * 🔴 2026-08-26 에 이것으로 지면 37장이 나왔다. 자료는 8/21 에 이미 있었고 **축만
 * 없었다.** 새로 캘 것이 없었다. 그날 GSC 를 보니 그 물음이 23노출 · 순위 3~11위 ·
 * 클릭 «0» 이었다 — 첫 화면에 있는데 답하는 지면이 없어서 아무도 안 눌렀다.
 *
 * ## ⛔ 이 자가 판정하지 «않는» 것
 *
 * - 「행별 지면을 내야 한다」고 말하지 않는다. **행이 갇혀 있다는 사실만** 낸다.
 *   행이 3개인 자료를 3장으로 쪼개면 얇은 지면 셋이 된다 — 그건 사람이 판단한다.
 * - 행 수는 «자료의 행»이지 손님 수요가 아니다. 수요는 GSC 로 따로 잰다.
 *
 * ## 쓰는 법
 * ```
 * node scripts/check-kcw-row-pages.mjs            갇힌 것을 큰 순서로 낸다
 * node scripts/check-kcw-row-pages.mjs --자가시험
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const 뿌리 = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const 자료방 = path.join(뿌리, 'src', 'data');
const 지면방 = path.join(뿌리, 'src', 'pages', 'wikitip');

/** 행이 여러 개인 배열을 자료에서 찾아 «가장 큰 것»의 길이를 낸다. */
export function 행수재기(값, 깊이 = 0) {
  if (깊이 > 3 || 값 == null) return 0;
  if (Array.isArray(값)) {
    /* 낱값 배열(숫자·글자)은 표가 아니다 — 행으로 세지 않는다 */
    const 객체행 = 값.filter((x) => x && typeof x === 'object');
    if (객체행.length >= 2) return 값.length;
    return 0;
  }
  if (typeof 값 !== 'object') return 0;
  let 최대 = 0;
  for (const [k, v] of Object.entries(값)) {
    if (k.startsWith('_')) continue;
    최대 = Math.max(최대, 행수재기(v, 깊이 + 1));
  }
  return 최대;
}

/** `src/pages/wikitip` 아래에 «행별 지면 무리»(폴더)가 어떤 이름으로 있나 */
export function 행별무리(목록) {
  return new Set(목록.filter((n) => !n.includes('.')));
}

/**
 * 자료 이름과 지면 무리 이름을 견준다.
 * ⚠ 이름이 딱 같지 않아도 «담고 있으면» 있는 것으로 본다 —
 *   `wikitip-hometowns` ↔ 무리 `from` 처럼 이름이 다른 자리가 실제로 있다.
 *   그래서 이 자는 **짐작하지 않고 «후보»만 낸다.** 사람이 마지막을 본다.
 */
export function 갇힌것찾기({ 자료들, 무리들, 지면글 }) {
  const 결과 = [];
  for (const { 이름, 행 } of 자료들) {
    if (행 < 8) continue;                       // 8행 미만은 쪼개면 얇아진다
    const 짧은 = 이름.replace(/^(wikitip|kcw)-/, '').replace(/-pages?$/, '');
    /* 이 자료를 «행별 지면»이 실제로 쓰고 있나 — 무리 안 파일이 import 하는지 본다 */
    const 행별이쓴다 = [...무리들].some((무리) => (지면글.get(무리) ?? '').includes(`data/${이름}`));
    if (행별이쓴다) continue;
    결과.push({ 자료: 짧은, 원이름: 이름, 행, 무리있나: 무리들.has(짧은) });
  }
  return 결과.sort((a, b) => b.행 - a.행);
}

/* ── 자가시험 ─────────────────────────────────────────────
   ⛔ 말로 적은 규칙은 잊힌다. 겪은 것을 검사로 굳힌다. */
if (process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 검 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  검('낱값 배열은 행으로 세지 않는다', 행수재기({ a: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }) === 0);
  검('객체 배열은 행으로 센다', 행수재기({ rows: [{ a: 1 }, { a: 2 }] }) === 2);
  검('한 겹 아래도 찾는다', 행수재기({ x: { y: [{ a: 1 }, { a: 2 }, { a: 3 }] } }) === 3);
  검('밑줄로 시작하는 칸은 건너뛴다(주석 자리다)',
    행수재기({ _note: [{ a: 1 }, { a: 2 }, { a: 3 }] }) === 0);
  검('가장 큰 배열을 낸다', 행수재기({ a: [{ x: 1 }, { x: 2 }], b: [{ y: 1 }, { y: 2 }, { y: 3 }] }) === 3);
  검('빈 것에 안 깨진다', 행수재기(null) === 0 && 행수재기(undefined) === 0 && 행수재기(7) === 0);

  검('파일 이름은 무리가 아니다', !행별무리(['a.astro', 'b']).has('a.astro'));
  검('폴더는 무리다', 행별무리(['a.astro', 'person']).has('person'));

  /* ⭐ 이 자를 만들게 한 자리 — hometowns 는 이제 `from` 무리가 쓴다. 갇힌 것이 아니다 */
  검('⭐ 행별 무리가 그 자료를 쓰면 갇힌 것이 아니다', 갇힌것찾기({
    자료들: [{ 이름: 'wikitip-hometowns', 행: 37 }],
    무리들: new Set(['from']),
    지면글: new Map([['from', "import 고향 from '../../../data/wikitip-hometowns.json';"]]),
  }).length === 0);

  검('⭐ 아무 행별 무리도 안 쓰면 갇힌 것으로 낸다', 갇힌것찾기({
    자료들: [{ 이름: 'wikitip-charts', 행: 40 }],
    무리들: new Set(['from']),
    지면글: new Map([['from', 'nothing']]),
  }).length === 1);

  검('8행 미만은 안 낸다 — 쪼개면 얇아진다', 갇힌것찾기({
    자료들: [{ 이름: 'wikitip-tiny', 행: 7 }],
    무리들: new Set(), 지면글: new Map(),
  }).length === 0);

  검('큰 것부터 낸다', (() => {
    const r = 갇힌것찾기({
      자료들: [{ 이름: 'a', 행: 10 }, { 이름: 'b', 행: 99 }],
      무리들: new Set(), 지면글: new Map(),
    });
    return r[0].행 === 99;
  })());

  console.log(실 === 0 ? `✅ check-kcw-row-pages 자가시험 통과 (${통})` : `⛔ ${실}개 실패 / ${통}개 통과`);
  process.exit(실 === 0 ? 0 : 1);
}

/* ── 실제로 잰다 ───────────────────────────────────────── */
const 자료들 = [];
for (const f of fs.readdirSync(자료방)) {
  if (!/^(wikitip|kcw)-/.test(f) || !f.endsWith('.json')) continue;
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8')); } catch { continue; }
  자료들.push({ 이름: f.replace(/\.json$/, ''), 행: 행수재기(j) });
}

/* 🔴 [2026-08-26 · 이 자를 처음 돌린 직후 고쳤다] 첫 판이 64개를 냈다. 과대집계였다.
   ⛔ 결함 둘이 있었다 —
     ① `src/pages/wikitip` 만 봤다. 그런데 지면 무리가 **`public/wikitip/` 에도 있다** —
       주 지면 268장(`week`)·생일 지면 366장(`born-on`)이 그렇다. 빌더가 미리 지어 둔다.
     ② Astro 파일만 봤다. 그런데 그 정적 무리를 «만드는 것»은 `scripts/build-*.mjs` 다.
       import 를 그 스크립트가 하므로, Astro 만 훑으면 「아무도 안 쓴다」로 읽힌다.
   ⭐ 그래서 셋을 다 훑는다 — Astro 무리 · 정적 무리 · 빌더 스크립트.
   ⚠ 이렇게 고쳐도 「이름이 다른 자료를 쓰는 무리」는 여전히 못 가른다.
     그것이 이 자가 «후보»만 내고 판정하지 않는 까닭이다. */
const 무리들 = 행별무리(fs.readdirSync(지면방));
const 정적방 = path.join(뿌리, 'public', 'wikitip');
if (fs.existsSync(정적방)) {
  for (const n of 행별무리(fs.readdirSync(정적방))) 무리들.add(n);
}

const 지면글 = new Map();
const 글모으기 = (d, 무리) => {
  let 글 = 지면글.get(무리) ?? '';
  try {
    for (const f of fs.readdirSync(d)) {
      if (/\.(astro|ts)$/.test(f)) 글 += fs.readFileSync(path.join(d, f), 'utf8');
    }
  } catch { /* 폴더가 아니면 넘어간다 */ }
  지면글.set(무리, 글);
};
for (const 무리 of 무리들) 글모으기(path.join(지면방, 무리), 무리);

/* 빌더 스크립트가 «정적 무리»를 만든다 — 그 글도 그 무리 몫으로 센다.
   어느 무리를 만드는지는 스크립트가 스스로 적어 둔 낼 경로(`public/wikitip/<무리>`)로 안다. */
const 스크립트방 = path.join(뿌리, 'scripts');
for (const f of fs.readdirSync(스크립트방)) {
  if (!f.endsWith('.mjs')) continue;
  let s;
  try { s = fs.readFileSync(path.join(스크립트방, f), 'utf8'); } catch { continue; }
  for (const m of s.matchAll(/public[\/\\]wikitip[\/\\]([a-z0-9-]+)/gi)) {
    const 무리 = m[1];
    if (!무리들.has(무리)) continue;
    지면글.set(무리, (지면글.get(무리) ?? '') + s);
  }
}

const 갇힌 = 갇힌것찾기({ 자료들, 무리들, 지면글 });

console.log('┌──────────────────────────────────────────────────────────────────────┐');
console.log('│ 목록 지면 «하나»에 갇힌 행을 찾는다 — 손님은 행 하나를 검색한다      │');
console.log('└──────────────────────────────────────────────────────────────────────┘');
console.log(`자료 ${자료들.length}개 · 행별 지면 무리 ${무리들.size}개 (${[...무리들].sort().join(' · ')})`);
console.log();

if (갇힌.length === 0) {
  console.log('✅ 8행 이상인 자료는 모두 행별 지면 무리가 쓰고 있다');
} else {
  console.log(`⚠ 행별 지면이 «없는» 자료 ${갇힌.length}개 — 큰 것부터`);
  for (const g of 갇힌.slice(0, 25)) {
    console.log(`  ${String(g.행).padStart(5)}행  ${g.자료}${g.무리있나 ? '   (같은 이름 무리는 있다 — 손으로 확인)' : ''}`);
  }
  console.log();
  console.log('⛔ 이 목록은 «할 일»이 아니라 «후보»다. 판정하지 않는다 —');
  console.log('   ① 행 하나가 손님이 검색할 만한 것인가 (도시·작품·사람은 그렇다. 측정 로그는 아니다)');
  console.log('   ② 쪼개면 얇아지지 않는가 (행마다 적을 것이 있어야 한다)');
  console.log('   ③ 수요가 있나 — GSC 로 따로 잰다:');
  console.log('      node scripts/search-console-report.mjs "sc-domain:kculturewire.com" --days 28 --행수=2000');
  console.log();
  console.log('📌 여섯 자리 모두 쓸 수 있다. 자료방·지면방 두 경로만 자기 것으로 바꾸면 된다.');
}
