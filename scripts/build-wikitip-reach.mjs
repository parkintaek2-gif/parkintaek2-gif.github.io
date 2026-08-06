/**
 * K Culture Wire — 동남아 여섯 나라 중 **몇 곳에 들어갔나**의 분포. (/reach)
 *
 * 결과 → src/data/wikitip-reach.json
 * 입력 → src/data/wikitip-titles.json (build-wikitip-titles.mjs 가 만든다)
 *        같은 자료에서 나오므로 두 지면의 편수는 **반드시 같아야 한다.** 아래에서 검산한다.
 *
 * ── 🔴 2026-08-07: 이 지면도 스크립트가 없었다 ────────────────────────
 * /staying-power 와 같다. 손으로 만든 자료 파일만 있었고, 판정 규칙이 바뀌자
 * **다시 만들 수 없어 틀린 채로 라이브에 남았다.** 448편 중 42편이 한국 작품이 아니었다
 * (미국 `The Perfect Couple`·`Run Away`, 태국 `Hunger`, 위처 두 편 …).
 * 스크립트로 되돌리고, 앞으로는 titles 를 다시 만들면 이 지면도 따라 바뀐다.
 *
 * ⛔ U자(양 끝이 두껍고 가운데가 얇다)는 고친 뒤에 **더 뚜렷해졌다.** 결론은 그대로다.
 *    그래도 숫자는 전부 바뀌었으므로 기사에 정정을 붙인다.
 */
import fs from 'node:fs';

const t = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));
const rows = t.rows;
const isTv = (r) => /^TV/i.test(r.type);

const buckets = [6, 5, 4, 3, 2, 1].map((c) => {
  const g = rows.filter((r) => r.countries === c);
  return {
    countries: c,
    n: g.length,
    share: +((100 * g.length) / rows.length).toFixed(1),
    avgWeeks: +(g.reduce((s, r) => s + r.weeks, 0) / g.length).toFixed(1),
    tv: g.filter(isTv).length,
    film: g.length - g.filter(isTv).length,
    peak1: g.filter((r) => r.peak === 1).length,
  };
});

const fmt = (label, f) => {
  const g = rows.filter(f);
  return {
    type: label,
    n: g.length,
    avgCountries: +(g.reduce((s, r) => s + r.countries, 0) / g.length).toFixed(2),
    avgWeeks: +(g.reduce((s, r) => s + r.weeks, 0) / g.length).toFixed(1),
    /* 이름은 지면이 이미 읽고 있는 것을 그대로 쓴다. 바꾸면 화면에서 조용히 빈칸이 된다 —
       한 번 그렇게 만들었고 빌드는 아무 말도 하지 않았다. */
    peak1: g.filter((r) => r.peak === 1).length,
    all6: g.filter((r) => r.countries === 6).length,
  };
};

const out = {
  generated: new Date().toISOString(),
  source: t.source,
  region: t.region,
  countries: t.countries,
  weekFrom: t.weekFrom,
  weekTo: t.weekTo,
  weekCount: t.weekCount,
  titleCount: rows.length,
  buckets,
  formats: [fmt('Series', isTv), fmt('Films', (r) => !isTv(r))],
  peak1: rows.filter((r) => r.peak === 1).length,
  /** 가운데(2~5개국)가 얼마나 얇은가 — 이 지면의 요지다. */
  middleShare: +((100 * buckets.filter((b) => b.countries > 1 && b.countries < 6)
    .reduce((s, b) => s + b.n, 0)) / rows.length).toFixed(1),
  excludedEnglishChart: t.excludedEnglishChart,
  excludedByHand: t.excludedByHand,
  unlabelledTitles: t.unlabelledTitles,
  examples: {
    six: rows.filter((r) => r.countries === 6).slice(0, 8),
    one: rows.filter((r) => r.countries === 1).sort((a, b) => b.weeks - a.weeks).slice(0, 8),
  },
};

/* ── 검산 ── 칸을 다 더하면 편수가 나와야 한다. 안 나오면 어딘가 새고 있다. */
const sum = buckets.reduce((s, b) => s + b.n, 0);
if (sum !== rows.length) throw new Error(`칸 합 ${sum} ≠ 편수 ${rows.length}`);
const shareSum = +buckets.reduce((s, b) => s + b.share, 0).toFixed(1);
if (Math.abs(shareSum - 100) > 0.3) throw new Error(`비중 합 ${shareSum}% — 100% 에서 멀다`);

fs.writeFileSync('src/data/wikitip-reach.json', JSON.stringify(out, null, 2));
console.log(`${out.titleCount}편 · 칸 합 ${sum} ✅ · 비중 합 ${shareSum}% ✅`);
console.log(buckets.map((b) => `${b.countries}국 ${b.n}(${b.share}%)`).join(' · '));
console.log(`가운데 ${out.middleShare}% · 드라마 평균 ${out.formats[0].avgCountries}개국 · 영화 ${out.formats[1].avgCountries}개국`);
