#!/usr/bin/env node
/**
 * build-invest-ai-stage1.mjs — 투자AI «1단계 학습자료».
 *   2번 지시(2026-08-23): 설계문서 말고, 이미 확보한 실측 데이터를 투자AI 학습자료로 «굳힌다».
 *   KLifeMap이 점성학을 「원전 확보 → 학습질문」으로 시작한 것과 같은 순서.
 *
 *   재료 = 커밋된 src/data (아카이브 없이도 된다):
 *     · target-price-accuracy.json  — 증권사별 목표주가 적중률(발행시 목표 vs 12개월 뒤 실제)
 *     · concentration-cross.json     — 주가×무역 집중도(상위4·Gini)
 *     · trade-concentration.json     — 수출·수입 목적지 집중도
 *     · krx-daily-history.json       — 일일 집중도 지수 시계열
 *   ⚠ 정직 한계: KRX 시세는 sim이라 «절대 시세»는 학습자료에서 뺀다 — «비율/Gini/적중률»만.
 *     증권사 «레코드 단위» 적중률은 archive/raw/{research,stocks}가 있어야 뽑는다(지금 세션엔 없음).
 *     그건 2단계로 남긴다. 여기선 검증된 «집계 사실»만 굳힌다.
 * 산출: src/data/invest-ai-stage1.jsonl (사실 한 줄=한 학습레코드) + 콘솔 요약.
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const D = path.join(ROOT, 'src/data');
const rd = (f) => { const p = path.join(D, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };

const facts = [];
const add = (topic, fact, value, unit, asOf, source, caveat) =>
  facts.push({ topic, fact, value, unit, asOf, source, caveat });

// ── ① 증권사 목표주가 적중률 (집계) ──
const tp = rd('target-price-accuracy.json');
if (tp?.증권사) {
  for (const h of tp.증권사) {
    add('broker_accuracy',
      `${h.house} hit its 12-month target price on ${h.hitRate}% of rated reports`,
      h.hitRate, 'percent', tp.기준일 || null,
      'SeoulMarkets target-price accuracy (broker research vs KRX close 12 months later)',
      'Hit = actual close 12m later >= target; single end-point, so intra-period hits are undercounted. Survivorship: delisted names drop out.');
    add('broker_accuracy',
      `${h.house} promised on average ${h.avgTargetUpside}% upside; shares actually returned ${h.avgActual}% over 12 months`,
      { avgTargetUpside: h.avgTargetUpside, avgActual: h.avgActual, n: h.n }, 'percent', tp.기준일 || null,
      'SeoulMarkets target-price accuracy', 'Averages across n rated reports; not a return you could have earned.');
  }
}

// ── ② 시장·무역 집중도 (비율·Gini) ──
const cc = rd('concentration-cross.json');
if (cc?.dims) for (const d of cc.dims) {
  add('market_concentration',
    `Korea's ${d.key} — the top 4 hold ${d.top4}% and the concentration Gini is ${d.gini}`,
    { top4: d.top4, gini: d.gini, half: d.half, units: d.units },
    'ratio', cc.stockAsOf || cc.tradeMonth || null,
    'SeoulMarkets (KRX daily + Korea Customs)',
    'Ratios/Gini are scale-invariant — robust to the price level; absolute prices are not used.');
}

// ── ③ 무역 목적지 집중도 ──
const tc = rd('trade-concentration.json');
if (tc?.exports) {
  add('trade_concentration',
    `Korea's exports: top 4 partners ${tc.exports.top4}% (Gini ${tc.exports.gini}), across ${tc.exports.partners} countries`,
    tc.exports, 'ratio', tc.month || null, 'Korea Customs Service (via KOSIS)', 'Shares within one month; absolute USD carries a scale discontinuity and is excluded.');
  add('trade_concentration',
    `Korea's imports: top 4 partners ${tc.imports.top4}% (Gini ${tc.imports.gini}), across ${tc.imports.partners} countries`,
    tc.imports, 'ratio', tc.month || null, 'Korea Customs Service (via KOSIS)', 'Shares within one month; Hong Kong entrepot inflates some partner shares.');
}

// ── ④ 일일 집중도 지수 시계열 ──
const hist = rd('krx-daily-history.json');
if (hist?.days) for (const day of hist.days) {
  add('daily_index',
    `On ${day.date}, KOSPI+KOSDAQ market-cap Gini ${day.giniCap}, trading Gini ${day.giniTurnover}; top-10 ${day.capTop10}% of cap; ${day.zeroTrade} issues did not trade`,
    day, 'ratio', day.date, 'Korea Exchange OPEN API (daily)',
    'Ratios/Gini only — KRX price level in this feed is a simulation and is not learned.');
}

const outFile = path.join(D, 'invest-ai-stage1.jsonl');
const header = JSON.stringify({
  _manifest: 'SeoulMarkets Invest-AI stage-1 training facts',
  _왜: '투자AI가 학습할 «검증된 사실»만 모은다(2번 지시 2026-08-23). 짐작·절대시세 없음.',
  builtFrom: ['target-price-accuracy', 'concentration-cross', 'trade-concentration', 'krx-daily-history'],
  pending_stage2: 'Record-level broker target vs outcome (needs archive/raw/research + stocks; absent this session).',
  honesty: 'KRX absolute prices are simulated and excluded; only ratios, Gini and target-hit records are learned.',
  count: facts.length,
});
fs.writeFileSync(outFile, header + '\n' + facts.map((f) => JSON.stringify(f)).join('\n') + '\n');
const byTopic = facts.reduce((m, f) => ((m[f.topic] = (m[f.topic] || 0) + 1), m), {});
console.log(`✅ invest-ai-stage1.jsonl · ${facts.length} facts · ${Object.entries(byTopic).map(([k, v]) => k + ':' + v).join(' · ')}`);
