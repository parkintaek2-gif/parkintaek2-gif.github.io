#!/usr/bin/env node
/**
 * **이미 공시한 회사만** 골라 근속을 다시 받는다.
 *
 *   node scripts/refetch-tenure.mjs            이어받기
 *   node scripts/refetch-tenure.mjs --limit 900
 *
 * ── 왜 따로 만들었나 ──────────────────────────────────────────
 * `collect-tenure.mjs --refetch` 는 상장사 **3,981곳 전부**를 훑는다.
 * 그런데 실측하니 **800곳 중 730곳이 「미제출」**이었다 — 사업보고서에
 * 직원 현황을 안 낸 회사다. 그 730번은 매번 헛걸음이다.
 *
 * 우리는 **이미 받아 둔 2,921곳**이 누가 공시했는지 알고 있다.
 * 그 명단만 다시 받으면 **1,060번을 안 부른다.**
 *
 * ── 왜 다시 받아야 하나 ───────────────────────────────────────
 * 저장 파일에는 **파싱 결과만** 있고 원문이 없다. 파서를 고쳐도
 * 다시 받지 않으면 아무것도 안 바뀐다 — 실제로 「0곳 변경」을 보고 알았다.
 *
 * ── ⚠ 안전 ────────────────────────────────────────────────────
 * · 새 파일(`.new`)에 쓰고 **다 받은 뒤에** 바꿔치기한다.
 *   중간에 죽어도 쓰던 파일이 비지 않는다 — 한 번 비워 먹었다.
 * · 이어받기가 된다. 죽으면 그냥 다시 부르면 된다.
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { 합치기 } from './collect-tenure.mjs';

const DIR = path.resolve('archive/raw/dart-employment');
const 연도 = 2025;
const 본 = path.join(DIR, `employment-${연도}.ndjson`);
const 새 = path.join(DIR, `employment-${연도}.ndjson.new`);
const 원본 = path.join(DIR, `employment-${연도}.ndjson.bak`);
const 간격ms = 190;

function 키읽기() {
  for (const l of readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DART_API_KEY ?? '';
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 가 없다.'); process.exit(1); }

  const 명단원 = existsSync(원본) ? 원본 : 본;
  const 명단 = readFileSync(명단원, 'utf8').split('\n').filter((x) => x.trim())
    .map((l) => JSON.parse(l))
    .map((r) => ({ corp: r.corp, 종목: r.종목, 이름: r.이름, 영문: r.영문 }));
  console.log(`공시한 회사 ${명단.length.toLocaleString()}곳 (명단: ${path.basename(명단원)})`);

  /* 이어받기 */
  const 완료 = new Set();
  if (existsSync(새)) {
    for (const l of readFileSync(새, 'utf8').split('\n')) {
      if (!l.trim()) continue;
      try { 완료.add(JSON.parse(l).corp); } catch { /* 깨진 줄 무시 */ }
    }
  }
  const 남은 = 명단.filter((x) => !완료.has(x.corp));
  const 한도 = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? Number(process.argv[i + 1]) : Infinity; })();
  const 할것 = 남은.slice(0, 한도);
  console.log(`이미 받음 ${완료.size} · 이번에 ${할것.length}\n`);

  let 성공 = 0, 없음 = 0, 실패 = 0;
  for (const [i, c] of 할것.entries()) {
    const u = `https://opendart.fss.or.kr/api/empSttus.json?crtfc_key=${키}&corp_code=${c.corp}&bsns_year=${연도}&reprt_code=11011`;
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      if (j.status !== '000' || !j.list?.length) { 없음++; }
      else {
        const v = 합치기(j.list);
        /**
         * ⭐ **원본 행을 같이 저장한다.** 이게 없어서 오늘 2,921번을 다시 불렀다.
         *
         * 임원 재직기간은 `재직원문` 을 같이 저장해 뒀던 덕에 파서를 고친 뒤
         * **API 호출 0번**으로 35,004건을 다시 계산했다. 근속은 원문이 없어서
         * 파서를 고쳐도 「0곳 변경」이 나왔고, 결국 전부 다시 받아야 했다.
         *
         * 파일이 커지지만(대략 3~5배) **다시 받는 비용이 훨씬 크다.**
         * 우리가 쓰는 칸만 남긴다 — 응답 전체를 그대로 넣지는 않는다.
         */
        const 원행 = j.list.map((x) => ({
          부문: x.fo_bbm ?? null, 성별: x.sexdstn ?? null, 합: x.sm ?? null,
          정규: x.rgllbr_co ?? null, 기간제: x.cnttk_co ?? null,
          근속원문: x.avrg_cnwk_sdytrn ?? null, 급여: x.jan_salary_am ?? null,
        }));
        appendFileSync(새, JSON.stringify({ corp: c.corp, 종목: c.종목, 이름: c.이름, 영문: c.영문, 연도: String(연도), ...v, 원행 }) + '\n');
        성공++;
      }
    } catch { 실패++; }
    if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/${할것.length} — 성공 ${성공} · 없음 ${없음} · 실패 ${실패}`);
    await new Promise((s) => setTimeout(s, 간격ms));
  }

  const 받은총 = 완료.size + 성공;
  console.log(`\n받은 총 ${받은총} / 명단 ${명단.length}`);

  /**
   * ⭐ **바꾸기 전에 무엇이 얼마나 달라지는지 센다.**
   * 「없어짐」이 0 이 아니면 갈아끼우면 안 된다 — 채움률만 보면 사라진 값이 안 보인다.
   * (2026-08-05: 임원 재직기간을 다시 계산할 때 42건이 조용히 사라진 적이 있다)
   */
  if (existsSync(새) && existsSync(본)) {
    const 읽기 = (p) => new Map(readFileSync(p, 'utf8').split('\n').filter((x) => x.trim())
      .map((l) => { try { const o = JSON.parse(l); return [o.corp, o]; } catch { return null; } }
      ).filter(Boolean));
    const 옛 = 읽기(본), 새것 = 읽기(새);
    let 늘 = 0, 줄 = 0, 같 = 0, 새로 = 0, 없어짐 = 0;
    const 큰변화 = [];
    for (const [corp, n] of 새것) {
      const o = 옛.get(corp);
      if (!o || o.인원 == null) { if (n.인원 != null) 새로++; continue; }
      if (n.인원 == null) { 없어짐++; continue; }
      if (n.인원 === o.인원) { 같++; continue; }
      (n.인원 > o.인원 ? (늘++, 큰변화) : (줄++, 큰변화))
        .push({ 이름: n.이름, 전: o.인원, 후: n.인원, 차: n.인원 - o.인원 });
    }
    큰변화.sort((a, b) => Math.abs(b.차) - Math.abs(a.차));
    console.log(`\n■ 인원 변화  같음 ${같} · 늘 ${늘} · 줄 ${줄} · 새로 ${새로} · **없어짐 ${없어짐}**`);
    console.log('■ 가장 크게 바뀐 10곳');
    for (const x of 큰변화.slice(0, 10)) {
      console.log(`   ${String(x.이름).padEnd(16)} ${String(x.전).padStart(8)} → ${String(x.후).padStart(8)}  (${x.차 > 0 ? '+' : ''}${x.차.toLocaleString()})`);
    }
    if (없어짐) console.log(`\n⚠ **${없어짐}곳이 값을 잃었다.** 왜인지 보기 전에는 갈아끼우지 않는다.`);
  }

  if (받은총 >= 명단.length * 0.95) {
    /* ⚠ 다 받았을 때만 바꿔치기한다. 중간에 바꾸면 상품 데이터가 반쪽이 된다 */
    renameSync(새, 본);
    console.log(`✅ ${path.basename(본)} 을 새것으로 바꿨다.`);
  } else {
    console.log(`⏸ 아직 ${(받은총 / 명단.length * 100).toFixed(1)}% 다. 다시 부르면 이어받는다.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
