#!/usr/bin/env node
/**
 * 희석 분석 — **기사가 될 크기인지 먼저 잰다.**
 *
 *   node scripts/analyze-dilution.mjs
 *
 * ⚠ 분류는 `src/lib/issuance.mjs` 만 쓴다. 여기서 다시 정의하지 않는다.
 * ⚠ 재 보고 **작으면 안 쓴다.** 「재 보고 안 된다고 적는 것도 결과다」
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { 분류, 가중발행가, 발행가정상 } from '../src/lib/issuance.mjs';

const 파일 = path.resolve('archive/raw/dart-issuance/issuance-2025.ndjson');
const 수치 = (n) => (n == null ? '—' : Math.round(n).toLocaleString('en-US'));

function main() {
  const 행 = readFileSync(파일, 'utf8').split('\n').filter((x) => x.trim()).map((l) => JSON.parse(l));
  const 전행 = 행.flatMap((r) => r.증자.map((x) => ({ ...x, 종목: r.종목, 이름: r.영문 ?? r.이름 })));
  console.log(`회사 ${행.length.toLocaleString()} · 증자행 ${전행.length.toLocaleString()}`);

  /* ① 갈래별 — 건수와 **주식수** 둘 다. 건수만 보면 소액 전환이 부풀려 보인다 */
  const 갈래 = new Map();
  let 못알아봄 = 0;
  for (const x of 전행) {
    const c = 분류(x.형태원문);
    if (c === null) { 못알아봄++; continue; }
    const k = c.갈래;
    const v = 갈래.get(k) ?? { 건수: 0, 주식수: 0, 신주: c.신주 };
    v.건수++; if (x.수량 != null) v.주식수 += x.수량;
    갈래.set(k, v);
  }
  console.log(`\n■ 갈래별 (못 알아본 형태 ${못알아봄})`);
  console.log('   갈래        건수      주식수');
  for (const [k, v] of [...갈래].sort((a, b) => b[1].주식수 - a[1].주식수)) {
    console.log(`   ${k.padEnd(8)} ${String(v.건수).padStart(7)}  ${수치(v.주식수).padStart(16)}`);
  }

  /* ② ⭐ 핵심 질문 — **신주는 어디서 나오나** (희석 있는 것만) */
  const 희석 = ['현금', '전환', '임직원', '현물'];
  const 합 = (ks) => ks.reduce((s, k) => s + (갈래.get(k)?.주식수 ?? 0), 0);
  const 전체 = 합(희석);
  console.log('\n■ ⭐ 희석되는 신주는 어디서 나오나');
  for (const k of 희석) {
    const v = 갈래.get(k)?.주식수 ?? 0;
    console.log(`   ${k.padEnd(8)} ${수치(v).padStart(16)}  (${(v / 전체 * 100).toFixed(1)}%)`);
  }

  /**
   * ③ 발행가 — **얼마에 늘었나.** 이게 있어야 희석 기사가 성립한다.
   * ⚠ **단위 오기를 빼고 잰다.** 안 빼면 아주스틸 1,666억 한 줄이 평균을 통째로 날린다
   *   (뺀 값을 고치지 않는다 — 신고자 의도를 추측하게 되기 때문이다).
   */
  const 깨짐 = 전행.filter((x) => 발행가정상(x.발행가) === false).length;
  console.log(`\n■ 발행가 — **단위 오기로 뺀 행 ${깨짐.toLocaleString()}** / ${전행.length.toLocaleString()}`);
  for (const k of 희석) {
    const a = 전행.filter((x) => 분류(x.형태원문)?.갈래 === k);
    const r = 가중발행가(a);
    if (r.값 == null) continue;
    console.log(`   ${k.padEnd(8)} 가중평균 ${수치(r.값).padStart(9)}원 · 쓴 행 ${r.쓴행.toLocaleString()} · 뺀 행 ${r.뺌} · 값없음 ${r.없음.toLocaleString()}`);
  }

  /* ④ 최근 1년 — 옛 이력이 섞이면 「지금」이 안 보인다 */
  const 최근 = 전행.filter((x) => x.일자 && x.일자 >= '20250801');
  console.log(`\n■ 2025-08-01 이후 ${최근.length.toLocaleString()}행`);
  const 최근갈래 = new Map();
  for (const x of 최근) {
    const c = 분류(x.형태원문); if (!c) continue;
    const v = 최근갈래.get(c.갈래) ?? { 건수: 0, 주식수: 0 };
    v.건수++; if (x.수량 != null) v.주식수 += x.수량;
    최근갈래.set(c.갈래, v);
  }
  for (const [k, v] of [...최근갈래].sort((a, b) => b[1].주식수 - a[1].주식수)) {
    console.log(`   ${k.padEnd(8)} ${String(v.건수).padStart(6)}건  ${수치(v.주식수).padStart(14)}주`);
  }

  /* ⑤ 회사 단위 — 이름을 댈 수 있는 사례가 있나 */
  const 회사 = new Map();
  for (const x of 최근) {
    const c = 분류(x.형태원문);
    if (!c || c.신주 !== 1 || x.수량 == null) continue;
    const v = 회사.get(x.종목) ?? { 이름: x.이름, 주식수: 0, 건수: 0, 갈래: new Set() };
    v.주식수 += x.수량; v.건수++; v.갈래.add(c.갈래);
    회사.set(x.종목, v);
  }
  console.log('\n■ 최근 1년 신주가 많은 10곳');
  [...회사.values()].sort((a, b) => b.주식수 - a.주식수).slice(0, 10).forEach((v) =>
    console.log(`   ${String(v.이름).slice(0, 30).padEnd(32)} ${수치(v.주식수).padStart(14)}주 · ${v.건수}건 · ${[...v.갈래].join(',')}`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
