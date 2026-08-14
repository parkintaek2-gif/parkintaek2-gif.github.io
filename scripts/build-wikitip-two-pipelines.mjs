#!/usr/bin/env node
/**
 * **한국 방송을 거친 시리즈와 안 거친 시리즈는 다른 길을 간다.** (58편째 기사와 `/two-pipelines`)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 작품 지면 530장을 만들고 나니 작품마다 **어느 회사가 어떤 자격으로 붙었는지**가 생겼다.
 * 거기서 갈라 보니 위키데이터에 **첫 방송사(P449)가 없는 시리즈**가 49편 있었다 —
 * Squid Game · Hellbound · The Glory · Mask Girl · The 8 Show. 한국 방송을 안 거친 작품들이다.
 * 그 49편의 시장 가운데값이 **39곳**, 방송사가 붙은 238편은 **4곳**이었다.
 *
 * ── ⛔ 조심하는 것 ────────────────────────────────────────────
 * · 「방송사 credit 이 없다」는 **「방송을 안 탔다」의 대리 표지**다. 확인한 것이 아니다.
 *   ⭐ 다만 49편 **전부가 다른 회사 credit 은 가지고 있다** — 자료가 통째로 빈 것이 아니라
 *      방송사 칸만 빈 것이다. 그 사실을 지면이 적는다.
 * · **영화는 반대로 나온다**(3곳 대 1곳). 그래서 「스트리밍이 멀리 간다」로 넓히지 않는다.
 *   시리즈에만 있는 꼴이고, 그것도 같이 낸다.
 * · **방송 쪽이 지고 있는 것이 아니다.** 238편이 자리의 60.6% 를 가진다. 다른 장사다.
 * · 넷플릭스가 자기 작품을 세계에 **동시에 밀어 준다**는 것이 이 차이의 기계 장치일 수 있다.
 *   ⛔ 우리 자료는 그것을 증명 못 한다. 「이런 차이가 있다」까지만 적는다.
 * · 회사가 붙은 시리즈는 372편 중 287편(77.2%)뿐이다. **덮는 몫을 지면이 말한다.**
 *
 * 결과 → src/data/wikitip-two-pipelines.json
 * 쓰는 법: node scripts/build-wikitip-two-pipelines.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 작품판 = 'src/data/wikitip-title-pages.json';
const 낼곳 = 'src/data/wikitip-two-pipelines.json';

/** 위키데이터가 첫 방송사를 적어 둔 작품인가 */
export function 방송탔나(작품) {
  return (작품.firms || []).some((f) => (f.roles || []).includes('첫방송'));
}

/** 가운데값. 빈 것은 **0 이 아니라 null** */
export function 가운데값(a) {
  if (!a.length) return null;
  const v = [...a].sort((x, y) => x - y);
  const m = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
  return +m.toFixed(1);
}

