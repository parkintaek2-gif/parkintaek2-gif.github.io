#!/usr/bin/env node
/**
 * build-trade-api-data.mjs — KOSIS 관세청 국가별 수출입(360/DT_1R11006_FRM101)
 *   → src/data/trade-country-monthly.json  (유료 API /v1/trade/exports 가 읽는 번들)
 *
 * 왜 번들인가. 라이브(Cloudtype)는 R2 에서 아카이브를 읽지만, 사전류(trade-dict·
 * institutions)는 git 에 번들돼 배포된다. 국가×월 무역은 작다(12개월×약 250국). 같은
 * 방식으로 번들하면 **R2 자격증명 없이도** 엔드포인트가 실제 데이터를 준다.
 *
 * ⚠ 직접 관세청 API(품목별 nitemtrade)가 나오기 전까지의 **국가×월** 서비스다.
 *   HS 품목 축은 그 키가 오면 붙인다. 그때까지 「손놓지」 않는다 — 있는 데이터로 준다.
 *
 * 출처: 국가데이터처 KOSIS · 관세청 「국가별 수출액 수입액」 · 단위 천달러(원자료 그대로).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const raw = JSON.parse(readFileSync(path.join(ROOT, 'archive', 'raw', 'kosis', 'DT_1R11006_FRM101.json'), 'utf8'));
const rows = raw.rows;

const periods = [...new Set(rows.map((r) => r.PRD_DE))].sort();
const asMonth = (p) => `${p.slice(0, 4)}-${p.slice(4, 6)}`;

// 국가별·월별로 수출/수입 모은다. 「계」(Total)는 national 로 따로.
const byCountry = new Map(); // name_en -> { name_en, name_ko, series: Map<period,{exp,imp}> }
const national = new Map(); // period -> {exp,imp}

for (const r of rows) {
  const period = r.PRD_DE;
  const val = Math.round(+r.DT); // 천달러, 원자료 그대로 정수
  const isExp = r.ITM_NM === '수출액';
  if (r.C1_NM === '계') {
    const n = national.get(period) ?? { exp: 0, imp: 0 };
    if (isExp) n.exp = val; else n.imp = val;
    national.set(period, n);
    continue;
  }
  const key = r.C1_NM_ENG || r.C1_NM;
  if (!byCountry.has(key)) byCountry.set(key, { name_en: key, name_ko: r.C1_NM, series: new Map() });
  const c = byCountry.get(key);
  const s = c.series.get(period) ?? { exp: 0, imp: 0 };
  if (isExp) s.exp = val; else s.imp = val;
  c.series.set(period, s);
}

// 직전 12개월 무역이 0 인 나라는 뺀다(빈 레코드로 API 를 채우지 않는다).
const countries = [];
for (const c of byCountry.values()) {
  const months = periods.map((p) => {
    const s = c.series.get(p) ?? { exp: 0, imp: 0 };
    return { month: asMonth(p), exports: s.exp, imports: s.imp, balance: s.exp - s.imp };
  });
  const total = months.reduce((a, m) => a + m.exports + m.imports, 0);
  if (total === 0) continue;
  countries.push({ name_en: c.name_en, name_ko: c.name_ko, annual_trade: total, months });
}
countries.sort((a, b) => b.annual_trade - a.annual_trade);

const nationalMonths = periods.map((p) => {
  const n = national.get(p) ?? { exp: 0, imp: 0 };
  return { month: asMonth(p), exports: n.exp, imports: n.imp, balance: n.exp - n.imp };
});

const out = {
  source: {
    org: 'Korea Customs Service (via KOSIS, Statistics Korea)',
    dataset: 'Exports and imports by partner country — table DT_1R11006_FRM101 (org 360)',
    unit: 'thousand USD',
    licence: 'Korea Public Data Portal — commercial use permitted with attribution',
  },
  granularity: 'partner country × month',
  hs_note: 'HS-code (product) granularity is not in this table; it arrives when the direct Customs item-trade feed is live. Country totals here are authoritative.',
  window: { first_month: asMonth(periods[0]), latest_month: asMonth(periods[periods.length - 1]), months: periods.length },
  as_of: raw['수집시각'] ?? null,
  national: nationalMonths,
  countries,
};

// server.mjs 는 plain node 라 JSON import 대신 .mjs 모듈로 낸다(institutions.mjs 와 같은 방식).
const outPath = path.join(ROOT, 'src', 'lib', 'trade-data.mjs');
const banner = `/**\n * trade-data.mjs — 자동 생성물. 직접 고치지 마라.\n *   npm 스크립트: node scripts/build-trade-api-data.mjs\n * 관세청 국가별 월 수출입(KOSIS 360/DT_1R11006_FRM101). 단위 천달러.\n */\n`;
writeFileSync(outPath, `${banner}export const TRADE = ${JSON.stringify(out)};\n`);
const bytes = Buffer.byteLength(JSON.stringify(out));
console.log(`✅ ${outPath}`);
console.log(`  국가 ${countries.length} · 월 ${periods.length} (${out.window.first_month}~${out.window.latest_month}) · ${(bytes / 1024).toFixed(0)}KB`);
console.log(`  national latest: ${nationalMonths.at(-1).month} exp ${(nationalMonths.at(-1).exports/1e6).toFixed(1)}bn imp ${(nationalMonths.at(-1).imports/1e6).toFixed(1)}bn`);
console.log(`  top5: ${countries.slice(0,5).map(c=>c.name_en).join(', ')}`);
