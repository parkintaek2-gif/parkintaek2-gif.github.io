/**
 * 유료 상품 **본보기** 파일을 만든다. (설계 검토용 — 파는 물건이 아니다)
 *
 * 2번 지시(2026-08-07 09:2x): 「유료 상품 첫 안을 설계해 문서로 낸다.
 *   문서 한 장 · **결과물 본보기(표든 리포트든 실제 모양)** · 왜 이 값인지 한 줄」
 *
 * 그림으로 그린 표는 설계가 아니다. **실제 자료로 실제 모양을 낸다.**
 * 결과 → docs/상품안/본보기-korean-title-panel.csv
 *        docs/상품안/본보기-provenance.csv
 *
 * ── ⛔ 팔 수 있는 것과 없는 것 ──────────────────────────────────
 * 넷플릭스 Tudum **원본 표는 재배포하지 않는다.** 우리 스크립트 머리말에 그렇게 적혀 있고
 * 지면도 그렇게 밝히고 있다. 그러니 상품에 **주간 원본 줄을 담지 않는다.**
 * 담는 것은 두 가지뿐이다.
 *   ① 우리가 만든 **집계** (편수·주수·도달 국가수 같은 요약)
 *   ② 우리가 만든 **판정** (이 제목이 한국 작품인가, 얼마나 확실한가) — 이건 우리 저작물이다
 * KOSIS·DART 는 공공데이터라 출처를 밝히고 실을 수 있다. 그쪽은 제한이 다르다.
 *
 * ⛔ Riot 자료는 이 상품에 **안 넣는다.** Production Key(App 866800) 심사 중이다.
 *    승인 전에 상업적으로 쓰면 접근이 영구 취소된다. 승인 뒤에 따로 판단한다.
 */
import fs from 'node:fs';

const OUT = 'docs/상품안';
fs.mkdirSync(OUT, { recursive: true });

const titles = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));
const amb = JSON.parse(fs.readFileSync('src/data/wikitip-title-ambiguity.json', 'utf8'));

/** 판정 지도 — 목록 전체가 아니라 우리가 실제로 판정한 것만. 없으면 not_assessed 로 둔다. */
const 판정 = new Map();
for (const r of amb.perTitle) 판정.set(r.title, { v: r.verdict, c: r.countries.join('|') });
for (const r of amb.frontPage) if (!판정.has(r.title)) 판정.set(r.title, { v: r.verdict, c: r.countries.join('|') });

const csv = (rows) => rows.map((r) => r.map((v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(',')).join('\n') + '\n';

/* ── ① 패널 ── 도달·지속 요약. 원본 주간 줄이 아니라 **작품당 한 줄**이다. */
const panel = [[
  'title', 'format', 'countries_reached', 'weeks_on_chart', 'peak_rank',
  'attribution', 'attribution_note',
]];
for (const r of titles.rows.slice(0, 25)) {
  const v = 판정.get(r.title);
  panel.push([
    r.title,
    /^TV/i.test(r.type) ? 'series' : 'film',
    r.countries, r.weeks, r.peak,
    /* 얼버무리지 않는다. 안 잰 것은 안 쟀다고 적는다 — 그 칸이 이 상품의 값이다. */
    v ? v.v : 'not_assessed',
    v && v.v === 'shared' ? `title also used by: ${v.c}` : '',
  ]);
}
fs.writeFileSync(`${OUT}/본보기-korean-title-panel.csv`, csv(panel));

/* ── ② 출처 판정 ── 이 상품의 값이 여기 있다. 남이 안 주는 칸이다. */
const prov = [[
  'measure', 'titles', 'share_of_viewing_pc', 'what_it_means',
]];
prov.push(['korea_only', amb.koreaOnly.titles, amb.koreaOnly.sharePc,
  'Only Korean works carry this exact title. A title-text rule cannot mismatch it.']);
prov.push(['shared_title', amb.shared.titles, amb.shared.sharePc,
  'A non-Korean work shares the exact title. We cannot tell from text alone which one charted. Not an error — an unresolved case.']);
prov.push(['no_country_on_wikidata', amb.unknown.titles, amb.unknown.sharePc,
  'Wikidata records no country of origin for any work with this title. No basis to judge.']);
fs.writeFileSync(`${OUT}/본보기-provenance.csv`, csv(prov));

console.log(`본보기 두 개를 ${OUT}/ 에 냈다`);
console.log(` 패널      ${panel.length - 1}줄 (실제 상품은 ${titles.titleCount}줄)`);
console.log(` 출처판정  ${prov.length - 1}줄 — 한국만 ${amb.koreaOnly.sharePc}% · 겹침 ${amb.shared.sharePc}% · 모름 ${amb.unknown.sharePc}%`);
