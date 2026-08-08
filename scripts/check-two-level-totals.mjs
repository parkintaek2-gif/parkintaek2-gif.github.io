/**
 * 자 ② — **두 겹으로 나뉜 표에서 한 겹만 읽지 않았는가.** (원인 `kosis-two-level`)
 *
 * ── 무엇을 막나 ────────────────────────────────────────────────
 * 2026-08-07. KOSIS 방송수출 표가 **두 층으로 분류**되는데 한 층만 불러왔다.
 * 그래서 지상파가 2012년 65.7% 로 나왔다 — 실제는 **81.5%** 였고,
 * 안 읽은 층이 「나머지 7.6%」라는 **있지도 않은 칸**으로 둔갑해 있었다.
 *
 * ⭐ 이 잘못은 **합이 안 맞는 것으로 드러난다.** 부분을 다 더하면 총계가 되어야 한다.
 *    한 층을 빠뜨리면 그 차이가 「나머지」로 남는데, 그 나머지를 설명으로 쓰는 순간 거짓이 된다.
 *
 * ⛔ 그래서 「나머지가 있나」가 아니라 **「나머지가 0인가」**를 잰다.
 *    0이 아니면 그건 우리가 안 읽은 층이지 세상에 있는 칸이 아니다.
 * ⚠ 반올림으로 1~2 단위가 남을 수 있다. 총계 대비 비율로 재고, 그 문턱을 여기 적어 둔다.
 */
import fs from 'node:fs';

const 길 = 'src/data/wikitip-broadcast-export.json';
/** 총계 대비 이만큼까지는 반올림으로 본다. 넘으면 층을 빠뜨린 것이다. */
export const 나머지문턱pc = 0.5;

/** 한 해가 맞나 — 부분의 합이 총계인가 */
export function 한해(row) {
  const 부분합 = Object.values(row.parts ?? {}).reduce((s, v) => s + (v || 0), 0);
  const 나머지 = (row.total ?? 0) - 부분합;
  const pc = row.total ? +((100 * Math.abs(나머지)) / row.total).toFixed(3) : 0;
  return { year: row.year, total: row.total, 부분합, 나머지, pc, ok: pc <= 나머지문턱pc };
}

if (process.argv[1] && process.argv[1].endsWith('check-two-level-totals.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('딱 맞으면 통과', 한해({ year: 2024, total: 100, parts: { a: 60, b: 40 } }).ok);
  자가('반올림 한 단위는 통과', 한해({ year: 2024, total: 1000, parts: { a: 600, b: 399 } }).ok);
  자가('한 층을 빠뜨리면 선다', !한해({ year: 2012, total: 1000, parts: { a: 657 } }).ok);
  자가('나머지를 비율로 잰다', 한해({ year: 2012, total: 1000, parts: { a: 657 } }).pc === 34.3);
  자가('부분이 없으면 선다', !한해({ year: 2012, total: 1000, parts: {} }).ok);
  console.log(`두 겹 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(길, 'utf8'));
  const 결과 = d.rows.map(한해);
  const 나쁜것 = 결과.filter((r) => !r.ok);
  const 최대 = 결과.reduce((m, r) => (r.pc > m.pc ? r : m), 결과[0]);

  console.log(`해 ${결과.length} · 갈래 ${d.categories.length} · 가장 큰 나머지 ${최대.year}년 ${최대.pc}% (${최대.나머지})`);

  let 틀림 = 0;
  if (나쁜것.length) {
    틀림++;
    console.log(`\n🔴 부분의 합이 총계와 다른 해 ${나쁜것.length}개 — **층을 빠뜨렸을 때 나는 모양이다**`);
    for (const r of 나쁜것.slice(0, 6)) console.log(`   · ${r.year}년 총계 ${r.total} · 부분합 ${r.부분합} · 나머지 ${r.나머지} (${r.pc}%)`);
    console.log('\n⛔ 이 나머지를 「기타」로 지면에 적지 않는다. 그건 우리가 안 읽은 층이다.');
  }
  /* 자료가 스스로 「맞춰 봤다」고 적어 둔 것도 같이 본다 — 안 맞춰 보고 적으면 그것도 잘못이다 */
  if (!d.reconciled || typeof d.reconciled.maxResidual !== 'number') {
    틀림++;
    console.log('\n🔴 자료에 reconciled 기록이 없다 — 공표 소계와 맞춰 본 적이 없다는 뜻이다');
  } else if (d.reconciled.maxResidual > 0 && 최대.pc > 나머지문턱pc) {
    틀림++;
    console.log(`\n🔴 자료가 적어 둔 maxResidual ${d.reconciled.maxResidual} 과 실제 나머지가 어긋난다`);
  }
  if (틀림) process.exit(1);
  console.log(`✅ 모든 해에서 부분의 합이 총계다 (문턱 ${나머지문턱pc}%) — 안 읽은 층 없음`);
}
