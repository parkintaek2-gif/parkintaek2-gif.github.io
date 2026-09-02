#!/usr/bin/env node
/**
 * check-6번-콘텐트-due.mjs — 「특정 시점이 되면 바로 만든다」를 검사로 굳힌다.
 *
 * ── 왜 (2026-09-02 사장님 지시) ──────────────────────────────
 * 「네가 만든 콘텐트 리스트를 DB화 해서 어떤 특정 시점이 되면 바로 특정데이터를
 *  가공해서 콘텐트로 만들어서 계속 우리의 존재를 알려. 그래야 계약도 돼」
 * `src/data/6번-콘텐트-플레이북.json`이 그 DB다. 이 자는 그 DB의 «건수 기반» 트리거를
 * archive/raw/dart-breaking 실측과 대조해 지금 만들 때가 됐는지 판정한다.
 * ⛔ 「알림만」이 아니라 «몇 곳 더 쌓였는지» 숫자로 못 박는다 — 짐작하지 않는다.
 *
 * 쓰는 법  node scripts/check-6번-콘텐트-due.mjs
 *          node scripts/check-6번-콘텐트-due.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const DIR = path.join(ROOT, 'archive/raw/dart-breaking');

/** 태그별로 이번 주(archive에 있는 파일 전부, 정정 제외) 원본 필자 수를 센다 */
export function 태그별건수(디렉 = DIR) {
  const 결과 = {};
  if (!fs.existsSync(디렉)) return { 못잼: true };
  const files = fs.readdirSync(디렉).filter((f) => /^\d{8}\.json$/.test(f));
  const seen = {};
  for (const f of files) {
    let j; try { j = JSON.parse(fs.readFileSync(path.join(디렉, f), 'utf8')); } catch { continue; }
    for (const x of (j.후보 || [])) {
      if (x.정정) continue;
      seen[x.태그] ??= new Set();
      if (seen[x.태그].has(x.corp_code)) continue;
      seen[x.태그].add(x.corp_code);
      결과[x.태그] = (결과[x.태그] || 0) + 1;
    }
  }
  return 결과;
}

/** 건수 기반 트리거 판정. 임계값은 플레이북 조건 문장에서 사람이 읽고 정한 값을 여기 고정한다(문장 파싱 안 함 — 짐작 금지) */
export const 임계값 = { buyback: 6, 'rights-issue': 15, 'convertible-bond': 3 };

export function 판정(건수) {
  const 결과 = [];
  for (const [태그, 기준] of Object.entries(임계값)) {
    const n = 건수[태그] || 0;
    결과.push({ 태그, 건수: n, 기준, 찼다: n >= 기준 });
  }
  return 결과;
}

function main() {
  if (process.argv.includes('--자가시험')) {
    let 통과 = 0, 실패 = 0;
    const 검 = (m, ok) => { if (ok) 통과++; else { 실패++; console.log('  ❌', m); } };
    검('기준 미달이면 안 찼다', 판정({ buyback: 5 })[0].찼다 === false);
    검('기준 도달이면 찼다', 판정({ buyback: 6 })[0].찼다 === true);
    검('기준 초과도 찼다', 판정({ buyback: 9 })[0].찼다 === true);
    검('없는 태그는 0건으로', 판정({})[0].건수 === 0);
    console.log(실패 === 0 ? `✅ 자가시험 — 통과 ${통과} · 실패 0` : `❌ 자가시험 — 통과 ${통과} · 실패 ${실패}`);
    process.exit(실패 === 0 ? 0 : 1);
  }

  const 건수 = 태그별건수();
  if (건수.못잼) { console.log('⬜ 못 쟀다 — archive/raw/dart-breaking 없음(서버 이동 등). 「0건」으로 안 읽는다.'); process.exit(0); }

  console.log('■ 6번 콘텐트 플레이북 — 건수 기반 트리거 판정\n');
  const 판정결과 = 판정(건수);
  let 찬것 = 0;
  for (const r of 판정결과) {
    const 상태 = r.찼다 ? '🔴 지금 만들 때' : '⏳ 기다리는 중';
    console.log(`  ${r.태그.padEnd(18)} ${String(r.건수).padStart(2)}곳 / 기준 ${r.기준}곳  ${상태}`);
    if (r.찼다) 찬것++;
  }
  console.log(`\n${찬것 ? `🔴 ${찬것}개 트리거가 찼다 — src/data/6번-콘텐트-플레이북.json의 해당 스크립트를 지금 돌린다.` : '✅ 아직 기준 미달 — 계속 쌓는다(자리지킴이가 매시 collect-dart-breaking으로 누적).'}`);
}

main();
