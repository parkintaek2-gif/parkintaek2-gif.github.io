#!/usr/bin/env node
/**
 * **차트에 오르는 한국 시리즈는 몇 곳에서 나오나.** (55편째 기사와 `/who-makes-it` 의 표)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 우리는 나라마다 「절반을 채우는 작품이 몇 편인가」를 이미 잰다(`/catalogue-depth`).
 * 같은 자를 **만드는 쪽**에 대 본다 — 절반을 채우는 **회사**가 몇 곳인가.
 * 사는 쪽에도 파는 쪽에도 값이 있다. 우리 B2B 손님 명단이 왜 열일곱 곳에 갇히는지의 답이기도 하다.
 *
 * ── ⛔ 줄세우기가 아니다 ──────────────────────────────────────
 * 「어느 회사가 1등인가」를 안 낸다. **몇 곳이면 절반인가**만 낸다.
 * 이름은 등급 없이 알파벳순으로만 싣는다.
 *
 * ── ⛔ 영화는 안 센다 ─────────────────────────────────────────
 * 회사가 붙은 시리즈는 91.7% 인데 영화는 37.7% 다. 반쯤 빈 자료로 쏠림을 재면
 * **덜 붙은 회사가 작아 보이는 착시**가 된다. 그래서 시리즈만 센다. 그 까닭을 지면이 말한다.
 *
 * ── ⛔ 반론을 자료 안에 넣는다 ─────────────────────────────────
 * 「방송사는 원래 많이 걸린다」 — 맞다. 그래서 **역할별로 따로** 낸다.
 * 제작(P272) · 첫방송(P449) · 배급(P750) 각각 몇 곳이면 절반인가.
 *
 * 결과 → src/data/wikitip-who-makes-it.json
 * 쓰는 법: node scripts/build-wikitip-who-makes-it.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 회사파일 = 'archive/raw/netflix-top10/firm-works.json';
const 열쇠파일 = 'archive/raw/netflix-top10/korean-titles-keyed.json';
const 시장파일 = 'src/data/wikitip-markets.json';
const 낼곳 = 'src/data/wikitip-who-makes-it.json';

/** 볼 역할. `null` 은 「따지지 않는다」 */
export const 역할들 = [
  { key: 'any', label: 'Any credit', role: null },
  { key: 'production', label: 'Production company', role: '제작' },
  { key: 'broadcaster', label: 'First broadcaster', role: '첫방송' },
  { key: 'distributor', label: 'Distributor', role: '배급' },
];

/**
 * 큰 곳부터 더해 **절반을 덮는 데 몇 곳이 드나.**
 * ⛔ 「1등이 몇 %」가 아니다. 덮개(cover) 크기다.
 * ⚠ 한 작품에 회사가 여럿 붙으므로 **작품을 집합으로** 센다. 더해서 세면 절반을 넘겨 버린다.
 */
