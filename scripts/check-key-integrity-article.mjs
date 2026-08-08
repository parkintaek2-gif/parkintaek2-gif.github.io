/**
 * 「주간 열 편은 열 편이 아니다」 기사를 자료에 대고 맞춘다.
 *
 *   a-weekly-top-ten-is-not-ten-titles   screen — 제목은 열쇠가 아니다
 *
 * ⛔ 수를 손으로 안 적는다. `src/data/wikitip-key-integrity.json` 에서 다시 읽어 기사와 맞춘다.
 *    (원자료 49만 줄을 매번 다시 읽지는 않는다 — 그건 `collect-chart-key-integrity.mjs` 몫이다)
 *
 * ⚠ 이 기사는 **수보다 까닭이 중요하다.** 「겹친다」가 아니라 「시즌이 설명한다」가 결론이고,
 *    남는 25쌍이 이름 충돌이라는 것이 요점이다. 그래서 수만 재지 않고 **문장도 잰다** —
 *    까닭을 지운 채 수만 남으면 이 기사는 「넷플릭스 자료가 더럽다」는 틀린 글이 된다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/a-weekly-top-ten-is-not-ten-titles.md';
const 자료길 = 'src/data/wikitip-key-integrity.json';
const 천 = (n) => Number(n).toLocaleString('en-US');

/** 기사가 낸 표에서 「N | M」 꼴 줄을 읽는다. 표가 바뀌면 여기서 걸린다. */
export function 표읽기(한줄, 왼쪽) {
  /* ⛔ 굵게(**7**)·기울임(*Inheritance*)이 붙은 칸을 못 읽어 「기사 null」로 나왔다.
     기사가 강조를 붙이는 것은 정상이다. **재기 전에 별표를 걷는다.** */
  const 민 = 한줄.replace(/\*/g, '');
  const m = 민.match(new RegExp(`\\|\\s*${왼쪽}\\s*\\|\\s*([\\d,]+)\\s*\\|`));
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

if (process.argv[1] && process.argv[1].endsWith('check-key-integrity-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('표에서 수를 읽는다', 표읽기('| 3 | 3,629 |', '3') === 3629);
  자가('굵은 표시가 있어도 읽는다', 표읽기('| **7** | **3** |', '7') === 3);
  자가('기울임 제목도 읽는다', 표읽기('| *Inheritance* | 21 |', 'Inheritance') === 21);
  자가('없는 줄은 null', 표읽기('| 2 | 5 |', '9') === null);
  console.log(`열쇠 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(자료길)) {
    console.log(`⛔ ${자료길} 이 없다 — node scripts/collect-chart-key-integrity.mjs 를 먼저 돌린다`);
    process.exit(1);
  }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 한줄 = 원.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(34)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 46 ? `${s.slice(0, 46)}…` : s);

  /* ── ① 크기 ── */
  본다('원자료 줄수', 한줄.includes(`${천(d.rows)} of those rows`) || 한줄.includes(`${천(d.rows)} rows`), 천(d.rows));
  본다('자리 겹침이 0이다', d.duplicateSlots === 0 && d.duplicateWholeRows === 0,
    `자리 ${d.duplicateSlots} · 온 줄 ${d.duplicateWholeRows}`);
  있나('자리가 한 번씩이라고 적었나', `${천(d.rows)} rows, ${천(d.distinctSlots)} slots`);

  /* ── ② 제목을 열쇠로 쓰면 ── */
  있나('한 목록에 두 줄 이상인 칸수', `${천(d.listsWithARepeatedTitle)} of those combinations`);
  있나('더 나오는 줄수', `${천(d.extraRowsWithList)} rows more`);
  있나('그 비율', `${d.extraRowsPc}% of the file`);
  있나('제목·나라 수', `${천(d.titlesAffected)} titles across ${d.countriesAffected} countries`);

  /* ── ③ 칸 분포 — 표가 자료와 같은가 ── */
  for (const { places, times } of d.placesDistribution) {
    const 읽은 = 표읽기(한줄, String(places));
    본다(`${places}칸을 차지한 횟수`, 읽은 === times, `기사 ${읽은} · 자료 ${천(times)}`);
  }
  본다('가장 많이 차지한 칸수', Math.max(...d.placesDistribution.map((x) => x.places)) === 7, '7칸');

  /* ── ④ 시즌이 설명한다 — 이 기사의 결론 ── */
  있나('시즌이 설명하는 줄수', `${천(d.explainedBySeason)} of them`);
  있나('설명 비율', `${d.explainedBySeasonPc}%`);
  본다('시즌을 넣으면 남는 수', d.extraRowsWithSeason === d.nameCollisions.pairs,
    `남는 ${d.nameCollisions.pairs}쌍`);
  있나('남는 수를 적었나', `fall to **${d.nameCollisions.pairs}**`);
  /* ⛔ 까닭이 사라지면 이 기사는 「자료가 더럽다」는 틀린 글이 된다 */
  있나('제목이 열쇠가 아니라고 말하나', 'A title is not a key');
  있나('자료 탓이 아니라고 말하나', 'not an error in the file');

  /* ── ⑤ 큰 것 두 개 — 사람이 기억하는 자리 ── */
  {
    const friends = d.biggest.filter((b) => b.title === 'Friends' && b.places === 7);
    본다('Friends 가 7칸을 차지한 횟수', friends.length === 3 && 한줄.includes('seven of Jordan'),
      `${friends.length}건 · ${friends.map((f) => `${f.country} ${f.week}`).join(' · ')}`);
    const rookie = d.biggest.filter((b) => b.title === 'The Rookie' && b.places === 6);
    본다('The Rookie 가 6칸을 넉 주', rookie.length === 4 && 한줄.includes('four consecutive weeks'),
      `${rookie.length}주 · ${rookie[0]?.country}`);
    본다('여섯 칸 이상 건수', d.biggestCount === 47, `${d.biggestCount}건`);
  }

  /* ── ⑥ 남은 25쌍 — 이름 충돌 ── */
  있나('몇 주째 칸이 갈라 준 쌍', `separates **${d.nameCollisions.separatedByWeeksOnChart} of the ${d.nameCollisions.pairs}**`);
  본다('못 가린 쌍을 뺐다고 적었나', 한줄.includes('remaining two match on weeks-on-chart')
    && d.nameCollisions.unresolvable === 2, `${d.nameCollisions.unresolvable}쌍`);
  for (const { title, pairs } of d.nameCollisions.byTitle) {
    본다(`${title} 쌍수`, 표읽기(한줄, title) === pairs, `기사 ${표읽기(한줄, title)} · 자료 ${pairs}`);
  }
  {
    /* 칠레의 Inheritance — 등수와 몇 주째가 기사와 같은가 */
    const 칠레 = d.nameCollisions.examples.find((e) => e.title === 'Inheritance' && e.country === 'Chile');
    본다('칠레 Inheritance 등수·주차',
      !!칠레 && 칠레.ranks.join(',') === '2,3' && 칠레.weeksOnChart.join(',') === '4,1'
      && 한줄.includes('rank 2 in its fourth week') && 한줄.includes('rank 3 in its first'),
      칠레 ? `등수 ${칠레.ranks} · 주차 ${칠레.weeksOnChart}` : '없다');
    const 멕시코 = d.nameCollisions.examples.find((e) => e.title === 'Inheritance' && e.country === 'Mexico');
    본다('멕시코 Inheritance 등수',
      !!멕시코 && 멕시코.ranks.join(',') === '2,5' && 한줄.includes('ranks 2 and 5'),
      멕시코 ? `등수 ${멕시코.ranks}` : '없다');
  }

  /* ── ⑦ 우리 패널이 얼마나 노출됐나 ── */
  있나('패널이 읽은 줄수', `${천(d.ourPanel.rowsRead)} rows**`);
  있나('패널의 서로 다른 주', `**${천(d.ourPanel.distinctTitleCountryWeeks)} distinct title-country-weeks**`);
  있나('줄로 세면 더 나오는 수', `**${천(d.ourPanel.extraRowsIfCountingRows)} more`);
  있나('그 비율', `${d.ourPanel.extraRowsPc}%`);
  본다('가장 심한 것이 Squid Game 인가',
    d.ourPanel.worst[0].title === 'Squid Game' && d.ourPanel.worst[0].rows === 3
    && 한줄.includes('*Squid Game* occupies three places'),
    `${d.ourPanel.worst[0].title} ${d.ourPanel.worst[0].rows}줄`);

  /* ── ⑧ 못 하는 것을 말하나 ── */
  있나('어느 작품인지 못 정한다고 말하나', 'can say two works are there');
  있나('시간은 세계 목록만이라고 말하나', 'viewing hours for its global list only');

  console.log(틀림 ? `\n⛔ 열쇠 기사 — 안 맞는 것 ${틀림}건` : '\n✅ 열쇠 기사 — 전부 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
