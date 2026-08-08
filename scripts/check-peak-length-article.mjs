/**
 * 「#1 은 대부분 길이였다」 기사와 고친 /staying-power 를 자료에 대고 맞춘다.
 *
 *   reaching-number-one-is-mostly-length   screen — 결과로 표본을 고르면 그 표본이 대답한다
 *
 * ⛔ 이 검사가 지키는 것은 **수가 아니라 표본**이다.
 *    수는 맞는데 「상위 50편으로 셌다」로 되돌아가면 같은 잘못이 되풀이된다.
 *    그래서 `peakGroups.n` 이 전체 편수와 같은지 본다 — 50 이 되면 선다.
 *
 * ⚠ 평균만 남고 중앙값이 사라지는 것도 잡는다. 한 편이 5.05bn 을 가져가는 분포라
 *    평균만 내면 그 한 편을 설명하는 글이 된다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/reaching-number-one-is-mostly-length.md';
const 지면길 = 'src/pages/wikitip/staying-power.astro';
const 자료길 = 'src/data/wikitip-staying-power.json';
const 정정길 = 'src/data/wikitip-page-corrections.json';

/** 시간을 지면과 같은 꼴로 적는다 — `M()` 이 백만 단위로 소수 한 자리다 */
export const 백만 = (v) => `${(v / 1e6).toFixed(1)}m`;
/** 띠에서 배수를 다시 낸다. 자료가 준 값을 그대로 믿지 않고 **중앙값에서 다시 센다** */
export function 배수(topMedian, restMedian) {
  if (!topMedian || !restMedian) return null;
  return +(topMedian / restMedian).toFixed(2);
}

