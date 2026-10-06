/* ㉡ 를 고르면 «무엇을 잃나» — KRX 시세를 쓰는 지면이 손님을 얼마나 받나.
   ⛔ 0 을 「없다」로 읽기 전에 자를 의심한다.
   ⛔ 앞가지(/data)로 뭉뚱그리지 않는다 — 그러면 KRX 와 무관한 지면까지 끌려 들어온다. */
import fs from 'node:fs';

/* 저장소를 훑어 «그 자료를 실제로 읽는» 지면만 손으로 짚었다 (17장) */
const 건드 = new Set([
  '/data/analyst-attention', '/data/broker-candour', '/data/company-credit',
  '/data/consensus', '/data/financials', '/data/indices', '/data/kospi-weights',
  '/data/largest-companies', '/data/sector-leaders', '/data/target-changes',
  '/data/target-price-accuracy', '/data/valuation',
  '/rankings', '/rankings/market-cap', '/wikitip/workforce', '/data',
]);

const 길정리 = (s) => {
  const p = String(s ?? '').replace(/^https?:\/\/[^/]+/, '');
  if (!p) return '/';
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
};

const 파일들 = fs.readdirSync('src/data').filter((f) => /^gsc-seoulmarkets-page-/.test(f)).sort();
let 전노 = 0; let 전클 = 0; let 건노 = 0; let 건클 = 0;
const 모음 = new Map();
const 본길 = new Set();
for (const f of 파일들) {
  const j = JSON.parse(fs.readFileSync('src/data/' + f, 'utf8'));
  for (const r of (j.rows ?? [])) {
    const p = 길정리(r.key ?? r.page);
    본길.add(p);
    전노 += r.impressions ?? 0; 전클 += r.clicks ?? 0;
    if (건드.has(p)) {
      건노 += r.impressions ?? 0; 건클 += r.clicks ?? 0;
      const o = 모음.get(p) ?? { 노: 0, 클: 0 };
      o.노 += r.impressions ?? 0; o.클 += r.clicks ?? 0; 모음.set(p, o);
    }
  }
}
console.log(`잰 날 ${파일들.length}일치`);
console.log(`사이트 전체        노출 ${전노} · 클릭 ${전클}`);
console.log(`KRX 쓰는 17장      노출 ${건노} · 클릭 ${건클}  → ${전노 ? (건노 / 전노 * 100).toFixed(1) : '—'}% 노출`);
for (const [p, o] of [...모음].sort((a, z) => z[1].노 - a[1].노)) {
  console.log(`   ${p.padEnd(32)} 노출 ${o.노} · 클릭 ${o.클}`);
}
/* ⬜ 검색에 «한 번도 안 뜬» 지면은 「없다」가 아니라 「노출 0」이다 — 따로 적는다 */
const 안뜬것 = [...건드].filter((x) => !모음.has(x));
console.log(`\n⬜ 이 기간에 검색에 한 번도 안 뜬 것 ${안뜬것.length}장 — 「지면이 없다」가 아니라 「노출 0」이다`);
console.log('   ' + 안뜬것.join(' · '));
