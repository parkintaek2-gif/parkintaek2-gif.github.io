/**
 * 「같은 꼴」 기사를 자료에 대고 맞춘다.
 *
 *   actors-and-idols-same-shape   people — 크기를 맞추면 배우와 K팝이 같은 꼴이다
 *
 * ⛔ 이 검사가 특히 지키는 것 넷 —
 *    ① **크기 안 맞춘 값만 적지 않았나.** 5.5% 대 6.2% 만 내면 이 기사는 정반대 기사가 된다.
 *       띠 표와 맞춘 값이 둘 다 있어야 한다.
 *    ② **다섯 띠가 다 있나.** 아래 띠(16.7%)를 빼면 「크기 탓」이라는 설명이 사라진다.
 *    ③ **두 창이 사흘 어긋난 것을 적었나.** 안 적으면 사람별로 읽는 사람이 생긴다.
 *    ④ **맨 위에서 다시 오르는 것에 까닭을 안 붙였나.** 우리는 그 까닭을 안 쟀다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/actors-and-idols-same-shape.md';
const 자료길 = 'src/data/wikitip-peak-day.json';

/** 차이를 다시 낸다 */
export function 차이(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  return +(a - b).toFixed(1);
}

/** 「같은 꼴」이라 부를 수 있나 — 한 점 미만이면 같다고 본다 */
export function 같은꼴(차) {
  if (typeof 차 !== 'number') return null;
  return Math.abs(차) < 1;
}

if (process.argv[1] && process.argv[1].endsWith('check-peak-day-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('차이 한 자리', 차이(5, 5.1) === -0.1);
  자가('한쪽이 없으면 null', 차이(5, null) === null);
  자가('0.1 은 같은 꼴', 같은꼴(-0.1) === true);
  자가('1.2 는 아니다', 같은꼴(1.2) === false);
  자가('수가 아니면 null', 같은꼴('x') === null);
  console.log(`같은 꼴 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원문 = fs.readFileSync(기사길, 'utf8').replace(/\r\n/g, '\n');
  const 한줄 = 원문.replace(/\s+/g, ' ');
  const 민줄 = 한줄.replace(/\*/g, '');
  /**
   * 🔴 앞말(frontmatter)을 뺀 **본문만**.
   *
   * 「두 창이 사흘 어긋난다」를 본문에서 지워도 자가 통과했다. `excluded:` 에 같은 말이
   * 적혀 있어서였다. **앞말은 손님이 안 읽는다.** 손님이 읽는 자리에 있는지를 물어야
   * 그 문장이 지켜진다. 깨뜨려 보지 않았으면 이 구멍을 못 봤다.
   */
  const 본문 = 원문.split(/^---$/m).slice(2).join('---').replace(/\s+/g, ' ');
  const 민본문 = 본문.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(40)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 민줄.includes(s), s.length > 44 ? `${s.slice(0, 44)}…` : s);
  /* ⚠ 자료는 5 · 기사는 5.0% 로 쓴다. 같은 수다 — 둘 다 받는다 */
  const 꼴 = (v, n) => (n === 1 ? Number(v).toFixed(1) : String(v));
  const 자릿수아무거나 = (무엇, 만들기) => 본다(무엇,
    [0, 1].some((n) => 민줄.includes(만들기(n))), 만들기(1).slice(0, 44));

  /* ── ① 자료가 스스로 맞나 ── */
  본다('맞춘 차이가 두 값에서 나오나',
    d.matchedGap === 차이(d.matchedActors.medianPeakPc, d.matchedKpop.medianPeakPc), `${d.matchedGap}p`);
  본다('날것 차이가 두 값에서 나오나',
    d.rawGap === 차이(d.rawActors.medianPeakPc, d.rawKpop.medianPeakPc), `${d.rawGap}p`);
  본다('판정이 차이와 맞나',
    (d.verdict.startsWith('the two groups are the same')) === 같은꼴(d.matchedGap), d.verdict);
  본다('띠 합이 배우 수와 같나',
    d.bands.reduce((s, b) => s + b.actors.n, 0) === d.actorsMeasured,
    `${d.bands.reduce((s, b) => s + b.actors.n, 0)} = ${d.actorsMeasured}`);
  본다('띠 합이 K팝 수와 같나',
    d.bands.reduce((s, b) => s + b.kpop.n, 0) === d.kpopMeasured,
    `${d.bands.reduce((s, b) => s + b.kpop.n, 0)} = ${d.kpopMeasured}`);
  본다('띠가 다섯인가', d.bands.length === 5, `${d.bands.length}개`);
  본다('견줌 표본이 두껍나', d.matchedActors.n >= 100 && d.matchedKpop.n >= 100,
    `${d.matchedActors.n} · ${d.matchedKpop.n}`);

  /* ── ② 날것과 맞춘 값이 **둘 다** 있나 ── */
  자릿수아무거나('날것 배우 줄', (n) => `| Actors | ${d.actorsMeasured.toLocaleString('en-US')} | ${꼴(d.rawActors.medianPeakPc, n)}% |`);
  자릿수아무거나('날것 K팝 줄', (n) => `| K-pop acts | ${d.kpopMeasured.toLocaleString('en-US')} | ${꼴(d.rawKpop.medianPeakPc, n)}% |`);
  있나('날것 차이를 적었나', `${Math.abs(d.rawGap)}-point gap`);
  자릿수아무거나('맞춘 값', (n) => `actors sit at ${꼴(d.matchedActors.medianPeakPc, n)}% and\nK-pop acts at ${꼴(d.matchedKpop.medianPeakPc, n)}%`.replace(/\n/g, ' '));
  있나('맞춘 차이', `a gap of **${Math.abs(d.matchedGap)} points**`.replace(/\*/g, ''));
  있나('맞춘 표본 수', `across ${d.matchedActors.n} and ${d.matchedKpop.n} names`);

  /* ── ③ 다섯 띠가 다 있나 ── */
  for (const b of d.bands) {
    자릿수아무거나(`띠 — ${b.label}`,
      (n) => `| ${b.label} | ${꼴(b.actors.medianPeakPc, n)}% (n=${b.actors.n}) | ${꼴(b.kpop.medianPeakPc, n)}% (n=${b.kpop.n}) |`);
  }
  본다('크기 탓이라고 적었나',
    한줄.includes('lumpy by construction'), '작은 수는 저절로 몫이 커진다');

  /* ── ④ 안 한 말을 안 했나 ── */
  본다('두 창이 어긋난 것을 **본문에** 적었나',
    민본문.includes('three days apart'),
    `자료로는 ${d.periodOffsetDays}일 — 앞말 말고 본문에 있어야 한다`);
  본다('사람별로 안 본다고 적었나',
    한줄.includes('nothing here is reported below the group level'), '⛔ 사람 이름을 안 댄다');
  본다('맨 위 오름에 까닭을 안 붙였나',
    한줄.includes('did not measure why'), '⛔ 안 잰 것을 설명하지 않는다');
  본다('인기가 아니라고 적었나',
    한줄.includes('rather than of being liked'), '문서를 연 횟수다');
  본다('문서 없는 사람을 밝혔나',
    한줄.includes('without an English article is\nmissing entirely'.replace('\n', ' ')),
    '안 잡히는 사람이 있다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 같은 꼴 기사 — 자료와 전부 맞다');
  process.exit(틀림 ? 1 : 0);
}
