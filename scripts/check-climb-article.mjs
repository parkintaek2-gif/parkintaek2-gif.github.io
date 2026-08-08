/**
 * 「들어온 뒤에 오르나」 기사와 지면을 자료에 대고 맞춘다.
 *
 *   korean-titles-climb   screen — 한국 작품은 57.3% 가 첫 주보다 높이 오른다
 *   /climb                같은 자료를 내는 지면
 *
 * ⛔ 이 검사가 특히 지키는 것 넷 —
 *    ① **대조군 표(머문 주 띠)가 있나.** 「오래 머물면 오를 기회도 많다」가 이 기사의 가장 큰 구멍이다.
 *    ② **다섯 띠가 다 있나.** 넷만 적으면 고른 것이다. 한 띠라도 빠지면 선다.
 *    ③ **「입소문」이라 안 썼나.** 우리가 본 것은 순위가 올랐다는 것뿐이다.
 *    ④ **얼마나 높이 올랐는지는 안 쟀다고 적었나.** 10→9 와 10→1 이 여기서는 같다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/korean-titles-climb.md';
const 자료길 = 'src/data/wikitip-climb.json';
const 지면길 = 'src/pages/wikitip/climb.astro';

/** 오름과 첫주꼭대기는 서로의 뒷면이다. 합이 달리기 수와 같아야 한다 */
export function 뒷면맞나(g) {
  if (!g || [g.climbed, g.peakedFirstWeek, g.runs].some((v) => typeof v !== 'number')) return null;
  return g.climbed + g.peakedFirstWeek === g.runs;
}

