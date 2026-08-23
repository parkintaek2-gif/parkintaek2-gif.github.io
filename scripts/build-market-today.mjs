#!/usr/bin/env node
/**
 * build-market-today.mjs — 「당일 비율」 한 줄들. (2번 승인 2026-08-23)
 *   경쟁사는 당일 «지수 값»을 못박지만 우리 KRX는 sim이라 값은 못 낸다.
 *   대신 «당일 비율»(스케일 불변·검증가능)을 검색형 문장으로 낸다 —
 *   "Samsung is 26.7% of the KOSPI" 같은 말이 'samsung market cap'·'kospi' 검색을 잡는다.
 *   재료: src/data/market-concentration.json(커밋본, 최신 거래일 시총 비율).
 * 산출: src/data/market-today.json (라이브 지면이 읽는다).
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const SRC = path.join(ROOT, 'src/data/market-concentration.json');
if (!fs.existsSync(SRC)) { console.log('⚠ 못 쟀다 — market-concentration.json 없음. market-today 그대로 둔다.'); process.exit(0); }
const d = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const dd = d.asOf; // YYYYMMDD
const iso = dd && dd.length === 8 ? `${dd.slice(0, 4)}-${dd.slice(4, 6)}-${dd.slice(6, 8)}` : dd;
const top = d.top10list || [];
const n1 = top[0], n2 = top[1];

const facts = [];
if (n1) facts.push(`${n1.en} is ${n1.share}% of Korea's entire stock market (KOSPI + KOSDAQ) by market cap.`);
if (n1 && n2) facts.push(`The two largest — ${n1.en} and ${n2.en} — are ${(+(n1.share + n2.share).toFixed(1))}% of the market between them.`);
facts.push(`The top 10 stocks are ${d.top10}% of total market value; the top ${d.stocksFor80 ?? 57} are about 80%.`);
facts.push(`KOSPI holds ${d.kospi?.sharePct}% of market value across ${d.kospi?.n} issues; KOSDAQ ${d.kosdaq?.sharePct}% across ${d.kosdaq?.n}.`);

const out = {
  _왜: '당일 비율(검색형 문장). KRX 절대시세는 sim이라 안 냄 — 비율만. build-market-today.mjs 산출.',
  asOf: iso, asOfRaw: dd,
  headline: n1 ? `${n1.en} is ${n1.share}% of the Korean stock market` : null,
  facts,
  source: 'Korea Exchange OPEN API (KOSPI + KOSDAQ daily), market cap by issue',
  caveat: 'Ratios only — scale-invariant, independent of the price level. Latest trading day.',
};
fs.writeFileSync(path.join(ROOT, 'src/data/market-today.json'), JSON.stringify(out, null, 1));
console.log(`✅ market-today.json · ${iso} · ${facts.length} facts · "${out.headline}"`);
