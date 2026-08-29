#!/usr/bin/env node
/**
 * build-kcw-is-it-korean.mjs — **「what country made this?」에 답하는 자리.** (`/is-it-korean`)
 *
 * ── 왜 (2026-08-29) ───────────────────────────────────────────
 * 🔴 **잰 수요** — Search Console 실측에 제작국을 묻는 질의가 있다.
 * ```
 *   what country made solo leveling   1회 22위
 *   what country is solo leveling in  1회 36위
 * ```
 * 노출은 작지만 **자리가 22·36위**다 — 아무도 답을 안 하고 있고 우리도 안 하고 있다.
 * ⚠ `/netflix-which-country` 는 「어느 나라 «넷플릭스에»」를 묻는 다른 물음이라 여기서 뺐다.
 *
 * ── ⭐ 그런데 이 지면의 «진짜» 값어치는 따로 있다 ─────────────
 * 우리 도구는 974편마다 「이름만으로 한국 작품이라 가릴 수 있나」를 이미 재 두었다.
 * ```
 *   koreaOnly         525편  이름을 가진 작품이 한국 것뿐 — 헷갈릴 수 없다
 *   shared            423편  같은 영어 이름을 «다른 나라 작품»도 쓴다
 *   unknown            15편
 *   koreaUnconfirmed   11편  🔴 Wikidata 에 한국이 «아예 없다»
 * ```
 * 🔴 **그 판정이 지금까지 어느 지면에도 안 실렸다.** 손님은 974편이 다 한국 것인 줄 안다.
 * ⭐ 이 지면은 **우리 수가 틀렸을 수 있는 자리를 우리 손으로 내놓는다.**
 *   「재 보고 안 된다고 적는 것도 결과다」 — 이것이 그 문장을 지면으로 만든 것이다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 「shared」를 「틀렸다」로 쓰지 않는다. **못 가른다**는 뜻이다 — 다른 말이다.
 * ⛔ 못 가른 작품을 표에서 «몰래 빼지» 않는다. 이름을 적고 왜인지 적는다.
 * ⛔ Wikidata 의 country of origin 을 「제작국」이라고 단정하지 않는다 —
 *   공동제작·원작 권리사까지 들어가는 칸이다. 그대로 옮기고 그렇게 적는다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-is-it-korean.mjs --자가시험
 *   node scripts/build-kcw-is-it-korean.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 모호길 = path.join(뿌리, 'src/data/wikitip-title-ambiguity.json');
const 지면길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-is-it-korean.json');

/** 이 판정이 「한국이 확실한가」 */
export function 확실한가(판정) {
  return 판정 === 'koreaOnly';
}

/**
 * Wikidata 나라 줄에 한국이 들어 있나.
 * ⛔ 없다고 「한국 작품이 아니다」로 단정하지 않는다 — 「Wikidata 에 없다」일 뿐이다.
 */
export function 한국이있나(나라들) {
  return (나라들 ?? []).some((c) => String(c) === 'South Korea' || String(c) === 'North Korea');
}

/**
 * 얼마나 헷갈리는가 — 한국 말고 몇 나라가 같은 이름을 쓰나.
 * ⛔ 못 잰 것은 0 이 아니라 null
 */
export function 겹친나라수(나라들) {
  if (!Array.isArray(나라들) || !나라들.length) return null;
  return 나라들.filter((c) => String(c) !== 'South Korea' && String(c) !== 'North Korea').length;
}

