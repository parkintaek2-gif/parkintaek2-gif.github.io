#!/usr/bin/env node
/**
 * **어디서 떴나가 누가 만들었나를 말해 준다.** (`/provenance` · 기사 73편째)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   2026-08-10, 우리 한국 작품 명단에 **남의 나라 작품 열세 편**이 앉아 있었다.
 *   이름이 같아서 들어왔다. `Undercover` 는 벨기에 시리즈이고 `#Manhole` 은 일본 영화다.
 *   글자로는 못 가른다 — 이름이 똑같기 때문이다. 그래서 **뜬 시장**으로 갈랐다.
 *
 * ── ⛔ 먼저 버린 규칙 ────────────────────────────────────────
 *   「한국 차트에 한 자리도 없으면 한국 작품이 아니다」 → **틀렸다.**
 *   재 보니 한국 작품 902편 중 **342편(37.9%)이 한국 차트에 한 자리도 없다.**
 *   KBS·tvN 으로 나간 드라마는 넷플릭스 코리아 차트에 안 뜬다.
 *   ⛔ 이 규칙을 걸었으면 멀쩡한 342편이 걸렸다. 그래서 근거를 겹친다.
 *
 * ── ⭐ 쓰는 규칙 — 셋이 다 맞을 때만 ─────────────────────────
 *   ① 한국 차트에 한 자리도 없다
 *   ② 위키데이터가 그 이름에 **한국 작품을 하나도** 안 붙였다
 *   ③ 가장 많이 뜬 시장이 위키데이터가 아는 **그 나라**다
 *
 * ── ⚠ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ 93곳을 줄세우지 않는다. 뺀 편과 **못 뺀 편**을 나란히 놓는다.
 * ⛔ 못 가른 둘(`Keys to the Heart`·`Life Is Beautiful`)을 감추지 않는다 —
 *    한국 작품이 **같은 이름을 쓴다.** 빼면 우리 것을 잃는다. 그것이 이 방법의 한계다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BY_MARKETS } from './lib/korean-netflix-titles.mjs';

const 표 = 'archive/raw/netflix-top10/countries.ndjson';
const 판정 = 'src/data/wikitip-title-ambiguity.json';
const 집밖 = 'src/data/wikitip-home-abroad.json';
const 결과 = 'src/data/wikitip-provenance.json';
const KOREA = 'South Korea';

/**
 * 한 작품이 시장마다 몇 자리를 잡았나 → 으뜸 시장과 그 몫.
 * 🔴 동률일 때 알파벳순으로 골랐더니 `Motherland`(아일랜드 1 · 영국 1)의 으뜸이 **아일랜드**로
 *   나와, 근거로 적은 나라(영국)와 화면에서 어긋났다. **댈 나라를 알면 그것을 고른다.**
 *   ⛔ 근거와 화면이 다른 말을 하면 독자는 둘 다 못 믿는다.
 */
export function 쏠림(셈, 댈나라 = null) {
  const 총 = [...셈.values()].reduce((a, b) => a + b, 0);
  if (!총) return null;
  const 최대 = Math.max(...셈.values());
  const 시장들 = [...셈.entries()].filter(([, v]) => v === 최대).map(([k]) => k).sort();
  const 고름 = (댈나라 && 시장들.includes(댈나라)) ? 댈나라 : 시장들[0];
  return { 시장: 고름, 자리: 최대, 총, 시장수: 셈.size, 몫: +((100 * 최대) / 총).toFixed(1) };
}

/** 근거 줄에서 나라만 뽑는다 — `'벨기에 (한국 없음) — …'` → `벨기에`. */
export function 근거나라(글) {
  return String(글).split(' (')[0].trim();
}

/**
 * 근거는 한글로 적혀 있고 시장 이름은 영어다. 그 사이를 잇는다.
 * ⛔ 여기 없는 나라는 `null` 이다. **짐작해서 비슷한 이름을 고르지 않는다** —
 *   틀린 나라를 화면에 내는 것보다 동률에서 알파벳순으로 두는 편이 낫다.
 */