/** 몫. 밑이 0 이면 null */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('방송 탔나 — 첫방송이 있으면 참', 방송탔나({ firms: [{ roles: ['제작', '첫방송'] }] }), true);
  재본다('방송 탔나 — 제작만 있으면 거짓', 방송탔나({ firms: [{ roles: ['제작'] }] }), false);
  재본다('방송 탔나 — 회사가 없으면 거짓', 방송탔나({ firms: [] }), false);
  재본다('방송 탔나 — 칸이 아예 없어도 안 죽는다', 방송탔나({}), false);
  재본다('가운데값 — 홀수', 가운데값([3, 1, 2]), 2);
  재본다('가운데값 — 짝수', 가운데값([1, 2, 3, 4]), 2.5);
  재본다('가운데값 — 빈 것은 null', 가운데값([]), null);
  재본다('몫', 몫(49, 287), 17.1);
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  console.log(`자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  만들기();
}

export function 만들기() {
  const d = JSON.parse(fs.readFileSync(작품판, 'utf8'));

  /** 한 무리를 재는 자 — 두 무리에 **같은 자**를 댄다 */
  const 재기 = (g, 전체자리) => ({
    titles: g.length,
    titleSharePc: null, // 아래에서 채운다
    medianMarkets: 가운데값(g.map((t) => t.markets)),
    medianPlaces: 가운데값(g.map((t) => t.places)),
    medianWeeks: 가운데값(g.map((t) => t.weeks)),
    places: g.reduce((s, t) => s + t.places, 0),
    placeSharePc: 몫(g.reduce((s, t) => s + t.places, 0), 전체자리),
    reached20: g.filter((t) => t.markets >= 20).length,
    oneMarketOnly: g.filter((t) => t.markets === 1).length,
    reachedNo1: g.filter((t) => t.peak === 1).length,
    reachedNo1Pc: 몫(g.filter((t) => t.peak === 1).length, g.length),
    /** ⛔ 이름을 **가나다순**으로만 싣는다. 크기 순으로 안 놓는다 */
    biggestExamples: g.filter((t) => t.markets >= 60).map((t) => t.title).sort((a, b) => a.localeCompare(b)),
  });

  const 시리즈전체 = d.titles.filter((t) => t.type === 'TV');
  const S = 시리즈전체.filter((t) => t.firms.length > 0);
  const 자리합 = S.reduce((s, t) => s + t.places, 0);

  const 방송 = 재기(S.filter(방송탔나), 자리합);
  const 안방송 = 재기(S.filter((t) => !방송탔나(t)), 자리합);
  방송.titleSharePc = 몫(방송.titles, S.length);
  안방송.titleSharePc = 몫(안방송.titles, S.length);

  /* 영화 — ⛔ 견줌으로만 쓴다. 여기서 꼴이 뒤집히는 것이 이 지면의 안전장치다 */
  const 영화전체 = d.titles.filter((t) => t.type === 'Films');
  const F = 영화전체.filter((t) => t.firms.length > 0);
  const films = {
    withFirms: F.length,
    total: 영화전체.length,
    aired: { titles: F.filter(방송탔나).length, medianMarkets: 가운데값(F.filter(방송탔나).map((t) => t.markets)) },
    notAired: { titles: F.filter((t) => !방송탔나(t)).length, medianMarkets: 가운데값(F.filter((t) => !방송탔나(t)).map((t) => t.markets)) },
  };

  /* ── 스스로 본다 ── */
  if (방송.titles + 안방송.titles !== S.length) throw new Error('두 무리 합이 전체와 다르다');
  if (방송.places + 안방송.places !== 자리합) throw new Error('두 무리 자리 합이 전체와 다르다');
  if (Math.abs(방송.placeSharePc + 안방송.placeSharePc - 100) > 0.2) throw new Error('자리 몫 합이 100 이 아니다');
  /* ⛔ 기사 요지 — 뒤집히면 기사를 다시 쓴다 */
  if (!(안방송.medianMarkets > 방송.medianMarkets * 3)) {
    throw new Error(`방송 안 탄 쪽 ${안방송.medianMarkets} 대 탄 쪽 ${방송.medianMarkets} — 「갈라진다」가 안 선다`);
  }
  if (!(방송.places > 안방송.places)) {
    throw new Error('방송 쪽이 자리를 더 많이 안 가진다 — 「지고 있는 것이 아니다」가 안 선다');
  }
  /* ⛔ 자료가 통째로 빈 것이 아니라 방송사 칸만 빈 것임을 보장한다 */
  if (!S.filter((t) => !방송탔나(t)).every((t) => t.firms.length > 0)) {
    throw new Error('방송사 없는 무리에 회사 credit 이 아예 없는 작품이 있다 — 대리 표지가 무너진다');
  }
  /* ⛔ 영화가 같은 방향이면 「시리즈에만 있는 꼴」이라 못 쓴다 */
  if (films.notAired.medianMarkets > films.aired.medianMarkets) {
    throw new Error('영화도 같은 방향이다 — 「시리즈에만 있다」를 다시 봐야 한다');
  }

  const out = {
    generated: 지금(),
    source: 'Netflix Top 10 (Tudum) weekly country lists for reach; Wikidata original broadcaster (P449), production company (P272) and distributor (P750) for the credits, retrieved by item number rather than by name',
    question: 'Korean series that aired on a Korean television network and Korean series that did not — do they travel the same way?',
    unit: 'Reach is the number of markets a title appeared in at least once, out of 93. A place is one appearance in one country\'s weekly top 10.',
    /** ⛔ 지면이 그대로 싣는다 */
    proxyWarning: 'We are reading "Wikidata records no first broadcaster" as "it did not air on a Korean network". That is a proxy, not a confirmed fact. What supports it is that every title in that group carries other company credits — the record is not blank, only the broadcaster field is — and that the group is the recognisable made-for-streaming slate.',
    cannotAnswer: 'These figures cannot say why the two groups differ. A streamer promoting its own titles in every market at once would produce exactly this shape, and so would a difference in what the two pipelines commission. Netflix publishes neither its promotion nor its commissioning, so we are describing two footprints, not explaining them.',
    seriesTotal: 시리즈전체.length,
    seriesWithFirms: S.length,
    seriesCoveragePc: 몫(S.length, 시리즈전체.length),
    seriesPlaces: 자리합,
    marketCount: d.marketCount,
    aired: 방송,
    notAired: 안방송,
    films,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));

  console.log(`회사가 붙은 시리즈 ${out.seriesWithFirms}편 / 전체 ${out.seriesTotal}편 (${out.seriesCoveragePc}%) · 자리 ${out.seriesPlaces.toLocaleString('en-US')}`);
  for (const [nm, g] of [['한국 방송을 거침', 방송], ['안 거침', 안방송]]) {
    console.log(`  ${nm.padEnd(14)} ${String(g.titles).padStart(3)}편 (${g.titleSharePc}%) · 시장 가운데값 ${String(g.medianMarkets).padStart(4)}`
      + ` · 자리 ${g.places.toLocaleString('en-US').padStart(7)} (${g.placeSharePc}%)`
      + ` · 20곳 넘음 ${String(g.reached20).padStart(3)} · 한 곳뿐 ${String(g.oneMarketOnly).padStart(2)} · 1위 잡음 ${g.reachedNo1Pc}%`);
  }
  console.log(`  ⚠ 영화는 반대다 — 거침 ${films.aired.titles}편 ${films.aired.medianMarkets}곳 · 안 거침 ${films.notAired.titles}편 ${films.notAired.medianMarkets}곳`);
  console.log(`→ ${낼곳}`);
}
