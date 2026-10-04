#!/usr/bin/env node
/**
 * check-제목이-치는말인가.mjs — **우리 제목이 손님이 «치는 말»인지 한꺼번에 본다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 사장님: 「했다며? 대체 뭘 했다는 거지? 신뢰가 안간다」
 *
 * 재 보니 ─ 지면 10,843장 · 28일 구글 클릭 10회.
 * 색인은 됐고 자리도 있었다. **제목이 아무도 안 치는 말**이었다.
 *
 * ```
 * 우리가 쓴 말                         손님이 치는 말(자동완성 1차례)
 * ───────────────────────────────────────────────────────────────
 * largest listed companies      →     biggest korean companies
 * 무료 사주풀이                  →     ai 사주 무료
 * Free BaZi Reading             →     saju calculator / bazi calculator
 * 免費四柱解读                   →     八字命盤 / 八字 ai
 * ```
 *
 * ⛔ 한 장씩 고치면 1만 장에 또 한 달이 걸린다. 그래서 «한꺼번에 보는 자»를 둔다.
 *
 * 무엇을 하나
 *   ① GSC 에 «뜬 말»을 읽는다 — 거기 자리가 30위 밖이면 그 말로 질 싸움을 하고 있다
 *   ② 그 말의 자동완성을 긁어 «사람이 실제로 치는 꼴»을 낸다
 *   ③ 그 꼴이 우리 지면 제목에 글자 그대로 들어 있나 본다
 *
 * ⛔ 이 자는 «판정하지 않는다». 고칠 자리를 사람에게 보여 줄 뿐이다.
 * ⛔ 「검색량 N회」라고 말하지 않는다 — 구글이 그 수를 공짜로 주지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-제목이-치는말인가.mjs            GSC 자료가 있는 네 사이트
 *   node scripts/check-제목이-치는말인가.mjs --사이트 kcw
 *   node scripts/check-제목이-치는말인가.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 뒤처진선 = 30;   /* 30위 밖이면 사람 눈에 안 닿는다 */

/** GSC 자료에서 «뜬 말»을 꺼낸다. ⛔ 없으면 null — 빈 배열이 아니다 */
export function 뜬말들(묶음) {
  if (!묶음 || !Array.isArray(묶음.rows)) return null;
  return 묶음.rows
    .filter((r) => r && typeof r.key === 'string' && !r.key.startsWith('http'))
    .map((r) => ({ 말: r.key, 노출: r.impressions ?? 0, 클릭: r.clicks ?? 0, 자리: r.position ?? null }));
}

/** 질 싸움 — 노출은 나는데 자리가 뒤라 아무도 못 보는 말 */
export function 뒤처진말들(것들, 선 = 뒤처진선) {
  if (!Array.isArray(것들)) return null;
  return 것들
    .filter((x) => typeof x.자리 === 'number' && x.자리 > 선)
    .sort((a, b) => b.노출 - a.노출);
}

/** 제목에 그 말이 «글자 그대로» 들어 있나. 띄어쓰기·대소문자는 눈감는다 */
export function 제목에들었나(제목, 말) {
  const 고르기 = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const t = 고르기(제목); const m = 고르기(말);
  if (!t || !m) return false;
  return t.includes(m);
}

