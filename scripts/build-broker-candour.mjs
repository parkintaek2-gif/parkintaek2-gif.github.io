/**
 * build-broker-candour.mjs — 「증권사 솔직성: 사라진 매도의견」 상품 데이터 (P9)
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────
 *   우리 리서치 아카이브에서 **증권사별 투자의견 분포**(Buy/Hold/Sell)를 낸다.
 *   한국 리서치의 구조적 사실 — 매도의견이 사실상 사라졌다 — 을 하우스 단위로 보인다.
 *   대형 벤더는 「리포트」를 팔지 「의견 인플레이션의 구조」를 안 판다. 그 빈자리가 상품.
 *
 * ── ⛔ 강령 (투자자문 아님) ────────────────────────────────────
 *   · 이것은 **등급 분포라는 사실**이다. 「어느 증권사를 믿어라/피하라」가 아니다.
 *   · 특정 하우스 폄훼·매수매도 신호 아님. 목표주가 적중은 P7이 따로 잰다(여긴 등급만).
 *   · 1차 데이터만: archive/raw/research(우리가 모은 리서치 게시판).
 *   · 표본 단서: 우리 아카이브에 담긴 리포트 기준이다(하우스의 모든 리포트가 아닐 수 있음).
 *
 * 실행:  node scripts/build-broker-candour.mjs 2026
 * 출력:  src/data/broker-candour.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 해 = process.argv[2] || '2026';

function 의견묶기(op) {
  if (!op) return '기타';
  const s = String(op).toLowerCase().replace(/\s/g, '');
  if (/(buy|매수|outperform|overweight|strongbuy|적극매수|비중확대)/.test(s)) return 'Buy';
  if (/(hold|중립|neutral|marketperform|equalweight|시장수익률|보유)/.test(s)) return 'Hold';
  if (/(sell|매도|underperform|underweight|비중축소|reduce)/.test(s)) return 'Sell';
  return '기타';
}

const 방 = path.join(ROOT, 'archive/raw/research');
const 폴더전체 = fs.readdirSync(방).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

// ── 하우스별 (해당 연도) ──────────────────────────────────────
const house별 = new Map(); // house → {총, Buy, Hold, Sell, 기타}
const 전체 = { 총: 0, Buy: 0, Hold: 0, Sell: 0, 기타: 0 };
// ── 연도별 매도의견(시장 전체 추세, 문맥용) ───────────────────
const 연도별 = new Map(); // yyyy → {총, Sell}

for (const d of 폴더전체) {
  const yyyy = d.slice(0, 4);
  const dir = path.join(방, d);
  let 파일; try { 파일 = fs.readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { continue; }
  if (!연도별.has(yyyy)) 연도별.set(yyyy, { 총: 0, Sell: 0 });
  const 올해냐 = d.startsWith(해);
  for (const f of 파일) {
    let o; try { o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    const g = 의견묶기(o.opinion);
    const yy = 연도별.get(yyyy); yy.총++; if (g === 'Sell') yy.Sell++;
    if (!올해냐) continue;
    전체.총++; 전체[g]++;
    const h = o.house || '(미상)';
    if (!house별.has(h)) house별.set(h, { 총: 0, Buy: 0, Hold: 0, Sell: 0, 기타: 0 });
    const hh = house별.get(h); hh.총++; hh[g]++;
  }
}

const pc = (n, d) => (d ? +(n / d * 100).toFixed(1) : 0);
const pc2 = (n, d) => (d ? +(n / d * 100).toFixed(2) : 0);

// 하우스 표 — 리포트 200건 이상 + 실제로 등급을 매기는 곳만(매도 낮은 순).
// ⚠ 한국IR협의회처럼 등급을 아예 안 매기는 곳(Buy/Hold/Sell 0%)은 「Sell 0%」로 오해되므로 뺀다 —
//    등급 비율(rated)이 절반 미만이면 「등급을 내는 증권사」가 아니라고 보고 제외한다.
const houses = [...house별.entries()]
  .map(([house, v]) => ({
    house,
    reports: v.총,
    buy_pct: pc(v.Buy, v.총),
    hold_pct: pc(v.Hold, v.총),
    sell_pct: pc2(v.Sell, v.총),
    other_pct: pc(v.기타, v.총),
    rated_pct: pc(v.Buy + v.Hold + v.Sell, v.총),
  }))
  .filter((x) => x.reports >= 200 && x.rated_pct >= 50)
  .sort((a, b) => a.sell_pct - b.sell_pct || b.buy_pct - a.buy_pct);

const 연도표 = [...연도별.entries()].sort()
  .filter(([, v]) => v.총 >= 50)
  .map(([year, v]) => ({ year, reports: v.총, sell_pct: pc2(v.Sell, v.총) }));

const out = {
  generated: null, // 스크립트 밖에서 스탬프(재현성)
  year: 해,
  source: 'SeoulMarkets broker-research archive — opinion (rating) as filed, grouped Buy/Hold/Sell',
  disclaimer: 'This is the distribution of ratings as filed, a market-structure fact. It is not investment advice, not a verdict on any brokerage, and neither a buy nor a sell signal. Whether targets came true is a separate dataset (target-price accuracy).',
  sample_note: 'Counts reports in our own archive of the retail research boards; a house may publish more than we hold. Houses with at least 200 reports in the year are shown.',
  market: {
    reports: 전체.총,
    buy_pct: pc(전체.Buy, 전체.총),
    hold_pct: pc(전체.Hold, 전체.총),
    sell_pct: pc2(전체.Sell, 전체.총),
    other_pct: pc(전체.기타, 전체.총),
    houses_shown: houses.length,
    houses_with_zero_sell: houses.filter((h) => h.sell_pct === 0).length,
  },
  by_house: houses,
  sell_by_year: 연도표,
};
fs.writeFileSync(path.join(ROOT, 'src/data/broker-candour.json'), JSON.stringify(out, null, 2));

// 콘솔
console.log(`증권사 솔직성 — ${해}`);
console.log(`시장 전체: 리포트 ${전체.총.toLocaleString()} · Buy ${out.market.buy_pct}% · Hold ${out.market.hold_pct}% · Sell ${out.market.sell_pct}% · 기타 ${out.market.other_pct}%`);
console.log(`하우스 ${out.market.houses_shown}곳(200건+) 중 Sell 0.00% 인 곳: ${out.market.houses_with_zero_sell}`);
console.log(`\n하우스별(매도 낮은 순):`);
for (const h of houses) console.log(`  ${String(h.reports).padStart(5)}건  Buy ${String(h.buy_pct).padStart(4)}% · Hold ${String(h.hold_pct).padStart(4)}% · Sell ${String(h.sell_pct).padStart(4)}%  ${h.house}`);
console.log(`\n연도별 시장 매도비율:`);
for (const y of 연도표) console.log(`  ${y.year}  ${String(y.reports).padStart(6)}건  Sell ${y.sell_pct}%`);
