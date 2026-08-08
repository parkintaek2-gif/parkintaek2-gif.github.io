/**
 * 「한국이 먼저였나」 기사를 자료에 대고 맞춘다.
 *
 *   korea-does-not-chart-it-first   screen — 한국 차트가 앞선 것은 397 중 46
 *
 * ⛔ 이 검사가 특히 지키는 것 다섯 —
 *    ① **세 가지로 잰 것을 셋 다 적었나.** 하나만 적으면 고른 것이 된다.
 *       가장 좁은 셈(제목 겹침까지 뺀 것)이 빠지면 선다.
 *    ② **「같은 주」가 「같은 날」이 아니라고 적었나.** 62%는 발견이 아니라
 *       자료가 그 아래를 못 본다는 뜻이다. 그 문장이 빠지면 이 기사는 거짓말이 된다.
 *    ③ **자리 수가 나라마다 같다고 적었나.** 이 문장이 없으면 손님은
 *       「한국은 자리가 적어서」로 읽는다. 그건 우리가 이미 재서 아니라고 아는 것이다.
 *    ④ **넘어진 설명을 갈래 안에서 견줬나.** 갈래를 섞은 39.0% 대 66.4% 만 적으면
 *       거짓 확인을 실은 것이다. 드라마 안의 80.7% 대 93.1% 이 없으면 선다.
 *    ⑤ **지면이 수를 손으로 안 박았나.** 8월 7일에 448 → 406 이 됐을 때 자료를 읽는 값은
 *       다 따라왔는데 손으로 적은 것만 옛 수로 남았다. 본문에 박힌 수가 하나라도 있으면 선다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/korea-does-not-chart-it-first.md';
const 자료길 = 'src/data/wikitip-home-first.json';
const 지면길 = 'src/pages/wikitip/home-first.astro';

/**
 * 지면 본문에 **손으로 박은 수**가 있나.
 *
 * 🔴 8월 7일에 448편이 406편으로 바뀌었을 때, 지면이 읽는 값은 다 따라왔는데
 *    **주석과 DESC 에 박아 둔 수만 옛것으로 남았다.** 이 검사는 그 자리를 지킨다.
 *
 * ⛔ `<style>` 안(1fr·480px)과 `---` 사이 머리는 안 본다. 자료를 읽는 코드가 거기 있다.
 *    보는 것은 **손님이 읽는 본문뿐**이다.
 */
export function 박힌수(원문, 면제) {
  const 몸 = 원문.split(/^---$/m)[2] ?? '';
  const 본문 = 몸.split('<style>')[0];
  /*
   * 자료에서 온 값은 {…} 안에 있다. 중괄호 덩어리를 통째로 지우고 남은 것만 본다.
   * ⚠ 그다음 **꼬리표를 지운다.** 안 지우면 `<h2>`·`</h4>` 의 2 와 4 를 「박은 수」로 잡는다 —
   *   처음에 그렇게 만들어 스무 개를 헛되이 잡았다. 자가 글을 이기는 꼴이다.
   */
  const 남은 = 본문
    .replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ' ')
    .replace(/<[^>]*>/g, ' ');
  return [...남은.matchAll(/\d[\d,.]*/g)]
    .map((m) => m[0])
    .filter((v) => !면제.includes(v));
}

/**
 * 세 갈래가 편수와 맞나. 자료가 적어 둔 값을 그대로 믿지 않고 다시 더한다.
 * ⛔ 하나라도 없으면 **null** 이다 — 0 이 아니다. 0 은 「없다」고 null 은 「모른다」다.
 */
export function 갈래합(g) {
  if (!g || [g.homeFirst, g.sameWeek, g.awayFirst, g.n].some((v) => typeof v !== 'number')) return null;
  return g.homeFirst + g.sameWeek + g.awayFirst === g.n;
}

