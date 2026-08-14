/**
 * 89편 — **읽는 곳과 가는 곳이 같은가.** (`/read-vs-visited`)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 86편이 화면에 `readingIsNotVisiting` 을 적어 두었다 — 「읽는 것은 가는 것이 아니다」.
 * ⛔ **말로만** 적어 두었다. 재지 않고 적은 말은 겸손이 아니라 미룸이다.
 * ⭐ 이제 잰다. 같은 서울 자치구를 **두 자**로 잰다 —
 *   위키 읽힘(동남아 네 판, 백만분율) ↔ 유료 관광지 외국인 입장객(KOSIS 2023).
 *
 * 사장님 지시: 「스타들이 가는 곳(맛집·카페·촬영지)의 정보가 필요한 지도 시장 조사를 해라」
 *   86편은 「가게를 못 본다」에서 멈췄다. 이 자료는 **구 단위로 실제 발걸음**을 본다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ **순위표로 줄세우지 않는다.** 나란히 놓고 **왜 다른지**를 같이 적는다.
 * ⛔ **「강남이 실제로는 인기 없다」로 쓰지 않는다.** 이 자는 **유료 관광지**만 센다.
 *    거리·상권이 매력인 구는 낮게 나온다 — 인기가 아니라 **자의 눈**이다.
 * ⛔ **원본의 0 을 그대로 믿지 않는다.** 송파는 입장객 770만에 외국인 0 으로 적혀 있다.
 *    그런 줄은 표를 달고 **세는 데서 뺀다.** 분모를 화면에 밝힌다.
 * ⛔ 두 자가 **다른 사람**을 센다 — 위키는 동남아 네 나라, 입장객은 모든 외국인.
 *    그리고 창이 다르다(2025-08~2026-07 ↔ 2023). 그 말을 표 바로 아래 같은 크기로 적는다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 두 줄을 맞댈 수 있나. ⛔ 하나라도 못 잰 것이면 짝이 아니다 */
export function 짝인가(위키, 방문) {
  if (!위키 || !방문) return false;
  if (위키.nameKo === null) return false;
  if (방문.foreign === null || !방문.visitors) return false;
  if (방문.foreignZeroSuspect) return false;      // 🔴 0 이라 적혔지만 못 잰 것
  return true;
}

/**
 * ⭐ 두 자를 견주는 법 — **값이 아니라 자리를 견준다.**
 *   백만분율과 사람 수는 단위가 달라 그대로 나누면 뜻이 없다.
 *   같은 무리 안에서 **몇째인가**는 견줄 수 있다.
 * ⛔ 그래도 이것은 순위표가 아니다. 자리 차이를 **왜 다른지 묻는 실마리**로만 쓴다.
 */
export function 자리매기기(줄들, 뽑기) {
  return [...줄들].sort((a, b) => 뽑기(b) - 뽑기(a))
    .map((r, i) => ({ ...r, 자리: i + 1 }));
}

/** 두 자리표를 합친다 */
export function 자리합치기(읽자리, 방문자리) {
  const 방 = new Map(읽자리.map((r) => [r.nameKo, { ...r, readRank: r.자리 }]));
  for (const v of 방문자리) {
    const 것 = 방.get(v.name);
    if (것) { 것.visitRank = v.자리; 것.visitors = v.visitors; 것.foreign = v.foreign; 것.foreignSharePc = v.foreignSharePc; }
  }
  return [...방.values()].filter((r) => r.visitRank !== undefined);
}

const 위키 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/wikidata/seoul-districts.json'), 'utf8'));
const 방문 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/kosis/visitors.json'), 'utf8'));
const 원장소 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-places.json'), 'utf8'));

const 방문방 = new Map(방문.districts.map((r) => [r.name, r]));
const 쓸것 = 위키.districts.filter((w) => 짝인가(w, 방문방.get(w.nameKo)));
const 뺀것 = 위키.districts.filter((w) => !짝인가(w, 방문방.get(w.nameKo)))
  .map((w) => {
    const v = 방문방.get(w.nameKo);
    return {
      nameEn: w.nameEn,
      nameKo: w.nameKo,
      why: !v ? 'not in the admissions table'
        : v.nothingMeasuredHere ? 'no counted tourist site in this district'
          : v.foreignZeroSuspect ? 'admissions recorded, foreign visitors recorded as zero'
            : 'no usable figure',
    };
  });

const 읽자리 = 자리매기기(쓸것, (r) => r.seaPerMillionTotal);
const 방문자리 = 자리매기기(쓸것.map((w) => 방문방.get(w.nameKo)), (r) => r.foreign);
const 합친 = 자리합치기(읽자리, 방문자리)
  .map((r) => ({ ...r, gap: r.visitRank - r.readRank }))
  .sort((a, b) => a.readRank - b.readRank);