if (process.argv[1] && process.argv[1].endsWith('check-peak-length-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('백만 꼴', 백만(103_400_000) === '103.4m');
  자가('배수를 두 자리로', 배수(154_300_000, 128_900_000) === 1.2);
  자가('한쪽이 비면 배수가 없다', 배수(0, 5) === null);
  console.log(`봉우리·길이 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  /**
   * ⚠ 기사의 음수 부호는 **U+2212(−)** 이고 계산 결과는 ASCII 하이픈이다. **그것만** 바꾼다 —
   *   붙임표(–)까지 같이 바꿨더니 띠 이름 「3–5 weeks」가 「3-5 weeks」가 되어 표가 다 어긋났다.
   */
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ').replace(/−/g, '-');
  const 지면 = fs.readFileSync(지면길, 'utf8');
  const c = JSON.parse(fs.readFileSync(정정길, 'utf8'));

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(36)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 44 ? `${s.slice(0, 44)}…` : s);

  const p1 = d.peakGroups[0];
  const pn = d.peakGroups[1];

  /* ── ① 표본 — 이 검사의 핵심이다 ── */
  본다('무리를 전체로 셌나', p1.n + pn.n === d.titleCount,
    `${p1.n} + ${pn.n} = ${p1.n + pn.n} · 전체 ${d.titleCount}`);
  본다('상위 50편으로 안 셌나', p1.n + pn.n !== d.shown, `표본 ${p1.n + pn.n} · 상위 ${d.shown}`);
  본다('옛 값을 지웠나 남겼나', Array.isArray(d.peakGroupsTop50Only) && d.peakGroupsTop50Only[0].n === 26,
    '되짚을 수 있게 남아 있다');
  본다('지면이 옛 키를 안 쓴다', !지면.includes('peakGroupsTop50Only'), '지면은 새 키만 쓴다');

  /* ── ② 중앙값이 살아 있나 ── */
  본다('무리에 중앙값이 있나', typeof p1.medianHours === 'number' && typeof p1.medianWeeks === 'number',
    `${백만(p1.medianHours)} · ${p1.medianWeeks}주`);
  본다('지면이 중앙값을 보여 주나', 지면.includes('medianHours') && 지면.includes('Median hours'), '표 머리에 있다');

  /* ── ③ 기사가 자료와 같은 수를 말하나 ── */
  있나('#1 편수', `| **#1** | ${p1.n} |`);
  있나('#1 중앙 시간', `**${백만(p1.medianHours)}**`);
  있나('#1 아닌 것 편수·시간', `| ${pn.n} | ${백만(pn.medianHours)} |`);
  {
    /* ⚠ 기사는 소수 한 자리로 적는다(4.3×). 자료는 두 자리(4.29)다. **한 자리로 맞춰 본다** —
       자릿수가 달라 「틀렸다」고 하면 자가 사람을 이기게 된다. */
    const 재 = 배수(p1.medianHours, pn.medianHours);
    본다('중앙값 배수', 한줄.includes(`**${재.toFixed(1)}× on medians**`), `${재} → ${재.toFixed(1)}×`);
  }
  {
    /* 기사는 문장 안에서 수를 낱말로도 쓴다. 숫자와 낱말을 **둘 다** 받는다 */
    const 낱 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const 꼴 = [`**${p1.medianWeeks} weeks against ${pn.medianWeeks}**`,
      `**${낱[p1.medianWeeks]} weeks against ${낱[pn.medianWeeks]}**`];
    본다('주수 대비', 꼴.some((s) => 한줄.includes(s)), `${p1.medianWeeks}주 대 ${pn.medianWeeks}주`);
  }

  /* ── ④ 띠 — 길이를 묶으면 남는 것 ── */
  for (const b of d.weeksBands) {
    const 셈 = 배수(b.topMedianHours, b.restMedianHours);
    const 줄 = `| ${b.label} | ${b.topN} | ${백만(b.topMedianHours)} | ${b.restN} | ${백만(b.restMedianHours)} |`;
    본다(`띠 ${b.label}`, 한줄.includes(줄), 셈 ? `${셈}×` : '배수 없음');
    if (b.ratio !== null) 본다(`  ${b.label} 배수가 자료와 같나`, b.ratio === 셈, `자료 ${b.ratio} · 다시 센 것 ${셈}`);
  }
  const 육십 = d.weeksBands.find((b) => b.label === '6–10 weeks');
  /* 1.2 와 1.20 은 같은 수다. JSON 은 꼬리 0 을 지우고 기사는 두 자리로 쓴다 — 둘 다 받는다 */
  본다('길이를 묶으면 남는 배수',
    [`**${육십.ratio}×** the median hours`, `**${육십.ratio.toFixed(2)}×** the median hours`]
      .some((s) => 한줄.includes(s)),
    `${육십.ratio}×`);
  있나('대부분이 길이였다고 말하나', 'Most of what we had attributed to the peak was length');
  /* ⛔ 한 편짜리 띠를 근거로 쓰지 않는다고 말했나 */
  본다('1~2주 띠를 안 읽는다고 적었나',
    한줄.includes('one title on the left of it and we do not read it') && 육십 && d.weeksBands[0].topN === 1,
    `1~2주 띠 #1 ${d.weeksBands[0].topN}편`);

  /* ── ⑤ 등수가 순서대로 안 간다 ── */
  const r1 = d.peakByRank[0];
  const r2 = d.peakByRank[1];
  본다('#2 가 #1 보다 중앙이 높나', r2.medianHours > r1.medianHours,
    `#1 ${백만(r1.medianHours)} · #2 ${백만(r2.medianHours)}`);
  있나('그 사실을 적었나', `| #2 | ${r2.n} | **${백만(r2.medianHours)}** |`);
  있나('줄세우기가 아니라고 말하나', 'it is not a ranking');

  /* ── ⑥ 상관 — 하나를 원인이라고 부르지 않았나 ── */
  있나('주수 상관', `**${d.correlations.weeksVsLogHours}**`);
  있나('봉우리 상관', `**${d.correlations.peakVsLogHours}**`);
  /* ⛔ 부호를 떼고 찾으면 「**0.474**」를 찾게 되는데 기사는 「**−0.474**」다. 부호째 찾는다 */
  있나('둘끼리 상관', `**${d.correlations.weeksVsPeak}**`);
  있나('원인이라고 안 한다고 적었나', 'we can hand you a single number and call');

  /* ── ⑦ 한 주짜리 ── */
  본다('한 주만 뜬 편수·비율',
    한줄.includes(`**${(100 * d.oneWeekOnly / d.titleCount).toFixed(1)}% of Korean titles`)
    && 한줄.includes(`${d.oneWeekOnly} of ${d.titleCount}`),
    `${d.oneWeekOnly} / ${d.titleCount}`);

  /* ── ⑧ 정정 기록에 남았나 ── */
  {
    const row = c.rows.find((r) => r.path === '/staying-power' && r.date === '2026-08-08');
    본다('지면 정정이 기록됐나', !!row && row.cause === 'selected-on-outcome', row ? row.cause : '없다');
    본다('그 원인이 사전에 있나', !!c.causes['selected-on-outcome'], '있다');
    본다('기사도 기록됐나',
      c.articleCauses.some((a) => a.slug === 'reaching-number-one-is-mostly-length'), '있다');
  }

  /* ── ⑨ 지면에서 틀린 문장이 사라졌나 ── */
  {
    const 옛문장 = ['doubles the hours. It adds no weeks', 'it is not a foothold that keeps'];
    for (const s of 옛문장) {
      /* 주석 안에 「이랬다」로 남는 것은 허용한다 — 지운 자국이 남는 편이 낫다.
         ⛔ 2026-08-08 11:0x. HTML 주석만 걷었더니, 내부 메모가 새는 것을 막느라
            같은 주석을 **JSX 주석**으로 바꾼 뒤 「옛 문장이 남았다」로 잘못 나왔다.
            지면은 멀쩡했다 — 두 꼴을 다 걷는다. */
      const 본문 = 지면.replace(/<!--[\s\S]*?-->/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      본다(`옛 문장이 지면에 남았나 — ${s.slice(0, 22)}`, !본문.includes(s), 본문.includes(s) ? '남았다' : '없다');
    }
  }

  console.log(틀림 ? `\n⛔ 봉우리·길이 — 안 맞는 것 ${틀림}건` : '\n✅ 봉우리·길이 — 전부 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
