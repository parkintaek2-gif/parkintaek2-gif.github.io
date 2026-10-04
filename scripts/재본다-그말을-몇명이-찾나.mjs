#!/usr/bin/env node
/**
 * 재본다-그말을-몇명이-찾나.mjs — **지면을 만들기 «전»에 그 말을 찾는 사람이 있는지 잰다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 사장님: 「그렇게 검색색인, seo, geo, 방문객 증대 올인을 한달넘게 말했는데
 *          했다며? 대체 뭘 했다는 거지? 신뢰가 안간다」
 *
 * 재 보니 ─ 네 사이트 지면 10,843장 · 28일 구글 클릭 **10회**.
 * 까닭은 색인이 아니었다. 색인도 되고 자리도 있다. **아무도 그 말을 안 찾는다.**
 *
 * ```
 * 100yearmap   「결혼 나이 평균」   자리 83위     ← 찾는 사람은 있는데 우리가 뒤에 있다
 * seoulmarkets 「biggest korean companies」 66위  ← 같다. 같은 뜻 79가지 전부 66~80위
 * klifemap     뜬 검색어 0가지                    ← 아예 안 뜬다
 * 1쪽(10위 안)에 있는 520장                      ← 아무도 «안 찾는» 긴 꼬리다
 * ```
 *
 * ⛔ 한 달 동안 「색인됐나」만 재고 **「몇 명이 찾나」를 한 번도 안 쟀다.**
 *   그래서 지면을 늘릴수록 수가 안 움직였다. 자가 없으면 같은 일이 또 난다.
 *
 * 무엇으로 재나 — **구글 자동완성**(무료 · 열쇠 없음).
 *   구글은 자동완성을 **찾는 사람이 많은 차례로** 돌려준다. 절대 수는 모르지만
 *   「이 말을 치는 사람이 있나 · 사람들이 실제로 어떻게 치나」는 알 수 있다.
 *
 * ⛔ 이 자는 **검색량을 숫자로 말하지 않는다.** 구글이 그 수를 공짜로 주지 않는다.
 *   「자동완성에 나온다 = 찾는 사람이 있다」까지가 우리가 아는 전부다.
 *   ⭐ 「재 보고 안 되면 안 된다고 적는 것도 결과다.」
 *
 * 쓰는 법
 *   node scripts/재본다-그말을-몇명이-찾나.mjs "biggest korean companies"
 *   node scripts/재본다-그말을-몇명이-찾나.mjs --씨앗 "korean companies" --말 en
 *   node scripts/재본다-그말을-몇명이-찾나.mjs --우리말들          GSC 에 뜬 말을 다 재 본다
 *   node scripts/재본다-그말을-몇명이-찾나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 사이쉼ms = 350;        /* 구글에 몰아치지 않는다 */
export const 참는횟수 = 2;

/** 자동완성 주소 — 말(hl)과 나라(gl)를 갈라 준다 */
export function 물을주소(말, 언어 = 'en', 나라 = 'us') {
  const q = encodeURIComponent(String(말 ?? '').trim());
  return `https://suggestqueries.google.com/complete/search?client=firefox&hl=${언어}&gl=${나라}&q=${q}`;
}

/** 자동완성 답을 가른다. ⛔ 못 읽으면 null — 빈 배열로 채우지 않는다 */
export function 답가르기(글) {
  if (typeof 글 !== 'string' || !글.trim()) return null;
  try {
    const j = JSON.parse(글);
    if (!Array.isArray(j) || !Array.isArray(j[1])) return null;
    return j[1].map((x) => String(x));
  } catch { return null; }
}

/** 씨앗 말에 글자를 붙여 더 넓게 긁는다 — 구글은 앞글자로 가지를 친다 */
export function 가지씨앗(씨앗) {
  const s = String(씨앗 ?? '').trim();
  if (!s) return [];
  const 붙일것 = ['', ' a', ' b', ' c', ' h', ' i', ' l', ' m', ' s', ' t', ' w'];
  return 붙일것.map((x) => s + x);
}

function 한번묻기(주소, 남은 = 참는횟수) {
  try {
    return execFileSync('curl', ['-sS', '--max-time', '12', '-A',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 주소], { encoding: 'utf8' });
  } catch (e) {
    if (남은 > 0) return 한번묻기(주소, 남은 - 1);
    return null;
  }
}

