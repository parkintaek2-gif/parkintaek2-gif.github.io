#!/usr/bin/env node
/**
 * collect-100y-university-gap.mjs — **우리 대학 자료가 «못 보는» 곳은 몇 곳인가**
 *
 * ── 왜 만드나 (2026-09-05, 5번 제안) ──────────────────────────────────
 * 5번이 KCW `/cannot-see`(위키데이터 한국가수 커버리지 공백)을 내고 「6번·3번께도
 * 같은 물음이 있다」고 했다 — 「우리 자가 못 보는 것이 무엇인가」를 지면으로 내면
 * 그 자체가 강령(「못 잰 것은 못 쟀다고 적는다」)의 실물이 된다.
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────────
 * pages-university.json(377개 대학·전문대) 중 취업률 값이 없는 곳을 센 뒤,
 * 그 이유를 최대한 갈라 본다 — 짐작하지 않는다:
 *   ① 이름에 「제N캠퍼스」가 있다 → 분교. 취업률은 본교 밑에 잡히는 구조다
 *   ② closed-universities.json(KASFO 폐교 목록, 8번이 잰 것)과 이름이 겹친다 → 폐교 확인됨
 *   ③ 둘 다 아니다 → «원인 미확인». 여기서 짐작으로 채우지 않는다
 *
 * 쓰는 법  node scripts/collect-100y-university-gap.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function 이름정리(s) {
  return String(s ?? '').replace(/\(.*?\)/g, '').trim();
}

export function 가른다(대학목록, 폐교목록) {
  const 폐교이름 = new Set(폐교목록.map((r) => r.이름));
  const 없음 = 대학목록.filter((r) => !r.취업률 || r.취업률.값 == null);
  const 분교 = [], 폐교확인 = [], 미확인 = [];
  for (const r of 없음) {
    const 이름 = r.표시명 ?? r.title ?? '';
    if (/캠퍼스/.test(이름)) { 분교.push(이름); continue; }
    if (폐교이름.has(이름정리(이름))) { 폐교확인.push(이름); continue; }
    미확인.push(이름);
  }
  return { 전체: 대학목록.length, 없음수: 없음.length, 분교, 폐교확인, 미확인 };
}

const 내가직접불렸나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  const 견본대학 = [
    { 표시명: 'A대학교', 취업률: { 값: 60 } },
    { 표시명: 'B대학교 제2캠퍼스', 취업률: null },
    { 표시명: 'C대학', 취업률: null },
    { 표시명: 'D대학', 취업률: { 값: 50 } },
  ];
  const 견본폐교 = [{ 이름: 'C대학' }];
  const r = 가른다(견본대학, 견본폐교);

  검('전체를 센다', r.전체 === 4);
  검('없음을 센다', r.없음수 === 2);
  검('캠퍼스는 분교로 간다', r.분교.length === 1 && r.분교[0] === 'B대학교 제2캠퍼스');
  검('폐교 목록과 겹치면 폐교확인', r.폐교확인.length === 1 && r.폐교확인[0] === 'C대학');
  검('짐작으로 미확인을 채우지 않는다', r.미확인.length === 0);
  검('이름정리 — 괄호를 뗀다', 이름정리('가야대학교(고령)') === '가야대학교');

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ collect-100y-university-gap 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가직접불렸나 && !process.argv.includes('--selftest')) {
  const 대학목록 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/100yearmap/pages-university.json'), 'utf8'));
  const 대학배열 = Array.isArray(대학목록) ? 대학목록 : Object.values(대학목록)[0];
  const 폐교자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/100yearmap/closed-universities.json'), 'utf8'));

  const r = 가른다(대학배열, 폐교자료.자료);
  const 낸다 = {
    무엇: '우리 대학 자료가 취업률을 못 보여주는 곳 — 그 이유를 가른다',
    만든날: 오늘(),
    전체: r.전체,
    없음수: r.없음수,
    분교: { 수: r.분교.length, 목록: r.분교 },
    폐교확인: { 수: r.폐교확인.length, 목록: r.폐교확인, 출처: 'KASFO 폐교대학 목록(closed-universities.json)' },
    미확인: { 수: r.미확인.length, 목록: r.미확인 },
    출처: {
      대학자료: '한국대학교육협의회 대학정보공시(대학알리미)',
      폐교자료: 'KASFO(한국사학진흥재단)',
    },
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/university-gap.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   전체 ${r.전체} · 없음 ${r.없음수} · 분교 ${r.분교.length} · 폐교확인 ${r.폐교확인.length} · 미확인 ${r.미확인.length}`);
}
