#!/usr/bin/env node
/**
 * build-wikitip-day-pillar-checks.mjs — **문턱을 넘은 칸 하나를 죽이려고 해 본 것들.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22, 연예인 9,249명의 일간(日干) 분포가 카이제곱 **17.91** 로 나왔다.
 * 자유도 9 의 0.05 문턱이 **16.92** 다 — **넘었다.**
 *
 * ⛔ 그러면 「일간은 우연이 아니다」라고 쓰고 싶어진다. 그것이 우리가 제일 하기 싫은 짓이다.
 *   우리 셋째 자리(리스크관리)가 하는 일은 **「그것이 틀렸을 때 무엇을 잃는가」**를 먼저 묻는 것이다.
 *   그래서 발표하기 전에 **흔한 원인부터 죽인다.** 죽지 않으면 그때 말한다.
 *
 * ── 해 보는 것 셋 ─────────────────────────────────────────────
 * ① 날짜 쏠림      1월 1일·15일처럼 «행정으로 적힌 날»이 쏠려 십일 주기를 흔드나
 * ② 연대별         한 시대가 끌고 가나(옛 기록일수록 날짜가 거칠다)
 * ③ 여러 번 잰 것  우리는 네 번 쟀다(일간·일지 × 전체·상위10%). 넷 중 하나가
 *                  0.05 를 넘는 일은 우연으로도 다섯 번에 한 번쯤 생긴다
 *
 * ⛔ 이 자는 결론을 쓰지 않는다. **해 본 것과 그 수**를 자료에 남긴다. 판단은 지면과 사람이 한다.
 *
 * 쓰는 법  node scripts/build-wikitip-day-pillar-checks.mjs
 *          node scripts/build-wikitip-day-pillar-checks.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 일주 } from './lib/일주.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 자료 = path.join(뿌리, 'src/data/wikitip-star-daypillar.json');

/** 「행정으로 적힌 날」로 의심할 만한 월-일. ⚠ 우리가 고른 것이므로 지면에 그대로 밝힌다 */
export const 의심날 = ['01-01', '12-31', '01-15', '07-01', '03-01'];

export const 카이제곱 = (칸) => {
  const 값 = Object.values(칸);
  const n = 값.reduce((a, b) => a + b, 0);
  if (!n) return { n: 0, 카이제곱: null };
  const 기대 = n / 값.length;
  return { n, 카이제곱: +값.reduce((a, o) => a + (o - 기대) ** 2 / 기대, 0).toFixed(2) };
};

export const 일간세기 = (사람들) => {
  const c = {};
  for (const p of 사람들) {
    const j = 일주(p.born);
    if (j.일간한자) c[j.일간한자] = (c[j.일간한자] ?? 0) + 1;
  }
  return c;
};

/** 날마다 몇 명인가 — 쏠린 날을 찾는다 */
export const 날쏠림 = (사람들, 몇개 = 5) => {
  const 월일 = {};
  for (const p of 사람들) {
    const k = p.born.slice(5);
    월일[k] = (월일[k] ?? 0) + 1;
  }
  const 고르면 = 사람들.length / 365;
  return {
    flatWouldBe: +고르면.toFixed(2),
    busiest: Object.entries(월일).sort((a, b) => b[1] - a[1]).slice(0, 몇개)
      .map(([date, people]) => ({ date, people })),
  };
};

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 사람 = [
    { born: '1993-05-16' }, { born: '1997-09-01' }, { born: '2000-04-11' },
    { born: '1990-01-01' }, { born: '1991-01-01' },
  ];
  검('일간을 센다', Object.values(일간세기(사람)).reduce((a, b) => a + b, 0) === 5);
  검('고른 분포는 0', 카이제곱({ a: 5, b: 5 }).카이제곱 === 0);
  검('빈 것은 null 로 둔다 — 0 으로 안 쓴다', 카이제곱({}).카이제곱 === null);
  const 쏠림 = 날쏠림(사람, 2);
  검('가장 붐비는 날을 찾는다', 쏠림.busiest[0].date === '01-01' && 쏠림.busiest[0].people === 2);
  검('고르면 몇 명인지도 낸다 — 작은 표본에서도 0 으로 뭉개지 않는다', 쏠림.flatWouldBe === 0.01);
  검('의심날을 손으로 못 늘리게 밖에 둔다', Array.isArray(의심날) && 의심날.includes('01-01'));
  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ build-wikitip-day-pillar-checks 자가시험 통과 (6)');
  process.exit(0);
}

if (!fs.existsSync(원자료)) {
  console.error(`❌ 캔 명단이 없다 — ${path.relative(뿌리, 원자료)}\n   먼저 node scripts/collect-star-daypillar.mjs 를 돌린다`);
  process.exit(1);
}
const 사람들 = JSON.parse(fs.readFileSync(원자료, 'utf8')).사람;
const 의심 = new Set(의심날);
const 뺀것 = 사람들.filter((p) => !의심.has(p.born.slice(5)));

const 연대 = [[1900, 1969], [1970, 1989], [1990, 2029]].map(([부터, 까지]) => {
  const 조각 = 사람들.filter((p) => { const y = +p.born.slice(0, 4); return y >= 부터 && y <= 까지; });
  return { from: 부터, to: 까지, ...카이제곱(일간세기(조각)) };
});

const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
d.robustness = {
  whyThisSectionExists: 'One of our four tests crossed the 0.05 line. Before treating that as a finding we tried to kill it, and we publish what we tried whether or not it worked.',
  whole: 카이제곱(일간세기(사람들)),
  administrativeDatesRemoved: {
    datesRemoved: 의심날,
    peopleRemoved: 사람들.length - 뺀것.length,
    ...카이제곱(일간세기(뺀것)),
    reading: 'Dates that look administrative rather than remembered (1 January and the like) were dropped. If they were driving the result, dropping them would move it.',
  },
  byEra: 연대,
  multipleTests: {
    testsRun: 4,
    whatThatMeans: 'Day stem and day branch, each for everyone and for the most-linked tenth. With four independent tests at the 0.05 level, one crossing happens by chance roughly one time in five.',
  },
};
fs.writeFileSync(자료, JSON.stringify(d, null, 1));

console.log(`전체            n=${d.robustness.whole.n} · 카이제곱 ${d.robustness.whole.카이제곱}`);
console.log(`의심날 뺀 뒤    n=${d.robustness.administrativeDatesRemoved.n} · 카이제곱 ${d.robustness.administrativeDatesRemoved.카이제곱} (뺀 사람 ${d.robustness.administrativeDatesRemoved.peopleRemoved})`);
for (const e of 연대) console.log(`  ${e.from}~${e.to}    n=${e.n} · 카이제곱 ${e.카이제곱}`);
console.log(`\n✅ ${path.relative(뿌리, 자료)} 에 robustness 를 넣었다`);
