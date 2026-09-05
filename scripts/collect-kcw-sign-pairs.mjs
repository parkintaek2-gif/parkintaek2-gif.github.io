#!/usr/bin/env node
/**
 * collect-kcw-sign-pairs.mjs — **어느 두 별자리가 한 그룹에 «같이» 있나.**
 *
 * ── 🔴 왜 만드나 (2026-09-06, 사장님 퍼널에서 왔다) ──────────
 * 사장님이 점성학 검색어를 세 층으로 갈라 주셨다 —
 * ```
 *   대중 유입   Horoscope · Zodiac Signs · Daily Horoscope
 *   개인화     Birth Chart · Natal Chart · Rising Sign
 *   구매 의도   **Compatibility** · Astrology Reading · AI Astrology
 * ```
 * 우리 별자리 지면 열두 장(`/star-sign/*`)을 열어 보니 **compatibility 라는 낱말이 0번**이다.
 * 맨 아래층 — 돈이 붙는 층 — 을 한 글자도 안 건드리고 있었다.
 *
 * ⭐ 그런데 우리는 «궁합»을 봐 줄 수 없다. 그것은 점이고, 우리 강령이 금한다.
 *   ⛔ 「양자리와 천칭자리는 잘 맞는다」를 한 줄도 안 쓴다.
 * ⭐ 대신 **아무도 안 센 사실**을 낸다 — 「실제 케이팝 그룹에서 이 두 별자리가 몇 번
 *   한 팀이었나.」 이것은 점이 아니라 **셈**이다. 그리고 우리만 셀 수 있다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **같이 있는 것을 「잘 맞는다」로 읽지 않는다.** 기획사가 별자리를 보고 뽑지 않는다.
 *   많이 나오는 짝은 그 별자리에 사람이 많아서 나오는 것이다 — 그래서 «기대값»을 함께 낸다.
 * ⛔ **기대값 없이 실측만 내지 않는다.** 실측 41번이 많은 것인지 적은 것인지는
 *   기대값 39.4 옆에 놓아야 안다. 하나만 내면 사람이 뜻을 지어낸다.
 * ⛔ 생일을 모르는 멤버를 0 으로 세지 않는다 — 1,581명 중 별자리가 있는 1,516명만 센다.
 * ⛔ 한 사람이 두 그룹에 있으면 두 번 센다. 그것이 「한 팀이었던 횟수」의 뜻이다 —
 *   숨기지 않고 자료에 적는다.
 *
 * 쓰는 법
 *   node scripts/collect-kcw-sign-pairs.mjs --자가시험
 *   node scripts/collect-kcw-sign-pairs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-sign-pairs.json');

export const 별자리순 = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

/** 짝 이름 — 늘 같은 차례로 적는다. ⛔ (a,b) 와 (b,a) 를 두 짝으로 세면 표가 두 배로 부푼다 */
export function 짝이름(a, b) {
  return [a, b].sort().join('|');
}

/** 한 그룹 안의 «서로 다른 두 사람» 짝을 모두 만든다. ⛔ 자기 자신과는 짝을 안 짓는다 */
export function 그룹짝들(별자리들) {
  const 것 = [];
  for (let i = 0; i < 별자리들.length; i += 1) {
    for (let j = i + 1; j < 별자리들.length; j += 1) 것.push(짝이름(별자리들[i], 별자리들[j]));
  }
  return 것;
}

/**
 * 기대값 — 별자리를 «그 별자리에 사람이 얼마나 많은지»에 맞춰 무작위로 뿌렸다면 몇 번 나올까.
 * 서로 다른 두 별자리는 2·p(a)·p(b), 같은 별자리끼리는 p(a)^2 이다.
 * ⚠ 이것은 어림이다 — 한 그룹 안에서 뽑기가 서로 독립이라고 친 값이다.
 *   그 어림임을 자료에 적는다. 어림을 확정처럼 내지 않는다.
 */
