#!/usr/bin/env node
/**
 * measure-oil-negotiated-vs-competitive.mjs — **한국 석유시장의 「값」은 어느 값인가.**
 *
 *   node scripts/measure-oil-negotiated-vs-competitive.mjs            재서 src/data 에 낸다
 *   node scripts/measure-oil-negotiated-vs-competitive.mjs --자가시험   자가시험만
 *
 * ── ⭐ 왜 이 축인가 (2026-09-11 03:1x · 5번) ──────────────────────
 *
 * KRX 석유시장 자료는 유종마다 **가중평균가를 «둘» 준다.**
 *   `경쟁가중평균`  경쟁매매(호가창) 가중평균
 *   `협의가중평균`  협의매매(당사자끼리 값을 정하는 거래) 가중평균
 *
 * 수집기 머리글이 이미 그 뜻을 적어 두었다 — 「두 값의 차이가 곧 「누가 어떻게 샀나」다.
 * 합치지 않는다」. 그런데 **그 차이를 센 적이 없었다.** 폴더가 비어 있었으니까.
 *
 * ⛔ 이 자가 지키는 것
 *   · **경쟁값 0 을 「값이 0 원」으로 읽지 않는다.** 그날 경쟁매매가 «없었다»는 뜻이다.
 *     ⇒ 0 은 «없음»으로 세고, 몇 행이 그랬는지 화면에 낸다. 0 으로 평균을 내지 않는다
 *   · 두 값이 «다 있는 날»만 차이를 낸다. 한쪽만 있는 날의 차이를 지어내지 않는다
 *   · 유종을 섞지 않는다 — 경유·등유·휘발유는 다른 시장이다
 *   · ⛔ 평균이 아니라 중앙값. 유종마다 표본 수가 크게 다르다(등유는 둘 다 있는 날이 둘뿐이다)
 *   · 표본이 적은 유종은 «적다»고 함께 적는다. 수만 내면 그 수가 규범이 된다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 밑감방 = path.join(뿌리, 'archive/raw/commodities');
export const 낼곳 = path.join(뿌리, 'src/data/oil-negotiated-vs-competitive.json');

/** 이보다 적은 «둘 다 있는 날»로는 그 유종의 중앙값을 내지 않는다 */
export const 적어도날 = 5;

/**
 * 값이 «있나»를 가린다.
 * 🔴 이 자의 핵심이다 — 0 은 값이 아니라 «그날 그 매매가 없었다»는 뜻이다.
 *   0 을 수로 받아 평균에 넣으면 값이 반토막이 된다. 실제로 등유는 49일 가운데
 *   47일이 경쟁값 0 이다. 0 을 값으로 읽으면 「등유가 반값」이 된다.
 */
export function 값있나(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}

