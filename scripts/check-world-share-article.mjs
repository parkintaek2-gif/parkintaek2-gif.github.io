/**
 * 「자리로 잰 한류」 기사와 지면을 자료에 대고 맞춘다.
 *
 *   the-share-that-did-not-grow   screen — 세계 7.7%, 아홉 나라는 30.3% → 19.5%
 *   /world-share                  같은 자료를 내는 지면
 *
 * ⛔ 이 검사가 특히 지키는 것 다섯 —
 *    ① **세계 평균만 적지 않았나.** 「안 움직였다」만 내면 아홉 나라의 하락을 감춘 것이다.
 *       무리 표가 빠지면 선다.
 *    ② **아홉이 모두 내렸다는 것을 적었나.** 우리 요지는 순서가 아니라 예외가 없다는 것이다.
 *       아홉 줄이 다 있고 모두 음수라야 한다.
 *    ③ **대조군을 적었나.** 「위키데이터가 새 작품을 늦게 담아서 준 것처럼 보인다」는
 *       이 기사에 가장 큰 구멍이다. 한국 자신의 차트가 그 구멍을 막는다. 빠지면 선다.
 *    ④ **뺀 나라를 이름으로 적었나.** 러시아를 말없이 빼면 우리가 고른 것이 된다.
 *    ⑤ **까닭을 지어내지 않았나.** 「없다」고 적은 문장이 있어야 한다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/the-share-that-did-not-grow.md';
const 자료길 = 'src/data/wikitip-world-share.json';
const 지면길 = 'src/pages/wikitip/world-share.astro';

/**
 * 지면 본문에 **손으로 박은 수**가 있나. `/home-first` 와 같은 자다.
 * ⛔ `<style>` 안과 머리(`---` 사이)는 안 본다. 꼬리표(`<h2>`)의 숫자도 지운다 —
 *    안 지우면 2·4 를 「박은 수」로 잡아 자가 글을 이긴다.
 */
export function 박힌수(원문, 면제) {
  const 몸 = 원문.split(/^---$/m)[2] ?? '';
  const 본문 = 몸.split('<style>')[0];
  const 남은 = 본문
    .replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ' ')
    .replace(/<[^>]*>/g, ' ');
  return [...남은.matchAll(/\d[\d,.]*/g)].map((m) => m[0]).filter((v) => !면제.includes(v));
}