export function 기대짝수(전체짝수, 비율a, 비율b, 같은가) {
  if (!Number.isFinite(전체짝수) || 전체짝수 <= 0) return null;
  const p = 같은가 ? 비율a * 비율a : 2 * 비율a * 비율b;
  return Math.round(전체짝수 * p * 10) / 10;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  같나('별자리는 열둘이다', 별자리순.length, 12);

  같나('짝 이름은 늘 같은 차례다', 짝이름('libra', 'aries'), 'aries|libra');
  같나('차례를 바꿔도 같은 이름이다', 짝이름('aries', 'libra'), 'aries|libra');
  같나('같은 별자리끼리도 짝이 된다', 짝이름('leo', 'leo'), 'leo|leo');

  같나('세 사람이면 짝이 셋이다', 그룹짝들(['aries', 'leo', 'virgo']).length, 3);
  같나('⛔ 자기 자신과는 안 짓는다', 그룹짝들(['aries']).length, 0);
  같나('빈 그룹은 짝이 없다', 그룹짝들([]).length, 0);
  같나('일곱 사람이면 21짝', 그룹짝들(별자리순.slice(0, 7)).length, 21);
  /* 🔴 같은 별자리가 둘이면 그 짝도 «한 번» 세어야 한다 — 빼면 「겹친 별자리」가 사라진다 */
  같나('같은 별자리 둘도 한 짝이다', 그룹짝들(['leo', 'leo']), ['leo|leo']);
  같나('세 사람 중 둘이 같으면 짝 셋 중 하나가 같은 별자리다',
    그룹짝들(['leo', 'leo', 'aries']).filter((x) => x === 'leo|leo').length, 1);

  /* 🔴 기대값이 없으면 실측이 많은지 적은지 알 수 없다 */
  같나('서로 다른 별자리는 2pq 다', 기대짝수(1000, 0.1, 0.1, false), 20);
  같나('같은 별자리는 p제곱이다', 기대짝수(1000, 0.1, 0.1, true), 10);
  같나('⛔ 짝이 없으면 0 이 아니라 null', 기대짝수(0, 0.1, 0.1, false), null);
  같나('⛔ 짝수가 수가 아니면 null', 기대짝수(null, 0.1, 0.1, false), null);
  같나('고르게 퍼진 열둘이면 서로 다른 짝은 1/72 이다',
    기대짝수(7200, 1 / 12, 1 / 12, false), 100);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 별자리 짝 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 잰다 ─────────────────────────────────────────────── */
if (내가실행됐다) {
  const 그룹자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-groups.json'), 'utf8'));
  const 그룹들 = 그룹자료.rows ?? 그룹자료.groups ?? 그룹자료;

  const 짝수 = new Map();
  const 별자리수 = new Map(별자리순.map((s) => [s, 0]));
  let 센그룹 = 0; let 센사람 = 0; let 별자리없는사람 = 0; let 전체짝수 = 0;
  const 짝의그룹 = new Map();

  for (const g of 그룹들) {
    const 멤버 = g.members ?? [];
    const 사인 = [];
    for (const m of 멤버) {
      const s = m.sign?.slug ?? null;
      if (!s || !별자리순.includes(s)) { 별자리없는사람 += 1; continue; }
      사인.push(s);
      별자리수.set(s, 별자리수.get(s) + 1);
    }
    if (사인.length < 2) continue;      /* 짝이 안 생기는 그룹은 짝 세기에서 빠진다 */
    센그룹 += 1; 센사람 += 사인.length;
    for (const 짝 of 그룹짝들(사인)) {
      짝수.set(짝, (짝수.get(짝) ?? 0) + 1);
      전체짝수 += 1;
      /**
       * 🔴 [2026-09-06] 렌더해서 눈으로 보니 예시 칸이 「NCT, NCT, NCT」로 나왔다.
       *   NCT 는 하위 유닛이 여럿이라 «같은 이름»이 여러 그룹으로 들어 있고, 사람도 많아
       *   거의 모든 짝에 세 번씩 들어찼다. 보는 사람에게는 고장 난 표로 보인다.
       * ⛔ 같은 이름을 두 번 안 싣는다. 「예시」는 여럿을 보여 주려고 있는 칸이다.
       */
      if (!짝의그룹.has(짝)) 짝의그룹.set(짝, []);
      const 이름 = g.name ?? g.slug;
      const 담긴것 = 짝의그룹.get(짝);
      if (담긴것.length < 6 && !담긴것.includes(이름)) 담긴것.push(이름);
    }
  }

  const 사람합 = [...별자리수.values()].reduce((a, b) => a + b, 0);
  const 비율 = new Map([...별자리수].map(([s, n]) => [s, 사람합 ? n / 사람합 : 0]));

  const 줄 = [];
  for (let i = 0; i < 별자리순.length; i += 1) {
    for (let j = i; j < 별자리순.length; j += 1) {
      const a = 별자리순[i]; const b = 별자리순[j];
      const 이름 = 짝이름(a, b);
      const 실측 = 짝수.get(이름) ?? 0;
      const 기대 = 기대짝수(전체짝수, 비율.get(a), 비율.get(b), a === b);
      줄.push({
        pair: 이름, a, b, same: a === b, observed: 실측, expected: 기대,
        ratio: 기대 ? Math.round((실측 / 기대) * 100) / 100 : null,
        groups: 짝의그룹.get(이름) ?? [],
      });
    }
  }
  줄.sort((x, y) => y.observed - x.observed);

  const 낼것 = {
    measuredAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    groupsCounted: 센그룹,
    peopleCounted: 센사람,
    peopleWithoutSign: 별자리없는사람,
    totalPairs: 전체짝수,
    signCounts: Object.fromEntries(별자리수),
    whatThisIs: 'How often each pair of star signs actually appears together in the same K-pop group, '
      + 'counted from recorded member birth dates, set beside how often chance alone would put them together.',
    notMeasured: [
      'Whether two signs get along. We do not read star signs and make no claim about compatibility. This is a count of who was in a band with whom',
      'Why a pair is common. Agencies do not pick members by birthday; a pair is common mostly because those signs are common',
      'Members whose birth date is not on record. They are left out of the count rather than filled in',
    ],
    caveats: [
      'A person in two groups is counted in both. That is what "times they were in a band together" means',
      'The expected column assumes each seat in a group is filled independently, which is an approximation, not a model of how groups are formed',
    ],
    rows: 줄,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n', 'utf8');

  console.log(`그룹 ${센그룹}개 · 사람 ${센사람}명 · 짝 ${전체짝수}개 (별자리 모르는 사람 ${별자리없는사람}명은 뺐다)`);
  console.log('\n가장 많이 한 팀이었던 짝 8개 — 실측 / 기대 / 배수');
  for (const r of 줄.slice(0, 8)) {
    console.log(`   ${r.pair.padEnd(24)} ${String(r.observed).padStart(4)} / ${String(r.expected).padStart(6)} = ${r.ratio}`);
  }
  const 벗어난것 = [...줄].filter((r) => r.expected >= 20).sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
  console.log('\n기대보다 많이 나온 짝 5개 (기대 20 이상인 것만)');
  for (const r of 벗어난것.slice(0, 5)) {
    console.log(`   ${r.pair.padEnd(24)} ${String(r.observed).padStart(4)} / ${String(r.expected).padStart(6)} = ${r.ratio}`);
  }
  console.log('\n기대보다 적게 나온 짝 5개');
  for (const r of 벗어난것.slice(-5).reverse()) {
    console.log(`   ${r.pair.padEnd(24)} ${String(r.observed).padStart(4)} / ${String(r.expected).padStart(6)} = ${r.ratio}`);
  }
  console.log(`\n📁 적었다 — ${path.relative(뿌리, 낼곳)}`);
}
