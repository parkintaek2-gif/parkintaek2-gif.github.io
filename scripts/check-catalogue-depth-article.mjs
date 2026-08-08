/**
 * 「여섯 편이냐 마흔아홉 편이냐」 기사를 자료에 대고 맞춘다.
 *
 *   six-titles-or-forty-nine   screen — 나라마다 겪은 한국 작품의 **깊이**
 *
 * ⛔ 이 검사가 특히 지키는 것 넷 —
 *    ① **대조군을 적었나.** 「자리가 적으면 당연히 쏠려 보인다」가 이 기사에 가장 큰 구멍이다.
 *       자리 수를 맞춘 표가 빠지면 선다.
 *    ② **줄어든 만큼만 말했나.** 날것 차이(37)만 적고 맞춘 뒤 차이(25)를 안 적으면
 *       기사가 실제보다 큰 소리를 하는 것이다. 둘 다 있어야 한다.
 *    ③ **설명 못 하는 것을 설명 못 한다고 적었나.** 남은 3분의 2 에 까닭을 붙이면 안 된다.
 *    ④ **줄세우기가 아니라고 적었나.** 나라 이름이 아홉 줄 나오는 표가 있는 기사다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/six-titles-or-forty-nine.md';
const 자료길 = 'src/data/wikitip-catalogue-depth.json';

/** 절반을 채우는 편수를 자가 **다시** 센다. 자료가 적어 둔 값을 그대로 안 믿는다 */
export function 절반편수(자리들) {
  if (!Array.isArray(자리들) || !자리들.length) return null;
  const 합 = 자리들.reduce((s, x) => s + x, 0);
  if (!합) return null;
  const v = [...자리들].sort((a, b) => b - a);
  let s = 0;
  for (let i = 0; i < v.length; i++) {
    s += v[i];
    if (s >= 합 / 2) return i + 1;
  }
  return v.length;
}

