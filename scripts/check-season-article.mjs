/**
 * 「철이 없다」 기사와 /world-share 의 달 표를 자료에 대고 맞춘다.
 *
 *   there-is-no-k-drama-season   screen — 달 폭 2.2p · 주 폭 14.1p
 *
 * ⛔ 이 검사가 특히 지키는 것 넷 —
 *    ① **열두 달이 다 있나.** 열한 달만 적으면 고른 것이다.
 *    ② **으뜸 한 편을 뺀 칸이 있나.** 그 칸이 없으면 왼쪽 칸만 보고 「철이 있다」로 읽힌다.
 *    ③ **주 폭과 견줬나.** 2.2p 를 혼자 두면 커 보인다. 14.1p 옆에 놔야 작아 보인다.
 *    ④ **9월을 좋은 달이라 안 했나.** 우리가 설명 못 하는 것을 계획 도구로 팔지 않는다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/there-is-no-k-drama-season.md';
const 자료길 = 'src/data/wikitip-season.json';
const 지면길 = 'src/pages/wikitip/world-share.astro';

/** 폭을 다시 낸다 */
export function 폭(값들) {
  if (!Array.isArray(값들) || !값들.length) return null;
  if (값들.some((v) => typeof v !== 'number')) return null;
  return +(Math.max(...값들) - Math.min(...값들)).toFixed(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-season-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('폭을 한 자리로', 폭([6.7, 8.9, 7.7]) === 2.2);
  자가('하나뿐이면 0', 폭([7]) === 0);
  자가('빈 것은 null', 폭([]) === null);
  자가('빈 칸이 섞이면 null', 폭([1, null]) === null);
  console.log(`철 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  const 민줄 = 한줄.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(40)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 민줄.includes(s), s.length > 44 ? `${s.slice(0, 44)}…` : s);
  /* ⚠ 자료는 7 · 기사는 7.0% 로 쓴다. **같은 수다** — 둘 다 받는다.
     표 안에서 7 만 소수점이 없으면 들쭉날쭉해진다. 오늘 이 자리에서만 여덟 번 걸렸다. */
  const 꼴 = (v, n) => (n === 1 ? Number(v).toFixed(1) : String(v));
  const 자릿수아무거나 = (무엇, 만들기) => 본다(무엇,
    [0, 1].some((n) => 민줄.includes(만들기(n))), 만들기(1).slice(0, 44));
  /* 셈은 글자로 쓰기도 한다(five). 숫자와 낱말을 둘 다 받는다 */
  const 낱말 = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
  const 수나낱말 = (무엇, 만들기) => 본다(무엇,
    [String, (v) => 낱말[v] ?? String(v)].some((f) => 민줄.includes(만들기(f))), 만들기(String).slice(0, 44));

  /* ── ① 자료가 스스로 맞나 ── */
  본다('달이 열둘인가', d.months.length === 12, `${d.months.length}개`);
  본다('달 폭이 열두 값에서 나오나', d.monthRange === 폭(d.months.map((m) => m.pc)), `${d.monthRange}p`);
  본다('뺀 폭이 열두 값에서 나오나',
    d.monthRangeWithoutTop === 폭(d.months.map((m) => m.pcWithoutTop)), `${d.monthRangeWithoutTop}p`);
  본다('주 폭이 달 폭보다 넓나', d.weekRange > d.monthRange, `${d.weekRange}p > ${d.monthRange}p`);
  본다('배수가 두 폭에서 나오나',
    d.timesWeekBeatsMonth === +(d.weekRange / d.monthRange).toFixed(1), `${d.timesWeekBeatsMonth}배`);
  for (const m of d.months) {
    if (m.topTitleSlots > m.korean) 본다(`${m.name} 으뜸이 그 달보다 큼`, false, `${m.topTitleSlots} > ${m.korean}`);
  }
  본다('판정이 두 폭과 맞나',
    (d.verdict === 'the swing is partly one title') === (d.monthRangeWithoutTop < d.monthRange),
    d.verdict);

  /* ── ② 기사가 열두 달을 **다** 적었나 ── */
  for (const m of d.months) {
    자릿수아무거나(`달 줄 — ${m.name}`, (n) => `| ${m.name} | ${꼴(m.pc, n)}% | ${꼴(m.pcWithoutTop, n)}% |`);
  }
  있나('제목의 두 폭', `The Korean share moves ${d.monthRange} points across twelve months — and ${d.weekRange} in a week`);
  있나('해 평균', `The whole year sits at ${d.yearPc}%`);
  있나('달 폭 한 줄', `That is the entire range: ${d.monthRange} points`);

  /* ── ③ 주 폭과 견줬나 ── */
  자릿수아무거나('주 최고·최저', (n) => `highest single week at ${꼴(d.weekHigh.pc, n)}% and the lowest at ${꼴(d.weekLow.pc, n)}%`);
  있나('배수', `${d.weekRange} points, ${d.timesWeekBeatsMonth} times the monthly one`);

  /* ── ④ 대조군을 적었나 — 뺀 뒤 넓어졌다는 것까지 ── */
  수나낱말('오징어 달 수', (f) => `largest Korean title in ${f(d.mostFrequentTopTitle.months)} of the twelve months`);
  있나('뺀 뒤 폭', `The band goes from ${d.monthRange} points to ${d.monthRangeWithoutTop}`);
  본다('뺀 뒤 넓어졌다고 적었나',
    한줄.includes('slightly *wider* than before') || 민줄.includes('slightly wider than before'),
    '⛔ 좁아진 것처럼 쓰면 안 된다');
  본다('설명 못 한다고 적었나',
    한줄.includes('cannot attribute to a single release'), '남은 것에 까닭을 안 붙인다');

  /* ── ⑤ 계획 도구로 팔지 않았나 ── */
  본다('9월을 좋은 달이라 안 했나',
    한줄.includes('It does not say September is a good month'), '⛔ 2.2p 는 계획 도구가 아니다');
  본다('공개일이 아니라고 적었나',
    한줄.includes('Netflix publishes charts, not'), '차트에 걸린 주를 센 것이다');

  /* ── ⑥ 지면에도 그 표가 있나 — 기사만 있으면 표가 뒤에 없는 것이다 ── */
  const 지면 = fs.readFileSync(지면길, 'utf8');
  본다('지면이 달 자료를 읽나', 지면.includes('wikitip-season'), '/world-share');
  본다('지면에 「뺀 칸」이 있나', 지면.includes('pcWithoutTop'), '왼쪽 칸만 두면 철이 있다고 읽힌다');
  본다('지면이 주 폭과 견주나', 지면.includes('timesWeekBeatsMonth'), '2.2p 를 혼자 두지 않는다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 철 기사·지면 — 자료와 전부 맞다');
  process.exit(틀림 ? 1 : 0);
}