/** 떨어진 폭을 다시 낸다. 자료가 적어 둔 값을 그대로 안 믿는다 */
export function 낙폭(처음, 마지막) {
  if (typeof 처음 !== 'number' || typeof 마지막 !== 'number') return null;
  return +(마지막 - 처음).toFixed(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-world-share-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('낙폭 한 자리', 낙폭(30.3, 19.5) === -10.8);
  자가('오른 것은 양수', 낙폭(2, 2.5) === 0.5);
  자가('한쪽이 없으면 null', 낙폭(30.3, null) === null);
  자가('본문에 박힌 수를 잡는다',
    박힌수('---\nx\n---\n<p>93 markets</p>\n<style>.a{b:1fr}</style>', []).join() === '93');
  자가('중괄호 안은 안 잡는다',
    박힌수('---\nx\n---\n<h2>{data.n} markets</h2>\n<style></style>', []).length === 0);
  자가('면제한 것은 빼고 잡는다',
    박힌수('---\nx\n---\n<p>Top 10 and 93</p>\n<style></style>', ['10']).join() === '93');
  console.log(`자리로 잰 한류 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');
  /* ⚠ 표 안의 굵은 글씨(`**161**`)를 자가 못 읽어 세 칸이 헛되이 섰다.
     굵기는 뜻이 아니라 꾸밈이다. 표를 맞댈 때는 별표를 벗기고 본다. */
  const 민줄 = 한줄.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(42)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 44 ? `${s.slice(0, 44)}…` : s);
  /* ⚠ 자료는 `8`, 기사는 `8.0%` 로 쓴다. **같은 수다** — 둘 다 받는다.
     같은 칸의 다른 값이 7.6% 인데 8 만 소수점이 없으면 표가 들쭉날쭉해진다. */
  const 꼴 = (v, n) => (n === 1 ? Number(v).toFixed(1) : String(v));
  const 자릿수아무거나 = (무엇, 만들기) => 본다(무엇,
    [0, 1].some((n) => 민줄.includes(만들기(n))), 만들기(1).slice(0, 44));

  /* ── ① 자료가 스스로 맞나 ── */
  본다('띠 합이 나라 수와 같나',
    d.bands.reduce((s, b) => s + b.countries, 0) === d.countryCount,
    `${d.bands.reduce((s, b) => s + b.countries, 0)} = ${d.countryCount}`);
  본다('세계 비율이 자리에서 나오나',
    d.worldPc === +((100 * d.koreanSlots) / d.totalSlots).toFixed(1), `${d.worldPc}%`);
  본다('자리 총합이 나라×줄인가',
    d.totalSlots === d.countryCount * d.slotsPerCountry,
    `${d.countryCount} × ${d.slotsPerCountry} = ${d.totalSlots}`);
  for (const y of d.byYear) 본다(`${y.year} 이 온전한 해인가`, y.weeks >= 52, `${y.weeks}주`);
  본다('아홉이 모두 내렸나', d.ninesByCountry.every((c) => c.change < 0),
    d.ninesByCountry.filter((c) => c.change >= 0).map((c) => c.name).join(',') || '아홉 다 음수');
  for (const c of d.ninesByCountry) {
    본다(`${c.name} 낙폭이 두 해에서 나오나`, c.change === 낙폭(c.first, c.last), `${c.change}p`);
  }

  /* ── ② 기사가 자료와 같은 수를 말하나 ── */
  const 아홉 = d.groups[1];
  있나('제목의 세계 비율', `Korean titles hold ${d.worldPc}% of the world's top-10 places`);
  있나('자리 총합', `${d.countryCount} countries with a complete record, ${d.weekCount} weeks, **${d.totalSlots.toLocaleString('en-US')} places**`);
  있나('한국 자리 수', `titles hold **${d.koreanSlots.toLocaleString('en-US')}** of them`);
  있나('중앙값', `| The median country | ${d.medianCountryPc}% |`);
  for (const y of d.byYear) {
    자릿수아무거나(`해마다 ${y.year}`, (n) => `| ${y.year} | ${y.weeks} | ${꼴(y.pc, n)}% |`);
  }

  /* ── ③ 세계 평균만 적고 끝내지 않았나 — 무리 표가 있어야 한다 ── */
  for (const g of d.groups) {
    자릿수아무거나(`무리 ${g.group.slice(0, 22)}`,
      (n) => g.byYear.map((y) => `${꼴(y.pc, n)}%`).join(' | '));
  }
  본다('아홉 나라 낙폭을 적었나',
    한줄.includes(`gave up **${낙폭(아홉.byYear[0].pc, 아홉.byYear[3].pc) * -1} points in four years**`),
    `${(낙폭(아홉.byYear[0].pc, 아홉.byYear[3].pc) * -1).toFixed(1)}p`);

  /* ── ④ 아홉 줄이 다 있나. 하나라도 빠지면 「예외가 없다」를 말할 수 없다 ── */
  for (const c of d.ninesByCountry) {
    있나(`아홉 — ${c.name}`, `| ${c.name} | ${c.first}% | ${c.last}% | −${Math.abs(c.change)} |`);
  }
  본다('순서가 요지가 아니라고 적었나',
    한줄.includes('the ranking is not the point'), '⛔ 줄세우기로 읽히면 안 된다');

  /* ── ⑤ 가른 것 · 대조군 · 뺀 나라 · 까닭 없음 ── */
  for (const r of d.ninesDecomposed) {
    자릿수아무거나(`가름 ${r.year}`,
      (n) => `| ${r.year} | ${꼴(r.pc, n)}% | ${r.koreanTitles}`);
  }
  있나('편수가 줄었다고 적었나', `fell from ${d.ninesDecomposed[0].koreanTitles} to ${d.ninesDecomposed[3].koreanTitles}`);
  있나('편당 자리는 안 변했다고', `${d.ninesDecomposed[0].slotsPerKoreanTitle} places to ${d.ninesDecomposed[3].slotsPerKoreanTitle}`);
  본다('대조군을 적었나',
    /The control: Korea's own chart/.test(한줄), '한국 자신의 차트로 자를 검사한다');
  자릿수아무거나('대조군 줄', (n) => `| ${d.home.name} | ${d.home.byYear.map((y) => `${꼴(y.pc, n)}%`).join(' | ')} |`);
  있나('뺀 나라를 이름으로', d.excludedCountry.name);
  본다('까닭을 안 지어냈나',
    한줄.includes('We are also not offering a cause'), '⛔ 없는 까닭을 적지 않는다');
  for (const w of d.peakWeeks.slice(0, 3)) {
    본다(`봉우리 ${w.week}`, 한줄.includes(w.week) && 한줄.includes(String(w.topTitleSlots)),
      `${w.pc}% · ${w.topTitle} ${w.topTitleSlots}`);
  }

  /* ── ⑥ 지면이 수를 손으로 안 박았나 ──────────────────────────────
     면제표 — 낱낱이 까닭을 적는다. 까닭 없이 늘어나면 이 자가 껍데기가 된다. */
  const 면제 = [
    '10',   // 「Netflix top 10」 — 넷플릭스가 붙인 차트 이름이다. 우리가 센 수가 아니다
  ];
  const 박힌 = 박힌수(fs.readFileSync(지면길, 'utf8'), 면제);
  본다('지면이 수를 손으로 박았나', 박힌.length === 0,
    박힌.length ? `🔴 ${박힌.join(' · ')} — 자료에서 읽어야 한다` : '박은 수 0개');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 자리로 잰 한류 — 기사·지면이 자료와 전부 맞다');
  process.exit(틀림 ? 1 : 0);
}