/** ⛔ 비면 null. 평균이 아니다 */
export function 가운뎃값(수들) {
  const v = (수들 ?? []).map(Number).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** 협의값이 경쟁값보다 몇 % 높은가. ⛔ 한쪽이라도 없으면 null */
export function 벌어짐(경쟁, 협의) {
  if (!값있나(경쟁) || !값있나(협의)) return null;
  const c = Number(경쟁); const d = Number(협의);
  return (d - c) / c;
}

export function 재기(날파일들) {
  const 유종별 = new Map();
  let 석유행 = 0; let 경쟁없는행 = 0; let 협의없는행 = 0; let 둘다행 = 0;
  const 날들 = new Set();
  for (const { 날, 줄들 } of 날파일들 ?? []) {
    const 석유 = (줄들 ?? []).filter((r) => r && r.시장 === '석유');
    if (석유.length) 날들.add(String(날));
    for (const r of 석유) {
      석유행 += 1;
      const 유종 = String(r.유종 ?? '').trim() || '(빈칸)';
      const 경 = 값있나(r.경쟁가중평균);
      const 협 = 값있나(r.협의가중평균);
      if (!경) 경쟁없는행 += 1;
      if (!협) 협의없는행 += 1;
      if (경 && 협) 둘다행 += 1;
      const o = 유종별.get(유종) ?? {
        유종, 행: 0, 경쟁없는행: 0, 협의없는행: 0, 둘다: 0, 벌어짐들: [], 거래량: 0,
      };
      o.행 += 1;
      if (!경) o.경쟁없는행 += 1;
      if (!협) o.협의없는행 += 1;
      const 벌 = 벌어짐(r.경쟁가중평균, r.협의가중평균);
      if (벌 != null) { o.둘다 += 1; o.벌어짐들.push(벌); }
      const 량 = Number(r.거래량);
      if (Number.isFinite(량)) o.거래량 += 량;
      유종별.set(유종, o);
    }
  }
  const 유종들 = [...유종별.values()].map((o) => ({
    ...o,
    /* ⛔ 표본이 적으면 중앙값을 내지 않는다. null 이 0 이 아니다 */
    넉넉: o.둘다 >= 적어도날,
    가운데벌어짐: o.둘다 >= 적어도날 ? 가운뎃값(o.벌어짐들) : null,
    /* 협의만으로 값이 매겨진 몫 — 이 유종의 「시세」가 무엇인가를 말하는 수다 */
    협의만몫: o.행 > 0 ? o.경쟁없는행 / o.행 : null,
  })).sort((a, b) => b.거래량 - a.거래량);
  return {
    날수: 날들.size,
    석유행,
    경쟁없는행,
    협의없는행,
    둘다행,
    경쟁없는몫: 석유행 > 0 ? 경쟁없는행 / 석유행 : null,
    유종들: 유종들.map(({ 벌어짐들, ...나머지 }) => 나머지),
  };
}

export function 자가시험() {
  const 줄 = (유종, 경쟁, 협의, 거래량 = 100) =>
    ({ 시장: '석유', 유종, 경쟁가중평균: 경쟁, 협의가중평균: 협의, 거래량 });
  const 목 = [
    ['🔴 0 은 값이 아니다 — 「그날 그 매매가 없었다」로 읽는다', () =>
      값있나(0) === false && 값있나(1768) === true],
    ['⛔ 음수·빈 값도 없음으로 본다', () =>
      값있나(-5) === false && 값있나('') === false && 값있나(null) === false && 값있나('없음') === false],
    ['벌어짐은 협의가 경쟁보다 몇 % 높은가다', () => {
      const v = 벌어짐(1000, 1010);
      return Math.abs(v - 0.01) < 1e-12;
    }],
    ['🔴 경쟁값이 0 이면 벌어짐을 내지 않는다 — 0 으로 나누지도, 지어내지도 않는다', () =>
      벌어짐(0, 1381.73) === null],
    ['⛔ 협의값이 없으면 벌어짐 null', () => 벌어짐(1768, 0) === null],
    ['협의가 낮으면 음수로 낸다 — 이름 때문에 뒤집지 않는다', () => 벌어짐(1000, 990) < 0],
    ['가운뎃값은 평균이 아니다', () => 가운뎃값([1, 2, 100]) === 2],
    ['⛔ 비면 null', () => 가운뎃값([]) === null && 가운뎃값(null) === null],
    ['🔴 경쟁값 없는 행을 «세어서» 낸다 — 조용히 빼지 않는다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('등유', 0, 1381.73), 줄('경유', 1768, 1774.73)] }]);
      return r.석유행 === 2 && r.경쟁없는행 === 1 && r.둘다행 === 1;
    }],
    ['🔴 표본이 다섯보다 적으면 그 유종 중앙값을 내지 않는다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('등유', 1000, 1010)] }]);
      const 등 = r.유종들.find((x) => x.유종 === '등유');
      return 등.넉넉 === false && 등.가운데벌어짐 === null && 등.둘다 === 1;
    }],
    ['표본이 다섯이면 낸다', () => {
      const 날파 = ['a', 'b', 'c', 'd', 'e'].map((d) => ({ 날: d, 줄들: [줄('경유', 1000, 1010)] }));
      const r = 재기(날파);
      const 경 = r.유종들.find((x) => x.유종 === '경유');
      return 경.넉넉 === true && Math.abs(경.가운데벌어짐 - 0.01) < 1e-12;
    }],
    ['협의만몫은 그 유종의 「시세」가 무엇인가를 말한다', () => {
      const 날파 = ['a', 'b', 'c', 'd'].map((d, i) =>
        ({ 날: d, 줄들: [줄('등유', i === 0 ? 1000 : 0, 1010)] }));
      const r = 재기(날파);
      const 등 = r.유종들.find((x) => x.유종 === '등유');
      return Math.abs(등.협의만몫 - 0.75) < 1e-12;
    }],
    ['⛔ 유종을 섞지 않는다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('경유', 1000, 1010), 줄('휘발유', 2000, 2020)] }]);
      return r.유종들.length === 2;
    }],
    ['⛔ 석유가 아닌 줄은 안 센다', () => {
      const r = 재기([{ 날: 'a', 줄들: [{ 시장: '금', 이름: '금 99.99_1kg', 종가: 191000 }, 줄('경유', 1000, 1010)] }]);
      return r.석유행 === 1;
    }],
    ['⛔ 유종이 비면 「(빈칸)」으로 세고 다른 이름으로 옮기지 않는다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('', 1000, 1010)] }]);
      return r.유종들[0].유종 === '(빈칸)';
    }],
    ['⛔ 빈 것도 견딘다', () => {
      const r = 재기(null);
      return r.석유행 === 0 && r.경쟁없는몫 === null && r.유종들.length === 0;
    }],
    ['거래량이 많은 유종을 앞에 둔다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('등유', 1000, 1010, 5), 줄('휘발유', 2000, 2020, 900)] }]);
      return r.유종들[0].유종 === '휘발유';
    }],
    ['⛔ 벌어짐 «목록»은 내보내지 않는다 — 지면이 손으로 다시 세지 않게 값만 낸다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('경유', 1000, 1010)] }]);
      return !('벌어짐들' in r.유종들[0]);
    }],
  ];
  let 통 = 0; const 실 = [];
  for (const [이름, 재본다] of 목) {
    let ok = false;
    try { ok = !!재본다(); } catch { ok = false; }
    if (ok) 통 += 1; else 실.push(이름);
  }
  console.log(`석유 두 값 검사 — 자가시험 ${통}/${목.length}`);
  실.forEach((x) => console.log(`   X ${x}`));
  return 실.length;
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나) {
  const 흠 = 자가시험();
  if (process.argv.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('🔴 자가시험이 깨졌다 — 값을 내지 않는다'); process.exit(1); }

  if (!fs.existsSync(밑감방)) {
    console.log(`⬜ 못 쟀다 — 밑감방이 없다: ${path.relative(뿌리, 밑감방)}`);
    process.exit(0);
  }
  const 파일들 = fs.readdirSync(밑감방).filter((f) => /^\d{8}\.ndjson$/.test(f)).sort();
  const 날파일들 = 파일들.map((f) => ({
    날: f.slice(0, 8),
    줄들: fs.readFileSync(path.join(밑감방, f), 'utf8').split(/\r?\n/)
      .filter((s) => s.trim()).map((s) => { try { return JSON.parse(s); } catch { return null; } })
      .filter(Boolean),
  }));
  const r = 재기(날파일들);
  const 퍼 = (v, 자리 = 1) => (v == null ? '—' : `${(v * 100).toFixed(자리)}%`);

  console.log('');
  console.log(`■ 거래일 ${r.날수}일 · 석유 행 ${r.석유행}`);
  console.log(`■ 경쟁매매 값이 «없는» 행 ${r.경쟁없는행} = ${퍼(r.경쟁없는몫)}`
    + ` · 협의매매 값이 없는 행 ${r.협의없는행} · 둘 다 있는 행 ${r.둘다행}`);
  console.log('   🔴 협의값은 한 행도 빠지지 않는데 경쟁값은 자주 없다 — 즉 그날 「시세」는 협의값이다');
  console.log('');
  console.log('■ 유종별');
  for (const c of r.유종들) {
    console.log(`   ${String(c.유종).padEnd(5)} 행 ${String(c.행).padStart(3)}`
      + ` · 경쟁값 없는 날 ${String(c.경쟁없는행).padStart(2)} (${퍼(c.협의만몫, 0)})`
      + ` · 둘 다 있는 날 ${String(c.둘다).padStart(2)}`
      + ` · 협의가 경쟁보다 ${c.넉넉 ? 퍼(c.가운데벌어짐, 3) : '— (표본 적다)'}`
      + ` · 거래량합 ${Number(c.거래량).toLocaleString('en-US')}`);
  }
  console.log('   ⚠ 표본이 적은 유종은 중앙값을 내지 않았다. 수를 내면 그 수가 규범이 된다');

  const 낼것 = {
    잰때: new Date().toISOString(),
    밑감: 'archive/raw/commodities/<날짜>.ndjson (시장=석유 만)',
    무엇을세나: 'KRX 석유시장이 유종마다 내는 두 가중평균가(경쟁매매·협의매매) 가운데 어느 것이 실제로 존재하며, 둘이 다 있는 날 협의값이 경쟁값보다 몇 % 높은가.',
    영으로안읽는다: '경쟁가중평균 0 은 값이 0 원이라는 뜻이 아니라 그날 경쟁매매가 없었다는 뜻이다. 0 을 평균에 넣지 않았다.',
    ...r,
  };
  fs.writeFileSync(낼곳, `${JSON.stringify(낼것, null, 2)}\n`, 'utf8');
  console.log(`\n  ✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
}