/** 대조군이 갉아먹은 몫 */
export function 설명된몫(날것, 맞춘것) {
  if (typeof 날것 !== 'number' || typeof 맞춘것 !== 'number' || !날것) return null;
  return +((100 * (날것 - 맞춘것)) / 날것).toFixed(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-catalogue-depth-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('한 편이 절반을 넘으면 1', 절반편수([10, 1, 1]) === 1);
  자가('고르면 절반에서 끊는다', 절반편수([1, 1, 1, 1]) === 2);
  자가('빈 것은 null', 절반편수([]) === null);
  자가('0 만 있으면 null', 절반편수([0, 0]) === null);
  자가('설명된 몫', 설명된몫(37, 25) === 32.4);
  자가('안 줄었으면 0%', 설명된몫(10, 10) === 0);
  자가('날것이 0 이면 null', 설명된몫(0, 0) === null);
  console.log(`깊이 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');
  /* ⚠ 표 안의 굵은 글씨·기울임(`**54**` · `*Squid Game*`)은 꾸밈이다. 벗기고 맞댄다 */
  const 민줄 = 한줄.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(42)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 민줄.includes(s), s.length > 44 ? `${s.slice(0, 44)}…` : s);

  /* ── ① 자료가 스스로 맞나 ── */
  본다('두 무리 합이 나라 수와 같나',
    d.groups[0].countries + d.groups[1].countries === d.countryCount,
    `${d.groups[0].countries} + ${d.groups[1].countries} = ${d.countryCount}`);
  for (const c of d.countries) {
    if (c.halfTakes !== null && c.halfTakes > c.distinctTitles) {
      본다(`${c.name} 절반 편수`, false, `${c.halfTakes} > ${c.distinctTitles}`);
    }
  }
  본다('날것 차이가 두 중앙값에서 나오나',
    d.gapRaw === d.groups[0].medianHalfTakes - d.groups[1].medianHalfTakes,
    `${d.groups[0].medianHalfTakes} − ${d.groups[1].medianHalfTakes} = ${d.gapRaw}`);
  본다('맞춘 차이가 두 중앙값에서 나오나',
    d.gapMatched === d.matched.asian.medianHalfTakes - d.matched.other.medianHalfTakes,
    `${d.matched.asian.medianHalfTakes} − ${d.matched.other.medianHalfTakes} = ${d.gapMatched}`);
  본다('설명된 몫이 두 차이에서 나오나',
    d.explainedByVolumePc === 설명된몫(d.gapRaw, d.gapMatched), `${d.explainedByVolumePc}%`);
  본다('대조군 양쪽에 나라가 있나',
    d.matched.asian.countries > 0 && d.matched.other.countries > 0,
    `아시아 ${d.matched.asian.countries} · 바깥 ${d.matched.other.countries}`);

  /* ── ② 기사가 자료와 같은 수를 말하나 ── */
  const [안, 밖] = d.groups;
  있나('제목의 여섯 대 마흔아홉',
    `Six Korean titles fill half of America's Korean chart places. In Vietnam it takes ${d.countries.find((c) => c.name === 'Vietnam').halfTakes}.`);
  있나('아시아 줄', `| The ten Asian markets | ${안.countries} | ${안.medianKoreanSlots.toLocaleString('en-US')} | ${안.medianDistinctTitles} | ${안.medianHalfTakes} | ${안.medianTopTitlePc}% |`);
  있나('바깥 줄', `| The other markets | ${밖.countries} | ${밖.medianKoreanSlots} | ${밖.medianDistinctTitles} | ${밖.medianHalfTakes} | ${밖.medianTopTitlePc}% |`);
  있나('중앙값이라고 밝혔나', 'All figures are medians of the markets in each group');

  /* ── ③ 양 끝 표가 자료 그대로인가 ── */
  for (const c of [...d.widest, ...d.narrowest]) {
    있나(`양 끝 — ${c.name}`, `| ${c.name} | ${c.distinctTitles} | ${c.halfTakes} | ${c.topTitle} | ${c.topTitlePc.toFixed(1)}% |`);
  }
  /*
   * ⚠ 처음엔 「좁은 쪽만 오징어 게임이고 넓은 쪽은 아니다」로 썼다. **틀렸다.**
   *   검사가 말레이시아 줄을 넣으라고 세웠고, 넣고 보니 인도네시아·말레이시아도 으뜸이 같았다.
   *   차이는 **어느 편이 으뜸이냐가 아니라 그 으뜸이 몇 %냐**다. 문장을 그렇게 고쳤다.
   *   자가 표를 다 내라고 하지 않았으면 틀린 문장이 그대로 나갔다.
   */
  본다('좁은 쪽 으뜸이 다 같은 편인가',
    new Set(d.narrowest.map((c) => c.topTitle)).size === 1,
    [...new Set(d.narrowest.map((c) => c.topTitle))].join(' · '));
  본다('으뜸 몫의 폭을 적었나',
    한줄.includes(`It leads Indonesia with ${d.widest.find((c) => c.name === 'Indonesia').topTitlePc}% and Latvia with ${d.narrowest.find((c) => c.name === 'Latvia').topTitlePc}%`),
    '같은 편이 어디선 2.4%, 어디선 46.1% 다');

  /* ── ④ 대조군을 적었나. 이 절이 빠지면 기사가 큰 소리를 하는 것이다 ── */
  본다('대조군 절이 있나',
    /The objection, and what happens to it/.test(한줄), '자리 수를 맞춰 다시 견준다');
  있나('대조군 아시아 줄', `| Asian | ${d.matched.asian.countries} | ${d.matched.asian.medianKoreanSlots.toLocaleString('en-US')} | ${d.matched.asian.medianDistinctTitles} | ${d.matched.asian.medianHalfTakes} | ${d.matched.asian.medianTopTitlePc}% |`);
  있나('대조군 바깥 줄', `| Other | ${d.matched.other.countries} | ${d.matched.other.medianKoreanSlots} | ${d.matched.other.medianDistinctTitles} | ${d.matched.other.medianHalfTakes} | ${d.matched.other.medianTopTitlePc}% |`);
  있나('띠 범위를 적었나', `between ${d.matched.from} and ${d.matched.to.toLocaleString('en-US')} Korean places`);
  for (const n of [...d.matched.asian.names, ...d.matched.other.names]) {
    본다(`띠 안 나라 — ${n}`, 민줄.includes(n), n);
  }
  있나('날것 차이', `raw gap in titles-to-fill-half was ${d.gapRaw}`);
  있나('맞춘 뒤 차이', `Inside the matched band it is ${d.gapMatched}`);
  본다('줄어든 만큼만 말했나',
    한줄.includes('about a third of the gap was volume, and two-thirds of it is not'),
    `자료로는 ${d.explainedByVolumePc}% 가 자리 수 탓이다`);
  본다('설명된 몫이 정말 3분의 1 쯤인가',
    d.explainedByVolumePc >= 25 && d.explainedByVolumePc <= 40,
    `${d.explainedByVolumePc}% — 이 밖으로 나가면 「3분의 1」이라는 말을 고쳐야 한다`);

  /* ── ⑤ 무리 안의 폭과 가장 얕은 곳 ── */
  있나('아시아 열의 폭', `runs from ${d.asianHalfRange.min} to ${d.asianHalfRange.max}`);
  있나('가장 얕은 곳', `The low end is ${d.asianShallowest.name}`);
  있나('가장 얕은 곳의 수', `${d.asianShallowest.distinctTitles} different Korean titles have charted there`);

  /* ── ⑥ 안 한 말을 안 했나 ── */
  본다('까닭을 안 지어냈나',
    한줄.includes('the surviving two-thirds of the gap is not explained'), '⛔ 남은 몫에 까닭을 붙이지 않는다');
  본다('줄세우기가 아니라고 적었나',
    한줄.includes('It is not a ranking'), '⛔ 나라 이름 표가 순위로 읽히면 안 된다');
  본다('취향이 아니라고 적었나',
    한줄.includes('It is not a measure of taste'), 'Top10 에 들었나만 보인다');
  있나('뺀 나라를 이름으로', d.excludedCountry.name);

  /* ── ⑦ 기사에서 표로 가는 길이 **정말 있나** ────────────────────────
     🔴 2번 지시 18:4x — 「every figure has a table behind it」이라 적어 놓고 표가 없었다.
        그 한 줄이 라이브에서 거짓말이었다. ⛔ 링크는 눈으로 세지 않는다. 자로 센다. */
  const 지면길 = 'src/pages/wikitip/catalogue-depth.astro';
  const 원문 = fs.readFileSync(기사길, 'utf8');
  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나',
    /\]\(\/catalogue-depth\)/.test(원문), 'markdown 링크 (/catalogue-depth)');
  본다('frontmatter 의 pages 에 걸었나',
    /^\s*-\s*"\/catalogue-depth"\s*$/m.test(원문), '지면이 이 기사를 스스로 건다');
  const 빌드 = 'dist/wikitip/article/six-titles-or-forty-nine.html';
  if (fs.existsSync(빌드)) {
    const h = fs.readFileSync(빌드, 'utf8');
    본다('빌드된 기사에 <a href> 가 있나',
      /href="\/catalogue-depth"/.test(h), '⛔ 마크다운만 보고 끝내지 않는다');
  } else {
    본다('빌드된 기사를 봤나', false, '🔴 빌드부터 해야 한다');
  }

  /* ── ⑧ 지면이 수를 손으로 안 박았나 ── `/home-first` 와 같은 자다 ── */
  if (fs.existsSync(지면길)) {
    const 몸 = fs.readFileSync(지면길, 'utf8').split(/^---$/m)[2] ?? '';
    const 박힌 = [...몸.split('<style>')[0]
      .replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ' ')
      .replace(/<[^>]*>/g, ' ')
      .matchAll(/\d[\d,.]*/g)]
      /* ⚠ `a top 10, not…` 의 쉼표까지 수에 붙어 `10,` 이 됐고, 면제표의 `10` 을 비껴갔다.
         꼬리의 쉼표·마침표를 뗀다 — `1,247` 은 7 로 끝나니 안 다친다 */
      .map((m) => m[0].replace(/[,.]+$/, ''))
      /* 면제 — 「Netflix top 10」은 넷플릭스가 붙인 차트 이름이지 우리가 센 수가 아니다 */
      .filter((v) => v !== '10');
    본다('지면이 수를 손으로 박았나', 박힌.length === 0,
      박힌.length ? `🔴 ${박힌.join(' · ')}` : '박은 수 0개');
  }

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 깊이 기사·지면 — 자료와 전부 맞다');
  process.exit(틀림 ? 1 : 0);
}