/* ⭐ 자리가 가장 크게 어긋난 둘 — 한쪽으로 하나씩 */
const 더읽힌 = [...합친].sort((a, b) => b.gap - a.gap)[0];   // 읽힘은 위, 발걸음은 아래
const 더간 = [...합친].sort((a, b) => a.gap - b.gap)[0];     // 발걸음은 위, 읽힘은 아래
const 같은자리 = 합친.filter((r) => r.gap === 0).length;

const 나감 = {
  generated: new Date().toISOString().slice(0, 10),
  question: 'Do people read about the same parts of Seoul that foreign visitors actually walk into?',
  unit: 'Reading is reads per million reads of that Wikipedia edition. Visiting is foreign '
    + 'admissions to counted paid tourist sites.',
  readWindow: 원장소.window,
  visitYear: 방문.latestYear,
  readSource: 원장소.source,
  visitSource: 방문.sourceEn,
  districtsCompared: 합친.length,
  districtsInWiki: 위키.districts.length,
  excluded: 뺀것,
  rows: 합친.map((r) => ({
    nameEn: r.nameEn,
    nameKo: r.nameKo,
    read: r.seaPerMillionTotal,
    readRank: r.readRank,
    foreignVisitors: r.foreign,
    visitRank: r.visitRank,
    foreignSharePc: r.foreignSharePc,
    gap: r.gap,
  })),
  sameRank: 같은자리,
  mostReadLeastWalked: 더읽힌 ? { nameEn: 더읽힌.nameEn, readRank: 더읽힌.readRank, visitRank: 더읽힌.visitRank, gap: 더읽힌.gap } : null,
  mostWalkedLeastRead: 더간 ? { nameEn: 더간.nameEn, readRank: 더간.readRank, visitRank: 더간.visitRank, gap: 더간.gap } : null,
  /* ⛔ 이 지면이 **못 하는 말**. 86편의 문장을 이어 쓴다 */
  answer: null,          // 아래에서 수로 채운다
  cannotSay: [
    'These two rulers count different people. The reading is from four Southeast Asian '
      + 'Wikipedias; the admissions count every foreign visitor, from anywhere.',
    'They also cover different time. The reading is the twelve months to July 2026; the '
      + 'admissions are the calendar year 2023.',
    방문.cannotSee,
    방문.zeroIsNotZero,
  ],
  readingIsNotVisiting: 원장소.readingIsNotVisiting,
};

/**
 * 🔴 2026-08-15 — **물음을 바꿔야 했다.**
 *   「읽는 곳과 가는 곳이 같은가」를 물으려 했는데, 견줄 수 있는 구가 **24 중 5** 였다.
 *   다섯으로 그 물음에 답하면 거짓이다. 게다가 빠진 다섯에 **강남**이 들어 있다.
 *
 *   ⭐ 그런데 **왜 못 견주는지**가 물음보다 큰 답이었다:
 *     서울 스물넷 중 **열여섯 구**에 집계된 유료 관광지가 **하나도 없다** — 명동이 있는 중구,
 *     홍대가 있는 마포가 그 안이다. 세 구는 입장객은 세면서 외국인만 0 으로 적었다.
 *   ⛔ 자료를 탓하지 않는다. 그 표는 **입장권을 세려고** 만든 것이지 방문을 재려고 만든 게 아니다.
 *     자가 무엇을 재는지 적을 뿐이다.
 */
const 관광지없음 = 뺀것.filter((x) => /no counted tourist site/.test(x.why));
const 외국인0 = 뺀것.filter((x) => /recorded as zero/.test(x.why));
const 짧게 = (xs) => xs.map((x) => x.nameEn.replace(' District', '')).join(', ');

/**
 * 🔴 처음에 「including Mapo, Seocho, Gangbuk, which between them hold Myeongdong and Hongdae」
 *   라고 냈다. **명동은 중구다.** 목록 앞 셋을 그냥 잘라 쓴 탓에 틀린 문장이 됐다.
 *   ⛔ 셈은 맞고 뜻이 틀린 자리다. 이름을 대려면 **그 이름을 확인하고** 댄다.
 * ⚠ 자료에 그 구가 없으면 그 예는 아예 안 든다. 있는 것만 말한다.
 */
const 아는곳 = [{ 구: 'Jung', 곳: 'Myeongdong' }, { 구: 'Mapo', 곳: 'Hongdae' }]
  .filter((x) => 관광지없음.some((y) => y.nameEn.replace(' District', '') === x.구));
const 예 = 아는곳.length
  ? ` — among them ${아는곳.map((x) => `${x.구} (${x.곳})`).join(' and ')}`
  : '';

나감.finding = `Korea's public admissions table can speak for ${합친.length} of Seoul's `
  + `${위키.districts.length} districts. In ${관광지없음.length} of them it counts no tourist site at all${예}. `
  + `In ${외국인0.length} more it counts admissions but records foreign visitors as zero: `
  + `${짧게(외국인0)}.`;