export async function 찾는말들(씨앗, 언어 = 'en', 나라 = 'us') {
  const 모음 = new Map();      /* 말 → 가장 앞선 자리(차례가 곧 인기 차례다) */
  const 못잰것 = [];
  for (const s of 가지씨앗(씨앗)) {
    const 글 = 한번묻기(물을주소(s, 언어, 나라));
    const 것 = 답가르기(글);
    if (것 === null) { 못잰것.push(s); continue; }
    것.forEach((말, i) => {
      const 이미 = 모음.get(말);
      if (이미 === undefined || i < 이미) 모음.set(말, i);
    });
    await new Promise((r) => setTimeout(r, 사이쉼ms));
  }
  return {
    씨앗, 언어, 나라,
    /* ⛔ 못 잰 것을 0 으로 채우지 않는다 */
    찾는사람있나: 모음.size > 0 ? true : (못잰것.length ? null : false),
    말들: [...모음.entries()].sort((a, b) => a[1] - b[1]).map(([말, 자리]) => ({ 말, 차례: 자리 })),
    못잰씨앗: 못잰것.length ? 못잰것 : null,
  };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const T = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  T('주소에 말이 들어간다', 물을주소('korean companies').includes('korean%20companies'));
  T('언어·나라를 바꾼다', 물을주소('사주', 'ko', 'kr').includes('hl=ko&gl=kr'));
  T('⛔ 빈 말에도 안 터진다', typeof 물을주소('') === 'string');

  T('🔴 답을 가른다', (답가르기('["a",["a b","a c"]]') || []).length === 2);
  T('⛔ 못 읽으면 null — 빈 배열이 아니다', 답가르기('말이 아니다') === null);
  T('⛔ 빈 글도 null', 답가르기('') === null && 답가르기(null) === null);
  T('⛔ 꼴이 달라도 null', 답가르기('[1,2,3]') === null || Array.isArray(답가르기('["a",["b"]]')));

  T('씨앗에 가지를 친다', 가지씨앗('abc').length === 11);
  T('씨앗이 그대로도 들어간다', 가지씨앗('abc')[0] === 'abc');
  T('⛔ 빈 씨앗은 가지가 없다', 가지씨앗('').length === 0 && 가지씨앗(null).length === 0);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 그 말을 몇 명이 찾나 — 자가시험');
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
  const 값 = (이름, 기본) => {
    const i = 인자.indexOf(이름);
    return i >= 0 && 인자[i + 1] ? 인자[i + 1] : 기본;
  };
  const 씨앗 = 값('--씨앗', 인자.filter((a) => !a.startsWith('--'))[0]);
  if (!씨앗) { console.log('⛔ 씨앗 말을 주십시오'); process.exit(1); }
  const 언어 = 값('--말', /[가-힣]/.test(씨앗) ? 'ko' : 'en');
  const 나라 = 값('--나라', 언어 === 'ko' ? 'kr' : 'us');

  const 잰것 = await 찾는말들(씨앗, 언어, 나라);
  console.log(`\n■ 「${씨앗}」 — ${언어}/${나라}`);
  if (잰것.찾는사람있나 === null) {
    console.log('   ⚠ 못 쟀다 — 구글이 답을 안 줬다. 0 이 아니라 «모른다»다');
  } else if (잰것.찾는사람있나 === false) {
    console.log('   🔴 자동완성에 하나도 안 나온다 — 이 말을 치는 사람이 거의 없다');
    console.log('   ⛔ 이 말로 지면을 만들지 않는다. 1쪽에 올려도 0명이다');
  } else {
    console.log(`   ✅ 사람들이 실제로 치는 말 ${잰것.말들.length}가지 (앞선 차례가 더 많이 찾는다)`);
    for (const x of 잰것.말들.slice(0, 20)) console.log(`     ${String(x.차례 + 1).padStart(2)}. ${x.말}`);
  }
  if (잰것.못잰씨앗) console.log(`   ⚠ 못 받은 씨앗 ${잰것.못잰씨앗.length}개`);

  const 낼곳 = path.join(뿌리, 'src/data/찾는말.json');
  let 쌓인 = {};
  try { 쌓인 = JSON.parse(fs.readFileSync(낼곳, 'utf8')); } catch {}
  쌓인[씨앗] = 잰것;
  fs.writeFileSync(낼곳, JSON.stringify(쌓인, null, 2), 'utf8');
  console.log(`\n   → src/data/찾는말.json`);
}