/** 자리 수로 줄 세우고 자른다. ⛔ 못 잰 것은 빼고 센다 */
export function 줄세우기(다, n) {
  return (다 ?? [])
    .filter((x) => Number.isFinite(x.places))
    .sort((a, b) => b.places - a.places || String(a.title).localeCompare(String(b.title)))
    .slice(0, n);
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('koreaOnly 만 확실하다', 확실한가('koreaOnly') === true);
  검('⛔ shared 는 확실하지 않다', 확실한가('shared') === false);
  검('⛔ 빈 것도 안 터진다', 확실한가(undefined) === false);

  검('한국이 있으면 있다고 한다', 한국이있나(['South Korea', 'United States']) === true);
  검('북한도 센다', 한국이있나(['North Korea']) === true);
  검('없으면 없다고 한다', 한국이있나(['France', 'Spain']) === false);
  검('⛔ 빈 것도 안 터진다', 한국이있나(undefined) === false && 한국이있나([]) === false);

  검('겹친 나라를 센다', 겹친나라수(['South Korea', 'Japan', 'Taiwan']) === 2);
  검('한국뿐이면 0', 겹친나라수(['South Korea']) === 0);
  검('⛔ 못 잰 것은 null 이지 0 이 아니다', 겹친나라수(undefined) === null && 겹친나라수([]) === null);

  const 다 = [{ title: 'a', places: 5 }, { title: 'b', places: 9 }, { title: 'c', places: null }];
  const 줄 = 줄세우기(다, 5);
  검('자리 수로 세운다', 줄[0].title === 'b');
  검('⛔ 못 잰 것을 꼴찌로 놓지 않고 뺀다', 줄.length === 2);
  검('길이를 자른다', 줄세우기(다, 1).length === 1);
  검('⛔ 빈 것도 안 터진다', 줄세우기(undefined, 3).length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-is-it-korean 자가시험 통과 (14)');
  process.exit(0);
}

/* ── 짓는다 ───────────────────────────────────────────────── */
const 모호 = JSON.parse(fs.readFileSync(모호길, 'utf8'));
const 지면 = JSON.parse(fs.readFileSync(지면길, 'utf8'));
const 판정들 = 모호.perTitle ?? [];
if (판정들.length < 100) {
  console.error(`🔴 못 짓는다 — 판정이 ${판정들.length}편뿐이다.`);
  process.exit(1);
}

/* 자리 수와 지면 여부를 붙인다 */
const 지면표 = new Map((지면.titles ?? []).map((t) => [t.title, t]));
const 다 = 판정들.map((x) => {
  const t = 지면표.get(x.title);
  return {
    title: x.title,
    slug: t?.slug ?? null,
    hasPage: !!t?.hasPage,
    type: t?.type ?? null,
    places: Number.isFinite(x.places) ? x.places : (t?.places ?? null),
    markets: t?.markets ?? null,
    verdict: x.verdict,
    countries: x.countries ?? [],
    otherCountries: 겹친나라수(x.countries),
    koreaListed: 한국이있나(x.countries),
  };
});

const 셈 = {};
for (const x of 다) 셈[x.verdict] = (셈[x.verdict] ?? 0) + 1;

/* 🔴 한국이 Wikidata 에 «아예 없는» 것 — 우리 수가 틀렸을 수 있는 자리다 */
const 한국없음 = 줄세우기(다.filter((x) => !x.koreaListed && (x.countries ?? []).length > 0), 15);

/* 같은 이름을 여러 나라가 쓰는 것 중 자리 수가 큰 것 */
const 겹침큰것 = 줄세우기(다.filter((x) => x.verdict === 'shared'), 20);

/* 나라 이름별로 몇 편이나 겹치나 — 어느 나라와 가장 자주 이름이 겹치나 */
const 나라셈 = new Map();
for (const x of 다) {
  if (x.verdict !== 'shared') continue;
  for (const c of x.countries ?? []) {
    if (c === 'South Korea' || c === 'North Korea') continue;
    나라셈.set(c, (나라셈.get(c) ?? 0) + 1);
  }
}
const 겹치는나라 = [...나라셈.entries()]
  .map(([country, titles]) => ({ country, titles }))
  .sort((a, b) => b.titles - a.titles || a.country.localeCompare(b.country))
  .slice(0, 12);

const 낼것 = {
  generated: new Date().toISOString().slice(0, 10),
  method: 모호.method,
  titleCount: 다.length,
  counts: {
    koreaOnly: 셈.koreaOnly ?? 0,
    shared: 셈.shared ?? 0,
    unknown: 셈.unknown ?? 0,
    koreaUnconfirmed: 셈.koreaUnconfirmed ?? 0,
  },
  weekFrom: 지면.weekFrom,
  weekTo: 지면.weekTo,
  marketCount: 지면.marketCount,
  notKoreaListed: 한국없음,
  notKoreaListedTotal: 다.filter((x) => !x.koreaListed && (x.countries ?? []).length > 0).length,
  sharedBiggest: 겹침큰것,
  overlapCountries: 겹치는나라,
  unlabelled: (모호.keyedNotLabelled ?? []).slice(0, 12),

  cannotAnswer: [
    'Which work actually charted, when two countries have a film or series with exactly the same '
      + 'English name. Netflix publishes a name and a rank, and nothing else — no year, no '
      + 'director, no country. That is the whole reason this page exists.',
    'What a title\'s country of production formally is. Wikidata\'s country of origin field takes '
      + 'co-producers and rights holders as well as the country a work was made in, so a name '
      + 'listed there is not a production credit.',
    'Anything about titles Wikidata has no entry for. Those are counted as unmeasured here, never '
      + 'as foreign and never as Korean.',
  ],
};

fs.writeFileSync(낼길, `${JSON.stringify(낼것, null, 2)}\n`);

console.log('■ /is-it-korean 자료를 지었다');
console.log(`   작품 ${낼것.titleCount}편`);
console.log(`   ✅ 한국뿐 ${낼것.counts.koreaOnly} · ⚠ 이름 겹침 ${낼것.counts.shared}`
  + ` · ⬜ 모름 ${낼것.counts.unknown} · 🔴 한국 미확인 ${낼것.counts.koreaUnconfirmed}`);
console.log(`   🔴 Wikidata 에 한국이 아예 없는 것 ${낼것.notKoreaListedTotal}편 — 큰 것부터:`);
for (const x of 한국없음.slice(0, 6)) {
  console.log(`      ${String(x.places).padStart(4)}자리  ${x.title}  |  ${x.countries.join(', ')}`);
}
console.log('   ⛔ 「겹친다」를 「틀렸다」로 쓰지 않는다 — 못 가른다는 뜻이다');
console.log(`\n✔ ${path.relative(뿌리, 낼길)}`);