/** 비율을 다시 낸다. 자료의 반올림과 한 자리에서 만난다 */
export function 비율(x, n) {
  if (typeof x !== 'number' || !n) return null;
  return +((100 * x) / n).toFixed(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-home-first-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('합이 맞으면 참', 갈래합({ homeFirst: 1, sameWeek: 2, awayFirst: 3, n: 6 }) === true);
  자가('합이 틀리면 거짓', 갈래합({ homeFirst: 1, sameWeek: 2, awayFirst: 3, n: 7 }) === false);
  자가('칸이 비면 null', 갈래합({ homeFirst: 1, sameWeek: 2, n: 3 }) === null);
  자가('아무것도 없으면 null', 갈래합(null) === null);
  자가('비율 한 자리', 비율(46, 257) === 17.9);
  자가('분모가 0 이면 null', 비율(4, 0) === null);
  자가('본문에 박힌 수를 잡는다',
    박힌수('---\nconst a = 397;\n---\n<p>397 titles</p>\n<style>.x{width:1fr}</style>', []).join() === '397');
  자가('중괄호 안은 안 잡는다',
    박힌수('---\nx\n---\n<p>{data.n} titles</p>\n<style>a{b:480px}</style>', []).length === 0);
  자가('면제한 것은 빼고 잡는다',
    박힌수('---\nx\n---\n<p>Top 10 and 397</p>\n<style></style>', ['10']).join() === '397');
  console.log(`한국 먼저 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(40)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 46 ? `${s.slice(0, 46)}…` : s);

  /* ── ① 자료가 스스로 맞나 ── */
  for (const [이름, g] of [['전체', d.all], ['잘림 뺀', d.censoredExcluded], ['가장 좁은', d.cleanest],
    ['드라마', d.byFormat[0]], ['영화', d.byFormat[1]]]) {
    본다(`${이름} 세 갈래 합`, 갈래합(g) === true, `${g.homeFirst}+${g.sameWeek}+${g.awayFirst} = ${g.n}`);
    본다(`${이름} 같은 주 비율`, g.sameWeekPc === 비율(g.sameWeek, g.n), `${g.sameWeekPc}%`);
  }
  본다('둘 다 + 없음 = 편수', d.bothCharted + d.neverAtHome === d.titleCount,
    `${d.bothCharted} + ${d.neverAtHome} = ${d.titleCount}`);
  본다('여섯 나라 전부인데 한국 0', d.allSixNeverHome.length > 0, `${d.allSixNeverHome.length}편`);

  /* ── ② 기사가 자료와 같은 수를 말하나 ── */
  있나('제목의 46 / 397', `for ${d.all.homeFirst} of ${d.titleCount} Korean titles`);
  있나('전체 줄', `| Charted in both | ${d.all.n} | ${d.all.homeFirst} (${d.all.homeFirstPc}%) | **${d.all.sameWeek} (${d.all.sameWeekPc}%)** | ${d.all.awayFirst} (${d.all.awayFirstPc}%) |`);
  있나('잘림 뺀 줄', `| Panel's first week removed | ${d.censoredExcluded.n} | ${d.censoredExcluded.homeFirst} | ${d.censoredExcluded.sameWeek} | ${d.censoredExcluded.awayFirst} |`);
  있나('가장 좁은 줄', `| Shared names also removed | ${d.cleanest.n} | ${d.cleanest.homeFirst} (${d.cleanest.homeFirstPc}%) | **${d.cleanest.sameWeek} (${d.cleanest.sameWeekPc}%)** | ${d.cleanest.awayFirst} (${d.cleanest.awayFirstPc}%) |`);
  있나('한국 기록 없음', `never charted in Korea at all — ${d.neverAtHomePc}%`);
  /**
   * ⚠ 자료는 `14`, 기사는 `14.0%` 로 쓴다. **같은 수다** — 둘 다 받는다.
   *   같은 줄의 다른 값이 72.5% 인데 14 만 소수점이 없으면 표가 들쭉날쭉해진다.
   *   오늘만 자릿수로 네 번 걸렸다. 자가 글의 표기까지 정하면 자가 글을 이긴다.
   */
  const 꼴 = (v, n) => (n === 1 ? Number(v).toFixed(1) : String(v));
  const 자릿수아무거나 = (무엇, 만들기) => 본다(무엇,
    [0, 1].some((n) => 한줄.includes(만들기(n))), 만들기(1).slice(0, 46));
  for (const [이름, f] of [['드라마 줄', d.byFormat[0]], ['영화 줄', d.byFormat[1]]]) {
    자릿수아무거나(이름, (n) => `| ${f.format} | ${f.n} | ${f.homeFirst} (${꼴(f.homeFirstPc, n)}%) | **${f.sameWeek} (${꼴(f.sameWeekPc, n)}%)** | ${f.awayFirst} (${꼴(f.awayFirstPc, n)}%) |`);
  }
  있나('앞선 주 중앙값', `the median lead was **${d.leadWeeks.homeFirstMedian} weeks**`);
  있나('한 주만 앞선 편수', `${d.leadWeeks.homeFirstOneWeek} of the ${d.cleanest.homeFirst} led by exactly one week`);
  있나('뒤진 주 중앙값', `the median was **${d.leadWeeks.awayFirstMedian} weeks**`);
  있나('나라별 자리 수', `**${d.slotsPerCountry.toLocaleString('en-US')} rows each**`);

  /* 여섯 나라 표 — 열다섯 줄이 자료 그대로인가. 하나라도 다르면 선다.
     ⚠ 별표는 마크다운에서 이탤릭이 되므로 기사에서 \* 로 적는다. 견줄 때 그 escape 를 벗긴다. */
  for (const a of d.allSixNeverHome) {
    있나(`여섯 나라 — ${a.title.slice(0, 22)}`, `| ${a.title.replace(/\*/g, '\\*')} | ${a.type} | ${a.firstAway} |`);
  }

  /* ── ③ 넘어진 설명을 갈래 안에서 견줬나 ── */
  const b = d.broadcasterTest;
  본다('방송사 시험이 있나', !!b, b ? b.verdict : '⬜ 없다');
  if (b) {
    있나('드라마 안 — 없음', `| Never charted in Korea (${b.seriesNever.n}) | ${b.seriesNever.withBroadcaster} — **${b.seriesNever.pc}%** |`);
    있나('드라마 안 — 걸린 것', `| Charted in Korea (${b.seriesCharted.n}) | ${b.seriesCharted.withBroadcaster} — **${b.seriesCharted.pc}%** |`);
    있나('갈래 섞은 값도 밝혔나', `**${b.mixedNever.pc.toFixed(1)}% against ${b.mixedCharted.pc}%**`);
    본다('시험이 짐작을 뒤집었나', b.seriesNever.pc < b.seriesCharted.pc,
      `${b.seriesNever.pc}% < ${b.seriesCharted.pc}%`);
  }

  /* ── ④ 못 보는 것을 적었나 ── 수가 아니라 **문장**이다. 빠지면 기사가 거짓말이 된다 */
  본다('「같은 주 ≠ 같은 날」을 적었나',
    /"Same week" is not "same day"/.test(한줄), '제목으로 있어야 한다');
  본다('한 주 아래를 못 본다고 적었나',
    한줄.includes('shorter than the smallest unit our source publishes'), '한계를 발견으로 팔지 않는다');
  본다('앞을 안 판다고 적었나',
    한줄.includes('It cannot tell you whether the next Korean title'), '/terms 와 같은 말이라야 한다');
  본다('겹친 제목을 세어 적었나',
    한줄.includes(`nine titles whose name is shared`), `자료에는 ${d.sharedNameCount}편`);
  본다('겹친 편수가 자료와 같나', d.sharedNameCount === 9, `${d.sharedNameCount}편`);

  /* ── ⑤ 지면이 수를 손으로 안 박았나 ────────────────────────────
     면제표 — **낱낱이 까닭을 적는다.** 까닭 없이 늘어나면 이 자가 껍데기가 된다. */
  const 면제 = [
    '10',   // 「Netflix Top 10」 — 넷플릭스가 붙인 차트 이름이다. 우리가 센 수가 아니다
  ];
  const 박힌 = 박힌수(fs.readFileSync(지면길, 'utf8'), 면제);
  본다('지면이 수를 손으로 박았나', 박힌.length === 0,
    박힌.length ? `🔴 ${박힌.join(' · ')} — 자료에서 읽어야 한다` : '박은 수 0개');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 한국 먼저 기사·지면 — 자료와 전부 맞다');
  process.exit(틀림 ? 1 : 0);
}
