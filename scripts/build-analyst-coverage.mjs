/**
 * build-analyst-coverage.mjs — 「애널리스트 커버리지」 상품 데이터 (P8)
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────
 *   상장사(rankings)를 분모로, 올해(기본 2026) 리포트가 한 건이라도 나온 회사를
 *   분자로 놓아 **어느 회사·어느 업종이 애널리스트에게 조명받고 버려지는가**를
 *   섹터 단위로 낸다. 대형 벤더가 파는 것은 "리포트 그 자체"이지 "누가 안 보이나"가
 *   아니다 — 그 빈자리와 쏠림이 우리 상품이다.
 *
 * ── ⚠ 정직 관문(왜 종목명으로 잇나) ───────────────────────────
 *   리서치 원본의 `code`(티커) 필드는 6,372건 중 352건에만 채워져 있다 —
 *   이는 시장 사실이 아니라 우리 스크래퍼가 티커를 못 딴 결함이다.
 *   code 없는 6,020건도 전부 개별종목 리포트(stock 이름 있음)다. 그래서
 *   커버리지는 **종목명(stock)** 으로 잇는다. code로 이으면 "5%만 커버"라는
 *   거짓 사막이 나온다. 종목명으로 이으니 진짜는 「약 3분의 1이 커버, 극심한 쏠림」.
 *
 * ── 강령 ───────────────────────────────────────────────────────
 *   · 1차 데이터만: archive/raw/research + archive/raw/stocks(코드·한글명·시총) + rankings + KSIC 섹터맵
 *   · 투자자문 아님: "살 종목"이 아니라 "얼마나 조명받나"라는 관심도·가시성 지표다.
 *     무커버 = 매수신호 아님. 그렇게 읽지 말라고 지면·기사에 못박는다.
 *   · 사실만: 커버 유무·건수·증권사 수·마지막 날짜. 의견/전망 해석 없음.
 *
 * 실행:  node scripts/build-analyst-coverage.mjs 2026
 * 출력:  src/data/analyst-coverage.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 해 = process.argv[2] || '2026';

// ── 1) 종목명↔코드↔시총 브릿지 (최신 stocks ndjson) ───────────
const stocksDir = path.join(ROOT, 'archive/raw/stocks');
const 최신 = fs.readdirSync(stocksDir).filter((f) => f.endsWith('.ndjson')).sort().at(-1);
const 코드of이름 = new Map(); // 한글명 → 코드
const 시총of코드 = new Map(); // 코드 → 시가총액(원)
for (const line of fs.readFileSync(path.join(stocksDir, 최신), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let o; try { o = JSON.parse(line); } catch { continue; }
  const code = o.코드; const nm = (o.이름 || '').trim();
  if (!code || !nm) continue;
  코드of이름.set(nm, code);
  시총of코드.set(code, o.시가총액 || 0);
}

// ── 2) 상장사 분모 + 섹터 (rankings) ──────────────────────────
const rankings = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/rankings.json'), 'utf8'));
const rows = Array.isArray(rankings) ? rankings : rankings.rows;
const sectorsDef = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/seoulmarkets-sectors.json'), 'utf8'));
const 섹터of = (industry) => sectorsDef.map[industry]?.sector || 'Unclassified';

// code → {enName, sector, mcap}
const 상장 = new Map();
for (const r of rows) {
  const [enName, ticker, industry] = r;
  if (!ticker) continue;
  const code = String(ticker);
  상장.set(code, { enName, sector: 섹터of(industry), mcap: 시총of코드.get(code) || 0 });
}

// ── 3) 올해 리서치 커버 (종목명 기준) ─────────────────────────
const 방 = path.join(ROOT, 'archive/raw/research');
const 폴더 = fs.readdirSync(방)
  .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  .filter((d) => d.startsWith(해))
  .sort();

const 이름별 = new Map(); // 한글명 → {n, houses:Set, last}
let 총리포트 = 0;
for (const d of 폴더) {
  const dir = path.join(방, d);
  let 파일;
  try { 파일 = fs.readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { continue; }
  for (const f of 파일) {
    let o; try { o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    const nm = (o.stock || '').trim();
    if (!nm) continue;
    총리포트++;
    const e = 이름별.get(nm) || { n: 0, houses: new Set(), last: '' };
    e.n++;
    if (o.house) e.houses.add(o.house);
    if (o.date && o.date > e.last) e.last = o.date;
    이름별.set(nm, e);
  }
}

// ── 4) 상장사에 커버 붙이기(종목명→코드로 조인) ───────────────
// 리서치 이름이 stocks 이름과 정확히 맞아야 상장사에 붙는다. 붙는 비율을 정직히 기록.
const 커버of코드 = new Map();
let 리서치이름수 = 이름별.size; let 상장에붙은이름 = 0;
for (const [nm, e] of 이름별) {
  const code = 코드of이름.get(nm);
  if (code && 상장.has(code)) { 커버of코드.set(code, e); 상장에붙은이름++; }
}

// ── 5) 섹터별 커버율 ──────────────────────────────────────────
const 섹터 = new Map();
let 전체상장 = 0; let 전체커버 = 0;
for (const [code, info] of 상장) {
  const s = info.sector;
  const box = 섹터.get(s) || { total: 0, covered: 0, reports: 0, oneOnly: 0 };
  box.total++; 전체상장++;
  const cov = 커버of코드.get(code);
  if (cov) { box.covered++; 전체커버++; box.reports += cov.n; if (cov.n === 1) box.oneOnly++; }
  섹터.set(s, box);
}
const 섹터표 = [...섹터.entries()]
  .map(([sector, b]) => ({
    sector,
    listed: b.total,
    covered: b.covered,
    coverage_pct: +(b.covered / b.total * 100).toFixed(1),
    uncovered: b.total - b.covered,
    reports: b.reports,
    thin_one_report_only: b.oneOnly,
  }))
  .filter((x) => x.listed >= 20)
  .sort((a, b) => a.coverage_pct - b.coverage_pct);

// ── 6) 시총 큰데 무커버인 상장사 top(버려진 큰 회사 = 이야기) ──
const 무커버 = [];
for (const [code, info] of 상장) {
  if (!커버of코드.has(code)) 무커버.push({ ticker: code, name_en: info.enName, sector: info.sector, mcap_krw: info.mcap });
}
무커버.sort((a, b) => b.mcap_krw - a.mcap_krw);

// ── 7) 커버된 회사 리포트수 분포 ──────────────────────────────
const covCounts = [...커버of코드.values()].map((e) => e.n).sort((a, b) => b - a);
const 요약 = {
  year: 해,
  listed_companies: 전체상장,
  covered: 전체커버,
  uncovered: 전체상장 - 전체커버,
  coverage_pct: +(전체커버 / 전체상장 * 100).toFixed(1),
  total_stock_reports: 총리포트,
  distinct_names_in_research: 리서치이름수,
  names_matched_to_listing: 상장에붙은이름,
  one_report_only: covCounts.filter((n) => n === 1).length,
  single_house: [...커버of코드.values()].filter((e) => e.houses.size === 1).length,
  busiest_report_count: covCounts[0] || 0,
  median_reports_when_covered: covCounts.length ? covCounts[covCounts.length >> 1] : 0,
};

const 증권사수 = new Set();
for (const e of 이름별.values()) for (const h of e.houses) 증권사수.add(h);

const out = {
  generated: null, // 스크립트 밖에서 스탬프(재현성)
  source: 'SeoulMarkets analyst attention — archive/raw/research (stock-name join) + archive/raw/stocks (code·name·mcap) + rankings + KSIC sector map',
  brokerages_in_archive: 증권사수.size,
  method_note: 'Joined by stock name: the raw ticker field is filled in only 352 of 6,372 reports (a scraper gap, not a market fact); every uncoded report still names a single stock. A company "appears" if at least one report named it in the year.',
  // ⚠ 이 한 줄이 상품의 정직성이다. 우리 아카이브는 20개 증권사의 소매 리서치 표본이다.
  // 회사가 안 뜬 것은 「우리 표본에 안 떴다」이지 「시장이 그 회사를 안 본다」가 아니다.
  sample_caveat: 'This archive is a sample of retail-board research from a set of brokerages. A company NOT appearing means it drew no report in this sample — NOT that no analyst covers it. Read the sector figures as attention concentration within our archive, not as market-wide coverage.',
  disclaimer: 'Attention is a visibility measure, not investment advice. Appearing or not appearing is neither a buy nor a sell signal.',
  summary: 요약,
  by_sector: 섹터표,
  // 이름을 「버려진 종목」이라 부르지 않는다 — 「우리 2026 아카이브에 안 뜬 큰 회사」다.
  largest_absent_from_archive: 무커버.slice(0, 25).map((u) => ({ ...u, note: 'absent from our 2026 sample; not a claim about market coverage' })),
  absent_from_archive_total: 무커버.length,
};
fs.writeFileSync(path.join(ROOT, 'src/data/analyst-coverage.json'), JSON.stringify(out, null, 2));

// ── 콘솔 ──────────────────────────────────────────────────────
console.log(`애널리스트 커버리지 — ${해}  (종목명 조인)`);
console.log(`상장사 ${요약.listed_companies} · 커버 ${요약.covered}(${요약.coverage_pct}%) · 무커버 ${요약.uncovered}`);
console.log(`리서치 종목 리포트 ${요약.total_stock_reports} · 리서치에 뜬 종목명 ${요약.distinct_names_in_research} · 상장사에 붙은 것 ${요약.names_matched_to_listing}`);
console.log(`딱1건 ${요약.one_report_only} · 한 증권사만 ${요약.single_house} · 최다 ${요약.busiest_report_count}건 · 커버시 중앙값 ${요약.median_reports_when_covered}건`);
console.log(`\n섹터별 커버율(낮은 순):`);
for (const s of 섹터표) console.log(`  ${String(s.coverage_pct).padStart(5)}%  ${s.sector.padEnd(24)} 커버 ${String(s.covered).padStart(3)}/${String(s.listed).padStart(4)}  무커버 ${s.uncovered}`);
console.log(`\n시총 큰데 무커버 top8:`);
for (const u of 무커버.slice(0, 8)) console.log(`  ${(u.mcap_krw / 1e12).toFixed(1).padStart(6)}조  ${u.name_en} (${u.ticker}) · ${u.sector}`);