/** 뜬 말 가운데 어느 것도 제목에 없으면 그 지면은 «딴 말»을 쓰고 있다 */
export function 딴말쓰나(제목, 말들) {
  if (!Array.isArray(말들) || !말들.length) return null;   /* 못 쟀다 */
  return !말들.some((m) => 제목에들었나(제목, typeof m === 'string' ? m : m.말));
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const T = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  T('🔴 뜬 말을 꺼낸다',
    (뜬말들({ rows: [{ key: 'a b', impressions: 3, clicks: 0, position: 44 }] }) || []).length === 1);
  T('⛔ 주소 줄은 말이 아니다 — 걸러낸다',
    (뜬말들({ rows: [{ key: 'https://x/y', impressions: 1 }] }) || []).length === 0);
  T('⛔ 자료가 없으면 null — 빈 배열이 아니다',
    뜬말들(null) === null && 뜬말들({}) === null);

  T('🔴 30위 밖을 집는다',
    (뒤처진말들([{ 말: 'a', 노출: 1, 자리: 66 }, { 말: 'b', 노출: 1, 자리: 4 }]) || []).length === 1);
  T('노출 많은 차례로 준다',
    뒤처진말들([{ 말: 'a', 노출: 1, 자리: 66 }, { 말: 'b', 노출: 9, 자리: 70 }])[0].말 === 'b');
  T('⛔ 자리를 못 잰 줄은 안 집는다',
    (뒤처진말들([{ 말: 'a', 노출: 1, 자리: null }]) || []).length === 0);
  T('⛔ 배열이 아니면 null', 뒤처진말들(null) === null);

  T('🔴 제목에 든 것을 찾는다',
    제목에들었나('The biggest Korean companies by market cap', 'biggest korean companies'));
  T('띄어쓰기·대소문자는 눈감는다',
    제목에들었나('Biggest   Korean  Companies', 'biggest korean companies'));
  T('⛔ 없으면 거짓',
    !제목에들었나("Korea's 10 largest listed companies", 'biggest korean companies'));
  T('⛔ 빈 것에도 안 터진다',
    !제목에들었나('', 'a') && !제목에들었나(null, null));

  T('🔴 하나도 안 들었으면 딴 말이다',
    딴말쓰나('largest listed companies', ['biggest korean companies']) === true);
  T('하나라도 들었으면 아니다',
    딴말쓰나('biggest korean companies by cap', ['biggest korean companies']) === false);
  T('⛔ 잴 말이 없으면 null — 거짓이 아니다',
    딴말쓰나('아무 말', []) === null && 딴말쓰나('아무 말', null) === null);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 제목이 치는 말인가 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--selftest') || 인자.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const i = 인자.indexOf('--사이트');
  const 고른것 = i >= 0 ? [인자[i + 1]] : ['kcw', 'klifemap', '100y', 'seoulmarkets'];

  let 다뤄야할것 = 0;
  for (const 딱지 of 고른것) {
    const 것들 = fs.readdirSync(path.join(뿌리, 'src/data'))
      .filter((n) => n.startsWith(`gsc-${딱지}-2`) && n.endsWith('.json')).sort();
    const 마지막 = 것들[것들.length - 1];
    if (!마지막) { console.log(`\n⚠ ${딱지} — GSC 자료가 없다. 못 쟀다`); continue; }
    const 묶음 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data', 마지막), 'utf8'));
    const 말들 = 뜬말들(묶음);
    if (말들 === null) { console.log(`\n⚠ ${딱지} — 자료를 못 읽었다`); continue; }
    const 뒤 = 뒤처진말들(말들);
    console.log(`\n■ ${딱지} — 뜬 말 ${말들.length}가지 · 그중 ${뒤처진선}위 밖 **${뒤.length}가지**`);
    if (!말들.length) {
      console.log('   🔴 뜬 말이 하나도 없다 — 구글이 이 사이트를 어느 물음에도 안 내놓는다');
      다뤄야할것 += 1; continue;
    }
    for (const x of 뒤.slice(0, 8)) {
      console.log(`   노출 ${String(x.노출).padStart(3)} · 자리 ${String(Math.round(x.자리)).padStart(3)}위   ${x.말}`);
    }
    다뤄야할것 += 뒤.length;
  }
  console.log(`\n■ 질 싸움을 하고 있는 말 합 **${다뤄야할것}가지**`);
  console.log('   ⭐ 고치는 길 — 그 말을 자동완성에 넣어 «사람이 치는 꼴»을 보고,');
  console.log('      그 꼴을 지면 제목·H1·첫 문단에 «글자 그대로» 넣는다.');
  console.log('        node scripts/재본다-그말을-몇명이-찾나.mjs "<그 말>"');
  console.log('   ⛔ 슬러그(주소)는 바꾸지 않는다 — 쌓인 색인이 처음으로 돌아간다.');
}
