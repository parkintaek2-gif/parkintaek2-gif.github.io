#!/usr/bin/env node
/**
 * **견줄 상대가 화면에 없다** (`/esports-nations` · 기사 79편째)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   78편에서 한국 이스포츠 선수가 한 달에 몰렸다. 다음 물음은 하나뿐이었다 —
 *   **「이스포츠라서인가, 한국이라서인가」.** 갈라야 종목의 성질인지 알 수 있다.
 *   ⭐ 재 보니 **그 비교가 성립하지 않았다.** 다른 나라 선수는 문서가 비슷하게 있는데
 *      동남아에서 **읽히지를 않는다.** 견줄 무리 자체가 없었다.
 *   ⛔ 그것을 「실패」로 접지 않는다. **없다는 것이 결과**다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ 나라를 줄세우지 않는다. 세 수(있나·문서가 있나·읽히나)를 나란히 놓는다.
 * ⛔ 셋이 안 되는 무리로 만장일치를 말하지 않는다.
 * ⚠ 78편은 **가장 많이 읽히는 사람들**이었고 여기는 더 넓다. 그래서 몫이 다르다.
 *   그 차이를 감추지 않고 지면에 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 원자료 = 'archive/raw/wikipedia/esports-nations.json';
const 결과 = 'src/data/wikitip-esports-nations.json';

/** 문서는 있는데 안 읽히는 비율 — 이 지면의 물음이 여기 있다 */
export function 읽힘률(나라) {
  if (!나라.withSeaArticle) return null;
  return +((100 * 나라.readAtLeastMinimum) / 나라.withSeaArticle).toFixed(1);
}

/** ⛔ 무리를 이룬 나라가 몇인가 — 하나뿐이면 비교가 아니다 */
export function 견줄수있나(나라들) {
  const 무리 = 나라들.filter((n) => !n.group2025?.tooFew);
  return { groups: 무리.length, comparable: 무리.length >= 2, nations: 무리.map((n) => n.label) };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('읽힘률', 읽힘률({ withSeaArticle: 14, readAtLeastMinimum: 7 }), 50);
  재본다('읽힘률 — 문서가 없으면 null(0 이 아니다)',
    읽힘률({ withSeaArticle: 0, readAtLeastMinimum: 0 }), null);
  재본다('견줄수있나 — 무리가 하나뿐이면 비교가 아니다',
    견줄수있나([{ label: 'A', group2025: { tooFew: false } }, { label: 'B', group2025: { tooFew: true } }]),
    { groups: 1, comparable: false, nations: ['A'] });
  재본다('견줄수있나 — 둘이면 비교가 된다',
    견줄수있나([{ label: 'A', group2025: { tooFew: false } }, { label: 'B', group2025: { tooFew: false } }]).comparable,
    true);
  재본다('견줄수있나 — 아무도 없으면 0', 견줄수있나([]).groups, 0);
  console.log(`나라 견줌 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(원자료)) { console.error(`⛔ 없다 — ${원자료}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(원자료, 'utf8'));

  /* ⛔ Wikidata 에 한 명도 없는 나라는 낼 것이 없다 — 표에서 뺀다 */
  const 나라줄 = d.nations
    .filter((n) => n.onWikidata > 0)
    .map((n) => ({
      country: n.label,
      onWikidata: n.onWikidata,
      withSeaArticle: n.withSeaArticle,
      readEnoughToMeasure: n.readAtLeastMinimum,
      readSharePc: 읽힘률(n),
      peakMonth: n.group2025.tooFew ? null : n.group2025.month,
      sharingPeak: n.group2025.tooFew ? null : n.group2025.sharing,
      peopleInGroup: n.group2025.people,
      tooFewToSay: n.group2025.tooFew,
    }))
    .sort((a, b) => b.readEnoughToMeasure - a.readEnoughToMeasure);

  const 견줌 = 견줄수있나(d.nations);
  const 한국 = 나라줄.find((x) => x.country === 'South Korea');
  const 남들 = 나라줄.filter((x) => x.country !== 'South Korea' && x.withSeaArticle >= 5);

  const out = {
    generated: new Date().toISOString(),
    source: d.source,
    unit: d.unit,
    minReadsPerYear: d.minReadsPerYear,
    minPeopleForAGroup: d.minPeopleForAGroup,
    question: 'Is the single crowded month a fact about esports, or a fact about Korean players? '
      + 'To answer it we needed another country to compare against.',
    nations: 나라줄,
    comparison: 견줌,
    /** 🔴 이 지면의 결론 — 비교가 성립하지 않았다는 것 자체다 */
    whyTheComparisonFails: d.whyTheComparisonFails,
    koreaReadSharePc: 한국?.readSharePc ?? null,
    othersReadSharePc: 남들.length
      ? +((100 * 남들.reduce((a, x) => a + x.readEnoughToMeasure, 0))
        / 남들.reduce((a, x) => a + x.withSeaArticle, 0)).toFixed(1)
      : null,
    othersCompared: 남들.map((x) => x.country),
    /** ⚠ 78편과 몫이 다른 까닭. 감추지 않는다 */
    whyThisDiffersFromTheEarlierPage: 'Our earlier page measured the most-read Korean athletes in '
      + 'these editions and found every esports player among them peaking in the same month. This '
      + 'page starts from Wikidata instead, which reaches further down, and there the share is '
      + 'lower. Both are true of the group each describes: the pattern is strongest among the '
      + 'players who are read most.',
    cannotAnswer: d.cannotAnswer,
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}`);
  console.log(`   무리를 이룬 나라 ${견줌.groups} — ${견줌.comparable ? '견줄 수 있다' : '⛔ 견줄 수 없다'}`);
  console.log(`   한국 읽힘률 ${out.koreaReadSharePc}% · 남들(${out.othersCompared.join('·')}) ${out.othersReadSharePc}%`);
  for (const n of 나라줄) {
    console.log(`   ${n.country.padEnd(16)} ${String(n.onWikidata).padStart(5)} → 문서 ${String(n.withSeaArticle).padStart(3)}`
      + ` → 읽힘 ${String(n.readEnoughToMeasure).padStart(3)} (${n.readSharePc}%)`
      + `${n.tooFewToSay ? '  ⛔ 무리 안 됨' : `  ${n.sharingPeak}/${n.peopleInGroup} ${n.peakMonth}월`}`);
  }
}
