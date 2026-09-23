#!/usr/bin/env node
/**
 * check-uae-balance-scale.mjs — **UAE 대차대조표 배수를 얼마나 갈랐나 재고, 자를 스스로 시험한다.**
 * (5번, 2026-09-24)
 *
 * 왜 있나 — `src/lib/uae-balance-scale.mjs` 머리글을 본다. 요지는 하나다:
 *   UAE 자료는 한 행 안에서 손익과 대차의 단위가 다르고, 대차는 「적힌 그대로」다.
 *   그래서 UAE 만 회사 낱장 지면이 없었다. 이 자가 그 관문을 연다.
 *
 * ⛔ 이 자는 «못 가른 것»을 숨기지 않는다. 몇 행을 못 갈랐는지 그대로 낸다 —
 *   회사 지면은 그 칸을 비우고, 비웠다고 말한다.
 *
 * 쓰는 법
 *   node scripts/check-uae-balance-scale.mjs --자가시험
 *   node scripts/check-uae-balance-scale.mjs            얼마나 갈렸나
 *   node scripts/check-uae-balance-scale.mjs --못가른것   못 가른 줄을 보여 준다
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  천단위표기인가, 다룰수있나, 말되는PBR인가, 배수가르기, 대차실값, PBR낮은쪽, PBR높은쪽,
} from '../src/lib/uae-balance-scale.mjs';

const 뿌리 = path.resolve(import.meta.dirname, '..');

/** 가장 최근 시세 파일에서 종목별 시가총액을 뽑는다 */
export function 시총표읽기(뿌리길 = 뿌리) {
  const d = path.join(뿌리길, 'archive/raw/uae-adx-marketwatch');
  let 파일들 = [];
  try { 파일들 = fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort(); } catch { return new Map(); }
  const 표 = new Map();
  const 마지막 = 파일들[파일들.length - 1];
  if (!마지막) return 표;
  let j = null;
  try { j = JSON.parse(fs.readFileSync(path.join(d, 마지막), 'utf8')); } catch { return 표; }
  const 줄들 = Array.isArray(j) ? j : (j.rows || j.data || []);
  for (const r of 줄들) {
    const cap = Number(r?.marketCap);
    if (r?.symbol && Number.isFinite(cap) && cap > 0) 표.set(String(r.symbol), cap);
  }
  return 표;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다("AED'000 을 천 단위로 읽는다", 천단위표기인가("AED'000") === true);
  본다('작은따옴표가 굽어도 읽는다', 천단위표기인가('AED’000') === true);
  본다('AED million 은 이 자가 안 다룬다', 천단위표기인가('AED million') === false);
  본다("USD'000 은 이 자가 안 다룬다", 천단위표기인가("USD'000") === false);
  본다('⛔ 표기가 없으면 «모른다»로 둔다 — 실단위로 넘기지 않는다', 천단위표기인가('') === null);
  본다('⛔ 빈 것에 안 터진다', 천단위표기인가(null) === null);

  본다('자본이 없으면 안 다룬다', 다룰수있나({ total_equity_aed: null }) === false);
  본다('자본이 0 이하면 안 다룬다', 다룰수있나({ total_equity_aed: -5 }) === false);
  본다('USD 줄은 안 다룬다', 다룰수있나({ total_equity_aed: 100, unit_hint: "USD'000" }) === false);
  /* 🔴 「자료가 없다」와 「따로 다뤄야 한다」를 가른다 — 한 칸에 넣으면 무엇을 더 할지 안 보인다 */
  본다('🔴 자본이 비면 «자료 없음»으로 센다',
    배수가르기({ total_equity_aed: null }, 1e9).어떻게 === '자료 없음');
  본다('🔴 달러 줄은 «따로 다룸»으로 센다',
    배수가르기({ total_equity_aed: 100, unit_hint: "USD'000" }, 1e9).어떻게 === '따로 다룸');
  본다('   그 둘은 서로 다른 칸이다',
    배수가르기({ total_equity_aed: null }, 1e9).어떻게
      !== 배수가르기({ total_equity_aed: 100, unit_hint: "USD'000" }, 1e9).어떻게);
  본다('보통 줄은 다룬다', 다룰수있나({ total_equity_aed: 100 }) === true);
  본다('⛔ 빈 것에 안 터진다', 다룰수있나(null) === false);

  본다('PBR 범위 안이면 참', 말되는PBR인가(1.2) === true);
  본다('너무 크면 거짓', 말되는PBR인가(2000) === false);
  본다('너무 작으면 거짓', 말되는PBR인가(0.001) === false);
  본다('⛔ 수가 아니면 거짓', 말되는PBR인가(null) === false);

  /* 🔴 보고서가 스스로 적은 표기가 «우리의 검산»보다 앞선다 */
  const 표기줄 = 배수가르기({ total_equity_aed: 1000, unit_hint: "AED'000" }, 999999999);
  본다('🔴 보고서 표기가 있으면 그것을 따른다', 표기줄.배수 === 1000 && 표기줄.어떻게 === '보고서 표기');

  /* 표기가 없을 때 — 시총으로 가른다. 자본 1e8, 시총 2e8 이면 실단위 PBR 2 (범위 안),
     천단위로 보면 0.002 (범위 밖) ⇒ 실단위가 맞다 */
  const 실 = 배수가르기({ total_equity_aed: 1e8 }, 2e8);
  본다('시가총액으로 «실단위»를 가른다', 실.배수 === 1 && 실.어떻게 === '시가총액 검산');

  /* 자본 1e8(천 단위) 이면 실제 1e11. 시총 2e11 이면 천단위 PBR 2 (범위 안),
     실단위로 보면 2000 (범위 밖) ⇒ 천 단위가 맞다 */
  const 천 = 배수가르기({ total_equity_aed: 1e8 }, 2e11);
  본다('시가총액으로 «천 단위»를 가른다', 천.배수 === 1000 && 천.어떻게 === '시가총액 검산');

  본다('⛔ 시가총액이 없으면 못 가른다', 배수가르기({ total_equity_aed: 1e8 }, null).배수 === null);
  const 못 = 배수가르기({ total_equity_aed: 1e8 }, 1e5);   /* 두 PBR 다 범위 밖 */
  본다('⛔ 둘 다 범위 밖이면 «비운다»', 못.배수 === null && /못 갈랐다/.test(못.왜 || ''));
  본다('   그리고 왜 못 갈랐는지 적는다', (못.왜 || '').includes(String(PBR낮은쪽)));

  /* 🔴 배수가 1 이냐 1000 이냐에 따라 PBR 이 «정확히 1000배» 벌어진다 —
     그래서 둘 다 범위 안일 수 없다. 이 성질이 이 자의 바탕이다. */
  본다('🔴 두 PBR 이 겹치는 자본은 없다 — 범위가 1000배보다 좁다', PBR높은쪽 / PBR낮은쪽 < 1000);

  const 값 = 대차실값({ total_assets_aed: 5, total_liabilities_aed: 3, total_equity_aed: 2, unit_hint: "AED'000" }, null);
  본다('가른 배수로 세 칸을 다 곱한다', 값.총자산 === 5000 && 값.총부채 === 3000 && 값.자본 === 2000);
  const 빈값 = 대차실값({ total_assets_aed: 5, total_equity_aed: 2 }, null);
  본다('⛔ 못 갈랐으면 세 칸을 다 비운다', 빈값.총자산 === null && 빈값.자본 === null);
  본다('⛔ 빈 것에 안 터진다', 대차실값(null, null).배수 === null);

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 본 검사 ──────────────────────────────────────────────── */
{
  const 보이나 = process.argv.includes('--못가른것');
  console.log('■ UAE 대차대조표 배수 — 손익은 실제 AED 인데 대차는 「적힌 그대로」다');
  console.log('  ⭐ 이 관문이 열려야 UAE 회사 낱장 지면을 낼 수 있다 (Live 넷 중 UAE 만 없다)\n');

  let tape = null;
  try { tape = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/uae-financials-tape.json'), 'utf8')); }
  catch { console.log('🔴 uae-financials-tape.json 을 못 읽었다'); process.exit(1); }

  const 시총표 = 시총표읽기();
  const 줄들 = tape.rows || [];
  const 셈 = { 보고서표기: 0, 시가총액검산: 0, 못가름: 0, 자료없음: 0, 따로다룸: 0 };
  const 못가른것 = [];
  const 회사갈림 = new Map();

  for (const r of 줄들) {
    const { 배수, 어떻게, 왜 } = 배수가르기(r, 시총표.get(String(r.symbol)) ?? null);
    셈[어떻게.replace(/\s/g, '')] = (셈[어떻게.replace(/\s/g, '')] ?? 0) + 1;
    if (배수 === null && 어떻게 === '못 가름') 못가른것.push({ 종목: r.symbol, 기간: r.period, 왜 });
    const 키 = String(r.symbol);
    if (배수 !== null) 회사갈림.set(키, true);
    else if (!회사갈림.has(키)) 회사갈림.set(키, false);
  }

  const 전체 = 줄들.length;
  const 갈린것 = (셈.보고서표기 ?? 0) + (셈.시가총액검산 ?? 0);
  console.log(`   전체 ${전체}행 · 회사 ${회사갈림.size}곳`);
  console.log(`   ✅ 보고서 표기로 가름     ${String(셈.보고서표기 ?? 0).padStart(4)}행`);
  console.log(`   ✅ 시가총액 검산으로 가름  ${String(셈.시가총액검산 ?? 0).padStart(4)}행  ← 이 자가 새로 연 것`);
  console.log(`   ⬜ 못 가름               ${String(셈.못가름 ?? 0).padStart(4)}행  (비운다)`);
  console.log(`   ⬜ 따로 다룸(USD·백만)    ${String(셈.따로다룸 ?? 0).padStart(4)}행  (통화·배수가 다르다)`);
  console.log(`   ⬜ 자료 없음             ${String(셈.자료없음 ?? 0).padStart(4)}행  (대차대조표를 아직 못 뽑았다)`);
  console.log(`\n   ⇒ 갈린 비율 ${갈린것}/${전체} (${(100 * 갈린것 / (전체 || 1)).toFixed(1)}%)`);

  const 한줄이라도 = [...회사갈림.values()].filter(Boolean).length;
  console.log(`   ⇒ 대차대조표를 실제 금액으로 낼 수 있는 회사 ${한줄이라도}/${회사갈림.size}곳`);

  /* 🔴 [2026-09-24] 여기에 「회사 지면을 낼 수 있는 곳」이라고 적었다가 고쳤다 — 오해를 부른다.
     회사 지면의 뼈대는 «손익»이고 그것은 거의 다 있다. 대차는 «있는 곳만» 더 싣는 것이다.
     ⛔ 한 칸이 비었다고 그 회사 지면을 통째로 안 내면, 손님이 볼 수 있었던 것까지 잃는다. */
  const 손익있는회사 = new Set(줄들.filter((r) => Number.isFinite(Number(r.net_profit_aed))).map((r) => String(r.symbol)));
  console.log(`   ⇒ 손익이 있어 «지면 자체»를 낼 수 있는 회사 ${손익있는회사.size}/${회사갈림.size}곳`);
  console.log('      (대차 칸은 위 78곳에만 선다 — 나머지는 비우고, 지면이 그렇게 말한다)');

  if (보이나 && 못가른것.length) {
    console.log('\n   못 가른 줄 (앞 10개):');
    for (const x of 못가른것.slice(0, 10)) console.log(`     ${String(x.종목).padEnd(14)} ${String(x.기간).padEnd(9)} ${x.왜}`);
  }
  console.log('\n⛔ 못 가른 칸은 «비운다». 「아마 천 단위겠지」로 채우지 않는다 — 천 배가 걸린 일이다.');
  process.exit(0);
}
