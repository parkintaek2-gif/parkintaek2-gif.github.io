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

/** 태그별로 archive 원본(정정 제외) 고유 필자 수를 센다.
 *  ⚠ 2026-09-02 교훈: 이 raw 수는 «다시 돌려 볼 값어치가 있다»는 신호일 뿐이다 — buyback만
 *  collect-dart-breaking.mjs가 금액(x.수)을 같이 받아 두고, rights-issue·convertible-bond는
 *  각자 스크립트가 API(piicDecsn·cvbdIsDecsn)를 따로 불러야 진짜 금액을 안다. raw 건수가 늘어도
 *  실제로 돌려 보면 API 실패로 «발행분과 똑같을» 수 있다 — 그래서 아래 판정은 「늘었으면 확정」이
 *  아니라 「늘었으면 다시 돌려서 rows.length를 확인하라」로만 말한다. */
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

/** 이미 발행된 데이터 파일의 rows.length — «진짜 기준선». 없으면 0(아직 한 번도 안 낸 것) */
export function 발행된수(경로) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 경로), 'utf8')).rows.length; } catch { return 0; }
}

export const 데이터파일 = { buyback: 'src/data/buyback-filings.json', 'rights-issue': 'src/data/rights-issue-filings.json', 'convertible-bond': 'src/data/cvbd-filings.json' };

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

/** dart-empSttus-paygap 계절 트리거 — 반기·사업보고서 «마감 뒤» 창(공시가 다 올라온 시점)인가.
 *  마감일 자체가 아니라 «마감 뒤 30일»을 창으로 잡는다 — 마감 당일엔 아직 공시가 덜 올라온다.
 *  월/일만 본다(연도 무관, 매년 반복). ⛔ 짐작 아님 — 두 마감(반기 8/14·사업보고서 3/31)은
 *  자본시장법 시행령 고정 기한이다. */
export function 공시시즌판정(월, 일) {
  const md = 월 * 100 + 일;
  const 반기창 = md >= 815 && md <= 914; // 8/15~9/14
  const 사업보고서창 = md >= 401 && md <= 430; // 4/1~4/30
  if (반기창) return { 시즌: true, 설명: '반기보고서(8/14 마감) 직후 창 — empSttus 재현 시점' };
  if (사업보고서창) return { 시즌: true, 설명: '사업보고서(3/31 마감) 직후 창 — empSttus 재현 시점' };
  return { 시즌: false, 설명: '공시 시즌 아님 — ②(3자 보도 계기) 경로만 유효' };
}

function main() {
  if (process.argv.includes('--자가시험')) {
    let 통과 = 0, 실패 = 0;
    const 검 = (m, ok) => { if (ok) 통과++; else { 실패++; console.log('  ❌', m); } };
    검('기준 미달이면 안 찼다', 판정({ buyback: 5 })[0].찼다 === false);
    검('기준 도달이면 찼다', 판정({ buyback: 6 })[0].찼다 === true);
    검('기준 초과도 찼다', 판정({ buyback: 9 })[0].찼다 === true);
    검('없는 태그는 0건으로', 판정({})[0].건수 === 0);
    검('반기창 안(8/20)이면 시즌', 공시시즌판정(8, 20).시즌 === true);
    검('반기창 밖(9/20)이면 아님', 공시시즌판정(9, 20).시즌 === false);
    검('사업보고서창 안(4/10)이면 시즌', 공시시즌판정(4, 10).시즌 === true);
    검('연초(1/15)는 아님', 공시시즌판정(1, 15).시즌 === false);
    검('마감 경계(8/15)는 창 안', 공시시즌판정(8, 15).시즌 === true);
    console.log(실패 === 0 ? `✅ 자가시험 — 통과 ${통과} · 실패 0` : `❌ 자가시험 — 통과 ${통과} · 실패 ${실패}`);
    process.exit(실패 === 0 ? 0 : 1);
  }

  const 건수 = 태그별건수();
  if (건수.못잼) { console.log('⬜ 못 쟀다 — archive/raw/dart-breaking 없음(서버 이동 등). 「0건」으로 안 읽는다.'); process.exit(0); }

  console.log('■ 6번 콘텐트 플레이북 — 건수 기반 트리거 판정\n');
  const 판정결과 = 판정(건수);
  let 재확인후보 = 0;
  for (const r of 판정결과) {
    const 기발행 = 발행된수(데이터파일[r.태그]);
    const raw늘었다 = r.건수 > 기발행;
    const 상태 = !r.찼다 ? '⏳ 기다리는 중(기준 미달)' : raw늘었다 ? '🟡 다시 돌려볼 값어치 — raw가 발행분보다 많다' : '⏳ 기준은 찼지만 raw가 발행분과 같음 — 아직 새 것 아님';
    console.log(`  ${r.태그.padEnd(18)} raw ${String(r.건수).padStart(2)}곳 / 기준 ${r.기준}곳 / 이미 발행 ${기발행}곳  ${상태}`);
    if (r.찼다 && raw늘었다) 재확인후보++;
  }
  console.log(`\n${재확인후보 ? `🟡 ${재확인후보}개 — 해당 make-*.mjs 스크립트를 «먼저 돌려» rows.length가 발행분보다 실제로 늘었는지 본다. 늘었을 때만 기사화한다(raw 증가만으로 기사화하지 않는다 — 2026-09-02 헛트리거 교훈).` : '✅ 다시 돌려도 새 기사 없을 것 — 계속 쌓는다(자리지킴이가 매시 collect-dart-breaking으로 누적).'}`);

  const 오늘 = new Date();
  const 시즌 = 공시시즌판정(오늘.getMonth() + 1, 오늘.getDate());
  console.log(`\n■ dart-empSttus-paygap 계절 트리거 — ${시즌.시즌 ? '🟡' : '⏳'} ${시즌.설명}`);
}

main();