/* ⭐ 답을 수에서 짓는다. ⛔ 먼저 문장을 쓰고 수를 맞추지 않는다 */
나감.answer = 합친.length < 8
  ? `We cannot say. We set out to put reading next to walking and found the public table can `
    + `only be asked about ${합친.length} of ${위키.districts.length} districts — too few to answer, `
    + `and Gangnam is not among them. What the gap shows is where the counting stops, not where people go.`
  : `Not closely. Of ${합친.length} districts we could measure on both, ${같은자리} sit at the same `
    + `place on the two lists.`;

나감.districtsWithNoCountedSite = 관광지없음.length;
나감.districtsWithForeignZero = 외국인0.length;
나감.tooThinToAnswer = 합친.length < 8;

const 길 = path.join(뿌리, 'src/data/wikitip-read-vs-visited.json');
fs.writeFileSync(길, `${JSON.stringify(나감, null, 2)}\n`);
console.log(`✅ ${path.relative(뿌리, 길)}`);
console.log(`   견준 구 ${합친.length}/${위키.districts.length} · 자리가 같은 구 ${같은자리}`);
console.log(`   ⚠ 뺀 구 ${뺀것.length} — ${[...new Set(뺀것.map((x) => x.why))].join(' · ')}`);
for (const r of 나감.rows.slice(0, 8)) {
  console.log(`   ${String(r.nameEn).padEnd(22)} 읽힘 ${String(r.read).padStart(6)}(${r.readRank}위)`
    + `  외국인 ${String(r.foreignVisitors).padStart(9)}(${r.visitRank}위)  차 ${r.gap > 0 ? '+' : ''}${r.gap}`);
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('한글 이름이 없으면 짝이 아니다', !짝인가({ nameKo: null }, { foreign: 1, visitors: 2 }));
  참('입장객이 없으면 짝이 아니다', !짝인가({ nameKo: '가구' }, { foreign: 1, visitors: null }));
  참('🔴 의심스러운 0 은 짝이 아니다',
    !짝인가({ nameKo: '송파구' }, { foreign: 0, visitors: 7706775, foreignZeroSuspect: true }));
  참('둘 다 있으면 짝이다', 짝인가({ nameKo: '종로구' }, { foreign: 5, visitors: 10 }));
  참('자리는 큰 것부터', 자리매기기([{ v: 1 }, { v: 9 }], (r) => r.v)[0].v === 9);
  참('자리가 1 부터 매겨진다', 자리매기기([{ v: 1 }], (r) => r.v)[0].자리 === 1);
  참('짝 없는 구는 합쳐진 표에서 빠진다',
    자리합치기([{ nameKo: 'ㄱ', 자리: 1 }], []).length === 0);
  참('견준 구가 뺀 구와 겹치지 않는다',
    !나감.rows.some((r) => 뺀것.some((x) => x.nameKo === r.nameKo)));
  참('분모를 자료에 남긴다', 나감.districtsCompared > 0 && 나감.districtsInWiki > 나감.districtsCompared);
  참('⛔ 못 하는 말을 넷 적었다', 나감.cannotSay.length === 4 && 나감.cannotSay.every((s) => s && s.length > 40));
  참('⛔ 유료 관광지라는 말이 들어 있다', 나감.cannotSay.some((s) => /paid tourist sites/.test(s)));
  참('⛔ 0 이 0 이 아니라는 말이 들어 있다', 나감.cannotSay.some((s) => /count of 0/.test(s)));
  /* 🔴 8/15 — 견줄 구가 다섯뿐인데 「같은가/다른가」로 답할 뻔했다. 얇으면 얇다고 말한다 */
  참('얇으면 답하지 않는다고 적는다', !나감.tooThinToAnswer || /cannot say/i.test(나감.answer));
  참('답의 수가 표와 맞는다', 나감.answer.includes(String(합친.length)));
  참('강남이 빠졌음을 답에 적는다', !나감.tooThinToAnswer || /Gangnam/.test(나감.answer));
  참('왜 못 견주는지를 수로 적는다',
    나감.finding.includes(String(관광지없음.length)) && 나감.finding.includes(String(외국인0.length)));
  참('빠진 구 수와 뺀 구 수가 맞는다', 관광지없음.length + 외국인0.length === 뺀것.length);
  /* 🔴 8/15 — 「Mapo, Seocho, Gangbuk 이 명동을 품는다」로 나갈 뻔했다. 명동은 중구다 */
  참('예로 든 구가 정말 그 목록에 있다',
    아는곳.every((x) => 관광지없음.some((y) => y.nameEn.replace(' District', '') === x.구)));
  참('명동을 중구 아닌 곳에 붙이지 않는다',
    !/Myeongdong/.test(나감.finding) || /Jung \(Myeongdong\)/.test(나감.finding));
  참('홍대를 마포 아닌 곳에 붙이지 않는다',
    !/Hongdae/.test(나감.finding) || /Mapo \(Hongdae\)/.test(나감.finding));
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`\n자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}