/** 차이를 다시 낸다 */
export function 차이(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  return +(a - b).toFixed(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-climb-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('뒷면이 맞으면 참', 뒷면맞나({ climbed: 3, peakedFirstWeek: 7, runs: 10 }) === true);
  자가('뒷면이 틀리면 거짓', 뒷면맞나({ climbed: 3, peakedFirstWeek: 6, runs: 10 }) === false);
  자가('칸이 비면 null', 뒷면맞나({ climbed: 3, runs: 10 }) === null);
  자가('차이 한 자리', 차이(57.3, 40.5) === 16.8);
  자가('한쪽이 없으면 null', 차이(57.3, null) === null);
  console.log(`오름 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  const 민줄 = 한줄.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(40)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 민줄.includes(s), s.length > 44 ? `${s.slice(0, 44)}…` : s);

  /* ── ① 자료가 스스로 맞나 ── */
  for (const [이름, g] of [['한국', d.korean], ['그 밖', d.other]]) {
    본다(`${이름} 오름+첫주가 달리기 수`, 뒷면맞나(g) === true,
      `${g.climbed} + ${g.peakedFirstWeek} = ${g.runs}`);
  }
  본다('한국+그 밖이 전체와 같나', d.korean.runs + d.other.runs === d.runs,
    `${d.korean.runs} + ${d.other.runs} = ${d.runs}`);
  본다('차이가 두 비율에서 나오나', d.gap === 차이(d.korean.climbedPc, d.other.climbedPc), `${d.gap}p`);
  본다('띠 합이 한국 달리기와 같나',
    d.bands.reduce((s, b) => s + b.korean.runs, 0) === d.korean.runs,
    `${d.bands.reduce((s, b) => s + b.korean.runs, 0)} = ${d.korean.runs}`);
  for (const b of d.bands) {
    본다(`띠 ${b.label} 차이`, b.gap === 차이(b.korean.climbedPc, b.other.climbedPc), `${b.gap}p`);
  }
  본다('길이 대조군을 통과했나', d.survivesLengthControl === d.bands.every((b) => b.gap > 0),
    String(d.survivesLengthControl));

  /* ── ② 기사가 자료와 같은 수를 말하나 ── */
  있나('제목의 두 비율', `${d.korean.climbedPc}% of Korean chart runs reach a higher rank`);
  있나('달리기 수', `We read **${d.runs.toLocaleString('en-US')} runs**`.replace(/\*/g, ''));
  있나('한국 줄', `| Korean titles | ${d.korean.runs.toLocaleString('en-US')} | ${d.korean.climbedPc}% | ${d.korean.peakedFirstWeekPc}% |`);
  있나('그 밖 줄', `| Everything else | ${d.other.runs.toLocaleString('en-US')} | ${d.other.climbedPc}% | ${d.other.peakedFirstWeekPc}% |`);
  있나('머문 주', `${d.korean.meanWeeks} weeks on average against ${d.other.meanWeeks}`);

  /* ── ③ 대조군 — 다섯 띠가 **다** 있나 ── */
  본다('대조군 절이 있나', /The obvious objection, and what happens to it/.test(한줄), '길이를 묶어 다시 견준다');
  /* ⚠ 자료는 `69`, 기사는 `69.0%` 로 쓴다. **같은 수다** — 둘 다 받는다.
     같은 표의 다른 값이 65.2% 인데 69 만 소수점이 없으면 표가 들쭉날쭉해진다.
     오늘만 이 자리에서 여섯 번 걸렸다. 자릿수까지 자가 정하면 자가 글을 이긴다. */
  const 꼴 = (v, n) => (n === 1 ? Number(v).toFixed(1) : String(v));
  const 자릿수아무거나 = (무엇, 만들기) => 본다(무엇,
    [0, 1].some((n) => 민줄.includes(만들기(n))), 만들기(1).slice(0, 44));
  for (const b of d.bands) {
    자릿수아무거나(`띠 줄 — ${b.label}`,
      (n) => `| ${b.label} | ${꼴(b.korean.climbedPc, n)}% | ${꼴(b.other.climbedPc, n)}% | +${꼴(b.gap, n)} |`);
  }
  본다('띠가 다섯인가', d.bands.length === 5, `${d.bands.length}개`);
  for (const f of d.formats) {
    자릿수아무거나(`갈래 줄 — ${f.format}`,
      (n) => `| ${f.format} | ${꼴(f.korean.climbedPc, n)}% | ${꼴(f.other.climbedPc, n)}% | +${꼴(f.gap, n)} |`);
  }

  /* ── ④ 안 한 말을 안 했나 ── */
  본다('「입소문」을 발견으로 안 썼나',
    한줄.includes('We are not saying this is word of mouth'), '⛔ 우리가 본 것은 순위뿐이다');
  본다('순위가 오르는 두 길을 적었나',
    한줄.includes('the titles above it lost them'), '내가 올라도 오르고 위엣것이 내려도 오른다');
  본다('얼마나 높이는 안 쟀다고 적었나',
    한줄.includes('not by how much'), '10→9 와 10→1 이 같다');
  본다('한 주짜리를 뺀 까닭을 적었나',
    /single week are excluded/.test(한줄) || /single week cannot climb/.test(한줄),
    '오를 자리가 없는 것을 「안 올랐다」로 세지 않는다');

  /* ── ⑤ 지면이 수를 손으로 안 박았나 ── */
  const 몸 = fs.readFileSync(지면길, 'utf8').split(/^---$/m)[2] ?? '';
  const 박힌 = [...몸.split('<style>')[0]
    .replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .matchAll(/\d[\d,.]*/g)]
    .map((m) => m[0].replace(/[,.]+$/, ''))
    /* 면제 — 「Netflix top 10」은 넷플릭스가 붙인 차트 이름이지 우리가 센 수가 아니다 */
    .filter((v) => v !== '10');
  본다('지면이 수를 손으로 박았나', 박힌.length === 0,
    박힌.length ? `🔴 ${박힌.join(' · ')}` : '박은 수 0개');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 오름 기사·지면 — 자료와 전부 맞다');
  process.exit(틀림 ? 1 : 0);
}