export const 나라옮김 = new Map([
  ['벨기에', 'Belgium'], ['터키', 'Turkey'], ['프랑스', 'France'], ['영국', 'United Kingdom'],
  ['일본', 'Japan'], ['네덜란드', 'Netherlands'], ['스페인', 'Spain'], ['인도', 'India'],
  ['폴란드', 'Poland'], ['스웨덴', 'Sweden'],
]);
export function 영어나라(한글) { return 나라옮김.get(한글) ?? null; }

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('쏠림', 쏠림(new Map([['A', 3], ['B', 1]])),
    { 시장: 'A', 자리: 3, 총: 4, 시장수: 2, 몫: 75 });
  재본다('쏠림 — 동률이면 이름 순 하나', 쏠림(new Map([['B', 1], ['A', 1]])).시장, 'A');
  재본다('쏠림 — 빈 것', 쏠림(new Map()), null);
  재본다('근거나라', 근거나라('벨기에 (한국 없음) — 한국 0자리 · 네덜란드 16'), '벨기에');
  재본다('근거나라 — 괄호 없어도', 근거나라('일본'), '일본');
  재본다('뺀 편이 열셋인가', BY_MARKETS.size, 13);
  재본다('영어나라', 영어나라('영국'), 'United Kingdom');
  재본다('영어나라 — 모르면 null. 짐작하지 않는다', 영어나라('어딘가'), null);
  /* 🔴 Motherland 를 아일랜드로 내던 자리 */
  재본다('쏠림 — 동률이면 근거 나라를 고른다',
    쏠림(new Map([['Ireland', 1], ['United Kingdom', 1]]), 'United Kingdom').시장, 'United Kingdom');
  재본다('쏠림 — 근거가 으뜸이 아니면 안 밀어준다',
    쏠림(new Map([['Netherlands', 16], ['Belgium', 6]]), 'Belgium').시장, 'Netherlands');
  console.log(`출처 지면 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [표, 판정, 집밖]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const 판 = JSON.parse(fs.readFileSync(판정, 'utf8'));
  const 집 = JSON.parse(fs.readFileSync(집밖, 'utf8'));
  const 뺀이름 = new Set(BY_MARKETS.keys());
  /* 못 뺀 둘 — 한국 작품이 같은 이름을 쓴다. 이 지면의 절반이 이 둘이다. */
  const 못뺀이름 = new Set(['Keys to the Heart', 'Life Is Beautiful']);

  const 셈 = new Map();          // 제목 → (시장 → 자리)
  const 한국자리 = new Map();
  let 남은한국자리 = 0;
  const 남은제목 = new Set(판.perTitle.map((x) => x.title));
  for (const 줄 of fs.readFileSync(표, 'utf8').split('\n')) {
    if (!줄.trim()) continue;
    let j; try { j = JSON.parse(줄); } catch { continue; }
    if (j.국가 === 'Russia') continue;
    /* 🔴 못 뺀 둘은 **아직 명단 안에 있다.** 여기서 `continue` 하면 표에 0자리로 나온다 —
       실제로 그렇게 나왔다. 남은 자리를 세는 것과 이 표에 담는 것은 **다른 일**이다. */
    if (남은제목.has(j.제목)) 남은한국자리 += 1;
    if (!뺀이름.has(j.제목) && !못뺀이름.has(j.제목)) continue;
    if (!셈.has(j.제목)) 셈.set(j.제목, new Map());
    const m = 셈.get(j.제목);
    m.set(j.국가, (m.get(j.국가) ?? 0) + 1);
    if (j.국가 === KOREA) 한국자리.set(j.제목, (한국자리.get(j.제목) ?? 0) + 1);
  }

  const 줄만들기 = (제목, 근거) => {
    const s = 쏠림(셈.get(제목) ?? new Map(), 영어나라(근거));
    return {
      title: 제목,
      places: s ? s.총 : 0,
      markets: s ? s.시장수 : 0,
      topMarket: s ? s.시장 : null,
      topMarketPlaces: s ? s.자리 : 0,
      topMarketSharePc: s ? s.몫 : 0,
      homePlaces: 한국자리.get(제목) ?? 0,
      attributedTo: 근거,
    };
  };
  const 뺀것 = [...BY_MARKETS.entries()]
    .map(([t, 근거]) => 줄만들기(t, 근거나라(근거)))
    .sort((a, b) => b.places - a.places);
  const 못뺀것 = [...못뺀이름].map((t) => 줄만들기(t, null))
    .sort((a, b) => b.places - a.places);

  const 뺀자리 = 뺀것.reduce((s, x) => s + x.places, 0);
  /* ⛔ 「한국 차트에 한 자리도 없다」가 왜 혼자서는 못 쓰는 규칙인지 — 수로 낸다 */
  const 집없는몫 = +((100 * 집.neverChartedAtHome) / 집.titles).toFixed(1);

  /* 🔴 뺀 편 중 한국 차트에 뜬 것이 하나라도 있으면 규칙 ①이 깨진 것이다 */
  const 집에뜬것 = 뺀것.filter((x) => x.homePlaces > 0);
  if (집에뜬것.length) {
    throw new Error(`뺀 편 중 ${집에뜬것.length}편이 한국 차트에 떴다 — 규칙 ①이 깨졌다`);
  }

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) per-country weekly lists, and Wikidata for country of origin',
    question: 'Two works can share a title. Which one charted?',
    unit: 'Chart places. One place is one title in one country in one week.',
    panelTitles: 판.perTitle.length,
    koreanPlaces: 남은한국자리,
    removedTitles: 뺀것.length,
    removedPlaces: 뺀자리,
    removedPlacesPc: +((100 * 뺀자리) / (남은한국자리 + 뺀자리)).toFixed(2),
    /** ⛔ 이것이 「한국 차트에 없으면 남의 것」을 못 쓰는 이유다 */
    neverChartedAtHome: 집.neverChartedAtHome,
    neverChartedAtHomePc: 집없는몫,
    removed: 뺀것,
    /** ⚠ 못 가른 것. **감추지 않는다.** */
    couldNotSeparate: 못뺀것,
    whyNotHomeChartAlone: `${집.neverChartedAtHome} of ${집.titles} Korean titles (${집없는몫}%) `
      + 'never charted in Korea at all, because a drama that airs on Korean television does not '
      + 'appear on Netflix Korea. Absence from the home chart proves nothing on its own.',
    whatThisCannotDo: 'It cannot separate two works when a Korean work genuinely shares the name '
      + 'and the foreign one dominates the same market. Two titles failed here and were kept.',
    cannotAnswer: 'It says which work the chart row belongs to, not whether the other work exists, '
      + 'and it needs a foreign work Wikidata already knows about.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`뺀 편 ${out.removedTitles}편 · ${out.removedPlaces}자리 (${out.removedPlacesPc}%)`);
  console.log(`한국 차트에 안 뜬 편 ${out.neverChartedAtHome} / ${집.titles} = ${집없는몫}%`);
  console.log(`못 가른 편 ${out.couldNotSeparate.length}편 → ${결과}`);
}
