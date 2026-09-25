#!/usr/bin/env node
/**
 * check-invest-ai-claims.mjs — **우리가 «밖에 대고 낸 말»이 오늘도 사실인가**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 왜 있나 (2026-09-25 · 사장님)
 *   「**결국 케이라이프맵과 에스마켓츠 담당 세션이 거짓을 보고한거다.
 *     자체ai를 학습시키고 있는 양…**」
 *   「**투자ai는 다르다. 모두의 창업에 지원한 아이템인 것도 있고**」
 *
 * [무엇이 다른가]
 *   투자 AI 는 우리끼리 쓰는 도구가 아니다. **중소벤처기업부 공모에 낸 아이템**이다
 *   (`docs/지원-모두의창업-2차-투자AI.md`). 거기에 우리가 이렇게 적어 냈다 —
 *
 *   > 「결정론 두 층(②③)+감사원장 **구현 완료·자가시험 20/20 통과**」
 *   > 「**무인 뉴스판독 장치**(신호 저장소+일일 판독)와 첫 실제 신호(BOK 금리) 실증」
 *
 *   ⛔ 그런데 2026-09-25 에 재 보니 **판독층이 열흘째 멈춰 있었다**(마지막 20260915).
 *     감사 원장도 20260830 픽스처에 멈춰 있었다.
 *     심사가 오늘 확인하면 우리가 낸 말과 다른 것을 본다. 그것이 거짓이 된다.
 *
 * ⭐ 그래서 이 자는 «우리 살림»이 아니라 **«우리가 한 말»**을 잰다.
 *   밖에 낸 주장 한 줄마다 그것을 뒷받침하는 수를 오늘 다시 센다.
 *
 * ⛔ 「예전에 됐다」를 「지금 된다」로 세지 않는다.
 * ⛔ 못 재면 «못 쟀다»로 둔다. 초록으로 채우지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-invest-ai-claims.mjs
 *   node scripts/check-invest-ai-claims.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');
const 신호방 = path.join(뿌리, 'src', 'data', 'invest-ai');

/** 오늘(KST). ⛔ UTC 로 바꾸지 않는다 */
export function 오늘8자리(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function 며칠차이(앞, 뒤) {
  const 뜯 = (s) => {
    const t = String(s ?? '').replace(/-/g, '');
    return /^\d{8}$/.test(t) ? new Date(+t.slice(0, 4), +t.slice(4, 6) - 1, +t.slice(6)) : null;
  };
  const a = 뜯(앞); const b = 뜯(뒤);
  return (a && b) ? Math.round((b - a) / 86400000) : null;
}

/** 신호 파일을 다 읽어 갈래별 마지막 날을 낸다 */
export function 갈래별마지막(방 = 신호방) {
  const 마지막 = {};
  let 것들 = [];
  try { 것들 = fs.readdirSync(방).filter((n) => /^signals-\d{8}\.jsonl$/.test(n)).sort(); }
  catch { return 마지막; }
  for (const f of 것들) {
    const 날 = f.slice(8, 16);
    let 글 = '';
    try { 글 = fs.readFileSync(path.join(방, f), 'utf8'); } catch { continue; }
    for (const l of 글.split('\n')) {
      if (!l.trim()) continue;
      let o; try { o = JSON.parse(l); } catch { continue; }
      const k = String(o?.kind ?? '');
      if (!k) continue;
      if (!마지막[k] || 마지막[k] < 날) 마지막[k] = 날;
    }
  }
  return 마지막;
}

/** 감사 원장의 마지막 asOf */
export function 원장마지막(길 = path.join(신호방, 'paper-ledger.jsonl')) {
  let 글 = '';
  try { 글 = fs.readFileSync(길, 'utf8'); } catch { return null; }
  let 최신 = null;
  for (const l of 글.split('\n')) {
    if (!l.trim()) continue;
    let o; try { o = JSON.parse(l); } catch { continue; }
    const t = String(o?.asOf ?? '');
    if (/^\d{8}$/.test(t) && (최신 === null || t > 최신)) 최신 = t;
  }
  return 최신;
}

/** ②③ 자가시험을 실제로 돌려 통과 수를 센다 — 「예전에 됐다」로 세지 않는다 */
export function 자가시험돌리기() {
  try {
    const 글 = execFileSync('node', [path.join(뿌리, 'scripts', 'invest-ai', 'selftest.mjs')],
      { encoding: 'utf8', timeout: 120000 });
    const m = 글.match(/결과:\s*(\d+)\s*통과\s*\/\s*(\d+)\s*실패/);
    return m ? { 통과: +m[1], 실패: +m[2] } : { 통과: null, 실패: null };
  } catch { return { 통과: null, 실패: null }; }
}

/**
 * 🔴 리스크관리(③)가 정말 «독립»인가 — 지원서의 핵심 차별성이다.
 *   「②는 ③을 못 멈춘다」고 적어 냈다. 코드로 그러한지 본다:
 *   ③(risk-manager)이 ②(fund-manager)를 부르지 않아야 한다. 부르면 독립이 아니다.
 */
export function 리스크가독립인가() {
  try {
    const 글 = fs.readFileSync(path.join(뿌리, 'scripts', 'invest-ai', 'risk-manager.mjs'), 'utf8');
    return !/fund-manager/.test(글);
  } catch { return null; }
}

export function 잰다(오늘 = 오늘8자리()) {
  const 마지막 = 갈래별마지막();
  const 뉴스마지막 = 마지막['뉴스'] ?? null;
  const 원장 = 원장마지막();
  const { 통과, 실패 } = 자가시험돌리기();
  const 독립 = 리스크가독립인가();

  const 칸 = (이름, 됐나, 까닭) => ({ 이름, 됐나, 까닭 });
  return [
    칸('① 「자가시험 20/20 통과」 — 오늘도 통과하나',
      통과 !== null && 실패 === 0 && 통과 >= 20,
      통과 === null ? '⛔ 못 돌렸다' : `${통과} 통과 / ${실패} 실패`),
    칸('② 🔴 「무인 뉴스판독 장치」 — 오늘도 도나',
      뉴스마지막 !== null && 며칠차이(뉴스마지막, 오늘) <= 3,
      뉴스마지막 ? `마지막 뉴스 신호 ${뉴스마지막} (${며칠차이(뉴스마지막, 오늘)}일 전 · 사흘을 넘으면 빨강)`
        : '⛔ 뉴스 신호가 하나도 없다'),
    칸('③ 「감사 원장」 — 오늘 자료로 도나',
      원장 !== null && 며칠차이(원장, 오늘) <= 3,
      원장 ? `원장 마지막 ${원장} (${며칠차이(원장, 오늘)}일 전)` : '⛔ 원장이 비어 있다'),
    칸('④ 🔴 「리스크관리 독립」 — ③이 ②를 안 부르나',
      독립 === true,
      독립 === null ? '⛔ 못 읽었다' : 독립 ? 'risk-manager 가 fund-manager 를 안 부른다'
        : '⛔ ③ 이 ② 를 부른다 — 「독립」이 아니다'),
    칸('⑤ 마켓 자료 판독 — 오늘도 도나',
      마지막['실적'] ? 며칠차이(마지막['실적'], 오늘) <= 1 : false,
      마지막['실적'] ? `마지막 ${마지막['실적']} (${며칠차이(마지막['실적'], 오늘)}일 전)` : '⛔ 없다'),
    칸('⑥ 공시 판독 — 오늘도 도나',
      마지막['공시'] ? 며칠차이(마지막['공시'], 오늘) <= 3 : false,
      마지막['공시'] ? `마지막 ${마지막['공시']} (${며칠차이(마지막['공시'], 오늘)}일 전)` : '⛔ 없다'),
  ];
}

const 직접돌리나 = process.argv[1] && process.argv[1].endsWith('check-invest-ai-claims.mjs');

if (직접돌리나 && process.argv.includes('--자가시험')) {
  const 재기 = [];
  const 본다 = (이름, v) => 재기.push([이름, !!v]);

  본다('며칠차이 — 같은 날은 0', 며칠차이('20260925', '20260925') === 0);
  본다('며칠차이 — 이음표가 있어도 읽는다', 며칠차이('2026-09-15', '20260925') === 10);
  본다('⛔ 빈 것에 안 터진다', 며칠차이(null, '20260925') === null);
  본다('원장 마지막 — 없는 파일은 null 이다 (0 으로 세지 않는다)',
    원장마지막(path.join(뿌리, '없는원장-xyz.jsonl')) === null);
  본다('🔴 리스크관리 독립을 «코드로» 잰다 — 문서 말이 아니라', 리스크가독립인가() === true);
  /* ⛔ 이 자가 「통과」를 지어내면 그것이 다시 거짓 보고가 된다 */
  본다('🔴 자가시험은 «실제로 돌려» 센다', (() => {
    const 글 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
    return /execFileSync\('node'/.test(글);
  })());
  본다('갈래별 마지막을 낸다', typeof 갈래별마지막() === 'object');
  본다('🔴 칸마다 «왜»가 적힌다', 잰다().every((c) => c.까닭 && c.까닭.length > 3));

  const 떨 = 재기.filter(([, v]) => !v);
  for (const [이, v] of 재기) console.log(`${v ? '✅' : '🔴'} ${이}`);
  console.log(떨.length ? `\n🔴 ${떨.length}/${재기.length} 떨어졌다` : `\n✅ 자가시험 ${재기.length} 통과`);
  process.exit(떨.length ? 1 : 0);
}

if (직접돌리나) {
  console.log('■ 투자 AI — 우리가 «밖에 대고 낸 말»이 오늘도 사실인가');
  console.log('  근거: docs/지원-모두의창업-2차-투자AI.md (중기부 공고 제2026-511호)');
  console.log('');
  const 칸들 = 잰다();
  let 된것 = 0;
  for (const c of 칸들) {
    console.log(`   ${c.됐나 ? '✅' : '🔴'} ${c.이름}`);
    console.log(`        ${c.까닭}`);
    if (c.됐나) 된것 += 1;
  }
  console.log('');
  console.log(`${된것 === 칸들.length ? '✅' : '🔴'} ${된것}/${칸들.length}`);
  if (된것 !== 칸들.length) {
    console.log('   ⛔ 빨간 칸은 «우리가 낸 말과 지금이 다르다»는 뜻이다.');
    console.log('      심사가 오늘 확인하면 그 자리에서 다른 것을 본다. 보고에 「돌고 있다」고 적지 않는다.');
  }
  process.exit(된것 === 칸들.length ? 0 : 1);
}