export function 절반덮개(회사들, 전체작품수) {
  if (!전체작품수) return null;
  const s = [...회사들].sort((a, b) => b.works.length - a.works.length);
  const 본 = new Set();
  let n = 0;
  for (const c of s) {
    n += 1;
    for (const q of c.works) 본.add(q);
    if (본.size * 2 >= 전체작품수) return { firms: n, covered: 본.size };
  }
  return { firms: n, covered: 본.size };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 만들기 = (...묶음) => 묶음.map((w, i) => ({ firm: `F${i}`, works: w }));
  재본다('한 곳이 절반을 덮는다', 절반덮개(만들기(['a', 'b'], ['c'], ['d']), 4), { firms: 1, covered: 2 });
  재본다('두 곳이 필요하다', 절반덮개(만들기(['a'], ['b'], ['c'], ['d']), 4), { firms: 2, covered: 2 });
  /* ⛔ 겹치는 작품을 두 번 세면 한 곳으로 절반이 된 것처럼 보인다 */
  재본다('겹치는 작품을 두 번 안 센다', 절반덮개(만들기(['a', 'b'], ['a', 'b'], ['c'], ['d']), 4), { firms: 1, covered: 2 });
  재본다('작품이 없으면 null', 절반덮개(만들기(['a']), 0), null);
  재본다('역할 넷을 본다', 역할들.length, 4);
  재본다('첫 역할은 따지지 않는 것', 역할들[0].role, null);
  console.log(실패 ? `⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  const f = JSON.parse(fs.readFileSync(회사파일, 'utf8'));
  const k = JSON.parse(fs.readFileSync(열쇠파일, 'utf8'));
  const m = JSON.parse(fs.readFileSync(시장파일, 'utf8'));
  const 갈래 = new Map(Object.values(k.작품).map((x) => [x.q, x.갈래]));
  const 시리즈전체 = Object.values(k.작품).filter((x) => x.갈래 === 'series').length;
  const 영화전체 = Object.values(k.작품).filter((x) => x.갈래 === 'film').length;

  const 영화붙은 = new Set(f.firms.flatMap((x) => x.works.filter((w) => 갈래.get(w.q) === 'film').map((w) => w.q)));

  const 줄 = 역할들.map((r) => {
    const 회사 = f.firms
      .map((x) => ({
        firm: x.firm,
        works: x.works.filter((w) => 갈래.get(w.q) === 'series' && (!r.role || w.roles.includes(r.role))).map((w) => w.q),
      }))
      .filter((x) => x.works.length);
    const 작품 = new Set(회사.flatMap((x) => x.works));
    const 덮개 = 절반덮개(회사, 작품.size);
    return {
      key: r.key,
      label: r.label,
      firms: 회사.length,
      series: 작품.size,
      seriesCoveragePc: +((100 * 작품.size) / 시리즈전체).toFixed(1),
      halfTakesFirms: 덮개 ? 덮개.firms : null,
      /** ⛔ 이름은 **알파벳순**으로만. 등급도 편수 순서도 안 붙인다 */
      namesInHalf: 덮개
        ? [...회사].sort((a, b) => b.works.length - a.works.length).slice(0, 덮개.firms)
          .map((x) => x.firm).sort((a, b) => a.localeCompare(b))
        : [],
    };
  });

  /* 회사가 든 시리즈 편수 분포 — 「몇 곳이 절반」이 큰 곳 몇 개 탓인지 보이려고 같이 낸다 */
  const 전부회사 = f.firms
    .map((x) => ({ firm: x.firm, n: x.works.filter((w) => 갈래.get(w.q) === 'series').length }))
    .filter((x) => x.n);
  const 분포 = [
    { band: '1 series', firms: 전부회사.filter((x) => x.n === 1).length },
    { band: '2–4', firms: 전부회사.filter((x) => x.n >= 2 && x.n <= 4).length },
    { band: '5 or more', firms: 전부회사.filter((x) => x.n >= 5).length },
  ];

  /* ── 스스로 본다 ── */
  const 어느것 = 줄[0];
  if (분포.reduce((s, b) => s + b.firms, 0) !== 어느것.firms) throw new Error('분포 합이 회사 수와 다르다');
  for (const r of 줄) {
    if (r.halfTakesFirms != null && r.namesInHalf.length !== r.halfTakesFirms) throw new Error(`${r.label}: 이름 수가 덮개 수와 다르다`);
    if (r.series > 시리즈전체) throw new Error(`${r.label}: 붙은 시리즈가 전체보다 많다`);
  }
  /* ⛔ 기사 요지 — 절반을 채우는 회사가 전체의 10% 아래여야 「좁다」고 쓸 수 있다 */
  if (!(어느것.halfTakesFirms / 어느것.firms < 0.1)) {
    throw new Error(`절반을 채우는 회사가 ${어느것.halfTakesFirms}/${어느것.firms} 다 — 「좁다」를 못 쓴다`);
  }

  const out = {
    generated: 지금(),
    source: 'Wikidata production company (P272), original broadcaster (P449) and distributor (P750) on the Korean titles that appear in Netflix country top 10 lists, 2021–2026',
    question: 'How many companies does it take to account for half the Korean series that chart?',
    unit: 'A company “covers” a series if Wikidata lists it as producer, first broadcaster or distributor. Titles are counted as a set, so a series credited to several companies is still one series.',
    /** ⛔ 지면이 이 문장을 그대로 싣는다 — 영화를 왜 뺐나 */
    whySeriesOnly: `Companies are attached to ${Math.round((100 * (시리즈전체 - (시리즈전체 - 줄[0].series))) / 시리즈전체)}% of series but only ${+((100 * 영화붙은.size) / 영화전체).toFixed(1)}% of films, and measuring concentration on a half-empty list makes the missing companies look small rather than missing. Films are left out rather than half-counted.`,
    seriesTotal: 시리즈전체,
    filmsTotal: 영화전체,
    filmsWithFirm: 영화붙은.size,
    filmCoveragePc: +((100 * 영화붙은.size) / 영화전체).toFixed(1),
    roles: 줄,
    firmSizeBands: 분포,
    /** 견줌 — 같은 자를 시장 쪽에 댄 값. ⛔ 단위가 다르니 「견줌」이라고만 적는다 */
    marketHalfTakesMedian: m.medians.halfTakes,
    marketHalfTakesUS: m.markets.find((x) => x.iso2 === 'US')?.halfTakes ?? null,
    marketHalfTakesVN: m.markets.find((x) => x.iso2 === 'VN')?.halfTakes ?? null,
    marketCount: m.countryCount,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));
  console.log(`시리즈 ${시리즈전체}편 · 영화 ${영화전체}편(회사 붙은 것 ${out.filmCoveragePc}% — 그래서 뺐다)`);
  for (const r of 줄) {
    console.log(`  ${r.label.padEnd(20)} 회사 ${String(r.firms).padStart(3)}곳 · 시리즈 ${String(r.series).padStart(3)}편(${r.seriesCoveragePc}%) · 절반을 채우는 회사 **${r.halfTakesFirms}곳**`);
  }
  console.log(`  회사 크기 — ${분포.map((b) => `${b.band} ${b.firms}곳`).join(' · ')}`);
  console.log(`→ ${낼곳}`);
}
